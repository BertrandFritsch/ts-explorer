import { initializeRootDirectory } from './lib/helpers';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { Command } from 'commander';
import { ElementDefinition } from 'cytoscape';

const program = new Command();

program.name('get-item-dependency-graph')
  .description('Build the dependency graph that is using an item')
  .version('0.0.1');

program.requiredOption('-i, --item <item>', 'the item to look for : <module> [ /<item> ]')
  .argument('<input source file>');
program.parse();

initializeRootDirectory(program.args[0]);

console.log(JSON.stringify(Array.from((await getModuleDependencies()).values()), null, 2));

async function getModuleDependencies() {
  const item = parseModuleItem(program.opts().item);
  const elements = new Map<string, ElementDefinition>();
  const stack: string[] = [];

  for await (const { filename, depth, declarations } of walkModuleDependencies([program.args[0]], true)) {
    if (stack.length > depth) {
      stack.splice(depth, stack.length - depth);
    }

    if (stack.length === depth) {
      stack.push(filename);
    }

    if (declarations.moduleSpecifier === item.moduleSpecifier
        && (item.namedImport === undefined && declarations.defaultImport !== undefined
          || item.namedImport !== undefined && declarations.namedImports.some(n => n.name === item.namedImport))) {

      stack.push(item.namedImport || item.moduleSpecifier);

      let parent: string | undefined = undefined;
      for (const element of stack) {
        if (!elements.has(element)) {
          elements.set(element, { data: { id: element, parent, name: extractFilenameUserName(element) } });
        }

        if (parent) {
          const edgeId = `${ parent }->${ element }`;
          if (!elements.has(edgeId))  {
            elements.set(edgeId, { data: { source: parent, target: element } });
          }
        }

        parent = element;
      }
    }
  }

  return elements;
}


function parseModuleItem(item: string) {
  const ModuleItemRE = /^(?<moduleSpecifier>(?:@(?:\w|[-_]|\d)+\/)?.+?)(?:#(?<namedImport>(?:\w|[-_]|\d)+))?$/;
  const matches = ModuleItemRE.exec(item);
  if (!matches) {
    throw new Error(`'${ item }' does not match the expected format!`)
  }

  return { moduleSpecifier: matches.groups!.moduleSpecifier, namedImport: matches.groups && matches.groups.namedImport };
}

function extractFilenameUserName(filename: string) {
  const FileNameRE = /^.*?(?<name>[^/]+)(?:\/index\.(?:tsx|ts|js))?$/;
  const matches = FileNameRE.exec(filename);
  if (!matches) {
    throw new Error(`Cound not extract the name from '${ name }'!`)
  }

  return matches.groups!.name;
}
