#!/usr/local/bin/ node
var dbManager = require("./dbManager");
var cynwrig = require("cynwrig");
var moment = require("moment");
var kickass = require("./kickass");
var _ = require("lodash");
var Promise = require('bluebird');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var config = require('config');

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

function sendMail(mailData){
    var options = JSON.stringify(config.get("emailConfiguration"));
    options = JSON.parse(options);
    var transporter = nodemailer.createTransport(smtpTransport(options));
    var emails = config.get("emails");
    var to = "";
    if(emails instanceof Array){
        for(var i=0; i < emails.length; i++){
            to += emails[i];
            if(i != (emails.length-1))
                to += ',';
        }
    }
    else{
        to = emails;
    }

    transporter.sendMail({
        from: options.auth.user,
        to: to,
        subject: mailData.subject,
        text: mailData.text
    }, function (err, info) {
        if(err){
            console.log("Error sending mail");
        }
    });
}

function startEpisodesDownloadAndSendMail(episodes){
    var promises = [];
    _.forEach(episodes,function(r){
        var p = kickass.getEpisodeTorrent(r.url, r["SeasonNumber"], r["EpisodeNumber"], r.name);
        promises.push(p);
    });
    Promise.settle(promises).then(function(results){
        var failed = [];
        var success = [];
        var mailData = {};

        for(var i=0; i<results.length; i++){
            if(results[i].isRejected()){
                console.error("Rejected the following " + results[i].reason());
                failed.push(results[i].reason());
            }
            else{
                console.info(results[i].value());
                success.push(results[i].value());
            }
        }
        mailData["subject"] = success.length + " Shows were downloaded successfully and " + failed.length + " failed";
        mailData["text"] = "Success: \n";
        _.forEach(success,function(s){
            mailData["text"] += s + "\n";
        });
        mailData["text"] += "\nFailed: \n";
        _.forEach(failed,function(f){
            mailData["text"] += f + "\n";
        });
        sendMail(mailData);
        console.log("Mail sent");
    });
}
//https://kat.cr/rizzoli-isles-tv11750/
//dbManager.addUrlToShow(161461, "https://kat.cr/rizzoli-isles-tv11750/");
dbManager.findEpisodesByShowIdAndSeason(161461, 4).then(function(episodes){
    startEpisodesDownloadAndSendMail(episodes);
})


//dbManager.updateDb("day");
//dbManager.findEpisodeBetweenDates(moment().subtract(14, "days")).then(function(results){
//    startEpisodesDownloadAndSendMail(results);
//});



