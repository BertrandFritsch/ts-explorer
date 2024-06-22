import { Command, Option } from 'commander'
import { getDependencyGraph } from './get-dependency-graph.mjs'
import { getItemDependencyGraph } from './get-item-dependency-graph.mjs'
import { findSymbolDefinition } from './find-symbol-definition.mjs'
import { getItemImportedFiles } from './get-item-imported-files.mjs'
import { getExternalDependencyImports } from './get-external-imports.mjs'
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
  .description('Get the list of files from a project starting from a source file')
  .argument(
    '<input source file> | <input json file>',
    'The source file to process or a JSON file with a list of source files',
  )
  .action(async (sourceFile: string) => {
    console.log(
      JSON.stringify(Array.from((await getDependencyGraph(sourceFile, true)).keys()), null, 2),
    )
  })

program
  .command('get-item-dependency-graph')
  .description('Build the dependency graph that is using an item')
  .addOption(
    new Option(
      '-i, --item <item...>',
      'the items to look for: <module> [ #(default | <item>) ]',
    ).makeOptionMandatory(),
  )
  .option(
    '-p, --highlight-paths-to <item...>',
    'highlights the path to intermediate internal items: <module> [ #(default | <item>) ]',
  )
  .option('-k, --keep-full-path', 'whether the full path of the module will be kept', false)
  .argument(
    '<input source file> | <input json file>',
    'The source file to process or a JSON file with a list of source files',
  )
  .action(
    async (
      sourceFile: string,
      {
        item,
        highlightPathsTo,
        keepFullPath,
      }: {
        item: string[]
        highlightPathsTo: string[]
        keepFullPath: boolean
      },
    ) => {
      console.log(
        JSON.stringify(
          await getItemDependencyGraph(sourceFile, item, highlightPathsTo, keepFullPath),
          null,
          2,
        ),
      )
    },
  )

program
  .command('get-item-imported-files')
  .description('Get the list of files that are importing an item')
  .addOption(
    new Option(
      '-i, --item <item...>',
      'the items to look for: <module> [ #(default | <item>) ]',
    ).makeOptionMandatory(),
  )
  .argument(
    '<input source file> | <input json file>',
    'The source file to process or a JSON file with a list of source files',
  )
  .action(
    async (
      sourceFile: string,
      {
        item,
      }: {
        item: string[]
      },
    ) => {
      console.log(JSON.stringify(await getItemImportedFiles(sourceFile, item), null, 2))
    },
  )

program
  .command('get-external-imports')
  .description('Get external imports of a set of TypeScript files')
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
        Array.from((await getExternalDependencyImports(sourceFile, recursive)).values()),
        null,
        2,
      ),
    )
  })

program
  .command('find-symbol-definition')
  .description('Find the definition of a symbol in a project')
  .addOption(
    new Option(
      '-s, --symbol, <symbol name>',
      'The name of the symbol to look for',
    ).makeOptionMandatory(),
  )
  .argument('<source file>', 'The path to the project or the path to a source file')
  .action((sourceFile: string, { symbol }: { symbol: string }) => {
    console.log(JSON.stringify(findSymbolDefinition(sourceFile, symbol), null, 2))
  })

program.parse(process.argv)
