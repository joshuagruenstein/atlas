import {html, render} from 'https://unpkg.com/lit-html?module';

const variableBoxDOM = document.getElementById("variableBox");
const messageBoxDOM = document.getElementById("messageBox");

const VARIABLES = [];
const MESSAGES = [];

const variable = (variable) => html `
    <ul class="menu text-primary mt-2" style="width:250px" .variable=${variable}>
        <li class="menu-item pt-2">
            <div class="input-group">
                <input class="form-input" type="text" placeholder="Variable">
                <select class="form-select" @change=${() => typeChangeVariable(variable)}>
                    <option>Scalar</option>
                    <option>Vector</option>
                    <option>Matrix</option>
                </select>
            </div>
        </li>

        ${variable.type === 'Scalar' ? html`
        <li class="menu-item pt-2">
            <div class="input-group">
                <span class="input-group-addon ">Value</span>
                <input class="form-input" type="number" size="2" placeholder="10">
            </div>
        </li>
        ` : variable.type === 'Vector' ? html`
        <li class="menu-item pt-2">
            <div class="input-group">
                <span class="input-group-addon ">Length</span>
                <input class="form-input" type="number" size="2" placeholder="i">
            </div>
        </li>
        ` : html`
        <li class="menu-item pt-2">
            <div class="input-group">
                <span class="input-group-addon ">Shape</span>
                <input class="form-input" type="number" size="2" placeholder="i">
                <input class="form-input " type="number" size="2" placeholder="j">
            </div>
        </li>`}

        ${variable.type !== 'Scalar' ? html`
        <li class="menu-item">
            <a href="#" @click=${() => csvVariable(variable)}>
                <i class="icon icon-apps"></i> Set Value From CSV
            </a>
        </li>
        ` : ''}

        <li class="divider"></li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox">
                <i class="form-icon"></i> Trainable
            </label>
        </li>

        <li class="menu-item">
            <a href="#" class="text-error" @click=${() => deleteVariable(variable)}>
                <i class="icon icon-delete"></i> Delete
            </a>
        </li>
    </ul>
`;

const message = (message) => html `
    <div class="toast toast-${message.type} mt-2">
        <button class="btn btn-clear float-right" @click=${() => deleteMessage(message)}></button>
        ${message.content}
    </div>
`

const variableBox = (variables) => html `
    ${variables.map(v => variable(v))}

    <ul class="menu text-primary mt-2" style="width:250px">
        <li class="menu-item">
            <a href="#" @click=${newVariable}>
                <i class="icon icon-plus"></i> New Variable
            </a>
        </li>
    </ul>
`;


const messageBox = (messages) => html `
    ${messages.map(m => message(m))}
`


function typeChangeVariable(variable) {
    let menu = Array.from(variableBoxDOM.children).filter(
        child => child.variable === variable
    )[0];

    variable.type = menu.children[0].children[0].children[1].value;

    render(variableBox(VARIABLES), variableBoxDOM);
}

function renderError(errorMessage) {
    MESSAGES.push({
        type:'error',
        content:errorMessage
    });

    render(messageBox(MESSAGES), messageBoxDOM);

    return null;
}

function deleteMessage(message) {
    MESSAGES.splice(MESSAGES.indexOf(message), 1);

    render(messageBox(MESSAGES), messageBoxDOM);
}

function parseCSV(str, type) {
    let arr = [];

    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || []; 
        arr[row][col] = arr[row][col] || '';

        if (cc == '"') return renderError("No quotes allowed in CSV files.");
        if (cc == ',') { ++col; continue; }

        if (cc == '\r' && nc == '\n') { ++row; col = 0; ++c; continue; }

        if (cc == '\n') { ++row; col = 0; continue; }
        if (cc == '\r') { ++row; col = 0; continue; }

        arr[row][col] += cc;
    }

    if (type === 'Vector' && arr.length > 1) return renderError("Vector CSVs can only have one row.");
    if (!arr.every((row, i, arr) => row.length === arr[0].length)) return renderError("All rows must be same length");
    if (!arr.every((row, i, arr) => row.every((el, i, row) => !isNaN(el)))) return renderError("All CSV elements must be numeric.");

    arr = arr.map(row => row.map(el => parseFloat(el)));

    if (type === 'Vector') arr = arr[0];

    return arr;
}

function csvVariable(variable) {
    let oldPicker = document.getElementById("filePicker");
    var picker = oldPicker.cloneNode(true);
    oldPicker.parentNode.replaceChild(picker, oldPicker);

    picker.addEventListener('change', function() {
        if (picker.files.length === 0) return;
        let file = picker.files[0];

        if (file.type !== "text/csv") return renderError("Must upload valid CSV file.");

        let reader = new FileReader();
        reader.onload = function(event) {
            variable['data'] = parseCSV(event.target.result, variable.type);
        }

        reader.readAsText(file);
    }, false);

    picker.click();
}

function deleteVariable(variable) {
    VARIABLES.splice(VARIABLES.indexOf(variable), 1);

    render(variableBox(VARIABLES), variableBoxDOM);
}

function newVariable(variable) {
    VARIABLES.push({ type:"Scalar" });

    render(variableBox(VARIABLES), variableBoxDOM);
}

function getVariables() {
    for (let el of variableBoxDOM.children) {
        if (!el.variable) continue;


        let name = el.children[0].children[0].children[0].value;
        if (name.length !== 1) return renderError("Variable names must be single letters.");
        if (!(/^[a-z]+$/i.test(name))) return renderError("Variable names must be letters only.");
        
        el.variable['name'] = name;

        if (el.variable.type === 'Scalar') {
            let value = el.children[1].children[0].children[1].value;

            if (value === '') el.variable['data'] = null;
            else if (isNaN(value)) return renderError("Scalar values must be empty (random) or numeric.");
            else el.variable['data'] = parseFloat(value);
        }

        else if (el.variable.type === 'Vector') {
            let length = el.children[1].children[0].children[1].value;
            if (!(/^\d+$/.test(length))) return renderError("Vector lengths must be positive integers.");
            else el.variable['length'] = parseInt(length);

            if (!el.variable['data'] || !Array.isArray(el.variable['data'])) return renderError("Must upload initial CSV for vectors.");
            else if (el.variable.data.length !== el.variable.length) return renderError(`Vector ${name} has declared length ${length} but CSV length ${el.variable.data.length}.`);
        }

        else {
            let length_i = el.children[1].children[0].children[1].value;
            let length_j = el.children[1].children[0].children[2].value;

            if (!(/^\d+$/.test(length_i)) || !(/^\d+$/.test(length_j))) return renderError("Matrix shape must be positive integers.");
            else el.variable['shape'] = [parseInt(length_i), parseInt(length_j)];

            if (!el.variable['data'] || !Array.isArray(el.variable['data'])) return renderError("Must upload initial CSV for matrices.");
            else if (el.variable.data.length !== el.variable.shape[0] || el.variable.data[0].length !== el.variable.shape[1]) return renderError(`Matrix ${name} has declared shape ${el.variable.shape} but CSV shape ${[el.variable.data.length,el.variable.data[0].length]}.`);
        }

        el.variable['trainable'] = el.getElementsByClassName("form-switch")[0].children[0].checked;
    }

    return VARIABLES;
}

window.onload = function() {
    render(variableBox(VARIABLES), variableBoxDOM);
}