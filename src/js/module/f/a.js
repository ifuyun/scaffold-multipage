/**
 * Created by fuyun on 2017/3/4.
 */
import p1 from '../../lib/p.a';
console.log('a');
console.log(p1);
console.log('---------------------------------');

window.onload = function () {
    require.ensure([], (require) => {
        require('../../lib/p.c.js');
    });
    console.log('ajax get request...');
    $.get('/ajax/tmp.json', function (data) {
        console.log('result: ', data);
    });
    console.log('ajax post request...');
    $.post('/ajax/sub/mock', function (data) {
        console.log('result: ', data);
    });
};