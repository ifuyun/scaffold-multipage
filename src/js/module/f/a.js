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