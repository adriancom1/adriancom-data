-- Creates a new Initial Record with a unique ID
-- This is currently all static for now. Will need to be refactored.
-- Create a new System ID

local SYS_ID = nil
local status = nil
local ID = KEYS[1]  -- ID field to represent the data record. Should be non-numeric. This will match the path name
--local ID = 'adrian-test' -- UNCOMMENT TO DEBUG
local collection = 'projects' --Future allow parameters from ARGV 
local tableName = 'summary'

local createRecord = function()
	status = redis.call('hmset', collection ..':'..tostring(SYS_ID)..':'..tableName, 
	'id', 	ID,
	'age', 	KEYS[2],
	'name', KEYS[3],
	'snippet', KEYS[4])
	
	--UNCOMMENT TO DEBUG 
		-- 'id', 	'adrian-test',
		-- 'age', 	'0',
		-- 'name', 'Adrian Test',
		-- 'snippet', 'Description in here')
	
end

local createId = function()
	SYS_ID = redis.call('incr', 'id:'..collection)
	redis.call('hmset', 'index:'..collection..':name', ID, SYS_ID)
	return createRecord()
end

local output = function(value)
	return cjson.encode(value)
end


-- Main --
createId()

if(status ~= nil) then
	return output({["status"] = status, redis.call('hgetall', collection..':'..tostring(SYS_ID)..':'..tableName)})
end

