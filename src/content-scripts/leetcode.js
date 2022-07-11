const ROOT = 'leetcode';        // Root folder in GitHub repository
const EXTENSIONS = {
    'C++':          'cpp',
    'Java':         'java',
    'Python':       'py',
    'Python3':      'py',
    'C':            'c',
    'C#':           'cs',
    'JavaScript':   'js',
    'Ruby':         'rb',
    'Swift':        'swift',
    'Go':           'go',
    'Scala':        'sc',
    'Kotlin':       'kt',
    'Rust':         'rs',
    'PHP':          'php',
    'TypeScript':   'ts',
    'Racket':       'rkt',
    'Erlang':       'erl',
    'Elixir':       'ex'
}

const DELAY = 250;
const MAX_TIME = 30000;
const DEFAULT_DATA = {
    title: null,
    folder: null,
    difficulty: null,
    language: null,
    description: null,
    solution: null,
    runtime: null,
    runtimePercentile: null,
    memory: null,
    memoryPercentile: null,
    topics: null
}

let time = MAX_TIME;        // Don't start polling immediately
let committed = true;
let data = Object.assign({}, DEFAULT_DATA);

const SUCCESS_CLASS = 'success__3Ai7';
const TITLE_DATA_CY = 'question-title';
const DIFFICULTY_PARENT_CLASS = 'css-10o4wqw';
const DESCRIPTION_CLASS = 'content__u3I1 question-content__JfgR';
const LANGUAGE_CLASS = 'ant-select-selection-selected-value';
const CODE_CLASS = 'CodeMirror-code';
const CODE_SCROLL_CLASS = 'CodeMirror-scroll';
const CODE_LINE_NUMBER_SELECTOR = '.CodeMirror-linenumber'
const CODE_LINE_SELECTOR = '.CodeMirror-line';
const RESULTS_CLASS = 'data__HC-i';
const TOPIC_CLASS = 'topic-tag__1jni';
const SUBMIT_BUTTON_DATA_CY = 'submit-code-btn';


//////////////////////////////////
//      Helper Functions        //
//////////////////////////////////
function getElementByAttribute(key, value) {
    return document.querySelector(`[${key}="${value}"]`);
}


function getElementByUniqueClass(classString) {
    const elementList = document.getElementsByClassName(classString);
    if (elementList.length > 0) {
        return elementList[0];
    }
    return null;
}


function formatPath(title) {
    const alphaNumeric = title.replace(/[^a-zA-Z0-9\(\) ]+/g, '');
    const dashed = alphaNumeric.replace(/[\(\) ]+/g, '_');
    const trimmed = dashed.replace(/^_+|_+$/g, '');
    return trimmed.toLowerCase();
}


function validData(dataObj) {
    for (let key in DEFAULT_DATA) {
        const value = dataObj[key];
        if (typeof value === 'undefined' || value === null) return false;
    }
    return true;
}


//////////////////////////////
//      Main Functions      //
//////////////////////////////
function parseCode(data) {
    const tempPre = document.createElement('pre');
    const codeScroll = getElementByUniqueClass(CODE_SCROLL_CLASS);
    const delayMS = 1;

    const lines = [];
    let lastParsed = 0;
    const recur = (y) => {
        if (y === 0 || codeScroll.scrollHeight - codeScroll.scrollTop > codeScroll.clientHeight) {
            codeScroll.scroll(0, y);        // Scroll down to fetch more lines of code
            setTimeout(() => {
                const codeContainer = getElementByUniqueClass(CODE_CLASS);
                const lineNumberProbe = codeContainer.lastChild.querySelector(CODE_LINE_NUMBER_SELECTOR);
                if (lineNumberProbe === null || parseInt(lineNumberProbe.innerHTML) <= lastParsed) {
                    recur(y);       // New code hasn't loaded, so try again
                } else {
                    // Parse new lines of code
                    const codeLines = codeContainer.children;
                    for (let line of codeLines) {
                        const lineNumber = parseInt(line.querySelector(CODE_LINE_NUMBER_SELECTOR).innerHTML);
                        if (lineNumber > lastParsed) {
                            const lineContents = line.querySelector(CODE_LINE_SELECTOR).innerHTML.replace(/\&nbsp;/g, ' ');
                            tempPre.innerHTML = lineContents;
                            lines.push(tempPre.textContent.trimEnd());
                            lastParsed = lineNumber;
                        }
                    }
                    recur(y + codeScroll.clientHeight);
                }
            }, delayMS);
        } else {
            console.log(`Parsed ${lines.length} lines of code`);
            data.solution = lines.join('\n');
        }
    };
    recur(0);
}


function startPoll() {
    // Reset global variables
    time = 0;
    committed = false;
    data = Object.assign({}, DEFAULT_DATA);

    // Grab static information
    const titleElement = getElementByAttribute('data-cy', TITLE_DATA_CY);
    data.title = titleElement.textContent;
    data.folder = formatPath(data.title);

    const difficultyElement = document.getElementsByClassName(DIFFICULTY_PARENT_CLASS)[0].firstChild;
    data.difficulty = difficultyElement.textContent;

    const descriptionElement = getElementByUniqueClass(DESCRIPTION_CLASS);
    const header = `<div align="center"><h1>${data.title} (${data.difficulty})</h1></div>`;
    data.description = header + '\n\n' + descriptionElement.innerHTML;

    parseCode(data);

    const languageElement = getElementByUniqueClass(LANGUAGE_CLASS);
    data.language = languageElement.textContent;

    const topicElements = document.getElementsByClassName(TOPIC_CLASS);
    data.topics = [];
    for (let topic of topicElements) {
        data.topics.push({
            name: topic.textContent,
            link: topic.href
        });
    }
}


let submitButton = null;
setInterval(() => {
    if (submitButton === null) {        // Keep searching for button until it loads
        submitButton = getElementByAttribute('data-cy', SUBMIT_BUTTON_DATA_CY);
        if (submitButton !== null) {
            submitButton.onclick = startPoll;
        }
    } else if (!committed && time < MAX_TIME) {     // Check for submission results
        console.log('Polled');
        const successElement = getElementByUniqueClass(SUCCESS_CLASS);
        if (successElement !== null) {
            const resultsElements = document.getElementsByClassName(RESULTS_CLASS);
            const contents = [];
            for (let element of resultsElements) {
                contents.push(element.textContent);
            }
            [data.runtime, data.runtimePercentile, data.memory, data.memoryPercentile] = contents;

            if (validData(data)) {
                const defaultCommitMessage = `${data.title} (${data.difficulty})`;
                const folder = [ROOT, data.folder];
                
                // README.md
                const readme = {
                    path: folder.concat(['README.md']).join('/'),
                    commitMessage: defaultCommitMessage,
                    content: data.description + '\n'
                }

                // Information
                const infoJson = {
                    title: data.title,
                    level: data.difficulty,
                    topics: data.topics
                }
                const info = {
                    path: folder.concat(['info.json']).join('/'),
                    commitMessage: defaultCommitMessage,
                    content: JSON.stringify(infoJson, null, 2) + '\n'
                }
                
                // Solution
                const runtimeMessage = `${data.runtime}, ${data.runtimePercentile}`;
                const memoryMessage = `${data.memory}, ${data.memoryPercentile}`;
                const solution = {
                    path: folder.concat([`solution.${EXTENSIONS[data.language]}`]).join('/'),
                    commitMessage: runtimeMessage + ' | ' + memoryMessage,
                    content: data.solution
                };

                chrome.runtime.sendMessage({
                    type: 'commit-files',
                    files: [readme, info, solution]
                });

                console.log(`Committed submission for "${data.title}"`);
                committed = true;
            }
        }
        time += DELAY;
    }
}, DELAY);
