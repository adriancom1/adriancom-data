
var http = require('http');
var fs = require('fs');
var Mustache = require('mustache');
var EventEmitter = require('events').EventEmitter;
var config = require('config');


//root : __dirname + "/views",
///Sys Utils - make a module
var _sysUtils = (function(){
    var utils = {
        //Mater Utils Object
        extend : function(obj, props, filter) {
            for(var item in props) {
                obj[item] = props[item];
            }
        return obj;
        },
        inherit : function(base, parameters) { //Rename this
            var inherit = Object.create(base.prototype);
            Object.getPrototypeOf(inherit).constructor.call(inherit, parameters);
            return inherit;
        },
        addMethod : function(object, name, handler) {
            this.addProperty.call(this, object, name, handler);
        },
        addProperty : function(object, name, value) {
        	Object.defineProperty(object, name, {value: value});
        },
        copyProperty : function(source, target, property) {
        	return target[property] = source[property];
        },
        cloneMethod : function(sourceObject, property, target){
        	target[property] = sourceObject[property];
        },
		containsKey : function(object, key) {
			return !~~Object.keys(object).indexOf(key);
		},
		hasPrototypeKey : function(object, key) {
			return this.hasProperty(Object.getPrototypeOf(object), key);
		},
        hasProperty : function(object, property) {
        	return Object.hasOwnProperty.call(object, property);
        },
        toJSON : function(input) {
        	return JSON.stringify(input);
        },
        contains : function(input, char){
        	//returns true if exists
        	var input = input || this.valueOf(); //verify
        	return (!~input.indexOf(char)==0);
        },
        getValue : function(property){
        	if(!this.hasOwnProperty(property)) {
        		return this[property];
        	}
        },
        initWithMixin : function(base, mixin, initValues) {
        	var obj;
        	if(initValues) {
        		obj = new base(initValues);
        	} else {
        		obj = new base;
        	}
        	if(mixin) this.extend(obj, mixin);	
			return obj;
        },
        getType : function (object) {
		    if(object) return this.getFuncName(object);
    		return null;
		},
		getProto : function(object) {
			if(object) return this.getFuncName(Object.getPrototypeOf(object));
			return null;
		},
		getFuncName : function(func){
			return func.constructor.toString().match(/function\s*([^(]*)\(/)[1] || null;
		},
		getParam : function(object, param) {
			if(object.hasOwnProperty(param)) return object[param];
			return null;
		},
		_config : function(sourceObject, configObject) {
			var config = {};
			config.isConfig = true;
			for(var item in configObject) {
				config[item] = configObject[item];
			}
			this.extend(sourceObject, config);
		}		
    }
    return Object.create(utils);
})();

//Factory Class
function ResourceWriter(output) {
	var output = output || "Output";
	var type = _sysUtils.getType(output);
	//console.log("RESOURCE OUTP---", type);
	switch(type) {
		case "String": //String will default to HTML
			//output = output.values;//"<!DOCTYPE html>" + output.values + "</html>";
			//console.log("This is a String!!!!", output);
		break;
		case "Object": //Plain JS Object
			output = {"output" :  output};
		break;
		case "JSONwriter":
			output = output.values; //JSONwriter contains a values object
			//TODO: consider calling the 'build' method here
		break;
		case "HTMLwriter":
			Array.prototype.unshift.call(output.values, "<!DOCTYPE html>");
			output.values.push("</html>");
			output = output.values.join("");
		break;		
	}
	//console.log("This is a Writer!!!!", typeof(output) );
	this.output = output;
};

ResourceWriter.prototype.getWriter = function(formatType, parameters) {	
	var params = parameters || null;
	var formatType = (formatType || 'json');
		if(!~"jsonp".indexOf(formatType) == 0) { //If formatType is either json or jsonp
			if(formatType === 'jsonp') {
				if(typeof this.output === 'object') this.output = JSON.stringify(this.output); 
				return _sysUtils.inherit(JSONPwriter, {values:this.output, query:params}).write(); //if JSONP	
			} 
			return _sysUtils.inherit(JSONwriter, this.output).write();
		} else if(formatType == "html") {
			//TODO: fix this to return the html page representation if one is found
			//var output = (formatType === "htmlx") ? params : this.output; 
			return _sysUtils.inherit(HTMLwriter, this.output).write();
		}
};

//Writer Base Prototype
function OutputWriter(output){
	this.values = [];//(values || []);
	this.output = output;
};
OutputWriter.prototype.constructor = OutputWriter;
OutputWriter.prototype.write = function() {
	//console.log("THIS IS THE WRITE CALL METHOD====", typeof this.output)
	if(typeof this.output === 'object') {		
		return JSON.stringify(this.output);	
	} 
	return this.output;
};
OutputWriter.prototype.build = function() {
	var values = this.values;
	var len = values.length-2;
	if(values[len] == ',') values.splice(len,1);
	this.values = values.join("");
	//return this;
};

_sysUtils.copyProperty(_sysUtils, OutputWriter.prototype, "getType");
_sysUtils.copyProperty(_sysUtils, OutputWriter.prototype, "getParam");

//JSONP Object writer
function JSONPwriter(/* values, query */) {
	var args = Array.prototype.slice.call(arguments, 0)[0];
	//console.log("JSONPwriter----", args.values)
	var cb = this.getParam(args.query, "callback"); //get the remote callback name
	//console.log("JSONPwriter==== Type---> ",typeof(args.values) )
	//OutputWriter.call(this, cb+"("+JSON.stringify(args.values)+");");
	OutputWriter.call(this, cb+"("+ args.values +");"); //Object
};
JSONPwriter.prototype = Object.create(OutputWriter.prototype);
JSONPwriter.prototype.constructor = JSONPwriter;

//JSON Object writer
function JSONwriter(values) {
	OutputWriter.call(this, values);
};
JSONwriter.prototype = Object.create(OutputWriter.prototype);
JSONwriter.prototype.constructor = JSONwriter;
_sysUtils.extend(JSONwriter.prototype, {
	object : function() {
		this.values.push("{");
		return this;
	},
	endObject : function() {
		this.values.push("}");
		return this;
	},
    nextItem : function() {
        this.values.push(",");
        return this;
    },
	array : function() {
		this.values.push("[");
		return this;
	},
	endArray : function() {
		this.values.push("]");
		return this;
	},
	end : function() {
		var isObj = this.values[0];
		if(isObj == '{') {
			this.endObject();
		} else {
			this.endArray();
		}
		this.build();		
	},
	key : function(keyName) {
		this.values.push('\"'+keyName+'\":');
		return this;
	},
	value : function(value) {
		if(typeof value == 'object') {
			this.values.push(JSON.stringify(value));
			return this;
		}
		if(!Number.isInteger(value)) {			
			this.values.push('\"' +value+ '\"');
		} else {
			this.values.push(value);
		}
		return this;
	},
	insert : function(value) {
		this.value(value);
		this.nextItem();
		return this;
	},
	insertObject : function(value) {
		this.values.push(value.values);
		this.nextItem();
		return this;
	},
	length : function() {
		return this.values.length;
	},
	nextKeyValue : function(key, value) {
		this.nextItem();
		this.key(key);
		this.value(value);
		return this;
	},
	keyValue : function(key, value) {
		this.key(key);
		this.value(value);
		return this;
	},
	parse : function(data) {
		this.data = JSON.parse(data);
		return this.getData();
	},
	getData : function() {
		return this.data;
	}
});
//TODO::: Fix the Inheritance... Build the HTML Writer.. and send it to output:
//HTML Object writer
function HTMLwriter(htmlContent) {	
	OutputWriter.call(this, htmlContent);
};
HTMLwriter.prototype = Object.create(OutputWriter.prototype);
HTMLwriter.prototype.constructor = HTMLwriter;
_sysUtils.extend(HTMLwriter.prototype, {
	head : function(values) {
		var head = [];
		var i = 0;
		for(var item in values) {
			head[i++] = "<" + item + ">" + values[item] + "</" + item + ">";
		}
		this.values.push("<head>" + head.join("") + "</head>");
		return this;
	},
	title : function(value) {
		this.head({title: value});
		return this;
	},
	body : function(value) {
		this.values.push("<body>" + value + "</body>");	
		return this;
	}
});

function Repository() {
	//console.log("*** Repository=== ", _sysUtils.hasPrototypeKey(module, "redis"));
	var repo = _sysUtils.getParam(app._sysModulesIndex, "redis");
	if(repo === null) throw new Error("Repository()::Redis client module has not been initialized.");
	repo = app._sysModules[repo];

	//Base type, everything pulled from the repository inherited from Item class
	function Item(id) {
		this.id = id || null;
	};
	Item.prototype = {
		constructor : Item,
		getProperty : function(propertyName) {
			if(_sysUtils.hasProperty(this, propertyName)) {
				return this[propertyName];
			} 
			return propertyName + " not found";
		}
	};

	function Node(id) {
		Item.call(this, id); 
	};
	Node.prototype = Object.create(Item.prototype);
	Node.prototype.constructor = Node;

	function Page(id, source) {
		this.source = source || null;
		this.__delimiter = "{{=<%include %>=}}";
		Node.call(this, id);
	}
	Page.prototype = Object.create(Node.prototype);
	Page.prototype = {
		constructor : Page,
		compile : function() {
			var delimiter = this.__delimiter;
			return Mustache.render(delimiter+this.source, this);
		}
	}; 

	function ClientSession(repository) {
		// Redis Config Server Params - DEV or PROD
		var config = require('config');
		var redisConf = config.get('Redis.dbConfig');
		if(~redisConf.name.indexOf('prod') != 0) {
			var url = require('url'); 
			var redisURL = url.parse(process.env.REDIS_URL);
			this._repository = repository.createClient(redisURL.port, redisURL.hostname);
			this._repository.auth(redisURL.auth.split(":")[1]);			
		} else if (redisConf.name == "dev") {
			this._repository = repository.createClient(redisConf.port, redisConf.host);
		}
		EventEmitter.call(this);
	};
	
	ClientSession.prototype = {
		constructor : ClientSession,
		close : function() {
			this._repository.end();
			this._repository = null;
		},
		
		getNode : function(objectId, indexField, fieldName, collection, dataType) {
			
			var dataType = dataType || "string";
			var client = this._repository;
			var _id, _node, _nodeName;
			var commands = client.multi();
			var self = this;
			var callback = function(err, data) {
				_sysUtils.extend(_node, data); //copy the properties from the repository as a Node object		
				self.emit("data",  _node);
				client.quit();
			};


			//Begin by extracting the unique ID value
			commands.hget("index:"+objectId+":"+indexField, fieldName, function(err, id) {
				_nodeName = objectId+":"+id+":" + collection;
				switch(dataType) {
					case "sha" :
						if(dataType = "sha") {
							//Todo: Refactor this to call a server side LUA script
							// Refactor this to optimize for handling Server Side Scripts
							var argLen = indexField || 0;
							var param1 = fieldName || null;
							var param2 = collection || null;
							client.evalsha(objectId,  argLen , param1, param2, function(err, data) {
								self.emit("data",  data);
								client.quit();
							});
						}
						break;
					case "hash":
						_node = new Node(id);
						client.hgetall(_nodeName, callback);
						break;
					case "string":
						client.get(_nodeName, callback);
						break;
					case "page":
						_node = new Page(id);
						client.get(_nodeName, function(err, data) {
							_node.source = data;
							self.emit("pageNode", _node);
						});
					break;
				}
			});
			commands.exec(
				//This Section HANDLES Creation of Pages...this will be Refactored
				// function(err, $id) {
				// 	self.once("pageNode", function(pageNode) {
				// 		var _return = function(err, data) {
				// 			self.emit("data",  pageNode);
				// 			client.quit();
				// 		}
				// 		var _itemReturn = function($pageNode, item) {
				// 			var self = $pageNode;
				// 			return function(err, data) {
				// 				self[item] = data;
				// 			}
				// 		}
				// 		var _objectId = objectId+":"+$id;
				// 		client.hgetall(_objectId + ":components", function(err, comp ){
				// 			for(var item in comp) {
				// 				commands.hget("index:pages:components:" + item, comp[item], _itemReturn(pageNode, item));
				// 			}
				// 			commands.exec(_return);
				// 		});
				// 	})					
				// }
			);
		}
		//Todo: Future feature: add a login method
	}
	_sysUtils.extend(ClientSession.prototype, EventEmitter.prototype);
	return new ClientSession(repo);
	
};


/// Resource Mapping
function ResourceMap() {
	this.values = [];
	this._isService = false;
	try {
		EventEmitter.call(this);
		if(arguments.length == 0) throw new Error("ResourceMap():: cannot be instantiated.");
		this.urlmap = null;
		if (arguments[0][2] == true) { //specialRules parameter
			ResourceMap._create.apply(this, arguments[0]);	
		}
	} catch(e) {
		return this.output = e.message;
	}
};

ResourceMap._create = function() { //Clean up this
	if(arguments.length == 0) throw new Error("ResourceMap._create():: Cannot instantiate");
	var hasTrailingSlash = false;
	var umap = this.urlmap = {};
	//Get variable names
	var pathname = arguments[0];
    var route = arguments[1];
    if(pathname.charCodeAt(pathname.length-1) != 47) {
        hasTrailingSlash = true;
        pathname += '/'; //Trailing slash fix   
    } else {
        pathname = pathname.substring(0, pathname.length-1);
    };   
    var ext = this.hasExtension = (!~pathname.indexOf('.') == 0);
	var pathVariables = route.match(/(?:<){0}\w+(?=>)/g);
	var urlParts = this.urlParts = pathname.split("/").splice(1);
    if(hasTrailingSlash) urlParts.pop();   

    if(ext) {
    	var len = urlParts.length;
    	var extension = urlParts[len-1];
    	var loc = extension.indexOf('.');
    	this.type = extension = extension.substring(loc+1).toLowerCase();
    	if(/[\[\]#$\^-_=+&<>!@%*\(\)]/.test(extension)) {
    		this.type = extension.match(/\w+/)[0];
    	}
	}
    
    pathVariables.map(function(item) {
	    var index = urlParts.indexOf(item);
	    umap[item] = urlParts[index+1];
	 });
};

ResourceMap.prototype = {
	constructor : ResourceMap,
	getUrl : function() {
		return this.host + this.path;
	},
	getRoute : function() {
		return this.routename;
	},
	getPath : function() {
		return this.pathname;
	},
	getParam : function(parameter) {	
		if(_sysUtils.hasProperty(this.query, parameter)) return this.query[parameter];
		return null;
	},
	getParent : function() {
		if(this.hasRules) {
			var rname = this.routename;
			return rname.substring(0, rname.indexOf('/<'));
		}
	},
	getSelectors : function(){
		if(Array.isArray(this.selectorValues)) return this.selectorValues;
		return false;
	},
	getAction : function() {
		//placeholder
	},
	getTemplate : function(resourceName, resourceIndexField) {
		var resourceIndexField = resourceIndexField || "name";
		this._isService = true;
		var self = this;
		var repo = new Repository();
		//Init the Event Listener chain
		repo.once("data", function(nodeData) {
			//Get the template master
			//Get the associated parts
			self.emit("page", nodeData);
		});
		
		repo.getNode("pages", resourceIndexField, resourceName, "templates", "page");
	},
	getResource : function(resourceName, resourceIndexField, collection) {
	//example: resource.getResource("users", "name", "details");
	//Resource Name = "[users]:1000:details"
	//this looks up the index using hget index:users:[name] - [resourceIndexField ]
	//collection is the "users:1000:[details]" 
		this._isService = true;
		var self = this;
		//Get 'resourceName' by 'resourceIndexField' where 'optionalCategory'
		var repo = new Repository();
		var resType = "hash";
		var fieldName = null;
		
		//Init the Event Listener chain
		repo.once("data", function(nodeData){
			self.emit("data", nodeData);
		});
		if(resourceName.length > 25) {
			//Refactor this to handle Server Side Scripts			
			resType = "sha";
			fieldName = collection[0];
			collection = collection[1]
		} else { 
			fieldName = this.getPathVariable(resourceName);
		}
		
		//console.log("Get Resource========, resourceName== ", resourceName,' resourceIndexField== ', resourceIndexField, 'fieldName= ',fieldName, collection);
		repo.getNode(resourceName, resourceIndexField, fieldName, collection, resType);		
		
		return this;
	},
	getPathVariable : function(variable) {
		if(_sysUtils.hasProperty(this.urlmap, variable)) return this.urlmap[variable];
		return null;
	},
	getHost : function() {
		//placeholder
	},
	getPort : function() {
		//placeholder
	},
	getVars : function() {
		return this.urlmap;
	},
	getFileName : function() {
		if(this.hasExtension) {
			var fragments = this.urlParts;
			return fragments[fragments.length-1];
		}
		return null;
	}, 
	output : function(output) {
		var self = this;
		var rendition = (this.type) ? this.type : (function(value){
			//console.log("THIS IS THE ResourceMap Output MESSAGE======,", value);
			//test value
			//Todo: Fix this.
			//return "html"; //Test this..mainly when the "root" / route is triggered
		})(output);
		var writer = _sysUtils.inherit(ResourceWriter, output);
		if(rendition === 'jsonp') return writer.getWriter(rendition, this.query); //need to query for the remote callback
		return writer.getWriter(rendition);
	},
	render : function(resourceHandler) {
		var type = this.type || "json";
		if(type !== "jsonp") {
			return resourceHandler[type]();	
		}
		return resourceHandler["json"]();
	}
	//,//  not needed
	// webService : function() {
	// 	//_sysUtils.extend(ResourceMap.prototype, {_isService : true});
	// 	this._isService = true;
	// 	return this;
	// }
};
_sysUtils.extend(ResourceMap.prototype, EventEmitter.prototype);


/// Client Message
function ClientMessage (response) {	
	this.response = response;
};

ClientMessage._mimetype = function(type) {
	switch(type) {
		////application/x-www-form-urlencoded
		case "html":
			return "text/html";
			break;
		case "txt":
			return "text/plain";
			break;
		case "json","jsonp":
			return "application/json";
			break;
		default : 
			return "text/html";
	} 
}; 

ClientMessage.prototype = {
	constructor : ClientMessage,
	write : function(message) {
		this.response.write(message);
		this.response.end();
	},
	success : function(routeObject) {
		var self = this;
		//Wrap the Route object in a ResourceMap and send it to the Handler
		var resourceMap = _sysUtils.initWithMixin(ResourceMap, routeObject, [routeObject.pathname, routeObject.routename, routeObject.hasRules]); 
		
		//Todo: Check if the .Type is set in the config or in the ResourceMap.type
		//routeObject.type or resourceMap.type
		this.response.setHeader('Access-Control-Allow-Origin', '*');
		this.response.writeHead(200, {"Content-Type" : ClientMessage._mimetype(resourceMap.type)});

		var outputMessage = routeObject.handler(resourceMap);
		if(outputMessage) {
			resourceMap._isService = false;
			this.write(resourceMap.output(outputMessage));
			return;
		}
		//Listen for web service data complete requests
		if(resourceMap._isService) {
			routeObject.once("complete", function(data) {
			self.write(resourceMap.output(data));
			});
		} 
		
	},
	fail : function(error /*mimeType*/) {
		this.response.writeHead(404, {"Content-Type" : "text/html"});
		this.write(error +"");
	}
};


/// Route - Make a module
// Route Object
function Route() {};
Route.prototype = {
    constructor : Route,
    errors : false,
    toString : function(){return this.name},
    toJSON : function(){
        return JSON.stringify(this.handler.call(this));
    },
    getRoute : function() {
        return this.name;
    },
    exec : function(clientResponse) {
    	//Instantiate a ClientMessage object
    	var message = _sysUtils.inherit(ClientMessage, clientResponse);
    	try {
			if(!this.errors) {
	        	if(clientResponse) {
	        		message.success(this);
	    		}
	        } else {
	        	throw new Error(this.errorMessage);
	        }    		
    	} catch(e) {
    		var msg;
    		if(this.hasOwnProperty('output')) {
    			//check between errorMessage and output
    			msg = e.message || app.notFoundMessage;
    			console.log("Internal Server Error: Route.exec():: " + this.output); //Record this in a log file somewhere or for debugging
    		} else {
    			msg = e.message;
    		}
    		message.fail(msg);
    	}
        return this;
    },
    config : function(configObject) {
    	//Object to configure
    	_sysUtils._config(ResourceMap.prototype, configObject);
    },
	update : function(eventData) {
		this.values.push(eventData);
	},
	flush : function() {
		this.values.length = 0;
	}, 
	onComplete : function(data) {
		this.emit("complete", data);
	}

};
_sysUtils.extend(Route.prototype, EventEmitter.prototype);
//// Routes - Make a module
function Routes(routes) {
	var Routes = function Routes() {
	        throw new Error("Routes():: Can't instantiate directly");
	    }
	    
	    Routes.values = [];//this is only to enumerate them
	    var obj;
	    for(var item in routes)  {
	        obj = Object.create(Route.prototype);
	        obj.constructor();
	        obj.hasRules = (!~item.indexOf('/<') == 0); //true/false
	        obj.selector = null,
	        obj.selectorValues = null,
	        obj.routename = item;
	        obj.handler = routes[item];
	        Routes[item] = obj;
	        Routes.values.push(obj);
	    }
        Routes.get = function(resource) {
            try {
                if(!this.hasOwnProperty(resource)) {
                    throw new Error("Routes.get():: Route location not found.");
                    this.errors = true;
                    //There should always be something returned.
                }
                return this[resource];
            } catch (e) {
                var route = Object.create(Route.prototype);
                route.errors = true;
                route.output = e.message;
                return route;
                //404 error
            }    
        };  
        return Routes;
}  
 //TODO: Create a Logger for this
//// MAIN APP

// App Constructor
function app() {
    return this;
};

//This will initialize an external module, such as a database
app.prototype.init = function(moduleName) {
	var module = require(moduleName);
	var mLen = app._sysModules.length;
	app._sysModulesIndex[moduleName] = mLen++;
	app._sysModules[mLen-1] = module;
  return this;
}; 

//This will create a basic One page app
app.prototype.basicMode = function(message) {
	this.serverBasicMode = true;
	if(message) app.responseOutput = message;
  	return this;
};

//Sets the Server port
app.prototype.serverPort = function(port) {
	Object.defineProperty(this, "port", {
		get: function() {
			console.log("Server is listening on Port: " + port);
			return port
		},
		configurable : true
	});
	return this;
}

// Renders the static message when Basic Mode is used
app.prototype.text = function(message) {
	//response type text
	app.responseOutput = message;
	return this;
};

//no work maybe
// app.prototype.json = function(obj) {
// 	//response type text
// 	this.response = JSON.stringify(obj);
// 	return this;
// }; 

app.prototype.route = function() {
	this.serverBasicMode = false;
	arguments[0]["_root"] = app._rootLocation; //Add the default Root route here
	app.routes = Routes.apply(this, arguments);
	return this;
};

//Default Root Page Route config
app.prototype.root = function(resourceHandler) {
	app._rootLocation = resourceHandler;
	return this;
};
app.prototype.home = app.prototype.root; //Alias name for root 

app.prototype.notFound = function(message) {
	app.notFoundMessage = message || "404 - Resource not found."
	return this;
};

//Static
//app.routes = null;
app._rootLocation = null;
app._sysModulesIndex = {};
app._sysModules = [];
app._regControllerName = /\w+(?=\/)/;
app._regSelector = /\/{0}(?:@)[a-zA-Z0-9\-\(\)\|]+\/{0}/;
app._getRouteKeyName = function(routeObject, routeName) {
	var delimiter = "=>";
	var keys = Object.getOwnPropertyNames(routeObject).join(delimiter).concat(delimiter); //flatten
	var loc = keys.indexOf(routeName);
	if(~loc == 0) return false; //Route key name not found

	keys = keys.substring(loc, loc+keys.length);
	routeName = keys = keys.split(delimiter).shift();
	if(!~keys.indexOf("/@")==0) {		
		//Check for a selector
  		var selector = routeName.match(app._regSelector)[0].substring(1); //selector
		  if(!~selector.indexOf("(")==0){
		  	//Check for multiple selector values
		    var selValues = selector.replace("(","|").split("|");
		    selector = selValues.shift();
		    var selLen = selValues.length;
		    selValues[selLen-1] = (function(char){return char.substring(0,char.length-1)})(selValues[selLen-1]);
		    routeObject[routeName].selectorValues = Array.prototype.slice.call(selValues);
		  };
		  routeObject[routeName].selector = selector;
	};
	return keys;
};

///MOVE///


///MOVE///
//Master Server Response
// Basically this is a custom callback that performs route checking and data extraction
// Then returns a Node.Js request/resonse handler
app.response = function(serverMode) {
	if(serverMode) {
		return function (request, response) {
			response.writeHead(200, {"Content-Type" : "text/html"});
			response.end(app.responseOutput || "This Worked!!!"); //Default initial response if none is configured
		}
	};

	return function (request, response) {
		var headers = request.headers;
		var url = require('url').parse(request.url, true, false);
		
		
		//console.log("THE MAIN URL==", url);
		//console.log("THE MAIN URL PATH==", url.pathname);

		//Static Route Controller
		var controller = url.pathname.substring(1);
		if (!~controller.indexOf("/") == 0) {
			//RESTful Dynamic Route Controller
			controller = controller.match(app._regControllerName);
			controller = app._getRouteKeyName(app.routes, controller);			
		} else {
			//load Root Page
			if(controller === "") controller = "_root";
			//console.log("!!!!!No slash found=====", controller); //users/<users>
		}
		//Instantiate the Routes object
		var routeObject = app.routes.get(controller);
		//Extend using URL object properties
		_sysUtils.extend(routeObject, url);
		_sysUtils.copyProperty(headers, routeObject, 'host');
		
		//Verify the validity of the routeObject
		var portTest = headers.host.lastIndexOf(":");
		if (!~portTest == 0) routeObject.port = headers.host.substring(portTest+1); //port number
		_sysUtils.copyProperty(headers, routeObject, 'user-agent');
		
		//Handle Errors
		var noError = (!new AssertUrl(url.path).validate()); //Check for properly formatted path name
		noError = ~(~noError); //convert to an number for testing
		// Todo: Need to get the routeObject.errors and routeObject.output properly classified
		//console.log("THIS IS THE ROUTE OBJECT ERROR MESSAGE======,", routeObject);
		if(noError > 0 ) {
			routeObject.errors = true;
			routeObject.output = "Assert URL failed to resolve the path name.";
			//Todo: this may be failing on certain URL combintations, please double check it.
			routeObject.errorMessage = app.notFoundMessage || "Resource not found.";
		} else {
			//Validate for resource resolver errors
			if(controller) {
				delete routeObject.output;
				routeObject.errors = false;	
			} 
		}
		routeObject.exec(response);
	}; 
};
 
//Validate the URL string
function AssertUrl(urlToTest){
    if(typeof urlToTest !== 'string') return null;
    this.url = urlToTest;
    this.specialChars = urlToTest.match(/\W/g).join(""); //Convert all special chars to a string
};
AssertUrl.regQueryParams = /(?:\.h)t(?:ml|m)(?!\w)|(?:\.j)so(?:np|n)(?!\w)/;

AssertUrl.prototype.contains = function(stringToTest, charToTest) {
    return (!~stringToTest.indexOf(charToTest) == 0) ? true : false;
};

AssertUrl.prototype.validate = function() {
    var url = this.url;
    var chars = this.specialChars;
    var has = this.contains.bind(this, chars);
    var hasText = this.contains.bind(this, url);

    if(has('?') && !has('=')) return false;
    if(has('?') && has('&') && !has('=')) return false;
    if(has('.')) {
        if(url.match(AssertUrl.regQueryParams) === null) return false;
		if(hasText('jsonp') && !hasText('callback')) return false;
    }
    return true;
};

// Main Application Engine
//app.values = [];
app.run = function(applicationObject) {
	var ware = applicationObject;
	//Mainly used for initial bootstrap or when routes are not configured
	if(ware.serverBasicMode) return app.response(true); 
	
	//re check this - May not need
	// var values = {};
	// Object.keys(ware).forEach(function(item){
	// 	app.values.push(
	// 		Object.defineProperty(values, item, {value: ware[item], writable : false, configurable : false})
	// 	);
	// });

	//construct a new object, then send it
	return app.response();
}

// var app = require('something');

 //// END APP 

//This creates a scaffold for a server response.
//An 'App' is configured and then Run
var test = new app()
.init("redis") //Load Modules (future can include other modules to init)
//.basicMode() //Basic Mode - No Routing Enabled (Routing should be turned off)
//.text("<h1>Hello World</h1>") // Custom Single page. Text or HTML
.serverPort(process.env.PORT)
.root( //If Routing is enabled, this is the Root page
	function(resource) {
		var test = new HTMLwriter();
		test.title("This is the title");
		test.body("<h1>This is the Root Page!</h1>");
		return test; 
	}
) 
.notFound("<h1>Resource Not Found here</h1>") //Custom 404 Error Message when resource is not found
.route({
	"users/<users>" : function(resource) { 
		//This is a Route
		//A route is bound to a Resource which inherits from ResourceMap Object
		var self = this;
		return resource.render({
			html: function() {
				resource.getTemplate("users");
				resource.once("page", function(page) {
					var test = new HTMLwriter();
					test.title("This is the title ");

					test.body(page.compile());
					self.onComplete(test);
				});
			},

			json: function() {
				resource.getResource("users", "name", "details");
				resource.once("data", function(data) {
					//Wrapping in a JSONWriter is optional
					var test = new JSONwriter();
					test.object();
					test.keyValue("user", data);
					test.endObject().build();
					self.onComplete(test);
				});
			}
		});
	},

	// "movies/<movies>/@staff(actors|directors|musicians)/<actors>" : function(resource) {
	// 	//this.config({method : POST});

	// 	return resource.render({
	// 		html: function(){
	// 			var test = new HTMLwriter();
	// 				test.title("This is the title");
	// 				test.body("<h1>Movies Page</h1>");
	// 				return test;
	// 			},

	// 		json: function() {
	// 			var test = new JSONwriter();
	// 				test.object();
	// 				test.keyValue("name", resource.getUrl());
	// 				test.nextItem().key("name2").value("this is interesting");
	// 				test.nextItem();
	// 				test.key("urlmap");
	// 				test.value(resource.getVars());
	// 				test.nextKeyValue("coolkey", "this is flippin sweet");
	// 				test.nextKeyValue("coolkey2", 100);
	// 				test.endObject().build();
	// 			return test;
	// 		}
	// 	});
	// },  
	"projects/<projects>" : function(resource) {
		//projects/sap/
		//Todo - fix to select only if controller is accessed
	//example: resource.getResource("users", "name", "details");
	//Resource Name = "[users]:1000:details"
	//this looks up the index using hget index:users:[name] - [resourceIndexField ]
	//collection is the "users:1000:[details]" 		
		var self = this;
		return resource.render({
			json: function() {
				resource.getResource("projects", "name", "details");
				resource.once("data", function(data) {
					self.onComplete(data); 
				});   
			}
		});
	},
	//TODO: FIX= There is a wierd bug that breaks if the Route is less than 4 Characters
	"welcome/<welcome>" : function(resource) {
		var self = this;
		return resource.render({
			html: function() {
				var html = new HTMLwriter();
				html.title("Sample Welcome Test Page");
				html.body("<h1>Sample Test Page Worked.</h1><p>" + JSON.stringify(resource.getVars()) + "<p>");
				return html;
			},

			json: function() {
				var test = new JSONwriter();
					test.object();
					test.keyValue("name", resource.getUrl());
					test.nextItem().key("name2").value("This is the Sample Welcome Page JSON data representation.");
					test.nextItem();
					test.key("urlMapParameters");
					test.value(resource.getVars());
					test.nextKeyValue("customField1", "This will be a very powerful data service.");
					test.nextKeyValue("customField2", 100);
					test.endObject().build();
				return test;
			}
		});
	},
	//"projects/<company>/projects/<projects>"
	"projects" : function(resource) {
		var self = this;
		var script = config.get('Redis.scripts.list.sha');		
		return resource.render({
			json: function() {
				resource.getResource(script, 2, ['projects', 'summary']);
				resource.once("data", function(data) {
					//Wrapping in a JSONWriter is optional
					var js = new JSONwriter();
					js.array();
					var _data = js.parse(data);
					for(var item in _data) {
						js.insert(_data[item]);
					}
					js.end();
					self.onComplete(js); 
				});
			}
		});
	}
});

// USE THIS AS THE MASTER CODEBASE.. BUT THIS NEEDS TO BE REFACTORED!!!

//TODO:
// determine the output type.

//Use case works for URL:
//movies/<movies>/actors/<actors>
//need use case for Querystring & Hash
http.Server(app.run(test)).listen(test.port);




// server.on('connection', function(socket){
// 	console.log('connection', socket);
// });


//Mustache.render(views.cache[0], context)
			





