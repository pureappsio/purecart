Template.addImageDisplay.helpers({

    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    },
    isVideo: function() {

        var media = Images.findOne(this.imageId);
        if (media.ext == 'mp4') {
            return true;
        } else {
            return false;
        }

    }

});

Template.addImageDisplay.events({

    'click .store-product-image': function() {
        Session.set('selectedPicture_' + this.productId, this.imageId);
    }

});
