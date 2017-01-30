import fs from 'fs';
import path from 'path';
import _ from 'lodash/fp';

const babylon = require('babylon');

const encoding = 'utf-8';
const isLocalImport = dep => dep[0] === '.' || dep[0] === '/';

function parse(source) {
    return babylon.parse(source, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
            'jsx',
            'objectRestSpread',
            'classProperties',
            'exportExtensions',
            'asyncGenerators',
            'functionBind',
            'functionSend',
            'dynamicImport'
        ]
    });
}

function findImportStatements(ast) {
    let imports = [];

    if (!ast) {
        return imports;
    }

    if (ast.type === 'ImportDeclaration' && ast.source.type === 'StringLiteral') {
        imports = [...imports, ast.source.value];
    }

    if (ast.body) {
        const body = Array.isArray(ast.body) ? ast.body : [ast.body];
        imports = [...imports, ...body.map(sub => findImportStatements(sub))];
    }

    return imports;
}

function collectImports(file) {
    const contents = fs.readFileSync(file, {encoding}),
        ast = parse(contents),
        importStatements = findImportStatements(ast.program),
        imports = _.filter(l => l.length, _.flattenDeep(importStatements));

    return imports.map(dep => {
        if (isLocalImport(dep)) {
            const baseDir = path.dirname(file);
            return path.resolve(path.join(baseDir, dep));
        }

        return dep;
    });
}

function normalizeImports(baseDir, imports, ignorePackages) {
    let importsToConsider = imports;

    if (ignorePackages) {
        importsToConsider = imports.filter(isLocalImport);
    }

    return importsToConsider.map(dep => {
        if (isLocalImport(dep)) {
            return path.relative(baseDir, dep) + '.js';
        }

        return dep;
    })
}

export const parseImports = (files, absolutePath, ignorePackages = false) => {
    const importLists = files.map(collectImports).map(dep => normalizeImports(absolutePath, dep, ignorePackages));
    const relativeFiles = files.map(file => path.relative(absolutePath, file));

    return _.zipWith(relativeFiles, importLists, (file, imports) => {
        return [file, imports];
    }).map(dep => ({file: dep[1], imports: dep[0]}));
};