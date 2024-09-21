import {
  DependencyGraphImport,
  initializeRootDirectory,
  walkModuleDependencyImports,
} from '@bertrand.fritsch/ts-explorer-lib'

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
