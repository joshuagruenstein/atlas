import UI from "./ui.js";
import { generateLossSurfaceFromUI } from "./loss_surface_generation.js";
import nearly from "./libraries/nearly.js";
import './grammar.js';

function getVariable(varName) {
    let vars = UI.getVariables();
    let match = null;
    let tfvar = null;
    vars.forEach((v, i) => {
        if (v.name === varName) {
            match = v;
            tfvar = makeTfVar(v);
        }
    });
    return {match: match, tfvar: tfvar};
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

UI.setOnloadHandler(() => {
    UI.renderSuccess("GET BORPED SON");
});

UI.setVisualizerStartHandler(() => {
    let tokens = Array.from(moo.compile({
        WS: /[ \t]+/,
        variable: {match: /[a-zA-Z]/, value: v => getVariable(v)},
        plus: /\+/,
        times: /\*/,
        normsign: /\|\|/,
        number: /[1-9][0-9]*/,
    }).reset(UI.getExpression())).filter((v, i, a) => v.type !== "WS");
    console.log(tokens);
    let tfvars = tokens.filter((v, i, a) => v.type === "variable" && v.value.match.trainable === true).map((v, i, a) => v.value.tfvar);
    console.log(tfvars);
    const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));
    parser.feed(tokens);
    const f = () => parser.results[0];
    console.log(f());
    generateLossSurfaceFromUI(tfvars, f, UI.getSettings());
});

// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });
