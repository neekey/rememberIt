/*
 * GET home page.
 */

var fs = require( 'fs' );
var path = require( 'path' );
var basename  = path.basename(module.filename);

/**
 * 所有API 中需要和 workId 交互的内容，放在这一层处理，而不放到model层中
 * @param app
 */
module.exports = function( app ){

    fs
        .readdirSync(__dirname)
        .filter(function(file) {
            return (file.indexOf(".") !== 0) && (file !== basename);
        })
        .forEach(function(file) {
            require( path.join(__dirname, file) )( app );
        });
};

