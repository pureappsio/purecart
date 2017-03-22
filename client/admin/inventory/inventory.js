Template.inventory.helpers({

    products: function() {
        return Products.find({ type: 'physical', userId: Meteor.user()._id });
    }

});

Template.inventory.events({

    'click #shipwire-test': function() {
        Meteor.call('shiwpireTest');
    }

});
