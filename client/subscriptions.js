// Tracker
Tracker.autorun(function() {
    Meteor.subscribe('userSales');
    Meteor.subscribe('userProducts');
    Meteor.subscribe('userCustomers');
    Meteor.subscribe('userDiscounts');
    Meteor.subscribe('userElements');
    // Meteor.subscribe('userSessions');
    Meteor.subscribe('userIntegrations');
    Meteor.subscribe('userMetas');
    Meteor.subscribe('allUsers');
    Meteor.subscribe('files.images.all');
});