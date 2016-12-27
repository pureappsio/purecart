Router.configure({
    layoutTemplate: 'layout'
});

// Admin route
Router.route('/admin', { name: 'admin' });

// Main route
Router.route('/', {
    name: 'home',
    data: function() {

        this.wait(Meteor.subscribe('userProducts'));
        this.wait(Meteor.subscribe('userMetas'));

        if (this.ready()) {
            var product = {};
            if (this.params.query.product_id) {
                product = Products.findOne(this.params.query.product_id);
                Session.set('cart', [product]);
            }
            if (this.params.query.ref) {
                Session.setTemp('affiliateCode', this.params.query.ref);
            }
            if (this.params.query.origin) {
                Session.setTemp('origin', this.params.query.origin);
            }
            this.render('checkout');
        } else {
            this.render('loading');
        }

    }
});

// Checkout route
Router.route('/checkout', {
    name: 'checkout',
    data: function() {

        this.wait(Meteor.subscribe('userProducts'));
        this.wait(Meteor.subscribe('userMetas'));

        if (this.ready()) {
            var product = {};
            if (this.params.query.product_id) {
                product = Products.findOne(this.params.query.product_id);
                Session.set('cart', [product]);
            }
            if (this.params.query.ref) {
                Session.setTemp('affiliateCode', this.params.query.ref);
            }
            this.render('checkout');
        } else {
            this.render('loading');
        }

    }
});

// Store routes
Router.route('/store', {
    name: 'store',
    waitOn: function() {
        return [Meteor.subscribe('userProducts'),
            Meteor.subscribe('files.images.all'),
            Meteor.subscribe('userMetas')
        ];
    },
    data: function() {

        if (this.ready()) {
            this.render('store');
        } else {
            this.render('loading');
        }

    }
});

Router.route('/products/:identifier', {
    name: 'storeProductDetails',
    data: function() {

        if (Products.findOne(this.params.identifier)) {
            return Products.findOne(this.params.identifier);
        }
        if (Products.findOne({ shortName: this.params.identifier })) {
            return Products.findOne({ shortName: this.params.identifier });
        }

    }
});

// Cart
Router.route('/cart', {
    name: 'cart'
});


Router.route('/purchase_confirmation', {
    name: 'confirmation',
    data: function() {

        saleId = this.params.query.sale_id;
        return Sales.findOne(saleId);

    }
});

Router.route('/products/edit/:_id', {
    name: 'editProduct',
    data: function() {

        return Products.findOne(this.params._id);

    }
});

Router.route('/products/details/:_id', {
    name: 'productData',
    data: function() {

        return Products.findOne(this.params._id);

    }
});

Router.route('/sales/edit/:_id', {
    name: 'editSale',
    data: function() {

        return Sales.findOne(this.params._id);

    }
});

Router.route('/failed_payment', {
    name: 'fail',
    data: function() {

        if (this.params.query.sale_id) {

            sale = Sales.findOne(this.params.query.sale_id);
            Meteor.call('sendRecoverEmail', sale);

        }

    }
});

Router.route('/validate_payment', {
    name: 'paymentLoading',
    data: function() {

        saleId = this.params.query.sale_id;

        if (this.params.query.PayerID) {
            payerId = this.params.query.PayerID;
        } else {
            payerId = "";
        }

        // Confirm sale
        Meteor.call('confirmSale', saleId, payerId, function(err, status) {
            console.log(status);
            if (status == false) {
                Router.go('/failed_payment?sale_id=' + saleId);
            }
            if (status == true) {
                Router.go('/purchase_confirmation?sale_id=' + saleId);
            }
        });

    }
});

Router.route('/login', {
    name: 'login'
});

// Router.route('/payment_loading', {name: 'paymentLoading'});

// PDF
Router.route('/generate_invoice', function() {

    // Get sale ID
    sale = Sales.findOne(this.params.query.sale_id);

    if (sale.productId) {
        var products = [Products.findOne(sale.productId)];
    }
    if (sale.products) {
        var products = [];
        for (i = 0; i < sale.products.length; i++) {
            products.push(Products.findOne(sale.products[i]));
        }
    }

    console.log(products);

    // Prepare document
    var doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.fontSize(24);
    doc.text('Sales Receipt #' + sale.invoiceId, 10, 30);

    doc.fontSize(18);
    doc.text(sale.firstName + " " + sale.lastName, 10, 80);
    doc.text(sale.email, 10, 110);

    doc.text('Your purchase:', 10, 160);

    for (p = 0; p < products.length; p++) {
        doc.text(products[p].name, 10, 190 + 30 * p);
    }
    var totalProductLength = 190 + 30 * products.length;

    if (sale.currency == 'EUR') {
        subtotal = sale.subtotal + ' €';
        tax = sale.tax + ' €';
        amount = sale.amount + ' €';
    }
    if (sale.currency == 'USD') {
        subtotal = '$' + sale.subtotal;
        tax = '$' + sale.tax;
        amount = '$' + sale.amount;
    }

    doc.text('Subtotal: ' + subtotal, 10, totalProductLength + 50);
    doc.text('Tax (VAT): ' + tax, 10, totalProductLength + 50 + 30);
    doc.text('Total: ' + amount, 10, totalProductLength + 50 + 30 + 30);

    // Answer
    this.response.writeHead(200, {
        'Content-type': 'application/pdf',
        'Content-Disposition': "attachment; filename=invoice_" + sale.invoiceId + ".pdf"
    });
    this.response.end(doc.outputSync());
}, { where: 'server' });
