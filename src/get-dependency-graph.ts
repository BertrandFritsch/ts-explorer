import path from 'path';
import fs from 'fs';
import { initializeRootDirectory } from './helpers';
import { DependencyGraphImport } from './types';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { Command } from 'commander';

const program = new Command();

program.name('get-dependency-graph')
  .description('Build the dependency graph of a set of typescript files')
  .version('0.0.2');

program.option('-r, --recursive', 'whether the internal dependencies have to be processed recursively', false)
  .argument('<input source file> | <input json file>');
program.parse();

const sourceFiles = path.extname(program.args[0]) === '.json'
  ? JSON.parse(fs.readFileSync(program.args[0], 'utf-8'))
  : [program.args[0]];

initializeRootDirectory(sourceFiles[0]);

console.log(JSON.stringify(Array.from((await getModuleDependencies()).entries()).reduce((acc, [ key, value ]) => ({ ...acc, [ key ]: value }), {}), null, 2));

async function getModuleDependencies() {
  const modules = new Map<string, DependencyGraphImport[]>();

  for await (const { filename, declarations } of walkModuleDependencies(sourceFiles, program.opts().recursive)) {
    let imports = modules.get(filename);
    if (!imports) {
      modules.set(filename, imports = [])
    }

    imports.push(declarations);
  }

  return modules;
}
