import { Mongo } from 'meteor/mongo';
import {Meteor} from "meteor/meteor";

export const Feed = new Mongo.Collection('feed');

Meteor.methods({
    'feed.insert'(objectId, user, type, content, image) {
        const userId = Meteor.userId();
        if (userId != user && !Roles.userIsInRole(userId, 'admin') && !Roles.userIsInRole(userId, 'machine')){
            throw new Meteor.Error('not-authorized');
        }

        Feed.insert({
            user,
            objectId,
            type,
            content,
            image,
            datetime: new Date()
        });
    }
});

if (Meteor.isServer) {
    Meteor.publish('feed', function() {
        return Feed.find();
    });
}