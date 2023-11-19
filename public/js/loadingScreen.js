export let loading, loadingText, style;

export function createLoadingScreen() {
    loading = document.createElement("div");
    loading.id = "loading";
    loading.innerHTML = `
        <div id="loading-animation">
            <div id="loading-animation-circle"></div>
        </div>
    `;
    document.body.appendChild(loading);

    loadingText = document.createElement("p");
    loadingText.id = "loading-text";
    loadingText.innerHTML = "Loading...";
    loading.appendChild(loadingText);

    style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "../css/loading.css";
    document.head.appendChild(style);
}


export function removeLoadingScreen() {
    loading.removeChild(loadingText);
    document.body.removeChild(loading);
    document.head.removeChild(style);
}