import { Mongo } from 'meteor/mongo';
import {Meteor} from "meteor/meteor";

export const Log = new Mongo.Collection('log');

Meteor.methods({
    'log.clear'() {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        Log.remove({});
    },
    'log.insert'(type, message){
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'machine')) {
            throw new Meteor.Error('not-authorized');
        }

        Log.insert({
            datetime: new Date(),
            source: 'mixer',
            type,
            message
        })
    }
});

if (Meteor.isServer) {
    Meteor.publish('log', function() {
        return Log.find();
    });
}