import {Ingredients} from "../../api/ingredients";
import './ingredients.html';
import {Template} from "meteor/templating";

Template.ingredients.helpers({
    ingredients() {
        return Ingredients.find({});
    },
});

Template.ingredient.helpers({
    black(index){
        if(this.pump == index){
            return "black ";
        } else {
            return "";
        }
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
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const name = target.name.value;

        // Insert a task into the collection
        Ingredients.insert({
            name,
            pump: 0,
            createdAt: new Date(), // current time
        });

        // Clear form
        target.name.value = '';
    },
    'click #reset-all'(event) {
        Meteor.call('ingredients.reset');
    }
});

Template.ingredient.events({
    'change #vol'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const vol = parseInt(target.value);

        Ingredients.update(this._id, {
            $set: {vol}
        });
    },
    'click .pump-button'(event) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const pump = parseInt(target.value);

        Ingredients.update(this._id, {
            $set: {pump}
        });
    },
});