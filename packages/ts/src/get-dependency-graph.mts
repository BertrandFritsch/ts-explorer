import path from 'node:path'
import fs from 'node:fs'
import { initializeRootDirectory } from './lib/helpers.mjs'
import { DependencyGraphImport } from './lib/types.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'

export async function getDependencyGraph(sourceFile: string, isRecursive: boolean) {
  const sourceFiles =
    path.extname(sourceFile) === '.json'
      ? JSON.parse(fs.readFileSync(sourceFile, 'utf-8'))
      : [sourceFile]

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
