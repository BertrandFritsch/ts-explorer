import pathModule from 'path'
import { IndentationText, Project, SyntaxKind, ts } from 'ts-morph'
import { ResolvedModuleFull } from 'typescript'
import fg from 'fast-glob'
import { ANNU, asserts, getRelativePath, getRootDirectory, NNU } from './helpers.mjs'
import { DependencyGraphImport, DependencyGraphItem } from './types.mjs'

interface WalkModuleDependencyImportOptions {
  walkThroughImports: boolean
  skipAddingFilesFromTsConfig: boolean
  skipFileDependencyResolution: boolean
}

interface WalkModuleDependencyGraphOptions {
  walkThroughImports: boolean
  skipAddingFilesFromTsConfig: boolean
  skipFileDependencyResolution: boolean
  yieldSourceFileOnlyOnce: boolean
}

export function walkModuleDependencyImports(
  filenames: string | string[],
  options?: Partial<WalkModuleDependencyImportOptions>,
): AsyncGenerator<DependencyGraphItem, void, unknown>
export function walkModuleDependencyImports(
  filenames: string | string[],
  options?: Partial<WalkModuleDependencyGraphOptions>,
): AsyncGenerator<
  Omit<DependencyGraphItem, 'declarations' | 'importDeclaration' | 'exportDeclaration'>,
  void,
  unknown
>
export async function* walkModuleDependencyImports(
  filenames: string | string[],
  {
    walkThroughImports = true,
    skipFileDependencyResolution = true,
    skipAddingFilesFromTsConfig = true,
    yieldSourceFileOnlyOnce = false,
  }: Partial<WalkModuleDependencyImportOptions & WalkModuleDependencyGraphOptions> = {},
) {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
    },
    tsConfigFilePath: pathModule.join(getRootDirectory(), 'tsconfig.json'),
    skipAddingFilesFromTsConfig,
    skipFileDependencyResolution,
    skipLoadingLibFiles: false,
  })
  const options = project.getCompilerOptions()
  const modules = new Set<string>()
  const moduleResolutionCache = ts.createModuleResolutionCache(getRootDirectory(), s => s, options)

  for (const filename of Array.isArray(filenames) ? filenames : [filenames]) {
    const rootModule = ts.resolveModuleName(
      `./${pathModule.parse(filename).name}`,
      filename,
      options,
      project.getModuleResolutionHost(),
      moduleResolutionCache,
    )
    ANNU(rootModule.resolvedModule, 'The module for the root filename could not be found!')

    yield* (async function* resolveImports(
      module: ResolvedModuleFull,
      depth: number,
    ): AsyncGenerator<
      Omit<DependencyGraphItem, 'declarations'> & { declarations?: DependencyGraphImport }
    > {
      // console.warn(`Walking: ${ getRelativePath(module.resolvedFileName) }...`);

      modules.add(getRelativePath(module.resolvedFileName))
      const sourceFile = project.addSourceFileAtPath(module.resolvedFileName)
      asserts(
        sourceFile !== undefined,
        `The source file could not be added: '${getRelativePath(module.resolvedFileName)}'!`,
      )

      if (yieldSourceFileOnlyOnce) {
        yield {
          filename: getRelativePath(module.resolvedFileName),
          sourceFile,
          depth,
        }
      }

      for (const importDeclaration of sourceFile.getImportDeclarations()) {
        const md = ts.resolveModuleName(
          importDeclaration.getModuleSpecifier().getLiteralValue(),
          module.resolvedFileName,
          options,
          project.getModuleResolutionHost(),
          moduleResolutionCache,
        )
        const params = md.resolvedModule
          ? ([
              md.resolvedModule.isExternalLibraryImport,
              md.resolvedModule,
              getRelativePath(md.resolvedModule.resolvedFileName),
            ] as const)
          : undefined
        const structure = importDeclaration.getStructure()

        if (!yieldSourceFileOnlyOnce) {
          yield {
            filename: getRelativePath(module.resolvedFileName),
            sourceFile,
            depth,
            declarations: {
              isExternalLibraryImport: params && params[0],
              resolvedFileName: params && params[2],
              moduleSpecifier: structure.moduleSpecifier,
              isTypeOnly: importDeclaration.isTypeOnly(),
              namespaceImport: structure.namespaceImport,
              defaultImport: structure.defaultImport,
              namedImports: (() => {
                if (structure.namedImports) {
                  asserts(Array.isArray(structure.namedImports), 'Unhandled import declaration!')

                  return structure.namedImports.map(imp => {
                    asserts(typeof imp !== 'function', 'Unhandled import declaration!')

                    return typeof imp === 'string'
                      ? { name: imp }
                      : { name: imp.name, alias: imp.alias }
                  })
                }

                return []
              })(),
            },
            importDeclaration,
          }
        }

        if (walkThroughImports && params && params[0] === false && !modules.has(params[2])) {
          yield* resolveImports(params[1], depth + 1)
        }
      }

      for (const exportDeclaration of sourceFile.getExportDeclarations()) {
        const moduleSpecifier = exportDeclaration.getModuleSpecifier()
        if (moduleSpecifier) {
          const md = ts.resolveModuleName(
            moduleSpecifier.getLiteralValue(),
            module.resolvedFileName,
            options,
            project.getModuleResolutionHost(),
            moduleResolutionCache,
          )
          const params = md.resolvedModule
            ? ([
                md.resolvedModule.isExternalLibraryImport,
                md.resolvedModule,
                getRelativePath(md.resolvedModule.resolvedFileName),
              ] as const)
            : undefined
          const structure = exportDeclaration.getStructure()

          if (!yieldSourceFileOnlyOnce) {
            yield {
              filename: getRelativePath(module.resolvedFileName),
              sourceFile,
              depth,
              declarations: {
                isExportedImport: true,
                isExternalLibraryImport: params && params[0],
                resolvedFileName: params && params[2],
                moduleSpecifier: NNU(structure.moduleSpecifier),
                isTypeOnly: exportDeclaration.isTypeOnly(),
                namespaceImport: structure.namespaceExport,
                namedImports: (() => {
                  if (structure.namedExports) {
                    asserts(Array.isArray(structure.namedExports), 'Unhandled import declaration!')

                    return structure.namedExports.map(imp => {
                      asserts(typeof imp !== 'function', 'Unhandled import declaration!')

                      return typeof imp === 'string'
                        ? { name: imp }
                        : { name: imp.name, alias: imp.alias }
                    })
                  }

                  return []
                })(),
              },
              exportDeclaration,
            }
          }

          if (walkThroughImports && params && params[0] === false && !modules.has(params[2])) {
            yield* resolveImports(params[1], depth + 1)
          }
        }
      }

      // support `import.meta.glob` imported files
      for (const callExpression of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        asserts(ts.isCallExpression(callExpression.compilerNode))

        const propertyAccessExpression = callExpression.getExpression()
        if (ts.isPropertyAccessExpression(propertyAccessExpression.compilerNode)) {
          if (propertyAccessExpression.compilerNode.name.getText() === 'glob') {
            const cwd = pathModule.dirname(pathModule.resolve(module.resolvedFileName))
            const p = callExpression.compilerNode.arguments[0]
            asserts(ts.isStringLiteral(p))

            for (const filename of await fg(p.text, { cwd })) {
              const f = pathModule.parse(filename)
              const moduleSpecifier = `${f.dir}/${f.name}`
              const md = ts.resolveModuleName(
                moduleSpecifier,
                module.resolvedFileName,
                options,
                project.getModuleResolutionHost(),
                moduleResolutionCache,
              )
              const params = md.resolvedModule
                ? ([
                    md.resolvedModule.isExternalLibraryImport,
                    md.resolvedModule,
                    getRelativePath(md.resolvedModule.resolvedFileName),
                  ] as const)
                : undefined

              if (!yieldSourceFileOnlyOnce) {
                yield {
                  filename: getRelativePath(module.resolvedFileName),
                  sourceFile,
                  depth,
                  declarations: {
                    isExternalLibraryImport: params && params[0],
                    isMetaImport: true,
                    resolvedFileName: params && params[2],
                    moduleSpecifier,
                    defaultImport: '-',
                    namedImports: [],
                  },
                }
              }

              if (walkThroughImports && params && params[0] === false && !modules.has(params[2])) {
                yield* resolveImports(params[1], depth + 1)
              }
            }
          }
        }
      }
    })(rootModule.resolvedModule, 0)
  }
}
