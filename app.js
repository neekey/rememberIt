var express = require('express');
var routes = require('./server/route');
var CROS = require('./server/cros');
var http = require('http');
var path = require('path');
var fs = require('fs');
var cluster = require('cluster');
var bodyParser = require( 'body-parser' );

function startServer() {

  process.on('uncaughtException', function (err) {
    setTimeout(function () {
      process.exit(1);
    }, 1000);
  });

  var app = express();
  var server = http.createServer(app);
  var appConfig = require('./config/config');
  var Connection = require('./server/connection');
  var timeout = require('connect-timeout');

  // 添加应用配置
  app.set('appConfig', appConfig);
  // 应用的网站目录
  app.set('appBasePath', __dirname );

  if (cluster.isWorker) {
    app.set('workerId', cluster.worker.id);
  }
  else {
    app.set('workerId', 'master');
  }

  // 进行数据库的连接
  Connection.connect().then(function () {

    /**
     * domain 中间件，用于捕获错误
     */
    app.use(function (req, res, next) {

      var domain = require('domain').create();

      domain.on('error', function (err) {
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
          // 5s后关闭进程
          setTimeout(function () {
            console.error('Failsafe shutdown');
            process.exit(1);
          }, 5000);

          // 断开和 cluster 的链接，避免再分配请求过来
          var worker = require('cluster').worker;
          if (worker) worker.disconnect();

          // 关闭server的请求响应
          server.close();

          try {
            // 走express的正常错误处理流
            next(err);
          }
          catch (err) {
            console.error('Express error mechanism failed. \n', err.stack);
            res.statusCode = 500;
            res.setHeader('content-type', 'text/plain');
            res.end('Server error.');
          }
        }
        catch (e) {
          console.error('Unable to send 500 response.\n', e.stack);
        }
      });

      domain.add(req);
      domain.add(res);
      domain.run(next);
    });

    // 连接成功才require BBC
    var OAuth = require('./server/oauth');

    app.set('port', app.get('appConfig').port);
    //app.use(timeout(10000));
    // hook 服务
    app.use('/hooks', bodyParser.text({ type: '*/*' }));
    app.use( bodyParser({limit: '500mb'}));
    app.use(require('cookie-session')({keys: [app.get('appConfig').sessionKey]}));
    app.use(require('method-override')());


    // 出问题的时候用的服务不可用
    //app.use( /(^\/pages\/?)|(^\/$)|(^\/index\.html$)/, function( req, res ){
    //    res.send( 503 );
    //});

    // 先关跳转
    //app.use(Redirect());

    // BBC登陆
    app.use(OAuth({
      pattern: /^\/actions\/.*/,
      backURL: '/'
    }));

    // 静态资源代理
    app.use(require('serve-static')( __dirname + '/' + app.get('appConfig').staticPath ));
    // 针对 html5 history 后端配置所有 pages/ 下的请求都返回 index.html
    require( './server/html5location' )( app );

    // 为请求添加 CROS
    app.use(CROS());

    // 设置路由（API）
    routes(app);

    // 统一的错误处理
    app.use(require('./server/error'));

    // hook 服务
    app.use(require('./server/hooks'));

    // 开始监听
    server.listen(app.get('port'), function () {
      console.info('Ebbing seth is running on port ' + app.get('port'));
    });
  }).catch(function (err) {
    throw err;
  });
}

if (require.main == module) {
  startServer();
}
else {
  module.exports = startServer;
}


