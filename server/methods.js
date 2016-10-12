// Braintree
Future = Npm.require('fibers/future');
import braintree from 'braintree';

// Import SendGrid
import sendgridModule from 'sendgrid';
const sendgrid = require('sendgrid')(Meteor.settings.sendGridAPIKey);

// Use SandBox locally
if (process.env.ROOT_URL == "http://localhost:3000/") {

  // Sandbox
  gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    publicKey: Meteor.settings.sandboxPublicKey,
    privateKey: Meteor.settings.sandboxPrivateKey,
    merchantId: Meteor.settings.sandboxMerchantId
  });

  // Merchant IDs
  var merchantIds = {
    EUR: Meteor.settings.sandboxMerchantEUR,
    USD: Meteor.settings.sandboxMerchantUSD
  };

}
else {

  // Real
  gateway = braintree.connect({
    environment: braintree.Environment.Production,
    publicKey: Meteor.settings.livePublicKey,
    privateKey: Meteor.settings.livePrivateKey,
    merchantId: Meteor.settings.liveMerchantId
  });

  var merchantIds = {
    EUR: Meteor.settings.liveMerchantEUR
    //USD: Meteor.settings.sandboxMerchantUSD
  };

}

Meteor.methods({

  removeSale: function(saleId) {

    Sales.remove(saleId);

  },
  removeProduct: function(productId) {

    Products.remove(productId);

  },
  getClientToken: function (clientId) {
    var generateToken = Meteor.wrapAsync(gateway.clientToken.generate, gateway.clientToken);
    var options = {};

    if (clientId) {
      options.clientId = clientId;
    }

    var response = generateToken(options);

    return response.clientToken;
  },
  purchaseProduct(saleData) {

    console.log('Sales data ...');
    console.log(saleData);

    // Make transaction
    var fut = new Future();

    // Verify card
    console.log('Verify card');
   gateway.customer.create({
      firstName: saleData.firstName,
      lastName: saleData.lastName,
      creditCard: {
        paymentMethodNonce: saleData.nonce,
        options: {
          verifyCard: true
        }
      }
    }, function (err, result) {

      console.log(result);
       
      if (result.success == false) {

        // Card declined
        console.log('Card declined');
        fut.return(result);

      }
      if (result.success == true) {

        console.log('Making transaction');

        // Get merchant ID
        if (merchantIds[saleData.currency]) {
          console.log('Making transaction in native currency');
          merchantId = merchantIds[saleData.currency];
          chargedAmount = saleData.amount;
        }
        else {

          console.log('Converting money');
          merchantId = merchantIds["EUR"];
          chargedAmount = (saleData.amount / 1.101605).toFixed(2);

        }

        // Make transaction
        gateway.transaction.sale({
          amount: chargedAmount,
          merchantAccountId: merchantId,
          paymentMethodToken: result.customer.paymentMethods[0].token,
          options: {
            submitForSettlement: true
          }
        }, function (err, result) {
          if (err) {console.log(err);}
          console.log(result);
          fut.return(result);
        });

      }

    });

    var answer = fut.wait();

    if (answer.success == true) {

      saleData.success = true;
      saleData.date = new Date();
      saleData.invoiceId = Sales.find({}).fetch().length + 1;  

      // Insert sale
      saleId = Sales.insert(saleData)
      sale = Sales.findOne(saleId);

      // Send email to customer
      Meteor.call('sendReceipt', sale);

      // Send notification
      Meteor.call('sendNotification', sale);

    }

    else {

      // Put sale as failed
      saleData.success = false;
      saleData.date = new Date();
      saleData.amount = 0;
      saleData.subtotal = 0;
      saleData.tax = 0;

      // Insert sale
      saleId = Sales.insert(saleData)
      sale = Sales.findOne(saleId);

    }

    return sale;

  },
  sendNotification: function(sale) {

    var product = Products.findOne(sale.productId);

    if (sale.currency == 'EUR') {
      message = 'New sale of ' + product.name + ' (' + sale.amount + '€)'
    }
    if (sale.currency == 'USD') {
      message = 'New sale of ' + product.name + ' ($' + sale.amount + ')'
    }

    parameters = {
      token: Meteor.settings.pushoverToken,
      user: Meteor.settings.pushoverUser,
      sound: 'cashregister',
      message: message
    };
    HTTP.post('https://api.pushover.net/1/messages.json', {params: parameters});

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

    // Template
    SSR.compileTemplate('receiptEmail', Assets.getText('receipt_email.html'));
    var product = Products.findOne(sale.productId);
    emailData = {
      payment_id: sale.invoiceId,
      fullname: sale.firstName + " " + sale.lastName,
      user_email: sale.email,
      product: product.name,
      productUrl: product.url,
      subtotal: subtotal,
      tax: tax,
      price: price
    };
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
    sendgrid.API(request, function (err, response) {
      if (response.statusCode != 202) {
        console.log('Receipt sent');
      }
    });

  },
  setLanguage: function(language) {

    Meteor.users.update(Meteor.user()._id, {$set: {language: language}});

  },
  checkLanguage: function() {

    if (Meteor.users.findOne({language: {$exists: true}})) {
      var language = Meteor.users.findOne({language: {$exists: true}}).language;
    }
    else {
      var language = 'en';
    }

    return language;

  },
  setBrandData: function(name, email) {

    console.log(name);

    Meteor.users.update(Meteor.user()._id, {$set: {brandName: name}});
    Meteor.users.update(Meteor.user()._id, {$set: {brandEmail: email}});

  },
  getBrandName: function() {
    var brandName = Meteor.users.findOne({brandName: {$exists: true}}).brandName;
    return brandName;
  },
  getBrandEmail: function() {
    var brandEmail = Meteor.users.findOne({brandEmail: {$exists: true}}).brandEmail;
    return brandEmail;
  },
  setTitle: function(title) {

    Meteor.users.update(Meteor.user()._id, {$set: {title: title}});

  },
  getTitle: function(title) {

    if (Meteor.users.findOne({title: {$exists: true}})) {
      var title = Meteor.users.findOne({title: {$exists: true}}).title;
    }
    else {
      var title = 'Learn';
    }
    
    return title;

  },
  addProduct(product) {

    // Add
    Products.insert(product);

  },
  isEuropeanCustomer: function(countryCode) {

    if (rates[countryCode]) {
      return true;
    }
    else {
      return false;
    }

  },
  getVAT: function(countryCode) {
    return rates[countryCode].standard_rate;
  },
  getUserLocation() {

    // Get headers
    var httpHeaders = headers.get(this);
    console.log(httpHeaders)

    if (httpHeaders['cf-ipcountry']) {
      console.log('Using CloudFlare location')
      var data = {};
      data.country_code = httpHeaders['cf-ipcountry'];
    }
    else {
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