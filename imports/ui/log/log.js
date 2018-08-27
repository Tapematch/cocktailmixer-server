import './log.html'
import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import { Log } from "../../api/log";

Template.log.onCreated(function () {
    this.subscribe('log');
    this.limit = new ReactiveVar(50);
});

Template.log.helpers({
    log() {
        return Log.find({}, { sort: { datetime: -1 }, limit: Template.instance().limit.get()});
    },
    hasMore() {
        return Log.find({}).count() > Template.instance().limit.get();
    }
});

Template.log.events({
    'click #show-more'(event, instance) {
        event.preventDefault();
        Template.instance().limit.set(Template.instance().limit.get() + 50);
    },
});

Template.logmenu.events({
    'click #clear-log'(event, instance) {
        Meteor.call('log.clear');
    },
});

Template.logentry.helpers({
   formatDate(date) {
       return moment(date).format('MMMM Do YYYY, h:mm:ss a');
   }
});