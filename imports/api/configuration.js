import {Mongo} from 'meteor/mongo';
import {Ingredients} from "./ingredients";
import {Meteor} from "meteor/meteor";

export const Configuration = new Mongo.Collection('configuration');

Meteor.methods({
    'configuration.update'(type, name, value) {
        Configuration.update({"name": type}, {
            $set: {
                ["values." + name]: value,
            }
        });
    },
    'configuration.setCurrentWeight'(value) {
        Configuration.update({"name": "current_weight"}, {
            $set: {
                value: value,
            }
        });
    },
    'configuration.ingredientEmpty'(valve) {
        Configuration.update({"name": "status"}, {
            $set: {
                'value.type': 'ingredient_empty',
                'value.valve': valve
            }
        });

        let ingredient = Ingredients.findOne({pump: valve});
        Roles.getUsersInRole('admin').forEach((user) => {
            let lang = user.profile.language;
            if (!lang)
                lang = 'en';

            Meteor.call('notifications.send', user._id, {
                title: TAPi18n.__('ingredientEmpty', {ingredientname: ingredient.name}, lang_tag = lang),
                body: TAPi18n.__('valveEmpty', {ingredientname: ingredient.name, valve}, lang_tag = lang),
                icon: '/img/logo.png',
                url: Meteor.absoluteUrl() + 'configuration'
            });
        });
    },
    'configuration.setStatus'(status) {
        Configuration.update({"name": "status"}, {
            $set: {
                "value.type": status
            }

        });
    },
    'configuration.setScaleMode'() {
        let scaleMode = true;
        if (Configuration.findOne({"name": "status"}).value.scale_mode) {
            scaleMode = false;
        }
        Configuration.update({"name": "status"}, {
            $set: {
                "value.scale_mode": scaleMode
            }

        });
    },
    'configuration.ingredientNotAvailable'() {
        let error = Configuration.findOne({"name": "status"}).value;
        let valve = error.valve;
        if (valve) {
            Ingredients.update({"pump": valve}, {
                $set: {
                    "pump": 0
                }
            });
        }
        Configuration.update({"name": "status"}, {
            $set: {
                "value.type": "mixing"
            }

        });
    },
    'configuration.togglequeue'(enabled) {
        Configuration.update({"name": "queue_enabled"}, {
            $set: {
                value: enabled
            }
        });
    }
});

if (Meteor.isServer) {
    Meteor.publish('configuration', function () {
        return Configuration.find();
    });
}