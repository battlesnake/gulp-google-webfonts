# gulp-google-webfonts

A gulp plugin to download Google webfonts and generate a stylesheet for them.

# Example #1

## Input

### fonts.list

	# Tab-delimeted format
	Oswald	400,700	latin,latin-ext
	
	# Google format
	Roboto:500,500italic&subset=greek

### gulpfile.js

	var gulp = require('gulp');
	var googleWebFonts = require('gulp-google-webfonts');
	
	var options = { };
	
	gulp.task('fonts', function () {
		return gulp.src('./fonts.list')
			.pipe(googleWebFonts(options))
			.pipe(gulp.dest('out/fonts'))
			;
		});
	
	gulp.task('default', ['fonts']);

## Output

	gulp fonts

### out/fonts/

	fonts.css
	Oswald-normal-400.woff
	Oswald-normal-700.woff
	Roboto-italic-500.woff
	Roboto-normal-500.woff

### out/fonts/fonts.css

	@font-face {
		font-family: 'Oswald';
		font-style: normal;
		font-weight: 400;
		src: url(Oswald-normal-400.woff) format('woff');
	}
	
	@font-face {
		font-family: 'Oswald';
		font-style: normal;
		font-weight: 700;
		src: url(Oswald-normal-700.woff) format('woff');
	}
	
	@font-face {
		font-family: 'Roboto';
		font-style: normal;
		font-weight: 500;
		src: url(Roboto-normal-500.woff) format('woff');
	}
	
	@font-face {
		font-family: 'Roboto';
		font-style: italic;
		font-weight: 500;
		src: url(Roboto-italic-500.woff) format('woff');

# Options

The googleWebFonts object can take the following options:

 * fontsDir - The path the output fonts should be under. (Note: the path is relative to `gulp.dest`)
 * cssDir - The path the output css should be under. (Note: the path is relative to `gulp.dest`)
 * cssFilename - The filename of the output css file.

# Example #2

## Input (other inputs same as example #1)

### gulpfile.js

	var gulp = require('gulp');
	var googleWebFonts = require('gulp-google-webfonts');
	
	var options = {
		fontsDir: 'googlefonts/',
		cssDir: 'googlecss/',
		cssFilename: 'myGoogleFonts.css'
	};
	
	gulp.task('fonts', function () {
		return gulp.src('./fonts.list')
			.pipe(googleWebFonts(options))
			.pipe(gulp.dest('out/fonts'))
			;
		});
	
	gulp.task('default', ['fonts']);

## Output

	gulp fonts

### out/

	./fonts/googlecss/myGoogleFonts.css
	./fonts/googlefonts/Oswald-normal-400.woff
	./fonts/googlefonts/Oswald-normal-700.woff
	./fonts/googlefonts/Roboto-italic-500.woff
	./fonts/googlefonts/Roboto-normal-500.woff

# Example #3

Command-line usage

## Input

### Makefile

	PATH := ./node_modules/.bin:$(PATH)
	
	out := out
	
	fonts_list := fonts.list
	fonts_dir := fonts
	css_dir := css
	css_filename := fonts.css
	
	.PHONY: default fonts clean
	
	default: fonts
	
	clean:
		rm -rf -- $(out)
	
	fonts:
		google-webfonts < $(fonts_list) --out-base-dir $(out) --fonts-dir $(fonts_dir) --css-dir $(css_dir) --css-filename $(css_filename)

### fonts.list

	Lato	300,400,400italic	latin,greek
	Roboto	400					latin,latin-ext

## Output

	make

### out/

	./css/fonts.css
	./fonts/Roboto-normal-400.woff
	./fonts/Lato-normal-300.woff
	./fonts/Lato-italic-400.woff
	./fonts/Lato-normal-400.woff

### out/css/fonts.css

	@font-face {
		font-family: 'Lato';
		font-style: normal;
		font-weight: 300;
		src: url(fonts/Lato-normal-300.woff) format('woff');
	}
	
	@font-face {
		font-family: 'Lato';
		font-style: normal;
		font-weight: 400;
		src: url(fonts/Lato-normal-400.woff) format('woff');
	}
	
	@font-face {
		font-family: 'Lato';
		font-style: italic;
		font-weight: 400;
		src: url(fonts/Lato-italic-400.woff) format('woff');
	}
	
	@font-face {
		font-family: 'Roboto';
		font-style: normal;
		font-weight: 400;
		src: url(fonts/Roboto-normal-400.woff) format('woff');
