import {Template} from 'meteor/templating';
import {Cocktails} from "/imports/api/cocktails";
import './cocktaillist.html';
import {Ingredients} from "../../api/ingredients";
import {Meteor} from 'meteor/meteor';

Template.cocktailListItem.onRendered(function () {
    $('.unstackable.items > .item')
        .transition({
            animation : 'fade up in',
            duration  : 400,
            interval  : 50,
            queue:  false
        })
    ;
});

Template.cocktaillist.helpers({
    cocktails() {
        return Cocktails.find({});
    },
});

Template.cocktailListItem.helpers({
    ingredientName(id){
        return Ingredients.findOne(id).name;
    },
    userName(id){
        return Meteor.users.findOne(id).profile.name;
    },
});