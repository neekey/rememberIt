var Model = require( './models' );
var ERRORS = require( '../error' );
var UserProxy = require( './user' );
var Promise = require( 'bluebird' );
var _ = require( 'lodash' );

function pickListOptions( options ){
    options = _.pick( options || {}, [ 'offset', 'limit' ] );

    return options;
}

/**
 * @param userId
 * @param options
 * @param options.offset
 * @param options.limit
 * @param options.keyword
 * @param options.order
 * @returns {*}
 */
function getTaskFindOptions( userId, options ) {

    options = _.cloneDeep( options ) || {};
    var opt = { where: {} };

    if( userId ){
        opt = _.merge( opt, {
            where: {
                user_id: options.userId
            }
        });
    }
    else if( options.keyword ){
        opt = _.merge( opt, {
            where: {
                $or: {
                    name: { like: '%' + options.keyword + '%' }
                }
            }
        });

        // 若为数字，则增加id的筛选
        if( !isNaN( parseInt( options.keyword ) ) ){
            opt.where.$or.id = parseInt( options.keyword );
        }
    }

    opt.order = options.order || [ ['id', 'DESC'] ];

    // 最后加上 分页
    return _.merge( opt, pickListOptions( options ) );
}

module.exports = {

    /**
     * Create task.
     * @param userId
     * @param newTask
     * @param newTask.name
     * @param newTask.todoist_task_id
     * @param newTask.date
     */
    add: function( userId, newTask ){

        var self = this;
        return UserProxy.findOneStrict( userId ).then(function( user ){
            return self.findOneByTodoistTaskId( newTask.todoist_task_id ).then(function( task ){
                if( task ){
                    throw new ERRORS.model.ALREADY_EXIST( 'task with todoist task id: ' + newTask.todoist_task_id + ' already exists' );
                }
                else {
                    return user.createTask({
                        todoist_user_id: user.todoist_user_id,
                        name: newTask.name,
                        origin_task_id: newTask.todoist_task_id,
                        begin_date: newTask.date
                    });
                }
            });
        });
    },

    /**
     * remove tasks
     * @param options
     */
    removeTasks: function( options ){
        return Model.task.findAll( options).then(function( tasks ){
            return Promise.all(_.map( tasks, function( task ){
                return task.destroy();
            }));
        });
    },

    /**
     * remove task
     * @param taskId
     */
    remove: function( taskId ){
        this.findOne( taskId ).then( function( task ){
            if( task ){
                return task.destroy().then(function(){
                    return task;
                });
            }
            else {
                return task;
            }
        });
    },

    /**
     * find tasks by user id
     * @param userId
     * @param options
     */
    findByUserId: function( userId, options ){

        options = getTaskFindOptions( userId, options );
        return UserProxy.findOneStrict( userId).then(function(){
            return Model.task.findAndCount( options );
        });
    },

    /**
     * Update task
     * @param taskId
     * @param updateTask
     * @param updateTask.current_process
     * @param updateTask.current_task_id
     * @param updateTask.finished
     */
    update: function( taskId, updateTask ){
        return this.findOneStrict( taskId ).then(function( task ){
            updateTask = _.pick( updateTask, [ 'current_process', 'current_task_id', 'finished' ] );
            return task.updateAttributes( updateTask );
        });
    },

    findOneStrict: function( taskId ){
        return this.findOne( taskId).then(function( task ){
            if( task ){
                return task;
            }
            else {
                throw new ERRORS.model.NOT_EXIST( 'task with taskid：' + taskId + ' doesn\'t exist' );
            }
        });
    },

    findOneByTodoistTaskIdStrict: function( todoistTaskId ){
        return this.findOneByTodoistTaskIdStrict( todoistTaskId).then(function( task ){
            if( task ){
                return task;
            }
            else {
                throw new ERRORS.model.NOT_EXIST( 'task with todoistTaskId：' + todoistTaskId + ' doesn\'t exist' );
            }
        });
    },

    /**
     * find user by task id.
     * @param taskId
     */
    findOne: function( taskId ){
        return Model.task.findAll( { where: { id: taskId } }).then(function( tasks ){
            return tasks[0];
        });
    },

    findOneByTodoistTaskId: function( todoistTaskId ){
        return Model.task.findAll( { where: { origin_task_id: todoistTaskId } }).then(function( tasks ){
            return tasks[0];
        });
    },

    findOneByTodoistCurrentTaskId: function( todoistTaskId ){
        return Model.task.findAll( { where: { current_task_id: todoistTaskId } }).then(function( tasks ){
            return tasks[0];
        });
    },

    findOneByTodoistCurrentTaskIdStrict: function( todoistTaskId ){
        return this.findOneByTodoistTaskIdStrict( todoistTaskId).then(function( task ){
            if( task ){
                return task;
            }
            else {
                throw new ERRORS.model.NOT_EXIST( 'task with todoistCurrentTaskId：' + todoistTaskId + ' doesn\'t exist' );
            }
        });
    }
};