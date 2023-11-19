import { createCookie } from "../js/cookieManager.js";
import { createLoadingScreen, removeLoadingScreen } from "../js/loadingScreen.js";

const serverRespone = document.getElementById("serverRespone");
const form = document.querySelector("form");

form.addEventListener("submit", (e) => {
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;

    e.preventDefault();

    fetch("/api/user/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({username, password})
    })
    .then(res => res.json())
    .then((res, json) => {
        console.log(res);
        
        if(res.message.includes(`User`) && res.message.includes(`created`)) {
            createLoadingScreen();

            setTimeout(() => {
                let cookie = `{"username": "${res.user.username}", "password": "${res.user.password}"}`;
                createCookie("user", cookie);

                setInterval(() => { 
                    removeLoadingScreen();
                    window.location.href = "/";
                }, 500);
            }, 1000);
        }

        serverRespone.innerHTML = "<span>" + res.message + "</span>";
    })
    .catch(err => serverRespone.innerHTML = "<span style='color: red' id='respone'>" + err + "</span>");
});