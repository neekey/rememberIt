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
};