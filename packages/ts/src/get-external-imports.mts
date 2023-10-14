import path from 'path';
import fs from 'fs';
import { initializeRootDirectory } from './lib/helpers.mjs';
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs';
import { Command } from 'commander';

const program = new Command();

program.name('get-external-imports')
  .description('Get external imports of a set of typescript files')
  .version('0.0.2');

program.option('-r, --recursive', 'whether the internal dependencies have to be processed recursively', false)
  .argument('<input source file> | <input json file>');
program.parse();

const sourceFiles = path.extname(program.args[0]) === '.json'
  ? JSON.parse(fs.readFileSync(program.args[0], 'utf-8'))
  : [program.args[0]];

initializeRootDirectory(sourceFiles[0]);

console.log(JSON.stringify(await getExternalDependencyImports(), null, 2));

async function getExternalDependencyImports() {
  const modules = new Set<string>();

  for await (const { declarations } of walkModuleDependencyImports(sourceFiles, { walkThroughImports: program.opts().recursive })) {
    if (declarations.isExternalLibraryImport !== false) {
      modules.add(declarations.moduleSpecifier.replace(/((?:^@[\w-.]+\/)?[\w-.]+).*/, '$1'));
    }
  }

  const list = Array.from(modules.values());
  list.sort((a, b) => a.localeCompare(b));
  return list;
}