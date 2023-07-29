module.exports = function (grunt) {  
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);  

    // Project configuration.  
    grunt.initConfig({  
        pkg: grunt.file.readJSON('package.json'),  
        cssmin: {  
            sitecss: {  
                options: {  
                    banner: ''  
                },  
                files: {  
                    'threedeetris.min.css': [  
                        'css/base.css']  
                }  
            }  
        },  
        uglify: {  
            options: {  
                compress: true 
            },  
            applib: {  
                src: [  
                'src/*.js'  
                ],  
                dest: 'threedeetris.min.js'  
            }  
        }  
    });  
    grunt.registerTask('default', ['uglify', 'cssmin']);  
};