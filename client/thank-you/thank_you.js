Template.thankYou.onRendered(function() {

    // // Get image
    // Meteor.call('getTitle', function(err, url) {
    //     Session.set('mainPicture', url);
    // });

});

Template.thankYou.helpers({

    mainPicture: function() {
        return Session.get('mainPicture');
    }
});
