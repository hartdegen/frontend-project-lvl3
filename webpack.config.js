// import path from 'path';
// import HtmlWebpackPlugin from 'html-webpack-plugin';
// import { CleanWebpackPlugin } from 'clean-webpack-plugin';
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[contenthash].js',
  },
  resolve: {
    extensions: ['.js', '.json', '.png'],
  },
  devServer: {
    open: true,
    port: 4200,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new CleanWebpackPlugin(),
  ],
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.(png|jpe?g|svg|gif)$/,
      use: 'file-loader',
    },
    ],
  },
};
