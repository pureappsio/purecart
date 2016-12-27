Template.addImageDisplay.helpers({

    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    } 

});