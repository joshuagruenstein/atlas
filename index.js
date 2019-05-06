import UI from "./ui.js";
import { generateLossSurfaceFromUI } from "./loss_surface_generation.js";
import nearly from "./libraries/nearly.js";
import './grammar.js';

function makeVarContext() {
    let vars = UI.getVariables();
    let tfvars = vars.map((v, i, a) => ({match: v, tfvar: makeTfVar(v)}));
    if (tfvars.length > 0) {
        return Object.assign(...tfvars.map(
            (v, i, a) => {
                let k = {};
                k[v.match.name] = v;
                return k;
            }
        ));
    }
    else {
        UI.renderMessage("warning", "Warning: you haven't declared any variables.")
        return {};
    }
}

function getVariable(varName, varContext, usedVars) {
    let c = varContext[varName];
    if (typeof c !== "undefined") {
        usedVars[varName] = c;
        return c;
    }
    else {
        UI.renderError("Error: Variable " + varName + " not found.")
        return null;
    }
}

function makeTfVar(v) {
    switch (v.type) {
        case "Scalar":
            return v.trainable ? tf.scalar(Math.random()).variable() : tf.scalar(v.data);
        case "Vector":
            return v.trainable ? tf.randomUniform([v.length, 1]).variable() : tf.tensor1d(v.data).reshape([v.length, 1]);
        case "Matrix":
            return v.trainable ? tf.randomUniform(v.shape).variable() : tf.tensor2d(v.data);
        default:
            return null;
    }
}

UI.setVisualizerStartHandler(() => {
    let varContext = makeVarContext();
    let usedVars = {};
    let lexer = moo.compile({
        WS: {match: /[\s]+/, lineBreaks: true},
        power: /\^/,
        transpose: /T/,
        lparen: /\(/,
        rparen: /\)/,
        lbracket: /\[/,
        rbracket: /\]/,
        sin: /sin/,
        cos: /cos/,
        sigmoid: /sigmoid/,
        tanh: /tanh/,
        sqrt: /sqrt/,
        relu: /relu/,
        onehot: /onehot/,
        softmax: /softmax/,
        underscore: /_/,
        comma: /,/,
        variable: {match: /[a-zA-Z]/, value: v => getVariable(v, varContext, usedVars)},
        plus: /\+/,
        minus: /-/,
        times: /\*/,
        divides: /\//,
        norm: /\|\|/,
        abs: /\|/,
        number: {match: /[0-9]+/, value: v => v},
    });
    try {
        const tokens = Array.from(lexer.reset(UI.getExpression())).filter((v, i, a) => v.type !== "WS");
        const tfvars = Object.keys(usedVars).filter((v, i, a) => usedVars[v].match && usedVars[v].match.trainable).map((v, i, a) => usedVars[v].tfvar);
        const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));
        try {
            parser.feed(tokens);
            const f = parser.results[0];
            try {
                console.log("generateLossSurfaceFromUI", tfvars, usedVars);
                generateLossSurfaceFromUI(tfvars, f, UI.getSettings());
            }
            catch (err) {
                UI.renderError("Error: We could not generate your loss surface.");
                console.log(err);
            }
        }
        catch (err) {
            UI.renderError("Error: Your expression could not be parsed. Are you sure your final expression is a scalar?");
            console.log(err);
        }
    }
    catch (err) {
        UI.renderError("Error: We didn't recognize something in your input.");
        console.log(err);
    }
});

// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });
