module.exports = {
  entry: './src/main.js',
  exclude: /node_modules/,
  output: { path: __dirname + '/dist', filename: 'main.js' },
  module: { loaders: [ { test: /\.jsx?$/, loader: 'babel' } ] },
  plugins: [
    new require('copy-webpack-plugin')([
      { from: './src/index.html' },
      { from: './assets', to: './assets'},
      { from: './data', to: './data'},
      { from: './src/vendor', to: './vendor'},
    ])
  ],
  externals: {
    aframe: 'AFRAME',
    loess: 'LOESS'
  }
}
