Template.addPicture.helpers({

    imageLink: function(imageId) {
        return Images.findOne(imageId).link();
    }

});

Template.addPicture.events({

    'click .pic-delete': function() {
        Meteor.call('deleteElement', this._id);
    }

});
