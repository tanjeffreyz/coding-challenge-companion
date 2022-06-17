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
            clearStorage();
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


chrome.runtime.onMessage.addListener((message) => {
    switch(message.type) {
        case 'clear-storage':
            clearStorage();
            break;
        case 'commit-file':     // Requires {path, content, commitMessage}
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
                            sendRequest({       // Check if file already exists
                                method: 'GET',
                                url,
                                token: data.accessToken,
                                validProperties: ['Not Found'],
                                pass: (res) => {
                                    const reg = /\s+/g;
                                    const oldContent = res.content;     
                                    const newContent = btoa(message.content);       // Base-64 encoding
                                    if ((typeof oldContent === 'undefined') || (newContent.replace(reg, '') !== oldContent.replace(reg, ''))) {
                                        const body = {
                                            message: message.commitMessage,
                                            content: newContent,
                                            sha: res.sha
                                        };
                                        sendRequest({        // Upload or update file
                                            method: 'PUT',
                                            url,
                                            body,
                                            token: data.accessToken,
                                            pass: (res) => {
                                                console.log(`Successfully committed to '${url}'`);
                                            },
                                            fail: (res) => {
                                                console.error(`Failed to commit to '${url}': ${res.message}`);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                }
            );
            break;
    }
});
