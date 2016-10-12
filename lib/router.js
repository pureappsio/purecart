Router.configure({
  layoutTemplate: 'layout'
});

// Admin route
Router.route('/admin', {name: 'admin'});

// Checkout route
Router.route('/', {
    name: 'checkout',
    data: function() { 

    this.wait(Meteor.subscribe('userProducts'));
    // this.wait(Meteor.subscribe('allUsers'));

    if (this.ready()) {
      var product = {};
      if (this.params.query.product_id) {
        product = Products.findOne(this.params.query.product_id); 
      }
       this.render('checkout', {data: product});
     } else {
       this.render('loading');
     }
    	
    }
});

Router.route('/purchase_confirmation', {
    name: 'confirmation',
    data: function() { 

		if (this.params.query.sale_id) {
			return Sales.findOne(this.params.query.sale_id); 
		}
    	
    }
});

Router.route('/failed_payment', {
    name: 'fail'
});

Router.route('/login', {
    name: 'login'
});

// API
Router.route("/api/products/:id", { where: "server" } ).get( function() {

  // Get data
  var productId = this.params.id;
  var product = Products.findOne(productId);

  // Send response
  this.response.setHeader('Content-Type', 'application/json');
  this.response.end(JSON.stringify(product));

});