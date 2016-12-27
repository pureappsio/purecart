Template.editSale.helpers({

	isPaid: function() {
		if (this.success == false) {
			return false;
		}
		else {
			return true;
		}
	}

});

Template.editSale.events({

	'click #edit-sale': function() {

		// Get success
		if ($('#success :selected').val() == 'true') {
			success = true;
		}
		else {
			success = false;
		}

		// Get info
	  	sale = {
	  	  success: success,
	  	  subtotal: $('#subtotal').val(),
	  	  tax: $('#tax').val(),
	  	  amount: $('#amount').val(),
	      _id: this._id
	  	};

	  	// Add
	  	Meteor.call('editSale', sale)

	  }

});

