var Model = require( './models' );
var ERRORS = require( '../error' );
var Promise = require( 'bluebird' );
var Utils = require( './utils' );
var _ = require( 'lodash' );

module.exports = {

    /**
     * Create user.
     * @param user
     * @param user.name
     * @param user.todoist_user_id
     * @param user.todoist_token
     */
    add: function( newUser ){

        return this.findOneByTodoistUserId( newUser.todoist_user_id).then(function( user ){
            if( user ){
                throw new ERRORS.model.ALREADY_EXIST( 'user with todoist id: ' + newUser.todoist_user_id + ' already exists' );
            }
            else {
                return Model.user.create({
                    name: newUser.name,
                    todoist_user_id: newUser.todoist_user_id,
                    todoist_token: newUser.todoist_token
                });
            }
        });
    },

    /**
     * delete users
     * @param [options]
     * @param [mOptions]
     * @returns {*}
     */
    removeUsers: function( options ){

        var self = this;
        return Model.user.findAll( options ).then(function( users ){
            return Promise.all(_.map( users, function( user ){
                return self.remove( user.id );
            }));
        });
    },

    /**
     * delete user
     * @param id
     * @returns {*}
     */
    remove: function( id ){

        return this.findOne( id ).then(function( user ){
            if( user ){
                return Model.task.destroy({ where: { user_id: user.id } }).then(function(){
                    return user.destroy().then(function(){
                        return user;
                    });
                });
            }
            else {
                return user;
            }
        });
    },

    /**
     * 返回用户列表
     * @param options
     * @param options.offset
     * @param options.limit
     * @returns {*}
     */
    find: function( options ){
        return Model.user.findAndCount( Utils.pickListOptions( options ) );
    },

    /**
     * Find user by userId, if not exist, throw a NOT_EXIST error.
     * @param userId
     * @returns {*}
     */
    findOneStrict: function( userId ){
        return this.findOne( userId).then(function( user ){
            if( user ){
                return user;
            }
            else {
                throw new ERRORS.model.NOT_EXIST( 'user with userid：' + userId + ' doesn\'t exist' );
            }
        });
    },

    /**
     * Find user by todoistUserId, if not exist, throw a NOT_EXIST error.
     * @param todoistUserId
     * @returns {*}
     */
    findOneByTodoistUserIdStrict: function( todoistUserId ){
        return this.findOneByTodoistUserId( todoistUserId ).then(function( user ){
            if( user ){
                return user;
            }
            else {
                throw new ERRORS.model.NOT_EXIST( 'user with todoist user id：' + todoistUserId + ' doesn\'t exist' );
            }
        });
    },

    /**
     * find user by user id.
     * @param userId
     */
    findOne: function( userId ){
        return Model.user.findAll( { where: { id: userId } }).then(function( users ){
            return users[0];
        });
    },

    /**
     * find user by todoist user id.
     * @param todoistUserId
     */
    findOneByTodoistUserId: function( todoistUserId ){
        return Model.user.findAll( { where: { todoist_user_id: todoistUserId } }).then(function( users ){
            return users[0];
        });
    }
};