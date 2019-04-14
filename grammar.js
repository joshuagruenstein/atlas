// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

    import UI from './ui.js';
    let vars = UI.getVariables();
    function getTF(var) {
        switch (var['type']) {
            case 'Scalar':
                return var['trainable'] ? tf.scalar(Math.random()).variable() : tf.scalar(var['data']);
                break;
            case 'Vector':
                return var['trainable'] ? tf.tensor1d(Math.random()).variable() : tf.tensor1d(Math.random());
                break;
            default:
                return 'uh oh';
                break;
        }
    }
    function getVariable(varName) {
        vars.forEach((var, i) => {
            if (var['name'] === varName) {
                return getTF(var);
            }
        });
        return "uH OH";
    }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "norm$string$1", "symbols": [{"literal":"|"}, {"literal":"|"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "norm$string$2", "symbols": [{"literal":"|"}, {"literal":"|"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "norm", "symbols": ["norm$string$1", "expression", "norm$string$2"], "postprocess": (_, expr, _) => tf.norm(expr)},
    {"name": "expression", "symbols": ["expression", {"literal":"*"}, "expression"], "postprocess": (fst, _, snd) => tf.mul(fst, snd)},
    {"name": "expression", "symbols": ["expression", {"literal":"+"}, "expression"], "postprocess": (fst, _, snd) => tf.add(fst, snd)},
    {"name": "expression", "symbols": ["variable"], "postprocess": id},
    {"name": "variable", "symbols": [/[a-zA-Z]/], "postprocess": getVariable}
]
  , ParserStart: "norm"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
