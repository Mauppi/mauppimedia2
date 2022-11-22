const express = require('express');
const app = express();
const fs = require('fs');
const bodyParser = require("body-parser");
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const sharp = require('sharp');
var fileupload = require("express-fileupload");
const { exec } = require('child_process');
const { stderr } = require('process');
const passport = require("passport");
const rateLimit = require('express-rate-limit');

app.use(fileupload());

const apiRateConf = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});

app.use("/api", apiRateConf);

app.set('view engine', 'ejs');

const db = new sqlite3.Database("./database.db", sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);

    console.log("Connection established to database");
});

db.run("CREATE TABLE IF NOT EXISTS songs (id VARCHAR(255) PRIMARY KEY, title VARCHAR(255) NOT NULL, artist VARCHAR(255) NOT NULL, album VARCHAR(255) NOT NULL, audio_path VARCHAR(255) NOT NULL, image_path VARCHAR(255) NOT NULL, streams INTEGER DEFAULT 0, score INTEGER DEFAULT 10)");


app.use("/static", express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

setInterval(() => {
    db.run("UPDATE songs SET score=score-15");
    console.log("Score substracted!");
}, 350000);

app.get("/", function (req, res) {
    db.all("SELECT * FROM songs ORDER BY score LIMIT 15 ", function (err, rows) {
        console.log("err: " + err + "\nrows: " + rows);

        var rowit = [];
        rows.forEach(row => {
            
            var coverPathi = row.image_path

            coverPathi = coverPathi.slice(1);
            coverPathi = coverPathi.replace("public", "static");

            row.image_path = coverPathi
        });

        res.render("index", {songs: rows.reverse()});
    });
});

app.get("/create/song", function (req, res) {
    res.render("create/song");
});

app.post("/create/song", body("title").not().isEmpty().escape(), body("artist").not().isEmpty().escape(), body("album").not().isEmpty().escape(), function (req, res) {
    console.log(req.files);
    var songFile = req.files.song_file
    var coverFile = req.files.cover_file
    if (songFile.mimetype != "audio/mpeg" && songFile.mimetype != "audio/x-flac" && songFile.mimetype != "audio/wav" && songFile.size >= 10000000) {
        return res.send("Song File invalid!");
    }
    if (coverFile.mimetype != "image/jpeg" && coverFile.mimetype != "image/png" || coverFile.size >= 10000000) {
        return res.send("Cover File invalid!");
    }
    var uniqueID = uuidv4();
    var songFilePath = "./tempmusic/" + uniqueID + "." + songFile.name.split('.').pop();
    var fsongFilePath = "./music/" + uniqueID + ".mp3";
    var coverFilePath = "./tempcover/" + uniqueID + "." +  coverFile.name.split('.').pop();
    var fcoverFilePath = "./public/img/songcovers/" + uniqueID + ".png";
    songFile.mv(songFilePath, (err) => {
        if (err) return console.log(toString(err));
        exec("ffmpeg.exe -i \"" + songFilePath +"\" -c:v libx264 -ar 44100 -rematrix_maxval 1.0 -ac 2 -b:a 256k -af \"volume=0.55,acontrast=0.45\" \"" + fsongFilePath + "\"", stderr => (err) => {
            if (err) return console.log(toString(err));
        });
    });
    coverFile.mv(coverFilePath, (err) => {
        if (err) return console.log(toString(err));
        sharp(coverFilePath).resize(1000).png().toFile(fcoverFilePath).catch(err => {
            if (err) return console.log(toString(err));
        });
    });
    db.run("INSERT INTO songs (id, title, artist, album, audio_path, image_path) VALUES (?, ?, ?, ?, ?, ?)", uniqueID, req.body.title, req.body.artist, req.body.album, fsongFilePath, fcoverFilePath);
    console.log("A new song was uploaded with uuid: " + toString(uniqueID) + " and name of: " + req.body.title + ". Song File path: " + fsongFilePath + ", Cover File path: " + fcoverFilePath);
    res.redirect("/");
});

app.get("/listen", function (req, res) {
    if (!req.query.song)
        return res.redirect("/");
    
    db.get("SELECT * FROM songs WHERE id=?", req.query.song, function (err, row) {
        if (!row) return res.redirect("/");

        var coverPathi = row.image_path

        coverPathi = coverPathi.slice(1);
        coverPathi = coverPathi.replace("public", "static");

        db.run("UPDATE songs SET score=score+1 WHERE id='" + row.id + "'");

        res.render("listen", {
            title: row.title,
            artist: row.artist,
            album: row.album,
            id: row.id,
            img: coverPathi
        });
    });
});

app.post("/api/listenscore/:di/:sc", function(req, res) {
    if (!req.params.di || !req.params.sc) return;
    if (req.params.sc > 30) return;

    db.run("UPDATE songs SET score=score+1 WHERE id='" + req.params.di + "'");

    console.log("Score Update listen received");

});

app.get("/api/audio/:di", function (req, res) {
    const range = req.headers.range;
    if (!req.params.di) {
        console.log("req param head");
        return res.status(400).send("Requires Param header");
    }
    var pathi = "./music/" + req.params.di + ".mp3";
    console.log(req.params);
    console.log(pathi);
    try {
        fs.accessSync(pathi);
    }
    catch(err) {
        res.redirect("/");
        return console.log("File music/" + req.params.di +".mp3 does not exist. Err" + err);
    }
    if (!range) {
        console.log("req range head");
        return res.status(400).send("Requires Range header");
    }
    const audioPath = "music/" + req.params.di + ".mp3";
    const audioSize = fs.statSync("music/" + req.params.di + ".mp3").size;
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
    console.log('main listening on port 8000');
});

/*db.close((err) => {
    if (err) return console.error(err.message);
});*/