const {IdentifiableValue, RefValue, ChoiceValue, TBD} = require('shr-models');
const CodeWriter = require('./CodeWriter');
const { sanitizeName, className } = require('./common.js');

function generateClass(def) {
  const cw = new CodeWriter();
  const clazzName = className(def.identifier.name);
  let superClass;
  if (def.basedOn.length) {
    if (def.basedOn.length > 1) {
      console.error('ERROR: Can create proper inheritance tree w/ multiple based on elements.  Using first element.');
    }

    if (def.basedOn[0] instanceof TBD) {
      cw.ln(`// Ommitting import and extension of base element: ${def.basedOn[0]}`).ln();
    } else {
      superClass = className(def.basedOn[0].name);
      cw.ln(`import ${superClass} from '${relativeImportPath(def.identifier, def.basedOn[0])}';`).ln();
    }
  }
  cw.blComment(() => {
    cw.ln(`Generated class for ${def.identifier.fqn}.`);
    if (superClass) {
      cw.ln(`@extends ${superClass}`);
    }
  });
  cw.bl(`class ${clazzName}${superClass ? ` extends ${superClass}` : ''}`, () => {
    generateClassBody(def, cw);
  });
  cw.ln(`export default ${clazzName};`);
  return cw.toString();
}

function generateClassBody(def, cw) {
  cw.ln();

  if (def.isEntry) {
    writeGetterAndSetter(cw, 'shr.base.Entry', 'entryInfo', 'entry information', '_entryInfo', 'Entry');
  }

  if (def.value) {
    if (def.value instanceof ChoiceValue) {
      writeGetterAndSetter(cw, def.value, 'value');
    } else if (def.value instanceof IdentifiableValue) {
      // If it's the "Value" keyword, we can just rely on an inherited getter/setter
      if (!def.value.identifier.isValueKeyWord) {
        const symbol = toSymbol(def.value.identifier.name);
        writeGetterAndSetter(cw, def.value, 'value', `value (aliases ${symbol})`, `_${symbol}`);
        writeGetterAndSetter(cw, def.value);
      }
    } else {
      // This should only happen for TBDs
      writeGetterAndSetter(cw, def.value);
    }
  }

  for (const field of def.fields) {
    writeGetterAndSetter(cw, field);
  }
}

function writeGetterAndSetter(cw, formalDefOrName, publicSymbol, descriptiveName, privateSymbol, typeName) {
  if (formalDefOrName instanceof TBD) {
    cw.ln(`// Ommitting getter/setter for TBD: ${formalDefOrName.text}`).ln();
    return;
  }

  let formalName;
  if (formalDefOrName instanceof ChoiceValue) {
    // Choices get a special treatment
    const options = formalDefOrName.options.filter(o => !(o instanceof TBD));
    if (options.length === 0) {
      cw.ln('// Ommitting getter/setter for choice with only TBD options').ln();
      return;
    }
    formalName = 'choice value; one of: ' + options.map(o => {
      return `${o.identifier.fqn}${o instanceof RefValue ? ' reference' : ''}`;
    }).join(', ');
    if (typeof publicSymbol === 'undefined') {
      publicSymbol = toSymbol(options.map(o => o.identifier.name).join('Or'));
    }
    if (typeof typeName === 'undefined') {
      // Create the set of types, squashing all references into one Reference type
      const typeMap = {};
      for (const o of options) {
        if (o instanceof RefValue) {
          typeMap['Reference'] = true;
        } else {
          typeMap[o.identifier.name] = true;
        }
      }
      const types = Object.keys(typeMap);
      typeName = types.length > 1 ? `(${types.join('|')})` : types[0];
    }
    if (typeof descriptiveName === 'undefined') {
      descriptiveName = formalName;
    }
  } else if (formalDefOrName instanceof RefValue){
    // References get a special treatment too
    formalName = `${formalDefOrName.identifier.fqn} reference`;
    if (typeof typeName === 'undefined') {
      typeName = 'Reference';
    }
    if (typeof publicSymbol === 'undefined') {
      publicSymbol = toSymbol(formalDefOrName.identifier.name);
    }
    if (typeof descriptiveName === 'undefined') {
      descriptiveName = `${formalDefOrName.identifier.name} reference`;
    }
  } else {
    // IdentifiableValue or string
    if (formalDefOrName instanceof IdentifiableValue) {
      formalName = formalDefOrName.identifier.fqn;
    } else {
      formalName = formalDefOrName;
    }
    if (typeof typeName === 'undefined') {
      typeName = formalName.split('.').pop();
    }
    if (typeof publicSymbol === 'undefined') {
      publicSymbol = toSymbol(typeName);
    }
    if (typeof descriptiveName === 'undefined') {
      descriptiveName = typeName;
    }
  }
  if (typeof privateSymbol === 'undefined') {
    privateSymbol = `_${publicSymbol}`;
  }
  cw.blComment(() => {
    cw.ln(`Get the ${descriptiveName}.`)
      .ln(`@return {${typeName}} The ${formalName}`);
  })
  .bl(`get ${publicSymbol}()`, `return this.${privateSymbol};`)
  .ln()
  .blComment(() => {
    cw.ln(`Set the ${descriptiveName}.`)
      .ln(`@param {${typeName}} ${publicSymbol} - The ${formalName}`);
  })
  .bl(`set ${publicSymbol}(${publicSymbol})`, `this.${privateSymbol} = ${publicSymbol};`)
  .ln();
}

function toSymbol(name) {
  const _name = sanitizeName(name);
  return `${_name.charAt(0).toLowerCase()}${_name.slice(1)}`;
}

function relativeImportPath(fromIdentifier, toIdentifier) {
  const fromNS = fromIdentifier.namespace.split('.');
  const toNS = toIdentifier.namespace.split('.');
  while (fromNS.length > 0 && toNS.length > 0 && fromNS[0] === toNS[0]) {
    fromNS.shift();
    toNS.shift();
  }
  const fromPath = fromNS.length ? fromNS.map(x => '..') : ['.'];
  return [...fromPath, ...toNS, className(toIdentifier.name)].join('/');
}

module.exports = generateClass;