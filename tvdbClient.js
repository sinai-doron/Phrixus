var request = require("request"),
    parser  = require("xml2js").parseString,
    Zip     = require("jszip"),
    _       = require("lodash"),
    Promise = require("bluebird");

var RESPONSE_TYPE = {
    XML: 0,
    ZIP : 1
}

// options for xml2js parser
var PARSER_OPTS = {
    trim: true,
    normalize: true,
    ignoreAttrs: true,
    explicitArray: false,
    emptyTag: null
};

var intervals = ["day", "week", "month", "all"];

function Client(apiKey, language){
    if(!apiKey || (_.trim(apiKey) === "")) throw new Error("Client need API KEY");

    this.apiKey = apiKey;
    this.language = language || "en";
    this.baseURL = "http://www.thetvdb.com/api";
}

Client.prototype.getLanguages = function(){
    var url = this.baseURL + "/" + this.apiKey + "/languages.xml";
    return sendRequest({url:url}, RESPONSE_TYPE.XML, normaliseResponse("Languages.Language"));
};

Client.prototype.getTime = function(){
    var url = this.baseURL + "/Updates.php?type=none";
    return sendRequest({url:url}, RESPONSE_TYPE.XML, normaliseResponse("Items.Time"));
};

Client.prototype.getSeriesByName = function(name) {
    var url =  this.baseURL + "/GetSeries.php?seriesname=" + encodeURIComponent(name) + "&language=" +  this.language;
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, normaliseResponse("Data.Series"));
}

Client.prototype.getSeriesById = function(id) {
    var url = this.baseURL + "/" + this.apiKey + "/series/" + id + "/" + this.language + ".xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, normaliseResponse("Data.Series"));
}

Client.prototype.getSeriesAllEpisodesById = function(id){
    var url = this.baseURL + "/" + this.apiKey + "/series/" + id + "/all/" + this.language + ".xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML,normaliseResponse("Data.Episode"));
};

Client.prototype.getSeriesByIdIncludingEpisodes = function(id){
    var url = this.baseURL + "/" + this.apiKey + "/series/" + id + "/all/" + this.language + ".xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML,normaliseResponse("Data"));
};

Client.prototype.getActors = function(id){
    var url = this.baseURL + "/" + this.apiKey + "/series/" + id + "/actors.xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML,normaliseResponse("Actors.Actor"));
};

Client.prototype.getBanners = function(id){
    var url = this.baseURL + "/" + this.apiKey + "/series/" + id + "/banners.xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML,normaliseResponse("Banners.Banner"));
};

Client.prototype.getEpisodeById = function(id){
    var url = this.baseURL + "/" + this.apiKey + "/episodes/" + id + "/" + this.language + ".xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML,normaliseResponse("Data.Episode"));
};

Client.prototype.getUpdatesForInterval = function(interval){
    if (_.indexOf(intervals, interval) === -1){
        interval = "day";
    }
    var url = this.baseURL + "/" + this.apiKey + "/updates/updates_" + interval + ".xml";
    console.log(url);
    return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, normaliseResponse("Data"));
};

Client.prototype.parsePipeList = function(list) {
    return list.replace(/(^\|)|(\|$)/g, "").split("|");
}

function sendRequest(urlOpts, responseType, normalise, cb){
    return new Promise(function(resolve, reject){
        var reqOpts = {url: urlOpts.url};
        if (responseType === RESPONSE_TYPE.ZIP) {
            reqOpts.encoding = null;
        }

        request(reqOpts, function(error, resp, data) {
            if (!responseOk(error, resp, data)) {
                if (!error) {
                    error = new Error("Could not complete the request");
                }
                error.statusCode = resp ? resp.statusCode : undefined;

                reject(error);
            } else if (error) {
                return reject(error);
            }

            parseXML(data, normalise, function(error, results) {
                if(error){
                    return reject(error);
                }
                return resolve(results);
            });
        });
    }).nodeify(cb);
}

function parseXML(data, normalise, callback) {
    parser(data, PARSER_OPTS, function(error, results) {
        if (results && results.Error) {
            return callback(new Error(results.Error));
        }
        if(normalise){
            normalise(results, function(results) {
                if(results === undefined){
                    return callback(new Error("Requested object not found in result"));
                }
                callback(error, results);
            });
        }
        else{
            callback(error, results);
        }
    });
}

function normaliseResponse(mask){
    return function(object, done){
        return done(_.get(object, mask));
    }
}

function responseOk(error, resp, data) {
    if (error) return false;
    if (!resp) return false;
    if (resp.statusCode !== 200) return false;
    if (!data) return false;

    // if dealing with zip data buffer is okay
    if (data instanceof Buffer) return true;

    if (data === "") return false;
    if (data.indexOf("404 Not Found") !== -1) return false;

    return true;
}

module.exports = Client;