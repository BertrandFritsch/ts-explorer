import {build} from 'esbuild'
import copy from 'esbuild-plugin-copy'

await build({
  entryPoints: ['src/main.mts'],
  define: {
    'process.env.NODE_ENV': '"production"',
    __filename: '"-"',
  },
  bundle: true,
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  outfile: 'dist/bin/main.mjs',
  format: 'esm',
  target: 'esnext',
  platform: 'node',
  plugins: [
    copy({
      assets: [{ from: 'src/cli.mjs', to: './' }],
      verbose: true,
    }),
  ],
  banner: {
    js: `
      // see https://github.com/evanw/esbuild/issues/1921
      const require = (await import("node:module")).createRequire(import.meta.url);
    `,
  },
})
