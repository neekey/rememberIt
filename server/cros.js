/**
 * 跨域请求中间件
 */
module.exports = function(){

    return function( req, res, next ){

        res.header( 'Access-Control-Allow-Origin', '*' );
        res.header( 'Access-Control-Allow-Methods', '*' );
        res.header( 'Access-Control-Allow-Headers', 'Origin, No-Cache, X-Requested-With, If-Modified-Since, Pragma, Last-Modified, Cache-Control, Expires, Content-Type, X-E4M-With' );

        next();
    }
};