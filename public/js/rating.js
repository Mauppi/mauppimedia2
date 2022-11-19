var rstars = Array.from(document.getElementsByClassName("rating-star"));

console.log(rstars);

function clickStar(id) {
    rstars.forEach(star => {
        if (rstars.indexOf(star) <= id) {
            star.src = "/static/img/rating/star_yellow.png";
        } else {
            star.src = "/static/img/rating/star_gray.png";
        }
    });
}