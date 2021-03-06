/////////////////////////////////////////////
//  Actions function
/////////////////////////////////////////////
import {
  getIn,
  isMergeable,
  memoize,
  merge,
  push2array,
  objKeys,
  isArray,
  isUndefined,
  isString,
  deArray, toArray, isFunction, isObject
} from "react-ts-utils";

import {

  getFromState,
  getSchemaPart,
  oneOfFromState,
  normalizeFn,
  normalizePath,
  normalizeUpdate,
  setIfNotDeeper,
  initState,
  updateState,
  object2PathValues,
  SymData, SymReset, SymClear, SymDataMap, rehydrateState
} from "./stateLib";

import {_CORES, schemaRegister, formReducer, getFRVal} from "./fform";
import {isEqual, isElemRef, objMap, objectDerefer} from "react-ts-utils";

class exoPromise {
  done: boolean = false;
  vals: any[] = [{}, {}];

  constructor() {
    let self = this;
    let promise: any = new Promise((resolve, reject) => {
      self.setFunction(0, resolve);
      self.setFunction(1, reject);
    });
    promise.resolve = self.execFunction.bind(self, 0);
    promise.reject = self.execFunction.bind(self, 1);
    promise.isPending = () => !self.done;
    promise.isResolved = () => self.vals[0]['done']; // return undefined if not done, true if resolved, false if rejected
    promise.isRejected = () => self.vals[1]['done'];
    promise.result = () => self.done && self.vals[self.vals[0]['done'] ? 0 : 1]['rest'];
    return promise;
  }

  setFunction(num: 0 | 1, func: any) {
    let vals = this.vals[num];
    vals['func'] = func;
    if (vals['done']) func(...vals['rest'])
  }

  execFunction(num: 0 | 1, ...rest: any[]) {
    if (!this.done) {
      this.done = true;
      let vals = this.vals[num];
      vals['rest'] = rest;
      vals['done'] = true;
      this.vals[1 - num]['done'] = false;
      if (vals['func']) vals['func'](...rest);
    }
  }
}

/////////////////////////////////////////////
//  FFormCore class
/////////////////////////////////////////////


/** Creates a api that contains data and api for changing it */
class FFormStateManager {
  private _isDispatching: boolean;
  private _currentState: any;
  private _reducer: any;
  private _validator: any;
  private _unsubscribe: any;
  private _listeners: Array<(state: StateType) => void> = [];

  JSONValidator: any;
  UPDATABLE: PROCEDURE_UPDATABLE_Type;
  props: FFormApiProps;
  schema: jsJsonSchema;
  dispatch: any;
  // JSONValidator: (values: any) => any;
  name?: string;

  constructor(props: FFormApiProps) {
    if (_CORES[props.name]) {
      let core = _CORES[props.name];
      if (isEqual(core.props, props))
        return core;
    }

    if (((props.getState ? 1 : 0) + (props.setState ? 1 : 0)) == 1) new Error('Expected both "getState" and "setState" or none but not only one of them.');

    const self = this;
    _CORES[props.name] = self;
    self.props = props;
    self.schema = compileSchema(props.schema, props.elements);
    self.name = props.name || '';
    self.dispatch = props.store ? props.store.dispatch : self._dispatch.bind(self);
    self._reducer = formReducer();
    if (props.JSONValidator) self.JSONValidator = props.JSONValidator(self.schema);
    self._getState = self._getState.bind(self);
    self._setState = self._setState.bind(self);
    if (props.setState && props.store) self._unsubscribe = self.props.store.subscribe(self._handleChange.bind(self));
    self.UPDATABLE = {update: {}, replace: {}, api: self};
  }

  private _dispatch(action: any) {
    const self = this;
    if (typeof action === 'function') return action(self._dispatch.bind(self));
    else self._setState(self._reducer(self._getState() || {}, action));
    return action;
  };

  _setState(state: any) {
    const self = this;
    if (state === self._getState()) return;
    if (self.props.setState) self.props.setState(state);
    else self._currentState = state;
    if (self.props.store) self._setStoreState(state);
    self._listeners.forEach(fn => fn(state));
  }

  _getState() {
    const self = this;
    if (self.props.store) return self._getStoreState();
    else if (self.props.getState) return self.props.getState();
    else return self._currentState;
  }

  private _setStoreState(state: any) {
    return this.props.store.dispatch({type: anSetState, state, api: this});
  }

  private _getStoreState() {
    return this.props.name && this.props.store.getState()[getFRVal()][this.props.name];
  }

  private _handleChange() {
    const self = this;
    let nextState = self._getStoreState();
    let curState = self.props.getState ? self.props.getState() : self._currentState;
    if (nextState !== curState) self._setState(nextState);
  }


  addListener(fn: (state: StateType) => void) {
    const self = this;
    self._listeners.push(fn);
    if (self.props.store && !self._unsubscribe) self._unsubscribe = self.props.store.subscribe(self._handleChange.bind(self));
    return self.delListener.bind(self, fn);
  }

  delListener(fn?: any) {
    const self = this;
    if (isUndefined(fn)) self._listeners = [];
    else {
      let idx = self._listeners.indexOf(fn);
      if (~idx) self._listeners.splice(idx, 1)
    }
    if (!self._listeners.length && self._unsubscribe && !self.props.setState) {
      self._unsubscribe();
      delete self._unsubscribe;
    }
  }
}

/////////////////////////////////////////////
//  API
/////////////////////////////////////////////

class FFormStateAPI extends FFormStateManager {
  private _noExec = 0;
  private _resultPromises: any;
  private _newState: StateType | undefined;
  private _updates: StateApiUpdateType[] = [];
  private _validation: StateType | boolean | null = null;
  private _defferedTimerId: any;
  getState = this._getState;

  //wrapped: any;

  constructor(props: FFormApiProps) {
    super(props);
    const self = this;
    if (props.state) self._setState(props.state);
    else if (!self._getState()) self._setState(initState(self.UPDATABLE));
    const state = self._getState();
    if (!state[SymDataMap])  // no data maps, it means that state from server-side render
      self._setState(rehydrateState(state, self.UPDATABLE));
  }

  wrapper(self: any = {}): any {
    const api = this;
    const wrapApi = (fn: string) => self[fn] || api[fn];
    const wrapPath = (path: null | string | Path = './') => path && normalizePath(path, self.path);
    const wrapOpts = (opts: any = {}, forcePath?: boolean) => {
      const {path, ...rest} = opts;
      if (path === null) rest.path = null;
      else if (!isUndefined(path) || forcePath) rest.path = wrapPath(path || './');
      return self.wrapOpts ? self.wrapOpts(rest) : rest;
      //rest.noValidation = isUndefined(noValidation) ? !self.liveValidate : noValidation;
    };

    const wrapped = {
      validate: (path: boolean | string | Path = './', ...args: any[]) => wrapApi('validate')(typeof path == 'boolean' ? path : wrapPath(path), ...args),
      get: (...path: any[]) => wrapApi('get')(wrapPath(path)),
      // set: (path: string | Path = [], value: any, opts?: any, ...args: any[]) => wrapThis('set')(wrapPath(path), value, wrapOpts(opts)),
      //  setValue: (value: any, opts: any = {}, ...args: any[]) => wrapApi('setValue')(value, wrapOpts(opts)),
      bind: (object: any) => {
        self = object;
        return wrapped
      },
      getValue: (opts: any = {}) => wrapped.get(SymData, opts.initial ? 'initial' : 'current', wrapPath(opts.path)),
      getApi: () => api,
    };
    ['setValue', 'setMessages'].forEach(fn =>
      wrapped[fn] = (value: any, opts: any = {}, ...args: any[]) => wrapApi(fn)(value, wrapOpts(opts), ...args));
    ['noExec', 'setState', 'getActive', 'getDefaultValue']
      .forEach(fn => wrapped[fn] = (...args: any[]) => wrapApi(fn)(...args));
    ['reset', 'clear', 'execute']
      .forEach(fn => wrapped[fn] = (opts: any, ...args: any[]) => wrapApi(fn)(wrapOpts(opts, true), ...args));
    ['showOnly', 'getSchemaPart']
      .forEach(fn => wrapped[fn] = (path: string | Path = [], opts: any = {}, ...args: any[]) => wrapApi(fn)(wrapPath(path), wrapOpts(opts), ...args));
    ['set', 'switch', 'arrayAdd', 'arrayItemOps', 'setHidden']
      .forEach(fn => wrapped[fn] = (path: string | Path = [], value: any, opts: any = {}, ...args: any[]) => wrapApi(fn)(wrapPath(path), value, wrapOpts(opts), ...args));
    return wrapped;
  }

  private _clearActions() {
    const self = this;
    self._newState = undefined;
    self._defferedTimerId = null;
    self._validation = null;
    self._updates = [];
    self._promise(true);
  }

  private _execBatch(updates: StateApiUpdateType[], opts: APIOptsType, promises: any, forceValidation: StateType | boolean | null) {
    const self = this;
    let action = {type: anUpdateState, state: self._newState, updates, api: self, forceValidation, opts, promises};
    self._clearActions();
    //console.log(' _execBatch.forceValidation', JSON.stringify(forceValidation));
    self.dispatch(updateState.bind(action));
    return promises;
  }

  private _setExecution(addUpdates: any, opts: APIOptsType = {}) {
    if (opts.setExecution) return opts.setExecution(addUpdates, opts);
    const self = this;
    if (addUpdates) push2array(self._updates, addUpdates);
    // console.log('---------------- added updates', updates);
    if (opts.force === true && self._noExec > 0) self._noExec--;
    let promises = self._promise();
    if (opts.execute === false || self._noExec) return promises;
    if (self._defferedTimerId) clearTimeout(self._defferedTimerId);
    //console.log(' _setExecution._validation', JSON.stringify(self._validation));
    if (opts.execute === true) self._execBatch(self._updates, opts, promises, self._validation);
    else self._defferedTimerId = setTimeout(self._execBatch.bind(self, self._updates, opts, promises, self._validation), opts.execute || 0);

    return promises;
  }

  private _promise(reset?: true): apiPromises {
    const self = this;
    if (reset) self._resultPromises = null;
    if (!self._resultPromises) {
      self._resultPromises = new exoPromise();
      self._resultPromises.vAsync = new exoPromise();
    }
    return self._resultPromises;
  }

  //getState = () => this._getState();
  //setState = (state: StateType) => this._setState(state);

  noExec = () => {this._noExec++;};

  execute = (opts: APIOptsType = {}) => {
    return this._setExecution(null, merge(opts, {execute: true}));
  };

  setState = (state: StateType, opts: APIOptsType = {}) => {
    const self = this;
    self._updates = []; // reset all previous updates
    self._newState = state;
    return self._setExecution(null, opts);
  };

  getActive = () => this.get(SymData, 'active');

  validate = (path: boolean | string | Path = true, opts: APIOptsType = {}) => {
    const self = this;
    if (typeof path == 'boolean') self._validation = path;
    else normalizeUpdate({path: path, value: true}, self.getState()).forEach(i => self._validation = setIfNotDeeper(self._validation || {}, true, i.path));
    return self._setExecution(null, opts);
  };

  get = (...paths: any): any => getFromState(this.getState(), ...paths);

  set = (path: string | Path | null, value: any, opts: APIOptsType & { replace?: any, setOneOf?: number, macros?: string } = {}) => {
    if (path === null) return this._setExecution([null], opts);
    let {...update} = opts;
    (update as StateApiUpdateType).path = path;
    (update as StateApiUpdateType).value = value;
    return this._setExecution((update as StateApiUpdateType), opts);
  };

  getValue = (opts: { path?: string | Path, initial?: boolean } = {}): any => this.get(SymData, opts.initial ? 'initial' : 'current', opts.path || []);

  setValue = (value: any, opts: APIOptsType & { path?: string | Path, replace?: any, setOneOf?: number, initial?: boolean } = {}) => {
    let {path, initial, replace, ...update} = opts;
    if (path === null) return this._setExecution([null], opts);
    path = normalizePath(path || []).slice();
    if (~path.indexOf(SymData as any)) (update as StateApiUpdateType).path = path;
    else {
      let state = this.getState();
      while (!getIn(state, path) && path.length) {
        let nm = path.pop();
        value = {[nm]: value};
        replace = {[nm]: replace};
      }
      (update as StateApiUpdateType).path = [initial ? '@initial' : '@current'].concat(path);
    }
    (update as StateApiUpdateType).value = value;
    (update as StateApiUpdateType).replace = replace;
    return this._setExecution(update, opts);
  };

  getDefaultValue = () => this.get(SymData, 'default');

  switch = (path: string | Path | null, value: any, opts: APIOptsType & { replace?: any, setOneOf?: number, macros?: string } = {}) =>
    this.set(path, value, {...opts, macros: 'switch'});

  setMessages = (value: anyObject | null, opts: APIOptsType & { priority?: number, group?: number, path?: string | Path, props?: any } = {}) => {
    let {priority = 0, group = 3, path = [], props = undefined, ...rest} = opts;
    const msgPath = '@/messages/' + priority + '/texts/' + group;
    if (value === null) {
      this.switch([path, msgPath], [], rest);
      if (isObject(props)) this.switch([path, '@/messages/' + priority], props, rest);
    } else {
      let r = object2PathValues(value, {arrayAsValue: true});
      r.forEach(p => {
        this.set([path, p, msgPath], p.pop(), {replace: true, ...rest});
        if (isObject(props)) this.set([path, p, '@/messages/' + priority], props, rest);
      })
    }
  };

  reset = (opts: APIOptsType & { path?: string | Path, status?: string, value?: any } = {}) => {
    if (opts.status)
      this.set(normalizePath(opts.path || '/'), isUndefined(opts.value) ? SymReset : opts.value,
        {[SymData]: ['status', opts.status], macros: 'switch'});
    else {
      this.setValue(SymReset, opts);
      this.setMessages(opts);
    }
  };

  clear = (opts: APIOptsType & { path?: string | Path } = {}) => this.setValue(SymClear, opts);

  arrayAdd = (path: string | Path, value: number | any[] = 1, opts: APIOptsType = {}) =>
    this._setExecution({path, value: value, macros: 'array', ...opts}, opts);

  arrayItemOps = (path: string | Path, value: 'up' | 'down' | 'first' | 'last' | 'del' | 'move' | 'shift', opts: APIOptsType & { value?: number } = {}) =>
    this._setExecution({path, op: value, macros: 'arrayItem', ...opts}, opts);

  setHidden = (path: string | Path, value = true, opts: APIOptsType = {}) =>
    this._setExecution([{path: [path, '@', '/params/hidden'], value, ...opts}], opts);

  showOnly = (path: string | Path, opts: APIOptsType = {}) => {
    path = normalizePath(path);
    return this._setExecution([
      {path: [path.slice(0, -1), '/*/@/params/hidden'], value: true, ...opts},
      {path: [path, '@', '/params/hidden'], value: false, ...opts},
    ], opts);
  };

  getSchemaPart = (path: string | Path = []) => {
    path = normalizePath(path);
    return getSchemaPart(this.schema, path, oneOfFromState(this.getState()))
  }

}


/////////////////////////////////////////////
//  Actions names
/////////////////////////////////////////////

const anSetState = 'FFROM_SET_STATE';
const anUpdateState = 'FFROM_UPDATE_STATE';

/////////////////////////////////////////////
//  Reducer
/////////////////////////////////////////////


/////////////////////////////////////////////
//  Schema compile functions
/////////////////////////////////////////////
const compileSchema = (schema: any, elements: any) => isCompiled(schema) ? schema : getCompiledSchema(elements, schema);

const getCompiledSchema = memoize((elements: elementsType, schema: JsonSchema): jsJsonSchema => {
  let $id = schemaRegister(schema);
  let res = schemaCompiler($id, elements, schema);
  res._elements = elements;
  res._schema = schema;
  return res
});

const val2obj = (obj: any) => {
  return isObject(obj) ? obj : toArray(obj);
};


function refHandler(_elements: any, refs: any, opts: any, track: any, parent: any) {
  let prefix = '';
  let {isRef, skipKey} = opts;
  let {refHandler, ...restOpts} = opts;
  return deArray(refs.split('|').map((ref: any, i: any) => {
    ref = ref.trim();
    if (isRef(ref)) prefix = ref.substr(0, ref.lastIndexOf('/') + 1);
    else ref = prefix + ref;

    let result = objectDerefer(_elements, ref, restOpts, track, parent);
    let key = track[track.length - 1];
    if (!skipKey(key, parent) && key !== '$' && (isFunction(result) || isArray(result) && result.every(isFunction)))
      result = {$: result};
    return result;
  }));
}

function objectResolver(_elements: any, obj2resolve: any, track: any = []): any {
  return objectDerefer(_elements, obj2resolve, {refHandler}, track)
  // if (isElemRef(obj2resolve)) return convRef(_elements, obj2resolve, track);
  // if (!isMergeable(obj2resolve)) return obj2resolve;
  // // const _objs = {'^': _elements};
  // const result = objectDerefer(_elements, obj2resolve);
  // const retResult = isArray(result) ? [] : {};
  // objKeys(result).forEach((key) => {
  //   let value = result[key];
  //   if (isElemRef(value)) {
  //     value = convRef(_elements, value, track);
  //     if (key !== '$' && (isFunction(value) || isArray(value) && value.every(isFunction)))
  //       value = {$: value}
  //   }
  //   if (!skipKey(key, result)) retResult[key] = objectResolver(_elements, value, track.concat(key));
  //   else retResult[key] = value;
  // });
  // return retResult
}


function schemaCompiler($id: string, elements: elementsType = {}, schema: JsonSchema | JsonSchema[], track: Path = []): jsJsonSchema {
  if (isCompiled(schema)) return schema;

  const result: any = isArray(schema) ? [] : {_compiled: true};

  let {_validators, _data$, _stateMaps, _oneOfSelector, ...rest} = schema as any;
  const nFnOpts = {noStrictArrayResult: true};

  if (_validators) result._validators = objMap(val2obj(objectResolver(elements, _validators, track)), (f: any) => normalizeFn(f, nFnOpts));
  // if (_data$) result._data$ = objMap(val2obj(objectResolver(elements, _data$, track)), (f: any) => normalizeFn(f));
  if (_stateMaps) result._stateMaps = objectResolver(elements, _stateMaps, track);
  if (_oneOfSelector) result._oneOfSelector = objectResolver(elements, normalizeFn(_oneOfSelector, nFnOpts), track);

  objKeys(rest).forEach(key => {
    if (key.substr(0, 1) == '_')
      return result[key] = key !== '_presets' ? objectResolver(elements, rest[key], track) : rest[key];
    switch (key) {
      case '$ref':
        if (rest[key][0] === '#') result[key] = $id + rest[key];
        else result[key] = rest[key];
        break;
      case 'default':
      case 'enum':
        result[key] = rest[key];
        break;
      case 'definitions':
      case 'properties':
      case 'patternProperties':
      case 'dependencies':
        let res = {};
        let obj = rest[key] || {};
        if (isArray(obj)) res = obj; // "dependencies" may be of string[] type
        else objKeys(obj).forEach((k) => (res[k] = schemaCompiler($id, elements, obj[k] as any, track.concat(key, k))));
        result[key] = res;
        //result[key] = objMap(rest[key], schemaCompiler.bind(null, elements));
        break;
      default:
        if (isMergeable(rest[key])) result[key] = schemaCompiler($id, elements, rest[key], track.concat(key));
        else result[key] = rest[key];
        break;
    }
  });
  return result;
}

function isCompiled(schema: any): schema is jsJsonSchema {
  return getIn(schema, '_compiled');
}

export {anSetState, FFormStateAPI, compileSchema, objectResolver}
