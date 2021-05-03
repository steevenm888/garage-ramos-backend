var subdir = require('../');
var test = require('tape');

test(function (t) {
    t.equal(
        subdir('/beep/boop', './robot.js'),
        true
    );
    t.equal(
        subdir('/beep/boop', '../robot.js'),
        false
    );
    t.equal(
        subdir('/beep/boop', '../boop/robot.js'),
        true
    );
    t.equal(
        subdir('/beep/boop/example', '../../boop/example/robots.txt'),
        true
    );
    t.equal(
        subdir('/beep/boop/example', '../../boop/example_/robots.txt'),
        false
    );
    t.equal(
        subdir('/beep/boop/example', '../../../beep/boop/example/robots.txt'),
        true
    );
    t.equal(
        subdir('/beep/boop/example', '/beep/boop/example/robots.txt'),
        true
    );
    t.equal(
        subdir('/beep/boop/example', '/beep/boop/example_/robots.txt'),
        false
    );
    t.equal(
        subdir('/beep/boop/example', '/blarg'),
        false
    );
    t.equal(
        subdir('/beep/boop/example', '/beep/boop/example'),
        false
    );
    t.equal(subdir('/beep/boop/example', './'), false);
    t.equal(subdir('/', '/beep/boop'), true);
    t.equal(subdir('/', '/'), false);
    t.equal(subdir('/', './'), false);
    t.equal(subdir('/beep/boop', '/beep/boop'), false);
    t.end();
});
