import pathModule from 'node:path'
import { getRootDirectory, initializeRootDirectory } from "@bertrand.fritsch/ts-lib"

export function getProjectRootDirectory(sourceFile: string) {
  initializeRootDirectory(sourceFile)
  return pathModule.resolve(getRootDirectory())
}
