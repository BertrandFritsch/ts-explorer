import { initializeRootDirectory } from './helpers';
import { DependencyGraphImport } from './types';
import { walkModuleDependencies } from './lib/walkModuleDependencies';

initializeRootDirectory(process.argv[2]);

console.log(JSON.stringify(Array.from(getModuleDependencies(process.argv[2]).entries()).reduce((acc, [ key, value ]) => ({ ...acc, [ key ]: value }), {}), null, 2));

function getModuleDependencies(filename: string) {
  const modules = new Map<string, DependencyGraphImport[]>();
  
  walkModuleDependencies(
    filename, 
    ({ filename, declarations }) => {
      let imports = modules.get(filename);
      if (!imports) {
        modules.set(filename, imports = [])
      }

      imports.push(declarations);
      return true;
    }
  );

  return modules;
}
