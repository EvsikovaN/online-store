const {dest, src, series, watch, parallel} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const csso = require('gulp-csso');
const include = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const del = require('del');
const sync = require('browser-sync').create();
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const sassGlob = require('gulp-sass-glob')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify-es').default
const sourcemaps = require('gulp-sourcemaps')
const imagemin = require('gulp-imagemin')
const newer = require('gulp-newer')
const gulpPug = require('gulp-pug')

const path = {
    styles: {
        src: 'src/styles/**/*.scss',
        blocks: 'src/blocks/**/*.scss',
        dest: 'dist/assets/styles/'
    },
    scripts: {
        src: 'src/scripts/**/**.js',
        dest: 'dist/assets/scripts/'
    },
    html: {
        src: 'src/pages/**.html',
        parts: 'src/parts/**.html',
        dest: 'dist'
    },
    pug: {
        src: 'src/pages/**.pug',
        parts: 'src/parts/**.pug',
        dest: 'dist'
    },
    images: {
        src: 'src/images/*',
        dest: 'dist/images'
    },
    serve: './dist/'
}

//создаем задачу и далее в потоке обрабатываем файлы используя подключенные модули
function html() {
    return src(path.html.src)
    .pipe(include({
        prefix: '@@'
    }))
    .pipe(htmlmin({
        collapseWhitespace: true
    }))
    .pipe(dest(path.html.dest))
}

function pug() {
    return src(path.pug.src)
    .pipe(gulpPug())
    .pipe(dest(path.pug.dest))
}

function scss() {
    return src(path.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass())
    //разобраться с опциями
    .pipe(autoprefixer({
        //overrideBrowserslist: ['last 2 versions']
        cascade: false
    }))
    .pipe(csso())
    .pipe(concat('index.css'))
    .pipe(rename({
        basename: 'main',
        suffix: '.min'
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(path.styles.dest))
}

function scripts() {
    return src(path.scripts.src)
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(concat('main.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(path.scripts.dest))
}

function images() {
    return src(path.images.src)
    .pipe(newer(path.images.dest))
    .pipe(imagemin({
        progressive: true
    }))
    .pipe(dest(path.images.dest))
}

function clear() {
    return del(['dist/*', '!dist/images'])
}

function serve() {
    sync.init({
        server: path.serve
    })

    //watch(path.html.src, series(html)).on('change', sync.reload)
    //watch(path.html.parts, series(html)).on('change', sync.reload)
    watch(path.pug.parts, series(pug)).on('change', sync.reload)
    watch(path.pug.src, series(pug)).on('change', sync.reload)
    watch(path.styles.src, series(scss)).on('change', sync.reload)
    watch(path.styles.blocks, series(scss)).on('change', sync.reload)
    watch(path.scripts.src, series(scripts)).on('change', sync.reload)
    watch(path.images.src, series(images)).on('change', sync.reload)
}

//сборка продакшен версии
exports.build = series(clear, html, pug, parallel(images, scss, scripts))
//режим разработки
exports.serve = series(clear, html, pug, parallel(images, scss, scripts), serve)

exports.html = html
exports.pug = pug
exports.scss = scss
exports.scripts = scripts
exports.images = images
exports.clear = clear
//задача по умолчанию вызывается командой gulp
exports.default = serve;