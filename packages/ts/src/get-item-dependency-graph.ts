import { initializeRootDirectory } from './lib/helpers';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { Command, Option } from 'commander';
import { ElementDefinition } from 'cytoscape';

const program = new Command();

program.name('get-item-dependency-graph')
  .description('Build the dependency graph that is using an item')
  .version('0.0.1');

program.argument('<input source file>');
program.addOption(new Option('-i, --item <item>', 'the item to look for : <module> [ #<item> ]'));
program.parse();

initializeRootDirectory(program.args[0]);

console.log(JSON.stringify(Array.from((await getModuleDependencies()).values()), null, 2));

async function getModuleDependencies() {
  const item = parseModuleItem(program.opts().item);
  const elements = new Map<string, ElementDefinition>();
  const stack: string[] = [];

  for await (const { filename, depth, declarations } of walkModuleDependencies([program.args[0]], true)) {
    if (declarations.resolvedFileName) {
      if (stack.indexOf(declarations.resolvedFileName) === -1) {
        if (stack.length > depth) {
          stack.splice(depth, stack.length - depth);
        }

        if (stack.indexOf(filename) === -1) {
          if (stack.length === depth) {
            stack.push(filename);
          }

          if ((item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) === item.moduleSpecifier
              && (item.namedImport === undefined && declarations.defaultImport !== undefined
                  || item.namedImport !== undefined && declarations.namedImports.some(n => n.name === item.namedImport))) {

            stack.push(item.namedImport || item.moduleSpecifier);
            appendStack(elements, stack);
          }
          else if (elements.has(declarations.resolvedFileName)) {
            // means that, although the current declaration is not the one that is looked up,
            // the current declaration is already part of the elements, thus contains a path to the looked-up item,
            // so add the current path to this declaration too
            stack.push(declarations.resolvedFileName);
            appendStack(elements, stack);
          }
        }
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

  return { moduleSpecifier: matches.groups!.moduleSpecifier, namedImport: matches.groups && matches.groups.namedImport, isExternal: matches.groups!.moduleSpecifier.match(/\.\w+$/) === null };
}

function extractFilenameUserName(filename: string) {
  const FileNameRE = /^.*?(?<name>[^/]+)(?:\/index\.(?:tsx|ts|js))?$/;
  const matches = FileNameRE.exec(filename);
  if (!matches) {
    throw new Error(`Cound not extract the name from '${ name }'!`)
  }

  return matches.groups!.name;
}

function appendStack(elements: Map<string, cytoscape.ElementDefinition>, stack: string[]) {
  let parent: string | undefined = undefined;
  for (const element of stack) {
    if (!elements.has(element)) {
      elements.set(element, { data: { id: element, /*parent, */ name: extractFilenameUserName(element) } });
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
