"use strict";

// these dicks would redirect you to the main page if you visited the link directly
// so you have to do extra clicks just to get to the login page
// so they count that you will read their articles and watch their ads
// in a webapp we all paid for, disgusting
function appendReferer(e) {
    e.requestHeaders.push({name: "Referer", value: "https://portal.librus.pl/rodzina"});
    return {requestHeaders: e.requestHeaders};
}

let appendReferer_extraInfoSpec = ["blocking", "requestHeaders"];
if (chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) appendReferer_extraInfoSpec.push('extraHeaders'); // Chrome needs this apparently...
browser.webRequest.onBeforeSendHeaders.addListener(appendReferer,
    {urls: ["https://portal.librus.pl/rodzina/synergia/loguj"]},
    appendReferer_extraInfoSpec
);

browser.webRequest.onBeforeRequest.addListener(e => {
    let redirectUrl = "data:application/json;charset=utf-8," + encodeURIComponent('{}'); // lol that triggers CORS (and only in Firefox apparently), but we don't really care, we just need to block the response
    return {redirectUrl};
},
    {urls: ["https://portal.librus.pl/ad*"]},
    ["blocking"]
);

// this login link would redirect user to the main page, so catch it and redirect directly to the actual login page instead
browser.webRequest.onBeforeRequest.addListener(e => {
    return {redirectUrl: 'https://portal.librus.pl/rodzina/synergia/loguj'};
},
    {urls: ["https://synergia.librus.pl/loguj", "https://synergia.librus.pl/loguj/przenies*"]},
    ["blocking"]
);
