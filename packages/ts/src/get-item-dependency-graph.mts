import { initializeRootDirectory, parseModuleItem } from './lib/helpers.mjs'
import { assertDependencyGraphImportResolved, DependencyGraphImport, ModuleItem, } from './lib/types.mjs'
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs'
import { ElementDefinition } from 'cytoscape'
import path from 'node:path'
import fs from 'node:fs'

export async function getItemDependencyGraph(
  sourceFile: string,
  items: string[],
  highlightPathsTo: string[] | undefined,
  keepFullPath: boolean,
) {
  const sourceFiles =
    path.extname(sourceFile) === '.json'
      ? JSON.parse(fs.readFileSync(sourceFile, 'utf-8'))
      : [sourceFile]

  initializeRootDirectory(sourceFiles[0])

  return Array.from((await getModuleDependencies()).values())

  async function getModuleDependencies() {
    const moduleItems = items.map(item => parseModuleItem(item))
    const highlightPaths = highlightPathsTo && highlightPathsTo.map(item => parseModuleItem(item))
    const elements = new Map<string, ElementDefinition>()
    const stack: string[] = []

    for await (const { filename, depth, declarations } of walkModuleDependencyImports(sourceFiles, {
      walkThroughImports: true,
    })) {
      if (declarations.resolvedFileName) {
        assertDependencyGraphImportResolved(declarations)

        if (stack.indexOf(declarations.resolvedFileName) === -1) {
          if (stack.length > depth) {
            stack.splice(depth, stack.length - depth)
          }

          if (stack.indexOf(filename) === -1) {
            if (stack.length === depth) {
              stack.push(filename)
            }

            if (highlightPaths) {
              for (const highlightPath of highlightPaths) {
                handlePath(elements, stack, highlightPath, declarations, true)
              }
            }

            for (const item of moduleItems) {
              handlePath(elements, stack, item, declarations, false)
            }
          }
        }
      }
    }

    return elements
  }

  function extractFilenameUserName(filename: string) {
    const FileNameRE = /^.*?(?<name>[^/]+)(?:\/index\.(?:tsx|ts|js))?$/
    const matches = FileNameRE.exec(filename)
    if (!matches) {
      throw new Error(`Cound not extract the name from '${name}'!`)
    }

    return matches.groups!.name
  }

  function handlePath(
    elements: Map<string, cytoscape.ElementDefinition>,
    stack: string[],
    item: ModuleItem,
    declarations: DependencyGraphImport & { resolvedFileName: string },
    highlight: boolean,
  ) {
    if (
      (item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) ===
        item.moduleSpecifier &&
      (item.namedImport === undefined ||
        (item.namedImport === 'default' && declarations.defaultImport !== undefined) ||
        declarations.namedImports.some(n => n.name === item.namedImport))
    ) {
      appendStack(
        elements,
        [
          ...stack,
          item.isExternal
            ? item.namedImport || item.moduleSpecifier
            : declarations.resolvedFileName,
        ],
        highlight,
      )
    } else {
      const element = elements.get(declarations.resolvedFileName)
      if (element) {
        // means that, although the current declaration is not the one that is looked up,
        // the current declaration is already part of the elements, thus contains a path to the looked-up item,
        // so add the current path to this declaration too
        appendStack(elements, [...stack, declarations.resolvedFileName], element.data.highlight)
      }
    }
  }

  function appendStack(
    elements: Map<string, cytoscape.ElementDefinition>,
    stack: string[],
    highlight: boolean,
  ) {
    let parent: string | undefined = undefined
    for (const element of stack) {
      if (highlight || !elements.has(element)) {
        elements.set(element, {
          data: {
            id: element,
            /*parent, */ name: keepFullPath ? element : extractFilenameUserName(element),
            highlight,
          },
        })
      }

      if (parent) {
        const edgeId = `${parent}->${element}`
        if (highlight || !elements.has(edgeId)) {
          elements.set(edgeId, {
            data: {
              source: parent,
              target: element,
              pathTarget: stack[stack.length - 1],
              highlight,
            },
          })
        }
      }

      parent = element
    }
  }
}
