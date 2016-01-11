/**
 * web hook 服务
 * @type {exports}
 */

module.exports = function( req, res, next ){

    if( ( req.method == 'GET' || req.method == 'POST' ) && req.path == '/hooks' ){
        console.log( 'hooks', req.method, req.path, req.body );
        res.send( 200, 'hooks' );
    }
    else {
        next();
    }
};
