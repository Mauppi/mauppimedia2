var music = document.getElementById('music');
var progress = document.getElementById("player-prog");
var progresst = document.getElementById("player-prog-text");

function startMusic() {
    if (music.paused) {
        music.play();
    } else {
        music.pause();
    }
}

setInterval(() => {
    progress.max = music.duration;
    if (!music.seeking) {
        progress.value = music.currentTime;
    }}, 1000);

setInterval(() => {
    progresst.innerHTML = Math.floor(music.currentTime / 60) + ":" + parseInt(music.currentTime - Math.floor(music.currentTime / 60) * 60) + "/" + Math.floor(music.duration / 60) + ":" + parseInt(music.duration - Math.floor(music.duration / 60) * 60) + "";
}, 250);