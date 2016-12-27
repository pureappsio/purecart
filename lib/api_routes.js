// API
Router.route("/api/products/:id", { where: "server" } ).get( function() {

  // Get data
  var productId = this.params.id;
  var product = Products.findOne(productId);

  // Get image ID
  if (product.imageId) {
    product.image = Images.findOne(product.imageId).link();
  }

  var key = this.params.query.key;

  // Send response
  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {
  	this.response.end(JSON.stringify({product: product}));
  }
  else {
  	this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});

Router.route("/api/products", { where: "server" } ).get( function() {

  // Get data
  var products = Products.find({}).fetch();

  var key = this.params.query.key;

  // Send response
  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {
  	this.response.end(JSON.stringify({products: products}));
  }
  else {
  	this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});

Router.route("/api/customers", { where: "server" } ).get( function() {

  // Get data
  var customers = Meteor.call('getCustomers');
  var key = this.params.query.key;

  // Send response
  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {
    this.response.end(JSON.stringify({customers: customers}));
  }
  else {
    this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});

Router.route("/api/sales", { where: "server" } ).get( function() {

  // Get data
  var key = this.params.query.key;
  var query = {};

  if (this.params.query.from && this.params.query.to) {

  	// Parameters
  	from = new Date(this.params.query.from)
  	to = new Date(this.params.query.to)

    // Set to date to end of day
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);
    
    // Query
    query.date = {$gte: from, $lte: to};

  }

  // Product ?
  if (this.params.query.product) {
    query.productId = this.params.query.product;
  }

  // Get sales
  var sales = Sales.find(query).fetch();

  // Send response
  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {
  	this.response.end(JSON.stringify({sales: sales}));
  }
  else {
  	this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});

Router.route("/api/earnings", { where: "server" } ).get( function() {

  // Get data
  var key = this.params.query.key;
  var query = {};

  if (this.params.query.from && this.params.query.to) {

    // Parameters
    from = new Date(this.params.query.from)
    to = new Date(this.params.query.to)

    // Set to date to end of day
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);

    // Query
    query.date = {$gte: from, $lte: to};

  }

  // Product ?
  if (this.params.query.product) {
    query.productId = this.params.query.product;
  }

  // Get sales
  var sales = Sales.find(query).fetch();

  // Calculate earnings
  earnings = 0;
  for (i = 0; i < sales.length; i++) {
    if (sales[i].currency == 'USD') {
      earnings = earnings + parseFloat(sales[i].amount);
    } 
    else {
      earnings = earnings + parseFloat(sales[i].amount)/1.1;
    }
    
  }
  earnings = parseFloat(earnings.toFixed(2));

  // Send response
  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {
    this.response.end(JSON.stringify({earnings: earnings, currency: 'USD'}));
  }
  else {
    this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});

Router.route("/api/sessions", { where: "server" } ).get( function() {

  // Get data
  var key = this.params.query.key;
  var query = {};

  if (this.params.query.from && this.params.query.to) {

    // Parameters
    from = new Date(this.params.query.from)
    to = new Date(this.params.query.to)

    // Set to date to end of day
    to.setHours(23);
    to.setMinutes(59);
    to.setSeconds(59);

    query.date = {$gte: from, $lte: to};

  }
  if (this.params.query.product) {
    query.productId = this.params.query.product;
  }

  // Send response
  var sessions = Sessions.find(query).fetch();

  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {
    this.response.end(JSON.stringify({sessions: sessions.length}));
  }
  else {
    this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});

Router.route("/api/discounts", { where: "server" } ).post( function() {

  // Get post data
  var data = this.request.body;
  var key = this.params.query.key;

  this.response.setHeader('Content-Type', 'application/json');
  if (Meteor.call('validateApiKey', key)) {

    // Check data
    if (data.code && data.name && data.amount && data.type && (data.type == 'percent' || data.type == 'amount')) {
      var discountId = Meteor.call('createDiscount', data);
      this.response.end(JSON.stringify({message: "Discount created", discountId: discountId}));
    }
    else {
      this.response.end(JSON.stringify({message: "Invalid data"}));
    }

  }
  else {
    this.response.end(JSON.stringify({message: "API key invalid"}));
  }

});