interface JsonSchema {
  $ref?: string;

  // Schema Metadata
  /* This is important because it tells refs where the root of the document is located*/
  id?: string;
  /* It is recommended that the meta-schema is included in the root of any JSON Schema*/
  $schema?: JsonSchema;
  /* Title of the schema*/
  title?: string;
  /* Schema description*/
  description?: string;
  /* Default json for the object represented by this schema*/
  'default'?: any;

  // Number Validation
  /* The value must be a multiple of the number (e.g. 10 is a multiple of 5)*/
  multipleOf?: number;
  maximum?: number;
  /* If true maximum must be > value, >= otherwise*/
  exclusiveMaximum?: boolean;
  minimum?: number;
  /* If true minimum must be < value, <= otherwise*/
  exclusiveMinimum?: boolean;

  // String Validation
  maxLength?: number;
  minLength?: number;
  /* This is a regex string that the value must conform to*/
  pattern?: string;

  // Array Validation
  additionalItems?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;

  // Object Validation
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  /* Holds simple JSON Schema definitions for  referencing from elsewhere.*/
  definitions?: { [key: string]: JsonSchema };
  /* The keys that can exist on the object with the  json schema that should validate their value*/
  properties?: { [property: string]: JsonSchema };
  /* The key of this object is a regex for which properties the schema applies to*/
  patternProperties?: { [pattern: string]: JsonSchema };
  /* If the key is present as a property then the string of properties must also be present. If the value is a JSON Schema then it must 
   * also be valid for the object if the key is  present.*/
  dependencies?: { [key: string]: JsonSchema | string[] };


  // The basic type of this schema, can be one of * [string, number, object, array, boolean, null] * or an array of the acceptable types*/
  type: JsonSchemaTypes | JsonSchemaTypes[];
  // Enumerates the values that this schema can be  e.g. {"type": "string",   "enum": ["red", "green", "blue"]}
  'enum'?: any[];
  'enumNames'?: any[];
  // Combining Schemas
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  // The entity being validated must not match this schema
  not?: JsonSchema;
  x?: xType
}

interface xType {
  values?: any;
  preset?: string;
  flatten?: boolean | string; // prefix if string
  validators?: any[];
  dataMap?: DataMapType[]; // mapping values from to
  custom?: { [key: string]: CustomizeType };
  keyField?: string,
  fields?: FieldsType;
  params?: {
    autofocus?: boolean;
    placeholder?: string;
    liveValidate?: boolean; // live validation (i.e. _onChange, not onBlur)
  }
  controls?: {
    readonly?: boolean;
    readonlyBind?: boolean;
    disabled?: boolean;
    disabledBind?: boolean; // bind value if not undefined and ignores "disabled" value
    hidden?: boolean;
    hiddenBind?: boolean; // bind value if not undefined and ignores "show" value
    omit?: boolean;
    omitBind?: boolean;
  }
  // arrayOptions?: {[key: string]: string};
}

type JsonSchemaTypes = 'string' | 'number' | 'object' | 'array' | 'boolean' | 'null';

// type PropsMapType = [string, string, MapFunction] | [string, string] | string

interface formObjectsType {
  "presets"?: { [key: string]: { [key: string]: string | CustomizeType } };
  "widgets"?: { [key: string]: any };
  "types"?: string[];
  "presetMap"?: { [key: string]: string[] };
  "methods2chain"?: { [key: string]: any };
  "presetsCombineBefore"?: { [key: string]: any };
  "presetsCombineAfter"?: { [key: string]: any };
  "array"?: {
    empty?: CustomizeType;
    addButton?: CustomizeType;
    item?: CustomizeType;
    itemBody?: CustomizeType;
    itemMenu?: CustomizeType;
  }
}
type PropsMapType = { [key: string]: false | string | [string, MapFunction] }

interface CustomizeType {
  widget?: any,
  propsMap?: PropsMapType;
  [key: string]: any;
}

type FieldsType = Array<string | GroupType>;

interface GroupType extends CustomizeType { fields?: FieldsType, passPFField?: true | string}