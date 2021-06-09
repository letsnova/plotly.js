var minimist = require('minimist');
var path = require('path');
var spawn = require('child_process').spawn;

var args = [];
if(process.argv.length > 2) {
    // command line
    args = minimist(process.argv.slice(2), {});
}

var p = spawn(
    'python3',
    [
        path.join('test', 'image', 'make_baseline.py'),
        '= ' + (args._ ? args._.join(' ') : '')
    ]
);
try {
    p.stdout.on('data', function(data) {
        console.log(data.toString());
    });
} catch(e) {
    console.error(e.stack);
    p.exit(1);
}
