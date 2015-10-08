var mongoose = require('mongoose');
var db = require("./db/db");
var TVDB = require("./tvdbClient");
var config = require("config");
console.log(config.get("apiKey"));
var tvdb = new TVDB(config.get("apiKey"));
var _ = require("lodash");
var Show = require("./db/Show");
var Episode = require("./db/Episode");
var moment = require("moment");
var Promise = require('bluebird');

function findSeries(name, cb){
    tvdb.getSeriesByName(name).then(function(data){
        cb(data);
    });
}

function getEpisodeById(id){
    return new Promise(function(resolve,reject){
        Episode.findOne({id: id}, function(err,episode){
            if(err){
                return reject(err);
            }
            if(episode === null){
                return reject("No such episode");
            }
            resolve(episode);
        });
    });
}

function createEpisodeObj(episode){
    return new Episode({
        id: episode.id,
        Combined_episodenumber: Number.isNaN(Number.parseInt(episode.Combined_episodenumber)) ? 0: Number.parseInt(episode.Combined_episodenumber),
        Combined_season: Number.isNaN(Number.parseInt(episode.Combined_season)) ? 0: Number.parseInt(episode.Combined_season),
        Director: episode.Director,
        EpImgFlag: episode.EpImgFlag,
        EpisodeName: episode.EpisodeName,
        EpisodeNumber: Number.isNaN(Number.parseInt(episode.EpisodeNumber)) ? 0: Number.parseInt(episode.EpisodeNumber),
        FirstAired: moment(episode.FirstAired,"YYYY-MM-DD").toDate(),
        GuestStars: episode.GuestStars ? tvdb.parsePipeList(episode.GuestStars) : [],
        IMDB_ID: episode.IMDB_ID,
        Language: episode.Language,
        Overview: episode.Overview,
        ProductionCode: episode.ProductionCode,
        Rating: Number.isNaN(Number.parseFloat(episode.Rating)) ? 0: Number.parseFloat(episode.Rating),
        RatingCount: Number.isNaN(Number.parseFloat(episode.RatingCount)) ? 0: Number.parseFloat(episode.RatingCount),
        SeasonNumber: Number.isNaN(Number.parseInt(episode.SeasonNumber)) ? 0: Number.parseInt(episode.SeasonNumber),
        Writer: episode.Writer ? tvdb.parsePipeList(episode.Writer) : [],
        absolute_number: Number.isNaN(Number.parseInt(episode.absolute_number)) ? 0: Number.parseInt(episode.absolute_number),
        filename:  episode.filename,
        lastupdated: Date.now(),
        seasonid:  episode.seasonid,
        seriesid:  episode.seriesid,
        thumb_added: Date.now(),
        thumb_height: Number.isNaN(Number.parseInt(episode.thumb_height)) ? 0: Number.parseInt(episode.thumb_height),
        thumb_width: Number.isNaN(Number.parseInt(episode.thumb_width)) ? 0: Number.parseInt(episode.thumb_width)
    });
}

function createShowObj(data){
    return new Show({
        id: data.id,
        Actors: tvdb.parsePipeList(data.Actors),
        Airs_DayOfWeek: data.Airs_DayOfWeek,
        Airs_Time: data.Airs_Time,
        ContentRating: data.ContentRating,
        FirstAired: moment(data.FirstAired, "YYYY-MM-DD").toDate(),
        Genre: tvdb.parsePipeList(data.Genre),
        IMDB_ID: data.IMDB_ID,
        Language:  data.Language,
        Network:  data.Network,
        NetworkID:  data.NetworkID,
        Overview:  data.Overview,
        Rating: Number.isNaN(Number.parseFloat(data.Rating)) ? 0: Number.parseFloat(data.Rating),
        RatingCount: Number.isNaN(Number.parseFloat(data.RatingCount)) ? 0: Number.parseFloat(data.RatingCount),
        Runtime: Number.isNaN(Number.parseFloat(data.Runtime)) ? 0: Number.parseFloat(data.Runtime),
        SeriesID:  data.SeriesID,
        SeriesName:  data.SeriesName,
        Status:  data.Status,
        added: Date.now(),
        addedBy:  data.addedBy,
        banner:  data.banner,
        fanart:  data.fanart,
        lastupdated: Date.now(),
        poster:  data.poster,
        tms_wanted_old:  data.tms_wanted_old,
        zap2it_id:  data.zap2it_id
    });
}

function addSeries(id, cb){
    console.info("Going to retrieve data for series " + id);
    return new Promise(function(resolve, reject){
        tvdb.getSeriesById(id).then(
            function(data){
                console.info("Retrieved data successfully for " + id);
                Show.findOne({id: id},function(err, show){
                    if(err){
                        console.error("Error finding series " + id + " in db");
                        return reject(err);
                    }
                    if(show === null){
                        var newShow = createShowObj(data);
                        console.info("Created new show object " + newShow.SeriesName);
                        newShow.save(function(err){
                            if(err){
                                return reject(err);
                            }
                            return resolve(newShow);
                        });
                    }
                    else{
                        console.info("Found show in db " + show.seriesName + " Going to update");
                        var newTempShow = createShowObj(data);
                        var keys = _.keys(data);
                        _.forEach(keys, function(k){
                            if(k !== "id"){
                                show[k] = newTempShow[k]
                            }
                        });
                        show.save(function(err){
                            if(err){
                                return reject(err);
                            }
                            return resolve(show);
                        });
                    }
                });
            },
            function(error){
                console.error("Error retrieving data for series " + id + ": " + error);
                reject(error);
        });
    });
};

function addEpisode(episodeId, cb){
    console.info("Going to add once episode: " + episodeId);
    return new Promise(function(resolve,reject){
        Episode.findOne({id: episodeId}, function(err,episode){
            if(err){
               return reject(err);
            }
            if(episode === null){
                tvdb.getEpisodeById(episodeId).then(
                    function(data){
                        var newEpisode = createEpisodeObj(data);
                        console.log("Got the following episode", data);
                        console.log("Created the following episode object", newEpisode);
                        newEpisode.save(function(err){
                            if(err){
                                return reject(err);
                            }
                                Show.findOne({id:newEpisode["seriesid"]},function(err, show){
                                    if(err){
                                        return reject(err);
                                    }
                                    if(show === null){
                                        return reject("show does not exist in db");
                                    }
                                    show["episodes"] = show["episodes"].push(newEpisode);
                                    show.save(function(err){
                                        if(err){
                                            return reject(err);
                                        }
                                        resolve(newEpisode);
                                    });
                                });
                            return resolve(newEpisode);
                        });
                    },
                    function(error){
                        reject(error);
                    }
                );
            }
            else{
                tvdb.getEpisodeById(episodeId).then(
                    function(data){
                        var newTempEpisode = createEpisodeObj(data);
                        var keys = _.keys(data);
                        _.forEach(keys, function(k){
                            if(k !== "id"){
                                episode[k] = newTempEpisode[k]
                            }
                        });
                        episode.save(function(err){
                            if(err){
                                return reject(err);
                            }
                            resolve(episode);
                        })
                    },
                    function(error){
                        reject(error);
                    }
                );
            }
        });
    });
}

function addEpisodes(id, cb){
    console.info("Going to find show in db " + id);
    return new Promise(function(resolve, reject){
        Show.findOne({id:id},function(err, show){
            if(err){
                return reject(err);
            }
            if(show === null){
                return reject("show does not exist in db");
            }
            console.info("Going to retrieve episodes for series " + show.SeriesName);
            tvdb.getSeriesAllEpisodesById(id).then(
                function(data){
                    var episodesList = [];
                    console.log(data.length);
                    _.forEach(data, function(episode){
                        console.info("Going to create episode object " + episode.EpisodeName);
                        episodesList.push(createEpisodeObj(episode).toObject());
                    });
                    Episode.collection.insert(episodesList,function(err, response){
                        console.info("Going to insert " + episodesList.length + " episodes to db");
                        if(err){
                            return reject(err);
                        }
                        var insertedCount = _.get(response, "insertedCount");
                        var insertedIds = _.get(response, "insertedIds");
                        var ops = _.get(response, "ops");
                        if(insertedCount !== episodesList.length){
                            console.error("Not all episodes were inserted ");
                        }
                        show["episodes"] = show["episodes"].concat(insertedIds);
                        show.save(function(err){
                            if(err){
                                return reject(err);
                            }
                            resolve(ops);
                        });
                    });
                },
                function(error){
                    reject(error);
                }
            );
        });
    });
};

//if no start or end date one day will be taken into account
function findEpisodeBetweenDates(start, end){
    return new Promise(function(resolve,reject){
        if(!start){
            start = moment().hour(0).minute(0).seconds(0).subtract(1, "day").toDate();
            end = moment().toDate()
        }
        else if(!end){
            start = start.toDate();
            end = moment().toDate();
        }
        else{
            start = start.toDate();
            end = end.toDate();
        }
        Episode.find({FirstAired:{$gte:start, $lt:end}},function(err, results){
            if(err){
                reject(err);
            }
            console.info("Found the following shows:");
            addUrlandSeriesName(results).then(function(data){
                resolve(data);
            })

        });
    });
}

function addUrlandSeriesName(episodes){
    return new Promise(function(resolve, reject){
        var query = Show.find({});
        query.exec().then(function(results){
            var showsMap = {};
            _.forEach(results, function(s){
                showsMap[s["id"]] = {name: s["SeriesName"], url:s["kickassUrl"]}
            });
//            console.log(showsMap);
            _.forEach(episodes, function(e){
                e["url"] = showsMap[e["seriesid"]].url;
                e["name"] = showsMap[e["seriesid"]].name;
            });

            resolve(episodes);
        });
    });
}

function addUrlToShow(id, url){
    return new Promise(function(resolve, reject){
        Show.findOne({id:id},function(err, show){
            if(err){
                reject(err);
            }
            if(show === null){
                reject("No show found");
            }
            show["kickassUrl"] = url;
            show.save(function(err){
                if(err){
                    reject(err);
                }
                else{
                    resolve(show);
                }
            });
        });
    });
}

function updateDb(interval){
    return new Promise(function(resolve, reject){
        tvdb.getUpdatesForInterval(interval.toLowerCase()).then(
            function(data){
                var shows = config.get("shows");
                var showsFromData = data.Series;
                var episodesFromData = data.Episode;
                var promises = [];

                _.forEach(showsFromData, function(s){
                    var showId = _.pick(s, "id");
                    var result = _.find(shows, showId);
                    if(result){
                        var ps = addSeries(showId["id"]);
                        promises.push(ps);
                        console.log(result);
                    }
                });

                _.forEach(episodesFromData, function(e){
                    var seriesId = _.pick(e, "Series");
                    var result = _.find(shows, {id: seriesId.Series});
                    if(result){
                        var p = addEpisode(e["id"]);
                        promises.push(p);
                        console.log(e);
                    }
                });

                Promise.settle(promises).then(function(results){
                    var episodesCount = 0;
                    var showsCount = 0;
                    for(var i=0; i<results.length; i++){
                        if(results[i].isRejected()){
                            console.error("Rejected the following" + results[i].reason());
                        }
                        else{
                            if(results[i].value()["SeriesName"]){
                                showsCount++;
                                console.info("Updated the following: " + results[i].value()["SeriesName"]);
                            }
                            else{
                                episodesCount++;
                                console.info("Updated the following: " + results[i].value()["id"]);
                            }

                        }
                    }
                    resolve({episodesCount:episodesCount, showsCount:showsCount});
                })
            },
            function(error){
                console.error(error);
                reject(error);
            }
        );
    });
};

module.exports = {
    addSeries:addSeries,
    addEpisodes:addEpisodes,
    findSeries:findSeries,
    addEpisode:addEpisode,
    findEpisodeBetweenDates:findEpisodeBetweenDates,
    updateDb:updateDb,
    getEpisodeById:getEpisodeById,
    addUrlToShow:addUrlToShow
}