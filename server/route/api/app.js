/**
 * 应用相关接口
 */

var proxy = require('../../../lib/data_proxy');
var schemaProxy = proxy.schema;
var appProxy = proxy.app;
var userProxy = proxy.user;
var error = proxy.error;
var BBC = require( '../../bbc' );
var ACL = require( '../../../lib/acl' );
var _ = require( 'lodash' );

var mids = require( '../middlewares' );

module.exports = function (app) {

    /**
     * 获取应用列表
     * @param page
     * @param size
     * @param type
     * @param keyword
     */
    app.get('/api/v2/apps', mids.handlePageInfo, function( req, res, next ){

        var options = _.merge( req.pageInfo, _.pick( req.query, [ 'type', 'keyword' ] ) );
        if( req.query.user_id ){
            appProxy.findByUser( req.query.user_id, options ).then( mids.saveListAndCountResponse( req, next ) ).catch( next );
        }
        else {
            appProxy.find( options ).then( mids.saveListAndCountResponse( req, next ) ).catch( next );
        }
    }, mids.handleListAndCountResponse );

    /**
     * 添加应用
     * @param name
     * @param type
     * @param description
     * @param [repo_url] 根据type 来决定是否需要这个字段
     * @param [standard_app_id] 应用可以绑定标准数据应用
     */
    app.post('/api/v2/apps', mids.checkAuth, function( req, res, next ){

        // 先检查是否要创建标准数据应用，如果是，则检查权限
        if( req.body.type == 'standard_data' ){
            ACL.checkUserPermission( req.userInfo.bucId, 'STANDARD_DATA_APP_CREATION' ).then(function( permited ){
                if( permited ){
                    next();
                }
                else {
                    next( new error.permission.PERMISSION_DENIED( '您不具有创建标准数据应用的权限' ) );
                }
            }).catch( next );
        }
        else {
            next();
        }

    }, function( req, res, next ){
        appProxy.add( req.userInfo.id, req.body, req.body.standard_app_id ).then( res.send.bind(res) ).catch( next );
    });

    /**
     * 获取某个应用信息
     */
    app.get('/api/v2/apps/:app_id', function( req, res, next ){

        appProxy.findOneStrict( req.params.app_id ).then( res.send.bind(res) ).catch( next );
    });

    /**
     * 检查对某个应用是否具有权限
     */
    app.get('/api/v2/apps/:app_id/auth', mids.checkAuth, function( req, res, next ){

        appProxy.checkAppAuth( req.userInfo.id, req.params.app_id ).then(function( authed ){
            res.send( {
                result: authed
            });
        }).catch( next );
    });

    /**
     * 检查某个应用是否存在
     */
    app.get('/api/v2/apps/:app_id/exist', function( req, res, next ){

        appProxy.findOne( req.params.app_id ).then(function( app ){
            res.send( { result: !!app } );
        }).catch( next );
    });

    /**
     * 修改某个应用
     * @param description
     * @param [repo_url]
     */
    app.put('/api/v2/apps/:app_id', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){

        appProxy.update( req.params.app_id, req.body ).then( res.send.bind(res) ).catch( next );
    });

    /**
     * 删除某个应用
     */
    app.delete('/api/v2/apps/:app_id', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){

        appProxy.remove( req.params.app_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取应用的可用钩子类型列表
     */
    app.get('/api/v2/app_hooks', function( req, res ){
        res.send(_.map( proxy.model.app_hook.available_types, function( type ){
            return type;
        }));
    });

    /**
     * 获取某个应用的钩子们
     * @param page
     * @param size
     */
    app.get('/api/v2/apps/:app_id/hooks', mids.checkAuth, mids.checkAppAuth, mids.handlePageInfo, function( req, res, next ){
        appProxy.getHooks( req.params.app_id, req.pageInfo ).then( mids.saveListAndCountResponse( req, next ) ).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 为某个应用添加钩子
     * @param type
     * @param url
     */
    app.post('/api/v2/apps/:app_id/hooks', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){

        appProxy.addHook( req.params.app_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除应用的钩子
     */
    app.delete('/api/v2/apps/:app_id/hooks/:hook_id', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){

        appProxy.removeHook( req.params.app_id, req.params.hook_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取应用的owner们
     * @param page
     * @param size
     */
    app.get('/api/v2/apps/:app_id/owners', mids.handlePageInfo, function( req, res, next ){

        appProxy.getOwners( req.params.app_id, req.pageInfo ).then( mids.saveListAndCountResponse( req, next ) ).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 为应用添加owner，用 work id 或者 user id 都可以
     * @param work_id
     * @param user_id
     */
    app.post('/api/v2/apps/:app_id/owners', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){

        // 使用工号添加
        if( req.body.work_id ){

            var workId = req.body.work_id;

            // 先检查该 工号 用户是否已经存在
            userProxy.findByWorkId( workId ).then(function( user ){

                // 若不存在，从 bbc 获取用户信息并添加到DIP
                if( !user ){
                    BBC.addUserByWorkId( workId, function( err, user ){
                        if( err ){
                            next( err );
                        }
                        else {
                            appProxy.addOwner( req.params.app_id, user.id ).then( res.send.bind( res ) ).catch( next );
                        }
                    });
                }else{
                    appProxy.addOwner( req.params.app_id, user.id ).then( res.send.bind( res ) ).catch( next );
                }
            }).catch( next );
        }

        // 使用 user id 添加
        else {
            appProxy.addOwner( req.params.app_id, req.body.user_id ).then( res.send.bind( res ) ).catch( next );
        }
    });

    /**
     * 删除应用的owner
     */
    app.delete('/api/v2/apps/:app_id/owners/:owner_id', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){
        appProxy.removeOwner( req.params.app_id, req.params.owner_id ).then( res.send.bind( res ) ).catch( next )
    });

    /**
     * 获取应用下的schema列表
     * @param page
     * @param size
     */
    app.get('/api/v2/apps/:app_id/schemas', mids.handlePageInfo, function( req, res, next ){

        schemaProxy.findByOwner( req.params.app_id, req.pageInfo )
            .then( mids.saveListAndCountResponse( req, next ) ).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 为应用绑定一个标准应用
     * @param standard_app_id
     */
    app.put( '/api/v2/apps/:app_id/standard_app', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){
        if( req.body.standard_app_id ){
            appProxy.bindStandardApp( req.params.app_id, req.body.standard_app_id ).then( res.send.bind( res )).catch( next );
        }
        else {
            appProxy.unbindStandardApp( req.params.app_id).then( res.send.bind( res )).catch( next );
        }
    });

    /**
     * 获取应用 设置
     */
    app.get( '/api/v2/apps/:app_id/settings', function( req, res, next ){
        appProxy.getSettings( req.params.app_id).then( res.send.bind( res )).catch( next );
    });

    /**
     * 设置应用的 settings
     * @param {String} settings json字符串
     * @param {String} key json字符串
     * @param {String} value json字符串
     */
    app.put( '/api/v2/apps/:app_id/settings', mids.checkAuth, mids.checkAppAuth, function( req, res, next ){
        appProxy.setSettings( req.params.app_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });
};