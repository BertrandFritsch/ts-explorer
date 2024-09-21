import {
  ArrowFunction,
  FunctionDeclaration,
  Node,
  ObjectLiteralExpression,
  SyntaxKind,
  ts,
  VariableDeclarationKind,
} from 'ts-morph'
import { asserts, initializeRootDirectory, walkModuleDependencyImports, } from '@bertrand.fritsch/ts-explorer-lib'
import { Command } from 'commander'

const program = new Command()

program.name('include-theme').description('Add missing theme imports').version('0.0.1')

program.argument('<input source file>')
program.parse()

initializeRootDirectory(program.args[0])

await importTheme()

async function importTheme() {
  for await (const { filename, sourceFile } of walkModuleDependencyImports(program.args, {
    yieldSourceFileOnlyOnce: true,
  })) {
    let updated /* : 'none' | 'makeStyles' | 'useTheme' */ = 'none'

    sourceFile.forEachDescendant(theme => {
      if (Node.isIdentifier(theme) && theme.getText() === 'theme') {
        if (
          theme.getFirstAncestor(n => Node.isBindingElement(n)) ||
          Node.isJsxAttribute(theme.getParent())
        ) {
          return
        }

        if (theme.getDefinitions().length === 0) {
          asserts(
            !sourceFile.getImportDeclaration(i =>
              i.getNamedImports().some(n => n.getText() === 'useStyles'),
            ),
            `Unhandled case in '${filename}': adding theme to 'useStyles'!`,
          )

          // theme used in makeStyles calls
          const makeStylesObject = theme.getFirstAncestor((n): n is ObjectLiteralExpression => {
            if (Node.isObjectLiteralExpression(n)) {
              const makeStylesParentCall = n.getParent()
              if (makeStylesParentCall?.getKind() === SyntaxKind.CallExpression) {
                const makeStylesCall = makeStylesParentCall.getFirstChild()
                if (makeStylesCall?.getKind() === SyntaxKind.CallExpression) {
                  const callName = makeStylesCall.getFirstChild()
                  return (
                    callName?.getKind() === SyntaxKind.Identifier &&
                    callName.getText() === 'makeStyles'
                  )
                }
              }
            }

            return false
          })

          if (makeStylesObject) {
            console.log(`Adding theme to the makeStyles call in '${filename}'`)
            makeStylesObject.replaceWithText(
              ts
                .createPrinter()
                .printNode(
                  ts.EmitHint.Unspecified,
                  ts.factory.createArrowFunction(
                    undefined,
                    undefined,
                    [
                      ts.factory.createParameterDeclaration(
                        undefined,
                        undefined,
                        'theme',
                        undefined,
                        undefined,
                        undefined,
                      ),
                    ],
                    undefined,
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    makeStylesObject.compilerNode,
                  ),
                  sourceFile.compilerNode,
                ),
            )

            if (updated === 'none') {
              updated = 'makeStyles'
            }

            return
          }

          // theme used in JSX components
          const functionComponent = theme.getFirstAncestor(
            (n): n is ArrowFunction | FunctionDeclaration =>
              (Node.isArrowFunction(n) || Node.isFunctionDeclaration(n)) &&
              n.getFirstAncestor(p => Node.isArrowFunction(p) || Node.isFunctionDeclaration(p)) ===
                undefined,
          )

          if (functionComponent) {
            console.log(`Initializing theme with useTheme in '${filename}'`)
            updated = 'useTheme'

            if (Node.isArrowFunction(functionComponent)) {
              const body = functionComponent.getBody()

              if (!Node.isBlock(body)) {
                asserts(
                  Node.isExpression(body),
                  `Expected the function body to be an expression! Found: '${body.getKindName()}'.`,
                )
                body.replaceWithText(
                  ts
                    .createPrinter()
                    .printNode(
                      ts.EmitHint.Unspecified,
                      ts.factory.createBlock([ts.factory.createReturnStatement(body.compilerNode)]),
                      sourceFile.compilerNode,
                    ),
                )
              }
            }

            functionComponent.insertVariableStatement(0, {
              declarationKind: VariableDeclarationKind.Const,
              declarations: [
                {
                  name: 'theme',
                  initializer: 'useTheme()',
                },
              ],
            })

            return
          }

          console.log(`Unhandled case in '${filename}'!`)
        }
      }
    })

    const useThemeImport = sourceFile.getImportDeclaration(i =>
      i.getNamedImports().some(n => n.getText() === 'useTheme'),
    )
    if (
      useThemeImport &&
      useThemeImport.getModuleSpecifier().getText().startsWith(`'@material-ui/core'`)
    ) {
      useThemeImport.setModuleSpecifier('@mui/material/styles')
      updated = 'useTheme'
    } else if (updated === 'useTheme') {
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@mui/material/styles',
        namedImports: ['useTheme'],
      })
    }

    if (updated !== 'none') {
      sourceFile.saveSync()
      console.log(`Updated: '${filename}'`)
    }
  }
}
