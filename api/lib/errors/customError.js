(function () {
	'use strict';
	
	var customError = function (status, message) {
		this.status = status;
		this.message = message;
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	};
	
	module.exports = customError;
	require('util').inherits(module.exports, Error);
})()