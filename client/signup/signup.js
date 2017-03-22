Template.signup.events({

    'click #signup': function() {

        var data = {
            email: $('#email').val(),
            password: $('#password').val(),
            role: 'appuser'
        }

        Meteor.call('createUserAccount', data, function(err, data) {
            Meteor.loginWithPassword($('#email').val(), $('#password').val(), function(err, data) {
                if (Meteor.user().role == 'appuser' && !Meteor.user().domain) {
                    Router.go('/domain');
                } else {
                    Router.go('/admin');
                }
            });
        });

    }

});
