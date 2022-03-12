import pathModule from 'path';
import { Project, ts } from 'ts-morph';
import { ResolvedModuleFull } from 'typescript';
import { ANNU, asserts, getRelativePath, getRootDirectory, NNU } from '../helpers';
import { DependencyGraphVisitor } from '../types';

export function walkModuleDependencies(filename: string, visitor: DependencyGraphVisitor) {
  const project = new Project({
    tsConfigFilePath: pathModule.join(getRootDirectory(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: false
  });
  const options = project.getCompilerOptions();

  const modules = new Set<string>();

  const moduleResolutionCache = ts.createModuleResolutionCache(getRootDirectory(), s => s, options);
  const rootModule = ts.resolveModuleName(`./${ pathModule.parse(filename).name }`, filename, options, project.getModuleResolutionHost(), moduleResolutionCache);
  ANNU(rootModule.resolvedModule, 'The module for the root filename could not be found!');

  (function resolveImports(module: ResolvedModuleFull) {
    console.warn(`Handling: ${ getRelativePath(module.resolvedFileName) }...`);
    modules.add(getRelativePath(module.resolvedFileName));

    for (const importDeclaration of project.addSourceFileAtPath(module.resolvedFileName).getImportDeclarations()) {
      const md = ts.resolveModuleName(importDeclaration.getModuleSpecifier().getLiteralValue(), module.resolvedFileName, options, project.getModuleResolutionHost(), moduleResolutionCache);
      const params = md.resolvedModule ? [ md.resolvedModule.isExternalLibraryImport, md.resolvedModule, getRelativePath(md.resolvedModule.resolvedFileName) ] as const : undefined;
      const structure = importDeclaration.getStructure();
      visitor(
        getRelativePath(module.resolvedFileName),
        {
          isExternalLibraryImport: params && params[ 0 ],
          resolvedFileName: params && params[ 2 ],
          moduleSpecifier: structure.moduleSpecifier,
          isTypeOnly: importDeclaration.isTypeOnly(),
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
      );

      if (params && params[ 0 ] === false && !modules.has(params[2])) {
        resolveImports(params[1]);
      }
    }

    for (const exportDeclaration of project.addSourceFileAtPath(module.resolvedFileName).getExportDeclarations()) {
      const moduleSpecifier = exportDeclaration.getModuleSpecifier();
      if (moduleSpecifier) {
        const md = ts.resolveModuleName(moduleSpecifier.getLiteralValue(), module.resolvedFileName, options, project.getModuleResolutionHost(), moduleResolutionCache);
        const params = md.resolvedModule ? [ md.resolvedModule.isExternalLibraryImport, md.resolvedModule, getRelativePath(md.resolvedModule.resolvedFileName) ] as const : undefined;
        const structure = exportDeclaration.getStructure();

        visitor(
          module.resolvedFileName,
          {
            isExternalLibraryImport: params && params[ 0 ],
            resolvedFileName: params && params[ 2 ],
            moduleSpecifier: NNU(structure.moduleSpecifier),
            isTypeOnly: exportDeclaration.isTypeOnly(),
            defaultImport: structure.namespaceExport,
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
        );
  
        if (params && params[ 0 ] === false && !modules.has(params[2])) {
          resolveImports(params[1]);
        }
      }
    }
  })(rootModule.resolvedModule);

  return modules;
}
