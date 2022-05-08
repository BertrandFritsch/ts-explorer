import path from 'path';
import fs from 'fs';
import { initializeRootDirectory } from './helpers';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { Command } from 'commander';

const program = new Command();

program.name('get-external-imports')
  .description('Clean unused dependency of a set of typescript files')
  .version('0.0.2');

program.option('-r, --recursive', 'whether the internal dependencies have to be processed recursively', false)
  .argument('<input source file> | <input json file>');
program.parse();

const sourceFiles = path.extname(program.args[0]) === '.json'
  ? JSON.parse(fs.readFileSync(program.args[0], 'utf-8'))
  : [program.args[0]];

initializeRootDirectory(sourceFiles[0]);

console.log(JSON.stringify(getExternalDependencyImports(), null, 2));

function getExternalDependencyImports() {
  const modules = new Set<string>();
  
  for (const { declarations } of walkModuleDependencies(sourceFiles, program.opts().recursive)) {
    if (declarations.isExternalLibraryImport !== false) {
      modules.add(declarations.moduleSpecifier.replace(/((?:^@[\w-\.]+\/)?[\w-\.]+).*/, '$1'));
    }
  }

  const list = Array.from(modules.values());
  list.sort((a, b) => a.localeCompare(b));
  return list;
}
