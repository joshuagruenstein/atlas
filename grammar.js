// Generated automatically by nearley, version 2.16.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

    const tokenScalar = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Scalar'};
    const tokenMatrix = {test: x => x.type === 'variable' && x.value.match !== null && (x.value.match.type === 'Matrix' || x.value.match.type === 'Vector')};
    const tokenPlus = {test: x => x.type === 'plus'};
    const tokenTimes = {test: x => x.type === 'times'};
    const tokenDivides = {test: x => x.type === 'divides'};
    const tokenNorm = {test: x => x.type === 'norm'};
    const tokenNumber = {test: x => x.type === 'number'};
    const tokenMinus = {test: x => x.type === 'minus'};
    const tokenPower = {test: x => x.type === 'power'};
    const tokenTranspose = {test: x => x.type === 'transpose'};
    const tokenLparen = {test: x => x.type === 'lparen'};
    const tokenRparen = {test: x => x.type === 'rparen'};
    const tokenRelu = {test: x => x.type === 'relu'};
    const tokenSin = {test: x => x.type === 'sin'};
    const tokenCos = {test: x => x.type === 'cos'};
    const tokenSigmoid = {test: x => x.type === 'sigmoid'};
    const tokenTanh = {test: x => x.type === 'tanh'};
    const tokenSqrt = {test: x => x.type === 'sqrt'};
    const tokenAbs = {test: x => x.type === 'abs'};
    const tokenOnehot = {test: x => x.type === 'onehot'};
    const tokenUnderscore = {test: x => x.type === 'underscore'};
    const tokenComma = {test: x => x.type === 'comma'};
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "main", "symbols": ["sAS"], "postprocess": id},
    {"name": "sP", "symbols": [tokenLparen, "sAS", tokenRparen], "postprocess": ([l, s, r]) => s},
    {"name": "sP", "symbols": ["s"], "postprocess": id},
    {"name": "sE", "symbols": ["sP", tokenPower, "sE"], "postprocess": ([fst, _, snd]) => (() => tf.pow(fst(), snd()))},
    {"name": "sE", "symbols": ["sP"], "postprocess": id},
    {"name": "sMD", "symbols": ["sMD", tokenTimes, "sE"], "postprocess": ([fst, _, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "sMD", "symbols": ["sMD", tokenDivides, "sE"], "postprocess": ([fst, _, snd]) => (() => tf.div(fst(), snd()))},
    {"name": "sMD", "symbols": ["sMD", "sE"], "postprocess": ([fst, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "sMD", "symbols": ["sE"], "postprocess": id},
    {"name": "sAS", "symbols": ["sAS", tokenPlus, "sMD"], "postprocess": ([fst, _, snd]) => (() => tf.add(fst(), snd()))},
    {"name": "sAS", "symbols": ["sAS", tokenMinus, "sMD"], "postprocess": ([fst, _, snd]) => (() => tf.sub(fst(), snd()))},
    {"name": "sAS", "symbols": [tokenMinus, "sMD"], "postprocess": ([_, snd]) => (() => tf.sub(0, snd()))},
    {"name": "sAS", "symbols": ["sMD"], "postprocess": id},
    {"name": "s", "symbols": [tokenScalar], "postprocess": ([s]) => (() => s.value.tfvar)},
    {"name": "s", "symbols": [tokenRelu, tokenLparen, "sAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.relu(s()))},
    {"name": "s", "symbols": [tokenSin, tokenLparen, "sAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.sin(s()))},
    {"name": "s", "symbols": [tokenCos, tokenLparen, "sAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.cos(s()))},
    {"name": "s", "symbols": [tokenSigmoid, tokenLparen, "sAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.sigmoid(s()))},
    {"name": "s", "symbols": [tokenTanh, tokenLparen, "sAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.tanh(s()))},
    {"name": "s", "symbols": [tokenSqrt, tokenLparen, "sAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.sqrt(s()))},
    {"name": "s", "symbols": [tokenAbs, "sAS", tokenAbs], "postprocess": ([l, s, r]) => (() => tf.abs(s()))},
    {"name": "s", "symbols": [tokenNorm, "mAS", tokenNorm, tokenUnderscore, tokenNumber], "postprocess": ([l, m, r, u, o]) => (() => tf.norm(m(), parseFloat(o.value)))},
    {"name": "s", "symbols": [tokenNumber], "postprocess": ([n]) => (() => parseFloat(n.value))},
    {"name": "mP", "symbols": [tokenLparen, "mAS", tokenRparen], "postprocess": ([l, m, r]) => m},
    {"name": "mP", "symbols": ["m"], "postprocess": id},
    {"name": "mE", "symbols": ["mP", tokenPower, "sP"], "postprocess": ([fst, _, snd]) => (() => tf.pow(fst(), snd()))},
    {"name": "mE", "symbols": ["mP", tokenPower, tokenTranspose], "postprocess": ([fst, _, t]) => (() => tf.transpose(fst()))},
    {"name": "mE", "symbols": ["mP"], "postprocess": id},
    {"name": "mMD", "symbols": ["mMD", tokenTimes, "mE"], "postprocess": ([fst, _, snd]) => (() => tf.matMul(fst(), snd()))},
    {"name": "mMD", "symbols": ["mMD", "mE"], "postprocess": ([fst, snd]) => (() => tf.matMul(fst(), snd()))},
    {"name": "mMD", "symbols": ["mE"], "postprocess": id},
    {"name": "smMD", "symbols": ["sE", tokenTimes, "smMD"], "postprocess": ([fst, _, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "smMD", "symbols": ["smMD", tokenTimes, "sE"], "postprocess": ([fst, _, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "smMD", "symbols": ["smMD", tokenDivides, "sE"], "postprocess": ([fst, _, snd]) => (() => tf.div(fst(), snd()))},
    {"name": "smMD", "symbols": ["sE", "smMD"], "postprocess": ([fst, snd]) => (() => tf.mul(fst(), snd()))},
    {"name": "smMD", "symbols": ["mMD"], "postprocess": id},
    {"name": "mAS", "symbols": ["mAS", tokenPlus, "smMD"], "postprocess": ([fst, _, snd]) => (() => tf.add(fst(), snd()))},
    {"name": "mAS", "symbols": ["mAS", tokenMinus, "smMD"], "postprocess": ([fst, _, snd]) => (() => tf.sub(fst(), snd()))},
    {"name": "mAS", "symbols": [tokenMinus, "smMD"], "postprocess": ([_, snd]) => (() => tf.sub(0, snd()))},
    {"name": "mAS", "symbols": ["smMD"], "postprocess": id},
    {"name": "m", "symbols": [tokenMatrix], "postprocess": ([m]) => (() => m.value.tfvar)},
    {"name": "m", "symbols": [tokenRelu, tokenLparen, "mAS", tokenRparen], "postprocess": ([f, l, m, r]) => (() => tf.relu(m()))},
    {"name": "m", "symbols": [tokenSin, tokenLparen, "mAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.sin(m()))},
    {"name": "m", "symbols": [tokenCos, tokenLparen, "mAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.cos(m()))},
    {"name": "m", "symbols": [tokenSigmoid, tokenLparen, "mAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.sigmoid(m()))},
    {"name": "m", "symbols": [tokenTanh, tokenLparen, "mAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.tanh(m()))},
    {"name": "m", "symbols": [tokenSqrt, tokenLparen, "mAS", tokenRparen], "postprocess": ([f, l, s, r]) => (() => tf.sqrt(s()))},
    {"name": "m", "symbols": [tokenAbs, "mAS", tokenAbs], "postprocess": ([l, s, r]) => (() => tf.abs(s()))}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
