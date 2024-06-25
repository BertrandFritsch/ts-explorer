# `@bertrand.fritsch/ts-explorer`

![npm](https://img.shields.io/npm/v/@bertrand.fritsch/ts-explorer)
![npm](https://img.shields.io/npm/dw/@bertrand.fritsch/ts-explorer)
![GitHub issues](https://img.shields.io/github/issues/bertrandfritsch/ts-explorer)
![GitHub forks](https://img.shields.io/github/forks/bertrandfritsch/ts-explorer)
![GitHub stars](https://img.shields.io/github/stars/bertrandfritsch/ts-explorer)
![Release](https://github.com/bertrandfritsch/ts-explorer/actions/workflows/release.yml/badge.svg?branch=master)

## Overview of Commands

The `@bertrand.fritsch/ts-explorer` package provides a suite of commands for TypeScript code analysis, including generating dependency graphs and listing files within a project. Here's a quick overview:

- **`get-dependency-graph`**: Generates a dependency graph for a set of TypeScript files.

- **`get-file-list`**: Get the list of files from a project starting from a source file.

- **`get-item-dependency-graph`**: Offers a detailed dependency graph for a specific item, highlighting paths and dependencies related to the item.

- **`get-item-imported-files`**: Get the list of files that are importing an item.

- **`get-external-imports`**: Get external imports of a set of TypeScript files.

- **`find-symbol-definition`**: Find the definition of a symbol in a project.

These commands are designed to facilitate the analysis and visualization of TypeScript project structures, making it easier to understand and manage complex codebases.

## Installation

You can install this package via npm:

```bash
npm install --global @bertrand.fritsch/ts-explorer
```

The package can also be used with `npx`

## Usage
This package provides following main commands:  

**`get-dependency-graph`**

This command provides a detailed mapping of the import statements in a set of TypeScript files.
It includes the following information for each import:

1. **Module Specifier**: The path or name of the module being imported.
2. **Import Type**:
   - **External Library Import**: Indicates if the import is from an external library.
   - **Local Import**: Indicates if the import is from a local file.
3. **Resolved File Name**: The full path to the imported file, especially useful for local imports.
4. **Import Details**:
   - **Default Import**: The default import name, if applicable.
   - **Named Imports**: The list of named imports, if any.
   - **Type-Only Import**: Indicates if the import is for type definitions only.

The JSON structure effectively categorizes each import, whether it's from an external library or a local file within the project. It also captures specifics about the import type (default or named) and whether it's used for type definitions only. This structured representation helps in understanding the dependencies and their sources in the TypeScript file.

```bash
ts-explorer get-dependency-graph <input source file> | <input json file> [--recursive]
```

- `<input source file> | <input json file>`: represents the source file or JSON file containing a list of source files from which to retrieve the imports. If a JSON file is provided, it should contain the list of source files.
- `--recursive`: processes the internal imports recursevely.

The paths to the local files provided in the result are relative to the nearest `tsconfig.json` file.


**Example**

Get the imports of the `./src/main.ts` file, use:

```bash
ts-explorer get-dependency-graph ./src/main.ts
```

Get the imports ofd the `./src/main.ts` file and all the imports from the files imported by `./src/main.ts` file, use:

```bash
ts-explorer get-dependency-graph ./src/main.ts --recursive
```

**`get-file-list`**

Get the list of files from a project starting from a source file.

```bash
ts-explorer get-file-list <input source file> | <input json file>
```

- `<input source file> | <input json file>`: represents the source file or JSON file containing a list of source files to start looking for the files.

The result is a JSON array containing the list of files from the project.

The paths to the files provided in the result are relative to the nearest `tsconfig.json` file.

**Example**

Get the list of files recursively imported by `./src/main.ts`, use:

```bash
ts-explorer get-file-list ./src/main.ts
```

**`get-item-dependency-graph`**

This command provides a detailed dependency graph for a specific import within a set of TypeScript files, highlighting the paths and dependencies related to the specified import.

```bash
ts-explorer get-item-dependency-graph <input source file> | <input json file> [--item <item...>] [--highlight-paths-to <item...>] [--keep-full-path]
```

- `--item <item...>`: Specifies the imports to look for in the format `<module> [ #(default | <item>) ]`. This option is mandatory.
- `--highlight-paths-to <item...>`: Highlights the path to intermediate internal items in the format `<module> [ #(default | <item>) ]`, providing a clear visual representation of how the items are integrated within the project.
- `--keep-full-path`: When set, the full path of the module will be kept in the output, otherwise, a simplified path or identifier may be used.

**Example**

```bash
ts-explorer get-item-dependency-graph ./src/utils.ts --item "MyModule#MyUtilFunction" --highlight-paths-to "#/MyOtherFunction" --keep-full-path
```

This example generates a dependency graph for the `./src/utils.ts` file, focusing on `MyUtilFunction` within `MyModule`, highlighting paths leading to `MyOtherFunction`, keeping the full path of the module in the output, and outputs the graph in a format compatible with Cytoscape.js.

**Output Format**

The output of the `get-item-dependency-graph` command is formatted as an array of [`ElementDefinition`](https://js.cytoscape.org/#notation/elements-json) objects, compatible with [Cytoscape.js](https://js.cytoscape.org/), a popular graph visualization library. This format includes nodes and edges, where nodes represent files or items, and edges represent dependencies between them.

- **Nodes** are defined with an `id`, `label` (for the file or item name), and other optional properties for visualization.
- **Edges** are defined with a `source` and `target` property, indicating the direction from dependent to dependency.

This structured output can be directly used in web applications to render interactive dependency graphs, providing a powerful tool for visualizing and analyzing the structure of TypeScript projects.

```json
[
  {
    "data": { "id": "node1", "label": "Item1" }
  },
  {
    "data": { "id": "node2", "label": "Item2" }
  },
  {
    "data": { "source": "node1", "target": "node2", "label": "depends on" }
  }
]
```

This JSON structure allows developers to easily integrate the dependency graph into applications or tools that support Cytoscape.js or similar graph visualization libraries, facilitating a deeper understanding of item dependencies and project architecture.

**`get-item-imported-files`**

Get the list of files that are importing an item.

```bash
ts-explorer get-item-imported-files <input source file> | <input json file> -i <item...>
```

- `<input source file> | <input json file>`: represents the source file or JSON file containing a list of source files.
- `-i, --item <item...>`: Specifies the items to look for. The format is `<module> [ #(default | <item>) ]`. This option is mandatory.

The result is an JSON array of the the paths to the files relative to the nearest `tsconfig.json` file.

**Example**

If you want to know whitch files import the `react` library, regardless of the item of the library, use:

```bash
ts-explorer get-item-imported-files ./src/main.ts -i react
```

If you want to get the list of files using the React `useState` hook, use: 

```bash
ts-explorer get-item-imported-files ./src/main.ts -i "react#useState"
```

If you want to get the list of files using the React `useState` hook or the `useEffect` hook, use: 

```bash
ts-explorer get-item-imported-files ./src/main.ts -i "react#useState" "react#useEffect"
```

**`get-external-imports`**

Get external imports of a set of TypeScript files.

```bash
ts-explorer get-external-imports <input source file> | <input json file> [--recursive]
```

- `<input source file> | <input json file>`: represents the source file or JSON file containing a list of source files.
- `--recursive`: processes the internal imports recursevely.

**Example**

```bash
ts-explorer get-external-imports ./src/main.ts --recursive
```

**`find-symbol-definition`**

This command helps locate the definition of a TypeScript symbol in your project files. Note that there may be multiple results if the symbol is defined in multiple places.

```bash
ts-explorer find-symbol-definition <input source file> --symbol <symbol>
```

* `<input source file>`: can be either a single source file, or a JSON file containing a list of source files
* `--symbol <symbol>`: Specifies the symbol to find. This option is mandatory.

**Example**

To look for the file defining the `Dialog` symbol, starting the search from file `./src/main.ts`, use:

```bash
ts-explorer find-symbol-definition ./src/main.ts --symbol Dialog
```

**Output format**

The default output of the `find-symbol-definition` command is a JSON array of items of following types:

```ts
type SymbolDeclaration = {
  name: string;
  type: string;
  sourceFile: string;
  startLine: number;
  endLine: number;
};
```

The `sourceFile` contains the name of the source file defining the symbol. It is relative to the nearest `tsconfig.json` file.

## License

This project is licensed under the MIT license.
