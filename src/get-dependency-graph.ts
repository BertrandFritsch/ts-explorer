import { initializeRootDirectory } from './helpers';
import { DependencyGraphImport } from './types';
import { walkModuleDependencies } from './lib/walkModuleDependencies';

initializeRootDirectory(process.argv[2]);
const modules = getModuleDependencies(process.argv[2]);

console.log(JSON.stringify(Array.from(modules.entries()).reduce((acc, [ key, value ]) => ({ ...acc, [ key ]: value }), {}), null, 2));

function getModuleDependencies(filename: string) {
  const modules = new Map<string, DependencyGraphImport[]>();
  
  walkModuleDependencies(
    filename, 
    (module, node) => {
      let imports = modules.get(module);
      if (!imports) {
        modules.set(module, imports = [])
      }

      imports.push(node);
      return true;
    }
  );

  return modules;
}
