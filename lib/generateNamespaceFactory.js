const CodeWriter = require('./CodeWriter');
const { className, factoryName } = require('./common.js');

function generateNamespaceFactory(ns, defs) {
  const cw = new CodeWriter();
  for (const def of defs) {
    const name = className(def.identifier.name);
    cw.ln(`import ${name} from './${name}';`);
  }
  cw.ln()
    .blComment(`Generated object factory for the ${ns.namespace} namespace.`)
    .bl(`export default class ${factoryName(ns.namespace)}`, () => {
      cw.blComment(() => {
        cw.ln('Create an instance of a class by its element name and entry data.')
          .ln(`@param {string} elementName - The name of the element in the ${ns.namespace} namespace`)
          .ln('@param {Object} entry - The entry data in JSON format')
          .ln('@return {Object} An instance of the requested class populated with the provided data (NOTE: data deserialization not yet implemented)');
      })
      .bl('static createInstance(elementName, entry)', () => {
        cw.bl('switch (elementName)', () => {
          for (const def of defs) {
            const name = className(def.identifier.name);
            cw.ln(`case '${name}': return new ${name}(entry);`);
          }
        });
        cw.ln(`throw new Error(\`Unsupported class in ${factoryName(ns.namespace)}: \${elementName}\`);`);
      });
    });
  return cw.toString();
}

module.exports = generateNamespaceFactory;