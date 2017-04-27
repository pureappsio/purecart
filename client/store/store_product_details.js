Template.storeProductDetails.onRendered(function() {

    if (this.data) {
        session = {
            date: new Date(),
            productId: this.data._id,
            type: 'visit',
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

        // Video
        if (videojs.getPlayers()['product-video-' + this.data._id]) {
            delete videojs.getPlayers()['product-video-' + this.data._id];
        }

        // Url
        var videoUrl = this.data.url;

        videojs("product-video-" + this.data._id, {}, function() {

            var player = this;
            player.load();

        });


    }

});

Template.storeProductDetails.helpers({

    discount: function() {

        if (Session.get('usingDiscount')) {
            return true;
        }

    },

    isFull: function(star) {

        if (star.type == 'full') {
            return true;
        }

    },
    isHalf: function(star) {

        if (star.type == 'half') {
            return true;
        }

    },
    isEmpty: function(star) {

        if (star.type == 'empty') {
            return true;
        }

    },
    averageRating: function() {

        var reviews = Reviews.find({ productId: this._id }).fetch();

        var averageRating = 0;
        for (r in reviews) {
            averageRating += reviews[r].rating;
        }
        averageRating = averageRating / reviews.length;

        var stars = [];

        // Full
        var fullStars = Math.trunc(averageRating);
        for (i = 0; i < fullStars; i++) {
            stars.push({ type: 'full' });
        }

        // Half
        var halfStars = averageRating - fullStars;
        if (halfStars != 0) {
            halfStars = Math.ceil(halfStars);
            for (j = 0; j < halfStars; j++) {
                stars.push({ type: 'half' });
            }
        }

        // Empty
        var emptyStars = 5 - fullStars - halfStars;
        if (emptyStars != 0) {
            for (k = 0; k < emptyStars; k++) {
                stars.push({ type: 'empty' });
            }
        }

        return stars;

    },

    severalReviews: function() {

        var reviews = Reviews.find({ productId: this._id }).fetch().length;

        if (reviews >= 2) {
            return true;
        }

    },
    areReviews: function() {

        var reviews = Reviews.find({ productId: this._id }).fetch().length;

        if (reviews > 0) {
            return true;
        }

    },
    nbReviews: function() {
        return Reviews.find({ productId: this._id }).fetch().length;
    },
    reviews: function() {

        return Reviews.find({ productId: this._id });

    },
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
        } else if (Session.get('selectedPicture_' + this._id)) {
            var media = Images.findOne(Session.get('selectedPicture_' + this._id));
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
        if (Elements.findOne({ productId: this._id, type: 'productPictures' })) {
            return true;
        } else {
            return false;
        }
    },
    addImages: function() {
        return Elements.find({ productId: this._id, type: 'productPictures' }, { sort: { order: 1 } });
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
