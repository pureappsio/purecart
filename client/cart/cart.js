Template.cart.rendered = function() {

    if (Session.get('checkoutExitIntent') != 'fired') {
        Session.set('checkoutExitIntent', 'armed');
    }

    if (/Mobi/.test(navigator.userAgent)) {

        Session.set('scrollTrigger', false);

        // Check scroll 
        $(window).scroll(function() {
            var percent = $(window).scrollTop() / $(document).height() * 2 * 100;
            showMobileExitIntent(percent, 'cart', 'help');
        });

    }

    Session.set('pixelTrackingPage', 'cart');

    if (Session.get('cart')) {

        // Count visits
        var products = Session.get('cart');

        for (i = 0; i < products.length; i++) {

            session = {
                date: new Date(),
                productId: products[i]._id,
                type: 'cart',
                country: Session.get('countryCode'),
                userId: Session.get('sellerId')
            };

            // Origin & medium
            if (Session.get('origin')) {
                session.origin = Session.get('origin');
            } else {
                session.origin = 'organic';
            }
            if (Session.get('medium')) {
                session.medium = Session.get('medium');
            }

            Meteor.call('insertSession', session);

        }
    }

};

Template.cart.events({

    'click #checkout': function() {
        Router.go('/checkout');
    },
    'mousemove, mouseleave': function(event) {

        // Show exit intent
        showExitIntent(event, 'cart', 'help');

    }

});

Template.cart.helpers({

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
    taxes: function() {

        // Get cart
        var cart = Session.get('cart');
        var tax = 0;
        var total = 0;

        // Calculate total
        for (i = 0; i < cart.length; i++) {

            var price = computePrice(cart[i].price);

            if (typeof cart[i].qty !== 'undefined') {
                total = total + price * cart[i].qty;
            } else {
                total = total + price;
            }

        }

        // Apply discount
        total = applyDiscount(total);

        // Calculate tax
        tax = total * Session.get('tax') / 100;
        return tax.toFixed(2);
    },
    total: function() {

        // Get cart
        var cart = Session.get('cart');
        var total = 0;

        // Calculate total
        for (i = 0; i < cart.length; i++) {

            var price = computePrice(cart[i].price);

            if (typeof cart[i].qty !== 'undefined') {
                total = total + price * cart[i].qty;
            } else {
                total = total + price;
            }

        }

        // Apply discount
        total = applyDiscount(total);

        return total.toFixed(2);
    },

    mainPicture: function() {
        return Session.get('mainPicture');
    },
    products: function() {
        return Session.get('cart');
    }

});
