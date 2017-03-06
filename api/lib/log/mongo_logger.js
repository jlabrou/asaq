'use strict';

var util = require('util'),
	mongo = require('mongodb').MongoClient,
	q = require('q'),
	self = new (require("events")).EventEmitter();

/**
 * logs the given data
 * @app: the app
 * @data: the data
 * @[callback]: the callback; if omitted a promise will be returned
 */
self.log = function (config, data, callback) {
	
	var promise,
		url = util.format('mongodb://%s:%d/%s', config.host, config.port, config.db);
	
	promise = new q.Promise(function (resolve, reject) {
		self.emit('before-log', data);
		if (data.abort) {
			reject(new Error(data.abort));
		} else {
			mongo.connect(url, function (err, db) {
				if (err) {
					reject(err);
				} else {
					db.collection('log').insertOne({ data: data }, function (err, result) {
						if (err) {
							reject(err);
						} else {
							resolve(result);
						}
						db.close();
					});
				}
			});
		}
	});
	promise.done(function (result) {
		self.emit('after-log', { input: data, result: result });
		self.removeAllListeners();
	}, function (err) {
		self.emit('after-log', { input: data, error: err });
		self.removeAllListeners();
	});

	return (callback ? promise.nodeify(callback) : promise);
};

module.exports = self;