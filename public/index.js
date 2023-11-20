import { createCookie, getCookie, deleteCookie } from "./js/cookieUtil.js";
import { createLoadingScreen, removeLoadingScreen } from "./js/loadingScreen.js";

let user = getCookie("user");
let fileData = null;

createLoadingScreen();

document.querySelector(".chat-box .chat-header .profileEditor #profilePic").addEventListener("click", () => {
    let profileEditor = document.querySelector(".userSettings");
    let visible = profileEditor.style.display === "block";

    document.querySelector(".userSettings").style.display = visible ? "none" : "block";
});

document.querySelector(".userSettings .imageEditor #saveProfile").addEventListener("click", (e) => {
    e.preventDefault();
    
    let formData = new FormData();
    formData.append("profile", fileData);
    formData.append("username", JSON.parse(user).username);
    formData.append("password", JSON.parse(user).password);

    fetch("/api/user/profile/update", {
        method: "POST",
        body: formData
    });

    document.querySelector(".userSettings .imageEditor #saveProfile").style.display = "none";
    document.querySelector(".chat-box .chat-header .profileEditor #profilePic").src = res.profile;
    document.querySelector(".userSettings").style.display = "none";
});

document.querySelector(".userSettings .imageEditor #profileImage").addEventListener("change", (e) => {
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.onloadend = () => {
        let image = document.querySelector(".userSettings .imageEditor #uploadedImg");
        image.style.window = "100px";
        image.style.height = "100px";
        image.style.borderRadius = "50%";
        image.src = reader.result;

        document.querySelector(".userSettings .imageEditor #saveProfile").style.display = "block";
    };

    reader.readAsDataURL(file);
    fileData = file;
});


if(user) {
    let json = JSON.parse(user);
    requestLogin(json.username, json.password);
    requestProfile(json.username, json.password);

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

function requestProfile(username, password) {
    let user = {
        username,
        password
    };

    fetch("/api/user/request/self", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    })
    .then(res => res.json())
    .then((res) => {
        if(res.status && res.status === 200) {
            let profileName = document.querySelector(".chat-box .chat-header .profileEditor #profileName");
            profileName.innerHTML = res.user.username;

            let profilePic = document.querySelector(".chat-box .chat-header .profileEditor #profilePic");
            profilePic.src = res.user.profile;
        }
    });
}