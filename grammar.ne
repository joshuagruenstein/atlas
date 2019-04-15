@{%

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
%}

scalarExpression -> scalarSum {% id %}
scalarSum -> scalarSum %tokenPlus scalarProduct {% ([fst, _, snd]) => tf.add(fst, snd) %}
    | scalarProduct {% id %}
scalarProduct -> scalarProduct %tokenTimes scalar {% ([fst, _, snd]) => tf.mul(fst, snd) %}
    | scalar {% id %}
scalar -> %tokenScalar {% (s) => getTfScalar(s[0].value) %}
    | %tokenNumber {% (n) => getTfNumber(n[0].value) %}
    | %tokenNormsign vectorSum %tokenNormsign {% ([l, v, r]) => tf.norm(v) %}
    | %tokenNormsign matrixSum %tokenNormsign {% ([l, v, r]) => tf.norm(v) %}
vectorSum -> vectorSum %tokenPlus vectorProduct {% ([fst, _, snd]) => tf.add(fst, snd) %}
    | vectorProduct {% id %}
vectorProduct -> vectorProduct %tokenTimes vector {% ([fst, _, snd]) => tf.mul(fst, snd) %}
    | vector {% id %}
matrixSum -> matrixSum %tokenPlus matrixProduct {% ([fst, _, snd]) => tf.add(fst, snd) %}
    | matrixProduct {% id %}
matrixProduct -> matrixProduct %tokenTimes matrix {% ([fst, _, snd]) => tf.mul(fst, snd) %}
    | matrix {% id %}
vector -> %tokenVector {% (s) => getTfVector(s[0].value) %}
matrix -> %tokenMatrix {% (s) => getTfMatrix(s[0].value) %}

