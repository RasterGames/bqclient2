define(["text!../config/config_build.json"],function(build){var config={dev:{host:"localhost",port:8e3,dispatcher:false},build:JSON.parse(build)};require(["text!../config/config_local.json"],function(local){try{config.local=JSON.parse(local)}catch(e){}});return config});