import path from 'path';
import { fileURLToPath } from 'url';
import nodeExternals from 'webpack-node-externals';

// Emulate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: 'production',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.json$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 10KB
                    },
                },
            },
        ],
    },
    devtool: 'source-map', // Enable source maps
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json'],
    },
    output: {
        filename: 'server.js',
        path: path.resolve(path.dirname(''), 'dist'),
        assetModuleFilename: 'assets/[name][ext]',
    },
    target: 'node',
    externals: [nodeExternals()],
    resolve: {
        alias: {
            '@models': path.resolve(__dirname, '../models'),
        },
    }
    // resolve: {
    //     fallback: {
    //         zlib: false,
    //         util: false,
    //         querystring: false,
    //         path: false,
    //         url: false,
    //     },
    // },
};