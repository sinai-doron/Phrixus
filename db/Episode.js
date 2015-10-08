var mongoose = require('mongoose');

var episodeSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    Combined_episodenumber: Number,
    Combined_season: Number,
    DVD_chapter: String,
    DVD_discid: String,
    DVD_episodenumber: Number,
    DVD_season: Number,
    Director: String,
    EpImgFlag: String,
    EpisodeName: String,
    EpisodeNumber: Number,
    FirstAired: Date,
    GuestStars: [String],
    IMDB_ID: String,
    Language: String,
    Overview: String,
    ProductionCode: String,
    Rating: Number,
    RatingCount: Number,
    SeasonNumber: Number,
    Writer: [String],
    absolute_number: Number,
    filename: String,
    lastupdated: Date,
    seasonid: String,
    seriesid: String,
    thumb_added: Date,
    thumb_height: Number,
    thumb_width: Number
});


module.exports = mongoose.model('Episode', episodeSchema);