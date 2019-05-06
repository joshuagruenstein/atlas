@{%
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
    const tokenSoftmax = {test: x => x.type === 'softmax'};
    const tokenUnderscore = {test: x => x.type === 'underscore'};
    const tokenComma = {test: x => x.type === 'comma'};
%}

main -> sAS {% id %}

sP -> %tokenLparen sAS %tokenRparen {% ([l, s, r]) => s %}
    | s {% id %}

sE -> sP %tokenPower sE {% ([fst, _, snd]) => (() => tf.pow(fst(), snd())) %}
    | sP {% id %}

sMD -> sMD %tokenTimes sE {% ([fst, _, snd]) => (() => tf.mul(fst(), snd())) %}
    | sMD %tokenDivides sE {% ([fst, _, snd]) => (() => tf.div(fst(), snd())) %}
    | sMD sE {% ([fst, snd]) => (() => tf.mul(fst(), snd())) %}
    | sE {% id %}

sAS -> sAS %tokenPlus sMD {% ([fst, _, snd]) => (() => tf.add(fst(), snd())) %}
    | sAS %tokenMinus sMD {% ([fst, _, snd]) => (() => tf.sub(fst(), snd())) %}
    | %tokenMinus sMD {% ([_, snd]) => (() => tf.sub(0, snd())) %}
    | sMD {% id %}

s -> %tokenScalar {% ([s]) => (() => s.value.tfvar) %}
    | %tokenRelu %tokenLparen sAS %tokenRparen {% ([f, l, s, r]) => (() => tf.relu(s())) %}
    | %tokenSin %tokenLparen sAS %tokenRparen {% ([f, l, s, r]) => (() => tf.sin(s())) %}
    | %tokenCos %tokenLparen sAS %tokenRparen {% ([f, l, s, r]) => (() => tf.cos(s())) %}
    | %tokenSigmoid %tokenLparen sAS %tokenRparen {% ([f, l, s, r]) => (() => tf.sigmoid(s())) %}
    | %tokenTanh %tokenLparen sAS %tokenRparen {% ([f, l, s, r]) => (() => tf.tanh(s())) %}
    | %tokenSqrt %tokenLparen sAS %tokenRparen {% ([f, l, s, r]) => (() => tf.sqrt(s())) %}
    | %tokenAbs sAS %tokenAbs {% ([l, s, r]) => (() => tf.abs(s())) %}
    | %tokenNorm mAS %tokenNorm %tokenUnderscore %tokenNumber {% ([l, m, r, u, o]) => (() => tf.norm(m(), parseFloat(o.value))) %}
    | %tokenNumber {% ([n]) => (() => parseFloat(n.value)) %}

mP -> %tokenLparen mAS %tokenRparen {% ([l, m, r]) => m %}
    | m {% id %}

mE -> mP %tokenPower sP {% ([fst, _, snd]) => (() => tf.pow(fst(), snd())) %}
    | mP %tokenPower %tokenTranspose {% ([fst, _, t]) => (() => tf.transpose(fst())) %}
    | mP {% id %}

mMD -> mMD %tokenTimes mE {% ([fst, _, snd]) => (() => tf.matMul(fst(), snd())) %}
    | mMD mE {% ([fst, snd]) => (() => tf.matMul(fst(), snd())) %}
    | mE {% id %}

smMD -> sE %tokenTimes smMD {% ([fst, _, snd]) => (() => tf.mul(fst(), snd())) %}
    | smMD %tokenTimes sE {% ([fst, _, snd]) => (() => tf.mul(fst(), snd())) %}
    | smMD %tokenDivides sE {% ([fst, _, snd]) => (() => tf.div(fst(), snd())) %}
    | sE smMD {% ([fst, snd]) => (() => tf.mul(fst(), snd())) %}
    | mMD {% id %}

mAS -> mAS %tokenPlus smMD {% ([fst, _, snd]) => (() => tf.add(fst(), snd())) %}
    | mAS %tokenMinus smMD {% ([fst, _, snd]) => (() => tf.sub(fst(), snd())) %}
    | %tokenMinus smMD {% ([_, snd]) => (() => tf.sub(0, snd())) %}
    | smMD {% id %}

m -> %tokenMatrix {% ([m]) => (() => m.value.tfvar) %}
    | %tokenRelu %tokenLparen mAS %tokenRparen {% ([f, l, m, r]) => (() => tf.relu(m())) %}
    | %tokenSin %tokenLparen mAS %tokenRparen {% ([f, l, s, r]) => (() => tf.sin(m())) %}
    | %tokenCos %tokenLparen mAS %tokenRparen {% ([f, l, s, r]) => (() => tf.cos(m())) %}
    | %tokenSigmoid %tokenLparen mAS %tokenRparen {% ([f, l, s, r]) => (() => tf.sigmoid(m())) %}
    | %tokenTanh %tokenLparen mAS %tokenRparen {% ([f, l, s, r]) => (() => tf.tanh(m())) %}
    | %tokenSqrt %tokenLparen mAS %tokenRparen {% ([f, l, s, r]) => (() => tf.sqrt(s())) %}
    | %tokenAbs mAS %tokenAbs {% ([l, s, r]) => (() => tf.abs(s())) %}
    | %tokenSoftmax %tokenLparen mAS %tokenRparen {% ([f, l, s, r]) => (() => tf.softmax(s())) %}
    | %tokenOnehot %tokenLparen mAS %tokenComma %tokenNumber %tokenRparen {% ([f, l, m, c, n, r]) => (() => tf.onehot(m(), parseFloat(n.value))) %}