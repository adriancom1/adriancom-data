// This will convert a LUA Script into a cached Redis SHA script


var fs = require('fs');
var redis = require('redis');
var config = require('config');
var client = null;

var arg = 'scripts/' + process.argv[2];
if(arg == null) {
	throw new Error('File name paramater is missing');
}

var redisConf = config.get('Redis.dbConfig');
 

// Determine Configuration Settings for PROD or DEV
// Load the correct REDIS Connection parameters
if(redisConf.name == "PROD") {
	var url = require('url'); 
	var redisURL = url.parse(process.env.REDIS_URL);
	client = redis.createClient(redisURL.port, redisURL.hostname);
	client.auth(redisURL.auth.split(":")[1]);			
} else if (redisConf.name == "DEV") {
	client = redis.createClient(redisConf.port, redisConf.host);
}

client.on("error", function (err) {
    console.log("Error " + err);
});

fs.readFile(arg, function (err, data) {
	if (err) throw Error("File not Found. Check path name of the LUA script. Default path should be 'scripts/' ");
		client.script('load', data.toString(), function(err, data) {
			console.log('SHA= ', data);
			client.quit();
		});
});





		




