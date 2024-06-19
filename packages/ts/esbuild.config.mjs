import {build} from 'esbuild'
import copy from 'esbuild-plugin-copy'

await build({
  entryPoints: ['src/main.mts'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  bundle: true,
  minify: true,
  sourcemap: false,
  logLevel: 'info',
  outfile: 'dist/bin/main.mjs',
  format: "esm",
  target: "esnext",
  platform: "node",
  plugins: [
    copy({
      assets: [
        { from: 'src/cli.mjs', to: './' },
        { from: '../../README.md', to: './' },
      ],
      verbose: true,
    }),
  ],
})
