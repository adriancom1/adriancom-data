REDIS - PORTFOLIO - ADRIAN-S.COM

--------------------
ANGULAR
--------------------

Angular Seed Project:
See: https://github.com/angular/angular-seed
git clone --depth=1 https://github.com/angular/angular-seed.git <your-project-name>

Install it
npm install

Run the App
npm start

Update Angular
npm update

Update Bower
bower update

--------------------
HEROKU
--------------------
Public Dino: 
http://adriancom-data.herokuapp.com

Git URL:
git@heroku.com:adriancom-data.git
https://git.heroku.com/adriancom-data.git

Redis External Connection URL:
heroku redis:credentials
------------------------------------------------
redis://h:pc3ujvb8ko7kdq49fpda8l89g35@ec2-107-21-120-49.compute-1.amazonaws.com:11959

Add On Redis Docs:
------------------------------------------------
heroku addons:docs heroku-redis


Heroku Redis Toolkit:
------------------------------------------------
heroku plugins:install heroku-redis


Remote CLI Connect to Redis:
------------------------------------------------
heroku redis:cli --confirm arcane-cove-5466


Use Heroku toolbelt.
heroku run bash - Exec linux commands
heroku run node - Exec Node.Js
heroku config - Set or see config vars

DATA MODEL
--------------------
TABLES:
--------------------
ID (project id)
id:projects (generates the SYSTEM ID)

PROJECTS (List of Projects) LIST *** MAY NOT NEED
index:projects (list of active phones to display) (not needed now, but for future)

INDEX (lookup table by name and get the SYSTEM ID)
index:projects:name -- USE AS the MASTER INDEX

DETAILS (Full details per project)
projects:[ID]:details
projects:[ID]:summary (short details)

------------------------------
LUA Scripts:
------------------------------
getProjectList.lua
createRecord.lua
createDetails.lua

-- SHA for Creating a Record (createRecord.lua)
9405a753e95dfcb585a1db448df5427e0e4174e3
Fields are:
id, name, age, snippet

Copy and Paste:
evalsha 9405a753e95dfcb585a1db448df5427e0e4174e3 4 "dell-xp" "4" "Dell XP Phone" "This is the greatest phone on Pluto."

-- SHA for Creating a Details record (createDetails.lua)
evalsha 4cca2c1239f2630e73278a9d3e8ac93c7fae7add 4 "motorola-xoom" "Test of Additional Features great stuff" "Description in here" "Motorola Xoom 69"






