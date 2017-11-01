function sanitizeName(name) {
  return `${name.replace(/[-]/g, '_')}`;
}

function className(name) {
  return sanitizeName(name);
}

function factoryName(namespace) {
  return namespace.split('.').map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('') + 'ObjectFactory';
}

module.exports = { sanitizeName, className, factoryName };