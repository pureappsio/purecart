Template.stats.helpers({

    abandon: function() {

        var sales = Sales.find({ success: true, userId: Meteor.user()._id }).count();
        return ((1 - sales / Session.get('sessions')) * 100).toFixed(2);

    },
    mobile: function() {

        return Session.get('mobileSessions');

    },
    mobileSales: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

        var mobile = Sales.find({ date: { $gte: limitDate }, browser: 'mobile' }).count();
        var all = Sales.find({ date: { $gte: limitDate } }).count();
        return (mobile / all * 100).toFixed(2);

    },
    sales: function() {

        var now = new Date();
        var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
        var sales = Sales.find({ date: { $gte: limitDate }, success: true, userId: Meteor.user()._id }).fetch();

        var total = 0;
        var rates = Metas.findOne({ type: 'rates' }).value;

        for (i in sales) {

            if (sales[i].currency == 'EUR') {
                total += parseFloat(sales[i].amount);
            } else {

                total += parseFloat(sales[i].amount) / rates[sales[i].currency];
            }


        }

        return total.toFixed(2);
    }

});

Template.stats.onRendered(function() {

    // Origin
    Meteor.call('getOriginGraphData', function(err, graphData) {

        var originChart = document.getElementById("origin-graph");

        var myPieChart = new Chart(originChart, {
            type: 'pie',
            data: graphData,
            options: {
                title: {
                    display: true,
                    text: 'Origin of Visitors'
                }
            }
        });

    });

    // Countries
    Meteor.call('getCountryGraphData', function(err, graphData) {

        var countryChart = document.getElementById("sales-country-graph");

        var myPieChart = new Chart(countryChart, {
            type: 'bar',
            data: graphData,
            options: {
                title: {
                    display: true,
                    text: 'Location of Buyers'
                }
            }
        });

    });

    // Visits
    Meteor.call('getBestVisitsGraphData', 'visits', function(err, graphData) {

        var bestVisitsGraph = document.getElementById("best-visits-graph");

        var myPieChart = new Chart(bestVisitsGraph, {
            type: 'bar',
            data: graphData,
            options: {
                title: {
                    display: true,
                    text: 'Most Visited Products'
                }
            }
        });

    });

    // Best selling products
    Meteor.call('getBestVisitsGraphData','sales', function(err, graphData) {

        var bestSalesGraph = document.getElementById("best-sales-graph");

        var myPieChart = new Chart(bestSalesGraph, {
            type: 'bar',
            data: graphData,
            options: {
                title: {
                    display: true,
                    text: 'Most Sold Products'
                }
            }
        });

    });

    // Countries
    Meteor.call('getVisitorsCountryGraphData', function(err, graphData) {

        var visitorsCountryChart = document.getElementById("visitors-country-graph");

        var myPieChart = new Chart(visitorsCountryChart, {
            type: 'bar',
            data: graphData,
            options: {
                title: {
                    display: true,
                    text: 'Location of Visitors'
                }
            }
        });

    });


    // Medium
    Meteor.call('getSocialGraphData', function(err, graphData) {

        var socialChart = document.getElementById("social-graph");

        var myPieChart = new Chart(socialChart, {
            type: 'pie',
            data: graphData,
            options: {
                title: {
                    display: true,
                    text: 'Social Media Medium of Visitors'
                }
            }
        });

    });

    Meteor.call('getAllSessions', function(err, data) {

        Session.set('sessions', data);

    });

    Meteor.call('getMobileSessions', function(err, data) {

        Session.set('mobileSessions', data);

    });

    var now = new Date();
    var limitDate = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);

    Meteor.call('getGraphData', limitDate, function(err, data) {

        var ctx = document.getElementById("sessions-graph");

        var myLineChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }]
                }
            }
        });

    });

    // Sales
    var rates = Metas.findOne({ type: 'rates' }).value;
    var sales = Sales.find({ date: { $gte: limitDate }, success: true }).fetch();

    var graphData = [];
    var days = [];

    for (i = 0; i < 32; i++) {

        // Get day
        var now = new Date();
        var salesDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * i);
        var dayDate = new Date(salesDate.getFullYear() + '-' + (salesDate.getMonth()) + '-' + salesDate.getDate());
        days.push(dayDate.getTime());

    }

    for (i in days) {

        var dataPoint = {
            x: new Date(days[i]),
            y: 0
        }

        // Go through all sales
        for (s in sales) {

            if (sales[s].currency == 'EUR') {
                saleAmount = parseFloat(sales[s].amount);
            } else {
                saleAmount = parseFloat(sales[s].amount) / rates[sales[s].currency];
            }

            salesDate = new Date(sales[s].date);
            var dayDate = new Date(salesDate.getFullYear() + '-' + (salesDate.getMonth() + 1) + '-' + salesDate.getDate());

            // console.log(dayDate.getTime());
            // console.log(days[i]);

            if (dayDate.getTime() == days[i]) {
                dataPoint.y += saleAmount;
            }

        }

        dataPoint.y = (dataPoint.y).toFixed(2);
        graphData.push(dataPoint);

    }

    var ctx = document.getElementById("sales-graph");

    var data = {
        datasets: [{
            label: "Sales (€)",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "red",
            borderColor: "red",
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: "red",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "red",
            pointHoverBorderColor: "red",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: graphData,
            spanGaps: false,
        }]
    }

    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }]
            }
        }
    });

});
