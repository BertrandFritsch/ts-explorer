import { Command, Option } from 'commander'
import { getDependencyGraph } from './get-dependency-graph.mjs'
import { getItemDependencyGraph } from './get-item-dependency-graph.mjs'
import { findSymbolDefinition } from './find-symbol-definition.mjs'
import { getItemImportedFiles } from './get-item-imported-files.mjs'
import { getExternalDependencyImports } from './get-external-imports.mjs'
import { getProjectConfig } from './get-project-config.mjs'
import { getProjectFiles } from './get-project-file-list.mjs'
import { getProjectRootDirectory } from './get-project-root-directory.mjs'
import {
  convertToAbsolutePathWithFileProtocol,
  getVersion,
  PluginFunction,
  PluginOptions
} from '@bertrand.fritsch/ts-lib'

const program = new Command()

const { description, version } = getVersion()

program.name('ts-explorer').version(version).description(description)

program
  .command('get-project-root-directory')
  .description('Get the absolute path to the root directory of a project')
  .argument('<source file>', 'The path to the project or the path to a source file')
  .action(async (sourceFile: string) => {
    console.log(getProjectRootDirectory(sourceFile))
  })

program
  .command('get-project-config')
  .description('Get the project configuration')
  .argument('<source file>', 'The path to the project or the path to a source file')
  .action((sourceFile: string) => {
    console.log(JSON.stringify(getProjectConfig(sourceFile), null, 2))
  })

program
  .command('get-project-file-list')
  .description('Get the list of files from a project')
  .argument('<source file>', 'The path to the project or the path to a source file')
  .action(async (sourceFile: string) => {
    console.log(JSON.stringify(getProjectFiles(sourceFile), null, 2))
  })

program
  .command('get-file-list')
  .description('Get the list of files recursevely included in a set of source files')
  .argument('<input source file...>', 'The paths to the source files to process')
  .action(async (sourceFiles: string[]) => {
    console.log(
      JSON.stringify(Array.from((await getDependencyGraph(sourceFiles, true)).keys()), null, 2),
    )
  })

program
  .command('get-dependency-graph')
  .description('Get the dependency graph of a set of source files')
  .option(
    '-r, --recursive',
    'Whether the internal dependencies have to be processed recursively',
    false,
  )
  .argument('<input source file...>', 'The paths to the source files to process')
  .action(async (sourceFiles: string[], { recursive }: { recursive: boolean }) => {
    console.log(
      JSON.stringify(
        Object.fromEntries(
          Array.from((await getDependencyGraph(sourceFiles, recursive)).entries()),
        ),
        null,
        2,
      ),
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
  .argument('<input source file...>', 'The paths to the source files to process')
  .action(
    async (
      sourceFiles: string[],
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
          await getItemDependencyGraph(sourceFiles, item, highlightPathsTo, keepFullPath),
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
  .argument('<input source file...>', 'The paths to the source files to process')
  .action(
    async (
      sourceFiles: string[],
      {
        item,
      }: {
        item: string[]
      },
    ) => {
      console.log(JSON.stringify(await getItemImportedFiles(sourceFiles, item), null, 2))
    },
  )

program
  .command('get-external-imports')
  .description('Get external imports of a set of source files')
  .option(
    '-r, --recursive',
    'Whether the internal dependencies have to be processed recursively',
    false,
  )
  .argument('<input source file...>', 'The paths to the source files to process')
  .action(async (sourceFiles: string[], { recursive }: { recursive: boolean }) => {
    console.log(
      JSON.stringify(
        Array.from((await getExternalDependencyImports(sourceFiles, recursive)).values()),
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

program
  .command('run-plugin')
  .description('Execute a plugin')
  .requiredOption('-p, --plugin <plugin>', 'Path to the compiled plugin file')
  .option('-o, --option <key=value>', 'Optional named argument', (value, previous) => {
    const [key, val] = value.split('=')
    return { ...previous, [key]: val }
  }, {})
  .action(async (options: { plugin: string; option: PluginOptions }) => {
    const plugin = await import(convertToAbsolutePathWithFileProtocol(options.plugin))

    if (plugin.executePlugin === undefined) {
      throw new Error("Cannot run the plugin. It seems the plugin does not export a function named 'executePlugin'")
    }

    const executePlugin: PluginFunction = plugin.executePlugin
    await executePlugin(options.option)
  })

process.on('uncaughtException', error => {
  console.error('Error:', error.message)
  process.exit(1)
})

process.on('unhandledRejection', reason => {
  console.error('Error:', reason instanceof Error ? reason.message : reason)
  process.exit(1)
})

program.parse(process.argv)
