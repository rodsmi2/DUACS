var fs = require( 'fs' ),
	formidable = require( 'formidable' ),
	optipng = require( 'optipng-bin' ).path,
	jpegtran = require( 'jpegtran-bin' ).path,
	execFile = require('child_process').execFile,
	exec = require('child_process').exec,
	extensions = {
		"html": "text/html",
		"css": "text/css",
		"js": "application/javascript",
		"png": "image/png",
		"gif": "image/gif",
		"jpg": "image/jpeg" };

function index(response, request, pathname) {
	console.log("Request handler 'index' was called.");

	fs.readFile("./public/index.html", function(error, file) {
		if( error ) {
			response.writeHead(404, {"Content-Type": "text/html"});
			response.write('<p>Page Not Found!</p>');
			response.end();
		} else {
			var extension = pathname.split('.')[1];
			response.writeHead(200, {"Content-Type": extensions[extension]});
			response.write( file );
			response.end();
		}
	});
}

function display(response, request, pathname) {
	if( request.method.toLowerCase() == 'post' ) {
		var uploadedImages = [],
			compressImg = false,
			fileCount = 0,
			terminateProcess = false;

		var form = new formidable.IncomingForm();

		form.on( 'progress', function( bytesReceived, bytesExpected ) {
			if( bytesExpected >= 2 * 1024 * 1024 || bytesReceived >= 2 * 1024 * 1024 ) {
				fs.readFile("./public/error.html", function( error, file ) {
					if( error ) {
						response.writeHead( 404, { "Content-Type": "text/html" });
						response.write('<p>Resource not Found!</p>');
						response.end();
					} else {
						var extension = pathname.split('.')[1];
						response.writeHead(200, {"Content-Type": extensions[extension]} );
						response.write( file );
						response.end();
					}
				});

				request.shouldKeepAlive = false;
				terminateProcess = true;
				return;
			}
		});

		form.on( 'file', function( name, file ) {
			var fileExt = file.name.split('.')[ file.name.split('.').length-1 ];

			if( fileExt == 'gif' || fileExt == 'png' || fileExt == 'jpg' || fileExt == 'jpeg' ) {
				fileCount++;
				uploadedImages.push( file );
			}
		});

		form.on('field', function(name, value) {
			if( name == 'compress' && value == '1' ) {
				compressImg = true;
			}
		});

		form.on( 'end', function() {
			if( uploadedImages.length > 0 && ! terminateProcess ) {
				process.nextTick(function() {
					processImages( uploadedImages, 0, compressImg, response );
				});
			}
		});

		form.parse(request);

	} else {
		response.writeHead( 302, { "Location": "/" } );
		response.end();
	}
}

function processImages( imageArray, currentCount, compressImg, response ) {
	console.log( 'made it to processing!' );
	var theImage = imageArray[ currentCount ];

	if( compressImg && theImage.type == 'image/jpeg' ) {
		execFile(jpegtran, ['-copy', 'none', '-optimize', '-outfile', theImage.path + 'v2', theImage.path], function(err, stdout, stderr) {
			for( j=0; j<imageArray.length; j++ ) {
				if( imageArray[j].path == theImage.path ) {
					imageArray[j].path += 'v2';
					console.log( 'updating path : ' + imageArray[j].path );
					currentCount++;
					isDone( currentCount, imageArray, response, compressImg );
				}
			}
		});
	} else if( compressImg && theImage.type == 'image/png' ) {
		execFile(optipng, ['-o 7', theImage.path], function(err, stdout, stderr) {
			currentCount++;
			isDone( currentCount, imageArray, response, compressImg );
		});
	} else {
		currentCount++;
		isDone( currentCount, imageArray, response, compressImg );
	}
}

function isDone( iterator, imageArray, response, compressImg ) {
	if( imageArray.length == iterator ) {
		finishDisplay( imageArray, response );
	} else {
		process.nextTick(function() {
			processImages( imageArray, iterator + 1, compressImg, response );
		});
	}
}

function finishDisplay( uploadedImages, response ) {
	var __weirderirator = 0;
	var templateReplaceFinal = '';

	fs.readFile("./public/display.html", 'utf8', function( error, data ) {
		for( j=0; j<uploadedImages.length; j++ ) {
			displayImage( uploadedImages[j].path, uploadedImages[j].type, response, data, uploadedImages, function( template, templateReplace ) {
				console.log('iteratoring');
				__weirderirator++;
				templateReplaceFinal += templateReplace;

				verifyResponseEnd( __weirderirator, uploadedImages, response, data, template, templateReplaceFinal );
			});
		}
	});
}

function displayImage( path, type, response, data, imageArray, callback ) {
	var template = data.match(/<template class="image">([\s\S]*?)<\/template>/gm)[0];
	var newTemplate = template.replace('<template class="image">', '').replace('</template>', '');
	var templateReplace = '';

	console.log( 'Loading Image : ' + path );
	fs.readFile(path, 'base64', function(error, imageData) {
		var imagePrefix = 'data:' + type + ';base64,';
		var imageURI = imageData;

		templateReplace += newTemplate.replace('{{IMAGEURI}}', imagePrefix + imageURI).replace('{{DATAURI}}', imagePrefix + imageURI );

		callback( template, templateReplace );
	});
}

function verifyResponseEnd( incrementor, imageArray, response, data, template, templateReplace ) {
	if( incrementor == imageArray.length ) {
		data = data.replace( template, templateReplace );
		response.end( data );
	}
}

function staticFile(response, request, pathname) {
	console.log( 'Request for static: ' + pathname );
	fs.readFile("./public/" + pathname, function( error, file ) {
		if( error ) {
			response.writeHead( 404, { "Content-Type": "text/html" });
			response.write('<p>Resource not Found!</p>');
			response.end();
		} else {
			var extension = pathname.split('.')[1];
			response.writeHead(200, {"Content-Type": extensions[extension]} );
			response.write( file );
			response.end();
		}
	});
}

exports.index = index;
exports.display = display;
exports.staticFile = staticFile;