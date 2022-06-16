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
    const url = 'https://github.com/login/oauth/access_token';
    const body = new URLSearchParams();
    body.append('client_id', CLIENT_ID);
    body.append('client_secret', CLIENT_SECRET);
    body.append('code', extractCode(window.location.href));

    fetch(url, {
        method: 'POST',
        body
    })
    .then((res) => {
        res.text().then((text) => {
            const matches = text.match(/access_token=(\w+)/);
            if (matches !== null && matches.length === 2) {
                chrome.storage.local.set({'accessToken': matches[1]}, () => {});
            }
        });
    })
    .catch((error) => {});
}


saveAccessToken();
