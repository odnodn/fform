// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')

process.env.TS_NODE_PROJECT = './tsconfig.json';

// Optional: set env variable to enable `tsconfig-paths` integration
// process.env.TS_CONFIG_PATHS = true;

// register mocha wrapper
require('ts-mocha');

// const expect = require('expect');

const {expect} = require('chai');
const commonLib = require('../src/commonLib.tsx');
const stateLib = require('../src/stateLib.tsx');
const apiLib = require('../src/api.tsx');
const {createStore, combineReducers, applyMiddleware} = require('redux');
const thunk = require('redux-thunk').default;
//const JSONValidator = require('../addons/is-my-json-valid-lite');

const imjvWrapper = require('../addons/wrappers/imjv').default;
const imjvValidator = require('../addons/is-my-json-valid-lite');
const imjvJSONValidator = imjvWrapper(imjvValidator);

const jsonschemaWrapper = require('../addons/wrappers/jsonschema').default;
const JSValidator = require('jsonschema').Validator;
const JSJSONValidator = jsonschemaWrapper(new JSValidator());

const JSONValidator = JSJSONValidator;

const dehydrate = require('../addons/dehydrator').default;

const components = require('../src/fform.tsx');

// const mock = require('mock-require');
// mock('react', 'preact');
// mock("react-dom/server", "preact-render-to-string");
// mock("react-dom/test-utils", "preact-test-utils");
// mock("react-dom", "preact-compat-enzyme");
// mock("react-test-renderer", "preact-test-utils");
// mock("react-test-renderer/shallow", "preact-test-utils");
// mock("react-addons-test-utils", "preact-test-utils");
// mock("react-addons-transition-group", "preact-transition-group",);

/*
const jsdom = require('jsdom');
const {window} = new jsdom.JSDOM('<!doctype html><html><body></body></html>')

function copyProps(src, target) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target),
  });
}

global.window = window;
global.document = window.document;
global.navigator = {userAgent: 'node.js'};
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};
copyProps(window, global);
*/


const SymData = Symbol.for('FFormData');
const SymReset = Symbol.for('FFormReset'); // TODO: Reset tests
const SymDataMapTree = Symbol.for('FFormDataMapTree');
const SymDataMap = Symbol.for('FFormDataMap');

function sleep(time) {return new Promise((resolve) => setTimeout(() => resolve(), time))}


/*describe('components tests', function () {
  let usePreact = 1;
  let React = usePreact ? require('preact') : require('react');
  Enzyme.configure({adapter: usePreact ? new AdapterPreact() : new AdapterReact16()});

  let components = require('../src/components.tsx');

  //let Generic = components.elements.widgets.Generic;
  let Generic = components.Test;
  const wrapper = Enzyme.mount(React.createElement(Generic, null, null));

  usePreact = 0;
  React = usePreact ? require('preact') : require('react');
  Enzyme.configure({adapter: new AdapterPreact()});

  //components = mock.reRequire('../src/components.tsx');

});*/

describe('FForm comommon functions tests', function () {

  it('test delIn', function () {
    let state = {vr: {t1: 1, t2: 2, t3: {r1: 5, r2: undefined}}, vr_1: 1};
    let result = commonLib.delIn(state, ['vr', 't3', 'r4']);
    expect(result).to.be.equal(state);
    result = commonLib.delIn(state, ['vr', 't3', 'r2']);
    expect(result !== state).to.be.equal(true);
    expect(commonLib.isEqual(result, {"vr": {"t1": 1, "t2": 2, "t3": {"r1": 5}}, "vr_1": 1}, {deep: true})).to.be.equal(true);
    result = commonLib.delIn(state, ['vr', 't3', 'r1,r2,r6']);
    expect(result !== state).to.be.equal(true);
    expect(commonLib.isEqual(result, {"vr": {"t1": 1, "t2": 2, "t3": {}}, "vr_1": 1}, {deep: true})).to.be.equal(true);
    result = commonLib.delIn(state, ['vr', 't2,t3']);
    expect(result !== state).to.be.equal(true);
    expect(commonLib.isEqual(result, {"vr": {"t1": 1}, "vr_1": 1}, {deep: true})).to.be.equal(true);
  });

  it('test hasIn', function () {
    let state = {vr: {t1: undefined, t2: 2, t3: {r1: 5, r2: undefined}}, vr_1: 1};
    let result = commonLib.hasIn(state, ['vr', 't3', 'r2']);
    expect(result).to.be.equal(true);
    result = commonLib.hasIn(state, ['vr', 't3', 'r3']);
    expect(result).to.be.equal(false);
    result = commonLib.hasIn(state, ['vr', 't3']);
    expect(result).to.be.equal(true);
    result = commonLib.hasIn(state, ['t1', 't3']);
    expect(result).to.be.equal(false);
  });

  it('test setIn', function () {
    let state = {vr: 1};
    let result = commonLib.setIn(state, 1, ['vr', 't3', 'r2']);
    expect(commonLib.hasIn(result, ['vr', 't3', 'r2'])).to.be.equal(true);
    expect(state === result).to.be.equal(true);
    expect(commonLib.getIn(state, ['vr', 't3', 'r2'])).to.be.equal(1);
    result = commonLib.setIn(state, 2, 'vr', 't2');
    expect(commonLib.getIn(state, ['vr', 't3', 'r2'])).to.be.equal(1);
    expect(commonLib.getIn(state, ['vr', 't2'])).to.be.equal(2);
    expect(state === result).to.be.equal(true);
    result = commonLib.setIn(state, 1, []);
    expect(result).to.be.equal(1);
  });

  it('test makeSlice', function () {
    let result = commonLib.makeSlice(1);
    expect(result).to.be.equal(1);
    result = commonLib.makeSlice(1, 2);
    expect(result[1]).to.be.equal(2);
    result = commonLib.makeSlice(1, 2, [3]);
    expect(result[1][2][0]).to.be.equal(3);
    result = commonLib.makeSlice(1, 2, [3], 4);
    expect(result[1][2][3]).to.be.equal(4);
  });

  it('test mergeState', function () {

    let obj = {sm: 3, val: {a: 1, b: {c: 1}}};
    // this.object.test.Undefined = Symbol.for('FFormDelete');
    // this.object.test.EmptyObject = {};
    // this.object.test.EmptyArray = [];

    let result = commonLib.mergeState({val: [1, 2, 3, 4]}, {val: {1: 5}}, {replace: (p, a) => Array.isArray(a)});
    expect(result.state.val).to.be.eql({1: 5});

    result = commonLib.merge({a: [[1]]}, {a: [[2, 3]]});
    expect(result).to.be.eql({a: [[2, 3]]});

    result = commonLib.mergeState({val: [1, 2, 3, 4]}, {val: {1: 5}}, {});
    expect(result.state.val).to.be.eql([1, 5, 3, 4]);

    result = commonLib.mergeState({val: [1, 2, 3, 4]}, {val: {length: 1}});
    expect(result.state.val).to.be.eql([1]);

    let replaceObj = {a: {b: {c: 1}}, d: 5};
    let obj2replace = {d: 2};
    result = commonLib.mergeState(replaceObj, {a: {b: obj2replace}}, {replace: {a: {b: true}}});
    // console.log(result.state.a.b)
    expect(result.state.a.b).to.be.equal(obj2replace);
    expect(result.state.d).to.be.equal(5);
    expect(result.state.a.b.c).to.be.equal(undefined);

    result = commonLib.mergeState(replaceObj, obj2replace, {replace: true});
    expect(result.state).to.be.equal(obj2replace);

    result = commonLib.mergeState(replaceObj, {a: {}});
    expect(result.state).to.be.equal(replaceObj);

    result = commonLib.mergeState(obj, {val: undefined}, {del: true});
    expect(result.changes).to.be.ok;
    expect(result.state).not.to.be.equal(obj);
    expect(result.state.hasOwnProperty('val')).to.be.false;
    expect(result.changes.val).to.be.equal(undefined);

    result = commonLib.merge(obj, {val: undefined});
    expect(result.val).to.be.equal(undefined);

    result = commonLib.mergeState({val: [1, 2, 3, 4]}, {val: [3, 4, 5]});
    expect(result.state.val).to.be.eql([3, 4, 5]);

    result = commonLib.merge.all(obj, [{val: undefined}, {val: {b: {c: 1}}}], {del: true});
    expect(obj.val.b.c).to.be.equal(result.val.b.c);
    expect(result.val.hasOwnProperty('a')).to.be.false;

    result = commonLib.mergeState(obj, result, {diff: true, del: true});
    expect(obj.val.b).to.be.equal(result.state.val.b);
    expect(result.state.val.hasOwnProperty('a')).to.be.false;
    expect(result.changes.val.a).to.be.equal(undefined);

    result = commonLib.mergeState({a: 1}, {b: 2}, {diff: true});
    expect(result.state).to.be.eql({b: 2});
    expect(result.changes).to.be.eql({a: undefined, b: 2});

    result = commonLib.mergeState([1, 2, 3, 4], [3, 4, 5], {});
    expect(result.state).to.be.eql([3, 4, 5]);

    result = commonLib.mergeState([1, 2, 3, 4], {0: 3, 1: 4, 2: 5});
    expect(result.state).to.be.eql([3, 4, 5, 4]);

    result = commonLib.mergeState({val: [1, 2, 3, 4]}, {val: []});
    expect(result.state.val).to.be.eql([]);

    let arr = [1, 2, 3, 4];
    result = commonLib.mergeState({val: arr}, {val: [3, 4, 5]}, {arrays: (a, b) => a.concat(b)});
    expect(result.state.val).to.be.eql([1, 2, 3, 4, 3, 4, 5]);
    expect(result.state.val).not.to.be.equal(arr);

    let newArr = {val: []};
    newArr.val.length = 3;
    newArr.val[1] = 8;
    result = commonLib.mergeState({val: arr}, newArr, {});
    expect(result.state.val).to.be.eql([1, 8, 3]);
    expect(result.state.val).not.to.be.equal(arr);

    obj = {
      "array_1": [],
      "array_2": [[{"v1": 1, "v2": 2}, {"t1": 4, "t2": 5}]]
    };
    result = commonLib.mergeState(undefined, obj, {del: true,});
    expect(result.state).to.be.eql(obj);

    let arr2 = [];
    result = commonLib.mergeState(obj, {array_1: arr2}, {replace: (p, a) => Array.isArray(a)});
    expect(result.state).not.to.be.equal(obj);
    expect(result.state.array_1).to.be.equal(arr2);

    result = commonLib.mergeState(obj, {array_1: []}, {});
    expect(result.state).to.be.equal(obj);

    result = commonLib.mergeState(obj, {array_1: []}, {arrays: (a, b) => a.concat(b)});
    expect(result.state).to.be.equal(obj);
  });


});

describe('FForm state functions tests', function () {

  //const arraySchema = require('./schemaArray').default;
  const arrayCore = new components.FFormStateAPI({name: 'functionsTest', schema: require('./schemaArray').default, JSONValidator});
  it('test makeStateBranch, makeStateFromSchema', function () {  // stateData.state.objLevel_1.objLevel_2.array_1[0][0].bazinga[Symbol.for('FFormData')]

    let state = arrayCore.getState();
    expect(state[SymData].current.length).to.be.equal(3);
    expect(state[SymData].current[0].length).to.be.equal(2);
    expect(state[SymData].current[0][0].strValue).to.be.equal('array level 1 objValue default 0');
    expect(state[SymData].current[0][0].arrValue[0]).to.be.equal('array level 1 arrValue');
    expect(state[SymData].current[0][0].arrValue[1]).to.be.equal('arrValue default');
    expect(state[SymData].current[0][0].arrValue.length).to.be.equal(2);
    expect(state[SymData].current[2][0].turpleValue.length).to.be.equal(3);
    expect(state[SymData].current[2][0].turpleValue[0]).to.be.equal('turpleValue level 2 default');
    expect(state[SymData].current[2][0].turpleValue[1]).to.be.equal(1);
    expect(state[SymData].current[2][0].turpleValue[2]).to.be.equal('turpleValue default');
    expect(state[SymData].current[1][0].turpleValue[1]).to.be.equal(4);
    expect(state[SymData].current[1][0].turpleValue[2]).to.be.equal('turpleValue default');

    expect(state[1][0].arrValue[SymData].fData.canAdd).to.be.equal(true);
    expect(state[1][0].turpleValue[SymData].fData.canAdd).to.be.equal(false);

    expect(state[1][0].turpleValue[0][SymData].arrayItem.canUp).to.be.equal(false);
    expect(state[1][0].turpleValue[1][SymData].arrayItem.canUp).to.be.equal(false);
    expect(state[1][0].turpleValue[1][SymData].arrayItem.canDown).to.be.equal(true);
    expect(state[1][0].turpleValue[2][SymData].arrayItem.canUp).to.be.equal(true);
    expect(state[1][0].turpleValue[2][SymData].arrayItem.canDown).to.be.equal(false);
    expect(state[1][0].turpleValue[2][SymData].arrayItem.canDel).to.be.equal(true);
    expect(state[1][0].turpleValue[1][SymData].arrayItem.canDel).to.be.equal(true);
    expect(state[1][0].turpleValue[0][SymData].arrayItem.canDel).to.be.equal(false);

    expect(state[SymData].current[0][0].mapValue).to.be.equal(state[SymData].current[0][0].strValue);
    expect(state[0][0].mapValue[SymData].value).to.be.equal(state[0][0].strValue[SymData].value);
    expect(state[SymData].current[0][0].mapArrValue[0]).to.be.equal(state[SymData].current[0][0].mapValue);
    expect(state[0][0].mapArrValue[0][SymData].value).to.be.equal(state[0][0].mapValue[SymData].value);

    // state = stateFuncs.makeStateFromSchema(require('./schema').default);
    // expect(state.objLevel_1.objLevel_2.array_1[Symbol.for('FFormData')].length === 0).to.be.equal(true);
    // state = stateFuncs.makeStateFromSchema(require('./schema').default);
    // expect(state === state).to.be.equal(true);
    // let array_1_00 = stateFuncs.makeStateBranch(require('./schema').default, stateFuncs.oneOfStructure(state, ['objLevel_1', 'objLevel_2', 'array_1', 0, 0]), ['objLevel_1', 'objLevel_2', 'array_1', 0, 0]);
    // expect(array_1_00.defaultValues.bazinga).to.be.equal('bazinga default');
    // expect(array_1_00.state.bazinga[Symbol.for('FFormData')].value === 'bazinga default').to.be.equal(true);
    //
    // let array_1_10 = stateFuncs.makeStateBranch(require('./schema').default, stateFuncs.oneOfStructure(state, ['objLevel_1', 'objLevel_2', 'array_1', 1, 0]), ['objLevel_1', 'objLevel_2', 'array_1', 1, 0], {bazinga: 'test value'});
    // expect(array_1_10.defaultValues.bazinga === 'test value').to.be.equal(true);
    // expect(array_1_10.state.bazinga[Symbol.for('FFormData')].value === 'test value').to.be.equal(true);
    // expect(array_1_10.defaultValues.bazingaCinema.favBook === 'favBook default').to.be.equal(true);
    // expect(array_1_10.state.bazingaCinema.favBook[Symbol.for('FFormData')].value === 'favBook default').to.be.equal(true);
    // expect(array_1_10.defaultValues.bazingaCinema.favCinema === 'favCinema default').to.be.equal(true);
    // expect(array_1_10.state.bazingaCinema.favCinema[Symbol.for('FFormData')].value === 'favCinema default').to.be.equal(true);
  });

  it('test updatePROC', function () {
    //let state = stateLib.makeStateFromSchema(arraySchema);
    let state = arrayCore.getState();
    let UPDATABLE_object = arrayCore.UPDATABLE;  //{update: {}, replace: {}};
    let arraySchema = arrayCore.schema;
    let updateItem = {path: [0, 0, 'strValue', SymData, 'value'], value: '33'};
    expect(state[SymData].current[0][0].strValue).to.be.equal('array level 1 objValue default 0');
    state = stateLib.updatePROC(state, UPDATABLE_object, updateItem);
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    // state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[SymData].current[0][0].strValue).to.be.equal(updateItem.value);
    expect(state[0][0].strValue[SymData].value).to.be.equal(updateItem.value);
    expect(state[SymData].current[0][0].mapValue).to.be.equal(state[SymData].current[0][0].strValue);
    expect(state[0][0].mapValue[SymData].value).to.be.equal(state[0][0].strValue[SymData].value);
    expect(state[SymData].current[0][0].mapArrValue[0]).to.be.equal(state[SymData].current[0][0].mapValue);
    expect(state[0][0].mapArrValue[0][SymData].value).to.be.equal(state[0][0].mapValue[SymData].value);

    //UPDATABLE_object = {update: {}, replace: {}};
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'mapArrValue', SymData, 'length'], value: 3});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    //state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[SymData].current[0][0].mapArrValue[1]).to.be.equal(state[SymData].current[0][0].mapValue);
    expect(state[0][0].mapArrValue[1][SymData].value).to.be.equal(state[0][0].mapValue[SymData].value);
    expect(state[SymData].current[0][0].mapArrValue[2]).to.be.equal(state[SymData].current[0][0].mapValue);
    expect(state[0][0].mapArrValue[2][SymData].value).to.be.equal(state[0][0].mapValue[SymData].value);

    //UPDATABLE_object = {update: {}, replace: {}};
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'strValue', SymData, 'value'], value: '555'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'mapArrValue', SymData, 'length'], value: 2});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    //state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[0][0].mapValue[SymDataMapTree].value[SymDataMap]['../mapArrValue/2/@/value']).not.to.be.ok;
    expect(state[SymData].current[0][0].mapArrValue[0]).to.be.equal('555');
    expect(state[0][0].mapArrValue[0][SymData].value).to.be.equal('555');
    expect(state[SymData].current[0][0].mapArrValue[1]).to.be.equal('555');
    expect(state[0][0].mapArrValue[1][SymData].value).to.be.equal('555');
    expect(state[SymData].current[0][0].mapArrValue[2]).to.be.equal(undefined);
    expect(state[0][0].mapArrValue[2]).to.be.equal(undefined);

    //UPDATABLE_object = {update: {}, replace: {}};
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'strValue', SymData, 'value'], value: '777'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'mapArrValue@length'], value: 3});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    //state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[SymData].current[0][0].mapArrValue[0]).to.be.equal('777');
    expect(state[0][0].mapArrValue[0][SymData].value).to.be.equal('777');
    expect(state[SymData].current[0][0].mapArrValue[1]).to.be.equal('777');
    expect(state[0][0].mapArrValue[1][SymData].value).to.be.equal('777');
    expect(state[SymData].current[0][0].mapArrValue[2]).to.be.equal('777');
    expect(state[0][0].mapArrValue[2][SymData].value).to.be.equal('777');


    //UPDATABLE_object = {update: {}, replace: {}};
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: '@length', value: 4});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    //state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[SymData].current[3][0].strValue).to.be.equal('array level 2 objValue default');
    expect(state[3][0].strValue[SymData].value).to.be.equal('array level 2 objValue default');

    //UPDATABLE_object = {update: {}, replace: {}};
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: '@length', value: 2});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    //state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[SymData].current[2]).to.be.equal(undefined);
    expect(state[2]).to.be.equal(undefined);
    expect(state[3]).to.be.equal(undefined);

    //UPDATABLE_object = {update: {}, replace: {}};
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: '@current', value: {1: [{strValue: 'new test value'}]}});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    //state = commonLib.merge(state, UPDATABLE_object.update, {replace: UPDATABLE_object.replace, });
    expect(state[SymData].current[1][0].strValue).to.be.equal('new test value');
    expect(state[SymData].current[1].length).to.be.equal(1);
    expect(state[1][0].strValue[SymData].value).to.be.equal('new test value');

  });

  it('test macros in updatePROC', function () {
    //let state = stateLib.makeStateFromSchema(arraySchema);
    //let UPDATABLE_object = {update: {}, replace: {}};
    let state = arrayCore.getState();
    let UPDATABLE_object = arrayCore.UPDATABLE;
    let arraySchema = arrayCore.schema;
    expect(state[2][SymData].arrayItem.canDown).to.be.equal(false);
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [], value: 1, macros: 'array'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [], value: 2, macros: 'array'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].current.length).to.be.equal(6);
    expect(state[2][SymData].arrayItem.canDown).to.be.equal(true);
    expect(state[5][SymData].arrayItem.canDown).to.be.equal(false);
    expect(state[SymData].fData.canAdd).to.be.equal(false);


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [], value: -1, macros: 'array'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['2'], op: 'del', macros: 'arrayItem'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].current.length).to.be.equal(4);
    expect(state[4]).to.be.equal(undefined);
    expect(state[5]).to.be.equal(undefined);
    expect(state[SymData].fData.canAdd).to.be.equal(true);


    expect(state[SymData].current[2][0].strValue).to.be.equal('array level 2 objValue default');
    expect(state[SymData].current[1][0].strValue).to.be.equal('array level 1 objValue default 1');
    expect(state[SymData].current[0][0].strValue).to.be.equal('array level 1 objValue default 0');
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'arrValue', [1, '@value']], value: 'test arr 1 value'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [1], op: 'last', macros: 'arrayItem'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [1], op: 'del', macros: 'arrayItem'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [1], op: 'up', macros: 'arrayItem'});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [1], op: 'last', macros: 'arrayItem'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].current.length).to.be.equal(3);
    expect(state[SymData].length).to.be.equal(3);
    expect(state[SymData].current[0][0].strValue).to.be.equal('array level 2 objValue default');
    expect(state[SymData].current[1][0].strValue).to.be.equal('array level 1 objValue default 1');
    expect(state[SymData].current[2][0].strValue).to.be.equal('array level 1 objValue default 0');
    expect(state[SymData].current[2][0].arrValue[0]).to.be.equal('array level 1 arrValue');
    expect(state[SymData].current[2][0].arrValue[1]).to.be.equal('test arr 1 value');


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 0, 'strValue@status/invalid'], value: 5});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.invalid).to.be.equal(0);

    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 0, 'strValue'], ['status', 'invalid'], 5, false, {macros: 'setStatus'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.invalid).to.be.equal(1);
    expect(state[0][SymData].status.invalid).to.be.equal(1);
    expect(state[1][SymData].status.invalid).to.be.equal(0);
    expect(state[0][0][SymData].status.invalid).to.be.equal(1);
    expect(state[0][0].strValue[SymData].status.invalid).to.be.equal(1);
    expect(state[SymData].status.valid).to.be.equal(false);
    expect(state[0][SymData].status.valid).to.be.equal(false);
    expect(state[1][SymData].status.valid).to.be.equal(true);
    expect(state[0][0][SymData].status.valid).to.be.equal(false);
    expect(state[0][0].strValue[SymData].status.valid).to.be.equal(false);

    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 1, 'strValue'], ['status', 'pending'], 5, false, {macros: 'setStatus'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.pending).to.be.equal(1);
    expect(state[0][SymData].status.pending).to.be.equal(1);
    expect(state[1][SymData].status.pending).to.be.equal(0);
    expect(state[0][0][SymData].status.pending).to.be.equal(0);
    expect(state[0][0].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[0][1][SymData].status.pending).to.be.equal(1);
    expect(state[0][1].strValue[SymData].status.pending).to.be.equal(1);
    expect(state[SymData].status.valid).to.be.equal(null);
    expect(state[0][SymData].status.valid).to.be.equal(null);
    expect(state[1][SymData].status.valid).to.be.equal(true);
    expect(state[0][0][SymData].status.valid).to.be.equal(false);
    expect(state[0][0].strValue[SymData].status.valid).to.be.equal(false);
    expect(state[0][1][SymData].status.valid).to.be.equal(null);
    expect(state[0][1].strValue[SymData].status.valid).to.be.equal(null);


    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 1, 'strValue'], ['status', 'pending'], -10, false, {macros: 'setStatus'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.pending).to.be.equal(0);
    expect(state[0][SymData].status.pending).to.be.equal(0);
    expect(state[1][SymData].status.pending).to.be.equal(0);
    expect(state[0][0][SymData].status.pending).to.be.equal(0);
    expect(state[0][0].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[0][1][SymData].status.pending).to.be.equal(0);
    expect(state[0][1].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[SymData].status.valid).to.be.equal(false);
    expect(state[0][SymData].status.valid).to.be.equal(false);
    expect(state[1][SymData].status.valid).to.be.equal(true);
    expect(state[0][1][SymData].status.valid).to.be.equal(true);
    expect(state[0][1].strValue[SymData].status.valid).to.be.equal(true);


    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 0], ['status', 'validation', 'pending'], 3, false, {macros: 'setStatus'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.pending).to.be.equal(1);
    expect(state[0][SymData].status.pending).to.be.equal(1);
    expect(state[1][SymData].status.pending).to.be.equal(0);
    expect(state[0][0][SymData].status.pending).to.be.equal(1);
    expect(state[0][0].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[0][1][SymData].status.pending).to.be.equal(0);
    expect(state[0][1].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[SymData].status.valid).to.be.equal(null);
    expect(state[0][SymData].status.valid).to.be.equal(null);
    expect(state[0][0][SymData].status.valid).to.be.equal(null);
    expect(state[1][SymData].status.valid).to.be.equal(true);
    expect(state[0][1][SymData].status.valid).to.be.equal(true);
    expect(state[0][1].strValue[SymData].status.valid).to.be.equal(true);


    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 0], ['status', 'validation', 'pending'], 0, false, {macros: 'setStatus'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.pending).to.be.equal(0);
    expect(state[0][SymData].status.pending).to.be.equal(0);
    expect(state[1][SymData].status.pending).to.be.equal(0);
    expect(state[0][0][SymData].status.pending).to.be.equal(0);
    expect(state[0][0].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[0][1][SymData].status.pending).to.be.equal(0);
    expect(state[0][1].strValue[SymData].status.pending).to.be.equal(0);
    expect(state[SymData].status.valid).to.be.equal(false);
    expect(state[0][SymData].status.valid).to.be.equal(false);
    expect(state[1][SymData].status.valid).to.be.equal(true);
    expect(state[0][1][SymData].status.valid).to.be.equal(true);
    expect(state[0][1].strValue[SymData].status.valid).to.be.equal(true);

    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([], ['status', 'invalid'], 0, false, {macros: 'switch'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].status.invalid).to.be.equal(0);
    expect(state[0][SymData].status.invalid).to.be.equal(0);
    expect(state[1][SymData].status.invalid).to.be.equal(0);
    expect(state[0][0][SymData].status.invalid).to.be.equal(0);
    expect(state[0][0].strValue[SymData].status.invalid).to.be.equal(0);
    expect(state[SymData].status.valid).to.be.equal(true);
    expect(state[0][SymData].status.valid).to.be.equal(true);
    expect(state[1][SymData].status.valid).to.be.equal(true);
    expect(state[0][0][SymData].status.valid).to.be.equal(true);
    expect(state[0][0].strValue[SymData].status.valid).to.be.equal(true);


    expect(state[0][1].arrValue[SymData].status.untouched).to.be.equal(2);
    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 1, 'arrValue', 0], ['status', 'untouched'], -2, false, {macros: 'setStatus'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[SymData].status.untouched).to.be.equal(1);
    expect(state[0][1].arrValue[0][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[1][SymData].status.untouched).to.be.equal(1);


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 1, 'arrValue'], value: 1, macros: 'array'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[SymData].status.untouched).to.be.equal(2);
    expect(state[0][1].arrValue[0][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[1][SymData].status.untouched).to.be.equal(1);
    expect(state[0][1].arrValue[2][SymData].status.untouched).to.be.equal(1);


    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([0, 1, 'arrValue'], ['status', 'untouched'], 0, false, {macros: 'switch'}));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[0][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[1][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[2][SymData].status.untouched).to.be.equal(0);


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 1, 'arrValue'], value: 1, macros: 'array'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[0][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[1][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[2][SymData].status.untouched).to.be.equal(0);
    expect(state[0][1].arrValue[3][SymData].status.untouched).to.be.equal(0);


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['0/1/arrValue/0,2/@/params/hidden'], value: true});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[0][SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].arrValue[1][SymData].params.hidden).to.be.equal(undefined);
    expect(state[0][1].arrValue[2][SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].arrValue[3][SymData].params.hidden).to.be.equal(undefined);


    //state = stateFuncs.updatePROC(state,  UPDATABLE_object, {path: ['0/1/arrValue@/params/hidden'], value: null, macros: 'setAll', skipFields: ['3']});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['0/1/arrValue/*@/params/hidden'], value: null});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['0/1/arrValue/3@/params/hidden'], value: undefined});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[0][SymData].params.hidden).to.be.equal(null);
    expect(state[0][1].arrValue[1][SymData].params.hidden).to.be.equal(null);
    expect(state[0][1].arrValue[2][SymData].params.hidden).to.be.equal(null);
    expect(state[0][1].arrValue[3][SymData].params.hidden).to.be.equal(undefined);


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['0/1/*/@/params/hidden, disabled'], value: true});
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['0/1/mapValue, arrValue/@/params/hidden, disabled'], value: undefined});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[SymData].params.hidden).to.be.equal(undefined);
    expect(state[0][1].strValue[SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].mapArrValue[SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].mapValue[SymData].params.hidden).to.be.equal(undefined);
    expect(state[0][1].turpleValue[SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].arrValue[SymData].params.disabled).to.be.equal(undefined);
    expect(state[0][1].strValue[SymData].params.disabled).to.be.equal(true);
    expect(state[0][1].mapArrValue[SymData].params.disabled).to.be.equal(true);
    expect(state[0][1].mapValue[SymData].params.disabled).to.be.equal(undefined);
    expect(state[0][1].turpleValue[SymData].params.disabled).to.be.equal(true);


    state = stateLib.updatePROC(state, UPDATABLE_object, {path: ['0/1/arrValue, turpleValue@params/hidden,disabled'], value: null});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][1].arrValue[SymData].params.hidden).to.be.equal(null);
    expect(state[0][1].strValue[SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].mapArrValue[SymData].params.hidden).to.be.equal(true);
    expect(state[0][1].mapValue[SymData].params.hidden).to.be.equal(undefined);
    expect(state[0][1].turpleValue[SymData].params.hidden).to.be.equal(null);
    expect(state[0][1].arrValue[SymData].params.disabled).to.be.equal(null);
    expect(state[0][1].strValue[SymData].params.disabled).to.be.equal(true);
    expect(state[0][1].mapArrValue[SymData].params.disabled).to.be.equal(true);
    expect(state[0][1].mapValue[SymData].params.disabled).to.be.equal(undefined);
    expect(state[0][1].turpleValue[SymData].params.disabled).to.be.equal(null);
  });

  it('test relativePath', function () {
    let res = stateLib.relativePath(['1', '2', '3'], ['1', '2', '5', '6']);
    expect(commonLib.isEqual(res, ['..', '5', '6'])).to.be.equal(true);
    res = stateLib.relativePath(['1', '2', '3', '4'], ['1', '1', '3']);
    expect(commonLib.isEqual(res, ['..', '..', '..', '1', '3'])).to.be.equal(true);
    res = stateLib.relativePath(['1', '2'], ['1', '2', '5', '6']);
    expect(commonLib.isEqual(res, ['.', '5', '6'])).to.be.equal(true);
  });


  it('test string2NUpdate', function () {
    let res = stateLib.string2NUpdate('');
    expect(commonLib.isEqual(res.path, [])).to.be.equal(true);
    expect(res[SymData].length).to.be.equal(0);
    res = stateLib.string2NUpdate('/');
    expect(commonLib.isEqual(res.path, [])).to.be.equal(true);
    expect(res[SymData].length).to.be.equal(0);
    res = stateLib.string2NUpdate('/a');
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(res[SymData].length).to.be.equal(0);
    res = stateLib.string2NUpdate('a');
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(res[SymData].length).to.be.equal(0);
    res = stateLib.string2NUpdate('/a/');
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(res[SymData].length).to.be.equal(0);
    res = stateLib.string2NUpdate('a/@/');
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(commonLib.isEqual(res[SymData], [])).to.be.equal(true);
    res = stateLib.string2NUpdate('a/@');
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(commonLib.isEqual(res[SymData], [])).to.be.equal(true);
    res = stateLib.string2NUpdate('/a/@/');
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(commonLib.isEqual(res[SymData], [])).to.be.equal(true);
    res = stateLib.string2NUpdate('./a/@/', ['b']);
    expect(commonLib.isEqual(res.path, ['b', 'a'])).to.be.equal(true);
    expect(commonLib.isEqual(res[SymData], [])).to.be.equal(true);
    res = stateLib.string2NUpdate('#/a/@/', ['b']);
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(commonLib.isEqual(res[SymData], [])).to.be.equal(true);
    res = stateLib.string2NUpdate('#/a/#/@/c', ['b']);
    expect(commonLib.isEqual(res.path, ['a'])).to.be.equal(true);
    expect(commonLib.isEqual(res[SymData], ['c'])).to.be.equal(true);
  });


  it('test object2PathValues', function () {
    let res = commonLib.makeSlice(1, 2, [3]);

    let flatDataObj = {
      "array_1": [
        [{"favBook": "favBook 0 0"}, {"favBook": "favBook 0 1"}, {"favBook": "favBook 0 2"}],
        [{"favBook": "favBook 1 0"}, {"favBook": "favBook 1 1"}, {"favBook": "favBook 1 2"}],
        [{"favBook": "favBook 2 0"}, {"favBook": "favBook 2 1"}, {"favBook": "favBook 2 2"}],
        [{"favBook": "favBook 3 0"}, {"favBook": "favBook 3 1"}, {"favBook": "favBook 3 2"}]
      ],
      "movies": {"mc_favBook": "mcf 0"},
      "color_cinema_favBook": "ccf 1"
    };
    let items = stateLib.object2PathValues(flatDataObj);
    expect(items).to.have.lengthOf(14);
    expect(items[0]).to.have.lengthOf(5);
    expect(items[12]).to.have.lengthOf(3);
    expect(items[13]).to.have.lengthOf(2);
    expect(items[12][2]).to.be.equal("mcf 0");
  });


  it('test setIfNotDeeper', function () {
    const val = {};
    stateLib.setIfNotDeeper(val, true, [0, 1]);
    expect(val[0][1]).to.be.equal(true);
    stateLib.setIfNotDeeper(val, true, [0, 2]);
    expect(val[0][1]).to.be.equal(true);
    expect(val[0][2]).to.be.equal(true);
    stateLib.setIfNotDeeper(val, true, [1, 1]);
    stateLib.setIfNotDeeper(val, true, [1, 2]);
    stateLib.setIfNotDeeper(val, true, [0]);
    expect(val[0]).to.be.equal(true);
    expect(val[1][1]).to.be.equal(true);
    expect(val[1][2]).to.be.equal(true);
    stateLib.setIfNotDeeper(val, true, [0, 1]);
    expect(val[0]).to.be.equal(true);
    expect(val[1][1]).to.be.equal(true);
    expect(val[1][2]).to.be.equal(true);
  });

  it('test oneOf', function () {
    const oneOfCore = new components.FFormStateAPI({name: 'functionsTest', schema: require('./schemaOneOf').default, JSONValidator});
    const schemaOneOf = oneOfCore.schema;

    let state = oneOfCore.getState();
    expect(state[SymData].oneOf).to.be.equal(0);
    let UPDATABLE_object = oneOfCore.UPDATABLE;
    state = stateLib.updatePROC(state, UPDATABLE_object, stateLib.makeNUpdate([], ['oneOf'], 1));
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].oneOf).to.be.equal(1);
    expect(state[SymData].fData.type).to.be.equal('string');

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: '@current', value: 7});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].oneOf).to.be.equal(3);
    expect(state[SymData].value).to.be.equal(7);
    expect(state[SymData].current).to.be.equal(7);
    expect(state[SymData].fData.type).to.be.equal('number');

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: '@current', value: {objectTypeOneOfType: false}});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].oneOf).to.be.equal(4);
    expect(state[SymData].hasOwnProperty('value')).to.be.equal(false);
    expect(state[SymData].current.objectTypeString).to.be.equal('objectTypeString default');
    expect(state[SymData].fData.type).to.be.equal('object');
    expect(state.objectTypeOneOfType[SymData].oneOf).to.be.equal(1);
    expect(state.objectTypeOneOfType[SymData].fData.type).to.be.equal('boolean');
    expect(state.objectTypeOneOfType[SymData].value).to.be.equal(false);
    expect(state[SymData].current.objectTypeOneOfType).to.be.equal(false);

    state = stateLib.updatePROC(state, UPDATABLE_object, {
      path: '@current', value: [{
        recusion: [
          {stringRecursiveValue: 'inner test string'},
          {stringRecursiveValue: 'another inner test string'},
          {stringRecursiveValue: 'more test string'},
          'stringType'
        ], stringRecursiveValue: 'test recursive string'
      },
        'top level string value'
      ]
    });
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymData].oneOf).to.be.equal(0);
    expect(state[0][SymDataMapTree][SymData].length).to.be.equal(1);
    expect(state[1][SymDataMapTree][SymData].length).to.be.equal(2);
    expect(state[SymDataMapTree].length[SymDataMap]['./1/@/stringTypeMappedLength']).to.be.ok;
    expect(state[SymDataMapTree].oneOf[SymDataMap]['./1/@/stringTypeMappedOneOf']).to.be.ok;

    let uniqKey = state[1][SymData].params.uniqKey;
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [1], op: 'up', value: 0, macros: 'arrayItem'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[SymDataMapTree].length[SymDataMap]['./1/@/stringTypeMappedLength']).not.to.be.ok;
    expect(state[SymDataMapTree].oneOf[SymDataMap]['./1/@/stringTypeMappedOneOf']).not.to.be.ok;
    expect(state[SymDataMapTree].length[SymDataMap]['./0/@/stringTypeMappedLength']).to.be.ok;
    expect(state[SymDataMapTree].oneOf[SymDataMap]['./0/@/stringTypeMappedOneOf']).to.be.ok;


    expect(state[0][SymData].oneOf).to.be.equal(2);
    state = stateLib.updatePROC(state, UPDATABLE_object, {
      path: '0@value',
      value: {
        propOne: 'one',
        propTwo: 11,
        propThree: null,
        propFour: {oneString: 'oneString value'},
      }
    });
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][SymData].oneOf).to.be.equal(0);
    expect(state[0].recusion[SymData].length).to.be.equal(0);
    expect(state[SymData].current[0].propTwo).to.be.equal(11);
    expect(state[0].propTwo).to.be.equal(undefined);
    expect(state[0][SymData].params.uniqKey).to.be.equal(uniqKey);

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0], value: 3, macros: 'setOneOf'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][SymData].oneOf).to.be.equal(3);
    expect(state[0].propOne[SymData].oneOf).to.be.equal(0);
    expect(state[0].recusion).to.be.equal(undefined);
    expect(state[SymData].current[0].propTwo).to.be.equal(11);
    expect(state[SymData].current[0].recusion.length).to.be.equal(0);
    expect(state[0].propTwo[SymData].oneOf).to.be.equal(3);
    expect(state[0].propTwo[SymData].fData.type).to.be.equal('number');
    expect(state[0][SymData].params.uniqKey).to.be.equal(uniqKey);
    expect(state[0].propOne[SymData].fData.required).to.be.equal(true);
    expect(state[0].propTwo[SymData].fData.required).to.be.equal(true);
    expect(state[0].propThree[SymData].fData.required).not.to.be.ok;
    expect(state[0].propFour[SymData].fData.required).to.be.equal(true);

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propOne'], value: 2, macros: 'setOneOf', setValue: 'not compatible type'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propOne[SymData].oneOf).to.be.equal(2);
    expect(state[0].propOne[SymData].length).to.be.equal(2);
    expect(state[0].propOne[SymData].fData.type).to.be.equal('array');
    expect(state[0].propOne[SymData].fData.required).to.be.equal(true);
    expect(state[0].propOne[0][SymData].value).to.be.equal('first value');
    expect(state[0].propOne[1][SymData].value).to.be.equal('second value');
    expect(state[0][SymData].params.uniqKey).to.be.equal(uniqKey);

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propTwo'], value: 2, setValue: ['set propTwo value'], macros: 'setOneOf'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propTwo[SymData].oneOf).to.be.equal(2);
    expect(state[0].propTwo[SymData].length).to.be.equal(1);
    expect(state[0].propTwo[SymData].fData.type).to.be.equal('array');
    expect(state[0].propTwo[SymData].fData.required).to.be.equal(true);
    expect(state[0].propTwo[0][SymData].value).to.be.equal('set propTwo value');

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propOne', '@', 'value'], value: ['set propOne Value']});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propOne[SymData].oneOf).to.be.equal(2);
    expect(state[0].propOne[SymData].length).to.be.equal(1);
    expect(state[0].propOne[SymData].fData.type).to.be.equal('array');
    expect(state[0].propOne[SymData].fData.required).to.be.equal(true);
    expect(state[0].propOne[0][SymData].value).to.be.equal('set propOne Value');

    expect(state[0].propThree[SymData].oneOf).to.be.equal(0);
    expect(state[0].propThree[SymData].fData.required).not.to.be.ok;
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propThree', '@', 'value'], value: 'set propThree Value', setOneOf: 1});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propThree[SymData].oneOf).to.be.equal(1);
    expect(state[0].propThree[SymData].fData.type).to.be.equal('string');
    expect(state[0].propThree[SymData].fData.required).to.be.equal(true);
    expect(state[0].propThree[SymData].value).to.be.equal('set propThree Value');

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propThree'], value: 3, macros: 'setOneOf'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propThree[SymData].oneOf).to.be.equal(3);
    expect(state[0].propThree[SymData].fData.type).to.be.equal('string');
    expect(state[0].propThree[SymData].fData.required).not.to.be.ok;
    expect(state[0].propThree[SymData].value).to.be.equal('set propThree Value');

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propThree', '@', 'value'], value: null});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propThree[SymData].oneOf).to.be.equal(0);
    expect(state[0].propThree[SymData].fData.type).to.be.equal('null');
    expect(state[0].propThree[SymData].fData.required).not.to.be.ok;
    expect(state[0].propThree[SymData].value).to.be.equal(null);

    expect(state[0][SymData].status.untouched).to.be.equal(0);
    expect(state[0].propOne[SymData].status.untouched).to.be.equal(0);
    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [], [SymData]: ['status', 'untouched'], value: SymReset, macros: 'switch'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0][SymData].status.untouched).to.be.equal(4);
    expect(state[0].propOne[SymData].status.untouched).to.be.equal(1);
    expect(state[SymData].status.untouched).to.be.equal(2);

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propOne'], [SymData]: ['status', 'untouched'], value: -1, macros: 'setStatus'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propOne[SymData].status.untouched).to.be.equal(0);
    expect(state[0].propOne[SymData].fData.type).to.be.equal('array');

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propOne'], [SymData]: ['status', 'invalid'], value: 1, macros: 'setStatus'});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propOne[SymData].status.invalid).to.be.equal(1);
    expect(state[0][SymData].status.invalid).to.be.equal(1);
    expect(state[SymData].status.invalid).to.be.equal(1);
    expect(state[0][SymData].status.untouched).to.be.equal(3);

    state = stateLib.updatePROC(state, UPDATABLE_object, {path: [0, 'propOne'], value: 3, macros: 'setOneOf', setValue: ''});
    state = stateLib.mergeUPD_PROC(state, UPDATABLE_object);
    expect(state[0].propOne[SymData].fData.type).to.be.equal('string');
    expect(state[0].propOne[SymData].status.invalid).to.be.equal(0);
    expect(state[0][SymData].status.invalid).to.be.equal(0);
    expect(state[SymData].status.invalid).to.be.equal(0);
    expect(state[0].propOne[SymData].status.untouched).to.be.equal(0);
    expect(state[0][SymData].status.untouched).to.be.equal(3);
  })
});

describe('FForm api tests', function () {
  const components = require('../src/fform.tsx');

  const objects = {
    preset: {first: {one: 'one value'}, second: {two: 'two value'}},
    funcs: {
      one: function (...a) {return a},
      two: function (...a) {return a},
      not: function (a) {return !a},
    },
    parts: {
      first: {
        $_ref: '^/preset',
        f1: '^/funcs/one',
        'f1.bind': [2]
      },
      second: {
        $_ref: '^/parts/first',
        'f1.bind': [4],
        f2: '^/funcs/two',
        'f2.bind': [6, 10],
      }
    }
  };
  let exampleObj = {
    func: '^/funcs/two',
    part: {
      $_ref: '^/parts/second',
      'f1.bind': [1],
      first: {
        three: 'three value',
        $_maps: {
          isArray: [{$: '^/funcs/two', args: ['@/fData/type', 'array']}],
          arrayStart: {$: '^/funcs/two', args: [], update: 'build'},
          FFormApi: {$: '^/funcs/one', args: 'props/pFForm/api', update: 'build'},
          $layout: {$: '^/funcs/one', args: 'ff_layout', update: 'data'},
          $branch: {$: '^/funcs/one', args: 'state/branch', update: 'every'},
        }
      },
      _some: '^/funcs/two',
      _more: {
        f3: '^/funcs/three',
        $_maps: {value: '@/value'}
      },
      $fields: [{$_maps: {length: '@/length'}}],
      $_maps: {value: '@/value'}
    }
  };

  let obj2SymData, $_maps, NMaps;

  it('test api.objectDerefer', function () {
    let obj = apiLib.objectDerefer(objects, exampleObj);
    expect(obj.func).to.be.equal('^/funcs/two');
    expect(obj.part.f1).to.be.equal('^/funcs/one');
    expect(obj.part['f1.bind']).to.be.eql([1]);
    expect(obj.part.f2).to.be.equal('^/funcs/two');
    expect(obj.part['f2.bind']).to.be.eql([6, 10]);
    expect(obj.part.first.one).to.be.equal('one value');
    expect(obj.part.first.three).to.be.equal('three value');
  });

  it('test SRR dehydrate stateRehydrate', async function () {

    const core = new components.FFormStateAPI({name: 'core', schema: require('./schemaArray').default, JSONValidator});
    const state = core.getState();
    let reState = dehydrate(state);
    eval('reState=' + reState);
    const reCore = new components.FFormStateAPI({state: reState, name: 'reCore', schema: require('./schemaArray').default, JSONValidator});
    const reCoreState = reCore.getState();
    expect(state).to.be.eql(reCoreState);
  })


  // it('test api.objectResolver', function () {
  //
  //   let obj = apiLib.objectResolver(elements, exampleObj);
  //   expect(obj.func).to.be.equal(elements.funcs.two);
  //   expect(obj.part.f1).to.be.equal(elements.funcs.one);
  //   expect(obj.part['f1.bind']).to.be.eql([1]);
  //   expect(obj.part.f2).to.be.equal(elements.funcs.two);
  //   expect(obj.part['f2.bind']).to.be.eql([6, 10]);
  //   expect(obj.part._some).to.be.equal(elements.funcs.two);
  //   expect(obj.part._more.f3).to.be.equal('^/funcs/three');
  //
  //   obj2SymData = apiLib.objectResolver(elements, exampleObj);
  //   expect(obj2SymData.func).to.be.equal(elements.funcs.two);
  //   expect(obj2SymData.part.f1).to.be.equal(elements.funcs.one);
  //   expect(obj2SymData.part['f1.bind']).to.be.eql([1]);
  //   expect(obj2SymData.part.f2).to.be.equal(elements.funcs.two);
  //   expect(obj2SymData.part['f2.bind']).to.be.eql([6, 10]);
  //   expect(obj2SymData.part.first.one).to.be.equal('one value');
  //   expect(obj2SymData.part.first.three).to.be.equal('three value');
  //   expect(obj2SymData.part._some).to.be.equal(elements.funcs.two);
  //   expect(obj2SymData.part._more.f3).to.be.equal('^/funcs/three');
  // });
  //
  // it('test components.extractMaps', function () {
  //   let mObj = commonLib.merge(obj2SymData, obj2SymData[SymData]);
  //   let res = components.extractMaps(mObj, ['$fields']);
  //   $_maps = res.$_maps;
  //   expect(res.rest.part.$fields[0].$_maps).to.be.eql({length: '@/length'});
  //   expect(res.rest.part.$_maps).to.be.equal(undefined);
  //   expect(res.rest.part.first.$_maps).to.be.equal(undefined);
  //   expect(res.rest.part._more.$_maps).to.be.equal(undefined);
  //   expect($_maps['part/value']).to.be.equal('@/value');
  //   expect($_maps['part/first/$branch'].$).to.be.equal(elements.funcs.one);
  //   expect($_maps['part/first/$branch'].args).to.be.equal('state/branch');
  //   expect($_maps['part/first/$layout'].$).to.be.equal(elements.funcs.one);
  // });

  // it('test components.normalizeMaps', function () {
  //   NMaps = components.normalizeMaps($_maps);
  //   expect(NMaps.build[0].to['']).to.be.eql(["part", "first", "arrayStart"]);
  //   expect(NMaps.build[0].dataRequest).to.be.equal(false);
  //   expect(NMaps.data[0].to['']).to.be.eql(["part", "value"]);
  //   expect(NMaps.data[0].dataRequest).to.be.equal(true);
  //   expect(NMaps.data[1].dataRequest).to.be.equal(true);
  //   expect(NMaps.data[1].to['']).to.be.eql(["part", "first", "isArray"]);
  //   expect(stateLib.isNPath(NMaps.data[1].args[0])).to.be.equal(true);
  //   const preNMaps = components.normalizeMaps($_maps, '0');
  //   expect(preNMaps.build[0].to['']).to.be.eql(["0", "part", "first", "arrayStart"]);
  //   expect(preNMaps.build[0].dataRequest).to.be.equal(false);
  //   expect(preNMaps.data[0].args[0]).to.be.equal("value");
  //   expect(stateLib.isNPath(preNMaps.data[0].args)).to.be.equal(true);
  //   expect(preNMaps.data[0].to['']).to.be.eql(["0", "part", "value"]);
  //   expect(preNMaps.data[0].dataRequest).to.be.equal(true);
  //
  // });
  //
  // it('test components.updateProps', function () {
  //   const value = {};
  //   let mapped = components.updateProps(undefined, undefined, {value, fData: {type: 'string'}}, NMaps.build, NMaps.data, NMaps.every);
  //   expect(mapped.part.value).to.be.equal(value);
  //   expect(mapped.part.first.$branch).to.be.eql("state/branch");
  //   expect(mapped.part.first.arrayStart).to.be.eql([]);
  //   expect(mapped.part._more.value).to.be.equal(value);
  //   expect(mapped.part.first.isArray).to.be.eql(['string', 'array']);
  //
  //   mapped = components.updateProps(mapped, undefined, {value: 'value', fData: {type: 'object'}}, NMaps.data, NMaps.every);
  //   expect(mapped.part.first.isArray).to.be.eql(['object', 'array']);
  //   expect(mapped.part._more.value).to.be.equal('value');
  // });
});

describe('test removeNotAllowedProperties', function () {
  let schema = {
    "oneOf": [
      {
        type: "object",
        "properties": {
          "one": {type: "string", default: "one"}
        },
        "patternProperties": {
          "^_": {type: "string"}
        },
        _oneOfSelector: (value) => {
          if (value && value.hasOwnProperty("two")) return 1;
          return 0;
        },
        additionalProperties: false
      },
      {
        type: "object",
        "properties": {
          "two": {type: "integer", default: 2}
        },
        required: ["two"],
      }
    ]
  };
  const addCore = new components.FFormStateAPI({name: 'removeNotAllowedProperties', schema, JSONValidator});

  it('test makeStateBranch with removeNotAllowedProperties', async function () {
    await addCore.setValue({"one": "", "test": "", "_test": ""});
    let state = addCore.getState();
    expect(state[SymData].current).to.be.eql({"one": "", "_test": ""});
    await addCore.setValue({"two": 2, "three": 3}, {setOneOf: 1});
    state = addCore.getState();
    expect(state[SymData].current).to.be.eql({"one": "", "two": 2, "three": 3, "_test": ""});
    await addCore.set('./@/oneOf', 0);
    state = addCore.getState();
    expect(state[SymData].current).to.be.eql({"one": "", "_test": ""});
  });

  it('test getSchemaPart with value', async function () {
    let schemaPart = stateLib.getSchemaPart(addCore.schema, ["two"], {"two": 2, "three": 3});
    expect(schemaPart).to.be.eql({
      "_compiled": true,
      "type": "integer",
      "default": 2
    });
    schemaPart = stateLib.getSchemaPart(addCore.schema, [], {"two": 2, "three": 3});
    expect(schemaPart._oneOfIndex).to.be.equal(1);
    schemaPart = stateLib.getSchemaPart(addCore.schema, ["one"], {"one": "", "_test": ""});
    expect(schemaPart).to.be.eql({
      "_compiled": true,
      "type": "string",
      "default": "one"
    });
    schemaPart = stateLib.getSchemaPart(addCore.schema, [], {"one": "", "_test": ""});
    expect(schemaPart._oneOfIndex).to.be.equal(0);
  })
});

describe('test FFormStateAPI', async function () {  // state.objLevel_1.objLevel_2.array_1[0][0].bazinga[Symbol.for('FFormData')]

    const extStore = {
      state: undefined,
      getState: () => extStore.state,
      setState: (state) => extStore.state = state
    };
    const extStoreRedux = {
      state: undefined,
      getState: () => extStore.state,
      setState: (state) => extStore.state = state
    };

    const formReducer = components.formReducer;
    const rootReducer = combineReducers({fforms: formReducer()});
    const store = createStore(rootReducer, applyMiddleware(thunk));

    const simpleCore = new components.FFormStateAPI({name: 'simpleCore', schema: require('./schemaArray').default, JSONValidator});
    const externalCore = new components.FFormStateAPI({getState: extStore.getState, setState: extStore.setState, name: 'externalCore', schema: require('./schemaArray').default, JSONValidator});

    const simpleReduxCore = new components.FFormStateAPI({name: 'simpleReduxCore', store, schema: require('./schemaArray').default, JSONValidator});
    const externalReduxCore = new components.FFormStateAPI({getState: extStoreRedux.getState, setState: extStoreRedux.setState, name: 'externalReduxCore', store, schema: require('./schemaArray').default, JSONValidator});
    const notExist = {};

    async function testApi(core) {
      it('test api.get, api.set simple usage' + core.name, async function () {
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
        let val0 = core.get('0/0/strValue@value');
        let val1 = core.get('0/1/strValue@value');
        core.set('0/0/strValue@value', 'set test 000', {execute: 1});
        core.set('0/1/strValue@value', 'set test 111', {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(false);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));

        core.set('0/1/strValue@value', val1, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(core.getValue()[0][1]).to.be.equal(core.getValue({inital: true})[0][1]);

        core.set('0/0/strValue@value', val0, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
        expect(core.getValue()[0][0]).to.be.equal(core.getValue({inital: true})[0][0]);
      });

      it('test api.arrayAdd ' + core.name, async function () {
        core.arrayAdd('0', 1, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));

        core.arrayAdd('0', -1, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
      });

      it('test api.setValue ' + core.name, async function () {
        core.setValue({}, {execute: true});
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));

        let newVal = [];
        newVal.length = core.getValue().length;
        core.setValue(newVal, {execute: true});
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));

        newVal.length++;
        core.setValue(newVal, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));

        newVal.length--;
        core.setValue(newVal, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
      });

      it('test api.setValue with non-existing schema property' + core.name, async function () {
        let moreNewVal = [];
        moreNewVal.length = core.getValue().length;
        moreNewVal.notExist = notExist;
        core.setValue(moreNewVal, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(core.getValue().notExist).to.be.equal(notExist);

        let newVal = [];
        newVal.length = 3;
        newVal[0] = [{strValue: 'setValue test 0 0'}, {strValue: 'setValue test 0 1'}];
        core.setValue(newVal, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(false);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(core.get('0/0/strValue@value')).to.be.equal('setValue test 0 0');
        expect(core.get('0/1/strValue@value')).to.be.equal('setValue test 0 1');
        expect(core.getValue().notExist).to.be.equal(notExist);

        expect(core.get('0/0/mapArrValue/1@value')).to.be.equal(undefined);
        core.setValue(2, {path: ['0', '0', 'mapArrValue', 'length'], execute: true});
        expect(core.get('0/0/mapArrValue@/length')).to.be.equal(2);
        expect(core.get('0/0/mapArrValue/1@value')).to.be.equal('setValue test 0 0');
        expect(core.getValue().notExist).to.be.equal(notExist);

        let val0 = core.get('@inital/0/0/strValue');
        let val1 = core.get('@inital/0/1/strValue');
        newVal[0] = [{strValue: val0}, {strValue: val1}];
        core.setValue(newVal);
        core.setValue(undefined, {path: ['notExist'], execute: true});
        core.setValue(1, {path: ['0', '0', 'mapArrValue', 'length'], execute: true});
        expect(core.get('0/0/mapArrValue@/length')).to.be.equal(1);
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue().notExist).to.be.equal(undefined);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
      });

      it('test api.setValue to set inital value' + core.name, async function () {

        let val0 = core.get('@inital/0/0/strValue');
        let val1 = core.get('@inital/0/1/strValue');
        let initNewVal = [{strValue: 'inital setValue test 0 0', mapValue: 'inital setValue test 0 0', mapArrValue: [], arrValue: [], turpleValue: []},
          {strValue: 'inital setValue test 0 1', mapValue: 'inital setValue test 0 1', mapArrValue: ['inital setValue test 0 1']}];
        core.setValue(initNewVal, {path: '0', inital: true, execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(false);
        expect(core.get('1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(core.get('0/0/strValue@value')).to.be.equal(val0);
        expect(core.get('0/1/strValue@value')).to.be.equal(val1);
        expect(core.getValue().notExist).to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/0')).not.to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/1')).not.to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/2')).not.to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/@/messages/0/texts/0/0')).to.be.equal(undefined);

        let newVal = [];
        newVal.length = 3;
        newVal[0] = [{strValue: 'inital setValue test 0 0', mapArrValue: [], arrValue: [], turpleValue: []},
          {strValue: 'inital setValue test 0 1', arrValue: [], turpleValue: []}];
        core.setValue(newVal, {execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(false);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(core.get('0/0/strValue@value')).to.be.equal('inital setValue test 0 0');
        expect(core.get('0/1/strValue@value')).to.be.equal('inital setValue test 0 1');
        expect(core.getValue().notExist).to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/0')).to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/1')).to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/2')).to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/@/messages/0/texts/0/0').length).to.be.ok;

        core.setValue([], {path: '0/1/arrValue', inital: true});
        core.setValue([], {path: '0/1/turpleValue', inital: true, execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
        expect(core.get('0/0/strValue@value')).to.be.equal('inital setValue test 0 0');
        expect(core.get('0/1/strValue@value')).to.be.equal('inital setValue test 0 1');
        expect(core.getValue().notExist).to.be.equal(undefined);

      });


      it('test api.setValue to set non-existing in schema to inital value' + core.name, async function () {

        core.setValue(notExist, {path: 'notExist', inital: true, execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(core.getValue().notExist).to.be.equal(undefined);

        core.setValue(notExist, {path: 'notExist', execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
        expect(core.getValue().notExist).to.be.equal(notExist);

      });

      it('test api.clear ' + core.name, async function () {
        core.clear({execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(false);
        expect(core.get('0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(false);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(false);
        expect(core.getValue()).not.to.be.equal(core.getValue({inital: true}));
        expect(commonLib.isEqual(commonLib.merge(core.getDefaultValue(), {notExist}), core.getValue(), {deep: true})).to.be.equal(true);
        expect(core.getValue().notExist).to.be.equal(notExist);
      });

      it('test api.reset ' + core.name, async function () {
        core.reset({execute: true});
        expect(core.get('@/status/pristine')).to.be.equal(true);
        expect(core.get('0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/0/@/status/pristine')).to.be.equal(true);
        expect(core.get('0/1/@/status/pristine')).to.be.equal(true);
        expect(core.getValue()).to.be.equal(core.getValue({inital: true}));
        expect(core.getValue().notExist).to.be.equal(notExist);

      });

      it('test api.arrayAdd with sync validation' + core.name, async function () {
        expect(core.get('0/0/turpleValue/@/messages/0/texts/0/0')).to.be.ok;
        core.arrayAdd('0/0/turpleValue', ['te'], {execute: 1});
        core.arrayAdd('0/0/turpleValue', [5, 8], {execute: true});
        expect(core.get('0/0/turpleValue/@/messages/0/texts/0/0')).to.be.equal(undefined);
        expect(core.get('0/0/turpleValue/0@value')).to.be.equal('te');
        expect(core.get('0/0/turpleValue/1@value')).to.be.equal(5);
        expect(core.get('0/0/turpleValue/2@value')).to.be.equal(8);
      });

      it('test async validation' + core.name, async function () {
        expect(core.get('0/0/strValue@messages/0/1/0')).to.be.equal(undefined);
        expect(core.get('0/@/messages/0/texts/1/0')).to.be.equal(undefined);
        core.set('0/0/strValue@value', 'test validation', {execute: true});
        expect(core.get('0/@/messages/0/texts/1/0')).to.be.equal('simple text message');
        expect(core.get('0/@/messages/0/texts/1/1')).to.be.equal('more simple text message');
        expect(core.get('0/@/messages/0/texts/1/length')).to.be.equal(2);
        expect(core.get('0/0/mapValue@messages/0/texts/1/0')).to.be.equal('text message for mapValue');
        expect(core.get('0/0/arrValue@messages/0/texts/2/0')).to.be.equal(undefined);
        await sleep(10);
        expect(core.get('0/0/arrValue@messages/0/texts/2/0')).to.be.equal('async text message for arrValue test validation');

        core.set('0/0/strValue@value', 'no validation', {execute: true});
        expect(core.get('0/0/arrValue@messages/0/texts/2/0')).to.be.equal('async text message for arrValue test validation');
        await sleep(10);
        expect(core.get('0/0/arrValue@messages/0/texts/2/0')).to.be.equal(undefined);
      });

      it('test async validation with changing validated value during the validation' + core.name, async function () {
        core.set('0/0/strValue@value', 'test validation', {execute: true});
        expect(core.get('0/0/arrValue@messages/0/texts/2/0')).to.be.equal(undefined);
        core.set('0/0/strValue@value', 'another validation', {execute: true});
        await sleep(10);
        expect(core.get('0/0/arrValue@messages/0/texts/2/0')).to.be.equal('async text message for arrValue another validation');
        expect(core.get('0/@/messages/0/texts/1/0')).to.be.equal(undefined);
      });

      it('test deffered execution ' + core.name, async function () {
        core.set('0/0/strValue@value', 'deff', {execute: true});
        expect(core.get('0/0/strValue@value')).to.be.equal('deff');
        let promise = core.set('0/0/strValue@value', 'more deff', {execute: 30});
        expect(core.get('0/0/strValue@value')).to.be.equal('deff');
        await sleep(10);
        expect(core.get('0/0/strValue@value')).to.be.equal('deff');
        await promise;
        expect(core.get('0/0/strValue@value')).to.be.equal('more deff');
      });

    }

    describe('#simpleCore', async function () {await testApi(simpleCore);});
    describe('#externalCore', async function () {await testApi(externalCore);});
    describe('#simpleReduxCore', async function () {await testApi(simpleReduxCore);});
    describe('#externalReduxCore', async function () {await testApi(externalReduxCore);});

  }
);



