import '/imports/ui/cocktaillist/cocktaillist.js';
import '/imports/ui/ingredients/ingredients.js';
import '/imports/ui/editcocktail/editcocktail.js';
import '/imports/ui/queue/queue.js';
import '/imports/ui/cocktail/cocktail.js';
import '/imports/ui/configuration/configuration.js';
import '/imports/ui/log/log.js';
import '/imports/ui/login/login.js';
import '/imports/ui/profile/profile.js';
import '/imports/ui/users/users.js';
import '/imports/ui/history/history.js';
import '/imports/ui/feed/feed.js';
import '/imports/ui/drafts/drafts.js';
import '/imports/ui/privacy/privacy.js';

FlowRouter.wait();

Tracker.autorun(() => {
    // wait on roles to intialise so we can check is use is in proper role
    if (Roles.subscription.ready() && !FlowRouter._initialized) {
        FlowRouter.initialize()
    }
});

let redirectToLogin = function(context, redirect) {
    if (!Meteor.userId()) {
        redirect('/login');
    }
};

let redirectNonAdmin = function(context, redirect) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) {
        redirect('/');
    }
};

FlowRouter.route('/', {
    name: "cocktaillist",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "cocktaillist", menu: "cocktaillistmenu"});
  }
});

FlowRouter.route('/drafts', {
    name: "drafts",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "drafts", menu: "draftsmenu"});
    }
});

FlowRouter.route('/login', {
    name: "login",
    triggersEnter : function(context, redirect) {
        if (Meteor.userId()) {
            redirect('/profile');
        }
    },
    action: function(params) {
        BlazeLayout.render("main", {main: "login"});
    }
});

FlowRouter.route('/logout', {
    name: "logout",
    action: function(params) {
        AccountsTemplates.logout();
        FlowRouter.go("/");
    }
});

FlowRouter.route('/new', {
    name: "newCocktail",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "editcocktail"});
    }
});

FlowRouter.route('/newdraft', {
    name: "newDraft",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "editcocktail"});
    }
});

FlowRouter.route('/edit/:id', {
    name: "editCocktail",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "editcocktail"});
    }
});

FlowRouter.route('/cocktail/:id', {
    name: "cocktail",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "cocktail", menu: "cocktailmenu"});
    }
});

FlowRouter.route('/profile', {
    name: "profile",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "profile"});
    }
});

FlowRouter.route('/newprofile', {
    name: "newProfile",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "profile"});
    }
});

FlowRouter.route('/queue', {
    name: "queue",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "queue"});
    }
});

FlowRouter.route('/history', {
    name: "history",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "history"});
    }
});

FlowRouter.route('/feed', {
    name: "feed",
    triggersEnter: redirectToLogin,
    action: function(params) {
        BlazeLayout.render("main", {main: "feed"});
    }
});

FlowRouter.route('/ingredients', {
    name: "ingredients",
    triggersEnter: [redirectToLogin, redirectNonAdmin],
    action: function(params) {
        BlazeLayout.render("main", {main: "ingredients", menu: "ingredientsmenu"});
    }
});

FlowRouter.route('/configuration', {
    name: "configuration",
    triggersEnter: [redirectToLogin, redirectNonAdmin],
    action: function(params) {
        BlazeLayout.render("main", {main: "configuration"});
    }
});

FlowRouter.route('/log', {
    name: "log",
    triggersEnter: [redirectToLogin, redirectNonAdmin],
    action: function(params) {
        BlazeLayout.render("main", {main: "log", menu: "logmenu"});
    }
});

FlowRouter.route('/users', {
    name: "users",
    triggersEnter: [redirectToLogin, redirectNonAdmin],
    action: function(params) {
        BlazeLayout.render("main", {main: "users"});
    }
});

FlowRouter.route('/privacy', {
    name: "privacy",
    action: function(params) {
        BlazeLayout.render("privacy");
    }
});