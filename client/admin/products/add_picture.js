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

    'click .set-store': function(){

        Meteor.call('setStorePicture', this._id);

    },
    'click .pic-delete': function() {
        Meteor.call('deleteElement', this._id);
    },
    'click .plus': function() {
        Meteor.call('changerOrderElement', this._id, 1);
    },
    'click .minus': function() {
        Meteor.call('changerOrderElement', this._id, -1);
    },

});
