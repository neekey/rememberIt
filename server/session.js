/**
 * 统一的session设置
 */
module.exports = {


    getCleanUser: function ( user ){
        return {
            id: user.id,
            name: user.name,
            todoist_user_id: user.todoist_user_id,
            todoist_project_id: user.todoist_project_id,
            todoist_label_id: user.todoist_label_id
        };
    },

    setUserInfo: function( req, res, user ){
        req.session.userInfo = this.getCleanUser( user );
        res.cookie('userInfo', JSON.stringify( req.session.userInfo ) );
    },

    logout: function( req, res ){
        res.clearCookie('userInfo' );
        return req.session.userInfo = null;
    },

    getUserInfo: function( session ){
        return ( session && session.userInfo );
    }
};