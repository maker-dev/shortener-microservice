const mongoose = require("mongoose");

const ShortUrlSchema = mongoose.Schema({
    original_url: {
        type: String,
        required: true
    },
    short_url: {
        type: Number,
        required: true
    }
});

const ShortUrl = mongoose.model("shorturls", ShortUrlSchema);

module.exports = ShortUrl;