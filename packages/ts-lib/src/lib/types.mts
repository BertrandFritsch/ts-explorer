import { ExportDeclaration, ImportDeclaration, SourceFile } from 'ts-morph'

export type DependencyGraphImport = {
  isExportedImport?: boolean
  isExternalLibraryImport?: boolean
  isMetaImport?: boolean
  resolvedFileName?: string
  moduleSpecifier: string
  isTypeOnly?: boolean
  namespaceImport?: string
  defaultImport?: string
  namedImports: Array<{
    name: string
    alias?: string
  }>
}

export function assertDependencyGraphImportResolved(
  dependency: DependencyGraphImport,
): asserts dependency is DependencyGraphImport & { resolvedFileName: string } {
  if (dependency.resolvedFileName === undefined) {
    throw new Error('Expect the dependency graph import to be resolved!')
  }
}

export type DependencyGraphItem = {
  filename: string
  sourceFile: SourceFile
  depth: number
  declarations: DependencyGraphImport
  importDeclaration?: ImportDeclaration
  exportDeclaration?: ExportDeclaration
}

export type ModuleItem = {
  moduleSpecifier: string
  namedImport: string | undefined
  isExternal: boolean
}

export type PluginOptions = Record<string, string | undefined>

export type PluginFunction = (options: PluginOptions) => Promise<void>
