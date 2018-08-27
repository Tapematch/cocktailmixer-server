import './ingredients.html';
import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import {Ingredients} from "../../api/ingredients";

Template.ingredients.onCreated(function () {
    this.subscribe('ingredients');
    this.limit = new ReactiveVar(20);
});

Template.ingredient.onRendered(function() {
    this.initializing = true;
    Tracker.autorun(() => {
        if (this.initializing && this.subscriptionsReady()) {
            let pump = this.data.pump;
            this.$('.valve-dropdown')
                .dropdown('set selected', pump.toString())
            ;
            this.initializing = false;
        }
    });
});

Template.ingredientsmenu.events({
    'click #reset-all'(event) {
        Meteor.call('ingredients.reset');
        $('.valve-dropdown')
            .dropdown('set selected', "0")
        ;
    }
});

Template.ingredients.helpers({
    ingredients() {
        return Ingredients.find({}, {limit: Template.instance().limit.get()});
    },
    hasMore() {
        return Ingredients.find({}).count() > Template.instance().limit.get();
    }
});

Template.ingredient.helpers({
    valves() {
        return _.map(_.range(1, 15), function(idx) {
            return {number: idx};
        });
    },
    disabled(index){
        if(index != this.pump && Ingredients.findOne({pump: index})){
            return "disabled ";
        } else {
            return "";
        }
    }
});

Template.ingredients.events({
    'submit #new-ingredient'(event) {
        event.preventDefault();

        const target = event.target;
        const name = target.name.value;

        Meteor.call('ingredients.insert', name);
        target.name.value = '';
    },
    'click #show-more'(event, instance) {
        event.preventDefault();
        Template.instance().limit.set(Template.instance().limit.get() + 20);
    },
});

Template.ingredient.events({
    'change #vol'(event) {
        event.preventDefault();

        const target = event.target;
        const vol = parseInt(target.value);

        Meteor.call('ingredients.updateVol', this._id, vol);
    },
    'change .valve-dropdown'(event) {
        event.preventDefault();

        const target = event.target;
        const pump = parseInt(target.value);

        Meteor.call('ingredients.updatePump', this._id, pump);
    },
});