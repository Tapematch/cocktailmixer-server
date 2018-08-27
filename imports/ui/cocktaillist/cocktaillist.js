import {Template} from 'meteor/templating';
import {Meteor} from 'meteor/meteor';
import './cocktaillist.html';
import {ReactiveDict} from 'meteor/reactive-dict';
import {Cocktails} from "/imports/api/cocktails";
import {Ingredients} from "../../api/ingredients";
import {History} from "../../api/history";

function areIngredientsSet() {
    return Ingredients.find({pump: {$ne: 0}}).count() > 0;
}

Template.cocktaillist.onCreated(function () {
    this.subscribe('cocktails');
    this.subscribe('ingredients');
    this.subscribe('history');

    Session.setDefault('showRecommendations', true);

    Session.setDefault('sortBy', "name");
    Session.setDefault('sortOrder', 1);

    Session.setDefault('filterAlcoholic', false);
    Session.setDefault('filterFavorites', false);
    Session.setDefault('filterOwn', false);
    Session.setDefault('filterMixable', true);

    Session.setDefault('search', "");
    Session.setDefault('limit', 18);

    $(window).on('scroll', function (e) {
        let threshold, target = $("#showMoreResults");
        if (!target.length) return;

        threshold = $(window).scrollTop() + $(window).height() - target.height();

        if (target.offset().top < threshold) {
            if (!target.data("visible")) {
                // console.log("target became visible (inside viewable area)");
                target.data("visible", true);
                Session.set('limit', Session.get('limit') + 18);
            }
        } else {
            if (target.data("visible")) {
                // console.log("target became invisible (below viewable arae)");
                target.data("visible", false);
            }
        }
    });
});

Template.cocktaillist.onRendered(function () {
    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {

            $('.ui.accordion')
                .accordion({
                    onClose: function () {
                        Session.set('showRecommendations', false);
                    },
                    onOpen: function () {
                        Session.set('showRecommendations', true);
                    }
                })
            ;

            $('#show-sort')
                .popup({
                    popup: $('#sort-popup'),
                    hoverable: true,
                    position: 'bottom left',
                    preserve: true
                })
            ;

            $('#show-filter')
                .popup({
                    popup: $('#filter-popup'),
                    hoverable: true,
                    position: 'bottom left',
                    preserve: true
                })
            ;

            $('#sort-order').dropdown('set selected', Session.get('sortOrder').toString());
            $('#sort-by').dropdown('set selected', Session.get('sortBy'));

            if (Session.get('filterAlcoholic')) {
                $('#filter-alcoholic-slider').checkbox('check');
            }
            if (Session.get('filterFavorites')) {
                $('#filter-favorites-slider').checkbox('check');
            }
            if (Session.get('filterOwn')) {
                $('#filter-own-slider').checkbox('check');
            }

        }
    });

    Tracker.autorun(() => {
        if (this.subscriptionsReady()) {
            if (areIngredientsSet() && Session.get('filterMixable')) {
                $('#filter-mixable-slider').checkbox('check');
            }
        }

    });
});

Template.cocktaillist.onDestroyed(function () {
    $(window).off('scroll');
});

function getSearchQuery() {
    let searchquery = [{draft: false}];

    let filterAlcoholic = Session.get('filterAlcoholic');
    if (filterAlcoholic) {
        searchquery.push({alcVol: 0});
    }
    let filterFavorites = Session.get('filterFavorites');
    if (filterFavorites) {
        searchquery.push({favorites: Meteor.userId()});
    }
    let filterOwn = Session.get('filterOwn');
    if (filterOwn) {
        searchquery.push({owner: Meteor.userId()});
    }
    let filterMixable = Session.get('filterMixable');
    if (areIngredientsSet() && filterMixable) {
        let notAvailableIngredients = Ingredients.find({pump: 0}).fetch();
        let ingredients = notAvailableIngredients.map(a => a._id);
        searchquery.push({'recipe.ingredientId': {$nin: ingredients}});
    }

    let search = Session.get('search');
    if (search) {
        search.split(/[\s,-]+/).forEach(function (term) {
            let termquery = [];
            termquery.push({name: {$regex: new RegExp(term, "i")}});
            termquery.push({description: {$regex: new RegExp(term, "i")}});
            termquery.push({tags: {$regex: new RegExp(term, "i")}});
            termquery.push({afterInstruction: {$regex: new RegExp(term, "i")}});
            termquery.push({beforeInstruction: {$regex: new RegExp(term, "i")}});
            termquery.push({'recipe.name': {$regex: new RegExp(term, "i")}});
            searchquery.push({$or: termquery});
        });
    }
    if (searchquery.length > 0) {
        return {$and: searchquery};
    } else {
        return {};
    }
}

function getRecommendations(tags, nonalcoholicIngredients, alcoholicIngredients) {
    let history = History.find({user: Meteor.userId()});
    let mixedCocktails = history.map(a => a.cocktailId);

    let notAvailableIngredients = [];
    if(Ingredients.find({pump: {$ne: 0}}).count() > 0){
        let ingredients = Ingredients.find({pump: 0}).fetch();
        notAvailableIngredients = ingredients.map(a => a._id);
    }

    let selector = {
        _id: {
            $nin: mixedCocktails
        },
        draft: false,
        favorites: {
            $nin: [Meteor.userId()]
        },
        'recipe.ingredientId': {
            $nin: notAvailableIngredients
        }
    };

    let onlyNonalcoholic = Meteor.user().profile.recommendationData.onlyNonalcoholic;
    if (onlyNonalcoholic) {
        selector.alcVol = 0;
    }

    let cocktails = [];
    Cocktails.find(selector).forEach(function (cocktail) {
        let tagScore = 0.5;
        if (tagScore) {
            let matchingTags = cocktail.tags.filter(f => tags.includes(f));
            tagScore = matchingTags.length / cocktail.tags.length;
        }

        let ingredientScore = 0;
        let ingredients = cocktail.recipe.map(a => a.ingredientId);
        ingredients.forEach(function (ingredient) {
            let index = nonalcoholicIngredients.indexOf(ingredient);
            if (index < 0 && alcoholicIngredients) {
                index = alcoholicIngredients.indexOf(ingredient);
                if (index >= 0) {
                    ingredientScore = ingredientScore + ((alcoholicIngredients.length - index) / alcoholicIngredients.length);
                }
            } else {
                ingredientScore = ingredientScore + ((nonalcoholicIngredients.length - index) / nonalcoholicIngredients.length);
            }
        });
        ingredientScore = ingredientScore / ingredients.length;
        cocktail.score = tagScore + ingredientScore;
        if (cocktail.score >= 1) {
            cocktails.push(cocktail);
        }
    });
    return cocktails.sort((c1, c2) => c2.score - c1.score).slice(0, 1);
}

function sortByOccurrence(sourceArray) {
    let map = sourceArray.reduce(function (p, c) {
        p[c] = (p[c] || 0) + 1;
        return p;
    }, {});
    return Object.keys(map).sort(function (a, b) {
        return map[a] < map[b];
    });
}

Template.cocktaillist.helpers({
    cocktails() {
        let limit = Session.get('limit');
        let sortOrder = Session.get('sortOrder');
        let sortBy = Session.get('sortBy');
        let sort = {};
        sort[sortBy] = sortOrder;
        return Cocktails.find(getSearchQuery(), {limit: limit, sort: sort});
    },
    hasMore() {
        return Cocktails.find(getSearchQuery()).count() > Session.get('limit');
    },
    searchTerm() {
        return Session.get('search');
    },
    showRecommendations() {
        return Session.get('showRecommendations');
    },
    getRecommendationsFromProfile() {
        let recommendationData = Meteor.user().profile.recommendationData;
        if (recommendationData) {
            let tags = recommendationData.tags;
            let alcoholicIngredients = recommendationData.alcoholicIngredients;
            let nonalcoholicIngredients = recommendationData.nonalcoholicIngredients;

            return getRecommendations(tags, nonalcoholicIngredients, alcoholicIngredients);
        }
    },
    getRecommendationsFromHistory() {
        if (History.find({user: Meteor.userId()}).count() > 0) {
            let tags = [];
            let ingredients = [];

            History.find({user: Meteor.userId()}).forEach((entry) => {
                let cocktail = Cocktails.findOne(entry.cocktailId);
                tags = tags.concat(cocktail.tags);
                ingredients = ingredients.concat(cocktail.recipe.map(a => a.ingredientId));
            });

            tags = sortByOccurrence(tags);
            ingredients = sortByOccurrence(ingredients);

            return getRecommendations(tags, ingredients);
        }
    },
    getRecommendationsFromFavorites() {
        if (Cocktails.find({favorites: Meteor.userId()}).count() > 0) {
            let tags = [];
            let ingredients = [];

            Cocktails.find({favorites: Meteor.userId()}).forEach((cocktail) => {
                tags = tags.concat(cocktail.tags);
                ingredients = ingredients.concat(cocktail.recipe.map(a => a.ingredientId));
            });

            tags = sortByOccurrence(tags);
            ingredients = sortByOccurrence(ingredients);

            return getRecommendations(tags, ingredients);
        }
    }
});

Template.cocktaillist.events({
    'input #search'(event, instance) {
        Session.set('search', event.target.value);
    },
    'change #sort-order'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const order = parseInt(target.value);

        Session.set('sortOrder', order);
    },
    'change #sort-by'(event, instance) {
        // Prevent default browser form submit
        event.preventDefault();

        // Get value from form element
        const target = event.target;
        const sortBy = target.value;

        Session.set('sortBy', sortBy);
    },
    'change #filter-alcoholic'(event, instance) {
        const filterAlcoholic = event.target.checked;
        Session.set('filterAlcoholic', filterAlcoholic);
    },
    'change #filter-favorites'(event, instance) {
        const filterFavorites = event.target.checked;
        Session.set('filterFavorites', filterFavorites);
    },
    'change #filter-own'(event, instance) {
        const filterOwn = event.target.checked;
        Session.set('filterOwn', filterOwn);
    },
    'change #filter-mixable'(event, instance) {
        const filterMixable = event.target.checked;
        Session.set('filterMixable', filterMixable);
    },
});

Template.cocktailListItem.helpers({
    toThumbnail(url) {
        if (url.includes('imgur')) {
            return Imgur.toThumbnail(url, Imgur.MEDIUM_THUMBNAIL);
        } else {
            return url;
        }
    }
});