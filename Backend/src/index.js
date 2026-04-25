const path = require('path');
const Module = require('module');

const srcNodeModulesPath = path.join(__dirname, 'node_modules');
const parentNodeModulesPath = path.join(__dirname, '..', 'node_modules');
const existingNodePath = process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : [];

process.env.NODE_PATH = [srcNodeModulesPath, parentNodeModulesPath, ...existingNodePath]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(path.delimiter);
Module._initPaths();

const app = require('../index');
const port = Number(process.env.PORT || 8080);

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;