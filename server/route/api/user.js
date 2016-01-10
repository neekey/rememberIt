/**
 * 应用相关接口
 */

var proxy = require('../../../lib/data_proxy');
var _ = require( 'lodash' );
var schemaProxy = proxy.schema;
var userProxy = proxy.user;
var appProxy = proxy.app;
var error = proxy.error;
var BBC = require( '../../bbc' );
var BBCInstance = BBC();

var mids = require( '../middlewares' );

module.exports = function (app) {

    // 所有的 user_id 都可以是 id 或者 名字

    /**
     * 通过BBC搜索用户
     * @param keyword
     */
    app.get( '/api/v2/bbc_users', function( req, res, next ){
        var keyword = req.query.keyword;

        // 字母开头然后接数字的，认为是外包
        if( /[a-zA-Z]+\d+/.test( keyword ) ){
            BBCInstance.getUserInfosByIds( keyword,function( err, userlist){
                if( err ) {
                    next( err );
                }
                else {
                    res.send(userlist);
                }
            });
        }
        else {
            BBCInstance.getUserInfosByKeyword( keyword,function(err,userlist){
                if( err ) {
                    next( err );
                }
                else {
                    res.send(userlist);
                }
            });
        }
    });

    /**
     * 获取DIP中的用户列表
     * @param page
     * @param size
     */
    app.get('/api/v2/users', mids.handlePageInfo, function( req, res, next ){
        userProxy.find( req.pageInfo ).then( mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 获取DIP中的某个用户信息
     */
    app.get('/api/v2/users/:user_id', function( req, res, next ){
        userProxy.findOneStrict( req.params.user_id ).then( res.send.bind( res )).catch( next );
    });

    /**
     * 向DIP中添加一名用户
     * @param workId
     */
    app.post('/api/v2/users', mids.checkAuth, function( req, res, next ){
        if( process.env.NODE_ENV == 'test' ){
            userProxy.add( { workid: req.body.workid } ).then( res.send.bind( res ) ).catch(next);
        }
        else {
            res.send( 403, '该功能暂未开放' );
        }
    });

    /**
     * 检查对某个用户是否具有操作权限（主要针对公共账户）
     */
    app.get('/api/v2/users/:user_id/auth', mids.checkAuth, function( req, res, next ){

        userProxy.checkUserAuth( req.userInfo.id, req.params.user_id ).then(function( authed ){
            res.send({
                result: authed
            });
        }).catch( next );
    });

    /**
     * 检查某个用户在DIP中是否存在
     */
    app.get('/api/v2/users/:user_id/exist', function( req, res, next ){

        userProxy.findOne( req.params.user_id ).then(function( user ){
            res.send({
                result: !!user
            });
        }).catch( next );
    });

    /**
     * 修改用户信息 （目前来看无法做任何修改）
     */
    app.put('/api/v2/users/:user_id', mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        res.send( '该功能暂未开放' );
    });

    /**
     * 获取用户的token列表（前提是对该用户具有权限）
     * @param page
     * @param size
     */
    app.get('/api/v2/users/:user_id/tokens', mids.checkAuth, mids.checkUserAuth, mids.handlePageInfo, function( req, res, next ){
        userProxy.getTokens( req.params.user_id, req.pageInfo ).then( mids.saveListAndCountResponse( req, next ) ).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 为用户添加一个token
     * @param origin 用于限制 token 的来源
     */
    app.post('/api/v2/users/:user_id/tokens', mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        userProxy.addToken( req.params.user_id, req.body.origin ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除用户的token
     */
    app.delete('/api/v2/users/:user_id/tokens/:token_id', mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        userProxy.removeToken( req.params.user_id, req.params.token_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取某个用户创建的公共账户列表
     */
    app.get('/api/v2/users/:user_id/public_users', mids.handlePageInfo, function( req, res, next ){
        userProxy.getPublicUsers( req.params.user_id, req.pageInfo ).then( mids.saveListAndCountResponse( req, next ) ).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 添加一个公共账户（限制是这个user 不能是个公共账户）
     * @param name
     */
    app.post('/api/v2/users/:user_id/public_users', mids.checkAuth, mids.checkUserAuth, function( req, res, next ){
        userProxy.addPublicUser( req.params.user_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除一个公共账户
     */
    app.delete('/api/v2/users/:user_id/public_users/:public_user_id', mids.checkAuth, mids.checkUserAuth, mids.checkPublicUserAuth, function( req, res, next ){
        userProxy.remove( req.params.public_user_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 对公共账户进行转移
     */
    app.post('/api/v2/users/:user_id/public_users/:public_user_id/transfer/:another_user_id', mids.checkAuth, mids.checkUserAuth, mids.checkPublicUserAuth, function( req, res, next ){

        // 若为工号进行转移
        if( req.params.another_user_id && req.params.another_user_id.indexOf( 'gh-' ) == 0 ){
            // 先检查改用户是否存在
            userProxy.findOne( req.params.another_user_id).then(function( user ){
                if( user ){
                    return userProxy.transferPublicUser( req.params.public_user_id, req.params.another_user_id ).then( res.send.bind( res )).catch( next );
                }
                // 否则添加用户
                else {
                    BBC.addUserByWorkId( req.params.another_user_id.substring(3), function( err ){
                        if( err ){
                            throw err;
                        }
                        else {
                            return userProxy.transferPublicUser( req.params.public_user_id, req.params.another_user_id ).then( res.send.bind( res )).catch( next );
                        }
                    });
                }
            }).catch(next);
        }
        else {
            userProxy.transferPublicUser( req.params.public_user_id, req.params.another_user_id ).then( res.send.bind( res )).catch( next );
        }
    });

    /**
     * 获取当前用户具有权限的所有schema
     * @param page
     * @param size
     */
    app.get('/api/v2/users/:user_id/schemas', mids.handlePageInfo, function( req, res, next ){
        schemaProxy.findByOwner( req.params.user_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 获取当前用户具有权限的所有应用
     * @param page
     * @param size
     */
    app.get('/api/v2/users/:user_id/apps', mids.handlePageInfo, function( req, res, next ){
        appProxy.findByUser( req.params.user_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );
};