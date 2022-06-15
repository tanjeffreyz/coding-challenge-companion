const CLIENT_ID = '4c6317c58473acf7128e';
const PAGES = {
    'auth': document.getElementById('auth-prompt'),
    'summary': document.getElementById('summary')
}


document.getElementById('auth-button').onclick = () => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
    chrome.tabs.create({url, active: true}, () => {});
};


function showPage(key) {
    console.assert(key in PAGES, `'${key}' is an invalid page name`);
    for (const [name, page] of Object.entries(PAGES)) {
        page.hidden = !(name === key);
    }
}


chrome.storage.local.get('access-token', (data) => {
    const token = data['access-token'];
    if (token === null) {
        showPage('auth');
    } else {
        // Retrieve username, check if token is still valid
        const req = new XMLHttpRequest();
        const query = {query: '{ viewer { login } }'};
        req.addEventListener('readystatechange', () => {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    const res = JSON.parse(req.responseText);
                    showPage('summary');
                    document.getElementById('username').textContent = res.data.viewer.login;
                } else {
                    chrome.storage.local.set({'access-token': null}, () => {});
                    showPage('auth');
                    document.getElementById('auth-message').textContent = 'Access token no longer valid, please authenticate again'
                }
            }
        });
        req.open('POST', 'https://api.github.com/graphql', true);
        req.setRequestHeader('Authorization', `bearer ${token}`);
        req.send(JSON.stringify(query));
    }
})
