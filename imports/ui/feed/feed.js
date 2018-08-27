import './feed.html';
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Feed} from "../../api/feed";
import {Cocktails} from "../../api/cocktails";

Template.feed.onCreated(function () {
    this.subscribe('users');
    this.subscribe('feed');
    this.subscribe('cocktails');

    var self = this;
    self.timespan = new ReactiveVar(1);

    self.limit = new ReactiveVar(20);
    $(window).on('scroll', function (e) {
        var threshold, target = $("#showMoreResults");
        if (!target.length) return;

        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if (target.offset().top < threshold) {
            if (!target.data("visible")) {
                // console.log("target became visible (inside viewable area)");
                target.data("visible", true);
                self.limit.set(self.limit.get() + 20);
            }
        } else {
            if (target.data("visible")) {
                // console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
            }
        }
    });
});

Template.feed.onRendered(function () {
    $(window).scrollTop(0);

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            $('#timespan-dropdown').dropdown();
        }
    });
});

Template.feed.helpers({
    feed() {
        return Feed.find({}, { sort: { datetime: -1 }, limit: Template.instance().limit.get()});
    },
    hasMore() {
        return Feed.find({}).count() > Template.instance().limit.get();
    },
    cocktailMixedCount(){
        let days = Template.instance().timespan.get();
        if(days > 0){
            let now = new Date();
            now.setDate(now.getDate() - days);
            return Feed.find({type: 'mixedCocktail', datetime: {$gte : now}}).count();
        } else {
            return Feed.find({type: 'mixedCocktail'}).count();
        }
    },
    cocktailFavoritedCount(){
        let days = Template.instance().timespan.get();
        if(days > 0){
            let now = new Date();
            now.setDate(now.getDate() - days);
            return Feed.find({type: 'favoritedCocktail', datetime: {$gte : now}}).count();
        } else {
            return Feed.find({type: 'favoritedCocktail'}).count();
        }
    },
    cocktailCreatedCount(){
        let days = Template.instance().timespan.get();
        if(days > 0){
            let now = new Date();
            now.setDate(now.getDate() - days);
            return Feed.find({type: 'createdCocktail', datetime: {$gte : now}}).count();
        } else {
            return Feed.find({type: 'createdCocktail'}).count();
        }
    },
});

Template.feed.events({
    'change #timespan-dropdown'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const days = parseInt(target.value);

        instance.timespan.set(days);
    },
});

Template.feedItem.helpers({
    getSummary(){
        let cocktail = Cocktails.findOne(this.objectId);
        if(cocktail) {
            let cocktailLink = '<a>';
            if (!cocktail.deleted && (!cocktail.draft || cocktail.owner == Meteor.userId())) {
                cocktailLink = '<a href="/cocktail/' + cocktail._id + '">';
            }
            cocktailLink = cocktailLink + cocktail.name;
            if (cocktail.draft) {
                if (cocktail.deleted) {
                    cocktailLink = cocktailLink + ' <div class="ui horizontal red label"><i class="trash icon"></i>' + TAPi18n.__('deleted') + '</div></a>';
                } else {
                    cocktailLink = cocktailLink + ' <div class="ui horizontal label"><i class="pen square icon"></i>' + TAPi18n.__('draft') + '</div></a>';
                }
            } else {
                cocktailLink = cocktailLink + '</a>'
            }
            switch (this.type) {
                case 'mixedCocktail':
                    return TAPi18n.__('mixedCocktailFeed', {cocktailLink});
                case 'favoritedCocktail':
                    return TAPi18n.__('favoritedCocktailFeed', {cocktailLink});
                case 'unfavoritedCocktail':
                    return TAPi18n.__('unfavoritedCocktailFeed', {cocktailLink});
                case 'addedToQueue':
                    return TAPi18n.__('addedToQueueFeed', {cocktailLink});
                case 'commentedCocktail':
                    return TAPi18n.__('commentedCocktailFeed', {cocktailLink});
                case 'addedImage':
                    return TAPi18n.__('addedImageFeed', {cocktailLink});
                case 'createdCocktail':
                    return TAPi18n.__('createdCocktailFeed', {cocktailLink});
                case 'updatedCocktail':
                    return TAPi18n.__('updatedCocktailFeed', {cocktailLink});
                case 'uploadedProfilePicture':
                    return TAPi18n.__('uploadedProfilePictureFeed', {cocktailLink});
            }
        }
    }
});