Template.variantDetails.helpers({

    salesElements: function() {
        return Elements.find({ type: 'salesElement', variantId: this._id })
    }

})

Template.variantDetails.events({

    'click #add-sales-element': function() {

        var element = {

            order: parseInt($('#sales-element-order').val()),
            type: 'salesElement',
            value: $('#sales-element-name').val(),
            variantId: this._id

        }

        Meteor.call('insertElement', element);

    }

})
