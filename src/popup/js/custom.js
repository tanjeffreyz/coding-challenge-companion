const CLIENT_ID = '4c6317c58473acf7128e';
const PAGES = {
    'auth': [
        document.getElementById('auth-prompt'), 
        () => {
            document.getElementById('header-message').textContent = ' ';
        }
    ],

    're-auth': [
        document.getElementById('auth-prompt'), 
        () => {
            document.getElementById('header-message').textContent = ' ';
            document.getElementById('auth-message').textContent = 'Access token no longer valid, please authenticate again'
        }
    ],

    'register-repo': [
        document.getElementById('register-repo'),
        () => {}
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
    validStates
}) {
    const allowed = (typeof validStates === 'undefined' ? new Set([200]) : new Set(validStates));
    const req = new XMLHttpRequest();
    req.addEventListener('readystatechange', () => {
        if (req.readyState === 4) {
            if (allowed.has(req.status)) {
                pass(req);
            } else {
                fail(req);
            }
        }
    });
    req.open(type, url, true);
    req.setRequestHeader('Authorization', `token ${token}`);
    typeof body === 'undefined' ? req.send() : req.send(JSON.stringify(body));
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
    if (!e.key.match(/[A-Za-z0-9\-]/)) {
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
    const repoName = registerRepoInput.value.trim('-');
    if (repoName === '') {

    } else {
        chrome.storage.local.get('access-token', (data) => {
            const token = data['access-token'];
            sendRequest({
                type: 'POST',
                url: 'https://api.github.com/user/repos',
                token,
                body: {
                    name: repoName,
                    private: true,
                    auto_init: true,
                    description: 'A challenge a day keeps the brain cells awake! 😉'
                },
                pass: (req) => {
                    chrome.storage.local.set({'repository': repoName}, () => {
                        console.log('Success');
                        main();
                    });
                },
                fail: (req) => {

                },
                validStates: [200, 201]
            });
        });
    }
};


//////////////////////////////
//      Main Functions      //
//////////////////////////////
const failReauth = (req) => {
    showPage('re-auth');
    chrome.runtime.sendMessage({type: 'clear-storage'});
}


function getUserLogin(token) {
    sendRequest({
        type: 'GET',
        url: 'https://api.github.com/user',
        token,
        pass: (req) => {
            const res = JSON.parse(req.responseText);
            chrome.storage.local.get('repository', (data) => {
                if (data !== null && data.repository !== null) {
                    document.getElementById('header-message').innerHTML = `
                        <span class="align-middle">
                            <img src="resources/repository.svg" width="24px" />
                        </span>
                        <span class="align-middle">
                            <b>${res.login}/${data.repository}</b>
                        </span>
                    `;
                } else {
                    document.getElementById('header-message').innerHTML = `Signed in as <b>${res.login}</b>`;
                }
            });
            chrome.storage.local.set({'login': res.login}, () => {});
            chrome.storage.local.set({'name': res.name}, () => {});
        },
        fail: failReauth
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
        fail: failReauth
    });
}


function main() {
    chrome.storage.local.get(
        ['access-token', 'login', 'repository'],
        (data) => {
            const token = data['access-token'];
            if (!data || token === null) {
                showPage('auth');
            } else {
                if (data.repository === null) {
                    showPage('register-repo');
                } else {
                    showPage('summary');
                }
                getUserLogin(token);     // Retrieve username and name
                getUserEmail(token);     // Retrieve user's primary email to generate commits with
            }
        }
    );
}


main();
