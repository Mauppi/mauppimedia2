var progress = document.getElementById("player-prog");
var progresst = document.getElementById("player-prog-text");
var justSeeked = true;
var wasMusicPlaying = false;

function startMusic() {
    if (!sound.playing()) {
        sound.play();
    } else {
        sound.pause();
    }
}

function seektime() {
    wasMusicPlaying = !sound.paused
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
    if (!sound.seeking && !justSeeked) {
        progress.value = sound.seek();
    }}, 1000);

setInterval(() => {
    if (sound.readyState == 4)
    progresst.innerHTML = Math.floor(sound.seek() / 60) + ":" + parseInt(sound.seek() - Math.floor(sound.seek() / 60) * 60) + "/" + Math.floor(sound.duration() / 60) + ":" + parseInt(sound.duration() - Math.floor(sound.duration() / 60) * 60) + "";
}, 250);