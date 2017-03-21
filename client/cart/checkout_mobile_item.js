Template.checkoutMobileItem.events({

});

Template.checkoutMobileItem.helpers({

    productPicture: function() {

        if (Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' })) {
            var pictureId = Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' }).imageId;
            return Images.findOne(pictureId).link();
        } else if (this.mainMedia) {
            return Images.findOne(this.mainMedia).link();
        } else if (this.imageId) {
            return Images.findOne(this.imageId).link();
        }
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

    useTaxes: function() {
        return Session.get('useTaxes');
    },

    productTotal: function() {

        var basePrice = 0;

        var price = computePrice(this.price);

        // Calculate base price
        if (Session.get('useTaxes') == false) {
            basePrice = price * this.qty;
        } else {
            basePrice = price / (1 + Session.get('tax') / 100) * this.qty;
        }

        // Apply discount
        if (Session.get('usingDiscount')) {
            basePrice = basePrice * (1 - Session.get('usingDiscount').amount / 100);
        }

        return basePrice.toFixed(2);

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
    }

});
