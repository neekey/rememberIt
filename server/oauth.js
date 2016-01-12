var TodoistOauth = require( '../lib/todoist_oauth' );
var proxy = require('../lib/data/');
var userProxy = proxy.user;
var Session = require( './session' );
var Todoist = require( '../lib/todoist' );

/**
 * update user token and initial todoist data if hasn't done yet.
 * @param token
 * @param user
 * @returns {*}
 */
function updateUserAuthInfo( token, user ){

    var updateUser = { todoist_token: token };

    if( !user.todoist_project_id || !user.todoist_label_id ){
        // prepare todoist project and label
        return Todoist.initialUser( token).then( function( ret ){
            updateUser.todoist_label_id = ret.labelId;
            updateUser.todoist_project_id = ret.projectId;

            return userProxy.update( user.id, updateUser );
        });
    }
    else {
        return userProxy.update( user.id, updateUser );
    }
}

/**
 *
 * @param {Object} bbcCfg
 * @param {String} bbcCfg.pattern
 * @returns {Function}
 */
module.exports = function( bbcCfg ){

    return TodoistOauth.middleware({
        pattern: bbcCfg.pattern,

        checkSession: function( session ){
            return !!Session.getUserInfo( session );
        },

        /**
         * 当SSO需要进行登陆，且登陆成功后的回掉
         * @param req
         * @param res
         * @param userInfo
         * @param token
         * @param done 执行完业务动作后调用，让BBC模块走完SSO登陆，若没有错误，直接 done( null ) SSO 会跳转回用户用户访问页面
         */
        oauthCallback: function( req, res, userInfo, token, done ){

            console.log( '[SSO] check if user exists by workid:', userInfo.workid );

            /**
             * 检查数据库中是否已经有该用户，若没有则添加信息
             */
            return userProxy.findOneByTodoistUserId( userInfo.id ).then(function ( user ) {

                if ( user ) {

                    console.log( '[SSO] user already exists, write use info into cookie' );

                    return updateUserAuthInfo( token, user).then(function( updateUser ){
                        Session.setUserInfo( req, res, updateUser );
                        done( null );
                    });

                } else {

                    // 将用户信息加入到数据库
                    console.log( '[SSO] user doesn\'t exists, add user to db' );

                    return userProxy.add({
                        name: userInfo.full_name,
                        todoist_user_id: userInfo.id,
                        todoist_token: token
                    }).then(function (user) {

                        console.log( '[SSO] add new user success:', JSON.stringify( user ) );

                        return updateUserAuthInfo( token, user ).then(function( updateUser ){
                            Session.setUserInfo( req, res, updateUser );
                            done( null );
                        });

                    }).catch(function (err) {
                        console.error( '[SSO] add new user fail:', err );
                        done( err );
                    });
                }

            }).catch(function( err ){
                console.error( '[SSO] check user exists fail:', err );
                done( err );
            });
        }
    });
};
