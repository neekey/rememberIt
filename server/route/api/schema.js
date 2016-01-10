/**
 * 应用相关接口
 */

var proxy = require('../../../lib/data_proxy');
var _ = require( 'lodash' );
var schemaProxy = proxy.schema;
var userProxy = proxy.user;
var error = proxy.error;
var BBC = require( '../../bbc' );

var mids = require( '../middlewares' );

// 下面对于content和mocks等的修改，需要committer信息的，不直接在请求中给参数，默认为当前的用户身份

module.exports = function (app) {

    /**
     * 获取schema列表
     * @param page
     * @param size
     * @param keyword
     * @param type
     * @param owner_id
     */
    app.get('/api/v2/schemas', mids.handlePageInfo, function( req, res, next ){

        var options = _.merge( req.pageInfo, _.pick( req.query, [ 'type', 'features', 'keyword' ] ) );

        if( req.query.owner_id ){
            schemaProxy.findByOwner( req.query.owner_id, options ).then(mids.saveListAndCountResponse( req, next )).catch( next );
        }
        else {
            schemaProxy.find( options ).then(mids.saveListAndCountResponse( req, next )).catch( next );
        }
    }, mids.handleListAndCountResponse );

    /**
     * 根据schema 的content和meta信息进行搜索
     * @param page
     * @param size
     * @param content
     * @param meta
     */
    app.get( '/api/v2/schema_version', mids.handlePageInfo, function( req, res, next ){
        var options = _.merge( req.query, req.pageInfo );
        schemaProxy.findByContentThroughVersions( req.query, options ).then( mids.saveListAndCountResponse( req, next )).catch( next )
    }, mids.handleListAndCountResponse );

    /**
     * 添加新的schema
     * @param owner_id
     * @param name
     * @param type
     * @param description
     * @param {JSON字符串|Object} [meta_info] 和schema的具体类型相关的元数据。 `http`:，包含 `uri`字段; `mtop`: 包含 `mtop_name`，`mtop_version`
     * @param {JSON字符串} [content] 默认的Schema 内容，若给定，则无视  json 和 meta_info 字段
     * @param {JSON字符串} [json] 默认的JSON内容
     */
    app.post('/api/v2/schemas', mids.checkAuth, function( req, res, next ){

        schemaProxy.add( req.body.owner_id, req.body, req.userInfo.id, {
            defaultJSON: req.body.json || '',
            // 此处兼容上一个版本的schema参数，确认调用方不用后去掉
            defaultSchema: req.body.schema || req.body.content,
            metaInfo: req.body.meta_info || {}
        }).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 检查当前用户对schema是否具有权限
     */
    app.get('/api/v2/schemas/:schema_id/auth', mids.checkAuth, function( req, res, next ){
        schemaProxy.checkSchemaAuth( req.userInfo.id, req.params.schema_id ).then(function( authed ){
            res.send( {
                result: authed
            } );
        }).catch( next );
    });

    /**
     * 检查schema是否存在
     */
    app.get('/api/v2/schemas/:schema_id/exist', function( req, res, next ){
        schemaProxy.findOne( req.params.schema_id ).then(function( app ){
            res.send( { result: !!app } );
        }).catch( next );
    });

    /**
     * 修改schema
     * @param description
     */
    app.put('/api/v2/schemas/:schema_id', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.update( req.params.schema_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除schema
     */
    app.delete('/api/v2/schemas/:schema_id', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.remove( req.params.schema_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取schema的可用钩子类型列表
     */
    app.get('/api/v2/schema_hooks', function( req, res ){
        res.send(_.map( proxy.model.schema_hook.available_types, function( type ){
            return type;
        }));
    });

    /**
     * 获取schema的hook列表
     * @param page
     * @param size
     */
    app.get('/api/v2/schemas/:schema_id/hooks', mids.handlePageInfo, function( req, res, next ){
        schemaProxy.getHooks( req.params.schema_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 添加schema的hook
     * @param type
     * @param url
     */
    app.post('/api/v2/schemas/:schema_id/hooks', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.addHook( req.params.schema_id, req.body ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除hook
     */
    app.delete('/api/v2/schemas/:schema_id/hooks/:hook_id', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.removeHook( req.params.schema_id, req.params.hook_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取某个schema
     * @param version
     * @param {Boolean} all 是否同时获取 content 和 mocks 数据，默认为false
     */
    app.get('/api/v2/schemas/:schema_id', function( req, res, next ){
        if( req.query.all ){
            schemaProxy.findOneWithAll( req.params.schema_id, req.query.version ).then( res.send.bind( res ) ).catch( next );
        }
        else {
            schemaProxy.findOneStrict( req.params.schema_id, req.query.version ).then( res.send.bind( res ) ).catch( next );
        }
    });

    /**
     * 获取schema 的 content
     * @param version
     */
    app.get('/api/v2/schemas/:schema_id/content', function( req, res, next ){
        schemaProxy.getContent( req.params.schema_id, req.query.version ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 修改schema 的 content
     * @param content
     * @param [message]
     * @param [pre_version] todo 添加冲突校验
     */
    app.put('/api/v2/schemas/:schema_id/content', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.updateContent( req.params.schema_id, req.body.content, {
            committer_id: req.userInfo.id,
            message: req.body.message
        }).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取schemas 的 mocks 数据
     * @param page
     * @param size
     * @param version
     */
    app.get('/api/v2/schemas/:schema_id/mocks', mids.handlePageInfo, function( req, res, next ){
        schemaProxy.getMocks( req.params.schema_id, req.query.version, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 添加 mock 数据
     * @param data
     * @param query
     * @param active
     * @param [message]
     */
    app.post('/api/v2/schemas/:schema_id/mocks', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.addMock( req.params.schema_id, req.body, {
            committer_id: req.userInfo.id,
            message: req.body.message
        }).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 删除 mock 数据
     * @param [message]
     */
    app.delete('/api/v2/schemas/:schema_id/mocks/:mock_id', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){

        schemaProxy.removeMock( req.params.schema_id, req.params.mock_id, {
            committer_id: req.userInfo.id,
            message: req.body.message
        } ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 修改 mock 数据
     * @param data
     * @param active
     * @param query
     * @param message
     */
    app.put('/api/v2/schemas/:schema_id/mocks/:mock_id', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){

        schemaProxy.updateMock( req.params.schema_id, req.params.mock_id, req.body, {
            committer_id: req.userInfo.id,
            message: req.body.message
        }).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取某条 mock 数据
     * @param [version]
     */
    app.get('/api/v2/schemas/:schema_id/mocks/:mock_id', function( req, res, next ){

        schemaProxy.getMock( req.params.schema_id, req.params.mock_id, req.query.version ).then( res.send.bind( res )).catch( next );
    });

    /**
     * 获取 schema 的所有版本列表
     * @param page
     * @param size
     */
    app.get('/api/v2/schemas/:schema_id/versions', mids.handlePageInfo, function( req, res, next ){

        schemaProxy.getCommits( req.params.schema_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 获取 schema 的指定版本
     */
    app.get('/api/v2/schemas/:schema_id/versions/:version', function( req, res, next ){
        schemaProxy.getCommit( req.params.schema_id, req.params.version ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 回滚 schema 的到指定版本
     * @param message 回滚信息
     */
    app.post('/api/v2/schemas/:schema_id/versions/:version', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){

        schemaProxy.revert( req.params.schema_id, req.params.version, {
            committer_id: req.userInfo.id,
            message: req.body.message || '回滚到 req.params.version'
        } ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取 schema 的tag列表
     * @param page
     * @param size
     */
    app.get('/api/v2/schemas/:schema_id/tags', mids.handlePageInfo, function( req, res, next ){
        schemaProxy.getTags( req.params.schema_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 获取 schema 的某个指定的 tag
     */
    app.get('/api/v2/schemas/:schema_id/tags/:tag_name', function( req, res, next ){
        schemaProxy.getTag( req.params.schema_id, req.params.tag_name ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 检查schema 是否已经存在指定名称的 tag
     */
    app.get('/api/v2/schemas/:schema_id/tags/:tag_name/exist', function( req, res, next ){
        schemaProxy.getTag( req.params.schema_id, req.params.tag_name ).then(function( tag ){
            res.send( { result: !!tag } );
        }).catch( next );
    });

    /**
     * 添加一个tag
     * @param name
     * @param version
     * @param description
     */
    app.post('/api/v2/schemas/:schema_id/tags', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.addTag( req.params.schema_id, req.body.version, _.merge( req.body, { committer_id: req.userInfo.id } )).
            then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取 schema 的协作者列表
     * @param page
     * @param size
     */
    app.get('/api/v2/schemas/:schema_id/collaborators', mids.handlePageInfo, function( req, res, next ){
        schemaProxy.getCollaborators( req.params.schema_id, req.pageInfo).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );

    /**
     * 为schema 添加协作者
     * @param user_id
     * @param work_id
     */
    app.post('/api/v2/schemas/:schema_id/collaborators', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){

        // 使用工号添加
        if( req.body.work_id ){

            var workId = req.body.work_id;

            // 先检查该 工号 用户是否已经存在
            userProxy.findByWorkId( workId ).then(function( user ){

                // 若不存在，从 bbc 获取用户信息并添加到DIP
                if( !user ){
                    BBC.addUserByWorkId( workId, function( err, user ){
                        if( err ){
                            next( err );
                        }
                        else {
                            schemaProxy.addCollaborator( req.params.schema_id, user.id ).then( res.send.bind( res ) ).catch( next );
                        }
                    });
                }else{
                    schemaProxy.addCollaborator( req.params.schema_id, user.id ).then( res.send.bind( res ) ).catch( next );
                }
            }).catch( next );
        }

        // 使用 user id 添加
        else {
            schemaProxy.addCollaborator( req.params.schema_id, req.body.user_id ).then(function( ret ){
                res.send( ret )
            }).catch( next );
        }
    });

    /**
     * 删除 schema 的协作者
     */
    app.delete('/api/v2/schemas/:schema_id/collaborators/:collaborator_id', mids.checkAuth, mids.checkSchemaAuth, function( req, res, next ){
        schemaProxy.removeCollaborator( req.params.schema_id, req.params.collaborator_id ).then( res.send.bind( res ) ).catch( next );
    });

    /**
     * 获取schema 可用的标准应用
     * @param page
     * @param size
     */
    app.get( '/api/v2/schemas/:schema_id/available_references', mids.handlePageInfo, function( req, res, next ){
        schemaProxy.getAvailableReferences( req.params.schema_id, req.pageInfo ).then(mids.saveListAndCountResponse( req, next )).catch( next );
    }, mids.handleListAndCountResponse );
};