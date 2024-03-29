function route( handle, pathname, response, request ) {
	console.log("About to route a request for " + pathname);
	if (typeof handle[pathname] === 'function') {
		handle[pathname](response, request, pathname);
	} else if( pathname.indexOf('.') != -1 ) {
		handle['*.*'](response, request, pathname);
	} else {
		console.log("No request handler found for " + pathname);
		response.writeHead(404, {"Content-Type": "text/plain"});
		response.write("404 Not found");
		response.end();
	}
}

exports.route = route;