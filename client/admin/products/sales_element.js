Template.salesElement.events({

    'click .element-delete': function() {

        Meteor.call('deleteElement', this._id);

    }

})