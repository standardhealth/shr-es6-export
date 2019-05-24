/**
 * This file contains a mapping of FHIR general purpose types to the fields those types contain,
 * to enable identifying what type an object is based on the fields in it. 
 * Unlike Resources, these general purpose types don't have a "resourceType" field indicating what they are,
 * so converting them to SHR from FHIR using the current fromFHIR approach requires this kind of logic.
 * (For instance, shr.base.Observation maps value[x] to FindingResult. Option 1 is to rework the fromFHIR class signatures to )
 */
export const FHIR_GENERAL_PURPOSE_TYPES = {
  'Attachment': {
    fields: ['contentType', 'language', 'data', 'url', 'size', 'hash', 'title', 'creation']
  },
  'Coding': {
    fields: ['system', 'version', 'code', 'display', 'userSelected']
  },
  'CodeableConcept': {
    fields: ['coding', 'text']
  },
  'Quantity': {
    fields: ['value', 'comparator', 'unit', 'system', 'code']
  },
  'Range': {
    fields: ['low', 'high']
  },
  'Ratio': {
    fields: ['numerator', 'denominator']
  },
  'Period': {
    fields: ['start', 'end']
  },
  'SampledData': {
    fields: ['origin', 'period', 'factor', 'lowerLimit', 'upperLimit', 'dimensions', 'data']
  },
  'Identifier': {
    fields: ['use', 'type', 'system', 'value', 'period', 'assigner']
  },
  'HumanName': {
    fields: ['use', 'text', 'family', 'given', 'prefix', 'suffix', 'period']
  },
  'Address': {
    fields: ['use', 'type', 'text', 'line', 'city', 'district', 'state', 'postalCode', 'country', 'period']
  },
  'ContactPoint': {
    fields: ['system', 'value', 'use', 'rank', 'period']
  },
  'Timing': {
    fields: ['event', 'repeat', 'code']
  },
  'Signature': { // NOTE: the fields here differ a little between DSTU2/STU3/R4, but not enough that I'm concerned about it
    fields: ['type', 'when', 'whoUri', 'whoReference', 'contentType', 'blob', // DSTU2 fields
             'onBehalfOfUri', 'onBehalfOfReference', // STU3 addtitions
             'who', 'onBehalfOf', 'targetFormat', 'sigFormat', 'data'] // R4 additions and replacements
  },
  'Annotation': {
    fields: ['authorReference', 'authorString', 'time', 'text']
  },
  'Money': { // NOTE: R4 only
    fields: ['currency', 'value']
  },

  // references may not be a perfect fit here but this works for identifying Reference objects
  'Reference':  {
    fields: ['reference', 'type', 'identifier', 'display']
  }
};