/**
 * Created by fuyun on 2017/3/4.
 */
import p1 from '../../lib/p.a';
console.log('a');
console.log(p1);
console.log('test');
console.log('---------------------------------');

window.onload = function () {
    require.ensure([], (require)=>{
        require('../../lib/p.c.js');
    });
};

// presets
var obj = {a: 1, b: 2}
var obj2 = {...obj}
console.log("stage-0")
console.log(obj2)

