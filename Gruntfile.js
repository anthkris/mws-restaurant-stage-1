/*
 After you have changed the settings under responsive_images
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: "gm",
          sizes: [{
            width: 800,
            suffix: "_large",
            quality: 50
          },
          {
            width: 600,
            suffix: "_medium",
            quality: 50
          },
          {
            width: 300,
            suffix: "_small",
            quality: 50
          }]
        },

        files: [{
          expand: true,
          src: ["*.{gif,jpg,png}"],
          cwd: "img/",
          dest: "images_responsive/"
        }]
      }
    },
    browserify: {
      dev: {
        src: ['sw.js'],
        dest: 'sw_browserified.js',
        options: {
          debug: true,
          transform: [
            ['babelify', {presets: 'es2015'}]
          ],
          extensions: ['.js'],
        },
      }
    },
    clean: {
      dev: {
        src: ["images_responsive/"],
      },
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ["images_responsive"]
        },
      },
    }
  });

  grunt.loadNpmTasks("grunt-responsive-images");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.loadNpmTasks('grunt-browserify');
  grunt.registerTask("default", ["clean", "mkdir", "responsive_images", "browserify"]);
};
