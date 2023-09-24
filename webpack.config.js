const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'fabricate.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'fabricate',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
};
