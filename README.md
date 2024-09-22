# `@bertrand.fritsch/ts-explorer`

![npm](https://img.shields.io/npm/v/@bertrand.fritsch/ts-explorer) ![npm](https://img.shields.io/npm/dw/@bertrand.fritsch/ts-explorer) ![GitHub issues](https://img.shields.io/github/issues/bertrandfritsch/ts-explorer) ![GitHub forks](https://img.shields.io/github/forks/bertrandfritsch/ts-explorer) ![GitHub stars](https://img.shields.io/github/stars/bertrandfritsch/ts-explorer) ![Release](https://github.com/bertrandfritsch/ts-explorer/actions/workflows/release.yml/badge.svg?branch=master)

## Overview

`@bertrand.fritsch/ts-explorer` is a CLI tool for analyzing TypeScript code. The commands include:

### Commands

| Command | Description | Input Type |
| --- | --- | --- |
| `get-project-root-directory` | Get the project's root directory path. | `tsconfig.json` file or source file |
| `get-project-config` | Retrieve the project configuration. | source file |
| `get-project-file-list` | List all files in a project. | `tsconfig.json` file or source file |
| `get-file-list` | Recursively list files from provided source files. | one or more souce files |
| `get-dependency-graph` | Generate a dependency graph for TypeScript files. | one or more souce files |
| `get-item-dependency-graph` | Generate a detailed dependency graph for a specific item. | one or more souce files |
| `get-item-imported-files` | List files that import a specific item. | one or more souce files |
| `get-external-imports` | List external imports (npm packages) in TypeScript files. | one or more souce files |
| `find-symbol-definition` | Find the definition of a symbol in a project. | `tsconfig.json` file or source file |
| `run-plugin` | Execute a plugin. | compiled plugin file |

### Usage

#### `get-project-root-directory`

Get the absolute path to the project's root directory.
```bash
ts-explorer get-project-root-directory <tsconfig.json file or source file>
```

#### `get-project-config`

Retrieve the project configuration.
```bash
ts-explorer get-project-config <source file>
```

#### `get-project-file-list`

List all files in a project.
```bash
ts-explorer get-project-file-list <tsconfig.json file or source file>
```

#### `get-file-list`

Recursively list files accessible from provided source files.
```bash
ts-explorer get-file-list <source file...>
```

#### `get-dependency-graph`

Generate a dependency graph for TypeScript files.
```bash
ts-explorer get-dependency-graph <source file...> [--recursive]
```

#### `get-item-dependency-graph`

Generate a detailed dependency graph for a specific item.
```bash
ts-explorer get-item-dependency-graph <source file...> --item <item...> [--highlight-paths-to <item...>] [--keep-full-path]
```

* `--highlight-paths-to` option: Highlight paths to specific internal imports.
* `--keep-full-path` option: Keep absolute paths in the output.

#### `get-item-imported-files`

Get the source files that import a specific item.
Walk recursively through the imports of the specified source files.
```bash
ts-explorer get-item-imported-files <source file...> --item <item...>
```

#### `get-external-imports`

Get the list of external imports (npm packages) imported by the specified source files.
```bash
ts-explorer get-external-imports <source file...> [--recursive]
```

#### `find-symbol-definition`

Find the definition of a symbol in a project.
```bash
ts-explorer find-symbol-definition <tsconfig.json file or source file> --symbol <symbol>
```

Returns a stringified JSON array of objects for each instance of the symbol found in the project, with the following structure:
```json5
[
  {
    "name": "<symbol>",
    "type": "<type>",
    "sourceFile": "<source file>", // path of the source file relative to the nearest tsconfig.json
    "startLine": <start line>,     // start line of the definition of the symbol in the source file
    "endLine": <end line>          // end line of the definition of the symbol in the source file
  }
]
```

#### `run-plugin`

Execute a plugin.

```bash
ts-explorer run-plugin --plugin <compiled plugin file> [--option <key=value>...]
```

* `--plugin` option: Path to the compiled plugin file.
* `--option` option: Optional named arguments in the form of key-value pairs.

The plugin must export a function named `executePlugin` with following signature:

```typescript
type PluginOptions = Record<string, string | undefined>
type PluginFunction = (options: PluginOptions) => Promise<void>
```

The plugin is responsible for parsing options, which are provided as strings. The companion library includes helper functions to parse string, numerical, and boolean options. A boolean option without a value is considered true.

### Notes

* Some commands accept multiple source files separated by a space: `<source file...>`. Glob patterns are not supported.
* Some commands accept either the project `tsconfig.json` file or any source file from the project. It will be used to retrieve the closest `tsconfig.json` file.
* `ts-explorer` does not support input pipes.
* **Important**: If only a `tsconfig.json` file is provided, only commands that explicitly support `tsconfig.json` files as input can be used. Commands that require one or more source files as input will not work with a `tsconfig.json` file alone.
* Output paths are relative to the nearest `tsconfig.json`.
* `--item` options can specify one of the following kind of items:
  - An external library (e.g., `react`).
  - A specific item from an external library (e.g., `react#useMemo`).
  - A project file (e.g., `app/dir/helper`).
  - A specific item from a project file (e.g., `app/dir/helper#convertToString`).

### Error Handling

* Exit code `0`: Success
* Non-zero exit codes: Errors, with messages output to `stderr`.

### License

Licensed under the MIT License.
