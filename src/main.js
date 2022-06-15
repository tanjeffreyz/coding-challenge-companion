const CLIENT_ID = '4c6317c58473acf7128e';


function oAuth2() {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
    chrome.tabs.create({url, active: true}, () => {});
}

oAuth2();

chrome.runtime.onMessage.addListener((message) => {
    switch(message.type) {
        case 'set-access-token':
            chrome.storage.local.set({'access-token': message.token}, () => {});
            break;
    }
});

// sms microservice settings.xml