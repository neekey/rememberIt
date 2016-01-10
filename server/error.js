/**
 * 跨域请求中间件
 */
module.exports = function( err, req, res, next ){

    console.error( 'express 处理请求出错：', err.name, err.message, err.stack );

    var status = 500;
    switch( err.name ){

        case 'INVALID_INPUT':
            status = 400;
            break;
        case 'ALREADY_EXIST':
            status = 400;
            break;
        case 'NOT_EXIST':
            status = 404;
            break;
        case 'OWNERS_CAN_NOT_BE_EMPTY':
            status = 403;
            break;
        case 'DATABASE_ERROR':
            status = 500;
            break;
        case 'PERMISSION_DENIED':
            status = 401;
            break;
        default:
            status = 500;
            break;
    }

    res.send( status, { type: err.type, name: err.name, message: err.message } );
};