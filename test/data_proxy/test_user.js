require( './factory' );

var DataProxy = require( '../../lib/data/' );
var UserProxy = DataProxy.user;
var chai = require( 'chai' );
var Assert = chai.assert;
var Utils = require( './utils' );
var _ = require( 'lodash' );
chai.use( require("chai-as-promised") );

describe( 'user', function(){

    // 链接和断开数据库
    before(function() {
        return DataProxy.connect().then(function(){
            return Utils.clearUsers();
        });
    });

    describe( 'common', function(){

        afterEach(function(){
            return Utils.clearUsers();
        });

        it( '添加用户', function(){

            return Utils.createUser().then(function( user ){
                Assert.isDefined( user.id, '应该包含id' );
                Assert.isDefined( user.name, '应该包含name' );
                Assert.isDefined( user.todoist_user_id, '应该包含todoist_user_id' );
                Assert.isDefined( user.todoist_token, '应该包含todoist_token' );
            });
        });

        it( '获取用户', function(){

            var newUserCount = 10;

            // 创建模拟数据
            return Utils.batchCreateUsers( newUserCount ).then(function( users ){

                // 普通的查询
                return UserProxy.find().then(function( result ){

                    Assert.lengthOf( result.rows, newUserCount );
                    Assert.equal( result.count, newUserCount );
                    return result.rows;

                }).then(function( findUsers ){

                    // 添加 offset
                    return UserProxy.find({ offset: 2, limit: 5 }).then(function( result ){
                        Assert.lengthOf( result.rows, 5 );
                        Assert.equal( result.count, newUserCount );
                        _.times( 5, function( n ){
                            Assert.equal( findUsers[ n + 2].id, result.rows[n].id );
                        });
                    });
                }).then(function(){

                    // findOne
                    return UserProxy.findOne( users[0].id ).then(function( user ){
                        Assert.equal( users[0].id, user.id );
                    });
                }).then(function(){

                    // 根据工号获取用户
                    var index = Math.floor( Math.random() * users.length );
                    var target = users[ index ];

                    return UserProxy.findOneByTodoistUserId( target.todoist_user_id ).then(function( user ){
                        Assert.equal( target.todoist_user_id, user.todoist_user_id );
                    });
                });
            });
        });

        it( '删除用户 - 同时包含的所有附属', function(){

            return Utils.createUser().then(function( newUser ){

                return UserProxy.find().then(function( result ){
                    Assert.lengthOf( result.rows, 1 );
                    Assert.equal( result.count, 1 );
                    return UserProxy.remove( newUser.id).then(function( removedUser ){
                        Assert.equal( removedUser.id, newUser.id );

                        return UserProxy.find().then(function( result ) {
                            Assert.lengthOf(result.rows, 0);
                            Assert.equal(result.count, 0);
                        });
                    });
                });
            });
        });
    });

});