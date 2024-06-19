# `@bfr/ts-explorer`

This is a TypeScript code exploration tool that allows you to generate a dependency graph of a set of TypeScript files and get a list of files.

## Installation

You can install this package via npm:

```bash
npm install @bfr/ts-explorer
```
## Usage
This package provides two main commands:  

`get-dependency-graph`

This command generates the dependency graph of a set of TypeScript files.

```bash
npx @bfr/ts-explorer get-dependency-graph <input source file> | <input json file> [--recursive]
```
The `--recursive` option allows the internal dependencies to be processed recursively.

**Example**

```bash
npx @bfr/ts-explorer get-dependency-graph ./src/main.ts --recursive
```
`get-file-list`

This command generates a list of files.

```bash
npx @bfr/ts-explorer get-file-list <input source file> | <input json file>
```
**Example**

```bash
npx @bfr/ts-explorer get-file-list ./src/main.ts
```

## License

This project is licensed under the MIT license.
