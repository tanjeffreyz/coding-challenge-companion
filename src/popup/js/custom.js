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
    const headers = {};
    if (typeof token !== 'undefined') {
        headers['Authorization'] = `token ${token}`;
    }
    const config = {
        method,
        headers,
        body: (typeof body === 'undefined' ? null : JSON.stringify(body))
    };

    fetch(url, config)
    .then((res) => {
        if (res.status === 401) {
            reAuth();
        }
        return res.json();
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


function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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


const registerRepoStatic = document.getElementById('register-repo-static');
const registerRepoLoading = document.getElementById('register-repo-loading');
document.getElementById('register-repo-button').onclick = () => {
    const repoName = registerRepoInput.value.trim('-');
    if (repoName === '') return;

    // Show loading animation
    registerRepoStatic.hidden = true;
    registerRepoLoading.hidden = false;
    chrome.storage.local.get('accessToken', (data) => {
        sendRequest({
            method: 'POST',
            url: 'https://api.github.com/repos/tanjeffreyz/coding-challenges-template/generate',
            token: data.accessToken,
            body: {
                name: repoName,
                private: true,
                description: 'A challenge a day keeps the brain cells awake! 😉'
            },
            validProperties: ['Could not clone: Name already exists on this account'],
            pass: (res) => {
                chrome.storage.local.set({'repository': repoName}, () => {
                    console.log(`Successfully registered repository '${repoName}'`);
                    main();
                });
            },
            either: (res) => {
                // Hide loading animation until next time
                registerRepoStatic.hidden = false;
                registerRepoLoading.hidden = true;
            }
        });
    });
};


// Settings
document.getElementById('settings-change-repo').onclick = () => {
    chrome.storage.local.set({repository: null}, main);
};

document.getElementById('settings-sign-out').onclick = () => {
    chrome.runtime.sendMessage({type: 'clear-storage'}, main);
};


//////////////////////////////
//      Graph Metrics       //
//////////////////////////////
function graphLevels(levels) {
    const labels = [];
    const counts = [];
    const colors = [];
    for (let i = levels.length - 1; i >= 0; i--) {
        labels.push(capitalize(levels[i].name));
        counts.push(levels[i].count);
        colors.push(levels[i].color);
    }
    const config = {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                label: 'Levels',
                data: counts,
                backgroundColor: colors
            }]
        },
        options: {
            plugins: {
                legend: {
                    reverse: true,
                    labels: {
                        usePointStyle: true
                    }
                }
            }
        }
    };
    const levelsChart = new Chart(document.getElementById('summary-levels'), config);
}

function graphLanguages(languages) {
    const labels = [];
    const counts = [];
    const colors = [];
    for (let language of languages) {
        labels.push(language.name);
        counts.push(language.count);
        colors.push(language.color);
    }
    const config = {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: counts,
                backgroundColor: colors
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    ticks: {
                        stepSize: 1,
                        display: false
                    },
                    grid: {
                        drawBorder: false,
                        display: false
                    }
                },
                y: {
                    grid: {
                        drawBorder: false,
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    }
    const languagesChart = new Chart(document.getElementById('summary-languages'), config);
}

function graphMetrics() {
    chrome.storage.local.get(
        ['accessToken', 'login', 'repository'],
        (data) => {
            if (data !== null && 
                data.accessToken !== null &&
                data.login !== null && 
                data.repository !== null) {
                sendRequest({
                    method: 'GET',
                    url: `https://api.github.com/repos/${data.login}/${data.repository}/contents/src/output/stats.json`,
                    token: data.accessToken,
                    pass: (res) => {
                        stats = JSON.parse(atob(res.content));
                        graphLevels(stats.levels);
                        graphLanguages(stats.languages);
                    }
                });
            }
        }
    );
}


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
                    graphMetrics();
                }
                getUserLogin(token);     // Retrieve username and name
            }
        }
    );
}


main();
