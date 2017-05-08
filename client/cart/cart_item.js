Template.cartItem.events({

    'click .plus': function() {

        // Get cart
        var cart = Session.get('cart');

        // Add
        for (i = 0; i < cart.length; i++) {
            if (cart[i]._id == this._id) {
                cart[i].qty += 1;
                break;
            }
        }

        // Update cart
        Session.set('cart', cart);

    },
    'click .minus': function() {

        // Get cart
        var cart = Session.get('cart');

        // Add
        for (i = 0; i < cart.length; i++) {
            if (cart[i]._id == this._id) {

                if (cart[i].qty > 0) {
                    cart[i].qty += -1;
                }

                if (cart[i].qty == 0) {
                    cart.splice(i, 1);
                }
            }
        }

        // Update cart
        Session.set('cart', cart);

    },
    'click .remove-item': function() {

        // Get cart
        var cart = Session.get('cart');

        console.log(this);
        console.log(cart);

        // Remove item
        for (i = 0; i < cart.length; i++) {
            if (cart[i]._id == this._id) {
                cart.splice(i, 1);
                break;
            }
        }

        // Update cart
        Session.set('cart', cart);

    }

});

Template.cartItem.helpers({

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
        basePrice = applyDiscount(basePrice);

        return basePrice.toFixed(2);

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
