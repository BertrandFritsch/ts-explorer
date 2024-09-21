import pathModule from 'node:path'
import { getRootDirectory, initializeRootDirectory } from "@bertrand.fritsch/ts-explorer-lib"

export function getProjectRootDirectory(sourceFile: string) {
  initializeRootDirectory(sourceFile)
  return pathModule.resolve(getRootDirectory())
}
