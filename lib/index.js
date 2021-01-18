const { join, resolve } = require('path')

module.exports = function (moduleOptions) {
  // Inject Model
  this.addTemplate({
    src: join(__dirname, './utils/model.js'),
    fileName: 'dewib/api/model.js'
  })

  // Inject plugin
  this.addPlugin({
    src: join(__dirname, './plugin.js'),
    fileName: 'dewib/api/plugin.js'
  })

  // Inject babel transpilation
  this.nuxt.hook('build:before', (nuxt, buildOptions) => {
    buildOptions.transpile = buildOptions.transpile || []

    buildOptions.transpile.push('@dewib/dw-api')
  })

  // Inject dewib alias
  this.nuxt.hook('webpack:config', (configs) => {
    for (const config of configs.filter(c => ['client', 'modern', 'server'].includes(c.name)))
      config.resolve.alias['@dewib/dw-api/utils'] = resolve(__dirname, './utils')
  })
}
