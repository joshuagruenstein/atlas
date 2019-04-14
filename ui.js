import { html, render } from 'https://unpkg.com/lit-html?module';
import Plot from './plot.js';

const variableBoxDOM = document.getElementById('variableBox');
const messageBoxDOM = document.getElementById('messageBox');
const settingsBoxDOM = document.getElementById('settingsBox');
const visualizerBoxDOM = document.getElementById('visualizerBox');

const VARIABLES = [];
const MESSAGES = [];
const SETTINGS = {};

let ON_VISUALIZER_CLICK;
let ON_VISUALIZER_CANCEL;
let ON_LOAD;

const startVisualizerBox = () => html`
    <div class="empty panel">
        <p class="empty-title h5">The loss surface has not been generated.</p>
        <p class="empty-subtitle">
            Click the button to begin visualization. This may take some time.
        </p>

        <div class="empty-action">
            <button class="btn btn-primary" @click=${ON_VISUALIZER_CLICK}>
                Generate loss surface
            </button>
        </div>
    </div>
`;

const plotVisualizerBox = () => html`
    <div class="panel">
        <div id="plotBox"></div>
        <button class="btn btn-error m-2" @click=${ON_VISUALIZER_CANCEL}>
            Cancel
        </button>
    </div>
`;

const loadVisualizerBox = (progress, message) => html`
    <div class="empty panel">
        <p class="empty-title h5">The loss surface is being generated.</p>
        <p class="empty-subtitle" style="width:100%">
            <p>${message}</p>
            <progress class="progress" value=${progress} max="100"></progress>
        </p>

        <div class="empty-action">
            <button class="btn btn-error" @click=${ON_VISUALIZER_CANCEL}>Cancel</button>
        </div>
    </div>
`;

const variable = variable => html`
    <ul
        class="menu text-primary mt-2"
        style="width:250px"
        .variable=${variable}
    >
        <li class="menu-item pt-2">
            <div class="input-group">
                <input class="form-input" type="text" placeholder="Variable" />
                <select
                    class="form-select"
                    @change=${() => typeChangeVariable(variable)}
                >
                    <option>Scalar</option>
                    <option>Vector</option>
                    <option>Matrix</option>
                </select>
            </div>
        </li>

        ${variable.type === 'Scalar'
            ? html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Value</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="10"
                          />
                      </div>
                  </li>
              `
            : variable.type === 'Vector'
            ? html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Length</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="i"
                          />
                      </div>
                  </li>
              `
            : html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Shape</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="i"
                          />
                          <input
                              class="form-input "
                              type="number"
                              size="2"
                              placeholder="j"
                          />
                      </div>
                  </li>
              `}
        ${variable.type !== 'Scalar'
            ? html`
                  <li class="menu-item">
                      <a href="#" @click=${() => csvVariable(variable)}>
                          <i class="icon icon-apps"></i> Set Value From CSV
                      </a>
                  </li>
              `
            : ''}

        <li class="divider"></li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox" />
                <i class="form-icon"></i> Trainable
            </label>
        </li>

        <li class="menu-item">
            <a
                href="#"
                class="text-error"
                @click=${() => deleteVariable(variable)}
            >
                <i class="icon icon-delete"></i> Delete
            </a>
        </li>
    </ul>
`;

const message = message => html`
    <div class="toast toast-${message.type} mt-2">
        <button
            class="btn btn-clear float-right"
            @click=${() => deleteMessage(message)}
        ></button>
        ${message.content}
    </div>
`;

const variableBox = variables => html`
    ${variables.map(v => variable(v))}

    <ul class="menu text-primary mt-2 mb-2" style="width:250px">
        <li class="menu-item">
            <a href="#" @click=${newVariable}>
                <i class="icon icon-plus"></i> New Variable
            </a>
        </li>
    </ul>
`;

const messageBox = messages => html`
    ${messages.map(m => message(m))}
`;

const settingsBox = settings => html`
    <ul class="menu">
        <li class="divider" data-content="SURFACE"></li>

        <li class="menu-item">
            <div class="input-group">
                <span class="input-group-addon">Granularity</span>
                <input class="form-input" type="number" size="2" value="1000" />
            </div>
        </li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox" />

                <i class="form-icon"></i> Show optimizer path
            </label>
        </li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox" />

                <i class="form-icon"></i> Use PCA directions
            </label>
        </li>

        <li class="divider" data-content="OPTIMIZER"></li>

        <li class="menu-item">
            <select class="form-select" @change=${changeOptimizer}>
                <option>SGD</option>
                <option>Momentum</option>
                <option>Adagrad</option>
                <option>Adadelta</option>
                <option>Adam</option>
                <option>RMSProp</option>
            </select>
        </li>

        <li class="menu-item pt-2">
            <div class="input-group">
                <span class="input-group-addon ">Learning Rate</span>
                <input
                    class="form-input"
                    type="number"
                    size="2"
                    placeholder="0.01"
                />
            </div>
        </li>

        ${settings.optimizer === 'Momentum'
            ? html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Momentum</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="0.01"
                          />
                      </div>
                  </li>
              `
            : ''}

        <li class="menu-item pt-2 pb-2">
            <div class="input-group">
                <span class="input-group-addon ">Epochs</span>
                <input class="form-input" type="number" size="2" value="50" />
            </div>
        </li>
    </ul>
`;

const changeOptimizer = () => {
    SETTINGS['optimizer'] =
        settingsBoxDOM.children[0].children[5].children[0].value;
    render(settingsBox(SETTINGS), settingsBoxDOM);
};

const typeChangeVariable = variable => {
    let menu = Array.from(variableBoxDOM.children).filter(
        child => child.variable === variable
    )[0];

    variable.type = menu.children[0].children[0].children[1].value;

    render(variableBox(VARIABLES), variableBoxDOM);
};

const renderMessage = (type, message) => {
    MESSAGES.push({
        type: type,
        content: message
    });

    render(messageBox(MESSAGES), messageBoxDOM);

    return null;
};

const renderError = errorMessage => renderMessage('error', errorMessage);

const deleteMessage = message => {
    MESSAGES.splice(MESSAGES.indexOf(message), 1);

    render(messageBox(MESSAGES), messageBoxDOM);
};

const parseCSV = (str, type) => {
    let arr = [];

    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c],
            nc = str[c + 1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc == '"') return renderError('No quotes allowed in CSV files.');
        if (cc == ',') {
            ++col;
            continue;
        }

        if (cc == '\r' && nc == '\n') {
            ++row;
            col = 0;
            ++c;
            continue;
        }

        if (cc == '\n') {
            ++row;
            col = 0;
            continue;
        }
        if (cc == '\r') {
            ++row;
            col = 0;
            continue;
        }

        arr[row][col] += cc;
    }

    if (type === 'Vector' && arr.length > 1)
        return renderError('Vector CSVs can only have one row.');
    if (!arr.every((row, i, arr) => row.length === arr[0].length))
        return renderError('All rows must be same length');
    if (!arr.every((row, i, arr) => row.every((el, i, row) => !isNaN(el))))
        return renderError('All CSV elements must be numeric.');

    arr = arr.map(row => row.map(el => parseFloat(el)));

    if (type === 'Vector') arr = arr[0];

    return arr;
};

function csvVariable(variable) {
    let oldPicker = document.getElementById('filePicker');
    var picker = oldPicker.cloneNode(true);
    oldPicker.parentNode.replaceChild(picker, oldPicker);

    picker.addEventListener(
        'change',
        function() {
            if (picker.files.length === 0) return;
            let file = picker.files[0];

            if (file.type !== 'text/csv')
                return renderError('Must upload valid CSV file.');

            let reader = new FileReader();
            reader.onload = function(event) {
                variable['data'] = parseCSV(event.target.result, variable.type);
            };

            reader.readAsText(file);
        },
        false
    );

    picker.click();
}

const deleteVariable = variable => {
    VARIABLES.splice(VARIABLES.indexOf(variable), 1);

    render(variableBox(VARIABLES), variableBoxDOM);
};

const newVariable = variable => {
    VARIABLES.push({ type: 'Scalar' });

    render(variableBox(VARIABLES), variableBoxDOM);
};

class UI {
    setOnloadHandler(handler) {
        ON_LOAD = handler;
    }

    renderError(errorMessage) {
        return renderMessage('error', errorMessage);
    }

    renderSuccess(successMessage) {
        return renderMessage('success', successMessage);
    }

    setVisualizerStartHandler(handler) {
        ON_VISUALIZER_CLICK = handler;
    }

    setVisualizerCancelHandler(handler) {
        ON_VISUALIZER_CANCEL = handler;
    }

    setVisualizerStart() {
        return render(startVisualizerBox(), visualizerBoxDOM);
    }

    setVisualizerLoading(progress, message) {
        return render(loadVisualizerBox(progress, message), visualizerBoxDOM);
    }

    setVisualizerPlotSurface(data) {
        render(plotVisualizerBox(), visualizerBoxDOM);
        let plot = new Plot('plotBox', 'Loss Surface');
        plot.surface(data);
    }

    setVisualizerPlotLine(x, y) {
        render(plotVisualizerBox(), visualizerBoxDOM);
        let plot = new Plot('plotBox', 'Loss Curve');
        plot.line(x, y);
    }

    getVariables() {
        for (let el of variableBoxDOM.children) {
            if (!el.variable) continue;

            let name = el.children[0].children[0].children[0].value;
            if (name.length !== 1)
                return renderError('Variable names must be single letters.');
            if (!/^[a-z]+$/i.test(name))
                return renderError('Variable names must be letters only.');

            el.variable['name'] = name;

            if (el.variable.type === 'Scalar') {
                let value = el.children[1].children[0].children[1].value;

                if (value === '') el.variable['data'] = null;
                else if (isNaN(value))
                    return renderError(
                        'Scalar values must be empty (random) or numeric.'
                    );
                else el.variable['data'] = parseFloat(value);
            } else if (el.variable.type === 'Vector') {
                let length = el.children[1].children[0].children[1].value;
                if (!/^\d+$/.test(length))
                    return renderError(
                        'Vector lengths must be positive integers.'
                    );
                else el.variable['length'] = parseInt(length);

                if (!el.variable['data'] || !Array.isArray(el.variable['data']))
                    return renderError('Must upload initial CSV for vectors.');
                else if (el.variable.data.length !== el.variable.length)
                    return renderError(
                        `Vector ${name} has declared length ${length} but CSV length ${
                            el.variable.data.length
                        }.`
                    );
            } else {
                let length_i = el.children[1].children[0].children[1].value;
                let length_j = el.children[1].children[0].children[2].value;

                if (!/^\d+$/.test(length_i) || !/^\d+$/.test(length_j))
                    return renderError(
                        'Matrix shape must be positive integers.'
                    );
                else
                    el.variable['shape'] = [
                        parseInt(length_i),
                        parseInt(length_j)
                    ];

                if (!el.variable['data'] || !Array.isArray(el.variable['data']))
                    return renderError('Must upload initial CSV for matrices.');
                else if (
                    el.variable.data.length !== el.variable.shape[0] ||
                    el.variable.data[0].length !== el.variable.shape[1]
                )
                    return renderError(
                        `Matrix ${name} has declared shape ${
                            el.variable.shape
                        } but CSV shape ${[
                            el.variable.data.length,
                            el.variable.data[0].length
                        ]}.`
                    );
            }

            el.variable['trainable'] = el.getElementsByClassName(
                'form-switch'
            )[0].children[0].checked;
        }

        return VARIABLES;
    }

    getSettings() {
        let granularity =
            settingsBoxDOM.children[0].children[1].children[0].children[1]
                .value;
        if (isNaN(granularity) || parseInt(granularity) < 0)
            return renderError(
                'Must provide positive integer granularity.'
            );

        SETTINGS['granularity'] = parseInt(granularity);

        SETTINGS['showPath'] =
            settingsBoxDOM.children[0].children[2].children[0].children[0].checked;

        SETTINGS['usePCA'] =
            settingsBoxDOM.children[0].children[3].children[0].children[0].checked;

        let lr =
            settingsBoxDOM.children[0].children[6].children[0].children[1]
                .value;
        if (isNaN(lr) || parseFloat(lr) < 0)
            return renderError('Must provide positive numeric learning rate.');

        SETTINGS['learningRate'] = parseFloat(lr);

        if (SETTINGS['optimizer'] === 'Momentum') {
            let momentum =
                settingsBoxDOM.children[0].children[7].children[0].children[1]
                    .value;
            if (isNaN(momentum) || parseFloat(momentum) < 0)
                return renderError('Must provide positive numeric momentum.');
            SETTINGS['momentum'] = parseFloat(momentum);
        } else delete SETTINGS.momentum;

        let epochs =
            settingsBoxDOM.children[0].children[
                SETTINGS['optimizer'] === 'Momentum' ? 7 : 6
            ].children[0].children[1].value;

        if (isNaN(epochs) || parseInt(epochs) < 0)
            return renderError(
                'Must provide positive integer number of epochs.'
            );
        SETTINGS['epochs'] = parseInt(epochs);

        return SETTINGS;
    }
}

window.onload = onload => {
    render(variableBox(VARIABLES), variableBoxDOM);
    render(settingsBox(SETTINGS), settingsBoxDOM);
    render(startVisualizerBox(), visualizerBoxDOM);
    ON_LOAD();
};

export default new UI();
