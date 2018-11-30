const reserved = require('reserved-words');
const { Value, IdentifiableValue, RefValue, ChoiceValue, TBD, INHERITED, Identifier } = require('shr-models');
const CodeWriter = require('./CodeWriter');
const { sanitizeName, className } = require('./common.js');

/**
 * Generates an ES6 class for the provided element definition.
 * @param {DataElement} def - The definition of the SHR element to generate a class for.
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @returns {string} The ES6 class definition as a string (to be persisted to a .js file).
 */
function generateClass(def, specs, fhir) {
  const cw = new CodeWriter();

  const imports = ['setPropertiesFromJSON'];

  const defFhirID = fhirID(def.identifier);
  const defFhirIDExtension = fhirID(def.identifier, 'extension');

  const fhirProfile = [...fhir.profiles, ...fhir._noDiffProfiles].find(p => p.id === defFhirID);
  const fhirExtension = fhir.extensions.find(p => p.id === defFhirIDExtension);

  // createInstanceFromFHIR should be conditionally added, but the logic to check where it's strictly necessary is basically all of writeFromFhir() so we don't want to dup that entire thing here.
  // instead just check if there's a profile or extension. it doesn't make sense to have a mapped FHIR profile or extension with no field-level mappings
  // this leaves open the possibility of "false positives" where there is an unused import. (preferable to "false negatives" where the function is used but not imported)
  if (fhirProfile || fhirExtension || def.value) {
    imports.push('createInstanceFromFHIR');
  }

  cw.ln(`import { ${imports.join(', ')} } from '${relativeImportPath(def.identifier, 'json-helper')}';`).ln();
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
    generateClassBody(def, specs, fhir, fhirProfile, fhirExtension, cw);
  });
  cw.ln(`export default ${clazzName};`);
  return cw.toString();
}

/**
 * Generates the body of the ES6 class.
 * @param {DataElement} def - The definition of the SHR element to generate a class body for.
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @param {object} fhirProfile - The FHIR profile that the given SHR element maps to, if any.
 * @param {object} fhirExtension - The FHIR extension that the given SHR element maps to, if any.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function generateClassBody(def, specs, fhir, fhirProfile, fhirExtension, cw) {
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
    cw.ln(`Deserializes JSON data to an instance of the ${clazzName} class.`)
      .ln(`The JSON must be valid against the ${clazzName} JSON schema, although this is not validated by the function.`)
      .ln(`@param {object} json - the JSON data to deserialize`)
      .ln(`@returns {${clazzName}} An instance of ${clazzName} populated with the JSON data`);
  })
    .bl('static fromJSON(json={})', () => writeFromJson(def, cw))
    .ln();
  
  cw.blComment( () => {
    cw.ln(`Serializes an instance of the ${clazzName} class to a JSON object.`)
      .ln(`The JSON is expected to be valid against the ${clazzName} JSON schema, but no validation checks are performed.`)
      .ln(`@returns {object} a JSON object populated with the data from the element`);
  })
    .bl(`toJSON()`, () => writeToJson(def, cw))
    .ln();

  cw.blComment( () => {
    cw.ln(`Serializes an instance of the ${clazzName} class to a FHIR object.`)
      .ln(`The FHIR is expected to be valid against the ${clazzName} FHIR profile, but no validation checks are performed.`)
      .ln(`@param {boolean} asExtension - Render this instance as an extension`)
      .ln(`@returns {object} a FHIR object populated with the data from the element`);
  })
    .bl(`toFHIR(asExtension=false)`, () => writeToFhir(def, specs, fhir, fhirProfile, fhirExtension, cw))
    .ln();
  
  cw.blComment( () => {
    cw.ln(`Deserializes FHIR JSON data to an instance of the ${clazzName} class.`)
      .ln(`The FHIR must be valid against the ${clazzName} FHIR profile, although this is not validated by the function.`)
      .ln(`@param {object} fhir - the FHIR JSON data to deserialize`)
      .ln(`@param {boolean} asExtension - Whether the provided instance is an extension`)
      .ln(`@returns {${clazzName}} An instance of ${clazzName} populated with the FHIR data`);
  }).bl('static fromFHIR(fhir, allEntries=[], mappedResources={}, asExtension=false)', () => writeFromFhir(def, specs, fhir, fhirProfile, fhirExtension, cw))
    .ln();
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
 * Pre-process any "choice" fields, ex "value[x]", 
 * so that instead of 1 field with N type choices and M mappings it looks like NxM simple non-choice fields
 * // TODO params
 */
function preProcessChoiceFields(elements, specs, fhir) {
  return elements.map(element => {
    if (!element.path.endsWith('[x]')) {
      return JSON.parse(JSON.stringify(element)); // passthrough for non-choice elements. dup it so we don't stomp on the original
    }

    const choices = [];

    const shrMappings = (element.mapping || []).filter(m => m.identity === 'shr');
    const typeChoiceMappings = validTypesForChoices(shrMappings, element.type, specs, fhir); // TODO: does this need to be done for more than just choice [x] fields?

    const preStringifiedElement = JSON.stringify(element); // we're going to clone the element via stringify/parse, only stringify it once for perf
    for (const mapping in typeChoiceMappings) {
      const types = typeChoiceMappings[mapping];

      for (const type of types) {
        const dupElement = JSON.parse(preStringifiedElement);
        // now put in an entry with the given type and mapping
        const capitalizedTypeName = `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        dupElement.path = dupElement.path.replace('[x]', capitalizedTypeName);
        dupElement.type = [{ code: type}];
        dupElement.mapping = [{ identity: 'shr', map: mapping }];

        choices.push(dupElement);
      }
    }

    return choices;

  }).flat(); // flatten any lists
}

/**
 * Pre-process SHR mappings so that they only have to be looked up once.
 */
function preProcessFieldMappings(elements, specs, def) {
  for (const element of elements) {
    let mapping = element.mapping || [];

    // filter out the non-SHR mappings, which we don't care about
    mapping = mapping.filter(m => m.identity === 'shr');

    const unique = Array.from(new Set(mapping.map(m => m.map))); // uniqueness filter here so we don't have to worry about duplicates later

    mapping = unique.map(m => ({ identity: 'shr', map: m }));

    // TODO: are duplicates normal or a bug somewhere down the line?)

    // then for any remaining ones, look up the field object
    for (const m of mapping) {
      if (m.map !== '<Value>') { // 'Value' means something special; we don't need the actual field object
        Object.assign(m, getFieldAndMethodChain(m.map, def, specs, element)); // Object.assign merges the properties to the first arg, from the following args
      }
    }

    // finally, clear out any that we couldn't find the field for
    mapping = mapping.filter(m => m.field || m.map === '<Value>');

    element.mapping = mapping;
  }
}

/**
 * Generates a FHIR deserializer for the element.
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @param {object} fhirProfile - The FHIR profile that the given SHR element maps to, if any.
 * @param {object} fhirExtension - The FHIR extension that the given SHR element maps to, if any.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeFromFhir(def, specs, fhir, fhirProfile, fhirExtension, cw) {
  cw.ln(`const inst = new ${className(def.identifier.name)}();`);

  if(fhirProfile){
    writeFromFhirProfile(def, specs, fhir, fhirProfile, cw);
  }

  if (fhirExtension) {
    // extension not a profile
    writeFromFhirExtension(def, specs, fhir, fhirExtension, cw)
  }

  if (!fhirProfile && def.value) {
    // If not a profile and can be resolved directly to a value, set it as the "value" field
    writeFromFhirValue(def, specs, cw);
  }

  cw.ln('return inst;');
}

/**
 * Generates the body of the FHIR deserializer, when there is a matching FHIR profile for the element.
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @param {object} fhirProfile - The FHIR profile that the given SHR element maps to.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeFromFhirProfile(def, specs, fhir, fhirProfile, cw) {
  // FHIR profile exists, so we will pull out the mapping information from element maps

  const sliceMap = preprocessSlicing(fhirProfile); 

  const elementHierarchy = []; // keep a stack to make looking "upward" in the object hierarchy easy
  // elementHierarchy contains objects of the form 
  // { element: {FHIR element}, didOpenBlock: <boolean>, fhirBasePath: <string> }

  const allFhirElements = preProcessChoiceFields(fhirProfile.snapshot.element, specs, fhir);
  preProcessFieldMappings(allFhirElements, specs, def);

  for (const element of allFhirElements) {

    if (element === allFhirElements[0]) {
      // special case for the "base" element, ex the "Procedure" or "Condition" element at the top-level

      elementHierarchy.unshift({ element, didOpenBlock: false, fhirBasePath: 'fhir' });
      continue; // we know that the top-level element does not have a mapping
    }

    while (elementHierarchy.length > 0 && !element.path.startsWith(elementHierarchy[0].element.path)) {
      // the top element is not our parent, so pop until it is
      const parentContext = elementHierarchy.shift();

      if (parentContext.didOpenBlock) {
        cw.outdent().ln('}');
      }
    }
    elementHierarchy.unshift({ element, slicing: sliceMap[element.path] });

    if (element.max === '0' || elementHierarchy.some(e => e.element.max === '0')) {
      // ignore the element, since this profile does not allow it to have a value
      // also look to see if a parent element has a max of 0, in which case we also ignore this element
      continue;
    }

    let fhirElementPath = element.path;

    // look ahead to see if this or any "child" elements have an SHR mapping

    // note - adding the dot is to prevent false positives where one field has a similar name to the next one
    // ex. AdverseEvent.suspectEntity.causality and AdverseEvent.suspectEntity.causalityAssessment
    const childElementsWithMapping = allFhirElements.filter(e => e !== element && e.path.startsWith(element.path + '.') && e.mapping.length > 0);
    const elementIsList = element.max === '*' || Number(element.max) > 1;
    const baseIsList = element.base && (element.base.max == '*' || Number(element.base.max) > 1);
    const fhirIsList = elementIsList || baseIsList;
    if (element.mapping.length > 0 || childElementsWithMapping.length > 0) {
      // this element has a mapping, or some child element does, so we open up a block

      // look upward in the element hierarchy to find the first parent with a base path, if one exists
      // start with i = 1, because i = 0 = the current element
      for (let i = 1 ; i < elementHierarchy.length ; i++) {
         const parentBasePath = elementHierarchy[i].fhirBasePath;

         if (parentBasePath) {
           const parentPath = elementHierarchy[i].element.path;
           fhirElementPath = element.path.replace(parentPath, parentBasePath);
           break;
         }
      }

      if (fhirIsList) {

        // if it's a list in FHIR AND in SHR, iterate over the list
        // but if it's not a list in SHR, we need to pick the right items out
        // TODO: this is probably where slicing fits in

        // since there could be multiple mappings, assume they all have the same cardinality
        // if they don't, we'll wind up with mixing & matching lists & single items which gets messy
        // TODO: how to handle it if they don't match?

        let shrIsList = elementIsList;

        if (element.mapping.length > 0) {
          shrIsList = element.mapping[0].field.card.isList;
        } else {
          // check children
          const firstChildMapping = childElementsWithMapping[0].mapping[0];
          shrIsList = firstChildMapping.field.card.isList;
        }

        let basePath;
        if (shrIsList) {
          basePath = createVariableName(fhirElementPath);
          // if it's a list, create a for loop (including '|| []' to avoid a null check)
          cw.ln(`for (const ${basePath} of ${bracketNotation(fhirElementPath)} || []) {`).indent();
        } else {
          basePath = fhirElementPath + '[0]'; // TODO - other ways to pick, ie slicing
          // just a single item, create a null check for the array and the item
          cw.ln(`if (${bracketNotation(fhirElementPath)} != null && ${bracketNotation(basePath)} != null) {`).indent();
        }
        elementHierarchy[0].fhirBasePath = basePath;
        fhirElementPath = basePath; // use the new base path going forward
      } else {
        // if it's a single item, create a null check
        cw.ln(`if (${bracketNotation(fhirElementPath)} != null) {`).indent();
      }
      elementHierarchy[0].didOpenBlock = true;
    }

    for (const mapping of element.mapping) {
      // create the assignment 

      if(mapping.map === '<Value>'){
        // Mapping to the value of this es6 instance
        if (def.value instanceof IdentifiableValue && def.value.identifier.isPrimitive) {
          generateFromFHIRAssignment(def.value.card.isList, fhirIsList, 1, element, element.path, [], 'value', fhirProfile, null, cw);
          
        } else {
          console.error('ERROR: Value referenced in mapping but none exist on this element.');
        }
      } else {
        // Generate a chain if mapped multiple levels deep, such as myField1.subField2
        // find related field if available
        const {field, classMethodChain, fieldMapPath} = mapping; // TODO fix this 
        
        let shrElementPath = 'inst.' + classMethodChain; 

        // again look upward in the element hierarchy to find the first parent with an SHR base path, if one exists
        // start with i = 1, because i = 0 = the current element
        for (let i = 1 ; i < elementHierarchy.length ; i++) {
           const parentBasePath = elementHierarchy[i].shrBasePath;

           if (parentBasePath) {
             const parentPath = elementHierarchy[i].shrElementPath;
             shrElementPath = shrElementPath.replace(parentPath, parentBasePath);
             break;
           }
        }
        elementHierarchy[0].shrElementPath = shrElementPath;

        if (field.card.isList) {
          cw.ln(`${shrElementPath} = ${shrElementPath} || [];`); // initialize the list. TODO: move this outside the loop?
        // }

        // if (fhirIsList && field.card.isList) {
          // then create a variable to assign into
          const basePath = createVariableName(shrElementPath); // replace non-word characters to make a variable name
          elementHierarchy[0].shrBasePath = basePath;

          shrElementPath = basePath; // use the new base path going forward
        }

        const slicing = sliceMap[elementHierarchy[0].element.path] && sliceMap[elementHierarchy[0].element.path][element.sliceName];
        generateFromFHIRAssignment(field.card.isList, fhirIsList, 0, element, fhirElementPath, fieldMapPath, shrElementPath, fhirProfile, slicing, cw);              

        if (field.card.isList) {
          // add the newly created element to the list it belongs to
          cw.ln(`${elementHierarchy[0].shrElementPath}.push(${shrElementPath});`);
        }
      }
    }
  }

  // close out any remaining blocks
  while (elementHierarchy.length > 0 ) {
    const parentContext = elementHierarchy.shift();

    if (parentContext.didOpenBlock) {
      cw.outdent().ln('}');
    }
  }
}

/**
 * Generates the body of the FHIR deserializer, when there is a matching FHIR extension for the element.
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @param {object} fhirExtension - The FHIR extension that the given SHR element maps to.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeFromFhirExtension(def, specs, fhir, fhirExtension, cw) {
  // When calling a method on an es6 instance that has a FHIR extension, you may either want to method to resolve directly to a value (e.g. 12)
  //   or you may want it to be represented as an extension if it is not mapped to an element in a FHIR resource, such as 
  //   [{url: 'http://extension, valueInteger: 12}]
  //   asExtension tells which way to import it depending where in the parent class this exists (extension or not)
  cw.bl(`if (asExtension)`, () => {
    fhirExtension.differential.element.forEach( (element, i) => {
      if(element.path.startsWith('Extension.value') && element.path !== 'Extension.value[x]'){
        // Simple extension with a valueType
        let name = element.path.split('.')[1];

        cw.ln(`inst.value = fhir['${name}'];`);
      } else if(element.path === 'Extension.extension' && element.max != '0'){
        // Complex extension

        // The current implementation only seems to reference nested extensions, which promotes reuse of 
        // components of extensions, instead of expanding them out into a form like Patient.extension.extension.valueSting
        // If this changes, this code could need to be more generic to traverse the extension tree recursively
        // Need to figure out the name of the field we are looking at by grabbing the extension and looking at the identifier
        // This seemed better than parsing the URL, which seems like a somewhat arbitrary format
        let instance = fhir.extensions.find(e => e.url === element.type[0].profile).identifier[0].value;
        let methodName = toSymbol(instance.split('.')[instance.split('.').length-1]);
        // find the right extension in the list
        const url = element.type[0].profile;
        const varName = `match_${i}`; // ensure a unique variable name here
        cw.ln(`const ${varName} = fhir['extension'].find(e => e.url == '${url}');`);
        cw.bl(`if (${varName} != null)`, () => {
          cw.ln(`inst.${methodName} = createInstanceFromFHIR('${instance}', ${varName}, true);`); // asExtension = true here, false(default value) everywhere else
        });
      }
    });
  });
}

/**
 * Generates a FHIR deserializer for the element when the element maps to a single value.
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeFromFhirValue(def, specs, cw) {
  cw.bl(`if (!asExtension && fhir != null)`, () => {
    if (def.value.effectiveIdentifier != null) {
      if (def.value.effectiveIdentifier.isPrimitive) {
        // it's a primitive value means we can set it directly
        cw.ln(`inst.value = fhir;`);
      } else {
        const shrType = def.value.effectiveIdentifier.fqn;
        cw.ln(`inst.value = createInstanceFromFHIR('${shrType}', fhir);`);
      }
    } else {
      // it could be any of the options, and we can't necessarily tell which one here
      // so just call createInstance to leverage the logic that looks up profiles
      cw.ln(`inst.value = createInstanceFromFHIR(null, fhir);`);
    }        
  });
}


function bracketNotation(dotNotation) {
  return dotNotation.split('.')
                    .map((e, i) => {
                      if (i == 0) {
                        return e;
                      }

                      if (e.endsWith(']')) {
                        // already bracketed, ie, an array index
                        const bracket = e.lastIndexOf('[');

                        return "['" + e.slice(0, bracket) + "']" + e.slice(bracket);
                      }

                      return `['${e}']`;
                    })
                    .join('');
}

/**
 * Construct a variable name to contain the value at the given path.
 * @param {string} path - Path to some location, ex "field1.field2.field3"
 */
function createVariableName(path) {
  return path.replace(/\W+/g, '_');
}

/** 
 * Pre-processing to identify slices. 
 * Slicing requires information spread across multiple elements so it doesn't play nice with the iterative approach below
 * Example: https://www.hl7.org/fhir/profiling-examples.html#blood-pressure
 * Say we want to pull out the "systolic" component, 
 *  1) we need the context of the prior Observation.component element to know what the discriminator of the slice is ("code")
 *  2) we need the fixed value of the later Obervation.component.code element to know which value to look for
 * so to handle this we create a map of sliceGroup -> sliceName -> discriminator&code. in the blood pressure example, we'd produce a map like the following:
 * { 'Observation.component' : {
 *     'systolic': [{path: 'Observation.component.code', value: <loinc, 8480-6...>}], 
 *     'diastolic': [{path: 'Observation.component.code', value: <loinc, 8462-4...>}] 
 *   }
 * }
 */
function preprocessSlicing(fhirProfile) {
  const sliceMap = {};

  // to build up this map, we keep a stack because slices can be nested
  const sliceStack = []; // note: javascript doesn't have Array.peek so we use shift/unshift to keep the "top" at index 0

  for (let element of fhirProfile.snapshot.element) {

    while (sliceStack.length > 0 && !element.path.startsWith(sliceStack[0].path)) {
      // ended a slice group so pop the top element
      const sliceGroup = sliceStack.shift();

      sliceMap[sliceGroup.path] = sliceGroup.elements;
    }

    if (element.slicing && !element.path.endsWith('.extension')) { // extensions automatically slice on url, we don't care about that here
      // starting a new slice group

      const elementSlicing = JSON.parse(JSON.stringify(element.slicing)); // deep copy so we don't stomp on the source object

      // pre-process and combine the element paths so we don't have to do it on every check
      elementSlicing.discriminator.forEach( d => d.path = element.path + '.' + d.path);

      const sliceGroup = { path: element.path, slicing: elementSlicing, currentSlice: null, elements: {} };

      sliceStack.unshift(sliceGroup);
    } else if (sliceStack[0]) {
      if (element.sliceName) {
        // starting a new slice element, only possible if already within a slice group

        sliceStack[0].currentSlice = element.sliceName;
        sliceStack[0].elements[element.sliceName] = [];
      }

      sliceStack.forEach(sliceGroup => { // multiple slices can slice on the same discriminator
        if (sliceGroup.slicing.discriminator.some( d => d.path == element.path )) { 
          // element.path matches a discriminator; we found a value to match on

          // this could be all sorts of things, fixedCode, fixedString, fixedWhatever, so figure out what type it is and look for fixed<Type>
          let fixedValue;

          // TODO: this only works for "value" type discriminators; don't forget about the other types

          for (const type of element.type) {
            const typeName = type.code;
            const fieldName = `fixed${typeName.charAt(0).toUpperCase()}${typeName.slice(1)}`; // ex. 'code' => 'fixedCode'

            if (element[fieldName] != null) {
              // don't just check for falsy, consider `fixedBoolean: false`
              fixedValue = element[fieldName];
            }
          }

          if (fixedValue == null) {
            console.error('Could not identify fixed value for:');
            console.error(element);
          }

          sliceGroup.elements[sliceGroup.currentSlice].unshift( { path: element.path, value: fixedValue } );
        }
      });
    }
  }

  // if the fhir profile ends and we still have "open" slices, finalize them here
  while (sliceStack.length > 0) {
    const sliceGroup = sliceStack.shift();
    sliceMap[sliceGroup.path] = sliceGroup.elements;
  }

  return sliceMap;
}

/**
 * Given a list of mappings, get the object representing the field definition found by traversing those mappings,
 * plus a single "method chain" that represents the path to that field.
 * TODO: fill in the parameters and return value here
 */
function getFieldAndMethodChain(mapping, def, specs, element) {
  const fieldMapPath = mapping.match(/<([^>]*)>/g);
  if(fieldMapPath){
    let field;
    let currDef = def;

    let classMethodChain = ''; // build up the method chain as we iterate over the path in the mapping

    // for nested element mappings, such as "Patient.person.address", we have to look up Patient.person and then Person.address
    for(const pathElement of fieldMapPath) {
      const elementIdentifier = fhirMappingToIdentifier(pathElement);

      let methodName;

      // TODO: primitives and "fake" primitives where namespace = ''

      if (elementIdentifier.isEntryKeyWord || elementIdentifier.isConceptKeyWord) {
        // TODO: figure out how to handle these.

        // example: "AllergyIntolerance:cimi-allergy-AdverseSensitivityToSubstanceStatement.assertedDate" maps to "<_Entry>.<shr.core.CreationTime>"
        break;

      } else {

        // TODO: if the given identifier matches on a VALUE, we want to assign to inst.value not to inst.whateverFieldName.
        // so we want to look at some of the logic for if(mapping.map === '<Value>') above
        // is there a need to consider field1.field2.value? probably
        if (currDef.value instanceof IdentifiableValue && elementIdentifier.equals(currDef.value.effectiveIdentifier)) {
          methodName = 'value';
          field = currDef.value;
        } else if (currDef.value instanceof ChoiceValue && currDef.value.options.some(o => elementIdentifier.equals(o.effectiveIdentifier))) {
          // TODO: this can probably be rewritten better to not loop over the list twice, although the numbers should be small enough it doesnt matter

          methodName = 'value';
          field = currDef.value.options.find(o => elementIdentifier.equals(o.effectiveIdentifier));

        } else {
          // look for it in all the fields
          field = currDef.fields.find(f => elementIdentifier.equals(f.effectiveIdentifier));

          if (field) {
            methodName = toSymbol(field.effectiveIdentifier.name);
          }
        }
      }

      if (!field) {
        console.error(`ERROR: unable to find field with identifer ${elementIdentifier} on element ${currDef.identifier}`);
        console.error(`Original Element: ${def.identifier} ; full mapping: ${mapping} ; FHIR ID: ${element.id} Path: ${element.path}`);

        // TODO: address other instances where the field is not found. these may need to be fixed here, the spec, or somewhere else
        // some examples:
        // - cimi.allergy.NoAdverseSensitivityToSubstanceStatement is a FHIR Observation
        // in the profile, Observation.code.coding maps to <shr.core.Coding> even though there is no explicit mapping as such
        // so there is no shr.core.Coding field to find
        // - shr.core.Frequency is a FHIR Ratio
        // in the profile, Ratio.numerator.value maps to <Value> but Frequency doesn't have a value
        // this one seems like the mapping is incorrect and it should map to <shr.core.Numerator>.<shr.core.Quantity> .
        // note that the profile for shr.core.Ratio also maps to FHIR Ratio but does not include the sub-fields below Numerator/Denominator (ie, value, unit, etc)
        break;
      }

      classMethodChain = `${classMethodChain}${methodName}.`; // add an extra dot at the end here, we'll lop it off at the end
      currDef = specs.dataElements.byNamespace(field.effectiveIdentifier.namespace).find(e =>  e.identifier.equals(field.effectiveIdentifier));
    }

    classMethodChain = classMethodChain.slice(0,-1); // slice off the last character (the extra dot)
    return {field, classMethodChain, fieldMapPath};
  }
  return {};
}


/**
 * Given a FHIR element with a "choice" type, e.g. "value[x]",
 * this function maps the choices for type to the appropriate mapping choices.
 * 
 * Example 1: (in pseudo-FHIR)
 *  mcode.Tumor.value[x]
 *   - type: [Quantity, CodeableConcept, string, Range, Ratio, time, dateTime, Period]
 *   - mapping: [shr.core.Quantity, shr.core.CodeableConcept, shr.core.Range, shr.core.Ratio, shr.core.TimePeriod]
 *
 * result:
 *  { shr.core.Quantity => [Quantity], shr.core.CodeableConcept => CodeableConcept, shr.core.Range => Range, shr.core.Ratio => Ration, shr.core.TimePeriod => Period }
 *
 * Example 2:
 *  mcode.CancerDisorder.onset[x]
 *   - type: [dateTime, Age, Period, Range, string]
 *   - mapping: [shr.base.Onset]
 *
 * result:
 *  { shr.base.Onset => [dateTime, Age, Period, Range, string] }
 *
 * @param {Array} shrMappings - The list of SHR mappings for the field (i.e., element.mapping)
 * @param {Array} fhirTypes - The list of FHIR types the field can be (i.e., element.type)
 * @param {object} specs - All specifications, to perform lookups
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @returns {object} mapping between SHR types => FHIR types
 */
function validTypesForChoices(shrMappings, fhirTypes, specs, fhir) {
  const typesByChoice = {};

  for (const mapping of shrMappings) {
    const fieldMapPath = mapping.map.match(/<([^>]*)>/g);
    const identifier = fhirMappingToIdentifier(fieldMapPath[fieldMapPath.length - 1]); // TODO -- guaranteed to only be the last entry?
    const currMappingTypes = [];

    const de = specs.dataElements.byNamespace(identifier.namespace).find(e => e.identifier.equals(identifier));

    if (de.value instanceof IdentifiableValue) {
      const match = fhirTypes.find(t => t.code == de.value.effectiveIdentifier.fqn);
      if (match) {
        currMappingTypes.push(match.code);
      }
    } else if (de.value instanceof ChoiceValue) {
      for (const choice of de.value.options) {
        const matches = fhirTypes.filter(t => t.code == choice.effectiveIdentifier.fqn || t.code == choice.effectiveIdentifier.name);
        // note that the name check matches on, eg "Quantity" and "shr.core.Quantity". 
        // TODO: is this a safe assumption that if an SHR type name matches a FHIR type name they are related?
        if (matches) {
          currMappingTypes.push(...matches.map(m => m.code));
        }

        const fhirProfile = [...fhir.profiles, ...fhir._noDiffProfiles].find(p => p.id == fhirID(choice.effectiveIdentifier));
        if (fhirProfile) {
          const fhirMatch = fhirTypes.find(t => t.code == fhirProfile.type);
          if (fhirMatch) {
            currMappingTypes.push(fhirMatch.code);
          }
        }
      }
    }

    const match = fhirTypes.find(t => t.code == de.identifier.fqn || t.code == de.identifier.name);
    if (match) {
      currMappingTypes.push(match.code);
    }
    
    const fhirProfile = [...fhir.profiles, ...fhir._noDiffProfiles].find(p => p.id == fhirID(de.identifier));
    if (fhirProfile) {
      const fhirMatch = fhirTypes.find(t => t.code == fhirProfile.type);
      if (fhirMatch) {
        currMappingTypes.push(fhirMatch.code);
      }
    }

    typesByChoice[mapping.map] = new Set(currMappingTypes); // TODO: Set logic here is to avoid dups
  }

  return typesByChoice;
}

/**
 * Generates a FHIR serializer for the element.
 * @param {DataElement} def - The definition of the SHR element to generate a serializer for
 * @param {Specifications} specs - All SHR specifications, to be used for lookups and xrefs.
 * @param {object} fhir - All exported FHIR profiles and extensions.
 * @param {object} fhirProfile - The FHIR profile that the given SHR element maps to, if any.
 * @param {object} fhirExtension - The FHIR extension that the given SHR element maps to, if any.
 * @param {CodeWriter} cw - The CodeWriter instance to use during generation
 * @private
 */
function writeToFhir(def, specs, fhir, fhirProfile, fhirExtension, cw) {
  const alreadyMappedElements = new Map;

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
      let baseIsList = element.base && element.base.max == '*';
      baseIsList = baseIsList || (element.mapping && element.mapping.filter(elem => elem.identity == 'shr').length > 1);
      if(mapping !== undefined){
        if(mapping.map === '<Value>'){
          // Mapping to the value of this es6 instance
          if (def.value instanceof IdentifiableValue && def.value.identifier.isPrimitive) {
            generateToFHIRAssignment(def.value.card.isList, baseIsList, 1, element.path, 'value', fhirProfile, cw);
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
            let field = def.fields.find(f => f.identifier && f.identifier.equals(fhirMappingToIdentifier(fieldMapPath[0])));

            // TODO: for nested element mappings, such as "Patient.person.address", we have to look up Patient.person and then Person.address
            // currently it will only look at Patient.person

            if(field !== undefined){
              // console.log(field.identifier.name);
              if (!alreadyMappedElements.has(classMethodChain)) {
                const constraintsLength = field.constraintsFilter.includesType.constraints.length;
                generateToFHIRAssignment(field.card.isList, baseIsList, constraintsLength, element.path, classMethodChain, fhirProfile, cw);
                alreadyMappedElements.set(classMethodChain, element.path);
              }
            }
          }
        }
      }
    }
  }

  // not a profile, check to see if it has an extension
  if(fhirExtension){
    // When calling a method on an es6 instance that has a FHIR extension, you may either want to method to resolve directly to a value (e.g. 12)
    //   or you may want it to be represented as an extension if it is not mapped to an element in a FHIR resource, such as 
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
          cw.bl(`if (this.${methodName} != null)`, () => {
            cw.ln(`inst['extension'] = inst['extension'] || [];`);
            cw.ln(`inst['extension'].push(this.${methodName}.toFHIR(true));`);
          });
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
  const namespace = mappingStringArray.join('.');
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

/**
 * Generates the "assignment" portion of the toFHIR method, where the SHR elements get built into the FHIR json
 * @param {boolean} cardIsList whether the element cardinality is a "list" (aka > 1)
 * @param {boolean} baseCardIsList whether the element is "based" on an element whose cardinality is a list (> 1)
 * @param {Number} constraintsLength the number of constraints on the element; used to determine whether there are more contstrained elements than cardinalities
 * @param {string} fhirElementPath the FHIR element that the data should be put into (in FQN notation)
 * @param {string} valueString the SHR element that the data should be taken from (in FQN notation)
 * @param {Object} fhirProfile the FHIR profile the element comes from
 * @param {CodeWriter} cw the CodeWriter that is writing the file for this element
 */
function generateToFHIRAssignment(cardIsList, baseCardIsList, constraintsLength, fhirElementPath, valueString, fhirProfile, cw) {
  const valueArray = valueString.split('.');
  let prev = 'this.' + valueArray.shift(); // start with this.firstInChain
  let check = `${prev} != null`; // e.g. this.firstInChain !== null && this.firstInChain.secondInChain !== null
  valueArray.forEach(v => {
    prev = prev + '.' + v;
    check = check + ' && ' + prev + ' != null';
  });

  // If we have more things (as evidenced by the 'IncludesTypeConstraints' that we need to fit into the end of the path)
  // than we can fit into it, then we need to figure out where the closest array to the current element is.
  // This will get put into 'containerProfile' if it exists.
  let containerProfileArray;
  if (!(cardIsList || baseCardIsList) && constraintsLength > 1) {
    const pathArrayClone = fhirElementPath.split('.');
    // loop over the pathArrayClone to figure out where th nearest 0..*-cardinality element is
    while (pathArrayClone.length > 0) {
      pathArrayClone.pop();
      const searchString = pathArrayClone.join('.');
      const candidateSnapshotElement = fhirProfile.snapshot.element.find(e => { return e.path === searchString; });
      // If we find a snapshot element that matches the search string, and which has a 'max' (cardinality) of *
      // That's our nearest array element (into which we're going to put our elements)
      if (candidateSnapshotElement && candidateSnapshotElement.max == '*') {
        // containerProfileArray gives us the string array to the nearest array element
        containerProfileArray = pathArrayClone.slice(1);
        break;
      }
    }
  }

  cw.bl(`if (${check})`, () => {
    const pathArray = fhirElementPath.split('.');
    pathArray.shift(); // discard the first because it is the resource name
    let pathString = '';  // pathstring contains inst['fhirFirstLevel']['fhirSecondLevel']
    const previous = [];
    let containedPathArray;
    while(pathArray.length > 0){
      previous.push(pathArray.shift());
      pathString = previous.map(e => `['${e}']`).join(''); // build out the pathString
      if(pathArray.length > 0){        
        cw.bl(`if(inst${pathString} === undefined)`, () => {
          // Handle cases where there's an array in the middle of the element chain
          if (containerProfileArray && containerProfileArray.map(e => `['${e}']`).join('') == pathString) {
            cw.ln(`inst${pathString} = [];`);
            containedPathArray = pathArray.slice(0);
          } else {
            cw.ln(`inst${pathString} = {};`); // make sure the each level of the json is initialized first
          }
        });
      }
    }

    if(fhirElementPath.split('.')[1] === 'extension'){
      cw.ln(`inst['extension'] = inst['extension'] || [];`);
      cw.ln(`inst['extension'].push(typeof this.${valueString}.toFHIR === 'function' ? this.${valueString}.toFHIR(true) : this.${valueString});`);
    } else {
      if (cardIsList || baseCardIsList) {
        cw.ln(`inst${pathString} = inst ${pathString} || [];`);
        if (cardIsList) {
          cw.ln(`inst${pathString} = inst${pathString}.concat(this.${valueString}.map(f => typeof f.toFHIR === 'function' ? f.toFHIR() : f));`);
        } else {
          cw.ln(`inst${pathString}.push(typeof this.${valueString}.toFHIR === 'function' ? this.${valueString}.toFHIR() : this.${valueString});`);
        }
      } else {
        // If we have to map our elements to an array higher up in the profile
        if (containerProfileArray && containedPathArray) {
          // Iterate through each element at current level, and map it to the array element
          cw.bl(`this.${valueString}.forEach( (elem) => `, () => {
            cw.ln('let containerInst = {};');
            let containedPathString = '';
            // Iterate through each level between the array element and our current element, and make sure they're all initialized.
            containedPathArray.forEach(e => {
              containedPathString = containedPathString.concat(`['${e}']`);
              cw.ln(`containerInst${containedPathString} = {};`);
            });
            // Set the contained element instance's data with the current 'elem' element
            cw.ln(`containerInst${containedPathString} = typeof elem.toFHIR === 'function' ? elem.toFHIR() : elem;`);
            // Push the contained element instance onto the higher-level array
            cw.ln(`inst${containerProfileArray.map(e => `['${e}']`).join('')}.push(containerInst);`);
          });
          // Close the `this.${valueString}.forEach( (elem) => block's parenthesis
          cw.ln(');');
        } else {
          cw.ln(`inst${pathString} = typeof this.${valueString}.toFHIR === 'function' ? this.${valueString}.toFHIR() : this.${valueString};`);
        }
      }
    }
  });
}

/**
 * Generates the "assignment" portion of the fromFHIR method, where the SHR elements get built from the FHIR json
 * @param {boolean} cardIsList - whether the element cardinality is a "list" (aka > 1)
 * @param {boolean} baseCardIsList - whether the element is "based" on an element whose cardinality is a list (> 1)
 * @param {Number} constraintsLength - the number of constraints on the element; used to determine whether there are more contstrained elements than cardinalities
 * @param {string} fhirElement - the FHIR element that the data should be taken from  (in FQN notation)
 * @param {string} fhirElementPath - the path to the FHIR element. may be different from fhirElement.path, ex in the case of value[x] this will be a specific choice
 * @param {Array} shrElementMapping - chain of SHR elements that the FHIR element maps to
 * @param {string} shrElementPath - the SHR element that the data should be put into (in FQN notation)
 * @param {Object} fhirProfile - the FHIR profile the element comes from
 * @param {Object} slicing - information on this element related to slicing, if any
 * @param {CodeWriter} cw - the CodeWriter that is writing the file for this element
 */
function generateFromFHIRAssignment(cardIsList, baseCardIsList, constraintsLength, fhirElement, fhirElementPath, shrElementMapping, shrElementPath, fhirProfile, slicing, cw) {
  let fhirPathString = bracketNotation(fhirElementPath);

  const dec = cardIsList ? 'const ' : ''; // if it's a list, we are declaring a variable

  // TODO: update all createInstanceFromFHIR calls with new params

  if(fhirElementPath.endsWith("['extension']")){
    // find the right extension in the list
    const url = fhirElement.type[0].profile;
    cw.ln(`const match = fhir['extension'].find(e => e.url == '${url}');`);
    cw.bl(`if (match != null)`, () => {
      // consider only building up the nested class structure above if we find a match on the extension. but that involves reworking a lot
      const shrMapping = shrElementMapping[shrElementMapping.length - 1];
      const shrType = fhirMappingToIdentifier(shrMapping).fqn;
      cw.ln(`${shrElementPath} = createInstanceFromFHIR('${shrType}', match, true);`); // asExtension = true here, false(default value) everywhere else
    });

  } else if (fhirElement.type[0].code === 'Reference') { 
    // look up reference by ID
    cw.ln(`const refID = ${fhirPathString}['reference'];`);

    cw.bl('if (!mappedResources[refID])', () => {
      cw.ln('const referencedEntry = allEntries.find(e => e.fullUrl === refID);');
      cw.bl('if (referencedEntry)', () => {
        const parts = fhirElement.type[0].targetProfile.split('/');
        const shrType = parts[parts.length - 1].replace(/-/g, '.'); 
        cw.ln(`mappedResources[refID] = createInstanceFromFHIR('${shrType}', referencedEntry['resource']);`)
      });
    });

    cw.ln(`${dec}${shrElementPath} = mappedResources[refID];`); // if it failed to map, this could be undefined, which is fine
  } else {
    if (shrElementPath == 'value' && shrElementMapping.length == 0) { // "primitive" values that do not map to an SHR type
      cw.ln(`${shrElementPath} = ${fhirPathString};`);
    } else {
      const shrMapping = shrElementMapping[shrElementMapping.length - 1];
      const shrType = fhirMappingToIdentifier(shrMapping).fqn;
      cw.ln(`${dec}${shrElementPath} = createInstanceFromFHIR('${shrType}', ${fhirPathString});`);
    }
  }
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
