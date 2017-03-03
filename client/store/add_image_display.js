Template.addImageDisplay.helpers({

    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    } 

});

Template.addImageDisplay.events({

    'click .store-product-image': function() {
        Session.set('selectedPicture', this.imageId);
    } 

});