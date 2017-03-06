'use strict';

var http = require('http'),
    https = require('https'),
    moment = require('moment'),
    fs = require('fs'),
    router = require('./router'),
    server = null, 
    sslOptions = null,
    debug = null, debugPort = null, debuggerArg = '--debug-brk=';

/* start */
var start = function (app) {
    
    //check debug
    process.execArgv.filter(function (arg) {
        if (arg.trim().toLowerCase().indexOf(debuggerArg) !== -1) {
            debug = true;
            debugPort = parseInt(arg.trim().substring(debuggerArg.length));
        }
    });
    app.config.debug = debug;
    app.config.debugPort = debugPort;
    
    //start server
    if (app.config.server.port == 443) {
        //https
        sslOptions = {
            key: fs.readFileSync('./conf/keys/wl-prod.pem'),
            cert: fs.readFileSync('./conf/keys/wl-prod.cert')
        };
        server = https.createServer(sslOptions, app);
    } else {
        //http
        server = http.createServer(app);
    }
    server.listen(app.config.server.port, app.config.server.host);	
    
    //events
    server
    .on('listening', function () {
        console.info('[%s] HTTP server listening on %s:%d (pid: %s)', moment.utc().format(), app.config.server.host, app.config.server.port, process.pid);
        app.config.serverStartTime = moment.utc().valueOf();
    })
    .on('error', function (err) {
        switch (err.code) {
            case 'EACCES':
                console.error('[%s] Port %s requires elevated privileges (pid: %s)', moment.utc().format(), app.config.server.port, process.pid);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error('[%s] Port %s is already in use (pid: %s)', moment.utc().format(), app.config.server.port, process.pid);
                process.exit(1);
                break;
            default:
                console.error('[%s] System error. Refer to https:\/\/nodejs.org\/api\/errors.html (pid: %s)', moment.utc().format(), app.config.server.port, process.pid);
                throw err;
        }
    });
    process.on('exit', function () {
        console.error('[%s] HTTP server stopped on %s:%d (pid: %s) - Uptime: %s', moment.utc().format(), app.config.server.host, app.config.server.port, process.pid, 
            moment.duration(moment.utc().diff(moment.utc(app.config.serverStartTime))).humanize());
    });
    
    //start router
    router.start(app);
    app.use('/', router.routes);
    
    return server;
}

/* status */
var status = function (app) {
    
    var contents = [], b, c, d, e;
    
    contents.push(
        {
            title: 'Server time',
            value: moment.utc().format()
        },
        {
            title: 'In service since',
            value: moment.utc(app.config.serverStartTime).format()
        },
        {
            title: 'Uptime',
            value: moment.duration(moment.utc().diff(moment.utc(app.config.serverStartTime))).humanize()
        },
        {
            title: 'Memory usage',
            value: (
                b = Math, 
                c = b.log,
                d = process.memoryUsage().heapUsed,
                e = c(process.memoryUsage().heapUsed) / c(d) | 0, process.memoryUsage().heapUsed / b.pow(d, e)
            ).toFixed(2) + ' ' + (e ? 'KMGTPEZY'[--e] + 'iB' : 'Bytes')
        }
    );
    return contents;
};

/* exports */
module.exports = {
    start: start,
    status: status
}