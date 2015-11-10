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
