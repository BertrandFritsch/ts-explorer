import { initializeRootDirectory } from './lib/helpers';
import { assertDependencyGraphImportResolved, DependencyGraphImport } from './lib/types';
import { walkModuleDependencies } from './lib/walkModuleDependencies';
import { Command, Option } from 'commander';
import { ElementDefinition } from 'cytoscape';

interface Item {
  moduleSpecifier: string;
  namedImport: string | undefined;
  isExternal: boolean;
}

const program = new Command();

program.name('get-item-dependency-graph')
  .description('Build the dependency graph that is using an item')
  .version('0.0.1');

program.argument('<input source file>');
program.addOption(new Option('-i, --item <item...>', 'the items to look for: <module> [ #(default | <item>) ]').makeOptionMandatory());
program.addOption(new Option('-p, --highlight-paths-to <item...>', 'highlights the path to intermediate internal items: <module> [ #(default | <item>) ]'));
program.parse();

initializeRootDirectory(program.args[0]);

console.log(JSON.stringify(Array.from((await getModuleDependencies()).values()), null, 2));

async function getModuleDependencies() {
  const items = program.opts<Record<string, string[]>>().item.map(item => parseModuleItem(item));
  const highlightPaths = program.opts().highlightPathsTo && program.opts<Record<string, string[]>>().highlightPathsTo.map(item => parseModuleItem(item));
  const elements = new Map<string, ElementDefinition>();
  const stack: string[] = [];

  for await (const { filename, depth, declarations } of walkModuleDependencies([program.args[0]], { walkThroughImports: false })) {
    if (declarations.resolvedFileName) {
      assertDependencyGraphImportResolved(declarations);

      if (stack.indexOf(declarations.resolvedFileName) === -1) {
        if (stack.length > depth) {
          stack.splice(depth, stack.length - depth);
        }

        if (stack.indexOf(filename) === -1) {
          if (stack.length === depth) {
            stack.push(filename);
          }

          if (highlightPaths) {
            for (const highlightPath of highlightPaths) {
              handlePath(elements, stack, highlightPath, declarations, true);
            }
          }

          for (const item of items) {
            handlePath(elements, stack, item, declarations, false);
          }
        }
      }
    }
  }

  return elements;
}


function parseModuleItem(item: string): Item {
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

function handlePath(elements: Map<string, cytoscape.ElementDefinition>, stack: string[], item: Item, declarations: DependencyGraphImport & { resolvedFileName: string }, highlight: boolean) {
  if ((item.isExternal ? declarations.moduleSpecifier : declarations.resolvedFileName) === item.moduleSpecifier
      && (item.namedImport === undefined
          || item.namedImport === 'default' && declarations.defaultImport !== undefined
          || declarations.namedImports.some(n => n.name === item.namedImport))) {

    appendStack(elements, [ ...stack, item.isExternal ? item.namedImport || item.moduleSpecifier : declarations.resolvedFileName ], highlight);
  }
  else {
    const element = elements.get(declarations.resolvedFileName);
    if (element) {
      // means that, although the current declaration is not the one that is looked up,
      // the current declaration is already part of the elements, thus contains a path to the looked-up item,
      // so add the current path to this declaration too
      appendStack(elements, [ ...stack, declarations.resolvedFileName ], element.data.highlight);
    }
  }
}

function appendStack(elements: Map<string, cytoscape.ElementDefinition>, stack: string[], highlight: boolean) {
  let parent: string | undefined = undefined;
  for (const element of stack) {
    if (highlight || !elements.has(element)) {
      elements.set(element, { data: { id: element, /*parent, */ name: extractFilenameUserName(element), highlight } });
    }

    if (parent) {
      const edgeId = `${ parent }->${ element }`;
      if (highlight || !elements.has(edgeId))  {
        elements.set(edgeId, { data: { source: parent, target: element, pathTarget: stack[ stack.length - 1 ], highlight } });
      }
    }

    parent = element;
  }
}
