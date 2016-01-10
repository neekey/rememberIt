/**
 * 应用相关接口
 */

var proxy = require('../../../lib/data_proxy');
var _ = require( 'lodash' );
var userProxy = proxy.user;
var mockSchemaProxy = proxy.mockSchema;
var error = proxy.error;

var mids = require( '../middlewares' );

module.exports = function (app) {

    /**
     * 获取用户 mock 的 schema 列表
     * @param page
     * @param size
     */
    app.get('/api/v2/users/:user_id/mock_schemas', mids.handlePageInfo, function( req, res, next ){
        mockSchemaProxy.find( req.params.user_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 添加一条对schema 的 mock
     * @param schema_id
     */
    app.post('/api/v2/users/:user_id/mock_schemas', mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.add( req.params.user_id, req.body.schema_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取某条对schema 的 mock
     */
    app.get('/api/v2/users/:user_id/mock_schemas/:schema_id', function( req, res, next ){
        mockSchemaProxy.findOneStrict( req.params.user_id, req.params.schema_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 修改 schema 的 mock
     * @param {Boolean} active
     */
    app.put('/api/v2/users/:user_id/mock_schemas/:schema_id',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.setActive( req.params.user_id, req.params.schema_id, req.body.active ).then( res.send.bind( res )).catch( next );
    });

    /**
     * 删除 schema 的 mock
     */
    app.delete('/api/v2/users/:user_id/mock_schemas/:schema_id',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.remove( req.params.user_id, req.params.schema_id ).then(function(){
            res.send(200);
        }).catch( next );
    });

    /**
     * 获取 schema 的 mock 中包含的 所有 rules
     */
    app.get('/api/v2/users/:user_id/mock_schemas/:schema_id/rules', mids.handlePageInfo, function( req, res, next ){
        mockSchemaProxy.getRules( req.params.user_id, req.params.schema_id ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 添加一条 schema 的 mock 中包含的 rules
     * @param {String} rule
     */
    app.post('/api/v2/users/:user_id/mock_schemas/:schema_id/rules',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.addRule( req.params.user_id, req.params.schema_id, req.body.rule ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除 schema 的 mock 中的 规则
     */
    app.delete('/api/v2/users/:user_id/mock_schemas/:schema_id/rules/:rule_id',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.removeRule( req.params.user_id, req.params.schema_id, req.params.rule_id ).then( res.send.bind( res ) ).catch( next );
    } );

    /**
     * 修改 schema 的 mock 中的 规则
     * @param rule
     */
    app.put('/api/v2/users/:user_id/mock_schemas/:schema_id/rules/:rule_id',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.updateRule( req.params.user_id, req.params.schema_id, req.params.rule_id, req.body.rule ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获得 schema 的mock 中的某条 规则
     */
    app.get('/api/v2/users/:user_id/mock_schemas/:schema_id/rules/:rule_id', function( req, res, next ){
        mockSchemaProxy.getRule( req.params.user_id, req.params.schema_id, req.params.rule_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取 schema 的 mock 中的 模拟数据列表
     */
    app.get('/api/v2/users/:user_id/mock_schemas/:schema_id/mocks', mids.handlePageInfo, function( req, res, next ){
        mockSchemaProxy.getMocks( req.params.user_id, req.params.schema_id ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 添加一条 schema 的 mock 中的 模拟数据
     * @param {Boolean} active 默认true
     * @param query
     * @param data
     */
    app.post('/api/v2/users/:user_id/mock_schemas/:schema_id/mocks',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.addMock( req.params.user_id, req.params.schema_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除 schema 的 mock 中的 模拟数据
     */
    app.delete('/api/v2/users/:user_id/mock_schemas/:schema_id/mocks/:mock_id',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.removeMock( req.params.user_id, req.params.schema_id, req.params.mock_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 修改 schema 的 mock 中的 模拟数据
     * @param {Boolean} active 默认true
     * @param query
     * @param data
     */
    app.put('/api/v2/users/:user_id/mock_schemas/:schema_id/mocks/:mock_id',
        mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        mockSchemaProxy.updateMock( req.params.user_id, req.params.schema_id, req.params.mock_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取 schema 的 mock 中的 某条模拟数据
     */
    app.get('/api/v2/users/:user_id/mock_schemas/:schema_id/mocks/:mock_id', function( req, res, next ){
        mockSchemaProxy.getMock( req.params.user_id, req.params.schema_id, req.params.mock_id ).then( res.send.bind( res ) ).catch( next );
    });
};