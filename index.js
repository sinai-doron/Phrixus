#!/usr/local/bin/ node
var dbManager = require("./dbManager");
var cynwrig = require("cynwrig");
var moment = require("moment");
var _ = require("lodash");
var Promise = require('bluebird');
var config = require('config');
var utils = require('./utils');


cynwrig.colorMyConsole();
//dbManager.findSeries("Zoo",function(show){
//    console.log(show);
//});
//db.shows.find({},{SeriesName:1, id:1});
//
//dbManager.addEpisode("2106491").then(function(show){
//    console.log("1!");
//});
//dbManager.addSeries("161461").then(function(show){
//    console.log("1!");
//    dbManager.addEpisodes("161461").then(function(show){
//        console.log("Done!");
//    },function(err){console.log(err)});
//});
//dbManager.addSeries("95011").then(function(show){
//    console.log("1!");
//    dbManager.addEpisodes("95011").then(function(show){
//        console.log("Done!");
//    },function(err){console.log(err)});
//});
//https://kat.cr/zoo-tv22540/



dbManager.findSeries("the big bang theory").then(function(data){
    console.log(_.isArray(data) ? console.log(data.length) : console.log(data));
    dbManager.findSeries("zoo").then(function(data){
        console.log(_.isArray(data) ? console.log(data.length) : console.log(data));
        dbManager.findSeries("modern").then(function(data){
            console.log(_.isArray(data) ? console.log(data.length) : console.log(data));
        })
    })
})

//dbManager.addUrlToShow(161461, "https://kat.cr/rizzoli-isles-tv11750/");
//dbManager.findEpisodesByShowIdAndSeason(161461, 4).then(function(episodes){
//    startEpisodesDownloadAndSendMail(episodes);
//})


//dbManager.updateDb("week");
dbManager.findEpisodeBetweenDates(moment().subtract(3, "day")).then(function(results){
    utils.startEpisodesDownloadAndSendMail(results);
});



