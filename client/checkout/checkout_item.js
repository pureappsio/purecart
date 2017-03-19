Template.checkoutItem.helpers({

    useTaxes: function() {
        return Session.get('useTaxes');
    },

    isPhysical: function() {

        isPhysical = false;

        var cart = Session.get('cart');

        console.log(cart);

        for (i = 0; i < cart.length; i++) {
            if (cart[i].type == 'physical') {
                isPhysical = true;
            }
        }

        return isPhysical;

    },
    basePrice: function() {

        var basePrice = 0;

        var price = computePrice(this.price);

        // Calculate base price
        if (Session.get('useTaxes') == false) {
            basePrice = price;
        } else {
            basePrice = price / (1 + Session.get('tax') / 100);
        }

        // Apply discount
        if (Session.get('usingDiscount')) {
            basePrice = basePrice * (1 - Session.get('usingDiscount').amount / 100);
        }

        return basePrice.toFixed(2);
    },
    taxes: function() {

        var price = computePrice(this.price);

        var tax = price - (price / (1 + Session.get('tax') / 100)).toFixed(2);

        // Apply discount
        if (Session.get('usingDiscount')) {
            tax = tax * (1 - Session.get('usingDiscount').amount / 100);
        }

        return tax.toFixed(2);
    },
    // startCurrency: function() {
    //     if (Session.get('currency') == 'USD') {
    //         return '$';
    //     } else {
    //         return '';
    //     }
    // },
    // endCurrency: function() {
    //     if (Session.get('currency') == 'EUR') {
    //         return '€';
    //     } else {
    //         return '';
    //     }
    // }

});
