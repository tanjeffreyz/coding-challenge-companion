const CLIENT_ID = '4c6317c58473acf7128e';
const PAGES = {
    'auth': [
        document.getElementById('auth-prompt'), 
        () => {}
    ],

    're-auth': [
        document.getElementById('auth-prompt'), 
        () => {
            document.getElementById('auth-message').textContent = 'Access token no longer valid, please authenticate again'
        }
    ],

    'summary': [
        document.getElementById('summary'), 
        () => {}
    ]
};


function showPage(key) {
    console.assert(key in PAGES, `'${key}' is an invalid page name`);
    let targetPageAttributes;
    for (const [name, attributes] of Object.entries(PAGES)) {
        if (name === key) {
            targetPageAttributes = attributes;
        } else {
            attributes[0].hidden = true;
        }
    }
    const [page, callback] = targetPageAttributes;
    page.hidden = false;
    callback();
}


function sendRequest({
    type,
    url,
    body,
    token,
    pass,
    fail,
}) {
    const req = new XMLHttpRequest();
    req.addEventListener('readystatechange', () => {
        if (req.readyState === 4) {
            if (req.status === 200) {
                pass(req);
            } else {
                fail(req);
            }
        }
    });
    req.open(type, url, true);
    req.setRequestHeader('Authorization', `token ${token}`);
    typeof body === 'undefined' ? req.send() : req.send(body);
}


//////////////////////////////
//      Event Listeners     //
//////////////////////////////
document.getElementById('auth-button').onclick = () => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user:email`;
    chrome.tabs.create({url, active: true}, () => {});
};


const registerRepoInput = document.getElementById('register-repo-name');
registerRepoInput.onkeydown = (e) => {
    console.log(this);
     if (!e.key.match(/[A-Za-z0-9]/)) {
        if (e.key === ' ') {
            const start = registerRepoInput.selectionStart;
            const end = registerRepoInput.selectionEnd;
            const text = registerRepoInput.value;
            registerRepoInput.value = text.slice(0, start) + '-' + text.slice(end);
            registerRepoInput.selectionStart = registerRepoInput.selectionEnd = start + 1;
        }
        return false;
    }
};


document.getElementById('register-repo-button').onclick = () => {
    
};


//////////////////////////////
//      Main Functions      //
//////////////////////////////
function getUserLogin(token) {
    sendRequest({
        type: 'GET',
        url: 'https://api.github.com/user',
        token,
        pass: (req) => {
            const res = JSON.parse(req.responseText);
            document.getElementById('summary-message').innerHTML = `Signed in as <b>${res.login}</b>`;
            chrome.storage.local.set({'login': res.login}, () => {});
            chrome.storage.local.set({'name': res.name}, () => {});
        },
        fail: (req) => {
            showPage('re-auth');
            chrome.runtime.sendMessage({type: 'clear-storage'});
        }
    });
}


function getUserEmail(token) {
    sendRequest({
        type: 'GET',
        url: 'https://api.github.com/user/emails',
        token,
        pass: (req) => {
            const res = JSON.parse(req.responseText);
            for (let i = 0; i < res.length; i++) {
                const email = res[i];
                if (email.primary && email.verified) {
                    chrome.storage.local.set({'email': email.email}, () => {});
                }
            }
        },
        fail: (req) => {
            showPage('re-auth');
            chrome.runtime.sendMessage({type: 'clear-storage'});
        }
    });
}


chrome.storage.local.get('access-token', (data) => {
    const token = data['access-token'];
    if (token === null) {
        showPage('auth');
    } else {
        showPage('summary');
        getUserLogin(token);     // Retrieve username and name
        getUserEmail(token);     // Retrieve user's primary email to generate commits with
    }
});
