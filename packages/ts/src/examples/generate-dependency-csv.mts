import fs from 'fs'
import { Command } from 'commander'
import { DependencyGraphImport } from '../lib/types.mjs'

const program = new Command()

program
  .name('generate-dependency-graph')
  .description('Generate a dependency graph')
  .version('0.0.1')

program.argument('<dependency graph imports>')
program.parse()

const dependencies = JSON.parse(fs.readFileSync(program.args[0], 'utf-8')) as Record<
  string,
  DependencyGraphImport[]
>

const result = Object.entries(dependencies).reduce<Array<{ source: string; target: string }>>(
  (acc, [module, imports]) => {
    for (const importedModule of imports) {
      if (importedModule.resolvedFileName && !importedModule.isExternalLibraryImport) {
        acc.push({ source: module, target: importedModule.resolvedFileName })
      }
    }
    return acc
  },
  [],
)

console.log(JSON.stringify(result))
