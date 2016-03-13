module.exports = function(config) {
  config.set({
    
    frameworks: ['jasmine'],
    
    files: [
      { pattern: 'test.bundle.js', watched: false }
    ],

    preprocessors: {
      'test.bundle.js': ['webpack']
    },

    webpack: {
      resolve: {
        extensions: ['', '.ts', '.js', '.css'],
      },
      module: {
        loaders: [
          { test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/}
        ]
      }
    },

    webpackServer: {
      noInfo: true
    },

    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['PhantomJS'],
    singleRun: true
  })
}