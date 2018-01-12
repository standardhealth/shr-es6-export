import ObjectFactory from './ObjectFactory';
import Reference from './Reference';
import Entry from './shr/base/Entry';

// A simple regular expression to separate the parts of a FQN (e.g., shr.foo.Bar)
const KEY_RE = /^(([^\.]+\.)*)([^\.]+)$/;

/**
 * Given a (presumably) blank instance of an ES6 class representing an element, and JSON that adheres to the
 * corresponding JSON schema for that element, this function will loop through the JSON and set the applicable
 * properties on the class instance.  If the JSON contains any properties that can't be found or set in the class,
 * an error will be sent to the console.
 * @param {object} inst - an instance of an ES6 class for a specific element
 * @param {object} json - a JSON object containing the date to set in the class
 */
function setPropertiesFromJSON(inst, json) {
  // Loop through each key in the JSON, attempting to set it as a property on the class
  for (const key of Object.keys(json)) {
    // The key is an FQN (e.g., shr.foo.Bar), but the property is a lowercased version of the element name (e.g., bar)
    const property = lowerCaseFirst(key.match(KEY_RE)[3]);
    // First try to find and set it directly on the instance
    const setter = findSetterForProperty(inst, property);
    if (setter) {
      setter.call(inst, createInstance(key, json[key]));
    }
    // Then, if it's an instance property, set it on the embedded entryInfo.
    const setterOnEntry = findSetterForEntryProperty(inst, property);
    if (setterOnEntry) {
      setterOnEntry.call(inst.entryInfo, createInstance(key, json[key]));
    }
    // If we didn't find a match directly or on entryInfo, spit an error to the console.  The exception is for
    // shr.base.EntryType, which is used to indicate the field's type in the JSON, but not necessarily always a
    // settable property in the class.
    if (!setter && !setterOnEntry && key !== 'shr.base.EntryType') {
      console.error(`${inst.constructor.name}: No setter for '${property}' property`);
    }
  }
}

function findSetterForProperty(inst, property) {
  // Get the prototype, as we need this to detect if properties exist and are settable
  const proto = Object.getPrototypeOf(inst);
  if (!proto || proto.constructor.name === 'Object') {
    return undefined;
  }
  // The property descriptor provides information about the property on the class (if it exists)
  const pd = Object.getOwnPropertyDescriptor(proto, property);
  // If the property exists, return its setter (which will be undefined if it's not settable)
  if (pd) {
    return pd.set;
  }
  // It didn't exist on this prototype, but may be from a superclass
  return findSetterForProperty(proto, property);
}

function findSetterForEntryProperty(inst, property) {
  // First see if there is a settable entryInfo on the class.  If not, return undefined.
  const entryInfoSetter = findSetterForProperty(inst, 'entryInfo');
  if (entryInfoSetter) {
    // Now see if there is an existing entryInfo, and if not, set it to a new instance
    if (typeof inst.entryInfo === 'undefined') {
      entryInfoSetter.call(inst, new Entry());
    }
    // Now find the setter for the property on the entry
    return findSetterForProperty(inst.entryInfo, property);
  }
  // If we got here, it wasn't found, so we're returning undefined
}

/**
 * Creates an ES6 class instance based on a value extracted from the JSON.
 * @param {*} key - the original key under which the value was stored.  This is used as a backup in case the value
 *   does not declare its type.
 * @param {*} value - the JSON data to create an ES6 class instance for
 * @returns {object} an instance of an ES6 class representing the data
 * @private
 */
function createInstance(key, value) {
  if (Array.isArray(value)) {
    return value.map(v => createInstance(key, v));
  }
  if (typeof value === 'object') {
    let type = key;
    if (value['shr.base.EntryType']) {
      type = value['shr.base.EntryType'].Value;
    } else if (value.ShrId && value.EntryId && value.EntryType) {
      // It's a reference, so just return the reference
      return new Reference(value.ShrId, value.EntryId, value.EntryType);
    } else if (value.code && value.codeSystem) {
      // It's really the one-off representation of code.  Return just the code.  We toss codeSystem and display
      // because in SHR, a 'code' really is *just* a string.  The JSON schema probably needs to be adjusted.
      return value.code;
    }
    return ObjectFactory.createInstance(type, value);
  }
  return value;
}

/**
 * Returns the input string with its first letter lowercased
 * @param {string} input - the string to lowercase the first letter for
 * @returns {string} a new string representing the input string with a lowercased first letter
 * @private
 */
function lowerCaseFirst(input) {
  if (!input || input.length === 0) {
    return input;
  }
  return input[0].toLowerCase() + input.slice(1);
}

export default {setPropertiesFromJSON};