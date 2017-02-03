Template.checkout.rendered = function() {

    // Get image
    Meteor.call('getTitle', function(err, url) {
        Session.set('mainPicture', url);
    });

    Meteor.call('getBrandEmail', function(err, email) {
        Session.set('brandEmail', email);
    });


}

Template.checkout.helpers({

    isSimpleTheme: function() {

        if (Metas.findOne({ type: 'checkoutTheme' })) {

            if (Metas.findOne({ type: 'checkoutTheme' }).value == 'simple') {
                return true;
            } else {
                return false;
            }

        } else {
            return true;
        }

    },
    brandEmail: function() {
        return Session.get('brandEmail');
    },
    mainPicture: function() {
        return Session.get('mainPicture');
    }

});

Template.checkout.events({

});