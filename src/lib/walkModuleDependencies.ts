import pathModule from 'path';
import { Project, SyntaxKind, ts } from 'ts-morph';
import { ResolvedModuleFull } from 'typescript';
import fg from 'fast-glob';
import { ANNU, asserts, getRelativePath, getRootDirectory, NNU } from '../helpers';
import { DependencyGraphItem } from '../types';

export async function* walkModuleDependencies(filenames: string | string[], walkThroughImports = true) {
  const project = new Project({
    tsConfigFilePath: pathModule.join(getRootDirectory(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: false
  });
  const options = project.getCompilerOptions();
  const modules = new Set<string>();
  const moduleResolutionCache = ts.createModuleResolutionCache(getRootDirectory(), s => s, options);

  for (const filename of Array.isArray(filenames) ? filenames : [ filenames ]) {
    const rootModule = ts.resolveModuleName(`./${ pathModule.parse(filename).name }`, filename, options, project.getModuleResolutionHost(), moduleResolutionCache);
    ANNU(rootModule.resolvedModule, 'The module for the root filename could not be found!');

    yield* (async function* resolveImports(module: ResolvedModuleFull): AsyncGenerator<DependencyGraphItem> {
      console.warn(`Handling: ${ getRelativePath(module.resolvedFileName) }...`);
      modules.add(getRelativePath(module.resolvedFileName));

      const sourceFile = project.addSourceFileAtPath(module.resolvedFileName);
      for (const importDeclaration of sourceFile.getImportDeclarations()) {
        const md = ts.resolveModuleName(importDeclaration.getModuleSpecifier().getLiteralValue(), module.resolvedFileName, options, project.getModuleResolutionHost(), moduleResolutionCache);
        const params = md.resolvedModule ? [ md.resolvedModule.isExternalLibraryImport, md.resolvedModule, getRelativePath(md.resolvedModule.resolvedFileName) ] as const : undefined;
        const structure = importDeclaration.getStructure();

        yield {
          filename: getRelativePath(module.resolvedFileName),
          sourceFile,
          declarations: {
            isExportedImport: false,
            isExternalLibraryImport: params && params[ 0 ],
            resolvedFileName: params && params[ 2 ],
            moduleSpecifier: structure.moduleSpecifier,
            isTypeOnly: importDeclaration.isTypeOnly(),
            namespaceImport: structure.namespaceImport,
            defaultImport: structure.defaultImport,
            namedImports: (() => {
              if (structure.namedImports) {
                asserts(Array.isArray(structure.namedImports), 'Unhandled import declaration!');

                return structure.namedImports.map(
                  imp => {
                    asserts(typeof imp !== 'function', 'Unhandled import declaration!');

                    return typeof imp === 'string'
                      ? { name: imp }
                      : { name: imp.name, alias: imp.alias };
                  }
                );
              }

              return [];
            })()
          }
        };

        if (walkThroughImports && params && params[ 0 ] === false && !modules.has(params[ 2 ])) {
          yield* resolveImports(params[ 1 ]);
        }
      }

      for (const exportDeclaration of sourceFile.getExportDeclarations()) {
        const moduleSpecifier = exportDeclaration.getModuleSpecifier();
        if (moduleSpecifier) {
          const md = ts.resolveModuleName(moduleSpecifier.getLiteralValue(), module.resolvedFileName, options, project.getModuleResolutionHost(), moduleResolutionCache);
          const params = md.resolvedModule ? [ md.resolvedModule.isExternalLibraryImport, md.resolvedModule, getRelativePath(md.resolvedModule.resolvedFileName) ] as const : undefined;
          const structure = exportDeclaration.getStructure();

          yield {
            filename: getRelativePath(module.resolvedFileName),
            sourceFile,
            declarations: {
              isExportedImport: true,
              isExternalLibraryImport: params && params[0],
              resolvedFileName: params && params[2],
              moduleSpecifier: NNU(structure.moduleSpecifier),
              isTypeOnly: exportDeclaration.isTypeOnly(),
              namespaceImport: structure.namespaceExport,
              namedImports: (() => {
                if (structure.namedExports) {
                  asserts(Array.isArray(structure.namedExports), 'Unhandled import declaration!');

                  return structure.namedExports.map(
                    imp => {
                      asserts(typeof imp !== 'function', 'Unhandled import declaration!');

                      return typeof imp === 'string'
                        ? { name: imp }
                        : { name: imp.name, alias: imp.alias };
                    }
                  );
                }

                return [];
              })()
            }
          };

          if (walkThroughImports && params && params[ 0 ] === false && !modules.has(params[ 2 ])) {
            yield* resolveImports(params[ 1 ]);
          }
        }
      }

      // support `import.meta.globEager` imported files
      for (const callExpression of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        asserts(ts.isCallExpression(callExpression.compilerNode));

        const propertyAccessExpression = callExpression.getExpression();
        if (ts.isPropertyAccessExpression(propertyAccessExpression.compilerNode)) {
          if (propertyAccessExpression.compilerNode.name.getText() === 'globEager') {
            const cwd = pathModule.dirname(pathModule.resolve(module.resolvedFileName));
            const p = callExpression.compilerNode.arguments[ 0 ];
            asserts(ts.isStringLiteral(p));

            for (const filename of await fg(p.text, { cwd })) {
              const f = pathModule.parse(filename);
              const moduleSpecifier = `${ f.dir }/${ f.name }`;
              const md = ts.resolveModuleName(moduleSpecifier, module.resolvedFileName, options, project.getModuleResolutionHost(), moduleResolutionCache);
              const params = md.resolvedModule ? [ md.resolvedModule.isExternalLibraryImport, md.resolvedModule, getRelativePath(md.resolvedModule.resolvedFileName) ] as const : undefined;

              yield {
                filename: getRelativePath(module.resolvedFileName),
                sourceFile,
                declarations: {
                  isExportedImport: false,
                  isExternalLibraryImport: params && params[ 0 ],
                  resolvedFileName: params && params[ 2 ],
                  moduleSpecifier,
                  isTypeOnly: false,
                  defaultImport: '-',
                  namedImports: []
                }
              };

              if (walkThroughImports && params && params[ 0 ] === false && !modules.has(params[ 2 ])) {
                yield* resolveImports(params[ 1 ]);
              }
            }
          }
        }
      }
    })(rootModule.resolvedModule);
  }
}
