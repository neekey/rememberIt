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