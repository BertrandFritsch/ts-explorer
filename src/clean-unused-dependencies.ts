import { asserts, initializeRootDirectory, NNU, startsWithUppercaseLetter } from './helpers';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { SyntaxKind, ts } from 'ts-morph';

initializeRootDirectory(process.argv[2]);
getModuleDependencies(process.argv[2]);

function getModuleDependencies(filename: string) {
  walkModuleDependencies(
    filename, 
    ({ sourceFile, declarations }) => {
      if (!declarations.isExportedImport && (declarations.namespaceImport || declarations.defaultImport || declarations.namedImports.length > 0)) {
        let importIdentifiers = [ 
          ...(declarations.namespaceImport && declarations.namespaceImport !== 'React' ? [ declarations.namespaceImport ] : []), 
          ...(declarations.defaultImport && declarations.defaultImport !== 'React' ? [ declarations.defaultImport ] : []), 
          ...declarations.namedImports.map(n => n.alias || n.name) 
        ];
        for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
          asserts(ts.isIdentifier(id.compilerNode));
          const parent = id.getParent();
          if (!ts.isImportClause(parent.compilerNode) && !ts.isImportSpecifier(parent.compilerNode) && !ts.isNamespaceImport(parent.compilerNode)
            && startsWithUppercaseLetter(id.getText()) || (!ts.isJsxOpeningElement(parent.compilerNode) && !ts.isJsxClosingElement(parent.compilerNode) && !ts.isJsxSelfClosingElement(parent.compilerNode))) {
            const idx = importIdentifiers.indexOf(id.getText());
            if (idx > -1) {
              importIdentifiers.splice(idx, 1);
            }
          }
        }

        const declaration = NNU(sourceFile.getImportDeclaration(decl => decl.getModuleSpecifier().getLiteralValue() === declarations.moduleSpecifier));
        const defaultImport = declaration.getDefaultImport();
        if (defaultImport && importIdentifiers.includes(defaultImport.getText())) {
          console.warn(`  Unused import: '${ defaultImport.getText() }' from '${ declaration.getModuleSpecifier().getLiteralValue() }'`)
          declaration.removeDefaultImport();
        }

        const namespaceImport = declaration.getNamespaceImport();
        if (namespaceImport && importIdentifiers.includes(namespaceImport.getText())) {
          console.warn(`  Unused import: '${ namespaceImport.getText() }' from '${ declaration.getModuleSpecifier().getLiteralValue() }'`)
          declaration.removeNamespaceImport();
        }

        for (const namedImport of declaration.getNamedImports()) {
          if (importIdentifiers.includes(namedImport.getText())) {
            console.warn(`  Unused import: '${ namedImport.getText() }' from '${ declaration.getModuleSpecifier().getLiteralValue() }'`)
            namedImport.remove();
          }
        }

        if (!declaration.getDefaultImport() && !declaration.getNamespaceImport() && declaration.getNamedImports().length === 0) {
          declaration.remove();
        }

        sourceFile.saveSync();
      }
      return true;
    }
  );
}
