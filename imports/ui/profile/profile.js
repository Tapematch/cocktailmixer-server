import '/imports/api/functions.js'
import './profile.html';
import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import Sortable from 'sortablejs';
import {Cocktails} from "../../api/cocktails";
import {Ingredients} from "../../api/ingredients";

Template.profile.onCreated(function() {
    this.subscribe('cocktails');
    this.subscribe('ingredients');
});

Template.profile.onRendered(function() {
    $(window).scrollTop(0);

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {

            $('.ui.dropdown')
                .dropdown()
            ;
            $('#only-nonalcoholic-slider').checkbox();

            let recommendationData = Meteor.user().profile.recommendationData;

            $('#gender-dropdown').dropdown('set selected', Meteor.user().profile.gender);

            if (recommendationData && recommendationData.onlyNonalcoholic) {
                $('#only-nonalcoholic-slider').checkbox('check');
            }

            let ail = document.getElementById('alcoholic-ingredient-list');
            let ailSortable = Sortable.create(ail, {
                animation: 100,
                handle: ".bars.icon",
                onUpdate: function (evt) {
                    let sortedIDs = ailSortable.toArray();
                    Meteor.call('users.setAlcoholicIngredients', sortedIDs);
                },
            });
            if (recommendationData && recommendationData.alcoholicIngredients) {
                let alcoholicIngredients = Meteor.user().profile.recommendationData.alcoholicIngredients;
                ailSortable.sort(alcoholicIngredients);
            }

            let nil = document.getElementById('nonalcoholic-ingredient-list');
            let nilSortable = Sortable.create(nil, {
                animation: 100,
                handle: ".bars.icon",
                onUpdate: function (evt) {
                    let sortedIDs = nilSortable.toArray();
                    Meteor.call('users.setNonalcoholicIngredients', sortedIDs);
                },
            });
            if (recommendationData && recommendationData.nonalcoholicIngredients) {
                let nonalcoholicIngredients = Meteor.user().profile.recommendationData.nonalcoholicIngredients;
                nilSortable.sort(nonalcoholicIngredients);
            }
        }
    });
});

Template.profile.helpers({
    getAlcoholicIngredients(){
        return Ingredients.find({vol: {$gt: 0}});
    },
    getNonalcoholicIngredients(){
        return Ingredients.find({vol: 0});
    },
    getTags(){
        let tags = [];
        let addedTags = [];
        Cocktails.find().forEach((cocktail) => {
            if(cocktail.tags) {
                cocktail.tags.forEach((tag) => {
                    if(!addedTags.includes(tag)) {
                        addedTags.push(tag);
                        tags.push(tag)
                    }
                });
            }
        });
        return tags;
    },
    isTagSelected(tag) {
        let recommendationData = Meteor.user().profile.recommendationData;
        if(recommendationData){
            return recommendationData.tags.includes(tag);
        }
    },
    isNewProfile(){
        return FlowRouter.getRouteName() == 'newProfile';
    }
});

Template.profile.events({
    'change #upload-picture-input'(event, instance) {
        event.preventDefault();
        instance.$('.image .dimmer').dimmer('show');

        let pictureDeleteHash = Meteor.user().profile.pictureDeleteHash;
        if (pictureDeleteHash) {
            Imgur.delete(deleteOptions(pictureDeleteHash), function () {})
        }

        let imgurCallback = function (errMsg, imgurData) {
            if (errMsg) return alert(errMsg);

            let picture = imgurData.link;
            let pictureDeleteHash = imgurData.deletehash;
            Meteor.call('users.setProfilePicture', picture, pictureDeleteHash);

            instance.$('.image .dimmer').dimmer('hide');
        };

        if (event.target.files.length != 0) {
            var file = event.target.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                Imgur.upload(uploadOptions(e.target.result), imgurCallback);
            };
            reader.readAsDataURL(file);
        }
    },
    'change #name-input'(event) {
        event.preventDefault();

        const target = event.target;
        const name = target.value;

        Meteor.call('users.updateName', name);
    },
    'change #gender-dropdown'(event, instance) {
        event.preventDefault();

        const target = event.target;
        const gender = target.value;

        Meteor.call('users.updateGender', gender);
    },
    'change #weight-input'(event) {
        event.preventDefault();

        const target = event.target;
        const weight = parseInt(target.value);

        Meteor.call('users.updateWeight', weight);
    },
    'change #only-nonalcoholic'(event, instance) {
        const onlyNonalcoholic = event.target.checked;
        Meteor.call('users.setOnlyNonalcoholic', onlyNonalcoholic);
    },
    'click .selectable.label'(event){
        let tag = $(event.target).data('tag');
        Meteor.call('users.toggleTag', tag);
    }
});