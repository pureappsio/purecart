Template.addPicture.helpers({

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

Template.addPicture.events({

    'click .pic-delete': function() {
        Meteor.call('deleteElement', this._id);
    }

});
