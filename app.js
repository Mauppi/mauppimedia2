const express = require('express');
const app = express();
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
var fileupload = require("express-fileupload");
app.use(fileupload());

app.set('view engine', 'ejs');

const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);

    console.log("Connection established to database");
});

db.run("CREATE TABLE IF NOT EXISTS songs (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255) NOT NULL, artist VARCHAR(255) NOT NULL, album VARCHAR(255) NOT NULL, audio_path VARCHAR(255) NOT NULL, image_path VARCHAR(255) NOT NULL, streams INTEGER DEFAULT 0)");


app.use("/static", express.static('public'));

app.get("/", function (req, res) {
    db.all("SELECT * FROM songs LIMIT 15 ORDER RANDOM", function (err, rows) {
        res.render("index", {songs: rows});
    });
});

app.get("/create/song", function (req, res) {
    res.render("create/song");
});

app.post("/create/song", body("title").not().isEmpty().escape(), body("artist").not().isEmpty().escape(), body("album").not().isEmpty().escape(), function (req, res) {
    console.log(req.files);
    var songFile = req.files.song_file
    var coverFile = req.files.cover_file
    if (songFile.mimetype != "audio/mpeg" || songFile.size >= 10000000) {
        return res.send("Song File invalid!");
    }
    if (coverFile.mimetype != "image/jpeg" && coverFile.mimetype != "image/png" || coverFile.size >= 10000000) {
        return res.send("Cover File invalid!");
    }
    var uniqueID = uuidv4();
    var songFilePath = "./music/" + uniqueID + "." + songFile.name.split('.').pop();
    var coverFilePath = "./public/img/songcovers/" + uniqueID + "." +  coverFile.name.split('.').pop();
    songFile.mv(songFilePath);
    coverFile.mv(coverFilePath);
    db.run("INSERT INTO songs (id, title, artist, album, audio_path, image_path) VALUES (?, ?, ?, ?, ?, ?)", uniqueID, req.body.title, req.body.artist, req.body.album, songFilePath, coverFilePath);
    console.log("A new song was uploaded with uuid: " + toString(uniqueID) + " and name of: " + req.body.title + ". Song File path: " + songFilePath + ", Cover File path: " + coverFilePath);
    res.redirect("/");
});

app.get("/listen", function (req, res) {
    if (!req.query.song)
        res.redirect("/");
    
    db.get("SELECT 1 FROM songs WHERE song_id=?", req.query.song, function (err, row) {
        if (!row) res.redirect("/");

        res.render("listen", {
            title: row.title,
            artist: row.artist,
            album: row.album,
            id: row.id
        });
    });
});

app.get("/api/audio/:id", function (req, res) {
    const range = req.headers.range;
    if (!fs.existsSync("music/" + toString(req.params.id) + ".mp3")) {
        return console.log("File" + req.params.id +".mp3 does not exist.");
    }
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const audioPath = "music/" + toString(req.params.id) + ".mp3";
    const audioSize = fs.statSync("music/" + toString(req.params.id) + ".mp3").size;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, audioSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${audioSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "audio/mpeg",
    };
    res.writeHead(206, headers);
    const audioStream = fs.createReadStream(audioPath, { start, end });
    audioStream.pipe(res);
});

app.listen(8000, function () {
    console.log('listening on port 8000');
});

/*db.close((err) => {
    if (err) return console.error(err.message);
});*/