//type jsJsonSchema = BasicJsonSchema & FFExtensionType;

// interface jsJsonSchema extends FFCompiledExtensionType, BasicJsonSchema {}

interface JsonSchemaGeneric<T> {
  $ref?: string;
  // Schema Metadata
  /* This is important because it tells refs where the root of the document is located*/
  $id?: string;
  /* It is recommended that the meta-schema is included in the root of any JSON Schema*/
  $schema?: T;
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
  additionalItems?: boolean | T;
  items?: T | T[];
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;

  // Object Validation
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  additionalProperties?: boolean | T;
  /* Holds simple JSON Schema definitions for  referencing from elsewhere.*/
  definitions?: { [key: string]: T; }
  /* The keys that can exist on the object with the  json schema that should validate their value*/
  properties?: { [property: string]: T };
  /* The key of this object is a regex for which properties the schema applies to*/
  patternProperties?: { [pattern: string]: T };
  /* If the key is present as a property then the string of properties must also be present. If the value is a JSON Schema then it must
   * also be valid for the object if the key is  present.*/
  dependencies?: { [key: string]: T | string[] };

  // The basic type of this schema, can be one of * [string, number, object, array, boolean, null] * or an array of the acceptable types*/
  type?: JsonSchemaTypes | JsonSchemaTypes[];
  // Enumerates the values that this schema can be  e.g. {"type": "string",   "enum": ["red", "green", "blue"]}
  'enum'?: any[];
  // Combining Schemas
  allOf?: T[];
  anyOf?: T[];
  oneOf?: T[];
  // The entity being validated must not match this schema
  not?: T;
}

type JsonSchemaTypes = 'string' | 'integer' | 'number' | 'object' | 'array' | 'boolean' | 'null';
type JsonAny = anyObject | string | object | undefined | boolean | number | null;


interface jsJsonSchema extends JsonSchemaGeneric<jsJsonSchema>, FFCommonSchemaType {
  _compiled: boolean;
  _elements?: any;
  _schema?: JsonSchema;
  _oneOfIndex?: number;
  _validators?: JsonFunctionGeneric<Function>[]; // sync/async validators
  _stateMaps?: FFDataMapGeneric<Function | Function[]>[]; // mapping values in state
  _oneOfSelector?: number | JsonFunctionGeneric<Function | Function[]> // oneOf selector for field
  _data$?: JsonFunctionGeneric<Function>[];
}

interface JsonSchema extends JsonSchemaGeneric<JsonSchema>, FFCommonSchemaType {
  _validators?: JsonFunctionGeneric<string> | JsonFunctionGeneric<string>[] | { [key: string]: JsonFunctionGeneric<string> }; // sync/async validators
  _stateMaps?: FFDataMapGeneric<string>[] | anyObject; // mapping values in state
  _oneOfSelector?: number | JsonFunctionGeneric<string> // oneOf selector for field
  _data$?: JsonFunctionGeneric<string> | JsonFunctionGeneric<string>[] | { [key: string]: JsonFunctionGeneric<string> };
}

interface FFCommonSchemaType {
  _placeholder?: string;
  _strictLayout?: boolean; // if true then renders only fields that listed in _layout property, otherwise they will be added to the top layer
  _params?: FFParamsType; // editable in state params
  _data?: { [key: string]: any } | { [key: number]: any };
  _presets?: string; // presets for rendering components
  _simple?: boolean; // determine that value managed by component itself (for elements and arrays)
  _custom?: FFCustomizeType; // components customization
  _layout?: FFLayoutGeneric<FFCustomizeType> | Array<string | FFLayoutGeneric<FFCustomizeType>>; // fields order and object/group extenion
  _enumExten?: any; // enum extension value taken from enum, string turn to label
}

type ReplaceType = boolean | { [key: string]: ReplaceType } | { [key: number]: ReplaceType }
type FFDataMapGeneric<FN> = { from?: string, to?: string, $?: FN, args?: JsonAny[] | JsonAny }
type PropsMapGeneric<FN> = { [key: string]: boolean | string | [FN, ...JsonAny[]] | { $?: FN, args?: JsonAny[] | JsonAny, replace?: ReplaceType, update?: 'build' | 'data' | 'every' } }
type NormalizedDataProcessor = { $?: Function, args: any[], replace?: ReplaceType, update: 'build' | 'data' | 'every', noStrictArrayResult?: boolean, dataRequest: boolean, to: { [key: string]: Path } };
type NPM4WidgetsType = { [key: string]: NormalizedDataProcessor[] }
type dataProcessor = { $?: Function, args?: any[], replace?: ReplaceType, update?: 'build' | 'data' | 'every', noStrictArrayResult?: boolean }
type JsonFunctionGeneric<FN> = { $: FN, args?: JsonAny[] | JsonAny } | FN

type FFLayoutGeneric<T> = T & {
  $_fields?: Array<string | FFLayoutGeneric<T>> | anyObject,
}

interface FFCustomizeType {
  _$tag?: string,
  $_maps?: PropsMapGeneric<string>;
  $_ref?: string;
  $_reactRef?: string | boolean;

  [key: string]: JsonAny;
}

interface jsFFCustomizeType {
  _$tag?: Function,
  $_maps?: PropsMapGeneric<Function>;
  $_reactRef?: string | boolean;

  [key: string]: any;
}


type FFParamsType = {
  readonly?: boolean;
  disabled?: boolean;
  viewer?: boolean;
  liveUpdate?: boolean;
  liveValidate?: boolean;
  autofocus?: boolean;
  hidden?: boolean;
  norender?: boolean;
  [key: string]: any;
}
