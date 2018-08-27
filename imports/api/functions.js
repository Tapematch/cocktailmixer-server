import {Ingredients} from "./ingredients";

getTotalAmount = function (recipe) {
    let totalAmount = 0;
    recipe.forEach(function (part) {
        let amount = part.amount;
        totalAmount = totalAmount + amount;
    });
    return totalAmount;
};

getDrinkVol = function (recipe) {
    let totalAmount = 0;
    let alcoholAmount = 0;
    recipe.forEach(function (part) {
        let amount = part.amount;
        totalAmount = totalAmount + amount;
        let ingredient = Ingredients.findOne(part.ingredientId);
        let percent = ingredient.vol;
        if (percent > 0) {
            alcoholAmount = alcoholAmount + ((percent * amount) / 100);
        }
    });
    return alcoholAmount / totalAmount * 100;
};

uploadOptions = function (image) {
    return {
        apiKey: Meteor.settings.public.imgur.apiKey,
        image: image
    };
};

deleteOptions = function (deleteHash) {
    return {
        apiKey: Meteor.settings.public.imgur.apiKey,
        deleteHash: deleteHash
    };
};