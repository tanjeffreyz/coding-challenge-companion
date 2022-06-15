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


document.getElementById('auth-button').onclick = () => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user:email`;
    chrome.tabs.create({url, active: true}, () => {});
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


chrome.storage.local.get('access-token', (data) => {
    const token = data['access-token'];
    if (token === null) {
        showPage('auth');
    } else {
        showPage('summary');

        // Retrieve username and name
        const userReq = new XMLHttpRequest();
        userReq.addEventListener('readystatechange', () => {
            if (userReq.readyState === 4) {
                if (userReq.status === 200) {
                    const res = JSON.parse(userReq.responseText);
                    document.getElementById('summary-message').innerHTML = `Signed in as <b>${res.login}</b>`;
                    chrome.storage.local.set({'login': res.login}, () => {});
                    chrome.storage.local.set({'name': res.name}, () => {});
                } else {
                    showPage('re-auth');
                    chrome.runtime.sendMessage({type: 'clear-storage'});
                }
            }
        });
        userReq.open('GET', 'https://api.github.com/user', true);
        userReq.setRequestHeader('Authorization', `token ${token}`);
        userReq.send();

        // Retrieve user's primary email to generate commits with
        const emailReq = new XMLHttpRequest();
        emailReq.addEventListener('readystatechange', () => {
            if (emailReq.readyState === 4) {
                if (emailReq.status === 200) {
                    const res = JSON.parse(emailReq.responseText);
                    for (let i = 0; i < res.length; i++) {
                        const email = res[i];
                        if (email.primary && email.verified) {
                            chrome.storage.local.set({'email': email.email}, () => {});
                        }
                    }
                } else {
                    showPage('re-auth');
                    chrome.runtime.sendMessage({type: 'clear-storage'});
                }
            }
        });
        emailReq.open('GET', 'https://api.github.com/user/emails', true);
        emailReq.setRequestHeader('Authorization', `token ${token}`);
        emailReq.send();
    }
});
