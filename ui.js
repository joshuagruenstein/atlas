import { html, render } from 'https://unpkg.com/lit-html?module';

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

import { copyToClipboard, parseCSV } from './utils.js';

import Plot from './plot.js';

const configureMathJax = () => {
    if (!window.MathJax) window.MathJax = {};

    window.MathJax.AuthorInit = function() {
        MathJax.Hub.Register.StartupHook('End', function() {
            MathJax.Hub.processSectionDelay = 0;
            let expressionSource = document.getElementById('expressionSource');
            let expressionRendering = document.getElementById('expressionRendering');
            expressionRendering.style.color = "#000";
            let math = MathJax.Hub.getAllJax('expressionRendering')[0];
            expressionSource.addEventListener('input', function() {
                MathJax.Hub.Queue(['Text', math, expressionSource.value]);
            });

            window.MathJaxInitialized = true;
        });

        MathJax.Hub.Register.StartupHook('AsciiMath Jax Ready', function () {
            let AM = MathJax.InputJax.AsciiMath.AM;

            AM.newsymbol({
                input:'relu',
                tag:'mi',
                output:'relu',
                tex:null,
                ttype:AM.TOKEN.UNARY,
                func:true
            });
        });
    }

    window.MathJax.AuthorInit();
}

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
        this.expressionSourceDOM = document.getElementById("expressionSource");
        configureMathJax();

        window.onload = () => {
            if (!document.cookie.split(';').filter(function(item) {
                return item.trim().indexOf('visited=') == 0
            }).length) {
                this.showModal();
                document.cookie = 'visited=true';
            }

            this.setVisualizerStart();
            this.refreshView();
            if (this.onLoad) this.onLoad();

            this.setStateFromURL();
        };
    }

    changeOptimizer() {
        this.settings[
            'optimizer'
        ] = this.settingsBoxDOM.children[0].children[5].children[0].value;

        this.refreshView();
    }

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

    csvVariable(variable) {
        let oldPicker = document.getElementById('filePicker');
        let picker = oldPicker.cloneNode(true);
        oldPicker.parentNode.replaceChild(picker, oldPicker);

        picker.addEventListener(
            'change',
            () => {
                if (picker.files.length === 0) return;
                let file = picker.files[0];

                if (file.type !== 'text/csv')
                    return this.renderError('Must upload valid CSV file.');

                let reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        variable['data'] = parseCSV(
                            event.target.result,
                            variable.type
                        );
                    }

                    catch(error) {
                        this.renderError(error);
                    }
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

    exportURL() {
        let variables = this.getVariables();
        let settings = this.getSettings();

        if (!variables || !settings) return this.renderError("Must correct errors beforing sharing.");

        let dumpData = {
            variables:variables,
            settings:settings,
            expression:this.getExpression()
        }

        if (this.plotData) dumpData.plotData = this.plotData;

        let dump = encodeURIComponent(btoa(JSON.stringify(dumpData)));

        let base = window.location.href.split("#")[0];
        let url = base + "#dump=" + dump;


        copyToClipboard(url);

        this.renderSuccess(html`Copied <a href='${url}'>sharing URL</a> to clipboard.`);

    }

    setStateFromURL() {
        let url = window.location.href.split("#");

        if (url.length !== 2 || url[1].substring(0,5) !== 'dump=') return;

        let dump = atob(decodeURIComponent(url[1].substring(5)));
        let data = JSON.parse(dump);

        this.settings = data.settings;
        this.variables = data.variables;

        this.setVariables();
        this.setSettings();

        let kill = setInterval(() => {
            if (window.MathJaxInitialized) {
                this.setExpression(data.expression);
                clearInterval(kill);
            }
        }, 10);

        if (data.plotData) {
            if (data.plotData.type === 'surface') {
                this.setVisualizerPlotSurface(data.plotData.data, data.plotData.path);
            } else {
                this.setVisualizerPlotLine(data.plotData.x, data.plotData.y);
            }
        }
    }

    refreshView() {
        render(navbarBox(this.showModal.bind(this), this.exportURL.bind(this)), this.navbarBoxDOM);

        render(
            variableBox(
                this.variables,
                this.typeChangeVariable.bind(this),
                this.csvVariable.bind(this),
                this.deleteVariable.bind(this),
                this.newVariable.bind(this)
            ),
            this.variableBoxDOM
        );
        render(
            settingsBox(this.settings, this.changeOptimizer.bind(this)),
            this.settingsBoxDOM
        );
        render(
            messageBox(this.messages, this.deleteMessage.bind(this)),
            this.messageBoxDOM
        );
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
        return render(
            startVisualizerBox(this.onStart.bind(this)),
            this.visualizerBoxDOM
        );
    }

    getExpression() {
        return this.expressionSourceDOM.value;
    }

    setVisualizerLoading(progress, message) {
        return render(
            loadVisualizerBox(progress, message, this.onCancel.bind(this)),
            this.visualizerBoxDOM
        );
    }

    setVisualizerPlotSurface(data, path = null) {
        this.plotData = {'type':'surface', 'data':data, 'path':path};

        render(
            plotVisualizerBox(this.onCancel.bind(this)),
            this.visualizerBoxDOM
        );
        let plot = new Plot('plotBox', 'Loss Surface');
        plot.surface(data, path);
    }

    setVisualizerPlotLine(x, y) {
        this.plotData = {'type':'line', 'x':x, 'y':y};

        render(
            plotVisualizerBox(this.onCancel.bind(this)),
            this.visualizerBoxDOM
        );
        let plot = new Plot('plotBox', 'Loss Curve');
        plot.line(x, y);
    }

    getSettings() {
        this.changeOptimizer();

        let granularity = this.settingsBoxDOM.children[0].children[1]
            .children[0].children[1].value;
        if (isNaN(granularity) || parseInt(granularity) < 0)
            return this.renderError(
                'Must provide positive integer granularity.'
            );

        this.settings['granularity'] = parseInt(granularity);

        this.settings[
            'showPath'
        ] = this.settingsBoxDOM.children[0].children[2].children[0].children[0].checked;

        this.settings[
            'usePCA'
        ] = this.settingsBoxDOM.children[0].children[3].children[0].children[0].checked;

        let lr = this.settingsBoxDOM.children[0].children[6].children[0]
            .children[1].value;
        if (lr === "" || isNaN(lr) || parseFloat(lr) < 0)
            return this.renderError(
                'Must provide positive numeric learning rate.'
            );

        this.settings['learningRate'] = parseFloat(lr);

        if (this.settings['optimizer'] === 'Momentum') {
            let momentum = this.settingsBoxDOM.children[0].children[7]
                .children[0].children[1].value;
            if (momentum === "" ||isNaN(momentum) || parseFloat(momentum) < 0)
                return this.renderError(
                    'Must provide positive numeric momentum.'
                );
            this.settings['momentum'] = parseFloat(momentum);
        } else delete this.settings.momentum;

        let epochs = this.settingsBoxDOM.children[0].children[
            this.settings['optimizer'] === 'Momentum' ? 8 : 7
        ].children[0].children[1].value;

        if (epochs === "" || isNaN(epochs) || parseInt(epochs) < 0)
            return this.renderError(
                'Must provide positive integer number of epochs.'
            );
        this.settings['epochs'] = parseInt(epochs);

        return this.settings;
    }


    getVariables() {
        for (let el of this.variableBoxDOM.children) {
            if (!el.variable) continue;

            let name = el.children[0].children[0].children[0].value;
            if (name.length !== 1)
                return this.renderError(
                    'Variable names must be single letters.'
                );
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

                if (
                    !el.variable.trainable &&
                    (!el.variable['data'] ||
                        !Array.isArray(el.variable['data']))
                )
                    return this.renderError(
                        'Must provide CSV data for non-trainable vectors.'
                    );
                else if (!el.variable['data']) el.variable['data'] = null;
                else if (
                    !Array.isArray(el.variable['data']) ||
                    el.variable.data.length !== el.variable.length
                )
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

                if (
                    !el.variable.trainable &&
                    (!el.variable['data'] ||
                        !Array.isArray(el.variable['data']))
                )
                    return this.renderError(
                        'Must upload initial CSV for non-trainable matrices.'
                    );
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

    setVariables() {
        this.refreshView();

        for (let el of this.variableBoxDOM.children) {
            if (!el.variable) continue;

            console.log("HELLO WORLD!");
            el.children[0].children[0].children[0].value = el.variable.name;

            el.getElementsByClassName(
                'form-switch'
            )[0].children[0].checked = el.variable.trainable;

            el.children[0].children[0].children[1].value = el.variable.type;
            this.refreshView();

            if (el.variable.type === 'Scalar') {
                el.children[1].children[0].children[1].value = el.variable.data ? el.variable.data : '';
            } else if (el.variable.type === 'Vector') {
                el.children[1].children[0].children[1].value = el.variable.length;
            } else {
                el.children[1].children[0].children[1].value = el.variable.shape[0];
                el.children[1].children[0].children[2].value = el.variable.shape[1];
            }
        }
    }

    setSettings() {
        this.settingsBoxDOM.children[0].children[1].children[0].children[1].value = this.settings.granularity;

        this.settingsBoxDOM.children[0].children[2].children[0].children[0].checked = this.settings.showPath;

        this.settingsBoxDOM.children[0].children[3].children[0].children[0].checked = this.settings.usePCA;

        this.settingsBoxDOM.children[0].children[6].children[0].children[1].value = this.settings.learningRate;

        this.settingsBoxDOM.children[0].children[5].children[0].value = this.settings.optimizer;

        this.refreshView();

        if (this.settings['optimizer'] === 'Momentum') {
            this.settingsBoxDOM.children[0].children[7].children[0].children[1].value = this.settings.momentum;
        }

        this.settingsBoxDOM.children[0].children[
            this.settings['optimizer'] === 'Momentum' ? 8 : 7
        ].children[0].children[1].value = this.settings.epochs;

    }

    setExpression(expression) {
        this.expressionSourceDOM.value = expression;
        this.expressionSourceDOM.dispatchEvent(new Event('input'));
    }

}

export default new UI();
