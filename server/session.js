/**
 * 统一的session设置
 */
module.exports = {


    getCleanUser: function ( user ){
        return {
            name: user.name,
            todoist_user_id: user.todoist_user_id
        };
    },

    setUserInfo: function( req, res, user ){
        req.session.userInfo = this.getCleanUser( user );
        res.cookie('userInfo', encodeURIComponent( JSON.stringify( user ) ));
    },

    getUserInfo: function( session ){
        return ( session && session.userInfo );
    }
};