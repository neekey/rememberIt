/**
 * FED 相关接口，目前主要用于统一页头页脚的代理
 *
 * 由于前台页面使用angular，最方便的做法就是用ng-include 标签来引入html片段，但是存在跨域问题，因此这边做个代理
 */
var _ = require('lodash');
var Request = require( 'request' );

var FED = {
    header: 'http://www.taobao.com/go/rgn/fec/header.html',
    footer: 'http://common.fed.alibaba-inc.com/footer.html',
    assets: 'http://www.taobao.com/go/rgn/fec/assets-v.html'
};

module.exports = function (app) {

    _.each( FED, function( value, key ){

        app.get('/fed/' + key + '.html', function (req, res) {

            Request( value, function( error, response, body ){
                if( !error && response.statusCode == 200 ){
                    res.send( body );
                }
                else {
                    res.send( 400, error || response );
                }
            });
        });
    });
};