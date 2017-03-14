import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import livereload from "rollup-plugin-livereload"
import serve from "rollup-plugin-serve"

const args = require('minimist')(process.argv.slice(2))

export default {
  entry: 'src/index.js',
  format: 'iife',
  dest: 'build/out.js',
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs({
      include: 'node_modules/**'
    }),
    args.w ? serve({contentBase: 'build', port: 4444}) : null,
    args.w ? livereload({watch: 'build'}) : null,
  ].filter(Boolean),
}
