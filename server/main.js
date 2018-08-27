import '/imports/api/functions.js'
import {Meteor} from 'meteor/meteor';
import '../imports/api/cocktails.js';
import '../imports/api/ingredients.js';
import '../imports/api/queue.js';
import '../imports/api/configuration.js';
import '../imports/api/log.js';
import '../imports/api/comments.js';
import '../imports/api/users.js';
import '../imports/api/history.js';
import '../imports/api/feed.js';
import '../imports/api/notifications.js';
import {Configuration} from "../imports/api/configuration";
import {Queue} from "../imports/api/queue";
import {Cocktails} from "../imports/api/cocktails";
import {Comments} from "../imports/api/comments";
import {Ingredients} from "../imports/api/ingredients";

Meteor.startup(() => {
    WebApp.rawConnectHandlers.use(function(req, res, next) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return next();
    });

    Push.Configure({
        gcm: {
            projectNumber: Meteor.settings.public.google.projectNumber,
            apiKey: Meteor.settings.google.apiKey
        },
        sendInterval: 500,
    });

    Push.allow({
        send: function(userId, notification) {
            return Roles.userIsInRole(userId, 'admin');
        }
    });

    let clientId = Meteor.settings.google.clientId;
    if (Meteor.isCordova) {
        clientId = Meteor.settings.google.androidClientId
    }
    ServiceConfiguration.configurations.upsert(
        {service: 'facebook'},
        {
            $set: {
                appId: Meteor.settings.facebook.appId,
                secret: Meteor.settings.facebook.secret
            }
        }
    );

    ServiceConfiguration.configurations.upsert(
        {service: 'google'},
        {
            $set: {
                clientId: clientId,
                secret: Meteor.settings.google.secret
            }
        }
    );

    if (Configuration.find({}).count() == 0) {
        Configuration.insert({"name": "status", "value": {"type": "never_connected", "scale_mode" : false}});
        Configuration.insert({"name": "cocktail", "values": {"minamount": 20, "maxamount": 400, "maxvol": 20}});
        Configuration.insert({"name": "mixer", "values": {"glassweight": 20, "checktime": 4, "checkweight": 2, "scale_ratio": 1, "scale_offset": 0}});
        Configuration.insert({"name": "queue_enabled", "value": false});
        Configuration.insert({"name": "current_weight", "value": 0});
    }

    function setNextInQueue() {
        if (Queue.find({status: {$ne: "waiting"}}).count() == 0) {
            let nextItem = Queue.find({status: "waiting"}, {sort: {createdAt: 1}}).fetch()[0];
            if (nextItem) {
                Queue.update(nextItem._id
                    , {
                        $set: {
                            status: 'next'
                        }
                    });
                let cocktail = Cocktails.findOne(nextItem.cocktailId);
                let image = undefined;
                if (cocktail.images && cocktail.images.length > 0) {
                    image = cocktail.images[0];
                }
                let lang = Meteor.users.findOne(nextItem.user).profile.language;
                if (!lang)
                    lang = 'en';

                Meteor.call('notifications.send', nextItem.user, {
                    title: TAPi18n.__('nextInQueueNotification', {}, lang),
                    body: TAPi18n.__('readyForMixing', {cocktailname: cocktail.name}, lang),
                    icon: '/img/logo.png',
                    image,
                    url: Meteor.absoluteUrl() + 'queue'
                });
            }
        }
    }

    Queue.find().observeChanges({
        removed() {
            setNextInQueue();
        },
        changed() {
            setNextInQueue();
        },
        added() {
            setNextInQueue();
        }
    });

    initializing = true;
    Comments.find().observe({
        added(comment) {
            if (!initializing) {
                let cocktail = Cocktails.findOne(comment.cocktailId);
                let commentUser = Meteor.users.findOne(comment.user);
                let cocktailUser = Meteor.users.findOne(cocktail.owner);
                let lang = cocktailUser.profile.language;
                if (!lang)
                    lang = 'en';

                Meteor.call('notifications.send', cocktail.owner, {
                    title: TAPi18n.__('userCommented', {cocktailname: cocktail.name, user: commentUser.profile.name}, lang_tag = lang),
                    body: comment.text,
                    icon: '/img/logo.png',
                    url: 'https://cocktailmixer.app/cocktail/' + cocktail._id
                });
            }
        }
    });
    initializing = false;

    Ingredients.find({pump: 0}).observeChanges({
        added(id, fields) {
            let cocktails = Cocktails.find({'recipe.ingredientId': id}).fetch();
            let cocktailIds = cocktails.map(a => a._id);
            let queueItem = Queue.findOne({ cocktailId: { $in: cocktailIds } } );

            if(queueItem){
                let user = Meteor.users.findOne(queueItem.user);
                let lang = user.profile.language;
                if (!lang)
                    lang = 'en';

                Meteor.call('notifications.send', queueItem.user, {
                    title: TAPi18n.__('notAvailableAnymoreNotification', {}, lang),
                    body: TAPi18n.__('notAvailableAnymoreNotificationDescription', {name: Cocktails.findOne(queueItem.cocktailId).name}, lang),
                    icon: '/img/logo.png',
                    url: 'https://cocktailmixer.app/queue/'
                });
            }
        }
    });

    Queue.find({status: 'finished'}).observeChanges({
        added(id, fields) {
            Queue.remove(id);
        }
    });
    Queue.find({status: 'canceled'}).observeChanges({
        added(id, fields) {
            Meteor.setTimeout(function () {
                Queue.remove(id);
            }, 3000);
        }
    });

    Meteor.setInterval(function () {
        Meteor.users.find().forEach(function (user) {
            if (user.profile.bac > 0) {
                let bac = user.profile.bac - 0.0025;
                if (bac < 0) {
                    bac = 0;
                }
                Meteor.users.update(user._id, {
                    $set: {
                        'profile.bac': bac
                    }
                })
            }
        })
    }, 60000);

});

Accounts.onCreateUser((options, user) => {
    if (options.profile) {
        user.profile = options.profile;
    }

    if (user.services.facebook) {
        user.profile.name = user.services.facebook.name;
        user.profile.picture = "https://graph.facebook.com/v3.0/" + user.services.facebook.id + "/picture?type=large";
    }
    if (user.services.google) {
        user.profile.name = user.services.google.name;
        user.profile.picture = user.services.google.picture;
    }

    if (user.profile.picture) {
        let imgurCallback = function (errMsg, imgurData) {
            if (errMsg) throw new Meteor.Error("upload-failed");

            let picture = imgurData.link;
            let pictureDeleteHash = imgurData.deletehash;

            Meteor.users.update(user._id, {
                $set: {
                    'profile.picture': picture,
                    'profile.pictureDeleteHash': pictureDeleteHash,
                }
            });
        };
        Imgur.upload(uploadOptions(user.profile.picture), imgurCallback);
    } else {
        user.profile.picture = "/img/user_placeholder.jpg";
    }

    user.profile.bac = 0;

    let isFirstUser = Meteor.users.find().count == 1;
    if (isFirstUser) {
        Roles.addUsersToRoles(user._id, 'admin');
    }

    return user;
});