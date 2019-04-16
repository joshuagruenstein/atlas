@{%

    const tokenScalar = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Scalar'};
    const tokenVector = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Vector'};
    const tokenMatrix = {test: x => x.type === 'variable' && x.value.match !== null && x.value.match.type === 'Matrix'};
    const tokenPlus = {test: x => x.type === 'plus'};
    const tokenTimes = {test: x => x.type === 'times'};
    const tokenNormsign = {test: x => x.type === 'normsign'};
    const tokenNumber = {test: x => x.type === 'number'};

    function getTfNumber(v) {
        return tf.scalar(parseFloat(v));
    }
%}

scalarExpression -> scalarSum {% id %}
scalarSum -> scalarSum %tokenPlus scalarProduct {% ([fst, _, snd]) => tf.add(fst, snd) %}
    | scalarProduct {% id %}
scalarProduct -> scalarProduct %tokenTimes scalar {% ([fst, _, snd]) => tf.mul(fst, snd) %}
    | scalarProduct scalar {% ([fst, snd]) => tf.mul(fst, snd) %}
    | scalar {% id %}
scalar -> %tokenScalar {% ([s]) => s.value.tfvar %}
    | %tokenNumber {% ([n]) => getTfNumber(n.value) %}
    | %tokenNormsign vectorSum %tokenNormsign {% ([l, v, r]) => tf.norm(v) %}
    | %tokenNormsign matrixSum %tokenNormsign {% ([l, m, r]) => tf.norm(m) %}
vectorSum -> vectorSum %tokenPlus vectorProduct {% ([fst, _, snd]) => tf.add(fst, snd) %}
    | vectorProduct {% id %}
vectorProduct -> vectorProduct %tokenTimes vector {% ([fst, _, snd]) => tf.mul(fst, snd) %}
    | vectorProduct vector {% ([fst, snd]) => tf.mul(fst, snd) %}
    | vector {% id %}
matrixSum -> matrixSum %tokenPlus matrixProduct {% ([fst, _, snd]) => tf.add(fst, snd) %}
    | matrixProduct {% id %}
matrixProduct -> matrixProduct %tokenTimes matrix {% ([fst, _, snd]) => tf.mul(fst, snd) %}
    | matrixProduct matrix {% ([fst, snd]) => tf.mul(fst, snd) %}
    | matrix {% id %}
vector -> %tokenVector {% ([v]) => v.value.tfvar %}
matrix -> %tokenMatrix {% ([m]) => m.value.tfvar %}

