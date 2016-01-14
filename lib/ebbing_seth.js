/**
 * Ebbing seth
 */

var LEVELS = [ 1, 2, 4, 7, 15, 30 ];

/**
 * get next interval
 * @param currentProcess
 */
module.exports = function( currentProcess ){

    console.log( 'ebb!!' );
    //currentProcess = Number( currentProcess );
    if( currentProcess == LEVELS.length - 1 ){
        return {
            finished: true
        }
    }
    else {
        var nextDay = LEVELS[ currentProcess ];
        var prevDay = LEVELS[ currentProcess - 1 ] || 0;
        return {
            finished: false,
            next: nextDay - prevDay,
            process: ( currentProcess + 1 ),
            percent: ( currentProcess + 1 / LEVELS.length ).toFixed( 2 )
        };
    }
};