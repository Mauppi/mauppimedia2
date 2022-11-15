var music = document.getElementById('music');

function startMusic() {
    if (music.paused) {
        music.play();
    } else {
        music.pause();
    }
}