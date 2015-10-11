var request = require('request');
var jsdom = require("jsdom");
var _ = require("lodash");
var Promise = require('bluebird');
var baseUrl ="https://kat.cr/media/getepisode/";
var mkdirp = require("mkdirp");
var fs = require("fs");
var config = require('config');


function downloadFile(url, folder, fileName){
    return new Promise(function(resolve, reject) {
        var ret = [];
        var len = 0;
        var zlib = require("zlibjs");
        request({
            url:url,
            gzip:true,
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        }).on('error', function(err) {
            reject("Error downloading file from: " + url + err);
        }).on('response', function(res){
            console.log("got response from file location");

            res.on('data', function (data) {
                ret.push(data);
                len += data.length;
            });

            res.on('end', function(){
                var buffer = Buffer.concat(ret, len);
                var encoding = res.headers['content-encoding'];
                var folderName = config.get("downloadFolder") + folder + "/";
                mkdirp(folderName,function(err){
                    if(err){
                        return reject("Failed to create folder");
                    }
                    var wstream = fs.createWriteStream(folderName + fileName);
                    if (encoding == 'gzip') {
                        zlib.gunzip(buffer, function(err, decoded) {
                            wstream.write(decoded);
                            wstream.end();
                        });
                    } else if (encoding == 'deflate') {
                        zlib.inflate(buffer, function(err, decoded) {
                            wstream.write(decoded);
                            wstream.end();
                        })
                    } else {
                        wstream.write(buffer.toString());
                        wstream.end();
                    }
                    resolve(fileName);
                });
            });


        });
    });
}

function getEpisodeSegmentFromSeriesPage(url, seasonNumber, episodeNumber, seriesName){
    return new Promise(function(resolve, reject){
        console.log("Requesting using jsdom "+ url)
        request({
            url: url,
            gzip:true
        },  function(error, response, body) {
            jsdom.env({
                html: body,
                scripts: ["http://code.jquery.com/jquery.js"],
                done: function (errors, window) {
                    if(errors){
                        return reject(errors);
                    }
                    var $ = window.$;
                    if(seasonNumber < 10){
                        seasonNumber = '0' + seasonNumber;
                    }
                    if(episodeNumber < 10){
                        episodeNumber = '0' +episodeNumber;
                    }
                    var header = $.find('h3:contains("Season ' + seasonNumber + '")');
                    if(!header || (header.length === 0)){
                        return reject("Could not find header for " + seasonNumber + "in show " + seriesName);
                    }
                    var episodeSpan = $(header).next('div').find('span:contains("Episode ' + episodeNumber + '")');
                    if(!episodeSpan || (episodeSpan.length === 0)){
                        return reject("Could not find episode span for " + episodeNumber + "in show " + seriesName);
                    }
                    var episodeSegment = $(episodeSpan).parent().attr("onClick");

                    if(!episodeSegment){
                        return reject("No segment was found for "+ episodeNumber + "in show " + seriesName);
                    }
                    var segmentNumber = episodeSegment.split('\'')[1];
                    if(!segmentNumber){
                        return reject("No segment was found for "+ episodeNumber + "in show " + seriesName + " after splitting");
                    }
                    console.log("found the folowing segment", segmentNumber);
                    resolve(segmentNumber);
                }
            });
        });
    });
}

function getEpisodeSegment(segmentNumber, seriesName){
    console.log(segmentNumber, seriesName);
    return new Promise(function(resolve, reject){
        request({
            url: baseUrl + segmentNumber,
            gzip:true
        },  function(error, response, body) {
            jsdom.env({
                html: body,
                scripts: ["http://code.jquery.com/jquery.js"],
                done: function (errors, window) {
                    if(errors){
                        return reject(errors);
                    }
                    var $ = window.$;//HDTV XviD
                    console.log("Look for HDTV XviD files in segment " + segmentNumber + " for show " +seriesName);
                    var HDTVXviDNode = $.find('tr:contains("HDTV XviD")');
                    if(!HDTVXviDNode || (HDTVXviDNode.length===0)){
                        HDTVXviDNode = undefined;
                        console.log("No HDTV XviD Node was found for "+ segmentNumber + "in show " + seriesName);
                    }
                    console.log("Look for x264 files in segment " + segmentNumber + " for show " +seriesName);
                    var x264Node = $.find('tr:contains("x264")');
                    if(!x264Node || (x264Node.length === 0)){
                        return reject("No x264 Node was found for "+ segmentNumber + "in show " + seriesName);
                    }
                    var node = HDTVXviDNode || x264Node;
                    var torrentFileA = $(node).find(('a[title="Download torrent file"]'));
                    if(!torrentFileA || (torrentFileA.length === 0)){
                        return reject("No torrent File A was found for "+ segmentNumber + "in show " + seriesName);
                    }
                    console.log("Torrent url found: " + torrentFileA[0].href);
                    resolve(torrentFileA[0].href);
                }
            });
        });
    });
}

function getEpisodeTorrent(url, seasonNumber, episodeNumber, seriesName){
    return new Promise(function(resolve, reject){
        console.log("Going to request " + seriesName + " page from: " + url);
        if(!url || (url === "")){
           return reject("No url for " + seriesName)
        }
        getEpisodeSegmentFromSeriesPage(url, seasonNumber, episodeNumber, seriesName).then(function(data){
            getEpisodeSegment(data, seriesName).then(function(data){
                    if(data.startsWith("file:////")){
                        data = data.replace("file:////", "http://");
                    }
                    else if(data.startsWith("//")){
                        data = data.replace("//", "http://");
                    }
                console.log(data);
                downloadFile(data, seriesName, "" +seriesName+seasonNumber+episodeNumber + ".torrent").then(
                    function(fileName){
                        resolve(fileName);
                    },
                    function(error){
                        reject(error);
                    }
                );
            },
                function(error){
                    reject(error);
                });
        },
        function(error){
            reject(error);
        });
    });
}



module.exports = {
    getEpisodeTorrent: getEpisodeTorrent
}