//#region ENCRYPTION

// better to encrypt with a statically embedded key than to store in storage in plaintext 
let keyJWK = {"alg":"A256CTR","ext":true,"k":"cFQapcrsDni7TtMw9IMIvWqQqOf6DPFnWxsHt-uGtrg","key_ops":["encrypt","decrypt"],"kty":"oct"};
/** @type {CryptoKey} */ let key;
let keyPromise = crypto.subtle.importKey('jwk', keyJWK, {name: "AES-CTR"}, true, ['encrypt', 'decrypt']).then(k => key = k);
let counter = new Uint8Array([223,4,183,186,65,15,14,174,251,45,102,133,60,63,18,113]); // mmm secure af
// doesn't really matter, if someone had access to the source code, they could decrypt anyways

async function encryptPassword(pass) {
    await keyPromise;

    let enc = new TextEncoder();
    let encoded = enc.encode(pass);

    //let counter = window.crypto.getRandomValues(new Uint8Array(16));
    let ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-CTR",
            counter,
            length: 64
        },
        key,
        encoded
    );

    return new Uint8Array(ciphertext).toString();
}

async function decryptPassword(passEncrypted) {
    let ciphertext = new Uint8Array(passEncrypted.split(',')).buffer;
    let decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-CTR",
            counter,
            length: 64
        },
        key,
        ciphertext
    );
  
    let dec = new TextDecoder();
    return dec.decode(decrypted);
}

//#endregion ENCRYPTION

/** @type {browser.storage.StorageArea} */
//let storage = browser.storage.sync; // production?
let storage = browser.storage.local; // development