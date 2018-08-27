import '/imports/api/functions.js'
import './cocktail.html'
import {Meteor} from "meteor/meteor";
import {Template} from "meteor/templating";
import {Cocktails} from "../../api/cocktails";
import {Ingredients} from "../../api/ingredients";
import {Queue} from "../../api/queue";
import {Comments} from "../../api/comments";
import {Configuration} from "../../api/configuration";
import {History} from "../../api/history";

Template.cocktail.onCreated(function () {
    this.commentlimit = new ReactiveVar(5);
    this.queueCount = new ReactiveVar(0);
    this.lastMixed = new ReactiveVar("");
    this.lastMixedId = new ReactiveVar("");
    this.subscribe('cocktails');
    this.subscribe('ingredients');
    this.subscribe('queue');
    this.subscribe('comments');
    this.subscribe('history');
    this.subscribe('configuration');
    this.subscribe('users');
});

Template.cocktail.onRendered(function () {
    $(window).scrollTop(0);

    let swiper;

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            $('.popup-wrapper')
                .popup()
            ;
            $('#favorite-cocktail')
                .popup({
                    inline     : true,
                    position   : 'bottom right'
                })
            ;
            swiper = new Swiper('.swiper-container', {
                loop: true,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                autoHeight: true,
                preloadImages: true,
                updateOnImagesReady: true
            });
        }
    });

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            let id = FlowRouter.getParam("id");
            console.log(Cocktails.findOne(id).images.length);
            swiper.update();
            swiper.navigation.update();
            swiper.pagination.update();
        }
    });


    let uploadPicture = FlowRouter.getQueryParam("uploadPicture");
    if (uploadPicture == 'true') {
        $('#upload-picture-input').trigger("click");
    }

    Tracker.autorun(() => {
        let showFavorite = FlowRouter.getQueryParam("showFavorite");
        if (showFavorite == 'true') {
            $('#added-to-queue').transition('slide down out');
            $('#go-to-queue').transition('slide down out');
            $('#last-mixed').transition('slide down out');
            $('#go-to-last-mixed').transition('slide down out');
            $('html, body').animate({'scrollTop': $("#favorite-cocktail").position().top});
            $('#favorite-cocktail')
                .popup({
                    inline     : true,
                    position   : 'bottom right'
                })
            ;
            $('#favorite-cocktail').popup('show');
        }
    });
});

Template.cocktail.helpers({
    getAbsoluteUrl() {
        return Meteor.absoluteUrl();
    },
    getCocktail() {
        let id = FlowRouter.getParam("id");
        return Cocktails.findOne(id);
    },
    ingredientName(id) {
        return Ingredients.findOne(id).name;
    },
    getComments() {
        let id = FlowRouter.getParam("id");
        return Comments.find({cocktailId: id}, {limit: Template.instance().commentlimit.get()});
    },
    hasMoreComments() {
        let id = FlowRouter.getParam("id");
        return Comments.find({cocktailId: id}).count() > Template.instance().commentlimit.get();
    },
    userHasItemInQueue() {
        let id = FlowRouter.getParam("id");
        return Queue.find({'user': Meteor.userId(), 'cocktailId': {$ne: id}}).count() > 0;
    },
    favoritesCount() {
        let cocktail = Cocktails.findOne(FlowRouter.getParam("id"));
        if (cocktail) {
            return cocktail.favorites.length
        }
    },
    addNotAllowed() {
        let id = FlowRouter.getParam("id");
        return Queue.find({
            'user': Meteor.userId(), $or: [
                {
                    $and: [{
                        'status': {$ne: 'waiting'}
                    }, {
                        'status': {$ne: 'next'}
                    }]
                }, {
                    'cocktailId': id
                }
            ]
        }).count() > 0;
    },
    getPlaceInQueue() {
        let i = Template.instance().queueCount.get();
        let lang = TAPi18n.getLanguage();
        if (lang == 'de') {
            return i + '.'
        } else {
            let j = i % 10,
                k = i % 100;
            if (j == 1 && k != 11) {
                return i + "st";
            }
            if (j == 2 && k != 12) {
                return i + "nd";
            }
            if (j == 3 && k != 13) {
                return i + "rd";
            }
            return i + "th";
        }
    },
    lastMixed(){
        return Template.instance().lastMixed.get()
    },
    lastMixedId(){
        return Template.instance().lastMixedId.get()
    }
});

Template.cocktailmenu.helpers({
    cocktailId() {
        return FlowRouter.getParam("id");
    },
    owner() {
        let cocktail = Cocktails.findOne(FlowRouter.getParam("id"));
        if (cocktail) {
            return cocktail.owner
        }
    }
});

Template.cocktail.events({
    'click #favorite-cocktail'(event, instance) {
        event.preventDefault();
        let cocktailId = FlowRouter.getParam("id");
        Meteor.call('cocktails.toggleFavorite', cocktailId);
    },

    'click .add-to-queue'(event, instance) {
        event.preventDefault();
        $(".add-to-queue").addClass("loading");
        let cocktailId = FlowRouter.getParam("id");

        instance.queueCount.set(Queue.find().count() + 1);
        Meteor.call('cocktails.addToQueue', cocktailId, (error, result) => {
            if(!error){
                if(result) {
                    $('#added-to-queue').transition('slide down in');
                    $('#go-to-queue').transition('slide down in');
                    let now = new Date();
                    now.setDate(now.getDate() - 10);
                    let lastMixed = History.findOne({user: Meteor.userId(), finishedAt: {$gte : now}}, {sort: { finishedAt: -1 }});
                    if(lastMixed) {
                        let lastMixedCocktail = Cocktails.findOne({draft: false, _id: lastMixed.cocktailId});
                        if(lastMixedCocktail) {
                            if (!lastMixedCocktail.favorites.includes(Meteor.userId()) && Comments.find({cocktailId: lastMixedCocktail._id, user: Meteor.userId()}).count() === 0) {
                                instance.lastMixed.set(lastMixedCocktail.name);
                                instance.lastMixedId.set(lastMixedCocktail._id);
                                $('#last-mixed').transition('slide down in');
                                $('#go-to-last-mixed').transition('slide down in');
                            }
                        }
                    }
                    $('html, body').animate({
                        'scrollTop' : $("#added-to-queue").position().top
                    });
                } else {
                    $('#replaced-in-queue').transition('slide down in');
                    $('#go-to-queue').transition('slide down in');
                    $('html, body').animate({
                        'scrollTop' : $("#replaced-in-queue").position().top
                    });
                }
            }
        });
        $(".add-to-queue").removeClass("loading");
    },
    'click #add-comment'(event, instance) {
        event.preventDefault();
        $("#add-comment").addClass("loading");
        let cocktailId = FlowRouter.getParam("id");
        let text = $('#comment').val();
        Meteor.call('comments.insert', cocktailId, text);
        $('#comment').val("");
        $("#add-comment").removeClass("loading");
    },
    'click #show-more-comments'(event, instance) {
        event.preventDefault();
        Template.instance().commentlimit.set(Template.instance().commentlimit.get() + 5);
    },
    'change #upload-picture-input'(event, instance) {
        if (!Meteor.isCordova) {
            event.preventDefault();
            instance.$('.image .dimmer').dimmer('show');

            let imgurCallback = function (errMsg, imgurData) {
                if (errMsg) return alert(errMsg);

                let image = imgurData.link;
                Meteor.call('cocktails.insertPicture', image, cocktailId);
                instance.$('.image .dimmer').dimmer('hide');
            };

            let cocktailId = FlowRouter.getParam("id");

            if (event.target.files.length != 0) {
                let file = event.target.files[0];
                let reader = new FileReader();
                reader.onload = function (e) {
                    Imgur.upload(uploadOptions(e.target.result), imgurCallback);
                };
                reader.readAsDataURL(file);
            }
        }
    },
    'click #upload-picture-input-label'(event, instance) {
        if (Meteor.isCordova) {
            event.preventDefault();
            let options = {
                width: 720,
                height: 1080,
                quality: 100,
            };
            MeteorCamera.getPicture(options, function (error, data) {
                if (!error && data) {
                    instance.$('.image .dimmer').dimmer('show');
                    let cocktailId = FlowRouter.getParam("id");

                    let imgurCallback = function (errMsg, imgurData) {
                        if (errMsg) return alert(errMsg);

                        let image = imgurData.link;
                        Meteor.call('cocktails.insertPicture', image, cocktailId);
                        instance.$('.image .dimmer').dimmer('hide');

                    };

                    Imgur.upload(uploadOptions(data), imgurCallback);
                }
            });
        }
    }
});