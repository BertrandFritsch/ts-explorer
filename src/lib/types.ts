import { SourceFile } from "ts-morph";

export interface DependencyGraphImport {
  isExportedImport?: boolean;
  isExternalLibraryImport?: boolean;
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

export interface DependencyGraphItem {
  filename: string;
  sourceFile: SourceFile;
  declarations: DependencyGraphImport;
}
