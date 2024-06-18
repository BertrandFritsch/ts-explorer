import { Command } from 'commander'
import { getDependencyGraph } from './get-dependency-graph.mjs'

const program = new Command()

program.version('0.0.1').description('Explores TypeScript code')

program
  .command('get-dependency-graph')
  .description('Get the dependency graph of a set of TypeScript files')
  .option(
    '-r, --recursive',
    'Whether the internal dependencies have to be processed recursively',
    false,
  )
  .argument(
    '<input source file> | <input json file>',
    'The source file to process or a JSON file with a list of source files',
  )
  .action(async (sourceFile: string, { recursive }: { recursive: boolean }) => {
    console.log(
      JSON.stringify(
        Object.fromEntries(Array.from((await getDependencyGraph(sourceFile, recursive)).entries())),
        null,
        2,
      ),
    )
  })

program
  .command('get-file-list')
  .description('Get the list of files')
  .argument(
    '<input source file> | <input json file>',
    'The source file to process or a JSON file with a list of source files',
  )
  .action(async (sourceFile: string) => {
    console.log(
      JSON.stringify(Array.from((await getDependencyGraph(sourceFile, true)).keys()), null, 2),
    )
  })

program.parse(process.argv)
