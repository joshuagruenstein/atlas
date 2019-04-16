import UI from "./ui.js";
import "./loss_surface_generation.js";
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
            return v.trainable ? tf.scalar(Math.random()).variable() : tf.scalar(parseFloat(v.data));
            break;
        case "Vector":
            break;
        case "Matrix":
            break;
        default:
            break;
    }
}

UI.setOnloadHandler(() => {
    UI.renderSuccess('PLS SVAE ME I AM STUCK ISN THE COMPUTER HELEPLEPLEPL.');
});

UI.setVisualizerStartHandler(() => {
    let tokens = Array.from(moo.compile({
        variable: {match: /[a-zA-Z]/, value: v => getVariable(v)},
        plus: /\+/,
        times: /\*/,
        normsign: /\|\|/,
        number: /[1-9][0-9]*/,
    }).reset(UI.getExpression()));
    console.log(tokens);
    let tfvars = tokens.filter((v, i, a) => v.type === "variable" && v.value.match.trainable === true).map((v, i, a) => v.value.tfvar);
    console.log(tfvars);
    const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));
    parser.feed(tokens);
    const f = () => parser.results[0];
    console.log(f());
});

// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });
