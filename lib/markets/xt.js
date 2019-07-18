var request = require('request');

var base_url = 'https://kline.xt.com/api/data/v1';

function get_summary(coin, exchange, cb) {
  var req_url = base_url + '/ticker?marketName=' + coin + '_' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (error) {
      return cb(error, null);
    } else {
      if (body.resMsg.message !== "success !") {
        return cb(body.message, null)
      } else {
        return cb (null, body.datas[1]);
      }
    }
  });
}

function get_trades(coin, exchange, cb) {
  var req_url = base_url + '/trades?marketName=' + coin + '_' + exchange + '&dataSize=50';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.resMsg.message === "success !") {
      return cb (null, body.datas);
    } else {
      return cb(body.resMsg.message, null);
    }
  });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + '/entrusts?marketName='  + coin + '_' + exchange;
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.resMsg.message === "success !") {
      var orders = body.datas;
      var buys = [];
      var sells = [];

      if (orders['bids'].length > 0){
          for (var i = 0; i < orders['bids'].length; i++) {
            var order = {
              amount: parseFloat(orders.buy[i][1]).toFixed(8),
              price: parseFloat(orders.buy[i][0]).toFixed(8),
              //  total: parseFloat(orders.buy[i].Total).toFixed(8)
              // Necessary because API will return 0.00 for small volume transactions
              total: (parseFloat(orders.buy[i][1]).toFixed(8) * parseFloat(orders.buy[i][0])).toFixed(8)
            }
            buys.push(order);
          }
      }
      if (orders['sell'].length > 0) {
        for (var x = 0; x < orders['asks'].length; x++) {
            var order = {
                amount: parseFloat(orders.sell[x][1]).toFixed(8),
                price: parseFloat(orders.sell[x][0]).toFixed(8),
                //    total: parseFloat(orders.sell[x].Total).toFixed(8)
                // Necessary because API will return 0.00 for small volume transactions
                total: (parseFloat(orders.sell[x][1]).toFixed(8) * parseFloat(orders.sell[x][0])).toFixed(8)
            }
            sells.push(order);
        }
      }
      return cb(null, buys, sells);
    } else {
      return cb(body.message, [], []);
    }
  });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_orders(coin, exchange, function(err, buys, sells) {
      if (err) { error = err; }
      get_trades(coin, exchange, function(err, trades) {
        if (err) { error = err; }
        get_summary(coin, exchange, function(err, stats) {
          if (err) { error = err; }
          return cb(error, {buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats});
        });
      });
    });
  }
};
