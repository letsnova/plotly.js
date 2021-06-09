var minimist = require('minimist');
var pixelmatch = require('pixelmatch');
var PNG = require('pngjs').PNG;
var fs = require('fs');

var common = require('../../tasks/util/common');
var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

// pixel comparison tolerance
var TOLERANCE = 1e-6;

/**
 *  Image pixel comparison test script.
 *
 *  Called by `tasks/test_image.sh in `npm run test-image`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *
 *  Examples:
 *
 *  Run all tests:
 *
 *      npm run test-image
 *
 *  Run the 'contour_nolines' test:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run all gl3d image test
 *
 *      npm run test-image -- gl3d_*
 *
 */

var argv = minimist(process.argv.slice(2), {});

// If no pattern is provided, all mocks are compared
if(argv._.length === 0) {
    argv._.push('');
}

// Build list of mocks to compare
var allMockList = [];
argv._.forEach(function(pattern) {
    var mockList = getMockList(pattern);

    if(mockList.length === 0) {
        throw 'No mocks found with pattern ' + pattern;
    }

    allMockList = allMockList.concat(mockList);
});

// To get rid of duplicates
function unique(value, index, self) {
    return self.indexOf(value) === index;
}
allMockList = allMockList.filter(unique);

var failed = 0;
for(var i = 0; i < allMockList.length; i++) {
    var mockName = allMockList[i];
    var imagePaths = getImagePaths(mockName);
    var base = imagePaths.baseline;
    var test = imagePaths.test;

    if(!common.doesFileExist(test)) {
        console.log('-', mockName);
        continue;
    }
    console.log('+', mockName);

    var img0 = PNG.sync.read(fs.readFileSync(base));
    var img1 = PNG.sync.read(fs.readFileSync(test));
    var s0, s1, key;

    key = 'width';
    s0 = img0[key];
    s1 = img0[key];
    if(s0 !== s1) {
        console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
        failed++;
    }

    key = 'height';
    s0 = img0[key];
    s1 = img0[key];
    if(s0 !== s1) {
        console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
        failed++;
    }

    var width = img0.width;
    var height = img0.height;

    var diff = new PNG({
        width: width,
        height: height
    });

    var numDiffPixels = pixelmatch(img0.data, img1.data, diff.data, width, height, {threshold: TOLERANCE});
    if(numDiffPixels) {
        fs.writeFileSync(imagePaths.diff, PNG.sync.write(diff));

        // mapbox behave differently from run-to-run
        // skip error on mapbox diff
        if(mockName.substr(7) === 'mapbox_') continue;

        console.error('pixels do not match: ' + numDiffPixels);
        failed++;
    } else {
        // remove when identical
        fs.unlinkSync(imagePaths.test);
    }
}

if(failed) {
    throw 'Catch different baselines.';
}
