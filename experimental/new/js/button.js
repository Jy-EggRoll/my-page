const box = document.getElementById("mybox");
const button = document.getElementsByClassName("transition_button");
for (let i = 0; i < button.length; i++) {
    button[i].addEventListener("click", function () {
        box.style.width = "90%";
        box.style.height = "80%";
    });
}
const back = document.getElementById("back");
back.addEventListener("click", function () {
    box.style.width = "50%";
    box.style.height = "50%";
});