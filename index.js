'use strict';

var through = require('through2');
var http = require('http');
var File = require('vinyl');
var path = require('path');
var async = require('async');
var _ = { defaults: require('lodash.defaults') };

module.exports = getter;

var defaultOptions = {
	cssFilename: 'fonts.css',
	fontsDir: './',
	cssDir: './'
};

function getter(options) {
	options = _.defaults({}, options, defaultOptions);
	return through.obj(processor);

	function processor(file, enc, next) {
		var self = this;
		if (file.isNull()) {
			return self.emit('data', file);
		}
		if (file.isStream()) {
			return self.emit('error', new Error('webfont-getter: Streaming not supported'));
		}
		var subsets = [];
		var param = file.contents
			.toString(enc)
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
				host: 'fonts.googleapis.com',
				path: '/css?family=' + param,
				headers: {
					'User-Agent': 'Mozilla/4.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
				}
			};
			http
				.get(req, async.apply(next, null))
				.on('error', next);
		}

		function receiveCss(res, next) {
			var css = [];
			res.on('data', function (data) { css.push(data.toString()); });
			res.on('error', next);
			res.on('end', function () { next(null, css.join('')); });
		}

		function parseCss(css, next) {
			css = css.replace(/\s*([{}:;\(\)])\s*/g, '$1');
			if (css.substr(0, 2) === '<!') {
				return next(new Error('Failed to retrieve webfont CSS'));
			}
			var rx = /@font-face{font-family:'([^']+)';font-style:(\w+);font-weight:(\w+);src:[^;]*url\(([^)]+\.woff)\)[^;]*;}/g;
			var requests = [];
			css.replace(rx, function (block, family, style, weight, url) {
				var name = [family, style, weight].join('-') + '.woff';
				requests.push({ family: family, style: style, weight: weight, name: name.replace(/\s/g, '_'), url: url });
			});
			generateFontCss(requests);
			next(null, requests);
		}

		function generateFontCss(requests) {
			var template = [
				'@font-face {',
				'	font-family: \'$family\';',
				'	font-style: $style;',
				'	font-weight: $weight;',
				'	src: url($name) format(\'woff\');',
				'}'
			].join('\n');
			var css = requests
				.map(makeFontFace)
				.join('\n\n');
			self.push(new File({
				path: path.join(options.cssDir, options.cssFilename),
				contents: new Buffer(css, 'utf8')
			}));

			function makeFontFace(request) {
				request.name = path.join(options.fontsDir, request.name);
				return template
					.replace(/\$(\w+)/g, function (m, name) { return request[name]; });
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

				function emitFont(name, stream, next) {
					self.push(new File({
						path: path.join(options.fontsDir, name),
						contents: stream
					}));
					next();
				}
			}
		}
	}
}
