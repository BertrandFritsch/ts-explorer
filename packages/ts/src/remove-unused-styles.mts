import { BindingElement, Identifier, Node, ObjectLiteralExpression, PropertyAssignment, SourceFile } from 'ts-morph';
import { asserts, initializeRootDirectory } from './lib/helpers.mjs';
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs';
import { Command } from 'commander';

const program = new Command();

program.name('remove-unused-styles')
       .description('Remove unused styles')
       .version('0.0.1');

program.argument('<input source file>');
program.parse();

initializeRootDirectory(program.args[ 0 ]);

await removeUnusedStyles();

async function removeUnusedStyles() {
  for await (const { filename, sourceFile } of walkModuleDependencyImports(program.args, { skipAddingFilesFromTsConfig: false, skipFileDependencyResolution: false, yieldSourceFileOnlyOnce: true })) {
    const decl = sourceFile.getImportDeclaration(i => i.getModuleSpecifierValue() === 'designSystem/mui/makeStyles' && i.getNamedImports().some(n => n.getText() === 'makeStyles'));
    if (decl === undefined) {
      continue
    }
    
    sourceFile.forEachDescendant(node => {
      if (Node.isIdentifier(node) && node.getText() === 'makeStyles' && Node.isCallExpression(node.getParent())) {
        const makeStylesCall = node.getParent()?.getParent();
        asserts(Node.isCallExpression(makeStylesCall), `Expected node to be a CallExpression, but was ${ node.getKindName() }`);

        const objectExpr = makeStylesCall.getChildAtIndex(2).getFirstDescendant((node): node is ObjectLiteralExpression => Node.isObjectLiteralExpression(node));
        asserts(objectExpr !== undefined, `Expected node to be an ObjectLiteralExpression, but was not found!`);

        console.log(`Handle ${ filename }`);
        const definedClasses = new Map<string, PropertyAssignment>();

        for (const property of objectExpr.getProperties()) {
          asserts(Node.isPropertyAssignment(property), `Expected node to be a PropertyAssignment, but was ${ node.getKindName() }`);
          if (!property.getName().startsWith('[')) {
            definedClasses.set(property.getName(), property);
          }
        }

        if (makeStylesCall.getFirstAncestor(node => Node.isExportAssignment(node))) {
          detectUsedStylesInOtherSourceFiles(sourceFile, definedClasses, 'default');
        }
        else {
          const variableDeclaration = makeStylesCall.getFirstAncestor(node => Node.isVariableDeclaration(node));
          asserts(Node.isVariableDeclaration(variableDeclaration), `Expected node to be a VariableDeclaration, but was not found!`);

          const variableName = variableDeclaration.getName();

          const variableStatement = variableDeclaration.getFirstAncestor(node => Node.isVariableStatement(node));
          asserts(Node.isVariableStatement(variableStatement), `Expected node to be a VariableStatement, but was not found!`);

          if (variableStatement.isExported()) {
            return detectUsedStylesInOtherSourceFiles(sourceFile, definedClasses, variableName);
          }
          else {
            const nameNode = variableDeclaration.getNameNode();
            asserts(Node.isIdentifier(nameNode), `Expected node to be an Identifier, but was ${ nameNode.getKindName() }`);
            detectUsedFilesInSourceFile(nameNode, definedClasses);
          }
        }
        
        let updated = false;
        if (definedClasses.size > 0) {
          definedClasses.forEach(property => {
            console.log(`Unused class: '${ property.getName() }'`)
            property.remove();
            updated = true;
          })
        }

        if (updated) {
          sourceFile.saveSync();
          console.log(`Updated: '${ filename }'`)
        }
      }
    },
    () => undefined)
  }
}

function detectUsedStylesInOtherSourceFiles(sourceFile: SourceFile, definedClasses: Map<string, PropertyAssignment>, exportName: string) {
  for (const node of sourceFile.getReferencingNodesInOtherSourceFiles()) {
    asserts(Node.isImportDeclaration(node), `Expected node to be an ImportDeclaration, but was ${ node.getKindName() }`);
    
    const useStyles = (() => {
      if (exportName === 'default') {
        return node.getDefaultImport();
      }

      const namedImport = node.getNamedImports().find(n => n.getText() === exportName);
      if (namedImport !== undefined) {
        return namedImport.getAliasNode() || namedImport.getNameNode();
      }
    })()

    if (useStyles === undefined) {
      continue;
    }
    
    detectUsedFilesInSourceFile(useStyles, definedClasses);
  }
}

function detectUsedFilesInSourceFile(useStyles: Identifier, definedClasses: Map<string, PropertyAssignment>) {
  for (const useStylesReference of useStyles.findReferencesAsNodes().filter(node => Node.isCallExpression(node.getParent()))) {
    asserts(Node.isIdentifier(useStylesReference), `Expected node to be an Identifier, but was ${useStylesReference.getKindName()}`);
    const useStylesParent = useStylesReference.getParent();

    asserts(Node.isCallExpression(useStylesParent), `Expected node to be a CallExpression, but was ${useStylesParent?.getKindName()}`);

    const useStylesVariables = useStylesParent.getParent();
    asserts(Node.isVariableDeclaration(useStylesVariables), `Expected node to be a VariableDeclaration, but was ${useStylesVariables?.getKindName()}`);

    const objectBindingPattern = useStylesVariables.getChildAtIndex(0);
    if (!Node.isObjectBindingPattern(objectBindingPattern)) {
      continue;
    }

    const classes = objectBindingPattern.getElements().find(e => e.getPropertyNameNode()?.getText() === 'classes' || e.getNameNode().getText() === 'classes');
    if (classes === undefined) {
      continue;
    }

    for (const ref of findReferencesAsNodes(classes)) {
      const className = ref.getNextSibling((s): s is Identifier => Node.isIdentifier(s));
      if (className === undefined) {
        continue;
      }

      if (definedClasses.has(className.getText())) {
        definedClasses.delete(className.getText());
      }
    }
  }
}

function findReferencesAsNodes(node: BindingElement) {
  const referencedSymbols = node.findReferences();
  return Array.from(getReferencingNodes());
  function* getReferencingNodes() {
      const referencedSymbol = referencedSymbols[ referencedSymbols.length - 1 ];
          const references = referencedSymbol.getReferences();
          for (let i = 1; i < references.length; i++) {
              const reference = references[i];
              if (!reference.isDefinition())
                  yield reference.getNode();
          }
      }
}
