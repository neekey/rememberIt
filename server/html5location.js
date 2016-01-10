/**
 * 配置 前端的 html5 路由問題，所有 pages 路徑的都是前端路徑，直接返回 index.html 文件
 */
var path = require( 'path' );
module.exports = function( app ){

    app.all( '/pages*', function( req, res ){
        var staticBasePath = path.resolve( app.get( 'appBasePath' ), app.get( 'appConfig').staticPath );
        res.sendFile( path.resolve( staticBasePath, 'index.html' ) );
    });
};