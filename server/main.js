import { Meteor } from 'meteor/meteor';
import '../imports/api/cocktails.js';
import '../imports/api/ingredients.js';
import '../imports/api/queue.js';
import '../imports/api/configuration.js';
import '../imports/api/log.js';
import {Configuration} from "../imports/api/configuration";



Meteor.startup(() => {
  if(Configuration.find({}).count() == 0){
      Configuration.insert({"name" : "status", "value" : { "type" : "ok" }});
  }
});
