/**
 * web hook 服务
 * @type {exports}
 */

var crypto = require('crypto');
var config = require( '../config/config' );
var Promise = require( 'bluebird' );
var Proxy = require( '../lib/data/' );
var UserProxy = Proxy.user;
var TaskProxy = Proxy.task;
var EbbingSeth = require( '../lib/ebbing_seth' );
var Todoist = require( '../lib/todoist' );

module.exports = function( req, res, next ){

    if( ( req.method == 'POST' ) && req.path == '/hooks' ){
        console.log( 'hooks', req.path, req.body, req.get( 'X-Todoist-Hmac-SHA256' ));
        if( verifyTodoist( req ) ){
            console.info( 'webhook verify success' );

            return hooksHandle( req.body, req.get( 'X-Todoist-Delivery-ID' )).then(function(){
                console.info( req.get( 'X-Todoist-Delivery-ID' ), 'hooks handle success' );
                res.send( 200 );
            }).catch(function( error ){
                console.error( req.get( 'X-Todoist-Delivery-ID' ), 'hooks handle error', error );
                res.send( 500, error );
            });
        }
        else {
            console.log( 'todoist verify wrong' );
            next();
        }
    }
    else {
        next();
    }
};

function verifyTodoist( req ){

    if( req.get( 'User-Agent' ) == 'Todoist-Webhooks' && req.get( 'X-Todoist-Hmac-SHA256' ) ){
        var hmac = crypto.createHmac('sha256', config.todoist.clientSecret );
        hmac.update( req.body );
        var digest = hmac.digest('base64');
        console.log( 'digest', digest );
        return req.get('X-Todoist-Hmac-SHA256') == digest;
    }
    else {
        return false;
    }
}

function hooksHandle( hookData, hookId ){

    return new Promise(function( resolve, reject ){
        if( typeof hookData == 'string' ){
            hookData = JSON.parse( hookData );
        }

        console.log( hookId, '[hook] begin process hook' );

        if( [ 'item:added', 'item:completed'].indexOf( hookData.event_name ) >= 0 ){

            return UserProxy.findOneByTodoistUserIdStrict( hookData.user_id ).then(function( user ){

                var eventData = hookData.event_data;

                switch( hookData.event_name ){

                    case 'item:added':

                        // a new memory task is added
                        if( eventData.labels.indexOf( user.todoist_label_id ) >= 0 && eventData.project_id != user.todoist_project_id ){
                            console.log( hookId, '[hook] new memory task added' );
                            return newMemoryTask( user, eventData );
                        }

                        break;
                    case 'item:completed':

                        // if a sub task is completed.
                        if( eventData.project_id == user.todoist_project_id ){
                            console.log( hookId, '[hook] a sub task finished' );
                            return updateMemoryTask( user, eventData );
                        }
                        // the main task is completed.
                        else if( eventData.labels.indexOf( user.todoist_label_id ) >= 0 ){
                            console.log( hookId, '[hook] a main task finished' );
                            return finishedMemoryTask( user, eventData );
                        }

                        break;
                    default:
                        break;
                }

                console.log( hookId, '[hook] nothing to handle.' );

            }).then( resolve ).catch( reject );
        }
        else {
            console.log( hookId, '[hook] not interested.' );
            resolve();
        }
    });
}

function newMemoryTask( user, todoistTask ){

    console.info( '[hook] try to find task with todoist task id ', todoistTask.id );

    return TaskProxy.findOneByTodoistTaskId( todoistTask.id ).then(function( task ){

        // if a task is already here
        if( task ){
            console.info( '[hook] task with todoist task id ', todoistTask.id, ' already exists' );
            return task;
        }
        else {

            console.info( '[hook] add a new memory task...' );
            return TaskProxy.add( user.id, {
                name: todoistTask.content,
                date: todoistTask.date_added,
                todoist_task_id: todoistTask.id
            }).then(function( newTask ){
                console.info( '[hook] add a new memory task success' );
                return addSubTask( user, newTask );
            });
        }
    });
}

function addSubTask( user, task ){

    console.info( '[hook] try to add new sub task...' );

    var process = task.current_process;

    try {
        var ret = EbbingSeth( process );
    }
    catch( error ){
        console.error( 'ebbing seth error', error );
        throw error;
    }

    if( ret.finished ){

        console.info( '[hook] cheers! the whole memory is done, update the task status...' );

        // update the task process and record the new sub task
        return TaskProxy.update( task.id, {
            current_task_id: null,
            finished: true
        });
    }
    else {

        var newTask = {
            project_id: user.todoist_project_id,
            date_string: '+' + String( ret.next ),
            content: task.name + ' [ ' + ret.percent * 100 + '% ]'
        };

        console.info( '[hook] cheers! the next process is ', ret.process, 'try to add a new sub task...', newTask );

        // add a new task to todoist
        return Todoist.addTask( user.todoist_token, newTask).then(function( todoTask ){

            console.info( '[hook] new sub task added success...update the main task..' );

            // update the task process and record the new sub task
            return TaskProxy.update( task.id, {
                current_process: ret.process,
                current_task_id: todoTask.id
            });
        });
    }
}

function finishedMemoryTask( user, todoistTask ){

    console.info( '[hook] try to find task with todoist task id ', todoistTask.id );

    return TaskProxy.findOneByTodoistTaskId( todoistTask.id ).then(function( task ) {

        console.info( '[hook] finish the whole task and current sub task...', task );

        if( task ){
            // finished current task
            var currentTaskId = task.current_task_id;
            var tasks = [];

            if( currentTaskId ){
                tasks.push( Todoist.finishTask( user.todoist_token, user.todoist_project_id, currentTaskId ) );
            }

            tasks.push(TaskProxy.update( task.id, {
                current_task_id: null,
                finished: true
            }));

            return Promise.all( tasks );
        }
    });
}

function updateMemoryTask( user, todoistTask ){
    return TaskProxy.findOneByTodoistCurrentTaskId( todoistTask.id ).then(function( task ) {
        if( task ){
            return addSubTask(user, task);
        }
    });
}