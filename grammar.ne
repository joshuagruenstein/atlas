@{%
    function getTF(v) {
        switch (v.type) {
            case 'Scalar':
                return v.trainable ? tf.scalar(Math.random()).variable() : tf.scalar(v.data);
                break;
            case 'Vector':
                return v.trainable ? tf.tensor1d(Math.random()).variable() : tf.tensor1d(v.data);
                break;
            default:
                return 'uh oh';
                break;
        }
    }
    function getVariable(varName) {
        let vars = UI.getVariables();
        console.log(vars);
        console.log(varName);
        vars.forEach((v, i) => {
            if (v.name === varName) {
                return getTF(v);
            }
        });
        return "uH OH";
    }
%}

norm -> 
    "||" expression "||" {% (_, expr, __) => tf.norm(expr) %}

expression ->
    expression "*" expression {% (fst, _, snd) => tf.mul(fst, snd) %}
  | expression "+" expression {% (fst, _, snd) => tf.add(fst, snd) %}
  | variable {% id %}

variable -> [a-zA-Z] {% getVariable %}

