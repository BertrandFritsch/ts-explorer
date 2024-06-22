# `@bertrand.fritsch/ts-explorer`

![npm](https://img.shields.io/npm/v/@bertrand.fritsch/ts-explorer)
![npm](https://img.shields.io/npm/dw/@bertrand.fritsch/ts-explorer)
![GitHub issues](https://img.shields.io/github/issues/bertrandfritsch/ts-explorer)
![GitHub forks](https://img.shields.io/github/forks/bertrandfritsch/ts-explorer)
![GitHub stars](https://img.shields.io/github/stars/bertrandfritsch/ts-explorer)
![Release](https://github.com/bertrandfritsch/ts-explorer/actions/workflows/release.yml/badge.svg?branch=master)

This is a TypeScript code exploration tool that allows you to generate a dependency graph of a set of TypeScript files and get a list of files.

## Installation

You can install this package via npm:

```bash
npm install @bertrand.fritsch/ts-explorer
```
## Usage
This package provides two main commands:  

`get-dependency-graph`

This command generates the dependency graph of a set of TypeScript files.

```bash
npx @bertrand.fritsch/ts-explorer get-dependency-graph <input source file> | <input json file> [--recursive]
```
The `--recursive` option allows the internal dependencies to be processed recursively.

**Example**

```bash
npx @bertrand.fritsch/ts-explorer get-dependency-graph ./src/main.ts --recursive
```
`get-file-list`

This command generates a list of files.

```bash
npx @bertrand.fritsch/ts-explorer get-file-list <input source file> | <input json file>
```
**Example**

```bash
npx @bertrand.fritsch/ts-explorer get-file-list ./src/main.ts
```

## License

This project is licensed under the MIT license.