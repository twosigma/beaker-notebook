var gulp      = require('gulp');
var sass      = require('gulp-sass');
var template  = require('gulp-template-compile');
var concat    = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');
var htmlmin   = require('gulp-htmlmin');
var htmlClass = require('html-classer-gulp');
var Path      = require('path');
var rootPath  = Path.join(__dirname, "/src/main/web/app/");
var buildPath = Path.join(__dirname, "/src/main/web/app/dist");

function handleError(e) {
  console.log('\u0007', e.message);
}

gulp.task("compileScss", function() {
  gulp.src(Path.join(rootPath, "**.scss"))
  .pipe(sass().on('error', handleError))
  .pipe(minifyCSS())
  .pipe(gulp.dest(buildPath))
});

gulp.task("compileTemplates", function() {
  gulp.src(rootPath + "/template/**/*.html")
  .pipe(htmlClass({klass: "bkr"}))
  .pipe(htmlmin({removeComments: true}))
  .pipe(template({
    name: function (file) {
      return file.relative.split(".")[0];
    }
  }))
  .pipe(concat('templates.js'))
  .pipe(gulp.dest(buildPath));
});

gulp.task("watchScss", function() {
  var watchPath = rootPath + "/**/*.scss";
  gulp.watch(watchPath, ["compileScss"])
});

gulp.task("watchTemplates", function() {
  var watchPath = rootPath + "/template/**/*.html";
  gulp.watch(watchPath, ["compileTemplates"])
});

gulp.task("watch", ["watchScss", "watchTemplates"]);
gulp.task("compile", ["compileScss", "compileTemplates"]);
