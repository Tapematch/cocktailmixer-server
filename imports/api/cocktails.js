import './functions.js'
import { Meteor } from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

export const Cocktails = new Mongo.Collection('cocktails');

Meteor.methods({
    'cocktails.upsert'(id, name, description, recipe, beforeInstruction, afterInstruction, tags, draft) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        const alcVol = getDrinkVol(recipe);
        const totalAmount = getTotalAmount(recipe);

        let result = Cocktails.upsert(id, {
            $set: {
                name,
                description,
                recipe,
                beforeInstruction,
                afterInstruction,
                alcVol,
                totalAmount,
                tags,
                draft
            },
            $setOnInsert: {
                owner: Meteor.userId(),
                createdAt: new Date(),
                favorites: [],
                favoriteCount: 0,
            }
        });

        let type = 'createdCocktail';
        if(id){
            type = 'updatedCocktail'
        }

        if (result.insertedId)
            id = result.insertedId;

        Meteor.call('feed.insert', id, Meteor.userId(), type);
        return id;
    },
    'cocktails.deleteDraft'(id) {
        let draft = Cocktails.findOne(id);

        const userId = Meteor.userId();
        if (!userId || userId != draft.owner) {
            throw new Meteor.Error('not-authorized');
        }

        Cocktails.update(id, {
            $set:{
                deleted: true
            }
        });
    },
    'cocktails.toggleFavorite'(cocktailId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let isFavorite = Cocktails.find({_id: cocktailId, favorites: Meteor.userId()}).count() > 0;
        let type = 'favoritedCocktail';
        let modifier = {
            $push: {
                favorites: Meteor.userId()
            },
            $inc: {
                favoriteCount: 1
            }
        };

        if (isFavorite) {
            type = 'unfavoritedCocktail';
            modifier = {
                $pull: {
                    favorites: Meteor.userId()
                },
                $inc: {
                    favoriteCount: -1
                }
            };
        }

        Cocktails.update(cocktailId, modifier);

        Meteor.call('feed.insert', cocktailId, Meteor.userId(), type);
    },
    'cocktails.insertPicture'(image, cocktailId) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Cocktails.update(cocktailId, {
            $push: {
                images: {
                    $each: [image],
                    $position: 0
                }
            }
        });

        Meteor.call('feed.insert', cocktailId, Meteor.userId(), 'addedImage', undefined, image);
    }
});

if (Meteor.isServer) {
    Meteor.publish('cocktails', function() {
        return Cocktails.find();
    });
}