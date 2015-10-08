var mongoose = require('mongoose');

function initializeDB() {
    var db = mongoose.connection;
    mongoose.connect('mongodb://localhost/tvdb');

    //todo: do we really need to exit here?
    db.on('error', function (err) {
        console.log('Connection error ' + err + err.stack);
        throw new Error('Connection error ' + err);
    });

    //when we disconnect from mongo let's report it
    db.on('disconnected', function(){
        console.log('Disconnected from mongodb');
    });

    db.on('connected',function(){
        console.log('Connected to mongodb');
    });

//make sure that we are closing the connection to mongo if something happens to node (like Ctrl + C)
    process.on('SIGINT', function() {
        mongoose.connection.close(function () {
            process.exit(0);
        });
    });
    return {
        //redisClient: null,
        //mongo: connection
    }
}

module.exports = initializeDB();