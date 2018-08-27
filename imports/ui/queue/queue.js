import './queue.html';
import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import {Queue} from "../../api/queue";
import {Cocktails} from "../../api/cocktails";

Template.queue.onCreated(function () {
    this.subscribe('users');
    this.subscribe('queue');
    this.subscribe('cocktails');

    var self = this;
    self.limit = new ReactiveVar(4);

    $(window).on('scroll', function (e) {
        var threshold, target = $("#showMoreResults");
        if (!target.length) return;

        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if (target.offset().top < threshold) {
            if (!target.data("visible")) {
                // console.log("target became visible (inside viewable area)");
                target.data("visible", true);
                self.limit.set(self.limit.get() + 5);
            }
        } else {
            if (target.data("visible")) {
                // console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
            }
        }
    });
});

function getCurrentQueueItem(){
    return Queue.find({status: {$ne: "waiting"}}, {sort: {createdAt: 1}, limit: 1});
}

Template.queue.onRendered(function () {
    $(window).scrollTop(0);

    Tracker.autorun(() => {
        let queueItem = getCurrentQueueItem().fetch()[0];
        if (queueItem) {
            let progress = queueItem.progress;
            $('#queueprogress').progress({
                percent: progress
            });
        }
    });
});

Template.queue.onDestroyed(function () {
    $(window).off('scroll');
});

Template.queue.helpers({
    queue() {
        return Queue.find({status: "waiting"}, {sort: {createdAt: 1}, limit: Template.instance().limit.get()});
    },
    hasMore() {
        return Queue.find({status: "waiting"}).count() > Template.instance().limit.get();
    },
    isInQueue(){
        return Queue.find({status: "waiting"}).count() > 0
    },
    getCurrentCocktail() {
        let id = getCurrentQueueItem().fetch()[0].cocktailId;
        return Cocktails.findOne(id);
    },
    getCurrentQueueItem() {
        return getCurrentQueueItem().fetch()[0];
    },
    isItemInQueue() {
        return getCurrentQueueItem().count() > 0;
    },
    statusIs(status) {
        return getCurrentQueueItem().fetch()[0].status == status;
    }
});

Template.queue.events({
    'click #start-mixing'(event, instance) {
        event.preventDefault();
        Meteor.call('queue.start');
    },
    'click #yes-cancel'(event, instance) {
        event.preventDefault();
        Meteor.call('queue.cancel');
        instance.$('.segment #cancel-dimmer').dimmer('hide');
    },
    'click #cancel'(event, instance) {
        instance.$('.segment #cancel-dimmer').dimmer('show');
    },
    'click #no-cancel'(event, instance) {
        instance.$('.segment #cancel-dimmer').dimmer('hide');
    },
});

Template.queueItem.helpers({
    getCocktail() {
        return Cocktails.findOne(this.cocktailId);
    }
});

Template.queueItem.events({
    'click .remove-queue'(event, instance) {
        instance.$('.segment').dimmer('show');
    },
    'click .no-remove'(event, instance) {
        instance.$('.segment').dimmer('hide');
    },
    'click .yes-remove'(event, instance) {
        Meteor.call('queue.remove', this._id);
    }
});