Template.customers.onRendered(function() {

    Meteor.call('getCustomers', {}, function(err, customers) {

        Session.set('customers', customers);

    });

});

Template.customers.helpers({

    customers: function() {
        return Session.get('customers');
    }

});
