Template.addPicture.helpers({

    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    } 

});