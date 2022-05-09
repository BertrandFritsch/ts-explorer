import dependenciesData from '../tmp/graph-dependencies.json';
import { DependencyGraphImport } from './types';

const dependencies = dependenciesData as Record<string, DependencyGraphImport[]>;

export interface RelatedEntity {
  id: string;
  relationship: string;
  iconClassname: string | null;
  description: string | null;
}

const data = {
  customer: {
    id: Object.keys(dependencies)[ 0 ],
    name: Object.keys(dependencies)[ 0 ],
    type: 'entity',
    typeName: Object.keys(dependencies)[ 0 ],
    iconClassname: null,
    shareholding: null,
    legalRepresentatives: null,
    relatedEntities: Object.values(dependencies)[ 0 ].reduce<RelatedEntity[]>(
      (acc, imported) => {
        if (imported.resolvedFileName && !imported.isExternalLibraryImport) {
          acc.push({
            id: imported.resolvedFileName,
            relationship: 'import',
            description: null,
            iconClassname: null
          });
        }

        return acc;
      },
      []
    ),
    subsidiaries: null,
    completionStatus: null,
    effectiveStakeholders: [],
    thirdPartyEntities: null
  },
  stakeholders: Object.entries(dependencies).slice(1).map(
    ([ module, moduleData ]) => ({
      id: module,
      name: module,
      type: 'entity',
      typeName: module,
      iconClassname: null,
      ownCustomerFolderId: null,
      shareholding: null,
      legalRepresentatives: null,
      relatedEntities: moduleData.reduce<RelatedEntity[]>(
        (acc, imported) => {
          if (imported.resolvedFileName && !imported.isExternalLibraryImport) {
            acc.push({
              id: imported.resolvedFileName,
              relationship: 'import',
              description: null,
              iconClassname: null
            });
          }

          return acc;
        },
        []
      ),
      subsidiaries: null,
      completionStatus: null
    })
  )
};

console.log(JSON.stringify(data, null, 2));
