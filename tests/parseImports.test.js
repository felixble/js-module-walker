const test = require('ava'),
    sinon = require('sinon'),
    _ = require('lodash/fp'),
    fs = require('fs'),
    {parseImports} = require('../lib/parseImports');

const localTestFiles = {
    "./file-local-import-from-default.js": `import stuff from './local/file';`,
    "./file-import-multiple-whitespaces.js": `import   stuff  from    './local/file';`,
    "./file-local-import.js": `import './local/file'`,
    "./file-local-import-from-as-default.js": `import * as s from './local/file'`,
    "./file-local-import-from-named.js": `import {stuff} from './local/file'`,
    "./file-local-import-from-named-as.js": `import {stuff as s} from './local/file'`,

    "./file-local-require.js": `require('./local/file');`
};

const testPackages = {
    "./file-package-import-from-default.js": `import fs from 'fs'`,
    "./file-package-import.js": `import 'fs';`,

    "./file-require-package.js": `require('fs');`
};

test.before(() => {
    sinon.stub(fs, 'readFileSync').callsFake(filename => localTestFiles[filename] || testPackages[filename] || '');
});

_.keys(localTestFiles).map(file => {
    test(`finds imports of ${file}`, t => {
        const input = [file],
            baseDir = './',
            outputFilename = file.slice(2),
            expectedOutput = [{file: outputFilename, imports: ['local/file.js']}];

        const output = parseImports(input, baseDir);

        t.deepEqual(output, expectedOutput);
    });
});

test('returns an array with objects for every input file with imports', t => {
    const input = _.keys(testPackages),
        baseDir = './';
    const output = parseImports(input, baseDir);

    for (const file of input) {
        t.true(
            output[0].file === file.slice(2) ||
            output[1].file === file.slice(2) ||
            output[2].file === file.slice(2));
    }
});

test('ignores packages if the ignorePackages is set to true', t => {
    const input = _.keys(testPackages),
        baseDir = './',
        ignorePackages = true;
    const output = parseImports(input, baseDir, ignorePackages);

    for (const entry of output) {
        t.deepEqual(entry.imports, []);
    }

    const expectedNumberOfEntries = 3;
    t.is(output.length, expectedNumberOfEntries);
});