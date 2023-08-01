import { Command } from 'commander'
import path from 'node:path'
import fs from 'node:fs'
import { asserts, getRelativePath, initializeRootDirectory, isExternalModule } from './lib/helpers.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'
import { CallExpression, Identifier, Node, SyntaxKind, VariableDeclaration } from 'ts-morph'

const program = new Command();

program.name('extract-fixture-from-specs')
  .description('Extract the fixtures used by the specs')
  .version('0.0.1');

program.argument('<input source file> | <input json file>');
program.parse();

const sourceFiles = path.extname(program.args[0]) === '.json'
  ? JSON.parse(fs.readFileSync(program.args[0], 'utf-8'))
  : program.args

initializeRootDirectory(sourceFiles[ 0 ]);

let idGen = 0

console.log(
`
---- graphviz nodes ----
${ await extractFixtureFromSpecs() }
---- graphviz nodes ----
`  
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
  fixture: string
}

async function extractFixtureFromSpecs() {
  const graphNodes: GraphNode[] = [];
  const graphLinks: LinkNode[] = [];

  for await (const { filename, sourceFile } of walkModuleDependencyImports(sourceFiles, { walkThroughImports: false, yieldSourceFileOnlyOnce: true })) {
    console.debug(`Processing ${filename}...`)

    const moduleName = filename.replace(/^.+\/modules\/(.+?)\/.+$/, '$1')
    if (graphNodes.find(n => n.name === moduleName && n.type === 'spec')) {
      continue
    }

    const graphNode = {
      id: generateNodeId(moduleName),
      name: moduleName,
      type: 'spec' as const
    }

    graphNodes.push(graphNode)

    const testCall = sourceFile.getFirstDescendant<CallExpression>(
      (node): node is CallExpression => 
        {
          if (Node.isCallExpression(node)) { 
            const callee = node.getExpression();
            if (Node.isIdentifier(callee) && callee.getText() === 'test') {
              return true
            }
          }

          return false
        }
      )

    asserts(testCall !== undefined, `Could not find a call to test in ${filename}`)

    const testIndentifier = getCallExpressionIdentifier(testCall)

    ;(function walker(testIndentifier: Identifier, targetNode: GraphNode) {
      const { testDefinition, graphNode } = addFixtureNode(graphNodes, testIndentifier, targetNode)

      if (graphNode === null || graphLinks.some(link => link.source === graphNode.id && link.target === targetNode.id)) {
        return
      }
  
      // extract the declared fixtures
      const objectLiteralExpression = testDefinition.getFirstDescendantByKind(SyntaxKind.ObjectLiteralExpression)
      asserts(objectLiteralExpression !== undefined, `Could not find an object literal expression in ${ testDefinition.getSourceFile().getFilePath() }`)

      for (const fixtureProperty of objectLiteralExpression.getProperties()) {
        asserts(Node.isPropertyAssignment(fixtureProperty), `Expected fixture to be a PropertyAssignment, but was ${ fixtureProperty.getKindName() }`)

        const fixtureName = fixtureProperty.getName()
        const fixtureValue = fixtureProperty.getInitializer()

        asserts(fixtureValue !== undefined, `Fixture ${ fixtureName } has no initializer`)

        // fixture declared in the same file
        if (Node.isArrowFunction(fixtureValue) || Node.isArrayLiteralExpression(fixtureValue)) {
          graphLinks.push({
            source: graphNode.id,
            target: targetNode.id,
            fixture: fixtureName,
          })

          continue
        }

        // fixture declared in another file
        asserts(Node.isIdentifier(fixtureValue), `Expected fixture to be an Identifier, but was ${ fixtureValue.getKindName() }`)
        const { graphNode: sourceNode } = addFixtureNode(graphNodes, fixtureValue, targetNode)

        if (sourceNode !== null && !graphLinks.some(link => link.source === sourceNode.id && link.target === graphNode.id)) {
          graphLinks.push({
            source: sourceNode.id,
            target: sourceNode.id === graphNode.id ? targetNode.id : graphNode.id,
            fixture: fixtureName,
          })
        }
      }
      
      // walk to the base fixture
      const testDefinitionInitializer = testDefinition.getInitializer()
      asserts(Node.isCallExpression(testDefinitionInitializer), `Expected initializer to be a CallExpression, but was ${ testDefinitionInitializer?.getKindName() }`)

      asserts(Node.isCallExpression(testDefinitionInitializer), `Expected initializer to be a CallExpression, but was ${ testDefinitionInitializer?.getKindName() }`)

      const extendExpression = testDefinitionInitializer.getExpression()
      asserts(Node.isPropertyAccessExpression(extendExpression), `Expected expression to be a PropertyAccessExpression, but was ${ extendExpression?.getKindName() }`)
      asserts(extendExpression.getName() === 'extend', `Expected expression to be 'extend', but was ${ extendExpression.getName() }`)

      const baseIdentifier = extendExpression.getFirstChild()
      asserts(Node.isIdentifier(baseIdentifier), `Expected base expression to be an Identifier, but was ${ baseIdentifier?.getKindName() }`)

      const baseFixtureName = baseIdentifier.getText()
      console.debug('Found base fixture:', baseFixtureName, 'in', getRelativePath(baseIdentifier.getSourceFile().getFilePath()))

      walker(baseIdentifier, graphNode)
    })(testIndentifier, graphNode)
  }

  const modules = graphNodes.filter(node => node.type === 'spec')
                            .map(node => `${ node.id } [label="${ node.name }"];`)

  const fixtures = graphNodes.filter(node => node.type === 'fixture')
                           .map(node => `${ node.id } [label="${ node.name }"];`
  )

  fixtures.push(...graphLinks.map(
    link => `${ link.source }:${ link.fixture } -> ${ link.target } [label="${ link.fixture }"];`
  ))

  return `
digraph FixtureHierarchy {
    bgcolor=transparent;
    fontname=Arial;
    node [shape=box, style=rounded, fontsize=12];
    edge [fontsize=10];

    subgraph modules {
      rank=same;
      node [shape=component, style=bold]
      ${ modules.join('\n      ') }
    }

    ${ fixtures.join('\n    ') }
}  
  `
}

function getFixtureDefinition(testIndentifier: Identifier) {
  const defs = testIndentifier.getDefinitionNodes()
  asserts(defs.length === 1, `More than one definition found for parameter of '${'test'}'`)

  const testDefinition = defs[0]
  asserts(Node.isVariableDeclaration(testDefinition), `Expected definition to be a VariableDeclaration, but was ${testDefinition?.getKindName()}`)

  const desclarationFilename = testDefinition.getSourceFile().getFilePath()
  
  if (isExternalModule(desclarationFilename)) {
    return { declarationModuleName: null, testDefinition }
  }
  
  const declarationModuleName = desclarationFilename.replace(/^.+\/(.+?)\.fixture\.ts$/, '$1')
  return { declarationModuleName, testDefinition }
}

function addFixtureNode(graphNodes: GraphNode[], testIndentifier: Identifier, targetNode: GraphNode): { testDefinition: VariableDeclaration, graphNode: GraphNode | null, grapheNodeExisted: boolean } {
  const { declarationModuleName, testDefinition } = getFixtureDefinition(testIndentifier)

  if (declarationModuleName === null) {
    return { testDefinition, graphNode: null, grapheNodeExisted: false }
  }

  let graphNode = graphNodes.find(n => n.name === declarationModuleName && n.type === 'fixture')

  if (graphNode !== undefined) {
    return { testDefinition, graphNode, grapheNodeExisted: true }
  }

  graphNode = {
    id: generateNodeId(declarationModuleName),
    name: declarationModuleName,
    type: 'fixture' as const
  }

  graphNodes.push(graphNode)

  return { testDefinition, graphNode, grapheNodeExisted: false }
}

function getCallExpressionIdentifier(callExpression: CallExpression) {
  const expression = callExpression.getExpression()
  asserts(Node.isIdentifier(expression), `Expected an identifier expression, but got ${expression.getText()}, of kind ${expression.getKindName()}`)
  return expression
}

function generateNodeId(name: string) {
  return `${ name.replace(/-/g, '_') }_${ idGen++}`
}
