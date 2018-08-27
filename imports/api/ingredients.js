import { Mongo } from 'meteor/mongo';

export const Ingredients = new Mongo.Collection('ingredients');

Meteor.methods({
    'ingredients.insert'(name) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        Ingredients.insert({
            name,
            pump: 0,
            vol: 0,
            createdAt: new Date(), // current time
        });
    },
    'ingredients.reset'() {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        Ingredients.update({}, {
            $set: {pump: 0}
        },{
            multi: true
        });
    },
    'ingredients.updateVol'(id, vol) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        Ingredients.update(id, {
            $set: {vol}
        });
    },
    'ingredients.updatePump'(id, pump) {
        const userId = Meteor.userId();
        if (!userId || !Roles.userIsInRole(userId, 'admin')){
            throw new Meteor.Error('not-authorized');
        }

        Ingredients.update(id, {
            $set: {pump}
        });
    }
});

if (Meteor.isServer) {
    Meteor.publish('ingredients', function() {
        return Ingredients.find();
    });
}