Template.registerHelper("truncate", function(number) {
    return number.toFixed(0);
});

Template.registerHelper("truncateTwo", function(number) {
    return number.toFixed(2);
});

Template.registerHelper("langEN", function() {
    if (Session.get('language')) {
        if (Session.get('language') == 'en') {
            return true;
        } else {
            return false;
        }
    } else {
        return true;
    }
});

Template.registerHelper("getMeta", function(meta) {
    if (Meteor.user()) {
        return Metas.findOne({ type: meta, userId: Meteor.user()._id }).value;

    } else {
        return Metas.findOne({ type: meta, userId: Session.get('sellerId') }).value;
    }
});

Template.registerHelper("startCurrency", function() {

    if (Session.get('currency')) {

        if (Session.get('currency') == 'USD') {
            return '$';
        }
        if (Session.get('currency') == 'GBP') {
            return '£';
        }

    } else {
        return '$';
    }

});

Template.registerHelper("getDiscountPrice", function(price) {

    if (Session.get('currency')) {

        if (price[Session.get('currency')]) {

            var currencyPrice = price[Session.get('currency')]

            // Discount
            if (Session.get('usingDiscount')) {
                currencyPrice = currencyPrice * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
            }

            return currencyPrice;

        } else {

            var rates = Metas.findOne({ type: 'rates' }).value;
            var finalPrice = price.EUR * rates[Session.get('currency')];

            console.log(Session.get('usingDiscount'));

            // Discount
            if (Session.get('usingDiscount')) {
                finalPrice = finalPrice * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
            }

            return finalPrice.toFixed(0) + '.99';

        }

    } else {

        // Discount
        if (Session.get('usingDiscount')) {
            price = price * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
        }

        return price;
    }

});


Template.registerHelper("getPrice", function(price) {

    if (Session.get('currency')) {

        if (price[Session.get('currency')]) {
            return price[Session.get('currency')];
        } else {
            var rates = Metas.findOne({ type: 'rates' }).value;
            var finalPrice = price.EUR * rates[Session.get('currency')];
            return finalPrice.toFixed(0) + '.99';
        }

    } else {
        return price;
    }

});

Template.registerHelper("endCurrency", function() {

    if (Session.get('currency')) {

        if (Session.get('currency') == 'EUR') {
            return ' €';
        }

    }

});

Template.registerHelper("isAdmin", function() {
    if (Meteor.user()) {
        if (Meteor.user().role == 'admin') {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }

});

Template.registerHelper("isAppUser", function() {
    if (Meteor.user()) {
        if (Meteor.user().role == 'admin' || Meteor.user().role == 'appuser') {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }

});
