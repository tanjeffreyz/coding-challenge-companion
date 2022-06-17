const ROOT = 'leetcode';        // Root folder in GitHub repository
const DELAY = 250;
const MAX_TIME = 30000;
const DEFAULT_DATA = {
    title: null,
    folder: null,
    difficulty: null,
    // language: null,
    description: null,
    // solution: null
}

let time = MAX_TIME;        // Don't start polling immediately
let committed = true;
let data = Object.assign({}, DEFAULT_DATA);


const TITLE_DATA_CY = 'question-title';
const DIFFICULTY_PARENT_CLASS = 'css-10o4wqw';
const DESCRIPTION_CLASS = 'content__u3I1 question-content__JfgR';
const LANGUAGE_CLASS = 'ant-select-selection-selected-value';
// const SUBMIT_BUTTON = 'submit-code-btn';
const SUBMIT_BUTTON_DATA_CY = 'run-code-btn';


//////////////////////////////////
//      Helper Functions        //
//////////////////////////////////
function getElementByAttribute(key, value) {
    return document.querySelector(`[${key}="${value}"]`);
}


function getElementByUniqueClass(classString) {
    return document.getElementsByClassName(classString)[0];
}


function formatTitle(title) {
    return title.replace(/[^a-zA-Z0-9 ]+/g, '').replace(/[ ]+/g, '-').toLowerCase();
}


function validData(dataObj) {
    for (let key in DEFAULT_DATA) {
        if (dataObj[key] === null) return false;
    }
    return true;
}


//////////////////////////////
//      Main Functions      //
//////////////////////////////
function startPoll() {
    // Reset global variables
    time = 0;
    committed = false;
    data = Object.assign({}, DEFAULT_DATA);

    // Grab static information
    const titleElement = getElementByAttribute('data-cy', TITLE_DATA_CY);
    data.title = titleElement.textContent;
    data.folder = formatTitle(data.title);

    const difficultyElement = document.getElementsByClassName(DIFFICULTY_PARENT_CLASS)[0].firstChild;
    data.difficulty = difficultyElement.textContent;

    const descriptionElement = getElementByUniqueClass(DESCRIPTION_CLASS);
    const header = `<div align="center"><h1>${data.title} (${data.difficulty})</h1></div>`;
    data.description = header + descriptionElement.innerHTML;
    console.log(data);
}


let submitButton = null;
setInterval(() => {
    if (submitButton === null) {    // Keep searching for button until it loads
        submitButton = getElementByAttribute('data-cy', SUBMIT_BUTTON_DATA_CY);
        if (submitButton !== null) {
            submitButton.onclick = startPoll;
        }
    } else if (!committed && time < MAX_TIME) {
        console.log(data);
        if (validData(data)) {
            // Commit README.md
            const folder = [ROOT, data.folder];
            chrome.runtime.sendMessage({
                type: 'commit-file',
                path: folder.concat(['README.md']).join('/'),
                commitMessage: `Description for "${data.title}"`,
                content: data.description
            })

            console.log('committed');
            committed = true;
        }
        time += DELAY;
        // console.log(time);
    }
}, DELAY);
