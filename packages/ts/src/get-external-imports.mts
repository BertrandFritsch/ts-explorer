import { initializeRootDirectory } from './lib/helpers.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'

export async function getExternalDependencyImports(sourceFiles: string[], isRecursive: boolean) {
  initializeRootDirectory(sourceFiles[0])

  return getDependencyImports()

  async function getDependencyImports() {
    const modules = new Set<string>()

    for await (const { declarations } of walkModuleDependencyImports(sourceFiles, {
      walkThroughImports: isRecursive,
    })) {
      if (declarations.isExternalLibraryImport !== false) {
        modules.add(declarations.moduleSpecifier.replace(/((?:^@[\w-.]+\/)?[\w-.:]+).*/, '$1'))
      }
    }

    const list = Array.from(modules.values())
    list.sort((a, b) => a.localeCompare(b))
    return list
  }
}
