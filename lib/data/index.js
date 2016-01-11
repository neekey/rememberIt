var redis = require( './redis' );
var Promise = require( 'bluebird' );

module.exports = {
    model: require( './models/index' ),
    connect: function(){
        return Promise.all([
            this.model.sequelize.sync(),
            redis.connect()
        ]);
    },
    disconnect: function(){
        return Promise.all([
            this.model.sequelize.close(),
            redis.client.quit()
        ]);
    },
    redis: redis.client,
    user: require( './user' ),
    task: require( './task' )
};