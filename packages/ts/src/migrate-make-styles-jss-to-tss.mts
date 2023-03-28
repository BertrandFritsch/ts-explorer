import { Node, SourceFile, SyntaxKind, ts } from 'ts-morph';
import { asserts, initializeRootDirectory, NNU } from './lib/helpers.mjs';
import { walkModuleDependencies } from './lib/walkModuleDependencies.mjs';
import { Command } from 'commander';

interface Item {
  moduleSpecifier: string;
  namedImport: string;
  isExternal: boolean;
}

interface QueryItem {
  queryCaller: string;
  filename: string;
  namedImport: string;
  queryLocation: string;
}

const program = new Command();

program.name('migrate-make-styles-jss-to-tss')
       .description('Migrate the makeStyles calls from JSS to TSS')
       .version('0.0.1');

program.argument('<input source file>');
program.parse();

initializeRootDirectory(program.args[ 0 ]);

await migrateJSS2TSS();

async function migrateJSS2TSS() {
  const items = [ parseModuleItem(`@material-ui/core#makeStyles`) ];

  for await (const { filename, sourceFile, namedImport, importDeclaration } of walkModuleImports(items)) {
    let updated = false
    console.log(`Trying: '${ filename }'`)

    for (const callExpression of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
      if (callExpression.wasForgotten()) {
        continue;
      }

      /*
       * migrate the makeStyles calls:
       *   makeStyles({ ...styles }) => makesStyles()({ ...styles })
       */
      const callee = callExpression.getExpression();
      if (Node.isIdentifier(callee) && callee.getText() === namedImport) {
        const makeStylesArgs = callExpression.getArguments();
        asserts(makeStylesArgs.length === 1, `Expected the call of '${ namedImport }' to have one argument only!`);
        let makeStylesArg = makeStylesArgs[ 0 ];

        if (Node.isArrowFunction(makeStylesArg)) {
          if (makeStylesArg.getParameters().length === 0) {
            const body = makeStylesArg.getBody();
            asserts(Node.isParenthesizedExpression(body), `Expected the second child of the arrow function to be a parenthesized expression! Found: '${ body.getKindName() }'.`);
            
            const parenthesizedExpressionChild = body.getExpression();
            asserts(Node.isObjectLiteralExpression(parenthesizedExpressionChild), `Expected the parenthesized expression to be an object literal expression! Found: '${ body.getKindName() }'.`);

            makeStylesArg = parenthesizedExpressionChild;
          }
        }

        asserts(Node.isExpression(makeStylesArg), `Expect to be an expression! Found: '${ makeStylesArg.getKindName() }'.`);
        callExpression.replaceWithText(ts.createPrinter().printNode(ts.EmitHint.Expression, ts.factory.createCallExpression(callExpression.compilerNode, undefined, [ makeStylesArg.compilerNode ]), sourceFile.compilerNode)).getFirstDescendantByKind(SyntaxKind.CallExpression)?.removeArgument(0)

        const parentExpression = callExpression.getParent()
        if (Node.isExportAssignment(parentExpression)) {
          await updateImportTSSClauses(`${ filename }#default`)
          updated = true
        }
        else {
          asserts(Node.isVariableDeclaration(parentExpression), `Expected the parent of '${ namedImport }' to be a variable declaration! Found: '${ parentExpression?.getKindName() }'.`);

          const variableIdentifier = parentExpression.getFirstChild()
          asserts(Node.isIdentifier(variableIdentifier), `Expected the variable declaration to be an identifier! Found: '${ variableIdentifier?.getKindName() }'.`);

          updateTSSClauses(filename, sourceFile, variableIdentifier.getText());

          if (parentExpression.getFirstAncestorByKind(SyntaxKind.VariableStatement)?.getFirstChild()?.getKind() === SyntaxKind.ExportKeyword) {         
            await updateImportTSSClauses(`${ filename }#${ variableIdentifier.getText() }`)
          }

          updated = true
        }
      }
    }

    if (updated) {
      importDeclaration.setModuleSpecifier('designSystem/mui/makeStyles')
      sourceFile.saveSync();
      console.log(`Updated: '${ filename }'`)
    }
  }
}

async function updateImportTSSClauses(item: string) {
  for await (const { filename, sourceFile, namedImport } of walkModuleImports([ parseModuleItem(item) ])) {
    updateTSSClauses(filename, sourceFile, namedImport);
  }
}

function updateTSSClauses(filename: string, sourceFile: SourceFile, item: string) {
  for (const callExpression of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    /*
      * migrate the classes assignement:
      *   const classes = useStyles() => const { classes } = useStyles()
      */
    const callee = callExpression.getExpression();
    if (Node.isIdentifier(callee) && callee.getText() === item) {
      const variableDeclaration = callExpression.getParent()
      asserts(Node.isVariableDeclaration(variableDeclaration), `Expected the parent of '${ item }' to be a variable declaration! Found: '${ variableDeclaration?.getKindName() }'.`);
      
      const variableIdentifier = variableDeclaration.getFirstChild()
      asserts(Node.isIdentifier(variableIdentifier), `Expected the variable declaration to be an identifier! Found: '${ variableIdentifier?.getKindName() }'.`);

      variableDeclaration.replaceWithText(ts.createPrinter().printNode(ts.EmitHint.Unspecified, ts.factory.createVariableDeclaration(ts.factory.createObjectBindingPattern([ ts.factory.createBindingElement(undefined, undefined, variableIdentifier.compilerNode, undefined) ]), undefined, undefined, callExpression.compilerNode), sourceFile.compilerNode))
    }
  }

  sourceFile.saveSync();
  console.log(`Updated: '${ filename }'`)
}

async function *walkModuleImports(items: Item[]) {
  for await (const { filename, sourceFile, declarations, importDeclaration } of walkModuleDependencies([ program.args[ 0 ] ], { skipAddingFilesFromTsConfig: false })) {
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
