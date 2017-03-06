'use strict';

var express = require('express'),
	logger = require('morgan'),
	util = require('util'),
	path = require('path'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	favicon = require('serve-favicon'), 
	merge = require('merge'),
	app = express(),
	config = {};

/* components */
app.use(logger('combined'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

/* config */
config.basePath = __dirname;
config = merge(false, config, require('./conf/config.base.json'));
config = merge(false, config, require('./conf/config.' + config.environment + '.json'));
config.baseUrl = function (req) {
	var url = app.config.url;
	if (req) {
		url = util.format('%s:///%s/%s', req.protocol, req.get('host'), url);
	}
	return url.replace(/\/\//g, '/');
};
app.config = config;

/* custom errors */
app.errors = {
	customError: require('./lib/errors/customError'),
	validationError: require('./lib/errors/validationError')
}

/* views */
app.set('views', [ 
	path.resolve(app.config.basePath, 'views')
]);
app.set('view engine', 'jade');

/* static content */
app.use(express.static(path.resolve(app.config.basePath, 'public')));

/* exports */
module.exports = app;