"use strict";

const isChrome = typeof browser === "undefined" || Object.getPrototypeOf(browser) !== Object.prototype;
const isFirefox = !isChrome && !!browser;
const debug = false;
let url = document.location.toString().split('#')[0].split('?')[0];
let didInjectCssAlready = false;

if (debug) console.log("[Librus Enhancer] loading start", {readyState: document.readyState, url});

modifyStuff(); // execute immediately

if (document.readyState !== 'complete') // if document is not ready yet, repeat the 
document.addEventListener('readystatechange', ev => {
    if (debug) console.log("[Librus Enhancer] ready?", {readyState: document.readyState, url});
    if (document.readyState !== 'complete') return;
    onDocumentReady();
    modifyStuff();
});

if (document.readyState === 'complete') onDocumentReady();
setTimeout(() => modifyStuff(), 500); // just to make sure and catch the late loaded stuff
setTimeout(() => modifyStuff(), 1500); // apparently the one above was not enough...

// separated function in case I want to add something to run on document ready once
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
        //css += '.article__container--small { flex: 1; }'; // don't leave out weird blank spaces
        css += '.article__container { flex: 1; }'; // don't leave out weird blank spaces
        
    }

    if (url.startsWith('https://portal.librus.pl/rodzina') && url !== 'https://portal.librus.pl/rodzina/synergia/loguj') {
        
        if (!window.didInsertConvenientLoginButton) {
            let html = '<a class="btn btn-synergia-top btn-navbar" href="https://portal.librus.pl/rodzina/synergia/loguj">ZALOGUJ</a>';
            if ($("a.btn-synergia-top:contains('LIBRUS Synergia')").after(html))
                window.didInsertConvenientLoginButton = true;
        }
        
    }

    if (url === 'https://portal.librus.pl/rodzina/synergia/loguj') {
        $("#synergiaLogin").next().remove(); // some ad
    }

    if (url === 'https://portal.librus.pl/rodzina') {
        $('.row > div').not('.article__container').has("img[src*='librus_aplikacja_mobilna'").remove(); // inline ad
        $('.row > div').not('.article__container').has("img[src*='aplikacjamobilna'").remove(); // inline ad
        $('.row > div').not('.article__container').has("img[src='undefined'").remove(); // inline ad
    }

    if (url === 'https://portal.librus.pl/') {
        $('.widget-container--small').remove(); // right-side ad
        if (!window.didInsertMainPageDirectLoginButton) {
            let html = '<a class="btn btn-third btn-navbar" href="https://portal.librus.pl/rodzina/synergia/loguj" style="width: 130px;">ZALOGUJ OD RAZU</a>';
            if ($("a.btn-third:contains('Zaloguj jako')").before(html))
                window.didInsertMainPageDirectLoginButton = true;
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
            let html = '<a class="menuLink" href="https://portal.librus.pl/rodzina/synergia/loguj" style="font-weight: bold; text-decoration: underline;">ZALOGUJ OD RAZU</a>';
            if ($("a.menuLink[href='/kontakt/']").after(html))
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

    let isLoggedIn = !!$('#user-section').length;
    let div = $('#page .container .inside');
    let isLoggedOut = div && !!div.length && div.text() === 'Brak dostępu';

    if (isLoggedIn && !isLoggedOut) {
        console.log("[Librus Enhancer] Detected that you are logged in!");
        // the difference between these two is documented above these functions' definitions
        if (isFirefox) {
            setInterval(() => firefox_refreshPageInBackground(), PAGE_REFRESH_INTERVAL);
            //setTimeout(() => firefox_refreshPageInBackground(), 3000); // testing
        } else {
            chrome_refreshPageInBackground_setupIntervalInPageContext();
        }
    } else {
        console.log("[Librus Enhancer] Detected that you are logged out!");
        if (isLoggedOut) {
            // make the login button move us to the login page, and not main page 
            let button = $("input[value='Loguj']");
            if (button && !!button.length) {
                button.attr('onclick', '');
                button.click(ev => {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    window.location.replace('https://portal.librus.pl/rodzina/synergia/loguj'); // take us to the login page directly...
                });
            }
        }
    }
    
}

// the difference between below functions:
// firefox one sets interval in content script (in code block above), and uses window.eval to then execute the request in page context
// chrome one sets both the interval and request in page context (with script tag workaround, as window.eval is not available there)

// prevent session expiration, so we don't get logged out...
function firefox_refreshPageInBackground() { // this function only gets executed in Firefox
    console.log("[Librus Enhancer] Running firefox_refreshPageInBackground in page context...");
    /*fetch('https://synergia.librus.pl/uczen/index', { // content.fetch crashes tab lol
        //mode: 'same-origin',
        cache: 'no-cache',
        credentials: 'include'
    }).then(response => console.log("[Librus Enhancer] Refreshed page in background to preserve the session (response status: " + response.status + ", length: " + response.headers.get("content-length") + ")"));
    */

    let code = `fetch('https://synergia.librus.pl/uczen/index', {
        cache: 'no-cache',
        credentials: 'include'
    }).then(response => console.log("[Librus Enhancer] Refreshed page in background to preserve the session (response status: " + response.status + ", length: " + response.headers.get("content-length") + ")"));`;    

    window.eval(code);
    
}

// workaround for chrome
// the modern-age Internet Explorer
function chrome_refreshPageInBackground_setupIntervalInPageContext() { // this function only gets executed in Chrome, and not in Firefox
    let fetchcode = `fetch('https://synergia.librus.pl/uczen/index', {
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