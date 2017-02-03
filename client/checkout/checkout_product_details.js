Template.checkoutProductDetails.helpers({

    description: function() {
        return Session.get('cart')[0].salesDescriptionTitle;
    },
    elements: function() {
    	return Elements.find({type: 'salesElement', productId: Session.get('cart')[0]._id})
    }

})
