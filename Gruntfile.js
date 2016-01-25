module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		serve: {
			options: {
				port: 9000,
				serve: {
					path: './source/'
				}
			}
		},
        concat: {
            
            "jquery-ui": {
                options: {
                      separator: ';',
                },
                src: [
                    'bower_components/jquery-ui/ui/core.js',
                    'bower_components/jquery-ui/ui/widget.js',
                    'bower_components/jquery-ui/ui/tabs.js'
                ],
                dest: 'bower_components/jquery-ui/jquery-ui.js'
            },
            
            sigma: {
                options: {
                      separator: ';',
                },
                src: [
                    "bower_components/sigma/src/sigma.core.js",
                    "bower_components/sigma/src/conrad.js",
                    "bower_components/sigma/src/utils/sigma.utils.js",
                    "bower_components/sigma/src/utils/sigma.polyfills.js",
                    "bower_components/sigma/src/sigma.settings.js",
                    "bower_components/sigma/src/classes/sigma.classes.dispatcher.js",
                    "bower_components/sigma/src/classes/sigma.classes.configurable.js",
                    "bower_components/sigma/src/classes/sigma.classes.graph.js",
                    "bower_components/sigma/src/classes/sigma.classes.camera.js",
                    "bower_components/sigma/src/classes/sigma.classes.quad.js",
                    "bower_components/sigma/src/classes/sigma.classes.edgequad.js",
                    "bower_components/sigma/src/captors/sigma.captors.mouse.js",
                    "bower_components/sigma/src/captors/sigma.captors.touch.js",
                    "bower_components/sigma/src/renderers/sigma.renderers.canvas.js",
                    "bower_components/sigma/src/renderers/sigma.renderers.webgl.js",
                    "bower_components/sigma/src/renderers/sigma.renderers.svg.js",
                    "bower_components/sigma/src/renderers/sigma.renderers.def.js",
                    "bower_components/sigma/src/renderers/webgl/sigma.webgl.nodes.def.js",
                    "bower_components/sigma/src/renderers/webgl/sigma.webgl.nodes.fast.js",
                    "bower_components/sigma/src/renderers/webgl/sigma.webgl.edges.def.js",
                    "bower_components/sigma/src/renderers/webgl/sigma.webgl.edges.fast.js",
                    "bower_components/sigma/src/renderers/webgl/sigma.webgl.edges.arrow.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.labels.def.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.hovers.def.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.nodes.def.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edges.def.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edges.curve.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edges.arrow.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edges.curvedArrow.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edgehovers.def.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edgehovers.curve.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edgehovers.arrow.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.edgehovers.curvedArrow.js",
                    "bower_components/sigma/src/renderers/canvas/sigma.canvas.extremities.def.js",
                    "bower_components/sigma/src/renderers/svg/sigma.svg.utils.js",
                    "bower_components/sigma/src/renderers/svg/sigma.svg.nodes.def.js",
                    "bower_components/sigma/src/renderers/svg/sigma.svg.edges.def.js",
                    "bower_components/sigma/src/renderers/svg/sigma.svg.edges.curve.js",
                    "bower_components/sigma/src/renderers/svg/sigma.svg.labels.def.js",
                    "bower_components/sigma/src/renderers/svg/sigma.svg.hovers.def.js",
                    "bower_components/sigma/src/middlewares/sigma.middlewares.rescale.js",
                    "bower_components/sigma/src/middlewares/sigma.middlewares.copy.js",
                    "bower_components/sigma/src/misc/sigma.misc.animation.js",
                    "bower_components/sigma/src/misc/sigma.misc.bindEvents.js",
                    "bower_components/sigma/src/misc/sigma.misc.bindDOMEvents.js",
                    "bower_components/sigma/src/misc/sigma.misc.drawHovers.js",
                    "bower_components/sigma/plugins/sigma.renderers.edgeLabels/settings.js",
                    "bower_components/sigma/plugins/sigma.renderers.edgeLabels/sigma.canvas.edges.labels.def.js",
                    "bower_components/sigma/plugins/sigma.renderers.edgeLabels/sigma.canvas.edges.labels.curve.js",
                    "bower_components/sigma/plugins/sigma.renderers.edgeLabels/sigma.canvas.edges.labels.curvedArrow.js"
                ],
                dest: 'bower_components/sigma/sigma.js',
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
        },
        jshint: {
            all: ['./source/js/*.js'],
            options: {
                esnext: true
            }
        },
        bowercopy: {
            source: {
                options: {
                    clean: false
                },
                files: {
                    "source/assets/lib/jquery/jquery.js" : "./jquery/dist/jquery.js",
                    "source/assets/lib/jquery-ui/jquery-ui.js" : "./jquery-ui/jquery-ui.js",
                    "source/assets/lib/jquery-ui/jquery-ui.css" : "./jquery-ui/themes/ui-lightness/jquery-ui.css",
                    "source/assets/lib/jquery-ui/images" : "./jquery-ui/themes/ui-lightness/images",
                    "source/assets/lib/jquery-ui/jquery-ui.js" : "./jquery-ui/jquery-ui.js",
                    "source/assets/lib/sigma/sigma.js" : "./sigma/sigma.js",
                    "source/assets/lib/w2ui/w2ui.js" : "./w2ui/w2ui-1.4.3.js",
                    "source/assets/lib/w2ui/w2ui.css" : "./w2ui/w2ui-1.4.3.css",
                    
                }
            }
        },
        htmlbuild: {
            dist: {
                src: 'index.html',
                dest: 'samples/',
                options: {
                    beautify: true,
                    prefix: '//some-cdn',
                    relative: true,
                    scripts: {
                        bundle: [
                            '<%= fixturesPath %>/scripts/*.js',
                            '!**/main.js',
                        ],
                        main: '<%= fixturesPath %>/scripts/main.js'
                    },
                    styles: {
                        bundle: [
                            '<%= fixturesPath %>/css/libs.css',
                            '<%= fixturesPath %>/css/dev.css'
                        ],
                        test: '<%= fixturesPath %>/css/inline.css'
                    },
                    sections: {
                        views: '<%= fixturesPath %>/views/**/*.html',
                        templates: '<%= fixturesPath %>/templates/**/*.html',
                        layout: {
                            header: '<%= fixturesPath %>/layout/header.html',
                            footer: '<%= fixturesPath %>/layout/footer.html'
                        }
                    },
                    data: {
                        // Data to pass to templates
                        version: "0.1.0",
                        title: "test",
                    },
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-html-build');
    grunt.loadNpmTasks('grunt-bowercopy');
	grunt.loadNpmTasks('grunt-serve');
    
    // task setup 
    grunt.registerTask('default', ['concat', 'jshint', 'bowercopy', 'htmlbuild', 'uglify']);
};