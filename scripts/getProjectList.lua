-- Get Project List
-- Accepts external parameters KEYS[1] = Collection Name, KEYS[2] = Table

local Project = {values = {}, index = nil, out = function(self)
		return cjson.encode(self.values)
	end
}

local parseIndex = function(index)
	local len = table.getn(index) /2
	local idx = {}
	for i=1,len  do
		local iField = bit.lshift(i,1)+1
		idx[i] = tonumber(index[iField-1])
	end
	return idx
end


function Project:new(o)
	local o = o or {} --create an object if none exist
	setmetatable(o, self) -- this is what creates the 'prototype' link lookup
	self.__index = self
	return o
end

function Project:len()
	return table.getn(self.index)
end

function Project:getValues()
	self.index = parseIndex(self.index)
	local index = self.index
	
	local values = {}
	local shit = {}

	-- Create an Iterator table
	local summary = nil

	-- For each item in contained in the LIST index
	for i=1, self:len() do
		-- Get all Fields and Values from the REDIS Key
		local id = tostring(index[i])
		summary = {next=summary, value = redis.call('hgetall', KEYS[1]..':'..id..':'..KEYS[2])}
	end
	
	-- Iterate and separate the values returned from the 'HGETALL' array 
	local s = summary
	local arr = {} -- Collection of records returend from REDIS
	local iter = 1
    while s do
    local list = {}
     for i=1,table.getn(s.value)/2 do
     	-- Map the fields and values
      	local iField = bit.lshift(i,1)+1
      	list[tostring(s.value[iField-2])] = s.value[iField-1]
      end
      	arr[iter] = list
      	iter = iter + 1
      	s = s.next
    end

   	-- Create a length property
    arr['length'] = iter-1 
    iter = nil  
	
	self.values = arr
end

local project = Project:new{index = redis.call('hgetall', 'index:'..KEYS[1]..':name')}
project:getValues()
return project:out()


