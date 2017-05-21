Meteor.methods({

    getMobileSessions: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        var mobile = Sessions.find({ date: { $gte: limitDate }, browser: 'mobile' }).count();
        var all = Sessions.find({ date: { $gte: limitDate } }).count();
        return (mobile / all * 100).toFixed(2);

    },
    setList: function(list) {

        // Update
        Integrations.update({ type: 'puremail', userId: Meteor.user()._id }, { $set: { list: list } });

    },
    subscribeEmail: function(email) {

        // Get integration
        if (Integrations.findOne({ type: 'puremail', list: { $exists: true } })) {

            // Get integration
            var integration = Integrations.findOne({ type: 'puremail', list: { $exists: true } });

            // Get sequences
            var url = "https://" + integration.url + "/api/subscribe?key=" + integration.key;

            parameters = {
                list: integration.list,
                email: email
            };

            // Make request
            var answer = HTTP.post(url, { data: parameters });
            console.log(answer);

        }

    },
    getEmailLists: function() {

        console.log('Getting lists');

        // Get integration
        if (Integrations.findOne({ type: 'puremail', userId: Meteor.user()._id })) {

            var integration = Integrations.findOne({ type: 'puremail', userId: Meteor.user()._id });

            // Get lists
            var url = "https://" + integration.url + "/api/lists?key=" + integration.key;

            console.log(url);

            try {
                var answer = HTTP.get(url);
                return answer.data.lists;

            } catch (e) {
                return [];
            }

        } else {
            return [];
        }

    },
    getListSequences: function() {

        // Get integration
        if (Integrations.findOne({ type: 'puremail', list: { $exists: true }, userId: Meteor.user()._id })) {

            // Get integration
            var integration = Integrations.findOne({ type: 'puremail' });

            // Get sequences
            var url = "https://" + integration.url + "/api/sequences?key=" + integration.key;
            url += '&list=' + integration.list;
            var answer = HTTP.get(url);
            return answer.data.sequences;

        } else {
            return [];
        }

    },
    sortArrays: function(refArray, otherArray) {

        var all = [];

        for (var i = 0; i < otherArray.length; i++) {
            all.push({ 'A': refArray[i], 'B': otherArray[i] });
        }

        all.sort(function(a, b) {
            return b.A - a.A;
        });

        A = [];
        B = [];

        for (var i = 0; i < all.length; i++) {
            A.push(all[i].A);
            B.push(all[i].B);
        }

        return [A, B];

    },
    getRandomColor: function() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    getBestVisitsGraphData: function(type) {

        // Time
        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        // Get products
        var products = Products.find({ userId: Meteor.user()._id }).fetch();
        // var sessions = Sessions.find({ date: { $gte: limitDate } }).fetch();

        // All countries
        var colors = [];
        var productsNames = [];
        for (i in products) {
            productsNames.push(products[i].name)
            colors.push(Meteor.call('getRandomColor'));
        }

        // Init result
        sessionsProduct = [];

        for (c in products) {

            if (type == 'visits') {
                sessionsProduct[c] = Sessions.find({ date: { $gte: limitDate }, productId: products[c]._id }).count();
            }
            if (type == 'sales') {
                sessionsProduct[c] = Sales.find({ date: { $gte: limitDate }, products: products[c]._id }).count();
            }
        }

        console.log(sessionsProduct);

        var sorted = Meteor.call('sortArrays', sessionsProduct, productsNames);
        productsNames = sorted[1].slice(0, 4);
        sessionsProduct = sorted[0].slice(0, 4);

        if (type == 'sales') {
            label = "Sales by Product";
        } else {
            label = "Visits by Product";
        }

        var data = {
            labels: productsNames,
            datasets: [{
                label: label,
                data: sessionsProduct,
                backgroundColor: colors,
                hoverBackgroundColor: colors
            }]
        };

        return data;

    },

    getVisitorsCountryGraphData: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        // Get sessions
        var sessions = Sessions.find({ date: { $gte: limitDate } }).fetch();

        // All countries
        var countries = []
        var colors = [];
        for (i in sessions) {
            if (countries.indexOf(sessions[i].country) == -1 && sessions[i].country != null) {
                colors.push(Meteor.call('getRandomColor'));
                countries.push(sessions[i].country);
            }
        }

        // Init result
        sessionsCountry = [];
        for (c in countries) {
            sessionsCountry[c] = 0;
        }

        for (c in countries) {
            for (s in sessions) {
                if (sessions[s].country == countries[c]) {
                    sessionsCountry[c] += 1;
                }
            }
        }

        var sorted = Meteor.call('sortArrays', sessionsCountry, countries);
        countries = sorted[1].slice(0, 4);
        sessionsCountry = sorted[0].slice(0, 4);

        var data = {
            labels: countries,
            datasets: [{
                label: "Sessions by Country",
                data: sessionsCountry,
                backgroundColor: colors,
                hoverBackgroundColor: colors
            }]
        };

        return data;

    },
    getCountryGraphData: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        // Get sales
        var sales = Sales.find({ date: { $gte: limitDate }, success: true }).fetch();

        // All countries
        var countries = []
        var colors = [];
        for (i in sales) {
            if (countries.indexOf(sales[i].country) == -1 && sales[i].country != null) {
                colors.push(Meteor.call('getRandomColor'));
                countries.push(sales[i].country);
            }

        }

        // Init result
        salesCountry = [];
        for (c in countries) {
            salesCountry[c] = 0;
        }

        for (c in countries) {
            for (s in sales) {
                if (sales[s].country == countries[c]) {
                    salesCountry[c] += 1;
                }
            }
        }

        var sorted = Meteor.call('sortArrays', salesCountry, countries);
        countries = sorted[1].slice(0, 4);
        salesCountry = sorted[0].slice(0, 4);

        var data = {
            labels: countries,
            datasets: [{
                label: "Sales by Country",
                data: salesCountry,
                backgroundColor: colors,
                hoverBackgroundColor: colors
            }]
        };

        return data;

    },
    calculateConversion: function(result, base) {

        if (base != 0) {
            return (result / base * 100).toFixed(2);
        } else {
            return 0;
        }

    },
    getBestConversionGraphData: function() {

        // Date
        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        // Get sales
        var youtubeSales = Sales.find({ date: { $gte: limitDate }, medium: 'youtube' }).count();
        var messengerSales = Sales.find({ date: { $gte: limitDate }, medium: 'messenger' }).count();
        var facebookSales = Sales.find({ date: { $gte: limitDate }, medium: 'facebook' }).count();
        var organicSales = Sales.find({ date: { $gte: limitDate }, origin: 'organic' }).count();

        // Get sessions
        var youtubeSessions = Sessions.find({ date: { $gte: limitDate }, medium: 'youtube' }).count();
        var messengerSessions = Sessions.find({ date: { $gte: limitDate }, medium: 'messenger' }).count();
        var facebookSessions = Sessions.find({ date: { $gte: limitDate }, medium: 'facebook' }).count();
        var organicSessions = Sessions.find({ date: { $gte: limitDate }, origin: 'organic' }).count();

        // Get conversions
        var youtube = Meteor.call('calculateConversion', youtubeSales, youtubeSessions);
        var messenger = Meteor.call('calculateConversion', messengerSales, messengerSessions);
        var facebook = Meteor.call('calculateConversion', facebookSales, facebookSessions);
        var organic = Meteor.call('calculateConversion', organicSales, organicSessions);



        var data = {
            labels: [
                "Organic",
                "Youtube",
                "Facebook",
                "Messenger"
            ],
            datasets: [{
                label: "Conversions by Channel",
                data: [organic, youtube, facebook, messenger],
                backgroundColor: [
                    "#FF6384",
                    "#e52d27",
                    "#3b5998",
                    "#3b5998"
                ],
                hoverBackgroundColor: [
                    "#FF6384",
                    "#e52d27",
                    "#3b5998",
                    "#3b5998"
                ]
            }]
        };

        return data;

    },
    getOriginGraphData: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        // Get sessions
        var social = Sessions.find({ date: { $gte: limitDate }, origin: 'social' }).fetch().length;
        var ads = Sessions.find({ date: { $gte: limitDate }, origin: 'ads' }).fetch().length;
        var organic = Sessions.find({ date: { $gte: limitDate }, origin: 'organic' }).fetch().length;

        var data = {
            labels: [
                "Organic",
                "Social",
                "Ads"
            ],
            datasets: [{
                data: [organic, social, ads],
                backgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56"
                ],
                hoverBackgroundColor: [
                    "#FF6384",
                    "#36A2EB",
                    "#FFCE56"
                ]
            }]
        };

        return data;

    },

    getSocialGraphData: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        // Get sessions
        var youtube = Sessions.find({ date: { $gte: limitDate }, medium: 'youtube' }).fetch().length;
        var facebook = Sessions.find({ date: { $gte: limitDate }, medium: 'facebook' }).fetch().length;
        var twitter = Sessions.find({ date: { $gte: limitDate }, medium: 'twitter' }).fetch().length;

        var data = {
            labels: [
                "Youtube",
                "Facebook",
                "Twitter"
            ],
            datasets: [{
                data: [youtube, facebook, twitter],
                backgroundColor: [
                    "#e52d27",
                    "#3b5998",
                    "#4099FF"
                ],
                hoverBackgroundColor: [
                    "#e52d27",
                    "#3b5998",
                    "#4099FF"
                ]
            }]
        };

        console.log(data.datasets);

        return data;

    },

    getSessionsCount: function(type, dateLimit) {

        return Sessions.aggregate(
            [
                { $match: { date: { $gte: dateLimit }, type: type } }, {
                    $group: {
                        _id: {
                            "year": {
                                "$substr": ["$date", 0, 4]
                            },
                            "month": {
                                "$substr": ["$date", 5, 2]
                            },
                            "day": {
                                "$substr": ["$date", 8, 2]
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);
    },
    getSalesCount: function(dateLimit) {

        console.log(Sales.find({ date: { $gte: dateLimit }, success: true }).fetch());

        return Sales.aggregate(
            [
                { $match: { date: { $gte: dateLimit }, success: true } }, {
                    $group: {
                        _id: {
                            "year": {
                                "$substr": ["$date", 0, 4]
                            },
                            "month": {
                                "$substr": ["$date", 5, 2]
                            },
                            "day": {
                                "$substr": ["$date", 8, 2]
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);
    },
    getGraphData: function(dateLimit) {

        var sessions = Meteor.call('getSessionsCount', 'checkout', dateLimit);
        var productSessions = Meteor.call('getSessionsCount', 'visit', dateLimit);
        var sales = Meteor.call('getSalesCount', dateLimit);

        sessionData = [];
        salesData = [];
        productSessionsData = [];

        for (i in sessions) {

            dataPoint = {}

            dataPoint.y = parseInt(sessions[i].count);
            var date = sessions[i]._id.year + '-' + sessions[i]._id.month + '-' + sessions[i]._id.day;
            dataPoint.x = (new Date(date)).setHours(0);

            sessionData.push(dataPoint);

        }

        for (i in productSessions) {

            dataPoint = {}

            dataPoint.y = parseInt(productSessions[i].count);
            var date = productSessions[i]._id.year + '-' + productSessions[i]._id.month + '-' + productSessions[i]._id.day;
            dataPoint.x = (new Date(date)).setHours(0);

            productSessionsData.push(dataPoint);

        }

        for (i in sales) {

            dataPoint = {}

            dataPoint.y = parseInt(sales[i].count);
            var date = sales[i]._id.year + '-' + sales[i]._id.month + '-' + sales[i]._id.day;
            dataPoint.x = (new Date(date)).setHours(0);

            salesData.push(dataPoint);

        }

        // Sort
        sessionData.sort(date_sort);
        salesData.sort(date_sort);
        productSessionsData.sort(date_sort);

        // Only show product pages visits for stores
        if (Metas.findOne({ type: 'homePage', userId: Meteor.user()._id })) {
            if (Metas.findOne({ type: 'homePage', userId: Meteor.user()._id }).value == 'store') {
                var plotProductVisits = true;
            } else {
                var plotProductVisits = false;
            }
        } else {
            var plotProductVisits = false;
        }

        var datasets = [{
            label: 'Checkout Visits',
            fill: false,
            data: sessionData,
            pointHoverBackgroundColor: "darkblue",
            pointHoverBorderColor: "darkblue",
            pointBorderColor: "darkblue",
            backgroundColor: "darkblue",
            borderColor: "darkblue"
        }, {
            label: 'Sales',
            fill: false,
            data: salesData,
            pointHoverBackgroundColor: "red",
            pointHoverBorderColor: "red",
            pointBorderColor: "red",
            backgroundColor: "red",
            borderColor: "red"
        }];

        if (plotProductVisits == true) {
            datasets.push({
                label: 'Product Pages Visits',
                fill: false,
                data: productSessionsData,
                pointHoverBackgroundColor: "orange",
                pointHoverBorderColor: "orange",
                pointBorderColor: "orange",
                backgroundColor: "orange",
                borderColor: "orange"
            });
        }

        var data = {
            datasets: datasets
        };

        return data;

    },
    getMeta: function(meta) {

        return Metas.findOne({ type: meta, userId: Meteor.user()._id }).value;

    },
    editUser: function(user) {

        console.log(user);
        Meteor.users.update(user._id, { $set: user });

    },
    addReview: function(review) {

        console.log(review);
        Reviews.insert(review);

    },
    removeReview: function(reviewId) {

        Reviews.remove(reviewId);

    },
    getSessions: function(productId) {

        return Sessions.find({ productId: productId, type: 'checkout' }).fetch().length;

    },
    getAllSessions: function() {

        return Sessions.find({ userId: Meteor.user()._id, type: 'checkout' }).fetch().length;

    },
    editVariant: function(variant) {

        console.log(variant);

        Variants.update(variant._id, { $set: variant });

    },
    updateApp: function() {

        // console.log('Update');
        Metas.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Products.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Variants.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Sales.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Customers.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

        Validations.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Sessions.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

        Discounts.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });
        Elements.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

        Gateways.update({}, { $set: { userId: Meteor.user()._id } }, { multi: true });

    },
    getCartTitle: function(userId) {

        if (Metas.findOne({ type: 'brandName', userId: userId })) {
            var title = Metas.findOne({ type: 'brandName', userId: userId }).value;

        } else {
            var title = 'PureCart';
        }

        return title;

    },
    getCartIcon: function(userId) {

        if (Metas.findOne({ type: 'icon', userId: userId })) {
            var iconId = Metas.findOne({ type: 'icon', userId: userId }).value;
            var icon = Images.findOne(iconId).link();

        } else {
            var icon = '/favicon.png?v=2';
        }

        return icon;

    },
    getUserDomain: function(domain) {

        console.log('Domain:' + domain);

        if (domain == 'admin') {
            return Meteor.users.findOne({ role: domain });
        } else {
            if (Meteor.users.findOne({ domain: domain })) {
                return Meteor.users.findOne({ domain: domain });
            } else {
                return Meteor.users.findOne({ role: 'admin' });
            }
        }

    },

    setUserDomain: function(domain) {

        Meteor.users.update(Meteor.user()._id, { $set: { domain: domain } });

        console.log(Meteor.user());

    },

    createUserAccount: function(data) {

        console.log(data);

        // Check if exist
        if (Meteor.users.findOne({ "emails.0.address": data.email })) {

            console.log('Updating existing app user');
            var userId = Meteor.users.findOne({ "emails.0.address": data.email })._id;

        } else {

            console.log('Creating new app user');

            // Create
            var userId = Accounts.createUser({
                email: data.email,
                password: data.password
            });

            // Assign role
            Meteor.users.update(userId, { $set: { role: data.role } });

        }

        return userId;

    },

    modifyStock: function(productId, increment) {

        console.log(productId);

        // Check if it exists
        if (!Products.findOne({ _id: productId, qty: { $exists: true } })) {

            Products.update(productId, { $set: { 'qty': 0 } });

        }

        // Update
        Products.update(productId, { $inc: { 'qty': increment } });

    },
    insertVariant: function(variant) {

        console.log(variant);
        Variants.insert(variant);

    },
    removeVariant: function(variantId) {

        Variants.remove(variantId);

    },

    quickEditProduct(productId, data) {

        console.log(data);

        // Update
        Products.update(productId, { $set: { price: data.price } });

    },
    setStorePicture: function(elementId) {

        // Set store picture
        Elements.update(elementId, { $set: { storePicture: true } });
        var element = Elements.findOne(elementId);

        // Update all others
        Elements.update({ _id: { $ne: elementId }, type: element.type, productId: element.productId }, { $set: { storePicture: false } }, { multi: true });

    },
    changerOrderElement: function(elementId, orderChange) {

        // Get element
        var element = Elements.findOne(elementId);
        var currentOrder = element.order;
        var elements = Elements.find({ productId: element.productId, type: element.type }).fetch();

        if (elements.length == currentOrder && orderChange == 1) {
            console.log('Not changing order');
        } else if (currentOrder == 0 && orderChange == -1) {
            console.log('Not changing order');
        } else {

            console.log('Changing order');

            if (orderChange == 1) {
                var pastElement = Elements.findOne({ productId: element.productId, type: element.type, order: currentOrder + 1 });
            }
            if (orderChange == -1) {
                var pastElement = Elements.findOne({ productId: element.productId, type: element.type, order: currentOrder - 1 });
            }

            // Current element
            Elements.update(elementId, { $inc: { order: orderChange } });

            // Past
            if (orderChange == 1) {
                Elements.update(pastElement._id, { $inc: { order: -1 } });
            }
            if (orderChange == -1) {
                Elements.update(pastElement._id, { $inc: { order: 1 } });
            }
        }

    },
    insertElement: function(element) {

        // Order
        var elements = Elements.find({ type: element.type, productId: element.productId }).fetch();
        element.order = elements.length + 1;

        console.log(element);

        Elements.insert(element);

    },
    deleteElement: function(elementId) {

        Elements.remove(elementId);

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
        Meteor.call('insertMeta', {
            type: 'payment',
            value: paymentType,
            userId: Meteor.user()._id
        });

    },
    getPayment: function(userId) {

        if (Metas.findOne({ type: 'payment', userId: userId })) {
            var payment = Metas.findOne({ type: 'payment', userId: userId }).value;
        } else {

            // Default to paypal
            var payment = 'paypal';
        }

        return payment;

    },
    setList: function(list) {

        // Update
        Integrations.update({ type: 'puremail' }, { $set: { list: list } });

    },
    getCourses: function() {

        // Get integration
        if (Integrations.findOne({ type: 'purecourses' })) {

            var integration = Integrations.findOne({ type: 'purecourses' });

            // Get course
            var url = "http://" + integration.url + "/api/courses?key=" + integration.key;

            if (Meteor.user().role != 'admin') {
                url += '&user=' + Meteor.user().emails[0].address;
            }
            console.log(url);

            var answer = HTTP.get(url);
            // console.log(answer.data.courses);
            return answer.data.courses;

        } else {
            return [];
        }

    },
    getModules: function(courseId) {

        console.log('Grabbing modules');

        // Get integration
        if (Integrations.findOne({ type: 'purecourses' })) {

            var integration = Integrations.findOne({ type: 'purecourses' });

            // Get lists
            var url = "http://" + integration.url + "/api/modules?key=" + integration.key;
            url += '&course=' + courseId;
            url += '&user=' + Meteor.user().emails[0].address;
            var answer = HTTP.get(url);
            //console.log(answer.data.modules);
            return answer.data.modules;

        } else {
            return [];
        }

    },
    getBonuses: function(courseId) {

        // Get integration
        if (Integrations.findOne({ type: 'purecourses' })) {

            var integration = Integrations.findOne({ type: 'purecourses' });

            // Get lists
            var url = "http://" + integration.url + "/api/bonuses?key=" + integration.key;
            url += '&course=' + courseId;
            url += '&user=' + Meteor.user().emails[0].address;
            console.log(url);
            var answer = HTTP.get(url);
            // console.log(answer.data.courses);
            return answer.data.bonuses;

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
    removeDiscount: function(discountId) {

        // Add
        Discounts.remove(discountId);

    },
    createDiscount: function(discount) {

        // Add
        console.log(discount);
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

        // If physical, create/update on shipwire
        var product = Products.findOne(product._id);

        // if (product.shipwireId) {

        //     Meteor.call('updateShipwireProduct', product);
        // } else {
        //     var shipwireId = Meteor.call('createShipwireProduct', product);
        //     Products.update(product._id, { $set: { shipwireId: shipwireId } });
        // }

    },
    setLanguage: function(language) {

        // Meteor.users.update(Meteor.user()._id, { $set: { language: language } });
        Meteor.call('insertMeta', { type: 'language', value: language });

    },
    checkLanguage: function(userId) {

        if (Metas.findOne({ type: 'language', userId: userId })) {
            var language = Metas.findOne({ type: 'language', userId: userId }).value;
        } else {
            var language = 'en';
        }

        return language;

    },

    getBrandName: function(userId) {
        return Metas.findOne({ type: 'brandName', userId: userId }).value;
    },
    getBrandEmail: function(userId) {
        return Metas.findOne({ type: 'brandEmail', userId: userId }).value;
    },

    getTitle: function(userId) {

        if (Metas.findOne({ type: 'titlePicture', userId: userId })) {
            var pictureId = Metas.findOne({ type: 'titlePicture', userId: userId }).value;
            return Images.findOne(pictureId).link();
        }

    },
    addProduct(product) {

        // Add
        var productId = Products.insert(product);

        // Generate short name
        var product = Products.findOne(productId);
        console.log(product);
        Meteor.call('generateShortName', product);

    }

});

function date_sort(a, b) {
    return new Date(a.x).getTime() - new Date(b.x).getTime();
}
