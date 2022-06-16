KEYS = [
    'access-token',
    'name',
    'login',
    'email',
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
        if (obj[member] === null) return true;
    }
    return false;
}


chrome.runtime.onMessage.addListener((message) => {
    let response = null;
    switch(message.type) {
        case 'clear-storage':
            clearStorage();
            break;
        case 'commit-file':
            chrome.storage.local.get(
                ['name', 'login', 'email', 'repository'],
                (data) => {
                    if (data && noNullMembers(data)) {
                        const url = `https://api.github.com/repos/${data.login}/${data.repository}/${message.path}`;
                        
                    } else {
                        clearStorage();
                    }
                }
            );
            break;
    }
    message.reponse = response;
});
