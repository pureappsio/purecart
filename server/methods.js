// Import SendGrid
import sendgridModule from 'sendgrid';
const sendgrid = require('sendgrid')(Meteor.settings.sendGridAPIKey);

Meteor.methods({

    // exportSales: function() {

    //     var sales = Sales.find({}).fetch();

    //     console.log(sales);

    //     // Prepare document
    //     var doc = new PDFDocument({ size: 'A4', margin: 50 });
    //     doc.fontSize(24);
    //     doc.text('Sales', 10, 30);

    //     doc.fontSize(18);

    //     for (i = 0; i < sales.length; i++) {
    //         doc.text(sales[i].amount, 10, 190 + 30 * i);
    //     }

    //     return doc;

    // },
    quickEditProduct(productId, data) {

        console.log(data);

        // Update
        Products.update(productId, { $set: { price: data.price } });

    },
    sendTripwire: function(sale) {

        // Go through all products
        var products = sale.products;

        for (i in products) {

            // Get product info
            var product = Products.findOne(products[i]);
            console.log(product);

            // Check for tripwire
            if (product.tripwireType) {
                if (product.tripwireType == 'email') {

                    // Send tripwire to client
                    var brandName = Meteor.call('getBrandName');
                    var brandEmail = Meteor.call('getBrandEmail');

                    // Build mail
                    var helper = sendgridModule.mail;
                    from_email = new helper.Email(brandEmail);
                    to_email = new helper.Email(sale.email);
                    subject = product.tripwireSubject;
                    content = new helper.Content("text/html", product.tripwireText);
                    mail = new helper.Mail(from_email, subject, to_email, content);
                    mail.from_email.name = brandName;

                    // Send 1 min later
                    var sendDate = new Date();
                    sendDate = new Date(sendDate.getTime() + 1 * 60 * 1000);
                    console.log(sendDate);
                    mail.setSendAt(moment(sendDate).unix());

                    // Send
                    var requestBody = mail.toJSON()
                    var request = sendgrid.emptyRequest()
                    request.method = 'POST'
                    request.path = '/v3/mail/send'
                    request.body = requestBody
                    sendgrid.API(request, function(err, response) {
                        if (response.statusCode != 202) {
                            console.log('Tripwire sent');
                        }
                    });

                }
            }

        }

    },
    getSubscriberInfo: function(email) {

        // Check if email list is connected
        if (Integrations.findOne({ type: 'puremail', list: { $exists: true } })) {

            console.log('Checking subscriber info');
            var integration = Integrations.findOne({ type: 'puremail', list: { $exists: true } });

            // Subscribe
            var url = "https://" + integration.url + "/api/subscribers/";
            url += email + '?key=' + integration.key;
            url += '&list=' + integration.list;
            var answer = HTTP.get(url);

            if (answer.data._id) {
                return answer.data;
            } else {
                return {};
            }

        } else {
            return {};
        }

    },
    getOrigin: function(sale) {

        // Affiliate ?
        if (sale.origin) {
            console.log('Origin already known');
        } else {

            var origin;
            if (sale.affiliateCode) {
                origin = 'affiliate';
            } else {

                // Get origin from list
                var subscriber = Meteor.call('getSubscriberInfo', sale.email);

                if (subscriber._id) {

                    if (subscriber.origin) {

                        // Add origin
                        if (subscriber.origin == 'blog') {
                            origin = 'organic';
                        } else {
                            origin = subscriber.origin;
                        }


                    } else {
                        // Organic if no known origin
                        origin = 'organic';
                    }

                } else {

                    // Organic if no known origin
                    origin = 'organic';
                }

                // Update
                console.log('Sale origin: ' + origin);
                Sales.update(sale._id, { $set: { origin: origin } });

            }
        }

    },
    getProducts: function() {

        return Products.find({}).fetch();

    },
    createUsers: function() {

        // Create admin user
        var adminUser = {
            email: Meteor.settings.adminUser.email,
            password: Meteor.settings.adminUser.password,
            role: 'admin'
        }
        Meteor.call('createNewUser', adminUser);

    },
    createNewUser: function(data) {

        // Check if exist
        if (Meteor.users.findOne({ "emails.0.address": data.email })) {

            console.log('User already created');
            var userId = Meteor.users.findOne({ "emails.0.address": data.email })._id;

        } else {

            console.log('Creating new user');

            // Create
            var userId = Accounts.createUser(data);

            // Change role
            Meteor.users.update(userId, { $set: { role: data.role } });
            console.log(Meteor.users.findOne(userId));

        }

    },

    insertElement: function(element) {

        Elements.insert(element);

    },
    getCustomer: function(email) {

        customer = {};

        // All customers
        var customers = Meteor.call('getCustomers', {});

        // Find customer
        for (i in customers) {
            if (customers[i].email == email) {
                customer = customers[i];
            }
        }

        return customer;

    },
    getCustomers: function(query) {

        // Get all sales
        if (query.product) {
            var sales = Sales.find({ 
                success: true , 
                products: { $in: [query.product]}
            }).fetch();
        }
        else {
            var sales = Sales.find({ success: true }).fetch();
        }

        console.log(sales.length);
        
        var customers = [];

        for (i = 0; i < sales.length; i++) {

            // Check if customer doesn't exist
            var customerExist = false;
            for (j = 0; j < customers.length; j++) {
                if (customers[j].email == sales[i].email) {

                    customerExist = true;
                    customerIndex = j;
                }
            }
            if (customerExist) {

                // Update customer
                var customer = customers[customerIndex];
                customer.ltv += parseFloat(sales[i].amount);

                if (customer.products) {
                    for (p = 0; p < sales[i].products.length; p++) {
                        if ((customer.products).indexOf(sales[i].products[p]) == -1) {
                            customer.products.push(sales[i].products[p]);
                        }
                    }
                }

                customers[customerIndex] = customer;

            } else {

                // Add new customer
                var customer = {
                    firstName: sales[i].firstName,
                    lastName: sales[i].lastName,
                    email: sales[i].email,
                    products: sales[i].products,
                    ltv: parseFloat(sales[i].amount)
                }

                customers.push(customer);

            }

        }

        return customers;


    },
    insertSession: function(session) {

        Sessions.insert(session);

    },
    sendFailedNotification: function(sale) {

        console.log(Integrations.find({}).fetch());

        // Look for metrics integration
        if (Integrations.findOne({ type: 'puremetrics' })) {

            // Get integration
            var integration = Integrations.findOne({ type: 'puremetrics' });

            // Refresh sale
            sale = Sales.findOne(sale._id);

            // Build message
            var brandName = Meteor.call('getBrandName');
            if (sale.currency == 'EUR') {
                var message = 'Failed transaction on ' + brandName + ' for ' + sale.amount + ' €';
            }
            if (sale.currency == 'USD') {
                var message = 'Failed transaction on ' + brandName + ' for $' + sale.amount;
            }

            // Send notification
            parameters = {
                type: 'failed',
                message: message
            };

            // Add origin
            if (sale.origin) {
                parameters.origin = sale.origin;
            }

            console.log('Sending notification: ');
            console.log(parameters);

            HTTP.post('https://' + integration.url + '/api/notifications?key=' + integration.key, { params: parameters });

        }

    },
    sendNotification: function(sale) {

        console.log(Integrations.find({}).fetch());

        // Look for metrics integration
        if (Integrations.findOne({ type: 'puremetrics' })) {

            // Get integration
            var integration = Integrations.findOne({ type: 'puremetrics' });

            // Refresh sale
            sale = Sales.findOne(sale._id);

            // Build message
            var brandName = Meteor.call('getBrandName');
            if (sale.currency == 'EUR') {
                var message = 'New sale on ' + brandName + ' for ' + sale.amount + ' €';
            }
            if (sale.currency == 'USD') {
                var message = 'New sale on ' + brandName + ' for $' + sale.amount;
            }

            // Send notification
            parameters = {
                type: 'sale',
                message: message
            };

            // Add origin
            if (sale.origin) {
                parameters.origin = sale.origin;
            }

            console.log('Sending notification: ');
            console.log(parameters);

            // console.log('https://' + integration.url + '/api/notifications?key=' + integration.key);

            HTTP.post('https://' + integration.url + '/api/notifications?key=' + integration.key, { params: parameters });

        }

    },
    generateShortName: function(product) {

        if (!(product.shortName)) {

            // Get short name
            var shortName = (product.name).toLowerCase();
            shortName = shortName.replace(" ", "-");

            // Update
            Products.update(product._id, { $set: { shortName: shortName } });

        }

    },
    generateShortNames: function() {

        var products = Products.find({}).fetch();

        for (i = 0; i < products.length; i++) {

            Meteor.call('generateShortName', products[i]);

        }

    },
    setPayment: function(paymentType) {

        // Set
        // Meteor.users.update({role: 'admin'}, { $set: { payment: paymentType } });
        Meteor.call('insertMeta', { type: 'payment', value: paymentType });

    },
    getPayment: function() {

        if (Metas.findOne({ type: 'payment' })) {
            var payment = Metas.findOne({ type: 'payment' }).value;
        } else {

            // Default to paypal
            var payment = 'paypal';
        }

        return payment;

    },
    sendRecoverEmail: function(sale) {

        // Check if email list is connected
        if (sale && Integrations.findOne({ type: 'puremail', list: { $exists: true } })) {

            console.log('Sending recovery email');

            // Get language
            language = Meteor.call('checkLanguage');

            // Building email
            date = moment().add(20, 'minutes').toDate();
            if (language == 'fr') {
                subject = "Besoin d'assistance pour votre achat?";
            } else {
                subject = "Do you need any assistance with your purchase?";
            }

            // Get product
            var product = Products.findOne(sale.products[0]);

            // Template
            if (language == 'fr') {
                SSR.compileTemplate('recoverEmail', Assets.getText('recover_email_fr.html'));
            } else {
                SSR.compileTemplate('recoverEmail', Assets.getText('recover_email.html'));
            }

            emailData = {
                productName: product.name,
                productUrl: Meteor.absoluteUrl() + '?product_id=' + product._id,
                firstName: sale.firstName,
                lastName: sale.lastName
            }
            text = SSR.render("recoverEmail", emailData);

            // Integration
            var integration = Integrations.findOne({ type: 'puremail', list: { $exists: true } });

            // Send email
            var url = "https://" + integration.url + "/api/mail?key=" + integration.key;
            var answer = HTTP.post(url, {
                data: {
                    email: sale.email,
                    listId: integration.list,
                    date: date,
                    subject: subject,
                    text: text
                }
            });

        }

    },
    addToList: function(sale) {

        // Check if email list is connected
        if (Integrations.findOne({ type: 'puremail', list: { $exists: true } })) {

            console.log('Adding customer to list');
            var integration = Integrations.findOne({ type: 'puremail', list: { $exists: true } });

            // Subscribe
            var url = "https://" + integration.url + "/api/subscribe?key=" + integration.key;
            var answer = HTTP.post(url, {
                data: {
                    email: sale.email,
                    list: integration.list,
                    products: sale.products
                }
            });

        }

    },
    setList: function(list) {

        // Update
        Integrations.update({ type: 'puremail' }, { $set: { list: list } });

    },
    getEmailLists: function() {

        // Get integration
        if (Integrations.findOne({ type: 'puremail' })) {

            var integration = Integrations.findOne({ type: 'puremail' });

            // Get lists
            var url = "http://" + integration.url + "/api/lists?key=" + integration.key;
            var answer = HTTP.get(url);
            return answer.data.lists;

        } else {
            return [];
        }

    },
    editSale: function(sale) {

        // Update
        Sales.update(sale._id, {
            $set: {
                success: sale.success,
                subtotal: sale.subtotal,
                amount: sale.amount,
                tax: sale.tax
            }
        });

    },
    getIntegrations: function() {

        return Integrations.find({}).fetch();

    },
    addIntegration: function(data) {

        // Insert
        Integrations.insert(data);

    },
    removeIntegration: function(data) {

        // Insert
        Integrations.remove(data);

    },
    validateDiscount: function(discountCode) {

        if (Discounts.findOne({ code: discountCode })) {

            var discount = Discounts.findOne({ code: discountCode });
            discount.valid = true;
            return discount;

        } else {
            return { valid: false };
        }

    },
    removeDiscount: function(discountId) {

        // Add
        Discounts.remove(discountId);

    },
    createDiscount: function(discount) {

        // Add
        discountId = Discounts.insert(discount);

        return discountId;

    },
    validateApiKey: function(key) {

        var adminUser = Meteor.users.findOne({ role: 'admin', apiKey: { $exists: true } });

        if (adminUser.apiKey == key) {
            return true;
        } else {
            return false;
        }

    },
    generateApiKey: function() {

        // Check if key exist
        if (!Meteor.user().apiKey) {

            // Generate key
            var key = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 16; i++) {
                key += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            console.log(key);

            // Update user
            Meteor.users.update(Meteor.user()._id, { $set: { apiKey: key } });
        }

    },

    removeSale: function(saleId) {

        Sales.remove(saleId);

    },
    removeProduct: function(productId) {

        Products.remove(productId);

    },
    editProduct: function(product) {

        console.log(product);

        Products.update(product._id, product);

    },
    enrollCustomer: function(sale) {

        // Get product
        var product = Products.findOne(sale.products[0]);

        // If API type, create account & send email
        if (product.integrationId) {

            console.log('Enrolling customer');

            // Make request to create account
            var integration = Integrations.findOne(product.integrationId);
            var url = "https://" + integration.url + "/api/users?key=" + integration.key;
            var answer = HTTP.post(url, { data: { email: sale.email, product: product._id } });
            var userData = answer.data;

            if (userData.password) {

                // Template
                SSR.compileTemplate('accessEmail', Assets.getText('access_email_new.html'));

                // Get data
                emailData = {
                    email: sale.email,
                    url: integration.url,
                    password: userData.password,
                    product: product.name
                };

            } else {

                // Template
                SSR.compileTemplate('accessEmail', Assets.getText('access_email_update.html'));

                // Get data
                emailData = {
                    email: sale.email,
                    url: integration.url,
                    product: product.name
                };

            }

            // Send email
            var brandName = Meteor.call('getBrandName');
            var brandEmail = Meteor.call('getBrandEmail');

            // Build mail
            var helper = sendgridModule.mail;
            from_email = new helper.Email(brandEmail);
            to_email = new helper.Email(sale.email);
            subject = "How to Access Your Purchase";
            content = new helper.Content("text/html", SSR.render("accessEmail", emailData));
            mail = new helper.Mail(from_email, subject, to_email, content);
            mail.from_email.name = brandName;

            // Send
            var requestBody = mail.toJSON()
            var request = sendgrid.emptyRequest()
            request.method = 'POST'
            request.path = '/v3/mail/send'
            request.body = requestBody
            sendgrid.API(request, function(err, response) {
                if (response.statusCode != 202) {
                    console.log('Receipt sent');
                }
            });

        }

    },
    sendReceipt: function(sale) {

        // Format prices
        if (sale.currency == 'EUR') {
            subtotal = sale.subtotal + ' €';
            tax = sale.tax + ' €';
            price = sale.amount + ' €';
        }
        if (sale.currency == 'USD') {
            subtotal = '$' + sale.subtotal;
            tax = '$' + sale.tax;
            price = '$' + sale.amount;
        }

        // Get products
        var products = [];
        for (i = 0; i < sale.products.length; i++) {
            products.push(Products.findOne(sale.products[i]));
        }

        console.log(sale);
        console.log(products);

        // Downloads
        if (products[0].url || products[0].type == 'download') {

            // Build products part
            var productsReceipt = "";
            for (j = 0; j < products.length; j++) {
                productsReceipt += "<p><a href='" + products[j].url + "'>" + products[j].name + "</a></p>"
            }

            // Compile template
            SSR.compileTemplate('receiptEmail',
                Assets.getText('receipt_email.html') + productsReceipt + Assets.getText('receipt_email_end.html')
            );

            // Build data
            emailData = {
                payment_id: sale.invoiceId,
                fullname: sale.firstName + " " + sale.lastName,
                user_email: sale.email,
                subtotal: subtotal,
                tax: tax,
                price: price
            };


        }

        // Bundles
        if (products[0].bundledProducts) {

            // Build products part
            var productsReceipt = "";
            for (j = 0; j < products.length; j++) {
                productsReceipt += "<p>" + products[j].name + "</p>"
            }

            // Compile template
            SSR.compileTemplate('receiptEmail',
                Assets.getText('receipt_email.html') + productsReceipt + Assets.getText('receipt_email_end_bundle.html')
            );

            // Build data
            emailData = {
                payment_id: sale.invoiceId,
                fullname: sale.firstName + " " + sale.lastName,
                user_email: sale.email,
                subtotal: subtotal,
                tax: tax,
                price: price
            };


        }

        // API purchases
        if (products[0].integrationId) {

            // Template
            SSR.compileTemplate('receiptEmail', Assets.getText('receipt_email_api.html'));

            // Build data
            emailData = {
                payment_id: sale.invoiceId,
                fullname: sale.firstName + " " + sale.lastName,
                user_email: sale.email,
                product: products[0].name,
                subtotal: subtotal,
                tax: tax,
                price: price
            };

        }

        // Services
        if (products[0].type == 'service') {

            // Template
            SSR.compileTemplate('receiptEmail', Assets.getText('receipt_email_service.html'));

            // Build data
            emailData = {
                payment_id: sale.invoiceId,
                fullname: sale.firstName + " " + sale.lastName,
                user_email: sale.email,
                product: products[0].name,
                subtotal: subtotal,
                tax: tax,
                price: price
            };

        }


        // Brand
        var brandName = Meteor.call('getBrandName');
        var brandEmail = Meteor.call('getBrandEmail');

        // Build mail
        var helper = sendgridModule.mail;
        from_email = new helper.Email(brandEmail);
        to_email = new helper.Email(sale.email);
        subject = "Sales Receipt";
        content = new helper.Content("text/html", SSR.render("receiptEmail", emailData));
        mail = new helper.Mail(from_email, subject, to_email, content);
        mail.from_email.name = brandName;

        // Send
        var requestBody = mail.toJSON()
        var request = sendgrid.emptyRequest()
        request.method = 'POST'
        request.path = '/v3/mail/send'
        request.body = requestBody
        sendgrid.API(request, function(err, response) {
            if (response.statusCode != 202) {
                console.log('Receipt sent');
            }
        });

    },
    setLanguage: function(language) {

        // Meteor.users.update(Meteor.user()._id, { $set: { language: language } });
        Meteor.call('insertMeta', { type: 'language', value: language });

    },
    checkLanguage: function() {

        if (Metas.findOne({ type: 'language' })) {
            var language = Metas.findOne({ type: 'language' }).value;
        } else {
            var language = 'en';
        }

        return language;

    },
    setBrandData: function(name, email) {

        Meteor.call('insertMeta', { type: 'brandName', value: name });

        Meteor.call('insertMeta', { type: 'brandEmail', value: email });

    },
    getBrandName: function() {
        return Metas.findOne({ type: 'brandName' }).value;
    },
    getBrandEmail: function() {
        return Metas.findOne({ type: 'brandEmail' }).value;
    },
    setTitle: function(title) {

        Meteor.call('insertMeta', { type: 'title', value: title });

    },
    getTitle: function() {

        if (Metas.findOne({ type: 'title' })) {
            var title = Metas.findOne({ type: 'title' }).value;
        } else {
            var title = 'Learn';
        }

        return title;

    },
    addProduct(product) {

        // Add
        var productId = Products.insert(product);

        // Generate short name
        var product = Products.findOne(productId);
        Meteor.call('generateShortName', product);

    },
    isEuropeanCustomer: function(countryCode) {

        if (rates[countryCode]) {
            return true;
        } else {
            return false;
        }

    },
    getVAT: function(countryCode) {
        return rates[countryCode].standard_rate;
    },
    getUserLocation() {

        // Get headers
        var httpHeaders = headers.get(this);

        if (httpHeaders['cf-ipcountry']) {
            console.log('Using CloudFlare location')
            var data = {};
            data.country_code = httpHeaders['cf-ipcountry'];
        } else {
            console.log('Using direct IP location')
            data = Meteor.call('UserLocation/get');
        }

        return data;

    }

});

var rates = {
    "AT": {
        "country": "Austria",
        "standard_rate": 20.00,
        "reduced_rate": 10.00,
        "reduced_rate_alt": 13.00,
        "super_reduced_rate": false,
        "parking_rate": 12.00
    },
    "BE": {
        "country": "Belgium",
        "standard_rate": 21.00,
        "reduced_rate": 12.00,
        "reduced_rate_alt": 6.00,
        "super_reduced_rate": false,
        "parking_rate": 12.00
    },
    "BG": {
        "country": "Bulgaria",
        "standard_rate": 20.00,
        "reduced_rate": 9.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "CY": {
        "country": "Cyprus",
        "standard_rate": 19.00,
        "reduced_rate": 9.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "CZ": {
        "country": "Czech Republic",
        "standard_rate": 21.00,
        "reduced_rate": 15.00,
        "reduced_rate_alt": 10.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "DK": {
        "country": "Denmark",
        "standard_rate": 25.00,
        "reduced_rate": false,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "DE": {
        "country": "Germany",
        "standard_rate": 19.00,
        "reduced_rate": 7.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "EE": {
        "country": "Estonia",
        "standard_rate": 20.00,
        "reduced_rate": 9.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "EL": {
        "_comment": "While the EU uses the country code 'EL' for Greece, ISO uses 'GR' - both are included for convenience.",
        "iso_duplicate": "GR",
        "country": "Greece",
        "standard_rate": 24.00,
        "reduced_rate": 13.00,
        "reduced_rate_alt": 6.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "GR": {
        "_comment": "Duplicate of EL for convenience; the EU uses the country code 'EL' for Greece, while ISO uses 'GR'.",
        "iso_duplicate_of": "EL",
        "country": "Greece",
        "standard_rate": 24.00,
        "reduced_rate": 13.00,
        "reduced_rate_alt": 6.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "ES": {
        "country": "Spain",
        "standard_rate": 21.00,
        "reduced_rate": 10.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": 4.00,
        "parking_rate": false
    },
    "FI": {
        "country": "Finland",
        "standard_rate": 24.00,
        "reduced_rate": 14.00,
        "reduced_rate_alt": 10.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "FR": {
        "country": "France",
        "standard_rate": 20.00,
        "reduced_rate": 10.00,
        "reduced_rate_alt": 5.50,
        "super_reduced_rate": 2.10,
        "parking_rate": false
    },
    "HR": {
        "country": "Croatia",
        "standard_rate": 25.00,
        "reduced_rate": 13.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "IT": {
        "country": "Italy",
        "standard_rate": 22.00,
        "reduced_rate": 10.00,
        "reduced_rate_alt": 4.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "LV": {
        "country": "Latvia",
        "standard_rate": 21.00,
        "reduced_rate": 12.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "LT": {
        "country": "Lithuania",
        "standard_rate": 21.00,
        "reduced_rate": 9.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "LU": {
        "country": "Luxembourg",
        "standard_rate": 17.00,
        "reduced_rate": 14.00,
        "reduced_rate_alt": 8.00,
        "super_reduced_rate": 3.00,
        "parking_rate": 12.00
    },
    "HU": {
        "country": "Hungary",
        "standard_rate": 27.00,
        "reduced_rate": 18.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "IE": {
        "country": "Ireland",
        "standard_rate": 23.00,
        "reduced_rate": 13.50,
        "reduced_rate_alt": 9.00,
        "super_reduced_rate": 4.80,
        "parking_rate": 13.50
    },
    "MT": {
        "country": "Malta",
        "standard_rate": 18.00,
        "reduced_rate": 7.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "NL": {
        "country": "Netherlands",
        "standard_rate": 21.00,
        "reduced_rate": 6.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "PL": {
        "country": "Poland",
        "standard_rate": 23.00,
        "reduced_rate": 8.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "PT": {
        "country": "Portugal",
        "standard_rate": 23.00,
        "reduced_rate": 13.00,
        "reduced_rate_alt": 6.00,
        "super_reduced_rate": false,
        "parking_rate": 13.00
    },
    "RO": {
        "country": "Romania",
        "standard_rate": 20.00,
        "reduced_rate": 9.00,
        "reduced_rate_alt": 5.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "SI": {
        "country": "Slovenia",
        "standard_rate": 22.00,
        "reduced_rate": 9.50,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "SK": {
        "country": "Slovakia",
        "standard_rate": 20.00,
        "reduced_rate": 10.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "SE": {
        "country": "Sweden",
        "standard_rate": 25.00,
        "reduced_rate": 12.00,
        "reduced_rate_alt": 6.00,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "UK": {
        "_comment": "While the EU uses the country code 'UK' for the United Kingdom, ISO uses 'GB' - both are included for convenience.",
        "iso_duplicate": "GB",
        "country": "United Kingdom",
        "standard_rate": 20.00,
        "reduced_rate": 5.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    },
    "GB": {
        "_comment": "Duplicate of GB for convenience; the EU uses the country code 'UK' for the United Kingdom, while ISO uses 'GB'.",
        "iso_duplicate_of": "UK",
        "country": "United Kingdom",
        "standard_rate": 20.00,
        "reduced_rate": 5.00,
        "reduced_rate_alt": false,
        "super_reduced_rate": false,
        "parking_rate": false
    }
}
