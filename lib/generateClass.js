const reserved = require('reserved-words');
const {Value, IdentifiableValue, RefValue, ChoiceValue, TBD, INHERITED, Identifier} = require('shr-models');
const CodeWriter = require('./CodeWriter');
const { sanitizeName, className } = require('./common.js');

/**
 * Generates an ES6 class for the provided element definition.
 * @param {DataElement} def - The definition of the SHR element to generate a class for.
 * @returns {string} The ES6 class definition as a string (to be persisted to a .js file).
 */
function generateClass(def, fhir) {
  const cw = new CodeWriter();
  cw.ln(`import { setPropertiesFromJSON } from '${relativeImportPath(def.identifier, 'json-helper')}';`).ln();
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
    generateClassBody(def, fhir, cw);
  });
  cw.ln(`export default ${clazzName};`);
  return cw.toString();
}

/**
 * Generates the body of the ES6 class.
 * @param {DataElement} def - The definition of the SHR element to generate a class body for
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function generateClassBody(def, fhir, cw) {
  cw.ln();

  const clazzName = className(def.identifier.name);
  if (def.isEntry) {
    writeGetterAndSetter(cw, clazzName, 'shr.base.Entry', 'entryInfo', 'entry information', '_entryInfo', 'Entry');
  }

  // Don't repeat properties that were purely inherited (without overriding).  Although overrides actually don't
  // affect the definitions now, they may in the future, so we'll leave them in.
  if (def.value && def.value.inheritance !== INHERITED) {
    if (def.value instanceof ChoiceValue) {
      writeGetterAndSetter(cw, clazzName, def.value, 'value');
    } else if (def.value instanceof IdentifiableValue) {
      // If it's the "Value" keyword, we can just rely on an inherited getter/setter
      if (!def.value.identifier.isValueKeyWord) {
        const symbol = toSymbol(def.value.identifier.name);
        writeGetterAndSetter(cw, clazzName, def.value, 'value', `value (aliases ${symbol})`, `_${symbol}`);
        writeGetterAndSetter(cw, clazzName, def.value);
      }
    } else {
      // This should only happen for TBDs
      writeGetterAndSetter(cw, clazzName, def.value);
    }
  }

  for (const field of def.fields) {
    // Don't repeat properties that were purely inherited (without overriding).  Although overrides actually don't
    // affect the definitions now, they may in the future, so we'll leave them in
    if (field.inheritance !== INHERITED) {
      writeGetterAndSetter(cw, clazzName, field);
    }
  }

  cw.blComment( () => {
    const clazzName = className(def.identifier.name);
    cw.ln(`Deserializes JSON data to an instance of the ${clazzName} class.`)
      .ln(`The JSON must be valid against the ${clazzName} JSON schema, although this is not validated by the function.`)
      .ln(`@param {object} json - the JSON data to deserialize`)
      .ln(`@returns {${clazzName}} An instance of ${clazzName} populated with the JSON data`);
  })
    .bl('static fromJSON(json={})', () => writeFromJson(def, cw));
  
  cw.blComment( () => {
    const clazzName = className(def.identifier.name);
    cw.ln(`Serializes an instance of the ${clazzName} class to a JSON object.`)
      .ln(`The JSON is expected to be valid against the ${clazzName} JSON schema, but no validation checks are performed.`)
      .ln(`@returns {object} a JSON object populated with the data from the element`);
  })
    .bl(`toJSON()`, () => writeToJson(def, cw));

  cw.blComment( () => {
    const clazzName = className(def.identifier.name);
    cw.ln(`Serializes an instance of the ${clazzName} class to a FHIR object.`)
      .ln(`The FHIR is expected to be valid against the ${clazzName} FHIR profile, but no validation checks are performed.`)
      .ln(`@param {asExtension=false} Render this instance as an extension`)
      .ln(`@returns {object} a FHIR object populated with the data from the element`);
  })
    .bl(`toFHIR(asExtension=false)`, () => writeToFhir(def, fhir, cw));
}

/**
 * Generates a getter and a setter for a value or field.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @param {string} clazzName - The name of the class.
 * @param {Value|string} formalDefOrName - The `Value` or a string representing the thing to generate get/set for
 * @param {string=} publicSymbol - The symbol which other classes will use to access the property.  If undefined, it will
 *    be generated using sensible defaults.
 * @param {string=} descriptiveName - The descriptive name, used in the generated comments for the get/set functions.  If
 *    undefined, it will be generated using sensible defaults.
 * @param {string=} privateSymbol - The private property name where the data will be stored in the class.  If undefined,
 *    it will be generated using sensible defaults.
 * @param {string=} typeName - The type name used in the generated JSDoc to indicate the type of the thing being got or
 *    set.  If undefined, it will be generated using sensible defaults.
 * @private
 */
function writeGetterAndSetter(cw, clazzName, formalDefOrName, publicSymbol, descriptiveName, privateSymbol, typeName) {
  if (formalDefOrName instanceof TBD) {
    cw.ln(`// Ommitting getter/setter for TBD: ${formalDefOrName.text}`).ln();
    return;
  }

  let formalName;
  let required = (formalDefOrName instanceof Value) ? formalDefOrName.effectiveCard.min === 1 : false;
  if (formalDefOrName instanceof ChoiceValue) {
    // Choices get a special treatment
    const options = formalDefOrName.options.filter(o => !(o instanceof TBD));
    if (options.length === 0) {
      cw.ln('// Ommitting getter/setter for choice with only TBD options').ln();
      return;
    }
    formalName = 'choice value; one of: ' + options.map(o => {
      return `${o.effectiveIdentifier.fqn}${o instanceof RefValue ? ' reference' : ''}`;
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
          typeMap[o.effectiveIdentifier.name] = true;
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
    formalName = `${formalDefOrName.effectiveIdentifier.fqn} reference`;
    if (typeof typeName === 'undefined') {
      typeName = 'Reference';
    }
    if (typeof publicSymbol === 'undefined') {
      publicSymbol = toSymbol(formalDefOrName.identifier.name);
    }
    if (typeof descriptiveName === 'undefined') {
      descriptiveName = formalName;
    }
  } else {
    // IdentifiableValue or string
    let originalName;
    if (formalDefOrName instanceof IdentifiableValue) {
      originalName = formalDefOrName.identifier.fqn;
      formalName = formalDefOrName.effectiveIdentifier.fqn;
    } else {
      originalName = formalDefOrName;
      formalName = formalDefOrName;
    }
    if (typeof typeName === 'undefined') {
      typeName = formalName.split('.').pop();
    }
    if (typeof publicSymbol === 'undefined') {
      publicSymbol = toSymbol(originalName.split('.').pop());
    }
    if (typeof descriptiveName === 'undefined') {
      descriptiveName = typeName;
    }
  }
  if (typeof privateSymbol === 'undefined') {
    privateSymbol = `_${publicSymbol}`;
  }
  let arrayDescriptionPostfix = '';
  if (formalDefOrName instanceof Value && formalDefOrName.card && formalDefOrName.card.isList) {
    typeName = `Array<${typeName}>`;
    arrayDescriptionPostfix = ' array';
  }
  const capitalizedPublicSymbol = `${publicSymbol.charAt(0).toUpperCase()}${publicSymbol.slice(1)}`;
  // The variable name can't be a reserved word, so check it and modify if necessary
  const varName = reserved.check(publicSymbol, 'es2015', true) ? `${publicSymbol}Var` : publicSymbol;
  cw.blComment(() => {
    cw.ln(`Get the ${descriptiveName}${arrayDescriptionPostfix}.`)
      .ln(`@returns {${typeName}} The ${formalName}${arrayDescriptionPostfix}`);
  })
    .bl(`get ${publicSymbol}()`, `return this.${privateSymbol};`)
    .ln()
    .blComment(() => {
      cw.ln(`Set the ${descriptiveName}${arrayDescriptionPostfix}.`);
      if (required) {
        cw.ln('This field/value is required.');
      }
      cw.ln(`@param {${typeName}} ${varName} - The ${formalName}${arrayDescriptionPostfix}`);
    })
    .bl(`set ${publicSymbol}(${varName})`, `this.${privateSymbol} = ${varName};`)
    .ln()
    .blComment(() => {
      cw.ln(`Set the ${descriptiveName}${arrayDescriptionPostfix} and return 'this' for chaining.`);
      if (required) {
        cw.ln('This field/value is required.');
      }
      cw.ln(`@param {${typeName}} ${varName} - The ${formalName}${arrayDescriptionPostfix}`)
        .ln(`@returns {${clazzName}} this.`);
    })
    .bl(`with${capitalizedPublicSymbol}(${varName})`, `this.${publicSymbol} = ${varName}; return this;`)
    .ln();
}

/**
 * Generates a JSON deserializer for the class.
 * @param {DataElement} def - The definition of the SHR element to generate a deserializer for
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeFromJson(def, cw) {
  cw.ln(`const inst = new ${className(def.identifier.name)}();`);
  cw.ln('setPropertiesFromJSON(inst, json);');
  cw.ln('return inst;');
}

/**
 * Generates a JSON serializer for the element
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeToJson(def, cw) {
  // If the element is an Entry, put those fields on the JSON object first
  const url = `http://standardhealthrecord.org/spec/${def.identifier.namespace.replace('.', '/')}/${className(def.identifier.name)}`;
  if (def.isEntry) {
    cw.ln(`const inst = this._entryInfo.toJSON();`);
    cw.ln(`inst['EntryType'] = { 'Value' : '${url}' };`);
  } else if (def.identifier.name !== 'EntryType') {
    cw.ln(`const inst = { 'EntryType': { 'Value' : '${url}' } };`);
  } else {
    cw.ln(`const inst = {};`);
  }

  if (def.value !== undefined) {
    if (def.value instanceof ChoiceValue) {
      // Choices get a special treatment
      cw.bl(`if (this.value != null)`, () => {
        if (def.value.card.isList) {
          cw.ln(`inst['Value'] = this.value.map(f => typeof f.toJSON === 'function' ? f.toJSON() : f);`);
        } else {
          cw.ln(`inst['Value'] = typeof this.value.toJSON === 'function' ? this.value.toJSON() : this.value;`);
        }
      });
    } else if (def.value instanceof IdentifiableValue && def.value.identifier.isPrimitive) {
      cw.bl(`if (this.value != null)`, () => {
        cw.ln(`inst['Value'] = this.value;`);
      });
    } else {
      generateAssignmentIfList(def.value.card, 'Value', 'value', cw);
    }
  }

  for (const field of def.fields) {
    if (!(field instanceof TBD)) {
      generateAssignmentIfList(field.card, field.identifier.name, toSymbol(field.identifier.name), cw);
    }
  }

  cw.ln(`return inst;`);
}

/**
 * Generates a FHIR serializer for the element.
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {Object} fhir - The fhir export
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeToFhir(def, fhir, cw) {

  const fhirProfile = [...fhir.profiles, ...fhir._noDiffProfiles].find(p => p.id === fhirID(def.identifier));
  const fhirExtension = fhir.extensions.find(p => p.id === fhirID(def.identifier, 'extension'));

  cw.ln(`let inst = {};`);

  if(fhirProfile !== undefined){
    // FHIR profile exists, so we will pull out the mapping information from element maps

    if(def.isEntry){
      cw.ln(`inst['resourceType'] = '${fhirProfile.type}';`);
    }

    /* UNCOMMENT BELOW CODE TO JAM IN DUMMY MAPPING DATA */ 

    // const addMapping = (path, map, id) => {
    //   const el = fhirProfile.snapshot.element.find(f => (f.path === path && (!id || f.id === id)));
    //   el.mapping = el.mapping || [];
    //   el.mapping = el.mapping.filter(m => m.identity !== 'shr');
    //   el.mapping.push(map);
    // };
    // if(fhirProfile.name === 'PatientEntryProfile'){
    //   // addMapping('Patient.active', {'identity': 'shr', 'map': '<shr.simple.BooleanValue>'}); // DONE
    //   // addMapping('Patient.birthDate', {'identity': 'shr', 'map': '<Value>'}); // DONE
    //   // addMapping('Patient.name.text', {'identity': 'shr', 'map': '<shr.simple.StringValue>'}); // DONE
    //   // addMapping('Patient.deceasedBoolean', {'identity': 'shr', 'map': '<shr.fhir.Deceased>'}); // DONE
    //   addMapping('Patient.extension', {'identity': 'shr', 'map': '<shr.simple.IntegerValueElement>'}, 'Patient:shr-fhir-PatientEntry.extension:integervalueelement');
    //   addMapping('Patient.extension', {'identity': 'shr', 'map': '<shr.simple.DecimalValueElement>'}, 'Patient:shr-fhir-PatientEntry.extension:decimalvalueelement');
    //   addMapping('Patient.extension', {'identity': 'shr', 'map': '<shr.fhir.ComplexExtension>'}, 'Patient:shr-fhir-PatientEntry.extension:complexextension');
    // }
    // if(fhirProfile.name === 'PractitionerEntryProfile'){
    //   // addMapping('Practitioner.active', {'identity': 'shr', 'map': '<shr.simple.DoubleNestedBooleanValue>.<shr.simple.NestedBooleanValue>.<shr.simple.BooleanValue>'}); // DONE
    //   // addMapping('Practitioner.name.text', {'identity': 'shr', 'map': '<shr.simple.NestedStringValue>.<shr.simple.StringValue>'}); // DONE
    // }
    // if(fhirProfile.name === 'PhotoNoteProfile'){
    //   // addMapping('Attachment.title', {'identity': 'shr', 'map': '<Value>'}); // DONE
    // }

    for (let element of fhirProfile.snapshot.element) {
      const mapping = element.mapping && element.mapping.find(m => m['identity'] === 'shr');

      if(mapping !== undefined){
        if(mapping.map === '<Value>'){
          // Mapping to the value of this es6 instance
          if (def.value instanceof IdentifiableValue && def.value.identifier.isPrimitive) {
            generateFHIRAssignment(def.value.card, element.path, 'value', cw);
          } else {
            console.error('ERROR: Value referenced in mapping but none exist on this element.');
          }
        } else {
          // Mapping to a field within this es6 instance
          const fieldMapPath = mapping.map.match(/<([^>]*)>/g);
          if(fieldMapPath){
            // Generate a chain if mapped multiple levels deep, such as myField1.subField2
            const classMethodChain = fieldMapPath.map(e => toSymbol(fhirMappingToIdentifier(e).name)).join('.');
            // find related field if available
            const field = def.fields.find(f => f.identifier.equals(fhirMappingToIdentifier(fieldMapPath[0])));
            if(field !== undefined){
              generateFHIRAssignment(field.card, element.path, classMethodChain, cw);
            }
          }
        }
      }
    }
  }

  // not a profile, check to see if it has an extension
  if(!fhirProfile && fhirExtension){
    // When calling a method on an es6 instance that has a FHIR extension, you may either want to method to resolve directly to a value (e.g. 12)
    //   or you may want it to be represented as an extension if it is not mapped to an element in a FHRI resource, such as 
    //   [{url: 'http://extension, valueInteger: 12}]
    //   asExtension tells which way to export it depending where in the parent class this exists (extension or not)
    cw.bl(`if (asExtension)`, () => {
      fhirExtension.differential.element.forEach( (element) => {
        if(element.path === 'Extension.url'){
          cw.ln(`inst['url'] = '${element.fixedUri}';`);
        } else if(element.path.startsWith('Extension.value') && element.path !== 'Extension.value[x]'){
          // Simple extension with a valueType
          let name = element.path.split('.')[1];
          cw.ln(`inst['${name}'] = this.value;`);
        } else if(element.path === 'Extension.extension' && element.max != '0'){
          // Complex extension
          // The current implementation only seems to reference nested extensions, which promotes reuse of 
          // components of extensions, instead of expanding them out into a form like Patient.extension.extension.valueSting
          // If this changes, this code could need to be more generic to traverse the extension tree recursively
          // Need to figure out the name of the field we are looking at by grabbing the extension and looking at the identifier
          // This seemed better than parsing the URL, which seems like a somewhat arbitrary format
          let instance = fhir.extensions.find(e => e.url === element.type[0].profile).identifier[0].value;
          let methodName = toSymbol(instance.split('.')[instance.split('.').length-1]);
          cw.ln(`inst['extension'] = inst['extension'] || [];`);
          cw.ln(`inst['extension'].push(this.${methodName}.toFHIR(true));`);
        }
      });
    });
  }
    
  // Check to see if this can be resolved directly to a value and it is not a profile
  if (!fhirProfile && def.value) {

    // If this can be resolved directly to a value, give it the option to generate the value
    // Don't resolve to a value if it is flagged as being represented as an Extension
    cw.bl(`if (!asExtension && this.value != null)`, () => {

      // No profile, no mapping, not an extension, but it has a value so we can resolve the value
      cw.bl(`if (this.value != null)`, () => {
        if (def.value.card.isList) {
          cw.ln(`inst = this.value.map(f => typeof f.toFHIR === 'function' ? f.toFHIR() : f );`);
        } else {
          cw.ln(`inst = typeof this.value.toFHIR === 'function' ? this.value.toFHIR() : this.value;`);
        }
      });
    });
  }

  cw.ln(`return inst;`);
}

/**
 * Returns identifier from mapping in FHIR profile element
 * @param {string} mappingString - string in the format <shr.namespace.Element>
 * @returns {identifier} The identifier; returns null if Value
 */
function fhirMappingToIdentifier(mappingString){
  if(mappingString === '<Value>'){
    return null;
  }
  const bareMappingString = mappingString.slice(1,-1); // remove <>
  const mappingStringArray = bareMappingString.split('.');
  const name = mappingStringArray.pop();
  const namespace = mappingStringArray.join('.')
  return new Identifier(namespace, name);
}

/**
 * Writes out an object assignment string based on the cardinality
 * @param {object} card - the Cardinality object for the value being written
 * @param {string} jsonString - the key to use to write the value to JSON
 * @param {string} valueString - the string to get the required value out of 'this'
 * @param {CodeWriter} cw - The CodeWriter that's writing the class
 */
function generateAssignmentIfList(card, jsonString, valueString, cw) {
  cw.bl(`if (this.${valueString} != null)`, () => {
    if (card.isList) {
      cw.ln(`inst['${jsonString}'] = this.${valueString}.map(f => f.toJSON());`);
    } else {
      cw.ln(`inst['${jsonString}'] = typeof this.${valueString}.toJSON === 'function' ? this.${valueString}.toJSON() : this.${valueString};`);
    }
  });
}


// TODO: Refactor.  How to handle arrays in middle of mapping chains?
function generateFHIRAssignment(card, fhirElementPath, valueString, cw) {
  const valueArray = valueString.split('.')
  let prev = 'this.' + valueArray.shift(); // start with this.firstInChain
  let check = `${prev} !== null`; // e.g. this.firstInChain !== null && this.firstInChain.secondInChain !== null
  valueArray.forEach(v => {
    prev = prev + '.' + v;
    check = check + ' && ' + prev + ' !== null';
  });

  cw.bl(`if (${check})`, () => {
    const pathArray = fhirElementPath.split('.');
    pathArray.shift(); // discard the first because it is the resource name
    let pathString = '';  // pathstring contains inst['fhirFirstLevel']['fhirSecondLevel']
    const previous = [];
    while(pathArray.length > 0){
      previous.push(pathArray.shift());
      pathString = previous.map(e => `['${e}']`).join('') // build out the pathString
      if(pathArray.length > 0){
        cw.bl(`if(inst${pathString} === undefined)`, () => {
          // Should we handle array cases?
          cw.ln(`inst${pathString} = {};`); // make sure the each level of the json is initialized first
        });
      }
    }

    if(fhirElementPath.split('.')[1] === 'extension'){
      cw.ln(`inst['extension'] = inst['extension'] || [];`);
      cw.ln(`inst['extension'].push(this.${valueString}.toFHIR(true));`);//typeof this.${valueString}.toFHIR === 'function' ? this.${valueString}.toFHIR(true) : this.${valueString});`);
    } else {
      if (card.isList) {
        cw.ln(`inst${pathString} = this.${valueString}.map(f => typeof f.toFHIR === 'function' ? f.toFHIR() : f);`);
      } else {
        cw.ln(`inst${pathString} = typeof this.${valueString}.toFHIR === 'function' ? this.${valueString}.toFHIR() : this.${valueString};`);
      }
    }
  });
}

/**
 * Creates a symbol given a name.  Useful when a specific `publicSymbol` is not provided.
 * @param {string} name - The name to create the symbol for.
 * @private
 */
function toSymbol(name) {
  const _name = sanitizeName(name);
  return `${_name.charAt(0).toLowerCase()}${_name.slice(1)}`;
}

/**
 * Creates a fhirID based on an identifier
 * @param {identifier} Identifier - The identifier to change into a fhirID
 * @param {extra} string - Extra info to add to end of the fhirID
 * @private
 */
function fhirID(identifier, extra = '') {
  const id = `${identifier.namespace.replace(/\./g, '-')}-${identifier.name}`;
  if (extra.length > 0) {
    return `${id}-${extra}`;
  }
  return id;
}

/**
 * Determines the relative path from one generated class to another generated class or included file.  Needed when
 * generating imports.
 * @param {Identifier} fromIdentifier - The element identifier representing the ES6 class that is doing the import
 * @param {Identifier|string} to - The element identifier representing the ES6 class being imported or the string
 *   representing the file being imported
 * @returns {string} A relative path to where the imported class or file can be expected to be found
 * @private
 */
function relativeImportPath(fromIdentifier, to) {
  const fromNS = fromIdentifier.namespace.split('.');
  if (typeof to === 'string') {
    return [...fromNS.map(n => '..'), to].join('/');
  } else {
    const toNS = to.namespace.split('.');
    while (fromNS.length > 0 && toNS.length > 0 && fromNS[0] === toNS[0]) {
      fromNS.shift();
      toNS.shift();
    }
    const fromPath = fromNS.length ? fromNS.map(x => '..') : ['.'];
    return [...fromPath, ...toNS, className(to.name)].join('/');
  }
}

module.exports = generateClass;
