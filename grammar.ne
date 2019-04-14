@{%
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
%}

norm -> 
    "||" expression "||" {% (_, expr, _) => tf.norm(expr) %}

expression ->
    expression "*" expression {% (fst, _, snd) => tf.mul(fst, snd) %}
  | expression "+" expression {% (fst, _, snd) => tf.add(fst, snd) %}
  | variable {% id %}

variable -> [a-zA-Z] {% getVariable %}

