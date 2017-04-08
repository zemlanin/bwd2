import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'src/worker.js',
  format: 'iife',
  dest: 'build/worker.js',
  plugins: [
    nodeResolve({
      browser: true,
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ],
}
