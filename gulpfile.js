/**
 * Gulp Config File
 * @author Fuyun
 */
const gulp = require('gulp');
const express = require('express');
const openurl = require('openurl');
const body = require('body-parser');
const tinylr = require('tiny-lr');
const server = tinylr();
const path = require('path');
const fs = require('fs');
const os = require('os');
const exec = require('sync-exec');
const ejs = require('gulp-ejs');
const runSequence = require('run-sequence');
const clean = require('gulp-clean');
const rename = require('gulp-rename');
const gulpif = require('gulp-if');
const useref = require('gulp-useref');
const minifyCss = require('gulp-minify-css');
const imagemin = require('gulp-imagemin');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');
const argv = require('yargs').argv;
const config = require('./config-gulp.json');
const gutil = require('gulp-util');
const less = require('gulp-less');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

/**
 * @param {Array} cmds
 * @param {Object} processOpts
 */
function execCmd (cmds, processOpts) {
    let opts;
    if (os.platform() === 'win32') {
        opts = ['cmd', '/c'];
    } else {
        opts = [];
    }
    opts = opts.concat(cmds);
    const msg = exec(opts.join(' '), 60000, processOpts);
    console.log(msg.stderr || msg.stdout);
    if (msg.status !== 0) {
        throw new Error('Exec cmd: [' + opts.join(' ') + ']');
    }
}

/**
 * insert a script of the livereload.js into the html string
 * @param {String} html
 */
function injectHtml (html) {
    const index = html.lastIndexOf('</body>');
    if (index !== -1) {
        const script = '\n<script>document.write(\'<script src="http://\' + (location.host || \'localhost\').split(\':\')[0] + \':' + config.port + '/livereload.js?snipver=1"></\' + \'script>\')</script>\n';
        return html.substr(0, index) + script + html.substr(index);
    }
    return html;
}

/**
 *
 * @param {String} reqPath
 */
function getMimeType (reqPath, staticPath) {
    const mimeType = {
        js: 'text/javascript'
        , css: 'text/css'
        , html: 'text/html'
        , png: 'image/png'
        , jpg: 'image/jpeg'
        , gif: 'image/gif'
        , svg: 'image/svg+xml'
        , ico: 'image/x-icon'
        , woff: 'application/font-woff'
        , ttf: 'application/octet-stream'
        , otf: 'application/octet-stream'
        , eot: 'application/vnd.ms-fontobject'
        , json: 'application/json'
    };
    const reqFormat = /\.([a-z0-9]+)$/i.exec(reqPath) || [];
    let reqType = '';
    if (reqFormat.length > 1) {
        reqType = mimeType[reqFormat[1]];
    } else if (staticPath === config.pathDevMock) {
        reqType = 'application/json';
    }
    return reqType || 'text/plain';
}

function routeFilter (staticPath) {
    return function (req, res, next) {
        const reqPath = req.path === '/' ? '/index.html' : req.path;
        const filePath = path.join(staticPath, reqPath);

        if (fs.existsSync(filePath)) {
            if (/\.html$/.test(reqPath)) {
                res.set('Content-Type', 'text/html');
                res.send(injectHtml(fs.readFileSync(filePath, 'UTF-8')));
            } else {
                res.set('Content-Type', getMimeType(reqPath, staticPath));
                res.send(fs.readFileSync(filePath));
            }
        } else {
            if (reqPath !== '/livereload.js') {
                console.warn('Not Found: ', filePath);
            }
            next();
        }
    };
}

/**
 * compile all the ejs files of the config.pathEjs dir
 * into html files from pathSrc to pathDist
 * @param {String} pathSrc the dir of the src path
 * @param {String} pathDist the dir of the target path
 */
function transformEjs (pathSrc, pathDist) {
    return gulp.src(path.join(pathSrc, config.pathEjs, '/**/*.ejs'))
        .pipe(ejs())
        .pipe(rename(function (path) {
                path.extname = '.html';
            }))
        .pipe(gulp.dest(pathDist));
}

/**
 * run task clean
 *
 * config.pathDist
 * config.pathTmp1
 * config.pathTmp2
 * Removes files and folders.
 *
 * {read: false}
 * Option read:false prevents gulp from reading the contents of the file
 * and makes this task a lot faster.
 *
 * If you need the file and its contents after cleaning in the same stream,
 * do not set the read option to false.
 */
gulp.task('clean', function () {
    return gulp.src([config.pathDist, config.pathTmp1, config.pathTmp2], {
        read: false
    }).pipe(clean());
});

const compiler = webpack(webpackConfig);
/**
 * run task webpack in production env
 */
gulp.task('webpack', function (cb) {
    compiler.run(function (err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack: ', err)
        }
        gutil.log('Webpack Result: ', '\n' + stats.toString({
                colors: true
            }));
        cb();
    });
});
gulp.task('ejs-dev', function () {
    transformEjs(config.pathSrc, config.pathDevHtml);
});

gulp.task('ejs-dist', function () {
    transformEjs(config.pathTmp1, path.join(config.pathTmp1, config.pathTmpHtml));
});

gulp.task('compass', function (cb) {
    execCmd(['compass', 'clean']);
    execCmd(['compass', 'compile', '--env', argv.env || 'production']);
    cb();
});
gulp.task('less', function (cb) {
    return gulp.src(path.join(config.pathSrc, config.pathLess, '**/*.less'))
        .pipe(less())
        .pipe(gulp.dest(path.join(config.pathSrc, config.pathCss)));
});

/**
 * 1 set up the livereload server
 * 2 init the files
 * 3 watch html, ejs, scss, js files
 */
gulp.task('start-server-dev', function () {
    const app = express();

    // 1. router set the correct Content-Type
    // 2. server send the target content to the client
    app.use(config.ajaxPrefix, routeFilter(config.pathDevMock));
    app.use(config.urlJs, express.static(config.pathDevJs));
    app.use(config.urlCss, express.static(path.join(config.pathSrc, config.pathCss)));
    app.use(config.urlImg, express.static(path.join(config.pathSrc, config.pathImg)));
    app.use(config.urlFonts, express.static(path.join(config.pathSrc, config.pathFonts)));
    app.use(['/'], routeFilter(config.pathDevHtml));

    // use bodyParser as the default ajax converter & setup the livereload server
    app.use(body()).use(tinylr.middleware({
        app: app
    }));

    // 1. setup express app on the config.port
    // 2. open url if neccessary
    app.listen(config.port, function (err) {
        if (err) {
            return console.error(err);
        }
        if (config.openurl) {
            openurl.open(config.openurl);
        }
        console.log('Server listening on %d', config.port);
    });
});
gulp.task('dev', function (cb) {
    runSequence('ejs-dev', 'less', 'copy-favicon-dev', 'start-server-dev');

    compiler.watch({
        aggregateTimeout: 300
        // poll: true
    }, function (err, stats) {
        if (err) {
            throw new gutil.PluginError('webpack: ', err)
        }
        gutil.log('Webpack Result: ', '\n' + stats.toString({
                colors: true
            }));
        tinylr.changed('xxx.js');
    });
    /**
     * watch special kind of ext
     * do sth when change according to the ext type
     * ---------------
     * ext type:
     *
     * ejs:
     *      1. transformEjs
     *      2. tinylr.changed(event.path)
     *      end
     *
     * scss:
     * other ext:
     *      1. compass compile
     *      2. tinylr.changed(a.css) ????
     *
     * webpack --env develop
     * tinylr.changed(event.path)
     * end
     *
     * @param {String} ext
     */
    function watchFiles (ext) {
        gulp.watch(['./src/**/*.' + ext], function (event) {
            if (ext === 'ejs') {
                transformEjs(config.pathSrc, config.pathDevHtml).on('end', function () {
                    tinylr.changed(event.path);
                });
                return false;
            } else if (ext === 'scss') {
                execCmd(['compass', 'compile', '--env', argv.env || 'production']);
            } else if (ext === 'less') {
                runSequence('less');
            }
            tinylr.changed(event.path);
        });
    }

    watchFiles('html');
    watchFiles('ejs');
    watchFiles('less');
});

gulp.task('start-server-test', function (cb) {
    const app = express();

    app.use(config.ajaxPrefix, routeFilter(config.pathDevMock));
    app.use(['/'], express.static(config.pathDist));
    app.use(body()).use(tinylr.middleware({
        app: app
    }));
    app.listen(config.port, function (err) {
        if (err) {
            return console.error(err);
        }
        if (config.openurl) {
            openurl.open(config.openurl);
        }
        console.log('Server listening on %d', config.port);
    });
});

/**
 * useref-html:
 *
 * useref would compile a.css + b.css + c.css
 * into /style/css/s.css
 *
 * <!-- build:css /style/css/s.css -->
 * <link type="text/css" rel="stylesheet" href="/style/css/a.css"></link>
 * <link type="text/css" rel="stylesheet" href="/style/css/b.css"></link>
 * <link type="text/css" rel="stylesheet" href="/style/css/c.css"></link>
 * <!-- endbuild -->
 */
gulp.task('useref-html', function () {
    return gulp.src(path.join(config.pathSrc, '**/*.{html,htm,ejs}'))
        .pipe(useref({
            searchPath: config.pathSrc
        }))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest(config.pathTmp1));
});
gulp.task('useref', ['useref-html']);

gulp.task('imagemin', function () {
    if (argv.imgMin && argv.imgMin === 'on') {
        return gulp.src(path.join(config.pathSrc, '**/*.{jpg,jpeg,gif,png}'))
            .pipe(imagemin({
                // jpg
                progressive: true,
                // png
                use: [pngquant({
                    quality: 90
                })]
            }))
            .pipe(gulp.dest(tmp1));
    }
    return gulp.src(path.join(config.pathSrc, '**/*.{jpg,jpeg,gif,png}'))
        .pipe(gulp.dest(config.pathTmp1));
});

gulp.task('rev-image', function () {
    return gulp.src([path.join(config.pathTmp1, '**/*.{jpg,jpeg,gif,png}')])
        .pipe(rev())
        .pipe(gulp.dest(config.pathTmp2))
        .pipe(rev.manifest('rev-manifest-img.json'))
        .pipe(gulp.dest(config.pathTmp2));
});

gulp.task('rev-flash', function () {
    return gulp.src([path.join(config.pathTmp1, '**/*.swf')])
        .pipe(rev())
        .pipe(gulp.dest(config.pathTmp2))
        .pipe(rev.manifest('rev-manifest-flash.json'))
        .pipe(gulp.dest(config.pathTmp2));
});

gulp.task('rev-css', function () {
    return gulp.src([path.join(config.pathTmp1, '**/*.css')])
        .pipe(rev())
        .pipe(gulp.dest(config.pathTmp2))
        .pipe(rev.manifest('rev-manifest-css.json'))
        .pipe(gulp.dest(config.pathTmp2));
});

gulp.task('revreplace-css', function () {
    const manifest = gulp.src([
        path.join(config.pathTmp2, 'rev-manifest-img.json')
    ]);

    return gulp.src(path.join(config.pathTmp1, '**/*.css'))
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.css'],
            prefix: ''
        }))
        .pipe(gulp.dest(config.pathTmp1));
});

gulp.task('revreplace-ejs', function () {
    const manifest = gulp.src([
        path.join(config.pathTmp2, 'rev-manifest-img.json'),
        path.join(config.pathTmp2, 'rev-manifest-flash.json'),
        path.join(config.pathTmp2, 'rev-manifest-css.json')
    ]);

    return gulp.src(path.join(config.pathTmp1, config.pathTmpHtml, '**/*.html'))
        .pipe(revReplace({
            manifest: manifest,
            replaceInExtensions: ['.html'],
            prefix: ''
        }))
        .pipe(gulp.dest(path.join(config.pathTmp2, config.pathTmpHtml)));
});

gulp.task('copy-webapp', function () {
    return gulp.src(config.pathSrc + '/*.{ico,txt,xml}')
        .pipe(gulp.dest(config.pathDist));
});

gulp.task('copy-build-css', function () {
    return gulp.src(path.join(config.pathTmp2, config.pathCss, '**'))
        .pipe(gulp.dest(path.join(config.pathDist, config.pathCss)));
});

gulp.task('copy-build-image', function () {
    return gulp.src(path.join(config.pathTmp2, config.pathImg, '**'))
        .pipe(gulp.dest(path.join(config.pathDist, config.pathImg)));
});

gulp.task('copy-build-fonts', function () {
    return gulp.src(path.join(config.pathSrc, config.pathFonts, '**'))
        .pipe(gulp.dest(path.join(config.pathDist, config.pathFonts)));
});
gulp.task('copy-build-html', function () {
    return gulp.src(path.join(config.pathTmp2, config.pathTmpHtml, '**/*.{html,htm}'))
        .pipe(gulp.dest(path.join(config.pathDist)));
});
gulp.task('clean-release', function () {
    return gulp.src([config.pathRelease], {
        read: false
    }).pipe(clean({
        force: true
    }));
});
gulp.task('copy-release', function () {
    return gulp.src(path.join(config.pathDist, '**'))
        .pipe(gulp.dest(path.join(config.pathRelease)));
});
gulp.task('copy-favicon', function () {
    return gulp.src(path.join(config.pathSrc, 'favicon.ico'))
        .pipe(gulp.dest(path.join(config.pathDist)));
});
gulp.task('copy-favicon-dev', function () {
    return gulp.src(path.join(config.pathSrc, 'favicon.ico'))
        .pipe(gulp.dest(path.join(config.pathDevHtml)));
});

gulp.task('copy-build', ['copy-webapp', 'copy-build-css', 'copy-build-image', 'copy-build-fonts', 'copy-build-html', 'copy-favicon']);

gulp.task('build', (cb) => {
    runSequence('clean', 'less', 'useref', 'ejs-dist', 'imagemin', 'rev-image', 'rev-flash', 'revreplace-css', 'rev-css', 'revreplace-ejs', 'webpack', 'copy-build', cb);
});
gulp.task('online', (cb) => {
    runSequence('build', 'start-server-test', cb);
});
gulp.task('release', (cb) => {
    runSequence('build', 'clean-release', 'copy-release', cb);
});
gulp.task('default', ['dev']);
