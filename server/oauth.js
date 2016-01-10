var TodoistOauth = require( '../lib/todoist_oauth' );
var proxy = require('../lib/data/');
var userProxy = proxy.user;
var Session = require( './session' );
var error = require( '../lib/error' );

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
            userProxy.findOneByTodoistUserId( userInfo.id ).then(function ( user ) {


                if ( user ) {

                    console.log( '[SSO] user already exists, write use info into cookie' );

                    Session.setUserInfo( req, res, user );

                    done( null );

                } else {

                    // 将用户信息加入到数据库
                    console.log( '[SSO] user doesn\'t exists, add user to db' );

                    userProxy.add({
                        name: userInfo.full_name,
                        todoist_user_id: userInfo.id,
                        todoist_token: token
                    }).then(function (user) {

                        console.log( '[SSO] add new user success:', JSON.stringify( user ) );

                        Session.setUserInfo( req, res, user );

                        // 跳转回用户的原始页面中
                        done( null );

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
