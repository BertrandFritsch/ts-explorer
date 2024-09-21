import { initializeRootDirectory } from './lib/helpers.mjs'
import { DependencyGraphImport } from './lib/types.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'

export async function getDependencyGraph(sourceFiles: string[], isRecursive: boolean) {
  initializeRootDirectory(sourceFiles[0])
  return getModuleDependencies()

  async function getModuleDependencies() {
    const modules = new Map<string, DependencyGraphImport[]>()

    for await (const { filename, declarations } of walkModuleDependencyImports(sourceFiles, {
      walkThroughImports: isRecursive,
    })) {
      let imports = modules.get(filename)
      if (!imports) {
        modules.set(filename, (imports = []))
      }

      imports.push(declarations)
    }

    return modules
  }
}
