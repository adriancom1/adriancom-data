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
heroku redis:cli --confirm adriancom-data


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

Copy and Paste: (createRecord.lua)
evalsha 9405a753e95dfcb585a1db448df5427e0e4174e3 4 "adrian-test" "2" "Dell XP Phone" "This is the greatest phone on Pluto."

-- SHA for Creating a Details record (createDetails.lua)
evalsha 4cca2c1239f2630e73278a9d3e8ac93c7fae7add 4 "motorola-xoom" "Test of Additional Features great stuff" "Description in here" "Motorola Xoom 69"



------------------------------
CONFIG NODE JS FOR PROD / DEV
------------------------------
https://github.com/lorenwest/node-config

Use the:
npm config module

$ npm install config
$ mkdir config
$ vi config/default.json

{
  // Customer module configs
  "Customer": {
    "dbConfig": {
      "host": "localhost",
      "port": 5984,
      "dbName": "customers"
    },
    "credit": {
      "initialLimit": 100,
      // Set low for development
      "initialDays": 1
    }
  }
}


------------------------------
Amazon SW3 CLI
------------------------------
pip install awscli
S3 Bucket
Endpoint: adriancom.s3-website-us-west-2.amazonaws.com
Bucket: adriancom

Sync Files & Folders
aws s3 sync . s3://adriancom --exclude ".DS_*" (copies root folders also)


S3 CLI Docs
http://docs.aws.amazon.com/cli/latest/reference/s3/sync.html

GZIP
Must have propoer metadata set on S3:
Content-Type: (automatic) binary/octet
Content-Encoding: gzip (manually add this)

------------------------------
GRUNT config for Adriancom-UI
------------------------------
npm install --save-dev grunt

Grunt Object
{ nameArgs: 'log:foo',
  name: 'log',
  args: [],
  flags: {},
  async: [Function],
  errorCount: [Getter],
  requires: [Function],
  requiresConfig: [Function],
  options: [Function],
  target: 'foo',
  data: [ 1, 2, 3 ],
  files: [ { src: [Getter], dest: 'foo', orig: [Object] } ],
  filesSrc: [Getter] }


------------------------------
ShellJS
------------------------------
- Sed command will look inside a file and replace or append text (powerful)

sed('-i', 'BUILD_VERSION', 'v0.1.2', file);
sed('-i', /.*REMOVE_THIS_LINE.*\n/, '', file);
sed('-i', /.*REPLACE_LINE_WITH_MACRO.*\n/, cat('macro.js'), file);



------------------------------
Grunt Bower Install
------------------------------
*Interesting But Sed is cool also.
npm install --save-dev grunt-wiredep
grunt.loadNpmTasks('grunt-wiredep');

Add this to your HTML file:
<!-- bower:js -->
<!-- endbower -->
And Done!

*also can take advantage of Bower hooks such as "postinstall:"

Wiredep s
Options:
  -h, --help          # Print usage information
  -v, --version       # Print the version
  -b, --bowerJson     # Path to `bower.json`
  -d, --directory     # Your Bower directory
  -e, --exclude       # A path to be excluded
  -i, --ignorePath    # A path to be ignored
  -s, --src           # Path to your source file
  --dependencies      # Include Bower `dependencies`
  --devDependencies   # Include Bower `devDependencies`
  --includeSelf       # Include top-level bower.json `main` files
  --verbose           # Print the results of `wiredep`


------------------------------
Content
------------------------------
JSON data schema
createRecord.lua (Summary)
[{

  "id":   "",  
  "name": "",
  "title": "",
  "company": "",
  "headline": "",
  "year": "",
  "platform1": "",
  "platform2": "",
  "randomQuote": "",
  "quoteAuthor": ""


}]


