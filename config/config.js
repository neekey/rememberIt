/**
 * local	    base + development + local
 * develepment	base + development
 * prepub	    base + production + prepub
 * production	base + production
 */
var _ = require( 'lodash' );
var configs = {
    base: _.cloneDeep( require( './base.json' ) ),
    test: _.cloneDeep( require( './test.json' ) ),
    local: _.cloneDeep( require( './local.json' ) ),
    development: _.cloneDeep( require( './development.json' ) ),
    prepub: _.cloneDeep( require( './prepub.json' ) ),
    production: _.cloneDeep( require( './production.json' ) )
};

var ENV = process.env;
var currentDev = ENV.NODE_ENV || 'local';
var config = null;

switch( currentDev ){

    case 'test':
        config = _.merge( _.merge( _.merge( configs.base, configs.development ), configs.local ), configs.test );
        break;
    case 'local':
        config = _.merge( _.merge( configs.base, configs.development ), configs.local );
        break;
    case 'development':
        config = _.merge( configs.base, configs.development );
        break;
    case 'prepub':
        config = _.merge( _.merge( configs.base, configs.production ), configs.prepub );
        break;
    case 'production':
        config = _.merge( configs.base, configs.production );
        break;
    default:
        config = _.merge( _.merge( configs.base, configs.development ), configs.development );
        break;
}

//设置当前开发环境
config.env = currentDev;

// 检查是否为DEBUG模式
config.debug = process.argv.indexOf( '--debug' ) >= 0;

// 静态资源路径配置
if( config.debug ){
    config.staticPath = config.staticDebugPath || config.staticPath;
}

// check if DB config is specified by Environment Vars
if( ENV.DB_username ){
    config.db.username = ENV.DB_username;
    config.db.password = ENV.DB_password;
    config.db.database = ENV.DB_database;
    config.db.host = ENV.DB_host;
    config.db.port = ENV.DB_port;
}

// check if DB config is specified by Environment Vars
if( ENV.TODOIST_client_id ){
    config.todoist.clientId = ENV.TODOIST_client_id;
    config.todoist.clientSecret = ENV.TODOIST_client_secret;
}

if( ENV.port ){
    config.port = ENV.port;
}


module.exports = config;

