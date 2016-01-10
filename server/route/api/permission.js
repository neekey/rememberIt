/**
 * 用户 ACL 权限相关接口
 */

var proxy = require('../../../lib/data_proxy');
var _ = require( 'lodash' );
var userProxy = proxy.user;
var ACL = require( '../../../lib/acl' );
var mids = require( '../middlewares' );

module.exports = function( app ){
    /**
     * 检查用户是否具有某个权限
     * @param permission_name STANDARD_DATA_APP_CREATION
     */
    app.get('/api/v2/permissions/:permission_name', mids.checkAuth, function( req, res, next ){

        // 若当前用户已经登录，且查询的就是登录用户本身时，直接从session中获取bucId
        return ACL.checkUserPermission( req.userInfo.bucId, req.params.permission_name).then(function( has ){
            res.send({ result: has } );
        }).catch( next );
    });
}