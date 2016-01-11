var Config = require( '../config/config' );
var Todoist = require( './todoist' );
var _ = require( 'lodash' );
var TodoistState = require( './todoist_oauth_state' );

var STATE_CACHE = {};

var OAUTH_CONFIG = {
    host: 'todoist.com',
    paths: {
        authorization: '/oauth/authorize',
        code_back: '/oauth_back'
    },
    clientId: Config.todoist.clientId || '',
    clientSecret: Config.todoist.clientSecret || ''
};

var OAuth = {

    /**
     * @param midConfig
     * @param midConfig.oauthCallback ( user, token )
     * @param midConfig.checkSession ( session )
     * @param midConfig.pattern
     * @returns {Function}
     */
    middleware: function ( midConfig ) {

        var self = this;
        self.config = midConfig;

        return function (req, res, next ) {

            // 检查是否为SSO的登陆回掉路径
            if ( req.path.indexOf( OAUTH_CONFIG.paths.code_back ) >= 0) {

                // 从请求中获取
                // back_url
                // token
                var code = req.query.code;
                var state = req.query.state;

                console.log( '[SSO] token back code:', code, ' state:', state );

                TodoistState.getState( state ).then(function( stateValue ){

                    if( stateValue ){

                        var backURL = stateValue;
                        TodoistState.removeState( state );

                        console.log( '[SSO] get token by code' );

                        return Todoist.getToken( OAUTH_CONFIG.clientId, OAUTH_CONFIG.clientSecret, code ).then(function( token ){

                            console.log( '[SSO] get user info by token' );

                            return Todoist.getUserInfo( token ).then(function( user ){

                                console.log( '[SSO] get user info', user );

                                if( typeof midConfig.oauthCallback === 'function' ){

                                    midConfig.oauthCallback( req, res, user, token, function( err ){

                                        if( err ){
                                            console.error( '[SSO] error from custom login callback', err );
                                            res.send( 500, err );
                                        }
                                        else {
                                            console.log( '[SSO] execute custom login callback success.' );
                                            console.log( '[SSO] redirect to original url:', backURL );

                                            // 跳转回用户的原始页面中
                                            res.redirect( backURL );
                                        }
                                    });
                                }
                                else {

                                    // 跳转回用户的原始页面中
                                    res.redirect( backURL );
                                }
                            });
                        }).catch(function( err ){
                            res.send( 500, err );
                        });
                    }
                    else {
                        res.send( 500, 'invalid state: ' + state );
                    }

                });
            }
            else {

                // 检查是否为用户配置的需要登陆验证的路径
                if ( midConfig.pattern.test( req.path ) ) {

                    console.log( '[SSO] need to check login.' );

                    // 先检查现在是否为登陆状态
                    if ( midConfig.checkSession( req.session ) ) {

                        console.log( '[SSO] already logined, pass' );
                        next();
                    }
                    // 进行登陆
                    else {
                        console.log( '[SSO] need to login, redirect' );
                        self.authorize( req, res );
                    }
                }
                else {
                   // 多余
                   // console.log( '[SSO] no need to check login, pass.' );

                    // 否则直接通过
                    next();
                }
            }
        }
    },

    /**
     * 跳转到内网登陆页面进行登陆
     * @param req
     * @param res
     * @constructor
     */
    authorize: function (req, res) {

        var state = _.uniqueId();
        var backUrl = req.originalUrl;
        var authURL = 'https://' + OAUTH_CONFIG.host + OAUTH_CONFIG.paths.authorization + '?client_id=' + OAUTH_CONFIG.clientId + '&scope=data:read_write&state=' + state;

        console.log( '[sso] save state...' );

        TodoistState.saveState( state, backUrl).then(function(){
            console.log( 'authorize: state: ', state );
            // 重定向到登陆页面
            res.redirect(authURL);
        }).catch(function( err ){
            res.send( 500, err );
        });
    }
};

module.exports = OAuth;
