import path from 'node:path'
import { Project, ts } from 'ts-morph'
import { getRelativePath, getRootDirectory, initializeRootDirectory } from './lib/helpers.mjs'

export function findSymbolDefinition(sourceFile: string, symbol: string) {
  initializeRootDirectory(sourceFile)

  const project = new Project({
    tsConfigFilePath: path.join(getRootDirectory(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
    skipFileDependencyResolution: false,
    skipLoadingLibFiles: false,
  })

  return findSymbolDefinition(symbol)

  function findSymbolDefinition(name: string) {
    const declarations: Array<{
      name: string
      type: string
      sourceFile: string
      startLine: number
      endLine: number
    }> = []
    const checker = project.getTypeChecker()

    for (const sourceFile of project.getSourceFiles()) {
      for (const symbol of checker
        .getSymbolsInScope(sourceFile, ts.SymbolFlags.Type | ts.SymbolFlags.Value)
        .filter(sym => sym.getName() === name)) {
        for (const declaration of symbol.getDeclarations()) {
          declaration.getStartLineNumber()
          declarations.push({
            name,
            type: declaration.getKindName(),
            sourceFile: getRelativePath(declaration.getSourceFile().getFilePath()),
            startLine: declaration.getStartLineNumber(),
            endLine: declaration.getEndLineNumber(),
          })
        }
      }
    }

    return declarations
  }
}
