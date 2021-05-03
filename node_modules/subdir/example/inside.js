var subdir = require('../');

console.dir([
    subdir(__dirname, './inside.js'),
    subdir(__dirname, '../../subdir/example/inside'),
    subdir(__dirname, '../index.js')
]);
