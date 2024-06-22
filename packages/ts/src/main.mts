import { Command } from 'commander'
import { getDependencyGraph } from './get-dependency-graph.mjs'
import { getVersion } from './lib/helpers.mjs'

const program = new Command()

const { description, version } = getVersion()

program.name('ts-explorer').version(version).description(description)

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
