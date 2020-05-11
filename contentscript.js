"use strict";

let url = document.location.toString();
let didInjectCssAlready = false;

console.log("[Librus Enhancer] loading start", {readyState: document.readyState, url});
document.addEventListener('readystatechange', ev => {
    console.log("[Librus Enhancer] ready?", {readyState: document.readyState, url});
    if (document.readyState !== 'complete') return;
    onDocumentReady();
});
if (document.readyState === 'complete')
    onDocumentReady(); // execute immediately
setTimeout(() => modifyStuff(), 500); // just to make sure and catch the late loaded stuff
setTimeout(() => modifyStuff(), 1500); // apparently the one above was not enough...

// separated function in case I want to add something to run on document ready once
function onDocumentReady() {
    modifyStuff();
}

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
        $("#synergiaLogin").next().remove();
    }

    if (url === 'https://portal.librus.pl/rodzina') {
        $('.row > div').not('.article__container').has("img[src*='librus_aplikacja_mobilna'").remove(); // inline ad
        $('.row > div').not('.article__container').has("img[src*='aplikacjamobilna'").remove(); // inline ad
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
            b.text('utrudnia Twój każdy dzień w szkole!');
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
    
}

const PAGE_REFRESH_INTERVAL = 3 * 60 * 1000;
if (url.startsWith('https://synergia.librus.pl/')) {

    let isLoggedIn = !!$('#user-section').length;
    let div = $('#page .container .inside');
    let isLoggedOut = div && !!div.length && div.text() === 'Brak dostępu';

    if (isLoggedIn && !isLoggedOut) {
        console.log("[Librus Enhancer] You are logged in!");
        setInterval(() => refreshPageInBackground(), PAGE_REFRESH_INTERVAL);
        //setTimeout(() => refreshPageInBackground(), 3000); // testing
    } else {
        console.log("[Librus Enhancer] You are logged out!");
        if (isLoggedOut) {
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

// prevent session expiration, so we don't get logged out...
function refreshPageInBackground() {
    console.log("[Librus Enhancer] Running refreshPageInBackground in page context...");
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
