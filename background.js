"use strict";

// these dicks would redirect you to the main page if you visit the link directly
// so you have to do extra clicks just to get to the login page
// so they count that you will read their articles and watch their ads
// in a webapp we all paid for, disgusting
function appendReferer(e) {
    e.requestHeaders.push({name: "Referer", value: "https://portal.librus.pl/rodzina"});
    return {requestHeaders: e.requestHeaders};
}

browser.webRequest.onBeforeSendHeaders.addListener(appendReferer,
    {urls: ["https://portal.librus.pl/rodzina/synergia/loguj"]},
    ["blocking", "requestHeaders"]
);

browser.webRequest.onBeforeRequest.addListener(e => {
    let redirectUrl = "data:application/json;charset=utf-8," + encodeURIComponent('{}'); // lol that triggers CORS
    return {redirectUrl};
},
    {urls: ["https://portal.librus.pl/ad*"]},
    ["blocking"]
);

browser.webRequest.onBeforeRequest.addListener(e => {
    return {redirectUrl: 'https://portal.librus.pl/rodzina/synergia/loguj'};
},
    {urls: ["https://synergia.librus.pl/loguj", "https://synergia.librus.pl/loguj/przenies*"]},
    ["blocking"]
);