
// This is lzma.js, powered by lzip (which is GPL, source code at https://github.com/kripken/lzma.js)
var LZMA = {
  run: function(data, decompress) {
    var inputIndex = 0;
    var returnValue = [];
    var Module = {
      arguments: ['-q'].concat(decompress ? ['-d'] : []),
      stdin: function() { return inputIndex < data.length ? data[inputIndex++] : null },
      stdout: function(x) { if (x !== null) returnValue.push(x) }
    };


// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };

  Module['load'] = function(f) {
    globalEval(read(f));
  };

  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}

if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }

  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }

  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}

if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  Module['load'] = importScripts;
}

if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];

  
// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  BITSHIFT64_SHL: 0,
  BITSHIFT64_ASHR: 1,
  BITSHIFT64_LSHR: 2,
  bitshift64: function (low, high, op, bits) {
    var ret;
    var ander = Math.pow(2, bits)-1;
    if (bits < 32) {
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [low << bits, (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits))];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [(((low >>> bits ) | ((high&ander) << (32 - bits))) >> 0) >>> 0, (high >> bits) >>> 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [((low >>> bits) | ((high&ander) << (32 - bits))) >>> 0, high >>> bits];
          break;
      }
    } else if (bits == 32) {
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [0, low];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [high, (high|0) < 0 ? ander : 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [high, 0];
          break;
      }
    } else { // bits > 32
      switch (op) {
        case Runtime.BITSHIFT64_SHL:
          ret = [0, low << (bits - 32)];
          break;
        case Runtime.BITSHIFT64_ASHR:
          ret = [(high >> (bits - 32)) >>> 0, (high|0) < 0 ? ander : 0];
          break;
        case Runtime.BITSHIFT64_LSHR:
          ret = [high >>>  (bits - 32) , 0];
          break;
      }
    }
    HEAP32[tempDoublePtr>>2] = ret[0]; // cannot use utility functions since we are in runtime itself
    HEAP32[tempDoublePtr+4>>2] = ret[1];
  },
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function makeBigInt(low,high,unsigned) { var ret = (unsigned ? (((low)>>>0)+(((high)>>>0)*4294967296)) : (((low)>>>0)+(((high)|0)*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}







//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};

var ABORT = false;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = eval('_' + ident);
  } catch(e) {
    try {
      func = globalScope['Module']['_' + ident]; // closure exported function
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// Simple unoptimized memset - necessary during startup
var _memset = function(ptr, value, num) {
  var stop = ptr + num;
  while (ptr < stop) {
    HEAP8[((ptr++)|0)]=value;
  }
}

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    _memset(ret, 0, size);
    return ret;
  }

  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }

  var i = 0, type;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  var utf8 = new Runtime.UTF8Processor();
  var nullTerminated = typeof(length) == "undefined";
  var ret = "";
  var i = 0;
  var t;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (nullTerminated && t == 0) break;
    ret += utf8.processCChar(t);
    i += 1;
    if (!nullTerminated && i == length) break;
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and STATICTOP is the new top.
  while (TOTAL_MEMORY <= STATICTOP) { // Simple heuristic. Override enlargeMemory() if your program has something more optimal for it
    TOTAL_MEMORY = alignMemoryPage(2*TOTAL_MEMORY);
  }
  var oldHEAP8 = HEAP8;
  var buffer = new ArrayBuffer(TOTAL_MEMORY);
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
  HEAP8.set(oldHEAP8);
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max

var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}

STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY

var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown

function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

// === Body ===



assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);

STATICTOP += 10708;

assert(STATICTOP < TOTAL_MEMORY);





























var _stderr;



__ATINIT__ = __ATINIT__.concat([
  { func: function() { __GLOBAL__I_a() } }
]);























































var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;








var __ZTISt9exception;










allocate([32,32,45,107,44,32,45,45,107,101,101,112,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,107,101,101,112,32,40,100,111,110,39,116,32,100,101,108,101,116,101,41,32,105,110,112,117,116,32,102,105,108,101,115,0] /*   -k, --keep         */, "i8", ALLOC_NONE, 5242880);
allocate([32,32,45,70,44,32,45,45,114,101,99,111,109,112,114,101,115,115,32,32,32,32,32,32,32,32,32,32,32,102,111,114,99,101,32,114,101,99,111,109,112,114,101,115,115,105,111,110,32,111,102,32,99,111,109,112,114,101,115,115,101,100,32,102,105,108,101,115,0] /*   -F, --recompress   */, "i8", ALLOC_NONE, 5242944);
allocate([32,32,45,102,44,32,45,45,102,111,114,99,101,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,111,118,101,114,119,114,105,116,101,32,101,120,105,115,116,105,110,103,32,111,117,116,112,117,116,32,102,105,108,101,115,0] /*   -f, --force        */, "i8", ALLOC_NONE, 5243016);
allocate([32,32,45,100,44,32,45,45,100,101,99,111,109,112,114,101,115,115,32,32,32,32,32,32,32,32,32,32,32,100,101,99,111,109,112,114,101,115,115,0] /*   -d, --decompress   */, "i8", ALLOC_NONE, 5243080);
allocate([32,32,45,99,44,32,45,45,115,116,100,111,117,116,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,115,101,110,100,32,111,117,116,112,117,116,32,116,111,32,115,116,97,110,100,97,114,100,32,111,117,116,112,117,116,0] /*   -c, --stdout       */, "i8", ALLOC_NONE, 5243120);
allocate([32,32,45,98,44,32,45,45,109,101,109,98,101,114,45,115,105,122,101,61,60,110,62,32,32,32,32,32,32,115,101,116,32,109,101,109,98,101,114,32,115,105,122,101,32,108,105,109,105,116,32,105,110,32,98,121,116,101,115,0] /*   -b, --member-size= */, "i8", ALLOC_NONE, 5243180);
allocate([32,32,45,86,44,32,45,45,118,101,114,115,105,111,110,32,32,32,32,32,32,32,32,32,32,32,32,32,32,111,117,116,112,117,116,32,118,101,114,115,105,111,110,32,105,110,102,111,114,109,97,116,105,111,110,32,97,110,100,32,101,120,105,116,0] /*   -V, --version      */, "i8", ALLOC_NONE, 5243240);
allocate([84,104,101,114,101,32,105,115,32,78,79,32,87,65,82,82,65,78,84,89,44,32,116,111,32,116,104,101,32,101,120,116,101,110,116,32,112,101,114,109,105,116,116,101,100,32,98,121,32,108,97,119,46,0] /* There is NO WARRANTY */, "i8", ALLOC_NONE, 5243308);
allocate([84,104,105,115,32,105,115,32,102,114,101,101,32,115,111,102,116,119,97,114,101,58,32,121,111,117,32,97,114,101,32,102,114,101,101,32,116,111,32,99,104,97,110,103,101,32,97,110,100,32,114,101,100,105,115,116,114,105,98,117,116,101,32,105,116,46,0] /* This is free softwar */, "i8", ALLOC_NONE, 5243364);
allocate([76,105,99,101,110,115,101,32,71,80,76,118,51,43,58,32,71,78,85,32,71,80,76,32,118,101,114,115,105,111,110,32,51,32,111,114,32,108,97,116,101,114,32,60,104,116,116,112,58,47,47,103,110,117,46,111,114,103,47,108,105,99,101,110,115,101,115,47,103,112,108,46,104,116,109,108,62,0] /* License GPLv3+: GNU  */, "i8", ALLOC_NONE, 5243432);
allocate([76,122,105,112,32,104,111,109,101,32,112,97,103,101,58,32,104,116,116,112,58,47,47,119,119,119,46,110,111,110,103,110,117,46,111,114,103,47,108,122,105,112,47,108,122,105,112,46,104,116,109,108,0] /* Lzip home page: http */, "i8", ALLOC_NONE, 5243512);
allocate([10,82,101,112,111,114,116,32,98,117,103,115,32,116,111,32,108,122,105,112,45,98,117,103,64,110,111,110,103,110,117,46,111,114,103,0] /* \0AReport bugs to lz */, "i8", ALLOC_NONE, 5243568);
allocate([75,105,32,61,32,75,105,66,32,61,32,50,94,49,48,32,61,32,49,48,50,52,44,32,77,32,61,32,49,48,94,54,44,32,77,105,32,61,32,50,94,50,48,44,32,71,32,61,32,49,48,94,57,44,32,71,105,32,61,32,50,94,51,48,44,32,101,116,99,46,46,46,0] /* Ki = KiB = 2^10 = 10 */, "i8", ALLOC_NONE, 5243604);
allocate([78,117,109,98,101,114,115,32,109,97,121,32,98,101,32,102,111,108,108,111,119,101,100,32,98,121,32,97,32,109,117,108,116,105,112,108,105,101,114,58,32,107,32,61,32,107,66,32,61,32,49,48,94,51,32,61,32,49,48,48,48,44,0] /* Numbers may be follo */, "i8", ALLOC_NONE, 5243680);
allocate([102,114,111,109,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,32,116,111,32,115,116,97,110,100,97,114,100,32,111,117,116,112,117,116,46,0] /* from standard input  */, "i8", ALLOC_NONE, 5243744);
allocate([32,32,45,104,44,32,45,45,104,101,108,112,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,100,105,115,112,108,97,121,32,116,104,105,115,32,104,101,108,112,32,97,110,100,32,101,120,105,116,0] /*   -h, --help         */, "i8", ALLOC_NONE, 5243784);
allocate([32,32,32,32,32,32,45,45,98,101,115,116,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,97,108,105,97,115,32,102,111,114,32,45,57,0] /*       --best         */, "i8", ALLOC_NONE, 5243840);
allocate([32,32,32,32,32,32,45,45,102,97,115,116,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,97,108,105,97,115,32,102,111,114,32,45,48,0] /*       --fast         */, "i8", ALLOC_NONE, 5243884);
allocate([32,32,45,48,32,46,46,32,45,57,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,115,101,116,32,99,111,109,112,114,101,115,115,105,111,110,32,108,101,118,101,108,32,91,100,101,102,97,117,108,116,32,54,93,0] /*   -0 .. -9           */, "i8", ALLOC_NONE, 5243928);
allocate([32,32,45,118,44,32,45,45,118,101,114,98,111,115,101,32,32,32,32,32,32,32,32,32,32,32,32,32,32,98,101,32,118,101,114,98,111,115,101,32,40,97,32,50,110,100,32,45,118,32,103,105,118,101,115,32,109,111,114,101,41,0] /*   -v, --verbose      */, "i8", ALLOC_NONE, 5243992);
allocate([32,32,45,116,44,32,45,45,116,101,115,116,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,116,101,115,116,32,99,111,109,112,114,101,115,115,101,100,32,102,105,108,101,32,105,110,116,101,103,114,105,116,121,0] /*   -t, --test         */, "i8", ALLOC_NONE, 5244056);
allocate([32,32,45,83,44,32,45,45,118,111,108,117,109,101,45,115,105,122,101,61,60,110,62,32,32,32,32,32,32,115,101,116,32,118,111,108,117,109,101,32,115,105,122,101,32,108,105,109,105,116,32,105,110,32,98,121,116,101,115,0] /*   -S, --volume-size= */, "i8", ALLOC_NONE, 5244116);
allocate([32,32,45,115,44,32,45,45,100,105,99,116,105,111,110,97,114,121,45,115,105,122,101,61,60,110,62,32,32,115,101,116,32,100,105,99,116,105,111,110,97,114,121,32,115,105,122,101,32,108,105,109,105,116,32,105,110,32,98,121,116,101,115,32,91,56,77,105,66,93,0] /*   -s, --dictionary-s */, "i8", ALLOC_NONE, 5244176);
allocate([32,32,45,113,44,32,45,45,113,117,105,101,116,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,115,117,112,112,114,101,115,115,32,97,108,108,32,109,101,115,115,97,103,101,115,0] /*   -q, --quiet        */, "i8", ALLOC_NONE, 5244248);
allocate([32,32,45,111,44,32,45,45,111,117,116,112,117,116,61,60,102,105,108,101,62,32,32,32,32,32,32,32,32,105,102,32,114,101,97,100,105,110,103,32,115,116,100,105,110,44,32,112,108,97,99,101,32,116,104,101,32,111,117,116,112,117,116,32,105,110,116,111,32,60,102,105,108,101,62,0] /*   -o, --output=_file */, "i8", ALLOC_NONE, 5244300);
allocate([32,32,45,109,44,32,45,45,109,97,116,99,104,45,108,101,110,103,116,104,61,60,110,62,32,32,32,32,32,115,101,116,32,109,97,116,99,104,32,108,101,110,103,116,104,32,108,105,109,105,116,32,105,110,32,98,121,116,101,115,32,91,51,54,93,0] /*   -m, --match-length */, "i8", ALLOC_NONE, 5244376);
allocate([10,79,112,116,105,111,110,115,58,0] /* \0AOptions:\00 */, "i8", ALLOC_NONE, 5244444);
allocate([60,60,32,77,111,115,116,32,111,102,32,116,104,101,115,101,32,97,114,101,32,117,110,115,117,112,112,111,114,116,101,100,46,32,67,111,109,112,114,101,115,115,105,110,103,47,100,101,99,111,109,112,114,101,115,115,105,110,103,32,102,114,111,109,32,115,116,100,105,110,32,116,111,32,115,116,100,111,117,116,32,105,115,32,116,104,101,32,114,105,103,104,116,32,119,97,121,33,32,62,62,0] /* __ Most of these are */, "i8", ALLOC_NONE, 5244456);
allocate(2048, "i8", ALLOC_NONE, 5244560);
allocate(24, "i8", ALLOC_NONE, 5246608);
allocate(4096, "i8", ALLOC_NONE, 5246632);
allocate(1024, "i8", ALLOC_NONE, 5250728);
allocate([66,97,100,32,109,97,103,105,99,32,110,117,109,98,101,114,32,40,102,105,108,101,32,110,111,116,32,105,110,32,108,122,105,112,32,102,111,114,109,97,116,41,0] /* Bad magic number (fi */, "i8", ALLOC_NONE, 5251752);
allocate([69,114,114,111,114,32,114,101,97,100,105,110,103,32,109,101,109,98,101,114,32,104,101,97,100,101,114,0] /* Error reading member */, "i8", ALLOC_NONE, 5251796);
allocate([108,122,105,112,0] /* lzip\00 */, "i8", ALLOC_NONE, 5251824);
allocate([73,102,32,110,111,32,102,105,108,101,32,110,97,109,101,115,32,97,114,101,32,103,105,118,101,110,44,32,37,115,32,99,111,109,112,114,101,115,115,101,115,32,111,114,32,100,101,99,111,109,112,114,101,115,115,101,115,10,0] /* If no file names are */, "i8", ALLOC_NONE, 5251832);
allocate([67,97,110,39,116,32,99,108,111,115,101,32,115,116,100,111,117,116,0] /* Can't close stdout\0 */, "i8", ALLOC_NONE, 5251892);
allocate([117,110,99,97,117,103,104,116,32,111,112,116,105,111,110,0] /* uncaught option\00 */, "i8", ALLOC_NONE, 5251912);
allocate([37,115,58,32,37,115,0] /* %s: %s\00 */, "i8", ALLOC_NONE, 5251928);
allocate([10,85,115,97,103,101,58,32,37,115,32,91,111,112,116,105,111,110,115,93,32,91,102,105,108,101,115,93,10,0] /* \0AUsage: %s [option */, "i8", ALLOC_NONE, 5251936);
allocate([37,115,32,45,32,68,97,116,97,32,99,111,109,112,114,101,115,115,111,114,32,98,97,115,101,100,32,111,110,32,116,104,101,32,76,90,77,65,32,97,108,103,111,114,105,116,104,109,46,10,0] /* %s - Data compressor */, "i8", ALLOC_NONE, 5251968);
allocate([76,122,105,112,0] /* Lzip\00 */, "i8", ALLOC_NONE, 5252020);
allocate([50,48,49,49,0] /* 2011\00 */, "i8", ALLOC_NONE, 5252028);
allocate([37,115,58,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,37,115,46,10,0] /* %s: internal error:  */, "i8", ALLOC_NONE, 5252036);
allocate([84,114,121,32,96,37,115,32,45,45,104,101,108,112,39,32,102,111,114,32,109,111,114,101,32,105,110,102,111,114,109,97,116,105,111,110,46,10,0] /* Try `%s --help' for  */, "i8", ALLOC_NONE, 5252064);
allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_NONE, 5252104);
allocate([67,111,112,121,114,105,103,104,116,32,40,67,41,32,37,115,32,65,110,116,111,110,105,111,32,68,105,97,122,32,68,105,97,122,46,10,0] /* Copyright (C) %s Ant */, "i8", ALLOC_NONE, 5252120);
allocate([49,46,49,50,0] /* 1.12\00 */, "i8", ALLOC_NONE, 5252160);
allocate([37,115,32,37,115,10,0] /* %s %s\0A\00 */, "i8", ALLOC_NONE, 5252168);
allocate([73,32,119,111,110,39,116,32,114,101,97,100,32,99,111,109,112,114,101,115,115,101,100,32,100,97,116,97,32,102,114,111,109,32,97,32,116,101,114,109,105,110,97,108,46,0] /* I won't read compres */, "i8", ALLOC_NONE, 5252176);
allocate([73,32,119,111,110,39,116,32,119,114,105,116,101,32,99,111,109,112,114,101,115,115,101,100,32,100,97,116,97,32,116,111,32,97,32,116,101,114,109,105,110,97,108,46,0] /* I won't write compre */, "i8", ALLOC_NONE, 5252224);
allocate([37,54,46,51,102,58,49,44,32,37,54,46,51,102,32,98,105,116,115,47,98,121,116,101,44,32,37,53,46,50,102,37,37,32,115,97,118,101,100,44,32,37,108,108,100,32,105,110,44,32,37,108,108,100,32,111,117,116,46,10,0] /* %6.3f:1, %6.3f bits/ */, "i8", ALLOC_NONE, 5252272);
allocate([78,111,32,100,97,116,97,32,99,111,109,112,114,101,115,115,101,100,46,10,0] /* No data compressed.\ */, "i8", ALLOC_NONE, 5252336);
allocate([82,101,97,100,32,101,114,114,111,114,0] /* Read error\00 */, "i8", ALLOC_NONE, 5252360);
allocate([69,110,99,111,100,101,114,32,101,114,114,111,114,0] /* Encoder error\00 */, "i8", ALLOC_NONE, 5252372);
allocate([105,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,32,116,111,32,101,110,99,111,100,101,114,0] /* invalid argument to  */, "i8", ALLOC_NONE, 5252388);
allocate([37,108,108,100,32,37,115,0] /* %lld %s\00 */, "i8", ALLOC_NONE, 5252416);
allocate(1, "i8", ALLOC_NONE, 5252424);
allocate([89,105,0] /* Yi\00 */, "i8", ALLOC_NONE, 5252428);
allocate([90,105,0] /* Zi\00 */, "i8", ALLOC_NONE, 5252432);
allocate([69,105,0] /* Ei\00 */, "i8", ALLOC_NONE, 5252436);
allocate([84,105,0] /* Ti\00 */, "i8", ALLOC_NONE, 5252440);
allocate([87,114,105,116,101,32,101,114,114,111,114,0] /* Write error\00 */, "i8", ALLOC_NONE, 5252444);
allocate([71,105,0] /* Gi\00 */, "i8", ALLOC_NONE, 5252456);
allocate([77,105,0] /* Mi\00 */, "i8", ALLOC_NONE, 5252460);
allocate([75,105,0] /* Ki\00 */, "i8", ALLOC_NONE, 5252464);
allocate([100,111,110,101,10,0] /* done\0A\00 */, "i8", ALLOC_NONE, 5252468);
allocate([58,32,37,115,0] /* : %s\00 */, "i8", ALLOC_NONE, 5252476);
allocate([111,107,10,0] /* ok\0A\00 */, "i8", ALLOC_NONE, 5252484);
allocate([68,101,99,111,100,101,114,32,101,114,114,111,114,32,97,116,32,112,111,115,32,37,108,108,100,10,0] /* Decoder error at pos */, "i8", ALLOC_NONE, 5252488);
allocate([70,105,108,101,32,101,110,100,115,32,117,110,101,120,112,101,99,116,101,100,108,121,32,97,116,32,112,111,115,32,37,108,108,100,10,0] /* File ends unexpected */, "i8", ALLOC_NONE, 5252516);
allocate([118,101,114,115,105,111,110,32,37,100,44,32,100,105,99,116,105,111,110,97,114,121,32,115,105,122,101,32,37,55,115,66,46,32,32,0] /* version %d, dictiona */, "i8", ALLOC_NONE, 5252552);
allocate([112,111,115,32,62,32,115,116,114,101,97,109,95,112,111,115,32,105,110,32,77,97,116,99,104,102,105,110,100,101,114,58,58,109,111,118,101,95,112,111,115,0] /* pos _ stream_pos in  */, "i8", ALLOC_NONE, 5252588);
allocate([73,110,118,97,108,105,100,32,100,105,99,116,105,111,110,97,114,121,32,115,105,122,101,32,105,110,32,109,101,109,98,101,114,32,104,101,97,100,101,114,0] /* Invalid dictionary s */, "i8", ALLOC_NONE, 5252632);
allocate([86,101,114,115,105,111,110,32,37,100,32,109,101,109,98,101,114,32,102,111,114,109,97,116,32,110,111,116,32,115,117,112,112,111,114,116,101,100,46,10,0] /* Version %d member fo */, "i8", ALLOC_NONE, 5252676);
allocate([82,97,110,103,101,32,100,101,99,111,100,101,114,32,102,105,110,97,108,32,99,111,100,101,32,105,115,32,110,111,116,32,122,101,114,111,0] /* Range decoder final  */, "i8", ALLOC_NONE, 5252720);
allocate(468, "i8", ALLOC_NONE, 5252760);
allocate([7,7,7,7,7,7,7,10,10,10,10,10] /* \07\07\07\07\07\07\0 */, "i8", ALLOC_NONE, 5253228);
allocate([0,0,0,0,1,2,3,4,5,6,4,5] /* \00\00\00\00\01\02\0 */, "i8", ALLOC_NONE, 5253240);
allocate([8,8,8,8,8,8,8,11,11,11,11,11] /* \08\08\08\08\08\08\0 */, "i8", ALLOC_NONE, 5253252);
allocate([9,9,9,9,9,9,9,11,11,11,11,11] /* \09\09\09\09\09\09\0 */, "i8", ALLOC_NONE, 5253264);
allocate(32, "i8", ALLOC_NONE, 5253276);
allocate(16, "i8", ALLOC_NONE, 5253308);
allocate([0,0,0,0,136,41,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5253324);
allocate(1, "i8", ALLOC_NONE, 5253344);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,148,41,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
allocate(1, "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,160,41,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
allocate(1, "i8", ALLOC_STATIC);
allocate([83,116,57,116,121,112,101,95,105,110,102,111,0] /* St9type_info\00 */, "i8", ALLOC_NONE, 5253348);
allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_NONE, 5253364);
allocate([80,105,0] /* Pi\00 */, "i8", ALLOC_NONE, 5253380);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv120__si_ */, "i8", ALLOC_NONE, 5253384);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv117__cla */, "i8", ALLOC_NONE, 5253424);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv116__shi */, "i8", ALLOC_NONE, 5253460);
allocate([53,69,114,114,111,114,0] /* 5Error\00 */, "i8", ALLOC_NONE, 5253496);
allocate(8, "i8", ALLOC_NONE, 5253504);
allocate(12, "i8", ALLOC_NONE, 5253512);
allocate([0,0,0,0,0,0,0,0,160,41,80,0], "i8", ALLOC_NONE, 5253524);
allocate([0,0,0,0,0,0,0,0,172,41,80,0], "i8", ALLOC_NONE, 5253536);
allocate([0,0,0,0,0,0,0,0,128,41,80,0], "i8", ALLOC_NONE, 5253548);
allocate(8, "i8", ALLOC_NONE, 5253560);
allocate(4, "i8", ALLOC_NONE, 5253568);
allocate(4, "i8", ALLOC_NONE, 5253572);
allocate(4, "i8", ALLOC_NONE, 5253576);
allocate(4, "i8", ALLOC_NONE, 5253580);
allocate([76,90,73,80] /* LZIP */, "i8", ALLOC_NONE, 5253584);
HEAP32[((5253276)>>2)]=((5252464)|0);
HEAP32[((5253280)>>2)]=((5252460)|0);
HEAP32[((5253284)>>2)]=((5252456)|0);
HEAP32[((5253288)>>2)]=((5252440)|0);
HEAP32[((5253292)>>2)]=((5253380)|0);
HEAP32[((5253296)>>2)]=((5252436)|0);
HEAP32[((5253300)>>2)]=((5252432)|0);
HEAP32[((5253304)>>2)]=((5252428)|0);
HEAP32[((5253332)>>2)]=(4);
HEAP32[((5253336)>>2)]=(18);
HEAP32[((5253340)>>2)]=(10);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(8))>>2)]=(30);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(12))>>2)]=(14);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(16))>>2)]=(12);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(20))>>2)]=(32);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(24))>>2)]=(28);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(28))>>2)]=(24);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(32))>>2)]=(6);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(36))>>2)]=(2);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(8))>>2)]=(22);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(12))>>2)]=(26);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(16))>>2)]=(12);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(20))>>2)]=(32);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(24))>>2)]=(28);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(28))>>2)]=(8);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(32))>>2)]=(20);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(36))>>2)]=(16);
HEAP32[((5253504)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5253508)>>2)]=((5253348)|0);
HEAP32[((5253512)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5253516)>>2)]=((5253364)|0);
HEAP32[((5253520)>>2)]=__ZTISt9exception;
HEAP32[((5253524)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5253528)>>2)]=((5253384)|0);
HEAP32[((5253536)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5253540)>>2)]=((5253424)|0);
HEAP32[((5253548)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5253552)>>2)]=((5253460)|0);
HEAP32[((5253560)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5253564)>>2)]=((5253496)|0);

  
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;

  
  
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
  
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
  
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
  
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
  
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
    
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
    
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
    
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
    
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
    
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.ensureObjects();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
  
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
  
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
  
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
  
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
  
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray || contents.slice) { // typed array or normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }

  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
  
  
      exitRuntime();
      ABORT = true;
  
      throw 'exit(' + status + ') called, at ' + new Error().stack;
    }function _exit(status) {
      __exit(status);
    }

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  function ___gxx_personality_v0() {
    }

  
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }function ___cxa_find_matching_catch(thrown, throwntype, typeArray) {
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return (tempRet0 = typeArray[i],thrown);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return (tempRet0 = throwntype,thrown);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }

  function _llvm_umul_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return (tempRet0 = x*y > 4294967295,(x*y)>>>0);
    }

  
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num);
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;

  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }

  function _memcmp(p1, p2, num) {
      p1 = p1|0; p2 = p2|0; num = num|0;
      var i = 0, v1 = 0, v2 = 0;
      while ((i|0) < (num|0)) {
        var v1 = HEAPU8[(((p1)+(i))|0)];
        var v2 = HEAPU8[(((p2)+(i))|0)];
        if ((v1|0) != (v2|0)) return ((v1|0) > (v2|0) ? 1 : -1)|0;
        i = (i+1)|0;
      }
      return 0;
    }

  
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }

  
  function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],HEAPF64[(tempDoublePtr)>>3]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == '%'.charCodeAt(0)) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case '+'.charCodeAt(0):
                flagAlwaysSigned = true;
                break;
              case '-'.charCodeAt(0):
                flagLeftAlign = true;
                break;
              case '#'.charCodeAt(0):
                flagAlternative = true;
                break;
              case '0'.charCodeAt(0):
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 'l'.charCodeAt(0)) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          if (['d', 'i', 'u', 'o', 'x', 'X', 'p'].indexOf(String.fromCharCode(next)) != -1) {
            // Integer.
            var signed = next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0);
            argSize = argSize || 4;
            var currArg = getNextArg('i' + (argSize * 8));
            var origArg = currArg;
            var argText;
            // Flatten i64-1 [low, high] into a (slightly rounded) double
            if (argSize == 8) {
              currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 'u'.charCodeAt(0));
            }
            // Truncate to requested size.
            if (argSize <= 4) {
              var limit = Math.pow(256, argSize) - 1;
              currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
            }
            // Format the number.
            var currAbsArg = Math.abs(currArg);
            var prefix = '';
            if (next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
              argText = reSign(currArg, 8 * argSize, 1).toString(10);
            } else if (next == 'u'.charCodeAt(0)) {
              if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
              argText = unSign(currArg, 8 * argSize, 1).toString(10);
              currArg = Math.abs(currArg);
            } else if (next == 'o'.charCodeAt(0)) {
              argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
            } else if (next == 'x'.charCodeAt(0) || next == 'X'.charCodeAt(0)) {
              prefix = flagAlternative ? '0x' : '';
              if (argSize == 8 && i64Math) argText = (origArg[1]>>>0).toString(16) + (origArg[0]>>>0).toString(16); else
              if (currArg < 0) {
                // Represent negative numbers in hex as 2's complement.
                currArg = -currArg;
                argText = (currAbsArg - 1).toString(16);
                var buffer = [];
                for (var i = 0; i < argText.length; i++) {
                  buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                }
                argText = buffer.join('');
                while (argText.length < argSize * 2) argText = 'f' + argText;
              } else {
                argText = currAbsArg.toString(16);
              }
              if (next == 'X'.charCodeAt(0)) {
                prefix = prefix.toUpperCase();
                argText = argText.toUpperCase();
              }
            } else if (next == 'p'.charCodeAt(0)) {
              if (currAbsArg === 0) {
                argText = '(nil)';
              } else {
                prefix = '0x';
                argText = currAbsArg.toString(16);
              }
            }
            if (precisionSet) {
              while (argText.length < precision) {
                argText = '0' + argText;
              }
            }
  
            // Add sign if needed
            if (flagAlwaysSigned) {
              if (currArg < 0) {
                prefix = '-' + prefix;
              } else {
                prefix = '+' + prefix;
              }
            }
  
            // Add padding.
            while (prefix.length + argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad) {
                  argText = '0' + argText;
                } else {
                  prefix = ' ' + prefix;
                }
              }
            }
  
            // Insert the result into the buffer.
            argText = prefix + argText;
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (['f', 'F', 'e', 'E', 'g', 'G'].indexOf(String.fromCharCode(next)) != -1) {
            // Float.
            var currArg = getNextArg('double');
            var argText;
  
            if (isNaN(currArg)) {
              argText = 'nan';
              flagZeroPad = false;
            } else if (!isFinite(currArg)) {
              argText = (currArg < 0 ? '-' : '') + 'inf';
              flagZeroPad = false;
            } else {
              var isGeneral = false;
              var effectivePrecision = Math.min(precision, 20);
  
              // Convert g/G to f/F or e/E, as per:
              // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
              if (next == 'g'.charCodeAt(0) || next == 'G'.charCodeAt(0)) {
                isGeneral = true;
                precision = precision || 1;
                var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                if (precision > exponent && exponent >= -4) {
                  next = ((next == 'g'.charCodeAt(0)) ? 'f' : 'F').charCodeAt(0);
                  precision -= exponent + 1;
                } else {
                  next = ((next == 'g'.charCodeAt(0)) ? 'e' : 'E').charCodeAt(0);
                  precision--;
                }
                effectivePrecision = Math.min(precision, 20);
              }
  
              if (next == 'e'.charCodeAt(0) || next == 'E'.charCodeAt(0)) {
                argText = currArg.toExponential(effectivePrecision);
                // Make sure the exponent has at least 2 digits.
                if (/[eE][-+]\d$/.test(argText)) {
                  argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                }
              } else if (next == 'f'.charCodeAt(0) || next == 'F'.charCodeAt(0)) {
                argText = currArg.toFixed(effectivePrecision);
              }
  
              var parts = argText.split('e');
              if (isGeneral && !flagAlternative) {
                // Discard trailing zeros and periods.
                while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                       (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                  parts[0] = parts[0].slice(0, -1);
                }
              } else {
                // Make sure we have a period in alternative mode.
                if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                // Zero pad until required precision.
                while (precision > effectivePrecision++) parts[0] += '0';
              }
              argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
              // Capitalize 'E' if needed.
              if (next == 'E'.charCodeAt(0)) argText = argText.toUpperCase();
  
              // Add sign.
              if (flagAlwaysSigned && currArg >= 0) {
                argText = '+' + argText;
              }
            }
  
            // Add padding.
            while (argText.length < width) {
              if (flagLeftAlign) {
                argText += ' ';
              } else {
                if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                  argText = argText[0] + '0' + argText.slice(1);
                } else {
                  argText = (flagZeroPad ? '0' : ' ') + argText;
                }
              }
            }
  
            // Adjust case.
            if (next < 'a'.charCodeAt(0)) argText = argText.toUpperCase();
  
            // Insert the result into the buffer.
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (next == 's'.charCodeAt(0)) {
            // String.
            var arg = getNextArg('i8*') || nullString;
            var argLength = _strlen(arg);
            if (precisionSet) argLength = Math.min(argLength, precision);
            if (!flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            for (var i = 0; i < argLength; i++) {
              ret.push(HEAPU8[((arg++)|0)]);
            }
            if (flagLeftAlign) {
              while (argLength < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
          } else if (next == 'c'.charCodeAt(0)) {
            // Character.
            if (flagLeftAlign) ret.push(getNextArg('i8'));
            while (--width > 0) {
              ret.push(' '.charCodeAt(0));
            }
            if (!flagLeftAlign) ret.push(getNextArg('i8'));
          } else if (next == 'n'.charCodeAt(0)) {
            // Write the length written so far to the next parameter.
            var ptr = getNextArg('i32*');
            HEAP32[((ptr)>>2)]=ret.length
          } else if (next == '%'.charCodeAt(0)) {
            // Literal percent sign.
            ret.push(curr);
          } else {
            // Unknown specifiers remain untouched.
            for (var i = startTextIndex; i < textIndex + 2; i++) {
              ret.push(HEAP8[(i)]);
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }

  
  
  var ERRNO_MESSAGES={1:"Operation not permitted",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"Input/output error",6:"No such device or address",8:"Exec format error",9:"Bad file descriptor",10:"No child processes",11:"Resource temporarily unavailable",12:"Cannot allocate memory",13:"Permission denied",14:"Bad address",16:"Device or resource busy",17:"File exists",18:"Invalid cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Inappropriate ioctl for device",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read-only file system",31:"Too many links",32:"Broken pipe",33:"Numerical argument out of domain",34:"Numerical result out of range",35:"Resource deadlock avoided",36:"File name too long",37:"No locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many levels of symbolic links",42:"No message of desired type",43:"Identifier removed",60:"Device not a stream",61:"No data available",62:"Timer expired",63:"Out of streams resources",67:"Link has been severed",71:"Protocol error",72:"Multihop attempted",74:"Bad message",75:"Value too large for defined data type",84:"Invalid or incomplete multibyte or wide character",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Protocol not supported",95:"Operation not supported",97:"Address family not supported by protocol",98:"Address already in use",99:"Cannot assign requested address",100:"Network is down",101:"Network is unreachable",102:"Network dropped connection on reset",103:"Software caused connection abort",104:"Connection reset by peer",105:"No buffer space available",106:"Transport endpoint is already connected",107:"Transport endpoint is not connected",110:"Connection timed out",111:"Connection refused",113:"No route to host",114:"Operation already in progress",115:"Operation now in progress",116:"Stale NFS file handle",122:"Disk quota exceeded",125:"Operation canceled",130:"Owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }

  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }

  function _isatty(fildes) {
      // int isatty(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/isatty.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      if (FS.streams[fildes].isTerminal) return 1;
      ___setErrNo(ERRNO_CODES.ENOTTY);
      return 0;
    }

  
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if (num|0 >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;

  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  var _llvm_memset_p0i8_i64=_memset;

  function __ZNSt9exceptionD2Ev(){}

  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
  
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }


  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }

  function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc('\n'.charCodeAt(0), stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }





  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],ensureObjects:function () {
        if (Browser.ensured) return;
        Browser.ensured = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
  
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false,
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},requestFullScreen:function () {
        var canvas = Module['canvas'];
        function fullScreenChange() {
          var isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                        canvas['mozRequestPointerLock'] ||
                                        canvas['webkitRequestPointerLock'];
            canvas.requestPointerLock();
            isFullScreen = true;
          }
          if (Module['onFullScreen']) Module['onFullScreen'](isFullScreen);
        }
  
        document.addEventListener('fullscreenchange', fullScreenChange, false);
        document.addEventListener('mozfullscreenchange', fullScreenChange, false);
        document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      }};
___setErrNo(0);
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function() { Browser.requestFullScreen() };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  


var FUNCTION_TABLE = [0,0,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNSt9bad_allocD1Ev,0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZNKSt9bad_alloc4whatEv,0,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,0,__ZN10__cxxabiv120__si_class_type_infoD0Ev,0,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,__ZNSt9bad_allocD0Ev,0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,__ZN10__cxxabiv117__class_type_infoD1Ev,0,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,__ZN10__cxxabiv117__class_type_infoD0Ev,0,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,__ZN10__cxxabiv120__si_class_type_infoD1Ev,0,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,0];

function __ZN12File_trailer4sizeEi(r1) {
  return (r1 | 0) > 0 ? 20 : 12;
}
function __ZNK13Range_decoder15member_positionEv(r1, r2, r3) {
  var r4;
  r4 = (i64Math.add(r3, (r3 | 0) < 0 ? -1 : 0, r1, r2), HEAP32[tempDoublePtr >> 2]);
  return tempRet0 = HEAP32[tempDoublePtr + 4 >> 2], r4;
}
function __ZNK13Range_decoder12code_is_zeroEv(r1) {
  return (r1 | 0) == 0;
}
function __ZNK10LZ_decoder3crcEv(r1) {
  return r1 ^ -1;
}
function __ZNK10LZ_decoder13data_positionEv(r1, r2, r3) {
  var r4;
  r4 = (i64Math.add(r3, (r3 | 0) < 0 ? -1 : 0, r1, r2), HEAP32[tempDoublePtr >> 2]);
  return tempRet0 = HEAP32[tempDoublePtr + 4 >> 2], r4;
}
function __ZNK5CRC326updateERjPKhi(r1, r2, r3) {
  var r4, r5, r6, r7;
  if ((r3 | 0) <= 0) {
    return;
  }
  r4 = 0;
  r5 = HEAP32[r1 >> 2];
  while (1) {
    r6 = HEAP32[((HEAPU8[r2 + r4 | 0] ^ r5 & 255) << 2) + 5250728 >> 2] ^ r5 >>> 8;
    HEAP32[r1 >> 2] = r6;
    r7 = r4 + 1 | 0;
    if ((r7 | 0) == (r3 | 0)) {
      break;
    } else {
      r4 = r7;
      r5 = r6;
    }
  }
  return;
}
function __ZN12File_trailer11member_sizeEx(r1, r2, r3) {
  HEAP8[r1 + 12 | 0] = r2 & 255;
  HEAP8[r1 + 13 | 0] = (r2 >>> 8 | r3 << 24) & 255;
  HEAP8[r1 + 14 | 0] = (r2 >>> 16 | r3 << 16) & 255;
  HEAP8[r1 + 15 | 0] = (r2 >>> 24 | r3 << 8) & 255;
  HEAP8[r1 + 16 | 0] = r3 & 255;
  HEAP8[r1 + 17 | 0] = (r3 >>> 8 | 0 << 24) & 255;
  HEAP8[r1 + 18 | 0] = (r3 >>> 16 | 0 << 16) & 255;
  HEAP8[r1 + 19 | 0] = (r3 >>> 24 | 0 << 8) & 255;
  return;
}
function __ZNK12File_trailer8data_crcEv(r1) {
  return HEAPU8[r1 | 0] | (HEAPU8[r1 + 1 | 0] | (HEAPU8[r1 + 2 | 0] | HEAPU8[r1 + 3 | 0] << 8) << 8) << 8;
}
function __ZNK12File_trailer9data_sizeEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8;
  r2 = HEAPU8[r1 + 11 | 0];
  r3 = HEAPU8[r1 + 10 | 0] | (r2 << 8 | 0 >>> 24);
  r4 = HEAPU8[r1 + 9 | 0] | (r3 << 8 | 0 >>> 24);
  r5 = HEAPU8[r1 + 8 | 0] | (r4 << 8 | 0 >>> 24);
  r6 = HEAPU8[r1 + 7 | 0] | (r5 << 8 | 0 >>> 24);
  r7 = HEAPU8[r1 + 6 | 0] | (r6 << 8 | 0 >>> 24);
  r8 = HEAPU8[r1 + 5 | 0] | (r7 << 8 | 0 >>> 24);
  return tempRet0 = 0 | (((((((0 << 8 | r2 >>> 24) << 8 | r3 >>> 24) << 8 | r4 >>> 24) << 8 | r5 >>> 24) << 8 | r6 >>> 24) << 8 | r7 >>> 24) << 8 | r8 >>> 24), HEAPU8[r1 + 4 | 0] | (r8 << 8 | 0 >>> 24);
}
__ZNK12File_trailer9data_sizeEv["X"] = 1;
function __ZNK12File_trailer11member_sizeEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8;
  r2 = HEAPU8[r1 + 19 | 0];
  r3 = HEAPU8[r1 + 18 | 0] | (r2 << 8 | 0 >>> 24);
  r4 = HEAPU8[r1 + 17 | 0] | (r3 << 8 | 0 >>> 24);
  r5 = HEAPU8[r1 + 16 | 0] | (r4 << 8 | 0 >>> 24);
  r6 = HEAPU8[r1 + 15 | 0] | (r5 << 8 | 0 >>> 24);
  r7 = HEAPU8[r1 + 14 | 0] | (r6 << 8 | 0 >>> 24);
  r8 = HEAPU8[r1 + 13 | 0] | (r7 << 8 | 0 >>> 24);
  return tempRet0 = 0 | (((((((0 << 8 | r2 >>> 24) << 8 | r3 >>> 24) << 8 | r4 >>> 24) << 8 | r5 >>> 24) << 8 | r6 >>> 24) << 8 | r7 >>> 24) << 8 | r8 >>> 24), HEAPU8[r1 + 12 | 0] | (r8 << 8 | 0 >>> 24);
}
__ZNK12File_trailer11member_sizeEv["X"] = 1;
function ___cxx_global_var_init() {
  __ZN5CRC32C1Ev();
  return;
}
function __ZN5CRC32C1Ev() {
  __ZN5CRC32C2Ev();
  return;
}
function __Z9readblockiPhi(r1, r2, r3) {
  var r4, r5, r6, r7, r8;
  r4 = ___errno_location();
  HEAP32[r4 >> 2] = 0;
  L19 : do {
    if ((r3 | 0) > 0) {
      r4 = r3;
      while (1) {
        r5 = r2 + (r3 - r4) | 0;
        while (1) {
          r6 = ___errno_location();
          HEAP32[r6 >> 2] = 0;
          r7 = _read(r1, r5, r4);
          if ((r7 | 0) > 0) {
            break;
          }
          if ((r7 | 0) == 0) {
            r8 = r4;
            break L19;
          }
          r6 = ___errno_location();
          if ((HEAP32[r6 >> 2] | 0) == 4) {
            continue;
          }
          r6 = ___errno_location();
          if ((HEAP32[r6 >> 2] | 0) != 11) {
            r8 = r4;
            break L19;
          }
        }
        r5 = r4 - r7 | 0;
        if ((r5 | 0) > 0) {
          r4 = r5;
        } else {
          r8 = 0;
          break L19;
        }
      }
    } else {
      r8 = 0;
    }
  } while (0);
  return r3 - r8 | 0;
}
function __Z10writeblockiPKhi(r1, r2, r3) {
  var r4, r5, r6, r7, r8;
  r4 = ___errno_location();
  HEAP32[r4 >> 2] = 0;
  L30 : do {
    if ((r3 | 0) > 0) {
      r4 = r3;
      while (1) {
        r5 = r2 + (r3 - r4) | 0;
        while (1) {
          r6 = ___errno_location();
          HEAP32[r6 >> 2] = 0;
          r7 = _write(r1, r5, r4);
          if ((r7 | 0) > 0) {
            break;
          }
          r6 = ___errno_location();
          if ((HEAP32[r6 >> 2] | 0) == 0) {
            continue;
          }
          r6 = ___errno_location();
          if ((HEAP32[r6 >> 2] | 0) == 4) {
            continue;
          }
          r6 = ___errno_location();
          if ((HEAP32[r6 >> 2] | 0) != 11) {
            r8 = r4;
            break L30;
          }
        }
        r5 = r4 - r7 | 0;
        if ((r5 | 0) > 0) {
          r4 = r5;
        } else {
          r8 = 0;
          break L30;
        }
      }
    } else {
      r8 = 0;
    }
  } while (0);
  return r3 - r8 | 0;
}
function __ZN13Range_decoder10read_blockEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8;
  r2 = r1 + 32 | 0;
  if ((HEAP8[r2] & 1) << 24 >> 24 != 0) {
    r3 = HEAP32[r1 + 12 >> 2];
    r4 = HEAP32[r1 + 16 >> 2];
    r5 = (r3 | 0) < (r4 | 0);
    return r5;
  }
  r6 = __Z9readblockiPhi(HEAP32[r1 + 28 >> 2], HEAP32[r1 + 8 >> 2], 16384);
  r7 = r1 + 16 | 0;
  HEAP32[r7 >> 2] = r6;
  do {
    if ((r6 | 0) != 16384) {
      r8 = ___errno_location();
      if ((HEAP32[r8 >> 2] | 0) == 0) {
        break;
      }
      _exit(-1);
    }
  } while (0);
  r6 = HEAP32[r7 >> 2];
  HEAP8[r2] = (r6 | 0) < 16384 & 1;
  r2 = r1 + 12 | 0;
  r7 = HEAP32[r2 >> 2];
  r8 = (r1 | 0) >> 2;
  r1 = (i64Math.add(HEAP32[r8], HEAP32[r8 + 1], r7, (r7 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
  r7 = HEAP32[tempDoublePtr + 4 >> 2];
  HEAP32[r8] = r1;
  HEAP32[r8 + 1] = r7;
  HEAP32[r2 >> 2] = 0;
  r3 = 0;
  r4 = r6;
  r5 = (r3 | 0) < (r4 | 0);
  return r5;
}
function __ZN10LZ_decoder10flush_dataEv(r1) {
  var r2, r3, r4, r5, r6, r7;
  r2 = (r1 + 20 | 0) >> 2;
  r3 = (r1 + 24 | 0) >> 2;
  r4 = HEAP32[r3];
  r5 = HEAP32[r2] - r4 | 0;
  if ((r5 | 0) <= 0) {
    return;
  }
  r6 = r1 + 16 | 0;
  __ZNK5CRC326updateERjPKhi(r1 + 28 | 0, HEAP32[r6 >> 2] + r4 | 0, r5);
  r4 = HEAP32[r1 + 32 >> 2];
  do {
    if ((r4 | 0) > -1) {
      if ((__Z10writeblockiPKhi(r4, HEAP32[r6 >> 2] + HEAP32[r3] | 0, r5) | 0) == (r5 | 0)) {
        break;
      }
      _exit(-1);
    }
  } while (0);
  r5 = HEAP32[r2];
  if ((r5 | 0) < (HEAP32[r1 + 12 >> 2] | 0)) {
    r7 = r5;
  } else {
    r6 = (r1 | 0) >> 2;
    r1 = (i64Math.add(HEAP32[r6], HEAP32[r6 + 1], r5, (r5 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
    r5 = HEAP32[tempDoublePtr + 4 >> 2];
    HEAP32[r6] = r1;
    HEAP32[r6 + 1] = r5;
    HEAP32[r2] = 0;
    r7 = 0;
  }
  HEAP32[r3] = r7;
  return;
}
function __ZNK10LZ_decoder14verify_trailerEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18;
  r2 = STACKTOP;
  STACKTOP = STACKTOP + 20 | 0;
  r3 = r2;
  r4 = r1 + 36 | 0;
  r5 = HEAP32[r4 >> 2];
  r6 = __ZN12File_trailer4sizeEi(r5);
  r7 = (r1 + 40 | 0) >> 2;
  r8 = HEAP32[r7];
  r9 = r8 | 0;
  r10 = (i64Math.add(__ZNK13Range_decoder15member_positionEv(HEAP32[r9 >> 2], HEAP32[r9 + 4 >> 2], HEAP32[r8 + 12 >> 2]), tempRet0, r6, (r6 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
  r8 = HEAP32[tempDoublePtr + 4 >> 2];
  if ((r6 | 0) > 0) {
    r9 = 0;
    r11 = 0;
    while (1) {
      if ((r9 & 1) << 24 >> 24 != 0) {
        r12 = r9;
        break;
      }
      do {
        if (__ZN13Range_decoder8finishedEv(HEAP32[r7])) {
          if ((r11 | 0) >= (r6 | 0)) {
            r13 = r11;
            r14 = 1;
            break;
          }
          _memset(r3 + r11 | 0, 0, r6 - r11 | 0);
          r13 = r6;
          r14 = 1;
        } else {
          r15 = __ZN13Range_decoder8get_byteEv(HEAP32[r7]);
          HEAP8[r3 + r11 | 0] = r15;
          r13 = r11;
          r14 = r9;
        }
      } while (0);
      r15 = r13 + 1 | 0;
      if ((r15 | 0) < (r6 | 0)) {
        r9 = r14;
        r11 = r15;
      } else {
        r12 = r14;
        break;
      }
    }
    r16 = r12;
    r17 = HEAP32[r4 >> 2];
  } else {
    r16 = 0;
    r17 = r5;
  }
  if ((r17 | 0) == 0) {
    __ZN12File_trailer11member_sizeEx(r3, r10, r8);
  }
  if (__ZNK13Range_decoder12code_is_zeroEv(HEAP32[HEAP32[r7] + 20 >> 2])) {
    r18 = r16;
  } else {
    __Z2ppPKc(5252720);
    r18 = 1;
  }
  r16 = (__ZNK12File_trailer8data_crcEv(r3) | 0) == (__ZNK10LZ_decoder3crcEv(HEAP32[r1 + 28 >> 2]) | 0);
  r7 = __ZNK12File_trailer9data_sizeEv(r3);
  r17 = tempRet0;
  r5 = r1 | 0;
  r4 = (r7 | 0) == (__ZNK10LZ_decoder13data_positionEv(HEAP32[r5 >> 2], HEAP32[r5 + 4 >> 2], HEAP32[r1 + 20 >> 2]) | 0) & (r17 | 0) == (tempRet0 | 0);
  r17 = (__ZNK12File_trailer11member_sizeEv(r3) | 0) == (r10 | 0) & (tempRet0 | 0) == (r8 | 0) & (r4 & (r16 & (r18 & 1) << 24 >> 24 == 0));
  STACKTOP = r2;
  return r17;
}
__ZNK10LZ_decoder14verify_trailerEv["X"] = 1;
function __ZN13Range_decoder8finishedEv(r1) {
  var r2;
  if ((HEAP32[r1 + 12 >> 2] | 0) < (HEAP32[r1 + 16 >> 2] | 0)) {
    r2 = 0;
    return r2;
  }
  r2 = __ZN13Range_decoder10read_blockEv(r1) ^ 1;
  return r2;
}
function __ZN13Range_decoder8get_byteEv(r1) {
  var r2, r3, r4;
  if (__ZN13Range_decoder8finishedEv(r1)) {
    r2 = 85;
    return r2;
  }
  r3 = r1 + 12 | 0;
  r4 = HEAP32[r3 >> 2];
  HEAP32[r3 >> 2] = r4 + 1 | 0;
  r2 = HEAP8[HEAP32[r1 + 8 >> 2] + r4 | 0];
  return r2;
}
function __ZN10LZ_decoder13decode_memberEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43, r44, r45, r46, r47, r48, r49;
  r2 = 0;
  r3 = STACKTOP;
  STACKTOP = STACKTOP + 29280 | 0;
  r4 = r3;
  r5 = r3 + 192;
  r6 = r3 + 240;
  r7 = r3 + 288;
  r8 = r3 + 336;
  r9 = r3 + 384;
  r10 = r3 + 576;
  r11 = r3 + 1600;
  r12 = r3 + 2060;
  r13 = r3 + 2124;
  r14 = r3 + 3412;
  r15 = r3 + 4700;
  r16 = r3 + 29276;
  r17 = r4 + 192 | 0;
  r18 = r4 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r18);
    r19 = r18 + 4 | 0;
    if ((r19 | 0) == (r17 | 0)) {
      break;
    } else {
      r18 = r19;
    }
  }
  __ZN9Bit_modelC1Ev(r5 | 0);
  __ZN9Bit_modelC1Ev(r5 + 4 | 0);
  __ZN9Bit_modelC1Ev(r5 + 8 | 0);
  __ZN9Bit_modelC1Ev(r5 + 12 | 0);
  __ZN9Bit_modelC1Ev(r5 + 16 | 0);
  __ZN9Bit_modelC1Ev(r5 + 20 | 0);
  __ZN9Bit_modelC1Ev(r5 + 24 | 0);
  __ZN9Bit_modelC1Ev(r5 + 28 | 0);
  __ZN9Bit_modelC1Ev(r5 + 32 | 0);
  __ZN9Bit_modelC1Ev(r5 + 36 | 0);
  __ZN9Bit_modelC1Ev(r5 + 40 | 0);
  __ZN9Bit_modelC1Ev(r5 + 44 | 0);
  __ZN9Bit_modelC1Ev(r6 | 0);
  __ZN9Bit_modelC1Ev(r6 + 4 | 0);
  __ZN9Bit_modelC1Ev(r6 + 8 | 0);
  __ZN9Bit_modelC1Ev(r6 + 12 | 0);
  __ZN9Bit_modelC1Ev(r6 + 16 | 0);
  __ZN9Bit_modelC1Ev(r6 + 20 | 0);
  __ZN9Bit_modelC1Ev(r6 + 24 | 0);
  __ZN9Bit_modelC1Ev(r6 + 28 | 0);
  __ZN9Bit_modelC1Ev(r6 + 32 | 0);
  __ZN9Bit_modelC1Ev(r6 + 36 | 0);
  __ZN9Bit_modelC1Ev(r6 + 40 | 0);
  __ZN9Bit_modelC1Ev(r6 + 44 | 0);
  __ZN9Bit_modelC1Ev(r7 | 0);
  __ZN9Bit_modelC1Ev(r7 + 4 | 0);
  __ZN9Bit_modelC1Ev(r7 + 8 | 0);
  __ZN9Bit_modelC1Ev(r7 + 12 | 0);
  __ZN9Bit_modelC1Ev(r7 + 16 | 0);
  __ZN9Bit_modelC1Ev(r7 + 20 | 0);
  __ZN9Bit_modelC1Ev(r7 + 24 | 0);
  __ZN9Bit_modelC1Ev(r7 + 28 | 0);
  __ZN9Bit_modelC1Ev(r7 + 32 | 0);
  __ZN9Bit_modelC1Ev(r7 + 36 | 0);
  __ZN9Bit_modelC1Ev(r7 + 40 | 0);
  __ZN9Bit_modelC1Ev(r7 + 44 | 0);
  __ZN9Bit_modelC1Ev(r8 | 0);
  __ZN9Bit_modelC1Ev(r8 + 4 | 0);
  __ZN9Bit_modelC1Ev(r8 + 8 | 0);
  __ZN9Bit_modelC1Ev(r8 + 12 | 0);
  __ZN9Bit_modelC1Ev(r8 + 16 | 0);
  __ZN9Bit_modelC1Ev(r8 + 20 | 0);
  __ZN9Bit_modelC1Ev(r8 + 24 | 0);
  __ZN9Bit_modelC1Ev(r8 + 28 | 0);
  __ZN9Bit_modelC1Ev(r8 + 32 | 0);
  __ZN9Bit_modelC1Ev(r8 + 36 | 0);
  __ZN9Bit_modelC1Ev(r8 + 40 | 0);
  __ZN9Bit_modelC1Ev(r8 + 44 | 0);
  r18 = r9 + 192 | 0;
  r17 = r9 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r17);
    r19 = r17 + 4 | 0;
    if ((r19 | 0) == (r18 | 0)) {
      break;
    } else {
      r17 = r19;
    }
  }
  r17 = r10 + 1024 | 0;
  r18 = r10 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r18);
    r19 = r18 + 4 | 0;
    if ((r19 | 0) == (r17 | 0)) {
      break;
    } else {
      r18 = r19;
    }
  }
  r18 = r11 + 460 | 0;
  r17 = r11 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r17);
    r19 = r17 + 4 | 0;
    if ((r19 | 0) == (r18 | 0)) {
      break;
    } else {
      r17 = r19;
    }
  }
  r17 = r12 | 0;
  __ZN9Bit_modelC1Ev(r17);
  __ZN9Bit_modelC1Ev(r12 + 4 | 0);
  __ZN9Bit_modelC1Ev(r12 + 8 | 0);
  __ZN9Bit_modelC1Ev(r12 + 12 | 0);
  __ZN9Bit_modelC1Ev(r12 + 16 | 0);
  __ZN9Bit_modelC1Ev(r12 + 20 | 0);
  __ZN9Bit_modelC1Ev(r12 + 24 | 0);
  __ZN9Bit_modelC1Ev(r12 + 28 | 0);
  __ZN9Bit_modelC1Ev(r12 + 32 | 0);
  __ZN9Bit_modelC1Ev(r12 + 36 | 0);
  __ZN9Bit_modelC1Ev(r12 + 40 | 0);
  __ZN9Bit_modelC1Ev(r12 + 44 | 0);
  __ZN9Bit_modelC1Ev(r12 + 48 | 0);
  __ZN9Bit_modelC1Ev(r12 + 52 | 0);
  __ZN9Bit_modelC1Ev(r12 + 56 | 0);
  __ZN9Bit_modelC1Ev(r12 + 60 | 0);
  __ZN11Len_decoderC1Ev(r13);
  __ZN11Len_decoderC1Ev(r14);
  __ZN15Literal_decoderC1Ev(r15);
  __ZN5StateC1Ev(r16);
  r12 = (r1 + 40 | 0) >> 2;
  __ZN13Range_decoder4loadEv(HEAP32[r12]);
  L103 : do {
    if (!__ZN13Range_decoder8finishedEv(HEAP32[r12])) {
      r18 = r1 + 8 | 0;
      r19 = r1 + 20 | 0;
      r20 = r1 | 0;
      r21 = r16 | 0;
      r22 = 0;
      r23 = 0;
      r24 = 0;
      r25 = 0;
      L105 : while (1) {
        while (1) {
          r26 = r20 | 0;
          r27 = r20 + 4 | 0;
          r28 = __ZNK10LZ_decoder13data_positionEv(HEAP32[r26 >> 2], HEAP32[r27 >> 2], HEAP32[r19 >> 2]) & 3;
          r29 = HEAP32[r12];
          r30 = HEAP8[r21];
          r31 = __ZNK5StateclEv(r30) & 255;
          if ((__ZN13Range_decoder10decode_bitER9Bit_model(r29, (r31 << 4) + (r28 << 2) + r4 | 0) | 0) == 0) {
            r29 = __ZNK10LZ_decoder13get_prev_byteEv(r1);
            r32 = __ZNK5State7is_charEv(r30);
            r30 = HEAP32[r12];
            if (r32) {
              __ZN10LZ_decoder8put_byteEh(r1, __ZN15Literal_decoder6decodeER13Range_decoderh(r15, r30, r29));
            } else {
              __ZN10LZ_decoder8put_byteEh(r1, __ZN15Literal_decoder14decode_matchedER13Range_decoderhh(r15, r30, r29, __ZNK10LZ_decoder8get_byteEi(r1, r25)));
            }
            __ZN5State8set_charEv(r16);
          } else {
            r29 = (__ZN13Range_decoder10decode_bitER9Bit_model(HEAP32[r12], (r31 << 2) + r5 | 0) | 0) == 1;
            r33 = HEAP32[r12];
            if (r29) {
              r2 = 94;
              break;
            }
            r29 = __ZN11Len_decoder6decodeER13Range_decoderi(r13, r33, r28);
            r34 = r29 + 2 | 0;
            r35 = __ZN13Range_decoder11decode_treeEP9Bit_modeli(HEAP32[r12], (__Z13get_dis_statei(r34) << 8) + r10 | 0, 6);
            if ((r35 | 0) < 4) {
              r36 = r35;
              r2 = 109;
              break;
            }
            r30 = r35 >> 1;
            r37 = r30 - 1 | 0;
            r38 = (r35 & 1 | 2) << r37;
            r39 = HEAP32[r12];
            if ((r35 | 0) < 14) {
              r2 = 102;
              break;
            }
            r32 = ((__ZN13Range_decoder6decodeEi(r39, r30 - 5 | 0) << 4) + r38 | 0) + __ZN13Range_decoder20decode_tree_reversedEP9Bit_modeli(HEAP32[r12], r17, 4) | 0;
            if ((r32 | 0) != -1) {
              r36 = r32;
              r2 = 109;
              break;
            }
            __ZN13Range_decoder9normalizeEv(HEAP32[r12]);
            __ZN10LZ_decoder10flush_dataEv(r1);
            if ((r29 | 0) == 0) {
              r2 = 105;
              break L105;
            }
            if ((r34 | 0) != 3) {
              r40 = 4;
              r2 = 117;
              break L105;
            }
            __ZN13Range_decoder4loadEv(HEAP32[r12]);
          }
          if (__ZN13Range_decoder8finishedEv(HEAP32[r12])) {
            break L103;
          }
        }
        L123 : do {
          if (r2 == 94) {
            r2 = 0;
            r29 = (__ZN13Range_decoder10decode_bitER9Bit_model(r33, (r31 << 2) + r6 | 0) | 0) == 1;
            r32 = HEAP32[r12];
            do {
              if (r29) {
                if ((__ZN13Range_decoder10decode_bitER9Bit_model(r32, (r31 << 2) + r7 | 0) | 0) == 0) {
                  r41 = r24;
                  r42 = r25;
                  r43 = r23;
                  r44 = r22;
                  break;
                }
                r30 = (__ZN13Range_decoder10decode_bitER9Bit_model(HEAP32[r12], (r31 << 2) + r8 | 0) | 0) == 0;
                r41 = r30 ? r23 : r22;
                r42 = r25;
                r43 = r24;
                r44 = r30 ? r22 : r23;
              } else {
                if ((__ZN13Range_decoder10decode_bitER9Bit_model(r32, (r31 << 4) + (r28 << 2) + r9 | 0) | 0) != 0) {
                  r41 = r25;
                  r42 = r24;
                  r43 = r23;
                  r44 = r22;
                  break;
                }
                __ZN5State13set_short_repEv(r16);
                r45 = r25;
                r46 = r24;
                r47 = 1;
                r48 = r23;
                r49 = r22;
                break L123;
              }
            } while (0);
            __ZN5State7set_repEv(r16);
            r45 = r41;
            r46 = r42;
            r47 = __ZN11Len_decoder6decodeER13Range_decoderi(r14, HEAP32[r12], r28) + 2 | 0;
            r48 = r43;
            r49 = r44;
            break;
          } else if (r2 == 102) {
            r2 = 0;
            r36 = __ZN13Range_decoder20decode_tree_reversedEP9Bit_modeli(r39, (r38 - r35 << 2) + r11 | 0, r37) + r38 | 0;
            r2 = 109;
            break;
          }
        } while (0);
        do {
          if (r2 == 109) {
            r2 = 0;
            __ZN5State9set_matchEv(r16);
            if (r36 >>> 0 >= HEAP32[r18 >> 2] >>> 0) {
              r2 = 112;
              break L105;
            }
            if (r36 >>> 0 < HEAP32[r19 >> 2] >>> 0) {
              r45 = r36;
              r46 = r25;
              r47 = r34;
              r48 = r24;
              r49 = r23;
              break;
            }
            r26 = r20 | 0;
            r27 = r20 + 4 | 0;
            if ((HEAP32[r26 >> 2] | 0) == 0 & (HEAP32[r27 >> 2] | 0) == 0) {
              r2 = 112;
              break L105;
            } else {
              r45 = r36;
              r46 = r25;
              r47 = r34;
              r48 = r24;
              r49 = r23;
            }
          }
        } while (0);
        __ZN10LZ_decoder10copy_blockEii(r1, r45, r47);
        if (__ZN13Range_decoder8finishedEv(HEAP32[r12])) {
          break L103;
        } else {
          r22 = r49;
          r23 = r48;
          r24 = r46;
          r25 = r45;
        }
      }
      if (r2 == 105) {
        r40 = __ZNK10LZ_decoder14verify_trailerEv(r1) ? 0 : 3;
        STACKTOP = r3;
        return r40;
      } else if (r2 == 112) {
        __ZN10LZ_decoder10flush_dataEv(r1);
        r40 = 1;
        STACKTOP = r3;
        return r40;
      } else if (r2 == 117) {
        STACKTOP = r3;
        return r40;
      }
    }
  } while (0);
  __ZN10LZ_decoder10flush_dataEv(r1);
  r40 = 2;
  STACKTOP = r3;
  return r40;
}
__ZN10LZ_decoder13decode_memberEv["X"] = 1;
function __ZN9Bit_modelC1Ev(r1) {
  __ZN9Bit_modelC2Ev(r1);
  return;
}
function __ZN11Len_decoderC1Ev(r1) {
  __ZN11Len_decoderC2Ev(r1);
  return;
}
function __ZN15Literal_decoderC1Ev(r1) {
  __ZN15Literal_decoderC2Ev(r1);
  return;
}
function __ZN5StateC1Ev(r1) {
  __ZN5StateC2Ev(r1);
  return;
}
function __ZNK5StateclEv(r1) {
  return r1;
}
function __ZNK5State7is_charEv(r1) {
  return (r1 & 255) < 7;
}
function __Z13get_dis_statei(r1) {
  var r2;
  r2 = r1 - 2 | 0;
  return (r2 | 0) > 3 ? 3 : r2;
}
function __ZNK15Literal_decoder6lstateEi(r1) {
  return r1 >> 5;
}
function __ZNK10LZ_decoder13get_prev_byteEv(r1) {
  var r2, r3;
  r2 = HEAP32[r1 + 20 >> 2];
  if ((r2 | 0) > 0) {
    r3 = r2;
  } else {
    r3 = HEAP32[r1 + 12 >> 2];
  }
  return HEAP8[HEAP32[r1 + 16 >> 2] + (r3 - 1) | 0];
}
function __ZNK10LZ_decoder8get_byteEi(r1, r2) {
  var r3, r4;
  r3 = HEAP32[r1 + 20 >> 2] - r2 - 1 | 0;
  if ((r3 | 0) < 0) {
    r4 = HEAP32[r1 + 12 >> 2] + r3 | 0;
  } else {
    r4 = r3;
  }
  return HEAP8[HEAP32[r1 + 16 >> 2] + r4 | 0];
}
function __ZN5State8set_charEv(r1) {
  var r2;
  r2 = r1 | 0;
  HEAP8[r2] = HEAP8[HEAPU8[r2] + 5253240 | 0];
  return;
}
function __ZN5State13set_short_repEv(r1) {
  var r2;
  r2 = r1 | 0;
  HEAP8[r2] = HEAP8[HEAPU8[r2] + 5253264 | 0];
  return;
}
function __ZN5State7set_repEv(r1) {
  var r2;
  r2 = r1 | 0;
  HEAP8[r2] = HEAP8[HEAPU8[r2] + 5253252 | 0];
  return;
}
function __ZN5State9set_matchEv(r1) {
  var r2;
  r2 = r1 | 0;
  HEAP8[r2] = HEAP8[HEAPU8[r2] + 5253228 | 0];
  return;
}
function __ZN5StateC2Ev(r1) {
  HEAP8[r1 | 0] = 0;
  return;
}
function __ZN9Bit_modelC2Ev(r1) {
  HEAP32[r1 >> 2] = 1024;
  return;
}
function __ZN5CRC32C2Ev() {
  var r1, r2, r3, r4;
  r1 = 0;
  while (1) {
    r2 = r1 >>> 1;
    r3 = (r1 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r3 >>> 1;
    r4 = (r3 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r4 >>> 1;
    r3 = (r4 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r3 >>> 1;
    r4 = (r3 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r4 >>> 1;
    r3 = (r4 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r3 >>> 1;
    r4 = (r3 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r4 >>> 1;
    r3 = (r4 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r3 >>> 1;
    HEAP32[(r1 << 2) + 5250728 >> 2] = (r3 & 1 | 0) == 0 ? r2 : r2 ^ -306674912;
    r2 = r1 + 1 | 0;
    if ((r2 | 0) == 256) {
      break;
    } else {
      r1 = r2;
    }
  }
  return;
}
function __ZN13Range_decoder4loadEv(r1) {
  var r2, r3, r4;
  r2 = (r1 + 20 | 0) >> 2;
  HEAP32[r2] = 0;
  HEAP32[r1 + 24 >> 2] = -1;
  r3 = __ZN13Range_decoder8get_byteEv(r1) & 255;
  HEAP32[r2] = r3;
  r4 = __ZN13Range_decoder8get_byteEv(r1) & 255 | r3 << 8;
  HEAP32[r2] = r4;
  r3 = __ZN13Range_decoder8get_byteEv(r1) & 255 | r4 << 8;
  HEAP32[r2] = r3;
  r4 = __ZN13Range_decoder8get_byteEv(r1) & 255 | r3 << 8;
  HEAP32[r2] = r4;
  r3 = __ZN13Range_decoder8get_byteEv(r1) & 255 | r4 << 8;
  HEAP32[r2] = r3;
  return;
}
function __ZN13Range_decoder10decode_bitER9Bit_model(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9;
  __ZN13Range_decoder9normalizeEv(r1);
  r3 = (r1 + 24 | 0) >> 2;
  r4 = HEAP32[r3];
  r5 = (r2 | 0) >> 2;
  r2 = Math.imul(r4 >>> 11, HEAP32[r5]);
  r6 = r1 + 20 | 0;
  r1 = HEAP32[r6 >> 2];
  if (r1 >>> 0 < r2 >>> 0) {
    HEAP32[r3] = r2;
    r7 = HEAP32[r5];
    r8 = 0;
    r9 = ((2048 - r7 | 0) >>> 5) + r7 | 0;
    HEAP32[r5] = r9;
    return r8;
  } else {
    HEAP32[r3] = r4 - r2 | 0;
    HEAP32[r6 >> 2] = r1 - r2 | 0;
    r2 = HEAP32[r5];
    r8 = 1;
    r9 = r2 - (r2 >>> 5) | 0;
    HEAP32[r5] = r9;
    return r8;
  }
}
function __ZN10LZ_decoder8put_byteEh(r1, r2) {
  var r3;
  r3 = (r1 + 20 | 0) >> 2;
  HEAP8[HEAP32[r1 + 16 >> 2] + HEAP32[r3] | 0] = r2;
  r2 = HEAP32[r3] + 1 | 0;
  HEAP32[r3] = r2;
  if ((r2 | 0) < (HEAP32[r1 + 12 >> 2] | 0)) {
    return;
  }
  __ZN10LZ_decoder10flush_dataEv(r1);
  return;
}
function __ZN15Literal_decoder6decodeER13Range_decoderh(r1, r2, r3) {
  return __ZN13Range_decoder11decode_treeEP9Bit_modeli(r2, r1 + (__ZNK15Literal_decoder6lstateEi(r3 & 255) * 3072 & -1) | 0, 8) & 255;
}
function __ZN15Literal_decoder14decode_matchedER13Range_decoderhh(r1, r2, r3, r4) {
  return __ZN13Range_decoder14decode_matchedEP9Bit_modeli(r2, r1 + (__ZNK15Literal_decoder6lstateEi(r3 & 255) * 3072 & -1) | 0, r4 & 255) & 255;
}
function __ZN11Len_decoder6decodeER13Range_decoderi(r1, r2, r3) {
  var r4;
  if ((__ZN13Range_decoder10decode_bitER9Bit_model(r2, r1 | 0) | 0) == 0) {
    r4 = __ZN13Range_decoder11decode_treeEP9Bit_modeli(r2, (r3 << 5) + r1 + 8 | 0, 3);
    return r4;
  }
  if ((__ZN13Range_decoder10decode_bitER9Bit_model(r2, r1 + 4 | 0) | 0) == 0) {
    r4 = __ZN13Range_decoder11decode_treeEP9Bit_modeli(r2, (r3 << 5) + r1 + 136 | 0, 3) + 8 | 0;
    return r4;
  } else {
    r4 = __ZN13Range_decoder11decode_treeEP9Bit_modeli(r2, r1 + 264 | 0, 8) + 16 | 0;
    return r4;
  }
}
function __ZN13Range_decoder11decode_treeEP9Bit_modeli(r1, r2, r3) {
  var r4, r5, r6, r7, r8;
  L196 : do {
    if ((r3 | 0) > 0) {
      r4 = 1;
      r5 = r3;
      while (1) {
        r6 = __ZN13Range_decoder10decode_bitER9Bit_model(r1, (r4 << 2) + r2 | 0) | r4 << 1;
        r7 = r5 - 1 | 0;
        if ((r7 | 0) > 0) {
          r4 = r6;
          r5 = r7;
        } else {
          r8 = r6;
          break L196;
        }
      }
    } else {
      r8 = 1;
    }
  } while (0);
  return r8 - (1 << r3) | 0;
}
function __ZN13Range_decoder20decode_tree_reversedEP9Bit_modeli(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10;
  if ((r3 | 0) > 0) {
    r4 = 0;
    r5 = 0;
    r6 = 1;
  } else {
    r7 = 0;
    return r7;
  }
  while (1) {
    r8 = r6 << 1;
    if ((__ZN13Range_decoder10decode_bitER9Bit_model(r1, (r6 << 2) + r2 | 0) | 0) == 0) {
      r9 = r8;
      r10 = r4;
    } else {
      r9 = r8 | 1;
      r10 = 1 << r5 | r4;
    }
    r8 = r5 + 1 | 0;
    if ((r8 | 0) == (r3 | 0)) {
      r7 = r10;
      break;
    } else {
      r4 = r10;
      r5 = r8;
      r6 = r9;
    }
  }
  return r7;
}
function __ZN13Range_decoder6decodeEi(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12;
  if ((r2 | 0) <= 0) {
    r3 = 0;
    return r3;
  }
  r4 = (r1 + 24 | 0) >> 2;
  r5 = (r1 + 20 | 0) >> 2;
  r6 = 0;
  r7 = r2;
  r2 = HEAP32[r4];
  while (1) {
    r8 = r6 << 1;
    do {
      if (r2 >>> 0 < 16777216) {
        HEAP32[r4] = r2 << 7;
        r9 = HEAP32[r5] << 8 | __ZN13Range_decoder8get_byteEv(r1) & 255;
        HEAP32[r5] = r9;
        r10 = HEAP32[r4];
        if (r9 >>> 0 < r10 >>> 0) {
          r11 = r8;
          r12 = r10;
          break;
        }
        HEAP32[r5] = r9 - r10 | 0;
        r11 = r8 | 1;
        r12 = r10;
      } else {
        r10 = r2 >>> 1;
        HEAP32[r4] = r10;
        r9 = HEAP32[r5];
        if (r9 >>> 0 < r10 >>> 0) {
          r11 = r8;
          r12 = r10;
          break;
        }
        HEAP32[r5] = r9 - r10 | 0;
        r11 = r8 | 1;
        r12 = r10;
      }
    } while (0);
    r8 = r7 - 1 | 0;
    if ((r8 | 0) > 0) {
      r6 = r11;
      r7 = r8;
      r2 = r12;
    } else {
      r3 = r11;
      break;
    }
  }
  return r3;
}
function __ZN13Range_decoder9normalizeEv(r1) {
  var r2, r3;
  r2 = r1 + 24 | 0;
  r3 = HEAP32[r2 >> 2];
  if (r3 >>> 0 >= 16777216) {
    return;
  }
  HEAP32[r2 >> 2] = r3 << 8;
  r3 = r1 + 20 | 0;
  r2 = HEAP32[r3 >> 2] << 8 | __ZN13Range_decoder8get_byteEv(r1) & 255;
  HEAP32[r3 >> 2] = r2;
  return;
}
function __ZN10LZ_decoder10copy_blockEii(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10;
  r4 = (r1 + 20 | 0) >> 2;
  r5 = HEAP32[r4];
  r6 = r5 - r2 - 1 | 0;
  r2 = (r1 + 12 | 0) >> 2;
  r7 = HEAP32[r2];
  r8 = r6 + ((r6 | 0) < 0 ? r7 : 0) | 0;
  do {
    if ((r7 - ((r5 | 0) > (r8 | 0) ? r5 : r8) | 0) > (r3 | 0)) {
      r6 = r5 - r8 | 0;
      if ((((r6 | 0) > -1 ? r6 : -r6 | 0) | 0) < (r3 | 0)) {
        break;
      }
      r6 = HEAP32[r1 + 16 >> 2];
      _memcpy(r6 + r5 | 0, r6 + r8 | 0, r3);
      HEAP32[r4] = HEAP32[r4] + r3 | 0;
      return;
    }
  } while (0);
  if ((r3 | 0) <= 0) {
    return;
  }
  r7 = r1 + 16 | 0;
  r6 = r8;
  r8 = r3;
  r3 = r5;
  while (1) {
    r5 = HEAP32[r7 >> 2];
    HEAP8[r5 + r3 | 0] = HEAP8[r5 + r6 | 0];
    r5 = HEAP32[r4] + 1 | 0;
    HEAP32[r4] = r5;
    r9 = HEAP32[r2];
    if ((r5 | 0) < (r9 | 0)) {
      r10 = r9;
    } else {
      __ZN10LZ_decoder10flush_dataEv(r1);
      r10 = HEAP32[r2];
    }
    r9 = r6 + 1 | 0;
    r5 = r8 - 1 | 0;
    if ((r5 | 0) <= 0) {
      break;
    }
    r6 = (r9 | 0) < (r10 | 0) ? r9 : 0;
    r8 = r5;
    r3 = HEAP32[r4];
  }
  return;
}
__ZN10LZ_decoder10copy_blockEii["X"] = 1;
function __ZN13Range_decoder14decode_matchedEP9Bit_modeli(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12, r13;
  r4 = 0;
  r5 = 1;
  r6 = 7;
  while (1) {
    if ((r6 | 0) <= -1) {
      r7 = r5;
      r4 = 210;
      break;
    }
    r8 = r3 >>> (r6 >>> 0) & 1;
    r9 = __ZN13Range_decoder10decode_bitER9Bit_model(r1, ((r8 << 8) + r5 + 256 << 2) + r2 | 0);
    r10 = r9 | r5 << 1;
    if ((r8 | 0) == (r9 | 0)) {
      r5 = r10;
      r6 = r6 - 1 | 0;
    } else {
      break;
    }
  }
  if (r4 == 210) {
    r11 = r7 & 255;
    return r11;
  }
  if ((r6 | 0) > 0) {
    r12 = r6;
    r13 = r10;
  } else {
    r7 = r10;
    r11 = r7 & 255;
    return r11;
  }
  while (1) {
    r10 = r12 - 1 | 0;
    r6 = __ZN13Range_decoder10decode_bitER9Bit_model(r1, (r13 << 2) + r2 | 0) | r13 << 1;
    if ((r10 | 0) > 0) {
      r12 = r10;
      r13 = r6;
    } else {
      r7 = r6;
      break;
    }
  }
  r11 = r7 & 255;
  return r11;
}
function __ZN15Literal_decoderC2Ev(r1) {
  var r2, r3;
  r2 = r1 + 24576 | 0;
  r3 = r1 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r3);
    r1 = r3 + 4 | 0;
    if ((r1 | 0) == (r2 | 0)) {
      break;
    } else {
      r3 = r1;
    }
  }
  return;
}
function __ZN11Len_decoderC2Ev(r1) {
  var r2, r3;
  __ZN9Bit_modelC1Ev(r1 | 0);
  __ZN9Bit_modelC1Ev(r1 + 4 | 0);
  __ZN9Bit_modelC1Ev(r1 + 8 | 0);
  __ZN9Bit_modelC1Ev(r1 + 12 | 0);
  __ZN9Bit_modelC1Ev(r1 + 16 | 0);
  __ZN9Bit_modelC1Ev(r1 + 20 | 0);
  __ZN9Bit_modelC1Ev(r1 + 24 | 0);
  __ZN9Bit_modelC1Ev(r1 + 28 | 0);
  __ZN9Bit_modelC1Ev(r1 + 32 | 0);
  __ZN9Bit_modelC1Ev(r1 + 36 | 0);
  __ZN9Bit_modelC1Ev(r1 + 40 | 0);
  __ZN9Bit_modelC1Ev(r1 + 44 | 0);
  __ZN9Bit_modelC1Ev(r1 + 48 | 0);
  __ZN9Bit_modelC1Ev(r1 + 52 | 0);
  __ZN9Bit_modelC1Ev(r1 + 56 | 0);
  __ZN9Bit_modelC1Ev(r1 + 60 | 0);
  __ZN9Bit_modelC1Ev(r1 + 64 | 0);
  __ZN9Bit_modelC1Ev(r1 + 68 | 0);
  __ZN9Bit_modelC1Ev(r1 + 72 | 0);
  __ZN9Bit_modelC1Ev(r1 + 76 | 0);
  __ZN9Bit_modelC1Ev(r1 + 80 | 0);
  __ZN9Bit_modelC1Ev(r1 + 84 | 0);
  __ZN9Bit_modelC1Ev(r1 + 88 | 0);
  __ZN9Bit_modelC1Ev(r1 + 92 | 0);
  __ZN9Bit_modelC1Ev(r1 + 96 | 0);
  __ZN9Bit_modelC1Ev(r1 + 100 | 0);
  __ZN9Bit_modelC1Ev(r1 + 104 | 0);
  __ZN9Bit_modelC1Ev(r1 + 108 | 0);
  __ZN9Bit_modelC1Ev(r1 + 112 | 0);
  __ZN9Bit_modelC1Ev(r1 + 116 | 0);
  __ZN9Bit_modelC1Ev(r1 + 120 | 0);
  __ZN9Bit_modelC1Ev(r1 + 124 | 0);
  __ZN9Bit_modelC1Ev(r1 + 128 | 0);
  __ZN9Bit_modelC1Ev(r1 + 132 | 0);
  __ZN9Bit_modelC1Ev(r1 + 136 | 0);
  __ZN9Bit_modelC1Ev(r1 + 140 | 0);
  __ZN9Bit_modelC1Ev(r1 + 144 | 0);
  __ZN9Bit_modelC1Ev(r1 + 148 | 0);
  __ZN9Bit_modelC1Ev(r1 + 152 | 0);
  __ZN9Bit_modelC1Ev(r1 + 156 | 0);
  __ZN9Bit_modelC1Ev(r1 + 160 | 0);
  __ZN9Bit_modelC1Ev(r1 + 164 | 0);
  __ZN9Bit_modelC1Ev(r1 + 168 | 0);
  __ZN9Bit_modelC1Ev(r1 + 172 | 0);
  __ZN9Bit_modelC1Ev(r1 + 176 | 0);
  __ZN9Bit_modelC1Ev(r1 + 180 | 0);
  __ZN9Bit_modelC1Ev(r1 + 184 | 0);
  __ZN9Bit_modelC1Ev(r1 + 188 | 0);
  __ZN9Bit_modelC1Ev(r1 + 192 | 0);
  __ZN9Bit_modelC1Ev(r1 + 196 | 0);
  __ZN9Bit_modelC1Ev(r1 + 200 | 0);
  __ZN9Bit_modelC1Ev(r1 + 204 | 0);
  __ZN9Bit_modelC1Ev(r1 + 208 | 0);
  __ZN9Bit_modelC1Ev(r1 + 212 | 0);
  __ZN9Bit_modelC1Ev(r1 + 216 | 0);
  __ZN9Bit_modelC1Ev(r1 + 220 | 0);
  __ZN9Bit_modelC1Ev(r1 + 224 | 0);
  __ZN9Bit_modelC1Ev(r1 + 228 | 0);
  __ZN9Bit_modelC1Ev(r1 + 232 | 0);
  __ZN9Bit_modelC1Ev(r1 + 236 | 0);
  __ZN9Bit_modelC1Ev(r1 + 240 | 0);
  __ZN9Bit_modelC1Ev(r1 + 244 | 0);
  __ZN9Bit_modelC1Ev(r1 + 248 | 0);
  __ZN9Bit_modelC1Ev(r1 + 252 | 0);
  __ZN9Bit_modelC1Ev(r1 + 256 | 0);
  __ZN9Bit_modelC1Ev(r1 + 260 | 0);
  r2 = r1 + 1288 | 0;
  r3 = r1 + 264 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r3);
    r1 = r3 + 4 | 0;
    if ((r1 | 0) == (r2 | 0)) {
      break;
    } else {
      r3 = r1;
    }
  }
  return;
}
__ZN11Len_decoderC2Ev["X"] = 1;
function __GLOBAL__I_a() {
  ___cxx_global_var_init();
  return;
}
function __ZN5ErrorC1EPKc(r1, r2) {
  __ZN5ErrorC2EPKc(r1, r2);
  return;
}
function __ZN11MatchfinderC1Eiii(r1, r2, r3) {
  __ZN11MatchfinderC2Eiii(r1, r2, r3);
  return;
}
function __ZN11MatchfinderC2Eiii(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12;
  r4 = r1 >> 2;
  r5 = r1 | 0;
  HEAP32[r5 >> 2] = 0;
  HEAP32[r5 + 4 >> 2] = 0;
  r5 = r1 + 12 | 0;
  r6 = __Znaj(5505024);
  HEAP32[r5 >> 2] = r6;
  HEAP32[r4 + 7] = 0;
  HEAP32[r4 + 8] = 0;
  r6 = r1 + 36 | 0;
  HEAP32[r6 >> 2] = 0;
  HEAP32[r4 + 11] = r3;
  if ((r3 | 0) < 273) {
    r7 = ((r3 | 0) / 2 & -1) + 16 | 0;
  } else {
    r7 = 256;
  }
  HEAP32[r4 + 12] = r7;
  HEAP32[r4 + 13] = 1;
  r7 = r1 + 56 | 0;
  HEAP8[r7] = 0;
  r3 = (r2 << 1) + 4370 | 0;
  r8 = (r2 | 0) < 65536 ? 65536 : r2;
  r9 = (r1 + 24 | 0) >> 2;
  HEAP32[r9] = r8;
  r10 = _malloc(r8);
  r8 = (r1 + 8 | 0) >> 2;
  HEAP32[r8] = r10;
  if ((r10 | 0) == 0) {
    _exit(-1);
  }
  do {
    if (__ZN11Matchfinder10read_blockEv(r1)) {
      if ((HEAP8[r7] & 1) << 24 >> 24 != 0) {
        break;
      }
      if ((HEAP32[r9] | 0) >= (r3 | 0)) {
        break;
      }
      HEAP32[r9] = r3;
      r10 = _realloc(HEAP32[r8], r3);
      HEAP32[r8] = r10;
      if ((r10 | 0) == 0) {
        _exit(-1);
      }
      __ZN11Matchfinder10read_blockEv(r1);
    }
  } while (0);
  do {
    if ((HEAP8[r7] & 1) << 24 >> 24 == 0) {
      HEAP32[r4 + 5] = r2;
      r11 = HEAP32[r9] - 273 | 0;
      r12 = r2;
    } else {
      r1 = HEAP32[r6 >> 2];
      if ((r1 | 0) < (r2 | 0)) {
        r8 = (r1 | 0) < 4096 ? 4096 : r1;
        HEAP32[r4 + 5] = r8;
        r11 = HEAP32[r9];
        r12 = r8;
        break;
      } else {
        HEAP32[r4 + 5] = r2;
        r11 = HEAP32[r9];
        r12 = r2;
        break;
      }
    }
  } while (0);
  HEAP32[r4 + 10] = r11;
  r11 = _llvm_umul_with_overflow_i32(r12 << 1, 4);
  r12 = __Znaj(tempRet0 ? -1 : r11);
  HEAP32[r4 + 4] = r12;
  r12 = 0;
  while (1) {
    HEAP32[HEAP32[r5 >> 2] + (r12 << 2) >> 2] = -1;
    r4 = r12 + 1 | 0;
    if ((r4 | 0) == 1376256) {
      break;
    } else {
      r12 = r4;
    }
  }
  return;
}
__ZN11MatchfinderC2Eiii["X"] = 1;
function __ZN11Matchfinder5resetEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9;
  r2 = (r1 + 36 | 0) >> 2;
  r3 = HEAP32[r2];
  r4 = (r1 + 28 | 0) >> 2;
  r5 = HEAP32[r4];
  r6 = r3 - r5 | 0;
  if ((r6 | 0) > 0) {
    r7 = HEAP32[r1 + 8 >> 2];
    _memmove(r7, r7 + r5 | 0, r6, 1, 0);
    r8 = HEAP32[r4];
    r9 = HEAP32[r2];
  } else {
    r8 = r5;
    r9 = r3;
  }
  r3 = r1 | 0;
  HEAP32[r3 >> 2] = 0;
  HEAP32[r3 + 4 >> 2] = 0;
  HEAP32[r2] = r9 - r8 | 0;
  HEAP32[r4] = 0;
  HEAP32[r1 + 32 >> 2] = 0;
  r4 = r1 + 12 | 0;
  r8 = 0;
  while (1) {
    HEAP32[HEAP32[r4 >> 2] + (r8 << 2) >> 2] = -1;
    r9 = r8 + 1 | 0;
    if ((r9 | 0) == 1376256) {
      break;
    } else {
      r8 = r9;
    }
  }
  __ZN11Matchfinder10read_blockEv(r1);
  return;
}
function __ZN11Matchfinder10read_blockEv(r1) {
  var r2, r3, r4, r5, r6;
  r2 = r1 + 56 | 0;
  r3 = (r1 + 36 | 0) >> 2;
  do {
    if ((HEAP8[r2] & 1) << 24 >> 24 == 0) {
      r4 = HEAP32[r3];
      r5 = HEAP32[r1 + 24 >> 2];
      if ((r4 | 0) >= (r5 | 0)) {
        break;
      }
      r6 = r5 - r4 | 0;
      r5 = __Z9readblockiPhi(HEAP32[r1 + 52 >> 2], HEAP32[r1 + 8 >> 2] + r4 | 0, r6);
      HEAP32[r3] = HEAP32[r3] + r5 | 0;
      do {
        if ((r5 | 0) != (r6 | 0)) {
          r4 = ___errno_location();
          if ((HEAP32[r4 >> 2] | 0) == 0) {
            break;
          }
          r4 = ___cxa_allocate_exception(4);
          __ZN5ErrorC1EPKc(r4, 5252360);
          ___cxa_throw(r4, 5253560, 0);
        }
      } while (0);
      HEAP8[r2] = (r5 | 0) < (r6 | 0) & 1;
    }
  } while (0);
  return (HEAP32[r1 + 28 >> 2] | 0) < (HEAP32[r3] | 0);
}
function __ZNK11Matchfinder15available_bytesEv(r1, r2) {
  return r2 - r1 | 0;
}
function __ZNK5CRC32ixEh(r1) {
  return HEAP32[((r1 & 255) << 2) + 5250728 >> 2];
}
function __ZN11Matchfinder8move_posEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10;
  r2 = (r1 + 32 | 0) >> 2;
  r3 = HEAP32[r2] + 1 | 0;
  HEAP32[r2] = r3;
  r4 = (r1 + 20 | 0) >> 2;
  if ((r3 | 0) >= (HEAP32[r4] | 0)) {
    HEAP32[r2] = 0;
  }
  r2 = (r1 + 28 | 0) >> 2;
  r3 = HEAP32[r2] + 1 | 0;
  HEAP32[r2] = r3;
  if ((r3 | 0) < (HEAP32[r1 + 40 >> 2] | 0)) {
    return;
  }
  r5 = (r1 + 36 | 0) >> 2;
  if ((r3 | 0) > (HEAP32[r5] | 0)) {
    __Z14internal_errorPKc(5252588);
  }
  if ((HEAP8[r1 + 56 | 0] & 1) << 24 >> 24 != 0) {
    return;
  }
  r3 = HEAP32[r2] - HEAP32[r4] - 4097 | 0;
  r6 = HEAP32[r1 + 8 >> 2];
  _memmove(r6, r6 + r3 | 0, HEAP32[r5] - r3 | 0, 1, 0);
  r6 = (r1 | 0) >> 2;
  r7 = (i64Math.add(HEAP32[r6], HEAP32[r6 + 1], r3, (r3 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
  r8 = HEAP32[tempDoublePtr + 4 >> 2];
  HEAP32[r6] = r7;
  HEAP32[r6 + 1] = r8;
  HEAP32[r2] = HEAP32[r2] - r3 | 0;
  HEAP32[r5] = HEAP32[r5] - r3 | 0;
  r5 = r1 + 12 | 0;
  r2 = 0;
  while (1) {
    r8 = (r2 << 2) + HEAP32[r5 >> 2] | 0;
    r6 = HEAP32[r8 >> 2];
    if ((r6 | 0) > -1) {
      HEAP32[r8 >> 2] = r6 - r3 | 0;
    }
    r6 = r2 + 1 | 0;
    if ((r6 | 0) == 1376256) {
      break;
    } else {
      r2 = r6;
    }
  }
  r2 = HEAP32[r4];
  L328 : do {
    if ((r2 << 1 | 0) > 0) {
      r5 = r1 + 16 | 0;
      r6 = 0;
      r8 = r2;
      while (1) {
        r7 = (r6 << 2) + HEAP32[r5 >> 2] | 0;
        r9 = HEAP32[r7 >> 2];
        if ((r9 | 0) > -1) {
          HEAP32[r7 >> 2] = r9 - r3 | 0;
          r10 = HEAP32[r4];
        } else {
          r10 = r8;
        }
        r9 = r6 + 1 | 0;
        if ((r9 | 0) < (r10 << 1 | 0)) {
          r6 = r9;
          r8 = r10;
        } else {
          break L328;
        }
      }
    }
  } while (0);
  __ZN11Matchfinder10read_blockEv(r1);
  return;
}
__ZN11Matchfinder8move_posEv["X"] = 1;
function __ZN11Matchfinder17longest_match_lenEPi(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43, r44, r45, r46, r47, r48, r49, r50, r51, r52, r53, r54, r55, r56, r57, r58, r59, r60, r61, r62, r63;
  r3 = r2 >> 2;
  r4 = 0;
  r5 = HEAP32[r1 + 44 >> 2];
  r6 = (r1 + 28 | 0) >> 2;
  r7 = HEAP32[r6];
  r8 = __ZNK11Matchfinder15available_bytesEv(r7, HEAP32[r1 + 36 >> 2]);
  do {
    if ((r5 | 0) > (r8 | 0)) {
      if ((r8 | 0) < 4) {
        r9 = 0;
      } else {
        r10 = r8;
        break;
      }
      return r9;
    } else {
      r10 = r5;
    }
  } while (0);
  r5 = (r1 + 20 | 0) >> 2;
  r8 = HEAP32[r5];
  r11 = r7 + 1 | 0;
  r12 = (r7 | 0) < (r8 | 0) ? 0 : r11 - r8 | 0;
  r8 = (r1 + 8 | 0) >> 2;
  r13 = HEAP32[r8];
  r14 = r13 + r7 | 0;
  r15 = HEAP8[r14];
  r16 = HEAPU8[r13 + r11 | 0];
  r11 = r16 | (r15 & 255) << 8 | 1310720;
  r17 = __ZNK5CRC32ixEh(r15) ^ r16 ^ HEAPU8[r7 + (r13 + 2) | 0] << 8;
  r16 = r17 & 262143 | 1048576;
  r15 = (r17 ^ __ZNK5CRC32ixEh(HEAP8[r7 + (r13 + 3) | 0]) << 5) & 1048575;
  r17 = (r2 | 0) != 0;
  r18 = (r1 + 12 | 0) >> 2;
  if (r17) {
    r19 = HEAP32[HEAP32[r18] + (r11 << 2) >> 2];
    if ((r19 | 0) < (r12 | 0)) {
      HEAP32[r3 + 2] = 2147483647;
      r20 = 1;
    } else {
      HEAP32[r3 + 2] = r7 - 1 - r19 | 0;
      r20 = 2;
    }
    r19 = HEAP32[HEAP32[r18] + (r16 << 2) >> 2];
    do {
      if ((r19 | 0) < (r12 | 0)) {
        r4 = 283;
      } else {
        if (HEAP8[HEAP32[r8] + r19 | 0] << 24 >> 24 != HEAP8[r14] << 24 >> 24) {
          r4 = 283;
          break;
        }
        HEAP32[r3 + 3] = HEAP32[r6] + (r19 ^ -1) | 0;
        r21 = 3;
        break;
      }
    } while (0);
    if (r4 == 283) {
      HEAP32[r3 + 3] = 2147483647;
      r21 = r20;
    }
    HEAP32[r3 + 4] = 2147483647;
    r22 = r21;
    r23 = HEAP32[r6];
  } else {
    r22 = 1;
    r23 = r7;
  }
  HEAP32[HEAP32[r18] + (r11 << 2) >> 2] = r23;
  HEAP32[HEAP32[r18] + (r16 << 2) >> 2] = HEAP32[r6];
  r16 = (r15 << 2) + HEAP32[r18] | 0;
  r18 = HEAP32[r16 >> 2];
  HEAP32[r16 >> 2] = HEAP32[r6];
  r16 = (r1 + 16 | 0) >> 2;
  r15 = HEAP32[r16];
  r23 = (r1 + 32 | 0) >> 2;
  r11 = HEAP32[r23] << 1;
  r21 = (r11 << 2) + r15 | 0;
  r20 = ((r11 | 1) << 2) + r15 | 0;
  L355 : do {
    if ((r18 | 0) < (r12 | 0)) {
      r24 = r20;
      r25 = r22;
      r26 = r21;
      r4 = 301;
    } else {
      r15 = r18;
      r11 = r21;
      r19 = r20;
      r14 = 0;
      r27 = 0;
      r28 = 0;
      r29 = HEAP32[r1 + 48 >> 2];
      r30 = r22;
      L357 : while (1) {
        L359 : do {
          if (r17) {
            r31 = r15;
            r32 = r19;
            r33 = r14;
            r34 = r28;
            r35 = r29;
            r36 = r30;
            while (1) {
              r37 = r35 - 1 | 0;
              if ((r37 | 0) < 0) {
                r24 = r32;
                r25 = r36;
                r26 = r11;
                r4 = 301;
                break L355;
              }
              r38 = HEAP32[r8];
              r39 = r33;
              while (1) {
                if ((r39 | 0) >= (r10 | 0)) {
                  r40 = 0;
                  break;
                }
                if (HEAP8[r38 + r39 + r31 | 0] << 24 >> 24 == HEAP8[r13 + r39 + r7 | 0] << 24 >> 24) {
                  r39 = r39 + 1 | 0;
                } else {
                  r40 = 1;
                  break;
                }
              }
              r41 = HEAP32[r6] - r31 | 0;
              L367 : do {
                if ((r36 | 0) < (r39 | 0)) {
                  r42 = r41 - 1 | 0;
                  r43 = r36;
                  while (1) {
                    r44 = r43 + 1 | 0;
                    HEAP32[(r44 << 2 >> 2) + r3] = r42;
                    if ((r44 | 0) == (r39 | 0)) {
                      r45 = r39;
                      break L367;
                    } else {
                      r43 = r44;
                    }
                  }
                } else {
                  r45 = r36;
                }
              } while (0);
              r43 = HEAP32[r16];
              r42 = HEAP32[r23];
              if ((r42 | 0) < (r41 | 0)) {
                r46 = HEAP32[r5];
              } else {
                r46 = 0;
              }
              r44 = r42 - r41 + r46 << 1;
              r42 = (r44 << 2) + r43 | 0;
              if (!r40) {
                r47 = r32;
                r48 = r45;
                r49 = r43;
                r50 = r44;
                r51 = r42;
                break L357;
              }
              if (HEAPU8[r38 + r39 + r31 | 0] < HEAPU8[r13 + r39 + r7 | 0]) {
                r52 = r31;
                r53 = r32;
                r54 = r34;
                r55 = r37;
                r56 = r39;
                r57 = r45;
                r58 = r43;
                r59 = r44;
                break L359;
              }
              HEAP32[r32 >> 2] = r31;
              r44 = HEAP32[r42 >> 2];
              if ((r44 | 0) < (r12 | 0)) {
                r24 = r42;
                r25 = r45;
                r26 = r11;
                r4 = 301;
                break L355;
              } else {
                r31 = r44;
                r32 = r42;
                r33 = (r27 | 0) < (r39 | 0) ? r27 : r39;
                r34 = r39;
                r35 = r37;
                r36 = r45;
              }
            }
          } else {
            r36 = r15;
            r35 = r19;
            r34 = r14;
            r33 = r28;
            r32 = r29;
            while (1) {
              r31 = r32 - 1 | 0;
              if ((r31 | 0) < 0) {
                r24 = r35;
                r25 = r30;
                r26 = r11;
                r4 = 301;
                break L355;
              }
              r42 = HEAP32[r8];
              r44 = r34;
              while (1) {
                if ((r44 | 0) >= (r10 | 0)) {
                  r60 = 0;
                  break;
                }
                if (HEAP8[r42 + r44 + r36 | 0] << 24 >> 24 == HEAP8[r13 + r44 + r7 | 0] << 24 >> 24) {
                  r44 = r44 + 1 | 0;
                } else {
                  r60 = 1;
                  break;
                }
              }
              r37 = HEAP32[r6] - r36 | 0;
              r39 = HEAP32[r16];
              r38 = HEAP32[r23];
              if ((r38 | 0) < (r37 | 0)) {
                r61 = HEAP32[r5];
              } else {
                r61 = 0;
              }
              r41 = r38 - r37 + r61 << 1;
              r37 = (r41 << 2) + r39 | 0;
              if (!r60) {
                r47 = r35;
                r48 = r30;
                r49 = r39;
                r50 = r41;
                r51 = r37;
                break L357;
              }
              if (HEAPU8[r42 + r44 + r36 | 0] < HEAPU8[r13 + r44 + r7 | 0]) {
                r52 = r36;
                r53 = r35;
                r54 = r33;
                r55 = r31;
                r56 = r44;
                r57 = r30;
                r58 = r39;
                r59 = r41;
                break L359;
              }
              HEAP32[r35 >> 2] = r36;
              r41 = HEAP32[r37 >> 2];
              if ((r41 | 0) < (r12 | 0)) {
                r24 = r37;
                r25 = r30;
                r26 = r11;
                r4 = 301;
                break L355;
              } else {
                r36 = r41;
                r35 = r37;
                r34 = (r27 | 0) < (r44 | 0) ? r27 : r44;
                r33 = r44;
                r32 = r31;
              }
            }
          }
        } while (0);
        HEAP32[r11 >> 2] = r52;
        r32 = ((r59 | 1) << 2) + r58 | 0;
        r33 = HEAP32[r32 >> 2];
        if ((r33 | 0) < (r12 | 0)) {
          r24 = r53;
          r25 = r57;
          r26 = r32;
          r4 = 301;
          break L355;
        } else {
          r15 = r33;
          r11 = r32;
          r19 = r53;
          r14 = (r54 | 0) < (r56 | 0) ? r54 : r56;
          r27 = r56;
          r28 = r54;
          r29 = r55;
          r30 = r57;
        }
      }
      HEAP32[r11 >> 2] = HEAP32[r51 >> 2];
      HEAP32[r47 >> 2] = HEAP32[r49 + ((r50 | 1) << 2) >> 2];
      r62 = r48;
      break;
    }
  } while (0);
  if (r4 == 301) {
    HEAP32[r24 >> 2] = -1;
    HEAP32[r26 >> 2] = -1;
    r62 = r25;
  }
  if (!r17) {
    r9 = r62;
    return r9;
  }
  r17 = r2 + 12 | 0;
  r25 = HEAP32[r17 >> 2];
  r26 = HEAP32[r3 + 4];
  if ((r25 | 0) > (r26 | 0)) {
    HEAP32[r17 >> 2] = r26;
    r63 = r26;
  } else {
    r63 = r25;
  }
  r25 = r2 + 8 | 0;
  if ((HEAP32[r25 >> 2] | 0) <= (r63 | 0)) {
    r9 = r62;
    return r9;
  }
  HEAP32[r25 >> 2] = r63;
  r9 = r62;
  return r9;
}
__ZN11Matchfinder17longest_match_lenEPi["X"] = 1;
function __ZN11Len_encoder6encodeER13Range_encoderii(r1, r2, r3, r4) {
  var r5, r6, r7;
  r5 = r3 - 2 | 0;
  r6 = r1 | 0;
  do {
    if ((r5 | 0) < 8) {
      __ZN13Range_encoder10encode_bitER9Bit_modeli(r2, r6, 0);
      __ZN13Range_encoder11encode_treeEP9Bit_modelii(r2, (r4 << 5) + r1 + 8 | 0, r5, 3);
    } else {
      __ZN13Range_encoder10encode_bitER9Bit_modeli(r2, r6, 1);
      r7 = r1 + 4 | 0;
      if ((r5 | 0) < 16) {
        __ZN13Range_encoder10encode_bitER9Bit_modeli(r2, r7, 0);
        __ZN13Range_encoder11encode_treeEP9Bit_modelii(r2, (r4 << 5) + r1 + 136 | 0, r3 - 10 | 0, 3);
        break;
      } else {
        __ZN13Range_encoder10encode_bitER9Bit_modeli(r2, r7, 1);
        __ZN13Range_encoder11encode_treeEP9Bit_modelii(r2, r1 + 264 | 0, r3 - 18 | 0, 8);
        break;
      }
    }
  } while (0);
  r3 = (r4 << 2) + r1 + 5644 | 0;
  r2 = HEAP32[r3 >> 2] - 1 | 0;
  HEAP32[r3 >> 2] = r2;
  if ((r2 | 0) >= 1) {
    return;
  }
  __ZN11Len_encoder13update_pricesEi(r1, r4);
  return;
}
function __ZN13Range_encoder10encode_bitER9Bit_modeli(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9;
  r4 = (r1 + 24 | 0) >> 2;
  r5 = HEAP32[r4];
  r6 = (r2 | 0) >> 2;
  r2 = Math.imul(r5 >>> 11, HEAP32[r6]);
  if ((r3 | 0) == 0) {
    HEAP32[r4] = r2;
    r3 = HEAP32[r6];
    r7 = ((2048 - r3 | 0) >>> 5) + r3 | 0;
  } else {
    r3 = (r1 | 0) >> 2;
    r8 = (i64Math.add(HEAP32[r3], HEAP32[r3 + 1], r2, 0), HEAP32[tempDoublePtr >> 2]);
    r9 = HEAP32[tempDoublePtr + 4 >> 2];
    HEAP32[r3] = r8;
    HEAP32[r3 + 1] = r9;
    HEAP32[r4] = r5 - r2 | 0;
    r2 = HEAP32[r6];
    r7 = r2 - (r2 >>> 5) | 0;
  }
  HEAP32[r6] = r7;
  r7 = HEAP32[r4];
  if (r7 >>> 0 >= 16777216) {
    return;
  }
  HEAP32[r4] = r7 << 8;
  __ZN13Range_encoder9shift_lowEv(r1);
  return;
}
function __ZN13Range_encoder11encode_treeEP9Bit_modelii(r1, r2, r3, r4) {
  var r5, r6, r7, r8;
  if ((r4 | 0) <= 0) {
    return;
  }
  r5 = 1;
  r6 = r4;
  r7 = 1 << r4 - 1;
  while (1) {
    r4 = r7 & r3;
    __ZN13Range_encoder10encode_bitER9Bit_modeli(r1, (r5 << 2) + r2 | 0, r4);
    r8 = r6 - 1 | 0;
    if ((r8 | 0) > 0) {
      r5 = (r4 | 0) != 0 & 1 | r5 << 1;
      r6 = r8;
      r7 = r7 >> 1;
    } else {
      break;
    }
  }
  return;
}
function __ZN11Len_encoder13update_pricesEi(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16;
  r3 = r1 >> 2;
  r4 = HEAP32[r3];
  r5 = __Z6price0RK9Bit_model(r4);
  r6 = (r1 + 5640 | 0) >> 2;
  r7 = (r2 << 5) + r1 + 8 | 0;
  r8 = HEAP32[r6];
  do {
    if ((r8 | 0) > 0) {
      r9 = __Z12price_symbolPK9Bit_modelii(r7, 0, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1288 >> 2) + r3] = r9;
      r9 = HEAP32[r6];
      if ((r9 | 0) <= 1) {
        r10 = 1;
        r11 = r9;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 1, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1292 >> 2) + r3] = r12;
      if ((r9 | 0) <= 2) {
        r10 = 2;
        r11 = 2;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 2, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1296 >> 2) + r3] = r12;
      if ((r9 | 0) <= 3) {
        r10 = 3;
        r11 = 3;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 3, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1300 >> 2) + r3] = r12;
      if ((r9 | 0) <= 4) {
        r10 = 4;
        r11 = 4;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 4, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1304 >> 2) + r3] = r12;
      if ((r9 | 0) <= 5) {
        r10 = 5;
        r11 = 5;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 5, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1308 >> 2) + r3] = r12;
      if ((r9 | 0) <= 6) {
        r10 = 6;
        r11 = 6;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 6, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1312 >> 2) + r3] = r12;
      if ((r9 | 0) <= 7) {
        r10 = 7;
        r11 = 7;
        break;
      }
      r12 = __Z12price_symbolPK9Bit_modelii(r7, 7, 3) + r5 | 0;
      HEAP32[((r2 * 1088 & -1) + 1316 >> 2) + r3] = r12;
      r10 = 8;
      r11 = r9;
    } else {
      r10 = 0;
      r11 = r8;
    }
  } while (0);
  r8 = __Z6price1RK9Bit_model(r4);
  r4 = (r2 << 5) + r1 + 136 | 0;
  r5 = r1 + 4 | 0;
  r7 = r10;
  r10 = r11;
  while (1) {
    if ((r7 | 0) >= (r10 | 0)) {
      r13 = r7;
      r14 = r10;
      break;
    }
    r11 = (__Z6price0RK9Bit_model(HEAP32[r5 >> 2]) + r8 | 0) + __Z12price_symbolPK9Bit_modelii(r4, r7 - 8 | 0, 3) | 0;
    HEAP32[((r7 << 2) + (r2 * 1088 & -1) + 1288 >> 2) + r3] = r11;
    r11 = r7 + 1 | 0;
    r9 = HEAP32[r6];
    if ((r11 | 0) < 16) {
      r7 = r11;
      r10 = r9;
    } else {
      r13 = r11;
      r14 = r9;
      break;
    }
  }
  if ((r13 | 0) >= (r14 | 0)) {
    r15 = r14;
    r16 = (r2 << 2) + r1 + 5644 | 0;
    HEAP32[r16 >> 2] = r15;
    return;
  }
  r14 = r1 + 264 | 0;
  r10 = r13;
  while (1) {
    r13 = (__Z6price1RK9Bit_model(HEAP32[r5 >> 2]) + r8 | 0) + __Z12price_symbolPK9Bit_modelii(r14, r10 - 16 | 0, 8) | 0;
    HEAP32[((r10 << 2) + 1288 >> 2) + r3] = r13;
    HEAP32[((r10 << 2) + 2376 >> 2) + r3] = r13;
    HEAP32[((r10 << 2) + 3464 >> 2) + r3] = r13;
    HEAP32[((r10 << 2) + 4552 >> 2) + r3] = r13;
    r13 = r10 + 1 | 0;
    r7 = HEAP32[r6];
    if ((r13 | 0) < (r7 | 0)) {
      r10 = r13;
    } else {
      r15 = r7;
      break;
    }
  }
  r16 = (r2 << 2) + r1 + 5644 | 0;
  HEAP32[r16 >> 2] = r15;
  return;
}
__ZN11Len_encoder13update_pricesEi["X"] = 1;
function __ZN10LZ_encoder17fill_align_pricesEv(r1) {
  var r2, r3;
  r2 = r1 >> 2;
  r3 = r1 + 2068 | 0;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 0, 4);
  HEAP32[r2 + 43305] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 1, 4);
  HEAP32[r2 + 43306] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 2, 4);
  HEAP32[r2 + 43307] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 3, 4);
  HEAP32[r2 + 43308] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 4, 4);
  HEAP32[r2 + 43309] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 5, 4);
  HEAP32[r2 + 43310] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 6, 4);
  HEAP32[r2 + 43311] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 7, 4);
  HEAP32[r2 + 43312] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 8, 4);
  HEAP32[r2 + 43313] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 9, 4);
  HEAP32[r2 + 43314] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 10, 4);
  HEAP32[r2 + 43315] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 11, 4);
  HEAP32[r2 + 43316] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 12, 4);
  HEAP32[r2 + 43317] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 13, 4);
  HEAP32[r2 + 43318] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 14, 4);
  HEAP32[r2 + 43319] = r1;
  r1 = __Z21price_symbol_reversedPK9Bit_modelii(r3, 15, 4);
  HEAP32[r2 + 43320] = r1;
  HEAP32[r2 + 43321] = 16;
  return;
}
__ZN10LZ_encoder17fill_align_pricesEv["X"] = 1;
function __Z21price_symbol_reversedPK9Bit_modelii(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9;
  if ((r3 | 0) > 0) {
    r4 = 0;
    r5 = 1;
    r6 = r3;
    r7 = r2;
  } else {
    r8 = 0;
    return r8;
  }
  while (1) {
    r2 = r7 & 1;
    r3 = __Z9price_bitRK9Bit_modeli((r5 << 2) + r1 | 0, r2) + r4 | 0;
    r9 = r6 - 1 | 0;
    if ((r9 | 0) > 0) {
      r4 = r3;
      r5 = r2 | r5 << 1;
      r6 = r9;
      r7 = r7 >> 1;
    } else {
      r8 = r3;
      break;
    }
  }
  return r8;
}
function __ZN13Range_encoder10flush_dataEv(r1) {
  var r2, r3, r4, r5, r6;
  r2 = (r1 + 20 | 0) >> 2;
  r3 = HEAP32[r2];
  if ((r3 | 0) <= 0) {
    return;
  }
  r4 = HEAP32[r1 + 32 >> 2];
  do {
    if ((r4 | 0) > -1) {
      r5 = __Z10writeblockiPKhi(r4, HEAP32[r1 + 16 >> 2], r3);
      if ((r5 | 0) == (HEAP32[r2] | 0)) {
        r6 = r5;
        break;
      }
      r5 = ___cxa_allocate_exception(4);
      __ZN5ErrorC1EPKc(r5, 5252444);
      ___cxa_throw(r5, 5253560, 0);
    } else {
      r6 = r3;
    }
  } while (0);
  r3 = (r1 + 8 | 0) >> 2;
  r1 = (i64Math.add(HEAP32[r3], HEAP32[r3 + 1], r6, (r6 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
  r6 = HEAP32[tempDoublePtr + 4 >> 2];
  HEAP32[r3] = r1;
  HEAP32[r3 + 1] = r6;
  HEAP32[r2] = 0;
  return;
}
function __ZNK11Matchfinder15match_len_limitEv(r1) {
  return r1;
}
function __ZNK11Matchfinder13data_positionEv(r1, r2, r3) {
  var r4;
  r4 = (i64Math.add(r3, (r3 | 0) < 0 ? -1 : 0, r1, r2), HEAP32[tempDoublePtr >> 2]);
  return tempRet0 = HEAP32[tempDoublePtr + 4 >> 2], r4;
}
function __ZNK9Dis_slots5tableEi(r1) {
  return HEAP8[r1 + 5246632 | 0];
}
function __ZNK11MatchfinderixEi(r1, r2, r3) {
  return HEAP8[r1 + r2 + r3 | 0];
}
function __ZN10LZ_encoder5Trial6updateEiii(r1, r2, r3, r4) {
  var r5;
  r5 = r1 + 12 | 0;
  if ((HEAP32[r5 >> 2] | 0) <= (r4 | 0)) {
    return;
  }
  HEAP32[r1 + 4 >> 2] = r2;
  HEAP32[r1 + 8 >> 2] = r3;
  HEAP32[r5 >> 2] = r4;
  return;
}
function __ZN10LZ_encoder20fill_distance_pricesEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11;
  r2 = r1 >> 2;
  r3 = 0;
  r4 = 4;
  while (1) {
    r5 = __ZNK9Dis_slots5tableEi(r4) & 255;
    r6 = (r5 >>> 1) - 1 | 0;
    r7 = (r5 & 1 | 2) << r6;
    r8 = __Z21price_symbol_reversedPK9Bit_modelii((r7 - r5 << 2) + r1 + 1608 | 0, r4 - r7 | 0, r6);
    HEAP32[((r4 << 2) + 171172 >> 2) + r2] = r8;
    HEAP32[((r4 << 2) + 171684 >> 2) + r2] = r8;
    HEAP32[((r4 << 2) + 172196 >> 2) + r2] = r8;
    HEAP32[((r4 << 2) + 172708 >> 2) + r2] = r8;
    r8 = r4 + 1 | 0;
    if ((r8 | 0) == 128) {
      break;
    } else {
      r4 = r8;
    }
  }
  r4 = (r1 + 38072 | 0) >> 2;
  r8 = 0;
  while (1) {
    r6 = (r8 << 8) + r1 + 584 | 0;
    r7 = 0;
    while (1) {
      r5 = HEAP32[r4];
      if ((r7 | 0) >= (r5 | 0)) {
        r9 = r7;
        r10 = r5;
        break;
      }
      r5 = __Z12price_symbolPK9Bit_modelii(r6, r7, 6);
      HEAP32[((r7 << 2) + (r8 * 232 & -1) + 170244 >> 2) + r2] = r5;
      r11 = r7 + 1 | 0;
      if ((r11 | 0) < 14) {
        r7 = r11;
      } else {
        r3 = 393;
        break;
      }
    }
    if (r3 == 393) {
      r3 = 0;
      r9 = r11;
      r10 = HEAP32[r4];
    }
    L490 : do {
      if ((r9 | 0) < (r10 | 0)) {
        r7 = r9;
        while (1) {
          r5 = (r7 >>> 1 << 6) - 320 + __Z12price_symbolPK9Bit_modelii(r6, r7, 6) | 0;
          HEAP32[((r7 << 2) + (r8 * 232 & -1) + 170244 >> 2) + r2] = r5;
          r5 = r7 + 1 | 0;
          if ((r5 | 0) < (HEAP32[r4] | 0)) {
            r7 = r5;
          } else {
            break L490;
          }
        }
      }
    } while (0);
    HEAP32[((r8 << 9) + 171172 >> 2) + r2] = HEAP32[((r8 * 232 & -1) + 170244 >> 2) + r2];
    HEAP32[((r8 << 9) + 171176 >> 2) + r2] = HEAP32[((r8 * 232 & -1) + 170248 >> 2) + r2];
    HEAP32[((r8 << 9) + 171180 >> 2) + r2] = HEAP32[((r8 * 232 & -1) + 170252 >> 2) + r2];
    HEAP32[((r8 << 9) + 171184 >> 2) + r2] = HEAP32[((r8 * 232 & -1) + 170256 >> 2) + r2];
    r6 = 4;
    while (1) {
      r7 = ((__ZNK9Dis_slots5tableEi(r6) & 255) << 2) + r1 + (r8 * 232 & -1) + 170244 | 0;
      r5 = (r8 << 9) + (r6 << 2) + r1 + 171172 | 0;
      HEAP32[r5 >> 2] = HEAP32[r5 >> 2] + HEAP32[r7 >> 2] | 0;
      r7 = r6 + 1 | 0;
      if ((r7 | 0) == 128) {
        break;
      } else {
        r6 = r7;
      }
    }
    r6 = r8 + 1 | 0;
    if ((r6 | 0) == 4) {
      break;
    } else {
      r8 = r6;
    }
  }
  return;
}
__ZN10LZ_encoder20fill_distance_pricesEv["X"] = 1;
function __Z12price_symbolPK9Bit_modelii(r1, r2, r3) {
  var r4, r5, r6, r7;
  r4 = 1 << r3 | r2;
  if ((r4 | 0) > 1) {
    r5 = 0;
    r6 = r4;
  } else {
    r7 = 0;
    return r7;
  }
  while (1) {
    r4 = r6 >> 1;
    r2 = __Z9price_bitRK9Bit_modeli((r4 << 2) + r1 | 0, r6 & 1) + r5 | 0;
    if ((r4 | 0) > 1) {
      r5 = r2;
      r6 = r4;
    } else {
      r7 = r2;
      break;
    }
  }
  return r7;
}
function __ZN10LZ_encoder18sequence_optimizerEPKiRK5State(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40, r41, r42, r43, r44, r45, r46, r47, r48;
  r4 = r1 >> 2;
  r5 = 0;
  r6 = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  r7 = r6 >> 2;
  r8 = (r1 | 0) >> 2;
  r9 = HEAP32[r8];
  if ((r9 | 0) > 0) {
    HEAP32[r8] = 0;
    r10 = r9;
  } else {
    r10 = __ZN10LZ_encoder20read_match_distancesEv(r1);
  }
  r9 = (r1 + 2132 | 0) >> 2;
  r11 = HEAP32[r9], r12 = r11 >> 2;
  r13 = HEAP32[r2 >> 2];
  r14 = HEAP32[r12 + 2];
  r15 = HEAP32[r12 + 7];
  r16 = HEAP32[r12 + 9];
  r17 = __ZNK11Matchfinder14true_match_lenEiii(r14, r15, r16, 0, r13 + 1 | 0, 273);
  HEAP32[r7] = r17;
  r18 = r2 + 4 | 0;
  r19 = __ZNK11Matchfinder14true_match_lenEiii(r14, r15, r16, 0, HEAP32[r18 >> 2] + 1 | 0, 273);
  HEAP32[r7 + 1] = r19;
  r20 = (r19 | 0) > (r17 | 0) & 1;
  r21 = r2 + 8 | 0;
  r22 = __ZNK11Matchfinder14true_match_lenEiii(r14, r15, r16, 0, HEAP32[r21 >> 2] + 1 | 0, 273);
  HEAP32[r7 + 2] = r22;
  r23 = (r22 | 0) > (HEAP32[(r20 << 2 >> 2) + r7] | 0) ? 2 : r20;
  r20 = r2 + 12 | 0;
  r24 = __ZNK11Matchfinder14true_match_lenEiii(r14, r15, r16, 0, HEAP32[r20 >> 2] + 1 | 0, 273);
  HEAP32[r7 + 3] = r24;
  r16 = (r24 | 0) > (HEAP32[(r23 << 2 >> 2) + r7] | 0) ? 3 : r23;
  r23 = HEAP32[(r16 << 2 >> 2) + r7];
  r7 = __ZNK11Matchfinder15match_len_limitEv(HEAP32[r12 + 11]);
  if ((r23 | 0) >= (r7 | 0)) {
    HEAP32[r4 + 9794] = r16;
    HEAP32[r4 + 9796] = r23;
    __ZN10LZ_encoder8move_posEib(r1, r23, 1);
    r25 = r23;
    STACKTOP = r6;
    return r25;
  }
  if ((r10 | 0) >= (r7 | 0)) {
    HEAP32[r4 + 9794] = HEAP32[((r7 << 2) + 38076 >> 2) + r4] + 4 | 0;
    HEAP32[r4 + 9796] = r10;
    __ZN10LZ_encoder8move_posEib(r1, r10, 1);
    r25 = r10;
    STACKTOP = r6;
    return r25;
  }
  r7 = r11 | 0;
  r11 = __ZNK11Matchfinder13data_positionEv(HEAP32[r7 >> 2], HEAP32[r7 + 4 >> 2], r15);
  r7 = __ZNK11MatchfinderixEi(r14, r15, -1);
  r16 = __ZNK11MatchfinderixEi(r14, r15, 0);
  r12 = __ZNK11MatchfinderixEi(r14, r15, r13 ^ -1);
  r13 = r3 | 0;
  HEAP8[r1 + 39172 | 0] = HEAP8[r13];
  HEAP32[r4 + 9797] = HEAP32[r2 >> 2];
  HEAP32[r4 + 9798] = HEAP32[r18 >> 2];
  HEAP32[r4 + 9799] = HEAP32[r21 >> 2];
  HEAP32[r4 + 9800] = HEAP32[r20 >> 2];
  r20 = r11 & 3;
  r11 = r1 + 39208 | 0;
  HEAP32[r11 >> 2] = -1;
  HEAP32[r4 + 9803] = 0;
  r21 = ((__ZNK5StateclEv(HEAP8[r13]) & 255) << 4) + (r20 << 2) + r1 + 8 | 0;
  r18 = __Z6price0RK9Bit_model(HEAP32[r21 >> 2]);
  r21 = r1 + 39216 | 0;
  HEAP32[r21 >> 2] = r18;
  r2 = r1 + 13496 | 0;
  if (__ZNK5State7is_charEv(HEAP8[r13])) {
    r26 = __ZNK15Literal_encoder12price_symbolEhh(r2, r7, r16);
  } else {
    r26 = __ZNK15Literal_encoder13price_matchedEhhh(r2, r7, r16, r12);
  }
  HEAP32[r21 >> 2] = r26 + r18 | 0;
  r18 = HEAP8[r13];
  r26 = __ZNK5StateclEv(r18) & 255;
  r21 = __Z6price1RK9Bit_model(HEAP32[((r26 << 4) + (r20 << 2) + 8 >> 2) + r4]);
  r7 = __Z6price1RK9Bit_model(HEAP32[((r26 << 2) + 200 >> 2) + r4]) + r21 | 0;
  if (r12 << 24 >> 24 == r16 << 24 >> 24) {
    __ZN10LZ_encoder5Trial6updateEiii(r1 + 39204 | 0, 0, 0, __ZNK10LZ_encoder14price_rep_len1ERK5Statei(r1, r18, r20) + r7 | 0);
  }
  if ((r10 | 0) < 2) {
    HEAP32[r4 + 9794] = HEAP32[r11 >> 2];
    HEAP32[r4 + 9796] = 1;
    __ZN11Matchfinder8move_posEv(HEAP32[r9]);
    r25 = 1;
    STACKTOP = r6;
    return r25;
  }
  L528 : do {
    if ((r10 | 0) > (r23 | 0)) {
      r11 = ((__ZNK5StateclEv(HEAP8[r13]) & 255) << 2) + r1 + 200 | 0;
      r18 = __Z6price0RK9Bit_model(HEAP32[r11 >> 2]) + r21 | 0;
      r11 = r10 + 1 | 0;
      r16 = 2;
      while (1) {
        r12 = (r16 << 2) + r1 + 38076 | 0;
        HEAP32[((r16 << 5) + 39176 >> 2) + r4] = HEAP32[r12 >> 2] + 4 | 0;
        HEAP32[((r16 << 5) + 39180 >> 2) + r4] = 0;
        r26 = r18 + __ZNK10LZ_encoder10price_pairEiii(r1, HEAP32[r12 >> 2], r16, r20) | 0;
        HEAP32[((r16 << 5) + 39184 >> 2) + r4] = r26;
        r26 = r16 + 1 | 0;
        if ((r26 | 0) == (r11 | 0)) {
          r27 = r10;
          break L528;
        } else {
          r16 = r26;
        }
      }
    } else {
      if ((r23 | 0) < 2) {
        r27 = r23;
        break;
      }
      r16 = r23 + 1 | 0;
      r11 = 2;
      while (1) {
        HEAP32[((r11 << 5) + 39184 >> 2) + r4] = 268435455;
        r18 = r11 + 1 | 0;
        if ((r18 | 0) == (r16 | 0)) {
          r27 = r23;
          break L528;
        } else {
          r11 = r18;
        }
      }
    }
  } while (0);
  r23 = r1 + 7836 | 0;
  r10 = HEAP8[r13];
  r21 = __ZNK10LZ_encoder9price_repEiRK5Statei(r1, 0, r10, r20) + r7 | 0;
  if ((r17 | 0) < 2) {
    r28 = r10;
  } else {
    r10 = 2;
    while (1) {
      __ZN10LZ_encoder5Trial6updateEiii((r10 << 5) + r1 + 39172 | 0, 0, 0, r21 + __ZNK11Len_encoder5priceEii(r23, r10, r20) | 0);
      r11 = r10 + 1 | 0;
      if ((r11 | 0) > (r17 | 0)) {
        break;
      } else {
        r10 = r11;
      }
    }
    r28 = HEAP8[r13];
  }
  r10 = __ZNK10LZ_encoder9price_repEiRK5Statei(r1, 1, r28, r20) + r7 | 0;
  if ((r19 | 0) < 2) {
    r29 = r28;
  } else {
    r28 = 2;
    while (1) {
      __ZN10LZ_encoder5Trial6updateEiii((r28 << 5) + r1 + 39172 | 0, 1, 0, r10 + __ZNK11Len_encoder5priceEii(r23, r28, r20) | 0);
      r17 = r28 + 1 | 0;
      if ((r17 | 0) > (r19 | 0)) {
        break;
      } else {
        r28 = r17;
      }
    }
    r29 = HEAP8[r13];
  }
  r28 = __ZNK10LZ_encoder9price_repEiRK5Statei(r1, 2, r29, r20) + r7 | 0;
  if ((r22 | 0) < 2) {
    r30 = r29;
  } else {
    r29 = 2;
    while (1) {
      __ZN10LZ_encoder5Trial6updateEiii((r29 << 5) + r1 + 39172 | 0, 2, 0, r28 + __ZNK11Len_encoder5priceEii(r23, r29, r20) | 0);
      r19 = r29 + 1 | 0;
      if ((r19 | 0) > (r22 | 0)) {
        break;
      } else {
        r29 = r19;
      }
    }
    r30 = HEAP8[r13];
  }
  r13 = __ZNK10LZ_encoder9price_repEiRK5Statei(r1, 3, r30, r20) + r7 | 0;
  L552 : do {
    if ((r24 | 0) >= 2) {
      r7 = 2;
      while (1) {
        __ZN10LZ_encoder5Trial6updateEiii((r7 << 5) + r1 + 39172 | 0, 3, 0, r13 + __ZNK11Len_encoder5priceEii(r23, r7, r20) | 0);
        r30 = r7 + 1 | 0;
        if ((r30 | 0) > (r24 | 0)) {
          break L552;
        } else {
          r7 = r30;
        }
      }
    }
  } while (0);
  __ZN11Matchfinder8move_posEv(HEAP32[r9]);
  r24 = r1 + 38084 | 0;
  r20 = r1 + 2176 | 0;
  r13 = 0;
  r7 = r27;
  L556 : while (1) {
    r27 = r13;
    while (1) {
      r31 = r27 + 1 | 0;
      if ((r31 | 0) >= (r7 | 0)) {
        r5 = 431;
        break L556;
      }
      r32 = __ZN10LZ_encoder20read_match_distancesEv(r1);
      if ((r32 | 0) >= (__ZNK11Matchfinder15match_len_limitEv(HEAP32[HEAP32[r9] + 44 >> 2]) | 0)) {
        r5 = 433;
        break L556;
      }
      r30 = (r31 << 5) + r1 + 39172 | 0;
      r29 = HEAP32[((r31 << 5) + 39180 >> 2) + r4];
      r33 = r30 | 0;
      HEAP8[r33] = HEAP8[(r29 << 5) + r1 + 39172 | 0];
      r22 = (r31 << 5) + r1 + 39188 | 0;
      HEAP32[r22 >> 2] = HEAP32[((r29 << 5) + 39188 >> 2) + r4];
      HEAP32[((r31 << 5) + 39192 >> 2) + r4] = HEAP32[((r29 << 5) + 39192 >> 2) + r4];
      HEAP32[((r31 << 5) + 39196 >> 2) + r4] = HEAP32[((r29 << 5) + 39196 >> 2) + r4];
      HEAP32[((r31 << 5) + 39200 >> 2) + r4] = HEAP32[((r29 << 5) + 39200 >> 2) + r4];
      r28 = r30 | 0;
      r30 = (r31 << 5) + r1 + 39176 | 0;
      r19 = HEAP32[r30 >> 2];
      do {
        if ((r29 | 0) == (r27 | 0)) {
          if ((r19 | 0) == 0) {
            __ZN5State13set_short_repEv(r28);
            break;
          } else {
            __ZN5State8set_charEv(r28);
            break;
          }
        } else {
          if ((r19 | 0) < 4) {
            __ZN5State7set_repEv(r28);
          } else {
            __ZN5State9set_matchEv(r28);
          }
          __ZN10LZ_encoder8mtf_repsEiPi(HEAP32[r30 >> 2], r22);
        }
      } while (0);
      r30 = HEAP32[r9];
      r28 = r30 | 0;
      r19 = HEAP32[r30 + 28 >> 2];
      r34 = __ZNK11Matchfinder13data_positionEv(HEAP32[r28 >> 2], HEAP32[r28 + 4 >> 2], r19) & 3;
      r28 = HEAP32[r30 + 8 >> 2];
      r29 = __ZNK11MatchfinderixEi(r28, r19, -1);
      r10 = __ZNK11MatchfinderixEi(r28, r19, 0);
      r17 = __ZNK11MatchfinderixEi(r28, r19, HEAP32[r22 >> 2] ^ -1);
      r19 = (r31 << 5) + r1 + 39184 | 0;
      r28 = HEAP32[r19 >> 2];
      r21 = HEAP8[r33];
      r11 = ((__ZNK5StateclEv(r21) & 255) << 4) + (r34 << 2) + r1 + 8 | 0;
      r16 = __Z6price0RK9Bit_model(HEAP32[r11 >> 2]) + r28 | 0;
      if (__ZNK5State7is_charEv(r21)) {
        r35 = __ZNK15Literal_encoder12price_symbolEhh(r2, r29, r10);
      } else {
        r35 = __ZNK15Literal_encoder13price_matchedEhhh(r2, r29, r10, r17);
      }
      __ZN11Matchfinder8move_posEv(r30);
      r30 = r27 + 2 | 0;
      r29 = (r30 << 5) + r1 + 39172 | 0;
      __ZN10LZ_encoder5Trial6updateEiii(r29, -1, r31, r16 + r35 | 0);
      r16 = HEAP32[r19 >> 2];
      r19 = HEAP8[r33];
      r21 = __ZNK5StateclEv(r19) & 255;
      r36 = __Z6price1RK9Bit_model(HEAP32[((r21 << 4) + (r34 << 2) + 8 >> 2) + r4]) + r16 | 0;
      r37 = r36 + __Z6price1RK9Bit_model(HEAP32[((r21 << 2) + 200 >> 2) + r4]) | 0;
      do {
        if (r17 << 24 >> 24 == r10 << 24 >> 24) {
          if ((HEAP32[((r30 << 5) + 39176 >> 2) + r4] | 0) == 0) {
            break;
          }
          __ZN10LZ_encoder5Trial6updateEiii(r29, 0, r31, __ZNK10LZ_encoder14price_rep_len1ERK5Statei(r1, r19, r34) + r37 | 0);
        }
      } while (0);
      r19 = 4094 - r27 | 0;
      r29 = HEAP32[r9], r30 = r29 >> 2;
      r10 = HEAP32[r30 + 7];
      r17 = __ZNK11Matchfinder15available_bytesEv(r10, HEAP32[r30 + 9]);
      r22 = (r19 | 0) < (r17 | 0) ? r19 : r17;
      r17 = __ZNK11Matchfinder15match_len_limitEv(HEAP32[r30 + 11]);
      r38 = (r22 | 0) < (r17 | 0) ? r22 : r17;
      if ((r38 | 0) < 2) {
        r27 = r31;
      } else {
        r39 = r7;
        r40 = 0;
        r41 = r29;
        r42 = r10;
        break;
      }
    }
    while (1) {
      r10 = HEAP32[((r31 << 5) + (r40 << 2) + 39188 >> 2) + r4];
      r29 = __ZNK11Matchfinder18ptr_to_current_posEv(HEAP32[r41 + 8 >> 2], r42);
      r17 = -2 - r10 | 0;
      r10 = 0;
      while (1) {
        if ((r10 | 0) >= (r38 | 0)) {
          break;
        }
        if (HEAP8[r29 + (r10 - 1) | 0] << 24 >> 24 == HEAP8[r29 + r17 + r10 | 0] << 24 >> 24) {
          r10 = r10 + 1 | 0;
        } else {
          break;
        }
      }
      L587 : do {
        if ((r10 | 0) > 1) {
          r17 = __ZNK10LZ_encoder9price_repEiRK5Statei(r1, r40, HEAP8[r33], r34) + r37 | 0;
          r29 = r10 + r31 | 0;
          L589 : do {
            if ((r39 | 0) < (r29 | 0)) {
              r22 = r39;
              while (1) {
                r30 = r22 + 1 | 0;
                HEAP32[((r30 << 5) + 39184 >> 2) + r4] = 268435455;
                if ((r30 | 0) == (r29 | 0)) {
                  r43 = r29;
                  break L589;
                } else {
                  r22 = r30;
                }
              }
            } else {
              r43 = r39;
            }
          } while (0);
          r29 = r10;
          while (1) {
            __ZN10LZ_encoder5Trial6updateEiii((r29 + r31 << 5) + r1 + 39172 | 0, r40, r31, r17 + __ZNK11Len_encoder5priceEii(r23, r29, r34) | 0);
            r22 = r29 - 1 | 0;
            if ((r22 | 0) > 1) {
              r29 = r22;
            } else {
              r44 = r43;
              break L587;
            }
          }
        } else {
          r44 = r39;
        }
      } while (0);
      r10 = r40 + 1 | 0;
      if ((r10 | 0) == 4) {
        break;
      }
      r29 = HEAP32[r9];
      r39 = r44;
      r40 = r10;
      r41 = r29;
      r42 = HEAP32[r29 + 28 >> 2];
    }
    if ((r32 | 0) > (r38 | 0)) {
      r13 = r31;
      r7 = r44;
      continue;
    }
    if ((r32 | 0) <= 2) {
      if ((r32 | 0) != 2) {
        r13 = r31;
        r7 = r44;
        continue;
      }
      if ((HEAP32[r24 >> 2] | 0) >= 128) {
        r13 = r31;
        r7 = r44;
        continue;
      }
    }
    r29 = ((__ZNK5StateclEv(HEAP8[r33]) & 255) << 2) + r1 + 200 | 0;
    r10 = __Z6price0RK9Bit_model(HEAP32[r29 >> 2]) + r36 | 0;
    r29 = r32 + r31 | 0;
    L603 : do {
      if ((r44 | 0) < (r29 | 0)) {
        r17 = r44;
        while (1) {
          r22 = r17 + 1 | 0;
          HEAP32[((r22 << 5) + 39184 >> 2) + r4] = 268435455;
          if ((r22 | 0) == (r29 | 0)) {
            r45 = r29;
            break L603;
          } else {
            r17 = r22;
          }
        }
      } else {
        r45 = r44;
      }
    } while (0);
    r29 = HEAP32[r24 >> 2];
    r17 = __Z13get_dis_statei(2);
    if ((r29 | 0) < 128) {
      __ZN10LZ_encoder5Trial6updateEiii((r27 + 3 << 5) + r1 + 39172 | 0, r29 + 4 | 0, r31, (HEAP32[((r17 << 9) + (r29 << 2) + 171172 >> 2) + r4] + r10 | 0) + __ZNK11Len_encoder5priceEii(r20, 2, r34) | 0);
    }
    if ((r32 | 0) < 3) {
      r13 = r31;
      r7 = r45;
      continue;
    }
    r22 = r32 + 1 | 0;
    r30 = r29;
    r29 = r17;
    r17 = 268435455;
    r19 = 3;
    while (1) {
      r21 = HEAP32[((r19 << 2) + 38076 >> 2) + r4];
      if ((r30 | 0) != (r21 | 0) | (r29 | 0) < 3) {
        r16 = __Z13get_dis_statei(r19);
        r46 = __ZNK10LZ_encoder9price_disEii(r1, r21, r16);
        r47 = r16;
        r48 = r21;
      } else {
        r46 = r17;
        r47 = r29;
        r48 = r30;
      }
      __ZN10LZ_encoder5Trial6updateEiii((r19 + r31 << 5) + r1 + 39172 | 0, r48 + 4 | 0, r31, r46 + r10 + __ZNK11Len_encoder5priceEii(r20, r19, r34) | 0);
      r21 = r19 + 1 | 0;
      if ((r21 | 0) == (r22 | 0)) {
        r13 = r31;
        r7 = r45;
        continue L556;
      } else {
        r30 = r48;
        r29 = r47;
        r17 = r46;
        r19 = r21;
      }
    }
  }
  if (r5 == 433) {
    HEAP32[r8] = r32;
    __ZN10LZ_encoder8backwardEi(r1, r31);
    r25 = r31;
    STACKTOP = r6;
    return r25;
  } else if (r5 == 431) {
    __ZN10LZ_encoder8backwardEi(r1, r31);
    r25 = r31;
    STACKTOP = r6;
    return r25;
  }
}
__ZN10LZ_encoder18sequence_optimizerEPKiRK5State["X"] = 1;
function __ZN10LZ_encoder20read_match_distancesEv(r1) {
  var r2, r3, r4, r5;
  r2 = r1 + 2132 | 0;
  r3 = __ZN11Matchfinder17longest_match_lenEPi(HEAP32[r2 >> 2], r1 + 38076 | 0);
  r4 = HEAP32[r2 >> 2] >> 2;
  if ((r3 | 0) != (__ZNK11Matchfinder15match_len_limitEv(HEAP32[r4 + 11]) | 0)) {
    r5 = r3;
    return r5;
  }
  r5 = __ZNK11Matchfinder14true_match_lenEiii(HEAP32[r4 + 2], HEAP32[r4 + 7], HEAP32[r4 + 9], r3, HEAP32[r1 + (r3 << 2) + 38076 >> 2] + 1 | 0, 273 - r3 | 0) + r3 | 0;
  return r5;
}
function __ZNK11Matchfinder14true_match_lenEiii(r1, r2, r3, r4, r5, r6) {
  var r7, r8;
  r7 = 0;
  r8 = __ZNK11Matchfinder15available_bytesEv(r2, r3);
  r3 = (r6 + r4 | 0) > (r8 | 0) ? r8 - r4 | 0 : r6;
  r6 = r2 + r4 | 0;
  r4 = r6 - r5 | 0;
  r5 = 0;
  while (1) {
    if ((r5 | 0) >= (r3 | 0)) {
      r7 = 495;
      break;
    }
    if (HEAP8[r1 + r4 + r5 | 0] << 24 >> 24 == HEAP8[r1 + r5 + r6 | 0] << 24 >> 24) {
      r5 = r5 + 1 | 0;
    } else {
      r7 = 496;
      break;
    }
  }
  if (r7 == 496) {
    return r5;
  } else if (r7 == 495) {
    return r5;
  }
}
function __ZN10LZ_encoder8move_posEib(r1, r2, r3) {
  var r4, r5;
  if ((r2 | 0) <= 0) {
    return;
  }
  r4 = r1 + 2132 | 0;
  r1 = r3 & 1;
  r3 = r2;
  while (1) {
    r2 = r3 - 1 | 0;
    if ((r1 & 1) << 24 >> 24 == 0) {
      __ZN11Matchfinder17longest_match_lenEPi(HEAP32[r4 >> 2], 0);
      r5 = r1;
    } else {
      r5 = 0;
    }
    __ZN11Matchfinder8move_posEv(HEAP32[r4 >> 2]);
    if ((r2 | 0) > 0) {
      r1 = r5;
      r3 = r2;
    } else {
      break;
    }
  }
  return;
}
function __Z6price0RK9Bit_model(r1) {
  return __ZNK11Prob_pricesixEi(r1);
}
function __ZNK15Literal_encoder12price_symbolEhh(r1, r2, r3) {
  return __Z12price_symbolPK9Bit_modelii(r1 + (__ZNK15Literal_encoder6lstateEh(r2) * 3072 & -1) | 0, r3 & 255, 8);
}
function __ZNK15Literal_encoder13price_matchedEhhh(r1, r2, r3, r4) {
  return __Z13price_matchedPK9Bit_modelii(r1 + (__ZNK15Literal_encoder6lstateEh(r2) * 3072 & -1) | 0, r3 & 255, r4 & 255);
}
function __Z6price1RK9Bit_model(r1) {
  return __ZNK11Prob_pricesixEi(2048 - r1 | 0);
}
function __ZNK10LZ_encoder14price_rep_len1ERK5Statei(r1, r2, r3) {
  var r4;
  r4 = __ZNK5StateclEv(r2) & 255;
  return __Z6price0RK9Bit_model(HEAP32[r1 + (r4 << 2) + 248 >> 2]) + __Z6price0RK9Bit_model(HEAP32[r1 + (r4 << 4) + (r3 << 2) + 392 >> 2]) | 0;
}
function __ZNK11Matchfinder15dictionary_sizeEv(r1) {
  return r1;
}
function __ZNK10LZ_encoder3crcEv(r1) {
  return r1 ^ -1;
}
function __ZNK13Range_encoder15member_positionEv(r1, r2, r3, r4) {
  var r5;
  r5 = (i64Math.add((i64Math.add(r3, (r3 | 0) < 0 ? -1 : 0, r1, r2), HEAP32[tempDoublePtr >> 2]), HEAP32[tempDoublePtr + 4 >> 2], r4, (r4 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
  return tempRet0 = HEAP32[tempDoublePtr + 4 >> 2], r5;
}
function __Z9real_bitsi(r1) {
  var r2, r3, r4, r5, r6;
  r2 = 0;
  r3 = 1;
  r4 = 1;
  while (1) {
    r5 = (r4 & r1 | 0) == 0 ? r2 : r3;
    r6 = r3 + 1 | 0;
    if ((r6 | 0) == 32) {
      break;
    } else {
      r2 = r5;
      r3 = r6;
      r4 = r4 << 1;
    }
  }
  return r5;
}
function __ZNK11Len_encoder5priceEii(r1, r2, r3) {
  return HEAP32[r1 + (r3 * 1088 & -1) + (r2 - 2 << 2) + 1288 >> 2];
}
function __ZN10LZ_encoder8backwardEi(r1, r2) {
  var r3, r4, r5, r6;
  r3 = (r2 << 5) + r1 + 39176 | 0;
  if ((r2 | 0) > 0) {
    r4 = r2;
  } else {
    return;
  }
  while (1) {
    r2 = HEAP32[r1 + (r4 << 5) + 39180 >> 2];
    HEAP32[r1 + (r2 << 5) + 39184 >> 2] = r4 - r2 | 0;
    r5 = HEAP32[r3 >> 2];
    r6 = (r2 << 5) + r1 + 39176 | 0;
    HEAP32[r3 >> 2] = HEAP32[r6 >> 2];
    HEAP32[r6 >> 2] = r5;
    if ((r2 | 0) > 0) {
      r4 = r2;
    } else {
      break;
    }
  }
  return;
}
function __ZN10LZ_encoder8mtf_repsEiPi(r1, r2) {
  var r3, r4, r5;
  r3 = r2 >> 2;
  if ((r1 | 0) > 3) {
    r4 = r2 + 8 | 0;
    HEAP32[r3 + 3] = HEAP32[r4 >> 2];
    r5 = r2 + 4 | 0;
    HEAP32[r4 >> 2] = HEAP32[r5 >> 2];
    HEAP32[r5 >> 2] = HEAP32[r3];
    HEAP32[r3] = r1 - 4 | 0;
    return;
  }
  if ((r1 | 0) <= 0) {
    return;
  }
  r5 = HEAP32[(r1 << 2 >> 2) + r3];
  r4 = r1;
  while (1) {
    r1 = r4 - 1 | 0;
    HEAP32[(r4 << 2 >> 2) + r3] = HEAP32[(r1 << 2 >> 2) + r3];
    if ((r1 | 0) > 0) {
      r4 = r1;
    } else {
      break;
    }
  }
  HEAP32[r3] = r5;
  return;
}
function __ZNK11Matchfinder18ptr_to_current_posEv(r1, r2) {
  return r1 + r2 | 0;
}
function __ZN12File_trailer8data_crcEj(r1, r2) {
  HEAP8[r1 | 0] = r2 & 255;
  HEAP8[r1 + 1 | 0] = r2 >>> 8 & 255;
  HEAP8[r1 + 2 | 0] = r2 >>> 16 & 255;
  HEAP8[r1 + 3 | 0] = r2 >>> 24 & 255;
  return;
}
function __ZN12File_trailer9data_sizeEx(r1, r2, r3) {
  HEAP8[r1 + 4 | 0] = r2 & 255;
  HEAP8[r1 + 5 | 0] = (r2 >>> 8 | r3 << 24) & 255;
  HEAP8[r1 + 6 | 0] = (r2 >>> 16 | r3 << 16) & 255;
  HEAP8[r1 + 7 | 0] = (r2 >>> 24 | r3 << 8) & 255;
  HEAP8[r1 + 8 | 0] = r3 & 255;
  HEAP8[r1 + 9 | 0] = (r3 >>> 8 | 0 << 24) & 255;
  HEAP8[r1 + 10 | 0] = (r3 >>> 16 | 0 << 16) & 255;
  HEAP8[r1 + 11 | 0] = (r3 >>> 24 | 0 << 8) & 255;
  return;
}
function __ZNK11Matchfinder8finishedEv(r1) {
  var r2;
  if ((HEAP8[r1 + 56 | 0] & 1) << 24 >> 24 == 0) {
    r2 = 0;
    return r2;
  }
  r2 = (HEAP32[r1 + 28 >> 2] | 0) >= (HEAP32[r1 + 36 >> 2] | 0);
  return r2;
}
function __ZNK10LZ_encoder10price_pairEiii(r1, r2, r3, r4) {
  var r5;
  if ((r3 | 0) < 3 & (r2 | 0) > 127) {
    r5 = 268435455;
    return r5;
  }
  r5 = __ZNK11Len_encoder5priceEii(r1 + 2176 | 0, r3, r4) + __ZNK10LZ_encoder9price_disEii(r1, r2, __Z13get_dis_statei(r3)) | 0;
  return r5;
}
function __ZNK10LZ_encoder9price_repEiRK5Statei(r1, r2, r3, r4) {
  var r5, r6;
  r5 = __ZNK5StateclEv(r3) & 255;
  r3 = HEAP32[r1 + (r5 << 2) + 248 >> 2];
  if ((r2 | 0) == 0) {
    r6 = __Z6price0RK9Bit_model(r3) + __Z6price1RK9Bit_model(HEAP32[r1 + (r5 << 4) + (r4 << 2) + 392 >> 2]) | 0;
    return r6;
  }
  r4 = __Z6price1RK9Bit_model(r3);
  r3 = HEAP32[r1 + (r5 << 2) + 296 >> 2];
  if ((r2 | 0) == 1) {
    r6 = __Z6price0RK9Bit_model(r3) + r4 | 0;
    return r6;
  } else {
    r6 = (__Z6price1RK9Bit_model(r3) + r4 | 0) + __Z9price_bitRK9Bit_modeli((r5 << 2) + r1 + 344 | 0, r2 - 2 | 0) | 0;
    return r6;
  }
}
function __ZNK10LZ_encoder9price_disEii(r1, r2, r3) {
  var r4, r5;
  if ((r2 | 0) < 128) {
    r4 = HEAP32[r1 + (r3 << 9) + (r2 << 2) + 171172 >> 2];
    return r4;
  } else {
    r5 = (__ZNK9Dis_slotsixEj(r2) << 2) + r1 + (r3 * 232 & -1) + 170244 | 0;
    r4 = HEAP32[r1 + ((r2 & 15) << 2) + 173220 >> 2] + HEAP32[r5 >> 2] | 0;
    return r4;
  }
}
function __ZN10LZ_encoder10full_flushERK5State(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9;
  r3 = STACKTOP;
  STACKTOP = STACKTOP + 20 | 0;
  r4 = r3;
  r5 = r1 + 2132 | 0;
  r6 = HEAP32[r5 >> 2];
  r7 = r6 | 0;
  r8 = __ZNK11Matchfinder13data_positionEv(HEAP32[r7 >> 2], HEAP32[r7 + 4 >> 2], HEAP32[r6 + 28 >> 2]) & 3;
  r6 = r1 + 2136 | 0;
  r7 = r2 | 0;
  __ZN13Range_encoder10encode_bitER9Bit_modeli(r6, ((__ZNK5StateclEv(HEAP8[r7]) & 255) << 4) + (r8 << 2) + r1 + 8 | 0, 1);
  __ZN13Range_encoder10encode_bitER9Bit_modeli(r6, ((__ZNK5StateclEv(HEAP8[r7]) & 255) << 2) + r1 + 200 | 0, 0);
  __ZN10LZ_encoder11encode_pairEjii(r1, -1, 2, r8);
  __ZN13Range_encoder5flushEv(r6);
  __ZN12File_trailer8data_crcEj(r4, __ZNK10LZ_encoder3crcEv(HEAP32[r1 + 4 >> 2]));
  r8 = HEAP32[r5 >> 2];
  r5 = r8 | 0;
  __ZN12File_trailer9data_sizeEx(r4, __ZNK11Matchfinder13data_positionEv(HEAP32[r5 >> 2], HEAP32[r5 + 4 >> 2], HEAP32[r8 + 28 >> 2]), tempRet0);
  r8 = r1 + 2144 | 0;
  r5 = __ZNK13Range_encoder15member_positionEv(HEAP32[r8 >> 2], HEAP32[r8 + 4 >> 2], HEAP32[r1 + 2156 >> 2], HEAP32[r1 + 2164 >> 2]);
  r1 = tempRet0;
  r8 = __ZN12File_trailer4sizeEi(1);
  __ZN12File_trailer11member_sizeEx(r4, (i64Math.add(r8, (r8 | 0) < 0 ? -1 : 0, r5, r1), HEAP32[tempDoublePtr >> 2]), HEAP32[tempDoublePtr + 4 >> 2]);
  if ((r8 | 0) > 0) {
    r9 = 0;
  } else {
    __ZN13Range_encoder10flush_dataEv(r6);
    STACKTOP = r3;
    return;
  }
  while (1) {
    __ZN13Range_encoder8put_byteEh(r6, HEAP8[r4 + r9 | 0]);
    r1 = r9 + 1 | 0;
    if ((r1 | 0) == (r8 | 0)) {
      break;
    } else {
      r9 = r1;
    }
  }
  __ZN13Range_encoder10flush_dataEv(r6);
  STACKTOP = r3;
  return;
}
__ZN10LZ_encoder10full_flushERK5State["X"] = 1;
function __ZN13Range_encoder5flushEv(r1) {
  __ZN13Range_encoder9shift_lowEv(r1);
  __ZN13Range_encoder9shift_lowEv(r1);
  __ZN13Range_encoder9shift_lowEv(r1);
  __ZN13Range_encoder9shift_lowEv(r1);
  __ZN13Range_encoder9shift_lowEv(r1);
  return;
}
function __ZN13Range_encoder8put_byteEh(r1, r2) {
  var r3;
  r3 = (r1 + 20 | 0) >> 2;
  HEAP8[HEAP32[r1 + 16 >> 2] + HEAP32[r3] | 0] = r2;
  r2 = HEAP32[r3] + 1 | 0;
  HEAP32[r3] = r2;
  if ((r2 | 0) <= 65535) {
    return;
  }
  __ZN13Range_encoder10flush_dataEv(r1);
  return;
}
function __ZN10LZ_encoderC1ER11MatchfinderRK11File_headeri(r1, r2, r3, r4) {
  __ZN10LZ_encoderC2ER11MatchfinderRK11File_headeri(r1, r2, r3, r4);
  return;
}
function __ZN10LZ_encoderC2ER11MatchfinderRK11File_headeri(r1, r2, r3, r4) {
  var r5, r6, r7;
  HEAP32[r1 >> 2] = 0;
  HEAP32[r1 + 4 >> 2] = -1;
  r5 = r1 + 200 | 0;
  r6 = r1 + 8 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r6);
    r7 = r6 + 4 | 0;
    if ((r7 | 0) == (r5 | 0)) {
      break;
    } else {
      r6 = r7;
    }
  }
  __ZN9Bit_modelC1Ev(r1 + 200 | 0);
  __ZN9Bit_modelC1Ev(r1 + 204 | 0);
  __ZN9Bit_modelC1Ev(r1 + 208 | 0);
  __ZN9Bit_modelC1Ev(r1 + 212 | 0);
  __ZN9Bit_modelC1Ev(r1 + 216 | 0);
  __ZN9Bit_modelC1Ev(r1 + 220 | 0);
  __ZN9Bit_modelC1Ev(r1 + 224 | 0);
  __ZN9Bit_modelC1Ev(r1 + 228 | 0);
  __ZN9Bit_modelC1Ev(r1 + 232 | 0);
  __ZN9Bit_modelC1Ev(r1 + 236 | 0);
  __ZN9Bit_modelC1Ev(r1 + 240 | 0);
  __ZN9Bit_modelC1Ev(r1 + 244 | 0);
  __ZN9Bit_modelC1Ev(r1 + 248 | 0);
  __ZN9Bit_modelC1Ev(r1 + 252 | 0);
  __ZN9Bit_modelC1Ev(r1 + 256 | 0);
  __ZN9Bit_modelC1Ev(r1 + 260 | 0);
  __ZN9Bit_modelC1Ev(r1 + 264 | 0);
  __ZN9Bit_modelC1Ev(r1 + 268 | 0);
  __ZN9Bit_modelC1Ev(r1 + 272 | 0);
  __ZN9Bit_modelC1Ev(r1 + 276 | 0);
  __ZN9Bit_modelC1Ev(r1 + 280 | 0);
  __ZN9Bit_modelC1Ev(r1 + 284 | 0);
  __ZN9Bit_modelC1Ev(r1 + 288 | 0);
  __ZN9Bit_modelC1Ev(r1 + 292 | 0);
  __ZN9Bit_modelC1Ev(r1 + 296 | 0);
  __ZN9Bit_modelC1Ev(r1 + 300 | 0);
  __ZN9Bit_modelC1Ev(r1 + 304 | 0);
  __ZN9Bit_modelC1Ev(r1 + 308 | 0);
  __ZN9Bit_modelC1Ev(r1 + 312 | 0);
  __ZN9Bit_modelC1Ev(r1 + 316 | 0);
  __ZN9Bit_modelC1Ev(r1 + 320 | 0);
  __ZN9Bit_modelC1Ev(r1 + 324 | 0);
  __ZN9Bit_modelC1Ev(r1 + 328 | 0);
  __ZN9Bit_modelC1Ev(r1 + 332 | 0);
  __ZN9Bit_modelC1Ev(r1 + 336 | 0);
  __ZN9Bit_modelC1Ev(r1 + 340 | 0);
  __ZN9Bit_modelC1Ev(r1 + 344 | 0);
  __ZN9Bit_modelC1Ev(r1 + 348 | 0);
  __ZN9Bit_modelC1Ev(r1 + 352 | 0);
  __ZN9Bit_modelC1Ev(r1 + 356 | 0);
  __ZN9Bit_modelC1Ev(r1 + 360 | 0);
  __ZN9Bit_modelC1Ev(r1 + 364 | 0);
  __ZN9Bit_modelC1Ev(r1 + 368 | 0);
  __ZN9Bit_modelC1Ev(r1 + 372 | 0);
  __ZN9Bit_modelC1Ev(r1 + 376 | 0);
  __ZN9Bit_modelC1Ev(r1 + 380 | 0);
  __ZN9Bit_modelC1Ev(r1 + 384 | 0);
  __ZN9Bit_modelC1Ev(r1 + 388 | 0);
  r6 = r1 + 584 | 0;
  r5 = r1 + 392 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r5);
    r7 = r5 + 4 | 0;
    if ((r7 | 0) == (r6 | 0)) {
      break;
    } else {
      r5 = r7;
    }
  }
  r5 = r1 + 1608 | 0;
  r6 = r1 + 584 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r6);
    r7 = r6 + 4 | 0;
    if ((r7 | 0) == (r5 | 0)) {
      break;
    } else {
      r6 = r7;
    }
  }
  r6 = r1 + 2068 | 0;
  r5 = r1 + 1608 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r5);
    r7 = r5 + 4 | 0;
    if ((r7 | 0) == (r6 | 0)) {
      break;
    } else {
      r5 = r7;
    }
  }
  __ZN9Bit_modelC1Ev(r1 + 2068 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2072 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2076 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2080 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2084 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2088 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2092 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2096 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2100 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2104 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2108 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2112 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2116 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2120 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2124 | 0);
  __ZN9Bit_modelC1Ev(r1 + 2128 | 0);
  r5 = (r1 + 2132 | 0) >> 2;
  HEAP32[r5] = r2;
  r2 = r1 + 2136 | 0;
  __ZN13Range_encoderC1Ei(r2, r4);
  __ZN11Len_encoderC1Ei(r1 + 2176 | 0, __ZNK11Matchfinder15match_len_limitEv(HEAP32[HEAP32[r5] + 44 >> 2]));
  __ZN11Len_encoderC1Ei(r1 + 7836 | 0, __ZNK11Matchfinder15match_len_limitEv(HEAP32[HEAP32[r5] + 44 >> 2]));
  __ZN15Literal_encoderC1Ev(r1 + 13496 | 0);
  r4 = __Z9real_bitsi(__ZNK11Matchfinder15dictionary_sizeEv(HEAP32[HEAP32[r5] + 20 >> 2]) - 1 | 0) << 1;
  HEAP32[r1 + 38072 >> 2] = r4;
  r4 = r1 + 170244 | 0;
  r5 = r1 + 39172 | 0;
  while (1) {
    __ZN10LZ_encoder5TrialC1Ev(r5);
    r6 = r5 + 32 | 0;
    if ((r6 | 0) == (r4 | 0)) {
      break;
    } else {
      r5 = r6;
    }
  }
  __ZN10LZ_encoder17fill_align_pricesEv(r1);
  __ZN13Range_encoder8put_byteEh(r2, HEAP8[r3 | 0]);
  __ZN13Range_encoder8put_byteEh(r2, HEAP8[r3 + 1 | 0]);
  __ZN13Range_encoder8put_byteEh(r2, HEAP8[r3 + 2 | 0]);
  __ZN13Range_encoder8put_byteEh(r2, HEAP8[r3 + 3 | 0]);
  __ZN13Range_encoder8put_byteEh(r2, HEAP8[r3 + 4 | 0]);
  __ZN13Range_encoder8put_byteEh(r2, HEAP8[r3 + 5 | 0]);
  return;
}
__ZN10LZ_encoderC2ER11MatchfinderRK11File_headeri["X"] = 1;
function __ZN13Range_encoderC1Ei(r1, r2) {
  __ZN13Range_encoderC2Ei(r1, r2);
  return;
}
function __ZN11Len_encoderC1Ei(r1, r2) {
  __ZN11Len_encoderC2Ei(r1, r2);
  return;
}
function __ZN15Literal_encoderC1Ev(r1) {
  __ZN15Literal_encoderC2Ev(r1);
  return;
}
function __ZN10LZ_encoder5TrialC1Ev(r1) {
  __ZN10LZ_encoder5TrialC2Ev(r1);
  return;
}
function __ZN13Range_encoderD1Ev(r1) {
  __ZN13Range_encoderD2Ev(r1);
  return;
}
function __ZN10LZ_encoder13encode_memberEx(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39;
  r4 = 0;
  r5 = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  r6 = r5;
  r7 = r6 >> 2;
  r8 = STACKTOP;
  STACKTOP = STACKTOP + 1 | 0;
  STACKTOP = STACKTOP + 3 >> 2 << 2;
  r9 = __ZN12File_trailer4sizeEi(1);
  r10 = (i64Math.add(r2, r3, -16, -1), HEAP32[tempDoublePtr >> 2]);
  r3 = HEAP32[tempDoublePtr + 4 >> 2];
  r2 = (r1 + 2132 | 0) >> 2;
  r11 = (__ZNK11Matchfinder15match_len_limitEv(HEAP32[HEAP32[r2] + 44 >> 2]) | 0) > 12;
  __ZN5StateC1Ev(r8);
  HEAP32[r7] = 0;
  HEAP32[r7 + 1] = 0;
  HEAP32[r7 + 2] = 0;
  HEAP32[r7 + 3] = 0;
  r7 = (i64Math.subtract(r10, r3, r9, (r9 | 0) < 0 ? -1 : 0), HEAP32[tempDoublePtr >> 2]);
  r9 = HEAP32[tempDoublePtr + 4 >> 2];
  r3 = r11 ? 512 : 2048;
  r11 = HEAP32[r2];
  r10 = r11 | 0;
  r12 = HEAP32[r11 + 28 >> 2];
  if (!((__ZNK11Matchfinder13data_positionEv(HEAP32[r10 >> 2], HEAP32[r10 + 4 >> 2], r12) | 0) == 0 & (tempRet0 | 0) == 0)) {
    r13 = 0;
    STACKTOP = r5;
    return r13;
  }
  r10 = r1 + 2136 | 0;
  r14 = (r1 + 2144 | 0) >> 2;
  r15 = r1 + 2156 | 0;
  r16 = r1 + 2164 | 0;
  if (!((__ZNK13Range_encoder15member_positionEv(HEAP32[r14], HEAP32[r14 + 1], HEAP32[r15 >> 2], HEAP32[r16 >> 2]) | 0) == 6 & (tempRet0 | 0) == 0)) {
    r13 = 0;
    STACKTOP = r5;
    return r13;
  }
  if (__ZNK11Matchfinder8finishedEv(r11)) {
    r17 = r11;
  } else {
    r18 = __ZNK11MatchfinderixEi(HEAP32[r11 + 8 >> 2], r12, 0);
    __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, ((__ZNK5StateclEv(HEAP8[r8 | 0]) & 255) << 4) + r1 + 8 | 0, 0);
    __ZN15Literal_encoder6encodeER13Range_encoderhh(r1 + 13496 | 0, r10, 0, r18);
    __ZNK5CRC326updateERjh(r1 + 4 | 0, r18);
    __ZN10LZ_encoder8move_posEib(r1, 1, 0);
    r17 = HEAP32[r2];
  }
  L753 : do {
    if (!__ZNK11Matchfinder8finishedEv(r17)) {
      r18 = r6 | 0;
      r12 = r1 + 4 | 0;
      r11 = r1 + 13496 | 0;
      r19 = r1 + 7836 | 0;
      r20 = r8 | 0;
      r21 = 0;
      L755 : while (1) {
        if ((r21 | 0) < 1) {
          __ZN10LZ_encoder20fill_distance_pricesEv(r1);
          r22 = r3;
        } else {
          r22 = r21;
        }
        r23 = __ZN10LZ_encoder18sequence_optimizerEPKiRK5State(r1, r18, r8);
        if ((r23 | 0) < 1) {
          r13 = 0;
          r4 = 631;
          break;
        }
        r24 = r22 - r23 | 0;
        r25 = r23;
        r23 = 0;
        while (1) {
          r26 = HEAP32[r2];
          r27 = r26 | 0;
          r28 = (i64Math.subtract(__ZNK11Matchfinder13data_positionEv(HEAP32[r27 >> 2], HEAP32[r27 + 4 >> 2], HEAP32[r26 + 28 >> 2]), tempRet0, r25, 0), HEAP32[tempDoublePtr >> 2]) & 3;
          r26 = HEAP32[r1 + (r23 << 5) + 39176 >> 2];
          r27 = HEAP32[r1 + (r23 << 5) + 39184 >> 2];
          r29 = (r27 | 0) == 1;
          r30 = (r26 | 0) < 0 & r29;
          r31 = HEAP8[r20];
          r32 = __ZNK5StateclEv(r31) & 255;
          __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, (r32 << 4) + (r28 << 2) + r1 + 8 | 0, r30 & 1 ^ 1);
          r33 = HEAP32[r2] >> 2;
          do {
            if (r30) {
              r34 = r25 ^ -1;
              r35 = HEAP32[r33 + 2];
              r36 = HEAP32[r33 + 7];
              r37 = __ZNK11MatchfinderixEi(r35, r36, r34);
              r38 = __ZNK11MatchfinderixEi(r35, r36, -r25 | 0);
              __ZNK5CRC326updateERjh(r12, r38);
              if (__ZNK5State7is_charEv(r31)) {
                __ZN15Literal_encoder6encodeER13Range_encoderhh(r11, r10, r37, r38);
              } else {
                r36 = HEAP32[r2];
                __ZN15Literal_encoder14encode_matchedER13Range_encoderhhh(r11, r10, r37, r38, __ZNK11MatchfinderixEi(HEAP32[r36 + 8 >> 2], HEAP32[r36 + 28 >> 2], r34 - HEAP32[r18 >> 2] | 0));
              }
              __ZN5State8set_charEv(r8);
            } else {
              __ZNK5CRC326updateERjPKhi(r12, __ZNK11Matchfinder18ptr_to_current_posEv(HEAP32[r33 + 2], HEAP32[r33 + 7]) + -r25 | 0, r27);
              __ZN10LZ_encoder8mtf_repsEiPi(r26, r18);
              r34 = (r26 | 0) < 4;
              __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, (r32 << 2) + r1 + 200 | 0, r34 & 1);
              if (!r34) {
                __ZN10LZ_encoder11encode_pairEjii(r1, r26 - 4 | 0, r27, r28);
                __ZN5State9set_matchEv(r8);
                break;
              }
              r34 = (r26 | 0) == 0;
              __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, (r32 << 2) + r1 + 248 | 0, r34 & 1 ^ 1);
              do {
                if (r34) {
                  __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, (r32 << 4) + (r28 << 2) + r1 + 392 | 0, (r27 | 0) > 1 & 1);
                } else {
                  r36 = (r26 | 0) > 1;
                  __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, (r32 << 2) + r1 + 296 | 0, r36 & 1);
                  if (!r36) {
                    break;
                  }
                  __ZN13Range_encoder10encode_bitER9Bit_modeli(r10, (r32 << 2) + r1 + 344 | 0, (r26 | 0) > 2 & 1);
                }
              } while (0);
              if (r29) {
                __ZN5State13set_short_repEv(r8);
                break;
              } else {
                __ZN11Len_encoder6encodeER13Range_encoderii(r19, r10, r27, r28);
                __ZN5State7set_repEv(r8);
                break;
              }
            }
          } while (0);
          r39 = r25 - r27 | 0;
          r28 = __ZNK13Range_encoder15member_positionEv(HEAP32[r14], HEAP32[r14 + 1], HEAP32[r15 >> 2], HEAP32[r16 >> 2]);
          r29 = tempRet0;
          if (!((r29 | 0) < (r9 | 0) | (r29 | 0) == (r9 | 0) & r28 >>> 0 < r7 >>> 0)) {
            break L755;
          }
          if ((r39 | 0) < 1) {
            break;
          } else {
            r25 = r39;
            r23 = r27 + r23 | 0;
          }
        }
        if (__ZNK11Matchfinder8finishedEv(HEAP32[r2])) {
          break L753;
        } else {
          r21 = r24;
        }
      }
      if (r4 == 631) {
        STACKTOP = r5;
        return r13;
      }
      if (!__ZN11Matchfinder7dec_posEi(HEAP32[r2], r39)) {
        r13 = 0;
        STACKTOP = r5;
        return r13;
      }
      __ZN10LZ_encoder10full_flushERK5State(r1, r8);
      r13 = 1;
      STACKTOP = r5;
      return r13;
    }
  } while (0);
  __ZN10LZ_encoder10full_flushERK5State(r1, r8);
  r13 = 1;
  STACKTOP = r5;
  return r13;
}
__ZN10LZ_encoder13encode_memberEx["X"] = 1;
function __ZN15Literal_encoder6encodeER13Range_encoderhh(r1, r2, r3, r4) {
  __ZN13Range_encoder11encode_treeEP9Bit_modelii(r2, r1 + (__ZNK15Literal_encoder6lstateEh(r3) * 3072 & -1) | 0, r4 & 255, 8);
  return;
}
function __ZN10LZ_encoder11encode_pairEjii(r1, r2, r3, r4) {
  var r5, r6, r7, r8;
  r5 = r1 + 2136 | 0;
  __ZN11Len_encoder6encodeER13Range_encoderii(r1 + 2176 | 0, r5, r3, r4);
  r4 = __ZNK9Dis_slotsixEj(r2);
  __ZN13Range_encoder11encode_treeEP9Bit_modelii(r5, (__Z13get_dis_statei(r3) << 8) + r1 + 584 | 0, r4, 6);
  if ((r4 | 0) <= 3) {
    return;
  }
  r3 = r4 >> 1;
  r6 = r3 - 1 | 0;
  r7 = (r4 & 1 | 2) << r6;
  r8 = r2 - r7 | 0;
  if ((r4 | 0) < 14) {
    __ZN13Range_encoder20encode_tree_reversedEP9Bit_modelii(r5, (r7 - r4 << 2) + r1 + 1608 | 0, r8, r6);
    return;
  }
  __ZN13Range_encoder6encodeEii(r5, r8 >>> 4, r3 - 5 | 0);
  __ZN13Range_encoder20encode_tree_reversedEP9Bit_modelii(r5, r1 + 2068 | 0, r8, 4);
  r8 = r1 + 173284 | 0;
  r5 = HEAP32[r8 >> 2] - 1 | 0;
  HEAP32[r8 >> 2] = r5;
  if ((r5 | 0) >= 1) {
    return;
  }
  __ZN10LZ_encoder17fill_align_pricesEv(r1);
  return;
}
function __ZNK15Literal_encoder6lstateEh(r1) {
  return (r1 & 255) >>> 5;
}
function __ZNK5CRC326updateERjh(r1, r2) {
  var r3;
  r3 = HEAP32[r1 >> 2];
  HEAP32[r1 >> 2] = HEAP32[((r3 & 255 ^ r2 & 255) << 2) + 5250728 >> 2] ^ r3 >>> 8;
  return;
}
function __ZN11Matchfinder7dec_posEi(r1, r2) {
  var r3, r4, r5;
  do {
    if ((r2 | 0) < 0) {
      r3 = 0;
    } else {
      r4 = r1 + 28 | 0;
      r5 = HEAP32[r4 >> 2];
      if ((r5 | 0) < (r2 | 0)) {
        r3 = 0;
        break;
      }
      HEAP32[r4 >> 2] = r5 - r2 | 0;
      r5 = (r1 + 32 | 0) >> 2;
      r4 = HEAP32[r5] - r2 | 0;
      HEAP32[r5] = r4;
      if ((r4 | 0) >= 0) {
        r3 = 1;
        break;
      }
      HEAP32[r5] = HEAP32[r1 + 20 >> 2] + r4 | 0;
      r3 = 1;
    }
  } while (0);
  return r3;
}
function __ZNK9Dis_slotsixEj(r1) {
  var r2;
  if (r1 >>> 0 < 4096) {
    r2 = HEAPU8[r1 + 5246632 | 0];
    return r2;
  }
  if (r1 >>> 0 < 8388608) {
    r2 = HEAPU8[(r1 >>> 11) + 5246632 | 0] + 22 | 0;
    return r2;
  } else {
    r2 = HEAPU8[(r1 >>> 22) + 5246632 | 0] + 44 | 0;
    return r2;
  }
}
function __ZNK11Prob_pricesixEi(r1) {
  return HEAP32[(r1 >> 2 << 2) + 5244560 >> 2];
}
function __ZN5ErrorC2EPKc(r1, r2) {
  HEAP32[r1 >> 2] = r2;
  return;
}
function __ZN11Prob_prices4initEv() {
  var r1, r2, r3, r4, r5, r6, r7, r8;
  HEAP32[1311140] = 704;
  r1 = 1;
  r2 = 2;
  r3 = 8;
  while (1) {
    L833 : do {
      if ((r1 | 0) < (r2 | 0)) {
        r4 = r3 << 6;
        r5 = 8 - r3 | 0;
        r6 = r1;
        while (1) {
          HEAP32[(r6 << 2) + 5244560 >> 2] = (r2 - r6 << 6 >> r5) + r4 | 0;
          r7 = r6 + 1 | 0;
          if ((r7 | 0) == (r2 | 0)) {
            r8 = r2;
            break L833;
          } else {
            r6 = r7;
          }
        }
      } else {
        r8 = r1;
      }
    } while (0);
    if ((r3 | 0) > 0) {
      r1 = r8;
      r2 = r2 << 1;
      r3 = r3 - 1 | 0;
    } else {
      break;
    }
  }
  return;
}
function __ZN15Literal_encoder14encode_matchedER13Range_encoderhhh(r1, r2, r3, r4, r5) {
  __ZN13Range_encoder14encode_matchedEP9Bit_modelii(r2, r1 + (__ZNK15Literal_encoder6lstateEh(r3) * 3072 & -1) | 0, r4 & 255, r5 & 255);
  return;
}
function __ZN13Range_encoder14encode_matchedEP9Bit_modelii(r1, r2, r3, r4) {
  var r5, r6, r7, r8, r9, r10, r11, r12;
  r5 = 0;
  r6 = 1;
  r7 = 7;
  while (1) {
    if ((r7 | 0) <= -1) {
      r5 = 679;
      break;
    }
    r8 = r4 >>> (r7 >>> 0) & 1;
    r9 = r3 >>> (r7 >>> 0) & 1;
    __ZN13Range_encoder10encode_bitER9Bit_modeli(r1, ((r8 << 8) + r6 + 256 << 2) + r2 | 0, r9);
    r10 = r6 << 1 | r9;
    if ((r8 | 0) == (r9 | 0)) {
      r6 = r10;
      r7 = r7 - 1 | 0;
    } else {
      break;
    }
  }
  if (r5 == 679) {
    return;
  }
  if ((r7 | 0) > 0) {
    r11 = r10;
    r12 = r7;
  } else {
    return;
  }
  while (1) {
    r7 = r12 - 1 | 0;
    r10 = r3 >>> (r7 >>> 0) & 1;
    __ZN13Range_encoder10encode_bitER9Bit_modeli(r1, (r11 << 2) + r2 | 0, r10);
    if ((r7 | 0) > 0) {
      r11 = r10 | r11 << 1;
      r12 = r7;
    } else {
      break;
    }
  }
  return;
}
function __ZN13Range_encoderD2Ev(r1) {
  if ((r1 | 0) == 0) {
    return;
  }
  __ZdaPv(r1);
  return;
}
function __ZN10LZ_encoder5TrialC2Ev(r1) {
  __ZN5StateC1Ev(r1 | 0);
  return;
}
function __ZN15Literal_encoderC2Ev(r1) {
  var r2, r3;
  r2 = r1 + 24576 | 0;
  r3 = r1 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r3);
    r1 = r3 + 4 | 0;
    if ((r1 | 0) == (r2 | 0)) {
      break;
    } else {
      r3 = r1;
    }
  }
  return;
}
function __ZN11Len_encoderC2Ei(r1, r2) {
  var r3, r4, r5;
  __ZN9Bit_modelC1Ev(r1 | 0);
  __ZN9Bit_modelC1Ev(r1 + 4 | 0);
  __ZN9Bit_modelC1Ev(r1 + 8 | 0);
  __ZN9Bit_modelC1Ev(r1 + 12 | 0);
  __ZN9Bit_modelC1Ev(r1 + 16 | 0);
  __ZN9Bit_modelC1Ev(r1 + 20 | 0);
  __ZN9Bit_modelC1Ev(r1 + 24 | 0);
  __ZN9Bit_modelC1Ev(r1 + 28 | 0);
  __ZN9Bit_modelC1Ev(r1 + 32 | 0);
  __ZN9Bit_modelC1Ev(r1 + 36 | 0);
  __ZN9Bit_modelC1Ev(r1 + 40 | 0);
  __ZN9Bit_modelC1Ev(r1 + 44 | 0);
  __ZN9Bit_modelC1Ev(r1 + 48 | 0);
  __ZN9Bit_modelC1Ev(r1 + 52 | 0);
  __ZN9Bit_modelC1Ev(r1 + 56 | 0);
  __ZN9Bit_modelC1Ev(r1 + 60 | 0);
  __ZN9Bit_modelC1Ev(r1 + 64 | 0);
  __ZN9Bit_modelC1Ev(r1 + 68 | 0);
  __ZN9Bit_modelC1Ev(r1 + 72 | 0);
  __ZN9Bit_modelC1Ev(r1 + 76 | 0);
  __ZN9Bit_modelC1Ev(r1 + 80 | 0);
  __ZN9Bit_modelC1Ev(r1 + 84 | 0);
  __ZN9Bit_modelC1Ev(r1 + 88 | 0);
  __ZN9Bit_modelC1Ev(r1 + 92 | 0);
  __ZN9Bit_modelC1Ev(r1 + 96 | 0);
  __ZN9Bit_modelC1Ev(r1 + 100 | 0);
  __ZN9Bit_modelC1Ev(r1 + 104 | 0);
  __ZN9Bit_modelC1Ev(r1 + 108 | 0);
  __ZN9Bit_modelC1Ev(r1 + 112 | 0);
  __ZN9Bit_modelC1Ev(r1 + 116 | 0);
  __ZN9Bit_modelC1Ev(r1 + 120 | 0);
  __ZN9Bit_modelC1Ev(r1 + 124 | 0);
  __ZN9Bit_modelC1Ev(r1 + 128 | 0);
  __ZN9Bit_modelC1Ev(r1 + 132 | 0);
  __ZN9Bit_modelC1Ev(r1 + 136 | 0);
  __ZN9Bit_modelC1Ev(r1 + 140 | 0);
  __ZN9Bit_modelC1Ev(r1 + 144 | 0);
  __ZN9Bit_modelC1Ev(r1 + 148 | 0);
  __ZN9Bit_modelC1Ev(r1 + 152 | 0);
  __ZN9Bit_modelC1Ev(r1 + 156 | 0);
  __ZN9Bit_modelC1Ev(r1 + 160 | 0);
  __ZN9Bit_modelC1Ev(r1 + 164 | 0);
  __ZN9Bit_modelC1Ev(r1 + 168 | 0);
  __ZN9Bit_modelC1Ev(r1 + 172 | 0);
  __ZN9Bit_modelC1Ev(r1 + 176 | 0);
  __ZN9Bit_modelC1Ev(r1 + 180 | 0);
  __ZN9Bit_modelC1Ev(r1 + 184 | 0);
  __ZN9Bit_modelC1Ev(r1 + 188 | 0);
  __ZN9Bit_modelC1Ev(r1 + 192 | 0);
  __ZN9Bit_modelC1Ev(r1 + 196 | 0);
  __ZN9Bit_modelC1Ev(r1 + 200 | 0);
  __ZN9Bit_modelC1Ev(r1 + 204 | 0);
  __ZN9Bit_modelC1Ev(r1 + 208 | 0);
  __ZN9Bit_modelC1Ev(r1 + 212 | 0);
  __ZN9Bit_modelC1Ev(r1 + 216 | 0);
  __ZN9Bit_modelC1Ev(r1 + 220 | 0);
  __ZN9Bit_modelC1Ev(r1 + 224 | 0);
  __ZN9Bit_modelC1Ev(r1 + 228 | 0);
  __ZN9Bit_modelC1Ev(r1 + 232 | 0);
  __ZN9Bit_modelC1Ev(r1 + 236 | 0);
  __ZN9Bit_modelC1Ev(r1 + 240 | 0);
  __ZN9Bit_modelC1Ev(r1 + 244 | 0);
  __ZN9Bit_modelC1Ev(r1 + 248 | 0);
  __ZN9Bit_modelC1Ev(r1 + 252 | 0);
  __ZN9Bit_modelC1Ev(r1 + 256 | 0);
  __ZN9Bit_modelC1Ev(r1 + 260 | 0);
  r3 = r1 + 1288 | 0;
  r4 = r1 + 264 | 0;
  while (1) {
    __ZN9Bit_modelC1Ev(r4);
    r5 = r4 + 4 | 0;
    if ((r5 | 0) == (r3 | 0)) {
      break;
    } else {
      r4 = r5;
    }
  }
  HEAP32[r1 + 5640 >> 2] = r2 - 1 | 0;
  __ZN11Len_encoder13update_pricesEi(r1, 0);
  __ZN11Len_encoder13update_pricesEi(r1, 1);
  __ZN11Len_encoder13update_pricesEi(r1, 2);
  __ZN11Len_encoder13update_pricesEi(r1, 3);
  return;
}
__ZN11Len_encoderC2Ei["X"] = 1;
function __ZN13Range_encoderC2Ei(r1, r2) {
  var r3, r4;
  r3 = r1 >> 2;
  r4 = r1 >> 2;
  HEAP32[r4] = 0;
  HEAP32[r4 + 1] = 0;
  HEAP32[r4 + 2] = 0;
  HEAP32[r4 + 3] = 0;
  r4 = __Znaj(65536);
  HEAP32[r3 + 4] = r4;
  HEAP32[r3 + 5] = 0;
  HEAP32[r3 + 6] = -1;
  HEAP32[r3 + 7] = 0;
  HEAP32[r3 + 8] = r2;
  HEAP8[r1 + 36 | 0] = 0;
  return;
}
function __ZN13Range_encoder9shift_lowEv(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18;
  r2 = r1 | 0, r3 = r2 >> 2;
  r4 = HEAP32[r3];
  r5 = HEAP32[r3 + 1];
  r6 = r5;
  r7 = 0;
  if (!(r5 >>> 0 < r7 >>> 0 | r5 >>> 0 == r7 >>> 0 & r4 >>> 0 < -16777216 >>> 0 | (r6 | 0) == 1)) {
    r7 = r1 + 28 | 0;
    HEAP32[r7 >> 2] = HEAP32[r7 >> 2] + 1 | 0;
    r8 = r5;
    r9 = r4;
    r10 = r9 << 8 | 0 >>> 24;
    r11 = r8 << 8 | r9 >>> 24;
    r12 = -256;
    r13 = 0;
    r14 = r10 & r12;
    r15 = r11 & r13;
    r16 = r2 | 0;
    HEAP32[r16 >> 2] = r14;
    r17 = r2 + 4 | 0;
    HEAP32[r17 >> 2] = r15;
    return;
  }
  r4 = r1 + 36 | 0;
  __ZN13Range_encoder8put_byteEh(r1, HEAPU8[r4] + r6 & 255);
  r5 = (r1 + 28 | 0) >> 2;
  L872 : do {
    if ((HEAP32[r5] | 0) > 0) {
      r7 = r6 + 255 & 255;
      while (1) {
        __ZN13Range_encoder8put_byteEh(r1, r7);
        r18 = HEAP32[r5] - 1 | 0;
        HEAP32[r5] = r18;
        if ((r18 | 0) <= 0) {
          break L872;
        }
      }
    }
  } while (0);
  r5 = HEAP32[r3];
  r1 = HEAP32[r3 + 1];
  HEAP8[r4] = (r5 >>> 24 | r1 << 8) & 255;
  r8 = r1;
  r9 = r5;
  r10 = r9 << 8 | 0 >>> 24;
  r11 = r8 << 8 | r9 >>> 24;
  r12 = -256;
  r13 = 0;
  r14 = r10 & r12;
  r15 = r11 & r13;
  r16 = r2 | 0;
  HEAP32[r16 >> 2] = r14;
  r17 = r2 + 4 | 0;
  HEAP32[r17 >> 2] = r15;
  return;
}
__ZN13Range_encoder9shift_lowEv["X"] = 1;
function __ZN13Range_encoder20encode_tree_reversedEP9Bit_modelii(r1, r2, r3, r4) {
  var r5, r6, r7;
  if ((r4 | 0) > 0) {
    r5 = 1;
    r6 = r4;
    r7 = r3;
  } else {
    return;
  }
  while (1) {
    r3 = r7 & 1;
    __ZN13Range_encoder10encode_bitER9Bit_modeli(r1, (r5 << 2) + r2 | 0, r3);
    r4 = r6 - 1 | 0;
    if ((r4 | 0) > 0) {
      r5 = r3 | r5 << 1;
      r6 = r4;
      r7 = r7 >> 1;
    } else {
      break;
    }
  }
  return;
}
function __ZN13Range_encoder6encodeEii(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10;
  if ((r3 | 0) <= 0) {
    return;
  }
  r4 = (r1 + 24 | 0) >> 2;
  r5 = (r1 | 0) >> 2;
  r6 = r3;
  while (1) {
    r3 = r6 - 1 | 0;
    r7 = HEAP32[r4];
    r8 = r7 >>> 1;
    HEAP32[r4] = r8;
    if ((1 << r3 & r2 | 0) != 0) {
      r9 = (i64Math.add(HEAP32[r5], HEAP32[r5 + 1], r8, 0), HEAP32[tempDoublePtr >> 2]);
      r10 = HEAP32[tempDoublePtr + 4 >> 2];
      HEAP32[r5] = r9;
      HEAP32[r5 + 1] = r10;
    }
    if (r7 >>> 0 < 33554432) {
      HEAP32[r4] = r8 << 8;
      __ZN13Range_encoder9shift_lowEv(r1);
    }
    if ((r3 | 0) > 0) {
      r6 = r3;
    } else {
      break;
    }
  }
  return;
}
function __Z9price_bitRK9Bit_modeli(r1, r2) {
  var r3;
  r3 = HEAP32[r1 >> 2];
  if ((r2 | 0) == 0) {
    r2 = __Z6price0RK9Bit_model(r3);
    return r2;
  } else {
    r2 = __Z6price1RK9Bit_model(r3);
    return r2;
  }
}
function __Z13price_matchedPK9Bit_modelii(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15;
  r4 = 0;
  r5 = 0;
  r6 = 7;
  r7 = 1;
  while (1) {
    if ((r6 | 0) <= -1) {
      r8 = r5;
      r4 = 731;
      break;
    }
    r9 = r3 >>> (r6 >>> 0) & 1;
    r10 = r2 >>> (r6 >>> 0) & 1;
    r11 = __Z9price_bitRK9Bit_modeli(((r9 << 8) + r7 + 256 << 2) + r1 | 0, r10) + r5 | 0;
    r12 = r10 | r7 << 1;
    if ((r9 | 0) == (r10 | 0)) {
      r5 = r11;
      r6 = r6 - 1 | 0;
      r7 = r12;
    } else {
      break;
    }
  }
  if (r4 == 731) {
    return r8;
  }
  if ((r6 | 0) > 0) {
    r13 = r12;
    r14 = r11;
    r15 = r6;
  } else {
    r8 = r11;
    return r8;
  }
  while (1) {
    r11 = r15 - 1 | 0;
    r6 = r2 >>> (r11 >>> 0) & 1;
    r12 = __Z9price_bitRK9Bit_modeli((r13 << 2) + r1 | 0, r6) + r14 | 0;
    if ((r11 | 0) > 0) {
      r13 = r6 | r13 << 1;
      r14 = r12;
      r15 = r11;
    } else {
      r8 = r12;
      break;
    }
  }
  return r8;
}
function __Z2ppPKc(r1) {
  if ((r1 | 0) == 0) {
    return;
  }
  _fputs(r1, HEAP32[_stderr >> 2]);
  return;
}
function __Z10show_errorPKcib(r1, r2, r3) {
  var r4, r5, r6;
  r4 = STACKTOP;
  if ((HEAP32[1313392] | 0) <= -1) {
    STACKTOP = r4;
    return;
  }
  do {
    if ((r1 | 0) != 0) {
      if (HEAP8[r1] << 24 >> 24 == 0) {
        break;
      }
      _fprintf(HEAP32[_stderr >> 2], 5251928, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = 5251824, HEAP32[tempInt + 4 >> 2] = r1, tempInt));
      if ((r2 | 0) > 0) {
        r5 = HEAP32[_stderr >> 2];
        r6 = _strerror(r2);
        _fprintf(r5, 5252476, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = r6, tempInt));
      }
      _fputc(10, HEAP32[_stderr >> 2]);
    }
  } while (0);
  r2 = HEAP32[1313394];
  if (!((r2 | 0) != 0 & r3)) {
    STACKTOP = r4;
    return;
  }
  if (HEAP8[r2] << 24 >> 24 == 0) {
    STACKTOP = r4;
    return;
  }
  _fprintf(HEAP32[_stderr >> 2], 5252064, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = r2, tempInt));
  STACKTOP = r4;
  return;
}
function __Z14internal_errorPKc(r1) {
  var r2;
  r2 = STACKTOP;
  if ((HEAP32[1313392] | 0) <= -1) {
    _exit(3);
    STACKTOP = r2;
    return;
  }
  _fprintf(HEAP32[_stderr >> 2], 5252036, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = 5251824, HEAP32[tempInt + 4 >> 2] = r1, tempInt));
  _exit(3);
  STACKTOP = r2;
  return;
}
function _main(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14;
  r3 = 0;
  r4 = STACKTOP;
  STACKTOP = STACKTOP + 8 | 0;
  r5 = r4;
  r6 = r5;
  HEAP32[r6 >> 2] = 8388608;
  HEAP32[r6 + 4 >> 2] = 36;
  HEAP32[1313394] = HEAP32[r2 >> 2];
  do {
    if ((r1 | 0) > 1) {
      r6 = 0;
      r7 = 1;
      L945 : while (1) {
        r8 = HEAP8[HEAP32[r2 + (r7 << 2) >> 2] + 1 | 0] << 24 >> 24;
        do {
          if ((r8 | 0) == 99 | (r8 | 0) == 107) {
            r9 = r6;
          } else if ((r8 | 0) == 100) {
            r9 = 1;
          } else if ((r8 | 0) == 118) {
            r10 = HEAP32[1313392];
            if ((r10 | 0) >= 4) {
              r9 = r6;
              break;
            }
            HEAP32[1313392] = r10 + 1 | 0;
            r9 = r6;
          } else if ((r8 | 0) == 104) {
            r3 = 761;
            break L945;
          } else if ((r8 | 0) == 113) {
            HEAP32[1313392] = -1;
            r9 = r6;
          } else if ((r8 | 0) == 86) {
            r3 = 765;
            break L945;
          } else {
            __Z14internal_errorPKc(5251912);
            r9 = r6;
          }
        } while (0);
        r8 = r7 + 1 | 0;
        if ((r8 | 0) < (r1 | 0)) {
          r6 = r9;
          r7 = r8;
        } else {
          r3 = 768;
          break;
        }
      }
      if (r3 == 761) {
        __ZN12_GLOBAL__N_19show_helpEv();
        r11 = 0;
        STACKTOP = r4;
        return r11;
      } else if (r3 == 768) {
        if ((r9 | 0) == 0) {
          r3 = 770;
          break;
        } else if ((r9 | 0) != 2) {
          r12 = r9;
          r13 = 0;
          break;
        }
        HEAP8[5253572] = 0;
        r12 = 2;
        r13 = 1;
        break;
      } else if (r3 == 765) {
        __ZN12_GLOBAL__N_112show_versionEv();
        r11 = 0;
        STACKTOP = r4;
        return r11;
      }
    } else {
      r3 = 770;
    }
  } while (0);
  if (r3 == 770) {
    __ZN9Dis_slots4initEv();
    __ZN11Prob_prices4initEv();
    r12 = 0;
    r13 = 0;
  }
  HEAP8[5253572] = 1;
  if (!__ZN12_GLOBAL__N_19check_ttyEiNS_4ModeE(r12)) {
    r11 = 1;
    STACKTOP = r4;
    return r11;
  }
  if ((r12 | 0) == 0) {
    r14 = __ZN12_GLOBAL__N_18compressExxRKNS_12Lzma_optionsEiPK4stat(r5);
  } else {
    r14 = __ZN12_GLOBAL__N_110decompressEib(r13);
  }
  r13 = (r14 | 0) > 0 ? r14 : 0;
  if (!HEAP8[5253572]) {
    r11 = r13;
    STACKTOP = r4;
    return r11;
  }
  if ((_close(2) | 0) == 0) {
    r11 = r13;
    STACKTOP = r4;
    return r11;
  } else {
    r11 = ___errno_location();
    __Z10show_errorPKcib(5251892, HEAP32[r11 >> 2], 0);
    STACKTOP = r4;
    return (r13 | 0) < 1 ? 1 : r13;
  }
}
Module["_main"] = _main;
_main["X"] = 1;
function __ZN12_GLOBAL__N_19show_helpEv() {
  var r1;
  r1 = STACKTOP;
  _printf(5251968, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = 5252020, tempInt));
  _puts(5244456);
  _printf(5251936, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = HEAP32[1313394], tempInt));
  _puts(5244444);
  _puts(5243784);
  _puts(5243240);
  _puts(5243180);
  _puts(5243120);
  _puts(5243080);
  _puts(5243016);
  _puts(5242944);
  _puts(5242880);
  _puts(5244376);
  _puts(5244300);
  _puts(5244248);
  _puts(5244176);
  _puts(5244116);
  _puts(5244056);
  _puts(5243992);
  _puts(5243928);
  _puts(5243884);
  _puts(5243840);
  _printf(5251832, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = 5251824, tempInt));
  _puts(5243744);
  _puts(5243680);
  _puts(5243604);
  _puts(5243568);
  _puts(5243512);
  STACKTOP = r1;
  return;
}
function __ZN12_GLOBAL__N_112show_versionEv() {
  var r1;
  r1 = STACKTOP;
  _printf(5252168, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = 5252020, HEAP32[tempInt + 4 >> 2] = 5252160, tempInt));
  _printf(5252120, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = 5252028, tempInt));
  _puts(5243432);
  _puts(5243364);
  _puts(5243308);
  STACKTOP = r1;
  return;
}
function __ZN9Dis_slots4initEv() {
  var r1, r2, r3, r4;
  HEAP8[5246632] = 0;
  HEAP8[5246633] = 1;
  HEAP8[5246634] = 2;
  HEAP8[5246635] = 3;
  tempBigInt = 1028;
  HEAP8[5246636] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246637 | 0] = tempBigInt & 255;
  tempBigInt = 1285;
  HEAP8[5246638] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246639 | 0] = tempBigInt & 255;
  tempBigInt = 101058054;
  HEAP8[5246640] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246641 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246642 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246643 | 0] = tempBigInt & 255;
  tempBigInt = 117901063;
  HEAP8[5246644] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246645 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246646 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[5246647 | 0] = tempBigInt & 255;
  r1 = 5246648;
  r2 = r1 | 0;
  tempBigInt = 134744072;
  HEAP8[r2] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 3 | 0] = tempBigInt & 255;
  r2 = r1 + 4 | 0;
  tempBigInt = 134744072;
  HEAP8[r2] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 3 | 0] = tempBigInt & 255;
  r2 = 5246656;
  r1 = r2 | 0;
  tempBigInt = 151587081;
  HEAP8[r1] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r1 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r1 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r1 + 3 | 0] = tempBigInt & 255;
  r1 = r2 + 4 | 0;
  tempBigInt = 151587081;
  HEAP8[r1] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r1 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r1 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r1 + 3 | 0] = tempBigInt & 255;
  for (r3 = 5246664, r4 = r3 + 16; r3 < r4; r3++) {
    HEAP8[r3] = 10;
  }
  for (r3 = 5246680, r4 = r3 + 16; r3 < r4; r3++) {
    HEAP8[r3] = 11;
  }
  _memset(5246696, 12, 32);
  _memset(5246728, 13, 32);
  _memset(5246760, 14, 64);
  _memset(5246824, 15, 64);
  _memset(5246888, 16, 128);
  _memset(5247016, 17, 128);
  _memset(5247144, 18, 256);
  _memset(5247400, 19, 256);
  _memset(5247656, 20, 512);
  _memset(5248168, 21, 512);
  _memset(5248680, 22, 1024);
  _memset(5249704, 23, 1024);
  return;
}
function __ZN12_GLOBAL__N_19check_ttyEiNS_4ModeE(r1) {
  var r2, r3;
  r2 = 0;
  do {
    if ((r1 | 0) == 0 & HEAP8[5253572]) {
      if ((_isatty(2) | 0) == 0) {
        r2 = 790;
        break;
      }
      __Z10show_errorPKcib(5252224, 0, 1);
      r3 = 0;
      break;
    } else {
      r2 = 790;
    }
  } while (0);
  do {
    if (r2 == 790) {
      if ((r1 - 1 | 0) >>> 0 >= 2) {
        r3 = 1;
        break;
      }
      if ((_isatty(1) | 0) == 0) {
        r3 = 1;
        break;
      }
      __Z10show_errorPKcib(5252176, 0, 1);
      r3 = 0;
    }
  } while (0);
  return r3;
}
function __ZNK11File_header7versionEv(r1) {
  return r1;
}
function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(r1) {
  return;
}
function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(r1) {
  return;
}
function __ZN10__cxxabiv117__class_type_infoD1Ev(r1) {
  return;
}
function __ZN10__cxxabiv120__si_class_type_infoD1Ev(r1) {
  return;
}
function __ZNK11File_header14verify_versionEv(r1) {
  return (r1 & 255) < 2;
}
function __ZNK11File_header15dictionary_sizeEv(r1) {
  var r2, r3;
  r2 = r1 & 255;
  r1 = 1 << (r2 & 31);
  if ((r1 - 4097 | 0) >>> 0 >= 536866816) {
    r3 = r1;
    return r3;
  }
  r3 = r1 - Math.imul((r1 | 0) / 16 & -1, r2 >>> 5) | 0;
  return r3;
}
function __ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r1, r2) {
  return (r1 | 0) == (r2 | 0);
}
function __ZN13Range_decoder21reset_member_positionEv(r1) {
  var r2, r3;
  r2 = -HEAP32[r1 + 12 >> 2] | 0;
  r3 = r1 | 0;
  HEAP32[r3 >> 2] = r2;
  HEAP32[r3 + 4 >> 2] = (r2 | 0) < 0 ? -1 : 0;
  return;
}
function __ZN11File_header9set_magicEv(r1) {
  var r2;
  r2 = r1;
  tempBigInt = 1346984524;
  HEAP8[r2] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 1 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 2 | 0] = tempBigInt & 255;
  tempBigInt = tempBigInt >> 8;
  HEAP8[r2 + 3 | 0] = tempBigInt & 255;
  HEAP8[r1 + 4 | 0] = 1;
  return;
}
function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(r1, r2, r3) {
  var r4, r5;
  r4 = r1 + 16 | 0;
  r5 = HEAP32[r4 >> 2];
  if ((r5 | 0) == 0) {
    HEAP32[r4 >> 2] = r2;
    HEAP32[r1 + 24 >> 2] = r3;
    HEAP32[r1 + 36 >> 2] = 1;
    return;
  }
  if ((r5 | 0) != (r2 | 0)) {
    r2 = r1 + 36 | 0;
    HEAP32[r2 >> 2] = HEAP32[r2 >> 2] + 1 | 0;
    HEAP32[r1 + 24 >> 2] = 2;
    HEAP8[r1 + 54 | 0] = 1;
    return;
  }
  r2 = r1 + 24 | 0;
  if ((HEAP32[r2 >> 2] | 0) != 2) {
    return;
  }
  HEAP32[r2 >> 2] = r3;
  return;
}
function __ZN12_GLOBAL__N_18compressExxRKNS_12Lzma_optionsEiPK4stat(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26;
  r2 = 0;
  r3 = STACKTOP;
  STACKTOP = STACKTOP + 173356 | 0;
  r4 = r3;
  r5 = r3 + 8;
  r6 = r3 + 68;
  __ZN11File_header9set_magicEv(r4);
  r7 = r1 + 4 | 0;
  do {
    if (__ZN11File_header15dictionary_sizeEi(r4, HEAP32[r1 >> 2])) {
      r8 = HEAP32[r7 >> 2];
      if ((r8 - 5 | 0) >>> 0 > 268) {
        r2 = 821;
        break;
      } else {
        r9 = r8;
        break;
      }
    } else {
      r2 = 821;
    }
  } while (0);
  if (r2 == 821) {
    __Z14internal_errorPKc(5252388);
    r9 = HEAP32[r7 >> 2];
  }
  __ZN11MatchfinderC1Eiii(r5, __ZNK11File_header15dictionary_sizeEv(HEAP8[r4 + 5 | 0]), r9);
  __ZN11File_header15dictionary_sizeEi(r4, __ZNK11Matchfinder15dictionary_sizeEv(HEAP32[r5 + 20 >> 2]));
  r9 = r5 | 0;
  r7 = r5 + 28 | 0;
  r1 = 0;
  r8 = 0;
  r10 = 0;
  r11 = 0;
  r12 = 0;
  r13 = 0;
  while (1) {
    __ZN10LZ_encoderC1ER11MatchfinderRK11File_headeri(r6, r5, r4, HEAP8[5253572] ? 2 : -1);
    if (!__ZN10LZ_encoder13encode_memberEx(r6, (i64Math.subtract(-1, 2147483647, r8, r1), HEAP32[tempDoublePtr >> 2]), HEAP32[tempDoublePtr + 4 >> 2])) {
      r2 = 826;
      break;
    }
    r14 = (i64Math.add(__ZNK11Matchfinder13data_positionEv(HEAP32[r9 >> 2], HEAP32[r9 + 4 >> 2], HEAP32[r7 >> 2]), tempRet0, r13, r12), HEAP32[tempDoublePtr >> 2]);
    r15 = HEAP32[tempDoublePtr + 4 >> 2];
    r16 = __ZNK10LZ_encoder15member_positionEv(r6);
    r17 = tempRet0;
    r18 = (i64Math.add(r16, r17, r11, r10), HEAP32[tempDoublePtr >> 2]);
    r19 = HEAP32[tempDoublePtr + 4 >> 2];
    if (__ZNK11Matchfinder8finishedEv(r5)) {
      r20 = 0;
      r21 = r19;
      r22 = r18;
      r23 = r15;
      r24 = r14;
      break;
    }
    r25 = (i64Math.add(r16, r17, r8, r1), HEAP32[tempDoublePtr >> 2]);
    r17 = HEAP32[tempDoublePtr + 4 >> 2];
    __ZN11Matchfinder5resetEv(r5);
    r16 = 2147483647;
    r26 = (r17 | 0) > (r16 | 0) | (r17 | 0) == (r16 | 0) & r25 >>> 0 > -4098 >>> 0;
    __ZN10LZ_encoderD1Ev(r6);
    r1 = r26 ? 0 : r17;
    r8 = r26 ? 0 : r25;
    r10 = r19;
    r11 = r18;
    r12 = r15;
    r13 = r14;
  }
  if (r2 == 826) {
    __Z2ppPKc(5252372);
    r20 = 1;
    r21 = r10;
    r22 = r11;
    r23 = r12;
    r24 = r13;
  }
  __ZN10LZ_encoderD1Ev(r6);
  if (!((r20 | 0) == 0 & (HEAP32[1313392] | 0) > 0)) {
    __ZN11MatchfinderD1Ev(r5);
    STACKTOP = r3;
    return r20;
  }
  r6 = 0;
  r13 = 0;
  r12 = HEAP32[_stderr >> 2];
  if ((r23 | 0) < (r6 | 0) | (r23 | 0) == (r6 | 0) & r24 >>> 0 < 1 >>> 0 | ((r21 | 0) < (r13 | 0) | (r21 | 0) == (r13 | 0) & r22 >>> 0 < 1 >>> 0)) {
    _fwrite(5252336, 20, 1, r12);
    __ZN11MatchfinderD1Ev(r5);
    STACKTOP = r3;
    return r20;
  } else {
    r13 = (r24 >>> 0) + (r23 | 0) * 4294967296;
    r6 = (r22 >>> 0) + (r21 | 0) * 4294967296;
    _fprintf(r12, 5252272, (tempInt = STACKTOP, STACKTOP = STACKTOP + 40 | 0, HEAPF64[tempDoublePtr >> 3] = r13 / r6, HEAP32[tempInt >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[tempInt + 4 >> 2] = HEAP32[tempDoublePtr + 4 >> 2], HEAPF64[tempDoublePtr >> 3] = r6 * 8 / r13, HEAP32[tempInt + 8 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[tempInt + 12 >> 2] = HEAP32[tempDoublePtr + 4 >> 2], HEAPF64[tempDoublePtr >> 3] = (1 - r6 / r13) * 100, HEAP32[tempInt + 16 >> 2] = HEAP32[tempDoublePtr >> 2], HEAP32[tempInt + 20 >> 2] = HEAP32[tempDoublePtr + 4 >> 2], HEAP32[tempInt + 24 >> 2] = r24, HEAP32[tempInt + 28 >> 2] = r23, HEAP32[tempInt + 32 >> 2] = r22, HEAP32[tempInt + 36 >> 2] = r21, tempInt));
    __ZN11MatchfinderD1Ev(r5);
    STACKTOP = r3;
    return r20;
  }
}
__ZN12_GLOBAL__N_18compressExxRKNS_12Lzma_optionsEiPK4stat["X"] = 1;
function __ZN12_GLOBAL__N_110decompressEib(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27;
  r2 = 0;
  r3 = STACKTOP;
  STACKTOP = STACKTOP + 88 | 0;
  r4 = r3;
  r5 = r3 + 36;
  r6 = r3 + 44;
  __ZN13Range_decoderC1Ei(r4);
  r7 = r5 + 4 | 0;
  r8 = r5 + 5 | 0;
  r9 = r4 | 0;
  r10 = r4 + 12 | 0;
  r11 = r6 + 16 | 0;
  r12 = r5 | 0;
  r13 = r5 + 1 | 0;
  r14 = r5 + 2 | 0;
  r15 = r5 + 3 | 0;
  r16 = 1;
  r17 = 0;
  r18 = 0;
  while (1) {
    __ZN13Range_decoder21reset_member_positionEv(r4);
    do {
      if (!__ZN13Range_decoder8finishedEv(r4)) {
        r19 = __ZN13Range_decoder8get_byteEv(r4);
        HEAP8[r12] = r19;
        if (__ZN13Range_decoder8finishedEv(r4)) {
          break;
        }
        r19 = __ZN13Range_decoder8get_byteEv(r4);
        HEAP8[r13] = r19;
        if (__ZN13Range_decoder8finishedEv(r4)) {
          break;
        }
        r19 = __ZN13Range_decoder8get_byteEv(r4);
        HEAP8[r14] = r19;
        if (__ZN13Range_decoder8finishedEv(r4)) {
          break;
        }
        r19 = __ZN13Range_decoder8get_byteEv(r4);
        HEAP8[r15] = r19;
        if (__ZN13Range_decoder8finishedEv(r4)) {
          break;
        }
        r19 = __ZN13Range_decoder8get_byteEv(r4);
        HEAP8[r7] = r19;
        if (__ZN13Range_decoder8finishedEv(r4)) {
          break;
        }
        r19 = __ZN13Range_decoder8get_byteEv(r4);
        HEAP8[r8] = r19;
      }
    } while (0);
    if (__ZN13Range_decoder8finishedEv(r4)) {
      r2 = 851;
      break;
    }
    if (!__ZNK11File_header12verify_magicEv(r5)) {
      r2 = 854;
      break;
    }
    r20 = HEAP8[r7];
    if (!__ZNK11File_header14verify_versionEv(r20)) {
      r2 = 857;
      break;
    }
    r19 = __ZNK11File_header15dictionary_sizeEv(HEAP8[r8]);
    if ((r19 - 4096 | 0) >>> 0 > 536866816) {
      r2 = 860;
      break;
    }
    r21 = HEAP32[1313392];
    do {
      if ((r21 | 0) > 1) {
        r2 = 863;
      } else {
        if ((r21 | 0) != 1 | r16 ^ 1) {
          break;
        } else {
          r2 = 863;
          break;
        }
      }
    } while (0);
    do {
      if (r2 == 863) {
        r2 = 0;
        __Z2ppPKc(0);
        if ((HEAP32[1313392] | 0) <= 1) {
          break;
        }
        r21 = HEAP32[_stderr >> 2];
        r22 = __ZNK11File_header7versionEv(r20);
        __ZN12_GLOBAL__N_110format_numEx(r19, (r19 | 0) < 0 ? -1 : 0);
        _fprintf(r21, 5252552, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = r22 & 255, HEAP32[tempInt + 4 >> 2] = 5253308, tempInt));
      }
    } while (0);
    __ZN10LZ_decoderC1ERK11File_headerR13Range_decoderi(r6, r5, r4, HEAP8[5253572] ? 2 : -1);
    r23 = __ZN10LZ_decoder13decode_memberEv(r6);
    r24 = (i64Math.add(__ZNK13Range_decoder15member_positionEv(HEAP32[r9 >> 2], HEAP32[r9 + 4 >> 2], HEAP32[r10 >> 2]), tempRet0, r18, r17), HEAP32[tempDoublePtr >> 2]);
    r25 = HEAP32[tempDoublePtr + 4 >> 2];
    r26 = HEAP32[1313392];
    if ((r23 | 0) != 0) {
      r2 = 868;
      break;
    }
    do {
      if ((r26 | 0) > 1) {
        r19 = HEAP32[_stderr >> 2];
        if (r1) {
          _fwrite(5252484, 3, 1, r19);
          break;
        } else {
          _fwrite(5252468, 5, 1, r19);
          break;
        }
      }
    } while (0);
    __ZN10LZ_decoderD1Ev(HEAP32[r11 >> 2]);
    r16 = 0;
    r17 = r25;
    r18 = r24;
  }
  do {
    if (r2 == 868) {
      do {
        if ((r26 | 0) > -1 & (r23 | 0) < 3) {
          __Z2ppPKc(0);
          r18 = HEAP32[_stderr >> 2];
          if ((r23 | 0) == 2) {
            _fprintf(r18, 5252516, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = r24, HEAP32[tempInt + 4 >> 2] = r25, tempInt));
            break;
          } else {
            _fprintf(r18, 5252488, (tempInt = STACKTOP, STACKTOP = STACKTOP + 8 | 0, HEAP32[tempInt >> 2] = r24, HEAP32[tempInt + 4 >> 2] = r25, tempInt));
            break;
          }
        }
      } while (0);
      __ZN10LZ_decoderD1Ev(HEAP32[r11 >> 2]);
      r27 = 2;
      break;
    } else if (r2 == 851) {
      if (!r16) {
        r2 = 879;
        break;
      }
      __Z2ppPKc(5251796);
      r27 = 1;
      break;
    } else if (r2 == 854) {
      if (!r16) {
        r2 = 879;
        break;
      }
      __Z2ppPKc(5251752);
      r27 = 2;
      break;
    } else if (r2 == 857) {
      if ((HEAP32[1313392] | 0) <= -1) {
        r27 = 2;
        break;
      }
      __Z2ppPKc(0);
      r18 = HEAP32[_stderr >> 2];
      r17 = __ZNK11File_header7versionEv(r20) & 255;
      _fprintf(r18, 5252676, (tempInt = STACKTOP, STACKTOP = STACKTOP + 4 | 0, HEAP32[tempInt >> 2] = r17, tempInt));
      r27 = 2;
      break;
    } else if (r2 == 860) {
      __Z2ppPKc(5252632);
      r27 = 2;
      break;
    }
  } while (0);
  do {
    if (r2 == 879) {
      if ((HEAP32[1313392] | 0) != 1) {
        r27 = 0;
        break;
      }
      r20 = HEAP32[_stderr >> 2];
      if (r1) {
        _fwrite(5252484, 3, 1, r20);
        r27 = 0;
        break;
      } else {
        _fwrite(5252468, 5, 1, r20);
        r27 = 0;
        break;
      }
    }
  } while (0);
  __ZN13Range_decoderD1Ev(HEAP32[r4 + 8 >> 2]);
  STACKTOP = r3;
  return r27;
}
__ZN12_GLOBAL__N_110decompressEib["X"] = 1;
function __ZN13Range_decoderC1Ei(r1) {
  __ZN13Range_decoderC2Ei(r1);
  return;
}
function __ZNK11File_header12verify_magicEv(r1) {
  return (_memcmp(r1 | 0, 5253584, 4) | 0) == 0;
}
function __ZN12_GLOBAL__N_110format_numEx(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12;
  r3 = STACKTOP;
  r4 = r2;
  r2 = r1;
  r1 = 5252424;
  r5 = 0;
  while (1) {
    r6 = -1;
    r7 = (r4 | 0) > (r6 | 0) | (r4 | 0) == (r6 | 0) & r2 >>> 0 > -1 >>> 0;
    r6 = r7 ? r2 : (i64Math.subtract(0, 0, r2, r4), HEAP32[tempDoublePtr >> 2]);
    r8 = r7 ? r4 : HEAP32[tempDoublePtr + 4 >> 2];
    r7 = 0;
    if (!((r8 | 0) > (r7 | 0) | (r8 | 0) == (r7 | 0) & r6 >>> 0 > 9999 >>> 0)) {
      r7 = 0;
      if (!(((r8 | 0) > (r7 | 0) | (r8 | 0) == (r7 | 0) & r6 >>> 0 > 1023 >>> 0) & ((r2 & 1023 | 0) == 0 & (r4 & 0 | 0) == 0))) {
        r9 = r4;
        r10 = r2;
        r11 = r1;
        break;
      }
    }
    r6 = (i64Math.divide(r2, r4, 1024, 0), HEAP32[tempDoublePtr >> 2]);
    r7 = HEAP32[tempDoublePtr + 4 >> 2];
    r8 = HEAP32[(r5 << 2) + 5253276 >> 2];
    r12 = r5 + 1 | 0;
    if ((r12 | 0) < 8) {
      r4 = r7;
      r2 = r6;
      r1 = r8;
      r5 = r12;
    } else {
      r9 = r7;
      r10 = r6;
      r11 = r8;
      break;
    }
  }
  _snprintf(5253308, 16, 5252416, (tempInt = STACKTOP, STACKTOP = STACKTOP + 12 | 0, HEAP32[tempInt >> 2] = r10, HEAP32[tempInt + 4 >> 2] = r9, HEAP32[tempInt + 8 >> 2] = r11, tempInt));
  STACKTOP = r3;
  return;
}
function __ZN10LZ_decoderC1ERK11File_headerR13Range_decoderi(r1, r2, r3, r4) {
  __ZN10LZ_decoderC2ERK11File_headerR13Range_decoderi(r1, r2, r3, r4);
  return;
}
function __ZN10LZ_decoderD1Ev(r1) {
  __ZN10LZ_decoderD2Ev(r1);
  return;
}
function __ZN13Range_decoderD1Ev(r1) {
  __ZN13Range_decoderD2Ev(r1);
  return;
}
function __ZN13Range_decoderD2Ev(r1) {
  if ((r1 | 0) == 0) {
    return;
  }
  __ZdaPv(r1);
  return;
}
function __ZN10LZ_decoderD2Ev(r1) {
  if ((r1 | 0) == 0) {
    return;
  }
  __ZdaPv(r1);
  return;
}
function __ZN10LZ_decoderC2ERK11File_headerR13Range_decoderi(r1, r2, r3, r4) {
  var r5, r6, r7;
  r5 = r1 >> 2;
  r6 = r1 | 0;
  HEAP32[r6 >> 2] = 0;
  HEAP32[r6 + 4 >> 2] = 0;
  r6 = __ZNK11File_header15dictionary_sizeEv(HEAP8[r2 + 5 | 0]);
  HEAP32[r5 + 2] = r6;
  r7 = r1 + 12 | 0;
  r1 = (r6 | 0) < 65536 ? 65536 : r6;
  HEAP32[r7 >> 2] = r1;
  r6 = __Znaj((r1 | 0) > -1 ? r1 : -1);
  HEAP32[r5 + 4] = r6;
  HEAP32[r5 + 5] = 0;
  HEAP32[r5 + 6] = 0;
  HEAP32[r5 + 7] = -1;
  HEAP32[r5 + 8] = r4;
  r4 = __ZNK11File_header7versionEv(HEAP8[r2 + 4 | 0]) & 255;
  HEAP32[r5 + 9] = r4;
  HEAP32[r5 + 10] = r3;
  HEAP8[r6 + (HEAP32[r7 >> 2] - 1) | 0] = 0;
  return;
}
function __ZN13Range_decoderC2Ei(r1) {
  var r2, r3;
  r2 = r1 >> 2;
  r3 = r1 | 0;
  HEAP32[r3 >> 2] = 0;
  HEAP32[r3 + 4 >> 2] = 0;
  r3 = __Znaj(16384);
  HEAP32[r2 + 2] = r3;
  HEAP32[r2 + 3] = 0;
  HEAP32[r2 + 4] = 0;
  HEAP32[r2 + 5] = 0;
  HEAP32[r2 + 6] = -1;
  HEAP32[r2 + 7] = 1;
  HEAP8[r1 + 32 | 0] = 0;
  return;
}
function __ZN11File_header15dictionary_sizeEi(r1, r2) {
  var r3, r4, r5, r6, r7, r8;
  r3 = 0;
  if ((r2 - 4096 | 0) >>> 0 >= 536866817) {
    r4 = 0;
    return r4;
  }
  r5 = __Z9real_bitsi(r2 - 1 | 0);
  r6 = r1 + 5 | 0;
  HEAP8[r6] = r5 & 255;
  if ((r2 | 0) <= 4096) {
    r4 = 1;
    return r4;
  }
  r1 = 1 << (r5 & 255);
  r7 = (r1 | 0) / 16 & -1;
  r8 = 7;
  while (1) {
    if ((r8 | 0) <= 0) {
      r4 = 1;
      r3 = 930;
      break;
    }
    if ((r1 - Math.imul(r8, r7) | 0) < (r2 | 0)) {
      r8 = r8 - 1 | 0;
    } else {
      break;
    }
  }
  if (r3 == 930) {
    return r4;
  }
  HEAP8[r6] = (r5 | r8 << 5) & 255;
  r4 = 1;
  return r4;
}
function __ZNK10LZ_encoder15member_positionEv(r1) {
  var r2, r3;
  r2 = r1 + 2144 | 0;
  r3 = __ZNK13Range_encoder15member_positionEv(HEAP32[r2 >> 2], HEAP32[r2 + 4 >> 2], HEAP32[r1 + 2156 >> 2], HEAP32[r1 + 2164 >> 2]);
  return tempRet0 = tempRet0, r3;
}
function __ZN10LZ_encoderD1Ev(r1) {
  __ZN10LZ_encoderD2Ev(r1);
  return;
}
function __ZN11MatchfinderD1Ev(r1) {
  __ZN11MatchfinderD2Ev(r1);
  return;
}
function __ZN11MatchfinderD2Ev(r1) {
  var r2;
  r2 = HEAP32[r1 + 16 >> 2];
  if ((r2 | 0) != 0) {
    __ZdaPv(r2);
  }
  r2 = HEAP32[r1 + 12 >> 2];
  if ((r2 | 0) != 0) {
    __ZdaPv(r2);
  }
  _free(HEAP32[r1 + 8 >> 2]);
  return;
}
function __ZN10LZ_encoderD2Ev(r1) {
  __ZN13Range_encoderD1Ev(HEAP32[r1 + 2152 >> 2]);
  return;
}
function __ZN10__cxxabiv117__class_type_infoD0Ev(r1) {
  __ZdlPv(r1);
  return;
}
function __ZN10__cxxabiv120__si_class_type_infoD0Ev(r1) {
  __ZdlPv(r1);
  return;
}
function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12;
  r4 = STACKTOP;
  STACKTOP = STACKTOP + 56 | 0;
  r5 = r4, r6 = r5 >> 2;
  do {
    if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r1 | 0, r2 | 0)) {
      r7 = 1;
    } else {
      if ((r2 | 0) == 0) {
        r7 = 0;
        break;
      }
      r8 = ___dynamic_cast(r2, 5253536);
      r9 = r8;
      if ((r8 | 0) == 0) {
        r7 = 0;
        break;
      }
      r10 = r5;
      for (r11 = r10 >> 2, r12 = r11 + 14; r11 < r12; r11++) {
        HEAP32[r11] = 0;
      }
      HEAP32[r6] = r9;
      HEAP32[r6 + 2] = r1;
      HEAP32[r6 + 3] = -1;
      HEAP32[r6 + 12] = 1;
      FUNCTION_TABLE[HEAP32[HEAP32[r8 >> 2] + 28 >> 2]](r9, r5, HEAP32[r3 >> 2], 1);
      if ((HEAP32[r6 + 6] | 0) != 1) {
        r7 = 0;
        break;
      }
      HEAP32[r3 >> 2] = HEAP32[r6 + 4];
      r7 = 1;
    }
  } while (0);
  STACKTOP = r4;
  return r7;
}
function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(r1, r2, r3, r4) {
  if (!__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r1 | 0, HEAP32[r2 + 8 >> 2] | 0)) {
    return;
  }
  __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(r2, r3, r4);
  return;
}
function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(r1, r2, r3, r4) {
  var r5;
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r1 | 0, HEAP32[r2 + 8 >> 2] | 0)) {
    __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(r2, r3, r4);
    return;
  } else {
    r5 = HEAP32[r1 + 8 >> 2];
    FUNCTION_TABLE[HEAP32[HEAP32[r5 >> 2] + 28 >> 2]](r5, r2, r3, r4);
    return;
  }
}
function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(r1, r2, r3, r4) {
  var r5, r6, r7;
  r5 = r1 >> 2;
  HEAP8[r1 + 53 | 0] = 1;
  if ((HEAP32[r5 + 1] | 0) != (r3 | 0)) {
    return;
  }
  HEAP8[r1 + 52 | 0] = 1;
  r3 = r1 + 16 | 0;
  r6 = HEAP32[r3 >> 2];
  if ((r6 | 0) == 0) {
    HEAP32[r3 >> 2] = r2;
    HEAP32[r5 + 6] = r4;
    HEAP32[r5 + 9] = 1;
    if (!((HEAP32[r5 + 12] | 0) == 1 & (r4 | 0) == 1)) {
      return;
    }
    HEAP8[r1 + 54 | 0] = 1;
    return;
  }
  if ((r6 | 0) != (r2 | 0)) {
    r2 = r1 + 36 | 0;
    HEAP32[r2 >> 2] = HEAP32[r2 >> 2] + 1 | 0;
    HEAP8[r1 + 54 | 0] = 1;
    return;
  }
  r2 = r1 + 24 | 0;
  r6 = HEAP32[r2 >> 2];
  if ((r6 | 0) == 2) {
    HEAP32[r2 >> 2] = r4;
    r7 = r4;
  } else {
    r7 = r6;
  }
  if (!((HEAP32[r5 + 12] | 0) == 1 & (r7 | 0) == 1)) {
    return;
  }
  HEAP8[r1 + 54 | 0] = 1;
  return;
}
__ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i["X"] = 1;
function __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(r1, r2, r3) {
  if ((HEAP32[r1 + 4 >> 2] | 0) != (r2 | 0)) {
    return;
  }
  r2 = r1 + 28 | 0;
  if ((HEAP32[r2 >> 2] | 0) == 1) {
    return;
  }
  HEAP32[r2 >> 2] = r3;
  return;
}
function ___dynamic_cast(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17;
  r3 = STACKTOP;
  STACKTOP = STACKTOP + 56 | 0;
  r4 = r3, r5 = r4 >> 2;
  r6 = HEAP32[r1 >> 2];
  r7 = r1 + HEAP32[r6 - 8 >> 2] | 0;
  r8 = HEAP32[r6 - 4 >> 2];
  r6 = r8;
  HEAP32[r5] = r2;
  HEAP32[r5 + 1] = r1;
  HEAP32[r5 + 2] = 5253548;
  HEAP32[r5 + 3] = -1;
  r1 = r4 + 16 | 0;
  r9 = r4 + 20 | 0;
  r10 = r4 + 24 | 0;
  r11 = r4 + 28 | 0;
  r12 = r4 + 32 | 0;
  r13 = r4 + 40 | 0;
  r14 = __ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r8, r2 | 0);
  r2 = r1;
  for (r15 = r2 >> 2, r16 = r15 + 9; r15 < r16; r15++) {
    HEAP32[r15] = 0;
  }
  HEAP16[r2 + 36 >> 1] = 0;
  HEAP8[r2 + 38 | 0] = 0;
  if (r14) {
    HEAP32[r5 + 12] = 1;
    FUNCTION_TABLE[HEAP32[HEAP32[r8 >> 2] + 20 >> 2]](r6, r4, r7, r7, 1, 0);
    STACKTOP = r3;
    return (HEAP32[r10 >> 2] | 0) == 1 ? r7 : 0;
  }
  FUNCTION_TABLE[HEAP32[HEAP32[r8 >> 2] + 24 >> 2]](r6, r4, r7, 1, 0);
  r7 = HEAP32[r5 + 9];
  if ((r7 | 0) == 1) {
    do {
      if ((HEAP32[r10 >> 2] | 0) != 1) {
        if ((HEAP32[r13 >> 2] | 0) != 0) {
          r17 = 0;
          STACKTOP = r3;
          return r17;
        }
        if ((HEAP32[r11 >> 2] | 0) != 1) {
          r17 = 0;
          STACKTOP = r3;
          return r17;
        }
        if ((HEAP32[r12 >> 2] | 0) == 1) {
          break;
        } else {
          r17 = 0;
        }
        STACKTOP = r3;
        return r17;
      }
    } while (0);
    r17 = HEAP32[r1 >> 2];
    STACKTOP = r3;
    return r17;
  } else if ((r7 | 0) == 0) {
    if ((HEAP32[r13 >> 2] | 0) != 1) {
      r17 = 0;
      STACKTOP = r3;
      return r17;
    }
    if ((HEAP32[r11 >> 2] | 0) != 1) {
      r17 = 0;
      STACKTOP = r3;
      return r17;
    }
    r17 = (HEAP32[r12 >> 2] | 0) == 1 ? HEAP32[r9 >> 2] : 0;
    STACKTOP = r3;
    return r17;
  } else {
    r17 = 0;
    STACKTOP = r3;
    return r17;
  }
}
___dynamic_cast["X"] = 1;
function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(r1, r2, r3, r4, r5) {
  var r6, r7, r8, r9, r10, r11, r12, r13;
  r6 = r2 >> 2;
  r7 = 0;
  r8 = r1 | 0;
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r8, HEAP32[r6 + 2] | 0)) {
    __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(r2, r3, r4);
    return;
  }
  if (!__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r8, HEAP32[r6] | 0)) {
    r8 = HEAP32[r1 + 8 >> 2];
    FUNCTION_TABLE[HEAP32[HEAP32[r8 >> 2] + 24 >> 2]](r8, r2, r3, r4, r5);
    return;
  }
  do {
    if ((HEAP32[r6 + 4] | 0) != (r3 | 0)) {
      r8 = r2 + 20 | 0;
      if ((HEAP32[r8 >> 2] | 0) == (r3 | 0)) {
        break;
      }
      HEAP32[r6 + 8] = r4;
      r9 = (r2 + 44 | 0) >> 2;
      if ((HEAP32[r9] | 0) == 4) {
        return;
      }
      r10 = r2 + 52 | 0;
      HEAP8[r10] = 0;
      r11 = r2 + 53 | 0;
      HEAP8[r11] = 0;
      r12 = HEAP32[r1 + 8 >> 2];
      FUNCTION_TABLE[HEAP32[HEAP32[r12 >> 2] + 20 >> 2]](r12, r2, r3, r3, 1, r5);
      do {
        if ((HEAP8[r11] & 1) << 24 >> 24 == 0) {
          r13 = 0;
          r7 = 1015;
        } else {
          if ((HEAP8[r10] & 1) << 24 >> 24 == 0) {
            r13 = 1;
            r7 = 1015;
            break;
          } else {
            break;
          }
        }
      } while (0);
      L1247 : do {
        if (r7 == 1015) {
          HEAP32[r8 >> 2] = r3;
          r10 = r2 + 40 | 0;
          HEAP32[r10 >> 2] = HEAP32[r10 >> 2] + 1 | 0;
          do {
            if ((HEAP32[r6 + 9] | 0) == 1) {
              if ((HEAP32[r6 + 6] | 0) != 2) {
                r7 = 1018;
                break;
              }
              HEAP8[r2 + 54 | 0] = 1;
              if (r13) {
                break L1247;
              } else {
                break;
              }
            } else {
              r7 = 1018;
            }
          } while (0);
          if (r7 == 1018) {
            if (r13) {
              break;
            }
          }
          HEAP32[r9] = 4;
          return;
        }
      } while (0);
      HEAP32[r9] = 3;
      return;
    }
  } while (0);
  if ((r4 | 0) != 1) {
    return;
  }
  HEAP32[r6 + 8] = 1;
  return;
}
__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib["X"] = 1;
function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(r1, r2, r3, r4, r5) {
  var r6;
  r5 = r2 >> 2;
  r6 = r1 | 0;
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r6, HEAP32[r5 + 2] | 0)) {
    __ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi(r2, r3, r4);
    return;
  }
  if (!__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r6, HEAP32[r5] | 0)) {
    return;
  }
  do {
    if ((HEAP32[r5 + 4] | 0) != (r3 | 0)) {
      r6 = r2 + 20 | 0;
      if ((HEAP32[r6 >> 2] | 0) == (r3 | 0)) {
        break;
      }
      HEAP32[r5 + 8] = r4;
      HEAP32[r6 >> 2] = r3;
      r6 = r2 + 40 | 0;
      HEAP32[r6 >> 2] = HEAP32[r6 >> 2] + 1 | 0;
      do {
        if ((HEAP32[r5 + 9] | 0) == 1) {
          if ((HEAP32[r5 + 6] | 0) != 2) {
            break;
          }
          HEAP8[r2 + 54 | 0] = 1;
        }
      } while (0);
      HEAP32[r5 + 11] = 4;
      return;
    }
  } while (0);
  if ((r4 | 0) != 1) {
    return;
  }
  HEAP32[r5 + 8] = 1;
  return;
}
function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(r1, r2, r3, r4, r5, r6) {
  var r7;
  if (__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r1 | 0, HEAP32[r2 + 8 >> 2] | 0)) {
    __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(r2, r3, r4, r5);
    return;
  } else {
    r7 = HEAP32[r1 + 8 >> 2];
    FUNCTION_TABLE[HEAP32[HEAP32[r7 >> 2] + 20 >> 2]](r7, r2, r3, r4, r5, r6);
    return;
  }
}
function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(r1, r2, r3, r4, r5, r6) {
  if (!__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b(r1 | 0, HEAP32[r2 + 8 >> 2] | 0)) {
    return;
  }
  __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(r2, r3, r4, r5);
  return;
}
function _malloc(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19;
  do {
    if (r1 >>> 0 < 245) {
      if (r1 >>> 0 < 11) {
        r2 = 16;
      } else {
        r2 = r1 + 11 & -8;
      }
      r3 = r2 >>> 3;
      r4 = HEAP32[1313190];
      r5 = r4 >>> (r3 >>> 0);
      if ((r5 & 3 | 0) != 0) {
        r6 = (r5 & 1 ^ 1) + r3 | 0;
        r7 = r6 << 1;
        r8 = (r7 << 2) + 5252800 | 0;
        r9 = (r7 + 2 << 2) + 5252800 | 0;
        r7 = HEAP32[r9 >> 2];
        r10 = r7 + 8 | 0;
        r11 = HEAP32[r10 >> 2];
        do {
          if ((r8 | 0) == (r11 | 0)) {
            HEAP32[1313190] = r4 & (1 << r6 ^ -1);
          } else {
            if (r11 >>> 0 < HEAP32[1313194] >>> 0) {
              _abort();
            } else {
              HEAP32[r9 >> 2] = r11;
              HEAP32[r11 + 12 >> 2] = r8;
              break;
            }
          }
        } while (0);
        r8 = r6 << 3;
        HEAP32[r7 + 4 >> 2] = r8 | 3;
        r11 = r7 + (r8 | 4) | 0;
        HEAP32[r11 >> 2] = HEAP32[r11 >> 2] | 1;
        r12 = r10;
        return r12;
      }
      if (r2 >>> 0 <= HEAP32[1313192] >>> 0) {
        r13 = r2;
        break;
      }
      if ((r5 | 0) == 0) {
        if ((HEAP32[1313191] | 0) == 0) {
          r13 = r2;
          break;
        }
        r11 = _tmalloc_small(r2);
        if ((r11 | 0) == 0) {
          r13 = r2;
          break;
        } else {
          r12 = r11;
        }
        return r12;
      }
      r11 = 2 << r3;
      r8 = r5 << r3 & (r11 | -r11);
      r11 = (r8 & -r8) - 1 | 0;
      r8 = r11 >>> 12 & 16;
      r9 = r11 >>> (r8 >>> 0);
      r11 = r9 >>> 5 & 8;
      r14 = r9 >>> (r11 >>> 0);
      r9 = r14 >>> 2 & 4;
      r15 = r14 >>> (r9 >>> 0);
      r14 = r15 >>> 1 & 2;
      r16 = r15 >>> (r14 >>> 0);
      r15 = r16 >>> 1 & 1;
      r17 = (r11 | r8 | r9 | r14 | r15) + (r16 >>> (r15 >>> 0)) | 0;
      r15 = r17 << 1;
      r16 = (r15 << 2) + 5252800 | 0;
      r14 = (r15 + 2 << 2) + 5252800 | 0;
      r15 = HEAP32[r14 >> 2];
      r9 = r15 + 8 | 0;
      r8 = HEAP32[r9 >> 2];
      do {
        if ((r16 | 0) == (r8 | 0)) {
          HEAP32[1313190] = r4 & (1 << r17 ^ -1);
        } else {
          if (r8 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          } else {
            HEAP32[r14 >> 2] = r8;
            HEAP32[r8 + 12 >> 2] = r16;
            break;
          }
        }
      } while (0);
      r16 = r17 << 3;
      r8 = r16 - r2 | 0;
      HEAP32[r15 + 4 >> 2] = r2 | 3;
      r14 = r15;
      r4 = r14 + r2 | 0;
      HEAP32[r14 + (r2 | 4) >> 2] = r8 | 1;
      HEAP32[r14 + r16 >> 2] = r8;
      r16 = HEAP32[1313192];
      if ((r16 | 0) != 0) {
        r14 = HEAP32[1313195];
        r3 = r16 >>> 3;
        r16 = r3 << 1;
        r5 = (r16 << 2) + 5252800 | 0;
        r10 = HEAP32[1313190];
        r7 = 1 << r3;
        do {
          if ((r10 & r7 | 0) == 0) {
            HEAP32[1313190] = r10 | r7;
            r18 = r5;
            r19 = (r16 + 2 << 2) + 5252800 | 0;
          } else {
            r3 = (r16 + 2 << 2) + 5252800 | 0;
            r6 = HEAP32[r3 >> 2];
            if (r6 >>> 0 >= HEAP32[1313194] >>> 0) {
              r18 = r6;
              r19 = r3;
              break;
            }
            _abort();
          }
        } while (0);
        HEAP32[r19 >> 2] = r14;
        HEAP32[r18 + 12 >> 2] = r14;
        HEAP32[r14 + 8 >> 2] = r18;
        HEAP32[r14 + 12 >> 2] = r5;
      }
      HEAP32[1313192] = r8;
      HEAP32[1313195] = r4;
      r12 = r9;
      return r12;
    } else {
      if (r1 >>> 0 > 4294967231) {
        r13 = -1;
        break;
      }
      r16 = r1 + 11 & -8;
      if ((HEAP32[1313191] | 0) == 0) {
        r13 = r16;
        break;
      }
      r7 = _tmalloc_large(r16);
      if ((r7 | 0) == 0) {
        r13 = r16;
        break;
      } else {
        r12 = r7;
      }
      return r12;
    }
  } while (0);
  r1 = HEAP32[1313192];
  if (r13 >>> 0 > r1 >>> 0) {
    r18 = HEAP32[1313193];
    if (r13 >>> 0 < r18 >>> 0) {
      r19 = r18 - r13 | 0;
      HEAP32[1313193] = r19;
      r18 = HEAP32[1313196];
      r2 = r18;
      HEAP32[1313196] = r2 + r13 | 0;
      HEAP32[r13 + (r2 + 4) >> 2] = r19 | 1;
      HEAP32[r18 + 4 >> 2] = r13 | 3;
      r12 = r18 + 8 | 0;
      return r12;
    } else {
      r12 = _sys_alloc(r13);
      return r12;
    }
  } else {
    r18 = r1 - r13 | 0;
    r19 = HEAP32[1313195];
    if (r18 >>> 0 > 15) {
      r2 = r19;
      HEAP32[1313195] = r2 + r13 | 0;
      HEAP32[1313192] = r18;
      HEAP32[r13 + (r2 + 4) >> 2] = r18 | 1;
      HEAP32[r2 + r1 >> 2] = r18;
      HEAP32[r19 + 4 >> 2] = r13 | 3;
    } else {
      HEAP32[1313192] = 0;
      HEAP32[1313195] = 0;
      HEAP32[r19 + 4 >> 2] = r1 | 3;
      r13 = r1 + (r19 + 4) | 0;
      HEAP32[r13 >> 2] = HEAP32[r13 >> 2] | 1;
    }
    r12 = r19 + 8 | 0;
    return r12;
  }
}
_malloc["X"] = 1;
function _tmalloc_small(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21;
  r2 = HEAP32[1313191];
  r3 = (r2 & -r2) - 1 | 0;
  r2 = r3 >>> 12 & 16;
  r4 = r3 >>> (r2 >>> 0);
  r3 = r4 >>> 5 & 8;
  r5 = r4 >>> (r3 >>> 0);
  r4 = r5 >>> 2 & 4;
  r6 = r5 >>> (r4 >>> 0);
  r5 = r6 >>> 1 & 2;
  r7 = r6 >>> (r5 >>> 0);
  r6 = r7 >>> 1 & 1;
  r8 = HEAP32[((r3 | r2 | r4 | r5 | r6) + (r7 >>> (r6 >>> 0)) << 2) + 5253064 >> 2];
  r6 = r8;
  r7 = r8, r5 = r7 >> 2;
  r4 = (HEAP32[r8 + 4 >> 2] & -8) - r1 | 0;
  while (1) {
    r8 = HEAP32[r6 + 16 >> 2];
    if ((r8 | 0) == 0) {
      r2 = HEAP32[r6 + 20 >> 2];
      if ((r2 | 0) == 0) {
        break;
      } else {
        r9 = r2;
      }
    } else {
      r9 = r8;
    }
    r8 = (HEAP32[r9 + 4 >> 2] & -8) - r1 | 0;
    r2 = r8 >>> 0 < r4 >>> 0;
    r6 = r9;
    r7 = r2 ? r9 : r7, r5 = r7 >> 2;
    r4 = r2 ? r8 : r4;
  }
  r9 = r7;
  r6 = HEAP32[1313194];
  if (r9 >>> 0 < r6 >>> 0) {
    _abort();
  }
  r8 = r9 + r1 | 0;
  r2 = r8;
  if (r9 >>> 0 >= r8 >>> 0) {
    _abort();
  }
  r8 = HEAP32[r5 + 6];
  r3 = HEAP32[r5 + 3];
  L1365 : do {
    if ((r3 | 0) == (r7 | 0)) {
      r10 = r7 + 20 | 0;
      r11 = HEAP32[r10 >> 2];
      do {
        if ((r11 | 0) == 0) {
          r12 = r7 + 16 | 0;
          r13 = HEAP32[r12 >> 2];
          if ((r13 | 0) == 0) {
            r14 = 0, r15 = r14 >> 2;
            break L1365;
          } else {
            r16 = r13;
            r17 = r12;
            break;
          }
        } else {
          r16 = r11;
          r17 = r10;
        }
      } while (0);
      while (1) {
        r10 = r16 + 20 | 0;
        r11 = HEAP32[r10 >> 2];
        if ((r11 | 0) != 0) {
          r16 = r11;
          r17 = r10;
          continue;
        }
        r10 = r16 + 16 | 0;
        r11 = HEAP32[r10 >> 2];
        if ((r11 | 0) == 0) {
          break;
        } else {
          r16 = r11;
          r17 = r10;
        }
      }
      if (r17 >>> 0 < r6 >>> 0) {
        _abort();
      } else {
        HEAP32[r17 >> 2] = 0;
        r14 = r16, r15 = r14 >> 2;
        break;
      }
    } else {
      r10 = HEAP32[r5 + 2];
      if (r10 >>> 0 < r6 >>> 0) {
        _abort();
      } else {
        HEAP32[r10 + 12 >> 2] = r3;
        HEAP32[r3 + 8 >> 2] = r10;
        r14 = r3, r15 = r14 >> 2;
        break;
      }
    }
  } while (0);
  L1381 : do {
    if ((r8 | 0) != 0) {
      r3 = r7 + 28 | 0;
      r6 = (HEAP32[r3 >> 2] << 2) + 5253064 | 0;
      do {
        if ((r7 | 0) == (HEAP32[r6 >> 2] | 0)) {
          HEAP32[r6 >> 2] = r14;
          if ((r14 | 0) != 0) {
            break;
          }
          HEAP32[1313191] = HEAP32[1313191] & (1 << HEAP32[r3 >> 2] ^ -1);
          break L1381;
        } else {
          if (r8 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          }
          r16 = r8 + 16 | 0;
          if ((HEAP32[r16 >> 2] | 0) == (r7 | 0)) {
            HEAP32[r16 >> 2] = r14;
          } else {
            HEAP32[r8 + 20 >> 2] = r14;
          }
          if ((r14 | 0) == 0) {
            break L1381;
          }
        }
      } while (0);
      if (r14 >>> 0 < HEAP32[1313194] >>> 0) {
        _abort();
      }
      HEAP32[r15 + 6] = r8;
      r3 = HEAP32[r5 + 4];
      do {
        if ((r3 | 0) != 0) {
          if (r3 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          } else {
            HEAP32[r15 + 4] = r3;
            HEAP32[r3 + 24 >> 2] = r14;
            break;
          }
        }
      } while (0);
      r3 = HEAP32[r5 + 5];
      if ((r3 | 0) == 0) {
        break;
      }
      if (r3 >>> 0 < HEAP32[1313194] >>> 0) {
        _abort();
      } else {
        HEAP32[r15 + 5] = r3;
        HEAP32[r3 + 24 >> 2] = r14;
        break;
      }
    }
  } while (0);
  if (r4 >>> 0 < 16) {
    r14 = r4 + r1 | 0;
    HEAP32[r5 + 1] = r14 | 3;
    r15 = r14 + (r9 + 4) | 0;
    HEAP32[r15 >> 2] = HEAP32[r15 >> 2] | 1;
    r18 = r7 + 8 | 0;
    r19 = r18;
    return r19;
  }
  HEAP32[r5 + 1] = r1 | 3;
  HEAP32[r1 + (r9 + 4) >> 2] = r4 | 1;
  HEAP32[r9 + r4 + r1 >> 2] = r4;
  r1 = HEAP32[1313192];
  if ((r1 | 0) != 0) {
    r9 = HEAP32[1313195];
    r5 = r1 >>> 3;
    r1 = r5 << 1;
    r15 = (r1 << 2) + 5252800 | 0;
    r14 = HEAP32[1313190];
    r8 = 1 << r5;
    do {
      if ((r14 & r8 | 0) == 0) {
        HEAP32[1313190] = r14 | r8;
        r20 = r15;
        r21 = (r1 + 2 << 2) + 5252800 | 0;
      } else {
        r5 = (r1 + 2 << 2) + 5252800 | 0;
        r3 = HEAP32[r5 >> 2];
        if (r3 >>> 0 >= HEAP32[1313194] >>> 0) {
          r20 = r3;
          r21 = r5;
          break;
        }
        _abort();
      }
    } while (0);
    HEAP32[r21 >> 2] = r9;
    HEAP32[r20 + 12 >> 2] = r9;
    HEAP32[r9 + 8 >> 2] = r20;
    HEAP32[r9 + 12 >> 2] = r15;
  }
  HEAP32[1313192] = r4;
  HEAP32[1313195] = r2;
  r18 = r7 + 8 | 0;
  r19 = r18;
  return r19;
}
_tmalloc_small["X"] = 1;
function _tmalloc_large(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36;
  r2 = r1 >> 2;
  r3 = 0;
  r4 = -r1 | 0;
  r5 = r1 >>> 8;
  do {
    if ((r5 | 0) == 0) {
      r6 = 0;
    } else {
      if (r1 >>> 0 > 16777215) {
        r6 = 31;
        break;
      }
      r7 = (r5 + 1048320 | 0) >>> 16 & 8;
      r8 = r5 << r7;
      r9 = (r8 + 520192 | 0) >>> 16 & 4;
      r10 = r8 << r9;
      r8 = (r10 + 245760 | 0) >>> 16 & 2;
      r11 = 14 - (r9 | r7 | r8) + (r10 << r8 >>> 15) | 0;
      r6 = r1 >>> ((r11 + 7 | 0) >>> 0) & 1 | r11 << 1;
    }
  } while (0);
  r5 = HEAP32[(r6 << 2) + 5253064 >> 2];
  L1427 : do {
    if ((r5 | 0) == 0) {
      r12 = 0;
      r13 = r4;
      r14 = 0;
    } else {
      if ((r6 | 0) == 31) {
        r15 = 0;
      } else {
        r15 = 25 - (r6 >>> 1) | 0;
      }
      r11 = 0;
      r8 = r4;
      r10 = r5, r7 = r10 >> 2;
      r9 = r1 << r15;
      r16 = 0;
      while (1) {
        r17 = HEAP32[r7 + 1] & -8;
        r18 = r17 - r1 | 0;
        if (r18 >>> 0 < r8 >>> 0) {
          if ((r17 | 0) == (r1 | 0)) {
            r12 = r10;
            r13 = r18;
            r14 = r10;
            break L1427;
          } else {
            r19 = r10;
            r20 = r18;
          }
        } else {
          r19 = r11;
          r20 = r8;
        }
        r18 = HEAP32[r7 + 5];
        r17 = HEAP32[((r9 >>> 31 << 2) + 16 >> 2) + r7];
        r21 = (r18 | 0) == 0 | (r18 | 0) == (r17 | 0) ? r16 : r18;
        if ((r17 | 0) == 0) {
          r12 = r19;
          r13 = r20;
          r14 = r21;
          break L1427;
        } else {
          r11 = r19;
          r8 = r20;
          r10 = r17, r7 = r10 >> 2;
          r9 = r9 << 1;
          r16 = r21;
        }
      }
    }
  } while (0);
  do {
    if ((r14 | 0) == 0 & (r12 | 0) == 0) {
      r20 = 2 << r6;
      r19 = HEAP32[1313191] & (r20 | -r20);
      if ((r19 | 0) == 0) {
        r22 = 0;
        return r22;
      } else {
        r20 = (r19 & -r19) - 1 | 0;
        r19 = r20 >>> 12 & 16;
        r15 = r20 >>> (r19 >>> 0);
        r20 = r15 >>> 5 & 8;
        r5 = r15 >>> (r20 >>> 0);
        r15 = r5 >>> 2 & 4;
        r4 = r5 >>> (r15 >>> 0);
        r5 = r4 >>> 1 & 2;
        r16 = r4 >>> (r5 >>> 0);
        r4 = r16 >>> 1 & 1;
        r23 = HEAP32[((r20 | r19 | r15 | r5 | r4) + (r16 >>> (r4 >>> 0)) << 2) + 5253064 >> 2];
        break;
      }
    } else {
      r23 = r14;
    }
  } while (0);
  L1444 : do {
    if ((r23 | 0) == 0) {
      r24 = r13;
      r25 = r12, r26 = r25 >> 2;
    } else {
      r14 = r23, r6 = r14 >> 2;
      r4 = r13;
      r16 = r12;
      while (1) {
        r5 = (HEAP32[r6 + 1] & -8) - r1 | 0;
        r15 = r5 >>> 0 < r4 >>> 0;
        r19 = r15 ? r5 : r4;
        r5 = r15 ? r14 : r16;
        r15 = HEAP32[r6 + 4];
        if ((r15 | 0) != 0) {
          r14 = r15, r6 = r14 >> 2;
          r4 = r19;
          r16 = r5;
          continue;
        }
        r15 = HEAP32[r6 + 5];
        if ((r15 | 0) == 0) {
          r24 = r19;
          r25 = r5, r26 = r25 >> 2;
          break L1444;
        } else {
          r14 = r15, r6 = r14 >> 2;
          r4 = r19;
          r16 = r5;
        }
      }
    }
  } while (0);
  if ((r25 | 0) == 0) {
    r22 = 0;
    return r22;
  }
  if (r24 >>> 0 >= (HEAP32[1313192] - r1 | 0) >>> 0) {
    r22 = 0;
    return r22;
  }
  r12 = r25, r13 = r12 >> 2;
  r23 = HEAP32[1313194];
  if (r12 >>> 0 < r23 >>> 0) {
    _abort();
  }
  r16 = r12 + r1 | 0;
  r4 = r16;
  if (r12 >>> 0 >= r16 >>> 0) {
    _abort();
  }
  r14 = HEAP32[r26 + 6];
  r6 = HEAP32[r26 + 3];
  L1461 : do {
    if ((r6 | 0) == (r25 | 0)) {
      r5 = r25 + 20 | 0;
      r19 = HEAP32[r5 >> 2];
      do {
        if ((r19 | 0) == 0) {
          r15 = r25 + 16 | 0;
          r20 = HEAP32[r15 >> 2];
          if ((r20 | 0) == 0) {
            r27 = 0, r28 = r27 >> 2;
            break L1461;
          } else {
            r29 = r20;
            r30 = r15;
            break;
          }
        } else {
          r29 = r19;
          r30 = r5;
        }
      } while (0);
      while (1) {
        r5 = r29 + 20 | 0;
        r19 = HEAP32[r5 >> 2];
        if ((r19 | 0) != 0) {
          r29 = r19;
          r30 = r5;
          continue;
        }
        r5 = r29 + 16 | 0;
        r19 = HEAP32[r5 >> 2];
        if ((r19 | 0) == 0) {
          break;
        } else {
          r29 = r19;
          r30 = r5;
        }
      }
      if (r30 >>> 0 < r23 >>> 0) {
        _abort();
      } else {
        HEAP32[r30 >> 2] = 0;
        r27 = r29, r28 = r27 >> 2;
        break;
      }
    } else {
      r5 = HEAP32[r26 + 2];
      if (r5 >>> 0 < r23 >>> 0) {
        _abort();
      } else {
        HEAP32[r5 + 12 >> 2] = r6;
        HEAP32[r6 + 8 >> 2] = r5;
        r27 = r6, r28 = r27 >> 2;
        break;
      }
    }
  } while (0);
  L1477 : do {
    if ((r14 | 0) == 0) {
      r31 = r25;
    } else {
      r6 = r25 + 28 | 0;
      r23 = (HEAP32[r6 >> 2] << 2) + 5253064 | 0;
      do {
        if ((r25 | 0) == (HEAP32[r23 >> 2] | 0)) {
          HEAP32[r23 >> 2] = r27;
          if ((r27 | 0) != 0) {
            break;
          }
          HEAP32[1313191] = HEAP32[1313191] & (1 << HEAP32[r6 >> 2] ^ -1);
          r31 = r25;
          break L1477;
        } else {
          if (r14 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          }
          r29 = r14 + 16 | 0;
          if ((HEAP32[r29 >> 2] | 0) == (r25 | 0)) {
            HEAP32[r29 >> 2] = r27;
          } else {
            HEAP32[r14 + 20 >> 2] = r27;
          }
          if ((r27 | 0) == 0) {
            r31 = r25;
            break L1477;
          }
        }
      } while (0);
      if (r27 >>> 0 < HEAP32[1313194] >>> 0) {
        _abort();
      }
      HEAP32[r28 + 6] = r14;
      r6 = HEAP32[r26 + 4];
      do {
        if ((r6 | 0) != 0) {
          if (r6 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          } else {
            HEAP32[r28 + 4] = r6;
            HEAP32[r6 + 24 >> 2] = r27;
            break;
          }
        }
      } while (0);
      r6 = HEAP32[r26 + 5];
      if ((r6 | 0) == 0) {
        r31 = r25;
        break;
      }
      if (r6 >>> 0 < HEAP32[1313194] >>> 0) {
        _abort();
      } else {
        HEAP32[r28 + 5] = r6;
        HEAP32[r6 + 24 >> 2] = r27;
        r31 = r25;
        break;
      }
    }
  } while (0);
  do {
    if (r24 >>> 0 < 16) {
      r25 = r24 + r1 | 0;
      HEAP32[r31 + 4 >> 2] = r25 | 3;
      r27 = r25 + (r12 + 4) | 0;
      HEAP32[r27 >> 2] = HEAP32[r27 >> 2] | 1;
    } else {
      HEAP32[r31 + 4 >> 2] = r1 | 3;
      HEAP32[r2 + (r13 + 1)] = r24 | 1;
      HEAP32[(r24 >> 2) + r13 + r2] = r24;
      r27 = r24 >>> 3;
      if (r24 >>> 0 < 256) {
        r25 = r27 << 1;
        r28 = (r25 << 2) + 5252800 | 0;
        r26 = HEAP32[1313190];
        r14 = 1 << r27;
        do {
          if ((r26 & r14 | 0) == 0) {
            HEAP32[1313190] = r26 | r14;
            r32 = r28;
            r33 = (r25 + 2 << 2) + 5252800 | 0;
          } else {
            r27 = (r25 + 2 << 2) + 5252800 | 0;
            r6 = HEAP32[r27 >> 2];
            if (r6 >>> 0 >= HEAP32[1313194] >>> 0) {
              r32 = r6;
              r33 = r27;
              break;
            }
            _abort();
          }
        } while (0);
        HEAP32[r33 >> 2] = r4;
        HEAP32[r32 + 12 >> 2] = r4;
        HEAP32[r2 + (r13 + 2)] = r32;
        HEAP32[r2 + (r13 + 3)] = r28;
        break;
      }
      r25 = r16;
      r14 = r24 >>> 8;
      do {
        if ((r14 | 0) == 0) {
          r34 = 0;
        } else {
          if (r24 >>> 0 > 16777215) {
            r34 = 31;
            break;
          }
          r26 = (r14 + 1048320 | 0) >>> 16 & 8;
          r27 = r14 << r26;
          r6 = (r27 + 520192 | 0) >>> 16 & 4;
          r23 = r27 << r6;
          r27 = (r23 + 245760 | 0) >>> 16 & 2;
          r29 = 14 - (r6 | r26 | r27) + (r23 << r27 >>> 15) | 0;
          r34 = r24 >>> ((r29 + 7 | 0) >>> 0) & 1 | r29 << 1;
        }
      } while (0);
      r14 = (r34 << 2) + 5253064 | 0;
      HEAP32[r2 + (r13 + 7)] = r34;
      HEAP32[r2 + (r13 + 5)] = 0;
      HEAP32[r2 + (r13 + 4)] = 0;
      r28 = HEAP32[1313191];
      r29 = 1 << r34;
      if ((r28 & r29 | 0) == 0) {
        HEAP32[1313191] = r28 | r29;
        HEAP32[r14 >> 2] = r25;
        HEAP32[r2 + (r13 + 6)] = r14;
        HEAP32[r2 + (r13 + 3)] = r25;
        HEAP32[r2 + (r13 + 2)] = r25;
        break;
      }
      if ((r34 | 0) == 31) {
        r35 = 0;
      } else {
        r35 = 25 - (r34 >>> 1) | 0;
      }
      r29 = r24 << r35;
      r28 = HEAP32[r14 >> 2];
      while (1) {
        if ((HEAP32[r28 + 4 >> 2] & -8 | 0) == (r24 | 0)) {
          break;
        }
        r36 = (r29 >>> 31 << 2) + r28 + 16 | 0;
        r14 = HEAP32[r36 >> 2];
        if ((r14 | 0) == 0) {
          r3 = 1224;
          break;
        } else {
          r29 = r29 << 1;
          r28 = r14;
        }
      }
      if (r3 == 1224) {
        if (r36 >>> 0 < HEAP32[1313194] >>> 0) {
          _abort();
        } else {
          HEAP32[r36 >> 2] = r25;
          HEAP32[r2 + (r13 + 6)] = r28;
          HEAP32[r2 + (r13 + 3)] = r25;
          HEAP32[r2 + (r13 + 2)] = r25;
          break;
        }
      }
      r29 = r28 + 8 | 0;
      r14 = HEAP32[r29 >> 2];
      r27 = HEAP32[1313194];
      if (r28 >>> 0 < r27 >>> 0) {
        _abort();
      }
      if (r14 >>> 0 < r27 >>> 0) {
        _abort();
      } else {
        HEAP32[r14 + 12 >> 2] = r25;
        HEAP32[r29 >> 2] = r25;
        HEAP32[r2 + (r13 + 2)] = r14;
        HEAP32[r2 + (r13 + 3)] = r28;
        HEAP32[r2 + (r13 + 6)] = 0;
        break;
      }
    }
  } while (0);
  r22 = r31 + 8 | 0;
  return r22;
}
_tmalloc_large["X"] = 1;
function _sys_alloc(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22;
  r2 = 0;
  if ((HEAP32[1311652] | 0) == 0) {
    _init_mparams();
  }
  L1547 : do {
    if ((HEAP32[1313300] & 4 | 0) == 0) {
      r3 = HEAP32[1313196];
      do {
        if ((r3 | 0) == 0) {
          r2 = 1247;
        } else {
          r4 = _segment_holding(r3);
          if ((r4 | 0) == 0) {
            r2 = 1247;
            break;
          }
          r5 = HEAP32[1311654];
          r6 = r1 + 47 - HEAP32[1313193] + r5 & -r5;
          if (r6 >>> 0 >= 2147483647) {
            r7 = 0;
            break;
          }
          r5 = _sbrk(r6);
          r8 = (r5 | 0) == (HEAP32[r4 >> 2] + HEAP32[r4 + 4 >> 2] | 0);
          r9 = r8 ? r5 : -1;
          r10 = r8 ? r6 : 0;
          r11 = r5;
          r12 = r6;
          r2 = 1254;
          break;
        }
      } while (0);
      do {
        if (r2 == 1247) {
          r3 = _sbrk(0);
          if ((r3 | 0) == -1) {
            r7 = 0;
            break;
          }
          r6 = HEAP32[1311654];
          r5 = r6 + (r1 + 47) & -r6;
          r6 = r3;
          r8 = HEAP32[1311653];
          r4 = r8 - 1 | 0;
          if ((r4 & r6 | 0) == 0) {
            r13 = r5;
          } else {
            r13 = r5 - r6 + (r4 + r6 & -r8) | 0;
          }
          if (r13 >>> 0 >= 2147483647) {
            r7 = 0;
            break;
          }
          r8 = _sbrk(r13);
          r6 = (r8 | 0) == (r3 | 0);
          r9 = r6 ? r3 : -1;
          r10 = r6 ? r13 : 0;
          r11 = r8;
          r12 = r13;
          r2 = 1254;
          break;
        }
      } while (0);
      L1560 : do {
        if (r2 == 1254) {
          r8 = -r12 | 0;
          if ((r9 | 0) != -1) {
            r14 = r10;
            r15 = r9;
            r2 = 1267;
            break L1547;
          }
          do {
            if ((r11 | 0) != -1 & r12 >>> 0 < 2147483647) {
              if (r12 >>> 0 >= (r1 + 48 | 0) >>> 0) {
                r16 = r12;
                break;
              }
              r6 = HEAP32[1311654];
              r3 = r1 + 47 - r12 + r6 & -r6;
              if (r3 >>> 0 >= 2147483647) {
                r16 = r12;
                break;
              }
              if ((_sbrk(r3) | 0) == -1) {
                _sbrk(r8);
                r7 = r10;
                break L1560;
              } else {
                r16 = r3 + r12 | 0;
                break;
              }
            } else {
              r16 = r12;
            }
          } while (0);
          if ((r11 | 0) != -1) {
            r14 = r16;
            r15 = r11;
            r2 = 1267;
            break L1547;
          }
          HEAP32[1313300] = HEAP32[1313300] | 4;
          r17 = r10;
          r2 = 1264;
          break L1547;
        }
      } while (0);
      HEAP32[1313300] = HEAP32[1313300] | 4;
      r17 = r7;
      r2 = 1264;
      break;
    } else {
      r17 = 0;
      r2 = 1264;
    }
  } while (0);
  do {
    if (r2 == 1264) {
      r7 = HEAP32[1311654];
      r10 = r7 + (r1 + 47) & -r7;
      if (r10 >>> 0 >= 2147483647) {
        break;
      }
      r7 = _sbrk(r10);
      r10 = _sbrk(0);
      if (!((r10 | 0) != -1 & (r7 | 0) != -1 & r7 >>> 0 < r10 >>> 0)) {
        break;
      }
      r11 = r10 - r7 | 0;
      r10 = r11 >>> 0 > (r1 + 40 | 0) >>> 0;
      r16 = r10 ? r7 : -1;
      if ((r16 | 0) == -1) {
        break;
      } else {
        r14 = r10 ? r11 : r17;
        r15 = r16;
        r2 = 1267;
        break;
      }
    }
  } while (0);
  do {
    if (r2 == 1267) {
      r17 = HEAP32[1313298] + r14 | 0;
      HEAP32[1313298] = r17;
      if (r17 >>> 0 > HEAP32[1313299] >>> 0) {
        HEAP32[1313299] = r17;
      }
      r17 = HEAP32[1313196];
      L1582 : do {
        if ((r17 | 0) == 0) {
          r16 = HEAP32[1313194];
          if ((r16 | 0) == 0 | r15 >>> 0 < r16 >>> 0) {
            HEAP32[1313194] = r15;
          }
          HEAP32[1313301] = r15;
          HEAP32[1313302] = r14;
          HEAP32[1313304] = 0;
          HEAP32[1313199] = HEAP32[1311652];
          HEAP32[1313198] = -1;
          _init_bins();
          _init_top(r15, r14 - 40 | 0);
        } else {
          r16 = 5253204, r11 = r16 >> 2;
          while (1) {
            r18 = HEAP32[r11];
            r19 = r16 + 4 | 0;
            r20 = HEAP32[r19 >> 2];
            if ((r15 | 0) == (r18 + r20 | 0)) {
              r2 = 1275;
              break;
            }
            r10 = HEAP32[r11 + 2];
            if ((r10 | 0) == 0) {
              break;
            } else {
              r16 = r10, r11 = r16 >> 2;
            }
          }
          do {
            if (r2 == 1275) {
              if ((HEAP32[r11 + 3] & 8 | 0) != 0) {
                break;
              }
              r16 = r17;
              if (!(r16 >>> 0 >= r18 >>> 0 & r16 >>> 0 < r15 >>> 0)) {
                break;
              }
              HEAP32[r19 >> 2] = r20 + r14 | 0;
              _init_top(HEAP32[1313196], HEAP32[1313193] + r14 | 0);
              break L1582;
            }
          } while (0);
          if (r15 >>> 0 < HEAP32[1313194] >>> 0) {
            HEAP32[1313194] = r15;
          }
          r11 = r15 + r14 | 0;
          r16 = 5253204;
          while (1) {
            r21 = r16 | 0;
            if ((HEAP32[r21 >> 2] | 0) == (r11 | 0)) {
              r2 = 1283;
              break;
            }
            r10 = HEAP32[r16 + 8 >> 2];
            if ((r10 | 0) == 0) {
              break;
            } else {
              r16 = r10;
            }
          }
          do {
            if (r2 == 1283) {
              if ((HEAP32[r16 + 12 >> 2] & 8 | 0) != 0) {
                break;
              }
              HEAP32[r21 >> 2] = r15;
              r10 = r16 + 4 | 0;
              HEAP32[r10 >> 2] = HEAP32[r10 >> 2] + r14 | 0;
              r22 = _prepend_alloc(r15, r11, r1);
              return r22;
            }
          } while (0);
          _add_segment(r15, r14);
        }
      } while (0);
      r17 = HEAP32[1313193];
      if (r17 >>> 0 <= r1 >>> 0) {
        break;
      }
      r11 = r17 - r1 | 0;
      HEAP32[1313193] = r11;
      r17 = HEAP32[1313196];
      r16 = r17;
      HEAP32[1313196] = r16 + r1 | 0;
      HEAP32[r1 + (r16 + 4) >> 2] = r11 | 1;
      HEAP32[r17 + 4 >> 2] = r1 | 3;
      r22 = r17 + 8 | 0;
      return r22;
    }
  } while (0);
  r1 = ___errno_location();
  HEAP32[r1 >> 2] = 12;
  r22 = 0;
  return r22;
}
_sys_alloc["X"] = 1;
function _release_unused_segments() {
  var r1, r2;
  r1 = 5253212;
  while (1) {
    r2 = HEAP32[r1 >> 2];
    if ((r2 | 0) == 0) {
      break;
    } else {
      r1 = r2 + 8 | 0;
    }
  }
  HEAP32[1313198] = -1;
  return;
}
function _sys_trim() {
  var r1, r2, r3, r4, r5, r6, r7;
  if ((HEAP32[1311652] | 0) == 0) {
    _init_mparams();
  }
  r1 = HEAP32[1313196];
  if ((r1 | 0) == 0) {
    return;
  }
  r2 = HEAP32[1313193];
  do {
    if (r2 >>> 0 > 40) {
      r3 = HEAP32[1311654];
      r4 = Math.imul(Math.floor(((r2 - 41 + r3 | 0) >>> 0) / (r3 >>> 0)) - 1 | 0, r3);
      r5 = _segment_holding(r1);
      if ((HEAP32[r5 + 12 >> 2] & 8 | 0) != 0) {
        break;
      }
      r6 = _sbrk(0);
      r7 = (r5 + 4 | 0) >> 2;
      if ((r6 | 0) != (HEAP32[r5 >> 2] + HEAP32[r7] | 0)) {
        break;
      }
      r5 = _sbrk(-(r4 >>> 0 > 2147483646 ? -2147483648 - r3 | 0 : r4) | 0);
      r4 = _sbrk(0);
      if (!((r5 | 0) != -1 & r4 >>> 0 < r6 >>> 0)) {
        break;
      }
      r5 = r6 - r4 | 0;
      if ((r6 | 0) == (r4 | 0)) {
        break;
      }
      HEAP32[r7] = HEAP32[r7] - r5 | 0;
      HEAP32[1313298] = HEAP32[1313298] - r5 | 0;
      _init_top(HEAP32[1313196], HEAP32[1313193] - r5 | 0);
      return;
    }
  } while (0);
  if (HEAP32[1313193] >>> 0 <= HEAP32[1313197] >>> 0) {
    return;
  }
  HEAP32[1313197] = -1;
  return;
}
_sys_trim["X"] = 1;
function _free(r1) {
  var r2, r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40;
  r2 = r1 >> 2;
  r3 = 0;
  if ((r1 | 0) == 0) {
    return;
  }
  r4 = r1 - 8 | 0;
  r5 = r4;
  r6 = HEAP32[1313194];
  if (r4 >>> 0 < r6 >>> 0) {
    _abort();
  }
  r7 = HEAP32[r1 - 4 >> 2];
  r8 = r7 & 3;
  if ((r8 | 0) == 1) {
    _abort();
  }
  r9 = r7 & -8, r10 = r9 >> 2;
  r11 = r1 + (r9 - 8) | 0;
  r12 = r11;
  L1644 : do {
    if ((r7 & 1 | 0) == 0) {
      r13 = HEAP32[r4 >> 2];
      if ((r8 | 0) == 0) {
        return;
      }
      r14 = -8 - r13 | 0, r15 = r14 >> 2;
      r16 = r1 + r14 | 0;
      r17 = r16;
      r18 = r13 + r9 | 0;
      if (r16 >>> 0 < r6 >>> 0) {
        _abort();
      }
      if ((r17 | 0) == (HEAP32[1313195] | 0)) {
        r19 = (r1 + (r9 - 4) | 0) >> 2;
        if ((HEAP32[r19] & 3 | 0) != 3) {
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break;
        }
        HEAP32[1313192] = r18;
        HEAP32[r19] = HEAP32[r19] & -2;
        HEAP32[r15 + (r2 + 1)] = r18 | 1;
        HEAP32[r11 >> 2] = r18;
        return;
      }
      r19 = r13 >>> 3;
      if (r13 >>> 0 < 256) {
        r13 = HEAP32[r15 + (r2 + 2)];
        r23 = HEAP32[r15 + (r2 + 3)];
        if ((r13 | 0) == (r23 | 0)) {
          HEAP32[1313190] = HEAP32[1313190] & (1 << r19 ^ -1);
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break;
        }
        r24 = (r19 << 3) + 5252800 | 0;
        if ((r13 | 0) != (r24 | 0) & r13 >>> 0 < r6 >>> 0) {
          _abort();
        }
        if ((r23 | 0) == (r24 | 0) | r23 >>> 0 >= r6 >>> 0) {
          HEAP32[r13 + 12 >> 2] = r23;
          HEAP32[r23 + 8 >> 2] = r13;
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break;
        } else {
          _abort();
        }
      }
      r13 = r16;
      r16 = HEAP32[r15 + (r2 + 6)];
      r23 = HEAP32[r15 + (r2 + 3)];
      L1669 : do {
        if ((r23 | 0) == (r13 | 0)) {
          r24 = r14 + (r1 + 20) | 0;
          r19 = HEAP32[r24 >> 2];
          do {
            if ((r19 | 0) == 0) {
              r25 = r14 + (r1 + 16) | 0;
              r26 = HEAP32[r25 >> 2];
              if ((r26 | 0) == 0) {
                r27 = 0, r28 = r27 >> 2;
                break L1669;
              } else {
                r29 = r26;
                r30 = r25;
                break;
              }
            } else {
              r29 = r19;
              r30 = r24;
            }
          } while (0);
          while (1) {
            r24 = r29 + 20 | 0;
            r19 = HEAP32[r24 >> 2];
            if ((r19 | 0) != 0) {
              r29 = r19;
              r30 = r24;
              continue;
            }
            r24 = r29 + 16 | 0;
            r19 = HEAP32[r24 >> 2];
            if ((r19 | 0) == 0) {
              break;
            } else {
              r29 = r19;
              r30 = r24;
            }
          }
          if (r30 >>> 0 < r6 >>> 0) {
            _abort();
          } else {
            HEAP32[r30 >> 2] = 0;
            r27 = r29, r28 = r27 >> 2;
            break;
          }
        } else {
          r24 = HEAP32[r15 + (r2 + 2)];
          if (r24 >>> 0 < r6 >>> 0) {
            _abort();
          } else {
            HEAP32[r24 + 12 >> 2] = r23;
            HEAP32[r23 + 8 >> 2] = r24;
            r27 = r23, r28 = r27 >> 2;
            break;
          }
        }
      } while (0);
      if ((r16 | 0) == 0) {
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
      r23 = r14 + (r1 + 28) | 0;
      r24 = (HEAP32[r23 >> 2] << 2) + 5253064 | 0;
      do {
        if ((r13 | 0) == (HEAP32[r24 >> 2] | 0)) {
          HEAP32[r24 >> 2] = r27;
          if ((r27 | 0) != 0) {
            break;
          }
          HEAP32[1313191] = HEAP32[1313191] & (1 << HEAP32[r23 >> 2] ^ -1);
          r20 = r17, r21 = r20 >> 2;
          r22 = r18;
          break L1644;
        } else {
          if (r16 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          }
          r19 = r16 + 16 | 0;
          if ((HEAP32[r19 >> 2] | 0) == (r13 | 0)) {
            HEAP32[r19 >> 2] = r27;
          } else {
            HEAP32[r16 + 20 >> 2] = r27;
          }
          if ((r27 | 0) == 0) {
            r20 = r17, r21 = r20 >> 2;
            r22 = r18;
            break L1644;
          }
        }
      } while (0);
      if (r27 >>> 0 < HEAP32[1313194] >>> 0) {
        _abort();
      }
      HEAP32[r28 + 6] = r16;
      r13 = HEAP32[r15 + (r2 + 4)];
      do {
        if ((r13 | 0) != 0) {
          if (r13 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          } else {
            HEAP32[r28 + 4] = r13;
            HEAP32[r13 + 24 >> 2] = r27;
            break;
          }
        }
      } while (0);
      r13 = HEAP32[r15 + (r2 + 5)];
      if ((r13 | 0) == 0) {
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
      if (r13 >>> 0 < HEAP32[1313194] >>> 0) {
        _abort();
      } else {
        HEAP32[r28 + 5] = r13;
        HEAP32[r13 + 24 >> 2] = r27;
        r20 = r17, r21 = r20 >> 2;
        r22 = r18;
        break;
      }
    } else {
      r20 = r5, r21 = r20 >> 2;
      r22 = r9;
    }
  } while (0);
  r5 = r20, r27 = r5 >> 2;
  if (r5 >>> 0 >= r11 >>> 0) {
    _abort();
  }
  r5 = r1 + (r9 - 4) | 0;
  r28 = HEAP32[r5 >> 2];
  if ((r28 & 1 | 0) == 0) {
    _abort();
  }
  do {
    if ((r28 & 2 | 0) == 0) {
      if ((r12 | 0) == (HEAP32[1313196] | 0)) {
        r6 = HEAP32[1313193] + r22 | 0;
        HEAP32[1313193] = r6;
        HEAP32[1313196] = r20;
        HEAP32[r21 + 1] = r6 | 1;
        if ((r20 | 0) == (HEAP32[1313195] | 0)) {
          HEAP32[1313195] = 0;
          HEAP32[1313192] = 0;
        }
        if (r6 >>> 0 <= HEAP32[1313197] >>> 0) {
          return;
        }
        _sys_trim();
        return;
      }
      if ((r12 | 0) == (HEAP32[1313195] | 0)) {
        r6 = HEAP32[1313192] + r22 | 0;
        HEAP32[1313192] = r6;
        HEAP32[1313195] = r20;
        HEAP32[r21 + 1] = r6 | 1;
        HEAP32[(r6 >> 2) + r27] = r6;
        return;
      }
      r6 = (r28 & -8) + r22 | 0;
      r29 = r28 >>> 3;
      L1735 : do {
        if (r28 >>> 0 < 256) {
          r30 = HEAP32[r2 + r10];
          r8 = HEAP32[((r9 | 4) >> 2) + r2];
          if ((r30 | 0) == (r8 | 0)) {
            HEAP32[1313190] = HEAP32[1313190] & (1 << r29 ^ -1);
            break;
          }
          r4 = (r29 << 3) + 5252800 | 0;
          do {
            if ((r30 | 0) != (r4 | 0)) {
              if (r30 >>> 0 >= HEAP32[1313194] >>> 0) {
                break;
              }
              _abort();
            }
          } while (0);
          do {
            if ((r8 | 0) != (r4 | 0)) {
              if (r8 >>> 0 >= HEAP32[1313194] >>> 0) {
                break;
              }
              _abort();
            }
          } while (0);
          HEAP32[r30 + 12 >> 2] = r8;
          HEAP32[r8 + 8 >> 2] = r30;
        } else {
          r4 = r11;
          r7 = HEAP32[r10 + (r2 + 4)];
          r13 = HEAP32[((r9 | 4) >> 2) + r2];
          L1749 : do {
            if ((r13 | 0) == (r4 | 0)) {
              r16 = r9 + (r1 + 12) | 0;
              r23 = HEAP32[r16 >> 2];
              do {
                if ((r23 | 0) == 0) {
                  r24 = r9 + (r1 + 8) | 0;
                  r14 = HEAP32[r24 >> 2];
                  if ((r14 | 0) == 0) {
                    r31 = 0, r32 = r31 >> 2;
                    break L1749;
                  } else {
                    r33 = r14;
                    r34 = r24;
                    break;
                  }
                } else {
                  r33 = r23;
                  r34 = r16;
                }
              } while (0);
              while (1) {
                r16 = r33 + 20 | 0;
                r23 = HEAP32[r16 >> 2];
                if ((r23 | 0) != 0) {
                  r33 = r23;
                  r34 = r16;
                  continue;
                }
                r16 = r33 + 16 | 0;
                r23 = HEAP32[r16 >> 2];
                if ((r23 | 0) == 0) {
                  break;
                } else {
                  r33 = r23;
                  r34 = r16;
                }
              }
              if (r34 >>> 0 < HEAP32[1313194] >>> 0) {
                _abort();
              } else {
                HEAP32[r34 >> 2] = 0;
                r31 = r33, r32 = r31 >> 2;
                break;
              }
            } else {
              r16 = HEAP32[r2 + r10];
              if (r16 >>> 0 < HEAP32[1313194] >>> 0) {
                _abort();
              } else {
                HEAP32[r16 + 12 >> 2] = r13;
                HEAP32[r13 + 8 >> 2] = r16;
                r31 = r13, r32 = r31 >> 2;
                break;
              }
            }
          } while (0);
          if ((r7 | 0) == 0) {
            break;
          }
          r13 = r9 + (r1 + 20) | 0;
          r30 = (HEAP32[r13 >> 2] << 2) + 5253064 | 0;
          do {
            if ((r4 | 0) == (HEAP32[r30 >> 2] | 0)) {
              HEAP32[r30 >> 2] = r31;
              if ((r31 | 0) != 0) {
                break;
              }
              HEAP32[1313191] = HEAP32[1313191] & (1 << HEAP32[r13 >> 2] ^ -1);
              break L1735;
            } else {
              if (r7 >>> 0 < HEAP32[1313194] >>> 0) {
                _abort();
              }
              r8 = r7 + 16 | 0;
              if ((HEAP32[r8 >> 2] | 0) == (r4 | 0)) {
                HEAP32[r8 >> 2] = r31;
              } else {
                HEAP32[r7 + 20 >> 2] = r31;
              }
              if ((r31 | 0) == 0) {
                break L1735;
              }
            }
          } while (0);
          if (r31 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          }
          HEAP32[r32 + 6] = r7;
          r4 = HEAP32[r10 + (r2 + 2)];
          do {
            if ((r4 | 0) != 0) {
              if (r4 >>> 0 < HEAP32[1313194] >>> 0) {
                _abort();
              } else {
                HEAP32[r32 + 4] = r4;
                HEAP32[r4 + 24 >> 2] = r31;
                break;
              }
            }
          } while (0);
          r4 = HEAP32[r10 + (r2 + 3)];
          if ((r4 | 0) == 0) {
            break;
          }
          if (r4 >>> 0 < HEAP32[1313194] >>> 0) {
            _abort();
          } else {
            HEAP32[r32 + 5] = r4;
            HEAP32[r4 + 24 >> 2] = r31;
            break;
          }
        }
      } while (0);
      HEAP32[r21 + 1] = r6 | 1;
      HEAP32[(r6 >> 2) + r27] = r6;
      if ((r20 | 0) != (HEAP32[1313195] | 0)) {
        r35 = r6;
        break;
      }
      HEAP32[1313192] = r6;
      return;
    } else {
      HEAP32[r5 >> 2] = r28 & -2;
      HEAP32[r21 + 1] = r22 | 1;
      HEAP32[(r22 >> 2) + r27] = r22;
      r35 = r22;
    }
  } while (0);
  r22 = r35 >>> 3;
  if (r35 >>> 0 < 256) {
    r27 = r22 << 1;
    r28 = (r27 << 2) + 5252800 | 0;
    r5 = HEAP32[1313190];
    r31 = 1 << r22;
    do {
      if ((r5 & r31 | 0) == 0) {
        HEAP32[1313190] = r5 | r31;
        r36 = r28;
        r37 = (r27 + 2 << 2) + 5252800 | 0;
      } else {
        r22 = (r27 + 2 << 2) + 5252800 | 0;
        r32 = HEAP32[r22 >> 2];
        if (r32 >>> 0 >= HEAP32[1313194] >>> 0) {
          r36 = r32;
          r37 = r22;
          break;
        }
        _abort();
      }
    } while (0);
    HEAP32[r37 >> 2] = r20;
    HEAP32[r36 + 12 >> 2] = r20;
    HEAP32[r21 + 2] = r36;
    HEAP32[r21 + 3] = r28;
    return;
  }
  r28 = r20;
  r36 = r35 >>> 8;
  do {
    if ((r36 | 0) == 0) {
      r38 = 0;
    } else {
      if (r35 >>> 0 > 16777215) {
        r38 = 31;
        break;
      }
      r37 = (r36 + 1048320 | 0) >>> 16 & 8;
      r27 = r36 << r37;
      r31 = (r27 + 520192 | 0) >>> 16 & 4;
      r5 = r27 << r31;
      r27 = (r5 + 245760 | 0) >>> 16 & 2;
      r22 = 14 - (r31 | r37 | r27) + (r5 << r27 >>> 15) | 0;
      r38 = r35 >>> ((r22 + 7 | 0) >>> 0) & 1 | r22 << 1;
    }
  } while (0);
  r36 = (r38 << 2) + 5253064 | 0;
  HEAP32[r21 + 7] = r38;
  HEAP32[r21 + 5] = 0;
  HEAP32[r21 + 4] = 0;
  r22 = HEAP32[1313191];
  r27 = 1 << r38;
  do {
    if ((r22 & r27 | 0) == 0) {
      HEAP32[1313191] = r22 | r27;
      HEAP32[r36 >> 2] = r28;
      HEAP32[r21 + 6] = r36;
      HEAP32[r21 + 3] = r20;
      HEAP32[r21 + 2] = r20;
    } else {
      if ((r38 | 0) == 31) {
        r39 = 0;
      } else {
        r39 = 25 - (r38 >>> 1) | 0;
      }
      r5 = r35 << r39;
      r37 = HEAP32[r36 >> 2];
      while (1) {
        if ((HEAP32[r37 + 4 >> 2] & -8 | 0) == (r35 | 0)) {
          break;
        }
        r40 = (r5 >>> 31 << 2) + r37 + 16 | 0;
        r31 = HEAP32[r40 >> 2];
        if ((r31 | 0) == 0) {
          r3 = 1428;
          break;
        } else {
          r5 = r5 << 1;
          r37 = r31;
        }
      }
      if (r3 == 1428) {
        if (r40 >>> 0 < HEAP32[1313194] >>> 0) {
          _abort();
        } else {
          HEAP32[r40 >> 2] = r28;
          HEAP32[r21 + 6] = r37;
          HEAP32[r21 + 3] = r20;
          HEAP32[r21 + 2] = r20;
          break;
        }
      }
      r5 = r37 + 8 | 0;
      r6 = HEAP32[r5 >> 2];
      r31 = HEAP32[1313194];
      if (r37 >>> 0 < r31 >>> 0) {
        _abort();
      }
      if (r6 >>> 0 < r31 >>> 0) {
        _abort();
      } else {
        HEAP32[r6 + 12 >> 2] = r28;
        HEAP32[r5 >> 2] = r28;
        HEAP32[r21 + 2] = r6;
        HEAP32[r21 + 3] = r37;
        HEAP32[r21 + 6] = 0;
        break;
      }
    }
  } while (0);
  r21 = HEAP32[1313198] - 1 | 0;
  HEAP32[1313198] = r21;
  if ((r21 | 0) != 0) {
    return;
  }
  _release_unused_segments();
  return;
}
_free["X"] = 1;
function _mmap_resize(r1, r2) {
  var r3, r4;
  r3 = HEAP32[r1 + 4 >> 2] & -8;
  do {
    if (r2 >>> 0 < 256) {
      r4 = 0;
    } else {
      if (r3 >>> 0 >= (r2 + 4 | 0) >>> 0) {
        if ((r3 - r2 | 0) >>> 0 <= HEAP32[1311654] << 1 >>> 0) {
          r4 = r1;
          break;
        }
      }
      r4 = 0;
    }
  } while (0);
  return r4;
}
function _segment_holding(r1) {
  var r2, r3, r4, r5, r6;
  r2 = 0;
  r3 = 5253204, r4 = r3 >> 2;
  while (1) {
    r5 = HEAP32[r4];
    if (r5 >>> 0 <= r1 >>> 0) {
      if ((r5 + HEAP32[r4 + 1] | 0) >>> 0 > r1 >>> 0) {
        r6 = r3;
        r2 = 1470;
        break;
      }
    }
    r5 = HEAP32[r4 + 2];
    if ((r5 | 0) == 0) {
      r6 = 0;
      r2 = 1471;
      break;
    } else {
      r3 = r5, r4 = r3 >> 2;
    }
  }
  if (r2 == 1470) {
    return r6;
  } else if (r2 == 1471) {
    return r6;
  }
}
function _init_top(r1, r2) {
  var r3, r4, r5;
  r3 = r1;
  r4 = r1 + 8 | 0;
  if ((r4 & 7 | 0) == 0) {
    r5 = 0;
  } else {
    r5 = -r4 & 7;
  }
  r4 = r2 - r5 | 0;
  HEAP32[1313196] = r3 + r5 | 0;
  HEAP32[1313193] = r4;
  HEAP32[r5 + (r3 + 4) >> 2] = r4 | 1;
  HEAP32[r2 + (r3 + 4) >> 2] = 40;
  HEAP32[1313197] = HEAP32[1311656];
  return;
}
function _init_bins() {
  var r1, r2, r3;
  r1 = 0;
  while (1) {
    r2 = r1 << 1;
    r3 = (r2 << 2) + 5252800 | 0;
    HEAP32[(r2 + 3 << 2) + 5252800 >> 2] = r3;
    HEAP32[(r2 + 2 << 2) + 5252800 >> 2] = r3;
    r3 = r1 + 1 | 0;
    if ((r3 | 0) == 32) {
      break;
    } else {
      r1 = r3;
    }
  }
  return;
}
function _realloc(r1, r2) {
  var r3;
  if ((r1 | 0) == 0) {
    r3 = _malloc(r2);
  } else {
    r3 = _internal_realloc(r1, r2);
  }
  return r3;
}
Module["_realloc"] = _realloc;
function _internal_realloc(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16;
  r3 = 0;
  if (r2 >>> 0 > 4294967231) {
    r4 = ___errno_location();
    HEAP32[r4 >> 2] = 12;
    r5 = 0;
    return r5;
  }
  r4 = r1 - 8 | 0;
  r6 = r4;
  r7 = (r1 - 4 | 0) >> 2;
  r8 = HEAP32[r7];
  r9 = r8 & -8;
  r10 = r9 - 8 | 0;
  r11 = r1 + r10 | 0;
  if (r4 >>> 0 < HEAP32[1313194] >>> 0) {
    _abort();
  }
  r4 = r8 & 3;
  if (!((r4 | 0) != 1 & (r10 | 0) > -8)) {
    _abort();
  }
  r10 = (r1 + (r9 - 4) | 0) >> 2;
  if ((HEAP32[r10] & 1 | 0) == 0) {
    _abort();
  }
  if (r2 >>> 0 < 11) {
    r12 = 16;
  } else {
    r12 = r2 + 11 & -8;
  }
  do {
    if ((r4 | 0) == 0) {
      r13 = _mmap_resize(r6, r12);
      r14 = 0;
      r3 = 1498;
      break;
    } else {
      if (r9 >>> 0 >= r12 >>> 0) {
        r15 = r9 - r12 | 0;
        if (r15 >>> 0 <= 15) {
          r13 = r6;
          r14 = 0;
          r3 = 1498;
          break;
        }
        HEAP32[r7] = r12 | r8 & 1 | 2;
        HEAP32[r1 + (r12 - 4) >> 2] = r15 | 3;
        HEAP32[r10] = HEAP32[r10] | 1;
        r13 = r6;
        r14 = r1 + r12 | 0;
        r3 = 1498;
        break;
      }
      if ((r11 | 0) != (HEAP32[1313196] | 0)) {
        break;
      }
      r15 = HEAP32[1313193] + r9 | 0;
      if (r15 >>> 0 <= r12 >>> 0) {
        break;
      }
      r16 = r15 - r12 | 0;
      HEAP32[r7] = r12 | r8 & 1 | 2;
      HEAP32[r1 + (r12 - 4) >> 2] = r16 | 1;
      HEAP32[1313196] = r1 + (r12 - 8) | 0;
      HEAP32[1313193] = r16;
      r13 = r6;
      r14 = 0;
      r3 = 1498;
      break;
    }
  } while (0);
  do {
    if (r3 == 1498) {
      if ((r13 | 0) == 0) {
        break;
      }
      if ((r14 | 0) != 0) {
        _free(r14);
      }
      r5 = r13 + 8 | 0;
      return r5;
    }
  } while (0);
  r13 = _malloc(r2);
  if ((r13 | 0) == 0) {
    r5 = 0;
    return r5;
  }
  r14 = r9 - ((HEAP32[r7] & 3 | 0) == 0 ? 8 : 4) | 0;
  _memcpy(r13, r1, r14 >>> 0 < r2 >>> 0 ? r14 : r2);
  _free(r1);
  r5 = r13;
  return r5;
}
_internal_realloc["X"] = 1;
function _init_mparams() {
  var r1;
  if ((HEAP32[1311652] | 0) != 0) {
    return;
  }
  r1 = _sysconf(8);
  if ((r1 - 1 & r1 | 0) != 0) {
    _abort();
  }
  HEAP32[1311654] = r1;
  HEAP32[1311653] = r1;
  HEAP32[1311655] = -1;
  HEAP32[1311656] = 2097152;
  HEAP32[1311657] = 0;
  HEAP32[1313300] = 0;
  r1 = _time(0) & -16 ^ 1431655768;
  HEAP32[1311652] = r1;
  return;
}
function _prepend_alloc(r1, r2, r3) {
  var r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16, r17, r18, r19, r20, r21, r22, r23, r24, r25, r26, r27, r28, r29, r30, r31, r32, r33, r34, r35, r36, r37, r38, r39, r40;
  r4 = r2 >> 2;
  r5 = r1 >> 2;
  r6 = 0;
  r7 = r1 + 8 | 0;
  if ((r7 & 7 | 0) == 0) {
    r8 = 0;
  } else {
    r8 = -r7 & 7;
  }
  r7 = r2 + 8 | 0;
  if ((r7 & 7 | 0) == 0) {
    r9 = 0, r10 = r9 >> 2;
  } else {
    r9 = -r7 & 7, r10 = r9 >> 2;
  }
  r7 = r2 + r9 | 0;
  r11 = r7;
  r12 = r8 + r3 | 0, r13 = r12 >> 2;
  r14 = r1 + r12 | 0;
  r12 = r14;
  r15 = r7 - (r1 + r8) - r3 | 0;
  HEAP32[(r8 + 4 >> 2) + r5] = r3 | 3;
  if ((r11 | 0) == (HEAP32[1313196] | 0)) {
    r3 = HEAP32[1313193] + r15 | 0;
    HEAP32[1313193] = r3;
    HEAP32[1313196] = r12;
    HEAP32[r13 + (r5 + 1)] = r3 | 1;
    r16 = r8 | 8;
    r17 = r1 + r16 | 0;
    return r17;
  }
  if ((r11 | 0) == (HEAP32[1313195] | 0)) {
    r3 = HEAP32[1313192] + r15 | 0;
    HEAP32[1313192] = r3;
    HEAP32[1313195] = r12;
    HEAP32[r13 + (r5 + 1)] = r3 | 1;
    HEAP32[(r3 >> 2) + r5 + r13] = r3;
    r16 = r8 | 8;
    r17 = r1 + r16 | 0;
    return r17;
  }
  r3 = HEAP32[r10 + (r4 + 1)];
  if ((r3 & 3 | 0) == 1) {
    r18 = r3 & -8;
    r19 = r3 >>> 3;
    L1926 : do {
      if (r3 >>> 0 < 256) {
        r20 = HEAP32[((r9 | 8) >> 2) + r4];
        r21 = HEAP32[r10 + (r4 + 3)];
        if ((r20 | 0) == (r21 | 0)) {
          HEAP32[1313190] = HEAP32[1313190] & (1 << r19 ^ -1);
          break;
        }
        r22 = (r19 << 3) + 5252800 | 0;
        do {
          if ((r20 | 0) != (r22 | 0)) {
            if (r20 >>> 0 >= HEAP32[1313194] >>> 0) {
              break;
            }
            _abort();
          }
        } while (0);
        do {
          if ((r21 | 0) != (r22 | 0)) {
            if (r21 >>> 0 >= HEAP32[1313194] >>> 0) {
              break;
            }
            _abort();
          }
        } while (0);
        HEAP32[r20 + 12 >> 2] = r21;
        HEAP32[r21 + 8 >> 2] = r20;
      } else {
        r22 = r7;
        r23 = HEAP32[((r9 | 24) >> 2) + r4];
        r24 = HEAP32[r10 + (r4 + 3)];
        L1928 : do {
          if ((r24 | 0) == (r22 | 0)) {
            r25 = r9 | 16;
            r26 = r25 + (r2 + 4) | 0;
            r27 = HEAP32[r26 >> 2];
            do {
              if ((r27 | 0) == 0) {
                r28 = r2 + r25 | 0;
                r29 = HEAP32[r28 >> 2];
                if ((r29 | 0) == 0) {
                  r30 = 0, r31 = r30 >> 2;
                  break L1928;
                } else {
                  r32 = r29;
                  r33 = r28;
                  break;
                }
              } else {
                r32 = r27;
                r33 = r26;
              }
            } while (0);
            while (1) {
              r26 = r32 + 20 | 0;
              r27 = HEAP32[r26 >> 2];
              if ((r27 | 0) != 0) {
                r32 = r27;
                r33 = r26;
                continue;
              }
              r26 = r32 + 16 | 0;
              r27 = HEAP32[r26 >> 2];
              if ((r27 | 0) == 0) {
                break;
              } else {
                r32 = r27;
                r33 = r26;
              }
            }
            if (r33 >>> 0 < HEAP32[1313194] >>> 0) {
              _abort();
            } else {
              HEAP32[r33 >> 2] = 0;
              r30 = r32, r31 = r30 >> 2;
              break;
            }
          } else {
            r26 = HEAP32[((r9 | 8) >> 2) + r4];
            if (r26 >>> 0 < HEAP32[1313194] >>> 0) {
              _abort();
            } else {
              HEAP32[r26 + 12 >> 2] = r24;
              HEAP32[r24 + 8 >> 2] = r26;
              r30 = r24, r31 = r30 >> 2;
              break;
            }
          }
        } while (0);
        if ((r23 | 0) == 0) {
          break;
        }
        r24 = r9 + (r2 + 28) | 0;
        r20 = (HEAP32[r24 >> 2] << 2) + 5253064 | 0;
        do {
          if ((r22 | 0) == (HEAP32[r20 >> 2] | 0)) {
            HEAP32[r20 >> 2] = r30;
            if ((r30 | 0) != 0) {
              break;
            }
            HEAP32[1313191] = HEAP32[1313191] & (1 << HEAP32[r24 >> 2] ^ -1);
            break L1926;
          } else {
            if (r23 >>> 0 < HEAP32[1313194] >>> 0) {
              _abort();
            }
            r21 = r23 + 16 | 0;
            if ((HEAP32[r21 >> 2] | 0) == (r22 | 0)) {
              HEAP32[r21 >> 2] = r30;
            } else {
              HEAP32[r23 + 20 >> 2] = r30;
            }
            if ((r30 | 0) == 0) {
              break L1926;
            }
          }
        } while (0);
        if (r30 >>> 0 < HEAP32[1313194] >>> 0) {
          _abort();
        }
        HEAP32[r31 + 6] = r23;
        r22 = r9 | 16;
        r24 = HEAP32[(r22 >> 2) + r4];
        do {
          if ((r24 | 0) != 0) {
            if (r24 >>> 0 < HEAP32[1313194] >>> 0) {
              _abort();
            } else {
              HEAP32[r31 + 4] = r24;
              HEAP32[r24 + 24 >> 2] = r30;
              break;
            }
          }
        } while (0);
        r24 = HEAP32[(r22 + 4 >> 2) + r4];
        if ((r24 | 0) == 0) {
          break;
        }
        if (r24 >>> 0 < HEAP32[1313194] >>> 0) {
          _abort();
        } else {
          HEAP32[r31 + 5] = r24;
          HEAP32[r24 + 24 >> 2] = r30;
          break;
        }
      }
    } while (0);
    r34 = r2 + (r18 | r9) | 0;
    r35 = r18 + r15 | 0;
  } else {
    r34 = r11;
    r35 = r15;
  }
  r15 = r34 + 4 | 0;
  HEAP32[r15 >> 2] = HEAP32[r15 >> 2] & -2;
  HEAP32[r13 + (r5 + 1)] = r35 | 1;
  HEAP32[(r35 >> 2) + r5 + r13] = r35;
  r15 = r35 >>> 3;
  if (r35 >>> 0 < 256) {
    r34 = r15 << 1;
    r11 = (r34 << 2) + 5252800 | 0;
    r18 = HEAP32[1313190];
    r9 = 1 << r15;
    do {
      if ((r18 & r9 | 0) == 0) {
        HEAP32[1313190] = r18 | r9;
        r36 = r11;
        r37 = (r34 + 2 << 2) + 5252800 | 0;
      } else {
        r15 = (r34 + 2 << 2) + 5252800 | 0;
        r2 = HEAP32[r15 >> 2];
        if (r2 >>> 0 >= HEAP32[1313194] >>> 0) {
          r36 = r2;
          r37 = r15;
          break;
        }
        _abort();
      }
    } while (0);
    HEAP32[r37 >> 2] = r12;
    HEAP32[r36 + 12 >> 2] = r12;
    HEAP32[r13 + (r5 + 2)] = r36;
    HEAP32[r13 + (r5 + 3)] = r11;
    r16 = r8 | 8;
    r17 = r1 + r16 | 0;
    return r17;
  }
  r11 = r14;
  r14 = r35 >>> 8;
  do {
    if ((r14 | 0) == 0) {
      r38 = 0;
    } else {
      if (r35 >>> 0 > 16777215) {
        r38 = 31;
        break;
      }
      r36 = (r14 + 1048320 | 0) >>> 16 & 8;
      r12 = r14 << r36;
      r37 = (r12 + 520192 | 0) >>> 16 & 4;
      r34 = r12 << r37;
      r12 = (r34 + 245760 | 0) >>> 16 & 2;
      r9 = 14 - (r37 | r36 | r12) + (r34 << r12 >>> 15) | 0;
      r38 = r35 >>> ((r9 + 7 | 0) >>> 0) & 1 | r9 << 1;
    }
  } while (0);
  r14 = (r38 << 2) + 5253064 | 0;
  HEAP32[r13 + (r5 + 7)] = r38;
  HEAP32[r13 + (r5 + 5)] = 0;
  HEAP32[r13 + (r5 + 4)] = 0;
  r9 = HEAP32[1313191];
  r12 = 1 << r38;
  if ((r9 & r12 | 0) == 0) {
    HEAP32[1313191] = r9 | r12;
    HEAP32[r14 >> 2] = r11;
    HEAP32[r13 + (r5 + 6)] = r14;
    HEAP32[r13 + (r5 + 3)] = r11;
    HEAP32[r13 + (r5 + 2)] = r11;
    r16 = r8 | 8;
    r17 = r1 + r16 | 0;
    return r17;
  }
  if ((r38 | 0) == 31) {
    r39 = 0;
  } else {
    r39 = 25 - (r38 >>> 1) | 0;
  }
  r38 = r35 << r39;
  r39 = HEAP32[r14 >> 2];
  while (1) {
    if ((HEAP32[r39 + 4 >> 2] & -8 | 0) == (r35 | 0)) {
      break;
    }
    r40 = (r38 >>> 31 << 2) + r39 + 16 | 0;
    r14 = HEAP32[r40 >> 2];
    if ((r14 | 0) == 0) {
      r6 = 1585;
      break;
    } else {
      r38 = r38 << 1;
      r39 = r14;
    }
  }
  if (r6 == 1585) {
    if (r40 >>> 0 < HEAP32[1313194] >>> 0) {
      _abort();
    }
    HEAP32[r40 >> 2] = r11;
    HEAP32[r13 + (r5 + 6)] = r39;
    HEAP32[r13 + (r5 + 3)] = r11;
    HEAP32[r13 + (r5 + 2)] = r11;
    r16 = r8 | 8;
    r17 = r1 + r16 | 0;
    return r17;
  }
  r40 = r39 + 8 | 0;
  r6 = HEAP32[r40 >> 2];
  r38 = HEAP32[1313194];
  if (r39 >>> 0 < r38 >>> 0) {
    _abort();
  }
  if (r6 >>> 0 < r38 >>> 0) {
    _abort();
  }
  HEAP32[r6 + 12 >> 2] = r11;
  HEAP32[r40 >> 2] = r11;
  HEAP32[r13 + (r5 + 2)] = r6;
  HEAP32[r13 + (r5 + 3)] = r39;
  HEAP32[r13 + (r5 + 6)] = 0;
  r16 = r8 | 8;
  r17 = r1 + r16 | 0;
  return r17;
}
_prepend_alloc["X"] = 1;
function __ZNKSt9bad_alloc4whatEv(r1) {
  return 5252104;
}
function __ZSt15get_new_handlerv() {
  return tempValue = HEAP32[1313395], HEAP32[1313395] = tempValue, tempValue;
}
function __ZNSt9bad_allocC2Ev(r1) {
  HEAP32[r1 >> 2] = 5253332;
  return;
}
function __ZNSt9bad_allocC1Ev(r1) {
  __ZNSt9bad_allocC2Ev(r1);
  return;
}
function __ZNSt9bad_allocD1Ev(r1) {
  __ZNSt9bad_allocD2Ev(r1);
  return;
}
function __ZdlPv(r1) {
  if ((r1 | 0) == 0) {
    return;
  }
  _free(r1);
  return;
}
function __ZdaPv(r1) {
  __ZdlPv(r1);
  return;
}
function __ZNSt9bad_allocD0Ev(r1) {
  __ZNSt9bad_allocD1Ev(r1);
  __ZdlPv(r1);
  return;
}
function __ZNSt9bad_allocD2Ev(r1) {
  return;
}
function _add_segment(r1, r2) {
  var r3, r4, r5, r6, r7, r8, r9, r10, r11, r12, r13, r14, r15, r16;
  r3 = 0;
  r4 = HEAP32[1313196], r5 = r4 >> 2;
  r6 = r4;
  r7 = _segment_holding(r6);
  r8 = HEAP32[r7 >> 2];
  r9 = HEAP32[r7 + 4 >> 2];
  r7 = r8 + r9 | 0;
  r10 = r8 + (r9 - 39) | 0;
  if ((r10 & 7 | 0) == 0) {
    r11 = 0;
  } else {
    r11 = -r10 & 7;
  }
  r10 = r8 + (r9 - 47) + r11 | 0;
  r11 = r10 >>> 0 < (r4 + 16 | 0) >>> 0 ? r6 : r10;
  r10 = r11 + 8 | 0, r9 = r10 >> 2;
  _init_top(r1, r2 - 40 | 0);
  HEAP32[r11 + 4 >> 2] = 27;
  HEAP32[r9] = HEAP32[1313301];
  HEAP32[r9 + 1] = HEAP32[1313302];
  HEAP32[r9 + 2] = HEAP32[1313303];
  HEAP32[r9 + 3] = HEAP32[1313304];
  HEAP32[1313301] = r1;
  HEAP32[1313302] = r2;
  HEAP32[1313304] = 0;
  HEAP32[1313303] = r10;
  r10 = r11 + 28 | 0;
  HEAP32[r10 >> 2] = 7;
  L2038 : do {
    if ((r11 + 32 | 0) >>> 0 < r7 >>> 0) {
      r2 = r10;
      while (1) {
        r1 = r2 + 4 | 0;
        HEAP32[r1 >> 2] = 7;
        if ((r2 + 8 | 0) >>> 0 < r7 >>> 0) {
          r2 = r1;
        } else {
          break L2038;
        }
      }
    }
  } while (0);
  if ((r11 | 0) == (r6 | 0)) {
    return;
  }
  r7 = r11 - r4 | 0;
  r11 = r7 + (r6 + 4) | 0;
  HEAP32[r11 >> 2] = HEAP32[r11 >> 2] & -2;
  HEAP32[r5 + 1] = r7 | 1;
  HEAP32[r6 + r7 >> 2] = r7;
  r6 = r7 >>> 3;
  if (r7 >>> 0 < 256) {
    r11 = r6 << 1;
    r10 = (r11 << 2) + 5252800 | 0;
    r2 = HEAP32[1313190];
    r1 = 1 << r6;
    do {
      if ((r2 & r1 | 0) == 0) {
        HEAP32[1313190] = r2 | r1;
        r12 = r10;
        r13 = (r11 + 2 << 2) + 5252800 | 0;
      } else {
        r6 = (r11 + 2 << 2) + 5252800 | 0;
        r9 = HEAP32[r6 >> 2];
        if (r9 >>> 0 >= HEAP32[1313194] >>> 0) {
          r12 = r9;
          r13 = r6;
          break;
        }
        _abort();
      }
    } while (0);
    HEAP32[r13 >> 2] = r4;
    HEAP32[r12 + 12 >> 2] = r4;
    HEAP32[r5 + 2] = r12;
    HEAP32[r5 + 3] = r10;
    return;
  }
  r10 = r4;
  r12 = r7 >>> 8;
  do {
    if ((r12 | 0) == 0) {
      r14 = 0;
    } else {
      if (r7 >>> 0 > 16777215) {
        r14 = 31;
        break;
      }
      r13 = (r12 + 1048320 | 0) >>> 16 & 8;
      r11 = r12 << r13;
      r1 = (r11 + 520192 | 0) >>> 16 & 4;
      r2 = r11 << r1;
      r11 = (r2 + 245760 | 0) >>> 16 & 2;
      r6 = 14 - (r1 | r13 | r11) + (r2 << r11 >>> 15) | 0;
      r14 = r7 >>> ((r6 + 7 | 0) >>> 0) & 1 | r6 << 1;
    }
  } while (0);
  r12 = (r14 << 2) + 5253064 | 0;
  HEAP32[r5 + 7] = r14;
  HEAP32[r5 + 5] = 0;
  HEAP32[r5 + 4] = 0;
  r6 = HEAP32[1313191];
  r11 = 1 << r14;
  if ((r6 & r11 | 0) == 0) {
    HEAP32[1313191] = r6 | r11;
    HEAP32[r12 >> 2] = r10;
    HEAP32[r5 + 6] = r12;
    HEAP32[r5 + 3] = r4;
    HEAP32[r5 + 2] = r4;
    return;
  }
  if ((r14 | 0) == 31) {
    r15 = 0;
  } else {
    r15 = 25 - (r14 >>> 1) | 0;
  }
  r14 = r7 << r15;
  r15 = HEAP32[r12 >> 2];
  while (1) {
    if ((HEAP32[r15 + 4 >> 2] & -8 | 0) == (r7 | 0)) {
      break;
    }
    r16 = (r14 >>> 31 << 2) + r15 + 16 | 0;
    r12 = HEAP32[r16 >> 2];
    if ((r12 | 0) == 0) {
      r3 = 1637;
      break;
    } else {
      r14 = r14 << 1;
      r15 = r12;
    }
  }
  if (r3 == 1637) {
    if (r16 >>> 0 < HEAP32[1313194] >>> 0) {
      _abort();
    }
    HEAP32[r16 >> 2] = r10;
    HEAP32[r5 + 6] = r15;
    HEAP32[r5 + 3] = r4;
    HEAP32[r5 + 2] = r4;
    return;
  }
  r4 = r15 + 8 | 0;
  r16 = HEAP32[r4 >> 2];
  r3 = HEAP32[1313194];
  if (r15 >>> 0 < r3 >>> 0) {
    _abort();
  }
  if (r16 >>> 0 < r3 >>> 0) {
    _abort();
  }
  HEAP32[r16 + 12 >> 2] = r10;
  HEAP32[r4 >> 2] = r10;
  HEAP32[r5 + 2] = r16;
  HEAP32[r5 + 3] = r15;
  HEAP32[r5 + 6] = 0;
  return;
}
_add_segment["X"] = 1;
function __Znwj(r1) {
  var r2, r3, r4;
  r2 = 0;
  r3 = (r1 | 0) == 0 ? 1 : r1;
  while (1) {
    r4 = _malloc(r3);
    if ((r4 | 0) != 0) {
      r2 = 1661;
      break;
    }
    r1 = __ZSt15get_new_handlerv();
    if ((r1 | 0) == 0) {
      break;
    }
    FUNCTION_TABLE[r1]();
  }
  if (r2 == 1661) {
    return r4;
  }
  r4 = ___cxa_allocate_exception(4);
  __ZNSt9bad_allocC1Ev(r4);
  ___cxa_throw(r4, 5253512, 4);
}
function __Znaj(r1) {
  return __Znwj(r1);
}





// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    add: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.add(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    subtract: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.subtract(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    multiply: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.multiply(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    divide: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.div(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, z, null);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    modulo: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.modulo(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, null, z);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);


  var ret;

  ret = Module['_main'](argc, argv, 0);


  return ret;
}




function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }

  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

initRuntime();

var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

if (shouldRunNow) {
  var ret = run();
}

// {{POST_RUN_ADDITIONS}}






  // {{MODULE_ADDITIONS}}


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["__Z10writeblockiPKhi","__ZNK10LZ_encoder9price_repEiRK5Statei","___cxx_global_var_init","__ZN11Len_encoder13update_pricesEi","__ZN12_GLOBAL__N_110format_numEx","__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib","__ZN10LZ_decoder13decode_memberEv","__ZNK13Range_decoder12code_is_zeroEv","__Znwj","__ZNK10LZ_decoder13get_prev_byteEv","__ZN15Literal_encoder14encode_matchedER13Range_encoderhhh","__ZN10LZ_encoder5Trial6updateEiii","__ZN10LZ_encoderD2Ev","_tmalloc_large","__ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i","__ZN5StateC1Ev","__ZNK10LZ_encoder9price_disEii","__ZN5ErrorC1EPKc","__ZNKSt9bad_alloc4whatEv","__ZNK10LZ_encoder10price_pairEiii","__ZdlPv","__ZNK10LZ_encoder15member_positionEv","__ZN5CRC32C1Ev","__ZN13Range_decoderC2Ei","__ZN11Len_decoderC2Ev","__ZN12_GLOBAL__N_110decompressEib","__ZNK10LZ_encoder3crcEv","__ZN13Range_encoder8put_byteEh","__Z9real_bitsi","_internal_realloc","__ZN15Literal_decoder14decode_matchedER13Range_decoderhh","__ZNK11File_header14verify_versionEv","__Z9price_bitRK9Bit_modeli","__ZdaPv","__ZNK11Matchfinder15available_bytesEv","_release_unused_segments","__ZN15Literal_encoder6encodeER13Range_encoderhh","__ZN5State13set_short_repEv","__ZN13Range_decoder11decode_treeEP9Bit_modeli","__ZNK15Literal_encoder6lstateEh","__ZN11MatchfinderD1Ev","__ZN11Prob_prices4initEv","__ZNK5CRC326updateERjh","_sys_alloc","_free","__ZNK11Len_encoder5priceEii","__ZN15Literal_encoderC1Ev","__ZNSt9bad_allocC1Ev","__ZN12File_trailer11member_sizeEx","__ZN10LZ_decoderD1Ev","__ZN5State8set_charEv","__ZNK15Literal_decoder6lstateEi","__ZNK10__cxxabiv116__shim_type_info5noop2Ev","__ZN10LZ_decoder10flush_dataEv","__ZNK11Prob_pricesixEi","_add_segment","_main","__ZNK13Range_encoder15member_positionEv","_init_bins","__ZN11Matchfinder10read_blockEv","___dynamic_cast","__ZN11MatchfinderC2Eiii","__ZN15Literal_decoderC1Ev","__ZNK11File_header15dictionary_sizeEv","__Z21price_symbol_reversedPK9Bit_modelii","__ZNK5StateclEv","__ZNK11File_header7versionEv","__ZN10LZ_encoder17fill_align_pricesEv","__ZN12File_trailer9data_sizeEx","__ZN11Len_decoderC1Ev","_malloc","__ZNK9Dis_slots5tableEi","__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi","__ZSt15get_new_handlerv","__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib","__ZN12File_trailer8data_crcEj","__ZN13Range_decoder21reset_member_positionEv","__ZNK11Matchfinder15match_len_limitEv","__ZN11Matchfinder17longest_match_lenEPi","__ZN5ErrorC2EPKc","__ZNK15Literal_encoder13price_matchedEhhh","__ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi","__ZNK9Dis_slotsixEj","__ZN10LZ_encoder8mtf_repsEiPi","__Z13get_dis_statei","__ZNSt9bad_allocD2Ev","__ZN10LZ_encoder10full_flushERK5State","__ZN13Range_encoder6encodeEii","__ZN9Dis_slots4initEv","__ZNK12File_trailer11member_sizeEv","__ZNK10LZ_decoder13data_positionEv","__ZN13Range_decoderC1Ei","__ZN10LZ_encoder5TrialC1Ev","__Z13price_matchedPK9Bit_modelii","__ZNK10LZ_decoder8get_byteEi","__ZN12_GLOBAL__N_112show_versionEv","__Z9readblockiPhi","__ZNK5State7is_charEv","__ZN13Range_decoder8finishedEv","__GLOBAL__I_a","__ZN11Len_encoderC2Ei","__ZN9Bit_modelC1Ev","__ZN15Literal_encoderC2Ev","__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib","__ZN11Matchfinder8move_posEv","__ZN15Literal_decoderC2Ev","__ZN12_GLOBAL__N_19check_ttyEiNS_4ModeE","__ZN10LZ_encoder20read_match_distancesEv","__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi","_sys_trim","__ZN11File_header9set_magicEv","__ZNK12File_trailer8data_crcEv","__Znaj","__ZN10LZ_encoder5TrialC2Ev","__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib","_tmalloc_small","_mmap_resize","__ZNK10__cxxabiv117__class_type_info29process_static_type_below_dstEPNS_19__dynamic_cast_infoEPKvi","__ZN12_GLOBAL__N_19show_helpEv","__ZN10LZ_decoder10copy_blockEii","__ZN10LZ_encoder20fill_distance_pricesEv","__ZN10__cxxabiv117__class_type_infoD1Ev","__ZN10LZ_encoder13encode_memberEx","__ZN10LZ_encoder18sequence_optimizerEPKiRK5State","__ZNK13Range_decoder15member_positionEv","_prepend_alloc","__ZNK5CRC32ixEh","__Z12price_symbolPK9Bit_modelii","__ZN5State7set_repEv","__ZN13Range_decoder9normalizeEv","__ZN10LZ_encoder11encode_pairEjii","__ZN10LZ_decoderC1ERK11File_headerR13Range_decoderi","__ZN13Range_encoder11encode_treeEP9Bit_modelii","__Z6price0RK9Bit_model","__Z10show_errorPKcib","__Z6price1RK9Bit_model","__ZN13Range_encoder5flushEv","__ZN11Matchfinder7dec_posEi","__ZNK11Matchfinder8finishedEv","__ZNK11MatchfinderixEi","__ZNK12File_trailer9data_sizeEv","__ZN13Range_encoder14encode_matchedEP9Bit_modelii","__ZN10LZ_decoder8put_byteEh","__ZNK11Matchfinder15dictionary_sizeEv","__ZN11File_header15dictionary_sizeEi","__ZNK11Matchfinder18ptr_to_current_posEv","__ZN10LZ_encoder8backwardEi","__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv","__ZN10__cxxabiv120__si_class_type_infoD1Ev","__ZN13Range_encoderD1Ev","__ZN10LZ_encoderC2ER11MatchfinderRK11File_headeri","__ZNK11Matchfinder13data_positionEv","__Z2ppPKc","__ZNK10LZ_encoder14price_rep_len1ERK5Statei","__ZN13Range_encoder10encode_bitER9Bit_modeli","__ZN10LZ_encoderD1Ev","__ZN9Bit_modelC2Ev","__ZNSt9bad_allocD1Ev","__ZN13Range_decoder4loadEv","__ZNSt9bad_allocC2Ev","__ZN11Matchfinder5resetEv","__ZN11Len_encoderC1Ei","__ZNK10LZ_decoder3crcEv","__ZNK10LZ_decoder14verify_trailerEv","__ZNSt9bad_allocD0Ev","__ZN5State9set_matchEv","__ZN10LZ_decoderD2Ev","__ZN12File_trailer4sizeEi","__Z14internal_errorPKc","__ZN5StateC2Ev","__ZN10__cxxabiv117__class_type_infoD0Ev","__ZN5CRC32C2Ev","__ZN13Range_decoder20decode_tree_reversedEP9Bit_modeli","__ZN13Range_decoderD1Ev","__ZNK11Matchfinder14true_match_lenEiii","__ZN12_GLOBAL__N_18compressExxRKNS_12Lzma_optionsEiPK4stat","__ZN13Range_decoder10read_blockEv","_init_top","__ZN10LZ_decoderC2ERK11File_headerR13Range_decoderi","__ZN13Range_decoder6decodeEi","__ZN13Range_encoderC2Ei","__ZN13Range_encoder20encode_tree_reversedEP9Bit_modelii","__ZNK15Literal_encoder12price_symbolEhh","__ZN13Range_encoder10flush_dataEv","__ZN11Len_decoder6decodeER13Range_decoderi","_init_mparams","__ZN13Range_decoderD2Ev","_realloc","__ZN13Range_encoderC1Ei","_segment_holding","__ZN15Literal_decoder6decodeER13Range_decoderh","__ZNK10__cxxabiv116__shim_type_info5noop1Ev","__ZN10__cxxabiv18is_equalEPKSt9type_infoS2_b","__ZNK11File_header12verify_magicEv","__ZN13Range_encoderD2Ev","__ZN13Range_decoder8get_byteEv","__ZN11MatchfinderD2Ev","__ZN11Len_encoder6encodeER13Range_encoderii","__ZN10LZ_encoder8move_posEib","__ZN13Range_decoder10decode_bitER9Bit_model","__ZN10__cxxabiv120__si_class_type_infoD0Ev","__ZN11MatchfinderC1Eiii","__ZN13Range_encoder9shift_lowEv","__ZN13Range_decoder14decode_matchedEP9Bit_modeli","__ZN10LZ_encoderC1ER11MatchfinderRK11File_headeri","__ZNK5CRC326updateERjPKhi"]




    return new Uint8Array(returnValue);
  },

  compress: function(data) {
    return this.run(data);
  },

  decompress: function(data) {
    return this.run(data, true);
  }
};

