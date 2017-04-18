Template.user.helpers({
    email: function() {
        return this.emails[0].address;
    },
    nbProducts: function() {
        return this.courses.length;
    }

});

Template.user.events({

    'click .user-delete': function() {
        Meteor.call('deleteUser', this._id);
    },
    'keyup .domain': function() {

    	userData = this;
    	userData.domain = $('#domain-' + this._id).val();
        Meteor.call('editUser', userData);
    }

});
