import './users.html'
import {Template} from "meteor/templating";

Template.users.onCreated(function() {
    this.subscribe('users');
    this.limit = new ReactiveVar(20);
});

Template.users.helpers({
    users() {
        return Meteor.users.find({}, { sort: { 'profile.name': 1 }, limit: Template.instance().limit.get()});
    },
    hasMore() {
        return Meteor.users.find({}).count() > Template.instance().limit.get();
    }
});

Template.user.helpers({
    formatDate(date) {
        return moment(date).format('MMMM Do YYYY, h:mm:ss a');
    },
    isOnline(){
        let status = this.status;
        if(status){
            return status.online;
        }
    },
    adminChecked(){
        if(Roles.userIsInRole(this._id, 'admin')){
            return 'checked';
        }
    },
    machineChecked(){
        if(Roles.userIsInRole(this._id, 'machine')){
            return 'checked';
        }
    },
});

Template.users.events({
    'click #show-more'(event, instance) {
        event.preventDefault();
        Template.instance().limit.set(Template.instance().limit.get() + 20);
    },
});
Template.user.events({
    'change .toggle-admin'(event) {
        const admin = event.target.checked;
        Meteor.call('users.toggleadmin', this._id, admin);
    },
    'click .set-machine'(event) {
        Meteor.call('users.setmachine', this._id);
    },
});