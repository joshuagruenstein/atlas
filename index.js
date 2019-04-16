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
    const m = `The mongrel cat came home
Holding half a head
Proceeded to show it off
To all his new found friends
He said,
I been where I liked
I slept with who I liked
She ate me up for breakfast
She screwed me in a vice
But now
I don't know why I feel so tongue tied
I sat in the cupboard
And wrote it down in neat
They were cheering and waving
Cheering and waving
Twitching and salivating
Like with myxomatosis
But it got edited, fucked up
Strangled, beaten up
Used as a photo in Time magazine
Buried in a burning black hole in Devon
I don't know why I feel so tongue tied
Don't know why I feel so skinned alive
My thoughts are misguided and a little naive
I twitch and salivate
Like with myxomatosis
You should put me in a home or you
Should put me down
I got myxomatosis
I got myxomatosis
Yeah no one likes a smart arse
But we all like stars
That wasn't my intention
I did it for a reason
It must have got mixed up
Strangled beaten up
I got myxomatosis 
I got myxomatosis
I don't know why I
Feel so tongue tied`;
for (const l of m.split("\n")){
    UI.renderSuccess(l);
}
});

if (false) {
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

        generateLossSurfaceFromUI(tfvars, f, UI.getSettings());
    });
}

// UI.setVisualizerCancelHandler(() => {
//     UI.setVisualizerStart();
// });
