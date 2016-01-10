var _ = require( 'lodash' );

module.exports = {

    /**
     * 过滤find参数，只保留 offset 和 limit
     * @param options
     * @returns {*}
     */
    pickListOptions: function( options ){
        options = _.pick( options || {}, [ 'offset', 'limit' ] );

        return options;
    },

    handleArrayWithListOptions: function( list, options ){

        options = options || {};
        var offset = options.offset || 0;
        var limit = options.limit || list.length - offset;

        return list.slice( offset, offset + limit );
    },

    /**
     *
     * @param obj
     * @returns {*}
     */
    createHash: function( obj ){

    }
};