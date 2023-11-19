import { createCookie, getCookie, deleteCookie } from "./js/cookieManager.js";
import { createLoadingScreen, removeLoadingScreen } from "./js/loadingScreen.js";

let user = getCookie("user");

createLoadingScreen();

if(user) {
    let json = JSON.parse(user);
    requestLogin(json.username, json.password);

    setTimeout(() => {
        import("./js/main.js");
        removeLoadingScreen();
    }, 500);
} else {
    removeLoadingScreen();
    window.location.href = "/login";
}

function requestLogin(username, password) {
    let user = {
        username,
        password
    };

    fetch("/api/user/request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    .then(res => res.json())
    .then((res) => {
        if(res.message.includes("Successful login")) {
            let cookie = `{"username": "${res.user.username}", "password": "${res.user.password}"}`;
            createCookie("user", cookie);
        } else {
            deleteCookie("user");
            removeLoadingScreen();
            window.location.href = "/login";
        }
    });
}