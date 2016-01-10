/**
 * todoist client
 */
var request = require( 'request-promise' );

function todoistUrl( type ){
    return 'https://todoist.com/API/v6/' + type;
}

module.exports = {

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
    }
};