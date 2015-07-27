require('shelljs/global');
var fs = require('fs');
var color = require('bash-color');
var load = require('./scripts/redis-load.js');
//load.setSource('scripts');

//Dependencies:
hasBin('git', 'http://git-scm.com/downloads');
hasBin('divshot', 'npm install -g divshot');
hasBin('aws', 'pip install awscli');

exec('clear');

module.exports = function(grunt) {

	grunt.initConfig({
		// Multi Tasks Configuration
		config: grunt.file.readJSON('config/config.json'),
	   	load: {
	   		all: {
	   			test: 'shit',
	   			//lua.scripts
	   			//loadlua.js (arg)
	   		},
	   		script: {

	   		}
	   	}
	});

	// Define Multi Tasks
	grunt.registerMultiTask('load', 'Load LUA scripts into the Redis cache. ', function() {
//		var target = this.target;
		
		console.log('wtf====', load);
		
	});	

// END
};




// Additional Script Utils
function run(command, errorMessage, successMessage, onCompleteCommand) {
	var command = exec(command);
	if (command.code !== 0) {
		// Only IF Git:
		if(~command.output.indexOf('nothing to commit') != 0) { //if True
			ok.call(echo, successMessage);
			exec(onCompleteCommand);
			return;
		}		
		echo(color.red('=========================================================='), true );
		echo('[ERROR] :: ' + errorMessage);
		echo(color.red('=========================================================='), true );
		exit(1);
	} else {
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
