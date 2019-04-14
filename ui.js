import { render } from 'https://unpkg.com/lit-html?module';

import {
    navbarBox,
    startVisualizerBox,
    plotVisualizerBox,
    loadVisualizerBox,
    modalBox,
    variableBox,
    messageBox,
    settingsBox
} from './templates.js';

import Plot from './plot.js';

class UI {
    constructor() {
        this.variables = [];
        this.messages = [];
        this.settings = {};

        this.variableBoxDOM = document.getElementById('variableBox');
        this.messageBoxDOM = document.getElementById('messageBox');
        this.settingsBoxDOM = document.getElementById('settingsBox');
        this.visualizerBoxDOM = document.getElementById('visualizerBox');
        this.modalBoxDOM = document.getElementById('modalBox');
        this.navbarBoxDOM = document.getElementById('navbarBox');

        window.onload = onload => {
            this.setVisualizerStart();
            this.refreshView();
            this.onLoad();
        };
    }

    changeOptimizer() {
        this.settings['optimizer'] =
            this.settingsBoxDOM.children[0].children[5].children[0].value;
        
        this.refreshView();
    };

    typeChangeVariable(variable) {
        let menu = Array.from(this.variableBoxDOM.children).filter(
            child => child.variable === variable
        )[0];

        variable.type = menu.children[0].children[0].children[1].value;

        this.refreshView();
    }

    renderMessage(type, message) {
        this.messages.push({
            type: type,
            content: message
        });

        this.refreshView();

        return null;
    }

    deleteMessage(message) {
        this.messages.splice(this.messages.indexOf(message), 1);

        this.refreshView();
    }

    parseCSV(str, type) {
        let arr = [];

        for (let row = 0, col = 0, c = 0; c < str.length; c++) {
            let cc = str[c],
                nc = str[c + 1];
            arr[row] = arr[row] || [];
            arr[row][col] = arr[row][col] || '';

            if (cc == '"') return this.renderError('No quotes allowed in CSV files.');
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
            return this.renderError('Vector CSVs can only have one row.');
        if (!arr.every((row, i, arr) => row.length === arr[0].length))
            return this.renderError('All rows must be same length');
        if (!arr.every((row, i, arr) => row.every((el, i, row) => !isNaN(el))))
            return this.renderError('All CSV elements must be numeric.');

        arr = arr.map(row => row.map(el => parseFloat(el)));

        if (type === 'Vector') arr = arr[0];

        return arr;
    }

    csvVariable(variable) {
        let oldPicker = document.getElementById('filePicker');
        let picker = oldPicker.cloneNode(true);
        oldPicker.parentNode.replaceChild(picker, oldPicker);

        picker.addEventListener(
            'change',
            function() {
                if (picker.files.length === 0) return;
                let file = picker.files[0];

                if (file.type !== 'text/csv')
                    return this.renderError('Must upload valid CSV file.');

                let reader = new FileReader();
                reader.onload = function(event) {
                    variable['data'] = this.parseCSV(event.target.result, variable.type);
                };

                reader.readAsText(file);
            },
            false
        );

        picker.click();
    }

    deleteVariable(variable) {
        this.variables.splice(this.variables.indexOf(variable), 1);
        this.refreshView();
    }

    newVariable(variable) {
        this.variables.push({ type: 'Scalar' });
        this.refreshView();
    }

    refreshView() {
        render(navbarBox(this.showModal.bind(this)), this.navbarBoxDOM);

        render(variableBox(this.variables, this.typeChangeVariable.bind(this), this.csvVariable.bind(this), this.deleteVariable.bind(this), this.newVariable.bind(this)), this.variableBoxDOM);
        render(settingsBox(this.settings, this.changeOptimizer.bind(this)), this.settingsBoxDOM);
        render(messageBox(this.messages, this.deleteMessage.bind(this)), this.messageBoxDOM);
    }

    closeModal() {
        render(modalBox(false, this.closeModal.bind(this)), this.modalBoxDOM);
    }

    showModal() {
        render(modalBox(true, this.closeModal.bind(this)), this.modalBoxDOM);
    }

    setOnloadHandler(handler) {
        this.onLoad = handler;
    }

    renderError(errorMessage) {
        return this.renderMessage('error', errorMessage);
    }

    renderSuccess(successMessage) {
        return this.renderMessage('success', successMessage);
    }

    setVisualizerStartHandler(handler) {
        this.onStart = handler;
    }

    setVisualizerCancelHandler(handler) {
        this.onCancel = handler;
    }

    setVisualizerStart() {
        return render(startVisualizerBox(), this.visualizerBoxDOM);
    }

    setVisualizerLoading(progress, message) {
        return render(loadVisualizerBox(progress, message, this.onCancel), this.visualizerBoxDOM);
    }

    setVisualizerPlotSurface(data) {
        render(plotVisualizerBox(this.onCancel), this.visualizerBoxDOM);
        let plot = new Plot('plotBox', 'Loss Surface');
        plot.surface(data);
    }

    setVisualizerPlotLine(x, y) {
        render(plotVisualizerBox(this.onCancel), this.visualizerBoxDOM);
        let plot = new Plot('plotBox', 'Loss Curve');
        plot.line(x, y);
    }

    getVariables() {
        for (let el of this.variableBoxDOM.children) {
            if (!el.variable) continue;

            let name = el.children[0].children[0].children[0].value;
            if (name.length !== 1)
                return this.renderError('Variable names must be single letters.');
            if (!/^[a-z]+$/i.test(name))
                return this.renderError('Variable names must be letters only.');

            el.variable['name'] = name;
            el.variable['trainable'] = el.getElementsByClassName(
                'form-switch'
            )[0].children[0].checked;

            if (el.variable.type === 'Scalar') {
                let value = el.children[1].children[0].children[1].value;

                if (value === '') el.variable['data'] = null;
                else if (isNaN(value))
                    return this.renderError(
                        'Scalar values must be empty (random) or numeric.'
                    );
                else el.variable['data'] = parseFloat(value);
            } else if (el.variable.type === 'Vector') {
                let length = el.children[1].children[0].children[1].value;
                if (!/^\d+$/.test(length))
                    return this.renderError(
                        'Vector lengths must be positive integers.'
                    );
                else el.variable['length'] = parseInt(length);

                if (!el.variable.trainable && (!el.variable['data'] || !Array.isArray(el.variable['data'])))
                    return this.renderError("Must provide CSV data for non-trainable vectors.");

                else if (!el.variable['data']) el.variable['data'] = null;

                else if (!Array.isArray(el.variable['data']) || el.variable.data.length !== el.variable.length)
                    return this.renderError(
                        `Vector ${name} has declared length ${length} but CSV length ${
                            el.variable.data.length
                        }.`
                    );

            } else {
                let length_i = el.children[1].children[0].children[1].value;
                let length_j = el.children[1].children[0].children[2].value;

                if (!/^\d+$/.test(length_i) || !/^\d+$/.test(length_j))
                    return this.renderError(
                        'Matrix shape must be positive integers.'
                    );
                else
                    el.variable['shape'] = [
                        parseInt(length_i),
                        parseInt(length_j)
                    ];

                if (!el.variable.trainable && (!el.variable['data'] || !Array.isArray(el.variable['data'])))
                    return this.renderError('Must upload initial CSV for non-trainable matrices.');
                else if (!el.variable['data']) el.variable['data'] = null;
                else if (
                    !Array.isArray(el.variable['data']) ||
                    el.variable.data.length !== el.variable.shape[0] ||
                    el.variable.data[0].length !== el.variable.shape[1]
                )
                    return this.renderError(
                        `Matrix ${name} has declared shape ${
                            el.variable.shape
                        } but CSV shape ${[
                            el.variable.data.length,
                            el.variable.data[0].length
                        ]}.`
                    );
            }

        }

        return this.variables;
    }

    getSettings() {
        let granularity =
            this.settingsBoxDOM.children[0].children[1].children[0].children[1]
                .value;
        if (isNaN(granularity) || parseInt(granularity) < 0)
            return this.renderError(
                'Must provide positive integer granularity.'
            );

        this.settings['granularity'] = parseInt(granularity);

        this.settings['showPath'] =
            this.settingsBoxDOM.children[0].children[2].children[0].children[0].checked;

        this.settings['usePCA'] =
            this.settingsBoxDOM.children[0].children[3].children[0].children[0].checked;

        let lr =
            this.settingsBoxDOM.children[0].children[6].children[0].children[1]
                .value;
        if (isNaN(lr) || parseFloat(lr) < 0)
            return this.renderError('Must provide positive numeric learning rate.');

        this.settings['learningRate'] = parseFloat(lr);

        if (this.settings['optimizer'] === 'Momentum') {
            let momentum =
                this.settingsBoxDOM.children[0].children[7].children[0].children[1]
                    .value;
            if (isNaN(momentum) || parseFloat(momentum) < 0)
                return this.renderError('Must provide positive numeric momentum.');
            this.settings['momentum'] = parseFloat(momentum);
        } else delete this.settings.momentum;

        let epochs =
            this.settingsBoxDOM.children[0].children[
                this.settings['optimizer'] === 'Momentum' ? 8 : 7
            ].children[0].children[1].value;

        if (isNaN(epochs) || parseInt(epochs) < 0)
            return this.renderError(
                'Must provide positive integer number of epochs.'
            );
        this.settings['epochs'] = parseInt(epochs);
            
        return this.settings;
    }
}

export default new UI();
