import '/imports/api/functions.js'
import '/imports/startup/client/router.js';
import '/imports/startup/client/accounts.js';
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Ingredients} from "../imports/api/ingredients";
import {Configuration} from "../imports/api/configuration";
import {Notifications} from "../imports/api/notifications";
import BrowserPush from 'push.js';

BlazeLayout.setRoot('body');

const userLanguage = () => {
    // If the user is logged in, retrieve their saved language
    if (Meteor.user()) return Meteor.user().profile.language;
};

if (Meteor.isClient) {
    Meteor.startup(function () {
        Push.Configure({
            android: {
                senderID: Meteor.settings.public.google.projectNumber,
                alert: true,
                badge: true,
                sound: true,
                vibrate: true,
                clearNotifications: true,
                forceShow: true
            },
            ios: {
                alert: true,
                badge: true,
                sound: true
            }
        });
        Tracker.autorun(() => {
            let lang;

            // URL Language takes priority
            const urlLang = FlowRouter.getQueryParam('lang');
            if (urlLang) {
                lang = urlLang;
            } else if (userLanguage()) {
                // User language is set if no url lang
                lang = userLanguage();
            } else {
                // If no user language, try setting by browser (default en)
                const localeFromBrowser = window.navigator.userLanguage || window.navigator.language;

                let locale = 'en';

                if (localeFromBrowser.match(/en/)) locale = 'en';
                if (localeFromBrowser.match(/de/)) locale = 'de';

                lang = locale;
                Meteor.users.update({_id: Meteor.userId()}, {
                    $set: {
                        'profile.language': lang
                    }
                });
            }

            TAPi18n.setLanguage(lang);
            T9n.setLanguage(lang);
            moment.locale(lang);
        });
    });

    TAPi18n._afterUILanguageChange = function () {
        let lang = TAPi18n.getLanguage();
        T9n.setLanguage(lang);
        moment.locale(lang);
        Meteor.users.update({_id: Meteor.userId()}, {
            $set: {
                'profile.language': lang
            }
        });
    };

    if (Meteor.isCordova) {
        DeepLink.once('cocktailmixer', function (data, url, scheme, path, querystring) {
            FlowRouter.go('/cocktail/' + path);
        });
    }
}

Template.main.onCreated(function () {
    this.subscribe('ingredients');
    this.subscribe('configuration');
    this.subscribe('cocktails');
    this.subscribe('notifications');
});

Template.main.onRendered(function () {
    Tracker.autorun(() => {
        let title = TAPi18n.__(FlowRouter.getRouteName()) + " - CocktailMixer - " + TAPi18n.__('cocktailmixerDescription');
        $(document).attr("title", title);
    });

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            $('#blood-alcohol-label')
                .popup({
                    inline: true,
                    hoverable: true,
                    position: 'bottom center',
                })
            ;
        }
    });

    Tracker.autorun(() => {
        if (Meteor.userId()) {
            BrowserPush.Permission.request();
        }
    });
    if (!Meteor.isCordova) {
        Notifications.find({userId: Meteor.userId()}).observe({
            added: function (doc) {
                BrowserPush.create(doc.title, {
                    body: doc.body,
                    icon: doc.icon,
                    image: doc.image,
                    timeout: 4000,
                    link: doc.url,
                    onClick: function () {
                        event.preventDefault();
                        window.open(doc.url, '_blank');
                    }
                });
                return Notifications.remove(doc._id);
            }
        });
    }

    if (Meteor.isCordova) {
        universalLinks.subscribe(null, function (eventData) {
            FlowRouter.go(eventData.path);
        });
    }
});

Template.main.events({
    'click #open-sidebar'(event) {
        $('.ui.sidebar')
            .sidebar('toggle')
        ;
    },
    'click .sidebar.menu > .item'(event) {
        $('.ui.sidebar')
            .sidebar('toggle')
        ;
    },
    'change #enable-queue'(event) {
        const enabled = event.target.checked;

        Meteor.call('configuration.togglequeue', enabled);
    },
});

Template.main.helpers({
    routeName() {
        return FlowRouter.getRouteName();
    },
    isRoute(route) {
        return FlowRouter.getRouteName() == route;
    },
    queueChecked() {
        let config = Configuration.findOne({'name': 'queue_enabled'});
        if (config && config.value) {
            return 'checked';
        }
    },
    bloodAlocoholDataIsSet() {
        return Meteor.user().profile.gender && Meteor.user().profile.weight;
    },
    bloodAlcohol() {
        return Math.round(Meteor.user().profile.bac * 100) / 100;
    },
    getBloodAlcoholColor() {
        let permille = Math.round(Meteor.user().profile.bac * 100) / 100;
        if (permille == 0) {
            return 'blue'
        } else if (permille < 0.1) {
            return 'teal'
        } else if (permille < 0.3) {
            return 'green'
        } else if (permille < 0.5) {
            return 'olive'
        } else if (permille < 0.8) {
            return 'yellow'
        } else if (permille < 1) {
            return 'orange'
        } else if (permille < 1.5) {
            return 'red'
        } else {
            return 'violet'
        }
    },
    templateGestures: {
        'swiperight .hammer-touch-area': function (event, templateInstance) {
            if (!$(event.target).hasClass('swiper-slide')) {
                $('.ui.sidebar')
                    .sidebar('show')
                ;
            }
        }
    }
});

Template.registerHelper('not', (a) => {
    return !a;
});


Template.registerHelper('and', (...args) => {
    args.pop();
    return args.every(function (currentValue) {
        return currentValue;
    });
});

Template.registerHelper('or', (...args) => {
    args.pop();
    return args.some(function (currentValue) {
        return currentValue;
    });
});

/*
Template.registerHelper('and', (a, b) => {
    return a && b;
});

Template.registerHelper('or', (a, b) => {
    return a || b;
});
*/

Template.registerHelper('getStrengthColor', function (recipe) {
    if (recipe) {
        let drinkVol = getDrinkVol(recipe);
        if (drinkVol >= 15)
            return "violet";
        else if (drinkVol >= 10)
            return "red";
        else if (drinkVol >= 5)
            return "yellow";
        else if (drinkVol > 0)
            return "olive";
        else
            return "blue";
    }
});

Template.registerHelper('getStrength', function (recipe) {
    if (recipe) {
        let drinkVol = getDrinkVol(recipe);
        if (drinkVol >= 15)
            return TAPi18n.__('extraStrong');
        else if (drinkVol >= 10)
            return TAPi18n.__('strong');
        else if (drinkVol >= 5)
            return TAPi18n.__('medium');
        else if (drinkVol > 0)
            return TAPi18n.__('weak');
        else
            return TAPi18n.__('nonalcoholic');
    }
});

Template.registerHelper('getVol', function (recipe) {
    if (recipe) {
        return Math.round(getDrinkVol(recipe) * 10) / 10;
    }
});

Template.registerHelper('getTotalAmount', function (recipe) {
    if (recipe) {
        return getTotalAmount(recipe);
    }
});

Template.registerHelper('isMine', function (id) {
    return id === Meteor.userId();
});

Template.registerHelper('ingredientName', function (id) {
    if (id) {
        return Ingredients.findOne(id).name;
    }
});

Template.registerHelper('isNotAvailable', function (recipe) {
    if (recipe) {
        let ingredients = Ingredients.find({pump: 0}).fetch();
        let notAvailableIngredients = ingredients.map(a => a._id);
        let recipeIngredients = recipe.map(a => a.ingredientId);
        return recipeIngredients.some(r => notAvailableIngredients.includes(r));
    }
});

Template.registerHelper('areIngredientsSet', function () {
    return Ingredients.find({pump: {$ne: 0}}).count() > 0;
});

Template.registerHelper('userName', function (id) {
    if (id) {
        let user = Meteor.users.findOne(id);
        if (user) {
            return user.profile.name;
        }
    }
});

Template.registerHelper('userPicture', function (id) {
    if (id) {
        let user = Meteor.users.findOne(id);
        if (user) {
            let url = user.profile.picture;
            if (url.includes('imgur')) {
                return Imgur.toThumbnail(url, Imgur.SMALL_SQUARE);
            } else {
                return url;
            }
        }
    }
});

Template.registerHelper('getRelativeTime', function (date) {
    return moment(date).fromNow();
});

Template.registerHelper('isMachineOnline', function () {
    let machine = Roles.getUsersInRole('machine').fetch()[0];
    if (machine) {
        return machine.status.online;
    }
});

Template.registerHelper('isFavorite', function (favorites) {
    if (favorites) {
        return favorites.includes(Meteor.userId());
    }
});

Template.registerHelper('toSmallSquare', function (url) {
    if (url.includes('imgur')) {
        return Imgur.toThumbnail(url, Imgur.SMALL_SQUARE);
    } else {
        return url;
    }
});

Template.registerHelper('isQueueDisabled', function (url) {
    let config = Configuration.findOne({'name': 'queue_enabled'});
    if (config) {
        return !config.value;
    }
});