'use strict';

var express = require('express'),
	router = express.Router({ strict: true }),
	uaParser = require('ua-parser-js'),
	fs = require('fs'),
	path = require('path'),
	moment = require('moment');

/* start */
var start = function (app) {
	
	/* all routes middleware */
	router.all('/*', function (req, res, next) {
		req.clientInfo = uaParser(req.headers['user-agent']);
		if (!req.clientInfo) {
			return next(new app.errors.customError(412, 'Precondition failed: Missing header \'user-agent\''));
		}
		return next();
	});
	
	/* default route */
	router.get('/', function (req, res, next) {
		res.redirect(req.app.config.baseUrl(req));
	});
	router.get(app.config.baseUrl(), function (req, res, next) {
		res.render('status', {
			title: 'API status',
			contents: require('./server.js').status(req.app)
		});
	});
	
	/* modules routes */
	getModules(app).forEach(function (module) {
		//import views
		app.get('views').push(path.resolve(module.source, 'views'));
		//import static files
		app.use(express.static(path.resolve(module.source, 'public')));
		//import routes
		getModuleExports(module).forEach(function (file) {
			router.use(app.config.baseUrl(), require(file.source));
			console.info('[%s] API module added: %s (pid: %d)', moment.utc().format(), file.source, process.pid);
		});
	});
	
	/* route 404 */
	router.use(function route404(req, res, next) {
		next(new req.app.errors.customError(404, 'Not found.'));
	});
	
	/* route 500 */
	router.use(function route500(err, req, res, next) {
		if (err instanceof req.app.errors.customError) {
			return res.status(err.status).send({ error: (req.app.config.environment == 'dev') ? err.stack || err.message : err.message });
		} else {
			if (!err.name || err.name.toLowerCase() == 'error') {
				err.name = 'Internal error.';
			}
			return res.status(err.status || 500).send({ error: (req.app.config.environment == 'dev') ? err.stack : err.name });
		}
	});
	
	return router;
}

/* getModules */
var getModules = function (app) {
	
	var modules = [];
	
	try {
		var readFolder = function (folder) {
			fs.readdirSync(folder).forEach(function (file) {
				file = path.join(folder, file);
				if (fs.statSync(file).isDirectory()) {
					modules.push({
						source: file
					});
				}
			});
		};
		
		readFolder(path.resolve(app.config.basePath, 'modules'));
		return modules;
	} catch (e) {
		throw err;
	};
};

/* getModuleExports */
var getModuleExports = function (module) {
	
	var modules = [],
		contents = null;
	
	try {
		var readFolder = function (folder) {
			fs.readdirSync(folder).forEach(function (file) {
				file = path.join(folder, file);
				if (fs.statSync(file).isDirectory()) {
					readFolder(file);
				} else {
					if (path.extname(file) === '.js') {
						contents = fs.readFileSync(file, 'utf8');
						//module needs to expose 'module.exports = router' to be added
						if (/module.exports\s*=\s*router(;?)/im.test(contents)) {
							modules.push({
								source: file
							});
						}
					}
				}
			});
		};
		
		readFolder(module.source);
		return modules;
	} catch (e) {
		throw err;
	};
}

/* exports */
module.exports = {
	routes: router,
	start: start
}