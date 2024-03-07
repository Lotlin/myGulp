import gulp from 'gulp';
import browserSync from 'browser-sync';
import cssImport from 'gulp-cssimport';
import * as sassPkg from 'sass';
import gulpSass from 'gulp-sass';
import {deleteAsync} from 'del';
import htmlmin from 'gulp-htmlmin';
import cleanCss from 'gulp-clean-css';
import sourcemaps from 'gulp-sourcemaps';
import gulpImg from 'gulp-image';
import gulpWebp from 'gulp-webp';
import gulpAvif from 'gulp-avif';
import {stream as critical} from 'critical';
import gulpIf from 'gulp-if';
import autoPrefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';

const preproc = true;
let dev = false;
const sass = gulpSass(sassPkg);

export const html = () => gulp
    .src('src/*.html')
    .pipe(htmlmin({
      removeComments: true,
      collapseWhitespace: true,
    }))
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());

export const style = () => {
  if (preproc) {
    return gulp
        .src('src/scss/**/*.scss')
        .pipe(gulpIf(dev, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoPrefixer())
        .pipe(cleanCss({
          2: {
            specialComments: 0,
          },
        }))
        .pipe(gulpIf(dev, sourcemaps.write('../maps')))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
  }
  return gulp
      .src('src/css/index.css')
      .pipe(gulpIf(dev, sourcemaps.init()))
      .pipe(cssImport({
        extensions: ['css'],
      }))
      .pipe(autoPrefixer())
      .pipe(cleanCss({
        2: {
          specialComments: 0,
        },
      }))
      .pipe(gulpIf(dev, sourcemaps.write('../maps')))
      .pipe(gulp.dest('dist/css'))
      .pipe(browserSync.stream());
};

export const js = () => gulp
    .src('src/js/**/*.js')
    .pipe(gulpIf(dev, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/preset-env'],
      ignore: [''],
    }))
    .pipe(gulpIf(dev, sourcemaps.write('../maps')))
    .pipe(gulp.dest('dist/js'));

export const img = () => gulp
    .src('src/img/**/*.{jpg,jpeg,png,svg,gif}')
    .pipe(gulpIf(!dev, gulpImg({
      optipng: ['-i 1', '-strip all', '-fix', '-o7', '-force'],
      pngquant: ['--speed=1', '--force', 256],
      zopflipng: ['-y', '--lossy_8bit', '--lossy_transparent'],
      jpegRecompress: [
        '--strip', '--quality', 'medium', '--min', 40, '--max', 80,
      ],
      mozjpeg: ['-optimize', '-progressive'],
      gifsicle: ['--optimize'],
      svgo: true,
    })))
    .pipe(gulp.dest('dist/img'))
    .pipe(browserSync.stream());

export const webp = () => gulp
    .src('src/img/**/*.{jpg,jpeg,png,}')
    .pipe(gulpIf(!dev, gulpWebp({
      quality: 80,
    })))
    .pipe(gulp.dest('dist/img'))
    .pipe(browserSync.stream());

export const avif = () => gulp
    .src('src/img/**/*.{jpg,jpeg,png,}')
    .pipe(gulpIf(!dev, gulpAvif({
      quality: 80,
    })))
    .pipe(gulp.dest('dist/img'))
    .pipe(browserSync.stream());

export const critCss = () => gulp
    .src('dist/*.html')
    .pipe(critical({
      base: 'dist/',
      inline: true,
      css: ['dist/css/index.css'],
    }))
    .on('error', err => {
      console.error(err.message);
    })
    .pipe(gulp.dest('dist'));

export const copy = () => gulp
    .src('src/fonts/**/*', {
      base: 'src',
    })
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream({
      once: true,
    }));

export const server = () => {
  browserSync.init({
    ui: false,
    notify: false,
    // tunnel: true,
    server: {
      baseDir: 'dist',
    },
  });

  gulp.watch('./src/**/*.html', html);
  gulp.watch(preproc ? './src/scss/**/*.scss' : './src/css/**/*.css', style);
  gulp.watch('./src/img/**/*.{jpg,jpeg,png,svg,gif}', img);
  gulp.watch('./src/js/**/*.js', js);
  gulp.watch('./src/fonts/**/*', copy);
  gulp.watch('./src/img/**/*.{jpg,jpeg,png}', webp);
  gulp.watch('./src/img/**/*.{jpg,jpeg,png}', avif);
};

export const clear = (done) => {
  deleteAsync(['./dist/**/*'], {
    force: true,
  });
  done();
};

export const develop = async () => {
  dev = true;
};

export const base = gulp.parallel(html, style, js, img, webp, avif, copy);

export const build = gulp.series(clear, base, critCss);

export default gulp.series(develop, base, server);
