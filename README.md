# gulp-google-webfonts

A gulp plugin to download Google webfonts and generate a stylesheet for them.

## Input

### fonts.list

    Oswald:400,700
    Roboto:400,500,700,400italic,500italic,700italic

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

`gulp fonts`

### ls out/fonts/

    fonts.css
    Oswald-normal-400.woff
    Oswald-normal-700.woff
    Roboto-italic-400.woff
    Roboto-italic-500.woff
    Roboto-italic-700.woff
    Roboto-normal-400.woff
    Roboto-normal-500.woff
    Roboto-normal-700.woff

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
    	font-weight: 400;
    	src: url(Roboto-normal-400.woff) format('woff');
    }
    
    @font-face {
    	font-family: 'Roboto';
    	font-style: normal;
    	font-weight: 500;
    	src: url(Roboto-normal-500.woff) format('woff');
    }
    
    @font-face {
    	font-family: 'Roboto';
    	font-style: normal;
    	font-weight: 700;
    	src: url(Roboto-normal-700.woff) format('woff');
    }
    
    @font-face {
    	font-family: 'Roboto';
    	font-style: italic;
    	font-weight: 400;
    	src: url(Roboto-italic-400.woff) format('woff');
    }
    
    @font-face {
    	font-family: 'Roboto';
    	font-style: italic;
    	font-weight: 500;
    	src: url(Roboto-italic-500.woff) format('woff');
    }
    
    @font-face {
    	font-family: 'Roboto';
    	font-style: italic;
    	font-weight: 700;
    	src: url(Roboto-italic-700.woff) format('woff');
    }

## Options

The googleWebFonts object can take the following options:

* fontsDir - The path the output fonts should be under. (Note: the path is relative to `gulp.dest`)
* cssDir - The path the output css should be under. (Note: the path is relative to `gulp.dest`)
* cssFilename - The filename of the output css file.

### Example:

````javascript
gulp.task('googlefonts', function () {
    return gulp.src(paths.src +'/assets/fonts.list')
        .pipe(googleWebFonts({fontsDir: 'googlefonts', cssDir: 'googlecss', cssFilename: 'myGoogleFonts.css'}))
        .pipe(gulp.dest(paths.src +'/assets/'));
});
````

Will create the following directory structure:
```
assets
│
└───googlefonts
    │   *.woff font files
    |
    └───googlecss
    │   myGoogleFonts.css
```
