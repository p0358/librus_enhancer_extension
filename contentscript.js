"use strict";

const isChrome = typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype;
const isFirefox = !isChrome && !!browser;
const debug = true;
let url = document.location.toString().split('#')[0].split('?')[0];
let didInjectCssAlready = false;

if (debug) console.log("[Librus Enhancer] loading start", {readyState: document.readyState, url});

modifyStuff(); // execute immediately

if (document.readyState !== 'complete') // if document is not ready yet
document.addEventListener('readystatechange', ev => {
    if (debug) console.log("[Librus Enhancer] ready?", {readyState: document.readyState, url});
    if (document.readyState === 'interactive') // somehow we weren't in interactive state already? (content script is set to run at document_end)
        modifyStuff();
    if (document.readyState === 'complete') {
        onDocumentReady();
        modifyStuff();
    }   
});

if (document.readyState === 'complete') onDocumentReady();

setTimeout(() => modifyStuff(), 500); // just to make sure and catch the late loaded stuff
setTimeout(() => modifyStuff(), 1500); // apparently the one above was not enough...
setTimeout(() => modifyStuff(), 2500); // apparently the one above was not enough...

// run on document ready once
function onDocumentReady() {}

function modifyStuff() {

    //let date = new Date(); console.log("modifyStuff start");
    $("#cookieBox").remove();
    let css = '';

    if (url.startsWith('https://portal.librus.pl/')) {
        
        $('.btn[href="https://konto.librus.pl/sklep"]').remove(); // make more space for button by removing bs
        let ad1 = $('.article-list').children()[0];
        if (ad1 && ad1.classList && !ad1.classList.contains('row')) ad1.remove();
        $('.article__container').has('.article__sponsored').remove();
        //css += '.article__container--small { flex: 1; }'; // don't leave out weird blank spaces from removed elements
        css += '.article__container { flex: 1; padding: 0 .4rem; }'; // don't leave out weird blank spaces from removed elements
        
    }

    if (url.startsWith('https://portal.librus.pl/rodzina') && url !== 'https://portal.librus.pl/rodzina/synergia/loguj' && url !== 'https://portal.librus.pl/szkola/synergia/loguj') {
        
        if (!window.didInsertConvenientLoginButton) {
            $("#shop-button").remove(); // or else the button below won't fit
            let html = '<a class="btn btn-synergia-top btn-navbar" href="https://portal.librus.pl/rodzina/synergia/loguj">ZALOGUJ</a>';
            if ($("a.btn-synergia-top:contains('LIBRUS Synergia')").after(html))
                window.didInsertConvenientLoginButton = true;
        }
        
    }

    if (url === 'https://portal.librus.pl/rodzina/synergia/loguj' || url === 'https://portal.librus.pl/szkola/synergia/loguj') {
        $("#synergiaLogin").next().remove(); // some ad
        $('section#app-download').remove(); // mobile app ad (only on mobile screens)

        // they send: window.parent.postMessage({"command":"open_synergia_window","commandPayload":{"url":"https:\/\/synergia.librus.pl\/uczen\/index"}}, 'https://portal.librus.pl/rodzina');
        let redirectUrl = window.location.hash && window.location.hash.substr(1);
        if (redirectUrl && !window.didSetUpOpenSynergiaWindowListenerAlready) {
            console.log("[Librus Enhancer] Setting up window message event listener to change redirect destination after login (as hash url is provided)");
            window.addEventListener("message", (event) => {
                if (debug) console.log("[Librus Enhancer] message event", event);
                if (event.data && event.data.command && event.data.command === 'open_synergia_window') {
                    console.log("[Librus Enhancer] intercepted open_synergia_window");
                    event.stopImmediatePropagation();
                    event.stopPropagation();
                    //let url = event.data && event.data.commandPayload && event.data.commandPayload.url;
                    let url = window.location.hash && window.location.hash.substr(1);
                    if (!url) url = '/uczen/index';
                    document.location.assign('https://synergia.librus.pl/' + url.replace(/^\/+/, ''));
                }
            }, true);
            window.didSetUpOpenSynergiaWindowListenerAlready = true;
        }
    }

    if (url === 'https://portal.librus.pl/rodzina' || url === 'https://portal.librus.pl/rodzina/login' || url === 'https://portal.librus.pl/szkola') {
        $('.row > div').not('.article__container').has("img[src*='librus_aplikacja_mobilna'").remove(); // inline ad
        $('.row > div').not('.article__container').has("img[src*='aplikacjamobilna'").remove(); // inline ad
        $('.row > div').not('.article__container').has("img[src='undefined'").remove(); // inline ad

        // mobile
        $('.btn.btn-primary.app-download__btn').text('ZALOGUJ OD RAZU');
        $('.btn.btn-primary.app-download__btn').attr('href', 'https://portal.librus.pl/rodzina/synergia/loguj');
        $('.btn.btn-primary.app-download__btn').attr('target', '');
        $('.btn.btn-primary.app-download__btn').css('background-color', '#975b83');
        //$('.app-download__slogan').text('Przycisk po prawej jest teraz użyteczny :)');
        $('.app-download__slogan').remove(); // was too big for our button to fit
        $('.app-download__title').css('font-size', '30px'); // lol
    }

    if (url === 'https://portal.librus.pl/' || url === 'https://portal.librus.pl/szkola') {
        $('.widget-container--small').remove(); // right-side ad
    }

    if (url === 'https://portal.librus.pl/') {
        if (!window.didInsertMainPageDirectLoginButton) {
            let html = '<a class="btn btn-synergia-top btn-navbar" href="https://portal.librus.pl/rodzina/synergia/loguj" style="width: 130px;">ZALOGUJ OD RAZU</a>';
            if ($("a.btn-transparent--login:contains('Zaloguj jako')").before(html))
                window.didInsertMainPageDirectLoginButton = true;

            // mobile
            css += '@media screen and (max-width: 991px) { .btn-synergia-top { height: 20px; margin-top: -7px; padding: 0 !important; } }'; // our button
            css += '@media screen and (max-width: 767px) { .navbar .container-fluid { width: auto; } }';
            css += '@media screen and (max-width: 425px) { .navbar__left { display: none !important; } }';
        }
    }

    if (url === 'https://synergia.librus.pl/uczen/index') {
        let b = $('html body div#page.systema div#body div.container.static.welcome-page.student div.container-background div.content-box h1 b');
        if (b && !!b.length && b.text() === 'ułatwia Twój każdy dzień w szkole!') {
            b.text('utrudnia Twój każdy dzień w szkole!'); // just a tiny easter egg
        }
    }

    if (url === 'https://www.librus.pl/') {
        if (!window.didInsertLibrusPageDirectLoginButton) {
            let html = '<li data-depth="0" class=" menu-item menu-item-type-post_type menu-item-object-page"><a href="https://portal.librus.pl/rodzina/synergia/loguj">ZALOGUJ<br>OD RAZU</a></li>';
            if ($("li.menu-item a:contains('Kontakt')").parent().after(html))
                window.didInsertLibrusPageDirectLoginButton = true;
        }
    }

    if (css && !didInjectCssAlready) {
        didInjectCssAlready = true;
        let style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style)
        console.log("[Librus Enhancer] Injected CSS", style);
    }

    //console.log("modifyStuff end", (+new Date() - date), 'ms'); // takes up to 2 ms
    if (!window.didShowLibrusEnhancerReadyMessage && document.readyState === 'complete') {
        window.didShowLibrusEnhancerReadyMessage = true;
        console.log("[Librus Enhancer] Ready.");
    }
    
}

const PAGE_REFRESH_INTERVAL = 3 * 60 * 1000;
if (url.startsWith('https://synergia.librus.pl/')) {

    let isLoggedIn = !!$('#user-section').length; // we are catching only full pages, not popups
    let div = $('#page .container .inside');
    let isLoggedOut = div && !!div.length && div.text() === 'Brak dostępu';

    if (isLoggedIn && !isLoggedOut) {
        let regex = /(jesteś zalogowan[ya\-\(\)\/]+ jako\:).*(uczeń|rodzic).*/gsi.exec($('#user-section').text());
        
        let isPupil = regex && regex[1] && regex[2] && regex[2] === 'uczeń';
        let isParent = regex && regex[1] && regex[2] && regex[2] === 'rodzic';
        let isTeacher = regex && regex[1] && !isPupil && !isParent;

        // fallback detections
        //if (!isPupil && (!!$("a[href='/przegladaj_oceny/uczen']").length || !!$("a[href='/przegladaj_nb/uczen']").length)) isPupil = true;
        //if (!isParent && (!!$("a[href='/przegladaj_oceny/rodzic']").length || !!$("a[href='/przegladaj_nb/rodzic']").length)) isParent = true; // both pupil and parent turn out to have "uczen" in these links!!!
        if (!isTeacher && !!$("a[href='/interfejs_lekcyjny']").length) isTeacher = true;

        let accountType = -1;
        let accountTypeStr = "unknown";
        switch (true) {
            case isPupil && !isParent && !isTeacher: accountType = ACCOUNT_TYPE_PUPIL; accountTypeStr = "pupil"; break;
            case isParent && !isPupil && !isTeacher: accountType = ACCOUNT_TYPE_PARENT; accountTypeStr = "parent"; break;
            case isTeacher && !isPupil && !isParent: accountType = ACCOUNT_TYPE_TEACHER; accountTypeStr = "teacher"; break;
        }

        console.log("[Librus Enhancer] Detected that you are logged in! (as "+accountTypeStr+")");

        $("a[href='/wyloguj']").on('click', () => storage.set({
            //['lastLogin'+(isTeacher?'School':'')]: null,
            lastLogin: null,
            lastLoginSchool: null,
            pupilNumber: -1
        }));
        revealLiblinks();

        if (!regex || !regex[1] || accountType == -1)
            console.warn("[Librus Enhancer] Could not detect account type!");

        // the difference between these two is documented above these functions' definitions
        if (isFirefox) {
            setInterval(() => firefox_refreshPageInBackground(accountType), PAGE_REFRESH_INTERVAL);
            //setTimeout(() => firefox_refreshPageInBackground(accountType), 3000); // testing
        } else {
            chrome_refreshPageInBackground_setupIntervalInPageContext(accountType);
        }

        if (accountType == ACCOUNT_TYPE_PUPIL || accountType == ACCOUNT_TYPE_PARENT)
            grabPupilNumber();

    } else if (isLoggedOut) {
        console.log("[Librus Enhancer] Detected that you were logged out!");
        let isFamily = (document.body.innerHTML+'').includes('https:\\/\\/synergia.librus.pl\\/loguj\\/przenies\\/rodzic\\/index');
        if (isFamily) {
            let pathname = window.location.pathname;
            if (pathname !== 'https://synergia.librus.pl/rodzic/index' && pathname !== 'https://synergia.librus.pl/uczen/index')
                window.location.replace('https://portal.librus.pl/rodzina/synergia/loguj#' + pathname);
        }

        // make the login button move us to the login page, and not main page 
        let button = $("input[value='Loguj']");
        if (button && !!button.length) {
            button.attr('onclick', '');
            button.on('click', ev => {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                window.location.replace(`https://portal.librus.pl/${isFamily?'rodzina':'szkola'}/synergia/loguj`); // take us to the login page directly...
            });
        }
    } else {
        console.log("[Librus Enhancer] Detected that you are neither logged in or out (popup or another page)");
    }
    
}

async function grabPupilNumber() {
    let data = await storage.get(['pupilNumber']);
    let pupilNumber = +data.pupilNumber;
    if (!pupilNumber || pupilNumber == -1) {

        if (debug) console.log('[Librus Enhancer] Pupil number was not in storage, gonna fetch it.');
        // fetch it
        let url = 'https://synergia.librus.pl/informacja';
        let regex = /<th class="big">Nr w dzienniku\s*<\/th>\s*<td>\s*([0-9]+)\s*<\/td>/gs;

        let code = `${debug ? "console.log('[Librus Enhancer] Fetching number in page context...');":""}
        fetch('${url}', {
            cache: 'no-cache',
            credentials: 'include'
        }).then(response => response.text()).then(text => {
            let regex = /<th class="big">Nr w dzienniku\\s*<\\/th>\\s*<td>\\s*([0-9]+)\\s*<\\/td>/gs;
            let data = regex.exec(text);
            let number = data && data[1] && +data[1];
            if (!number) return console.warn('[Librus Enhancer] Failed to fetch pupil number!', data);
            ${debug ? "console.log('[Librus Enhancer] Fetched number in page context:', number);":""}
            const event = new CustomEvent('PupilNumberEvent', {detail: {number}});
            window.dispatchEvent(event);
        });`;

        window.addEventListener('PupilNumberEvent', e => {
            let number = +(e.detail && e.detail.number);
            if (!number) return console.warn('[Librus Enhancer] Received invalid pupil number in event listener!', e);
            storage.set({pupilNumber: number});
            processPupilNumber(number);
        });

        if (isFirefox) {
            window.eval(code);
        } else {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.innerHTML = code;
            document.head.appendChild(script);
        }

    } else processPupilNumber(pupilNumber);
}

function processPupilNumber(number) {
    console.log("[Librus Enhancer] Determined your number:", number);
    let currentLuckyNumber = +($('.luckyNumber').text()+'').trim();
    if (currentLuckyNumber === number) {
        console.log("[Librus Enhancer] Your number is lucky today!");
        $('.luckyNumber').css('border', '15px solid red'); // dashed
        $('.luckyNumber').css('font-size', '20px');
        $('.luckyNumber').css('background-color', 'lime');
    }
}

function getLinkToFetchForBackgroundSessionRefresh(accountType) {
    let linkToFetch;
    switch (accountType) {
        case ACCOUNT_TYPE_PUPIL: linkToFetch = 'https://synergia.librus.pl/uczen/index'; break;
        case ACCOUNT_TYPE_PARENT: linkToFetch = 'https://synergia.librus.pl/rodzic/index'; break;
        case ACCOUNT_TYPE_TEACHER: linkToFetch = 'https://synergia.librus.pl/interfejs_lekcyjny'; break;
        default: linkToFetch = 'https://synergia.librus.pl/ustawienia'; break;
    }
    return linkToFetch;
}

// the difference between below functions:
// firefox one sets interval in content script (in code block above), and uses window.eval to then execute the request in page context
// chrome one sets both the interval and request in page context (with script tag workaround, as window.eval is not available there)

// prevent session expiration, so we don't get logged out...
function firefox_refreshPageInBackground(accountType) { // this function only gets executed in Firefox
    console.log("[Librus Enhancer] Running firefox_refreshPageInBackground in page context...");

    let linkToFetch = getLinkToFetchForBackgroundSessionRefresh(accountType);

    /*fetch('https://synergia.librus.pl/uczen/index', { // content.fetch crashes tab lol
        //mode: 'same-origin',
        cache: 'no-cache',
        credentials: 'include'
    }).then(response => console.log("[Librus Enhancer] Refreshed page in background to preserve the session (response status: " + response.status + ", length: " + response.headers.get("content-length") + ")"));
    */

    let code = `fetch('${linkToFetch}', {
        cache: 'no-cache',
        credentials: 'include'
    }).then(response => console.log("[Librus Enhancer] Refreshed page in background to preserve the session (response status: " + response.status + ", length: " + response.headers.get("content-length") + ")"));`;

    window.eval(code);
    
}

// workaround for chrome
// the modern-age Internet Explorer
function chrome_refreshPageInBackground_setupIntervalInPageContext(accountType) { // this function only gets executed in Chrome, and not in Firefox
    
    let linkToFetch = getLinkToFetchForBackgroundSessionRefresh(accountType);
    
    let fetchcode = `fetch('${linkToFetch}', {
        cache: 'no-cache',
        credentials: 'include'
    }).then(response => console.log("[Librus Enhancer] Refreshed page in background to preserve the session (response status: " + response.status + ", length: " + response.headers.get("content-length") + ")"));`;    
    let consolecode = 'console.log("[Librus Enhancer] Setting up chrome_refreshPageInBackground_setupIntervalInPageContext interval in page context")';
    
    // set interval with the callback both in page context
    let code = `${consolecode}; setInterval(() => {${fetchcode}}, 3*60*1000);`;
    //code += `setTimeout(() => {console.log('[Librus Enhancer] Testing: executing background refresh now!');${fetchcode}}, 5000);`; // testing
    
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = code;
    document.head.appendChild(script);
}

//#region IndexedDB
/** @type {IDBDatabase} */
let db;
var indexedDBPromise = new Promise((resolve, reject) => {
    const DBOpenRequest = window.indexedDB.open("librusData", 1);

    DBOpenRequest.onerror = event => {
        console.error("[Librus Enhancer] Error opening IndexedDB");
        resolve();
    };

    DBOpenRequest.onsuccess = event => {
        db = DBOpenRequest.result;
        resolve();
        console.log("[Librus Enhancer] IndexedDB ready");
    };

    DBOpenRequest.onupgradeneeded = event => {
        console.log("[Librus Enhancer] DBOpenRequest.onupgradeneeded");
        /** @type {IDBDatabase} */
        let db = event.target.result;

        db.onerror = function(event) {
            console.error("[Librus Enhancer] Error loading database.");
        };

        if (!db.objectStoreNames.contains("libLinkCache")) {
            let libLinkObjectStore = db.createObjectStore("libLinkCache", { keyPath: "libLinkUrl" });
            libLinkObjectStore.createIndex("resolvedUrl", "resolvedUrl", { unique: false });
        }
    };
});

//#endregion IndexedDB

/**
 * 
 * @param {string} url
 * @returns {string | false} resolved actual URL (or false if failed)
 */
async function resolveLiblinkFromNetwork(url) {
    let body;
    if (isFirefox) {
        // it just works in Firefox
        try {
            body = await fetch(url, {mode: 'cors'}).then(response => response.text());
            if (!body)
                console.warn("[Librus Enhancer] Warning: liblink resolve body is empty on contentscript fetch");
        } catch (e) {
            console.error("[Librus Enhancer] Failed to resolve liblink from network", {url}, e);
            return false;
        }
    }
    
    if (!body) {
        // send a message to background script, for Chromium, but !body check future-proofs it in case Firefox ever decides to pull the same shit and remove CORS requests from content scripts
        // https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
        try {
            let regex = /https?:\/\/(?:[^\/]*\.)?liblink\.pl\/([^\/\?]+)/g.exec(url);
            /*body = await browser.runtime.sendMessage({
                contentScriptQuery: 'resolveLiblinkFromNetwork',
                liblinkID: regex[1]
            });*/
            body = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    contentScriptQuery: 'resolveLiblinkFromNetwork',
                    liblinkID: regex[1]
                }, resolve);
            });
        } catch (e) {
            console.error("[Librus Enhancer] Failed to resolve liblink from network using background script", {url}, e);
            return false;
        }
    }

    let regex = /<span style="color: #646464;">(https?:\/\/[^<>]*)<\/span>/g.exec(body);
    return (regex && regex[1]) || false;
}

async function resolveLiblink(url) {
    await indexedDBPromise;
    let transaction = db.transaction("libLinkCache", "readonly");
    let liblinks = transaction.objectStore("libLinkCache");
    let request = liblinks.get(url);
    let result;
    let requestPromise = new Promise((resolve, reject) => {
        request.onsuccess = () => {
            console.log("[Librus Enhancer] Resolved libLink from cache", request.result);
            resolve(request.result);
        };
        request.onerror = () => {
            console.log("[Librus Enhancer] Transaction error", request.error);
            resolve();
        };
    });
    let cacheResolved = await requestPromise;
    if (cacheResolved)
        return cacheResolved.resolvedUrl;
    //console.log('[Librus Enhancer] Not resolved from cache, will fetch from network', {requestPromise, cacheResolved});

    {
        let resolvedUrl = await resolveLiblinkFromNetwork(url);
        if (!resolvedUrl) return false;
        //console.log('[Librus Enhancer] Resolved URL: ', resolvedUrl);

        let transaction = db.transaction("libLinkCache", "readwrite");
        let liblinks = transaction.objectStore("libLinkCache");
        let item = {
            libLinkUrl: url,
            resolvedUrl
        };
        let request = liblinks.add(item);
        await new Promise((resolve, reject) => {
            request.onsuccess = () => {
                console.log("[Librus Enhancer] Link added to the store", request.result);
                resolve();
            };
            request.onerror = () => {
                console.log("[Librus Enhancer] Transaction error", request.error);
                resolve();
            };
        });
        return resolvedUrl;
    }
}

function revealLiblinks() {
    $("a[href*='liblink.pl']").each((index, /** @type {HTMLLinkElement} */ element) => {
        if (element.href.startsWith('https://liblink.pl/') && element.href.length > 'https://liblink.pl/'.length) {
            setTimeout(() => resolveLiblink(element.href).then(url => {
                if (!url) return;
                element.href = url;
                $(element).text(url);
                $(element).attr('title', 'Zamieniono liblink na prawdziwy cel');
            }).catch(r => console.error("[Librus Enhancer] liblink resolve promise error", r)), 1);
        }
    });
}

if (url === 'https://portal.librus.pl//vendor/widget-librus/index.html' || url === 'https://portal.librus.pl/vendor/widget-librus/index.html') {
    /** @type {MutationCallback} */ const callback = (mutationsList, observer) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes) {
                    for (let node of mutation.addedNodes) {
                        if (node.href && node.href.includes("https://liblink.pl/")) {
                            resolveLiblink(node.href).then(url => {
                                if (!url) return;
                                node.href = url;
                                if ($(node).text().includes('liblink.pl')) $(node).text(url);
                            }).catch(r => console.error("[Librus Enhancer] liblink resolve promise error", r))
                        }
                    }
                }
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(document.body, {childList: true, subtree: true});
}
