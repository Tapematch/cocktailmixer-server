import { Mongo } from 'meteor/mongo';

export const Ingredients = new Mongo.Collection('ingredients');

Meteor.methods({
    'ingredients.reset'() {
        Ingredients.update({}, {
            $set: {pump: 0}
        },{
            multi: true
        });
    }
});