import path from 'node:path'
import fs from 'node:fs'
import { ImportDeclaration, SourceFile } from 'ts-morph';
import { asserts, initializeRootDirectory, NNU, startsWithUppercaseLetter } from './lib/helpers.mjs';
import { walkModuleDependencyImports } from './lib/walkModuleDependencyImports.mjs';
import { Command } from 'commander';
import { DependencyGraphImport } from './lib/types.mjs';

const program = new Command();

program.name('migrate-muiv4-to-muiv5-imports')
       .description('Migrate the imports of MUI v4 to MUI v5')
       .version('0.0.1');

program.argument('<input source file> | <input json file>');
program.parse();

const sourceFiles = path.extname(program.args[0]) === '.json'
  ? JSON.parse(fs.readFileSync(program.args[0], 'utf-8'))
  : [program.args[0]];

initializeRootDirectory(sourceFiles[ 0 ]);

const muiImports: Map<
string,
{
  sourceFile: SourceFile,
  imports: Map<
    string, 
    {
      v5Package: string,
      defaultImportName: string | null, 
      otherImports: Array<
        {
          name: string;
          alias?: string;
        }
      > 
    }
  >
}
> = new Map()

function collectImportsToMigrate(v4Package: string, v5Package: string, declarations: DependencyGraphImport, filename: string, sourceFile: SourceFile, importDeclaration: ImportDeclaration | undefined) {
  const match = declarations.moduleSpecifier.match(new RegExp(`^${ v4Package }(?:/(?<component>.*?))?(?:/|$)`))
  if (match) {
    console.log(`Handling: '${ filename }'`)

    asserts(importDeclaration !== undefined, `Import declaration not found for '${ declarations.moduleSpecifier }'`)
    const muiFilename = muiImports.get(filename) || NNU(muiImports.set(filename, { sourceFile, imports: new Map() }).get(filename))

    if (match.groups?.component) {
      const muiImport = muiFilename.imports.get(match.groups.component) || NNU(muiFilename.imports.set(match.groups.component, { v5Package, defaultImportName: null, otherImports: [] }).get(match.groups.component))
      muiImport.defaultImportName = (muiImport.defaultImportName || declarations.defaultImport) ?? null
      muiImport.otherImports.push(...declarations.namedImports)
    }
    else {
      for (const namedImport of declarations.namedImports) {
        if (startsWithUppercaseLetter(namedImport.name)) {
          const component = namedImport.name.replace(/(Props|Type).*$/, '')
          const muiImport = muiFilename.imports.get(component) || NNU(muiFilename.imports.set(component, { v5Package, defaultImportName: null, otherImports: [] }).get(component))

          if (namedImport.name === component) {
            muiImport.defaultImportName = namedImport.alias ?? component
          }
          else {
            muiImport.otherImports.push(namedImport)
          }

          importDeclaration.getNamedImports().find(n => n.getName() === namedImport.name)?.remove()
        }
        else if (namedImport.name === 'useTheme') {
          const component = 'styles'
          const muiImport = muiFilename.imports.get(component) || NNU(muiFilename.imports.set(component, { v5Package, defaultImportName: null, otherImports: [] }).get(component))
          muiImport.otherImports.push(namedImport)
        }
        else {
          asserts(false, `Unexpected named import '${ namedImport.name }'`)
        }
      }
    }

    importDeclaration.remove()
  }
}

for await (const { filename, sourceFile, declarations, importDeclaration } of walkModuleDependencyImports(sourceFiles)) {
  collectImportsToMigrate('@material-ui/core', '@mui/material', declarations, filename, sourceFile, importDeclaration)
  collectImportsToMigrate('@material-ui/lab', '@mui/material', declarations, filename, sourceFile, importDeclaration)
  collectImportsToMigrate('@material-ui/pickers', '@mui/lab', declarations, filename, sourceFile, importDeclaration)
  collectImportsToMigrate('@material-ui/icons', '@mui/icons-material', declarations, filename, sourceFile, importDeclaration)
}

for (const [ filename, { sourceFile, imports } ] of Array.from(muiImports.entries())) {
  let updated = false
  for (const [ component, { v5Package, defaultImportName, otherImports } ] of imports) {
    if (defaultImportName || otherImports.length > 0) {
      const newDeclaration = sourceFile.addImportDeclaration({
        moduleSpecifier: `${ v5Package }/${component}`,
      })

      if (defaultImportName) {
        newDeclaration.setDefaultImport(defaultImportName)
      }

      for (const otherImport of otherImports) {
        newDeclaration.addNamedImport(otherImport)
      }

      updated = true
    }
  }

  if (updated) {
    console.log(`Updateding: '${ filename }'`)
    sourceFile.saveSync();
  }
}
