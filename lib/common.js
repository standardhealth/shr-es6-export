function sanitizeName(name) {
  return `${name.replace(/[-]/g, '_')}`;
}

module.exports = { sanitizeName };