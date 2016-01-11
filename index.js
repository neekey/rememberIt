var cluster = require( 'cluster' );
var HOOK_SERVICE_WORKER_ID = null;
var CPUS = require( 'os').cpus();
var WEB_CONCURRENCY = CPUS.length;
if( WEB_CONCURRENCY > 3 ){
    WEB_CONCURRENCY = 3;
}

function startWorker( env ) {
    var worker = cluster.fork( env );
    console.log( 'CLUSTER: Worker %d started.', worker.id );
    return worker;
}

if( cluster.isMaster ){

    CPUS.forEach(function( cpu, index ){
        if( index < WEB_CONCURRENCY ){
            // 保证一次只有一个线程启用了 webhook 服务
            if( index == 0 ){
                var worker = startWorker( { NEED_HOOK_SERVICE: true });
                HOOK_SERVICE_WORKER_ID = worker.id;
                console.log( 'CLUSTER: started worker with hook service, worker id %d', HOOK_SERVICE_WORKER_ID );
            }
            else {
                startWorker();
            }
        }
    });

    cluster.on( 'disconnect', function( worker ){
        console.log( 'CLUSTER: Worker %d disconnected from the cluster.', worker.id );
    });

    cluster.on( 'exit', function( worker, code, signal ){
        console.log( 'CLUSTER: Worker %d died with exit code %d ( %s ).', worker.id, code, signal );

        if( HOOK_SERVICE_WORKER_ID == worker.id ){
            var newWorker = startWorker( { NEED_HOOK_SERVICE: true } );
            HOOK_SERVICE_WORKER_ID = newWorker.id;
            console.log( 'CLUSTER: started worker with hook service, worker id %d', HOOK_SERVICE_WORKER_ID );
        }
        else {
            startWorker();
        }
    });
}
else {
    require( './app.js' )();
}