var mongoose = require('mongoose');

var showSchema = new mongoose.Schema({
    id: String,
    Actors: [String],
    Airs_DayOfWeek: String,
    Airs_Time: String,
    ContentRating: String,
    FirstAired: Date,
    Genre: [String],
    IMDB_ID: String,
    Language: String,
    Network: String,
    NetworkID: String,
    Overview: String,
    Rating: Number,
    RatingCount: Number,
    Runtime: Number,
    SeriesID: String,
    SeriesName: String,
    Status: String,
    added: Date,
    addedBy: String,
    banner: String,
    fanart: String,
    lastupdated: Date,
    poster: String,
    tms_wanted_old: String,
    zap2it_id: String,
    episodes: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Episode'} ],
    kickassUrl: String
});


module.exports = mongoose.model('Show', showSchema);



