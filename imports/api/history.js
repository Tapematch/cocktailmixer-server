import './functions.js';
import { Mongo } from 'meteor/mongo';
import {Meteor} from "meteor/meteor";
import {Cocktails} from "./cocktails";

export const History = new Mongo.Collection('history');

Meteor.methods({
    'history.insert'(cocktailId, userId) {
        const currentUserId = Meteor.userId();
        if (!currentUserId || !Roles.userIsInRole(currentUserId, 'machine')) {
            throw new Meteor.Error('not-authorized');
        }

        History.insert({
            cocktailId,
            user: userId,
            finishedAt: new Date()
        });

        let user = Meteor.users.findOne(userId);
        if(user.profile.weight && user.profile.gender) {
            let m = user.profile.weight;
            let r = 0.6;
            if (user.profile.gender == 'male') {
                r = 0.7;
            }
            let cocktail = Cocktails.findOne(cocktailId);
            let vol = getDrinkVol(cocktail.recipe);
            let totalAmount = getTotalAmount(cocktail.recipe);
            let alcoholAmount = (totalAmount * vol / 100) * 0.8;
            let permille = alcoholAmount / (m * r);
            permille = permille * 0.8; //

            Meteor.users.update(userId, {
                $inc: {
                    'profile.bac': permille,
                }
            });
        }

        Meteor.call('feed.insert', cocktailId, userId, 'mixedCocktail');
    }
});

if (Meteor.isServer) {
    Meteor.publish('history', function() {
        return History.find();
    });
}