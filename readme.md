#Table of content

<!-- toc -->

- [Overview](#overview)
    + [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
    + [Without JSON validaton](#without-json-validaton)
    + [With JSON validaton](#with-json-validaton)
- [Examples](#examples)
- [Documentation](#documentation)

<!-- tocstop -->

## Overview
Flexibile Form (`fform`) - is a try to make form builder with minimum redundancy and with maximum flexibility ans extebdebility. It uses JSONSchema (draft v4) to describe forms, React (v16) for render and has native redux support for state storage but can be used with any other external storage or can use only internal storage (storage agnostic).


== See [fform-constructor](http://wtnm.github.io/fform-constuctor/) for live demo.==

#### Features
- **90kb** minified, **26kb** gziped
- form-constuctor for quick start
- form extention, combination and reuse with JSONSchema's `allOf`, `oneOf`, `$ref` properties 
- sync/async/JSON/submit validation
- storage agnostic, native redux support, can be used with any external storage or can use own internal storage
- built-in arrays (add/del/move operations)
- built-in viewer
- fully customizable
- SSR support


## Installation

To install the stable version:

```
npm install --save fform
```

This assumes that you are using [npm](https://www.npmjs.com/) with a module bundler like [webpack](https://webpack.js.org/)

## Usage

#### Without JSON validaton

```js
import {FForm, elements} from 'fform';
import {render} from 'react-dom';

render(<FForm core={{schema: {type:"string"}, elements}}/>, document.querySelector('#root'));
```

#### With JSON validaton

```js
import {FForm, elements} from 'fform';
import {render} from 'react-dom';

import imjvWrapper from 'fform/addons/imjvWrapper';
import * as imjvValidator from 'fform/addons/is-my-json-valid-lite';
const JSONValidator = imjvWrapper(imjvValidator);

render(<FForm core={{schema: {type:"string"}, elements, JSONValidator}}/>,
		document.querySelector('#root'));
```

## Examples
<!-- toc-examples -->

- [simple form](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=0)
- [layouts and viewer](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=1)
- [arrays and oneOf](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=2)
- [dataMaps](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=3)
- [validation](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=4)
- [format and parse](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=5)
- [custom input](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=6)
- [tabs and steps](http://wtnm.github.io/fform-constuctor/#src=examples.json&selector=7)

<!-- tocstop -->


## Documentation
<!-- toc-docs -->

- [FForm](documentation.md#fform)
    + [Passing [FFStateApi props](documentation.md#ffstateapi)](documentation.md#passing-ffstateapi-props%23ffstateapi)
    + [Using with redux Provider](documentation.md#using-with-redux-provider)
- [FFStateApi](documentation.md#ffstateapi)
    + [Redux storage](documentation.md#redux-storage)
    + [External storage](documentation.md#external-storage)
    + [Internal storage](documentation.md#internal-storage)
- [API](documentation.md#api)
    + [`get(...pathes: string | string[]`)](documentation.md#getpathes-string--string)
    + [`set(path: string | string[], value: any, opts?: setOpts )`](documentation.md#setpath-string--string-value-any-opts-setopts-)
    + [`getValue(opts?: getValueOpts)`](documentation.md#getvalueopts-getvalueopts)
    + [`setValue(value: any, opts?: setValueOpts)`](documentation.md#setvaluevalue-any-opts-setvalueopts)
    + [`getDefaultValue()`](documentation.md#getdefaultvalue)
    + [`reset(opts?: resetOpts)`](documentation.md#resetopts-resetopts)
    + [`clear(opts?: clearOpts)`](documentation.md#clearopts-clearopts)
    + [`validate(path: boolean | string | string[], opts?: APIOptsType)`](documentation.md#validatepath-boolean--string--string-opts-apioptstype)
    + [`arrayAdd(path: string | string[], value: number | any[], opts?: APIOptsType)`](documentation.md#arrayaddpath-string--string-value-number--any-opts-apioptstype)
    + [`arrayItemOps(path: string | string[], op: string, opts: arrayItemOpts)`](documentation.md#arrayitemopspath-string--string-op-string-opts-arrayitemopts)
    + [`setHidden(path: string | string[], value?: boolean, opts?: APIOptsType)`](documentation.md#sethiddenpath-string--string-value-boolean-opts-apioptstype)
    + [`showOnly(path: string | string[], opts?: APIOptsType)`](documentation.md#showonlypath-string--string-opts-apioptstype)
    + [`getActive()`](documentation.md#getactive)
    + [`execute()`](documentation.md#execute)
- [Path](documentation.md#path)
- [Data object](documentation.md#data-object)
- [Basic schema properties](documentation.md#basic-schema-properties)
    + [Meta data](documentation.md#meta-data)
    + [Number Validation](documentation.md#number-validation)
    + [String Validation](documentation.md#string-validation)
    + [Array Validation](documentation.md#array-validation)
    + [Object Validation](documentation.md#object-validation)
    + [Combining Schemas](documentation.md#combining-schemas)
- [Extended schema properties](documentation.md#extended-schema-properties)
  * [Validation](documentation.md#validation)
    + [JSON validation](documentation.md#json-validation)
    + [Sync validation](documentation.md#sync-validation)
    + [Async validation](documentation.md#async-validation)
  * [Customization](documentation.md#customization)
  * [Object layout](documentation.md#object-layout)
- [Elements](documentation.md#elements)
    + [props processing](documentation.md#props-processing)
    + [structure](documentation.md#structure)
    + [functions](documentation.md#functions)
- [Styling](documentation.md#styling)
- [SSR](documentation.md#ssr)

<!-- tocstop -->

