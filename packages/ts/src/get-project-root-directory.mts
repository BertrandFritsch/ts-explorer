import pathModule from 'node:path'
import { getRootDirectory, initializeRootDirectory } from "./lib/helpers.mjs"

export function getProjectRootDirectory(sourceFile: string) {
  initializeRootDirectory(sourceFile)
  return pathModule.resolve(getRootDirectory())
}
