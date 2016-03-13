module.exports = {
  entry: {
    app: ['webpack/hot/dev-server', './src/index.ts'],
    vendor: [
      'es6-shim',
      'angular2/bundles/angular2-polyfills'
    ]
  },
  
  output: {
    path: __dirname + '/dist/',
    filename: '[name].js',
    publicPath: '/dist/'
  },
  
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader', exclude: '/node_modules/' }
    ]
  }
  
};