import './editcocktail.html'
import {Cocktails} from "../../api/cocktails";
import {Ingredients} from "../../api/ingredients";
import {Template} from "meteor/templating";
import {ReactiveDict} from 'meteor/reactive-dict';

Template.editcocktail.onCreated(function bodyOnCreated() {
    this.state = new ReactiveDict();
    Tracker.autorun(() => {
        let id = FlowRouter.getParam("id");
        let cocktail = Cocktails.findOne(id);
        if (cocktail) {
            this.state.set('recipe', cocktail.recipe);
        } else {
            this.state.set('recipe', []);
        }
    });
});

Template.editcocktail.onRendered(function () {
    $('.ui.dropdown')
        .dropdown({fullTextSearch: true})
    ;
});

Template.editcocktail.helpers({
    cocktail() {
        let id = FlowRouter.getParam("id");
        return Cocktails.findOne(id);
    },
    ingredients() {
        let recipe = Template.instance().state.get('recipe');
        let ingredientIds = []
        if (recipe) {
            ingredientIds = recipe.map(a => a.ingredientId);
        }
        return Ingredients.find({_id: {$nin: ingredientIds}});
    },
    recipe() {
        return Template.instance().state.get('recipe');
    },
    ingredientName(id) {
        return Ingredients.findOne(id).name;
    },
    ingredientVol(id) {
        return Ingredients.findOne(id).vol;
    }
});

Template.editcocktail.events({
    'submit #new-cocktail'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const name = target.name.value;
        const description = target.description.value;
        const beforeInstruction = target.beforeInstruction.value;
        const afterInstruction = target.afterInstruction.value;
        const recipe = instance.state.get('recipe');

        let id = FlowRouter.getParam("id");
        Cocktails.upsert(id, {
            $set: {
                name,
                description,
                recipe,
                beforeInstruction,
                afterInstruction
            },
            $setOnInsert: {
                owner: Meteor.userId(),
                createdAt: new Date()
            }
        });

        FlowRouter.go("/");
    },
    'click #add-ingredient'(event, instance) {
        const ingredientId = $('#ingredient').val();
        const amount = parseInt($('#amount').val());
        let recipe = instance.state.get('recipe');
        recipe.push({
            ingredientId,
            amount
        });
        instance.state.set('recipe', recipe);
        $('#amount').val("");
        $('.ui.dropdown').dropdown('clear');
    },
    'click .remove-ingredient'(event, instance) {
        event.preventDefault();
        const ingredientId = $(event.target).closest('button').data('id');
        console.log(ingredientId);
        let recipe = instance.state.get('recipe');
        let index = recipe.map(function (x) {
            return x.ingredientId;
        }).indexOf(ingredientId);
        recipe.splice(index, 1);
        instance.state.set('recipe', recipe);
    }
});