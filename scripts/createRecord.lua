-- Creates a new Initial Record with a unique ID
-- This is currently all static for now. Will need to be refactored.
-- Create a new System ID

local SYS_ID = nil
local status = nil
local args = {KEYS[1],KEYS[2],KEYS[3],KEYS[4],KEYS[5]}
--local args = {'projects','hash-test','{\"nadme\":\"Adrian\"}','Adrian Com','adrian-test-lg.png'} -- Debug
local collection = args[1] -- This field represents the Table or Key name (ex. projects)
local ID = args[2]  -- ID field to represent the data record. Should be non-numeric. This will match the path name (ex. adrian-test)
local tableName = 'summary' -- Default key which represents short details

local createRecord = function()
	status = redis.call('hmset', collection ..':'..tostring(SYS_ID)..':'..tableName, 
	'id', 			ID, 		-- Numeric ID 
	'name', 		args[3],	-- Name or Title
	'company', 		args[4],	-- Project Owner
	'image',		args[5]		-- Project Thumbnail
	)
end
 
local createId = function()
	-- Get the stored System ID if it exists
	SYS_ID = redis.call('hget', 'index:'..collection..':name', ID)
	if SYS_ID == false then
	-- If SYS_ID doesn't exist, then increment the id key
		SYS_ID = redis.call('incr', 'id:'..collection)
	end
	redis.call('hmset', 'index:'..collection..':name', ID, SYS_ID)
	return createRecord() 
end

local output = function(value)
	return cjson.encode(value)
end


-- Main --
createId()

-- Status is set by the insert hash command (HMSET)
if(status ~= nil) then
	if status.err then
		return output({["status"] = 'false'})
	else
		--return output({["status"] = status, redis.call('hgetall', collection..':'..tostring(SYS_ID)..':'..tableName)}) -- Debug
		return output({["status"] = 'true'})
	end
else 
	output({["status"] = 'false'})
end

