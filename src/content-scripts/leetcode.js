const DELAY = 250;
const MAX_TIME = 30000;
const DEFAULT_DATA = {
    title: null,
    folder: null,
    difficulty: null,
    description: null
}

let time = MAX_TIME;        // Don't start polling immediately
let committed = true;
let data = Object.assign({}, DEFAULT_DATA);


const TITLE_DATA_CY = 'question-title';
const DIFFICULTY_PARENT_CLASS = 'css-10o4wqw';
const DESCRIPTION_CLASS = 'content__u3I1 question-content__JfgR';
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


function validContents(contentObj) {
    for (let key in DEFAULT_DATA) {
        if (data[key] === null) return false;
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
    data.description = descriptionElement.innerHTML;
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
        time += DELAY;
        console.log(time);
    }
}, DELAY);
