import './drafts.html';
import {Meteor} from "meteor/meteor";
import {Cocktails} from "../../api/cocktails";

Template.drafts.onCreated(function(){
    this.subscribe('cocktails');
});

Template.drafts.helpers({
    getDrafts() {
        return Cocktails.find({owner: Meteor.userId(), draft: true, deleted: {$ne: true}});
    },
    hasDrafts(){
        return Cocktails.find({owner: Meteor.userId(), draft: true, deleted: {$ne: true}}).count() > 0;
    }
});