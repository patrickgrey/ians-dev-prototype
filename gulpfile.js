"use strict";

const gulp = require("gulp");
const { series } = require("gulp");
const fs = require("fs");
const path = require("path");
const browserSync = require("browser-sync");
const babel = require("gulp-babel");
const del = require("del");
const size = require("gulp-size");
const imagemin = require("gulp-imagemin");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const zip = require("gulp-zip");
const nunjucksRender = require("gulp-nunjucks-render");

const source = "app";
const publish = "dist";

let server = null;

const ignoreList = [
  `!${source}/index.html`,
  `!${source}/{clix,clix/**}`,
  `!${source}/{MOOCDirectAccess,MOOCDirectAccess/**}`
];

const imageFormats = `/**/*.{jpg,jpeg,svg,png,gif}`;

const formats = [
  `${source}/**/*.html`,
  `${source}/**/*.js`,
  `${source}/**/*.css`,
  `${source}${imageFormats}`
];

///////////////////////////////
// UTILITIES
//////////////////////////////

gulp.task("clean", del.bind(null, [".tmp", "dist"]));

function getFolders(dir) {
  return fs.readdirSync(dir).filter(function(file) {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
}

///////////////////////////////
// SERVE
//////////////////////////////

gulp.task("compileStyles", callback => {
  var folders = getFolders(source);
  var tasks = folders.map(function(folder) {
    return gulp
      .src([`${source}/${folder}/styles/scss/*.scss`].concat(ignoreList))
      .pipe(
        sass({
          outputStyle: "compressed",
          includePaths: ["node_modules/susy/sass"]
        }).on("error", sass.logError)
      )
      .pipe(rename({ dirname: "" })) //required to output to parent directory of sass file
      .pipe(gulp.dest(`${source}/${folder}/styles/`));
  });
  callback();
});

gulp.task("nunjucks", callback => {
  var folders = getFolders(source);
  var tasks = folders.map(function(folder) {
    return gulp
      .src(`${source}/${folder}/template/*.njk`)
      .pipe(
        nunjucksRender({
          path: [`${source}/${folder}/template/`]
        })
      )
      .pipe(gulp.dest(`${source}/${folder}/`));
  });
  callback();
});

gulp.task("browserSync", () => {
  server = browserSync.init({
    open: false,
    notify: false,
    port: 9000,
    server: {
      baseDir: `./${source}`,
      routes: {
        "/clix": "app/clix"
      }
    }
  });
  gulp.watch(`${source}/**/*.njk`, gulp.series("nunjucks"));
  gulp.watch(`${source}/**/*.scss`, gulp.series("compileStyles"));
  gulp.watch(formats).on("change", browserSync.reload);
});

gulp.task("serve", series("compileStyles", "nunjucks", "browserSync"));

///////////////////////////////
// BUILD
///////////////////////////////

gulp.task("buildScripts", callback => {
  var folders = getFolders(source);

  var tasks = folders.map(function(folder) {
    return gulp
      .src([`${source}/${folder}/**/*.js`].concat(ignoreList))
      .pipe(babel())
      .pipe(gulp.dest(`${publish}/${folder}/`));
  });
  callback();
});

gulp.task("buildStyles", callback => {
  var folders = getFolders(source);
  var tasks = folders.map(function(folder) {
    return gulp
      .src([`${source}/${folder}/**/*.css`].concat(ignoreList))
      .pipe(postcss([autoprefixer()]))
      .pipe(gulp.dest(`${publish}/${folder}/`));
  });
  callback();
});

gulp.task("buildHtml", () => {
  return gulp
    .src([`${source}/**/*.html`].concat(ignoreList.slice(1)))
    .pipe(gulp.dest(publish));
});

gulp.task("buildImages", () => {
  return gulp
    .src([`${source}/**/images/**/*`].concat(ignoreList))
    .pipe(
      imagemin({
        progressive: true,
        interlaced: true,
        svgoPlugins: [{ cleanupIDs: false }] //keep IDs as hooks
      })
    )
    .pipe(gulp.dest(publish));
});

gulp.task("buildCopyRest", callback => {
  var folders = getFolders(source);

  var tasks = folders.map(function(folder) {
    return gulp
      .src(
        [
          `${source}/${folder}/**/*.*`,
          `!${source}/${folder}/**/*.html`,
          `!${source}/${folder}/**/*.js`,
          `!${source}/${folder}/**/*.css`,
          `!${source}/${folder}` + imageFormats
        ].concat(ignoreList)
      )
      .pipe(gulp.dest(`${publish}/${folder}/`));
  });
  callback();
});

gulp.task("buildZips", callback => {
  var folders = getFolders(source);

  var tasks = folders.map(function(folder) {
    return gulp
      .src(`${publish}/${folder}/**/*`)
      .pipe(zip(folder + ".zip"))
      .pipe(gulp.dest(`${publish}/${folder}/`));
  });
  callback();
});

gulp.task("serve:dist", callback => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: publish,
      routes: {
        "/clix": "app/clix"
      }
    }
  });

  gulp.watch(formats).on("change", browserSync.reload);

  callback();
});

gulp.task(
  "build",
  series(
    "clean",
    "buildScripts",
    "buildStyles",
    "buildHtml",
    "buildCopyRest", // Moved to before buildImages or 'rest' folders missed by zip!
    "buildImages",
    "buildZips",
    "serve:dist"
  ),
  () => {
    return gulp
      .src(`${publish}/**/*`)
      .pipe(size({ title: "build", gzip: true }));
  }
);
