const fs = require('fs');
const path = require('path');
const generateClass = require('./generateClass');
const { sanitizeName } = require('./common.js');

function exportToES6(specifications) {
  const exporter = new ES6Exporter(specifications);
  return exporter.export();
}

class ES6Exporter {
  constructor(specifications) {
    this._specs = specifications;
    this._currentNamespace = '';
  }

  export() {
    const es6Defs = {};

    // Copy over Reference
    es6Defs['Reference.js'] = fs.readFileSync(path.join(__dirname, 'includes', 'Reference.js'), 'utf8');

    // Generate other classes
    for (const ns of this._specs.namespaces.all) {
      let container = es6Defs;
      for (const part of ns.namespace.split('.')) {
        if (!container[part]) {
          container[part] = {};
        }
        container = container[part];
      }
      for (const def of this._specs.dataElements.byNamespace(ns.namespace)) {
        container[`${sanitizeName(def.identifier.name)}.js`] = generateClass(def);
      }
    }
    return es6Defs;
  }
}

module.exports = {exportToES6};