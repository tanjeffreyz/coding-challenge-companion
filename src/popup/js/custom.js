const CLIENT_ID = '4c6317c58473acf7128e';
const PAGES = {
    'auth': document.getElementById('auth-prompt'),     // Page 0
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


chrome.storage.local.get('access-token', (token) => {
    if (token === null) {
        showPage('auth');
    }

    const req = new XMLHttpRequest();
    
    
    
     {
        showPage('summary');
    }
})
