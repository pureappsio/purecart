Template.login.events({

    'click #login': function() {

        Meteor.loginWithPassword($('#email').val(), $('#password').val(), function() {

            if (Meteor.user().role == 'appuser' && !Meteor.user().domain) {
                Router.go('/domain');
            } else {
                Router.go('/admin');
            }

        });

    }

});
