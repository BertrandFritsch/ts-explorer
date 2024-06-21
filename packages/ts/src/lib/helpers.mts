import { spawnSync } from 'node:child_process'
import fsModule from 'node:fs'
import pathModule from 'node:path'
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
let moduleType: 'esm' | 'cjs' | null = null

export function initializeRootDirectory(filename: string) {
  rootDirectory = pathModule.dirname(lookupForFile('tsconfig.json', filename))

  const packageJson = lookupForFile('package.json', rootDirectory)
  const { type } = JSON.parse(fsModule.readFileSync(packageJson, { encoding: 'utf-8' }))
  moduleType = type === 'module' ? 'esm' : 'cjs'
}

export function getRootDirectory() {
  return NNU(rootDirectory)
}

export function getModuleType() {
  return NNU(moduleType)
}

export function resolveModuleName(filename: string) {
  const parsedPath = pathModule.parse(filename)

  switch (parsedPath.ext) {
    case '.mts':
    case '.mjs':
      return `${parsedPath.name}.mjs`
    case '.cts':
    case '.cjs':
      return `${parsedPath.name}.cjs`
  }

  if (moduleType === 'esm') {
    switch (parsedPath.ext) {
      case '.ts':
      case '.tsx':
      case '.jsx':
      case '.js':
        return `${parsedPath.name}.js`
    }
  }

  return parsedPath.name
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

function execCommand(command: string, args: string[], shell = false) {
  const result = spawnSync(command, args, { shell })

  if (result.error) {
    throw result.error
  }

  return result.stdout.toString().trim()
}

export function getVersion(filename: string) {
  const pkgLocation = (() => {
    if (process.env.NODE_ENV === 'production') {
      const nodeModulesFolder = execCommand('npm', ['root', '-g'], true)
      return pathModule.join(nodeModulesFolder, '@bertrand-fritsch', 'ts-explorer', 'package.json')
    }

    return lookupForFile('package.json', pathModule.dirname(filename))
  })()

  const { name, description, version } = JSON.parse(
    fsModule.readFileSync(pkgLocation, { encoding: 'utf-8' }),
  )

  return { name, description, version }
}
