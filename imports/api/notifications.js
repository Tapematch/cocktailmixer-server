import { Mongo } from 'meteor/mongo';
import {Meteor} from "meteor/meteor";
export const Notifications = new Mongo.Collection('notifications');

Meteor.methods({
    'notifications.send'(userId, options){
        let id = Notifications.insert({
            userId,
            title: options.title,
            body: options.body,
            icon: options.icon,
            image: options.image,
            url: options.url
        });
        Meteor.setTimeout(function () {
            Notifications.remove(id);
        }, 60000);

        let pushData = {
            from: 'CocktailMixer',
            title: options.title,
            text: options.body,
            query: {
                userId
            }
        };
        if(options.image){
           pushData.gcm = {
               image: options.image
           }
        }
        Push.send(pushData);
    }
});

if (Meteor.isServer) {
    Meteor.publish('notifications', function () {
        return Notifications.find({
            userId: this.userId
        });
    });
}

Notifications.allow({
    insert: function () {
        return false;
    },
    update: function () {
        return false;
    },
    remove: function (userId, doc) {
        return userId === doc.userId;
    }
});