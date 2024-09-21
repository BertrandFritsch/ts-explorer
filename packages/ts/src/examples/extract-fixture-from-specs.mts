import { Command } from 'commander'
import path from 'node:path'
import fs from 'node:fs'
import {
  asserts,
  getRelativePath,
  initializeRootDirectory,
  isExternalModule,
  walkModuleDependencyImports,
} from '@bertrand.fritsch/ts-lib'
import { CallExpression, Identifier, Node, SyntaxKind, VariableDeclaration } from 'ts-morph'

const program = new Command()

program
  .name('extract-fixture-from-specs')
  .description('Extract the fixtures used by the specs')
  .version('0.0.1')

program
  .option('-a, --auto', 'add auto fixtures', false)
  .argument('<input source file> | <input json file>')
program.parse()

const addAutoFixtures = program.opts().auto

const sourceFiles =
  path.extname(program.args[0]) === '.json'
    ? JSON.parse(fs.readFileSync(program.args[0], 'utf-8'))
    : program.args

initializeRootDirectory(sourceFiles[0])

console.log(
  `
---- graphviz nodes ----
${await extractFixtureFromSpecs()}
---- graphviz nodes ----
`,
)

type moduleNode = {
  id: string
  name: string
  type: 'spec'
}

type fixtureNode = {
  id: string
  name: string
  type: 'fixture'
}

type GraphNode = moduleNode | fixtureNode

type LinkNode = {
  source: string
  target: string
  fixture?: string
}

async function extractFixtureFromSpecs() {
  const graphNodes: GraphNode[] = []
  const graphLinks: LinkNode[] = []

  for await (const { filename, sourceFile } of walkModuleDependencyImports(sourceFiles, {
    walkThroughImports: false,
    yieldSourceFileOnlyOnce: true,
  })) {
    console.debug(`Processing ${filename}...`)

    const moduleName = filename.replace(/^.+\/modules\/(.+?)\/.+$/, '$1')
    if (graphNodes.find(n => n.name === moduleName && n.type === 'spec')) {
      continue
    }

    const graphNode = {
      id: generateNodeId(moduleName, 'mn'),
      name: moduleName,
      type: 'spec' as const,
    }

    graphNodes.push(graphNode)

    const testCall = sourceFile.getFirstDescendant<CallExpression>(
      (node): node is CallExpression => {
        if (Node.isCallExpression(node)) {
          const callee = node.getExpression()
          if (Node.isIdentifier(callee) && callee.getText() === 'test') {
            return true
          }
        }

        return false
      },
    )

    asserts(testCall !== undefined, `Could not find a call to test in ${filename}`)

    const testIdentifier = getCallExpressionIdentifier(testCall)

    ;(function walker(testIdentifier: Identifier, sourceNode: GraphNode) {
      const { testDefinition, graphNode } = addFixtureNode(graphNodes, testIdentifier)

      if (
        graphNode === null ||
        graphLinks.some(link => link.target === graphNode.id && link.source === sourceNode.id)
      ) {
        return
      }

      // extract the declared fixtures
      const objectLiteralExpression = testDefinition.getFirstDescendantByKind(
        SyntaxKind.ObjectLiteralExpression,
      )
      if (objectLiteralExpression !== undefined) {
        for (const fixtureProperty of objectLiteralExpression.getProperties()) {
          asserts(
            Node.isPropertyAssignment(fixtureProperty),
            `Expected fixture to be a PropertyAssignment, but was ${fixtureProperty.getKindName()}`,
          )

          const fixtureName = fixtureProperty.getName()
          const fixtureValue = fixtureProperty.getInitializer()

          asserts(fixtureValue !== undefined, `Fixture ${fixtureName} has no initializer`)

          // fixture declared in the same file
          if (Node.isArrowFunction(fixtureValue) || Node.isArrayLiteralExpression(fixtureValue)) {
            if (!addAutoFixtures && !Node.isArrayLiteralExpression(fixtureValue)) {
              graphLinks.push({
                source: sourceNode.id,
                target: graphNode.id,
                fixture: fixtureName,
              })
            }

            continue
          }

          // fixture declared in another file
          asserts(
            Node.isIdentifier(fixtureValue),
            `Expected fixture to be an Identifier, but was ${fixtureValue.getKindName()}`,
          )
          const { graphNode: targetNode } = addFixtureNode(graphNodes, fixtureValue)

          if (
            targetNode !== null &&
            !graphLinks.some(link => link.source === graphNode.id && link.target === targetNode.id)
          ) {
            graphLinks.push({
              source: targetNode.id === graphNode.id ? sourceNode.id : graphNode.id,
              target: targetNode.id,
              fixture: fixtureName,
            })
          }
        }

        if (
          graphNode.id !== sourceNode.id &&
          !graphLinks.some(link => link.source === sourceNode.id && link.target === graphNode.id)
        ) {
          // no fixture declared in the same file, so we need to add a link to the base fixture
          graphLinks.push({
            source: sourceNode.id,
            target: graphNode.id,
          })
        }

        // walk to the base fixture
        const testDefinitionInitializer = testDefinition.getInitializer()
        asserts(
          Node.isCallExpression(testDefinitionInitializer),
          `Expected initializer to be a CallExpression, but was ${testDefinitionInitializer?.getKindName()}`,
        )

        const extendExpression = testDefinitionInitializer.getExpression()
        asserts(
          Node.isPropertyAccessExpression(extendExpression),
          `Expected expression to be a PropertyAccessExpression, but was ${extendExpression?.getKindName()}`,
        )
        asserts(
          extendExpression.getName() === 'extend',
          `Expected expression to be 'extend', but was ${extendExpression.getName()}`,
        )

        const baseIdentifier = extendExpression.getFirstChild()
        asserts(
          Node.isIdentifier(baseIdentifier),
          `Expected base expression to be an Identifier, but was ${baseIdentifier?.getKindName()}`,
        )

        const baseFixtureName = baseIdentifier.getText()
        console.debug(
          'Found base fixture:',
          baseFixtureName,
          'in',
          getRelativePath(baseIdentifier.getSourceFile().getFilePath()),
        )

        walker(baseIdentifier, graphNode)
      } else {
        // merged tests
        const callExpression = testDefinition.getFirstDescendantByKind(SyntaxKind.CallExpression)
        asserts(
          callExpression !== undefined,
          `Expected test definition to have a CallExpression, but was ${testDefinition.getKindName()}`,
        )

        const callee = callExpression.getExpression()
        asserts(
          Node.isIdentifier(callee) && callee.getText() === 'mergeTests',
          `Expected test definition to be a call to 'mergeTests', but was ${callee?.getText()}`,
        )

        for (const test of callExpression.getArguments()) {
          asserts(
            Node.isIdentifier(test),
            `Expected argument to be an Identifier, but was ${test.getKindName()}`,
          )

          walker(test, graphNode)
        }
      }
    })(testIdentifier, graphNode)
  }

  const modules = graphNodes
    .filter(node => node.type === 'spec')
    .map(node => `${node.id} [label="${node.name}"];`)

  const fixtures = graphNodes
    .filter(node => node.type === 'fixture')
    .map(node => `${node.id} [label="${node.name}"];`)

  fixtures.push('')

  fixtures.push(
    ...graphLinks.map(link => {
      const fixtureLabel = link.fixture === undefined ? '' : ` [label="${link.fixture}"]`
      const fixtureSuffix = link.fixture === undefined ? '' : `:${link.fixture}`
      return `${link.source}${fixtureSuffix} -> ${link.target}${fixtureLabel};`
    }),
  )

  return `
digraph FixtureHierarchy {
    bgcolor=transparent;
    fontname=Arial;
    rankdir=BT;
    node [shape=box, style=rounded, fontsize=12];
    edge [fontsize=10];

    subgraph modules {
      rank=same;
      node [shape=component, style=bold]
      ${modules.join('\n      ')}
    }

    ${fixtures.join('\n    ')}
}  
  `
}

function getFixtureDefinition(testIdentifier: Identifier) {
  const defs = testIdentifier.getDefinitionNodes()
  asserts(defs.length === 1, `More than one definition found for parameter of 'test'`)

  const testDefinition = defs[0]
  asserts(
    Node.isVariableDeclaration(testDefinition),
    `Expected definition to be a VariableDeclaration, but was ${testDefinition?.getKindName()}`,
  )

  const declarationFilename = testDefinition.getSourceFile().getFilePath()

  if (isExternalModule(declarationFilename)) {
    return { declarationModuleName: null, testDefinition }
  }

  const declarationModuleName = declarationFilename.replace(/^.+\/(.+?)\.fixture\.ts$/, '$1')
  return { declarationModuleName, testDefinition }
}

function addFixtureNode(
  graphNodes: GraphNode[],
  testIdentifier: Identifier,
): { testDefinition: VariableDeclaration; graphNode: GraphNode | null; graphNodeExisted: boolean } {
  const { declarationModuleName, testDefinition } = getFixtureDefinition(testIdentifier)

  if (declarationModuleName === null) {
    return { testDefinition, graphNode: null, graphNodeExisted: false }
  }

  let graphNode = graphNodes.find(n => n.name === declarationModuleName && n.type === 'fixture')

  if (graphNode !== undefined) {
    return { testDefinition, graphNode, graphNodeExisted: true }
  }

  graphNode = {
    id: generateNodeId(declarationModuleName, 'fn'),
    name: declarationModuleName,
    type: 'fixture' as const,
  }

  graphNodes.push(graphNode)

  return { testDefinition, graphNode, graphNodeExisted: false }
}

function getCallExpressionIdentifier(callExpression: CallExpression) {
  const expression = callExpression.getExpression()
  asserts(
    Node.isIdentifier(expression),
    `Expected an identifier expression, but got ${expression.getText()}, of kind ${expression.getKindName()}`,
  )
  return expression
}

function generateNodeId(name: string, type: 'mn' | 'fn') {
  return `${type}_${name.replace(/-/g, '_')}`
}
