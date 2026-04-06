const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0RUUsbPuDv8q0WC+TS5j
hNo/hfOyNYxTZkW4JwgRB37fQVHaI7f02ON/HPJH0csakZjXvsq4pTfTBf69YX0I
deoXM+8tCoH9gK0YT/gEXFf8/dVShXvbms5l7pZLsLonKJUrzBtDrnguK6VCMlH0
nmaiW45RkDX7D8MuiRSqLZ2cbxdJfLvPD9v9p+qE3miD6a75rKhHcOLh7z5zpNTI
ZViUbviNZsV/z1BM0oImaTTMyqhqRhVWkrVdPCDN9J317Wd9nrAXYkWKtuC2rp8a
yGmkKprzWTzBWA4WdNK/2INAWvGvbEQg2XhwGbQI4ej5HKm42PPk0COWfiAIxTOj
7QIDAQAB
-----END PUBLIC KEY-----`;

const API_TRACK_URL = 'https://xutroncore-api.vercel.app/api/analytics/track';

function pemToArrayBuffer(pem) {
    const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
    const binary = window.atob(b64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
    }
    return buffer;
}

async function encryptData(data) {
    const buffer = pemToArrayBuffer(PUBLIC_KEY_PEM);
    const key = await window.crypto.subtle.importKey(
        'spki',
        buffer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        false,
        ['encrypt']
    );

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        key,
        encodedData
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

window.trackEvent = async function(appName, event, details = {}) {
    const payload = {
        app: appName,
        event: event,
        details: details,
        timestamp: new Date().toISOString()
    };

    try {
        const encryptedData = await encryptData(payload);
        
        await fetch(API_TRACK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ encryptedData })
        });
    } catch (error) {
        console.error('Analytics tracking failed:', error);
    }
};
