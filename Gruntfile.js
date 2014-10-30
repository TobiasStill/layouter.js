module.exports = function (grunt) {
//load plugins
    ['grunt-jsdoc', 'grunt-contrib-jshint'].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

//configure plugins
    grunt.initConfig({
        jsdoc: {
            dist: {
                src: ['src/*.js', 'src/*/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },
        jshint: {
            app: ['src/*.js', 'src/*/*.js'],
            qa: []
        }
    });
//register tasks
    grunt.registerTask('default', ['jshint', 'jsdoc']);
};