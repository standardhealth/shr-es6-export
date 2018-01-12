import ObjectFactory from './ObjectFactory';
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
  // Get the prototype, as we need this to detect if properties exist and are settable
  const proto = Object.getPrototypeOf(inst);
  // Loop through each key in the JSON, attempting to set it as a property on the class
  for (const key of Object.keys(json)) {
    // The key is an FQN (e.g., shr.foo.Bar), but the property is a lowercased version of the element name (e.g., bar)
    const property = lowerCaseFirst(key.match(KEY_RE)[3]);
    // The property descriptor is used to determine if the property exists on the class and is settable
    const pd = Object.getOwnPropertyDescriptor(proto, property);
    let found = false;
    if (pd && pd.set) {
      pd.set.call(inst, createInstance(key, json[key]));
      found = true;
    }
    // If the class is an entry, it will have entryInfo, and if the property is an entry property, we need to set it
    // on the entryInfo Entry instance rather than (or in addition to) directly on this class.  This is because the
    // schema puts all entry fields at the root of the element.
    if (proto.hasOwnProperty('entryInfo') && isEntryProperty(property)) {
      setEntryProperty(inst, property, key, json[key]);
      found = true;
    }
    // If we didn't find a match, spit an error to the console, except for shr.base.EntryType, which is used to
    // indicate the field's type in the JSON, but not necessarily always a settable property in the class.
    if (!found && key !== 'shr.base.EntryType') {
      console.error('No setter for', key);
    }
  }
}

/**
 * Determines if the named property exists and is settable on the Entry class.
 * @param {string} property - the name of the property to check for on Entry
 * @return {boolean} true if the property exists on the Entry class, false otherwise
 * @private
 */
function isEntryProperty(property) {
  const pd = Object.getOwnPropertyDescriptor(Entry.prototype, property);
  return pd && pd.set;
}

/**
 * Sets a property (e.g., shrId) on an instance's entryInfo Entry class.
 * @param {object} inst - an instance of an ES6 class that supports entryInfo
 * @param {string} property - the name of the property to set on the instance's entryInfo
 * @param {string} key - the original key of the property in the JSON
 * @param {object} value - the unprocessed value (from the JSON) to set on the property
 * @private
 */
function setEntryProperty(inst, property, key, value) {
  if (typeof inst.entryInfo === 'undefined') {
    inst.entryInfo = new Entry();
  }
  const pd = Object.getOwnPropertyDescriptor(Entry.prototype, property);
  if (pd && pd.set) {
    pd.set.call(inst.entryInfo, createInstance(key, value));
  }
}

/**
 * Creates an ES6 class instance based on a value extracted from the JSON.
 * @param {*} key - the original key under which the value was stored.  This is used as a backup in case the value
 *   does not declare its type.
 * @param {*} value - the JSON data to create an ES6 class instance for
 * @return {object} an instance of an ES6 class representing the data
 * @private
 */
function createInstance(key, value) {
  if (typeof value === 'object') {
    let type = key;
    if (value['shr.base.EntryType']) {
      type = value['shr.base.EntryType'].Value;
    }
    return ObjectFactory.createInstance(type, value);
  }
  return value;
}

/**
 * Returns the input string with its first letter lowercased
 * @param {string} input - the string to lowercase the first letter for
 * @return {string} a new string representing the input string with a lowercased first letter
 * @private
 */
function lowerCaseFirst(input) {
  if (!input || input.length === 0) {
    return input;
  }
  return input[0].toLowerCase() + input.slice(1);
}

export default {setPropertiesFromJSON};