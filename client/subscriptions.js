// Tracker
Tracker.autorun(function() {
    Meteor.subscribe('userSales');
    Meteor.subscribe('userProducts');
    Meteor.subscribe('userCustomers');
});