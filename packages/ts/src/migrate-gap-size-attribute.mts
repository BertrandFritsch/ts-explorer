import { Node } from 'ts-morph'
import { asserts, initializeRootDirectory } from './lib/helpers.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'
import { Command } from 'commander'

const program = new Command()

program
  .name('migrate-gap-size-attribute')
  .description('Migrate Gap size attribute')
  .version('0.0.1')

program.argument('<input source file>')
program.parse()

initializeRootDirectory(program.args[0])

await importTheme()

async function importTheme() {
  for await (const { filename, sourceFile } of walkModuleDependencyImports([program.args[0]], {
    yieldSourceFileOnlyOnce: true,
  })) {
    let updated = false

    if (
      sourceFile.getImportDeclaration(
        i => i.getModuleSpecifierValue() === 'components/common/Gap',
      ) === undefined
    ) {
      continue
    }

    sourceFile.forEachDescendant(node => {
      if (
        Node.isIdentifier(node) &&
        node.getText() === 'Gap' &&
        Node.isJsxSelfClosingElement(node.getParent())
      ) {
        const gap = node.getParent()
        asserts(
          Node.isJsxSelfClosingElement(gap),
          `Expected node to be a JsxSelfClosingElement, but was ${node.getKindName()}`,
        )

        const sizeAttribute = gap.getAttribute('size')
        if (sizeAttribute) {
          asserts(
            Node.isJsxAttribute(sizeAttribute),
            `Expected node to be a JsxAttribute, but was ${node.getKindName()}`,
          )

          const sizeAttributeValue = sizeAttribute.getInitializer()
          if (Node.isJsxExpression(sizeAttributeValue)) {
            const expression = sizeAttributeValue.getExpression()
            if (Node.isCallExpression(expression)) {
              const numericalValue = expression.getArguments()[0]
              asserts(
                Node.isNumericLiteral(numericalValue),
                `Expected node to be a NumericalLiteral, but was ${node.getKindName()}`,
              )
              sizeAttribute.setInitializer(`{${numericalValue.getText()}}`)
              updated = true
            }
          }
        }
      }
    })

    if (updated) {
      sourceFile.saveSync()
      console.log(`Updated: '${filename}'`)
    }
  }
}
