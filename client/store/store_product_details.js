Template.storeProductDetails.helpers({
    mainImageLink: function() {
        if (this.mainMedia) {
            return Images.findOne(this.mainMedia).link();
        } else if (this.imageId) {
            return Images.findOne(this.imageId).link();
        }
    },
    imageLink: function(imageId) {
      return Images.findOne(imageId).link();
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
      if (Elements.findOne({productId: this._id})) {
        return true;
      }
      else {
        return false;
      }
    },
    addImages: function() {
        return Elements.find({productId: this._id});
    }
});

Template.storeProductDetails.onRendered(function() {

    // Get image
    Meteor.call('getTitle', function(err, url) {
        Session.set('mainPicture', url);
    });

});


Template.storeProductDetails.events({

    'click #add-cart': function() {

        // Add product to cart
        if (Session.get('cart')) {
            var products = Session.get('cart');
            products.push(this);
            Session.set('cart', products);
        } else {
            Session.set('cart', [this]);
        }

        // Set window location to cart
        Router.go("/cart");

    }

});
