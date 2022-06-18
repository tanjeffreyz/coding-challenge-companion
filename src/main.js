KEYS = [
    'accessToken',
    'login',
    'repository',
    'prevSha'
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
    fail = ((res) => {}),
    either = ((res) => {})
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
                either(data);
                return;
            }
        }
        pass(data);
        either(data);
    })
    .catch((error) => {
        console.error(`Error sending request to '${url}':`, error);
    });
}


function getPrevSha(callback) {
    chrome.storage.local.get('prevSha', (data) => {
        callback(data.prevSha);
    });
}


//////////////////////////////
//      Main Functions      //
//////////////////////////////
/**
 * Commits each file in FILES to the GitHub repository
 * @param {Array} files 
 * @param {Object} data 
 * @returns 
 */
function commitFile(files, data) {
    if (files.length === 0) return;
    const file = files.shift();
    console.log(`Committing file '${file.path}':`, file);
    const url = `https://api.github.com/repos/${data.login}/${data.repository}/contents/${file.path}`;
    sendRequest({       // Check if file already exists
        method: 'GET',
        url,
        token: data.accessToken,
        validProperties: ['Not Found'],
        pass: (res) => {
            const filter = /[\u0250-\ue007]/g;      // Filter out non-Latin characters
            const newContent = btoa(file.content.replace(filter, ''));    // Base-64 encoding
            getPrevSha((prevSha) => {
                const body = {
                    message: file.commitMessage,
                    content: newContent,
                    sha: (prevSha === null ? res.sha : prevSha)
                };
                sendRequest({        // Upload or update file
                    method: 'PUT',
                    url,
                    body,
                    token: data.accessToken,
                    pass: (res) => {
                        console.log(res);
                        console.log(`Successfully committed to '${url}'`);
                    },
                    fail: (res) => {
                        console.error(`Failed to commit to '${url}': ${res.message}`);
                    },
                    either: (res) => {
                        commitFile(files, data);
                    }
                });
            });
        }
    });
}


//////////////////////////////
//      Main Listener       //
//////////////////////////////
chrome.runtime.onMessage.addListener((message) => {
    console.log('Received message:', message);
    switch(message.type) {
        case 'clear-storage':
            clearStorage();
            break;
        case 'commit-files':     // Requires {path, content, commitMessage}
            chrome.storage.local.get(
                ['accessToken', 'login', 'repository'],
                (data) => {
                    if (data) {
                        if (data.accessToken === null) {
                            clearStorage();
                        } else if (data.repository === null) {
                            console.error(`Failed to commit because no repository has been registered`);
                        } else {
                            commitFile(message.files, data);
                        }
                    }
                }
            );
            break;
        default:
            console.error('Invalid message type:', message.type);
    }
});
