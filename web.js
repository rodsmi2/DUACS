/**
 * NODE DATA URI IMAGEINATOR
 *
 * Use Case:
 *  - User goes to page, sees instruction and form to upload (multiple?) image(s?) with option to compress or not
 *  - Upon upload:
 *    - Performs lossless compression if possible/selected
 *    - Creates a base64-encoded data-uri for use
 *    - Displays final output in browser
 *
 * Libraries
 *  - Form Processing - Formidable?
 *  - Compression JPEG - https://npmjs.org/package/jpegtran-bin
 *  - Compression PNG - https://npmjs.org/package/optipng-bin
 */


var server = require( './server' );
var router = require( './router' );
var requestHandlers = require( './requestHandlers' );

var handle = {
	'/': requestHandlers.index,
	'/display': requestHandlers.display,
	'*.*': requestHandlers.staticFile
};

server.start( router.route, handle );