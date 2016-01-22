/**
 * 应用相关接口
 */

var Session = require( '../../session' );

module.exports = function (app) {

    app.get('/actions/logout', function( req, res ){
        Session.logout( req, res );
        res.redirect( '/' );
    });
};