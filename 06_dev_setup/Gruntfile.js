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

      scripts: {
        files: [
          'client/scripts/**/*'
        ],
        tasks: 'browserify:dev'
      },

      styles: {
        files: [
          'client/styles/**/*'
        ],
        tasks: 'stylus:dev'
      },

      templates: {
        files: [
          'client/templates/**/*'
        ],
        tasks: 'jade:dev'
      }
    },

    browserify: {
      options: {
        transform: [
          'es6ify'
        ],
        browserifyOptions: {
          debug: true
        }
      },

      dev: {
        files: {
          'public/client.js': 'client/scripts/**/*'
        }
      }
    },

    stylus: {
      options: {
        compress: false
      },

      dev: {
        files: {
          'public/client.css': 'client/styles/main.styl'
        }
      }
    },

    jade: {
      dev: {
        files: {
          'public/index.html': 'client/templates/index.jade'
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
    'jade:dev',
    'concurrent:dev'
  ])
}