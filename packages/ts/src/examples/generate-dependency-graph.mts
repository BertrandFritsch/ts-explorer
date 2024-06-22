import fs from 'node:fs'
import { Command } from 'commander'
import { DependencyGraphImport } from '../lib/types.mjs'

const program = new Command()

program
  .name('generate-dependency-graph')
  .description('Generate a dependency graph')
  .version('0.0.2')

program.argument('<dependency graph imports>')
program.parse()

const dependencies = JSON.parse(fs.readFileSync(program.args[0], 'utf-8')) as Record<
  string,
  DependencyGraphImport[]
>

export interface RelatedEntity {
  id: string
  relationship: string
  iconClassname: string | null
  description: string | null
}

const data = {
  customer: {
    id: Object.keys(dependencies)[0],
    name: Object.keys(dependencies)[0],
    type: 'module',
    typeName: Object.keys(dependencies)[0],
    iconClassname: null,
    shareholding: null,
    legalRepresentatives: null,
    relatedEntities: Object.values(dependencies)[0].reduce<RelatedEntity[]>((acc, imported) => {
      if (imported.resolvedFileName && !imported.isExternalLibraryImport) {
        acc.push({
          id: imported.resolvedFileName,
          relationship: 'import',
          description: null,
          iconClassname: null,
        })
      }

      return acc
    }, []),
    subsidiaries: null,
    completionStatus: null,
    effectiveStakeholders: [],
    thirdPartyEntities: null,
  },
  stakeholders: Object.entries(dependencies)
    .slice(1)
    .map(([module, moduleData]) => ({
      id: module,
      name: module,
      type: 'module',
      typeName: module,
      iconClassname: null,
      ownCustomerFolderId: null,
      shareholding: null,
      legalRepresentatives: null,
      relatedEntities: moduleData.reduce<RelatedEntity[]>((acc, imported) => {
        if (imported.resolvedFileName && !imported.isExternalLibraryImport) {
          acc.push({
            id: imported.resolvedFileName,
            relationship: 'import',
            description: null,
            iconClassname: null,
          })
        }

        return acc
      }, []),
      subsidiaries: null,
      completionStatus: null,
    })),
}

console.log(JSON.stringify(data, null, 2))
