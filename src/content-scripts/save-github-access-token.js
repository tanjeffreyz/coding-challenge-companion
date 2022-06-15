const CLIENT_ID = '4c6317c58473acf7128e';
const CLIENT_SECRET = '17835dac399cb478b60ad9dc3f64c1d1bbb4fdad';


function extractCode(url) {
    const matches = url.match(/\?code=(\w+)/);
    if (matches !== null) {
        return matches[1];
    }
    return null;
}


function saveAccessToken() {
    const body = new FormData();
    body.append('client_id', CLIENT_ID);
    body.append('client_secret', CLIENT_SECRET);
    body.append('code', extractCode(window.location.href));

    const req = new XMLHttpRequest();
    req.addEventListener('readystatechange', () => {
        if (req.readyState === 4 && req.status === 200) {
            const matches = req.responseText.match(/access_token=(\w+)/);
            if (matches !== null) {
                chrome.storage.local.set({'access-token': matches[1]}, () => {});
            }
        }
    });
    req.open('POST', 'https://github.com/login/oauth/access_token', true);
    req.send(body);
}


saveAccessToken();
