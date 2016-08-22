#!/usr/bin/node --use_strict

var http = require('http');
var path = require('path');
var async = require('async');
var _ = { defaults: require('lodash.defaults') };

var isGulp = !!module.parent;

if (isGulp) {
	var through = require('through2');
	var File = require('vinyl');

	module.exports = getter;
} else {
	var fs = require('fs');
	var mkdirp = require('mkdirp');
}

var defaultOptions = {
	cssFilename: 'fonts.css',
	fontsDir: './',
	cssDir: './',
	outBaseDir: '',
	host: 'fonts.googleapis.com',
	hostPath: 'css',
	format: 'woff'
};

var formatData = {
	'woff': {
		'extension': 'woff',
		'agent': 'Mozilla/4.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36',
		'format': 'woff'
	},
	'woff2': {
		'extension': 'woff2',
		'agent': 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36',
		'format': 'woff2'
	},
	'ttf': {
		'extension': 'ttf',
		'agent': 'Unknown',
		'format': 'truetype'
	}
};

var debug = process.env.debug || process.env.DEBUG;

function verbose(msg) {
	if (debug) {
		process.stderr.write(msg + '\n');
	}
}

if (!isGulp) {
	var cmd = require('commander')
		.version(require('./package.json').version)
		.option('--css-filename [filename]', 'Name for output CSS file', defaultOptions.cssFilename)
		.option('--css-dir [path]', 'CSS output directory', defaultOptions.fontsDir)
		.option('--fonts-dir [path]', 'Fonts output directory', defaultOptions.cssDir)
		.option('--out-base-dir [path]', 'Base path to output directory, prepended to cssDir/fontsDir', defaultOptions.outBaseDir)
		.option('--host [domain]', 'Host to query ("fonts.googleapis.com")', defaultOptions.host)
		.option('--host-path [path]', 'Host path for query ("css")', defaultOptions.hostPath)
		.option('--format [format]', 'Format to retrieve [woff|woff2|ttf]', defaultOptions.format)
		.option('-v, --verbose', 'Verbose output', false)
		.parse(process.argv)
		;
	debug = cmd.debug;
	var src = '';
	process.stdin
		.on('data', function (buf) { src += buf.toString(); })
		.on('end', function () {
			getter(cmd)
				(src, null, function (err) { if (err) { throw err; } else { process.exit(0); } });
		});
}

function getter(options) {
	options = _.defaults({}, options, defaultOptions);
	if (isGulp) {
		if (options.outBaseDir) {
			throw new Error('outBaseDir only valid when run from command line, use gulp.dest instead');
		}
	}
	return isGulp ? through.obj(processor) : processor;

	function processor(file, enc, next) {
		var self = this;
		function writeFile(filename, contents, next) {
			if (options.outBaseDir) {
				filename = path.join(options.outBaseDir, filename);
			}
			verbose('Writing ' + contents.length + ' bytes to "' + filename + '"');
			if (isGulp) {
				writeFileToGulpStream(filename, contents, next);
			} else {
				writeFileToDisk(filename, contents, next);
			}
			return;

			function writeFileToGulpStream(filename, contents, next) {
				self.push(new File({
					path: filename,
					contents: contents
				}));
				next(null, null);
			}

			function writeFileToDisk(filename, contents, next) {
				async.series([
					async.apply(mkdirp, path.dirname(filename)),
					async.apply(fs.writeFile, filename, contents, null)
				], next);
			}
		}
		var data;
		if (isGulp) {
			if (file.isNull()) {
				return self.emit('data', file);
			}
			if (file.isStream()) {
				return self.emit('error', new Error('webfont-getter: Streaming not supported'));
			}
			data = file.contents.toString(enc);
		} else {
			data = file;
		}
		var subsets = [];
		var param = data
			.split('\n')
			.map(function (s) { return s.trim(); })
			.filter(function (s) { return s.length > 0 && s.charAt(0) !== '#'; })
			.map(parseLine)
			.join('|')
			.replace(/^\|*|\|*$/g, '');
		async.waterfall([initial(param), requestCss, receiveCss, parseCss, downloadFonts], next);

		function parseLine(line) {
			if (line.indexOf('\t') === -1) {
				/* Extract subsets if specified */
				var ss = line.match(/&subset=.*$/);
				if (ss) {
					line = line.substr(0, ss.index);
					addSubsets(ss[0].substr(8).split(','));
				}
				return line.replace(/ /g, '+');
			} else {
				return parseTabDelimetedLine(line);
			}
		}

		function parseTabDelimetedLine(line) {
			var fields = line.split('\t');
			var face = fields[0].replace(/ /g, '+');
			var style = fields[1] || '400';
			var subset = fields[2];
			if (subset) {
				addSubsets(subset.split(','));
			}
			return face + ':' + style;
		}

		function addSubsets(s) {
			if (!s || !s.length) {
				return;
			}
			s.forEach(function (subset) {
				if (subsets.indexOf(subset) === -1) {
					subsets.push(subset);
				}
			});
		}

		function initial(value) {
			return function (next) { return next(null, value); };
		}

		function requestCss(param, next) {
			if (subsets.length) {
				param = param + '&subset=' + subsets.join(',');
			}
			var req = {
				host: options.host,
				path: '/' + options.hostPath + '?family=' + param,
				headers: {
					'User-Agent': formatData[options.format].agent
				}
			};
			verbose('GET ' + req.host + req.path);
			http
				.get(req, async.apply(next, null))
				.on('error', next);
		}

		function receiveCss(res, next) {
			var css = [];
			verbose('HTTP ' + res.statusCode);
			res.on('data', function (data) { css.push(data.toString()); });
			res.on('error', next);
			res.on('end', function () { next(null, css.join('')); });
		}

		function parseCss(css, next) {
			var ext = formatData[options.format].extension;
			if (css.substr(0, 2) === '<!') {
				return next(new Error('Failed to retrieve webfont CSS'));
			}
			var fontFaces = extractFontFaceBlocks(css);
			var classes = extractClasses(css);
			var requests = [];
			for (var i=0; i<fontFaces.length; i++) {
				requests.push(extractData(fontFaces[i], ext));
			}

			generateFontCss(requests, classes, next);


			function extractData(block, ext) {
				var re = new RegExp([
					"\\s*font-family:\\s*'([^']+)';",
					"\\s*font-style:\\s*(\\w+);",
					"\\s*font-weight:\\s*(\\w+);",
					"\\s*src:[^;]*url\\(([^)]+\\." + ext + ")\\)[^;]*;",
					".*(?:unicode-range:([^;]+);)?",
				].join(''), 'm');

				return formatData.apply(null, block.match(re, 'm'));


				function formatData(block, family, style, weight, url, range) {
					var name = [family, style, weight].join('-') + '.' + ext;
					return {
						family: family,
						style: style,
						weight: weight,
						name: name.replace(/\s/g, '_'),
						url: url,
						range: range || 'U+0-10FFFF'
					};
				}
			}

			function extractFontFaceBlocks(css) {
				return css.match(/@font-face\s*{[^}]+}/g);
			}

			function extractClasses(css) {
				return css.match(/\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*\s*{[^}]+}/g);
			}
		}

		function generateFontCss(requests, classes, next) {
			var ext = formatData[options.format].format;
			var template = [
				'@font-face {',
				'	font-family: \'$family\';',
				'	font-style: $style;',
				'	font-weight: $weight;',
				'	src: url($name) format(\'' + ext + '\');',
				'	unicode-range: $range;',
				'}'
			].join('\n');
			var css = requests
				.map(makeFontFace)
				.concat(classes)
				.join('\n\n');
			writeFile(
				path.join(options.cssDir, options.cssFilename),
				new Buffer(css),
				function (err) { next(err, requests); }
			);

			function makeFontFace(request) {
				request.name = path.posix.join(options.fontsDir, request.name);
				return template
					.replace(/\$(\w+)/g, function (m, name) {
						return request[name];
					});
			}
		}

		function downloadFonts(requests) {
			async.each(requests, downloadFont, next);

			function downloadFont(request, next) {
				async.waterfall([initial(request), requestFont, emitFont], next);

				function requestFont(obj, next) {
					http
						.get(obj.url, async.apply(next, null, obj.name))
						.on('error', next);
				}

				function emitFont(name, res, next) {
					if (res.statusCode !== 200) {
						next(new Error('HTTP GET returned code ' + res.statusCode + ' for ' + name));
						return;
					}
					var data = [];
					res.on('data', function (chunk) { data.push(chunk); });
					res.on('end', function () { writeFile(name, Buffer.concat(data), next); });
				}
			}
		}
	}
}
