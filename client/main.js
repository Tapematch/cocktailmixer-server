import '/imports/startup/client/router.js';
import '/imports/startup/client/accounts.js';
import {Template} from "meteor/templating";
import {Ingredients} from "../imports/api/ingredients";
import {Meteor} from "meteor/meteor";

BlazeLayout.setRoot('body');

Template.main.events({
    'click #open-sidebar'(event) {
        $('.ui.sidebar')
            .sidebar('toggle')
        ;
    },
    'click .sidebar.menu > .item'(event) {
        $('.ui.sidebar')
            .sidebar('toggle')
        ;
    },
});

Template.main.helpers({
    heading() {
        return FlowRouter.getRouteName();
    }
});

function getDrinkVol(recipe) {
    let totalAmount = 0;
    let alcoholAmount = 0;
    recipe.forEach(function (part) {
        let amount = part.amount;
        totalAmount = totalAmount + amount;
        let ingredient = Ingredients.findOne(part.ingredientId);
        let percent = ingredient.vol;
        if (percent > 0) {
            alcoholAmount = alcoholAmount + ((percent * amount) / 100);
        }
    });
    return alcoholAmount / totalAmount * 100;
}

Template.registerHelper('getStrengthColor', function (recipe) {
    let drinkVol = getDrinkVol(recipe);
    if (drinkVol >= 15)
        return "violet";
    else if (drinkVol >= 10)
        return "red";
    else if (drinkVol >= 5)
        return "yellow";
    else if (drinkVol > 0)
        return "olive";
    else
        return "blue";
});

Template.registerHelper('getStrength', function (recipe) {
    let drinkVol = getDrinkVol(recipe);
    if (drinkVol >= 15)
        return "extra strong";
    else if (drinkVol >= 10)
        return "strong";
    else if (drinkVol >= 5)
        return "medium";
    else if (drinkVol > 0)
        return "weak";
    else
        return "nonalcoholic";
});

Template.registerHelper('isMine', function (id) {
    return id === Meteor.userId();
});

Template.registerHelper('isNotAvailable', function (recipe) {
    let isNotAvailable = false;
    recipe.forEach(function (part) {
        let ingredient = Ingredients.findOne(part.ingredientId);
        if (ingredient.pump === 0) {
            isNotAvailable = true;
        }
    });
    return isNotAvailable;
});

Template.registerHelper('userName', function (id) {
    return Meteor.users.findOne(id).profile.name;
});