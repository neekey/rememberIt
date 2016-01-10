/**
 * web hook 服务
 * @type {exports}
 */

module.exports = function( req, res, next ){

    console.log( 'hooks', req.method, req.path );
    if( req.method == 'GET' && req.path == '/hooks' ){
        res.send( 200, 'hooks' );
    }
    else {
        next();
    }
};
