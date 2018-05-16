import './queue.html';
import {Ingredients} from "../../api/ingredients";
import {Template} from "meteor/templating";
import {Queue} from "../../api/queue";
import {Cocktails} from "../../api/cocktails";
import {Meteor} from "meteor/meteor";

Template.queue.helpers({
    queue() {
        return Queue.find({status: "waiting"}, {sort: {createdAt: 1}});
    },
    getCurrentCocktail() {
        let id = Queue.find({status: {$ne: "waiting"}}, {sort: {createdAt: 1}}).fetch()[0].cocktailId;
        return Cocktails.findOne(id);
    },
    getQueueItem() {
        return Queue.find({status: {$ne: "waiting"}}, {sort: {createdAt: 1}}).fetch()[0];
    }
});

Template.queue.events({
    'click #start-mixing'(event, instance) {
        event.preventDefault();
        let id = Queue.find({status: "loaded"}, {sort: {createdAt: 1}}).fetch()[0]._id;
        Queue.update(id
            , {
                $set: {
                    status: 'start'
                }
            });
    }, 'click #cancel'(event, instance) {
        event.preventDefault();
        let id = Queue.find({status: {$ne: "waiting"}}, {sort: {createdAt: 1}}).fetch()[0]._id;
        Queue.update(id
            , {
                $set: {
                    status: 'canceled'
                }
            });
    }
});

Template.queueItem.helpers({
    getCocktail() {
        return Cocktails.findOne(this.cocktailId);
    }
});