require( './factory' );

var DataProxy = require( '../../lib/data/' );
var TaskProxy = DataProxy.task;
var chai = require( 'chai' );
var Assert = chai.assert;
var Utils = require( './utils' );
var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
chai.use( require("chai-as-promised") );

describe( 'schema', function(){

    // 链接和断开数据库
    before(function() {

        return DataProxy.connect().then(function(){
            return Utils.clearUsers();
        });
    });

    describe( 'common', function() {

        var newUser = null;

        beforeEach(function () {
            return Utils.createUser().then(function (u) {
                newUser = u;
            });
        });

        afterEach(function () {
            return Utils.clearUsers();
        });

        it('create task', function () {

            var task = Utils.createTask(newUser.id);

            return Promise.all([
                Assert.eventually.propertyVal(task, 'user_id', newUser.id, 'task should have a correct user_id'),
                Assert.eventually.propertyVal(task, 'todoist_user_id', newUser.todoist_user_id, 'task should have a correct todoist_user_id'),
                Assert.eventually.propertyVal(task, 'finished', false, 'task should have a default value "false" for the property "finished"'),
                Assert.eventually.propertyVal(task, 'current_process', "0", 'task should have a default value "0" for the property "current_process"'),
                Assert.eventually.property(task, 'name'),
                Assert.eventually.property(task, 'origin_task_id'),
                Assert.eventually.property(task, 'current_task_id'),
                Assert.eventually.property(task, 'begin_date')
            ]);
        });

        it('get task list by user', function () {

            return Promise.all([
                Utils.createTask(newUser.id),
                Utils.createTask(newUser.id),
                Utils.createTask(newUser.id)
            ]).spread(function (s1, s2, s3) {

                return TaskProxy.findByUserId(newUser.id).then(function (result) {

                    Assert.equal(result.count, 3);
                    result.rows.forEach(function (task) {
                        Assert.equal(task.user_id, newUser.id);
                    });
                });
            });
        });
    });
});