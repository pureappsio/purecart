Template.storeProductDetails.helpers({

    mainImageLink: function() {

        if (Session.get('selectedPicture_' + this._id)) {
            return Images.findOne(Session.get('selectedPicture_' + this._id)).link();
        } else if (Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' })) {
            var pictureId = Elements.findOne({ order: 1, productId: this._id, type: 'productPictures' }).imageId;
            return Images.findOne(pictureId).link();
        } else if (this.mainMedia) {
            return Images.findOne(this.mainMedia).link();
        } else if (this.imageId) {
            return Images.findOne(this.imageId).link();
        }
    },
    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    },
    soldOut: function() {

        if (this.type == 'physical') {
            if (this.qty == 0) {
                return true;
            }
        }

    },
    isVideo: function() {
        if (this.mainMedia) {
            var media = Images.findOne(this.mainMedia);
            if (media.ext == 'mp4') {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    mainPicture: function() {
        return Session.get('mainPicture');
    },
    areAdditionalImages: function() {
        if (Elements.findOne({ productId: this._id })) {
            return true;
        } else {
            return false;
        }
    },
    addImages: function() {
        return Elements.find({ productId: this._id });
    }
});

Template.storeProductDetails.onRendered(function() {

    // // Get image
    // Meteor.call('getTitle', function(err, url) {
    //     Session.set('mainPicture', url);
    // });    

});


Template.storeProductDetails.events({

    'click #add-cart': function() {

        // Add product to cart
        if (Session.get('cart')) {
            var products = Session.get('cart');

            // Check if product is already in cart
            var alreadyInCart = false;
            for (i = 0; i < products.length; i++) {
                if (products[i]._id == this._id) {
                    products[i].qty += 1;
                    alreadyInCart = true;
                    break;
                }
            }

            if (alreadyInCart == false) {
                if (this.qty) {
                    this.qty += 1;
                } else {
                    this.qty = 1;
                }
                products.push(this);
            }

            Session.set('cart', products);

        } else {

            if (this.qty) {
                this.qty += 1;
            } else {
                this.qty = 1;
            }
            Session.set('cart', [this]);
        }

        // Set window location to cart
        Router.go("/cart");

    }

});
