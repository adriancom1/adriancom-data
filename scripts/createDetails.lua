-- Create Details 
-- Supports unlimited number of fields

local collection = ARGV[1]
local recordId = ARGV[2]
local tableName = 'details'

-- Id is passed in as a constructor parameter
local systemId = function (id)
	return redis.call('hget' , 'index:'..collection..':name', id)
end

local Record = {status=nil, SYS_ID=nil, out = function(self)
		return cjson.encode({["status"] = 'true'})
	end
}

function Record:new(o)
	local o = o or {} --create an object if none exist
	setmetatable(o, self) -- this is what creates the 'prototype' link lookup
	self.__index = self
	return o
end

function Record:fail() 
	return cjson.encode({['status'] = 'false'})
end

function Record:getStatus() 
	return self.status
end

function Record:setValues()
	local id = self.SYS_ID
	-- Iterate through the KEYS and ARGV external parameters
	for i, field in ipairs(KEYS) do 
		-- Save each field and value into the Details Hash table
		if field ~= 'collection' then -- Collection is the default main Hash key name
			self.status = redis.call('hset', collection..':'..tostring(id)..':'..tableName, field , ARGV[i])
		end
	end
	return self.status
end

-- Main --
local rec = Record:new{SYS_ID=systemId(recordId)}

rec:setValues()

local status = rec:getStatus()

if status ~= nil then
	return rec:out()
else
	return rec:fail()
end



