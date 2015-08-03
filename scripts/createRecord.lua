-- Creates a new Initial Record with a unique ID
-- This is currently all static for now. Will need to be refactored.
-- Create a new System ID

local SYS_ID = nil
local status = nil

local collection = ARGV[1] -- This field represents the Table or Key name (ex. projects)
local ID = ARGV[2]  -- ID field to represent the data record. Should be non-numeric. This will match the path name (ex. adrian-test)
local tableName = 'summary' -- Default key which represents short details

local createRecord = function()
	status = redis.call('hmset', collection ..':'..tostring(SYS_ID)..':'..tableName, 
	KEYS[2], 			ID, 	-- RecordId 
	KEYS[3], 		ARGV[3],	-- Name or Title
	KEYS[4], 		ARGV[4],	-- Project Owner
	KEYS[5],		ARGV[5]		-- Project Thumbnail
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

