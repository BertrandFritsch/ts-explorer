import { JsxSelfClosingElement, Node, SyntaxKind } from 'ts-morph';
import { asserts, initializeRootDirectory, NNU } from './lib/helpers.mjs';
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs';
import { Command } from 'commander';

const spaces: Record<string, number | undefined> = {
  xxxxs: 4,
  xxxs: 8,
  xxs: 12,
  xs: 16,
  s: 24,
  m: 32,
  l: 40,
  xl: 48,
  xxl: 56,
  xxxl: 80,
} as const

interface Item {
  moduleSpecifier: string;
  namedImport: string;
  isExternal: boolean;
}

const program = new Command();

program.name('migrate-spacing to gap')
       .description('Migrate spacing to gap')
       .version('0.0.1');

program.argument('<input source file>');
program.parse();

initializeRootDirectory(program.args[ 0 ]);

await migrateSpacingToGap();

async function migrateSpacingToGap() {
  const items = [ parseModuleItem(`app/components/common/Space.tsx#default`), parseModuleItem(`app/components/common/SpaceH.tsx#default`) ];

  for await (const { filename, sourceFile, importDeclaration } of walkModuleImports(items)) {
    let updated = false
    console.log(`Trying: '${ filename }'`)

    for (const jsxExpression of sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)) {
      if (jsxExpression.getTagNameNode().getText() === 'SpaceH') {
        jsxExpression.getChildAtIndex(1).replaceWithText('Gap')
        jsxExpression.insertAttribute(0, { name: 'horizontal' })
        migrateSpaceSizeAttribute(jsxExpression);

        updated = true
      }
      else if (jsxExpression.getTagNameNode().getText() === 'Space') {
        jsxExpression.getChildAtIndex(1).replaceWithText('Gap')
        migrateSpaceSizeAttribute(jsxExpression);

        updated = true
      }
    }

    if (updated) {
      importDeclaration.setDefaultImport('Gap');
      importDeclaration.setModuleSpecifier('components/common/Gap');
      sourceFile.saveSync();
      console.log(`Updated: '${ filename }'`)
    }
  }
}

function migrateSpaceSizeAttribute(jsxExpression: JsxSelfClosingElement) {
  const sizeAttribute = jsxExpression.getAttribute('size');
  if (sizeAttribute) {
    asserts(Node.isJsxAttribute(sizeAttribute), `Expected the size attribute to be a JSX attribute! Found: '${sizeAttribute.getKindName()}'.`);

    const initializer = sizeAttribute.getInitializer();
    asserts(Node.isJsxExpression(initializer), `Expected the size attribute to be a JSX expression! Found: '${initializer?.getKindName()}'.`);

    const expr = initializer.getExpression();
    if (Node.isNumericLiteral(expr)) {
      expr.setLiteralValue(parseInt(expr.getText()) / 8);
    }

    else if (Node.isPropertyAccessExpression(expr)) {
      asserts(expr.getExpression().getText() === 'spaces', `Expected the size attribute to access to spaces! Found: '${expr.getExpression().getText()}'.`)

      const size = spaces[ expr.getName() ];
      asserts(size !== undefined, `Expected the size attribute to access to a valid space! Found: '${expr.getName()}'.`)

      initializer.replaceWithText(`{${ size / 8 }}`);
    }

    else {
      asserts(false, `Expected the size attribute to be a numeric literal or a property access expression! Found: '${expr?.getKindName()}'.`)
    }
  }
}

async function *walkModuleImports(items: Item[]) {
  for await (const { filename, sourceFile, declarations, importDeclaration } of walkModuleDependencyImports([ program.args[ 0 ] ], { skipAddingFilesFromTsConfig: false })) {
    if (!items.some(item => !item.isExternal && item.moduleSpecifier === filename)) { // consider items as endpoints -- don't look up for GraphQL calls inside them
      for (const item of items) {
        if ((item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) === item.moduleSpecifier
            && (item.namedImport === 'default' && declarations.defaultImport !== undefined
                || declarations.namedImports.some(n => n.name === item.namedImport))) {

          asserts(importDeclaration !== undefined);
          yield {
            filename,
            sourceFile,
            namedImport: item.namedImport === 'default'
                              ? NNU(declarations.defaultImport)
                              : (
                                () => {
                                  const n = NNU(declarations.namedImports.find(n => n.name === item.namedImport));
                                  return n.alias || n.name;
                                }
                              )(),
            importDeclaration
          }      
        }
      }
    }
  }
}

function parseModuleItem(item: string): Item {
  const ModuleItemRE = /^(?<moduleSpecifier>(?:@(?:\w|[-_]|\d)+\/)?.+?)#(?<namedImport>(?:\w|[-_]|\d)+)$/;
  const matches = ModuleItemRE.exec(item);
  if (!matches) {
    throw new Error(`'${ item }' does not match the expected format!`);
  }

  return { moduleSpecifier: matches.groups!.moduleSpecifier, namedImport: matches.groups!.namedImport, isExternal: matches.groups!.moduleSpecifier.match(/\.\w+$/) === null };
}
