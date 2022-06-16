KEYS = [
    'access-token',
    'name',
    'login',
    'email',
    'repository'
];


chrome.runtime.onMessage.addListener((message) => {
    let response = null;
    switch(message.type) {
        case 'clear-storage':
            for (let i = 0; i < KEYS.length; i++) {
                const dict = {};
                dict[KEYS[i]] = null;
                chrome.storage.local.set(dict, () => {});
            }
            break;
        case 'commit-file':
            const name = message.name;
            // chrome.storage.
            break;
    }
    message.reponse = response;
});
