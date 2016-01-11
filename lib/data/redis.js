var redis = require('redis');
var Promise = require( 'bluebird' );
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

var config = require( '../../config/config').redis;
var client = redis.createClient(config.port, config.hostname, {no_ready_check: true});

module.exports.connect = function(){
    return client.authAsync( config.password );
};

module.exports.client = client;