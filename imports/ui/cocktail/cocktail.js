import './cocktail.html'
import {Cocktails} from "../../api/cocktails";
import {Template} from "meteor/templating";
import {Ingredients} from "../../api/ingredients";
import {Queue} from "../../api/queue";


Template.cocktail.helpers({
    getCocktail() {
        let id = FlowRouter.getParam("id");
        return Cocktails.findOne(id);
    },
    ingredientName(id){
        return Ingredients.findOne(id).name;
    },
});

Template.cocktailmenu.helpers({
    cocktailId() {
        return FlowRouter.getParam("id");
    },
});

Template.cocktail.events({
    'click .add-to-queue'(event, instance) {
        event.preventDefault();
        let cocktailId = FlowRouter.getParam("id");
        Queue.insert({
            cocktailId,
            status: 'waiting',
            progress: 0,
            user: Meteor.userId(),
            createdAt: new Date(), // current time
        });
    }
});