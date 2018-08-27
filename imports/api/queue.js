import {Mongo} from 'meteor/mongo';
import {Meteor} from "meteor/meteor";

export const Queue = new Mongo.Collection('queue');

Meteor.methods({
    'queue.start'() {
        let queueItem = Queue.find({status: "next"}, {sort: {createdAt: 1}}).fetch()[0];

        const userId = Meteor.userId();
        if (userId != queueItem.user && !Roles.userIsInRole(userId, 'admin')) {
            throw new Meteor.Error('not-authorized');
        }

        Queue.update(queueItem._id, {
            $set: {
                status: 'start'
            }
        });
    },
    'queue.cancel'() {
        let queueItem = Queue.find({status: {$ne: "waiting"}}, {sort: {createdAt: 1}}).fetch()[0];

        const userId = Meteor.userId();
        if (userId != queueItem.user && !Roles.userIsInRole(userId, 'admin')) {
            throw new Meteor.Error('not-authorized');
        }

        Queue.update(queueItem._id, {
            $set: {
                status: 'canceled'
            }
        });
    },
    'queue.updateStatus'(id, status) {
        const userId = Meteor.userId();
        console.log(userId);
        if (!userId || !Roles.userIsInRole(userId, 'machine')) {
            throw new Meteor.Error('not-authorized');
        }

        Queue.update(id, {
            $set: {
                status: status
            }
        });
    },
    'queue.updateCurrentPart'(id, part) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'machine')) {
            throw new Meteor.Error('not-authorized');
        }

        Queue.update(id, {
            $set: {
                current: part
            }
        });
    },
    'queue.updateProgress'(id, progress) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'machine')) {
            throw new Meteor.Error('not-authorized');
        }

        Queue.update(id, {
            $set: {
                progress: progress
            }
        });
    },
    'queue.remove'(id) {
        let queueItem = Queue.findOne(id);

        const userId = Meteor.userId();
        if (userId != queueItem.user && !Roles.userIsInRole(userId, 'admin')) {
            throw new Meteor.Error('not-authorized');
        }

        Queue.remove(id);
    },
    'cocktails.addToQueue'(cocktailId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let result = Queue.upsert({user: Meteor.userId()}, {
            $set: {cocktailId: cocktailId},
            $setOnInsert: {
                status: 'waiting',
                progress: 0,
                user: Meteor.userId(),
                createdAt: new Date()
            }
        });

        Meteor.call('feed.insert', cocktailId, Meteor.userId(), 'addedToQueue');

        return result.insertedId;
    },
});

if (Meteor.isServer) {
    Meteor.publish('queue', function () {
        return Queue.find();
    });
}