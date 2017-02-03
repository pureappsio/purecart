Template.variant.events({

    'click .delete-variant': function() {
        Meteor.call('removeVariant', this._id);
    }

});
