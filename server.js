/* global process */
/**
 * A JavaScript version SimpleHTTPServer.
 */
var http = require('http'),
	port = 8009,
	urlParser = require('url'),
	fs = require('fs'),
	path = require('path'),
	current_dir = path.join(process.cwd(), ''),
	CONTENT_TYPES = {
		'.jpg': 'image/jpeg',
		'.gif': 'image/gif',
		'.png': 'image/png',
		'.css': 'text/css',
		'.js': 'text/javascript',
		'.json': 'application/json',
		'.eot': 'application/vnd.ms-fontobject',
		'.otf': 'font/otf', // "application/x-font-opentype"
		'.svg': 'image/svg+xml',
		'.ttf': 'font/ttf', // "application/x-font-ttf" or "application/x-font-truetype"
		'.woff': 'application/x-woff', // "application/x-font-woff"
		'.manifest': 'text/cache-manifest'
	}

var cachedStat = {
	table: {},
	fileStatSync: function (fpath) {
		if (!cachedStat.table[fpath]) {
			cachedStat.table[fpath] = fs.statSync(fpath);
		}
		return cachedStat.table[fpath];
	},
	fileStat: function (fpath, callback) {
		if (cachedStat.table[fpath]) {
			callback(null, cachedStat.table[fpath]);
		} else {
			var cb = function (err, _stat) {
				if (!err) {
					cachedStat.table[fpath] = _stat;
				}
				callback(err, _stat);
			};
			fs.stat(fpath, cb);
		}
	}
};

http.createServer(function (request, response) {
	var urlObject = urlParser.parse(request.url, true),
		pathname = decodeURIComponent(urlObject.pathname),
		contentType = 'text/html'

	console.log("[" + (new Date()).toUTCString() + "] " + '"' + request.method + " " + pathname + "\"");

	if (pathname == '/') pathname = '/index.html'

	var filePath = path.join(current_dir, pathname);
	cachedStat.fileStat(filePath, function (err, stats) {
		if (!err) {
			if (stats.isFile()) {
				fs.readFile(filePath, function (err, data) {
					if (!err) {
						contentType = CONTENT_TYPES[path.extname(filePath)] || 'text/html'
						response.writeHead(200, {
							'Content-Type': contentType
						});
						response.write(data);
						response.end();
					}
				});
			} else if (stats.isDirectory()) {
				fs.readdir(filePath, function (error, files) {
					if (!error) {
						response.writeHead(200, { 'Content-Type': 'text/html' });
						response.write("<!DOCTYPE html>\n<html><head><meta charset='UTF-8'><title>" + filePath + "</title></head><body>");
						response.write("<h1>" + filePath + "</h1>");
						response.write("<ul style='list-style:none;font-family:courier new;'>");
						files.unshift(".", "..");
						files.forEach(function (item) {
							var urlpath = pathname + item,
								itemStats = cachedStat.fileStatSync(current_dir + urlpath);
							if (itemStats.isDirectory()) {
								urlpath += "/";
								item += "/";
							}
							response.write("<li><a href='" + urlpath + "'>" + item + "</a></li>");
						});
						response.end("</ul></body></html>");
					} else {
						// Read dir error
						response.writeHead(500, {});
					}
				});
			}
		} else {
			response.writeHead(404, {});
			response.end("File not found!");
		}
	});
}).listen(port);

console.log("Server running at http://localhost" + ((port === 80) ? "" : ":") + port + "/");
console.log("Base directory at " + current_dir);
