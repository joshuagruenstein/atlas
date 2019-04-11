import {html, render} from 'https://unpkg.com/lit-html?module';

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


const variableBoxDOM = document.getElementById("variableBox");

const VARIABLES = [];

function typeChangeVariable(variable) {
    let menu = Array.from(variableBoxDOM.children).filter(
        child => child.variable === variable
    )[0];

    variable.type = menu.children[0].children[0].children[1].value;

    render(variableBox(VARIABLES), variableBoxDOM);
}

function renderError(errorMessage) {
    alert(errorMessage);
    return null;
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

    return arr.map(row => row.map(el => parseFloat(el)));
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
            variable['csvData'] = parseCSV(event.target.result, variable.type);
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

const variableBox = (variables) => html `
    ${variables.map((v) => variable(v))}

    <ul class="menu text-primary mt-2" style="width:250px">
        <li class="menu-item">
            <a href="#" @click=${newVariable}>
                <i class="icon icon-plus"></i> New Variable
            </a>
        </li>
    </ul>
`;


window.onload = function() {
    render(variableBox(VARIABLES), variableBoxDOM);
}