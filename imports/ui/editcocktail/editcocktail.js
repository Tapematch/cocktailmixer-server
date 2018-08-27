import '/imports/api/functions.js'
import './editcocktail.html'
import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import {ReactiveDict} from 'meteor/reactive-dict';
import {Cocktails} from "../../api/cocktails";
import {Ingredients} from "../../api/ingredients";
import {Configuration} from "../../api/configuration";
import {Queue} from "../../api/queue";

Template.editcocktail.onCreated(function bodyOnCreated() {
    this.subscribe('cocktails');
    this.subscribe('ingredients');
    this.subscribe('configuration');
    this.subscribe('queue');

    this.state = new ReactiveDict();
    this.state.set('saved', false);
    this.state.set('recipe', []);
    Tracker.autorun(() => {
        if(this.subscriptionsReady()) {
            let id = FlowRouter.getParam("id");
            let cocktail = Cocktails.findOne(id);
            if (cocktail) {
                this.state.set('recipe', cocktail.recipe);
            }
        }
    });
});

Template.editcocktail.onRendered(function () {
    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            $('#ingredient-dropdown')
                .dropdown({fullTextSearch: true})
            ;

            let values = [];
            let addedValues = [];
            Cocktails.find().forEach((cocktail) => {
                if (cocktail.tags) {
                    cocktail.tags.forEach((tag) => {
                        if (!addedValues.includes(tag)) {
                            addedValues.push(tag);
                            values.push({
                                name: tag,
                                value: tag,
                                text: tag
                            })
                        }
                    });
                }
            });

            $('#tags-dropdown').dropdown({
                allowAdditions: true,
                keys: {
                    delimiter: 13
                },
                values
            });

            let id = FlowRouter.getParam("id");
            if(id) {
                let cocktail = Cocktails.findOne(id);
                $('#tags-dropdown').dropdown('set selected', cocktail.tags);
            }

            $('.ui.form')
                .form({
                    fields: {
                        name: {
                            identifier: 'name',
                            rules: [
                                {
                                    type: 'empty',
                                    prompt: TAPi18n.__('nameEmpty')
                                },
                                {
                                    type: 'minLength[3]',
                                    prompt: TAPi18n.__('nameLength', {length: 3})
                                }
                            ]
                        },
                        description: {
                            identifier: 'description',
                            rules: [
                                {
                                    type: 'empty',
                                    prompt: TAPi18n.__('descriptionEmpty')
                                },
                                {
                                    type: 'minLength[20]',
                                    prompt: TAPi18n.__('descriptionLength', {length: 20})
                                }
                            ]
                        },
                        tags: {
                            identifier: 'tags',
                            rules: [
                                {
                                    type: 'minCount[3]',
                                    prompt: TAPi18n.__('tagsCount', {count: 3})
                                }
                            ]

                        }
                    }
                })
            ;

            $('.ui.accordion')
                .accordion()
            ;

            $('.popup-wrapper')
                .popup()
            ;
        }
    });
});

function nameExists() {
    if(!Template.instance().state.get('saved')) {
        let id = FlowRouter.getParam("id");
        let name = Template.instance().state.get('name');
        return Cocktails.findOne({$and: [{_id: {$ne: id}}, {draft: {$ne: true}}, {"name": {$regex: new RegExp("^" + name + "$", "i")}}]});
    }
}

function hasNoRecipe() {
    return Template.instance().state.get('recipe').length < 2;
}

function notEnough() {
    let config = Configuration.findOne({"name": "cocktail"});
    if(config){
        let amount = getTotalAmount(Template.instance().state.get('recipe'));
        return amount < config.values.minamount;
    }
}

function tooMuch() {
    let config = Configuration.findOne({"name": "cocktail"});
    if(config){
        let amount = getTotalAmount(Template.instance().state.get('recipe'));
        return amount > config.values.maxamount;
    }
}

function isTooStrong() {
    let config = Configuration.findOne({"name": "cocktail"});
    if(config){
        let amount = getDrinkVol(Template.instance().state.get('recipe'));
        return amount > config.values.maxvol;
    }
}

function isInQueue() {
    let id = FlowRouter.getParam("id");
    return Queue.findOne({cocktailId: id});
}

Template.editcocktail.helpers({
    cocktail() {
        let id = FlowRouter.getParam("id");
        if(id) {
            return Cocktails.findOne(id);
        }
    },
    availableIngredients() {
        let recipe = Template.instance().state.get('recipe');
        let ingredientIds = [];
        if (recipe) {
            ingredientIds = recipe.map(a => a.ingredientId);
        }
        return Ingredients.find({_id: {$nin: ingredientIds}, pump: {$ne: 0}}, {sort: {vol: -1}});
    },
    notAvailableIngredients() {
        let recipe = Template.instance().state.get('recipe');
        let ingredientIds = [];
        if (recipe) {
            ingredientIds = recipe.map(a => a.ingredientId);
        }
        return Ingredients.find({_id: {$nin: ingredientIds}, pump: 0}, {sort: {vol: -1}});
    },
    recipe() {
        return Template.instance().state.get('recipe');
    },
    ingredientName(id) {
        return Ingredients.findOne(id).name;
    },
    ingredientVol(id) {
        return Ingredients.findOne(id).vol;
    },
    nameExists() {
        return nameExists();
    },
    similarRecipeExists() {
        //search a cocktail with the same ingredients, not less, not more
        if(!Template.instance().state.get('saved')) {
            let recipe = Template.instance().state.get('recipe');
            let queryRecipe = recipe.map(part => ({
                'recipe.ingredientId': part.ingredientId
            }));
            let ingredientIds = recipe.map(a => a.ingredientId);
            Ingredients.find({_id: {$nin: ingredientIds}}).forEach(function (ingredient) {
                queryRecipe.push({
                    'recipe.ingredientId': {$ne: ingredient._id}
                })
            });
            let id = FlowRouter.getParam("id");
            queryRecipe.push({_id: {$ne: id}}); //exclude the cocktail that is currently edited
            queryRecipe.push({draft: {$ne: true}});
            return Cocktails.findOne({$and: queryRecipe});
        }
    },
    hasNoRecipe(){
        return hasNoRecipe();
    },
    isTooStrong(){
        return isTooStrong();
    },
    notEnough(){
        return notEnough();
    },
    tooMuch(){
        return tooMuch();
    },
    getPopupText(){
        if(nameExists()){
            return TAPi18n.__('nameExists');
        } else if(hasNoRecipe()){
            return TAPi18n.__('hasNoRecipe');
        } else if(notEnough()){
            let minAmount = Configuration.findOne({"name": "cocktail"}).values.minamount;
            return TAPi18n.__('notEnough', {minAmount});
        } else if(tooMuch()){
            let maxAmount = Configuration.findOne({"name": "cocktail"}).values.maxamount;
            return TAPi18n.__('tooMuch', {maxAmount});
        } else if(isTooStrong()){
            return TAPi18n.__('isTooStrong');
        }
    },
    isNotAvailable(ingredient){
        return ingredient.pump === 0;
    },
    isNewCocktail(){
        return FlowRouter.getRouteName() == 'newCocktail';
    },
    isInQueue(){
        return isInQueue();
    }
});

Template.editcocktail.events({
    'submit #new-cocktail'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();
        $('input[type="submit"]').addClass("loading");
        instance.state.set('saved', true);
        // Get value from form element
        const target = event.target;

        const tags = target.tags.value.split(',');
        const name = target.name.value;
        const description = target.description.value;
        const beforeInstruction = target.beforeInstruction.value;
        const afterInstruction = target.afterInstruction.value;
        const recipe = instance.state.get('recipe');

        let id = FlowRouter.getParam("id");
        Meteor.call('cocktails.upsert', id, name, description, recipe, beforeInstruction, afterInstruction, tags, false, (error, result) => {
            if(!error){
                FlowRouter.go("/cocktail/" + result);
            }
        });
        $('input[type="submit"]').removeClass("loading");
    },
    'click #save-draft'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();

        $('#save-draft').addClass("loading");
        instance.state.set('saved', true);

        let name = $('[name="name"]').val();
        if(!name || name == ""){
            name = TAPi18n.__('newDraft');
        }

        let tags = $('[name="tags"]').val().split(',').filter(String);

        const description = $('[name="description"]').val();
        const beforeInstruction = $('[name="beforeInstruction"]').val();
        const afterInstruction = $('[name="afterInstruction"]').val();
        const recipe = instance.state.get('recipe');

        let id = FlowRouter.getParam("id");
        Meteor.call('cocktails.upsert', id, name, description, recipe, beforeInstruction, afterInstruction, tags, true, (error, result) => {
            if(!error){
                FlowRouter.go("/cocktail/" + result);
            }
        });
        $('#save-draft').removeClass("loading");
    },
    'click #delete-draft'(event, instance) {
        event.preventDefault();
        $('#delete-draft').addClass("loading");
        let id = FlowRouter.getParam("id");
        Meteor.call('cocktails.deleteDraft', id);
        FlowRouter.go("/drafts");
        $('#delete-draft').removeClass("loading");
    },
    'click #add-ingredient'(event, instance) {
        event.preventDefault();
        $('#add-ingredient').addClass("loading");
        const ingredientId = $('#ingredient').val();
        const amount = parseInt($('#amount').val());

        if(!amount) {
            $('#amount-field').addClass('error');
        } else {
            $('#amount-field').removeClass('error');
        }

        if(!ingredientId) {
            $('#ingredient-field').addClass('error');
        } else {
            $('#ingredient-field').removeClass('error');
        }

        if(ingredientId && amount) {
            let name = Ingredients.findOne(ingredientId).name;
            let recipe = instance.state.get('recipe');
            recipe.push({
                ingredientId,
                amount,
                name
            });
            instance.state.set('recipe', recipe);
            $('#amount').val("");
            $('#ingredient-dropdown').dropdown('clear');
        }
        $('#add-ingredient').removeClass("loading");
    },
    'click .remove-ingredient'(event, instance) {
        event.preventDefault();
        const ingredientId = $(event.target).closest('button').data('id');
        let recipe = instance.state.get('recipe');
        let index = recipe.map(function (x) {
            return x.ingredientId;
        }).indexOf(ingredientId);
        recipe.splice(index, 1);
        instance.state.set('recipe', recipe);
    },
    'input input[name=name]'(event, instance) {
        instance.state.set('name', event.target.value);
    }
});