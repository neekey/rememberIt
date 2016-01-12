/**
 * user schema.
 */

"use strict";

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("user", {
        name: {
            type: DataTypes.STRING,
            comment: 'user name.'
        },
        todoist_user_id: {
            type: DataTypes.INTEGER,
            comment: 'user id from todoist'
        },
        todoist_token: {
            type: DataTypes.STRING,
            comment: 'access token from todoist'
        },

        todoist_project_id: {
            type: DataTypes.INTEGER,
            comment: 'project id for task being added',
            allowNull: true
        },

        todoist_label_id: {
            type: DataTypes.INTEGER,
            comment: 'the mark label id to use',
            allowNull: true
        }
    }, {
        comment: 'User schema.',
        classMethods: {
            associate: function(models) {
                User.hasMany( models.task );
            }
        },

        getterMethods: {
        },

        hooks: {
        }
    });

    return User;
};