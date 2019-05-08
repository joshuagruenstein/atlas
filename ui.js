import { html, render } from 'https://unpkg.com/lit-html?module';

import {
    navbarBox,
    startVisualizerBox,
    plotVisualizerBox,
    loadVisualizerBox,
    modalBox,
    variableBox,
    messageBox,
    settingsBox,
    lossBox,
    scratchBox,
    loadingBox
} from './templates.js';

import { copyToClipboard, parseCSV, isIncognito } from './utils.js';

import Plot from './plot.js';

const FUNCTIONS = ['relu', 'onehot', 'softmax', 'sigmoid'];

const configureMathJax = () => {
    if (!window.MathJax) window.MathJax = {};

    window.MathJax.AuthorInit = () => {
        MathJax.Hub.Register.StartupHook('End', () => {
            MathJax.Hub.processSectionDelay = 0;

            const expressionSource = document.getElementById('expressionSource');
            const expressionRendering = document.getElementById('expressionRendering');

            MathJax.Hub.Queue(['Typeset', MathJax.Hub, 'expressionRendering']);
            
            expressionSource.addEventListener('input', () => {
                expressionRendering.style.color = "#000";
                MathJax.Hub.Queue([
                    'Text', 
                    MathJax.Hub.getAllJax('expressionRendering')[0], 
                    expressionSource.value
                ]);
            });

            expressionSource.dispatchEvent(new Event('input'));
            window.MathJaxInitialized = true;
        });

        MathJax.Hub.Register.StartupHook('AsciiMath Jax Ready', () => {
            const AM = MathJax.InputJax.AsciiMath.AM;

            for (let f of FUNCTIONS) AM.newsymbol({
                input:f,
                tag:'mi',
                output:f,
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
        this.plotData = {};

        this.variableBoxDOM = document.getElementById('variableBox');
        this.messageBoxDOM = document.getElementById('messageBox');
        this.settingsBoxDOM = document.getElementById('settingsBox');
        this.visualizerBoxDOM = document.getElementById('visualizerBox');
        this.modalBoxDOM = document.getElementById('modalBox');
        this.navbarBoxDOM = document.getElementById('navbarBox');
        this.expressionSourceDOM = document.getElementById("expressionSource");
        this.lossBoxDOM = document.getElementById('lossBox');
        this.scratchBoxDOM = document.getElementById('scratchBox');
        this.loadingBoxDOM = document.getElementById('loadingBox');
        configureMathJax();

        const url = window.location.href.split("#");
        const hasDump = !(url.length !== 2 || url[1].substring(0,5) !== 'dump=');

        if (hasDump) render(loadingBox(true), this.loadingBoxDOM);
        
        window.onload = async () => {
            if (!document.cookie.split(';').filter(function(item) {
                return item.trim().indexOf('visited=') == 0
            }).length || await isIncognito) {
                this.showModal();
                document.cookie = 'visited=true';
            }

            this.setVisualizerStart();
            this.refreshView();
            if (this.onLoad) this.onLoad();

            if (hasDump) {
                this.setStateFromURL();
                render(loadingBox(false), this.loadingBoxDOM);
            }
        };
    }

    changeOptimizer() {
        this.settings[
            'optimizer'
        ] = this.settingsBoxDOM.children[0].children[4].children[0].value;

        this.refreshView();
    }

    closeLossPlot() {
        render(lossBox(false, this.closeLossPlot.bind(this)), this.lossBoxDOM);
    }

    showLossPlot(losses) {
        this.plotData.loss = losses;

        render(lossBox(true, this.closeLossPlot.bind(this)), this.lossBoxDOM);

        let plot = new Plot('lossPlotBox', 'Training Loss', {
            width:400,
            height:300
        });
        plot.line([...Array(losses.length).keys()], losses, null);
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
            expression:this.getExpression(),
            plotData: this.plotData
        }

        let dump = encodeURIComponent(btoa(JSON.stringify(dumpData)));

        let base = window.location.href.split("#")[0];
        let linkUrl = ".#dump=" + dump;
        let clipboardUrl = base + "#dump=" + dump;

        copyToClipboard(clipboardUrl);

        this.renderSuccess(html`Copied <a href='${linkUrl}'>sharing URL</a> to clipboard.`);

    }

    setStateFromURL() {

        let url = window.location.href.split("#");

        let dump = atob(decodeURIComponent(url[1].substring(5)));
        let data = JSON.parse(dump);

        this.settings = data.settings;
        this.variables = data.variables;

        this.setVariables();
        this.setSettings();

        if (data.plotData) {

            if (data.plotData.type === 'surface') {
                this.setVisualizerPlotSurface(data.plotData.data, data.plotData.path);
            } else if (data.plotData.type === 'line') {
                this.setVisualizerPlotLine(data.plotData.x, data.plotData.y, data.plotData.path);
            }

            if (data.plotData.loss) this.showLossPlot(data.plotData.loss);
        }

        this.setExpression(data.expression);
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

        render(
            scratchBox(this.settings.scratch, this.changeScratch.bind(this)),
            this.scratchBoxDOM
        );
    }

    changeScratch() {
        let newVal = this.scratchBoxDOM.children[0].children[0].children[2].children[0].value;
        this.settings.scratch = newVal;
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
        this.plotData.type = 'surface';
        this.plotData.data = data;
        this.plotData.path = path;

        render(
            plotVisualizerBox(this.onCancel.bind(this)),
            this.visualizerBoxDOM
        );
        let plot = new Plot('plotBox', 'Loss Surface');
        plot.surface(data, path);
    }

    setVisualizerPlotLine(x, y, path = null) {
        this.plotData = {'type':'line', 'x':x, 'y':y, 'path':path};
        this.plotData.type = 'line';
        this.plotData.x = x;
        this.plotData.y = y;
        this.plotData.path = path;

        render(
            plotVisualizerBox(this.onCancel.bind(this)),
            this.visualizerBoxDOM
        );
        let plot = new Plot('plotBox', 'Loss Curve');
        plot.line(x, y, path);
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


        let lr = this.settingsBoxDOM.children[0].children[5].children[0]
            .children[1].value;
        if (lr === "" || isNaN(lr) || parseFloat(lr) < 0)
            return this.renderError(
                'Must provide positive numeric learning rate.'
            );

        this.settings['learningRate'] = parseFloat(lr);

        if (this.settings['optimizer'] === 'Momentum') {
            let momentum = this.settingsBoxDOM.children[0].children[6]
                .children[0].children[1].value;
            if (momentum === "" ||isNaN(momentum) || parseFloat(momentum) < 0)
                return this.renderError(
                    'Must provide positive numeric momentum.'
                );
            this.settings['momentum'] = parseFloat(momentum);
        } else delete this.settings.momentum;

        let epochs = this.settingsBoxDOM.children[0].children[
            this.settings['optimizer'] === 'Momentum' ? 7 : 6
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

        this.settingsBoxDOM.children[0].children[5].children[0].children[1].value = this.settings.learningRate;

        this.settingsBoxDOM.children[0].children[4].children[0].value = this.settings.optimizer;

        this.refreshView();

        if (this.settings['optimizer'] === 'Momentum') {
            this.settingsBoxDOM.children[0].children[6].children[0].children[1].value = this.settings.momentum;
        }

        this.settingsBoxDOM.children[0].children[
            this.settings['optimizer'] === 'Momentum' ? 7 : 6
        ].children[0].children[1].value = this.settings.epochs;

    }

    setExpression(expression) {
        this.expressionSourceDOM.value = expression;
        this.expressionSourceDOM.dispatchEvent(new Event('input'));        
    }

}

export default new UI();
