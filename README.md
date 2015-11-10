# gulp-google-webfonts

A gulp plugin to download Google webfonts and generate a stylesheet for them.

# Example #1

## Input

### fonts.list (using Google format)

	Oswald:400,700&subset=latin,latin-ext
	Roboto:500,500italic&subset=greek

### fonts.list (using tab-delimeted format, tabs shown as pipes)

	Oswald    | 400,700          | latin,latin-ext
	Roboto    | 500,500italic    | greek

### gulpfile.js

	var gulp = require('gulp');
	var googleWebFonts = require('gulp-google-webfonts');
	
	gulp.task('fonts', function () {
		return gulp.src('./fonts.list')
			.pipe(googleWebFonts())
			.pipe(gulp.dest('out/fonts'))
			;
	});

## Output

	gulp fonts

### ls -1 out/fonts/

	fonts.css
	Oswald-normal-400.woff
	Oswald-normal-700.woff
	Roboto-italic-500.woff
	Roboto-normal-500.woff

### cat out/fonts/fonts.css

	@font-face {
		font-family: 'Oswald';
		font-style: normal;
		font-weight: 400;
		src: url(./Oswald-normal-400.woff) format('woff');
	}

	@font-face {
		font-family: 'Oswald';
		font-style: normal;
		font-weight: 700;
		src: url(./Oswald-normal-700.woff) format('woff');
	}

	@font-face {
		font-family: 'Roboto';
		font-style: normal;
		font-weight: 500;
		src: url(./Roboto-normal-500.woff) format('woff');
	}

	@font-face {
		font-family: 'Roboto';
		font-style: italic;
		font-weight: 500;
		src: url(./Roboto-italic-500.woff) format('woff');
	}

# Options

The googleWebFonts object can take the following options:

 * fontsDir - The path the output fonts should be under. (Note: the path is relative to `gulp.dest`)
 * cssDir - The path the output css should be under. (Note: the path is relative to `gulp.dest`)
 * cssFilename - The filename of the output css file.

# Example #2

## Input (other inputs same as example #1)

### gulpfile.js

	var options = {
		fontsDir: 'googlefonts/',
		cssDir: 'googlecss/',
		cssFilename: 'myGoogleFonts.css'
	};
	
	gulp.task('fonts', function () {
		return gulp.src('./fonts.list')
			.pipe(googleWebFonts(options))
			.pipe(gulp.dest('out/'));
	});

## Output

### find out/

	out/
	out/fonts
	out/fonts/googlecss
	out/fonts/googlecss/myGoogleFonts.css
	out/fonts/googlefonts
	out/fonts/googlefonts/Oswald-normal-700.woff
	out/fonts/googlefonts/Roboto-italic-500.woff
	out/fonts/googlefonts/Roboto-normal-500.woff
	out/fonts/googlefonts/Oswald-normal-400.woff
