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
    {urls: ["https://portal.librus.pl/rodzina/synergia/loguj", "https://portal.librus.pl/szkola/synergia/loguj"]},
    appendReferer_extraInfoSpec
);

browser.webRequest.onBeforeRequest.addListener(e => {
    //let redirectUrl = "data:application/json;charset=utf-8," + encodeURIComponent('{}'); // lol that triggers CORS (and only in Firefox apparently), but we don't really care, we just need to block the response
    //return {redirectUrl};
    return {cancel: true};
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

// redirect to the login page directly, it is the same page as the one we redirect from, except that the main page has some introduction crap instead of login page (you can create account from login page too)
browser.webRequest.onBeforeRequest.addListener(e => {
    if (e.originUrl === 'https://portal.librus.pl/rodzina/login') return {}; // don't redirect again if user pressed back button on the login page (doesn't work in Chromium -- their fault)
    return {redirectUrl: 'https://portal.librus.pl/rodzina/login'};
},
    {urls: ["https://portal.librus.pl/rodzina"]},
    ["blocking"]
);

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.contentScriptQuery && request.contentScriptQuery === 'resolveLiblinkFromNetwork') {
        return fetch('https://liblink.pl/'+request.liblinkID, {mode: 'cors'}).then(response => response.text());
    }
    return false;
});
