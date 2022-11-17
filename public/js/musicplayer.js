var music = document.getElementById('music');
var progress = document.getElementById("player-prog");

function startMusic() {
    if (music.paused) {
        music.play();
    } else {
        music.pause();
    }
}

setInterval(() => {
    progress.max = music.duration;
    progress.value = music.currentTime;
    progress.innerHTML = toString(music.currentTime) + "/" + toString(music.duration) + " Seconds";
}, 500);