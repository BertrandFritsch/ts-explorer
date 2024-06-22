import path from 'node:path'
import fs from 'node:fs'
import { initializeRootDirectory, parseModuleItem } from './lib/helpers.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'

export async function getItemImportedFiles(sourceFile: string, items: string[]) {
  const sourceFiles =
    path.extname(sourceFile) === '.json'
      ? JSON.parse(fs.readFileSync(sourceFile, 'utf-8'))
      : [sourceFile]

  initializeRootDirectory(sourceFiles[0])

  return Array.from((await getModuleDependencies()).values())

  async function getModuleDependencies() {
    const moduleItems = items.map(item => parseModuleItem(item))
    const files: string[] = []

    for await (const { filename, declarations } of walkModuleDependencyImports(sourceFiles, {
      walkThroughImports: true,
    })) {
      for (const item of moduleItems) {
        if (
          (item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) ===
            item.moduleSpecifier &&
          (item.namedImport === undefined ||
            (item.namedImport === 'default' && declarations.defaultImport !== undefined) ||
            declarations.namedImports.some(n => n.name === item.namedImport))
        ) {
          files.push(filename)
        }
      }
    }

    return files
  }
}
