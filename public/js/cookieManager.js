export function getCookie(cName) {
    let name = cName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let cookieArray = decodedCookie.split(";");

    for(let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];

        while(cookie.charAt(0) == " ") {
            cookie = cookie.substring(1);
        }

        if(cookie.indexOf(name) == 0) {
            return cookie.substring(name.length, cookie.length);
        }
    }

    return "";
}

export function createCookie(cName, cValue) {
    let cookie = `${cName}=${cValue}; path=/`
    document.cookie = cookie;
}

export function deleteCookie(cName) {
    document.cookie = `${cName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}