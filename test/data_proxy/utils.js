require( './factory' );

var chai = require( 'chai' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
var DataProxy = require( '../../lib/data/index' );
var UserProxy = DataProxy.user;
var TaskProxy = DataProxy.task;

Promise.longStackTraces();
// 全局的 错误 捕获放在这里
process.on( 'unhandledRejection', function( reason, promise ) {
    console.log( 'unhandledRejection', reason.stack );
    throw reason;
});

process.on( 'rejectionhandled', function( reason, promise ){
    console.log( 'rejectionhandled', reason );
    throw reason;
});

module.exports = {

    createUser: function(){
        var expectUser = chai.factory.create('user');
        return UserProxy.add( expectUser );
    },

    clearUsers: function(){
        return UserProxy.removeUsers();
    },

    createTask: function( userId ){
        var expectTask = chai.factory.create( 'task' );
        return TaskProxy.add( userId, expectTask );
    },

    batchCreateUsers: function( userCount ){

        var newUsers = [];
        var self = this;
        _.times( userCount, function(){
            newUsers.push( self.createUser() );
        });

        return Promise.all( newUsers );
    },

    batchCreateTasks: function( userId, taskCount ){

        var newTasks = [];
        var self = this;
        _.times( taskCount, function(){
            newTasks.push( self.createTask( userId ) );
        });

        return Promise.all( newTasks );
    }
};