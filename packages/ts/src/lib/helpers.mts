import fsModule from 'fs'
import pathModule from 'path'
import { ModuleItem } from './types.mjs'

export function asserts(expr: boolean, message = 'Assertion failed!'): asserts expr {
  if (!expr) {
    console.error(message)
    throw new Error(message)
  }
}

export function ANNU<T>(
  value: T | null | undefined,
  message = 'Assertion error! Expected not null or undefined!',
): asserts value is T {
  asserts(value !== null && value !== undefined, message)
}

export function NNU<T>(value: T | null | undefined, message?: string): T {
  ANNU(value, message)
  return value
}

function lookupForFile(name: string, from: string) {
  if (!fsModule.existsSync(from)) {
    throw new Error(`'${from}' couldn't be found!`)
  }

  for (
    let dir = fsModule.statSync(from).isFile() ? pathModule.dirname(from) : from;
    dir[dir.length - 1] !== '/';
    dir = pathModule.dirname(dir)
  ) {
    const filename = pathModule.join(dir, name)
    if (fsModule.existsSync(filename)) {
      return filename
    }
  }

  throw new Error(`'${name}' couldn't be found relative to '${from}'!`)
}

let rootDirectory: string | null = null

export function initializeRootDirectory(filename: string) {
  rootDirectory = pathModule.dirname(lookupForFile('tsconfig.json', filename))
}

export function getRootDirectory() {
  return NNU(rootDirectory)
}

export function getRelativePath(path: string) {
  return pathModule.relative(getRootDirectory(), path).replaceAll(/\\/g, '/')
}

export function isExternalModule(path: string) {
  return path.includes('node_modules')
}

export function startsWithUppercaseLetter(word: string) {
  return /^\p{Lu}/u.test(word)
}

export function hasUppercaseLetterInside(word: string) {
  return /^.+\p{Lu}/u.test(word)
}

export function parseModuleItem(item: string): ModuleItem {
  const ModuleItemRE =
    /^(?<moduleSpecifier>(?:@(?:\w|[-_]|\d)+\/)?.+?)(?:#(?<namedImport>(?:\w|[-_]|\d)+))?$/
  const matches = ModuleItemRE.exec(item)
  if (!matches) {
    throw new Error(`'${item}' does not match the expected format!`)
  }

  return {
    moduleSpecifier: matches.groups!.moduleSpecifier,
    namedImport: matches.groups && matches.groups.namedImport,
    isExternal: matches.groups!.moduleSpecifier.match(/\.\w+$/) === null,
  }
}
