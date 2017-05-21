// Import SendGrid
import sendgridModule from 'sendgrid';
const sendgrid = require('sendgrid')(Meteor.settings.sendGridAPIKey);

Meteor.methods({

    getSortedProducts: function() {

        // Get products
        var products = Products.find({ userId: Meteor.user()._id }, { sort: { name: 1 } }).fetch();

        // Add sales
        for (i in products) {

            // Get all sales
            var productSales = Sales.find({
                products: {
                    $elemMatch: { $eq: products[i]._id }
                }
            }).fetch().length;

            products[i].sales = productSales;

        }

        // Sort
        products.sort(function(a, b) {
            return parseFloat(b.sales) - parseFloat(a.sales);
        });

        return products;


    },
    setGateway: function(gateway) {

        console.log(gateway);

        // Check if exists
        if (Gateways.findOne({ type: gateway.type, userId: gateway.userId })) {

            console.log('Updating gateway');
            Gateways.update({ type: gateway.type, userId: gateway.userId }, { $set: gateway });

        } else {

            // New gateway
            console.log('New gateway');
            Gateways.insert(gateway);
        }

    },
    validateEmail: function(text) {

        var re = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/;
        console.log(re.test(text));
        return re.test(text);

    },
    updateConversionRates: function() {

        var answer = HTTP.get('http://api.fixer.io/latest');

        Meteor.call('insertMeta', {
            type: 'rates',
            value: answer.data.rates
        });

    },
    validateProduct: function(saleData) {

        saleData.success = 'validation';
        saleData.date = new Date();
        saleData.invoiceId = Sales.find({}).fetch().length + 1;

        console.log(saleData);
        Sales.insert(saleData);

    },

    sendFeedback: function(sale) {

        // Go through all products
        var products = sale.products;

        for (i in products) {

            // Get product info
            var product = Products.findOne(products[i]);
            console.log('Sending feedback for product ' + product.name);

            // Check for tripwire
            if (product.useFeedback) {
                if (product.useFeedback == 'yes') {

                    // Send tripwire to client
                    var brandName = Meteor.call('getBrandName', sale.userId);
                    var brandEmail = Meteor.call('getBrandEmail', sale.userId);

                    // Build mail
                    var helper = sendgridModule.mail;
                    from_email = new helper.Email(brandEmail);
                    to_email = new helper.Email(sale.email);
                    subject = product.feedbackSubject;
                    content = new helper.Content("text/html", product.feedbackText);
                    mail = new helper.Mail(from_email, subject, to_email, content);
                    mail.from_email.name = brandName;

                    // Send 7 days later
                    var sendDate = new Date();
                    sendDate = new Date(sendDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                    mail.setSendAt(moment(sendDate).unix());

                    // Send
                    var requestBody = mail.toJSON()
                    var request = sendgrid.emptyRequest()
                    request.method = 'POST'
                    request.path = '/v3/mail/send'
                    request.body = requestBody
                    sendgrid.API(request, function(err, response) {
                        if (response.statusCode != 202) {
                            console.log('Feedback sent');
                        }
                    });

                }
            }

        }

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
                    var brandName = Meteor.call('getBrandName', sale.userId);
                    var brandEmail = Meteor.call('getBrandEmail', sale.userId);

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
    getSaleOrigin: function(sale) {

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
                success: true,
                products: { $in: [query.product] }
            }).fetch();
        } else {
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

                if (sales[i].country) {
                    customer.country = sales[i].country;
                }

                customer.lastPurchase = sales[i].date

                if (customer.products) {
                    if (sales[i].products) {
                        for (p = 0; p < sales[i].products.length; p++) {
                            if ((customer.products).indexOf(sales[i].products[p]) == -1) {
                                customer.products.push(sales[i].products[p]);
                            }
                        }
                    }
                    if (sales[i].productId) {
                        customer.products.push(sales[i].productId);
                    }

                }

                customers[customerIndex] = customer;

            } else {

                // Add new customer
                var customer = {
                    firstName: sales[i].firstName,
                    lastName: sales[i].lastName,
                    email: sales[i].email,
                    ltv: parseFloat(sales[i].amount),
                    lastPurchase: sales[i].date
                }

                // Products
                if (sales[i].products) {
                    customer.products = sales[i].products;
                }
                if (sales[i].productId) {
                    customer.products = [sales[i].productId];
                }

                if (sales[i].country) {
                    customer.country = sales[i].country;
                }

                customers.push(customer);

            }

        }

        // Sort
        customers.sort(function(a, b) {
            return parseFloat(b.ltv) - parseFloat(a.ltv);
        });

        // Filter for date
        if (query.lastPurchase) {

            var filteredCustomers = [];

            for (c in customers) {
                if ((customers[c].lastPurchase).getTime() < (query.lastPurchase).getTime()) {
                    filteredCustomers.push(customers[c]);
                }
            }

            customers = filteredCustomers;

        }

        console.log(customers);

        return customers;

    },
    insertSession: function(session) {

        if (!Meteor.user()) {
            console.log(session);
            Sessions.insert(session);
        } else {
            console.log('Admin, not inserting session');
        }

    },
    sendFailedNotification: function(sale) {

        // console.log(Integrations.find({}).fetch());

        // Look for metrics integration
        if (Integrations.findOne({ type: 'puremetrics' })) {

            // Get integration
            var integration = Integrations.findOne({ type: 'puremetrics' });

            // Refresh sale
            sale = Sales.findOne(sale._id);

            // Build message
            var brandName = Meteor.call('getBrandName', sale.userId);
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
            var brandName = Meteor.call('getBrandName', sale.userId);
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

    sendAutomatedRecoverEmail: function(emailAddress, cart) {

        console.log('Recovering automatically to email: ' + emailAddress);

        // Get product
        var product = cart[0];

        // Get language
        language = Meteor.call('checkLanguage', product.userId);

        // Building email
        date = moment().add(10, 'minutes').toDate();
        if (language == 'fr') {
            subject = "Besoin d'assistance pour votre achat?";
        } else {
            subject = "Do you need any assistance with your purchase?";
        }

        // Template
        if (language == 'fr') {
            SSR.compileTemplate('recoverEmail', Assets.getText('recover_email_fr.html'));
        } else {
            SSR.compileTemplate('recoverEmail', Assets.getText('recover_email.html'));
        }

        emailData = {
            productName: product.name,
            productUrl: Meteor.absoluteUrl() + 'checkout?product_id=' + product._id
        }
        text = SSR.render("recoverEmail", emailData);

        var brandName = Meteor.call('getBrandName', product.userId);
        var brandEmail = Meteor.call('getBrandEmail', product.userId);

        // Build mail
        var helper = sendgridModule.mail;
        from_email = new helper.Email(brandEmail);
        to_email = new helper.Email(emailAddress);
        subject = subject;
        content = new helper.Content("text/html", text);
        mail = new helper.Mail(from_email, subject, to_email, content);
        mail.from_email.name = brandName;

        // Send later
        var sendDate = new Date();
        sendDate = new Date(sendDate.getTime() + 1 * 60 * 1000);
        mail.setSendAt(moment(sendDate).unix());

        // Send
        var requestBody = mail.toJSON()
        var request = sendgrid.emptyRequest()
        request.method = 'POST'
        request.path = '/v3/mail/send'
        request.body = requestBody
        sendgrid.API(request, function(err, response) {
            if (response.statusCode != 202) {
                console.log('Recover email sent');
            }
        });

    },
    sendRecoverEmail: function(sale) {

        // Check if email list is connected
        if (sale) {

            console.log('Sending recovery email');

            // Get language
            language = Meteor.call('checkLanguage', sale.userId);

            // Building email
            date = moment().add(10, 'minutes').toDate();
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

            var brandName = Meteor.call('getBrandName', sale.userId);
            var brandEmail = Meteor.call('getBrandEmail', sale.userId);

            // Build mail
            var helper = sendgridModule.mail;
            from_email = new helper.Email(brandEmail);
            to_email = new helper.Email(sale.email);
            subject = subject;
            content = new helper.Content("text/html", text);
            mail = new helper.Mail(from_email, subject, to_email, content);
            mail.from_email.name = brandName;

            // Send 1 hour later
            var sendDate = new Date();
            sendDate = new Date(sendDate.getTime() + 1 * 60 * 1000);
            mail.setSendAt(moment(sendDate).unix());

            // Send
            var requestBody = mail.toJSON()
            var request = sendgrid.emptyRequest()
            request.method = 'POST'
            request.path = '/v3/mail/send'
            request.body = requestBody
            sendgrid.API(request, function(err, response) {
                if (response.statusCode != 202) {
                    console.log('Recover email sent');
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

    validateDiscount: function(discountCode) {

        if (Discounts.findOne({ code: discountCode })) {

            var discount = Discounts.findOne({ code: discountCode });

            if (discount.expiryDate) {

                // Check if expired 
                var currentDate = new Date();
                var expiryDate = new Date(discount.expiryDate);
                if (currentDate.getTime() < expiryDate.getTime()) {
                    discount.valid = true;
                    return discount;
                } else {
                    return { valid: false };
                }

            } else {
                discount.valid = true;
                return discount;
            }

        } else {
            return { valid: false };
        }

    },
    enrollCustomer: function(sale) {

        // User
        var user = Meteor.users.findOne(sale.userId);

        // Get data
        var brandName = Meteor.call('getBrandName', sale.userId);
        var brandEmail = Meteor.call('getBrandEmail', sale.userId);

        // Found courses?
        var enrolling = false;

        // Go through all products
        for (p in sale.products) {

            // Get product
            var product = Products.findOne(sale.products[p]);

            // If API type, create account & send email
            if (product.courses) {

                console.log('Enrolling customer');

                // Check for variants
                if (sale.variants[p] != null) {

                    // Get variant
                    var variant = Variants.findOne(sale.variants[p]);
                    productName = product.name + ' (' + variant.name + ' )';

                    var enrollData = {
                        email: sale.email,
                        courses: variant.courses
                    };

                    if (user.role != 'admin') {
                        enrollData.teacherEmail = user.emails[0].address;
                    }

                    if (variant.modules) {
                        enrollData.modules = variant.modules;
                    }
                    if (variant.bonuses) {
                        enrollData.bonuses = variant.bonuses;
                    }

                    // Make request to create account
                    var integration = Integrations.findOne({ type: 'purecourses' });
                    var url = "https://" + integration.url + "/api/users?key=" + integration.key;
                    var answer = HTTP.post(url, { data: enrollData });
                    if (enrolling == false) {
                        var userData = answer.data;
                        enrolling = true;
                    }


                } else {

                    productName = product.name;

                    var enrollData = {
                        email: sale.email,
                        courses: product.courses,
                    };

                    if (user.role != 'admin') {
                        enrollData.teacherEmail = user.emails[0].address;
                    }

                    console.log('Enrollment data: ');
                    console.log(enrollData);

                    // Make request to create account
                    var integration = Integrations.findOne({ type: 'purecourses' });
                    var url = "https://" + integration.url + "/api/users?key=" + integration.key;
                    var answer = HTTP.post(url, { data: enrollData });
                    if (enrolling == false) {
                        var userData = answer.data;
                        enrolling = true;
                    }

                }

            }

        }

        // Send email if enrolled
        if (enrolling == true) {

            if (userData.password) {

                // Template
                SSR.compileTemplate('accessEmail', Assets.getText('access_email_new.html'));

                // Get data
                emailData = {
                    email: sale.email,
                    url: integration.url,
                    password: userData.password,
                    product: productName
                };

            } else {

                // Template
                SSR.compileTemplate('accessEmail', Assets.getText('access_email_update.html'));

                // Get data
                emailData = {
                    email: sale.email,
                    url: integration.url,
                    product: productName
                };

            }

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
                    console.log('Enrollement email sent');
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
        if (sale.currency == 'GBP') {
            subtotal = '£' + sale.subtotal;
            tax = '£' + sale.tax;
            price = '£' + sale.amount;
        }

        // Get products
        var products = [];
        for (i = 0; i < sale.products.length; i++) {

            var product = Products.findOne(sale.products[i]);

            if (sale.variants[i] != null) {
                variant = Variants.findOne(sale.variants[i]);
                product.name += ' (' + variant.name + ' )';
                if (variant.url && product.url) {
                    product.url = variant.url;
                }

            }

            products.push(product);
        }

        // console.log(sale);
        // console.log(products);

        // Email data
        emailData = {
            date: moment(new Date()).format("MMMM Do YYYY"),
            payment_id: sale.invoiceId,
            fullname: sale.firstName + " " + sale.lastName,
            user_email: sale.email,
            subtotal: subtotal,
            tax: tax,
            price: price
        };

        if (sale.method == 'paypal') {
            emailData.method = 'Paypal';
        } else {
            emailData.method = 'Card';
        }

        // Physical products
        if (products[0].type == 'physical') {

            // Build products part
            var productsReceipt = "";
            for (j = 0; j < products.length; j++) {
                productsReceipt += "<p>" + products[j].name + "</p>"
            }

            // Compile template
            SSR.compileTemplate('receiptEmail',
                Assets.getText('receipt_email.html') + productsReceipt + Assets.getText('receipt_email_end_physical.html')
            );


        }

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

        }

        // API purchases
        if (products[0].type == 'api') {

            // Template
            SSR.compileTemplate('receiptEmail', Assets.getText('receipt_email_api.html'));

            // Build data
            emailData.product = products[0].name

        }

        // Services
        if (products[0].type == 'service') {

            // Template
            SSR.compileTemplate('receiptEmail', Assets.getText('receipt_email_service.html'));

            // Build data
            emailData.product = products[0].name

        }

        // Brand
        var brandName = Meteor.call('getBrandName', sale.userId);
        var brandEmail = Meteor.call('getBrandEmail', sale.userId);

        emailData.brandName = brandName;
        emailData.brandEmail = brandEmail;

        // Create body
        var emailText = SSR.render("receiptEmail", emailData);
        emailText = '<div style="font-size: 16px;">' + emailText + '</div>';

        // Build mail
        var helper = sendgridModule.mail;
        from_email = new helper.Email(brandEmail);
        to_email = new helper.Email(sale.email);
        subject = brandName + ": Sales Receipt #" + sale.invoiceId;
        content = new helper.Content("text/html", emailText);
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
            data.country_code = 'DE';
        }

        return data;

    },
    getOrigin: function(referer) {

        var origin = 'organic';

        if (referer.includes('youtube') || referer.includes('facebook') || referer.includes('twitter')) {
            origin = 'social';
        }

        return origin;

    },
    getMedium: function(referer) {

        var medium = 'google';

        if (referer.includes('youtube')) {
            medium = 'youtube';
        }
        if (referer.includes('facebook')) {
            medium = 'facebook';
        }
        if (referer.includes('twitter')) {
            medium = 'twitter';
        }

        return medium;

    },
    getUserOrigin() {

        // Get headers
        var httpHeaders = headers.get(this);

        if (httpHeaders.referer) {

            var origin = Meteor.call('getOrigin', httpHeaders.referer);
            var medium = Meteor.call('getMedium', httpHeaders.referer);

            return {
                origin: origin,
                medium: medium
            }

        } else {
            return {
                origin: 'organic',
                medium: 'google'
            }
        }

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
