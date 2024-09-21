import ts from 'typescript'
import { initializeRootDirectory } from './lib/helpers.mjs'

export function getProjectConfig(
  sourceFile: string
) {
  initializeRootDirectory(sourceFile)

  const { config, error } = ts.readConfigFile(sourceFile, ts.sys.readFile)
  if (error) {
    throw new Error(error.messageText.toString())
  }

  return config
}
