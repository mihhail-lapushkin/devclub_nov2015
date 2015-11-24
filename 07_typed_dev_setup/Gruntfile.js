module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt)
  
  grunt.initConfig({    
    concurrent: {
      dev: {
        options: {
          logConcurrentOutput: true
        },
        tasks: [
          'nodemon:dev',
          'watch'
        ]
      }
    },

    nodemon: {
      dev: {
        options: {
          nodeArgs: [
            '--debug'
          ],
          watch: [
            'server'
          ],
          ext: '*',
          delay: 0,
          callback: function (nodemon) {
            nodemon.on('restart', function() {
              setTimeout(triggerLivereload, 200)
            })
          }
        },

        script: 'server/start'
      }
    },

    watch: {
      options: {
        interrupt: true,
        livereload: true
      },

      livereloadTrigger: {
        files: '.livereloadTrigger'
      },

      node: {
        options: {
          livereload: false
        },

        files: [
          'src/server/**/*'
        ],
        tasks: 'ts:dev'
      },

      scripts: {
        files: [
          'src/client/scripts/**/*'
        ],
        tasks: 'browserify:dev'
      },

      styles: {
        files: [
          'src/client/styles/**/*'
        ],
        tasks: 'stylus:dev'
      },

      templates: {
        files: [
          'src/client/templates/**/*'
        ],
        tasks: 'jade:dev'
      }
    },

    browserify: {
      options: {
        plugin: [
          'tsify'
        ],
        browserifyOptions: {
          debug: true
        }
      },

      dev: {
        files: {
          'public/client.js': [ 'src/client/scripts/**/*', 'typings/**/*' ]
        }
      }
    },

    stylus: {
      options: {
        compress: false
      },

      dev: {
        files: {
          'public/client.css': 'src/client/styles/main.styl'
        }
      }
    },

    jade: {
      dev: {
        files: {
          'public/index.html': 'src/client/templates/index.jade'
        }
      }
    },

    ts: {
      dev: {
        src: [ 'src/server/**/*', 'typings/**/*' ],
        outDir: 'server',
        options: {
          sourceMap: true,
          module: 'commonjs',
          target: 'es5'
        }
      }
    }
  })

  function triggerLivereload() {
    grunt.file.write('.livereloadTrigger', new Date().getTime())
  }

  grunt.registerTask('writeLivereloadTrigger', triggerLivereload)
  
  grunt.registerTask('dev', [
    'writeLivereloadTrigger',
    'browserify:dev',
    'stylus:dev',
    'browserify:dev',
    'jade:dev',
    'ts:dev',
    'concurrent:dev'
  ])
}