/**
 * Created by fuyun on 2017/3/4.
 */
// import p1 from '../../lib/p.a';
// console.log('a');
// console.log(p1);
// console.log('---------------------------------');
//
// window.onload = function () {
//     require.ensure([], (require) => {
//         require('../../lib/p.c.js');
//     });
//     console.log('ajax get request...');
//     $.get('/ajax/tmp.json', function (data) {
//         console.log('result: ', data);
//     });
//     console.log('ajax post request...');
//     $.post('/ajax/sub/mock', function (data) {
//         console.log('result: ', data);
//     });
// };
//
// // presets
// var obj = {a: 1, b: 2}
// var obj2 = {...obj}
// console.log("stage-0")
// console.log(obj2)

$(function () {
    const bar1 = [
        'fontsizeselect fontselect formatselect',
        'bold italic underline strikethrough',
        'codesample blockquote subscript superscript',
        'alignleft aligncenter alignright alignjustify',
        'bullist numlist'
    ];
    const bar2 = [
        'forecolor backcolor',
        'outdent indent',
        'link anchor image media',
        'table insertdatetime',
        'hr pagebreak',
        'pastetext unlink removeformat',
        'visualblocks code preview fullscreen',
        'undo redo'
    ];
    const fonts = [
        '宋体=宋体',
        'Andale Mono=andale mono,times',
        'Arial=arial,helvetica,sans-serif',
        'Arial Black=arial black,avant garde',
        'Book Antiqua=book antiqua,palatino',
        'Comic Sans MS=comic sans ms,sans-serif',
        'Courier New=courier new,courier',
        'Georgia=georgia,palatino',
        'Helvetica=helvetica',
        'Impact=impact,chicago',
        'Symbol=symbol',
        'Tahoma=tahoma,arial,helvetica,sans-serif',
        'Terminal=terminal,monaco',
        'Times New Roman=times new roman,times',
        'Trebuchet MS=trebuchet ms,geneva',
        'Verdana=verdana,geneva',
        'Webdings=webdings',
        'Wingdings=wingdings,zapf dingbats'
    ];
    tinymce.suffix = '.min';
    tinymce.init({
        selector: '#content',
        height: 400,
        menubar: false,
        language: 'tinymce_cn',
        plugins: [
            'lists link image imagetools preview hr anchor pagebreak',
            'wordcount visualblocks visualchars code fullscreen',
            'insertdatetime media table',
            'paste textcolor colorpicker codesample'
        ],
        toolbar1: bar1.join(' | '),
        toolbar2: bar2.join(' | '),
        'image_advtab': true,
        'imagetools_toolbar': 'rotateleft rotateright | flipv fliph | editimage imageoptions',
        'font_formats': fonts.join(';')
    });
});