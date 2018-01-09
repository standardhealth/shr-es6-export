const path = require('path');
const fs = require('fs-extra');
const mdls = require('shr-models');
const shrTI = require('shr-text-import');
const { exportToES6 } = require('../lib/export');

function setup(inDir='./test/fixtures/spec', outDir='./build/test', clean=false) {
  const configSpecs = shrTI.importConfigFromFilePath(inDir);
  const specs = shrTI.importFromFilePath(inDir, configSpecs);

  // Write it out to disk
  const results = exportToES6(specs);
  const handleNS = (obj, fpath) => {
    fs.mkdirpSync(fpath);
    for (const key of Object.keys(obj)) {
      if (key.endsWith('.js')) {
        fs.writeFileSync(path.join(fpath, key), obj[key]);
      } else {
        handleNS(obj[key], path.join(fpath, key));
      }
    }
  };
  if (clean) {
    fs.removeSync(outDir);
  }
  handleNS(results, outDir);
}

module.exports = setup;