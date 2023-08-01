import { ExportDeclaration, ImportDeclaration, SourceFile } from "ts-morph";

export interface DependencyGraphImport {
  isExportedImport?: boolean;
  isExternalLibraryImport?: boolean;
  isMetaImport?: boolean;
  resolvedFileName?: string ;
  moduleSpecifier: string;
  isTypeOnly?: boolean;
  namespaceImport?: string;
  defaultImport?: string;
  namedImports: Array<
    {
      name: string;
      alias?: string;
    }
  >;
}

export function assertDependencyGraphImportResolved(dependency: DependencyGraphImport): asserts dependency is DependencyGraphImport & { resolvedFileName: string } {
  if (dependency.resolvedFileName === undefined) {
    throw new Error('Expect the dependency graph import to be resolved!')
  }
}

export interface DependencyGraphItem {
  filename: string;
  sourceFile: SourceFile;
  depth: number;
  declarations: DependencyGraphImport;
  importDeclaration?: ImportDeclaration;
  exportDeclaration?: ExportDeclaration;
}

export interface ModuleItem {
  moduleSpecifier: string;
  namedImport: string | undefined;
  isExternal: boolean;
}
