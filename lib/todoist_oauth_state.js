var client = require('./data/').redis;
var EXPIRE_TIME = 120;

module.exports = {

    getKey: function( state ){
        return 'todoist:oauth:state:' + state;
    },

    saveState: function( state, backUrl ){
        var key = this.getKey( state );
        return client.setAsync( key, backUrl).then(function(){
            return client.expireAsync( key, EXPIRE_TIME );
        });
    },

    getState: function( state ){
        var key = this.getKey( state );
        return client.getAsync( key );
    },

    removeState: function( state ){
        var key = this.getKey( state );
        return client.delAsync( key );
    }
};