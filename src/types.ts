import { SourceFile } from "ts-morph";

export interface DependencyGraphImport {
  isExportedImport: boolean;
  isExternalLibraryImport?: boolean;
  resolvedFileName?: string ;
  moduleSpecifier: string;
  isTypeOnly: boolean;
  namespaceImport?: string;
  defaultImport?: string;
  namedImports: Array<
    {
      name: string;
      alias?: string;
    }
  >;
}

interface DependencyGraphVisitorArgs {
  filename: string;
  sourceFile: SourceFile;
  declarations: DependencyGraphImport;
}

export interface DependencyGraphVisitor extends Function {
  (node: DependencyGraphVisitorArgs): boolean;
}
