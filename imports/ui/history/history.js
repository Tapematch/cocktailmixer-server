import '/imports/api/functions.js'
import './history.html';
import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import {History} from "../../api/history";
import {Cocktails} from "../../api/cocktails";

Template.history.onCreated(function () {
    this.subscribe('history');
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
                self.limit.set(self.limit.get() + 5);
            }
        } else {
            if (target.data("visible")) {
                // console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
            }
        }
    });
});

Template.history.onRendered(function () {
    $(window).scrollTop(0);

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            $('#timespan-dropdown').dropdown();
        }
    });
});

function getHistory() {
    let days = Template.instance().timespan.get();
    if(days > 0){
        let now = new Date();
        now.setDate(now.getDate() - days);
        return History.find({user: Meteor.userId(), finishedAt: {$gte : now}});
    } else {
        return History.find({user: Meteor.userId()});
    }
}

Template.history.helpers({
    history() {
        return History.find({user: Meteor.userId()}, { sort: { finishedAt: -1 }, limit: Template.instance().limit.get()});
    },
    hasMore() {
        return History.find({user: Meteor.userId()}).count() > Template.instance().limit.get();
    },
    cocktailCount(){
        return getHistory().count();
    },
    totalAmount(){
        let totalAmount = 0;
        getHistory().forEach(function (historyItem) {
            let amount = getTotalAmount(Cocktails.findOne(historyItem.cocktailId).recipe);
            totalAmount = totalAmount + amount;
        });
        return totalAmount;
    },
    alcoholAmount(){
        let alcoholAmount = 0;
        getHistory().forEach(function (historyItem) {
            let recipe = Cocktails.findOne(historyItem.cocktailId).recipe;
            let totalAmount = getTotalAmount(recipe);
            let vol = getDrinkVol(recipe);
            let amount = totalAmount * vol / 100;
            alcoholAmount = alcoholAmount + amount;
        });
        return Math.round(alcoholAmount);
    }
});

Template.history.events({
    'change #timespan-dropdown'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const days = parseInt(target.value);

        instance.timespan.set(days);
    },
});

Template.historyItem.helpers({
    getCocktail() {
        return Cocktails.findOne(this.cocktailId);
    }
});