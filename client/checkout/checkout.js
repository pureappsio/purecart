Template.checkout.rendered = function() {

    // Get image
    Meteor.call('getTitle', function(err, url) {
        Session.set('mainPicture', url);
    });

    Meteor.call('getBrandEmail', function(err, email) {
        Session.set('brandEmail', email);
    });

    Session.set('storeExitIntent', false);
    Session.set('pixelTrackingPage', 'checkout');

    // Automated recover
    window.onbeforeunload = function() {

        if (Metas.findOne({type: 'recoveryExitIntent'})) {
            var value = Metas.findOne({type: 'recoveryExitIntent'}).value;

            if (value == true && Session.get('customerEmail')) {
                Meteor.call('sendAutomatedRecoverEmail', Session.get('customerEmail'), Session.get('cart'));
            }
        }
    };

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

    'mousemove, mouseleave': function(event) {

        // Show exit intent
        showExitIntent(event, 'checkout', 'help');

    },
    'keyup #email': function() {
        Meteor.call('validateEmail', $('#email').val(), function(err, data) {
            if (data == true) {
                Session.set('customerEmail', $('#email').val());
            }
        });
    }

});
