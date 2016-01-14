/**
 * web hook 服务
 * @type {exports}
 */

var crypto = require('crypto');
var config = require( '../config/config' );

module.exports = function( req, res, next ){

    if( ( req.method == 'GET' ) && req.path == '/hooks' ){
        console.log( 'hooks', req.path, req.body, req.get( 'X-Todoist-Hmac-SHA256' ));
        if( verifyTodoist( req ) ){
            res.send( 200, 'ok' );
        }
        else {
            console.log( 'todoist verify wrong' );
            next();
        }
    }
    else {
        next();
    }
};

function verifyTodoist( req ){

    if( req.get( 'User-Agent' ) == 'Todoist-Webhooks' && req.get( 'X-Todoist-Hmac-SHA256' ) ){
        var hmac = crypto.createHmac('sha256', config.todoist.clientSecret );
        hmac.update( req.body );
        var digest = hmac.digest();
        return req.get('X-Todoist-Hmac-SHA256') == digest;
    }
    else {
        return false;
    }
}
