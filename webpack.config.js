const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'production',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    devtool: 'source-map', // Enable source maps
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname, 'dist'),
    },
    target: 'node',
    externals: [nodeExternals()],
};