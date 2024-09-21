import pathModule from 'node:path'
import { Project } from 'ts-morph'
import { getRelativePath, getRootDirectory, initializeRootDirectory } from '@bertrand.fritsch/ts-lib'

export function getProjectFiles(sourceFile: string) {
  initializeRootDirectory(sourceFile)

  const project = new Project({
    tsConfigFilePath: pathModule.join(getRootDirectory(), 'tsconfig.json'),
    skipLoadingLibFiles: false,
  })

  return project.getSourceFiles().map(sourceFile => getRelativePath(sourceFile.getFilePath()))
}
