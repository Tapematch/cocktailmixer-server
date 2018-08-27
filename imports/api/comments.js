import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Comments = new Mongo.Collection('comments');

Meteor.methods({
    'comments.insert'(cocktailId, text) {
        check(text, String);

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Comments.insert({
            cocktailId,
            user: Meteor.userId(),
            createdAt: new Date(),
            text
        });

        Meteor.call('feed.insert', cocktailId, Meteor.userId(), 'commentedCocktail', text);
    }
});

if (Meteor.isServer) {
    Meteor.publish('comments', function() {
        return Comments.find();
    });
}