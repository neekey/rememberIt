/**
 * hsfops 代理相关接口
 */
var proxy = require('../../../lib/data_proxy');
var hsfopsProxy = proxy.hsfops;
var _ = require('lodash');

var mids = require('../middlewares');

module.exports = function(app) {

  /**
   * 获取服务列表
   * @param page
   * @param size
   * @param type
   * @param keyword
   */
  app.get('/api/v2/hsfops/services', mids.handlePageInfo, function(req, res, next) {

    var options = _.merge(req.pageInfo, _.pick(req.query, ['type', 'keyword']));

    hsfopsProxy.getServices(options)
      .then(mids.saveListAndCountResponse(req, next))
      .catch(next);

  }, mids.handleListAndCountResponse);

  /**
   * 获取方法列表
   * @param service_name
   * @param keyword
   */
  app.get('/api/v2/hsfops/:service_name/methods', function(req, res, next) {

    var options = _.merge(_.pick(req.params, ['service_name']), _.pick(req.query, ['keyword']));

    hsfopsProxy.getMethods(options).then(function(data) {

      res.status(200).send(JSON.stringify(data));

    }).catch(next);

  });

  /**
   * 同步服务和方法
   * @param service_name
   * @param method_name
   */
  app.get('/api/v2/hsfops/sync/:service_name', mids.checkAuth, function(req, res, next) {

    var options = _.merge(req, _.pick(req.params, ['service_name']), _.pick(req.query, ['method_name']));

    hsfopsProxy.sync(options).then(function(data) {

      res.status(200).send(JSON.stringify(data));

    }).catch(next);

  });

};