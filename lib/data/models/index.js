"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var basename  = path.basename(module.filename);
var config    = require( path.resolve( __dirname, '../../../config/config' ) ).db;

// 设置model相关的名称为 _ 风格
config.define = {
    underscored: true,
    charset: 'utf8'

};

config.dialectOptions = {
    ssl: config.ssl || false
};

// 禁用掉SQL 的输出
// todo 储存到SQL的log 文件
config.logging = false;

var sequelize = null;

if( config.url ){
    sequelize = new Sequelize( config.url, config );
}
else {
    sequelize = new Sequelize( config.database, config.username, config.password, config );
}
var db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== basename);
  })
  .forEach(function(file) {
    var model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
