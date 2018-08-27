import './configuration.html';
import {Template} from "meteor/templating";
import {Meteor} from 'meteor/meteor';
import {Configuration} from "../../api/configuration";
import {Ingredients} from "../../api/ingredients";

Template.configuration.onCreated(function() {
    this.subscribe('users');
    this.subscribe('configuration');
    this.subscribe('ingredients');
});

Template.configuration.helpers({
    currentWeight(){
        return  Configuration.findOne({"name": "current_weight"}).value;
    },
    isStatus(status) {
        return Configuration.findOne({"name": "status"}).value.type == status;
    },
    getErrorText() {
        let error = Configuration.findOne({"name": "status"}).value;
        if(error.type == "ingredient_empty"){
            let valve = error.valve;
            let ingredientname = Ingredients.findOne({"pump": valve}).name;
            return TAPi18n.__('valveEmpty', {ingredientname, valve});

        } else {
            return TAPi18n.__('unexpectedError');
        }
    },
    getCocktailSettings() {
        let configuration = Configuration.findOne({"name": "cocktail"});
        if (configuration)
            return configuration.values;
    },
    getMixerSettings() {
        let configuration = Configuration.findOne({"name": "mixer"});
        if (configuration)
            return configuration.values;
    },
    scaleMode(){
        return Configuration.findOne({"name": "status"}).value.scale_mode;
    }
});

Template.configuration.events({
    'change #minamount-input'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        const value = parseInt(event.target.value);
        Meteor.call("configuration.update", "cocktail", "minamount", value);
    },
    'change #maxamount-input'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        const value = parseInt(event.target.value);
        Meteor.call("configuration.update", "cocktail", "maxamount", value);
    },
    'change #maxvol-input'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        const value = parseInt(event.target.value);
        Meteor.call("configuration.update", "cocktail", "maxvol", value);
    },
    'change #glassweight-input'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        const value = parseInt(event.target.value);
        Meteor.call("configuration.update", "mixer", "glassweight", value);
    },
    'change #checktime-input'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        const value = parseInt(event.target.value);
        Meteor.call("configuration.update", "mixer", "checktime", value);
    },
    'change #checkweight-input'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        const value = parseInt(event.target.value);
        Meteor.call("configuration.update", "mixer", "checkweight", value);
    },
    'click #refilled-button'(event) {
        // Prevent default browser form submit
        event.preventDefault();
        Meteor.call("configuration.setStatus", "mixing");
    },
    'click #not-available-button'(event) {
        // Prevent default browser form submit
        event.preventDefault();
        Meteor.call("configuration.ingredientNotAvailable");
    },
    'click #tare-scale'(event) {
        // Prevent default browser form submit
        event.preventDefault();
        Meteor.call("configuration.setStatus", "tare");
    },
    'click #scale-mode'(event) {
        // Prevent default browser form submit
        event.preventDefault();
        Meteor.call("configuration.setScaleMode");
    },
    'click #calibrate-scale'(event) {
        // Prevent default browser form submit
        event.preventDefault();
        $('#start-calibrating-modal')
            .modal({
                onApprove : function() {
                    Meteor.call("configuration.setStatus", "start_calibrating");
                    $('#calibrating-modal')
                        .modal({
                            closable  : false,
                            onApprove : function() {
                                Meteor.call("configuration.setStatus", "calibrate");
                            }
                        })
                        .modal('show')
                    ;
                }
            })
            .modal('show')
        ;
    },
});