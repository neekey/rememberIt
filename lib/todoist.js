/**
 * todoist client
 */
var request = require( 'request-promise' );
var _ = require( 'lodash' );
var uuid = require( 'node-uuid' );
var DataProxy = require( './data/' );
var UserProxy = DataProxy.user;

function todoistUrl( type ){
    return 'https://todoist.com/API/v6/' + type;
}

module.exports = {

    initialUser: function( token ){
        return this.command( token, [
            {
                command: 'project_add',
                options: {
                    args: {
                        name: 'EbbingSeth'
                    }
                }
            },
            {
                command: 'label_add',
                options: {
                    args: {
                        name: 'EbbingSeth'
                    }
                }
            }
        ]).then(function( rets ){
            var error = [];
            rets.forEach(function( ret ){
                if( ret.error ){
                    error.push( ret );
                }
            });

            if( error.length ){
                throw new Error( error );
            }
            else {
                return {
                    projectId: rets[0].id,
                    labelId: rets[1].id
                }
            }
        });
    },

    /**
     * execute write command
     * @param {String} token
     * @param {String|Array} commands [{ command: '', options: {} }]
     * @param {Object} [options]
     * @param {object} options.args
     * @param {string} [options.uuid]
     * @param {string} [options.tempId]
     */
    command: function( token, commands, options ){

        var commandsQuery = [];

        if( _.isString( commands ) ){
            commands = [
                {
                    command: commands,
                    options: options
                }
            ];
        }

        commands.forEach(function( commandObj ){

            commandsQuery.push({
                type: commandObj.command,
                uuid: commandObj.options.uuid || uuid.v1(),
                temp_id: commandObj.options.tempId || uuid.v1(),
                args: commandObj.options.args
            });
        });

        var commandsStr = JSON.stringify( commandsQuery );
        console.info( '[doist] execute command: ', commandsStr );

        return request({
            url: 'https://todoist.com/API/v6/sync',
            method: 'post',
            qs: {
                token: token,
                commands: commandsStr
            },
            json: true
        }).then(function( ret ){
            var results = [];
            var syncStatus = ret.SyncStatus;
            var tempIdMapping = ret.TempIdMapping;

            console.info( '[doist] execute command success: ', ret );

            commandsQuery.forEach(function( obj ){
                var r = syncStatus[ obj.uuid ];

                if( r == 'ok' ){
                    results.push({
                        type: obj.type,
                        id: tempIdMapping[ obj.temp_id ]
                    });
                }
                else {
                    results.push({
                        type: obj.type,
                        error: r
                    });
                }
            });

            return results;
        });
    },

    read: function( token, types ){
        return request({
            url: todoistUrl( 'sync' ),
            qs: {
                seq_no: 0,
                token: token,
                resource_types: JSON.stringify( types )
            },
            json: true
        });
    },

    getToken: function( clientId, clientSecret, code ){

        return request({
            url: 'https://todoist.com/oauth/access_token',
            method: 'post',
            qs: {
                client_id: clientId,
                client_secret: clientSecret,
                code: code
            },
            json: true
        }).then(function( result ){
            if( result.error ){
                throw new Error( result.error );
            }
            else {
                return result.access_token;
            }
        });
    },

    getUserInfo: function( token ){
        return this.read( token, [ 'user' ]).then(function( result ){
            return result.User;
        });
    },

    /**
     * create a label
     * @param token
     * @param label
     * @param label.name
     */
    addLabel: function( token, label ){
        return this.command( token, 'label_add', { args: label }).then(function( rets ){
            return rets[0];
        });
    },

    /**
     * create a project
     * @param token
     * @param project
     * @param project.name
     */
    addProject: function( token, project ){
        return this.command( token, 'project_add', { args: project }).then(function( rets ){
            return rets[0];
        });
    },

    /**
     * create a task
     * @param token
     * @param newTask
     * @param newTask.content
     * @param newTask.project_id
     * @param newTask.date_string
     */
    addTask: function( token, newTask ){
        return this.command( token, 'item_add', { args: newTask }).then(function( rets ){
            return rets[0];
        });
    },

    /**
     * finish a task
     * @param token
     * @param todoistTaskId
     * @returns {*}
     */
    finishTask: function( token, todoistTaskId ){
        return this.command( token, 'item_close', { args: {
            id: todoistTaskId
        } }).then(function( rets ){
            return rets[0];
        });
    }
};