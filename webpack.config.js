const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup.js',
    background: './src/background.js',
    notes: './src/notes.js', // Added notes entry
    blocker: './src/blocker.js',
    stats: './src/stats.js' // Added stats entry
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      chunks: ['popup'], // injects only popup.js automatically
    }),
    new HtmlWebpackPlugin({
      template: './src/notes.html',
      filename: 'notes.html',
      chunks: ['notes'], // injects only notes.js
    }),
    new HtmlWebpackPlugin({  // ADD THIS!
        template: './src/blocker.html',
        filename: 'blocker.html',
        chunks: ['blocker']
      }),
    new HtmlWebpackPlugin({  // ADD THIS!
        template: './src/stats.html',
        filename: 'stats.html',
        chunks: ['stats']
      }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icon.png', to: 'icon.png' }
      ]
    })
  ],

  performance: {
    maxAssetSize: 400000, // 400 KiB
    maxEntrypointSize: 400000, // 400 KiB
    hints: 'warning'
  }
};

