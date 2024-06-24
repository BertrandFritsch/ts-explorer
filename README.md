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

[**`get-dependency-graph`**](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cget-dependency-graph.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-dependency-graph.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-dependency-graph.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/get-dependency-graph.mts")

This command generates the dependency graph of a set of TypeScript files.

```bash
ts-explorer get-dependency-graph <input source file> | <input json file> [--recursive]
```
The `--recursive` option allows the internal dependencies to be processed recursively.

**Example**

```bash
ts-explorer get-dependency-graph ./src/main.ts --recursive
```

[**`get-file-list`**](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cget-file-list.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-file-list.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-file-list.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/get-file-list.mts")

Get the list of files from a project starting from a source file.

```bash
ts-explorer get-file-list <input source file> | <input json file>
```
**Example**

```bash
ts-explorer get-file-list ./src/main.ts
```

[**`get-item-dependency-graph`**](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cget-dependency-graph.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-dependency-graph.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-dependency-graph.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/get-dependency-graph.mts")

This command provides a detailed dependency graph for a specific item within a set of TypeScript files, highlighting the paths and dependencies related to the specified item. It offers a focused view of its connections within the project, useful for understanding the structure and dependencies of complex items.

```bash
ts-explorer get-item-dependency-graph <input source file> | <input json file> [--item <item...>] [--highlight-paths-to <item...>] [--keep-full-path] [--output-format <format>] [--depth <depth>]
```

- `--item <item...>`: Specifies the items to look for in the format `<module> [ #(default | <item>) ]`. This option is mandatory.
- `--highlight-paths-to <item...>`: Highlights the path to intermediate internal items in the format `<module> [ #(default | <item>) ]`, providing a clear visual representation of how the items are integrated within the project.
- `--keep-full-path`: When set, the full path of the module will be kept in the output, otherwise, a simplified path or identifier may be used.

**Example**

```bash
ts-explorer get-item-dependency-graph ./src/utils.ts --item "MyModule#MyUtilFunction" --highlight-paths-to "MyModule#MyOtherFunction" --keep-full-path
```

This example generates a dependency graph for the `./src/utils.ts` file, focusing on `MyUtilFunction` within `MyModule`, highlighting paths leading to `MyOtherFunction` within the same module, keeping the full path of the module in the output, limiting the analysis to dependencies up to two levels deep, and outputs the graph in a format compatible with Cytoscape.js.

**Output Format**

The default output of the [`get-item-dependency-graph`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cget-dependency-graph.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-dependency-graph.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-dependency-graph.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/get-dependency-graph.mts") command is formatted as an array of [`ElementDefinition`](https://js.cytoscape.org/#notation/elements-json) objects, compatible with [Cytoscape.js](https://js.cytoscape.org/), a popular graph visualization library. This format includes nodes and edges, where nodes represent files or items, and edges represent dependencies between them.

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

[**`get-item-imported-files`**](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cget-item-imported-files.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-item-imported-files.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-item-imported-files.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/get-item-imported-files.mts")

Get the list of files that are importing an item.

```bash
ts-explorer get-item-imported-files <input source file> | <input json file> -i <item...>
```

* `-i, --item <item...>`: Specifies the items to look for. The format is `<module> [ #(default | <item>) ]`. This option is mandatory.

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

[**`get-external-imports`**](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cget-external-imports.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-external-imports.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Fget-external-imports.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/get-external-imports.mts")

Get external imports of a set of TypeScript files.

```bash
ts-explorer get-external-imports <input source file> | <input json file> [--recursive]
```
The `--recursive` option allows the internal dependencies to be processed recursively.

**Example**

```bash
ts-explorer get-external-imports ./src/main.ts --recursive
```

[**`find-symbol-definition`**](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cfind-symbol-definition.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Ffind-symbol-definition.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Ffind-symbol-definition.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/find-symbol-definition.mts")

This command helps locate the definition of a symbol in TypeScript files. Note that there may be multiple results.

```bash
ts-explorer find-symbol-definition <input source file> [--symbol <symbol>]
```

* `<input source file>`: can be either a single source file, or a JSON file containing a list of source files
* `--symbol <symbol>`: Specifies the symbol to find. This option is mandatory.

**Example**

```bash
ts-explorer find-symbol-definition ./src/utils.ts --symbol "MyUtilFunction"
```

**Output format**

The default output of the [`find-symbol-definition`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22c%3A%5C%5CUsers%5C%5CBertrand%5C%5Cwork%5C%5Cts-explorer%5C%5Cpackages%5C%5Cts%5C%5Csrc%5C%5Cfind-symbol-definition.mts%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fc%253A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Ffind-symbol-definition.mts%22%2C%22path%22%3A%22%2Fc%3A%2FUsers%2FBertrand%2Fwork%2Fts-explorer%2Fpackages%2Fts%2Fsrc%2Ffind-symbol-definition.mts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A0%2C%22character%22%3A0%7D%5D "packages/ts/src/find-symbol-definition.mts") command is a JSON array of items of following types:

```ts
type SymbolDeclaration = {
  name: string;
  type: string;
  sourceFile: string;
  startLine: number;
  endLine: number;
};
```

The `sourceFile` contains the name of the source file defining the symbol. It is relative to the root of the project.

## License

This project is licensed under the MIT license.
