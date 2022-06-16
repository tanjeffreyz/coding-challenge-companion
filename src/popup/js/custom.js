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
            document.getElementById('auth-message').textContent = 'Invalid access token, please authenticate again'
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


function reAuth () {
    showPage('re-auth');
    chrome.runtime.sendMessage({type: 'clear-storage'});
}


function sendRequest({
    method,
    url,
    body,
    token,
    validProperties = [],
    pass = ((res) => {}),
    fail = ((res) => {})
}) {
    // Helper function
    validProperties = new Set(validProperties);
    const hasValidProperty = (obj) => {
        if (typeof obj !== 'object') return false;
        let any = false;
        for (let key in obj) {
            const value = obj[key];
            any = (any || validProperties.has(value) || hasValidProperty(value));
            if (any) break;
          }
        return any;
    }

    // Send a request
    const config = {
        method,
        headers: {
            'Authorization': `token ${token}`
        },
        body: (typeof body === 'undefined' ? null : JSON.stringify(body))
    };

    fetch(url, config)
    .then((res) => {
        if (res.status === 401) {
            reAuth();
        }
        return res.json()
    })
    .then((data) => {
        if (data.hasOwnProperty('message') && data.hasOwnProperty('documentation_url')) {
            if (!hasValidProperty(data)) {
                fail(data);
                return;
            }
        }
        pass(data);
    })
    .catch((error) => {
        console.error(`Error sending request to '${url}':`, error);
    });
}


//////////////////////////////
//      Event Listeners     //
//////////////////////////////
document.getElementById('auth-button').onclick = () => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
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
        chrome.storage.local.get('accessToken', (data) => {
            sendRequest({
                method: 'POST',
                url: 'https://api.github.com/user/repos',
                token: data.accessToken,
                body: {
                    name: repoName,
                    private: true,
                    auto_init: true,
                    description: 'A challenge a day keeps the brain cells awake! 😉'
                },
                validProperties: ['name already exists on this account'],
                pass: (res) => {
                    chrome.storage.local.set({'repository': repoName}, () => {
                        console.log('Success');
                        main();
                    });
                }
            });
        });
    }
};


//////////////////////////////
//      Main Functions      //
//////////////////////////////
function getUserLogin(token) {
    sendRequest({
        method: 'GET',
        url: 'https://api.github.com/user',
        token,
        pass: (res) => {
            chrome.storage.local.get('repository', (data) => {
                const headerMessage = document.getElementById('header-message');
                if (data !== null && data.repository !== null) {
                    headerMessage.innerHTML = `
                        <a class="text-decoration-none" target="_blank" href="https://github.com/${res.login}/${data.repository}">
                            <span class="align-middle">
                                <img src="resources/repository.png" width="20px" />
                            </span>
                            <span class="align-middle">
                                <b>${res.login}/${data.repository}</b>
                            </span>
                        </a>
                    `;
                } else {
                    headerMessage.innerHTML = `<p>Signed in as <b>${res.login}</b></p>`;
                }
            });
            chrome.storage.local.set({'login': res.login}, () => {});
        }
    });
}


function main() {
    chrome.storage.local.get(
        ['accessToken', 'repository'],
        (data) => {
            const token = data.accessToken;
            if (!data || token === null) {
                showPage('auth');
            } else {
                if (data.repository === null) {
                    showPage('register-repo');
                } else {
                    showPage('summary');
                }
                getUserLogin(token);     // Retrieve username and name
            }
        }
    );
}


main();


// chrome.runtime.sendMessage({
//     type: 'commit-file',
//     path: 'leetcode/test.py',
//     commitMessage: 'testing commit',
//     content: '#lel3\n'
// })
