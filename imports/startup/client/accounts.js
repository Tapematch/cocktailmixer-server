import {Ingredients} from "../../api/ingredients";

let email = AccountsTemplates.removeField('email');
let password = AccountsTemplates.removeField('password');

T9n.map('de', {
    fullName: 'Vollständiger Name',
    mustAgree: 'Du musst die Datenschutzbestimmungen akzeptieren'
});

T9n.map('en', {
    fullName: 'Full Name',
    mustAgree: 'You must agree to the Privacy Policy'
});

AccountsTemplates.addFields([
    {
        _id: 'name',
        type: 'text',
        displayName: 'fullName',
        required: true,
        minLength: 3,
    },
    email,
    password,
    {
        _id: 'terms',
        type: 'checkbox',
        template: "termsCheckbox",
        errStr: 'mustAgree',
        func: function(value) {
            return !value;
        },
        negativeValidation: false
    }
]);

let onSubmit = function(error, state){
    if (!error) {
        if (state === "signIn") {
            let user = Meteor.user();
            let isExistingUser = (user.profile.recommendationData && (user.profile.recommendationData.onlyNonalcoholic || user.profile.recommendationData.nonalcoholicIngredients || user.profile.recommendationData.alcoholicIngredients || user.profile.recommendationData.tags)) || user.profile.gender || user.profile.weight;
            if (isExistingUser) {
                FlowRouter.go('/');
            } else {
                FlowRouter.go('/newprofile');
            }
        }
        if (state === "signUp") {
            FlowRouter.go('/newprofile');
        }

    }
};

let redirectToLogin = function(){
    //example redirect after logout
    FlowRouter.go('/login');
};

AccountsTemplates.configure({
    showAddRemoveServices: true,
    showForgotPasswordLink: true,
    showPlaceholders: true,
    showResendVerificationEmailLink: true,

    onLogoutHook: redirectToLogin,
    onSubmitHook: onSubmit
});