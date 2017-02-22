Router.configure({
    layoutTemplate: 'layout'
});

// Admin route
Router.route('/admin', {

    waitOn: function() {
        return [Meteor.subscribe('userProducts'), Meteor.subscribe('userSales'), Meteor.subscribe('userDiscounts')];
    },

    name: 'admin',
    data: function() {

        if (!Meteor.userId()) {

            this.render('login');

        } else {
            if (this.ready()) {
                this.render('admin');
            } else {
                this.render('loading');
            }
        }

    }
});
Router.route('/login', {
    name: 'login',
    data: function() {

        this.render('login');
    }
});

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
            if (this.params.query.variant) {

                // Get variant
                variant = Variants.findOne(this.params.query.variant);

                // Get product
                product = Products.findOne(variant.productId);

                // Modify product with variant
                product.variantId = variant._id;
                product.name += " (" + variant.name + " )";
                product.price = variant.price;
                Session.set('cart', [product]);
            }
            if (this.params.query.ref) {
                Session.setTemp('affiliateCode', this.params.query.ref);
            }
            if (this.params.query.discount) {

                // Get code
                if (Discounts.findOne({ code: this.params.query.discount })) {
                    var discount = Discounts.findOne({ code: this.params.query.discount });

                    if (discount.expiryDate) {

                        // Check if expired 
                        var currentDate = new Date();
                        var expiryDate = new Date(discount.expiryDate);
                        if (currentDate.getTime() < expiryDate.getTime()) {
                            Session.setTemp('usingDiscount', discount);
                        }

                    } else {
                        Session.setTemp('usingDiscount', discount);
                    }

                }

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

Router.route('/variants/:id', {
    name: 'variantDetails',
    data: function() {

        if (Variants.findOne(this.params.id)) {
            return Variants.findOne(this.params.id);
        }
    }
});

// Cart
Router.route('/cart', {
    name: 'cart'
});

Router.route('/thank-you', {
    name: 'thankYou'
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

            if (sale) {

                Meteor.call('afterFailActions', sale);

            }

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

// Router.route('/login', {
//     name: 'login'
// });

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

    console.log(doc.outputSync());

    // Answer
    this.response.writeHead(200, {
        'Content-type': 'application/pdf',
        'Content-Disposition': "attachment; filename=invoice_" + sale.invoiceId + ".pdf"
    });
    this.response.end(doc.outputSync());
}, { where: 'server' });

// Sales PDF
Router.route('/export_sales_pdf', function() {

    var sales = Sales.find({}).fetch();

    console.log(sales);

    // Prepare document
    var doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.fontSize(24);
    doc.text('Sales', 10, 30);

    doc.fontSize(14);

    var titleLine = "Email";
    titleLine += " ";
    titleLine += "First Name";
    titleLine += " ";
    titleLine += "Last Name";
    titleLine += " ";
    titleLine += "Tax";
    saleLine += " ";
    titleLine += "Amount";


    for (i = 0; i < sales.length; i++) {

        var saleLine = sales[i].email;
        saleLine += " ";
        saleLine += sales[i].firstName;
        saleLine += " ";
        saleLine += sales[i].lastName;
        saleLine += " ";
        saleLine += sales[i].tax;
        saleLine += " ";
        saleLine += sales[i].amount;

        doc.text(saleLine, 10, 100 + 30 * i);
    }

    // Answer
    this.response.writeHead(200, {
        'Content-type': 'application/pdf',
        'Content-Disposition': "attachment; filename=sales_export.pdf"
    });
    this.response.end(doc.outputSync());
}, { where: 'server' });

// Sales PDF
Router.route('/export_sales', function() {

    var query = { success: true };
    var suffix = "";

    if (this.params.query.option) {

        if (this.params.query.option == 'last-month') {

            // Get start & end date
            var now = new Date();
            var endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            var startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            endDate.setDate(endDate.getDate() + 1);
            suffix = "_" + (moment(startDate).format('MMMM')).toLowerCase();
            query.date = { $gte: startDate, $lte: endDate };
        }
        if (this.params.query.option == 'three-months') {

            // Get start & end date
            var now = new Date();
            var endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            var startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 2, 1);
            endDate.setDate(endDate.getDate() + 1);
            suffix = "_" + (moment(startDate).format('MMMM')).toLowerCase();
            query.date = { $gte: startDate, $lte: endDate };

        }
        console.log(query);
    }

    var sales = Sales.find(query).fetch();

    //  console.log(sales);

    var file = ""

    var titleLine = "Date,";
    titleLine += "Email,";
    titleLine += "First Name,";
    titleLine += "Last Name,";
    titleLine += "Amount,";
    titleLine += "Currency,";
    titleLine += "Country,";
    titleLine += "Method";
    titleLine += '\n';

    file += titleLine;

    for (i = 0; i < sales.length; i++) {

        var saleLine = sales[i].date;
        saleLine += ",";
        saleLine += sales[i].email;
        saleLine += ",";
        saleLine += sales[i].firstName;
        saleLine += ",";
        saleLine += sales[i].lastName;
        saleLine += ",";

        if (this.params.query.currency) {

            // Get exchange rate
            var exchangeDate = moment(sales[i].date);
            exchangeDate = exchangeDate.subtract(1, "days");
            exchangeDate = exchangeDate.format("YYYY-MM-DD");

            var answer = HTTP.get('http://api.fixer.io/' + exchangeDate + '?base=' + sales[i].currency);
            var rates = answer.data.rates;

            // Calculate value
            saleLine += (sales[i].amount * rates[this.params.query.currency]).toFixed(2);
            saleLine += ",";

            // Set currency
            saleLine += this.params.query.currency;

        } else {
            saleLine += sales[i].amount;
            saleLine += ",";
            saleLine += sales[i].currency;
        }

        saleLine += ",";
        if (sales[i].country) {
            saleLine += sales[i].country;
        } else if (sales[i].currency == 'USD') {
            saleLine += 'US';
        } else {
            saleLine += 'FR';
        }
        saleLine += ",";
        saleLine += sales[i].method;
        saleLine += "\n";

        file += saleLine;

    }

    // Make short brand name
    var brand = Meteor.call('getBrandName');
    shortBrand = (brand.substring(0, 3)).toLowerCase();

    // Answer
    this.response.writeHead(200, {
        'Content-type': 'application/csv',
        'Content-Disposition': "attachment; filename=sales_export_" + shortBrand + suffix + ".csv"
    });
    this.response.end(file);
}, { where: 'server' });
