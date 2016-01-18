/**
 * 应用相关接口
 */

var proxy = require('../../../lib/data');
var userProxy = proxy.user;
var error = proxy.error;
var _ = require( 'lodash' );
var Todoist = require( '../../../lib/todoist' );

module.exports = function (app) {

    /**
     * 获取应用列表
     * @param page
     * @param size
     * @param type
     * @param keyword
     */
    app.post('/api/user/recreate_data', function( req, res ){

        console.info( 'recreating data...' );

        return userProxy.findOneStrict( req.session.userInfo.id).then( function( user ){

            console.info( 'find user info, check totoist info...' );

            // read todois data to check
            return Todoist.read( user.todoist_token, [ 'projects', 'labels' ]).then(function( ret ){

                console.info( 'todoist info received... checking...' );

                var missing = [];
                var find = false;

                if( ret.Projects && ret.Projects.length ){

                    ret.Projects.forEach(function( project ){
                        if( project.id == user.todoist_project_id ){
                            find = true;
                        }
                    });

                    if( !find ){
                        missing.push( 'project' );
                    }
                }
                else {
                    missing.push( 'project' );
                }

                if( ret.Labels && ret.Labels.length ){

                    find = false;
                    ret.Labels.forEach(function( label ){
                        if( label.id == user.todoist_label_id ){
                            find = true;
                        }
                    });

                    if( !find ){
                        missing.push( 'label' );
                    }
                }
                else {
                    missing.push( 'label' );
                }

                console.info( 'missing data: ', missing );

                if( missing.length ){

                    return Todoist.initialUser( user.todoist_token, missing ).then(function( result ){
                        result = {
                            projectId: result.projectId || user.todoist_project_id,
                            labelId: result.labelId || user.todoist_label_id
                        };

                        return userProxy.update( user.id, {
                            todoist_project_id: result.projectId,
                            todoist_label_id: result.labelId
                        }).then(function(){
                            return result;
                        });
                    });
                }
                else {
                    return {
                        projectId: user.todoist_project_id,
                        labelId: user.todoist_label_id
                    };
                }
            });
        }).then(function( ret ){
            console.info( 'recreate data success', ret );
            res.send( 200, ret );
        }).catch(function( err ){
            console.error( 'recreate data fail', error );
            res.send( 500, err );
        });
    });
};