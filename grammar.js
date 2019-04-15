// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


    const tokenScalar = {test: x => x.type === 'variable' && x.value !== null && x.value.type === 'Scalar'};
    const tokenVector = {test: x => x.type === 'variable' && x.value !== null && x.value.type === 'Vector'};
    const tokenMatrix = {test: x => x.type === 'variable' && x.value !== null && x.value.type === 'Matrix'};
    const tokenPlus = {test: x => x.value === '+'};
    const tokenTimes = {test: x => x.value === '*'};
    const tokenNormsign = {test: x => x.value === '||'};
    const tokenNumber = {test: x => x.type === 'number'};

    function getTfScalar(v) {
        return v.trainable ? tf.scalar(Math.random()).variable() : tf.scalar(parseFloat(v.data));
    }

    function getTfNumber(v) {
        return tf.scalar(parseFloat(v));
    }

    function getTfVector(v) {
        return v.trainable ? tf.vector1d(Math.random()).variable() : tf.vector1d(v.data);
    }

    function getTfMatrix(v) {
        return v.trainable ? tf.vector2d(Math.random()).variable() : tf.vector2d(v.data);
    }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "scalarExpression", "symbols": ["scalarSum"], "postprocess": id},
    {"name": "scalarSum", "symbols": ["scalarSum", tokenPlus, "scalarProduct"], "postprocess": ([fst, _, snd]) => tf.add(fst, snd)},
    {"name": "scalarSum", "symbols": ["scalarProduct"], "postprocess": id},
    {"name": "scalarProduct", "symbols": ["scalarProduct", tokenTimes, "scalar"], "postprocess": ([fst, _, snd]) => tf.mul(fst, snd)},
    {"name": "scalarProduct", "symbols": ["scalar"], "postprocess": id},
    {"name": "scalar", "symbols": [tokenScalar], "postprocess": (s) => getTfScalar(s[0].value)},
    {"name": "scalar", "symbols": [tokenNumber], "postprocess": (n) => getTfNumber(n[0].value)},
    {"name": "scalar", "symbols": [tokenNormsign, "vectorSum", tokenNormsign], "postprocess": ([l, v, r]) => tf.norm(v)},
    {"name": "scalar", "symbols": [tokenNormsign, "matrixSum", tokenNormsign], "postprocess": ([l, v, r]) => tf.norm(v)},
    {"name": "vectorSum", "symbols": ["vectorSum", tokenPlus, "vectorProduct"], "postprocess": ([fst, _, snd]) => tf.add(fst, snd)},
    {"name": "vectorSum", "symbols": ["vectorProduct"], "postprocess": id},
    {"name": "vectorProduct", "symbols": ["vectorProduct", tokenTimes, "vector"], "postprocess": ([fst, _, snd]) => tf.mul(fst, snd)},
    {"name": "vectorProduct", "symbols": ["vector"], "postprocess": id},
    {"name": "matrixSum", "symbols": ["matrixSum", tokenPlus, "matrixProduct"], "postprocess": ([fst, _, snd]) => tf.add(fst, snd)},
    {"name": "matrixSum", "symbols": ["matrixProduct"], "postprocess": id},
    {"name": "matrixProduct", "symbols": ["matrixProduct", tokenTimes, "matrix"], "postprocess": ([fst, _, snd]) => tf.mul(fst, snd)},
    {"name": "matrixProduct", "symbols": ["matrix"], "postprocess": id},
    {"name": "vector", "symbols": [tokenVector], "postprocess": (s) => getTfVector(s[0].value)},
    {"name": "matrix", "symbols": [tokenMatrix], "postprocess": (s) => getTfMatrix(s[0].value)}
]
  , ParserStart: "scalarExpression"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
