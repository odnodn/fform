import * as React from 'react';
import {render} from 'react-dom';
import {
  FForm,
  FFormCore,
  selectorMap,
  basicObjects,
  getFieldBlocks,
} from './core/core';

import {getValsFromSchema} from './core/api'
import {not, getIn,  memoize, merge, push2array} from './core/commonLib'
import {UpdateItems, getValue, getBindedValue, makePathItem} from './core/stateLib'

import {formValues2JSON, formObj2JSON, isFFieldSchema, isFGroupSchema, isFObjectSchema} from './constructorLib';
// import 'react-select/dist/react-select.css';

import {Creatable} from 'react-select';

const Select = require('react-select').default;
import {isArray, isObject} from "util";




const objKeys = Object.keys;
const SymbolData = Symbol.for('FFormData');
const isUndefined = (value: any) => typeof value === "undefined";

const __EXTERNAL__: any = {};
__EXTERNAL__.schemas = {'test schema': {}, 'test schema 2': {}};
__EXTERNAL__.objects = {'test object': {}, 'test object 2': {}};

function getPresets(values: string[] = [], fieldType: string) {
  // let values = getValue(this.pFForm.api.get(this.path + '/@/values')) || [];
  let result: string[] = [];
  if (!values.length) {
    if (fieldType) result = editFormObjects.presetMap[fieldType] || [];
  } else {
    values.forEach((value: string) => push2array(result, editFormObjects.presetsCombineBefore[value] || []));
    values.forEach((value: string) => push2array(result, editFormObjects.presetsCombineAfter[value] || []));
  }
  return result.map((value: string) => {return {value, label: value}});
}

class SelectPresetsWidget extends React.Component<any, any> {
  render() {
    const props = this.props;
    let {
      useTag: UseTag = Creatable,
      value = [],
      title,
      stateBranch,
      pFField,
      enumOptions,
      refName,
      fieldType,
      ...rest
    }: { [key: string]: any } = props;
    const refObj: any = {};
    let ref;
    if (refName) {
      delete rest[refName];
      ref = rest[refName];
    }
    const commonProps = {name: props.id, label: title || props.id.split('/').slice(-1)[0]};
    let {pFForm} = pFField;
    const options = getPresets(value, fieldType);
    // console.log(value);
    return (<UseTag value={value.map((value: string) => {return {value, label: value}})} options={options} {...rest} {...commonProps}/>);
  }
}


class loadableSelectWidget extends React.Component<any, any> {
  options: any[] = [];

  constructor(props: any, context: any) {
    super(props, context);
    const self = this;
    self._loadOptions = self._loadOptions.bind(self);
    self._onChange = self._onChange.bind(self);
  }

  _loadOptions() {
    const self = this;
    self.options = self.props.loadOption();
    self.forceUpdate();
  }

  _onChange(options: any) {
    const self = this;
    if (self.props.replaceOnChange) self.props.replaceOnChange(options);
    else {
      const pFField = self.props.pFField;
      const {pFForm, path} = this.props.pFField;
      pFForm.api.set(path + '/@/values/current', Array.isArray(options) ? options.map((item: any) => item.value) : options && options.value, {execute: 1})
    }
    // self.options = [];
    self.forceUpdate();
  }

  render() {
    const self = this;
    const props = this.props;
    const {pFField, loadOption, onChange, ...rest} = props;
    return (<div className='fform-body-block'>
      <Select {...rest} options={self.options} onChange={self._onChange} onOpen={self._loadOptions}/>
    </div>)
  }
}


class moveToSelectWidget extends React.Component<any, any> {
  options: any[] = [];

  constructor(props: any, context: any) {
    super(props, context);
    const self = this;
    self._loadOptions = self._loadOptions.bind(self);
    self._onChange = self._onChange.bind(self);
  }

  _loadOptions() {
    const self = this;
    const parent = getTopParent(self.props.pFField.pFForm.parent);
    const fields = parent.pFForm.api.getValues().current.object.fields;
    self.options = [];
    for (let i = 0; i < fields.length; i++) {
      let field = fields[i];
      if (isFFieldSchema(field)) self.options.push({value: i, label: i + ': ' + (field.name || 'no name') + ' - ' + (field.type || 'no type')})
    }
    self.forceUpdate();
  }

  _onChange(option: any) {
    const self = this;
    const parent = getTopParent(self.props.pFField.pFForm.parent);
    const fieldsApi = parent.pFForm.api;
    const fieldsPath = parent.self.props.path.split('/').slice(0, -1).join('/') + '/' + option.value;
    let obj = fieldsApi.get(fieldsPath + '/@/values/current');
    fieldsApi.arrayItemOps(fieldsPath, 'del', {execute: 1});
    self.props.pFField.pFForm.api.arrayOps('#/object/fields', 'add', {execute: 1, values: [obj]});
    self.options = [];
    self.forceUpdate();
  }

  render() {
    const self = this;
    const props = this.props;
    const {pFField, ...rest} = props;
    return (<div className='fform-body-block'>
      <Select {...rest} value='' options={self.options} onChange={self._onChange} onOpen={self._loadOptions} closeOnSelect={true} clearable={false}/>
    </div>)
  }
}


let editFormObjects = basicObjects.extend({
  methods2chain: {loadOptions: true},
  presets: {
    '*': {
      GroupBlocks: {className: 'fform-layout-block layout-elem'},
      Array: {addButton: {className: 'array-add-button white-button'}, empty: {className: 'array-empty'}},
      ArrayItem: {
        buttons: ['up', 'down', 'del'],
        up: () => <span>&uarr;</span>,
        down: () => <span>&darr;</span>,
        del: () => <span>×</span>,
        itemMain: {className: 'property-array-item-menu array-item'},
        itemMenu: {className: 'array-item-menu'},
        itemBody: {className: 'array-item-body'},
        buttonProps: {
          className: 'white-button',
          titles: {'del': 'delete'},
          onClick: function (key: string) {
            this.pFForm.api.arrayItemOps(this.field.props.path, key, {execute: true})
          }
        }
      }
    },
    'object': {GroupBlocks: {className: 'fform-layout-block layout-object'}},
    'array': {GroupBlocks: {className: 'fform-layout-block layout-array'}},
    'inlineTitle': {Title: {className: 'fform-inline-title-block'}},
    'boolean': {GroupBlocks: {className: 'fform-inline-title-block fform-layout-block layout-elem'}},
    'tristate': {GroupBlocks: {className: 'fform-inline-title-block fform-layout-block layout-elem'}},
    'preset-select': {
      GroupBlocks: {className: 'fform-layout-block layout-elem preset-select'},
      Main: {
        widget: SelectPresetsWidget,
        multi: true,
        onChange: function (values: any) {
          let vals = values.map((item: any) => item.value);
          this.pFForm.api.set(this.field.props.path + '/@/values/current', vals, {execute: 1});
        },
        propsMap: {
          fieldType: 'fieldType'
        }
      }
    }
  }
});


function getAllBlocks(objects: any) {
  let blocks = {};
  objKeys(objects.presets).forEach(key => blocks = merge(blocks, objects.presets[key].blocks));
  return objKeys(blocks);
}


const moveToSelectObject = {
  widget: moveToSelectWidget,
  passPFField: 'pFField',
  placeholder: 'Select field to move here...',
  className: 'preset-select',
};


const arrayAddButtonObject = {
  widget: (props: any) => {
    const {text: Text = 'add', ...rest}: { [key: string]: any } = props;
    return <button {...rest}>{typeof Text == 'function' ? <Text/> : Text}</button>
  },
  type: 'button',
  propsMap: {disabled: 'addDisabled'},
  className: "white-button array-add-button",
};

const expandButtonObject = {
  widget: (props: any) => {
    const {expanded, ...rest} = props;
    return <button {...rest}>{props.expanded ? <span>&minus;</span> : '+'} </button>
  },
  onClick: function (key: string) {
    let path = this.field.props.path + '/@/expanded';
    this.pFForm.api.set(path, !this.pFForm.api.get(path), {execute: true})
  },
  propsMap: {expanded: 'expanded', disabled: 'expandedDisabled'},
  type: 'button',
  className: "white-button collapse-props-button",
};

const addButtonsObject = {
  widget: (props: any) => {
    const {text, onClick, buttonProps, fieldType, addOnlyFields, ...rest} = props;
    if (addOnlyFields) return (<span {...rest}><button onClick={onClick(getValsFromSchema(JSONSchema))} {...buttonProps}>+field</button></span>);
    if (fieldType == 'object' || fieldType == 'array') return (
      <span {...rest}>
        <button onClick={onClick(getValsFromSchema(JSONSchema))} {...buttonProps}>+field</button>
        <button onClick={onClick(getValsFromSchema(groupSchema))} {...buttonProps}>+group</button>
        <button onClick={onClick(getValsFromSchema(objectSchema))} {...buttonProps}>+object</button>
      </span>);
    return false;
  },
  onClick: function (obj: string) {
    const path = this.field.props.path + '/object/fields';
    const api = this.pFForm.api;
    const opts = {num: 1, values: [obj], execute: true};  // , obj, obj, obj, obj, obj, obj, obj, obj, obj, obj
    return function () {
      api.arrayOps(path, 'add', opts)
    }
  },
  className: 'property-array-item-menu',
  buttonProps: {
    type: 'button',
    className: "white-button collapse-props-button",
  },
  propsMap: {fieldType: 'fieldType'},
};

function getTopParent(parent: any) {
  while (parent) {
    if (isFFieldSchema(parent.pFForm.api.getValues().current)) break;
    parent = parent.pFForm.parent
  }
  return parent
}


const topMoveButtonObject = {
  widget: (props: any) => {
    const {text, onClick, buttonProps, pFField, ...rest} = props;
    const parent = getIn(pFField.pFForm, 'parent');
    if (parent && parent.pFForm.api.getValues().current.hasOwnProperty('xtend')) return (<span {...rest}><button onClick={onClick(getValsFromSchema(JSONSchema))} {...buttonProps}>↰</button></span>);
    return false;
  },
  onClick: function (obj: string) {
    const groupApi = this.pFForm.parent.pFForm.api;
    const groupField = this.pFForm.parent.self;
    const parent = getTopParent(this.pFForm.parent);
    const fieldsApi = parent.pFForm.api;
    const fieldsPath = parent.self.props.path.split('/').slice(0, -1).join('/');
    //const opts = {num: 1, values: [obj], execute: true};  // , obj, obj, obj, obj, obj, obj, obj, obj, obj, obj
    return function () {
      let obj = groupApi.get(groupField.props.path + '/@/values/current');
      groupApi.arrayItemOps(groupField.props.path, 'del', {execute: 1});
      fieldsApi.arrayOps(fieldsPath, 'add', {execute: 1, values: [obj]});
    }
  },
  passPFField: 'pFField',
  className: 'property-array-item-menu',
  buttonProps: {
    type: 'button',
    className: "white-button collapse-props-button",
  }
};


const itemMenuObject = {
  widget: editFormObjects.widgets['ItemMenu'],
  buttons: ['up', 'down', 'del'],
  buttonProps: {
    onClick: function (key: string) {this.pFForm.api.arrayItemOps(this.field.props.path, key, {execute: true})},
    className: 'white-button',
    titles: {'del': 'delete'}
  },
  propsMap: {itemData: 'arrayItem'},
  passPFField: 'pFField',
  className: 'property-array-item-menu',
  up: () => <span>&uarr;</span>,
  down: () => <span>&darr;</span>,
  del: () => <span>×</span>
};

//const itemMenuObjectLargeArrows = merge(itemMenuObject, {up: () => <span>&uArr;</span>, down: () => <span>&dArr;</span>, del: () => <span>&#9587;</span>});
const itemMenuObjectParent = merge(itemMenuObject, {
  buttonProps: {
    onClick: function (key: string) {
      this.pFForm.parent.pFForm.api.arrayItemOps(this.pFForm.parent.path, key, {execute: true})
    }
  }
});

function objectXtend_isObject(values: any) {
  let value = getValue(values);
  return value == 'object'
}

function objectXtend_isExpandable(values: any) {
  let value = getValue(values);
  return value == 'array' || value == 'object'
}

const objectXtendDefinition = {
  objectXtend: {
    type: "object",
    x: {
      fields: [{
        fields: [expandButtonObject,
          'name',
          'type',
          'external',
          'value',
          merge(arrayAddButtonObject, {onClick: function () {this.pFForm.api.arrayOps(this.field.props.path + '/valueArray', 'add', {execute: true}) }}),
          itemMenuObject],
        style: {flexFlow: 'row'}
      }
      ],
      dataMap: [['./@/expanded', './valueArray/@/controls/hidden', not]],
      expanded: false,
    },
    properties: {
      name: {
        type: "string",
        x: {
          params: {placeholder: 'Enter name...'},
          // controls: {hiddenBind: false, omitBind: false},
          custom: {
            blocks: {Array: false}, //false
          }
        }
      },
      type: {
        // title: 'type',
        type: "string",
        'default': 'string',
        x: {
          preset: 'select',
          // controls: {hiddenBind: false, omitBind: false},
          dataMap: [
            ['./@/values', '../@/expanded', objectXtend_isExpandable],
            ['./@/values', '../valueArray/@/controls/hidden', (values: any) => !objectXtend_isExpandable(values)],
            ['./@/values', '../value/@/controls/readonly', objectXtend_isExpandable],
            ['./@/values', '../@/expandedDisabled', (values: any) => !objectXtend_isExpandable(values)],
            ['./@/values', '../@/addDisabled', (values: any) => !objectXtend_isExpandable(values)],
            ['./@/values', '../external/@/controls/hidden', (values: any) => !objectXtend_isObject(values)],
            ['./@/values', '../value/@/controls/hidden', (values: any) => objectXtend_isObject(values)],
          ],
        },
        'enum': ['string', 'unescaped', 'array', 'object']
      },
      value: {
        type: "string",
        x: {
          params: {placeholder: 'Enter value...'},
          // controls: {hiddenBind: false, omitBind: false},
          custom: {GroupBlocks: {style: {flex: '10 1'}}}
        }
      },
      external: {
        type: "array",
        x: {
          params: {placeholder: 'Select external objects...'},
          preset: '*',
          custom: {
            Main: {
              widget: loadableSelectWidget,
              passPFField: 'pFField',
              closeOnSelect: true,
              clearable: true,
              multi: true,
              className: 'preset-select',
              propsMap: {value: 'values/current'},
              // onChange: function (values: any) {
              //   let vals = values.map((item: any) => item.value);
              //   this.pFForm.api.set(this.field.props.path + '/@/values/current', vals, {execute: 1});
              // },
              loadOption: function () {return __EXTERNAL__ && __EXTERNAL__.objects ? objKeys(__EXTERNAL__.objects).map(item => {return {value: item, label: item}}) : []}
            },
            GroupBlocks: {style: {flex: '10 1'}}
          },
        }
      },
      valueArray: {
        type: 'array',
        x: {
          custom: {
            blocks: {Array: false},
            GroupBlocks: {className: 'object-xtend-array'}
          }
        },
        items: {
          x: {custom: {blocks: {ArrayItem: false}}},
          $ref: '#/definitions/objectXtend'
        }
      }
    }
  },
};

const objectXtendSchema = {
  definitions: objectXtendDefinition,

  $ref: '#/definitions/objectXtend',
  x: {custom: {Main: {className: 'object-xtend'}}},
  type: 'object',
  properties: {
    name: {x: {controls: {hiddenBind: true}}},
    value: {x: {controls: {hiddenBind: true}}},
    type: {'default': 'object', x: {controls: {hiddenBind: true}}},
  }

};


const JSONBlockEditorSelect = {
  type: "object",
  title: '',
  properties: {
    blocks: {
      type: 'string',
      'enum': getAllBlocks(editFormObjects),
      x: {
        preset: 'radio:buttons:inlineItems',
        custom: {GroupBlocks: {style: {flex: '0 0 auto'}}}
      }
    },
  }
};

declare type objectXtendType = { type: string, valueArray: objectXtendType[], value: any, name?: string }

class ObjectEditor extends React.Component<any, any> {
  objectXtendCore: any;
  formValue: any;
  emptyObject = {type: 'undefined', valueArray: [], value: '', name: ''};

  constructor(props: any, context: any) {
    super(props, context);
    const self = this;
    self.objectXtendCore = new FFormCore({schema: objectXtendSchema, name: props.id + ' => objectXtend'});
    self._onChange = self._onChange.bind(self);

  }

  _onChange(obj: any) {
    const self = this;
    self.props.onChange(obj);
  }

  render() {
    const props = this.props;
    let {
      _objects,
      title,
      stateBranch,
      values,
      pFField,
      enumOptions,
      refName,
      onChange,
      onBlur,
      onFocus,
      ...rest
    }: { [key: string]: any } = props;
    const self = this;
    return <FForm className="object-xtend" widget="div" core={self.objectXtendCore} objects={_objects} values={values} onChange={self._onChange} {...rest}/>;
  }
}


function FFormWidget(props: any) {
  let {
    _objects,
    title,
    stateBranch,
    pFField,
    enumOptions,
    refName,
    onBlur,
    onFocus,
    ...rest
  }: { [key: string]: any } = props;
  return <FForm widget="div" objects={_objects} {...rest}/>;
}


function value2formArray(value: any) {
  function getType(val: any) {
    if (isArray(val)) return 'array';
    if (isObject(val)) return 'object';
    if (typeof val === 'string') return 'string';
    return 'unescaped'
  }

  function recurse(value: any): objectXtendType {
    const type = getType(value);
    let valueArray: any[] = [];
    if (type == 'array' || type == 'object') {

      valueArray = objKeys(value).map(key => {
        const result = recurse(value[key]);
        if (type == 'object') result.name = key;
        return result
      });
      value = JSON.stringify(value);
    }
    return {type, valueArray, value}
  }

  return recurse(value)
}

function formArray2value(obj: objectXtendType): any {
  function recurse(obj: objectXtendType): any {
    if (obj.type == 'string') return obj.value || '';
    if (obj.type == 'unescaped') {
      let res;
      try {
        res = eval(obj.value);
      } catch (e) {
        res = obj.value || '';
      }
      return res;
    }
    if (obj.type == 'array') return obj.valueArray && obj.valueArray.map(item => recurse(item)) || [];
    if (obj.type == 'object') {
      const res = {};
      obj.valueArray && obj.valueArray.forEach(item => item.name && (res[item.name] = recurse(item)));
      return res;
    }
  }

  return recurse(obj)
}

class PresetBlockEditor extends React.Component<any, any> {
  switcherCore: any;
  objectXtendCore: any;
  presetValues: string[];
  fieldBlocks: any;
  rawValues: any = {};
  sameObject: any = {}; //any = {type: 'undefined', valueArray: [], value: '', name: ''};
  _values: any;

  constructor(props: any, context: any) {
    super(props, context);
    const self = this;
    self.switcherCore = new FFormCore({schema: JSONBlockEditorSelect, name: props.id + ' => propSelect'});
    // self.objectXtendCore = new FFormCore({schema: objectXtend, name: 'objectXtend/' + props.id});
    self._onEditorChange = self._onEditorChange.bind(self);
    self._onSwitchChange = self._onSwitchChange.bind(self);
  }

  _onSwitchChange(value: any) {
    const {pFForm, path} = this.props.pFField;
    pFForm.api.set(path + '/@/propSelected', value, {execute: true})
  }

  _onEditorChange(value: any) {
    const {pFForm, path} = this.props.pFField;
    const propSelected = this.props.propSelected;
    if (propSelected && propSelected.blocks) pFForm.api.set(path + '/@/values/current/' + propSelected.blocks, value, {execute: 1});

  }

  render() {
    const self = this;
    const props = self.props;
    let {
      _objects,
      values,
      propSelected,
      switcherProps,
      objectEditorProps,
      pFField
    }: { [key: string]: any } = props;

    // self._values = merge(self._values, {base: values['base'][propSelected.blocks], ...getIn(values, 'addon', propSelected.blocks)});
    return (<div>
      <FForm widget="div" core={self.switcherCore} objects={_objects} values={propSelected} onChange={self._onSwitchChange} {...switcherProps}/>
      {propSelected && propSelected.blocks &&
      <ObjectEditor id={props.id} _objects={_objects} values={values[propSelected.blocks]}
                    {...objectEditorProps} onChange={self._onEditorChange}/>}
    </div>)
  }
}

class fieldPropsWidget extends React.Component<any, any> {
  fieldPropsCore: any;

  constructor(props: any, context: any) {
    super(props, context);
    const self = this;
    //self._onChange = self._onChange.bind(self);
  }

  // _onChange(values: any) {
  //   const {pFForm, path} = this.props.pFField;
  //   pFForm.api.set(path + '/@/values', values, {execute: 1, replace: true});
  // }

  _makeCore() {
    const self = this;
    if (self.fieldPropsCore) return;
    // console.log('making core ', self.props.id);
    const props = self.props;
    if (props.hidden === false || props.makeCore)
      self.fieldPropsCore = new FFormCore({schema: fieldPropsSchema, name: props.id + ' => fieldProps'});
  }

  render() {
    const self = this;
    const props = self.props;
    let {
      values,
      _objects,
      hidden,
    }: { [key: string]: any } = props;
    // console.log('values', values);
    self._makeCore();
    if (!self.fieldPropsCore) return null;
    // console.log('get values', values);
    return <FForm widget="div" objects={_objects} core={self.fieldPropsCore} rawValues={values} onChange={rawValuesOnChange(self.props.pFField)}/>
  }
}

const basicMainFunc = () => {};
const coreFuncs = {'Main': {onChange: basicMainFunc, onFocus: basicMainFunc, onBlur: basicMainFunc}};

function presetValuesHandler(presetsValue: string[] = []) {
  const {state, from, to, utils}: { state: StateType, from: PathItem, to: UpdateItem, utils: any } = this;
  let curValue = utils.get(state, to.fullPath);
  // let curValue = utils.get(state, to.toString() + '/current');
  let result: UpdateItem[] = [];
  let presets = presetsValue.join(',');
  // console.log('curValue', curValue);
  if (!curValue || presets != curValue['presets']) {
    let fieldBlocks = presets == '' ? {} : getFieldBlocks(presets, editFormObjects, {}, coreFuncs, {}).result;
    let res = {};
    objKeys(fieldBlocks).forEach(key => res[key] = {base: fieldBlocks[key]});
    // res['base'] = fieldBlocks;
    res['presets'] = presets;
    let minLength = (to.keyPath || []).length + to.path.length;
    result.push({path: to.path, keyPath: to.keyPath, value: res, opts: {replace: (path: Path) => {return path.length > minLength && path[path.length - 1] === 'base'}}});
  }
  return new UpdateItems(result);
}

function setVisiblePropsHandler(value: string) {
  const {state, from, to, utils, api}: { state: StateType, from: PathItem, to: UpdateItem, utils: any, api: any } = this;
  let show: any = ['commonProps'];
  if (value === 'string') show.push('stringProps');
  if (value === 'number' || value === 'integer') show.push('numberProps');
  if (value === 'array') show.push('arrayProps');
  if (value === 'object') show.push('objectProps');
  show = from.path.slice(0, -1).join('/') + '/jsonProps/' + show.join(',');
  const getState = () => state;
  let result = api.showOnly(show, {getState, returnItems: true, execute: true});
  return new UpdateItems(result);
}


const fieldPropsSchema = {
  type: "object",
  x: {
    custom: {GroupBlocks: {className: 'field-properties'}},
    controls: {
      hiddenBind: false,
      omitBind: false,
    }
  },
  properties: {
    hidden: {
      type: "object",
      x: {
        preset: 'hidden',
        values: {},
        dataMap: [
          ['./@/values/current/fieldType', '../xProps/preset/@/fieldType'],
          ['./@/values/current/fieldType', '../jsonProps/', setVisiblePropsHandler]
        ]
      }
    },
    jsonProps: {
      title: 'JSON Schema props:',
      type: "object",
      properties: {
        commonProps: {
          type: "object",
          x: {
            preset: 'object:flexRow',
            fields: ['title', 'description', 'default', 'ref',],
          },
          properties: {
            ref: {
              type: 'string',
              title: '$ref',
              x: {params: {placeholder: ''}, preset: 'string:inlineTitle'}
            },
            title: {
              type: "string",
              // title: 'Title',
              x: {params: {placeholder: 'Title'}, preset: 'string'}
            },
            description: {
              type: "string",
              // title: 'Description',
              x: {params: {placeholder: 'Description'}, preset: 'string:inlineTitle'}
            },
            'default': {
              type: "string",
              title: 'Default',
              x: {params: {placeholder: 'Default'}, preset: 'string:inlineTitle'}
            },
          }
        },
        stringProps: {
          type: "object",
          x: {
            preset: 'object:flexRow',
            fields: ['minLength', 'maxLength', 'format', 'pattern'],
            controls: {hidden: true}
          },
          properties: {
            minLength: {
              title: 'Length: min',
              type: "integer",
              minimum: 0,
              'default': 0,
              x: {preset: 'integer:autosize:inlineTitle'}
            },
            maxLength: {
              title: 'max',
              type: "integer",
              minimum: 0,
              x: {preset: 'integer:autosize:inlineTitle'}
            },
            pattern: {title: 'Pattern', type: "string", x: {preset: 'string:inlineTitle', custom: {GroupBlocks: {style: {flexGrow: 10}}}}},
            format: {
              title: 'Format',
              type: "string",
              'enum': ['date-time', 'date', 'time', 'email', 'ipv4', 'ipv6', 'uri', 'color', 'hostname', 'phone', 'utc-millisec', 'alpha', 'alphanumeric'],
              x: {params: {placeholder: 'Select format...'}, preset: 'select:inlineTitle'}
            }
          }
        },
        numberProps: {
          type: "object",
          x: {
            preset: 'object:flexRow',
            fields: ['multipleOf', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', {widget: 'DivBlock', style: {flexGrow: 10}}],
            controls: {hidden: true}
          },
          properties: {
            multipleOf: {
              title: 'Multiple of',
              type: "number",
              minimum: 0,
              exclusiveMinimum: true,
              x: {preset: 'number:autosize:inlineTitle'}
            },
            maximum: {
              title: 'max',
              type: "number",
              x: {preset: 'number:autosize:inlineTitle'}
            },
            exclusiveMaximum: {
              title: 'Exclusive max',
              type: "boolean",
              'default': false,
              x: {preset: 'boolean:inlineTitle'}
            },
            minimum: {
              title: 'min',
              type: "number",
              x: {preset: 'number:autosize:inlineTitle'}
            },
            exclusiveMinimum: {
              title: 'Exclusive min',
              "type": "boolean",
              "default": false,
              x: {preset: 'boolean:inlineTitle'}
            },
          }
        },
        arrayProps: {
          type: "object",
          x: {
            preset: 'object:flexRow',
            fields: ['additionalItems', 'minItems', 'maxItems', 'uniqueItems'],
            controls: {hidden: true}
          },
          properties: {
            additionalItems: {
              title: 'Items: additional',
              "type": "number",
              'enum': [0, 1, 2],
              'enumNames': ['false', 'true', 'object'],
              x: {
                preset: 'radio:buttons:inlineItems:inlineTitle',
                custom: {GroupBlocks: {style: {flexGrow: 0}}}
              }
            },
            minItems: {
              title: 'min',
              type: 'integer',
              "default": 0,
              x: {preset: 'integer:autosize:inlineTitle'},

            },
            maxItems: {
              title: 'max',
              type: 'integer',
              x: {preset: 'integer:autosize:inlineTitle'},
            },
            uniqueItems: {
              title: 'Unique items',
              type: "boolean",
              "default": false,
              x: {preset: 'boolean'}
            },
          }
        },
        objectProps: {
          type: "object",
          x: {
            preset: 'object',
            fields: [{fields: ['additionalProperties', 'minProperties', 'maxProperties', 'required'], style: {flexFlow: 'row'}}],
            controls: {hidden: true}
          },
          properties: {
            required: {
              title: 'required',
              type: "string",
              x: {
                preset: 'string:inlineTitle',
                custom: {GroupBlocks: {style: {flexGrow: 10}}}
              },
            },
            minProperties: {
              title: 'min',
              type: 'integer',
              "default": 0,
              x: {preset: 'integer:autosize:inlineTitle'},
            },
            maxProperties: {
              title: 'max',
              type: 'integer',
              x: {preset: 'integer:autosize:inlineTitle'},
            },
            additionalProperties: {
              title: 'Props: additional',
              "type": "number",
              'enum': [0, 1, 2],
              'enumNames': ['false', 'true', 'object'],
              x: {
                preset: 'radio:buttons:inlineItems:inlineTitle',
                custom: {GroupBlocks: {style: {flex: '0 0 auto'}}}
              }
            },
            dependencies: {
              title: 'Dependencies',
              "type": "string",
              x: {
                preset: 'string:inlineTitle',
                custom: {GroupBlocks: {style: {flexGrow: 10}}}
              },
            }
          }
        },
      }
    },
    xProps: {
      title: 'Extended props:',
      type: "object",
      x: {
        preset: 'object',
        fields: [{fields: ['preset', 'flattenBool', 'flatten'], style: {flexFlow: 'row'}}],
      },
      properties: {
        preset: {
          type: 'array',
          title: 'preset',
          x: {
            preset: 'preset-select:inlineTitle',
            values: {},
            dataMap: [
              ['./@/values/current', '../custom/@/values/current', presetValuesHandler]
            ]
          }
        },
        flattenBool: {
          type: 'boolean',
          title: 'flatten',
          x: {preset: 'boolean:inlineTitle', custom: {GroupBlocks: {style: {flexGrow: 0}}}}
        },
        flatten: {
          type: 'string',
          //title: 'flatten',
          x: {preset: 'string:inlineTitle',}
        },
        validators: {
          type: 'array',
          title: 'Validators',
          x: {
            custom: {
              Array: {
                empty: {text: ''},
                addButton: {text: 'Add new validator'}
              }
            }
          },
          items: {
            type: "string",
            x: {custom: {blocks: {ArrayItem: true}}},
          }
        },
        dataMap: {
          type: 'array',
          title: 'Data Maps',
          x: {
            custom: {
              Array: {
                empty: {text: ''},
                addButton: {text: 'Add new data map'}
              }
            }
          },

          items: {
            'default': ['', '', ''],
            type: "array",
            items: [
              {type: 'string', x: {params: {placeholder: 'From path...'}, custom: {blocks: {ArrayItem: false}}}},
              {type: 'string', x: {params: {placeholder: 'Destination path...'}, custom: {blocks: {ArrayItem: false}}}},
              {type: 'string', x: {params: {placeholder: 'Function'}, custom: {blocks: {ArrayItem: false}}}},
            ],
            minItems: 3,
            additionalItems: false,
            x: {custom: {blocks: {ArrayItem: true}, Main: {style: {flexFlow: 'row'}}}},
          }
        },
        custom: {
          type: "object",
          title: 'custom',
          x: {
            custom: {
              Main: {
                widget: PresetBlockEditor,
                _objects: editFormObjects,
                propsMap: {
                  values: 'values/current',
                  propSelected: 'propSelected',
                  presetValues: 'presetValues',
                }
              },
            },
            values: {},
            propSelected: '',
          }
        },
        params: {
          type: "object",
          title: 'params',
          x: {
            preset: 'object:flexRow',
            fields: ['autofocus', 'liveValidate', 'placeholder'],
          },
          properties: {
            autofocus: {
              type: 'boolean',
              title: 'autofocus',
              x: {preset: 'boolean'}
            },
            liveValidate: {
              type: 'boolean',
              title: 'liveValidate',
              x: {preset: 'boolean'}
            },
            placeholder: {
              type: 'string',
              title: 'placeholder',
              x: {
                preset: 'string:inlineTitle',
                custom: {GroupBlocks: {style: {flex: '10 1 auto'}}}
              }
            },
          }
        },
        controls: {
          type: "object",
          title: 'controls',
          x: {
            preset: 'object:flexRow',
            fields: ['readonly', 'readonlyBind', 'disabled', 'disabledBind', 'hidden', 'hiddenBind', 'omit', 'omitBind'],
          },
          properties: {
            readonly: {
              title: 'readonly',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            readonlyBind: {
              title: 'readonlyBind',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            disabled: {
              title: 'disabled',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            disabledBind: {
              title: 'disabledBind',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            hidden: {
              title: 'hidden',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            hiddenBind: {
              title: 'hiddenBind',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            omit: {
              title: 'omit',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
            omitBind: {
              title: 'omitBind',
              type: 'boolean',
              x: {preset: 'tristate'}
            },
          }
        }
      }
    }
  }
};


const rawValuesOnChange: any = memoize(function (pFField: any) {
  const set = pFField.pFForm.api.set;
  const opts = {execute: 1, replace: true};
  return (values: any) => {
    set(pFField.path + '/@/values', values, opts)
  }
});

const getAllPropsFromObject: any = memoize(function (obj: any, type: 'object' | 'function' | string = 'object', prefix: string = '',) {
  let res: string[] = [];
  objKeys(obj).forEach(key => (typeof obj[key] == type) && res.push(prefix + key));
  return res
});


function fieldObjectSelector(props: any) {
  let {_objects, rawValues, id, pFField, arrayItem, refName, ...rest} = props;
  let schema, name = '';
  let ref = rest[refName];
  if (isFGroupSchema(rawValues.current)) {
    schema = groupSchema;
    name = 'FGroup';
  } else if (isFFieldSchema(rawValues.current)) {
    schema = JSONSchema;
    name = 'FField';
  } else {
    schema = objectSchema;
    name = 'FObject';
  }
  return <FForm ref={ref} widget="div" className={name + '-cls'} core={{name: id + ' => ' + name, schema}} extData={{'/@/arrayItem': arrayItem}}
                parent={pFField} objects={_objects} rawValues={rawValues} onChange={rawValuesOnChange(pFField)}/>
}

const fieldsObject = {
  type: "array",
  x: {
    custom: {
      GroupBlocks: {className: 'layout-array-property'},
      Array: {
        empty: {text: 'No properties'},
        addButton: {text: false},
      },
      //blocks: {ArrayItem: false}
    }
  },
  items: {
    type: "object",
    x: {
      custom: {
        Main: {
          widget: fieldObjectSelector,
          _objects: editFormObjects,
          propsMap: {
            rawValues: 'values',
            arrayItem: 'arrayItem',
          }
        }, blocks: {ArrayItem: false}

      },
      values: {}
    },
  },
};


const objectSchema = {
  definitions: objectXtendDefinition,
  $ref: '#/definitions/objectXtend',
  type: "object",
  x: {
    fields: [{
      fields: [expandButtonObject,
        'name',
        'type',
        'external',
        'value',
        merge(arrayAddButtonObject, {onClick: function () {this.pFForm.api.arrayOps(this.field.props.path + '/valueArray', 'add', {execute: true}) }}),
        itemMenuObjectParent],
      style: {flexFlow: 'row'}
    }],
    custom: {Main: {className: 'object-xtend'}, blocks: {ArrayItem: false}}
  },
  properties: {
    name: {x: {controls: {hiddenBind: true}}},
    value: {x: {controls: {hiddenBind: true}}},
    type: {'default': 'object', x: {controls: {hiddenBind: true}}},
  }
};


const groupSchema = {
  definitions: objectXtendDefinition,
  type: "object",
  x: {
    preset: 'object',
    fields: [{
      style: {flexFlow: 'row'},
      fields: [expandButtonObject,
        moveToSelectObject,
        addButtonsObject,
        itemMenuObjectParent]
    },
      'xtend',
      'object'
    ],
    dataMap: [['./@/expanded', './xtend/@/controls/hiddenBind', not]],
    custom: {Main: {className: 'object-xtend'}, blocks: {ArrayItem: false}},
    fieldType: 'object',
  },
  properties: {
    xtend: {
      $ref: '#/definitions/objectXtend',
      // x: {custom: {Main: {className: 'object-xtend'}}},
      type: 'object',
      properties: {
        name: {x: {controls: {hiddenBind: true}}},
        value: {x: {controls: {hiddenBind: true}}},
        // external: {x: {controls: {hiddenBind: true}}},
        type: {'default': 'object', x: {controls: {hiddenBind: true}}},
      }
    },
    object: {
      type: 'object',
      properties: {
        fields: fieldsObject
      }
    }
  }
};

const fieldItemDefinition = {
  type: "object",
  x: {
    preset: 'object',
    fields: [{
      style: {flexFlow: 'row'},
      fields: [merge(expandButtonObject, {
        onMouseEnter: function () {
          this.pFForm.api.set(this.field.props.path + '/fieldProps/@/controls/makeCore', true, {execute: 1})
        }
      }),
        'name',
        addButtonsObject,
        'type',
        'schema',
        topMoveButtonObject,
        itemMenuObjectParent]
    }],
    dataMap: [['./@/expanded', './fieldProps/@/controls/hidden', not]],
    custom: {blocks: {ArrayItem: false}},
    // expanded:true
  },
  properties: {
    name: {
      type: "string",
      x: {
        preset: 'string',
        params: {placeholder: 'Enter field name...'},
        controls: {
          hiddenBind: false,
          omitBind: false,
        },
      }
    },
    type: {
      type: "string",
      'default': 'string',
      x: {
        preset: 'select:selector',
        params: {placeholder: 'Select type...'},
        controls: {
          hiddenBind: false,
          omitBind: false,
        },
        custom: {
          GroupBlocks: {style: {flex: '0 1', marginLeft: '0.5em'}},
        },
        dataMap: [
          ['./@/values/current', '../fieldProps/@/values/current/hidden/fieldType'],
          ['./@/values/current', '../@/fieldType'],
          ['./@/values/current', './', selectorMap({keepHiddenValues: true, skipFields: ['name', 'fieldProps'], replaceFields: {'array': 'object'}})],
          ['./@/values/current', '../fieldProps/@/controls/hiddenBind', (val: any) =>
            val === 'schema' ? true : undefined],
        ]
      },
      'enum': editFormObjects.types.concat('schema')
    },
    fieldProps: {
      type: 'object',
      x: {
        controls: {omitBind: false},
        custom: {
          Main: {
            widget: fieldPropsWidget,
            _objects: editFormObjects,
            propsMap: {
              values: 'values',
              makeCore: 'controls/makeCore',
              hidden: ['controls', (controls: any) => getBindedValue(controls, 'hidden')],
            }
          },
          Builder: {
            hiddenStyle: {visibility: 'hidden', height: 0}
          }
        },
        values: {}
      },
    },
    schema: {
      type: 'string',
      x: {
        params: {placeholder: 'Select schema...'},
        custom: {
          Main: {
            widget: loadableSelectWidget,
            passPFField: 'pFField',
            // placeholder: 'Select schema...',
            closeOnSelect: true,
            clearable: true,
            className: 'preset-select',
            propsMap: {
              value: 'values/current',
            },
            loadOption: function () {
              return __EXTERNAL__ && __EXTERNAL__.schemas ? objKeys(__EXTERNAL__.schemas).map(item => {return {value: item, label: item}}) : []
            }
          },
        },
      },
    },
    object: {
      type: 'object',
      properties: {
        fields: fieldsObject
      }
    }
  }
};

const JSONSchema = {
  definitions: {fieldItem: fieldItemDefinition},
  $ref: '#/definitions/fieldItem'
};

const JSONSchemaForm = {
  definitions: {fieldItem: fieldItemDefinition},
  $ref: '#/definitions/fieldItem',
  properties: {
    name: {x: {params: {placeholder: 'Enter form name...'}}},
    type: {'enum': editFormObjects.types}
  }
};

const JSONDefinitionsSchema = {
  definitions: {fieldItem: fieldItemDefinition},
  $ref: '#/definitions/fieldItem',
  x: {
    preset: 'object',
    fields: [{
      style: {flexFlow: 'row'},
      fields: [{widget: () => <legend style={{paddingTop: '0.2em'}}>Definitions:</legend>}, merge(addButtonsObject, {addOnlyFields: true}), 'type']
    }]
  },
  properties: {
    name: {x: {controls: {hiddenBind: true}}},
    schema: {x: {controls: {hiddenBind: true}}},
    type: {
      'default': 'object',
      x: {
        controls: {
          hiddenBind: true,
          omitBind: false,
        },
      }
    },
    object: {
      properties: {
        fields: {
          x: {
            custom: {
              Array: {
                empty: {text: false},
                addButton: {text: false},
              },
            }
          }
        }
      }
    }
  }
};

const FFormSchema = {
  type: 'object',
  properties: {
    definitions: {
      type: 'object',
      x: {
        custom: {
          Main: {
            widget: FFormWidget,
            _objects: editFormObjects,
            core: new FFormCore({schema: JSONDefinitionsSchema, name: 'FFormSchema/definitions'})
          }
        }
      },
    },
    form: {
      title: 'Form:',
      type: 'object',
      x: {
        custom: {
          Main: {
            widget: FFormWidget,
            _objects: editFormObjects,
            core: new FFormCore({schema: JSONSchemaForm, name: 'FFormSchema/form'})
          }
        }
      },
      //$ref: '#/definitions/fieldItem'
    }
  }
};



export {fieldPropsSchema, JSONSchema, FFormSchema, editFormObjects};