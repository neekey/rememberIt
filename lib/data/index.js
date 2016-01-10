module.exports = {
    model: require( './models/index' ),
    connect: function(){
        return this.model.sequelize.sync();
    },
    disconnect: function(){
        return this.model.sequelize.close()
    },
    user: require( './user' ),
    task: require( './task' )
};