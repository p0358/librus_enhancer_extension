let rememberLoginCode = '<label style="float: left; margin-bottom: -5px; font-size: 13px; letter-spacing: 1px; color: black; margin-top: 2px; text-align: right; display: block;"><input id="remember" type="checkbox" style="margin-top: 4px;display: block;float: left;margin-right: 4px;"> zapamiętaj do szybkiego logowania</label>';

/**
 * @typedef SavedLogin
 * @type {object}
 * @property {string} login login
 * @property {string} passEncrypted encrypted password string
 * @property {boolean} isSchool is login data meant for the login page of school (false if family, true if school)
 */

/** @type {SavedLogin[]} */
let savedLogins = [];
let isSchoolLoginPage = document.location.href.startsWith('https://api.librus.pl/OAuth/Authorization?client_id=47');

let loadingSavedLoginsPromise = (async () => {
    savedLogins = (await storage.get('savedLogins')).savedLogins || [];
    //console.log("[Librus Enhancer] loaded savedLogins", savedLogins);
    //console.log("[Librus Enhancer] all storage:", await storage.get());
    if (savedLogins.length > 0) {
        insertSavedLoginsButtons();
    }
})();

/*(async () => {
    if (window.location.hash && window.location.hash.startsWith('#autologin=')) {
        await loadingSavedLoginsPromise;
        let login = window.location.hash.split('#autologin=')[1];
        if (!login) return console.warn("[Librus Enhancer] Invalid hash", window.location.hash);
        login = login.trim();
        let savedLogin = savedLogins.find(sl => sl.login === login);
        if (!savedLogin) return console.warn("[Librus Enhancer] Login", login, "was not found among saved logins");

        $("#Login").val(savedLogin.login);
        $("#Pass").val(await decryptPassword(savedLogin.passEncrypted));
        $("#LoginBtn").trigger('click');
    }
})();*/


function insertSavedLoginsButtons() {
    $("#savedLogins").remove();
    if (!savedLogins.length) return;

    let container = $('<div id="savedLogins">');

    for (let savedLogin of savedLogins) {
        if (savedLogin.isSchool !== isSchoolLoginPage) continue;
        let btn = $('<div class="btn btn-savedlogin">');

        let loginPart = $('<div class="loginPart">');
        loginPart.text(savedLogin.login);
        loginPart.on('click', async () => {
            $("#Login").val(savedLogin.login);
            $("#Pass").val(await decryptPassword(savedLogin.passEncrypted));
            $("#LoginBtn").trigger('click');
        });

        let deletePart = $('<div class="deletePart">');
        deletePart.text('×');
        deletePart.on('click', async () => {
            savedLogins = savedLogins.filter(sl => sl !== savedLogin);
            await storage.set({savedLogins});
            insertSavedLoginsButtons();
        });

        btn.append(loginPart);
        btn.append(deletePart);
        container.append(btn);
    }

    $('.LoginBox').prepend(container);
}

$("#LoginBtn").on('click', async (ev) => {
    let remember = $("input#remember").is(':checked'); // credentials will only be saved in storage if user has explicitly pressed the checkbox to "remember for quick login"
    
    let login = $("#Login").val();
    let pass = $("#Pass").val();
    let passEncrypted = await encryptPassword(pass);

    //console.log("[Librus Enhancer] Clicked login button", {remember, login, pass, passEncrypted});

    if (remember) {
        if (!login || !pass) return console.warn("[Librus Enhancer] No login or password was provided, I cannot store these credentials");
        
        await loadingSavedLoginsPromise;

        // remove users that match login, but don't match the password, if user is updating one right now
        savedLogins = savedLogins.filter(savedLogin => !(savedLogin.login === login && savedLogin.passEncrypted !== passEncrypted));

        // if the entry doesn't exist on our list
        if (!savedLogins.some(savedLogin => savedLogin.login === login && savedLogin.passEncrypted === passEncrypted)) {
            savedLogins.push({login, passEncrypted, isSchool: isSchoolLoginPage});
            storage.set({savedLogins});
        }
    }

    // if the user is saved, we will save their name for auto re-login, in case their session expired despite having this addon (interval was throttled or user had disconnected from the internet)
    // currently not implemented
    // that feature will not affect manual sign-out
    if (login && pass && savedLogins.some(savedLogin => savedLogin.login === login && savedLogin.passEncrypted === passEncrypted)) {
        storage.set({['lastLogin'+(isSchool?'School':'')]: login});
    }

});

$("input#remember").parent().remove(); // if we're hot-reloading the script
$("#passwordRow").append(rememberLoginCode);
storage.set({'pupilNumber': -1});
