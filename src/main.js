KEYS = [
    'accessToken',
    'login',
    'repository'
];


function clearStorage() {
    for (let i = 0; i < KEYS.length; i++) {
        const dict = {};
        dict[KEYS[i]] = null;
        chrome.storage.local.set(dict, () => {});
    }
}


function noNullMembers(obj) {
    for (let member in target) {
        if (obj[member] === null) return false;
    }
    return true;
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
    validStates = (typeof validStates === 'undefined' ? new Set([200]) : new Set(validStates));
    fail = (typeof fail === 'undefined' ? (req) => {} : fail);

    const req = new XMLHttpRequest();
    req.addEventListener('readystatechange', () => {
        if (req.readyState === 4) {
            if (req.status === 401) {
                clearStorage();
            } else if (validStates.has(req.status)) {
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


chrome.runtime.onMessage.addListener((message) => {
    switch(message.type) {
        case 'clear-storage':
            clearStorage();
            break;
        case 'commit-file':
            chrome.storage.local.get(
                ['login', 'repository'],
                (data) => {
                    if (data && noNullMembers(data)) {
                        const url = `https://api.github.com/repos/${data.login}/${data.repository}/${message.path}`;
                        const body = {

                        }
                    } else {
                        clearStorage();
                    }
                }
            );
            break;
    }
});
