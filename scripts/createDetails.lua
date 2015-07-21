-- Create Details 

local args = {KEYS[1],KEYS[2],KEYS[3],KEYS[4]}
local collection = 'projects' --Future allow parameters from ARGV 
local tableName = 'details'


local systemId = function (fieldName)
	return redis.call('hget' , 'index:'..collection..':name', fieldName)
end

local Record = {status=nil, id=nil, out = function(self)
		return cjson.encode(self.status)
	end
}

function Record:new(o)
	local o = o or {} --create an object if none exist
	setmetatable(o, self) -- this is what creates the 'prototype' link lookup
	self.__index = self
	return o
end

function Record:fail() 
	return cjson.encode({['status'] = 'Failed'})
end

function Record:getStatus() 
	return self.status
end

function Record:setValues()
	local id = self.id
	self.status = redis.call('hmset', collection..':'..tostring(id)..':'..tableName, 
		'id', 	id,
		'additionalFeatures', args[2],
		'description', args[3],
		'name', args[4]) 
	-- UNCOMMENT TO DEBUG
		-- 'id', 	id,
		-- 'additionalFeatures', 'These are the additional features',
		-- 'description', 'A description will be in here',
		-- 'name', 'This is the actual name')
end



-- Main --
local rec = Record:new{id=systemId(args[1])}
--local rec = Record:new{id=systemId('adrian-test')} -- DEBUG
rec:setValues()
local status = rec:getStatus()

if status['ok'] ~= nil then
	return rec:out()
else
	return rec:fail()
end



