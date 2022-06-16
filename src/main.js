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
    for (let member in obj) {
        if (obj[member] === null) return false;
    }
    return true;
}


function sendRequest({
    method,
    url,
    body,
    token,
    pass = ((data) => {}),
    fail = ((data) => {})
}) {
    const config = {
        method,
        headers: {
            'Authorization': `token ${token}`
        },
        body: (typeof body === 'undefined' ? null : JSON.stringify(body))
    };

    fetch(url, config)
    .then((res) => res.json())
    .then((data) => {
        console.log(data);
        if (data.hasOwnProperty('message') && data.hasOwnProperty('documentation_url')) {
            if (data.message === 'Requires authentication') {
                clearStorage();
            }
            fail(data);
        } else {
            pass(data);
        }
    })
    .catch((error) => {
        console.error(`Error sending request to '${url}':`, error);
    });
}


chrome.runtime.onMessage.addListener((message) => {
    switch(message.type) {
        case 'clear-storage':
            clearStorage();
            break;
        case 'commit-file':
            chrome.storage.local.get(
                ['accessToken', 'login', 'repository'],
                (data) => {
                    if (data) {
                        if (data.accessToken === null) {
                            clearStorage();
                        } else if (data.repository === null) {
                            console.error(`Failed to commit because no repository has been registered`);
                        } else {
                            const url = `https://api.github.com/repos/${data.login}/${data.repository}/contents/${message.path}`;
                            const body = {
                                message: message.commitMessage,
                                content: btoa(message.content)          // Base-64 encoding
                            };
                            sendRequest({
                                method: 'PUT',
                                url,
                                body,
                                token: data.accessToken,
                                pass: (data) => {
                                    console.log(`Successfully committed to '${url}'`);
                                },
                                fail: (data) => {
                                    console.error(`Failed to commit to '${url}': ${data.message}`);
                                }
                            });
                        }
                    }
                }
            );
            break;
    }
});
