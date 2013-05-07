module.exports = function ( grunt ) {

	'use strict';

	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		meta: {
			banner: '/* Points - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
				' * <%= pkg.description %>\n\n' +
				' * <%= pkg.homepage %>\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
				' Released under the MIT License */\n' +
				'\n' +
				//'/*jslint eqeq: true, plusplus: true */\n' +
				//'/*global document, HTMLElement */\n' +
				'\n\n'
		},

		jshint: {
			jshintrc: '.jshintrc'
		},

		concat: {
			build: {
				options: {
					banner: '<%= meta.banner %>'
				},
				src: [ 'src/Points.js' ],
				dest: 'build/Points.js'
			}
		},

		uglify: {
			build: {
				src: '<%= concat.build.dest %>',
				dest: 'build/Points.min.js'
			}
		},

		copy: {
			release: {
				files: [{
					expand: true,
					cwd: 'build/',
					src: '**/*',
					dest: 'release/<%= pkg.version %>/'
				}]
			},
			shortcut: {
				files: [{
					expand: true,
					cwd: 'build/',
					src: '**/*',
					dest: ''
				}]
			}
		}
	});

	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );

	grunt.registerTask( 'default', [ 'jshint', 'concat', 'uglify' ] );
	grunt.registerTask( 'release', [ 'default', 'copy' ] );

};