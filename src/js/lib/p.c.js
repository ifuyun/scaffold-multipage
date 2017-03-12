/**
 * Created by fuyun on 2017/3/4.
 */
import p1 from './p.a';
console.log('p.c');
console.log(p1);
var p3 = 'p3';

setTimeout(() => {
    require.ensure([], (require) => {
        require('./p.b.js');
    });
}, 10000);

export default {
    p3
};