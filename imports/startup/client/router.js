import '/imports/ui/cocktaillist/cocktaillist.js';
import '/imports/ui/ingredients/ingredients.js';
import '/imports/ui/header/header.js';
import '/imports/ui/editcocktail/editcocktail.js';
import '/imports/ui/queue/queue.js';
import '/imports/ui/cocktail/cocktail.js';
import '/imports/ui/configuration/configuration.js';
import '/imports/ui/log/log.js';

FlowRouter.route('/', {
    name: "Cocktails",
    action: function(params) {
        BlazeLayout.render("main", {main: "cocktaillist", menu: "cocktaillistmenu"});
  }
});

FlowRouter.route('/login', {
    name: "Login",
    action: function(params) {
        BlazeLayout.render("main", {main: "atForm"});
    }
});

FlowRouter.route('/logout', {
    name: "Logout",
    action: function(params) {
        AccountsTemplates.logout();
        FlowRouter.go("/");
    }
});

FlowRouter.route('/new', {
    name: "New Cocktail",
    action: function(params) {
        BlazeLayout.render("main", {main: "editcocktail"});
    }
});

FlowRouter.route('/edit/:id', {
    name: "Edit Cocktail",
    action: function(params) {
        BlazeLayout.render("main", {main: "editcocktail"});
    }
});

FlowRouter.route('/cocktail/:id', {
    name: "Cocktail",
    action: function(params) {
        BlazeLayout.render("main", {main: "cocktail", menu: "cocktailmenu"});
    }
});

FlowRouter.route('/queue', {
    name: "Queue",
    action: function(params) {
        BlazeLayout.render("main", {main: "queue"});
    }
});

FlowRouter.route('/ingredients', {
    name: "Ingredients",
    action: function(params) {
        BlazeLayout.render("main", {main: "ingredients"});
    }
});

FlowRouter.route('/configuration', {
    name: "Configuration",
    action: function(params) {
        BlazeLayout.render("main", {main: "configuration"});
    }
});

FlowRouter.route('/log', {
    name: "Log",
    action: function(params) {
        BlazeLayout.render("main", {main: "log"});
    }
});