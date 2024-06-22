import path from 'node:path'
import fs from 'node:fs'
import { initializeRootDirectory } from './lib/helpers.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'

export async function getExternalDependencyImports(sourceFile: string, isRecursive: boolean) {
  const sourceFiles =
    path.extname(sourceFile) === '.json'
      ? JSON.parse(fs.readFileSync(sourceFile, 'utf-8'))
      : [sourceFile]

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
