import pkg from './package.json';
import clear from 'rollup-plugin-clear';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const banner = `
/**
 * ${pkg.name}@${pkg.version}
 * ${pkg.description}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @license ${pkg.license}
 */`;

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        banner,
    },
    external: ['tslib', 'lodash-es'],
    plugins: [
        clear({
            targets: ['dist'],
        }),
        typescript(),
        // terser(),
    ],
};
