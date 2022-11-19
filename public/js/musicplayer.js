var progress = document.getElementById("player-prog");
var progresst = document.getElementById("player-prog-text");
var justSeeked = true;
var wasMusicPlaying = false;
var scoreUpdater = new XMLHttpRequest();
var id
var howmanyscorestosend = 0;

function startMusic() {
    if (!sound.playing()) {
        sound.play();
    } else {
        sound.pause();
    }
}

function seektime() {
    wasMusicPlaying = sound.playing()
    sound.pause();
    sound.seek(progress.value);
    justSeeked = true;
}

function onmload() {
    if (justSeeked) {
        sound.play();
    }
    justSeeked = false;
}


sound.on("seek", function seekingkku() {
    if (wasMusicPlaying) {
        sound.play();
    }
});

setInterval(() => {
    progress.max = sound.duration();
    progress.value = sound.seek();
    if (sound.playing()) {
        howmanyscorestosend += 1
    }
    }, 1000);

setInterval(() => {
    progresst.innerHTML = Math.floor(sound.seek() / 60) + ":" + parseInt(sound.seek() - Math.floor(sound.seek() / 60) * 60) + "/" + Math.floor(sound.duration() / 60) + ":" + parseInt(sound.duration() - Math.floor(sound.duration() / 60) * 60) + "";
}, 250);

setInterval(() => {
    scoreUpdater.open("POST", "/api/listenscore/" + id + "/" + howmanyscorestosend, true);
    scoreUpdater.send();
    console.log(howmanyscorestosend);
    howmanyscorestosend = 0;
}, 20000);