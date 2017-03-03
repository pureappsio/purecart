// // Global data
// var auth = Meteor.settings.shipwire.username + ':' + Meteor.settings.shipwire.password;
// var baseUrl = 'https://www.whiplashmerch.com';

// Meteor.methods({

//     shiwpireTest: function() {

//         // URL
//         var url = baseUrl;
//         url += '/api/items';

//         // Request
//         var answer = HTTP.get(url, { headers: { 
//             "X-API-KEY": 'Hc2BHTn3bcrwyPooyYTP',
//             "X-API-VERSION": 1
//         } });

//         console.log(answer);

//     },
//     getProductStock(product) {

//         // URL
//         var url = baseUrl;
//         url += '/api/v3/stock?sku=' + product.sku;

//         // Request
//         var answer = HTTP.get(url, { auth: auth });

//         console.log(answer.data);

//     },
//     // updateShipwireProduct: function(product) {

//     //     console.log('Updating product on shipwire');

//     //     // URL
//     //     var url = baseUrl;
//     //     url += '/api/v3/products/' + product.shipwireId;

//     //     params = {

//     //         "sku": product.sku,
//     //         "externalId": product._id,
//     //         "classification": "baseProduct",
//     //         "description": product.name,
//     //         // "hsCode": "010612",
//     //         // "countryOfOrigin": "US",
//     //         "category": "TOYS_SPORTS_HOBBIES",
//     //         "batteryConfiguration": "NOBATTERY",
//     //         "values": {
//     //             "costValue": product.cost,
//     //             // "wholesaleValue": 2,
//     //             "retailValue": product.price.USD,
//     //             "costCurrency": "USD",
//     //             "wholesaleCurrency": "USD",
//     //             "retailCurrency": "USD"
//     //         },
//     //         // "alternateNames": [{
//     //         //     "name": "SuperSportsWatch1"
//     //         // }],
//     //         "dimensions": {
//     //             "length": product.dimensions.length,
//     //             "width": product.dimensions.width,
//     //             "height": product.dimensions.height,
//     //             "weight": product.dimensions.weight
//     //         },
//     //         // "technicalData": {
//     //         //     "battery": {
//     //         //         "type": "ALKALINE",
//     //         //         "batteryWeight": 3,
//     //         //         "numberOfBatteries": 5,
//     //         //         "capacity": 6,
//     //         //         "numberOfCells": 7,
//     //         //         "capacityUnit": "WATTHOUR"
//     //         //     }
//     //         // },
//     //         "flags": {
//     //             "isPackagedReadyToShip": 1,
//     //             "isFragile": 0,
//     //             "isDangerous": 0,
//     //             "isPerishable": 0,
//     //             "isMedia": 0,
//     //             "isAdult": 0,
//     //             "isLiquid": 0,
//     //             "hasInnerPack": 0,
//     //             "hasMasterCase": 0,
//     //             "hasPallet": 0
//     //         }
//     //     };

//     //     // Request
//     //     var answer = HTTP.put(url, { params: params, auth: auth });

//     // },
//     // createShipwireProduct: function(product) {

//     //     console.log('Creating product on shipwire');

//     //     // URL
//     //     var url = baseUrl;
//     //     url += '/api/v3/products';

//     //     params = {

//     //         "sku": product.sku,
//     //         "externalId": product._id,
//     //         "classification": "baseProduct",
//     //         "description": product.name,
//     //         // "hsCode": "010612",
//     //         // "countryOfOrigin": "US",
//     //         "category": "TOYS_SPORTS_HOBBIES",
//     //         "batteryConfiguration": "NOBATTERY",
//     //         "values": {
//     //             "costValue": product.cost,
//     //             // "wholesaleValue": 2,
//     //             "retailValue": product.price.USD,
//     //             "costCurrency": "USD",
//     //             "wholesaleCurrency": "USD",
//     //             "retailCurrency": "USD"
//     //         },
//     //         // "alternateNames": [{
//     //         //     "name": "SuperSportsWatch1"
//     //         // }],
//     //         "dimensions": {
//     //             "length": product.dimensions.length,
//     //             "width": product.dimensions.width,
//     //             "height": product.dimensions.height,
//     //             "weight": product.dimensions.weight
//     //         },
//     //         // "technicalData": {
//     //         //     "battery": {
//     //         //         "type": "ALKALINE",
//     //         //         "batteryWeight": 3,
//     //         //         "numberOfBatteries": 5,
//     //         //         "capacity": 6,
//     //         //         "numberOfCells": 7,
//     //         //         "capacityUnit": "WATTHOUR"
//     //         //     }
//     //         // },
//     //         "flags": {
//     //             "isPackagedReadyToShip": 1,
//     //             "isFragile": 0,
//     //             "isDangerous": 0,
//     //             "isPerishable": 0,
//     //             "isMedia": 0,
//     //             "isAdult": 0,
//     //             "isLiquid": 0,
//     //             "hasInnerPack": 0,
//     //             "hasMasterCase": 0,
//     //             "hasPallet": 0
//     //         }
//     //     };

//     //     // Request
//     //     var answer = HTTP.post(url, { params: params, auth: auth });
//     //     return answer.data.resource.items[0].resource.id;

//     // }

// });
