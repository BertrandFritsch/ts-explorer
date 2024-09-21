import {
  asserts,
  getRelativePath,
  initializeRootDirectory,
  NNU,
  walkModuleDependencyImports,
} from '@bertrand.fritsch/ts-explorer-lib'
import { CallExpression, Identifier, Node, SyntaxKind, ts } from 'ts-morph'
import { Command, Option } from 'commander'

interface Item {
  moduleSpecifier: string
  namedImport: string
  isExternal: boolean
}

interface QueryItem {
  queryCaller: string
  filename: string
  namedImport: string
  queryLocation: string
}

const program = new Command()

program
  .name('get-imported-graphql-queries')
  .description('List the imported GraphQL queries')
  .version('0.0.1')

program.argument('<input source file>')
program.addOption(
  new Option(
    '-i, --item <item...>',
    'the items to look for: <module> #(default | <item>)',
  ).makeOptionMandatory(),
)
program.addOption(new Option('-g, --ignore-files <file...>', 'the list of files to ignore'))
program.parse()

initializeRootDirectory(program.args[0])

console.log(JSON.stringify(await getModuleDependencies(), null, 2))

async function getModuleDependencies() {
  const items = program.opts<Record<string, string[]>>().item.map(item => parseModuleItem(item))
  const ignoredFiles = program.opts<Record<string, string[] | undefined>>().ignoreFiles ?? []
  const queries: QueryItem[] = []

  for await (const { filename, sourceFile, declarations } of walkModuleDependencyImports(
    [program.args[0]],
    { skipAddingFilesFromTsConfig: false },
  )) {
    if (
      !ignoredFiles.includes(filename) &&
      !items.some(item => !item.isExternal && item.moduleSpecifier === filename)
    ) {
      // consider items as endpoints -- don't look up for GraphQL calls inside them
      for (const item of items) {
        if (
          (item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) ===
            item.moduleSpecifier &&
          ((item.namedImport === 'default' && declarations.defaultImport !== undefined) ||
            declarations.namedImports.some(n => n.name === item.namedImport))
        ) {
          const namedImport =
            item.namedImport === 'default'
              ? NNU(declarations.defaultImport)
              : (() => {
                  const n = NNU(declarations.namedImports.find(n => n.name === item.namedImport))
                  return n.alias || n.name
                })()

          for (const callExpression of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
            const callee = callExpression.getExpression()
            if (Node.isIdentifier(callee) && callee.getText() === namedImport) {
              locateCallExpressionQuery(callExpression, namedImport, 0, queries, item, filename)
            }
          }
        }
      }
    }
  }
  return queries
}

function locateCallExpressionQuery(
  callExpression: CallExpression,
  namedImport: string,
  argumentIndex: number,
  queries: QueryItem[],
  item: Item,
  filename: string,
) {
  const args = callExpression.getArguments()
  asserts(args.length > argumentIndex, `Expected '${namedImport}' to have one argument at least!`)

  const arg = args[argumentIndex]
  if (Node.isIdentifier(arg)) {
    locateIdentifierQuery(arg, namedImport, queries, item, filename)
  } else if (Node.isBinaryExpression(arg)) {
    const left = arg.getLeft()
    asserts(Node.isIdentifier(left), `Expect to be a primary expression!`)
    locateIdentifierQuery(left, namedImport, queries, item, filename)

    const right = arg.getRight()
    asserts(Node.isIdentifier(right), `Expect to be a primary expression!`)
    locateIdentifierQuery(right, namedImport, queries, item, filename)
  } else if (Node.isArrayLiteralExpression(arg)) {
    for (const element of arg.getElements()) {
      asserts(Node.isIdentifier(element), `Expect to be a primary expression!`)
      locateIdentifierQuery(element, namedImport, queries, item, filename)
    }
  } else if (Node.isPropertyAccessExpression(arg)) {
    const property = arg.getNameNode()
    asserts(
      Node.isIdentifier(property),
      `Expected the property access reference being an identifier!`,
    )
    locateIdentifierQuery(property, namedImport, queries, item, filename)
  } else {
    console.error(`Unexpected argument kind '${arg.getKindName()}'!`)
  }
}

function locateIdentifierQuery(
  arg: Identifier,
  namedImport: string,
  queries: QueryItem[],
  item: Item,
  filename: string,
) {
  asserts(
    Node.isIdentifier(arg),
    `Expect the parameter of '${namedImport}' to be a primary expression!`,
  )

  const argDefinitions = arg.getDefinitionNodes()
  asserts(
    argDefinitions.length === 1,
    `More than one definition found for parameter of '${namedImport}'`,
  )

  const argDefinition = argDefinitions[0]
  if (Node.isVariableDeclaration(argDefinition)) {
    const initializer = argDefinition.getInitializer()
    if (initializer && ts.isTaggedTemplateExpression(initializer.compilerNode)) {
      asserts(
        initializer.compilerNode.tag.getText() === 'gql',
        `Expected the tagged template expression being a call of 'gql', found '${initializer.compilerNode.tag}' instead!`,
      )
      queries.push({
        queryCaller: stringifyModuleItem(item),
        filename,
        queryLocation: getRelativePath(initializer.getSourceFile().getFilePath()),
        namedImport: arg.compilerNode.getText(),
      })
    } else {
      console.error(
        `No initializer or no tagged expression found for '${argDefinition.getText()}' in '${argDefinition.getSourceFile().getFilePath()}'`,
      )
    }
  } else if (Node.isParameterDeclaration(argDefinition)) {
    const argName = argDefinition.getName()
    const argFunction = argDefinition.getParent()
    if (Node.isArrowFunction(argFunction)) {
      const functionParent = argFunction.getParent()
      if (Node.isVariableDeclaration(functionParent)) {
        const variableName = functionParent.getNameNode()
        asserts(Node.isIdentifier(variableName), `Expected an identifier ${variableName.getText()}`)
        for (const ref of variableName.findReferencesAsNodes()) {
          const parent = ref.getParent()
          if (Node.isCallExpression(parent)) {
            const parameterPosition = argFunction
              .getParameters()
              .findIndex(p => p.getName() === argName)
            asserts(parameterPosition > -1, `No argument named '${argName}!`)
            locateCallExpressionQuery(
              parent,
              ref.getText(),
              parameterPosition,
              queries,
              item,
              filename,
            )
          } else if (Node.isExportAssignment(parent) || Node.isImportClause(parent)) {
            // ignore it
          } else {
            console.error(`Unhandled expression kind: '${parent!.getKindName()}'!`)
          }
        }
      } else if (Node.isCallExpression(functionParent)) {
        const callee = functionParent.getExpression()
        if (Node.isPropertyAccessExpression(callee)) {
          if (callee.getName() === 'map') {
            const mapExpression = callee.getExpression()
            asserts(
              Node.isIdentifier(mapExpression),
              `Unexpected expression kind: '${mapExpression.getKindName()}'!`,
            )
            asserts(
              mapExpression.getType().isArray(),
              `Unexpected expression type: '${mapExpression.getKindName()}'!`,
            )
            locateIdentifierQuery(mapExpression, mapExpression.getText(), queries, item, filename)
          } else {
            console.error(`Unhandled function: '${callee.getName()}'!`)
          }
        } else {
          console.error(`Unhandled expression kind: '${functionParent.getKindName()}'!`)
        }
      } else {
        console.error(`Unhandled function arrow parent kind: '${functionParent.getKindName()}'!`)
      }
    } else {
      console.error(`Unhandled function kind: '${argFunction.getKindName()}'!`)
    }
  } else if (Node.isBindingElement(argDefinition)) {
    const propertyIdentifier = argDefinition.getNameNode()
    asserts(
      Node.isIdentifier(propertyIdentifier),
      `Expected an identifier ${propertyIdentifier.getText()}`,
    )
    for (const ref of propertyIdentifier.findReferencesAsNodes()) {
      const parentRef = ref.getParent()
      if (Node.isJsxAttribute(parentRef)) {
        const initializer = parentRef.getInitializer()
        asserts(
          Node.isJsxExpression(initializer),
          `JSX attribute value expected to be a JSX expression, but was '${initializer?.getKindName()}'!`,
        )
        asserts(
          initializer.getChildCount() === 3,
          `Expected JSX expression matching the shape [Node, Identifier, Node]!`,
        )

        const variableIdentifier = initializer.getChildAtIndex(1)
        asserts(
          Node.isIdentifier(variableIdentifier),
          `Expected the JSX expression having an identifier in the middle place, found '${variableIdentifier.getKindName()}'!`,
        )
        locateIdentifierQuery(
          variableIdentifier,
          variableIdentifier.getText(),
          queries,
          item,
          filename,
        )
      } else if (Node.isPropertyAssignment(parentRef)) {
        const initializer = parentRef.getInitializer()
        asserts(
          Node.isIdentifier(initializer),
          `Unexpected property assignment initializer kind: '${initializer!.getKindName()}'`,
        )
        locateIdentifierQuery(initializer, initializer.getText(), queries, item, filename)
      } else if (
        !Node.isPropertySignature(parentRef) &&
        !Node.isCallExpression(parentRef) &&
        !Node.isBinaryExpression(parentRef) &&
        !Node.isPropertyAccessExpression(parentRef)
      ) {
        console.error(`Unhandled property type: '${parentRef!.getKindName()}'!`)
      }
    }
  } else if (Node.isPropertySignature(argDefinition)) {
    for (const ref of argDefinition.findReferencesAsNodes()) {
      const parentRef = ref.getParent()
      if (Node.isPropertyAssignment(parentRef)) {
        const initializer = parentRef.getInitializer()
        asserts(
          Node.isIdentifier(initializer),
          `Unexpected property assignment initializer kind: '${initializer!.getKindName()}'`,
        )
        locateIdentifierQuery(initializer, initializer.getText(), queries, item, filename)
      } else if (!Node.isPropertyAccessExpression(parentRef)) {
        console.error(`Unhandled property type: '${parentRef!.getKindName()}'!`)
      }
    }
  } else {
    console.error(`Unhandled argument definition: '${argDefinition.getKindName()}'!`)
  }
}

function parseModuleItem(item: string): Item {
  const ModuleItemRE =
    /^(?<moduleSpecifier>(?:@(?:\w|[-_]|\d)+\/)?.+?)#(?<namedImport>(?:\w|[-_]|\d)+)$/
  const matches = ModuleItemRE.exec(item)
  if (!matches) {
    throw new Error(`'${item}' does not match the expected format!`)
  }

  return {
    moduleSpecifier: matches.groups!.moduleSpecifier,
    namedImport: matches.groups!.namedImport,
    isExternal: matches.groups!.moduleSpecifier.match(/\.\w+$/) === null,
  }
}

function stringifyModuleItem(item: Item) {
  return `${item.moduleSpecifier}#${item.namedImport}`
}
