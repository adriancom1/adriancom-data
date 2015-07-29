require('shelljs/global');
var fs = require('fs');
var color = require('bash-color');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

//Clear the console
exec('clear');

module.exports = function(grunt) {

	grunt.initConfig({
		// Multi Tasks Configuration
		config: grunt.file.readJSON('config/default.json'),
		load: {
	   		data: {
	   			cli : "<%=config.Redis.cli%>", 
	   			summary : "<%=config.Redis.scripts.create.summary.sha%>",
	   			details : "<%=config.Redis.scripts.create.details.sha%>",
	   			content: "<%=config.Redis.content%>"
	   		}
	   	}
	});

	// Define Multi Tasks
	grunt.registerMultiTask('load', 'Load data into the Redis datastore. ', function(dataset) {
		var self = this;
		//Default workspace is projects
		if(dataset == null) throw new Error('dataset or Key name parameter is missing. Use: grunt:load:[script]:[dataset], (ex. grunt load:record:projects)');
		banner.call(this, grunt);
		//Script Id
		var data = this.data;
		var cli = data.cli;
		var content = data.content;
		var sha = null;
		//Change to new working directory
		cd(cli.dir);
		if(~pwd().indexOf(cli.dir) == 0) throw new Error('Redis cli was not found. Check the cli path name in config.json.');

		var done = this.async();
		//Request the content package and push to the Redis datastore.
		getContent(content.dir + '/' + content.source);
		//On data ready, initiate a server script call to Redis
		emitter.on('ready', function(data) {
			data.forEach(function(item) {
				var fieldLen = 1; //Set to 1 to account for the 'collection' name (dataset)
				var fieldValues =  ' "' + dataset + '"';
				var fields = Object.keys(item); //summary, details
				
				for(var i=0; i < fields.length; i++) {
					//Get the SHA key id from the config data
					sha = self.data[fields[i]];
					var collection = item[fields[i]];
					for(var field in collection) {
						fieldValues += ' "' + collection[field] + '"';
						fieldLen++;
					}
				//Commit data to the Redis datastore
				run('./'+ cli.bin + ' evalsha '+ sha + ' ' + fieldLen + fieldValues,
				"An internal error occured. Data was not received.", "Records were successfully added.", './'+ cli.bin +' get id:' + dataset);
				//Reset the counter and fields for the next recordset
				fieldLen = 1;
				fieldValues =  ' "' + dataset + '"';
				}
			});
		});
	});	

// END
};


function getContent(source) {
	var self = this;
	fs.readFile(source, function (err, data) {
	if (err) throw Error("File not Found. Check path name of the LUA script. Default path should be 'scripts/' ");
		emitter.emit('ready', JSON.parse(data.toString()));
	});
}

// Additional Script Utils
function run(command, errorMessage, successMessage, onCompleteCommand) {
	var error = function(message) {
		echo(color.red('==========================================================', true));
		echo('[ERROR] :: ' + message);
		echo(color.red('==========================================================', true));
	};

	var command = exec(command);
	if (command.code !== 0) {
		// Only IF Git:
		if(~command.output.indexOf('nothing to commit') != 0) { //if True
			ok.call(echo, successMessage);
			exec(onCompleteCommand);
			return;
		}		
		error(errorMessage);
		exit(1);
	} else {
		if(command.output) {
			var output = JSON.parse(command.output).status;
			if(!output) {
				error(errorMessage);
				exit(1);
			}
		}
		ok.call(echo, successMessage);
		if(onCompleteCommand) {
			exec(onCompleteCommand);
		}
	}
};

//Displays a banner that describes the current task
function banner(grunt, arg) {
	grunt.log.writeln(color.white('\n==========================================================', true) );
	grunt.log.writeln(color.purple('\nExecuting Task [ ')+ color.yellow(this.name) + color.purple(' : ') + color.yellow(this.target, true) + color.purple(' ] ==>') + (arg || '') );
	grunt.log.writeln(color.white('\n==========================================================') );
};

//Success Message
function ok(msg) {
	this(color.green('==========================================================', true));
	this(color.yellow('---> \n[SUCCESSFUL] :: ' + msg, true));
	this(color.green('==========================================================', true));
};

//Check for installed binary dependencies
function hasBin(name, packageName) {
	if (!which(name)) {
		echo(color.red('=========================================================='), true );
		echo(color.red('[ERROR] :: ', true) + color.red('The '+ String.prototype.toUpperCase.call(name.substr(0,1)) + name.substr(1) +' module was not found.') + ' Run: ' + packageName);
		echo(color.red('==========================================================') );
		exit(1);
	}
};