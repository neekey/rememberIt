var chai = require('chai');
var chaiJsFactories = require('chai-js-factories');
var _ = require('lodash');
chai.use(chaiJsFactories);

// 创建一个用户
chai.factory.define('user', function (args) {

    return _.extend({
        name: 'user_id_' + _.uniqueId(),
        todoist_user_id: 'todoist_user_id_' + _.uniqueId(),
        todoist_token: 'todoist_token_' + _.uniqueId()
    }, args);
});

// 创建一个user token
chai.factory.define('task', function (args) {

    return _.extend({
        name: 'task_name_' + _.uniqueId(),
        todoist_task_id: 'task_name_' + _.uniqueId(),
        date: Date.now()
    }, args);
});