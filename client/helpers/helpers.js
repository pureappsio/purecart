Template.registerHelper("truncate", function(number) {
    return number.toFixed(0);
});

Template.registerHelper("truncateTwo", function(number) {
    return number.toFixed(2);
});

Template.registerHelper("formatDate", function(date) {
    return moment(date).format('MMMM Do YYYY');
});

Template.registerHelper("fromNow", function(date) {
    return moment(date).fromNow();
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

Template.registerHelper("getDiscountPrice", function(price, location, productId) {

    if (Session.get('currency')) {

        if (price[Session.get('currency')]) {

            var currencyPrice = price[Session.get('currency')]

            // Discount
            if (Session.get('usingDiscount')) {

                var discount = Session.get('usingDiscount');
                var discounted = true;

                if (discount.productId) {

                    if (discount.productId != productId) {
                        discounted = false;
                    }

                }

                if (discounted == true) {
                    if (discount.type == 'amount') {
                        currencyPrice = currencyPrice - parseFloat(Session.get('usingDiscount').amount);
                    } else {
                        currencyPrice = currencyPrice * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
                    }
                }



            }

            return currencyPrice.toFixed(2);

        } else {

            var rates = Metas.findOne({ type: 'rates' }).value;
            var finalPrice = price.EUR * rates[Session.get('currency')];

            console.log(Session.get('usingDiscount'));

            // Discount
            if (Session.get('usingDiscount')) {
                if (discount.type == 'amount') {
                    finalPrice = finalPrice - parseFloat(Session.get('usingDiscount').amount);
                } else {
                    finalPrice = finalPrice * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
                }

            }

            return finalPrice.toFixed(0) + '.99';

        }

    } else {

        // Discount
        if (Session.get('usingDiscount')) {
            if (discount.type == 'amount') {
                if (location != 'store') {
                    price = price - parseFloat(Session.get('usingDiscount').amount);
                }
            } else {
                price = price * (1 - parseFloat(Session.get('usingDiscount').amount) / 100);
            }

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
        return price.toFixed(2);
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
