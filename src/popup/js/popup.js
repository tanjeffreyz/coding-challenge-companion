const CLIENT_ID = '4c6317c58473acf7128e';


document.getElementById('authenticate').onclick = () => {
    const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo`;
    chrome.tabs.create({url, active: true}, () => {});
};
