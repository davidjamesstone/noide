// var fs = require('fs');
// var glob = require('glob');
// var jsbeautifer = require('js-beautify').js_beautify;
//
// // beautify js assets
// glob('main/**/*.js', function(er, files) {
//   for (var i = 0; i < files.length; i++) {
//     var file = files[i];
//     var contents = fs.readFileSync(file, 'utf-8');
//     var beautified = jsbeautifer(contents);
//     fs.writeFileSync(file, beautified, {
//       encoding: 'utf-8'
//     });
//   }
// });


//glob('bin/test/**/*.js', function(er, files) {
//  for (var i = 0; i < files.length; i++) {
//    var file = files[i];
//    var expected = files.length;
//    beautifyJs(file, function() {
//      if (!--expected) {
//        console.log('done');
//      } else {
//        console.log(expected);
//      }
//    });
//  }
//});
//
//
//function beautifyJs(file, callback) {
//  fs.readFile(file, 'utf8', function(err, data) {
//    if (err) {
//      callback(err);
//      return;
//    }
//
//    var beautified = jsbeautifer(data);
//    fs.writeFile(file, beautified, function(err) {
//      callback(err)
//    });
//  });
//}
