import UI from "./ui.js";
import "./loss_surface_generation.js";
import nearly from "./libraries/nearly.js";
import './grammar.js';

function getVariable(varName) {
    let vars = UI.getVariables();
    let match = null;
    vars.forEach((v, i) => {
        if (v.name === varName) {
            match = v;
        }
    });
    return match;
}

UI.setOnloadHandler(() => {
    UI.renderSuccess('PLS SVAE ME I AM STUCK ISN THE COMPUTER HELEPLEPLEPL.');
});

// UI.setVisualizerStartHandler(() => {
//     let tokens = Array.from(moo.compile({
//         variable: {match: /[a-zA-Z]/, value: v => getVariable(v)},
//         plus: /\+/,
//         times: /\*/,
//         normsign: /\|\|/,
//         number: /[1-9][0-9]*/,
//     }).reset(UI.getExpression()));
//     const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));
//     parser.feed(tokens);
//     console.log(parser.results);
// });

// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });
