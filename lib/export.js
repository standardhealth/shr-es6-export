const fs = require('fs');
const path = require('path');
const generateClass = require('./generateClass');
const generateNamespaceFactory = require('./generateNamespaceFactory');
const generateFactory = require('./generateFactory');
const CodeWriter = require('./CodeWriter');
const { className, factoryName } = require('./common.js');
const {MODELS_INFO} = require('shr-models');

/**
 * Exports SHR namespaces and elements to a set of ES6 classes for using within SHR-aware applications.
 * @param {Specifications} specifications - The SHR specifications to export to ES6 code
 * @param {Object} fhir - Exported FHIR information from shr-fhir-export; required for fhir serialization & deserialization
 * @returns {Object} An object representing the file hierarchy on disk, with file contents as the leaves
 */
function exportToES6(specifications, fhir) {
  const exporter = new ES6Exporter(specifications, fhir);
  return exporter.export();
}

/**
 * A class to manage the basic export of SHR definitions to ES6 classes.
 */
class ES6Exporter {
  /**
   * Constructs an ES6Exporter with the given SHR specification definitions
   * @param {Specifications} specifications - The SHR specifications to export to ES6 code
   */
  constructor(specifications, fhir) {
    this._specs = specifications;
    this._fhir = fhir;
    this._currentNamespace = '';
  }

  /**
   * Exports the loaded specifications to ES6 classes
   * @returns {Object} An object representing the file hierarchy on disk, with file contents as the leaves
   */
  export() {
    const es6Defs = {};

    // Copy over Reference
    es6Defs['Reference.js'] = fs.readFileSync(path.join(__dirname, 'includes', 'Reference.js'), 'utf8');
    es6Defs['json-helper.js'] = fs.readFileSync(path.join(__dirname, 'includes', 'json-helper.js'), 'utf8');
    es6Defs['init.js'] = fs.readFileSync(path.join(__dirname, 'includes', 'init.js'), 'utf8');


    // Generate the namespace factories and specific ES6 classes
    const namespaces = this._specs.namespaces.all;
    for (const ns of namespaces) {
      // Nest classes into subpaths by namespace
      let container = es6Defs;
      for (const part of ns.namespace.split('.')) {
        if (!container[part]) {
          container[part] = {};
        }
        container = container[part];
      }
      const defs = this._specs.dataElements.byNamespace(ns.namespace);
      container[`${factoryName(ns.namespace)}.js`] = generateNamespaceFactory(ns, defs);
      for (const def of defs) {
        container[`${className(def.identifier.name)}.js`] = generateClass(def, this._specs, this._fhir);
      }
    }

    // Generate the top-level factory
    es6Defs['ObjectFactory.js'] = generateFactory(namespaces);

    es6Defs['valueSets.js'] = this.collectValueSets(this._fhir);

    return es6Defs;
  }

  /**
   * Exports a file definition for a mapping of all value set URL : list of codes.
   * Determining a slice based on its code inclusion in a value set is tricky if you can't access the value set.
   * This approach is a little cleaner than trying to include the value set codes in each place they are used.
   */
  collectValueSets(fhir) {
    const cw = new CodeWriter();
    cw.ln('export const ALL_KNOWN_VALUE_SETS = {')
      .indent();

    const vsMap = {};

    const allValueSets = [...fhir.valueSets, ...fhir.base.valueSets];
    for (const vs of allValueSets) {
      const codes = [];
      if (vs.codeSystem && vs.codeSystem.concept) {
        codes.push(...vs.codeSystem.concept.map(c => c.code));
      }

      if (vs.compose && vs.compose.include) {
        // NOTE that this flattens multiple systems down into one list. each "include" has one system
        for (const inc of vs.compose.include) {
          if (inc && inc.concept) {
            inc.concept.forEach(c => codes.push(c.code));
          }
        }
      }

      // don't bother adding valuesets with no codes. the lookup logic will just return an empty array anyway
      if (codes.length > 0) {
        vsMap[vs.url] = codes;
      }
    }

    const wrapCodeInQuotes = function(code) {
      if (code.includes('\'')) {
        code = code.replace(/'/g, '\\\'') // replace the single quote with an escaped quote. we have to double-escape here to get the desired output
      }
      return `'${code}'`;
    };

    // write the map out line-by-line. ideally we could use JSON.stringify but it uses double quotes which the linter complains about
    // TODO: can we consolidate these loops? seems like there are duplicate value sets in the first loop somehow, fortunately the contents are the same
    for (const vsUrl in vsMap) {
      const codes = vsMap[vsUrl];
      cw.ln(`'${vsUrl}': [${codes.map(wrapCodeInQuotes).join(', ')}],`);
    }

    cw.outdent()
      .ln('};');

    return cw.toString();
  }
}

module.exports = {exportToES6, MODELS_INFO};
