'use strict';

var through = require('through2');
var http = require('http');
var File = require('vinyl');
var path = require('path');
var async = require('async');

module.exports = getter;

function getter() {
	return through.obj(processor);

	function processor(file, enc, next) {
		var self = this;
		if (file.isNull()) {
			return self.emit('data', file);
		}
		if (file.isStream()) {
			return self.emit('error', new Error('webfont-getter: Streaming not supported'));
		}
		var param = file.contents.toString(enc).split('\n').join('|').replace(/^\|*|\|*$/g, '');
		async.waterfall([initial(param), requestCss, receiveCss, parseCss, downloadFonts], next);

		function initial(value) {
			return function (next) { return next(null, value); };
		}

		function requestCss(param, next) {
			var req = {
				host: 'fonts.googleapis.com',
				path: '/css?family=' + encodeURIComponent(param),
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
			res.on('end', function () { next(null, css.join('')); });
		}

		function parseCss(css, next) {
			css = css.replace(/\s*([{}:;\(\)])\s*/g, '$1');
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
				path: 'fonts.css',
				contents: new Buffer(css, 'utf8')
			}));

			function makeFontFace(request) {
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
						path: name,
						contents: stream
					}));
					next();
				}
			}
		}
	}
}
