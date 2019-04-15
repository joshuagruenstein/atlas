import UI from "./ui.js";
import "./loss_surface_generation.js";
import nearly from "./nearly.js";
import './grammar.js';

console.log(nearly);

UI.setOnloadHandler(() => {
    UI.renderSuccess('PLS SVAE ME I AM STUCK ISN THE COMPUTER HELEPLEPLEPL.');
});

UI.setVisualizerStartHandler(() => {
    console.log('beeboop');
    console.log(UI.getExpression());
    const parser = new nearly.Parser(nearly.Grammar.fromCompiled(grammar));
    parser.feed(UI.getExpression());
    console.log(parser.results);
});

// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });