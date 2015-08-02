-- Delete a record by ID

-- @collectionName, @RecordID
local args = {KEYS[1], KEYS[2]}
--local args = {'projects','adrian-test'} -- Debug
local collection = args[1]

-- Id is passed in as a constructor parameter
-- A Systen ID is returned and set as a Record Class data member
local systemId = function (recordId)
	return redis.call('hget' , 'index:'..collection..':name', recordId)
end

-- Class that represents a data record in Redis. A data record is comprised of mixed Redis Keys and Hashes
local Record = {
	status=nil, 
	recordId = nil,
	index = 'index:'..collection..':name',
	tables = {'details', 'summary'},
	SYS_ID=nil, 
	out = function(self)
			return cjson.encode({["status"] = 'true'})
		   end
}

-- Record constructor
function Record:new(o)
	-- create an object if none exist
	local o = o or {} 
	setmetatable(o, self) -- this is what creates the 'prototype' link lookup
	self.__index = self
	return o
end

function Record:len()
	return table.getn(self.index)
end

function Record:fail() 
	return cjson.encode({['status'] = 'false'})
end

function Record:getStatus() 
	return self.status
end

function Record:deleteId()
	local index = self.index
	local id = self.recordId
	if(redis.call('hexists', index, id)) then
		-- Issue a Redis hash delete field command
		local r = redis.call('hdel', index, id)
		if r ~= 0 then
			return true
		end
	else
		return false
	end
end

-- Delete a record
function Record:deleteRecord()
	local id = self.SYS_ID
	local tables = self.tables
	
	-- Delete the id from the Index table
	if(self:deleteId()) then
		-- Delete the associated tables
		for i,v in ipairs(tables) do
			self.status = redis.call('del', collection..':'..self.SYS_ID..':'..v)
		end
	end
end


-- Main --
local rec = Record:new{SYS_ID=systemId(args[2]), recordId=args[2]}
rec:deleteRecord()

-- Get the command operation status
local status = rec:getStatus()

if status == 1 then
	return rec:out()
else
	return rec:fail()
end



