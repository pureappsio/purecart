// API
Router.route("/api/products/:id", { where: "server" }).get(function() {

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
        this.response.end(JSON.stringify({ product: product }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/products", { where: "server" }).get(function() {

    // Get data
    query = {}

    if (this.params.query.type) {
        query.type = this.params.query.type;
    }
    var products = Products.find(query).fetch();

    var key = this.params.query.key;

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ products: products }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/variants", { where: "server" }).get(function() {

    // Get data
    query = {}

    if (this.params.query.product) {
        query.productId = this.params.query.product;
    }
    var variants = Variants.find(query, { sort: { 'price.USD': 1 } }).fetch();

    // Grab all sales elements
    for (i in variants) {
        variants[i].salesElements = Elements.find({ variantId: variants[i]._id }, { sort: { order: 1 } }).fetch();
    }

    var key = this.params.query.key;

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ variants: variants }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/customers", { where: "server" }).get(function() {

    // Get data
    var query = {};

    if (this.params.query.product) {
        query.product = this.params.query.product;
    }

    var customers = Meteor.call('getCustomers', query);
    var key = this.params.query.key;

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ customers: customers }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/customers/:email", { where: "server" }).get(function() {

    // Get data
    var customer = Meteor.call('getCustomer', this.params.email);
    var key = this.params.query.key;

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify(customer));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/sales", { where: "server" }).get(function() {

    // Get data
    var key = this.params.query.key;
    var query = { success: true };

    if (this.params.query.from && this.params.query.to) {

        // Parameters
        from = new Date(this.params.query.from)
        to = new Date(this.params.query.to)

        // Set to date to end of day
        to.setHours(23);
        to.setMinutes(59);
        to.setSeconds(59);

        // Query
        query.date = { $gte: from, $lte: to };

    }

    // Product ?
    if (this.params.query.product) {
        query.products = this.params.query.product;
    }

    // Origin
    if (this.params.query.origin) {
        query.origin = this.params.query.origin;
    }

    // Affiliate code
    if (this.params.query.ref) {
        query.affiliateCode = this.params.query.ref;
    }

    // Get sales
    var sales = Sales.find(query).fetch();

    // Get additional data
    for (s in sales) {

        var productsNames = [];

        for (p in sales[s].products) {

            var product = Products.findOne(sales[s].products[p]);
            productsNames.push(product.name);

        }

        sales[s].productsNames = productsNames;
    }

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ sales: sales }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/earnings", { where: "server" }).get(function() {

    // Get data
    var key = this.params.query.key;
    var query = { success: true };

    if (this.params.query.from && this.params.query.to) {

        // Parameters
        from = new Date(this.params.query.from)
        to = new Date(this.params.query.to)

        // Set to date to end of day
        to.setHours(23);
        to.setMinutes(59);
        to.setSeconds(59);

        // Query
        query.date = { $gte: from, $lte: to };

    }

    // Product ?
    if (this.params.query.product) {
        query.products = this.params.query.product;
    }

    // Origin
    if (this.params.query.origin) {
        query.origin = this.params.query.origin;
    }

    // Affiliate code
    if (this.params.query.ref) {
        query.affiliateCode = this.params.query.ref;
    }

    // Get sales
    var sales = Sales.find(query).fetch();

    // Calculate earnings
    earnings = 0;
    for (i = 0; i < sales.length; i++) {
        if (sales[i].currency == 'USD') {
            earnings = earnings + parseFloat(sales[i].amount);
        } else {
            earnings = earnings + parseFloat(sales[i].amount) / 1.06415;
        }

    }
    earnings = parseFloat(earnings.toFixed(2));

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ earnings: earnings, currency: 'USD' }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/sessions", { where: "server" }).get(function() {

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

        query.date = { $gte: from, $lte: to };

    }
    if (this.params.query.product) {
        query.productId = this.params.query.product;
    }
    if (this.params.query.country) {
        query.country = this.params.query.country;
    }
    if (this.params.query.type) {
        query.type = this.params.query.type;
    }

    // Send response
    var sessions = Sessions.find(query).fetch();

    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ sessions: sessions.length }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/validations", { where: "server" }).get(function() {

    // Get data
    var key = this.params.query.key;
    var query = { success: 'validation' };

    if (this.params.query.from && this.params.query.to) {

        // Parameters
        from = new Date(this.params.query.from)
        to = new Date(this.params.query.to)

        // Set to date to end of day
        to.setHours(23);
        to.setMinutes(59);
        to.setSeconds(59);

        // Query
        query.date = { $gte: from, $lte: to };

    }

    // Product ?
    if (this.params.query.product) {
        query.products = this.params.query.product;
    }

    // Origin
    if (this.params.query.origin) {
        query.origin = this.params.query.origin;
    }

    // Get sales
    var validations = Sales.find(query).fetch();

    // Send response
    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {
        this.response.end(JSON.stringify({ validations: validations }));
    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/discounts", { where: "server" }).post(function() {

    // Get post data
    var data = this.request.body;
    var key = this.params.query.key;

    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {

        // Check data
        if (data.code && data.name && data.amount && data.type && (data.type == 'percent' || data.type == 'amount')) {
            var discountId = Meteor.call('createDiscount', data);
            this.response.end(JSON.stringify({ message: "Discount created", discountId: discountId }));
        } else {
            this.response.end(JSON.stringify({ message: "Invalid data" }));
        }

    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

}).get(function() {

    // Get data
    var key = this.params.query.key;

    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {

        // Get data
        discounts = Discounts.find({}).fetch();
        this.response.end(JSON.stringify(discounts: discounts));

    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

Router.route("/api/discounts/:code", { where: "server" }).get(function() {

    // Get data
    var key = this.params.query.key;
    var code = this.params.code;

    this.response.setHeader('Content-Type', 'application/json');
    if (Meteor.call('validateApiKey', key)) {

        // Get data
        discount = Discounts.findOne({ code: code });
        if (discount) {

            // Validate discount
            var validatedDiscount = Meteor.call('validateDiscount', discount.code);

            if (validatedDiscount._id) {
                this.response.end(JSON.stringify(discount));
            } else {
                this.response.end(JSON.stringify({ message: 'Discount expired' }));
            }
        } else {
            this.response.end(JSON.stringify({ message: 'Discount not found' }));
        }

    } else {
        this.response.end(JSON.stringify({ message: "API key invalid" }));
    }

});

// Router.route("/api/leaving", { where: "server" }).get(function() {

//     // Get data
//     console.log('Leaving');

// });
