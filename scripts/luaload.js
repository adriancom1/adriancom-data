// This will convert a LUA Script into a cached Redis SHA script


var fs = require('fs');
var redis = require('redis')
var client = redis.createClient();
var arg = 'scripts/' + process.argv[2];
if(arg == null) {
	throw new Error('File name paramater is missing');
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






