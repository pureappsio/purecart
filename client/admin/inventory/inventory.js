Template.inventory.helpers({

    products: function() {
        return Products.find({ type: 'physical' });
    }

});

Template.inventory.events({

    'click #shipwire-test': function() {
        Meteor.call('shiwpireTest');
    }

});
