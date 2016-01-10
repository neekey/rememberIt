/**
 * 预置的错误类型
 */

var _ = require( 'lodash' );
var Util = require( 'util' );
var errorConfig = require( '../config/error' );

var ERRORS = {};

function ErrorExtend( name, type, infoFn ){
    var initializer = function( message ){
        Error.call(this); //super constructor
        Error.captureStackTrace(this, this.constructor);
        this.name = name;
        this.message = message;
        this.type = type;
        typeof infoFn == 'function' && infoFn.call( this, message );
    };

    Util.inherits( initializer, Error );
    return initializer;
}

_.each( errorConfig, function( errors, errorType ){
    var list = ERRORS[ errorType ] = {};
    _.each( errors, function( errorName ){
        list[ errorName ] = ErrorExtend( errorName, errorType );
    });
});

module.exports = ERRORS;

