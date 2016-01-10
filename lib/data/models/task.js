/**
 * task schema.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var Task = sequelize.define("task", {
        todoist_user_id: {
            type: DataTypes.STRING,
            comment: 'todoist user name.'
        },

        finished: {
            type: DataTypes.BOOLEAN,
            comment: 'whether the task is finished',
            defaultValue: false
        },

        name: {
            type: DataTypes.STRING,
            comment: 'task name'
        },

        origin_task_id: {
            type: DataTypes.STRING,
            comment: 'login type. ( todoist )'
        },
        current_task_id: {
            type: DataTypes.STRING,
            comment: 'access token from todoist',
            allowNull: true
        },

        current_process: {
            type: DataTypes.STRING,
            comment: 'current memory process',
            defaultValue: "0"
        },

        begin_date: {
            type: DataTypes.STRING,
            comment: 'beginning of the memory process'
        }
    }, {
        comment: 'User schema.',
        classMethods: {
        },

        getterMethods: {
        },

        hooks: {
        }
    });

    return Task;
};