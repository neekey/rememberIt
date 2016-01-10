var proxy = require('../../lib/data_proxy');
var userProxy = proxy.user;
var appProxy = proxy.app;
var schemaProxy = proxy.schema;
var mockSchemaProxy = proxy.mockSchema;
var error = require( '../../lib/error');
var Session = require( '../session' );
var BBC = require( '../bbc' )();
var _ = require( 'lodash' );

module.exports = {

    /**
     * 统一将参数中的 page 和 size 转化为 offset
     * @param req
     * @param res
     * @param next
     */
    handlePageInfo: function( req, res, next ){

        var limit = req.query.size || 50;
        var page = req.query.page || 1;

        var offset = ( page - 1 ) * limit;

        req.pageInfo = {
            limit: limit,
            offset: offset
        };

        next();
    },

    /**
     * 将result { rows, count } 类型数据储存到 req 对象上，方便下一个中间件处理
     * 注意这个方法在调用的时候为了方便，建议bind到req身上
     * @param req
     * @param next
     */
    saveListAndCountResponse: function( req, next ){

        return function( data ){
            if(_.isObject( data ) && _.isArray( data.rows ) && _.isNumber( data.count ) ){
                req._responseData = data;
                next();
            }
            else {
                throw new Error( 'saveListAndCountResponse(): ' + '只接受 { rows, count } 结构的data' )
            }
        };
    },

    handleListAndCountResponse: function( req, res ){
        var data = req._responseData;

        if(_.isObject( data ) && _.isArray( data.rows ) && _.isNumber( data.count ) ){
            res.setHeader( 'X-Total-Count', data.count );
            res.send( data.rows );
        }
        else {
            throw new Error( 'handleListAndCountResponse(): ' + '只接受从上一个中间件中获取 { rows, count } 结构的data' )
        }
    },

    /**
     * 检查当前用户对指定用户是否具有权限
     * @param req
     * @param res
     * @param next
     */
    checkUserAuth: function( req, res, next ){

        var userInfo = req.userInfo;
        var targetUserId = req.params.user_id;

        userProxy.checkUserAuth( userInfo.id, targetUserId ).then(function( authed ){
            if( authed ){
                next();
            }
            else {
                next( new error.api.PERMISSION_DENIED( '您不具有该用户的权限' ) );
            }
        }).catch( next );
    },

    /**
     * 检查当前的登录用户对 指定的公共用户是否具有权限
     * @param req
     * @param res
     * @param next
     */
    checkPublicUserAuth: function( req, res, next ){

        var userInfo = req.userInfo;
        var targetUserId = req.params.public_user_id;

        userProxy.checkUserAuth( userInfo.id, targetUserId ).then(function( authed ){
            if( authed ){
                next();
            }
            else {
                next( new error.api.PERMISSION_DENIED( '您不具有该用户的权限' ) );
            }
        }).catch( next );
    },

    /**
     * 检查当前用户对 mock schema 是否具有权限
     * @param req
     * @param res
     * @param next
     */
    checkMockSchemaAuth: function( req, res, next ){
        var userInfo = req.userInfo;

        mockSchemaProxy.findOneStrict( req.params.mock_schema_id ).then(function( mockSchema ){

            if( mockSchema.user_id != userInfo.id ){
                next( new error.api.PERMISSION_DENIED( '您不具有该 mock schema 的权限' ) );
            }
            else {
                next();
            }
        }).catch( next );
    },

    /**
     * 检查 当前用户对 app 是否有权限的中间件，注意此处的appid获取依赖于 路由设置为 :app_id
     * @param req
     * @param res
     * @param next
     */
    checkAppAuth: function ( req, res, next ){

        var userInfo = req.userInfo;
        var appId = req.params.app_id;
        appProxy.checkAppAuth( userInfo.id, appId ).then(function( authed ){
            if( authed ){
                next();
            }
            else {
                next( new error.api.PERMISSION_DENIED( '您不具有该应用的权限' ) );
            }
        }).catch( next );
    },

    /**
     * 检查 当前用户对 schema 是否有权限的中间件，注意此处的 schema id 获取依赖于 路由设置为 :schema_id
     * @param req
     * @param res
     * @param next
     */
    checkSchemaAuth: function ( req, res, next ){

        var userInfo = req.userInfo;
        var schemaId = req.params.schema_id;
        schemaProxy.checkSchemaAuth( userInfo.id, schemaId ).then(function( authed ){
            if( authed ){
                next();
            }
            else {
                next( new error.api.PERMISSION_DENIED( '您不具有该schema的权限' ) );
            }
        }).catch( next );
    },

    /**
     * 检查用户身份信息
     * @param req
     * @param res
     * @param next
     */
    checkAuth: function (req, res, next) {

        var token = null;

        // 看用户是否登录
        if (req.session.userInfo) {
            req.userInfo = req.session.userInfo;
            next();
        }

        // 用户 dip-token 进行用户认证
        else if (req.get('x-dip-token')) {

            token = req.get('x-dip-token');

            // 根据token获取用户信息
            userProxy.findByToken(token, req.get('referer')).then(function (user) {

                req.userInfo = user;
                next();

            }).catch(next);
        }

        // 使用 buc 的token 进行用户认证
        else if (req.get('x-dip-buc-token')) {

            token = req.get('x-dip-buc-token');

            BBC.getUserInfoByToken(token, function (err, userInfo) {

                if (err) {
                    next(err);
                }
                else {
                    /**
                     * 检查数据库中是否已经有该用户，若没有则添加信息
                     */
                    userProxy.findByWorkId(userInfo.workid).then(function (user) {

                        if (user) {
                            req.userInfo = user;
                            next();

                        } else {

                            return userProxy.add(userInfo).then(function (user) {
                                req.userInfo = user;
                                next();
                            });
                        }
                    }).catch(next);
                }
            });
        }
        else {
            next(new error.api.PERMISSION_DENIED('请先登录'));
        }
    }
};