Template.checkoutItem.helpers({

    useTaxes: function() {
        return Session.get('useTaxes');
    },

    productPicture: function() {

        if (Elements.findOne({ productId: this._id, type: 'productPictures', storePicture: true })) {
            var pictureId = Elements.findOne({ productId: this._id, type: 'productPictures', storePicture: true }).imageId;
            return Images.findOne(pictureId).link();
        } else if (Elements.findOne({ productId: this._id, type: 'productPictures' })) {
            var pictureId = Elements.find({ productId: this._id, type: 'productPictures' }, { sort: { order: 1 } }).fetch()[0].imageId;
            return Images.findOne(pictureId).link();
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
    monthly: function() {

        if (this.paymentPlan) {
            return '/mo.';
        }

    },
    basePrice: function() {
        return getBasePrice(this);
    },
    taxes: function() {

        var price = computePrice(this.price);

        var tax = price - (price / (1 + Session.get('tax') / 100)).toFixed(2);

        // Apply discount
        if (Session.get('usingDiscount')) {
            tax = tax * (1 - Session.get('usingDiscount').amount / 100);
        }

        return tax.toFixed(2);
    }

});
