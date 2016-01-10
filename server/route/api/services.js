/**
 * 应用相关接口
 */

var proxy = require('../../../lib/data_proxy');
var JSONSchemaRef = require( '@ali/json-schema-ref' );
var JSONValidation = require( '@ali/json-schema-validation' );
var JSONToSchema = require( 'json-to-schema' );
var _ = require( 'lodash' );
var config = require( '../../../lib/config' );
var RequestMatch = require( '../../../lib/request_match' );
var Mocker = require( '../../../lib/mocker' );

var mids = require( '../middlewares' );

var MockRules = require('../../../lib/mock_rules');

module.exports = function (app) {

    /**
     * 数据模拟服务接口
     * @param user_id
     * @param auto 是否强制自动模拟数据
     */
    app.use('/api/v2/services/schema/mock/:schema_id/:user_id?', mids.handlePageInfo, function( req, res, next ){

        var schemaId = req.params.schema_id;
        var userId = req.params.user_id;
        var auto = req.query.auto;

        if( auto ){
            Mocker.mockBySchemaId( schemaId).then(function( data ){
                // JSON 方法接受的不能是字符串，因此需要处理下...
                if( 'string' == typeof data ){
                    try {
                        res.jsonp( 200, JSON.parse( data ) );
                    }
                    catch( e ){
                        res.send( 200, data );
                    }
                }
                else {
                    res.status(200).jsonp(data );
                }
            }).catch( next )
        }
        else {
            RequestMatch.matchQuery( schemaId, req.query, userId ).then( function( data ){

                // JSON 方法接受的不能是字符串，因此需要处理下...
                if( 'string' == typeof data ){
                    try {
                        res.status(200).jsonp( JSON.parse( data ) );
                    }
                    catch( e ){
                        res.send( 200, data );
                    }
                }
                else {
                    res.jsonp( 200, data );
                }
            }).catch( next );
        }
    });

    /**
     * 数据模拟服务接口
     * @param schema
     */
    app.post('/api/v2/services/schema/mock', mids.handlePageInfo, function( req, res, next ){
        try {
            var schema = req.body.schema;

            if( _.isString( schema ) ){
                schema = JSON.parse( decodeURIComponent( schema ) );
            }

            JSONSchemaRef( schema, {
                namespaceRemoteURL: function( standardName ){
                    return 'http://127.0.0.1:' + config.port + '/api/v2/schemas/' + encodeURIComponent( standardName ) + '/content';
                }
            },function( result ){
                Mocker.mock( result.schema ).then( res.send.bind( res )).catch( next );
            });
        }
        catch( e ){
            next( e );
        }
    });

    /**
     * 数据模拟服务接口
     * @param schema
     * @param data
     */
    app.post('/api/v2/services/schema/validation', mids.handlePageInfo, function( req, res, next ){
        var data = req.body.data;
        var schema = req.body.schema;

        try {
            if( _.isString( data ) ){
                data = JSON.parse( decodeURIComponent( data ) );
            }

            if(_.isString( schema ) ){
                schema = JSON.parse( decodeURIComponent( schema ) );
            }

            if( schema && schema.response ){
                schema = schema.response;
            }

            JSONSchemaRef( schema, function( r ){
                schema = r.schema;
                JSONValidation( data, schema, function( err, result ){
                    if( err ){
                        next( err );
                    }
                    else {
                        res.send( result );
                    }
                } );
            });
        }
        catch( e ){
            next( e );
        }
    });

    /**
     * 根据给定的schema_id 对 data进行校验
     * @param data
     */
    app.post('/api/v2/services/schema/validation/:schema_id', mids.handlePageInfo, function( req, res, next ){
        var data = req.body.data;

        try {
            if( _.isString( data ) ){
                data = JSON.parse( decodeURIComponent( data ) );
            }

            proxy.schema.getContent( req.params.schema_id).then(function( schema ){

                if(_.isString( schema ) ){
                    schema = JSON.parse( decodeURIComponent( schema ) );
                }

                if( schema && schema.response ){
                    schema = schema.response;
                }

                JSONSchemaRef( schema, function( r ){
                    schema = r.schema;
                    JSONValidation( data, schema, function( err, result ){
                        if( err ){
                            next( err );
                        }
                        else {
                            res.send( result );
                        }
                    } );
                });
            }).catch( next );
        }
        catch( e ){
            next( e );
        }
    });

    /**
     * schema解析服务
     * @param schema
     */
    app.post( '/api/v2/services/schema/parse', function( req, res, next ){
        // 考虑schema会很大以及接口的易用性，所以同时支持GET和POST
        try {
            var schema = req.body.schema;

            if( _.isString( schema ) ){
                schema = JSON.parse( decodeURIComponent( schema ) );
            }

            JSONSchemaRef( schema, {
                namespaceRemoteURL: function( standardName ){
                    return 'http://127.0.0.1:' + config.port + '/api/v2/schemas/' + encodeURIComponent( standardName ) + '/content';
                }
            },function( result ){
                res.send( result );
            });
        }
        catch( e ){
            next( e );
        }
    });

    /**
     * json-to-schema 转换服务
     * @param json JSON字符串
     */
    app.post( '/api/v2/services/schema/json_to_schema', function( req, res, next ){
        // 考虑schema会很大以及接口的易用性，所以同时支持GET和POST
        try {
            var json = req.body.json;

            if( _.isString( json ) ){
                json = JSON.parse( json );
            }

            res.send( JSONToSchema( json ) );
        }
        catch( e ){
            next( e );
        }
    });

    /**
     * 公有数据模拟服务 生成规则列表
     * @param {string} config encodeURIComponent后的JSON stringify对象。
     * 配置对象如：[{
     *   "pattern": "\/\/www.taobao.com/go/rgn/2014/dip-data1.php",
     *   "schemaId": "4327"
     * },{
     *   "filter": ["//www.taobao.com/go/rgn/2014/dip-data1.php", "//www.taobao.com/go/rgn/2014/dip-data2.php"],
     *   "appId": "2143"
     * }]
     */
    app.get('/api/v2/services/pub_mock/rules', function(req, res, next){

        var cfgStr = decodeURIComponent(req.query.config);
        try {
            var cfgArr = JSON.parse(cfgStr);
        }catch(e){
            return res.status(401).send('config不是有效的JSON字符串');
        }

        MockRules.getMockRules(cfgArr)
            .then(function(results){
                res.status(200).send(results);
            })
            .catch(next)

    });

    /**
     * 公有数据模拟服务 生成规则列表＋添加mockjs
     * @param {string} config encodeURIComponent后的JSON stringify对象。
     * 配置对象如：[{
     *   "pattern": "\/\/www.taobao.com/go/rgn/2014/dip-data1.php",
     *   "schemaId": "4327"
     * },{
     *   "filter": ["//www.taobao.com/go/rgn/2014/dip-data1.php", "//www.taobao.com/go/rgn/2014/dip-data2.php"],
     *   "appId": "2143"
     * }]
     */
    app.get('/api/v2/services/pub_mock/mocker.js', function(req, res, next){

        var cfgStr = decodeURIComponent(req.query.config);

        try {
          var cfgArr = JSON.parse(cfgStr);
        }catch(e){
          return res.status(401).send('config不是有效的JSON字符串');
        }

        var env =  '//g.alicdn.com';
        if(config.env == "development" || config.env == "local" || config.env == "test")
            env = '//g-assets.daily.taobao.net';

        //dip-mocker文件的时间戳
        var version = decodeURIComponent(req.query.v);

        if(!version) {
            res.status(401).send("需要传入参数v，请到http://gitlab.alibaba-inc.com/tb/dip/tree/master/dip-interceptor查看详细文档");
        }else {

            MockRules.getMockRules(cfgArr)
              .then(function (results) {

                  var ret = [
                      'document.write(\'',
                      '<script>',
                      'window._dip_rules=',
                      JSON.stringify(results),
                      '</script>',
                      '<script src="' + env + '/tb/dip/' + version + '/dip-mocker-min.js"></script>',
                      '\');'
                  ].join('');

                  res.set('Content-Type', 'application/javascript');

                  res.status(200).send(ret)
              })
              .catch(next)
        }

    });





    ///**
    // * 新旧版本切换的迁移接口
    // */
    //var Path = require( 'path' );
    //var migratePath = Path.resolve( __dirname, '../../../migrate' );
    //var migrateProcess = null;
    //
    //app.get( '/migrate/logs', function( req, res ){
    //    res.sendFile( Path.resolve( migratePath, './migrate.log' ) );
    //});
    //
    //app.get( '/migrate', function( req, res ){
    //
    //    var Migrate = require( '../../../migrate/index' );
    //
    //    res.write( 'begin!' );
    //    Migrate(res.end.bind( res ) );
    //
    //    //var childProcess = require( 'child_process' );
    //    //
    //    //
    //    //if( !migrateProcess ){
    //    //
    //    //    res.write( '【开始执行迁移】...这可能耗时10几分钟\n\r');
    //    //
    //    //    migrateProcess = childProcess.spawn( 'node', [ 'index.js'], { cwd: migratePath} );
    //    //
    //    //    migrateProcess.on( 'error', function( data ){
    //    //        res.write( data.toString() );
    //    //
    //    //        try {
    //    //            migrateProcess.kill();
    //    //        }
    //    //        catch( e ){}
    //    //    });
    //    //
    //    //    migrateProcess.on( 'exit', function( data ){
    //    //        migrateProcess = null;
    //    //    });
    //    //
    //    //    migrateProcess.on( 'close', function( data ){
    //    //        migrateProcess = null;
    //    //    });
    //    //
    //    //    migrateProcess.on( 'disconnect', function( data ){
    //    //        migrateProcess = null;
    //    //    });
    //    //}
    //    //else {
    //    //    res.write( '【当前已经有迁移进程在执行中】...请等待其执行完毕再重新开始\n\r');
    //    //}
    //    //
    //    ////FS.writeFileSync( Path.resolve( migratePath, './index.log' ), '11' );
    //    //
    //    ////FS.createReadStream( Path.resolve( migratePath, './index.log' )).pipe( res );
    //    //migrateProcess.stdout.pipe( res );
    //    //migrateProcess.stderr.pipe( res );
    //});
};