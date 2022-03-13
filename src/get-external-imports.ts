import { initializeRootDirectory } from './helpers';
import { walkModuleDependencies } from './lib/walkModuleDependencies';

initializeRootDirectory(process.argv[2]);

console.log(JSON.stringify(getExternalDependencyImports(process.argv[2]), null, 2));

function getExternalDependencyImports(filename: string) {
  const modules = new Set<string>();
  
  walkModuleDependencies(
    filename, 
    ({ declarations }) => {
      if (declarations.isExternalLibraryImport !== false) {
        modules.add(declarations.moduleSpecifier.replace(/((?:^@[\w-\.]+\/)?[\w-\.]+).*/, '$1'));
      }
      return true;
    }
  );

  const list = Array.from(modules.values());
  list.sort((a, b) => a.localeCompare(b));
  return list;
}
