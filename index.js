import UI from "./ui.js";
import { generateLossSurfaceFromUI } from "./loss_surface_generation.js";
import nearly from "./libraries/nearly.js";
import './grammar.js';

function makeVarContext() {
    let vars = UI.getVariables();
    let tfvars = vars.map((v, i, a) => ({match: v, tfvar: makeTfVar(v)}));
    return Object.assign(...tfvars.map(
        (v, i, a) => {
            let k = {};
            k[v.match.name] = v;
            return k;
        }
    ));
}

function getVariable(varName, varContext, usedVars) {
    let c = varContext[varName];
    usedVars[varName] = c;
    return c;
}

function makeTfVar(v) {
    switch (v.type) {
        case "Scalar":
            return v.trainable ? tf.scalar(Math.random()).variable() : tf.scalar(v.data);
        case "Vector":
            return v.trainable ? tf.randomUniform([v.length]).variable() : tf.tensor1d(v.data);
        case "Matrix":
            return v.trainable ? tf.randomUniform(v.shape).variable() : tf.tensor2d(v.data);
        default:
            return null;
    }
}
function makeTfNumber(v) {
    return tf.scalar(parseFloat(v));
}

if(true) {
UI.setVisualizerStartHandler(() => {
    let varContext = makeVarContext();
    let usedVars = {};
    let tokens = Array.from(moo.compile({
        WS: /[ \t]+/,
        variable: {match: /[a-zA-Z]/, value: v => getVariable(v, varContext, usedVars)},
        plus: /\+/,
        times: /\*/,
        normsign: /\|\|/,
        number: {match: /[1-9][0-9]*/, value: v => makeTfNumber(v)},
    }).reset(UI.getExpression())).filter((v, i, a) => v.type !== "WS");
    console.log(tokens);
    let tfvars = Object.keys(usedVars).filter((v, i, a) => usedVars[v].match).map((v, i, a) => usedVars[v].tfvar);
    console.log(tfvars);
    const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));
    parser.feed(tokens);
    const f = parser.results[0];
    generateLossSurfaceFromUI(tfvars, f, UI.getSettings());
});
}
// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });
