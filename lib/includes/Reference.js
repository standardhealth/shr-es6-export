/**
 * A reference to another SHR Entry.
 */
export default class Reference {
  constructor(shrId, entryId, entryType) {
    this._shrId = shrId;
    this._entryId = entryId;
    this._entryType = entryType;
  }

  /**
   * Get the SHR ID.
   * @returns {string} The SHR ID
   */
  get shrId() {
    return this._shrId;
  }

  /**
   * Set the SHR ID.
   * @param {string} shrId - The SHR ID
   */
  set shrId(shrId) {
    this._shrId = shrId;
    this._reference = undefined; // unset the cached reference if anything changes
  }

  /**
   * Get the entry ID.
   * @returns {string} The entry ID
   */
  get entryId() {
    return this._entryId;
  }

  /**
   * Set the entry ID.
   * @param {string} entryId - The entry ID
   */
  set entryId(entryId) {
    this._entryId = entryId;
    this._reference = undefined; // unset the cached reference if anything changes
  }

  /**
   * Get the entry type.
   * @returns {string} The entry type
   */
  get entryType() {
    return this._entryType;
  }

  /**
   * Set the entry type.
   * @param {string} entryType - The entry type
   */
  set entryType(entryType) {
    this._entryType = entryType;
    this._reference = undefined; // unset the cached reference if anything changes
  }

  /**
   * Get the object this Reference is pointing to, if present.
   * This reference is not assigned automatically and must be manually set for it to be present,
   * and will automatically be unset if any of the other fields are changed.
   * @returns {object} The SHR object this Reference is pointing to.
   */
  get reference() {
    return this._reference;
  }

  /**
   * Set the object this Reference is pointing to.
   * @param {object} reference - The SHR object this Reference is pointing to.
   */
  set reference(reference) {
    this._reference = reference;
  }

  toJSON() {
    return {
      '_ShrId': this._shrId,
      '_EntryId': this._entryId,
      '_EntryType': this._entryType
    };
  }

  toFHIR() {
    return this._entryId;
  }
}
