
export interface DependencyGraphImport {
  isExternalLibraryImport?: boolean;
  resolvedFileName?: string ;
  moduleSpecifier: string;
  isTypeOnly: boolean;
  defaultImport?: string;
  namedImports: Array<
    {
      name: string;
      alias?: string;
    }
  >;
}

export interface DependencyGraphVisitor extends Function {
  (module: string, node: DependencyGraphImport): boolean;
}
