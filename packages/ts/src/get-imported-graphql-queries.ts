import { SyntaxKind, ts } from 'ts-morph';
import { asserts, initializeRootDirectory, NNU } from './lib/helpers';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { Command, Option } from 'commander';

interface Item {
  moduleSpecifier: string;
  namedImport: string;
  isExternal: boolean;
}

interface QueryItem {
  filename: string;
  namedImport: string;
  resolvedFileName: string;
}

const program = new Command();

program.name('get-imported-graphql-queries')
  .description('List the imported GraphQL queries')
  .version('0.0.1');

program.argument('<input source file>');
program.addOption(new Option('-i, --item <item...>', 'the items to look for: <module> #(default | <item>)').makeOptionMandatory());
program.parse();

initializeRootDirectory(program.args[0]);

console.log(JSON.stringify(await getModuleDependencies(), null, 2));

async function getModuleDependencies() {
  const items = program.opts<Record<string, string[]>>().item.map(item => parseModuleItem(item));
  const queries = items.reduce<Record<string, QueryItem[]>>((acc, item) => ({ ...acc, [ stringifyModuleItem(item) ]: [] }), {})

  for await (const { filename, sourceFile, declarations } of walkModuleDependencies([program.args[0]], true)) {
    for (const item of items) {
      if ((item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) === item.moduleSpecifier
          && (item.namedImport === 'default' && declarations.defaultImport !== undefined
              || declarations.namedImports.some(n => n.name === item.namedImport))) {

        const namedImport = item.namedImport === 'default'
                              ? NNU(declarations.defaultImport)
                              : (
                                  () => {
                                    const n = NNU(declarations.namedImports.find(n => n.name === item.namedImport));
                                    return n.alias || n.name;
                                  }
                                )();

        for (const callExpression of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
          asserts(ts.isCallExpression(callExpression.compilerNode));

          const identifier = callExpression.getExpression();
          if (ts.isIdentifier(identifier.compilerNode)) {
            if (identifier.compilerNode.getText() === namedImport) {
              const p = callExpression.compilerNode.arguments[ 0 ];
              if (ts.isIdentifier(p)) {
                // console.log('Found: ', p.text);
                await handleQuery(queries, item, sourceFile.getFilePath(), p.text);
              }
              else {
                console.error(`The query parameter of '${ namedImport }' in '${ filename }' is not an identifier!`);
              }
            }
          }
        }
      }
    }
  }
  return queries;
}

async function handleQuery(queries: Record<string, QueryItem[]>, item: Item, importingFilename: string, importedQueryName: string) {
  for await (const { filename, declarations } of walkModuleDependencies([ importingFilename ], false)) {
    if (declarations.resolvedFileName && (declarations.defaultImport === importedQueryName || declarations.namedImports.some(n => (n.alias || n.name) === importedQueryName))) {
      queries[ stringifyModuleItem(item) ].push({ filename, resolvedFileName: declarations.resolvedFileName, namedImport: importedQueryName });
      return;
    }
  }

  console.error(`The query name '${ importedQueryName }' has not been found in '${ importingFilename }'`);
}

function parseModuleItem(item: string): Item {
  const ModuleItemRE = /^(?<moduleSpecifier>(?:@(?:\w|[-_]|\d)+\/)?.+?)#(?<namedImport>(?:\w|[-_]|\d)+)$/;
  const matches = ModuleItemRE.exec(item);
  if (!matches) {
    throw new Error(`'${ item }' does not match the expected format!`)
  }

  return { moduleSpecifier: matches.groups!.moduleSpecifier, namedImport: matches.groups!.namedImport, isExternal: matches.groups!.moduleSpecifier.match(/\.\w+$/) === null };
}

function stringifyModuleItem(item: Item) {
  return `${ item.moduleSpecifier }#${ item.namedImport }`;
}
