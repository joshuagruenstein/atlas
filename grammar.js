// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


    const tokenScalar = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Scalar'};
    const tokenVector = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Vector'};
    const tokenMatrix = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Matrix'};
    const tokenPlus = {test: x => x.type === 'plus'};
    const tokenTimes = {test: x => x.type === 'times'};
    const tokenNormsign = {test: x => x.type === 'normsign'};
    const tokenNumber = {test: x => x.type === 'number'};
    const tokenMinus = {test: x => x.type === 'minus'};
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "scalarExpression", "symbols": ["scalarSum"], "postprocess": id},
    {"name": "scalarSum", "symbols": ["scalarSum", tokenPlus, "scalarProduct"], "postprocess": ([fst, _, snd]) => (() => tf.add(fst(), snd()))},
    {"name": "scalarSum", "symbols": ["scalarSum", tokenMinus, "scalarProduct"], "postprocess": ([fst, _, snd]) => (() => tf.add(fst(), -snd()))},
    {"name": "scalarSum", "symbols": ["scalarProduct"], "postprocess": id},
    {"name": "scalarProduct", "symbols": ["scalarProduct", tokenTimes, "scalar"], "postprocess": ([fst, _, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "scalarProduct", "symbols": ["scalarProduct", "scalar"], "postprocess": ([fst, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "scalarProduct", "symbols": ["scalar"], "postprocess": id},
    {"name": "scalar", "symbols": [tokenScalar], "postprocess": ([s]) => (() => s.value.tfvar)},
    {"name": "scalar", "symbols": [tokenMinus, "scalar"], "postprocess": ([_, s]) => (() => {console.log(s); return tf.sub(tf.scalar(0),s())})},
    {"name": "scalar", "symbols": [tokenNumber], "postprocess": ([n]) => (() => n.value)},
    {"name": "scalar", "symbols": [tokenNormsign, "vectorSum", tokenNormsign], "postprocess": ([l, v, r]) => (() => tf.norm(v()))},
    {"name": "scalar", "symbols": [tokenNormsign, "matrixSum", tokenNormsign], "postprocess": ([l, m, r]) => (() => tf.norm(m()))},
    {"name": "vectorSum", "symbols": ["vectorSum", tokenPlus, "vectorProduct"], "postprocess": ([fst, _, snd]) => (() => (() => tf.add(fst(), snd())))},
    {"name": "vectorSum", "symbols": ["vectorProduct"], "postprocess": id},
    {"name": "vectorProduct", "symbols": ["vectorProduct", tokenTimes, "vector"], "postprocess": ([fst, _, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "vectorProduct", "symbols": ["vectorProduct", "vector"], "postprocess": ([fst, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "vectorProduct", "symbols": ["vector"], "postprocess": id},
    {"name": "matrixSum", "symbols": ["matrixSum", tokenPlus, "matrixProduct"], "postprocess": ([fst, _, snd]) => (() => tf.add(fst(), snd()))},
    {"name": "matrixSum", "symbols": ["matrixProduct"], "postprocess": id},
    {"name": "matrixProduct", "symbols": ["matrixProduct", tokenTimes, "matrix"], "postprocess": ([fst, _, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "matrixProduct", "symbols": ["matrixProduct", "matrix"], "postprocess": ([fst, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "matrixProduct", "symbols": ["matrix"], "postprocess": id},
    {"name": "vector", "symbols": [tokenVector], "postprocess": ([v]) => (() => v.value.tfvar)},
    {"name": "matrix", "symbols": [tokenMatrix], "postprocess": ([m]) => (() => m.value.tfvar)}
]
  , ParserStart: "scalarExpression"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
