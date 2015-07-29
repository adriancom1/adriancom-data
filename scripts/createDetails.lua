-- Create Details 

local args = {KEYS[1],KEYS[2],KEYS[3],KEYS[4], KEYS[5],KEYS[6],KEYS[7],KEYS[8],KEYS[9],KEYS[10]}
--local args = {'projects','adrian-test', 'Adrian Test Page', 'This is only a test', 'Headline here', '2015', 'Web', 'Flash', 'Do Good', 'Adrian Sanoguel'} -- Debug
local collection = args[1]
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
	self.status = redis.call('hmset', collection..':'..tostring(id)..':'..tableName, 
		'id', 			args[2],			-- Numeric Id of the record (ex. adrian-test)
		'name', 		args[3],	-- Project name or title
		'description', 	args[4],	-- Summary of the project
		'headline', 	args[5],	-- Short headline, slug
		'year', 		args[6],	-- Year completed
		'platform1',	args[7],	-- Platorm (Web, Mobile)
		'platform2',	args[8],	-- Secondary Platform (CMS, Flash, Drupal)
		'randomQuote', 	args[9],	-- Random design quote
		'quoteAuthor', 	args[10])	-- Quote author
end


-- Main --
local rec = Record:new{SYS_ID=systemId(args[2])}

rec:setValues()
local status = rec:getStatus()

if status['ok'] ~= nil then
	return rec:out()
else
	return rec:fail()
end



