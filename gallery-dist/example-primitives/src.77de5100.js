// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"../../../node_modules/regl/dist/regl.js":[function(require,module,exports) {
var define;
var global = arguments[3];
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.createREGL = factory());
}(this, (function () { 'use strict';

var isTypedArray = function (x) {
  return (
    x instanceof Uint8Array ||
    x instanceof Uint16Array ||
    x instanceof Uint32Array ||
    x instanceof Int8Array ||
    x instanceof Int16Array ||
    x instanceof Int32Array ||
    x instanceof Float32Array ||
    x instanceof Float64Array ||
    x instanceof Uint8ClampedArray
  )
};

var extend = function (base, opts) {
  var keys = Object.keys(opts);
  for (var i = 0; i < keys.length; ++i) {
    base[keys[i]] = opts[keys[i]];
  }
  return base
};

// Error checking and parameter validation.
//
// Statements for the form `check.someProcedure(...)` get removed by
// a browserify transform for optimized/minified bundles.
//
/* globals atob */
var endl = '\n';

// only used for extracting shader names.  if atob not present, then errors
// will be slightly crappier
function decodeB64 (str) {
  if (typeof atob !== 'undefined') {
    return atob(str)
  }
  return 'base64:' + str
}

function raise (message) {
  var error = new Error('(regl) ' + message);
  console.error(error);
  throw error
}

function check (pred, message) {
  if (!pred) {
    raise(message);
  }
}

function encolon (message) {
  if (message) {
    return ': ' + message
  }
  return ''
}

function checkParameter (param, possibilities, message) {
  if (!(param in possibilities)) {
    raise('unknown parameter (' + param + ')' + encolon(message) +
          '. possible values: ' + Object.keys(possibilities).join());
  }
}

function checkIsTypedArray (data, message) {
  if (!isTypedArray(data)) {
    raise(
      'invalid parameter type' + encolon(message) +
      '. must be a typed array');
  }
}

function checkTypeOf (value, type, message) {
  if (typeof value !== type) {
    raise(
      'invalid parameter type' + encolon(message) +
      '. expected ' + type + ', got ' + (typeof value));
  }
}

function checkNonNegativeInt (value, message) {
  if (!((value >= 0) &&
        ((value | 0) === value))) {
    raise('invalid parameter type, (' + value + ')' + encolon(message) +
          '. must be a nonnegative integer');
  }
}

function checkOneOf (value, list, message) {
  if (list.indexOf(value) < 0) {
    raise('invalid value' + encolon(message) + '. must be one of: ' + list);
  }
}

var constructorKeys = [
  'gl',
  'canvas',
  'container',
  'attributes',
  'pixelRatio',
  'extensions',
  'optionalExtensions',
  'profile',
  'onDone'
];

function checkConstructor (obj) {
  Object.keys(obj).forEach(function (key) {
    if (constructorKeys.indexOf(key) < 0) {
      raise('invalid regl constructor argument "' + key + '". must be one of ' + constructorKeys);
    }
  });
}

function leftPad (str, n) {
  str = str + '';
  while (str.length < n) {
    str = ' ' + str;
  }
  return str
}

function ShaderFile () {
  this.name = 'unknown';
  this.lines = [];
  this.index = {};
  this.hasErrors = false;
}

function ShaderLine (number, line) {
  this.number = number;
  this.line = line;
  this.errors = [];
}

function ShaderError (fileNumber, lineNumber, message) {
  this.file = fileNumber;
  this.line = lineNumber;
  this.message = message;
}

function guessCommand () {
  var error = new Error();
  var stack = (error.stack || error).toString();
  var pat = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(stack);
  if (pat) {
    return pat[1]
  }
  var pat2 = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(stack);
  if (pat2) {
    return pat2[1]
  }
  return 'unknown'
}

function guessCallSite () {
  var error = new Error();
  var stack = (error.stack || error).toString();
  var pat = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(stack);
  if (pat) {
    return pat[1]
  }
  var pat2 = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(stack);
  if (pat2) {
    return pat2[1]
  }
  return 'unknown'
}

function parseSource (source, command) {
  var lines = source.split('\n');
  var lineNumber = 1;
  var fileNumber = 0;
  var files = {
    unknown: new ShaderFile(),
    0: new ShaderFile()
  };
  files.unknown.name = files[0].name = command || guessCommand();
  files.unknown.lines.push(new ShaderLine(0, ''));
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    var parts = /^\s*\#\s*(\w+)\s+(.+)\s*$/.exec(line);
    if (parts) {
      switch (parts[1]) {
        case 'line':
          var lineNumberInfo = /(\d+)(\s+\d+)?/.exec(parts[2]);
          if (lineNumberInfo) {
            lineNumber = lineNumberInfo[1] | 0;
            if (lineNumberInfo[2]) {
              fileNumber = lineNumberInfo[2] | 0;
              if (!(fileNumber in files)) {
                files[fileNumber] = new ShaderFile();
              }
            }
          }
          break
        case 'define':
          var nameInfo = /SHADER_NAME(_B64)?\s+(.*)$/.exec(parts[2]);
          if (nameInfo) {
            files[fileNumber].name = (nameInfo[1]
                ? decodeB64(nameInfo[2])
                : nameInfo[2]);
          }
          break
      }
    }
    files[fileNumber].lines.push(new ShaderLine(lineNumber++, line));
  }
  Object.keys(files).forEach(function (fileNumber) {
    var file = files[fileNumber];
    file.lines.forEach(function (line) {
      file.index[line.number] = line;
    });
  });
  return files
}

function parseErrorLog (errLog) {
  var result = [];
  errLog.split('\n').forEach(function (errMsg) {
    if (errMsg.length < 5) {
      return
    }
    var parts = /^ERROR\:\s+(\d+)\:(\d+)\:\s*(.*)$/.exec(errMsg);
    if (parts) {
      result.push(new ShaderError(
        parts[1] | 0,
        parts[2] | 0,
        parts[3].trim()));
    } else if (errMsg.length > 0) {
      result.push(new ShaderError('unknown', 0, errMsg));
    }
  });
  return result
}

function annotateFiles (files, errors) {
  errors.forEach(function (error) {
    var file = files[error.file];
    if (file) {
      var line = file.index[error.line];
      if (line) {
        line.errors.push(error);
        file.hasErrors = true;
        return
      }
    }
    files.unknown.hasErrors = true;
    files.unknown.lines[0].errors.push(error);
  });
}

function checkShaderError (gl, shader, source, type, command) {
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var errLog = gl.getShaderInfoLog(shader);
    var typeName = type === gl.FRAGMENT_SHADER ? 'fragment' : 'vertex';
    checkCommandType(source, 'string', typeName + ' shader source must be a string', command);
    var files = parseSource(source, command);
    var errors = parseErrorLog(errLog);
    annotateFiles(files, errors);

    Object.keys(files).forEach(function (fileNumber) {
      var file = files[fileNumber];
      if (!file.hasErrors) {
        return
      }

      var strings = [''];
      var styles = [''];

      function push (str, style) {
        strings.push(str);
        styles.push(style || '');
      }

      push('file number ' + fileNumber + ': ' + file.name + '\n', 'color:red;text-decoration:underline;font-weight:bold');

      file.lines.forEach(function (line) {
        if (line.errors.length > 0) {
          push(leftPad(line.number, 4) + '|  ', 'background-color:yellow; font-weight:bold');
          push(line.line + endl, 'color:red; background-color:yellow; font-weight:bold');

          // try to guess token
          var offset = 0;
          line.errors.forEach(function (error) {
            var message = error.message;
            var token = /^\s*\'(.*)\'\s*\:\s*(.*)$/.exec(message);
            if (token) {
              var tokenPat = token[1];
              message = token[2];
              switch (tokenPat) {
                case 'assign':
                  tokenPat = '=';
                  break
              }
              offset = Math.max(line.line.indexOf(tokenPat, offset), 0);
            } else {
              offset = 0;
            }

            push(leftPad('| ', 6));
            push(leftPad('^^^', offset + 3) + endl, 'font-weight:bold');
            push(leftPad('| ', 6));
            push(message + endl, 'font-weight:bold');
          });
          push(leftPad('| ', 6) + endl);
        } else {
          push(leftPad(line.number, 4) + '|  ');
          push(line.line + endl, 'color:red');
        }
      });
      if (typeof document !== 'undefined' && !window.chrome) {
        styles[0] = strings.join('%c');
        console.log.apply(console, styles);
      } else {
        console.log(strings.join(''));
      }
    });

    check.raise('Error compiling ' + typeName + ' shader, ' + files[0].name);
  }
}

function checkLinkError (gl, program, fragShader, vertShader, command) {
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var errLog = gl.getProgramInfoLog(program);
    var fragParse = parseSource(fragShader, command);
    var vertParse = parseSource(vertShader, command);

    var header = 'Error linking program with vertex shader, "' +
      vertParse[0].name + '", and fragment shader "' + fragParse[0].name + '"';

    if (typeof document !== 'undefined') {
      console.log('%c' + header + endl + '%c' + errLog,
        'color:red;text-decoration:underline;font-weight:bold',
        'color:red');
    } else {
      console.log(header + endl + errLog);
    }
    check.raise(header);
  }
}

function saveCommandRef (object) {
  object._commandRef = guessCommand();
}

function saveDrawCommandInfo (opts, uniforms, attributes, stringStore) {
  saveCommandRef(opts);

  function id (str) {
    if (str) {
      return stringStore.id(str)
    }
    return 0
  }
  opts._fragId = id(opts.static.frag);
  opts._vertId = id(opts.static.vert);

  function addProps (dict, set) {
    Object.keys(set).forEach(function (u) {
      dict[stringStore.id(u)] = true;
    });
  }

  var uniformSet = opts._uniformSet = {};
  addProps(uniformSet, uniforms.static);
  addProps(uniformSet, uniforms.dynamic);

  var attributeSet = opts._attributeSet = {};
  addProps(attributeSet, attributes.static);
  addProps(attributeSet, attributes.dynamic);

  opts._hasCount = (
    'count' in opts.static ||
    'count' in opts.dynamic ||
    'elements' in opts.static ||
    'elements' in opts.dynamic);
}

function commandRaise (message, command) {
  var callSite = guessCallSite();
  raise(message +
    ' in command ' + (command || guessCommand()) +
    (callSite === 'unknown' ? '' : ' called from ' + callSite));
}

function checkCommand (pred, message, command) {
  if (!pred) {
    commandRaise(message, command || guessCommand());
  }
}

function checkParameterCommand (param, possibilities, message, command) {
  if (!(param in possibilities)) {
    commandRaise(
      'unknown parameter (' + param + ')' + encolon(message) +
      '. possible values: ' + Object.keys(possibilities).join(),
      command || guessCommand());
  }
}

function checkCommandType (value, type, message, command) {
  if (typeof value !== type) {
    commandRaise(
      'invalid parameter type' + encolon(message) +
      '. expected ' + type + ', got ' + (typeof value),
      command || guessCommand());
  }
}

function checkOptional (block) {
  block();
}

function checkFramebufferFormat (attachment, texFormats, rbFormats) {
  if (attachment.texture) {
    checkOneOf(
      attachment.texture._texture.internalformat,
      texFormats,
      'unsupported texture format for attachment');
  } else {
    checkOneOf(
      attachment.renderbuffer._renderbuffer.format,
      rbFormats,
      'unsupported renderbuffer format for attachment');
  }
}

var GL_CLAMP_TO_EDGE = 0x812F;

var GL_NEAREST = 0x2600;
var GL_NEAREST_MIPMAP_NEAREST = 0x2700;
var GL_LINEAR_MIPMAP_NEAREST = 0x2701;
var GL_NEAREST_MIPMAP_LINEAR = 0x2702;
var GL_LINEAR_MIPMAP_LINEAR = 0x2703;

var GL_BYTE = 5120;
var GL_UNSIGNED_BYTE = 5121;
var GL_SHORT = 5122;
var GL_UNSIGNED_SHORT = 5123;
var GL_INT = 5124;
var GL_UNSIGNED_INT = 5125;
var GL_FLOAT = 5126;

var GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;
var GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034;
var GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
var GL_UNSIGNED_INT_24_8_WEBGL = 0x84FA;

var GL_HALF_FLOAT_OES = 0x8D61;

var TYPE_SIZE = {};

TYPE_SIZE[GL_BYTE] =
TYPE_SIZE[GL_UNSIGNED_BYTE] = 1;

TYPE_SIZE[GL_SHORT] =
TYPE_SIZE[GL_UNSIGNED_SHORT] =
TYPE_SIZE[GL_HALF_FLOAT_OES] =
TYPE_SIZE[GL_UNSIGNED_SHORT_5_6_5] =
TYPE_SIZE[GL_UNSIGNED_SHORT_4_4_4_4] =
TYPE_SIZE[GL_UNSIGNED_SHORT_5_5_5_1] = 2;

TYPE_SIZE[GL_INT] =
TYPE_SIZE[GL_UNSIGNED_INT] =
TYPE_SIZE[GL_FLOAT] =
TYPE_SIZE[GL_UNSIGNED_INT_24_8_WEBGL] = 4;

function pixelSize (type, channels) {
  if (type === GL_UNSIGNED_SHORT_5_5_5_1 ||
      type === GL_UNSIGNED_SHORT_4_4_4_4 ||
      type === GL_UNSIGNED_SHORT_5_6_5) {
    return 2
  } else if (type === GL_UNSIGNED_INT_24_8_WEBGL) {
    return 4
  } else {
    return TYPE_SIZE[type] * channels
  }
}

function isPow2 (v) {
  return !(v & (v - 1)) && (!!v)
}

function checkTexture2D (info, mipData, limits) {
  var i;
  var w = mipData.width;
  var h = mipData.height;
  var c = mipData.channels;

  // Check texture shape
  check(w > 0 && w <= limits.maxTextureSize &&
        h > 0 && h <= limits.maxTextureSize,
        'invalid texture shape');

  // check wrap mode
  if (info.wrapS !== GL_CLAMP_TO_EDGE || info.wrapT !== GL_CLAMP_TO_EDGE) {
    check(isPow2(w) && isPow2(h),
      'incompatible wrap mode for texture, both width and height must be power of 2');
  }

  if (mipData.mipmask === 1) {
    if (w !== 1 && h !== 1) {
      check(
        info.minFilter !== GL_NEAREST_MIPMAP_NEAREST &&
        info.minFilter !== GL_NEAREST_MIPMAP_LINEAR &&
        info.minFilter !== GL_LINEAR_MIPMAP_NEAREST &&
        info.minFilter !== GL_LINEAR_MIPMAP_LINEAR,
        'min filter requires mipmap');
    }
  } else {
    // texture must be power of 2
    check(isPow2(w) && isPow2(h),
      'texture must be a square power of 2 to support mipmapping');
    check(mipData.mipmask === (w << 1) - 1,
      'missing or incomplete mipmap data');
  }

  if (mipData.type === GL_FLOAT) {
    if (limits.extensions.indexOf('oes_texture_float_linear') < 0) {
      check(info.minFilter === GL_NEAREST && info.magFilter === GL_NEAREST,
        'filter not supported, must enable oes_texture_float_linear');
    }
    check(!info.genMipmaps,
      'mipmap generation not supported with float textures');
  }

  // check image complete
  var mipimages = mipData.images;
  for (i = 0; i < 16; ++i) {
    if (mipimages[i]) {
      var mw = w >> i;
      var mh = h >> i;
      check(mipData.mipmask & (1 << i), 'missing mipmap data');

      var img = mipimages[i];

      check(
        img.width === mw &&
        img.height === mh,
        'invalid shape for mip images');

      check(
        img.format === mipData.format &&
        img.internalformat === mipData.internalformat &&
        img.type === mipData.type,
        'incompatible type for mip image');

      if (img.compressed) {
        // TODO: check size for compressed images
      } else if (img.data) {
        // check(img.data.byteLength === mw * mh *
        // Math.max(pixelSize(img.type, c), img.unpackAlignment),
        var rowSize = Math.ceil(pixelSize(img.type, c) * mw / img.unpackAlignment) * img.unpackAlignment;
        check(img.data.byteLength === rowSize * mh,
          'invalid data for image, buffer size is inconsistent with image format');
      } else if (img.element) {
        // TODO: check element can be loaded
      } else if (img.copy) {
        // TODO: check compatible format and type
      }
    } else if (!info.genMipmaps) {
      check((mipData.mipmask & (1 << i)) === 0, 'extra mipmap data');
    }
  }

  if (mipData.compressed) {
    check(!info.genMipmaps,
      'mipmap generation for compressed images not supported');
  }
}

function checkTextureCube (texture, info, faces, limits) {
  var w = texture.width;
  var h = texture.height;
  var c = texture.channels;

  // Check texture shape
  check(
    w > 0 && w <= limits.maxTextureSize && h > 0 && h <= limits.maxTextureSize,
    'invalid texture shape');
  check(
    w === h,
    'cube map must be square');
  check(
    info.wrapS === GL_CLAMP_TO_EDGE && info.wrapT === GL_CLAMP_TO_EDGE,
    'wrap mode not supported by cube map');

  for (var i = 0; i < faces.length; ++i) {
    var face = faces[i];
    check(
      face.width === w && face.height === h,
      'inconsistent cube map face shape');

    if (info.genMipmaps) {
      check(!face.compressed,
        'can not generate mipmap for compressed textures');
      check(face.mipmask === 1,
        'can not specify mipmaps and generate mipmaps');
    } else {
      // TODO: check mip and filter mode
    }

    var mipmaps = face.images;
    for (var j = 0; j < 16; ++j) {
      var img = mipmaps[j];
      if (img) {
        var mw = w >> j;
        var mh = h >> j;
        check(face.mipmask & (1 << j), 'missing mipmap data');
        check(
          img.width === mw &&
          img.height === mh,
          'invalid shape for mip images');
        check(
          img.format === texture.format &&
          img.internalformat === texture.internalformat &&
          img.type === texture.type,
          'incompatible type for mip image');

        if (img.compressed) {
          // TODO: check size for compressed images
        } else if (img.data) {
          check(img.data.byteLength === mw * mh *
            Math.max(pixelSize(img.type, c), img.unpackAlignment),
            'invalid data for image, buffer size is inconsistent with image format');
        } else if (img.element) {
          // TODO: check element can be loaded
        } else if (img.copy) {
          // TODO: check compatible format and type
        }
      }
    }
  }
}

var check$1 = extend(check, {
  optional: checkOptional,
  raise: raise,
  commandRaise: commandRaise,
  command: checkCommand,
  parameter: checkParameter,
  commandParameter: checkParameterCommand,
  constructor: checkConstructor,
  type: checkTypeOf,
  commandType: checkCommandType,
  isTypedArray: checkIsTypedArray,
  nni: checkNonNegativeInt,
  oneOf: checkOneOf,
  shaderError: checkShaderError,
  linkError: checkLinkError,
  callSite: guessCallSite,
  saveCommandRef: saveCommandRef,
  saveDrawInfo: saveDrawCommandInfo,
  framebufferFormat: checkFramebufferFormat,
  guessCommand: guessCommand,
  texture2D: checkTexture2D,
  textureCube: checkTextureCube
});

var VARIABLE_COUNTER = 0;

var DYN_FUNC = 0;

function DynamicVariable (type, data) {
  this.id = (VARIABLE_COUNTER++);
  this.type = type;
  this.data = data;
}

function escapeStr (str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function splitParts (str) {
  if (str.length === 0) {
    return []
  }

  var firstChar = str.charAt(0);
  var lastChar = str.charAt(str.length - 1);

  if (str.length > 1 &&
      firstChar === lastChar &&
      (firstChar === '"' || firstChar === "'")) {
    return ['"' + escapeStr(str.substr(1, str.length - 2)) + '"']
  }

  var parts = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(str);
  if (parts) {
    return (
      splitParts(str.substr(0, parts.index))
      .concat(splitParts(parts[1]))
      .concat(splitParts(str.substr(parts.index + parts[0].length)))
    )
  }

  var subparts = str.split('.');
  if (subparts.length === 1) {
    return ['"' + escapeStr(str) + '"']
  }

  var result = [];
  for (var i = 0; i < subparts.length; ++i) {
    result = result.concat(splitParts(subparts[i]));
  }
  return result
}

function toAccessorString (str) {
  return '[' + splitParts(str).join('][') + ']'
}

function defineDynamic (type, data) {
  return new DynamicVariable(type, toAccessorString(data + ''))
}

function isDynamic (x) {
  return (typeof x === 'function' && !x._reglType) ||
         x instanceof DynamicVariable
}

function unbox (x, path) {
  if (typeof x === 'function') {
    return new DynamicVariable(DYN_FUNC, x)
  }
  return x
}

var dynamic = {
  DynamicVariable: DynamicVariable,
  define: defineDynamic,
  isDynamic: isDynamic,
  unbox: unbox,
  accessor: toAccessorString
};

/* globals requestAnimationFrame, cancelAnimationFrame */
var raf = {
  next: typeof requestAnimationFrame === 'function'
    ? function (cb) { return requestAnimationFrame(cb) }
    : function (cb) { return setTimeout(cb, 16) },
  cancel: typeof cancelAnimationFrame === 'function'
    ? function (raf) { return cancelAnimationFrame(raf) }
    : clearTimeout
};

/* globals performance */
var clock = (typeof performance !== 'undefined' && performance.now)
  ? function () { return performance.now() }
  : function () { return +(new Date()) };

function createStringStore () {
  var stringIds = {'': 0};
  var stringValues = [''];
  return {
    id: function (str) {
      var result = stringIds[str];
      if (result) {
        return result
      }
      result = stringIds[str] = stringValues.length;
      stringValues.push(str);
      return result
    },

    str: function (id) {
      return stringValues[id]
    }
  }
}

// Context and canvas creation helper functions
function createCanvas (element, onDone, pixelRatio) {
  var canvas = document.createElement('canvas');
  extend(canvas.style, {
    border: 0,
    margin: 0,
    padding: 0,
    top: 0,
    left: 0
  });
  element.appendChild(canvas);

  if (element === document.body) {
    canvas.style.position = 'absolute';
    extend(element.style, {
      margin: 0,
      padding: 0
    });
  }

  function resize () {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (element !== document.body) {
      var bounds = element.getBoundingClientRect();
      w = bounds.right - bounds.left;
      h = bounds.bottom - bounds.top;
    }
    canvas.width = pixelRatio * w;
    canvas.height = pixelRatio * h;
    extend(canvas.style, {
      width: w + 'px',
      height: h + 'px'
    });
  }

  window.addEventListener('resize', resize, false);

  function onDestroy () {
    window.removeEventListener('resize', resize);
    element.removeChild(canvas);
  }

  resize();

  return {
    canvas: canvas,
    onDestroy: onDestroy
  }
}

function createContext (canvas, contextAttributes) {
  function get (name) {
    try {
      return canvas.getContext(name, contextAttributes)
    } catch (e) {
      return null
    }
  }
  return (
    get('webgl') ||
    get('experimental-webgl') ||
    get('webgl-experimental')
  )
}

function isHTMLElement (obj) {
  return (
    typeof obj.nodeName === 'string' &&
    typeof obj.appendChild === 'function' &&
    typeof obj.getBoundingClientRect === 'function'
  )
}

function isWebGLContext (obj) {
  return (
    typeof obj.drawArrays === 'function' ||
    typeof obj.drawElements === 'function'
  )
}

function parseExtensions (input) {
  if (typeof input === 'string') {
    return input.split()
  }
  check$1(Array.isArray(input), 'invalid extension array');
  return input
}

function getElement (desc) {
  if (typeof desc === 'string') {
    check$1(typeof document !== 'undefined', 'not supported outside of DOM');
    return document.querySelector(desc)
  }
  return desc
}

function parseArgs (args_) {
  var args = args_ || {};
  var element, container, canvas, gl;
  var contextAttributes = {};
  var extensions = [];
  var optionalExtensions = [];
  var pixelRatio = (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
  var profile = false;
  var onDone = function (err) {
    if (err) {
      check$1.raise(err);
    }
  };
  var onDestroy = function () {};
  if (typeof args === 'string') {
    check$1(
      typeof document !== 'undefined',
      'selector queries only supported in DOM enviroments');
    element = document.querySelector(args);
    check$1(element, 'invalid query string for element');
  } else if (typeof args === 'object') {
    if (isHTMLElement(args)) {
      element = args;
    } else if (isWebGLContext(args)) {
      gl = args;
      canvas = gl.canvas;
    } else {
      check$1.constructor(args);
      if ('gl' in args) {
        gl = args.gl;
      } else if ('canvas' in args) {
        canvas = getElement(args.canvas);
      } else if ('container' in args) {
        container = getElement(args.container);
      }
      if ('attributes' in args) {
        contextAttributes = args.attributes;
        check$1.type(contextAttributes, 'object', 'invalid context attributes');
      }
      if ('extensions' in args) {
        extensions = parseExtensions(args.extensions);
      }
      if ('optionalExtensions' in args) {
        optionalExtensions = parseExtensions(args.optionalExtensions);
      }
      if ('onDone' in args) {
        check$1.type(
          args.onDone, 'function',
          'invalid or missing onDone callback');
        onDone = args.onDone;
      }
      if ('profile' in args) {
        profile = !!args.profile;
      }
      if ('pixelRatio' in args) {
        pixelRatio = +args.pixelRatio;
        check$1(pixelRatio > 0, 'invalid pixel ratio');
      }
    }
  } else {
    check$1.raise('invalid arguments to regl');
  }

  if (element) {
    if (element.nodeName.toLowerCase() === 'canvas') {
      canvas = element;
    } else {
      container = element;
    }
  }

  if (!gl) {
    if (!canvas) {
      check$1(
        typeof document !== 'undefined',
        'must manually specify webgl context outside of DOM environments');
      var result = createCanvas(container || document.body, onDone, pixelRatio);
      if (!result) {
        return null
      }
      canvas = result.canvas;
      onDestroy = result.onDestroy;
    }
    gl = createContext(canvas, contextAttributes);
  }

  if (!gl) {
    onDestroy();
    onDone('webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org');
    return null
  }

  return {
    gl: gl,
    canvas: canvas,
    container: container,
    extensions: extensions,
    optionalExtensions: optionalExtensions,
    pixelRatio: pixelRatio,
    profile: profile,
    onDone: onDone,
    onDestroy: onDestroy
  }
}

function createExtensionCache (gl, config) {
  var extensions = {};

  function tryLoadExtension (name_) {
    check$1.type(name_, 'string', 'extension name must be string');
    var name = name_.toLowerCase();
    var ext;
    try {
      ext = extensions[name] = gl.getExtension(name);
    } catch (e) {}
    return !!ext
  }

  for (var i = 0; i < config.extensions.length; ++i) {
    var name = config.extensions[i];
    if (!tryLoadExtension(name)) {
      config.onDestroy();
      config.onDone('"' + name + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser');
      return null
    }
  }

  config.optionalExtensions.forEach(tryLoadExtension);

  return {
    extensions: extensions,
    restore: function () {
      Object.keys(extensions).forEach(function (name) {
        if (extensions[name] && !tryLoadExtension(name)) {
          throw new Error('(regl): error restoring extension ' + name)
        }
      });
    }
  }
}

function loop (n, f) {
  var result = Array(n);
  for (var i = 0; i < n; ++i) {
    result[i] = f(i);
  }
  return result
}

var GL_BYTE$1 = 5120;
var GL_UNSIGNED_BYTE$2 = 5121;
var GL_SHORT$1 = 5122;
var GL_UNSIGNED_SHORT$1 = 5123;
var GL_INT$1 = 5124;
var GL_UNSIGNED_INT$1 = 5125;
var GL_FLOAT$2 = 5126;

function nextPow16 (v) {
  for (var i = 16; i <= (1 << 28); i *= 16) {
    if (v <= i) {
      return i
    }
  }
  return 0
}

function log2 (v) {
  var r, shift;
  r = (v > 0xFFFF) << 4;
  v >>>= r;
  shift = (v > 0xFF) << 3;
  v >>>= shift; r |= shift;
  shift = (v > 0xF) << 2;
  v >>>= shift; r |= shift;
  shift = (v > 0x3) << 1;
  v >>>= shift; r |= shift;
  return r | (v >> 1)
}

function createPool () {
  var bufferPool = loop(8, function () {
    return []
  });

  function alloc (n) {
    var sz = nextPow16(n);
    var bin = bufferPool[log2(sz) >> 2];
    if (bin.length > 0) {
      return bin.pop()
    }
    return new ArrayBuffer(sz)
  }

  function free (buf) {
    bufferPool[log2(buf.byteLength) >> 2].push(buf);
  }

  function allocType (type, n) {
    var result = null;
    switch (type) {
      case GL_BYTE$1:
        result = new Int8Array(alloc(n), 0, n);
        break
      case GL_UNSIGNED_BYTE$2:
        result = new Uint8Array(alloc(n), 0, n);
        break
      case GL_SHORT$1:
        result = new Int16Array(alloc(2 * n), 0, n);
        break
      case GL_UNSIGNED_SHORT$1:
        result = new Uint16Array(alloc(2 * n), 0, n);
        break
      case GL_INT$1:
        result = new Int32Array(alloc(4 * n), 0, n);
        break
      case GL_UNSIGNED_INT$1:
        result = new Uint32Array(alloc(4 * n), 0, n);
        break
      case GL_FLOAT$2:
        result = new Float32Array(alloc(4 * n), 0, n);
        break
      default:
        return null
    }
    if (result.length !== n) {
      return result.subarray(0, n)
    }
    return result
  }

  function freeType (array) {
    free(array.buffer);
  }

  return {
    alloc: alloc,
    free: free,
    allocType: allocType,
    freeType: freeType
  }
}

var pool = createPool();

// zero pool for initial zero data
pool.zero = createPool();

var GL_SUBPIXEL_BITS = 0x0D50;
var GL_RED_BITS = 0x0D52;
var GL_GREEN_BITS = 0x0D53;
var GL_BLUE_BITS = 0x0D54;
var GL_ALPHA_BITS = 0x0D55;
var GL_DEPTH_BITS = 0x0D56;
var GL_STENCIL_BITS = 0x0D57;

var GL_ALIASED_POINT_SIZE_RANGE = 0x846D;
var GL_ALIASED_LINE_WIDTH_RANGE = 0x846E;

var GL_MAX_TEXTURE_SIZE = 0x0D33;
var GL_MAX_VIEWPORT_DIMS = 0x0D3A;
var GL_MAX_VERTEX_ATTRIBS = 0x8869;
var GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
var GL_MAX_VARYING_VECTORS = 0x8DFC;
var GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
var GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
var GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872;
var GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
var GL_MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
var GL_MAX_RENDERBUFFER_SIZE = 0x84E8;

var GL_VENDOR = 0x1F00;
var GL_RENDERER = 0x1F01;
var GL_VERSION = 0x1F02;
var GL_SHADING_LANGUAGE_VERSION = 0x8B8C;

var GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

var GL_MAX_COLOR_ATTACHMENTS_WEBGL = 0x8CDF;
var GL_MAX_DRAW_BUFFERS_WEBGL = 0x8824;

var GL_TEXTURE_2D = 0x0DE1;
var GL_TEXTURE_CUBE_MAP = 0x8513;
var GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
var GL_TEXTURE0 = 0x84C0;
var GL_RGBA = 0x1908;
var GL_FLOAT$1 = 0x1406;
var GL_UNSIGNED_BYTE$1 = 0x1401;
var GL_FRAMEBUFFER = 0x8D40;
var GL_FRAMEBUFFER_COMPLETE = 0x8CD5;
var GL_COLOR_ATTACHMENT0 = 0x8CE0;
var GL_COLOR_BUFFER_BIT$1 = 0x4000;

var wrapLimits = function (gl, extensions) {
  var maxAnisotropic = 1;
  if (extensions.ext_texture_filter_anisotropic) {
    maxAnisotropic = gl.getParameter(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT);
  }

  var maxDrawbuffers = 1;
  var maxColorAttachments = 1;
  if (extensions.webgl_draw_buffers) {
    maxDrawbuffers = gl.getParameter(GL_MAX_DRAW_BUFFERS_WEBGL);
    maxColorAttachments = gl.getParameter(GL_MAX_COLOR_ATTACHMENTS_WEBGL);
  }

  // detect if reading float textures is available (Safari doesn't support)
  var readFloat = !!extensions.oes_texture_float;
  if (readFloat) {
    var readFloatTexture = gl.createTexture();
    gl.bindTexture(GL_TEXTURE_2D, readFloatTexture);
    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_FLOAT$1, null);

    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(GL_FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, readFloatTexture, 0);
    gl.bindTexture(GL_TEXTURE_2D, null);

    if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) readFloat = false;

    else {
      gl.viewport(0, 0, 1, 1);
      gl.clearColor(1.0, 0.0, 0.0, 1.0);
      gl.clear(GL_COLOR_BUFFER_BIT$1);
      var pixels = pool.allocType(GL_FLOAT$1, 4);
      gl.readPixels(0, 0, 1, 1, GL_RGBA, GL_FLOAT$1, pixels);

      if (gl.getError()) readFloat = false;
      else {
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(readFloatTexture);

        readFloat = pixels[0] === 1.0;
      }

      pool.freeType(pixels);
    }
  }

  // detect non power of two cube textures support (IE doesn't support)
  var isIE = typeof navigator !== 'undefined' && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent));

  var npotTextureCube = true;

  if (!isIE) {
    var cubeTexture = gl.createTexture();
    var data = pool.allocType(GL_UNSIGNED_BYTE$1, 36);
    gl.activeTexture(GL_TEXTURE0);
    gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeTexture);
    gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, 3, 3, 0, GL_RGBA, GL_UNSIGNED_BYTE$1, data);
    pool.freeType(data);
    gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
    gl.deleteTexture(cubeTexture);
    npotTextureCube = !gl.getError();
  }

  return {
    // drawing buffer bit depth
    colorBits: [
      gl.getParameter(GL_RED_BITS),
      gl.getParameter(GL_GREEN_BITS),
      gl.getParameter(GL_BLUE_BITS),
      gl.getParameter(GL_ALPHA_BITS)
    ],
    depthBits: gl.getParameter(GL_DEPTH_BITS),
    stencilBits: gl.getParameter(GL_STENCIL_BITS),
    subpixelBits: gl.getParameter(GL_SUBPIXEL_BITS),

    // supported extensions
    extensions: Object.keys(extensions).filter(function (ext) {
      return !!extensions[ext]
    }),

    // max aniso samples
    maxAnisotropic: maxAnisotropic,

    // max draw buffers
    maxDrawbuffers: maxDrawbuffers,
    maxColorAttachments: maxColorAttachments,

    // point and line size ranges
    pointSizeDims: gl.getParameter(GL_ALIASED_POINT_SIZE_RANGE),
    lineWidthDims: gl.getParameter(GL_ALIASED_LINE_WIDTH_RANGE),
    maxViewportDims: gl.getParameter(GL_MAX_VIEWPORT_DIMS),
    maxCombinedTextureUnits: gl.getParameter(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxCubeMapSize: gl.getParameter(GL_MAX_CUBE_MAP_TEXTURE_SIZE),
    maxRenderbufferSize: gl.getParameter(GL_MAX_RENDERBUFFER_SIZE),
    maxTextureUnits: gl.getParameter(GL_MAX_TEXTURE_IMAGE_UNITS),
    maxTextureSize: gl.getParameter(GL_MAX_TEXTURE_SIZE),
    maxAttributes: gl.getParameter(GL_MAX_VERTEX_ATTRIBS),
    maxVertexUniforms: gl.getParameter(GL_MAX_VERTEX_UNIFORM_VECTORS),
    maxVertexTextureUnits: gl.getParameter(GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS),
    maxVaryingVectors: gl.getParameter(GL_MAX_VARYING_VECTORS),
    maxFragmentUniforms: gl.getParameter(GL_MAX_FRAGMENT_UNIFORM_VECTORS),

    // vendor info
    glsl: gl.getParameter(GL_SHADING_LANGUAGE_VERSION),
    renderer: gl.getParameter(GL_RENDERER),
    vendor: gl.getParameter(GL_VENDOR),
    version: gl.getParameter(GL_VERSION),

    // quirks
    readFloat: readFloat,
    npotTextureCube: npotTextureCube
  }
};

function isNDArrayLike (obj) {
  return (
    !!obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.shape) &&
    Array.isArray(obj.stride) &&
    typeof obj.offset === 'number' &&
    obj.shape.length === obj.stride.length &&
    (Array.isArray(obj.data) ||
      isTypedArray(obj.data)))
}

var values = function (obj) {
  return Object.keys(obj).map(function (key) { return obj[key] })
};

var flattenUtils = {
  shape: arrayShape$1,
  flatten: flattenArray
};

function flatten1D (array, nx, out) {
  for (var i = 0; i < nx; ++i) {
    out[i] = array[i];
  }
}

function flatten2D (array, nx, ny, out) {
  var ptr = 0;
  for (var i = 0; i < nx; ++i) {
    var row = array[i];
    for (var j = 0; j < ny; ++j) {
      out[ptr++] = row[j];
    }
  }
}

function flatten3D (array, nx, ny, nz, out, ptr_) {
  var ptr = ptr_;
  for (var i = 0; i < nx; ++i) {
    var row = array[i];
    for (var j = 0; j < ny; ++j) {
      var col = row[j];
      for (var k = 0; k < nz; ++k) {
        out[ptr++] = col[k];
      }
    }
  }
}

function flattenRec (array, shape, level, out, ptr) {
  var stride = 1;
  for (var i = level + 1; i < shape.length; ++i) {
    stride *= shape[i];
  }
  var n = shape[level];
  if (shape.length - level === 4) {
    var nx = shape[level + 1];
    var ny = shape[level + 2];
    var nz = shape[level + 3];
    for (i = 0; i < n; ++i) {
      flatten3D(array[i], nx, ny, nz, out, ptr);
      ptr += stride;
    }
  } else {
    for (i = 0; i < n; ++i) {
      flattenRec(array[i], shape, level + 1, out, ptr);
      ptr += stride;
    }
  }
}

function flattenArray (array, shape, type, out_) {
  var sz = 1;
  if (shape.length) {
    for (var i = 0; i < shape.length; ++i) {
      sz *= shape[i];
    }
  } else {
    sz = 0;
  }
  var out = out_ || pool.allocType(type, sz);
  switch (shape.length) {
    case 0:
      break
    case 1:
      flatten1D(array, shape[0], out);
      break
    case 2:
      flatten2D(array, shape[0], shape[1], out);
      break
    case 3:
      flatten3D(array, shape[0], shape[1], shape[2], out, 0);
      break
    default:
      flattenRec(array, shape, 0, out, 0);
  }
  return out
}

function arrayShape$1 (array_) {
  var shape = [];
  for (var array = array_; array.length; array = array[0]) {
    shape.push(array.length);
  }
  return shape
}

var arrayTypes = {
	"[object Int8Array]": 5120,
	"[object Int16Array]": 5122,
	"[object Int32Array]": 5124,
	"[object Uint8Array]": 5121,
	"[object Uint8ClampedArray]": 5121,
	"[object Uint16Array]": 5123,
	"[object Uint32Array]": 5125,
	"[object Float32Array]": 5126,
	"[object Float64Array]": 5121,
	"[object ArrayBuffer]": 5121
};

var int8 = 5120;
var int16 = 5122;
var int32 = 5124;
var uint8 = 5121;
var uint16 = 5123;
var uint32 = 5125;
var float = 5126;
var float32 = 5126;
var glTypes = {
	int8: int8,
	int16: int16,
	int32: int32,
	uint8: uint8,
	uint16: uint16,
	uint32: uint32,
	float: float,
	float32: float32
};

var dynamic$1 = 35048;
var stream = 35040;
var usageTypes = {
	dynamic: dynamic$1,
	stream: stream,
	"static": 35044
};

var arrayFlatten = flattenUtils.flatten;
var arrayShape = flattenUtils.shape;

var GL_STATIC_DRAW = 0x88E4;
var GL_STREAM_DRAW = 0x88E0;

var GL_UNSIGNED_BYTE$3 = 5121;
var GL_FLOAT$3 = 5126;

var DTYPES_SIZES = [];
DTYPES_SIZES[5120] = 1; // int8
DTYPES_SIZES[5122] = 2; // int16
DTYPES_SIZES[5124] = 4; // int32
DTYPES_SIZES[5121] = 1; // uint8
DTYPES_SIZES[5123] = 2; // uint16
DTYPES_SIZES[5125] = 4; // uint32
DTYPES_SIZES[5126] = 4; // float32

function typedArrayCode (data) {
  return arrayTypes[Object.prototype.toString.call(data)] | 0
}

function copyArray (out, inp) {
  for (var i = 0; i < inp.length; ++i) {
    out[i] = inp[i];
  }
}

function transpose (
  result, data, shapeX, shapeY, strideX, strideY, offset) {
  var ptr = 0;
  for (var i = 0; i < shapeX; ++i) {
    for (var j = 0; j < shapeY; ++j) {
      result[ptr++] = data[strideX * i + strideY * j + offset];
    }
  }
}

function wrapBufferState (gl, stats, config, attributeState) {
  var bufferCount = 0;
  var bufferSet = {};

  function REGLBuffer (type) {
    this.id = bufferCount++;
    this.buffer = gl.createBuffer();
    this.type = type;
    this.usage = GL_STATIC_DRAW;
    this.byteLength = 0;
    this.dimension = 1;
    this.dtype = GL_UNSIGNED_BYTE$3;

    this.persistentData = null;

    if (config.profile) {
      this.stats = {size: 0};
    }
  }

  REGLBuffer.prototype.bind = function () {
    gl.bindBuffer(this.type, this.buffer);
  };

  REGLBuffer.prototype.destroy = function () {
    destroy(this);
  };

  var streamPool = [];

  function createStream (type, data) {
    var buffer = streamPool.pop();
    if (!buffer) {
      buffer = new REGLBuffer(type);
    }
    buffer.bind();
    initBufferFromData(buffer, data, GL_STREAM_DRAW, 0, 1, false);
    return buffer
  }

  function destroyStream (stream$$1) {
    streamPool.push(stream$$1);
  }

  function initBufferFromTypedArray (buffer, data, usage) {
    buffer.byteLength = data.byteLength;
    gl.bufferData(buffer.type, data, usage);
  }

  function initBufferFromData (buffer, data, usage, dtype, dimension, persist) {
    var shape;
    buffer.usage = usage;
    if (Array.isArray(data)) {
      buffer.dtype = dtype || GL_FLOAT$3;
      if (data.length > 0) {
        var flatData;
        if (Array.isArray(data[0])) {
          shape = arrayShape(data);
          var dim = 1;
          for (var i = 1; i < shape.length; ++i) {
            dim *= shape[i];
          }
          buffer.dimension = dim;
          flatData = arrayFlatten(data, shape, buffer.dtype);
          initBufferFromTypedArray(buffer, flatData, usage);
          if (persist) {
            buffer.persistentData = flatData;
          } else {
            pool.freeType(flatData);
          }
        } else if (typeof data[0] === 'number') {
          buffer.dimension = dimension;
          var typedData = pool.allocType(buffer.dtype, data.length);
          copyArray(typedData, data);
          initBufferFromTypedArray(buffer, typedData, usage);
          if (persist) {
            buffer.persistentData = typedData;
          } else {
            pool.freeType(typedData);
          }
        } else if (isTypedArray(data[0])) {
          buffer.dimension = data[0].length;
          buffer.dtype = dtype || typedArrayCode(data[0]) || GL_FLOAT$3;
          flatData = arrayFlatten(
            data,
            [data.length, data[0].length],
            buffer.dtype);
          initBufferFromTypedArray(buffer, flatData, usage);
          if (persist) {
            buffer.persistentData = flatData;
          } else {
            pool.freeType(flatData);
          }
        } else {
          check$1.raise('invalid buffer data');
        }
      }
    } else if (isTypedArray(data)) {
      buffer.dtype = dtype || typedArrayCode(data);
      buffer.dimension = dimension;
      initBufferFromTypedArray(buffer, data, usage);
      if (persist) {
        buffer.persistentData = new Uint8Array(new Uint8Array(data.buffer));
      }
    } else if (isNDArrayLike(data)) {
      shape = data.shape;
      var stride = data.stride;
      var offset = data.offset;

      var shapeX = 0;
      var shapeY = 0;
      var strideX = 0;
      var strideY = 0;
      if (shape.length === 1) {
        shapeX = shape[0];
        shapeY = 1;
        strideX = stride[0];
        strideY = 0;
      } else if (shape.length === 2) {
        shapeX = shape[0];
        shapeY = shape[1];
        strideX = stride[0];
        strideY = stride[1];
      } else {
        check$1.raise('invalid shape');
      }

      buffer.dtype = dtype || typedArrayCode(data.data) || GL_FLOAT$3;
      buffer.dimension = shapeY;

      var transposeData = pool.allocType(buffer.dtype, shapeX * shapeY);
      transpose(transposeData,
        data.data,
        shapeX, shapeY,
        strideX, strideY,
        offset);
      initBufferFromTypedArray(buffer, transposeData, usage);
      if (persist) {
        buffer.persistentData = transposeData;
      } else {
        pool.freeType(transposeData);
      }
    } else {
      check$1.raise('invalid buffer data');
    }
  }

  function destroy (buffer) {
    stats.bufferCount--;

    for (var i = 0; i < attributeState.state.length; ++i) {
      var record = attributeState.state[i];
      if (record.buffer === buffer) {
        gl.disableVertexAttribArray(i);
        record.buffer = null;
      }
    }

    var handle = buffer.buffer;
    check$1(handle, 'buffer must not be deleted already');
    gl.deleteBuffer(handle);
    buffer.buffer = null;
    delete bufferSet[buffer.id];
  }

  function createBuffer (options, type, deferInit, persistent) {
    stats.bufferCount++;

    var buffer = new REGLBuffer(type);
    bufferSet[buffer.id] = buffer;

    function reglBuffer (options) {
      var usage = GL_STATIC_DRAW;
      var data = null;
      var byteLength = 0;
      var dtype = 0;
      var dimension = 1;
      if (Array.isArray(options) ||
          isTypedArray(options) ||
          isNDArrayLike(options)) {
        data = options;
      } else if (typeof options === 'number') {
        byteLength = options | 0;
      } else if (options) {
        check$1.type(
          options, 'object',
          'buffer arguments must be an object, a number or an array');

        if ('data' in options) {
          check$1(
            data === null ||
            Array.isArray(data) ||
            isTypedArray(data) ||
            isNDArrayLike(data),
            'invalid data for buffer');
          data = options.data;
        }

        if ('usage' in options) {
          check$1.parameter(options.usage, usageTypes, 'invalid buffer usage');
          usage = usageTypes[options.usage];
        }

        if ('type' in options) {
          check$1.parameter(options.type, glTypes, 'invalid buffer type');
          dtype = glTypes[options.type];
        }

        if ('dimension' in options) {
          check$1.type(options.dimension, 'number', 'invalid dimension');
          dimension = options.dimension | 0;
        }

        if ('length' in options) {
          check$1.nni(byteLength, 'buffer length must be a nonnegative integer');
          byteLength = options.length | 0;
        }
      }

      buffer.bind();
      if (!data) {
        // #475
        if (byteLength) gl.bufferData(buffer.type, byteLength, usage);
        buffer.dtype = dtype || GL_UNSIGNED_BYTE$3;
        buffer.usage = usage;
        buffer.dimension = dimension;
        buffer.byteLength = byteLength;
      } else {
        initBufferFromData(buffer, data, usage, dtype, dimension, persistent);
      }

      if (config.profile) {
        buffer.stats.size = buffer.byteLength * DTYPES_SIZES[buffer.dtype];
      }

      return reglBuffer
    }

    function setSubData (data, offset) {
      check$1(offset + data.byteLength <= buffer.byteLength,
        'invalid buffer subdata call, buffer is too small. ' + ' Can\'t write data of size ' + data.byteLength + ' starting from offset ' + offset + ' to a buffer of size ' + buffer.byteLength);

      gl.bufferSubData(buffer.type, offset, data);
    }

    function subdata (data, offset_) {
      var offset = (offset_ || 0) | 0;
      var shape;
      buffer.bind();
      if (isTypedArray(data)) {
        setSubData(data, offset);
      } else if (Array.isArray(data)) {
        if (data.length > 0) {
          if (typeof data[0] === 'number') {
            var converted = pool.allocType(buffer.dtype, data.length);
            copyArray(converted, data);
            setSubData(converted, offset);
            pool.freeType(converted);
          } else if (Array.isArray(data[0]) || isTypedArray(data[0])) {
            shape = arrayShape(data);
            var flatData = arrayFlatten(data, shape, buffer.dtype);
            setSubData(flatData, offset);
            pool.freeType(flatData);
          } else {
            check$1.raise('invalid buffer data');
          }
        }
      } else if (isNDArrayLike(data)) {
        shape = data.shape;
        var stride = data.stride;

        var shapeX = 0;
        var shapeY = 0;
        var strideX = 0;
        var strideY = 0;
        if (shape.length === 1) {
          shapeX = shape[0];
          shapeY = 1;
          strideX = stride[0];
          strideY = 0;
        } else if (shape.length === 2) {
          shapeX = shape[0];
          shapeY = shape[1];
          strideX = stride[0];
          strideY = stride[1];
        } else {
          check$1.raise('invalid shape');
        }
        var dtype = Array.isArray(data.data)
          ? buffer.dtype
          : typedArrayCode(data.data);

        var transposeData = pool.allocType(dtype, shapeX * shapeY);
        transpose(transposeData,
          data.data,
          shapeX, shapeY,
          strideX, strideY,
          data.offset);
        setSubData(transposeData, offset);
        pool.freeType(transposeData);
      } else {
        check$1.raise('invalid data for buffer subdata');
      }
      return reglBuffer
    }

    if (!deferInit) {
      reglBuffer(options);
    }

    reglBuffer._reglType = 'buffer';
    reglBuffer._buffer = buffer;
    reglBuffer.subdata = subdata;
    if (config.profile) {
      reglBuffer.stats = buffer.stats;
    }
    reglBuffer.destroy = function () { destroy(buffer); };

    return reglBuffer
  }

  function restoreBuffers () {
    values(bufferSet).forEach(function (buffer) {
      buffer.buffer = gl.createBuffer();
      gl.bindBuffer(buffer.type, buffer.buffer);
      gl.bufferData(
        buffer.type, buffer.persistentData || buffer.byteLength, buffer.usage);
    });
  }

  if (config.profile) {
    stats.getTotalBufferSize = function () {
      var total = 0;
      // TODO: Right now, the streams are not part of the total count.
      Object.keys(bufferSet).forEach(function (key) {
        total += bufferSet[key].stats.size;
      });
      return total
    };
  }

  return {
    create: createBuffer,

    createStream: createStream,
    destroyStream: destroyStream,

    clear: function () {
      values(bufferSet).forEach(destroy);
      streamPool.forEach(destroy);
    },

    getBuffer: function (wrapper) {
      if (wrapper && wrapper._buffer instanceof REGLBuffer) {
        return wrapper._buffer
      }
      return null
    },

    restore: restoreBuffers,

    _initBuffer: initBufferFromData
  }
}

var points = 0;
var point = 0;
var lines = 1;
var line = 1;
var triangles = 4;
var triangle = 4;
var primTypes = {
	points: points,
	point: point,
	lines: lines,
	line: line,
	triangles: triangles,
	triangle: triangle,
	"line loop": 2,
	"line strip": 3,
	"triangle strip": 5,
	"triangle fan": 6
};

var GL_POINTS = 0;
var GL_LINES = 1;
var GL_TRIANGLES = 4;

var GL_BYTE$2 = 5120;
var GL_UNSIGNED_BYTE$4 = 5121;
var GL_SHORT$2 = 5122;
var GL_UNSIGNED_SHORT$2 = 5123;
var GL_INT$2 = 5124;
var GL_UNSIGNED_INT$2 = 5125;

var GL_ELEMENT_ARRAY_BUFFER = 34963;

var GL_STREAM_DRAW$1 = 0x88E0;
var GL_STATIC_DRAW$1 = 0x88E4;

function wrapElementsState (gl, extensions, bufferState, stats) {
  var elementSet = {};
  var elementCount = 0;

  var elementTypes = {
    'uint8': GL_UNSIGNED_BYTE$4,
    'uint16': GL_UNSIGNED_SHORT$2
  };

  if (extensions.oes_element_index_uint) {
    elementTypes.uint32 = GL_UNSIGNED_INT$2;
  }

  function REGLElementBuffer (buffer) {
    this.id = elementCount++;
    elementSet[this.id] = this;
    this.buffer = buffer;
    this.primType = GL_TRIANGLES;
    this.vertCount = 0;
    this.type = 0;
  }

  REGLElementBuffer.prototype.bind = function () {
    this.buffer.bind();
  };

  var bufferPool = [];

  function createElementStream (data) {
    var result = bufferPool.pop();
    if (!result) {
      result = new REGLElementBuffer(bufferState.create(
        null,
        GL_ELEMENT_ARRAY_BUFFER,
        true,
        false)._buffer);
    }
    initElements(result, data, GL_STREAM_DRAW$1, -1, -1, 0, 0);
    return result
  }

  function destroyElementStream (elements) {
    bufferPool.push(elements);
  }

  function initElements (
    elements,
    data,
    usage,
    prim,
    count,
    byteLength,
    type) {
    elements.buffer.bind();
    if (data) {
      var predictedType = type;
      if (!type && (
          !isTypedArray(data) ||
         (isNDArrayLike(data) && !isTypedArray(data.data)))) {
        predictedType = extensions.oes_element_index_uint
          ? GL_UNSIGNED_INT$2
          : GL_UNSIGNED_SHORT$2;
      }
      bufferState._initBuffer(
        elements.buffer,
        data,
        usage,
        predictedType,
        3);
    } else {
      gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, byteLength, usage);
      elements.buffer.dtype = dtype || GL_UNSIGNED_BYTE$4;
      elements.buffer.usage = usage;
      elements.buffer.dimension = 3;
      elements.buffer.byteLength = byteLength;
    }

    var dtype = type;
    if (!type) {
      switch (elements.buffer.dtype) {
        case GL_UNSIGNED_BYTE$4:
        case GL_BYTE$2:
          dtype = GL_UNSIGNED_BYTE$4;
          break

        case GL_UNSIGNED_SHORT$2:
        case GL_SHORT$2:
          dtype = GL_UNSIGNED_SHORT$2;
          break

        case GL_UNSIGNED_INT$2:
        case GL_INT$2:
          dtype = GL_UNSIGNED_INT$2;
          break

        default:
          check$1.raise('unsupported type for element array');
      }
      elements.buffer.dtype = dtype;
    }
    elements.type = dtype;

    // Check oes_element_index_uint extension
    check$1(
      dtype !== GL_UNSIGNED_INT$2 ||
      !!extensions.oes_element_index_uint,
      '32 bit element buffers not supported, enable oes_element_index_uint first');

    // try to guess default primitive type and arguments
    var vertCount = count;
    if (vertCount < 0) {
      vertCount = elements.buffer.byteLength;
      if (dtype === GL_UNSIGNED_SHORT$2) {
        vertCount >>= 1;
      } else if (dtype === GL_UNSIGNED_INT$2) {
        vertCount >>= 2;
      }
    }
    elements.vertCount = vertCount;

    // try to guess primitive type from cell dimension
    var primType = prim;
    if (prim < 0) {
      primType = GL_TRIANGLES;
      var dimension = elements.buffer.dimension;
      if (dimension === 1) primType = GL_POINTS;
      if (dimension === 2) primType = GL_LINES;
      if (dimension === 3) primType = GL_TRIANGLES;
    }
    elements.primType = primType;
  }

  function destroyElements (elements) {
    stats.elementsCount--;

    check$1(elements.buffer !== null, 'must not double destroy elements');
    delete elementSet[elements.id];
    elements.buffer.destroy();
    elements.buffer = null;
  }

  function createElements (options, persistent) {
    var buffer = bufferState.create(null, GL_ELEMENT_ARRAY_BUFFER, true);
    var elements = new REGLElementBuffer(buffer._buffer);
    stats.elementsCount++;

    function reglElements (options) {
      if (!options) {
        buffer();
        elements.primType = GL_TRIANGLES;
        elements.vertCount = 0;
        elements.type = GL_UNSIGNED_BYTE$4;
      } else if (typeof options === 'number') {
        buffer(options);
        elements.primType = GL_TRIANGLES;
        elements.vertCount = options | 0;
        elements.type = GL_UNSIGNED_BYTE$4;
      } else {
        var data = null;
        var usage = GL_STATIC_DRAW$1;
        var primType = -1;
        var vertCount = -1;
        var byteLength = 0;
        var dtype = 0;
        if (Array.isArray(options) ||
            isTypedArray(options) ||
            isNDArrayLike(options)) {
          data = options;
        } else {
          check$1.type(options, 'object', 'invalid arguments for elements');
          if ('data' in options) {
            data = options.data;
            check$1(
                Array.isArray(data) ||
                isTypedArray(data) ||
                isNDArrayLike(data),
                'invalid data for element buffer');
          }
          if ('usage' in options) {
            check$1.parameter(
              options.usage,
              usageTypes,
              'invalid element buffer usage');
            usage = usageTypes[options.usage];
          }
          if ('primitive' in options) {
            check$1.parameter(
              options.primitive,
              primTypes,
              'invalid element buffer primitive');
            primType = primTypes[options.primitive];
          }
          if ('count' in options) {
            check$1(
              typeof options.count === 'number' && options.count >= 0,
              'invalid vertex count for elements');
            vertCount = options.count | 0;
          }
          if ('type' in options) {
            check$1.parameter(
              options.type,
              elementTypes,
              'invalid buffer type');
            dtype = elementTypes[options.type];
          }
          if ('length' in options) {
            byteLength = options.length | 0;
          } else {
            byteLength = vertCount;
            if (dtype === GL_UNSIGNED_SHORT$2 || dtype === GL_SHORT$2) {
              byteLength *= 2;
            } else if (dtype === GL_UNSIGNED_INT$2 || dtype === GL_INT$2) {
              byteLength *= 4;
            }
          }
        }
        initElements(
          elements,
          data,
          usage,
          primType,
          vertCount,
          byteLength,
          dtype);
      }

      return reglElements
    }

    reglElements(options);

    reglElements._reglType = 'elements';
    reglElements._elements = elements;
    reglElements.subdata = function (data, offset) {
      buffer.subdata(data, offset);
      return reglElements
    };
    reglElements.destroy = function () {
      destroyElements(elements);
    };

    return reglElements
  }

  return {
    create: createElements,
    createStream: createElementStream,
    destroyStream: destroyElementStream,
    getElements: function (elements) {
      if (typeof elements === 'function' &&
          elements._elements instanceof REGLElementBuffer) {
        return elements._elements
      }
      return null
    },
    clear: function () {
      values(elementSet).forEach(destroyElements);
    }
  }
}

var FLOAT = new Float32Array(1);
var INT = new Uint32Array(FLOAT.buffer);

var GL_UNSIGNED_SHORT$4 = 5123;

function convertToHalfFloat (array) {
  var ushorts = pool.allocType(GL_UNSIGNED_SHORT$4, array.length);

  for (var i = 0; i < array.length; ++i) {
    if (isNaN(array[i])) {
      ushorts[i] = 0xffff;
    } else if (array[i] === Infinity) {
      ushorts[i] = 0x7c00;
    } else if (array[i] === -Infinity) {
      ushorts[i] = 0xfc00;
    } else {
      FLOAT[0] = array[i];
      var x = INT[0];

      var sgn = (x >>> 31) << 15;
      var exp = ((x << 1) >>> 24) - 127;
      var frac = (x >> 13) & ((1 << 10) - 1);

      if (exp < -24) {
        // round non-representable denormals to 0
        ushorts[i] = sgn;
      } else if (exp < -14) {
        // handle denormals
        var s = -14 - exp;
        ushorts[i] = sgn + ((frac + (1 << 10)) >> s);
      } else if (exp > 15) {
        // round overflow to +/- Infinity
        ushorts[i] = sgn + 0x7c00;
      } else {
        // otherwise convert directly
        ushorts[i] = sgn + ((exp + 15) << 10) + frac;
      }
    }
  }

  return ushorts
}

function isArrayLike (s) {
  return Array.isArray(s) || isTypedArray(s)
}

var isPow2$1 = function (v) {
  return !(v & (v - 1)) && (!!v)
};

var GL_COMPRESSED_TEXTURE_FORMATS = 0x86A3;

var GL_TEXTURE_2D$1 = 0x0DE1;
var GL_TEXTURE_CUBE_MAP$1 = 0x8513;
var GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 = 0x8515;

var GL_RGBA$1 = 0x1908;
var GL_ALPHA = 0x1906;
var GL_RGB = 0x1907;
var GL_LUMINANCE = 0x1909;
var GL_LUMINANCE_ALPHA = 0x190A;

var GL_RGBA4 = 0x8056;
var GL_RGB5_A1 = 0x8057;
var GL_RGB565 = 0x8D62;

var GL_UNSIGNED_SHORT_4_4_4_4$1 = 0x8033;
var GL_UNSIGNED_SHORT_5_5_5_1$1 = 0x8034;
var GL_UNSIGNED_SHORT_5_6_5$1 = 0x8363;
var GL_UNSIGNED_INT_24_8_WEBGL$1 = 0x84FA;

var GL_DEPTH_COMPONENT = 0x1902;
var GL_DEPTH_STENCIL = 0x84F9;

var GL_SRGB_EXT = 0x8C40;
var GL_SRGB_ALPHA_EXT = 0x8C42;

var GL_HALF_FLOAT_OES$1 = 0x8D61;

var GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
var GL_COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
var GL_COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
var GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

var GL_COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
var GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C93;
var GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

var GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
var GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
var GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
var GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

var GL_COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

var GL_UNSIGNED_BYTE$5 = 0x1401;
var GL_UNSIGNED_SHORT$3 = 0x1403;
var GL_UNSIGNED_INT$3 = 0x1405;
var GL_FLOAT$4 = 0x1406;

var GL_TEXTURE_WRAP_S = 0x2802;
var GL_TEXTURE_WRAP_T = 0x2803;

var GL_REPEAT = 0x2901;
var GL_CLAMP_TO_EDGE$1 = 0x812F;
var GL_MIRRORED_REPEAT = 0x8370;

var GL_TEXTURE_MAG_FILTER = 0x2800;
var GL_TEXTURE_MIN_FILTER = 0x2801;

var GL_NEAREST$1 = 0x2600;
var GL_LINEAR = 0x2601;
var GL_NEAREST_MIPMAP_NEAREST$1 = 0x2700;
var GL_LINEAR_MIPMAP_NEAREST$1 = 0x2701;
var GL_NEAREST_MIPMAP_LINEAR$1 = 0x2702;
var GL_LINEAR_MIPMAP_LINEAR$1 = 0x2703;

var GL_GENERATE_MIPMAP_HINT = 0x8192;
var GL_DONT_CARE = 0x1100;
var GL_FASTEST = 0x1101;
var GL_NICEST = 0x1102;

var GL_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;

var GL_UNPACK_ALIGNMENT = 0x0CF5;
var GL_UNPACK_FLIP_Y_WEBGL = 0x9240;
var GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
var GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;

var GL_BROWSER_DEFAULT_WEBGL = 0x9244;

var GL_TEXTURE0$1 = 0x84C0;

var MIPMAP_FILTERS = [
  GL_NEAREST_MIPMAP_NEAREST$1,
  GL_NEAREST_MIPMAP_LINEAR$1,
  GL_LINEAR_MIPMAP_NEAREST$1,
  GL_LINEAR_MIPMAP_LINEAR$1
];

var CHANNELS_FORMAT = [
  0,
  GL_LUMINANCE,
  GL_LUMINANCE_ALPHA,
  GL_RGB,
  GL_RGBA$1
];

var FORMAT_CHANNELS = {};
FORMAT_CHANNELS[GL_LUMINANCE] =
FORMAT_CHANNELS[GL_ALPHA] =
FORMAT_CHANNELS[GL_DEPTH_COMPONENT] = 1;
FORMAT_CHANNELS[GL_DEPTH_STENCIL] =
FORMAT_CHANNELS[GL_LUMINANCE_ALPHA] = 2;
FORMAT_CHANNELS[GL_RGB] =
FORMAT_CHANNELS[GL_SRGB_EXT] = 3;
FORMAT_CHANNELS[GL_RGBA$1] =
FORMAT_CHANNELS[GL_SRGB_ALPHA_EXT] = 4;

function objectName (str) {
  return '[object ' + str + ']'
}

var CANVAS_CLASS = objectName('HTMLCanvasElement');
var CONTEXT2D_CLASS = objectName('CanvasRenderingContext2D');
var BITMAP_CLASS = objectName('ImageBitmap');
var IMAGE_CLASS = objectName('HTMLImageElement');
var VIDEO_CLASS = objectName('HTMLVideoElement');

var PIXEL_CLASSES = Object.keys(arrayTypes).concat([
  CANVAS_CLASS,
  CONTEXT2D_CLASS,
  BITMAP_CLASS,
  IMAGE_CLASS,
  VIDEO_CLASS
]);

// for every texture type, store
// the size in bytes.
var TYPE_SIZES = [];
TYPE_SIZES[GL_UNSIGNED_BYTE$5] = 1;
TYPE_SIZES[GL_FLOAT$4] = 4;
TYPE_SIZES[GL_HALF_FLOAT_OES$1] = 2;

TYPE_SIZES[GL_UNSIGNED_SHORT$3] = 2;
TYPE_SIZES[GL_UNSIGNED_INT$3] = 4;

var FORMAT_SIZES_SPECIAL = [];
FORMAT_SIZES_SPECIAL[GL_RGBA4] = 2;
FORMAT_SIZES_SPECIAL[GL_RGB5_A1] = 2;
FORMAT_SIZES_SPECIAL[GL_RGB565] = 2;
FORMAT_SIZES_SPECIAL[GL_DEPTH_STENCIL] = 4;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_S3TC_DXT1_EXT] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT1_EXT] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT3_EXT] = 1;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT5_EXT] = 1;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ATC_WEBGL] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL] = 1;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL] = 1;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG] = 0.25;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG] = 0.5;
FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG] = 0.25;

FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ETC1_WEBGL] = 0.5;

function isNumericArray (arr) {
  return (
    Array.isArray(arr) &&
    (arr.length === 0 ||
    typeof arr[0] === 'number'))
}

function isRectArray (arr) {
  if (!Array.isArray(arr)) {
    return false
  }
  var width = arr.length;
  if (width === 0 || !isArrayLike(arr[0])) {
    return false
  }
  return true
}

function classString (x) {
  return Object.prototype.toString.call(x)
}

function isCanvasElement (object) {
  return classString(object) === CANVAS_CLASS
}

function isContext2D (object) {
  return classString(object) === CONTEXT2D_CLASS
}

function isBitmap (object) {
  return classString(object) === BITMAP_CLASS
}

function isImageElement (object) {
  return classString(object) === IMAGE_CLASS
}

function isVideoElement (object) {
  return classString(object) === VIDEO_CLASS
}

function isPixelData (object) {
  if (!object) {
    return false
  }
  var className = classString(object);
  if (PIXEL_CLASSES.indexOf(className) >= 0) {
    return true
  }
  return (
    isNumericArray(object) ||
    isRectArray(object) ||
    isNDArrayLike(object))
}

function typedArrayCode$1 (data) {
  return arrayTypes[Object.prototype.toString.call(data)] | 0
}

function convertData (result, data) {
  var n = data.length;
  switch (result.type) {
    case GL_UNSIGNED_BYTE$5:
    case GL_UNSIGNED_SHORT$3:
    case GL_UNSIGNED_INT$3:
    case GL_FLOAT$4:
      var converted = pool.allocType(result.type, n);
      converted.set(data);
      result.data = converted;
      break

    case GL_HALF_FLOAT_OES$1:
      result.data = convertToHalfFloat(data);
      break

    default:
      check$1.raise('unsupported texture type, must specify a typed array');
  }
}

function preConvert (image, n) {
  return pool.allocType(
    image.type === GL_HALF_FLOAT_OES$1
      ? GL_FLOAT$4
      : image.type, n)
}

function postConvert (image, data) {
  if (image.type === GL_HALF_FLOAT_OES$1) {
    image.data = convertToHalfFloat(data);
    pool.freeType(data);
  } else {
    image.data = data;
  }
}

function transposeData (image, array, strideX, strideY, strideC, offset) {
  var w = image.width;
  var h = image.height;
  var c = image.channels;
  var n = w * h * c;
  var data = preConvert(image, n);

  var p = 0;
  for (var i = 0; i < h; ++i) {
    for (var j = 0; j < w; ++j) {
      for (var k = 0; k < c; ++k) {
        data[p++] = array[strideX * j + strideY * i + strideC * k + offset];
      }
    }
  }

  postConvert(image, data);
}

function getTextureSize (format, type, width, height, isMipmap, isCube) {
  var s;
  if (typeof FORMAT_SIZES_SPECIAL[format] !== 'undefined') {
    // we have a special array for dealing with weird color formats such as RGB5A1
    s = FORMAT_SIZES_SPECIAL[format];
  } else {
    s = FORMAT_CHANNELS[format] * TYPE_SIZES[type];
  }

  if (isCube) {
    s *= 6;
  }

  if (isMipmap) {
    // compute the total size of all the mipmaps.
    var total = 0;

    var w = width;
    while (w >= 1) {
      // we can only use mipmaps on a square image,
      // so we can simply use the width and ignore the height:
      total += s * w * w;
      w /= 2;
    }
    return total
  } else {
    return s * width * height
  }
}

function createTextureSet (
  gl, extensions, limits, reglPoll, contextState, stats, config) {
  // -------------------------------------------------------
  // Initialize constants and parameter tables here
  // -------------------------------------------------------
  var mipmapHint = {
    "don't care": GL_DONT_CARE,
    'dont care': GL_DONT_CARE,
    'nice': GL_NICEST,
    'fast': GL_FASTEST
  };

  var wrapModes = {
    'repeat': GL_REPEAT,
    'clamp': GL_CLAMP_TO_EDGE$1,
    'mirror': GL_MIRRORED_REPEAT
  };

  var magFilters = {
    'nearest': GL_NEAREST$1,
    'linear': GL_LINEAR
  };

  var minFilters = extend({
    'mipmap': GL_LINEAR_MIPMAP_LINEAR$1,
    'nearest mipmap nearest': GL_NEAREST_MIPMAP_NEAREST$1,
    'linear mipmap nearest': GL_LINEAR_MIPMAP_NEAREST$1,
    'nearest mipmap linear': GL_NEAREST_MIPMAP_LINEAR$1,
    'linear mipmap linear': GL_LINEAR_MIPMAP_LINEAR$1
  }, magFilters);

  var colorSpace = {
    'none': 0,
    'browser': GL_BROWSER_DEFAULT_WEBGL
  };

  var textureTypes = {
    'uint8': GL_UNSIGNED_BYTE$5,
    'rgba4': GL_UNSIGNED_SHORT_4_4_4_4$1,
    'rgb565': GL_UNSIGNED_SHORT_5_6_5$1,
    'rgb5 a1': GL_UNSIGNED_SHORT_5_5_5_1$1
  };

  var textureFormats = {
    'alpha': GL_ALPHA,
    'luminance': GL_LUMINANCE,
    'luminance alpha': GL_LUMINANCE_ALPHA,
    'rgb': GL_RGB,
    'rgba': GL_RGBA$1,
    'rgba4': GL_RGBA4,
    'rgb5 a1': GL_RGB5_A1,
    'rgb565': GL_RGB565
  };

  var compressedTextureFormats = {};

  if (extensions.ext_srgb) {
    textureFormats.srgb = GL_SRGB_EXT;
    textureFormats.srgba = GL_SRGB_ALPHA_EXT;
  }

  if (extensions.oes_texture_float) {
    textureTypes.float32 = textureTypes.float = GL_FLOAT$4;
  }

  if (extensions.oes_texture_half_float) {
    textureTypes['float16'] = textureTypes['half float'] = GL_HALF_FLOAT_OES$1;
  }

  if (extensions.webgl_depth_texture) {
    extend(textureFormats, {
      'depth': GL_DEPTH_COMPONENT,
      'depth stencil': GL_DEPTH_STENCIL
    });

    extend(textureTypes, {
      'uint16': GL_UNSIGNED_SHORT$3,
      'uint32': GL_UNSIGNED_INT$3,
      'depth stencil': GL_UNSIGNED_INT_24_8_WEBGL$1
    });
  }

  if (extensions.webgl_compressed_texture_s3tc) {
    extend(compressedTextureFormats, {
      'rgb s3tc dxt1': GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
      'rgba s3tc dxt1': GL_COMPRESSED_RGBA_S3TC_DXT1_EXT,
      'rgba s3tc dxt3': GL_COMPRESSED_RGBA_S3TC_DXT3_EXT,
      'rgba s3tc dxt5': GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
    });
  }

  if (extensions.webgl_compressed_texture_atc) {
    extend(compressedTextureFormats, {
      'rgb atc': GL_COMPRESSED_RGB_ATC_WEBGL,
      'rgba atc explicit alpha': GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
      'rgba atc interpolated alpha': GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
    });
  }

  if (extensions.webgl_compressed_texture_pvrtc) {
    extend(compressedTextureFormats, {
      'rgb pvrtc 4bppv1': GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
      'rgb pvrtc 2bppv1': GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
      'rgba pvrtc 4bppv1': GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
      'rgba pvrtc 2bppv1': GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
    });
  }

  if (extensions.webgl_compressed_texture_etc1) {
    compressedTextureFormats['rgb etc1'] = GL_COMPRESSED_RGB_ETC1_WEBGL;
  }

  // Copy over all texture formats
  var supportedCompressedFormats = Array.prototype.slice.call(
    gl.getParameter(GL_COMPRESSED_TEXTURE_FORMATS));
  Object.keys(compressedTextureFormats).forEach(function (name) {
    var format = compressedTextureFormats[name];
    if (supportedCompressedFormats.indexOf(format) >= 0) {
      textureFormats[name] = format;
    }
  });

  var supportedFormats = Object.keys(textureFormats);
  limits.textureFormats = supportedFormats;

  // associate with every format string its
  // corresponding GL-value.
  var textureFormatsInvert = [];
  Object.keys(textureFormats).forEach(function (key) {
    var val = textureFormats[key];
    textureFormatsInvert[val] = key;
  });

  // associate with every type string its
  // corresponding GL-value.
  var textureTypesInvert = [];
  Object.keys(textureTypes).forEach(function (key) {
    var val = textureTypes[key];
    textureTypesInvert[val] = key;
  });

  var magFiltersInvert = [];
  Object.keys(magFilters).forEach(function (key) {
    var val = magFilters[key];
    magFiltersInvert[val] = key;
  });

  var minFiltersInvert = [];
  Object.keys(minFilters).forEach(function (key) {
    var val = minFilters[key];
    minFiltersInvert[val] = key;
  });

  var wrapModesInvert = [];
  Object.keys(wrapModes).forEach(function (key) {
    var val = wrapModes[key];
    wrapModesInvert[val] = key;
  });

  // colorFormats[] gives the format (channels) associated to an
  // internalformat
  var colorFormats = supportedFormats.reduce(function (color, key) {
    var glenum = textureFormats[key];
    if (glenum === GL_LUMINANCE ||
        glenum === GL_ALPHA ||
        glenum === GL_LUMINANCE ||
        glenum === GL_LUMINANCE_ALPHA ||
        glenum === GL_DEPTH_COMPONENT ||
        glenum === GL_DEPTH_STENCIL) {
      color[glenum] = glenum;
    } else if (glenum === GL_RGB5_A1 || key.indexOf('rgba') >= 0) {
      color[glenum] = GL_RGBA$1;
    } else {
      color[glenum] = GL_RGB;
    }
    return color
  }, {});

  function TexFlags () {
    // format info
    this.internalformat = GL_RGBA$1;
    this.format = GL_RGBA$1;
    this.type = GL_UNSIGNED_BYTE$5;
    this.compressed = false;

    // pixel storage
    this.premultiplyAlpha = false;
    this.flipY = false;
    this.unpackAlignment = 1;
    this.colorSpace = GL_BROWSER_DEFAULT_WEBGL;

    // shape info
    this.width = 0;
    this.height = 0;
    this.channels = 0;
  }

  function copyFlags (result, other) {
    result.internalformat = other.internalformat;
    result.format = other.format;
    result.type = other.type;
    result.compressed = other.compressed;

    result.premultiplyAlpha = other.premultiplyAlpha;
    result.flipY = other.flipY;
    result.unpackAlignment = other.unpackAlignment;
    result.colorSpace = other.colorSpace;

    result.width = other.width;
    result.height = other.height;
    result.channels = other.channels;
  }

  function parseFlags (flags, options) {
    if (typeof options !== 'object' || !options) {
      return
    }

    if ('premultiplyAlpha' in options) {
      check$1.type(options.premultiplyAlpha, 'boolean',
        'invalid premultiplyAlpha');
      flags.premultiplyAlpha = options.premultiplyAlpha;
    }

    if ('flipY' in options) {
      check$1.type(options.flipY, 'boolean',
        'invalid texture flip');
      flags.flipY = options.flipY;
    }

    if ('alignment' in options) {
      check$1.oneOf(options.alignment, [1, 2, 4, 8],
        'invalid texture unpack alignment');
      flags.unpackAlignment = options.alignment;
    }

    if ('colorSpace' in options) {
      check$1.parameter(options.colorSpace, colorSpace,
        'invalid colorSpace');
      flags.colorSpace = colorSpace[options.colorSpace];
    }

    if ('type' in options) {
      var type = options.type;
      check$1(extensions.oes_texture_float ||
        !(type === 'float' || type === 'float32'),
        'you must enable the OES_texture_float extension in order to use floating point textures.');
      check$1(extensions.oes_texture_half_float ||
        !(type === 'half float' || type === 'float16'),
        'you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures.');
      check$1(extensions.webgl_depth_texture ||
        !(type === 'uint16' || type === 'uint32' || type === 'depth stencil'),
        'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
      check$1.parameter(type, textureTypes,
        'invalid texture type');
      flags.type = textureTypes[type];
    }

    var w = flags.width;
    var h = flags.height;
    var c = flags.channels;
    var hasChannels = false;
    if ('shape' in options) {
      check$1(Array.isArray(options.shape) && options.shape.length >= 2,
        'shape must be an array');
      w = options.shape[0];
      h = options.shape[1];
      if (options.shape.length === 3) {
        c = options.shape[2];
        check$1(c > 0 && c <= 4, 'invalid number of channels');
        hasChannels = true;
      }
      check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
      check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
    } else {
      if ('radius' in options) {
        w = h = options.radius;
        check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid radius');
      }
      if ('width' in options) {
        w = options.width;
        check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
      }
      if ('height' in options) {
        h = options.height;
        check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
      }
      if ('channels' in options) {
        c = options.channels;
        check$1(c > 0 && c <= 4, 'invalid number of channels');
        hasChannels = true;
      }
    }
    flags.width = w | 0;
    flags.height = h | 0;
    flags.channels = c | 0;

    var hasFormat = false;
    if ('format' in options) {
      var formatStr = options.format;
      check$1(extensions.webgl_depth_texture ||
        !(formatStr === 'depth' || formatStr === 'depth stencil'),
        'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
      check$1.parameter(formatStr, textureFormats,
        'invalid texture format');
      var internalformat = flags.internalformat = textureFormats[formatStr];
      flags.format = colorFormats[internalformat];
      if (formatStr in textureTypes) {
        if (!('type' in options)) {
          flags.type = textureTypes[formatStr];
        }
      }
      if (formatStr in compressedTextureFormats) {
        flags.compressed = true;
      }
      hasFormat = true;
    }

    // Reconcile channels and format
    if (!hasChannels && hasFormat) {
      flags.channels = FORMAT_CHANNELS[flags.format];
    } else if (hasChannels && !hasFormat) {
      if (flags.channels !== CHANNELS_FORMAT[flags.format]) {
        flags.format = flags.internalformat = CHANNELS_FORMAT[flags.channels];
      }
    } else if (hasFormat && hasChannels) {
      check$1(
        flags.channels === FORMAT_CHANNELS[flags.format],
        'number of channels inconsistent with specified format');
    }
  }

  function setFlags (flags) {
    gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, flags.flipY);
    gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, flags.premultiplyAlpha);
    gl.pixelStorei(GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, flags.colorSpace);
    gl.pixelStorei(GL_UNPACK_ALIGNMENT, flags.unpackAlignment);
  }

  // -------------------------------------------------------
  // Tex image data
  // -------------------------------------------------------
  function TexImage () {
    TexFlags.call(this);

    this.xOffset = 0;
    this.yOffset = 0;

    // data
    this.data = null;
    this.needsFree = false;

    // html element
    this.element = null;

    // copyTexImage info
    this.needsCopy = false;
  }

  function parseImage (image, options) {
    var data = null;
    if (isPixelData(options)) {
      data = options;
    } else if (options) {
      check$1.type(options, 'object', 'invalid pixel data type');
      parseFlags(image, options);
      if ('x' in options) {
        image.xOffset = options.x | 0;
      }
      if ('y' in options) {
        image.yOffset = options.y | 0;
      }
      if (isPixelData(options.data)) {
        data = options.data;
      }
    }

    check$1(
      !image.compressed ||
      data instanceof Uint8Array,
      'compressed texture data must be stored in a uint8array');

    if (options.copy) {
      check$1(!data, 'can not specify copy and data field for the same texture');
      var viewW = contextState.viewportWidth;
      var viewH = contextState.viewportHeight;
      image.width = image.width || (viewW - image.xOffset);
      image.height = image.height || (viewH - image.yOffset);
      image.needsCopy = true;
      check$1(image.xOffset >= 0 && image.xOffset < viewW &&
            image.yOffset >= 0 && image.yOffset < viewH &&
            image.width > 0 && image.width <= viewW &&
            image.height > 0 && image.height <= viewH,
            'copy texture read out of bounds');
    } else if (!data) {
      image.width = image.width || 1;
      image.height = image.height || 1;
      image.channels = image.channels || 4;
    } else if (isTypedArray(data)) {
      image.channels = image.channels || 4;
      image.data = data;
      if (!('type' in options) && image.type === GL_UNSIGNED_BYTE$5) {
        image.type = typedArrayCode$1(data);
      }
    } else if (isNumericArray(data)) {
      image.channels = image.channels || 4;
      convertData(image, data);
      image.alignment = 1;
      image.needsFree = true;
    } else if (isNDArrayLike(data)) {
      var array = data.data;
      if (!Array.isArray(array) && image.type === GL_UNSIGNED_BYTE$5) {
        image.type = typedArrayCode$1(array);
      }
      var shape = data.shape;
      var stride = data.stride;
      var shapeX, shapeY, shapeC, strideX, strideY, strideC;
      if (shape.length === 3) {
        shapeC = shape[2];
        strideC = stride[2];
      } else {
        check$1(shape.length === 2, 'invalid ndarray pixel data, must be 2 or 3D');
        shapeC = 1;
        strideC = 1;
      }
      shapeX = shape[0];
      shapeY = shape[1];
      strideX = stride[0];
      strideY = stride[1];
      image.alignment = 1;
      image.width = shapeX;
      image.height = shapeY;
      image.channels = shapeC;
      image.format = image.internalformat = CHANNELS_FORMAT[shapeC];
      image.needsFree = true;
      transposeData(image, array, strideX, strideY, strideC, data.offset);
    } else if (isCanvasElement(data) || isContext2D(data)) {
      if (isCanvasElement(data)) {
        image.element = data;
      } else {
        image.element = data.canvas;
      }
      image.width = image.element.width;
      image.height = image.element.height;
      image.channels = 4;
    } else if (isBitmap(data)) {
      image.element = data;
      image.width = data.width;
      image.height = data.height;
      image.channels = 4;
    } else if (isImageElement(data)) {
      image.element = data;
      image.width = data.naturalWidth;
      image.height = data.naturalHeight;
      image.channels = 4;
    } else if (isVideoElement(data)) {
      image.element = data;
      image.width = data.videoWidth;
      image.height = data.videoHeight;
      image.channels = 4;
    } else if (isRectArray(data)) {
      var w = image.width || data[0].length;
      var h = image.height || data.length;
      var c = image.channels;
      if (isArrayLike(data[0][0])) {
        c = c || data[0][0].length;
      } else {
        c = c || 1;
      }
      var arrayShape = flattenUtils.shape(data);
      var n = 1;
      for (var dd = 0; dd < arrayShape.length; ++dd) {
        n *= arrayShape[dd];
      }
      var allocData = preConvert(image, n);
      flattenUtils.flatten(data, arrayShape, '', allocData);
      postConvert(image, allocData);
      image.alignment = 1;
      image.width = w;
      image.height = h;
      image.channels = c;
      image.format = image.internalformat = CHANNELS_FORMAT[c];
      image.needsFree = true;
    }

    if (image.type === GL_FLOAT$4) {
      check$1(limits.extensions.indexOf('oes_texture_float') >= 0,
        'oes_texture_float extension not enabled');
    } else if (image.type === GL_HALF_FLOAT_OES$1) {
      check$1(limits.extensions.indexOf('oes_texture_half_float') >= 0,
        'oes_texture_half_float extension not enabled');
    }

    // do compressed texture  validation here.
  }

  function setImage (info, target, miplevel) {
    var element = info.element;
    var data = info.data;
    var internalformat = info.internalformat;
    var format = info.format;
    var type = info.type;
    var width = info.width;
    var height = info.height;
    var channels = info.channels;

    setFlags(info);

    if (element) {
      gl.texImage2D(target, miplevel, format, format, type, element);
    } else if (info.compressed) {
      gl.compressedTexImage2D(target, miplevel, internalformat, width, height, 0, data);
    } else if (info.needsCopy) {
      reglPoll();
      gl.copyTexImage2D(
        target, miplevel, format, info.xOffset, info.yOffset, width, height, 0);
    } else {
      var nullData = !data;
      if (nullData) {
        data = pool.zero.allocType(type, width * height * channels);
      }

      gl.texImage2D(target, miplevel, format, width, height, 0, format, type, data);

      if (nullData && data) {
        pool.zero.freeType(data);
      }
    }
  }

  function setSubImage (info, target, x, y, miplevel) {
    var element = info.element;
    var data = info.data;
    var internalformat = info.internalformat;
    var format = info.format;
    var type = info.type;
    var width = info.width;
    var height = info.height;

    setFlags(info);

    if (element) {
      gl.texSubImage2D(
        target, miplevel, x, y, format, type, element);
    } else if (info.compressed) {
      gl.compressedTexSubImage2D(
        target, miplevel, x, y, internalformat, width, height, data);
    } else if (info.needsCopy) {
      reglPoll();
      gl.copyTexSubImage2D(
        target, miplevel, x, y, info.xOffset, info.yOffset, width, height);
    } else {
      gl.texSubImage2D(
        target, miplevel, x, y, width, height, format, type, data);
    }
  }

  // texImage pool
  var imagePool = [];

  function allocImage () {
    return imagePool.pop() || new TexImage()
  }

  function freeImage (image) {
    if (image.needsFree) {
      pool.freeType(image.data);
    }
    TexImage.call(image);
    imagePool.push(image);
  }

  // -------------------------------------------------------
  // Mip map
  // -------------------------------------------------------
  function MipMap () {
    TexFlags.call(this);

    this.genMipmaps = false;
    this.mipmapHint = GL_DONT_CARE;
    this.mipmask = 0;
    this.images = Array(16);
  }

  function parseMipMapFromShape (mipmap, width, height) {
    var img = mipmap.images[0] = allocImage();
    mipmap.mipmask = 1;
    img.width = mipmap.width = width;
    img.height = mipmap.height = height;
    img.channels = mipmap.channels = 4;
  }

  function parseMipMapFromObject (mipmap, options) {
    var imgData = null;
    if (isPixelData(options)) {
      imgData = mipmap.images[0] = allocImage();
      copyFlags(imgData, mipmap);
      parseImage(imgData, options);
      mipmap.mipmask = 1;
    } else {
      parseFlags(mipmap, options);
      if (Array.isArray(options.mipmap)) {
        var mipData = options.mipmap;
        for (var i = 0; i < mipData.length; ++i) {
          imgData = mipmap.images[i] = allocImage();
          copyFlags(imgData, mipmap);
          imgData.width >>= i;
          imgData.height >>= i;
          parseImage(imgData, mipData[i]);
          mipmap.mipmask |= (1 << i);
        }
      } else {
        imgData = mipmap.images[0] = allocImage();
        copyFlags(imgData, mipmap);
        parseImage(imgData, options);
        mipmap.mipmask = 1;
      }
    }
    copyFlags(mipmap, mipmap.images[0]);

    // For textures of the compressed format WEBGL_compressed_texture_s3tc
    // we must have that
    //
    // "When level equals zero width and height must be a multiple of 4.
    // When level is greater than 0 width and height must be 0, 1, 2 or a multiple of 4. "
    //
    // but we do not yet support having multiple mipmap levels for compressed textures,
    // so we only test for level zero.

    if (mipmap.compressed &&
        (mipmap.internalformat === GL_COMPRESSED_RGB_S3TC_DXT1_EXT) ||
        (mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT1_EXT) ||
        (mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT3_EXT) ||
        (mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT5_EXT)) {
      check$1(mipmap.width % 4 === 0 &&
            mipmap.height % 4 === 0,
            'for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4');
    }
  }

  function setMipMap (mipmap, target) {
    var images = mipmap.images;
    for (var i = 0; i < images.length; ++i) {
      if (!images[i]) {
        return
      }
      setImage(images[i], target, i);
    }
  }

  var mipPool = [];

  function allocMipMap () {
    var result = mipPool.pop() || new MipMap();
    TexFlags.call(result);
    result.mipmask = 0;
    for (var i = 0; i < 16; ++i) {
      result.images[i] = null;
    }
    return result
  }

  function freeMipMap (mipmap) {
    var images = mipmap.images;
    for (var i = 0; i < images.length; ++i) {
      if (images[i]) {
        freeImage(images[i]);
      }
      images[i] = null;
    }
    mipPool.push(mipmap);
  }

  // -------------------------------------------------------
  // Tex info
  // -------------------------------------------------------
  function TexInfo () {
    this.minFilter = GL_NEAREST$1;
    this.magFilter = GL_NEAREST$1;

    this.wrapS = GL_CLAMP_TO_EDGE$1;
    this.wrapT = GL_CLAMP_TO_EDGE$1;

    this.anisotropic = 1;

    this.genMipmaps = false;
    this.mipmapHint = GL_DONT_CARE;
  }

  function parseTexInfo (info, options) {
    if ('min' in options) {
      var minFilter = options.min;
      check$1.parameter(minFilter, minFilters);
      info.minFilter = minFilters[minFilter];
      if (MIPMAP_FILTERS.indexOf(info.minFilter) >= 0 && !('faces' in options)) {
        info.genMipmaps = true;
      }
    }

    if ('mag' in options) {
      var magFilter = options.mag;
      check$1.parameter(magFilter, magFilters);
      info.magFilter = magFilters[magFilter];
    }

    var wrapS = info.wrapS;
    var wrapT = info.wrapT;
    if ('wrap' in options) {
      var wrap = options.wrap;
      if (typeof wrap === 'string') {
        check$1.parameter(wrap, wrapModes);
        wrapS = wrapT = wrapModes[wrap];
      } else if (Array.isArray(wrap)) {
        check$1.parameter(wrap[0], wrapModes);
        check$1.parameter(wrap[1], wrapModes);
        wrapS = wrapModes[wrap[0]];
        wrapT = wrapModes[wrap[1]];
      }
    } else {
      if ('wrapS' in options) {
        var optWrapS = options.wrapS;
        check$1.parameter(optWrapS, wrapModes);
        wrapS = wrapModes[optWrapS];
      }
      if ('wrapT' in options) {
        var optWrapT = options.wrapT;
        check$1.parameter(optWrapT, wrapModes);
        wrapT = wrapModes[optWrapT];
      }
    }
    info.wrapS = wrapS;
    info.wrapT = wrapT;

    if ('anisotropic' in options) {
      var anisotropic = options.anisotropic;
      check$1(typeof anisotropic === 'number' &&
         anisotropic >= 1 && anisotropic <= limits.maxAnisotropic,
        'aniso samples must be between 1 and ');
      info.anisotropic = options.anisotropic;
    }

    if ('mipmap' in options) {
      var hasMipMap = false;
      switch (typeof options.mipmap) {
        case 'string':
          check$1.parameter(options.mipmap, mipmapHint,
            'invalid mipmap hint');
          info.mipmapHint = mipmapHint[options.mipmap];
          info.genMipmaps = true;
          hasMipMap = true;
          break

        case 'boolean':
          hasMipMap = info.genMipmaps = options.mipmap;
          break

        case 'object':
          check$1(Array.isArray(options.mipmap), 'invalid mipmap type');
          info.genMipmaps = false;
          hasMipMap = true;
          break

        default:
          check$1.raise('invalid mipmap type');
      }
      if (hasMipMap && !('min' in options)) {
        info.minFilter = GL_NEAREST_MIPMAP_NEAREST$1;
      }
    }
  }

  function setTexInfo (info, target) {
    gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, info.minFilter);
    gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, info.magFilter);
    gl.texParameteri(target, GL_TEXTURE_WRAP_S, info.wrapS);
    gl.texParameteri(target, GL_TEXTURE_WRAP_T, info.wrapT);
    if (extensions.ext_texture_filter_anisotropic) {
      gl.texParameteri(target, GL_TEXTURE_MAX_ANISOTROPY_EXT, info.anisotropic);
    }
    if (info.genMipmaps) {
      gl.hint(GL_GENERATE_MIPMAP_HINT, info.mipmapHint);
      gl.generateMipmap(target);
    }
  }

  // -------------------------------------------------------
  // Full texture object
  // -------------------------------------------------------
  var textureCount = 0;
  var textureSet = {};
  var numTexUnits = limits.maxTextureUnits;
  var textureUnits = Array(numTexUnits).map(function () {
    return null
  });

  function REGLTexture (target) {
    TexFlags.call(this);
    this.mipmask = 0;
    this.internalformat = GL_RGBA$1;

    this.id = textureCount++;

    this.refCount = 1;

    this.target = target;
    this.texture = gl.createTexture();

    this.unit = -1;
    this.bindCount = 0;

    this.texInfo = new TexInfo();

    if (config.profile) {
      this.stats = {size: 0};
    }
  }

  function tempBind (texture) {
    gl.activeTexture(GL_TEXTURE0$1);
    gl.bindTexture(texture.target, texture.texture);
  }

  function tempRestore () {
    var prev = textureUnits[0];
    if (prev) {
      gl.bindTexture(prev.target, prev.texture);
    } else {
      gl.bindTexture(GL_TEXTURE_2D$1, null);
    }
  }

  function destroy (texture) {
    var handle = texture.texture;
    check$1(handle, 'must not double destroy texture');
    var unit = texture.unit;
    var target = texture.target;
    if (unit >= 0) {
      gl.activeTexture(GL_TEXTURE0$1 + unit);
      gl.bindTexture(target, null);
      textureUnits[unit] = null;
    }
    gl.deleteTexture(handle);
    texture.texture = null;
    texture.params = null;
    texture.pixels = null;
    texture.refCount = 0;
    delete textureSet[texture.id];
    stats.textureCount--;
  }

  extend(REGLTexture.prototype, {
    bind: function () {
      var texture = this;
      texture.bindCount += 1;
      var unit = texture.unit;
      if (unit < 0) {
        for (var i = 0; i < numTexUnits; ++i) {
          var other = textureUnits[i];
          if (other) {
            if (other.bindCount > 0) {
              continue
            }
            other.unit = -1;
          }
          textureUnits[i] = texture;
          unit = i;
          break
        }
        if (unit >= numTexUnits) {
          check$1.raise('insufficient number of texture units');
        }
        if (config.profile && stats.maxTextureUnits < (unit + 1)) {
          stats.maxTextureUnits = unit + 1; // +1, since the units are zero-based
        }
        texture.unit = unit;
        gl.activeTexture(GL_TEXTURE0$1 + unit);
        gl.bindTexture(texture.target, texture.texture);
      }
      return unit
    },

    unbind: function () {
      this.bindCount -= 1;
    },

    decRef: function () {
      if (--this.refCount <= 0) {
        destroy(this);
      }
    }
  });

  function createTexture2D (a, b) {
    var texture = new REGLTexture(GL_TEXTURE_2D$1);
    textureSet[texture.id] = texture;
    stats.textureCount++;

    function reglTexture2D (a, b) {
      var texInfo = texture.texInfo;
      TexInfo.call(texInfo);
      var mipData = allocMipMap();

      if (typeof a === 'number') {
        if (typeof b === 'number') {
          parseMipMapFromShape(mipData, a | 0, b | 0);
        } else {
          parseMipMapFromShape(mipData, a | 0, a | 0);
        }
      } else if (a) {
        check$1.type(a, 'object', 'invalid arguments to regl.texture');
        parseTexInfo(texInfo, a);
        parseMipMapFromObject(mipData, a);
      } else {
        // empty textures get assigned a default shape of 1x1
        parseMipMapFromShape(mipData, 1, 1);
      }

      if (texInfo.genMipmaps) {
        mipData.mipmask = (mipData.width << 1) - 1;
      }
      texture.mipmask = mipData.mipmask;

      copyFlags(texture, mipData);

      check$1.texture2D(texInfo, mipData, limits);
      texture.internalformat = mipData.internalformat;

      reglTexture2D.width = mipData.width;
      reglTexture2D.height = mipData.height;

      tempBind(texture);
      setMipMap(mipData, GL_TEXTURE_2D$1);
      setTexInfo(texInfo, GL_TEXTURE_2D$1);
      tempRestore();

      freeMipMap(mipData);

      if (config.profile) {
        texture.stats.size = getTextureSize(
          texture.internalformat,
          texture.type,
          mipData.width,
          mipData.height,
          texInfo.genMipmaps,
          false);
      }
      reglTexture2D.format = textureFormatsInvert[texture.internalformat];
      reglTexture2D.type = textureTypesInvert[texture.type];

      reglTexture2D.mag = magFiltersInvert[texInfo.magFilter];
      reglTexture2D.min = minFiltersInvert[texInfo.minFilter];

      reglTexture2D.wrapS = wrapModesInvert[texInfo.wrapS];
      reglTexture2D.wrapT = wrapModesInvert[texInfo.wrapT];

      return reglTexture2D
    }

    function subimage (image, x_, y_, level_) {
      check$1(!!image, 'must specify image data');

      var x = x_ | 0;
      var y = y_ | 0;
      var level = level_ | 0;

      var imageData = allocImage();
      copyFlags(imageData, texture);
      imageData.width = 0;
      imageData.height = 0;
      parseImage(imageData, image);
      imageData.width = imageData.width || ((texture.width >> level) - x);
      imageData.height = imageData.height || ((texture.height >> level) - y);

      check$1(
        texture.type === imageData.type &&
        texture.format === imageData.format &&
        texture.internalformat === imageData.internalformat,
        'incompatible format for texture.subimage');
      check$1(
        x >= 0 && y >= 0 &&
        x + imageData.width <= texture.width &&
        y + imageData.height <= texture.height,
        'texture.subimage write out of bounds');
      check$1(
        texture.mipmask & (1 << level),
        'missing mipmap data');
      check$1(
        imageData.data || imageData.element || imageData.needsCopy,
        'missing image data');

      tempBind(texture);
      setSubImage(imageData, GL_TEXTURE_2D$1, x, y, level);
      tempRestore();

      freeImage(imageData);

      return reglTexture2D
    }

    function resize (w_, h_) {
      var w = w_ | 0;
      var h = (h_ | 0) || w;
      if (w === texture.width && h === texture.height) {
        return reglTexture2D
      }

      reglTexture2D.width = texture.width = w;
      reglTexture2D.height = texture.height = h;

      tempBind(texture);

      var data;
      var channels = texture.channels;
      var type = texture.type;

      for (var i = 0; texture.mipmask >> i; ++i) {
        var _w = w >> i;
        var _h = h >> i;
        if (!_w || !_h) break
        data = pool.zero.allocType(type, _w * _h * channels);
        gl.texImage2D(
          GL_TEXTURE_2D$1,
          i,
          texture.format,
          _w,
          _h,
          0,
          texture.format,
          texture.type,
          data);
        if (data) pool.zero.freeType(data);
      }
      tempRestore();

      // also, recompute the texture size.
      if (config.profile) {
        texture.stats.size = getTextureSize(
          texture.internalformat,
          texture.type,
          w,
          h,
          false,
          false);
      }

      return reglTexture2D
    }

    reglTexture2D(a, b);

    reglTexture2D.subimage = subimage;
    reglTexture2D.resize = resize;
    reglTexture2D._reglType = 'texture2d';
    reglTexture2D._texture = texture;
    if (config.profile) {
      reglTexture2D.stats = texture.stats;
    }
    reglTexture2D.destroy = function () {
      texture.decRef();
    };

    return reglTexture2D
  }

  function createTextureCube (a0, a1, a2, a3, a4, a5) {
    var texture = new REGLTexture(GL_TEXTURE_CUBE_MAP$1);
    textureSet[texture.id] = texture;
    stats.cubeCount++;

    var faces = new Array(6);

    function reglTextureCube (a0, a1, a2, a3, a4, a5) {
      var i;
      var texInfo = texture.texInfo;
      TexInfo.call(texInfo);
      for (i = 0; i < 6; ++i) {
        faces[i] = allocMipMap();
      }

      if (typeof a0 === 'number' || !a0) {
        var s = (a0 | 0) || 1;
        for (i = 0; i < 6; ++i) {
          parseMipMapFromShape(faces[i], s, s);
        }
      } else if (typeof a0 === 'object') {
        if (a1) {
          parseMipMapFromObject(faces[0], a0);
          parseMipMapFromObject(faces[1], a1);
          parseMipMapFromObject(faces[2], a2);
          parseMipMapFromObject(faces[3], a3);
          parseMipMapFromObject(faces[4], a4);
          parseMipMapFromObject(faces[5], a5);
        } else {
          parseTexInfo(texInfo, a0);
          parseFlags(texture, a0);
          if ('faces' in a0) {
            var face_input = a0.faces;
            check$1(Array.isArray(face_input) && face_input.length === 6,
              'cube faces must be a length 6 array');
            for (i = 0; i < 6; ++i) {
              check$1(typeof face_input[i] === 'object' && !!face_input[i],
                'invalid input for cube map face');
              copyFlags(faces[i], texture);
              parseMipMapFromObject(faces[i], face_input[i]);
            }
          } else {
            for (i = 0; i < 6; ++i) {
              parseMipMapFromObject(faces[i], a0);
            }
          }
        }
      } else {
        check$1.raise('invalid arguments to cube map');
      }

      copyFlags(texture, faces[0]);

      if (!limits.npotTextureCube) {
        check$1(isPow2$1(texture.width) && isPow2$1(texture.height), 'your browser does not support non power or two texture dimensions');
      }

      if (texInfo.genMipmaps) {
        texture.mipmask = (faces[0].width << 1) - 1;
      } else {
        texture.mipmask = faces[0].mipmask;
      }

      check$1.textureCube(texture, texInfo, faces, limits);
      texture.internalformat = faces[0].internalformat;

      reglTextureCube.width = faces[0].width;
      reglTextureCube.height = faces[0].height;

      tempBind(texture);
      for (i = 0; i < 6; ++i) {
        setMipMap(faces[i], GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i);
      }
      setTexInfo(texInfo, GL_TEXTURE_CUBE_MAP$1);
      tempRestore();

      if (config.profile) {
        texture.stats.size = getTextureSize(
          texture.internalformat,
          texture.type,
          reglTextureCube.width,
          reglTextureCube.height,
          texInfo.genMipmaps,
          true);
      }

      reglTextureCube.format = textureFormatsInvert[texture.internalformat];
      reglTextureCube.type = textureTypesInvert[texture.type];

      reglTextureCube.mag = magFiltersInvert[texInfo.magFilter];
      reglTextureCube.min = minFiltersInvert[texInfo.minFilter];

      reglTextureCube.wrapS = wrapModesInvert[texInfo.wrapS];
      reglTextureCube.wrapT = wrapModesInvert[texInfo.wrapT];

      for (i = 0; i < 6; ++i) {
        freeMipMap(faces[i]);
      }

      return reglTextureCube
    }

    function subimage (face, image, x_, y_, level_) {
      check$1(!!image, 'must specify image data');
      check$1(typeof face === 'number' && face === (face | 0) &&
        face >= 0 && face < 6, 'invalid face');

      var x = x_ | 0;
      var y = y_ | 0;
      var level = level_ | 0;

      var imageData = allocImage();
      copyFlags(imageData, texture);
      imageData.width = 0;
      imageData.height = 0;
      parseImage(imageData, image);
      imageData.width = imageData.width || ((texture.width >> level) - x);
      imageData.height = imageData.height || ((texture.height >> level) - y);

      check$1(
        texture.type === imageData.type &&
        texture.format === imageData.format &&
        texture.internalformat === imageData.internalformat,
        'incompatible format for texture.subimage');
      check$1(
        x >= 0 && y >= 0 &&
        x + imageData.width <= texture.width &&
        y + imageData.height <= texture.height,
        'texture.subimage write out of bounds');
      check$1(
        texture.mipmask & (1 << level),
        'missing mipmap data');
      check$1(
        imageData.data || imageData.element || imageData.needsCopy,
        'missing image data');

      tempBind(texture);
      setSubImage(imageData, GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + face, x, y, level);
      tempRestore();

      freeImage(imageData);

      return reglTextureCube
    }

    function resize (radius_) {
      var radius = radius_ | 0;
      if (radius === texture.width) {
        return
      }

      reglTextureCube.width = texture.width = radius;
      reglTextureCube.height = texture.height = radius;

      tempBind(texture);
      for (var i = 0; i < 6; ++i) {
        for (var j = 0; texture.mipmask >> j; ++j) {
          gl.texImage2D(
            GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i,
            j,
            texture.format,
            radius >> j,
            radius >> j,
            0,
            texture.format,
            texture.type,
            null);
        }
      }
      tempRestore();

      if (config.profile) {
        texture.stats.size = getTextureSize(
          texture.internalformat,
          texture.type,
          reglTextureCube.width,
          reglTextureCube.height,
          false,
          true);
      }

      return reglTextureCube
    }

    reglTextureCube(a0, a1, a2, a3, a4, a5);

    reglTextureCube.subimage = subimage;
    reglTextureCube.resize = resize;
    reglTextureCube._reglType = 'textureCube';
    reglTextureCube._texture = texture;
    if (config.profile) {
      reglTextureCube.stats = texture.stats;
    }
    reglTextureCube.destroy = function () {
      texture.decRef();
    };

    return reglTextureCube
  }

  // Called when regl is destroyed
  function destroyTextures () {
    for (var i = 0; i < numTexUnits; ++i) {
      gl.activeTexture(GL_TEXTURE0$1 + i);
      gl.bindTexture(GL_TEXTURE_2D$1, null);
      textureUnits[i] = null;
    }
    values(textureSet).forEach(destroy);

    stats.cubeCount = 0;
    stats.textureCount = 0;
  }

  if (config.profile) {
    stats.getTotalTextureSize = function () {
      var total = 0;
      Object.keys(textureSet).forEach(function (key) {
        total += textureSet[key].stats.size;
      });
      return total
    };
  }

  function restoreTextures () {
    for (var i = 0; i < numTexUnits; ++i) {
      var tex = textureUnits[i];
      if (tex) {
        tex.bindCount = 0;
        tex.unit = -1;
        textureUnits[i] = null;
      }
    }

    values(textureSet).forEach(function (texture) {
      texture.texture = gl.createTexture();
      gl.bindTexture(texture.target, texture.texture);
      for (var i = 0; i < 32; ++i) {
        if ((texture.mipmask & (1 << i)) === 0) {
          continue
        }
        if (texture.target === GL_TEXTURE_2D$1) {
          gl.texImage2D(GL_TEXTURE_2D$1,
            i,
            texture.internalformat,
            texture.width >> i,
            texture.height >> i,
            0,
            texture.internalformat,
            texture.type,
            null);
        } else {
          for (var j = 0; j < 6; ++j) {
            gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + j,
              i,
              texture.internalformat,
              texture.width >> i,
              texture.height >> i,
              0,
              texture.internalformat,
              texture.type,
              null);
          }
        }
      }
      setTexInfo(texture.texInfo, texture.target);
    });
  }

  return {
    create2D: createTexture2D,
    createCube: createTextureCube,
    clear: destroyTextures,
    getTexture: function (wrapper) {
      return null
    },
    restore: restoreTextures
  }
}

var GL_RENDERBUFFER = 0x8D41;

var GL_RGBA4$1 = 0x8056;
var GL_RGB5_A1$1 = 0x8057;
var GL_RGB565$1 = 0x8D62;
var GL_DEPTH_COMPONENT16 = 0x81A5;
var GL_STENCIL_INDEX8 = 0x8D48;
var GL_DEPTH_STENCIL$1 = 0x84F9;

var GL_SRGB8_ALPHA8_EXT = 0x8C43;

var GL_RGBA32F_EXT = 0x8814;

var GL_RGBA16F_EXT = 0x881A;
var GL_RGB16F_EXT = 0x881B;

var FORMAT_SIZES = [];

FORMAT_SIZES[GL_RGBA4$1] = 2;
FORMAT_SIZES[GL_RGB5_A1$1] = 2;
FORMAT_SIZES[GL_RGB565$1] = 2;

FORMAT_SIZES[GL_DEPTH_COMPONENT16] = 2;
FORMAT_SIZES[GL_STENCIL_INDEX8] = 1;
FORMAT_SIZES[GL_DEPTH_STENCIL$1] = 4;

FORMAT_SIZES[GL_SRGB8_ALPHA8_EXT] = 4;
FORMAT_SIZES[GL_RGBA32F_EXT] = 16;
FORMAT_SIZES[GL_RGBA16F_EXT] = 8;
FORMAT_SIZES[GL_RGB16F_EXT] = 6;

function getRenderbufferSize (format, width, height) {
  return FORMAT_SIZES[format] * width * height
}

var wrapRenderbuffers = function (gl, extensions, limits, stats, config) {
  var formatTypes = {
    'rgba4': GL_RGBA4$1,
    'rgb565': GL_RGB565$1,
    'rgb5 a1': GL_RGB5_A1$1,
    'depth': GL_DEPTH_COMPONENT16,
    'stencil': GL_STENCIL_INDEX8,
    'depth stencil': GL_DEPTH_STENCIL$1
  };

  if (extensions.ext_srgb) {
    formatTypes['srgba'] = GL_SRGB8_ALPHA8_EXT;
  }

  if (extensions.ext_color_buffer_half_float) {
    formatTypes['rgba16f'] = GL_RGBA16F_EXT;
    formatTypes['rgb16f'] = GL_RGB16F_EXT;
  }

  if (extensions.webgl_color_buffer_float) {
    formatTypes['rgba32f'] = GL_RGBA32F_EXT;
  }

  var formatTypesInvert = [];
  Object.keys(formatTypes).forEach(function (key) {
    var val = formatTypes[key];
    formatTypesInvert[val] = key;
  });

  var renderbufferCount = 0;
  var renderbufferSet = {};

  function REGLRenderbuffer (renderbuffer) {
    this.id = renderbufferCount++;
    this.refCount = 1;

    this.renderbuffer = renderbuffer;

    this.format = GL_RGBA4$1;
    this.width = 0;
    this.height = 0;

    if (config.profile) {
      this.stats = {size: 0};
    }
  }

  REGLRenderbuffer.prototype.decRef = function () {
    if (--this.refCount <= 0) {
      destroy(this);
    }
  };

  function destroy (rb) {
    var handle = rb.renderbuffer;
    check$1(handle, 'must not double destroy renderbuffer');
    gl.bindRenderbuffer(GL_RENDERBUFFER, null);
    gl.deleteRenderbuffer(handle);
    rb.renderbuffer = null;
    rb.refCount = 0;
    delete renderbufferSet[rb.id];
    stats.renderbufferCount--;
  }

  function createRenderbuffer (a, b) {
    var renderbuffer = new REGLRenderbuffer(gl.createRenderbuffer());
    renderbufferSet[renderbuffer.id] = renderbuffer;
    stats.renderbufferCount++;

    function reglRenderbuffer (a, b) {
      var w = 0;
      var h = 0;
      var format = GL_RGBA4$1;

      if (typeof a === 'object' && a) {
        var options = a;
        if ('shape' in options) {
          var shape = options.shape;
          check$1(Array.isArray(shape) && shape.length >= 2,
            'invalid renderbuffer shape');
          w = shape[0] | 0;
          h = shape[1] | 0;
        } else {
          if ('radius' in options) {
            w = h = options.radius | 0;
          }
          if ('width' in options) {
            w = options.width | 0;
          }
          if ('height' in options) {
            h = options.height | 0;
          }
        }
        if ('format' in options) {
          check$1.parameter(options.format, formatTypes,
            'invalid renderbuffer format');
          format = formatTypes[options.format];
        }
      } else if (typeof a === 'number') {
        w = a | 0;
        if (typeof b === 'number') {
          h = b | 0;
        } else {
          h = w;
        }
      } else if (!a) {
        w = h = 1;
      } else {
        check$1.raise('invalid arguments to renderbuffer constructor');
      }

      // check shape
      check$1(
        w > 0 && h > 0 &&
        w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
        'invalid renderbuffer size');

      if (w === renderbuffer.width &&
          h === renderbuffer.height &&
          format === renderbuffer.format) {
        return
      }

      reglRenderbuffer.width = renderbuffer.width = w;
      reglRenderbuffer.height = renderbuffer.height = h;
      renderbuffer.format = format;

      gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
      gl.renderbufferStorage(GL_RENDERBUFFER, format, w, h);

      check$1(
        gl.getError() === 0,
        'invalid render buffer format');

      if (config.profile) {
        renderbuffer.stats.size = getRenderbufferSize(renderbuffer.format, renderbuffer.width, renderbuffer.height);
      }
      reglRenderbuffer.format = formatTypesInvert[renderbuffer.format];

      return reglRenderbuffer
    }

    function resize (w_, h_) {
      var w = w_ | 0;
      var h = (h_ | 0) || w;

      if (w === renderbuffer.width && h === renderbuffer.height) {
        return reglRenderbuffer
      }

      // check shape
      check$1(
        w > 0 && h > 0 &&
        w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
        'invalid renderbuffer size');

      reglRenderbuffer.width = renderbuffer.width = w;
      reglRenderbuffer.height = renderbuffer.height = h;

      gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
      gl.renderbufferStorage(GL_RENDERBUFFER, renderbuffer.format, w, h);

      check$1(
        gl.getError() === 0,
        'invalid render buffer format');

      // also, recompute size.
      if (config.profile) {
        renderbuffer.stats.size = getRenderbufferSize(
          renderbuffer.format, renderbuffer.width, renderbuffer.height);
      }

      return reglRenderbuffer
    }

    reglRenderbuffer(a, b);

    reglRenderbuffer.resize = resize;
    reglRenderbuffer._reglType = 'renderbuffer';
    reglRenderbuffer._renderbuffer = renderbuffer;
    if (config.profile) {
      reglRenderbuffer.stats = renderbuffer.stats;
    }
    reglRenderbuffer.destroy = function () {
      renderbuffer.decRef();
    };

    return reglRenderbuffer
  }

  if (config.profile) {
    stats.getTotalRenderbufferSize = function () {
      var total = 0;
      Object.keys(renderbufferSet).forEach(function (key) {
        total += renderbufferSet[key].stats.size;
      });
      return total
    };
  }

  function restoreRenderbuffers () {
    values(renderbufferSet).forEach(function (rb) {
      rb.renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(GL_RENDERBUFFER, rb.renderbuffer);
      gl.renderbufferStorage(GL_RENDERBUFFER, rb.format, rb.width, rb.height);
    });
    gl.bindRenderbuffer(GL_RENDERBUFFER, null);
  }

  return {
    create: createRenderbuffer,
    clear: function () {
      values(renderbufferSet).forEach(destroy);
    },
    restore: restoreRenderbuffers
  }
};

// We store these constants so that the minifier can inline them
var GL_FRAMEBUFFER$1 = 0x8D40;
var GL_RENDERBUFFER$1 = 0x8D41;

var GL_TEXTURE_2D$2 = 0x0DE1;
var GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 = 0x8515;

var GL_COLOR_ATTACHMENT0$1 = 0x8CE0;
var GL_DEPTH_ATTACHMENT = 0x8D00;
var GL_STENCIL_ATTACHMENT = 0x8D20;
var GL_DEPTH_STENCIL_ATTACHMENT = 0x821A;

var GL_FRAMEBUFFER_COMPLETE$1 = 0x8CD5;
var GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
var GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
var GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
var GL_FRAMEBUFFER_UNSUPPORTED = 0x8CDD;

var GL_HALF_FLOAT_OES$2 = 0x8D61;
var GL_UNSIGNED_BYTE$6 = 0x1401;
var GL_FLOAT$5 = 0x1406;

var GL_RGB$1 = 0x1907;
var GL_RGBA$2 = 0x1908;

var GL_DEPTH_COMPONENT$1 = 0x1902;

var colorTextureFormatEnums = [
  GL_RGB$1,
  GL_RGBA$2
];

// for every texture format, store
// the number of channels
var textureFormatChannels = [];
textureFormatChannels[GL_RGBA$2] = 4;
textureFormatChannels[GL_RGB$1] = 3;

// for every texture type, store
// the size in bytes.
var textureTypeSizes = [];
textureTypeSizes[GL_UNSIGNED_BYTE$6] = 1;
textureTypeSizes[GL_FLOAT$5] = 4;
textureTypeSizes[GL_HALF_FLOAT_OES$2] = 2;

var GL_RGBA4$2 = 0x8056;
var GL_RGB5_A1$2 = 0x8057;
var GL_RGB565$2 = 0x8D62;
var GL_DEPTH_COMPONENT16$1 = 0x81A5;
var GL_STENCIL_INDEX8$1 = 0x8D48;
var GL_DEPTH_STENCIL$2 = 0x84F9;

var GL_SRGB8_ALPHA8_EXT$1 = 0x8C43;

var GL_RGBA32F_EXT$1 = 0x8814;

var GL_RGBA16F_EXT$1 = 0x881A;
var GL_RGB16F_EXT$1 = 0x881B;

var colorRenderbufferFormatEnums = [
  GL_RGBA4$2,
  GL_RGB5_A1$2,
  GL_RGB565$2,
  GL_SRGB8_ALPHA8_EXT$1,
  GL_RGBA16F_EXT$1,
  GL_RGB16F_EXT$1,
  GL_RGBA32F_EXT$1
];

var statusCode = {};
statusCode[GL_FRAMEBUFFER_COMPLETE$1] = 'complete';
statusCode[GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = 'incomplete attachment';
statusCode[GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = 'incomplete dimensions';
statusCode[GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = 'incomplete, missing attachment';
statusCode[GL_FRAMEBUFFER_UNSUPPORTED] = 'unsupported';

function wrapFBOState (
  gl,
  extensions,
  limits,
  textureState,
  renderbufferState,
  stats) {
  var framebufferState = {
    cur: null,
    next: null,
    dirty: false,
    setFBO: null
  };

  var colorTextureFormats = ['rgba'];
  var colorRenderbufferFormats = ['rgba4', 'rgb565', 'rgb5 a1'];

  if (extensions.ext_srgb) {
    colorRenderbufferFormats.push('srgba');
  }

  if (extensions.ext_color_buffer_half_float) {
    colorRenderbufferFormats.push('rgba16f', 'rgb16f');
  }

  if (extensions.webgl_color_buffer_float) {
    colorRenderbufferFormats.push('rgba32f');
  }

  var colorTypes = ['uint8'];
  if (extensions.oes_texture_half_float) {
    colorTypes.push('half float', 'float16');
  }
  if (extensions.oes_texture_float) {
    colorTypes.push('float', 'float32');
  }

  function FramebufferAttachment (target, texture, renderbuffer) {
    this.target = target;
    this.texture = texture;
    this.renderbuffer = renderbuffer;

    var w = 0;
    var h = 0;
    if (texture) {
      w = texture.width;
      h = texture.height;
    } else if (renderbuffer) {
      w = renderbuffer.width;
      h = renderbuffer.height;
    }
    this.width = w;
    this.height = h;
  }

  function decRef (attachment) {
    if (attachment) {
      if (attachment.texture) {
        attachment.texture._texture.decRef();
      }
      if (attachment.renderbuffer) {
        attachment.renderbuffer._renderbuffer.decRef();
      }
    }
  }

  function incRefAndCheckShape (attachment, width, height) {
    if (!attachment) {
      return
    }
    if (attachment.texture) {
      var texture = attachment.texture._texture;
      var tw = Math.max(1, texture.width);
      var th = Math.max(1, texture.height);
      check$1(tw === width && th === height,
        'inconsistent width/height for supplied texture');
      texture.refCount += 1;
    } else {
      var renderbuffer = attachment.renderbuffer._renderbuffer;
      check$1(
        renderbuffer.width === width && renderbuffer.height === height,
        'inconsistent width/height for renderbuffer');
      renderbuffer.refCount += 1;
    }
  }

  function attach (location, attachment) {
    if (attachment) {
      if (attachment.texture) {
        gl.framebufferTexture2D(
          GL_FRAMEBUFFER$1,
          location,
          attachment.target,
          attachment.texture._texture.texture,
          0);
      } else {
        gl.framebufferRenderbuffer(
          GL_FRAMEBUFFER$1,
          location,
          GL_RENDERBUFFER$1,
          attachment.renderbuffer._renderbuffer.renderbuffer);
      }
    }
  }

  function parseAttachment (attachment) {
    var target = GL_TEXTURE_2D$2;
    var texture = null;
    var renderbuffer = null;

    var data = attachment;
    if (typeof attachment === 'object') {
      data = attachment.data;
      if ('target' in attachment) {
        target = attachment.target | 0;
      }
    }

    check$1.type(data, 'function', 'invalid attachment data');

    var type = data._reglType;
    if (type === 'texture2d') {
      texture = data;
      check$1(target === GL_TEXTURE_2D$2);
    } else if (type === 'textureCube') {
      texture = data;
      check$1(
        target >= GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 &&
        target < GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + 6,
        'invalid cube map target');
    } else if (type === 'renderbuffer') {
      renderbuffer = data;
      target = GL_RENDERBUFFER$1;
    } else {
      check$1.raise('invalid regl object for attachment');
    }

    return new FramebufferAttachment(target, texture, renderbuffer)
  }

  function allocAttachment (
    width,
    height,
    isTexture,
    format,
    type) {
    if (isTexture) {
      var texture = textureState.create2D({
        width: width,
        height: height,
        format: format,
        type: type
      });
      texture._texture.refCount = 0;
      return new FramebufferAttachment(GL_TEXTURE_2D$2, texture, null)
    } else {
      var rb = renderbufferState.create({
        width: width,
        height: height,
        format: format
      });
      rb._renderbuffer.refCount = 0;
      return new FramebufferAttachment(GL_RENDERBUFFER$1, null, rb)
    }
  }

  function unwrapAttachment (attachment) {
    return attachment && (attachment.texture || attachment.renderbuffer)
  }

  function resizeAttachment (attachment, w, h) {
    if (attachment) {
      if (attachment.texture) {
        attachment.texture.resize(w, h);
      } else if (attachment.renderbuffer) {
        attachment.renderbuffer.resize(w, h);
      }
      attachment.width = w;
      attachment.height = h;
    }
  }

  var framebufferCount = 0;
  var framebufferSet = {};

  function REGLFramebuffer () {
    this.id = framebufferCount++;
    framebufferSet[this.id] = this;

    this.framebuffer = gl.createFramebuffer();
    this.width = 0;
    this.height = 0;

    this.colorAttachments = [];
    this.depthAttachment = null;
    this.stencilAttachment = null;
    this.depthStencilAttachment = null;
  }

  function decFBORefs (framebuffer) {
    framebuffer.colorAttachments.forEach(decRef);
    decRef(framebuffer.depthAttachment);
    decRef(framebuffer.stencilAttachment);
    decRef(framebuffer.depthStencilAttachment);
  }

  function destroy (framebuffer) {
    var handle = framebuffer.framebuffer;
    check$1(handle, 'must not double destroy framebuffer');
    gl.deleteFramebuffer(handle);
    framebuffer.framebuffer = null;
    stats.framebufferCount--;
    delete framebufferSet[framebuffer.id];
  }

  function updateFramebuffer (framebuffer) {
    var i;

    gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebuffer.framebuffer);
    var colorAttachments = framebuffer.colorAttachments;
    for (i = 0; i < colorAttachments.length; ++i) {
      attach(GL_COLOR_ATTACHMENT0$1 + i, colorAttachments[i]);
    }
    for (i = colorAttachments.length; i < limits.maxColorAttachments; ++i) {
      gl.framebufferTexture2D(
        GL_FRAMEBUFFER$1,
        GL_COLOR_ATTACHMENT0$1 + i,
        GL_TEXTURE_2D$2,
        null,
        0);
    }

    gl.framebufferTexture2D(
      GL_FRAMEBUFFER$1,
      GL_DEPTH_STENCIL_ATTACHMENT,
      GL_TEXTURE_2D$2,
      null,
      0);
    gl.framebufferTexture2D(
      GL_FRAMEBUFFER$1,
      GL_DEPTH_ATTACHMENT,
      GL_TEXTURE_2D$2,
      null,
      0);
    gl.framebufferTexture2D(
      GL_FRAMEBUFFER$1,
      GL_STENCIL_ATTACHMENT,
      GL_TEXTURE_2D$2,
      null,
      0);

    attach(GL_DEPTH_ATTACHMENT, framebuffer.depthAttachment);
    attach(GL_STENCIL_ATTACHMENT, framebuffer.stencilAttachment);
    attach(GL_DEPTH_STENCIL_ATTACHMENT, framebuffer.depthStencilAttachment);

    // Check status code
    var status = gl.checkFramebufferStatus(GL_FRAMEBUFFER$1);
    if (!gl.isContextLost() && status !== GL_FRAMEBUFFER_COMPLETE$1) {
      check$1.raise('framebuffer configuration not supported, status = ' +
        statusCode[status]);
    }

    gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebufferState.next ? framebufferState.next.framebuffer : null);
    framebufferState.cur = framebufferState.next;

    // FIXME: Clear error code here.  This is a work around for a bug in
    // headless-gl
    gl.getError();
  }

  function createFBO (a0, a1) {
    var framebuffer = new REGLFramebuffer();
    stats.framebufferCount++;

    function reglFramebuffer (a, b) {
      var i;

      check$1(framebufferState.next !== framebuffer,
        'can not update framebuffer which is currently in use');

      var width = 0;
      var height = 0;

      var needsDepth = true;
      var needsStencil = true;

      var colorBuffer = null;
      var colorTexture = true;
      var colorFormat = 'rgba';
      var colorType = 'uint8';
      var colorCount = 1;

      var depthBuffer = null;
      var stencilBuffer = null;
      var depthStencilBuffer = null;
      var depthStencilTexture = false;

      if (typeof a === 'number') {
        width = a | 0;
        height = (b | 0) || width;
      } else if (!a) {
        width = height = 1;
      } else {
        check$1.type(a, 'object', 'invalid arguments for framebuffer');
        var options = a;

        if ('shape' in options) {
          var shape = options.shape;
          check$1(Array.isArray(shape) && shape.length >= 2,
            'invalid shape for framebuffer');
          width = shape[0];
          height = shape[1];
        } else {
          if ('radius' in options) {
            width = height = options.radius;
          }
          if ('width' in options) {
            width = options.width;
          }
          if ('height' in options) {
            height = options.height;
          }
        }

        if ('color' in options ||
            'colors' in options) {
          colorBuffer =
            options.color ||
            options.colors;
          if (Array.isArray(colorBuffer)) {
            check$1(
              colorBuffer.length === 1 || extensions.webgl_draw_buffers,
              'multiple render targets not supported');
          }
        }

        if (!colorBuffer) {
          if ('colorCount' in options) {
            colorCount = options.colorCount | 0;
            check$1(colorCount > 0, 'invalid color buffer count');
          }

          if ('colorTexture' in options) {
            colorTexture = !!options.colorTexture;
            colorFormat = 'rgba4';
          }

          if ('colorType' in options) {
            colorType = options.colorType;
            if (!colorTexture) {
              if (colorType === 'half float' || colorType === 'float16') {
                check$1(extensions.ext_color_buffer_half_float,
                  'you must enable EXT_color_buffer_half_float to use 16-bit render buffers');
                colorFormat = 'rgba16f';
              } else if (colorType === 'float' || colorType === 'float32') {
                check$1(extensions.webgl_color_buffer_float,
                  'you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers');
                colorFormat = 'rgba32f';
              }
            } else {
              check$1(extensions.oes_texture_float ||
                !(colorType === 'float' || colorType === 'float32'),
                'you must enable OES_texture_float in order to use floating point framebuffer objects');
              check$1(extensions.oes_texture_half_float ||
                !(colorType === 'half float' || colorType === 'float16'),
                'you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects');
            }
            check$1.oneOf(colorType, colorTypes, 'invalid color type');
          }

          if ('colorFormat' in options) {
            colorFormat = options.colorFormat;
            if (colorTextureFormats.indexOf(colorFormat) >= 0) {
              colorTexture = true;
            } else if (colorRenderbufferFormats.indexOf(colorFormat) >= 0) {
              colorTexture = false;
            } else {
              if (colorTexture) {
                check$1.oneOf(
                  options.colorFormat, colorTextureFormats,
                  'invalid color format for texture');
              } else {
                check$1.oneOf(
                  options.colorFormat, colorRenderbufferFormats,
                  'invalid color format for renderbuffer');
              }
            }
          }
        }

        if ('depthTexture' in options || 'depthStencilTexture' in options) {
          depthStencilTexture = !!(options.depthTexture ||
            options.depthStencilTexture);
          check$1(!depthStencilTexture || extensions.webgl_depth_texture,
            'webgl_depth_texture extension not supported');
        }

        if ('depth' in options) {
          if (typeof options.depth === 'boolean') {
            needsDepth = options.depth;
          } else {
            depthBuffer = options.depth;
            needsStencil = false;
          }
        }

        if ('stencil' in options) {
          if (typeof options.stencil === 'boolean') {
            needsStencil = options.stencil;
          } else {
            stencilBuffer = options.stencil;
            needsDepth = false;
          }
        }

        if ('depthStencil' in options) {
          if (typeof options.depthStencil === 'boolean') {
            needsDepth = needsStencil = options.depthStencil;
          } else {
            depthStencilBuffer = options.depthStencil;
            needsDepth = false;
            needsStencil = false;
          }
        }
      }

      // parse attachments
      var colorAttachments = null;
      var depthAttachment = null;
      var stencilAttachment = null;
      var depthStencilAttachment = null;

      // Set up color attachments
      if (Array.isArray(colorBuffer)) {
        colorAttachments = colorBuffer.map(parseAttachment);
      } else if (colorBuffer) {
        colorAttachments = [parseAttachment(colorBuffer)];
      } else {
        colorAttachments = new Array(colorCount);
        for (i = 0; i < colorCount; ++i) {
          colorAttachments[i] = allocAttachment(
            width,
            height,
            colorTexture,
            colorFormat,
            colorType);
        }
      }

      check$1(extensions.webgl_draw_buffers || colorAttachments.length <= 1,
        'you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers.');
      check$1(colorAttachments.length <= limits.maxColorAttachments,
        'too many color attachments, not supported');

      width = width || colorAttachments[0].width;
      height = height || colorAttachments[0].height;

      if (depthBuffer) {
        depthAttachment = parseAttachment(depthBuffer);
      } else if (needsDepth && !needsStencil) {
        depthAttachment = allocAttachment(
          width,
          height,
          depthStencilTexture,
          'depth',
          'uint32');
      }

      if (stencilBuffer) {
        stencilAttachment = parseAttachment(stencilBuffer);
      } else if (needsStencil && !needsDepth) {
        stencilAttachment = allocAttachment(
          width,
          height,
          false,
          'stencil',
          'uint8');
      }

      if (depthStencilBuffer) {
        depthStencilAttachment = parseAttachment(depthStencilBuffer);
      } else if (!depthBuffer && !stencilBuffer && needsStencil && needsDepth) {
        depthStencilAttachment = allocAttachment(
          width,
          height,
          depthStencilTexture,
          'depth stencil',
          'depth stencil');
      }

      check$1(
        (!!depthBuffer) + (!!stencilBuffer) + (!!depthStencilBuffer) <= 1,
        'invalid framebuffer configuration, can specify exactly one depth/stencil attachment');

      var commonColorAttachmentSize = null;

      for (i = 0; i < colorAttachments.length; ++i) {
        incRefAndCheckShape(colorAttachments[i], width, height);
        check$1(!colorAttachments[i] ||
          (colorAttachments[i].texture &&
            colorTextureFormatEnums.indexOf(colorAttachments[i].texture._texture.format) >= 0) ||
          (colorAttachments[i].renderbuffer &&
            colorRenderbufferFormatEnums.indexOf(colorAttachments[i].renderbuffer._renderbuffer.format) >= 0),
          'framebuffer color attachment ' + i + ' is invalid');

        if (colorAttachments[i] && colorAttachments[i].texture) {
          var colorAttachmentSize =
              textureFormatChannels[colorAttachments[i].texture._texture.format] *
              textureTypeSizes[colorAttachments[i].texture._texture.type];

          if (commonColorAttachmentSize === null) {
            commonColorAttachmentSize = colorAttachmentSize;
          } else {
            // We need to make sure that all color attachments have the same number of bitplanes
            // (that is, the same numer of bits per pixel)
            // This is required by the GLES2.0 standard. See the beginning of Chapter 4 in that document.
            check$1(commonColorAttachmentSize === colorAttachmentSize,
                  'all color attachments much have the same number of bits per pixel.');
          }
        }
      }
      incRefAndCheckShape(depthAttachment, width, height);
      check$1(!depthAttachment ||
        (depthAttachment.texture &&
          depthAttachment.texture._texture.format === GL_DEPTH_COMPONENT$1) ||
        (depthAttachment.renderbuffer &&
          depthAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_COMPONENT16$1),
        'invalid depth attachment for framebuffer object');
      incRefAndCheckShape(stencilAttachment, width, height);
      check$1(!stencilAttachment ||
        (stencilAttachment.renderbuffer &&
          stencilAttachment.renderbuffer._renderbuffer.format === GL_STENCIL_INDEX8$1),
        'invalid stencil attachment for framebuffer object');
      incRefAndCheckShape(depthStencilAttachment, width, height);
      check$1(!depthStencilAttachment ||
        (depthStencilAttachment.texture &&
          depthStencilAttachment.texture._texture.format === GL_DEPTH_STENCIL$2) ||
        (depthStencilAttachment.renderbuffer &&
          depthStencilAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_STENCIL$2),
        'invalid depth-stencil attachment for framebuffer object');

      // decrement references
      decFBORefs(framebuffer);

      framebuffer.width = width;
      framebuffer.height = height;

      framebuffer.colorAttachments = colorAttachments;
      framebuffer.depthAttachment = depthAttachment;
      framebuffer.stencilAttachment = stencilAttachment;
      framebuffer.depthStencilAttachment = depthStencilAttachment;

      reglFramebuffer.color = colorAttachments.map(unwrapAttachment);
      reglFramebuffer.depth = unwrapAttachment(depthAttachment);
      reglFramebuffer.stencil = unwrapAttachment(stencilAttachment);
      reglFramebuffer.depthStencil = unwrapAttachment(depthStencilAttachment);

      reglFramebuffer.width = framebuffer.width;
      reglFramebuffer.height = framebuffer.height;

      updateFramebuffer(framebuffer);

      return reglFramebuffer
    }

    function resize (w_, h_) {
      check$1(framebufferState.next !== framebuffer,
        'can not resize a framebuffer which is currently in use');

      var w = Math.max(w_ | 0, 1);
      var h = Math.max((h_ | 0) || w, 1);
      if (w === framebuffer.width && h === framebuffer.height) {
        return reglFramebuffer
      }

      // resize all buffers
      var colorAttachments = framebuffer.colorAttachments;
      for (var i = 0; i < colorAttachments.length; ++i) {
        resizeAttachment(colorAttachments[i], w, h);
      }
      resizeAttachment(framebuffer.depthAttachment, w, h);
      resizeAttachment(framebuffer.stencilAttachment, w, h);
      resizeAttachment(framebuffer.depthStencilAttachment, w, h);

      framebuffer.width = reglFramebuffer.width = w;
      framebuffer.height = reglFramebuffer.height = h;

      updateFramebuffer(framebuffer);

      return reglFramebuffer
    }

    reglFramebuffer(a0, a1);

    return extend(reglFramebuffer, {
      resize: resize,
      _reglType: 'framebuffer',
      _framebuffer: framebuffer,
      destroy: function () {
        destroy(framebuffer);
        decFBORefs(framebuffer);
      },
      use: function (block) {
        framebufferState.setFBO({
          framebuffer: reglFramebuffer
        }, block);
      }
    })
  }

  function createCubeFBO (options) {
    var faces = Array(6);

    function reglFramebufferCube (a) {
      var i;

      check$1(faces.indexOf(framebufferState.next) < 0,
        'can not update framebuffer which is currently in use');

      var params = {
        color: null
      };

      var radius = 0;

      var colorBuffer = null;
      var colorFormat = 'rgba';
      var colorType = 'uint8';
      var colorCount = 1;

      if (typeof a === 'number') {
        radius = a | 0;
      } else if (!a) {
        radius = 1;
      } else {
        check$1.type(a, 'object', 'invalid arguments for framebuffer');
        var options = a;

        if ('shape' in options) {
          var shape = options.shape;
          check$1(
            Array.isArray(shape) && shape.length >= 2,
            'invalid shape for framebuffer');
          check$1(
            shape[0] === shape[1],
            'cube framebuffer must be square');
          radius = shape[0];
        } else {
          if ('radius' in options) {
            radius = options.radius | 0;
          }
          if ('width' in options) {
            radius = options.width | 0;
            if ('height' in options) {
              check$1(options.height === radius, 'must be square');
            }
          } else if ('height' in options) {
            radius = options.height | 0;
          }
        }

        if ('color' in options ||
            'colors' in options) {
          colorBuffer =
            options.color ||
            options.colors;
          if (Array.isArray(colorBuffer)) {
            check$1(
              colorBuffer.length === 1 || extensions.webgl_draw_buffers,
              'multiple render targets not supported');
          }
        }

        if (!colorBuffer) {
          if ('colorCount' in options) {
            colorCount = options.colorCount | 0;
            check$1(colorCount > 0, 'invalid color buffer count');
          }

          if ('colorType' in options) {
            check$1.oneOf(
              options.colorType, colorTypes,
              'invalid color type');
            colorType = options.colorType;
          }

          if ('colorFormat' in options) {
            colorFormat = options.colorFormat;
            check$1.oneOf(
              options.colorFormat, colorTextureFormats,
              'invalid color format for texture');
          }
        }

        if ('depth' in options) {
          params.depth = options.depth;
        }

        if ('stencil' in options) {
          params.stencil = options.stencil;
        }

        if ('depthStencil' in options) {
          params.depthStencil = options.depthStencil;
        }
      }

      var colorCubes;
      if (colorBuffer) {
        if (Array.isArray(colorBuffer)) {
          colorCubes = [];
          for (i = 0; i < colorBuffer.length; ++i) {
            colorCubes[i] = colorBuffer[i];
          }
        } else {
          colorCubes = [ colorBuffer ];
        }
      } else {
        colorCubes = Array(colorCount);
        var cubeMapParams = {
          radius: radius,
          format: colorFormat,
          type: colorType
        };
        for (i = 0; i < colorCount; ++i) {
          colorCubes[i] = textureState.createCube(cubeMapParams);
        }
      }

      // Check color cubes
      params.color = Array(colorCubes.length);
      for (i = 0; i < colorCubes.length; ++i) {
        var cube = colorCubes[i];
        check$1(
          typeof cube === 'function' && cube._reglType === 'textureCube',
          'invalid cube map');
        radius = radius || cube.width;
        check$1(
          cube.width === radius && cube.height === radius,
          'invalid cube map shape');
        params.color[i] = {
          target: GL_TEXTURE_CUBE_MAP_POSITIVE_X$2,
          data: colorCubes[i]
        };
      }

      for (i = 0; i < 6; ++i) {
        for (var j = 0; j < colorCubes.length; ++j) {
          params.color[j].target = GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + i;
        }
        // reuse depth-stencil attachments across all cube maps
        if (i > 0) {
          params.depth = faces[0].depth;
          params.stencil = faces[0].stencil;
          params.depthStencil = faces[0].depthStencil;
        }
        if (faces[i]) {
          (faces[i])(params);
        } else {
          faces[i] = createFBO(params);
        }
      }

      return extend(reglFramebufferCube, {
        width: radius,
        height: radius,
        color: colorCubes
      })
    }

    function resize (radius_) {
      var i;
      var radius = radius_ | 0;
      check$1(radius > 0 && radius <= limits.maxCubeMapSize,
        'invalid radius for cube fbo');

      if (radius === reglFramebufferCube.width) {
        return reglFramebufferCube
      }

      var colors = reglFramebufferCube.color;
      for (i = 0; i < colors.length; ++i) {
        colors[i].resize(radius);
      }

      for (i = 0; i < 6; ++i) {
        faces[i].resize(radius);
      }

      reglFramebufferCube.width = reglFramebufferCube.height = radius;

      return reglFramebufferCube
    }

    reglFramebufferCube(options);

    return extend(reglFramebufferCube, {
      faces: faces,
      resize: resize,
      _reglType: 'framebufferCube',
      destroy: function () {
        faces.forEach(function (f) {
          f.destroy();
        });
      }
    })
  }

  function restoreFramebuffers () {
    framebufferState.cur = null;
    framebufferState.next = null;
    framebufferState.dirty = true;
    values(framebufferSet).forEach(function (fb) {
      fb.framebuffer = gl.createFramebuffer();
      updateFramebuffer(fb);
    });
  }

  return extend(framebufferState, {
    getFramebuffer: function (object) {
      if (typeof object === 'function' && object._reglType === 'framebuffer') {
        var fbo = object._framebuffer;
        if (fbo instanceof REGLFramebuffer) {
          return fbo
        }
      }
      return null
    },
    create: createFBO,
    createCube: createCubeFBO,
    clear: function () {
      values(framebufferSet).forEach(destroy);
    },
    restore: restoreFramebuffers
  })
}

var GL_FLOAT$6 = 5126;

function AttributeRecord () {
  this.state = 0;

  this.x = 0.0;
  this.y = 0.0;
  this.z = 0.0;
  this.w = 0.0;

  this.buffer = null;
  this.size = 0;
  this.normalized = false;
  this.type = GL_FLOAT$6;
  this.offset = 0;
  this.stride = 0;
  this.divisor = 0;
}

function wrapAttributeState (
  gl,
  extensions,
  limits,
  stringStore) {
  var NUM_ATTRIBUTES = limits.maxAttributes;
  var attributeBindings = new Array(NUM_ATTRIBUTES);
  for (var i = 0; i < NUM_ATTRIBUTES; ++i) {
    attributeBindings[i] = new AttributeRecord();
  }

  return {
    Record: AttributeRecord,
    scope: {},
    state: attributeBindings
  }
}

var GL_FRAGMENT_SHADER = 35632;
var GL_VERTEX_SHADER = 35633;

var GL_ACTIVE_UNIFORMS = 0x8B86;
var GL_ACTIVE_ATTRIBUTES = 0x8B89;

function wrapShaderState (gl, stringStore, stats, config) {
  // ===================================================
  // glsl compilation and linking
  // ===================================================
  var fragShaders = {};
  var vertShaders = {};

  function ActiveInfo (name, id, location, info) {
    this.name = name;
    this.id = id;
    this.location = location;
    this.info = info;
  }

  function insertActiveInfo (list, info) {
    for (var i = 0; i < list.length; ++i) {
      if (list[i].id === info.id) {
        list[i].location = info.location;
        return
      }
    }
    list.push(info);
  }

  function getShader (type, id, command) {
    var cache = type === GL_FRAGMENT_SHADER ? fragShaders : vertShaders;
    var shader = cache[id];

    if (!shader) {
      var source = stringStore.str(id);
      shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      check$1.shaderError(gl, shader, source, type, command);
      cache[id] = shader;
    }

    return shader
  }

  // ===================================================
  // program linking
  // ===================================================
  var programCache = {};
  var programList = [];

  var PROGRAM_COUNTER = 0;

  function REGLProgram (fragId, vertId) {
    this.id = PROGRAM_COUNTER++;
    this.fragId = fragId;
    this.vertId = vertId;
    this.program = null;
    this.uniforms = [];
    this.attributes = [];

    if (config.profile) {
      this.stats = {
        uniformsCount: 0,
        attributesCount: 0
      };
    }
  }

  function linkProgram (desc, command) {
    var i, info;

    // -------------------------------
    // compile & link
    // -------------------------------
    var fragShader = getShader(GL_FRAGMENT_SHADER, desc.fragId);
    var vertShader = getShader(GL_VERTEX_SHADER, desc.vertId);

    var program = desc.program = gl.createProgram();
    gl.attachShader(program, fragShader);
    gl.attachShader(program, vertShader);
    gl.linkProgram(program);
    check$1.linkError(
      gl,
      program,
      stringStore.str(desc.fragId),
      stringStore.str(desc.vertId),
      command);

    // -------------------------------
    // grab uniforms
    // -------------------------------
    var numUniforms = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS);
    if (config.profile) {
      desc.stats.uniformsCount = numUniforms;
    }
    var uniforms = desc.uniforms;
    for (i = 0; i < numUniforms; ++i) {
      info = gl.getActiveUniform(program, i);
      if (info) {
        if (info.size > 1) {
          for (var j = 0; j < info.size; ++j) {
            var name = info.name.replace('[0]', '[' + j + ']');
            insertActiveInfo(uniforms, new ActiveInfo(
              name,
              stringStore.id(name),
              gl.getUniformLocation(program, name),
              info));
          }
        } else {
          insertActiveInfo(uniforms, new ActiveInfo(
            info.name,
            stringStore.id(info.name),
            gl.getUniformLocation(program, info.name),
            info));
        }
      }
    }

    // -------------------------------
    // grab attributes
    // -------------------------------
    var numAttributes = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES);
    if (config.profile) {
      desc.stats.attributesCount = numAttributes;
    }

    var attributes = desc.attributes;
    for (i = 0; i < numAttributes; ++i) {
      info = gl.getActiveAttrib(program, i);
      if (info) {
        insertActiveInfo(attributes, new ActiveInfo(
          info.name,
          stringStore.id(info.name),
          gl.getAttribLocation(program, info.name),
          info));
      }
    }
  }

  if (config.profile) {
    stats.getMaxUniformsCount = function () {
      var m = 0;
      programList.forEach(function (desc) {
        if (desc.stats.uniformsCount > m) {
          m = desc.stats.uniformsCount;
        }
      });
      return m
    };

    stats.getMaxAttributesCount = function () {
      var m = 0;
      programList.forEach(function (desc) {
        if (desc.stats.attributesCount > m) {
          m = desc.stats.attributesCount;
        }
      });
      return m
    };
  }

  function restoreShaders () {
    fragShaders = {};
    vertShaders = {};
    for (var i = 0; i < programList.length; ++i) {
      linkProgram(programList[i]);
    }
  }

  return {
    clear: function () {
      var deleteShader = gl.deleteShader.bind(gl);
      values(fragShaders).forEach(deleteShader);
      fragShaders = {};
      values(vertShaders).forEach(deleteShader);
      vertShaders = {};

      programList.forEach(function (desc) {
        gl.deleteProgram(desc.program);
      });
      programList.length = 0;
      programCache = {};

      stats.shaderCount = 0;
    },

    program: function (vertId, fragId, command) {
      check$1.command(vertId >= 0, 'missing vertex shader', command);
      check$1.command(fragId >= 0, 'missing fragment shader', command);

      var cache = programCache[fragId];
      if (!cache) {
        cache = programCache[fragId] = {};
      }
      var program = cache[vertId];
      if (!program) {
        program = new REGLProgram(fragId, vertId);
        stats.shaderCount++;

        linkProgram(program, command);
        cache[vertId] = program;
        programList.push(program);
      }
      return program
    },

    restore: restoreShaders,

    shader: getShader,

    frag: -1,
    vert: -1
  }
}

var GL_RGBA$3 = 6408;
var GL_UNSIGNED_BYTE$7 = 5121;
var GL_PACK_ALIGNMENT = 0x0D05;
var GL_FLOAT$7 = 0x1406; // 5126

function wrapReadPixels (
  gl,
  framebufferState,
  reglPoll,
  context,
  glAttributes,
  extensions,
  limits) {
  function readPixelsImpl (input) {
    var type;
    if (framebufferState.next === null) {
      check$1(
        glAttributes.preserveDrawingBuffer,
        'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer');
      type = GL_UNSIGNED_BYTE$7;
    } else {
      check$1(
        framebufferState.next.colorAttachments[0].texture !== null,
          'You cannot read from a renderbuffer');
      type = framebufferState.next.colorAttachments[0].texture._texture.type;

      if (extensions.oes_texture_float) {
        check$1(
          type === GL_UNSIGNED_BYTE$7 || type === GL_FLOAT$7,
          'Reading from a framebuffer is only allowed for the types \'uint8\' and \'float\'');

        if (type === GL_FLOAT$7) {
          check$1(limits.readFloat, 'Reading \'float\' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float');
        }
      } else {
        check$1(
          type === GL_UNSIGNED_BYTE$7,
          'Reading from a framebuffer is only allowed for the type \'uint8\'');
      }
    }

    var x = 0;
    var y = 0;
    var width = context.framebufferWidth;
    var height = context.framebufferHeight;
    var data = null;

    if (isTypedArray(input)) {
      data = input;
    } else if (input) {
      check$1.type(input, 'object', 'invalid arguments to regl.read()');
      x = input.x | 0;
      y = input.y | 0;
      check$1(
        x >= 0 && x < context.framebufferWidth,
        'invalid x offset for regl.read');
      check$1(
        y >= 0 && y < context.framebufferHeight,
        'invalid y offset for regl.read');
      width = (input.width || (context.framebufferWidth - x)) | 0;
      height = (input.height || (context.framebufferHeight - y)) | 0;
      data = input.data || null;
    }

    // sanity check input.data
    if (data) {
      if (type === GL_UNSIGNED_BYTE$7) {
        check$1(
          data instanceof Uint8Array,
          'buffer must be \'Uint8Array\' when reading from a framebuffer of type \'uint8\'');
      } else if (type === GL_FLOAT$7) {
        check$1(
          data instanceof Float32Array,
          'buffer must be \'Float32Array\' when reading from a framebuffer of type \'float\'');
      }
    }

    check$1(
      width > 0 && width + x <= context.framebufferWidth,
      'invalid width for read pixels');
    check$1(
      height > 0 && height + y <= context.framebufferHeight,
      'invalid height for read pixels');

    // Update WebGL state
    reglPoll();

    // Compute size
    var size = width * height * 4;

    // Allocate data
    if (!data) {
      if (type === GL_UNSIGNED_BYTE$7) {
        data = new Uint8Array(size);
      } else if (type === GL_FLOAT$7) {
        data = data || new Float32Array(size);
      }
    }

    // Type check
    check$1.isTypedArray(data, 'data buffer for regl.read() must be a typedarray');
    check$1(data.byteLength >= size, 'data buffer for regl.read() too small');

    // Run read pixels
    gl.pixelStorei(GL_PACK_ALIGNMENT, 4);
    gl.readPixels(x, y, width, height, GL_RGBA$3,
                  type,
                  data);

    return data
  }

  function readPixelsFBO (options) {
    var result;
    framebufferState.setFBO({
      framebuffer: options.framebuffer
    }, function () {
      result = readPixelsImpl(options);
    });
    return result
  }

  function readPixels (options) {
    if (!options || !('framebuffer' in options)) {
      return readPixelsImpl(options)
    } else {
      return readPixelsFBO(options)
    }
  }

  return readPixels
}

function slice (x) {
  return Array.prototype.slice.call(x)
}

function join (x) {
  return slice(x).join('')
}

function createEnvironment () {
  // Unique variable id counter
  var varCounter = 0;

  // Linked values are passed from this scope into the generated code block
  // Calling link() passes a value into the generated scope and returns
  // the variable name which it is bound to
  var linkedNames = [];
  var linkedValues = [];
  function link (value) {
    for (var i = 0; i < linkedValues.length; ++i) {
      if (linkedValues[i] === value) {
        return linkedNames[i]
      }
    }

    var name = 'g' + (varCounter++);
    linkedNames.push(name);
    linkedValues.push(value);
    return name
  }

  // create a code block
  function block () {
    var code = [];
    function push () {
      code.push.apply(code, slice(arguments));
    }

    var vars = [];
    function def () {
      var name = 'v' + (varCounter++);
      vars.push(name);

      if (arguments.length > 0) {
        code.push(name, '=');
        code.push.apply(code, slice(arguments));
        code.push(';');
      }

      return name
    }

    return extend(push, {
      def: def,
      toString: function () {
        return join([
          (vars.length > 0 ? 'var ' + vars + ';' : ''),
          join(code)
        ])
      }
    })
  }

  function scope () {
    var entry = block();
    var exit = block();

    var entryToString = entry.toString;
    var exitToString = exit.toString;

    function save (object, prop) {
      exit(object, prop, '=', entry.def(object, prop), ';');
    }

    return extend(function () {
      entry.apply(entry, slice(arguments));
    }, {
      def: entry.def,
      entry: entry,
      exit: exit,
      save: save,
      set: function (object, prop, value) {
        save(object, prop);
        entry(object, prop, '=', value, ';');
      },
      toString: function () {
        return entryToString() + exitToString()
      }
    })
  }

  function conditional () {
    var pred = join(arguments);
    var thenBlock = scope();
    var elseBlock = scope();

    var thenToString = thenBlock.toString;
    var elseToString = elseBlock.toString;

    return extend(thenBlock, {
      then: function () {
        thenBlock.apply(thenBlock, slice(arguments));
        return this
      },
      else: function () {
        elseBlock.apply(elseBlock, slice(arguments));
        return this
      },
      toString: function () {
        var elseClause = elseToString();
        if (elseClause) {
          elseClause = 'else{' + elseClause + '}';
        }
        return join([
          'if(', pred, '){',
          thenToString(),
          '}', elseClause
        ])
      }
    })
  }

  // procedure list
  var globalBlock = block();
  var procedures = {};
  function proc (name, count) {
    var args = [];
    function arg () {
      var name = 'a' + args.length;
      args.push(name);
      return name
    }

    count = count || 0;
    for (var i = 0; i < count; ++i) {
      arg();
    }

    var body = scope();
    var bodyToString = body.toString;

    var result = procedures[name] = extend(body, {
      arg: arg,
      toString: function () {
        return join([
          'function(', args.join(), '){',
          bodyToString(),
          '}'
        ])
      }
    });

    return result
  }

  function compile () {
    var code = ['"use strict";',
      globalBlock,
      'return {'];
    Object.keys(procedures).forEach(function (name) {
      code.push('"', name, '":', procedures[name].toString(), ',');
    });
    code.push('}');
    var src = join(code)
      .replace(/;/g, ';\n')
      .replace(/}/g, '}\n')
      .replace(/{/g, '{\n');
    var proc = Function.apply(null, linkedNames.concat(src));
    return proc.apply(null, linkedValues)
  }

  return {
    global: globalBlock,
    link: link,
    block: block,
    proc: proc,
    scope: scope,
    cond: conditional,
    compile: compile
  }
}

// "cute" names for vector components
var CUTE_COMPONENTS = 'xyzw'.split('');

var GL_UNSIGNED_BYTE$8 = 5121;

var ATTRIB_STATE_POINTER = 1;
var ATTRIB_STATE_CONSTANT = 2;

var DYN_FUNC$1 = 0;
var DYN_PROP$1 = 1;
var DYN_CONTEXT$1 = 2;
var DYN_STATE$1 = 3;
var DYN_THUNK = 4;

var S_DITHER = 'dither';
var S_BLEND_ENABLE = 'blend.enable';
var S_BLEND_COLOR = 'blend.color';
var S_BLEND_EQUATION = 'blend.equation';
var S_BLEND_FUNC = 'blend.func';
var S_DEPTH_ENABLE = 'depth.enable';
var S_DEPTH_FUNC = 'depth.func';
var S_DEPTH_RANGE = 'depth.range';
var S_DEPTH_MASK = 'depth.mask';
var S_COLOR_MASK = 'colorMask';
var S_CULL_ENABLE = 'cull.enable';
var S_CULL_FACE = 'cull.face';
var S_FRONT_FACE = 'frontFace';
var S_LINE_WIDTH = 'lineWidth';
var S_POLYGON_OFFSET_ENABLE = 'polygonOffset.enable';
var S_POLYGON_OFFSET_OFFSET = 'polygonOffset.offset';
var S_SAMPLE_ALPHA = 'sample.alpha';
var S_SAMPLE_ENABLE = 'sample.enable';
var S_SAMPLE_COVERAGE = 'sample.coverage';
var S_STENCIL_ENABLE = 'stencil.enable';
var S_STENCIL_MASK = 'stencil.mask';
var S_STENCIL_FUNC = 'stencil.func';
var S_STENCIL_OPFRONT = 'stencil.opFront';
var S_STENCIL_OPBACK = 'stencil.opBack';
var S_SCISSOR_ENABLE = 'scissor.enable';
var S_SCISSOR_BOX = 'scissor.box';
var S_VIEWPORT = 'viewport';

var S_PROFILE = 'profile';

var S_FRAMEBUFFER = 'framebuffer';
var S_VERT = 'vert';
var S_FRAG = 'frag';
var S_ELEMENTS = 'elements';
var S_PRIMITIVE = 'primitive';
var S_COUNT = 'count';
var S_OFFSET = 'offset';
var S_INSTANCES = 'instances';

var SUFFIX_WIDTH = 'Width';
var SUFFIX_HEIGHT = 'Height';

var S_FRAMEBUFFER_WIDTH = S_FRAMEBUFFER + SUFFIX_WIDTH;
var S_FRAMEBUFFER_HEIGHT = S_FRAMEBUFFER + SUFFIX_HEIGHT;
var S_VIEWPORT_WIDTH = S_VIEWPORT + SUFFIX_WIDTH;
var S_VIEWPORT_HEIGHT = S_VIEWPORT + SUFFIX_HEIGHT;
var S_DRAWINGBUFFER = 'drawingBuffer';
var S_DRAWINGBUFFER_WIDTH = S_DRAWINGBUFFER + SUFFIX_WIDTH;
var S_DRAWINGBUFFER_HEIGHT = S_DRAWINGBUFFER + SUFFIX_HEIGHT;

var NESTED_OPTIONS = [
  S_BLEND_FUNC,
  S_BLEND_EQUATION,
  S_STENCIL_FUNC,
  S_STENCIL_OPFRONT,
  S_STENCIL_OPBACK,
  S_SAMPLE_COVERAGE,
  S_VIEWPORT,
  S_SCISSOR_BOX,
  S_POLYGON_OFFSET_OFFSET
];

var GL_ARRAY_BUFFER$1 = 34962;
var GL_ELEMENT_ARRAY_BUFFER$1 = 34963;

var GL_FRAGMENT_SHADER$1 = 35632;
var GL_VERTEX_SHADER$1 = 35633;

var GL_TEXTURE_2D$3 = 0x0DE1;
var GL_TEXTURE_CUBE_MAP$2 = 0x8513;

var GL_CULL_FACE = 0x0B44;
var GL_BLEND = 0x0BE2;
var GL_DITHER = 0x0BD0;
var GL_STENCIL_TEST = 0x0B90;
var GL_DEPTH_TEST = 0x0B71;
var GL_SCISSOR_TEST = 0x0C11;
var GL_POLYGON_OFFSET_FILL = 0x8037;
var GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
var GL_SAMPLE_COVERAGE = 0x80A0;

var GL_FLOAT$8 = 5126;
var GL_FLOAT_VEC2 = 35664;
var GL_FLOAT_VEC3 = 35665;
var GL_FLOAT_VEC4 = 35666;
var GL_INT$3 = 5124;
var GL_INT_VEC2 = 35667;
var GL_INT_VEC3 = 35668;
var GL_INT_VEC4 = 35669;
var GL_BOOL = 35670;
var GL_BOOL_VEC2 = 35671;
var GL_BOOL_VEC3 = 35672;
var GL_BOOL_VEC4 = 35673;
var GL_FLOAT_MAT2 = 35674;
var GL_FLOAT_MAT3 = 35675;
var GL_FLOAT_MAT4 = 35676;
var GL_SAMPLER_2D = 35678;
var GL_SAMPLER_CUBE = 35680;

var GL_TRIANGLES$1 = 4;

var GL_FRONT = 1028;
var GL_BACK = 1029;
var GL_CW = 0x0900;
var GL_CCW = 0x0901;
var GL_MIN_EXT = 0x8007;
var GL_MAX_EXT = 0x8008;
var GL_ALWAYS = 519;
var GL_KEEP = 7680;
var GL_ZERO = 0;
var GL_ONE = 1;
var GL_FUNC_ADD = 0x8006;
var GL_LESS = 513;

var GL_FRAMEBUFFER$2 = 0x8D40;
var GL_COLOR_ATTACHMENT0$2 = 0x8CE0;

var blendFuncs = {
  '0': 0,
  '1': 1,
  'zero': 0,
  'one': 1,
  'src color': 768,
  'one minus src color': 769,
  'src alpha': 770,
  'one minus src alpha': 771,
  'dst color': 774,
  'one minus dst color': 775,
  'dst alpha': 772,
  'one minus dst alpha': 773,
  'constant color': 32769,
  'one minus constant color': 32770,
  'constant alpha': 32771,
  'one minus constant alpha': 32772,
  'src alpha saturate': 776
};

// There are invalid values for srcRGB and dstRGB. See:
// https://www.khronos.org/registry/webgl/specs/1.0/#6.13
// https://github.com/KhronosGroup/WebGL/blob/0d3201f5f7ec3c0060bc1f04077461541f1987b9/conformance-suites/1.0.3/conformance/misc/webgl-specific.html#L56
var invalidBlendCombinations = [
  'constant color, constant alpha',
  'one minus constant color, constant alpha',
  'constant color, one minus constant alpha',
  'one minus constant color, one minus constant alpha',
  'constant alpha, constant color',
  'constant alpha, one minus constant color',
  'one minus constant alpha, constant color',
  'one minus constant alpha, one minus constant color'
];

var compareFuncs = {
  'never': 512,
  'less': 513,
  '<': 513,
  'equal': 514,
  '=': 514,
  '==': 514,
  '===': 514,
  'lequal': 515,
  '<=': 515,
  'greater': 516,
  '>': 516,
  'notequal': 517,
  '!=': 517,
  '!==': 517,
  'gequal': 518,
  '>=': 518,
  'always': 519
};

var stencilOps = {
  '0': 0,
  'zero': 0,
  'keep': 7680,
  'replace': 7681,
  'increment': 7682,
  'decrement': 7683,
  'increment wrap': 34055,
  'decrement wrap': 34056,
  'invert': 5386
};

var shaderType = {
  'frag': GL_FRAGMENT_SHADER$1,
  'vert': GL_VERTEX_SHADER$1
};

var orientationType = {
  'cw': GL_CW,
  'ccw': GL_CCW
};

function isBufferArgs (x) {
  return Array.isArray(x) ||
    isTypedArray(x) ||
    isNDArrayLike(x)
}

// Make sure viewport is processed first
function sortState (state) {
  return state.sort(function (a, b) {
    if (a === S_VIEWPORT) {
      return -1
    } else if (b === S_VIEWPORT) {
      return 1
    }
    return (a < b) ? -1 : 1
  })
}

function Declaration (thisDep, contextDep, propDep, append) {
  this.thisDep = thisDep;
  this.contextDep = contextDep;
  this.propDep = propDep;
  this.append = append;
}

function isStatic (decl) {
  return decl && !(decl.thisDep || decl.contextDep || decl.propDep)
}

function createStaticDecl (append) {
  return new Declaration(false, false, false, append)
}

function createDynamicDecl (dyn, append) {
  var type = dyn.type;
  if (type === DYN_FUNC$1) {
    var numArgs = dyn.data.length;
    return new Declaration(
      true,
      numArgs >= 1,
      numArgs >= 2,
      append)
  } else if (type === DYN_THUNK) {
    var data = dyn.data;
    return new Declaration(
      data.thisDep,
      data.contextDep,
      data.propDep,
      append)
  } else {
    return new Declaration(
      type === DYN_STATE$1,
      type === DYN_CONTEXT$1,
      type === DYN_PROP$1,
      append)
  }
}

var SCOPE_DECL = new Declaration(false, false, false, function () {});

function reglCore (
  gl,
  stringStore,
  extensions,
  limits,
  bufferState,
  elementState,
  textureState,
  framebufferState,
  uniformState,
  attributeState,
  shaderState,
  drawState,
  contextState,
  timer,
  config) {
  var AttributeRecord = attributeState.Record;

  var blendEquations = {
    'add': 32774,
    'subtract': 32778,
    'reverse subtract': 32779
  };
  if (extensions.ext_blend_minmax) {
    blendEquations.min = GL_MIN_EXT;
    blendEquations.max = GL_MAX_EXT;
  }

  var extInstancing = extensions.angle_instanced_arrays;
  var extDrawBuffers = extensions.webgl_draw_buffers;

  // ===================================================
  // ===================================================
  // WEBGL STATE
  // ===================================================
  // ===================================================
  var currentState = {
    dirty: true,
    profile: config.profile
  };
  var nextState = {};
  var GL_STATE_NAMES = [];
  var GL_FLAGS = {};
  var GL_VARIABLES = {};

  function propName (name) {
    return name.replace('.', '_')
  }

  function stateFlag (sname, cap, init) {
    var name = propName(sname);
    GL_STATE_NAMES.push(sname);
    nextState[name] = currentState[name] = !!init;
    GL_FLAGS[name] = cap;
  }

  function stateVariable (sname, func, init) {
    var name = propName(sname);
    GL_STATE_NAMES.push(sname);
    if (Array.isArray(init)) {
      currentState[name] = init.slice();
      nextState[name] = init.slice();
    } else {
      currentState[name] = nextState[name] = init;
    }
    GL_VARIABLES[name] = func;
  }

  // Dithering
  stateFlag(S_DITHER, GL_DITHER);

  // Blending
  stateFlag(S_BLEND_ENABLE, GL_BLEND);
  stateVariable(S_BLEND_COLOR, 'blendColor', [0, 0, 0, 0]);
  stateVariable(S_BLEND_EQUATION, 'blendEquationSeparate',
    [GL_FUNC_ADD, GL_FUNC_ADD]);
  stateVariable(S_BLEND_FUNC, 'blendFuncSeparate',
    [GL_ONE, GL_ZERO, GL_ONE, GL_ZERO]);

  // Depth
  stateFlag(S_DEPTH_ENABLE, GL_DEPTH_TEST, true);
  stateVariable(S_DEPTH_FUNC, 'depthFunc', GL_LESS);
  stateVariable(S_DEPTH_RANGE, 'depthRange', [0, 1]);
  stateVariable(S_DEPTH_MASK, 'depthMask', true);

  // Color mask
  stateVariable(S_COLOR_MASK, S_COLOR_MASK, [true, true, true, true]);

  // Face culling
  stateFlag(S_CULL_ENABLE, GL_CULL_FACE);
  stateVariable(S_CULL_FACE, 'cullFace', GL_BACK);

  // Front face orientation
  stateVariable(S_FRONT_FACE, S_FRONT_FACE, GL_CCW);

  // Line width
  stateVariable(S_LINE_WIDTH, S_LINE_WIDTH, 1);

  // Polygon offset
  stateFlag(S_POLYGON_OFFSET_ENABLE, GL_POLYGON_OFFSET_FILL);
  stateVariable(S_POLYGON_OFFSET_OFFSET, 'polygonOffset', [0, 0]);

  // Sample coverage
  stateFlag(S_SAMPLE_ALPHA, GL_SAMPLE_ALPHA_TO_COVERAGE);
  stateFlag(S_SAMPLE_ENABLE, GL_SAMPLE_COVERAGE);
  stateVariable(S_SAMPLE_COVERAGE, 'sampleCoverage', [1, false]);

  // Stencil
  stateFlag(S_STENCIL_ENABLE, GL_STENCIL_TEST);
  stateVariable(S_STENCIL_MASK, 'stencilMask', -1);
  stateVariable(S_STENCIL_FUNC, 'stencilFunc', [GL_ALWAYS, 0, -1]);
  stateVariable(S_STENCIL_OPFRONT, 'stencilOpSeparate',
    [GL_FRONT, GL_KEEP, GL_KEEP, GL_KEEP]);
  stateVariable(S_STENCIL_OPBACK, 'stencilOpSeparate',
    [GL_BACK, GL_KEEP, GL_KEEP, GL_KEEP]);

  // Scissor
  stateFlag(S_SCISSOR_ENABLE, GL_SCISSOR_TEST);
  stateVariable(S_SCISSOR_BOX, 'scissor',
    [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

  // Viewport
  stateVariable(S_VIEWPORT, S_VIEWPORT,
    [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

  // ===================================================
  // ===================================================
  // ENVIRONMENT
  // ===================================================
  // ===================================================
  var sharedState = {
    gl: gl,
    context: contextState,
    strings: stringStore,
    next: nextState,
    current: currentState,
    draw: drawState,
    elements: elementState,
    buffer: bufferState,
    shader: shaderState,
    attributes: attributeState.state,
    uniforms: uniformState,
    framebuffer: framebufferState,
    extensions: extensions,

    timer: timer,
    isBufferArgs: isBufferArgs
  };

  var sharedConstants = {
    primTypes: primTypes,
    compareFuncs: compareFuncs,
    blendFuncs: blendFuncs,
    blendEquations: blendEquations,
    stencilOps: stencilOps,
    glTypes: glTypes,
    orientationType: orientationType
  };

  check$1.optional(function () {
    sharedState.isArrayLike = isArrayLike;
  });

  if (extDrawBuffers) {
    sharedConstants.backBuffer = [GL_BACK];
    sharedConstants.drawBuffer = loop(limits.maxDrawbuffers, function (i) {
      if (i === 0) {
        return [0]
      }
      return loop(i, function (j) {
        return GL_COLOR_ATTACHMENT0$2 + j
      })
    });
  }

  var drawCallCounter = 0;
  function createREGLEnvironment () {
    var env = createEnvironment();
    var link = env.link;
    var global = env.global;
    env.id = drawCallCounter++;

    env.batchId = '0';

    // link shared state
    var SHARED = link(sharedState);
    var shared = env.shared = {
      props: 'a0'
    };
    Object.keys(sharedState).forEach(function (prop) {
      shared[prop] = global.def(SHARED, '.', prop);
    });

    // Inject runtime assertion stuff for debug builds
    check$1.optional(function () {
      env.CHECK = link(check$1);
      env.commandStr = check$1.guessCommand();
      env.command = link(env.commandStr);
      env.assert = function (block, pred, message) {
        block(
          'if(!(', pred, '))',
          this.CHECK, '.commandRaise(', link(message), ',', this.command, ');');
      };

      sharedConstants.invalidBlendCombinations = invalidBlendCombinations;
    });

    // Copy GL state variables over
    var nextVars = env.next = {};
    var currentVars = env.current = {};
    Object.keys(GL_VARIABLES).forEach(function (variable) {
      if (Array.isArray(currentState[variable])) {
        nextVars[variable] = global.def(shared.next, '.', variable);
        currentVars[variable] = global.def(shared.current, '.', variable);
      }
    });

    // Initialize shared constants
    var constants = env.constants = {};
    Object.keys(sharedConstants).forEach(function (name) {
      constants[name] = global.def(JSON.stringify(sharedConstants[name]));
    });

    // Helper function for calling a block
    env.invoke = function (block, x) {
      switch (x.type) {
        case DYN_FUNC$1:
          var argList = [
            'this',
            shared.context,
            shared.props,
            env.batchId
          ];
          return block.def(
            link(x.data), '.call(',
              argList.slice(0, Math.max(x.data.length + 1, 4)),
             ')')
        case DYN_PROP$1:
          return block.def(shared.props, x.data)
        case DYN_CONTEXT$1:
          return block.def(shared.context, x.data)
        case DYN_STATE$1:
          return block.def('this', x.data)
        case DYN_THUNK:
          x.data.append(env, block);
          return x.data.ref
      }
    };

    env.attribCache = {};

    var scopeAttribs = {};
    env.scopeAttrib = function (name) {
      var id = stringStore.id(name);
      if (id in scopeAttribs) {
        return scopeAttribs[id]
      }
      var binding = attributeState.scope[id];
      if (!binding) {
        binding = attributeState.scope[id] = new AttributeRecord();
      }
      var result = scopeAttribs[id] = link(binding);
      return result
    };

    return env
  }

  // ===================================================
  // ===================================================
  // PARSING
  // ===================================================
  // ===================================================
  function parseProfile (options) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    var profileEnable;
    if (S_PROFILE in staticOptions) {
      var value = !!staticOptions[S_PROFILE];
      profileEnable = createStaticDecl(function (env, scope) {
        return value
      });
      profileEnable.enable = value;
    } else if (S_PROFILE in dynamicOptions) {
      var dyn = dynamicOptions[S_PROFILE];
      profileEnable = createDynamicDecl(dyn, function (env, scope) {
        return env.invoke(scope, dyn)
      });
    }

    return profileEnable
  }

  function parseFramebuffer (options, env) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    if (S_FRAMEBUFFER in staticOptions) {
      var framebuffer = staticOptions[S_FRAMEBUFFER];
      if (framebuffer) {
        framebuffer = framebufferState.getFramebuffer(framebuffer);
        check$1.command(framebuffer, 'invalid framebuffer object');
        return createStaticDecl(function (env, block) {
          var FRAMEBUFFER = env.link(framebuffer);
          var shared = env.shared;
          block.set(
            shared.framebuffer,
            '.next',
            FRAMEBUFFER);
          var CONTEXT = shared.context;
          block.set(
            CONTEXT,
            '.' + S_FRAMEBUFFER_WIDTH,
            FRAMEBUFFER + '.width');
          block.set(
            CONTEXT,
            '.' + S_FRAMEBUFFER_HEIGHT,
            FRAMEBUFFER + '.height');
          return FRAMEBUFFER
        })
      } else {
        return createStaticDecl(function (env, scope) {
          var shared = env.shared;
          scope.set(
            shared.framebuffer,
            '.next',
            'null');
          var CONTEXT = shared.context;
          scope.set(
            CONTEXT,
            '.' + S_FRAMEBUFFER_WIDTH,
            CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
          scope.set(
            CONTEXT,
            '.' + S_FRAMEBUFFER_HEIGHT,
            CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
          return 'null'
        })
      }
    } else if (S_FRAMEBUFFER in dynamicOptions) {
      var dyn = dynamicOptions[S_FRAMEBUFFER];
      return createDynamicDecl(dyn, function (env, scope) {
        var FRAMEBUFFER_FUNC = env.invoke(scope, dyn);
        var shared = env.shared;
        var FRAMEBUFFER_STATE = shared.framebuffer;
        var FRAMEBUFFER = scope.def(
          FRAMEBUFFER_STATE, '.getFramebuffer(', FRAMEBUFFER_FUNC, ')');

        check$1.optional(function () {
          env.assert(scope,
            '!' + FRAMEBUFFER_FUNC + '||' + FRAMEBUFFER,
            'invalid framebuffer object');
        });

        scope.set(
          FRAMEBUFFER_STATE,
          '.next',
          FRAMEBUFFER);
        var CONTEXT = shared.context;
        scope.set(
          CONTEXT,
          '.' + S_FRAMEBUFFER_WIDTH,
          FRAMEBUFFER + '?' + FRAMEBUFFER + '.width:' +
          CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
        scope.set(
          CONTEXT,
          '.' + S_FRAMEBUFFER_HEIGHT,
          FRAMEBUFFER +
          '?' + FRAMEBUFFER + '.height:' +
          CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
        return FRAMEBUFFER
      })
    } else {
      return null
    }
  }

  function parseViewportScissor (options, framebuffer, env) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    function parseBox (param) {
      if (param in staticOptions) {
        var box = staticOptions[param];
        check$1.commandType(box, 'object', 'invalid ' + param, env.commandStr);

        var isStatic = true;
        var x = box.x | 0;
        var y = box.y | 0;
        var w, h;
        if ('width' in box) {
          w = box.width | 0;
          check$1.command(w >= 0, 'invalid ' + param, env.commandStr);
        } else {
          isStatic = false;
        }
        if ('height' in box) {
          h = box.height | 0;
          check$1.command(h >= 0, 'invalid ' + param, env.commandStr);
        } else {
          isStatic = false;
        }

        return new Declaration(
          !isStatic && framebuffer && framebuffer.thisDep,
          !isStatic && framebuffer && framebuffer.contextDep,
          !isStatic && framebuffer && framebuffer.propDep,
          function (env, scope) {
            var CONTEXT = env.shared.context;
            var BOX_W = w;
            if (!('width' in box)) {
              BOX_W = scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', x);
            }
            var BOX_H = h;
            if (!('height' in box)) {
              BOX_H = scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', y);
            }
            return [x, y, BOX_W, BOX_H]
          })
      } else if (param in dynamicOptions) {
        var dynBox = dynamicOptions[param];
        var result = createDynamicDecl(dynBox, function (env, scope) {
          var BOX = env.invoke(scope, dynBox);

          check$1.optional(function () {
            env.assert(scope,
              BOX + '&&typeof ' + BOX + '==="object"',
              'invalid ' + param);
          });

          var CONTEXT = env.shared.context;
          var BOX_X = scope.def(BOX, '.x|0');
          var BOX_Y = scope.def(BOX, '.y|0');
          var BOX_W = scope.def(
            '"width" in ', BOX, '?', BOX, '.width|0:',
            '(', CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', BOX_X, ')');
          var BOX_H = scope.def(
            '"height" in ', BOX, '?', BOX, '.height|0:',
            '(', CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', BOX_Y, ')');

          check$1.optional(function () {
            env.assert(scope,
              BOX_W + '>=0&&' +
              BOX_H + '>=0',
              'invalid ' + param);
          });

          return [BOX_X, BOX_Y, BOX_W, BOX_H]
        });
        if (framebuffer) {
          result.thisDep = result.thisDep || framebuffer.thisDep;
          result.contextDep = result.contextDep || framebuffer.contextDep;
          result.propDep = result.propDep || framebuffer.propDep;
        }
        return result
      } else if (framebuffer) {
        return new Declaration(
          framebuffer.thisDep,
          framebuffer.contextDep,
          framebuffer.propDep,
          function (env, scope) {
            var CONTEXT = env.shared.context;
            return [
              0, 0,
              scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH),
              scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT)]
          })
      } else {
        return null
      }
    }

    var viewport = parseBox(S_VIEWPORT);

    if (viewport) {
      var prevViewport = viewport;
      viewport = new Declaration(
        viewport.thisDep,
        viewport.contextDep,
        viewport.propDep,
        function (env, scope) {
          var VIEWPORT = prevViewport.append(env, scope);
          var CONTEXT = env.shared.context;
          scope.set(
            CONTEXT,
            '.' + S_VIEWPORT_WIDTH,
            VIEWPORT[2]);
          scope.set(
            CONTEXT,
            '.' + S_VIEWPORT_HEIGHT,
            VIEWPORT[3]);
          return VIEWPORT
        });
    }

    return {
      viewport: viewport,
      scissor_box: parseBox(S_SCISSOR_BOX)
    }
  }

  function parseProgram (options) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    function parseShader (name) {
      if (name in staticOptions) {
        var id = stringStore.id(staticOptions[name]);
        check$1.optional(function () {
          shaderState.shader(shaderType[name], id, check$1.guessCommand());
        });
        var result = createStaticDecl(function () {
          return id
        });
        result.id = id;
        return result
      } else if (name in dynamicOptions) {
        var dyn = dynamicOptions[name];
        return createDynamicDecl(dyn, function (env, scope) {
          var str = env.invoke(scope, dyn);
          var id = scope.def(env.shared.strings, '.id(', str, ')');
          check$1.optional(function () {
            scope(
              env.shared.shader, '.shader(',
              shaderType[name], ',',
              id, ',',
              env.command, ');');
          });
          return id
        })
      }
      return null
    }

    var frag = parseShader(S_FRAG);
    var vert = parseShader(S_VERT);

    var program = null;
    var progVar;
    if (isStatic(frag) && isStatic(vert)) {
      program = shaderState.program(vert.id, frag.id);
      progVar = createStaticDecl(function (env, scope) {
        return env.link(program)
      });
    } else {
      progVar = new Declaration(
        (frag && frag.thisDep) || (vert && vert.thisDep),
        (frag && frag.contextDep) || (vert && vert.contextDep),
        (frag && frag.propDep) || (vert && vert.propDep),
        function (env, scope) {
          var SHADER_STATE = env.shared.shader;
          var fragId;
          if (frag) {
            fragId = frag.append(env, scope);
          } else {
            fragId = scope.def(SHADER_STATE, '.', S_FRAG);
          }
          var vertId;
          if (vert) {
            vertId = vert.append(env, scope);
          } else {
            vertId = scope.def(SHADER_STATE, '.', S_VERT);
          }
          var progDef = SHADER_STATE + '.program(' + vertId + ',' + fragId;
          check$1.optional(function () {
            progDef += ',' + env.command;
          });
          return scope.def(progDef + ')')
        });
    }

    return {
      frag: frag,
      vert: vert,
      progVar: progVar,
      program: program
    }
  }

  function parseDraw (options, env) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    function parseElements () {
      if (S_ELEMENTS in staticOptions) {
        var elements = staticOptions[S_ELEMENTS];
        if (isBufferArgs(elements)) {
          elements = elementState.getElements(elementState.create(elements, true));
        } else if (elements) {
          elements = elementState.getElements(elements);
          check$1.command(elements, 'invalid elements', env.commandStr);
        }
        var result = createStaticDecl(function (env, scope) {
          if (elements) {
            var result = env.link(elements);
            env.ELEMENTS = result;
            return result
          }
          env.ELEMENTS = null;
          return null
        });
        result.value = elements;
        return result
      } else if (S_ELEMENTS in dynamicOptions) {
        var dyn = dynamicOptions[S_ELEMENTS];
        return createDynamicDecl(dyn, function (env, scope) {
          var shared = env.shared;

          var IS_BUFFER_ARGS = shared.isBufferArgs;
          var ELEMENT_STATE = shared.elements;

          var elementDefn = env.invoke(scope, dyn);
          var elements = scope.def('null');
          var elementStream = scope.def(IS_BUFFER_ARGS, '(', elementDefn, ')');

          var ifte = env.cond(elementStream)
            .then(elements, '=', ELEMENT_STATE, '.createStream(', elementDefn, ');')
            .else(elements, '=', ELEMENT_STATE, '.getElements(', elementDefn, ');');

          check$1.optional(function () {
            env.assert(ifte.else,
              '!' + elementDefn + '||' + elements,
              'invalid elements');
          });

          scope.entry(ifte);
          scope.exit(
            env.cond(elementStream)
              .then(ELEMENT_STATE, '.destroyStream(', elements, ');'));

          env.ELEMENTS = elements;

          return elements
        })
      }

      return null
    }

    var elements = parseElements();

    function parsePrimitive () {
      if (S_PRIMITIVE in staticOptions) {
        var primitive = staticOptions[S_PRIMITIVE];
        check$1.commandParameter(primitive, primTypes, 'invalid primitve', env.commandStr);
        return createStaticDecl(function (env, scope) {
          return primTypes[primitive]
        })
      } else if (S_PRIMITIVE in dynamicOptions) {
        var dynPrimitive = dynamicOptions[S_PRIMITIVE];
        return createDynamicDecl(dynPrimitive, function (env, scope) {
          var PRIM_TYPES = env.constants.primTypes;
          var prim = env.invoke(scope, dynPrimitive);
          check$1.optional(function () {
            env.assert(scope,
              prim + ' in ' + PRIM_TYPES,
              'invalid primitive, must be one of ' + Object.keys(primTypes));
          });
          return scope.def(PRIM_TYPES, '[', prim, ']')
        })
      } else if (elements) {
        if (isStatic(elements)) {
          if (elements.value) {
            return createStaticDecl(function (env, scope) {
              return scope.def(env.ELEMENTS, '.primType')
            })
          } else {
            return createStaticDecl(function () {
              return GL_TRIANGLES$1
            })
          }
        } else {
          return new Declaration(
            elements.thisDep,
            elements.contextDep,
            elements.propDep,
            function (env, scope) {
              var elements = env.ELEMENTS;
              return scope.def(elements, '?', elements, '.primType:', GL_TRIANGLES$1)
            })
        }
      }
      return null
    }

    function parseParam (param, isOffset) {
      if (param in staticOptions) {
        var value = staticOptions[param] | 0;
        check$1.command(!isOffset || value >= 0, 'invalid ' + param, env.commandStr);
        return createStaticDecl(function (env, scope) {
          if (isOffset) {
            env.OFFSET = value;
          }
          return value
        })
      } else if (param in dynamicOptions) {
        var dynValue = dynamicOptions[param];
        return createDynamicDecl(dynValue, function (env, scope) {
          var result = env.invoke(scope, dynValue);
          if (isOffset) {
            env.OFFSET = result;
            check$1.optional(function () {
              env.assert(scope,
                result + '>=0',
                'invalid ' + param);
            });
          }
          return result
        })
      } else if (isOffset && elements) {
        return createStaticDecl(function (env, scope) {
          env.OFFSET = '0';
          return 0
        })
      }
      return null
    }

    var OFFSET = parseParam(S_OFFSET, true);

    function parseVertCount () {
      if (S_COUNT in staticOptions) {
        var count = staticOptions[S_COUNT] | 0;
        check$1.command(
          typeof count === 'number' && count >= 0, 'invalid vertex count', env.commandStr);
        return createStaticDecl(function () {
          return count
        })
      } else if (S_COUNT in dynamicOptions) {
        var dynCount = dynamicOptions[S_COUNT];
        return createDynamicDecl(dynCount, function (env, scope) {
          var result = env.invoke(scope, dynCount);
          check$1.optional(function () {
            env.assert(scope,
              'typeof ' + result + '==="number"&&' +
              result + '>=0&&' +
              result + '===(' + result + '|0)',
              'invalid vertex count');
          });
          return result
        })
      } else if (elements) {
        if (isStatic(elements)) {
          if (elements) {
            if (OFFSET) {
              return new Declaration(
                OFFSET.thisDep,
                OFFSET.contextDep,
                OFFSET.propDep,
                function (env, scope) {
                  var result = scope.def(
                    env.ELEMENTS, '.vertCount-', env.OFFSET);

                  check$1.optional(function () {
                    env.assert(scope,
                      result + '>=0',
                      'invalid vertex offset/element buffer too small');
                  });

                  return result
                })
            } else {
              return createStaticDecl(function (env, scope) {
                return scope.def(env.ELEMENTS, '.vertCount')
              })
            }
          } else {
            var result = createStaticDecl(function () {
              return -1
            });
            check$1.optional(function () {
              result.MISSING = true;
            });
            return result
          }
        } else {
          var variable = new Declaration(
            elements.thisDep || OFFSET.thisDep,
            elements.contextDep || OFFSET.contextDep,
            elements.propDep || OFFSET.propDep,
            function (env, scope) {
              var elements = env.ELEMENTS;
              if (env.OFFSET) {
                return scope.def(elements, '?', elements, '.vertCount-',
                  env.OFFSET, ':-1')
              }
              return scope.def(elements, '?', elements, '.vertCount:-1')
            });
          check$1.optional(function () {
            variable.DYNAMIC = true;
          });
          return variable
        }
      }
      return null
    }

    return {
      elements: elements,
      primitive: parsePrimitive(),
      count: parseVertCount(),
      instances: parseParam(S_INSTANCES, false),
      offset: OFFSET
    }
  }

  function parseGLState (options, env) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    var STATE = {};

    GL_STATE_NAMES.forEach(function (prop) {
      var param = propName(prop);

      function parseParam (parseStatic, parseDynamic) {
        if (prop in staticOptions) {
          var value = parseStatic(staticOptions[prop]);
          STATE[param] = createStaticDecl(function () {
            return value
          });
        } else if (prop in dynamicOptions) {
          var dyn = dynamicOptions[prop];
          STATE[param] = createDynamicDecl(dyn, function (env, scope) {
            return parseDynamic(env, scope, env.invoke(scope, dyn))
          });
        }
      }

      switch (prop) {
        case S_CULL_ENABLE:
        case S_BLEND_ENABLE:
        case S_DITHER:
        case S_STENCIL_ENABLE:
        case S_DEPTH_ENABLE:
        case S_SCISSOR_ENABLE:
        case S_POLYGON_OFFSET_ENABLE:
        case S_SAMPLE_ALPHA:
        case S_SAMPLE_ENABLE:
        case S_DEPTH_MASK:
          return parseParam(
            function (value) {
              check$1.commandType(value, 'boolean', prop, env.commandStr);
              return value
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  'typeof ' + value + '==="boolean"',
                  'invalid flag ' + prop, env.commandStr);
              });
              return value
            })

        case S_DEPTH_FUNC:
          return parseParam(
            function (value) {
              check$1.commandParameter(value, compareFuncs, 'invalid ' + prop, env.commandStr);
              return compareFuncs[value]
            },
            function (env, scope, value) {
              var COMPARE_FUNCS = env.constants.compareFuncs;
              check$1.optional(function () {
                env.assert(scope,
                  value + ' in ' + COMPARE_FUNCS,
                  'invalid ' + prop + ', must be one of ' + Object.keys(compareFuncs));
              });
              return scope.def(COMPARE_FUNCS, '[', value, ']')
            })

        case S_DEPTH_RANGE:
          return parseParam(
            function (value) {
              check$1.command(
                isArrayLike(value) &&
                value.length === 2 &&
                typeof value[0] === 'number' &&
                typeof value[1] === 'number' &&
                value[0] <= value[1],
                'depth range is 2d array',
                env.commandStr);
              return value
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  env.shared.isArrayLike + '(' + value + ')&&' +
                  value + '.length===2&&' +
                  'typeof ' + value + '[0]==="number"&&' +
                  'typeof ' + value + '[1]==="number"&&' +
                  value + '[0]<=' + value + '[1]',
                  'depth range must be a 2d array');
              });

              var Z_NEAR = scope.def('+', value, '[0]');
              var Z_FAR = scope.def('+', value, '[1]');
              return [Z_NEAR, Z_FAR]
            })

        case S_BLEND_FUNC:
          return parseParam(
            function (value) {
              check$1.commandType(value, 'object', 'blend.func', env.commandStr);
              var srcRGB = ('srcRGB' in value ? value.srcRGB : value.src);
              var srcAlpha = ('srcAlpha' in value ? value.srcAlpha : value.src);
              var dstRGB = ('dstRGB' in value ? value.dstRGB : value.dst);
              var dstAlpha = ('dstAlpha' in value ? value.dstAlpha : value.dst);
              check$1.commandParameter(srcRGB, blendFuncs, param + '.srcRGB', env.commandStr);
              check$1.commandParameter(srcAlpha, blendFuncs, param + '.srcAlpha', env.commandStr);
              check$1.commandParameter(dstRGB, blendFuncs, param + '.dstRGB', env.commandStr);
              check$1.commandParameter(dstAlpha, blendFuncs, param + '.dstAlpha', env.commandStr);

              check$1.command(
                (invalidBlendCombinations.indexOf(srcRGB + ', ' + dstRGB) === -1),
                'unallowed blending combination (srcRGB, dstRGB) = (' + srcRGB + ', ' + dstRGB + ')', env.commandStr);

              return [
                blendFuncs[srcRGB],
                blendFuncs[dstRGB],
                blendFuncs[srcAlpha],
                blendFuncs[dstAlpha]
              ]
            },
            function (env, scope, value) {
              var BLEND_FUNCS = env.constants.blendFuncs;

              check$1.optional(function () {
                env.assert(scope,
                  value + '&&typeof ' + value + '==="object"',
                  'invalid blend func, must be an object');
              });

              function read (prefix, suffix) {
                var func = scope.def(
                  '"', prefix, suffix, '" in ', value,
                  '?', value, '.', prefix, suffix,
                  ':', value, '.', prefix);

                check$1.optional(function () {
                  env.assert(scope,
                    func + ' in ' + BLEND_FUNCS,
                    'invalid ' + prop + '.' + prefix + suffix + ', must be one of ' + Object.keys(blendFuncs));
                });

                return func
              }

              var srcRGB = read('src', 'RGB');
              var dstRGB = read('dst', 'RGB');

              check$1.optional(function () {
                var INVALID_BLEND_COMBINATIONS = env.constants.invalidBlendCombinations;

                env.assert(scope,
                           INVALID_BLEND_COMBINATIONS +
                           '.indexOf(' + srcRGB + '+", "+' + dstRGB + ') === -1 ',
                           'unallowed blending combination for (srcRGB, dstRGB)'
                          );
              });

              var SRC_RGB = scope.def(BLEND_FUNCS, '[', srcRGB, ']');
              var SRC_ALPHA = scope.def(BLEND_FUNCS, '[', read('src', 'Alpha'), ']');
              var DST_RGB = scope.def(BLEND_FUNCS, '[', dstRGB, ']');
              var DST_ALPHA = scope.def(BLEND_FUNCS, '[', read('dst', 'Alpha'), ']');

              return [SRC_RGB, DST_RGB, SRC_ALPHA, DST_ALPHA]
            })

        case S_BLEND_EQUATION:
          return parseParam(
            function (value) {
              if (typeof value === 'string') {
                check$1.commandParameter(value, blendEquations, 'invalid ' + prop, env.commandStr);
                return [
                  blendEquations[value],
                  blendEquations[value]
                ]
              } else if (typeof value === 'object') {
                check$1.commandParameter(
                  value.rgb, blendEquations, prop + '.rgb', env.commandStr);
                check$1.commandParameter(
                  value.alpha, blendEquations, prop + '.alpha', env.commandStr);
                return [
                  blendEquations[value.rgb],
                  blendEquations[value.alpha]
                ]
              } else {
                check$1.commandRaise('invalid blend.equation', env.commandStr);
              }
            },
            function (env, scope, value) {
              var BLEND_EQUATIONS = env.constants.blendEquations;

              var RGB = scope.def();
              var ALPHA = scope.def();

              var ifte = env.cond('typeof ', value, '==="string"');

              check$1.optional(function () {
                function checkProp (block, name, value) {
                  env.assert(block,
                    value + ' in ' + BLEND_EQUATIONS,
                    'invalid ' + name + ', must be one of ' + Object.keys(blendEquations));
                }
                checkProp(ifte.then, prop, value);

                env.assert(ifte.else,
                  value + '&&typeof ' + value + '==="object"',
                  'invalid ' + prop);
                checkProp(ifte.else, prop + '.rgb', value + '.rgb');
                checkProp(ifte.else, prop + '.alpha', value + '.alpha');
              });

              ifte.then(
                RGB, '=', ALPHA, '=', BLEND_EQUATIONS, '[', value, '];');
              ifte.else(
                RGB, '=', BLEND_EQUATIONS, '[', value, '.rgb];',
                ALPHA, '=', BLEND_EQUATIONS, '[', value, '.alpha];');

              scope(ifte);

              return [RGB, ALPHA]
            })

        case S_BLEND_COLOR:
          return parseParam(
            function (value) {
              check$1.command(
                isArrayLike(value) &&
                value.length === 4,
                'blend.color must be a 4d array', env.commandStr);
              return loop(4, function (i) {
                return +value[i]
              })
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  env.shared.isArrayLike + '(' + value + ')&&' +
                  value + '.length===4',
                  'blend.color must be a 4d array');
              });
              return loop(4, function (i) {
                return scope.def('+', value, '[', i, ']')
              })
            })

        case S_STENCIL_MASK:
          return parseParam(
            function (value) {
              check$1.commandType(value, 'number', param, env.commandStr);
              return value | 0
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  'typeof ' + value + '==="number"',
                  'invalid stencil.mask');
              });
              return scope.def(value, '|0')
            })

        case S_STENCIL_FUNC:
          return parseParam(
            function (value) {
              check$1.commandType(value, 'object', param, env.commandStr);
              var cmp = value.cmp || 'keep';
              var ref = value.ref || 0;
              var mask = 'mask' in value ? value.mask : -1;
              check$1.commandParameter(cmp, compareFuncs, prop + '.cmp', env.commandStr);
              check$1.commandType(ref, 'number', prop + '.ref', env.commandStr);
              check$1.commandType(mask, 'number', prop + '.mask', env.commandStr);
              return [
                compareFuncs[cmp],
                ref,
                mask
              ]
            },
            function (env, scope, value) {
              var COMPARE_FUNCS = env.constants.compareFuncs;
              check$1.optional(function () {
                function assert () {
                  env.assert(scope,
                    Array.prototype.join.call(arguments, ''),
                    'invalid stencil.func');
                }
                assert(value + '&&typeof ', value, '==="object"');
                assert('!("cmp" in ', value, ')||(',
                  value, '.cmp in ', COMPARE_FUNCS, ')');
              });
              var cmp = scope.def(
                '"cmp" in ', value,
                '?', COMPARE_FUNCS, '[', value, '.cmp]',
                ':', GL_KEEP);
              var ref = scope.def(value, '.ref|0');
              var mask = scope.def(
                '"mask" in ', value,
                '?', value, '.mask|0:-1');
              return [cmp, ref, mask]
            })

        case S_STENCIL_OPFRONT:
        case S_STENCIL_OPBACK:
          return parseParam(
            function (value) {
              check$1.commandType(value, 'object', param, env.commandStr);
              var fail = value.fail || 'keep';
              var zfail = value.zfail || 'keep';
              var zpass = value.zpass || 'keep';
              check$1.commandParameter(fail, stencilOps, prop + '.fail', env.commandStr);
              check$1.commandParameter(zfail, stencilOps, prop + '.zfail', env.commandStr);
              check$1.commandParameter(zpass, stencilOps, prop + '.zpass', env.commandStr);
              return [
                prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
                stencilOps[fail],
                stencilOps[zfail],
                stencilOps[zpass]
              ]
            },
            function (env, scope, value) {
              var STENCIL_OPS = env.constants.stencilOps;

              check$1.optional(function () {
                env.assert(scope,
                  value + '&&typeof ' + value + '==="object"',
                  'invalid ' + prop);
              });

              function read (name) {
                check$1.optional(function () {
                  env.assert(scope,
                    '!("' + name + '" in ' + value + ')||' +
                    '(' + value + '.' + name + ' in ' + STENCIL_OPS + ')',
                    'invalid ' + prop + '.' + name + ', must be one of ' + Object.keys(stencilOps));
                });

                return scope.def(
                  '"', name, '" in ', value,
                  '?', STENCIL_OPS, '[', value, '.', name, ']:',
                  GL_KEEP)
              }

              return [
                prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
                read('fail'),
                read('zfail'),
                read('zpass')
              ]
            })

        case S_POLYGON_OFFSET_OFFSET:
          return parseParam(
            function (value) {
              check$1.commandType(value, 'object', param, env.commandStr);
              var factor = value.factor | 0;
              var units = value.units | 0;
              check$1.commandType(factor, 'number', param + '.factor', env.commandStr);
              check$1.commandType(units, 'number', param + '.units', env.commandStr);
              return [factor, units]
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  value + '&&typeof ' + value + '==="object"',
                  'invalid ' + prop);
              });

              var FACTOR = scope.def(value, '.factor|0');
              var UNITS = scope.def(value, '.units|0');

              return [FACTOR, UNITS]
            })

        case S_CULL_FACE:
          return parseParam(
            function (value) {
              var face = 0;
              if (value === 'front') {
                face = GL_FRONT;
              } else if (value === 'back') {
                face = GL_BACK;
              }
              check$1.command(!!face, param, env.commandStr);
              return face
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  value + '==="front"||' +
                  value + '==="back"',
                  'invalid cull.face');
              });
              return scope.def(value, '==="front"?', GL_FRONT, ':', GL_BACK)
            })

        case S_LINE_WIDTH:
          return parseParam(
            function (value) {
              check$1.command(
                typeof value === 'number' &&
                value >= limits.lineWidthDims[0] &&
                value <= limits.lineWidthDims[1],
                'invalid line width, must be a positive number between ' +
                limits.lineWidthDims[0] + ' and ' + limits.lineWidthDims[1], env.commandStr);
              return value
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  'typeof ' + value + '==="number"&&' +
                  value + '>=' + limits.lineWidthDims[0] + '&&' +
                  value + '<=' + limits.lineWidthDims[1],
                  'invalid line width');
              });

              return value
            })

        case S_FRONT_FACE:
          return parseParam(
            function (value) {
              check$1.commandParameter(value, orientationType, param, env.commandStr);
              return orientationType[value]
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  value + '==="cw"||' +
                  value + '==="ccw"',
                  'invalid frontFace, must be one of cw,ccw');
              });
              return scope.def(value + '==="cw"?' + GL_CW + ':' + GL_CCW)
            })

        case S_COLOR_MASK:
          return parseParam(
            function (value) {
              check$1.command(
                isArrayLike(value) && value.length === 4,
                'color.mask must be length 4 array', env.commandStr);
              return value.map(function (v) { return !!v })
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  env.shared.isArrayLike + '(' + value + ')&&' +
                  value + '.length===4',
                  'invalid color.mask');
              });
              return loop(4, function (i) {
                return '!!' + value + '[' + i + ']'
              })
            })

        case S_SAMPLE_COVERAGE:
          return parseParam(
            function (value) {
              check$1.command(typeof value === 'object' && value, param, env.commandStr);
              var sampleValue = 'value' in value ? value.value : 1;
              var sampleInvert = !!value.invert;
              check$1.command(
                typeof sampleValue === 'number' &&
                sampleValue >= 0 && sampleValue <= 1,
                'sample.coverage.value must be a number between 0 and 1', env.commandStr);
              return [sampleValue, sampleInvert]
            },
            function (env, scope, value) {
              check$1.optional(function () {
                env.assert(scope,
                  value + '&&typeof ' + value + '==="object"',
                  'invalid sample.coverage');
              });
              var VALUE = scope.def(
                '"value" in ', value, '?+', value, '.value:1');
              var INVERT = scope.def('!!', value, '.invert');
              return [VALUE, INVERT]
            })
      }
    });

    return STATE
  }

  function parseUniforms (uniforms, env) {
    var staticUniforms = uniforms.static;
    var dynamicUniforms = uniforms.dynamic;

    var UNIFORMS = {};

    Object.keys(staticUniforms).forEach(function (name) {
      var value = staticUniforms[name];
      var result;
      if (typeof value === 'number' ||
          typeof value === 'boolean') {
        result = createStaticDecl(function () {
          return value
        });
      } else if (typeof value === 'function') {
        var reglType = value._reglType;
        if (reglType === 'texture2d' ||
            reglType === 'textureCube') {
          result = createStaticDecl(function (env) {
            return env.link(value)
          });
        } else if (reglType === 'framebuffer' ||
                   reglType === 'framebufferCube') {
          check$1.command(value.color.length > 0,
            'missing color attachment for framebuffer sent to uniform "' + name + '"', env.commandStr);
          result = createStaticDecl(function (env) {
            return env.link(value.color[0])
          });
        } else {
          check$1.commandRaise('invalid data for uniform "' + name + '"', env.commandStr);
        }
      } else if (isArrayLike(value)) {
        result = createStaticDecl(function (env) {
          var ITEM = env.global.def('[',
            loop(value.length, function (i) {
              check$1.command(
                typeof value[i] === 'number' ||
                typeof value[i] === 'boolean',
                'invalid uniform ' + name, env.commandStr);
              return value[i]
            }), ']');
          return ITEM
        });
      } else {
        check$1.commandRaise('invalid or missing data for uniform "' + name + '"', env.commandStr);
      }
      result.value = value;
      UNIFORMS[name] = result;
    });

    Object.keys(dynamicUniforms).forEach(function (key) {
      var dyn = dynamicUniforms[key];
      UNIFORMS[key] = createDynamicDecl(dyn, function (env, scope) {
        return env.invoke(scope, dyn)
      });
    });

    return UNIFORMS
  }

  function parseAttributes (attributes, env) {
    var staticAttributes = attributes.static;
    var dynamicAttributes = attributes.dynamic;

    var attributeDefs = {};

    Object.keys(staticAttributes).forEach(function (attribute) {
      var value = staticAttributes[attribute];
      var id = stringStore.id(attribute);

      var record = new AttributeRecord();
      if (isBufferArgs(value)) {
        record.state = ATTRIB_STATE_POINTER;
        record.buffer = bufferState.getBuffer(
          bufferState.create(value, GL_ARRAY_BUFFER$1, false, true));
        record.type = 0;
      } else {
        var buffer = bufferState.getBuffer(value);
        if (buffer) {
          record.state = ATTRIB_STATE_POINTER;
          record.buffer = buffer;
          record.type = 0;
        } else {
          check$1.command(typeof value === 'object' && value,
            'invalid data for attribute ' + attribute, env.commandStr);
          if ('constant' in value) {
            var constant = value.constant;
            record.buffer = 'null';
            record.state = ATTRIB_STATE_CONSTANT;
            if (typeof constant === 'number') {
              record.x = constant;
            } else {
              check$1.command(
                isArrayLike(constant) &&
                constant.length > 0 &&
                constant.length <= 4,
                'invalid constant for attribute ' + attribute, env.commandStr);
              CUTE_COMPONENTS.forEach(function (c, i) {
                if (i < constant.length) {
                  record[c] = constant[i];
                }
              });
            }
          } else {
            if (isBufferArgs(value.buffer)) {
              buffer = bufferState.getBuffer(
                bufferState.create(value.buffer, GL_ARRAY_BUFFER$1, false, true));
            } else {
              buffer = bufferState.getBuffer(value.buffer);
            }
            check$1.command(!!buffer, 'missing buffer for attribute "' + attribute + '"', env.commandStr);

            var offset = value.offset | 0;
            check$1.command(offset >= 0,
              'invalid offset for attribute "' + attribute + '"', env.commandStr);

            var stride = value.stride | 0;
            check$1.command(stride >= 0 && stride < 256,
              'invalid stride for attribute "' + attribute + '", must be integer betweeen [0, 255]', env.commandStr);

            var size = value.size | 0;
            check$1.command(!('size' in value) || (size > 0 && size <= 4),
              'invalid size for attribute "' + attribute + '", must be 1,2,3,4', env.commandStr);

            var normalized = !!value.normalized;

            var type = 0;
            if ('type' in value) {
              check$1.commandParameter(
                value.type, glTypes,
                'invalid type for attribute ' + attribute, env.commandStr);
              type = glTypes[value.type];
            }

            var divisor = value.divisor | 0;
            if ('divisor' in value) {
              check$1.command(divisor === 0 || extInstancing,
                'cannot specify divisor for attribute "' + attribute + '", instancing not supported', env.commandStr);
              check$1.command(divisor >= 0,
                'invalid divisor for attribute "' + attribute + '"', env.commandStr);
            }

            check$1.optional(function () {
              var command = env.commandStr;

              var VALID_KEYS = [
                'buffer',
                'offset',
                'divisor',
                'normalized',
                'type',
                'size',
                'stride'
              ];

              Object.keys(value).forEach(function (prop) {
                check$1.command(
                  VALID_KEYS.indexOf(prop) >= 0,
                  'unknown parameter "' + prop + '" for attribute pointer "' + attribute + '" (valid parameters are ' + VALID_KEYS + ')',
                  command);
              });
            });

            record.buffer = buffer;
            record.state = ATTRIB_STATE_POINTER;
            record.size = size;
            record.normalized = normalized;
            record.type = type || buffer.dtype;
            record.offset = offset;
            record.stride = stride;
            record.divisor = divisor;
          }
        }
      }

      attributeDefs[attribute] = createStaticDecl(function (env, scope) {
        var cache = env.attribCache;
        if (id in cache) {
          return cache[id]
        }
        var result = {
          isStream: false
        };
        Object.keys(record).forEach(function (key) {
          result[key] = record[key];
        });
        if (record.buffer) {
          result.buffer = env.link(record.buffer);
          result.type = result.type || (result.buffer + '.dtype');
        }
        cache[id] = result;
        return result
      });
    });

    Object.keys(dynamicAttributes).forEach(function (attribute) {
      var dyn = dynamicAttributes[attribute];

      function appendAttributeCode (env, block) {
        var VALUE = env.invoke(block, dyn);

        var shared = env.shared;

        var IS_BUFFER_ARGS = shared.isBufferArgs;
        var BUFFER_STATE = shared.buffer;

        // Perform validation on attribute
        check$1.optional(function () {
          env.assert(block,
            VALUE + '&&(typeof ' + VALUE + '==="object"||typeof ' +
            VALUE + '==="function")&&(' +
            IS_BUFFER_ARGS + '(' + VALUE + ')||' +
            BUFFER_STATE + '.getBuffer(' + VALUE + ')||' +
            BUFFER_STATE + '.getBuffer(' + VALUE + '.buffer)||' +
            IS_BUFFER_ARGS + '(' + VALUE + '.buffer)||' +
            '("constant" in ' + VALUE +
            '&&(typeof ' + VALUE + '.constant==="number"||' +
            shared.isArrayLike + '(' + VALUE + '.constant))))',
            'invalid dynamic attribute "' + attribute + '"');
        });

        // allocate names for result
        var result = {
          isStream: block.def(false)
        };
        var defaultRecord = new AttributeRecord();
        defaultRecord.state = ATTRIB_STATE_POINTER;
        Object.keys(defaultRecord).forEach(function (key) {
          result[key] = block.def('' + defaultRecord[key]);
        });

        var BUFFER = result.buffer;
        var TYPE = result.type;
        block(
          'if(', IS_BUFFER_ARGS, '(', VALUE, ')){',
          result.isStream, '=true;',
          BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$1, ',', VALUE, ');',
          TYPE, '=', BUFFER, '.dtype;',
          '}else{',
          BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, ');',
          'if(', BUFFER, '){',
          TYPE, '=', BUFFER, '.dtype;',
          '}else if("constant" in ', VALUE, '){',
          result.state, '=', ATTRIB_STATE_CONSTANT, ';',
          'if(typeof ' + VALUE + '.constant === "number"){',
          result[CUTE_COMPONENTS[0]], '=', VALUE, '.constant;',
          CUTE_COMPONENTS.slice(1).map(function (n) {
            return result[n]
          }).join('='), '=0;',
          '}else{',
          CUTE_COMPONENTS.map(function (name, i) {
            return (
              result[name] + '=' + VALUE + '.constant.length>' + i +
              '?' + VALUE + '.constant[' + i + ']:0;'
            )
          }).join(''),
          '}}else{',
          'if(', IS_BUFFER_ARGS, '(', VALUE, '.buffer)){',
          BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$1, ',', VALUE, '.buffer);',
          '}else{',
          BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, '.buffer);',
          '}',
          TYPE, '="type" in ', VALUE, '?',
          shared.glTypes, '[', VALUE, '.type]:', BUFFER, '.dtype;',
          result.normalized, '=!!', VALUE, '.normalized;');
        function emitReadRecord (name) {
          block(result[name], '=', VALUE, '.', name, '|0;');
        }
        emitReadRecord('size');
        emitReadRecord('offset');
        emitReadRecord('stride');
        emitReadRecord('divisor');

        block('}}');

        block.exit(
          'if(', result.isStream, '){',
          BUFFER_STATE, '.destroyStream(', BUFFER, ');',
          '}');

        return result
      }

      attributeDefs[attribute] = createDynamicDecl(dyn, appendAttributeCode);
    });

    return attributeDefs
  }

  function parseContext (context) {
    var staticContext = context.static;
    var dynamicContext = context.dynamic;
    var result = {};

    Object.keys(staticContext).forEach(function (name) {
      var value = staticContext[name];
      result[name] = createStaticDecl(function (env, scope) {
        if (typeof value === 'number' || typeof value === 'boolean') {
          return '' + value
        } else {
          return env.link(value)
        }
      });
    });

    Object.keys(dynamicContext).forEach(function (name) {
      var dyn = dynamicContext[name];
      result[name] = createDynamicDecl(dyn, function (env, scope) {
        return env.invoke(scope, dyn)
      });
    });

    return result
  }

  function parseArguments (options, attributes, uniforms, context, env) {
    var staticOptions = options.static;
    var dynamicOptions = options.dynamic;

    check$1.optional(function () {
      var KEY_NAMES = [
        S_FRAMEBUFFER,
        S_VERT,
        S_FRAG,
        S_ELEMENTS,
        S_PRIMITIVE,
        S_OFFSET,
        S_COUNT,
        S_INSTANCES,
        S_PROFILE
      ].concat(GL_STATE_NAMES);

      function checkKeys (dict) {
        Object.keys(dict).forEach(function (key) {
          check$1.command(
            KEY_NAMES.indexOf(key) >= 0,
            'unknown parameter "' + key + '"',
            env.commandStr);
        });
      }

      checkKeys(staticOptions);
      checkKeys(dynamicOptions);
    });

    var framebuffer = parseFramebuffer(options, env);
    var viewportAndScissor = parseViewportScissor(options, framebuffer, env);
    var draw = parseDraw(options, env);
    var state = parseGLState(options, env);
    var shader = parseProgram(options, env);

    function copyBox (name) {
      var defn = viewportAndScissor[name];
      if (defn) {
        state[name] = defn;
      }
    }
    copyBox(S_VIEWPORT);
    copyBox(propName(S_SCISSOR_BOX));

    var dirty = Object.keys(state).length > 0;

    var result = {
      framebuffer: framebuffer,
      draw: draw,
      shader: shader,
      state: state,
      dirty: dirty
    };

    result.profile = parseProfile(options, env);
    result.uniforms = parseUniforms(uniforms, env);
    result.attributes = parseAttributes(attributes, env);
    result.context = parseContext(context, env);
    return result
  }

  // ===================================================
  // ===================================================
  // COMMON UPDATE FUNCTIONS
  // ===================================================
  // ===================================================
  function emitContext (env, scope, context) {
    var shared = env.shared;
    var CONTEXT = shared.context;

    var contextEnter = env.scope();

    Object.keys(context).forEach(function (name) {
      scope.save(CONTEXT, '.' + name);
      var defn = context[name];
      contextEnter(CONTEXT, '.', name, '=', defn.append(env, scope), ';');
    });

    scope(contextEnter);
  }

  // ===================================================
  // ===================================================
  // COMMON DRAWING FUNCTIONS
  // ===================================================
  // ===================================================
  function emitPollFramebuffer (env, scope, framebuffer, skipCheck) {
    var shared = env.shared;

    var GL = shared.gl;
    var FRAMEBUFFER_STATE = shared.framebuffer;
    var EXT_DRAW_BUFFERS;
    if (extDrawBuffers) {
      EXT_DRAW_BUFFERS = scope.def(shared.extensions, '.webgl_draw_buffers');
    }

    var constants = env.constants;

    var DRAW_BUFFERS = constants.drawBuffer;
    var BACK_BUFFER = constants.backBuffer;

    var NEXT;
    if (framebuffer) {
      NEXT = framebuffer.append(env, scope);
    } else {
      NEXT = scope.def(FRAMEBUFFER_STATE, '.next');
    }

    if (!skipCheck) {
      scope('if(', NEXT, '!==', FRAMEBUFFER_STATE, '.cur){');
    }
    scope(
      'if(', NEXT, '){',
      GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',', NEXT, '.framebuffer);');
    if (extDrawBuffers) {
      scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(',
        DRAW_BUFFERS, '[', NEXT, '.colorAttachments.length]);');
    }
    scope('}else{',
      GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',null);');
    if (extDrawBuffers) {
      scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(', BACK_BUFFER, ');');
    }
    scope(
      '}',
      FRAMEBUFFER_STATE, '.cur=', NEXT, ';');
    if (!skipCheck) {
      scope('}');
    }
  }

  function emitPollState (env, scope, args) {
    var shared = env.shared;

    var GL = shared.gl;

    var CURRENT_VARS = env.current;
    var NEXT_VARS = env.next;
    var CURRENT_STATE = shared.current;
    var NEXT_STATE = shared.next;

    var block = env.cond(CURRENT_STATE, '.dirty');

    GL_STATE_NAMES.forEach(function (prop) {
      var param = propName(prop);
      if (param in args.state) {
        return
      }

      var NEXT, CURRENT;
      if (param in NEXT_VARS) {
        NEXT = NEXT_VARS[param];
        CURRENT = CURRENT_VARS[param];
        var parts = loop(currentState[param].length, function (i) {
          return block.def(NEXT, '[', i, ']')
        });
        block(env.cond(parts.map(function (p, i) {
          return p + '!==' + CURRENT + '[' + i + ']'
        }).join('||'))
          .then(
            GL, '.', GL_VARIABLES[param], '(', parts, ');',
            parts.map(function (p, i) {
              return CURRENT + '[' + i + ']=' + p
            }).join(';'), ';'));
      } else {
        NEXT = block.def(NEXT_STATE, '.', param);
        var ifte = env.cond(NEXT, '!==', CURRENT_STATE, '.', param);
        block(ifte);
        if (param in GL_FLAGS) {
          ifte(
            env.cond(NEXT)
                .then(GL, '.enable(', GL_FLAGS[param], ');')
                .else(GL, '.disable(', GL_FLAGS[param], ');'),
            CURRENT_STATE, '.', param, '=', NEXT, ';');
        } else {
          ifte(
            GL, '.', GL_VARIABLES[param], '(', NEXT, ');',
            CURRENT_STATE, '.', param, '=', NEXT, ';');
        }
      }
    });
    if (Object.keys(args.state).length === 0) {
      block(CURRENT_STATE, '.dirty=false;');
    }
    scope(block);
  }

  function emitSetOptions (env, scope, options, filter) {
    var shared = env.shared;
    var CURRENT_VARS = env.current;
    var CURRENT_STATE = shared.current;
    var GL = shared.gl;
    sortState(Object.keys(options)).forEach(function (param) {
      var defn = options[param];
      if (filter && !filter(defn)) {
        return
      }
      var variable = defn.append(env, scope);
      if (GL_FLAGS[param]) {
        var flag = GL_FLAGS[param];
        if (isStatic(defn)) {
          if (variable) {
            scope(GL, '.enable(', flag, ');');
          } else {
            scope(GL, '.disable(', flag, ');');
          }
        } else {
          scope(env.cond(variable)
            .then(GL, '.enable(', flag, ');')
            .else(GL, '.disable(', flag, ');'));
        }
        scope(CURRENT_STATE, '.', param, '=', variable, ';');
      } else if (isArrayLike(variable)) {
        var CURRENT = CURRENT_VARS[param];
        scope(
          GL, '.', GL_VARIABLES[param], '(', variable, ');',
          variable.map(function (v, i) {
            return CURRENT + '[' + i + ']=' + v
          }).join(';'), ';');
      } else {
        scope(
          GL, '.', GL_VARIABLES[param], '(', variable, ');',
          CURRENT_STATE, '.', param, '=', variable, ';');
      }
    });
  }

  function injectExtensions (env, scope) {
    if (extInstancing) {
      env.instancing = scope.def(
        env.shared.extensions, '.angle_instanced_arrays');
    }
  }

  function emitProfile (env, scope, args, useScope, incrementCounter) {
    var shared = env.shared;
    var STATS = env.stats;
    var CURRENT_STATE = shared.current;
    var TIMER = shared.timer;
    var profileArg = args.profile;

    function perfCounter () {
      if (typeof performance === 'undefined') {
        return 'Date.now()'
      } else {
        return 'performance.now()'
      }
    }

    var CPU_START, QUERY_COUNTER;
    function emitProfileStart (block) {
      CPU_START = scope.def();
      block(CPU_START, '=', perfCounter(), ';');
      if (typeof incrementCounter === 'string') {
        block(STATS, '.count+=', incrementCounter, ';');
      } else {
        block(STATS, '.count++;');
      }
      if (timer) {
        if (useScope) {
          QUERY_COUNTER = scope.def();
          block(QUERY_COUNTER, '=', TIMER, '.getNumPendingQueries();');
        } else {
          block(TIMER, '.beginQuery(', STATS, ');');
        }
      }
    }

    function emitProfileEnd (block) {
      block(STATS, '.cpuTime+=', perfCounter(), '-', CPU_START, ';');
      if (timer) {
        if (useScope) {
          block(TIMER, '.pushScopeStats(',
            QUERY_COUNTER, ',',
            TIMER, '.getNumPendingQueries(),',
            STATS, ');');
        } else {
          block(TIMER, '.endQuery();');
        }
      }
    }

    function scopeProfile (value) {
      var prev = scope.def(CURRENT_STATE, '.profile');
      scope(CURRENT_STATE, '.profile=', value, ';');
      scope.exit(CURRENT_STATE, '.profile=', prev, ';');
    }

    var USE_PROFILE;
    if (profileArg) {
      if (isStatic(profileArg)) {
        if (profileArg.enable) {
          emitProfileStart(scope);
          emitProfileEnd(scope.exit);
          scopeProfile('true');
        } else {
          scopeProfile('false');
        }
        return
      }
      USE_PROFILE = profileArg.append(env, scope);
      scopeProfile(USE_PROFILE);
    } else {
      USE_PROFILE = scope.def(CURRENT_STATE, '.profile');
    }

    var start = env.block();
    emitProfileStart(start);
    scope('if(', USE_PROFILE, '){', start, '}');
    var end = env.block();
    emitProfileEnd(end);
    scope.exit('if(', USE_PROFILE, '){', end, '}');
  }

  function emitAttributes (env, scope, args, attributes, filter) {
    var shared = env.shared;

    function typeLength (x) {
      switch (x) {
        case GL_FLOAT_VEC2:
        case GL_INT_VEC2:
        case GL_BOOL_VEC2:
          return 2
        case GL_FLOAT_VEC3:
        case GL_INT_VEC3:
        case GL_BOOL_VEC3:
          return 3
        case GL_FLOAT_VEC4:
        case GL_INT_VEC4:
        case GL_BOOL_VEC4:
          return 4
        default:
          return 1
      }
    }

    function emitBindAttribute (ATTRIBUTE, size, record) {
      var GL = shared.gl;

      var LOCATION = scope.def(ATTRIBUTE, '.location');
      var BINDING = scope.def(shared.attributes, '[', LOCATION, ']');

      var STATE = record.state;
      var BUFFER = record.buffer;
      var CONST_COMPONENTS = [
        record.x,
        record.y,
        record.z,
        record.w
      ];

      var COMMON_KEYS = [
        'buffer',
        'normalized',
        'offset',
        'stride'
      ];

      function emitBuffer () {
        scope(
          'if(!', BINDING, '.buffer){',
          GL, '.enableVertexAttribArray(', LOCATION, ');}');

        var TYPE = record.type;
        var SIZE;
        if (!record.size) {
          SIZE = size;
        } else {
          SIZE = scope.def(record.size, '||', size);
        }

        scope('if(',
          BINDING, '.type!==', TYPE, '||',
          BINDING, '.size!==', SIZE, '||',
          COMMON_KEYS.map(function (key) {
            return BINDING + '.' + key + '!==' + record[key]
          }).join('||'),
          '){',
          GL, '.bindBuffer(', GL_ARRAY_BUFFER$1, ',', BUFFER, '.buffer);',
          GL, '.vertexAttribPointer(', [
            LOCATION,
            SIZE,
            TYPE,
            record.normalized,
            record.stride,
            record.offset
          ], ');',
          BINDING, '.type=', TYPE, ';',
          BINDING, '.size=', SIZE, ';',
          COMMON_KEYS.map(function (key) {
            return BINDING + '.' + key + '=' + record[key] + ';'
          }).join(''),
          '}');

        if (extInstancing) {
          var DIVISOR = record.divisor;
          scope(
            'if(', BINDING, '.divisor!==', DIVISOR, '){',
            env.instancing, '.vertexAttribDivisorANGLE(', [LOCATION, DIVISOR], ');',
            BINDING, '.divisor=', DIVISOR, ';}');
        }
      }

      function emitConstant () {
        scope(
          'if(', BINDING, '.buffer){',
          GL, '.disableVertexAttribArray(', LOCATION, ');',
          '}if(', CUTE_COMPONENTS.map(function (c, i) {
            return BINDING + '.' + c + '!==' + CONST_COMPONENTS[i]
          }).join('||'), '){',
          GL, '.vertexAttrib4f(', LOCATION, ',', CONST_COMPONENTS, ');',
          CUTE_COMPONENTS.map(function (c, i) {
            return BINDING + '.' + c + '=' + CONST_COMPONENTS[i] + ';'
          }).join(''),
          '}');
      }

      if (STATE === ATTRIB_STATE_POINTER) {
        emitBuffer();
      } else if (STATE === ATTRIB_STATE_CONSTANT) {
        emitConstant();
      } else {
        scope('if(', STATE, '===', ATTRIB_STATE_POINTER, '){');
        emitBuffer();
        scope('}else{');
        emitConstant();
        scope('}');
      }
    }

    attributes.forEach(function (attribute) {
      var name = attribute.name;
      var arg = args.attributes[name];
      var record;
      if (arg) {
        if (!filter(arg)) {
          return
        }
        record = arg.append(env, scope);
      } else {
        if (!filter(SCOPE_DECL)) {
          return
        }
        var scopeAttrib = env.scopeAttrib(name);
        check$1.optional(function () {
          env.assert(scope,
            scopeAttrib + '.state',
            'missing attribute ' + name);
        });
        record = {};
        Object.keys(new AttributeRecord()).forEach(function (key) {
          record[key] = scope.def(scopeAttrib, '.', key);
        });
      }
      emitBindAttribute(
        env.link(attribute), typeLength(attribute.info.type), record);
    });
  }

  function emitUniforms (env, scope, args, uniforms, filter) {
    var shared = env.shared;
    var GL = shared.gl;

    var infix;
    for (var i = 0; i < uniforms.length; ++i) {
      var uniform = uniforms[i];
      var name = uniform.name;
      var type = uniform.info.type;
      var arg = args.uniforms[name];
      var UNIFORM = env.link(uniform);
      var LOCATION = UNIFORM + '.location';

      var VALUE;
      if (arg) {
        if (!filter(arg)) {
          continue
        }
        if (isStatic(arg)) {
          var value = arg.value;
          check$1.command(
            value !== null && typeof value !== 'undefined',
            'missing uniform "' + name + '"', env.commandStr);
          if (type === GL_SAMPLER_2D || type === GL_SAMPLER_CUBE) {
            check$1.command(
              typeof value === 'function' &&
              ((type === GL_SAMPLER_2D &&
                (value._reglType === 'texture2d' ||
                value._reglType === 'framebuffer')) ||
              (type === GL_SAMPLER_CUBE &&
                (value._reglType === 'textureCube' ||
                value._reglType === 'framebufferCube'))),
              'invalid texture for uniform ' + name, env.commandStr);
            var TEX_VALUE = env.link(value._texture || value.color[0]._texture);
            scope(GL, '.uniform1i(', LOCATION, ',', TEX_VALUE + '.bind());');
            scope.exit(TEX_VALUE, '.unbind();');
          } else if (
            type === GL_FLOAT_MAT2 ||
            type === GL_FLOAT_MAT3 ||
            type === GL_FLOAT_MAT4) {
            check$1.optional(function () {
              check$1.command(isArrayLike(value),
                'invalid matrix for uniform ' + name, env.commandStr);
              check$1.command(
                (type === GL_FLOAT_MAT2 && value.length === 4) ||
                (type === GL_FLOAT_MAT3 && value.length === 9) ||
                (type === GL_FLOAT_MAT4 && value.length === 16),
                'invalid length for matrix uniform ' + name, env.commandStr);
            });
            var MAT_VALUE = env.global.def('new Float32Array([' +
              Array.prototype.slice.call(value) + '])');
            var dim = 2;
            if (type === GL_FLOAT_MAT3) {
              dim = 3;
            } else if (type === GL_FLOAT_MAT4) {
              dim = 4;
            }
            scope(
              GL, '.uniformMatrix', dim, 'fv(',
              LOCATION, ',false,', MAT_VALUE, ');');
          } else {
            switch (type) {
              case GL_FLOAT$8:
                check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
                infix = '1f';
                break
              case GL_FLOAT_VEC2:
                check$1.command(
                  isArrayLike(value) && value.length === 2,
                  'uniform ' + name, env.commandStr);
                infix = '2f';
                break
              case GL_FLOAT_VEC3:
                check$1.command(
                  isArrayLike(value) && value.length === 3,
                  'uniform ' + name, env.commandStr);
                infix = '3f';
                break
              case GL_FLOAT_VEC4:
                check$1.command(
                  isArrayLike(value) && value.length === 4,
                  'uniform ' + name, env.commandStr);
                infix = '4f';
                break
              case GL_BOOL:
                check$1.commandType(value, 'boolean', 'uniform ' + name, env.commandStr);
                infix = '1i';
                break
              case GL_INT$3:
                check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
                infix = '1i';
                break
              case GL_BOOL_VEC2:
                check$1.command(
                  isArrayLike(value) && value.length === 2,
                  'uniform ' + name, env.commandStr);
                infix = '2i';
                break
              case GL_INT_VEC2:
                check$1.command(
                  isArrayLike(value) && value.length === 2,
                  'uniform ' + name, env.commandStr);
                infix = '2i';
                break
              case GL_BOOL_VEC3:
                check$1.command(
                  isArrayLike(value) && value.length === 3,
                  'uniform ' + name, env.commandStr);
                infix = '3i';
                break
              case GL_INT_VEC3:
                check$1.command(
                  isArrayLike(value) && value.length === 3,
                  'uniform ' + name, env.commandStr);
                infix = '3i';
                break
              case GL_BOOL_VEC4:
                check$1.command(
                  isArrayLike(value) && value.length === 4,
                  'uniform ' + name, env.commandStr);
                infix = '4i';
                break
              case GL_INT_VEC4:
                check$1.command(
                  isArrayLike(value) && value.length === 4,
                  'uniform ' + name, env.commandStr);
                infix = '4i';
                break
            }
            scope(GL, '.uniform', infix, '(', LOCATION, ',',
              isArrayLike(value) ? Array.prototype.slice.call(value) : value,
              ');');
          }
          continue
        } else {
          VALUE = arg.append(env, scope);
        }
      } else {
        if (!filter(SCOPE_DECL)) {
          continue
        }
        VALUE = scope.def(shared.uniforms, '[', stringStore.id(name), ']');
      }

      if (type === GL_SAMPLER_2D) {
        scope(
          'if(', VALUE, '&&', VALUE, '._reglType==="framebuffer"){',
          VALUE, '=', VALUE, '.color[0];',
          '}');
      } else if (type === GL_SAMPLER_CUBE) {
        scope(
          'if(', VALUE, '&&', VALUE, '._reglType==="framebufferCube"){',
          VALUE, '=', VALUE, '.color[0];',
          '}');
      }

      // perform type validation
      check$1.optional(function () {
        function check (pred, message) {
          env.assert(scope, pred,
            'bad data or missing for uniform "' + name + '".  ' + message);
        }

        function checkType (type) {
          check(
            'typeof ' + VALUE + '==="' + type + '"',
            'invalid type, expected ' + type);
        }

        function checkVector (n, type) {
          check(
            shared.isArrayLike + '(' + VALUE + ')&&' + VALUE + '.length===' + n,
            'invalid vector, should have length ' + n, env.commandStr);
        }

        function checkTexture (target) {
          check(
            'typeof ' + VALUE + '==="function"&&' +
            VALUE + '._reglType==="texture' +
            (target === GL_TEXTURE_2D$3 ? '2d' : 'Cube') + '"',
            'invalid texture type', env.commandStr);
        }

        switch (type) {
          case GL_INT$3:
            checkType('number');
            break
          case GL_INT_VEC2:
            checkVector(2, 'number');
            break
          case GL_INT_VEC3:
            checkVector(3, 'number');
            break
          case GL_INT_VEC4:
            checkVector(4, 'number');
            break
          case GL_FLOAT$8:
            checkType('number');
            break
          case GL_FLOAT_VEC2:
            checkVector(2, 'number');
            break
          case GL_FLOAT_VEC3:
            checkVector(3, 'number');
            break
          case GL_FLOAT_VEC4:
            checkVector(4, 'number');
            break
          case GL_BOOL:
            checkType('boolean');
            break
          case GL_BOOL_VEC2:
            checkVector(2, 'boolean');
            break
          case GL_BOOL_VEC3:
            checkVector(3, 'boolean');
            break
          case GL_BOOL_VEC4:
            checkVector(4, 'boolean');
            break
          case GL_FLOAT_MAT2:
            checkVector(4, 'number');
            break
          case GL_FLOAT_MAT3:
            checkVector(9, 'number');
            break
          case GL_FLOAT_MAT4:
            checkVector(16, 'number');
            break
          case GL_SAMPLER_2D:
            checkTexture(GL_TEXTURE_2D$3);
            break
          case GL_SAMPLER_CUBE:
            checkTexture(GL_TEXTURE_CUBE_MAP$2);
            break
        }
      });

      var unroll = 1;
      switch (type) {
        case GL_SAMPLER_2D:
        case GL_SAMPLER_CUBE:
          var TEX = scope.def(VALUE, '._texture');
          scope(GL, '.uniform1i(', LOCATION, ',', TEX, '.bind());');
          scope.exit(TEX, '.unbind();');
          continue

        case GL_INT$3:
        case GL_BOOL:
          infix = '1i';
          break

        case GL_INT_VEC2:
        case GL_BOOL_VEC2:
          infix = '2i';
          unroll = 2;
          break

        case GL_INT_VEC3:
        case GL_BOOL_VEC3:
          infix = '3i';
          unroll = 3;
          break

        case GL_INT_VEC4:
        case GL_BOOL_VEC4:
          infix = '4i';
          unroll = 4;
          break

        case GL_FLOAT$8:
          infix = '1f';
          break

        case GL_FLOAT_VEC2:
          infix = '2f';
          unroll = 2;
          break

        case GL_FLOAT_VEC3:
          infix = '3f';
          unroll = 3;
          break

        case GL_FLOAT_VEC4:
          infix = '4f';
          unroll = 4;
          break

        case GL_FLOAT_MAT2:
          infix = 'Matrix2fv';
          break

        case GL_FLOAT_MAT3:
          infix = 'Matrix3fv';
          break

        case GL_FLOAT_MAT4:
          infix = 'Matrix4fv';
          break
      }

      scope(GL, '.uniform', infix, '(', LOCATION, ',');
      if (infix.charAt(0) === 'M') {
        var matSize = Math.pow(type - GL_FLOAT_MAT2 + 2, 2);
        var STORAGE = env.global.def('new Float32Array(', matSize, ')');
        scope(
          'false,(Array.isArray(', VALUE, ')||', VALUE, ' instanceof Float32Array)?', VALUE, ':(',
          loop(matSize, function (i) {
            return STORAGE + '[' + i + ']=' + VALUE + '[' + i + ']'
          }), ',', STORAGE, ')');
      } else if (unroll > 1) {
        scope(loop(unroll, function (i) {
          return VALUE + '[' + i + ']'
        }));
      } else {
        scope(VALUE);
      }
      scope(');');
    }
  }

  function emitDraw (env, outer, inner, args) {
    var shared = env.shared;
    var GL = shared.gl;
    var DRAW_STATE = shared.draw;

    var drawOptions = args.draw;

    function emitElements () {
      var defn = drawOptions.elements;
      var ELEMENTS;
      var scope = outer;
      if (defn) {
        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
          scope = inner;
        }
        ELEMENTS = defn.append(env, scope);
      } else {
        ELEMENTS = scope.def(DRAW_STATE, '.', S_ELEMENTS);
      }
      if (ELEMENTS) {
        scope(
          'if(' + ELEMENTS + ')' +
          GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$1 + ',' + ELEMENTS + '.buffer.buffer);');
      }
      return ELEMENTS
    }

    function emitCount () {
      var defn = drawOptions.count;
      var COUNT;
      var scope = outer;
      if (defn) {
        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
          scope = inner;
        }
        COUNT = defn.append(env, scope);
        check$1.optional(function () {
          if (defn.MISSING) {
            env.assert(outer, 'false', 'missing vertex count');
          }
          if (defn.DYNAMIC) {
            env.assert(scope, COUNT + '>=0', 'missing vertex count');
          }
        });
      } else {
        COUNT = scope.def(DRAW_STATE, '.', S_COUNT);
        check$1.optional(function () {
          env.assert(scope, COUNT + '>=0', 'missing vertex count');
        });
      }
      return COUNT
    }

    var ELEMENTS = emitElements();
    function emitValue (name) {
      var defn = drawOptions[name];
      if (defn) {
        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
          return defn.append(env, inner)
        } else {
          return defn.append(env, outer)
        }
      } else {
        return outer.def(DRAW_STATE, '.', name)
      }
    }

    var PRIMITIVE = emitValue(S_PRIMITIVE);
    var OFFSET = emitValue(S_OFFSET);

    var COUNT = emitCount();
    if (typeof COUNT === 'number') {
      if (COUNT === 0) {
        return
      }
    } else {
      inner('if(', COUNT, '){');
      inner.exit('}');
    }

    var INSTANCES, EXT_INSTANCING;
    if (extInstancing) {
      INSTANCES = emitValue(S_INSTANCES);
      EXT_INSTANCING = env.instancing;
    }

    var ELEMENT_TYPE = ELEMENTS + '.type';

    var elementsStatic = drawOptions.elements && isStatic(drawOptions.elements);

    function emitInstancing () {
      function drawElements () {
        inner(EXT_INSTANCING, '.drawElementsInstancedANGLE(', [
          PRIMITIVE,
          COUNT,
          ELEMENT_TYPE,
          OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)',
          INSTANCES
        ], ');');
      }

      function drawArrays () {
        inner(EXT_INSTANCING, '.drawArraysInstancedANGLE(',
          [PRIMITIVE, OFFSET, COUNT, INSTANCES], ');');
      }

      if (ELEMENTS) {
        if (!elementsStatic) {
          inner('if(', ELEMENTS, '){');
          drawElements();
          inner('}else{');
          drawArrays();
          inner('}');
        } else {
          drawElements();
        }
      } else {
        drawArrays();
      }
    }

    function emitRegular () {
      function drawElements () {
        inner(GL + '.drawElements(' + [
          PRIMITIVE,
          COUNT,
          ELEMENT_TYPE,
          OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)'
        ] + ');');
      }

      function drawArrays () {
        inner(GL + '.drawArrays(' + [PRIMITIVE, OFFSET, COUNT] + ');');
      }

      if (ELEMENTS) {
        if (!elementsStatic) {
          inner('if(', ELEMENTS, '){');
          drawElements();
          inner('}else{');
          drawArrays();
          inner('}');
        } else {
          drawElements();
        }
      } else {
        drawArrays();
      }
    }

    if (extInstancing && (typeof INSTANCES !== 'number' || INSTANCES >= 0)) {
      if (typeof INSTANCES === 'string') {
        inner('if(', INSTANCES, '>0){');
        emitInstancing();
        inner('}else if(', INSTANCES, '<0){');
        emitRegular();
        inner('}');
      } else {
        emitInstancing();
      }
    } else {
      emitRegular();
    }
  }

  function createBody (emitBody, parentEnv, args, program, count) {
    var env = createREGLEnvironment();
    var scope = env.proc('body', count);
    check$1.optional(function () {
      env.commandStr = parentEnv.commandStr;
      env.command = env.link(parentEnv.commandStr);
    });
    if (extInstancing) {
      env.instancing = scope.def(
        env.shared.extensions, '.angle_instanced_arrays');
    }
    emitBody(env, scope, args, program);
    return env.compile().body
  }

  // ===================================================
  // ===================================================
  // DRAW PROC
  // ===================================================
  // ===================================================
  function emitDrawBody (env, draw, args, program) {
    injectExtensions(env, draw);
    emitAttributes(env, draw, args, program.attributes, function () {
      return true
    });
    emitUniforms(env, draw, args, program.uniforms, function () {
      return true
    });
    emitDraw(env, draw, draw, args);
  }

  function emitDrawProc (env, args) {
    var draw = env.proc('draw', 1);

    injectExtensions(env, draw);

    emitContext(env, draw, args.context);
    emitPollFramebuffer(env, draw, args.framebuffer);

    emitPollState(env, draw, args);
    emitSetOptions(env, draw, args.state);

    emitProfile(env, draw, args, false, true);

    var program = args.shader.progVar.append(env, draw);
    draw(env.shared.gl, '.useProgram(', program, '.program);');

    if (args.shader.program) {
      emitDrawBody(env, draw, args, args.shader.program);
    } else {
      var drawCache = env.global.def('{}');
      var PROG_ID = draw.def(program, '.id');
      var CACHED_PROC = draw.def(drawCache, '[', PROG_ID, ']');
      draw(
        env.cond(CACHED_PROC)
          .then(CACHED_PROC, '.call(this,a0);')
          .else(
            CACHED_PROC, '=', drawCache, '[', PROG_ID, ']=',
            env.link(function (program) {
              return createBody(emitDrawBody, env, args, program, 1)
            }), '(', program, ');',
            CACHED_PROC, '.call(this,a0);'));
    }

    if (Object.keys(args.state).length > 0) {
      draw(env.shared.current, '.dirty=true;');
    }
  }

  // ===================================================
  // ===================================================
  // BATCH PROC
  // ===================================================
  // ===================================================

  function emitBatchDynamicShaderBody (env, scope, args, program) {
    env.batchId = 'a1';

    injectExtensions(env, scope);

    function all () {
      return true
    }

    emitAttributes(env, scope, args, program.attributes, all);
    emitUniforms(env, scope, args, program.uniforms, all);
    emitDraw(env, scope, scope, args);
  }

  function emitBatchBody (env, scope, args, program) {
    injectExtensions(env, scope);

    var contextDynamic = args.contextDep;

    var BATCH_ID = scope.def();
    var PROP_LIST = 'a0';
    var NUM_PROPS = 'a1';
    var PROPS = scope.def();
    env.shared.props = PROPS;
    env.batchId = BATCH_ID;

    var outer = env.scope();
    var inner = env.scope();

    scope(
      outer.entry,
      'for(', BATCH_ID, '=0;', BATCH_ID, '<', NUM_PROPS, ';++', BATCH_ID, '){',
      PROPS, '=', PROP_LIST, '[', BATCH_ID, '];',
      inner,
      '}',
      outer.exit);

    function isInnerDefn (defn) {
      return ((defn.contextDep && contextDynamic) || defn.propDep)
    }

    function isOuterDefn (defn) {
      return !isInnerDefn(defn)
    }

    if (args.needsContext) {
      emitContext(env, inner, args.context);
    }
    if (args.needsFramebuffer) {
      emitPollFramebuffer(env, inner, args.framebuffer);
    }
    emitSetOptions(env, inner, args.state, isInnerDefn);

    if (args.profile && isInnerDefn(args.profile)) {
      emitProfile(env, inner, args, false, true);
    }

    if (!program) {
      var progCache = env.global.def('{}');
      var PROGRAM = args.shader.progVar.append(env, inner);
      var PROG_ID = inner.def(PROGRAM, '.id');
      var CACHED_PROC = inner.def(progCache, '[', PROG_ID, ']');
      inner(
        env.shared.gl, '.useProgram(', PROGRAM, '.program);',
        'if(!', CACHED_PROC, '){',
        CACHED_PROC, '=', progCache, '[', PROG_ID, ']=',
        env.link(function (program) {
          return createBody(
            emitBatchDynamicShaderBody, env, args, program, 2)
        }), '(', PROGRAM, ');}',
        CACHED_PROC, '.call(this,a0[', BATCH_ID, '],', BATCH_ID, ');');
    } else {
      emitAttributes(env, outer, args, program.attributes, isOuterDefn);
      emitAttributes(env, inner, args, program.attributes, isInnerDefn);
      emitUniforms(env, outer, args, program.uniforms, isOuterDefn);
      emitUniforms(env, inner, args, program.uniforms, isInnerDefn);
      emitDraw(env, outer, inner, args);
    }
  }

  function emitBatchProc (env, args) {
    var batch = env.proc('batch', 2);
    env.batchId = '0';

    injectExtensions(env, batch);

    // Check if any context variables depend on props
    var contextDynamic = false;
    var needsContext = true;
    Object.keys(args.context).forEach(function (name) {
      contextDynamic = contextDynamic || args.context[name].propDep;
    });
    if (!contextDynamic) {
      emitContext(env, batch, args.context);
      needsContext = false;
    }

    // framebuffer state affects framebufferWidth/height context vars
    var framebuffer = args.framebuffer;
    var needsFramebuffer = false;
    if (framebuffer) {
      if (framebuffer.propDep) {
        contextDynamic = needsFramebuffer = true;
      } else if (framebuffer.contextDep && contextDynamic) {
        needsFramebuffer = true;
      }
      if (!needsFramebuffer) {
        emitPollFramebuffer(env, batch, framebuffer);
      }
    } else {
      emitPollFramebuffer(env, batch, null);
    }

    // viewport is weird because it can affect context vars
    if (args.state.viewport && args.state.viewport.propDep) {
      contextDynamic = true;
    }

    function isInnerDefn (defn) {
      return (defn.contextDep && contextDynamic) || defn.propDep
    }

    // set webgl options
    emitPollState(env, batch, args);
    emitSetOptions(env, batch, args.state, function (defn) {
      return !isInnerDefn(defn)
    });

    if (!args.profile || !isInnerDefn(args.profile)) {
      emitProfile(env, batch, args, false, 'a1');
    }

    // Save these values to args so that the batch body routine can use them
    args.contextDep = contextDynamic;
    args.needsContext = needsContext;
    args.needsFramebuffer = needsFramebuffer;

    // determine if shader is dynamic
    var progDefn = args.shader.progVar;
    if ((progDefn.contextDep && contextDynamic) || progDefn.propDep) {
      emitBatchBody(
        env,
        batch,
        args,
        null);
    } else {
      var PROGRAM = progDefn.append(env, batch);
      batch(env.shared.gl, '.useProgram(', PROGRAM, '.program);');
      if (args.shader.program) {
        emitBatchBody(
          env,
          batch,
          args,
          args.shader.program);
      } else {
        var batchCache = env.global.def('{}');
        var PROG_ID = batch.def(PROGRAM, '.id');
        var CACHED_PROC = batch.def(batchCache, '[', PROG_ID, ']');
        batch(
          env.cond(CACHED_PROC)
            .then(CACHED_PROC, '.call(this,a0,a1);')
            .else(
              CACHED_PROC, '=', batchCache, '[', PROG_ID, ']=',
              env.link(function (program) {
                return createBody(emitBatchBody, env, args, program, 2)
              }), '(', PROGRAM, ');',
              CACHED_PROC, '.call(this,a0,a1);'));
      }
    }

    if (Object.keys(args.state).length > 0) {
      batch(env.shared.current, '.dirty=true;');
    }
  }

  // ===================================================
  // ===================================================
  // SCOPE COMMAND
  // ===================================================
  // ===================================================
  function emitScopeProc (env, args) {
    var scope = env.proc('scope', 3);
    env.batchId = 'a2';

    var shared = env.shared;
    var CURRENT_STATE = shared.current;

    emitContext(env, scope, args.context);

    if (args.framebuffer) {
      args.framebuffer.append(env, scope);
    }

    sortState(Object.keys(args.state)).forEach(function (name) {
      var defn = args.state[name];
      var value = defn.append(env, scope);
      if (isArrayLike(value)) {
        value.forEach(function (v, i) {
          scope.set(env.next[name], '[' + i + ']', v);
        });
      } else {
        scope.set(shared.next, '.' + name, value);
      }
    });

    emitProfile(env, scope, args, true, true)

    ;[S_ELEMENTS, S_OFFSET, S_COUNT, S_INSTANCES, S_PRIMITIVE].forEach(
      function (opt) {
        var variable = args.draw[opt];
        if (!variable) {
          return
        }
        scope.set(shared.draw, '.' + opt, '' + variable.append(env, scope));
      });

    Object.keys(args.uniforms).forEach(function (opt) {
      scope.set(
        shared.uniforms,
        '[' + stringStore.id(opt) + ']',
        args.uniforms[opt].append(env, scope));
    });

    Object.keys(args.attributes).forEach(function (name) {
      var record = args.attributes[name].append(env, scope);
      var scopeAttrib = env.scopeAttrib(name);
      Object.keys(new AttributeRecord()).forEach(function (prop) {
        scope.set(scopeAttrib, '.' + prop, record[prop]);
      });
    });

    function saveShader (name) {
      var shader = args.shader[name];
      if (shader) {
        scope.set(shared.shader, '.' + name, shader.append(env, scope));
      }
    }
    saveShader(S_VERT);
    saveShader(S_FRAG);

    if (Object.keys(args.state).length > 0) {
      scope(CURRENT_STATE, '.dirty=true;');
      scope.exit(CURRENT_STATE, '.dirty=true;');
    }

    scope('a1(', env.shared.context, ',a0,', env.batchId, ');');
  }

  function isDynamicObject (object) {
    if (typeof object !== 'object' || isArrayLike(object)) {
      return
    }
    var props = Object.keys(object);
    for (var i = 0; i < props.length; ++i) {
      if (dynamic.isDynamic(object[props[i]])) {
        return true
      }
    }
    return false
  }

  function splatObject (env, options, name) {
    var object = options.static[name];
    if (!object || !isDynamicObject(object)) {
      return
    }

    var globals = env.global;
    var keys = Object.keys(object);
    var thisDep = false;
    var contextDep = false;
    var propDep = false;
    var objectRef = env.global.def('{}');
    keys.forEach(function (key) {
      var value = object[key];
      if (dynamic.isDynamic(value)) {
        if (typeof value === 'function') {
          value = object[key] = dynamic.unbox(value);
        }
        var deps = createDynamicDecl(value, null);
        thisDep = thisDep || deps.thisDep;
        propDep = propDep || deps.propDep;
        contextDep = contextDep || deps.contextDep;
      } else {
        globals(objectRef, '.', key, '=');
        switch (typeof value) {
          case 'number':
            globals(value);
            break
          case 'string':
            globals('"', value, '"');
            break
          case 'object':
            if (Array.isArray(value)) {
              globals('[', value.join(), ']');
            }
            break
          default:
            globals(env.link(value));
            break
        }
        globals(';');
      }
    });

    function appendBlock (env, block) {
      keys.forEach(function (key) {
        var value = object[key];
        if (!dynamic.isDynamic(value)) {
          return
        }
        var ref = env.invoke(block, value);
        block(objectRef, '.', key, '=', ref, ';');
      });
    }

    options.dynamic[name] = new dynamic.DynamicVariable(DYN_THUNK, {
      thisDep: thisDep,
      contextDep: contextDep,
      propDep: propDep,
      ref: objectRef,
      append: appendBlock
    });
    delete options.static[name];
  }

  // ===========================================================================
  // ===========================================================================
  // MAIN DRAW COMMAND
  // ===========================================================================
  // ===========================================================================
  function compileCommand (options, attributes, uniforms, context, stats) {
    var env = createREGLEnvironment();

    // link stats, so that we can easily access it in the program.
    env.stats = env.link(stats);

    // splat options and attributes to allow for dynamic nested properties
    Object.keys(attributes.static).forEach(function (key) {
      splatObject(env, attributes, key);
    });
    NESTED_OPTIONS.forEach(function (name) {
      splatObject(env, options, name);
    });

    var args = parseArguments(options, attributes, uniforms, context, env);

    emitDrawProc(env, args);
    emitScopeProc(env, args);
    emitBatchProc(env, args);

    return env.compile()
  }

  // ===========================================================================
  // ===========================================================================
  // POLL / REFRESH
  // ===========================================================================
  // ===========================================================================
  return {
    next: nextState,
    current: currentState,
    procs: (function () {
      var env = createREGLEnvironment();
      var poll = env.proc('poll');
      var refresh = env.proc('refresh');
      var common = env.block();
      poll(common);
      refresh(common);

      var shared = env.shared;
      var GL = shared.gl;
      var NEXT_STATE = shared.next;
      var CURRENT_STATE = shared.current;

      common(CURRENT_STATE, '.dirty=false;');

      emitPollFramebuffer(env, poll);
      emitPollFramebuffer(env, refresh, null, true);

      // Refresh updates all attribute state changes
      var INSTANCING;
      if (extInstancing) {
        INSTANCING = env.link(extInstancing);
      }
      for (var i = 0; i < limits.maxAttributes; ++i) {
        var BINDING = refresh.def(shared.attributes, '[', i, ']');
        var ifte = env.cond(BINDING, '.buffer');
        ifte.then(
          GL, '.enableVertexAttribArray(', i, ');',
          GL, '.bindBuffer(',
            GL_ARRAY_BUFFER$1, ',',
            BINDING, '.buffer.buffer);',
          GL, '.vertexAttribPointer(',
            i, ',',
            BINDING, '.size,',
            BINDING, '.type,',
            BINDING, '.normalized,',
            BINDING, '.stride,',
            BINDING, '.offset);'
        ).else(
          GL, '.disableVertexAttribArray(', i, ');',
          GL, '.vertexAttrib4f(',
            i, ',',
            BINDING, '.x,',
            BINDING, '.y,',
            BINDING, '.z,',
            BINDING, '.w);',
          BINDING, '.buffer=null;');
        refresh(ifte);
        if (extInstancing) {
          refresh(
            INSTANCING, '.vertexAttribDivisorANGLE(',
            i, ',',
            BINDING, '.divisor);');
        }
      }

      Object.keys(GL_FLAGS).forEach(function (flag) {
        var cap = GL_FLAGS[flag];
        var NEXT = common.def(NEXT_STATE, '.', flag);
        var block = env.block();
        block('if(', NEXT, '){',
          GL, '.enable(', cap, ')}else{',
          GL, '.disable(', cap, ')}',
          CURRENT_STATE, '.', flag, '=', NEXT, ';');
        refresh(block);
        poll(
          'if(', NEXT, '!==', CURRENT_STATE, '.', flag, '){',
          block,
          '}');
      });

      Object.keys(GL_VARIABLES).forEach(function (name) {
        var func = GL_VARIABLES[name];
        var init = currentState[name];
        var NEXT, CURRENT;
        var block = env.block();
        block(GL, '.', func, '(');
        if (isArrayLike(init)) {
          var n = init.length;
          NEXT = env.global.def(NEXT_STATE, '.', name);
          CURRENT = env.global.def(CURRENT_STATE, '.', name);
          block(
            loop(n, function (i) {
              return NEXT + '[' + i + ']'
            }), ');',
            loop(n, function (i) {
              return CURRENT + '[' + i + ']=' + NEXT + '[' + i + '];'
            }).join(''));
          poll(
            'if(', loop(n, function (i) {
              return NEXT + '[' + i + ']!==' + CURRENT + '[' + i + ']'
            }).join('||'), '){',
            block,
            '}');
        } else {
          NEXT = common.def(NEXT_STATE, '.', name);
          CURRENT = common.def(CURRENT_STATE, '.', name);
          block(
            NEXT, ');',
            CURRENT_STATE, '.', name, '=', NEXT, ';');
          poll(
            'if(', NEXT, '!==', CURRENT, '){',
            block,
            '}');
        }
        refresh(block);
      });

      return env.compile()
    })(),
    compile: compileCommand
  }
}

function stats () {
  return {
    bufferCount: 0,
    elementsCount: 0,
    framebufferCount: 0,
    shaderCount: 0,
    textureCount: 0,
    cubeCount: 0,
    renderbufferCount: 0,
    maxTextureUnits: 0
  }
}

var GL_QUERY_RESULT_EXT = 0x8866;
var GL_QUERY_RESULT_AVAILABLE_EXT = 0x8867;
var GL_TIME_ELAPSED_EXT = 0x88BF;

var createTimer = function (gl, extensions) {
  if (!extensions.ext_disjoint_timer_query) {
    return null
  }

  // QUERY POOL BEGIN
  var queryPool = [];
  function allocQuery () {
    return queryPool.pop() || extensions.ext_disjoint_timer_query.createQueryEXT()
  }
  function freeQuery (query) {
    queryPool.push(query);
  }
  // QUERY POOL END

  var pendingQueries = [];
  function beginQuery (stats) {
    var query = allocQuery();
    extensions.ext_disjoint_timer_query.beginQueryEXT(GL_TIME_ELAPSED_EXT, query);
    pendingQueries.push(query);
    pushScopeStats(pendingQueries.length - 1, pendingQueries.length, stats);
  }

  function endQuery () {
    extensions.ext_disjoint_timer_query.endQueryEXT(GL_TIME_ELAPSED_EXT);
  }

  //
  // Pending stats pool.
  //
  function PendingStats () {
    this.startQueryIndex = -1;
    this.endQueryIndex = -1;
    this.sum = 0;
    this.stats = null;
  }
  var pendingStatsPool = [];
  function allocPendingStats () {
    return pendingStatsPool.pop() || new PendingStats()
  }
  function freePendingStats (pendingStats) {
    pendingStatsPool.push(pendingStats);
  }
  // Pending stats pool end

  var pendingStats = [];
  function pushScopeStats (start, end, stats) {
    var ps = allocPendingStats();
    ps.startQueryIndex = start;
    ps.endQueryIndex = end;
    ps.sum = 0;
    ps.stats = stats;
    pendingStats.push(ps);
  }

  // we should call this at the beginning of the frame,
  // in order to update gpuTime
  var timeSum = [];
  var queryPtr = [];
  function update () {
    var ptr, i;

    var n = pendingQueries.length;
    if (n === 0) {
      return
    }

    // Reserve space
    queryPtr.length = Math.max(queryPtr.length, n + 1);
    timeSum.length = Math.max(timeSum.length, n + 1);
    timeSum[0] = 0;
    queryPtr[0] = 0;

    // Update all pending timer queries
    var queryTime = 0;
    ptr = 0;
    for (i = 0; i < pendingQueries.length; ++i) {
      var query = pendingQueries[i];
      if (extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_AVAILABLE_EXT)) {
        queryTime += extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_EXT);
        freeQuery(query);
      } else {
        pendingQueries[ptr++] = query;
      }
      timeSum[i + 1] = queryTime;
      queryPtr[i + 1] = ptr;
    }
    pendingQueries.length = ptr;

    // Update all pending stat queries
    ptr = 0;
    for (i = 0; i < pendingStats.length; ++i) {
      var stats = pendingStats[i];
      var start = stats.startQueryIndex;
      var end = stats.endQueryIndex;
      stats.sum += timeSum[end] - timeSum[start];
      var startPtr = queryPtr[start];
      var endPtr = queryPtr[end];
      if (endPtr === startPtr) {
        stats.stats.gpuTime += stats.sum / 1e6;
        freePendingStats(stats);
      } else {
        stats.startQueryIndex = startPtr;
        stats.endQueryIndex = endPtr;
        pendingStats[ptr++] = stats;
      }
    }
    pendingStats.length = ptr;
  }

  return {
    beginQuery: beginQuery,
    endQuery: endQuery,
    pushScopeStats: pushScopeStats,
    update: update,
    getNumPendingQueries: function () {
      return pendingQueries.length
    },
    clear: function () {
      queryPool.push.apply(queryPool, pendingQueries);
      for (var i = 0; i < queryPool.length; i++) {
        extensions.ext_disjoint_timer_query.deleteQueryEXT(queryPool[i]);
      }
      pendingQueries.length = 0;
      queryPool.length = 0;
    },
    restore: function () {
      pendingQueries.length = 0;
      queryPool.length = 0;
    }
  }
};

var GL_COLOR_BUFFER_BIT = 16384;
var GL_DEPTH_BUFFER_BIT = 256;
var GL_STENCIL_BUFFER_BIT = 1024;

var GL_ARRAY_BUFFER = 34962;

var CONTEXT_LOST_EVENT = 'webglcontextlost';
var CONTEXT_RESTORED_EVENT = 'webglcontextrestored';

var DYN_PROP = 1;
var DYN_CONTEXT = 2;
var DYN_STATE = 3;

function find (haystack, needle) {
  for (var i = 0; i < haystack.length; ++i) {
    if (haystack[i] === needle) {
      return i
    }
  }
  return -1
}

function wrapREGL (args) {
  var config = parseArgs(args);
  if (!config) {
    return null
  }

  var gl = config.gl;
  var glAttributes = gl.getContextAttributes();
  var contextLost = gl.isContextLost();

  var extensionState = createExtensionCache(gl, config);
  if (!extensionState) {
    return null
  }

  var stringStore = createStringStore();
  var stats$$1 = stats();
  var extensions = extensionState.extensions;
  var timer = createTimer(gl, extensions);

  var START_TIME = clock();
  var WIDTH = gl.drawingBufferWidth;
  var HEIGHT = gl.drawingBufferHeight;

  var contextState = {
    tick: 0,
    time: 0,
    viewportWidth: WIDTH,
    viewportHeight: HEIGHT,
    framebufferWidth: WIDTH,
    framebufferHeight: HEIGHT,
    drawingBufferWidth: WIDTH,
    drawingBufferHeight: HEIGHT,
    pixelRatio: config.pixelRatio
  };
  var uniformState = {};
  var drawState = {
    elements: null,
    primitive: 4, // GL_TRIANGLES
    count: -1,
    offset: 0,
    instances: -1
  };

  var limits = wrapLimits(gl, extensions);
  var attributeState = wrapAttributeState(
    gl,
    extensions,
    limits,
    stringStore);
  var bufferState = wrapBufferState(
    gl,
    stats$$1,
    config,
    attributeState);
  var elementState = wrapElementsState(gl, extensions, bufferState, stats$$1);
  var shaderState = wrapShaderState(gl, stringStore, stats$$1, config);
  var textureState = createTextureSet(
    gl,
    extensions,
    limits,
    function () { core.procs.poll(); },
    contextState,
    stats$$1,
    config);
  var renderbufferState = wrapRenderbuffers(gl, extensions, limits, stats$$1, config);
  var framebufferState = wrapFBOState(
    gl,
    extensions,
    limits,
    textureState,
    renderbufferState,
    stats$$1);
  var core = reglCore(
    gl,
    stringStore,
    extensions,
    limits,
    bufferState,
    elementState,
    textureState,
    framebufferState,
    uniformState,
    attributeState,
    shaderState,
    drawState,
    contextState,
    timer,
    config);
  var readPixels = wrapReadPixels(
    gl,
    framebufferState,
    core.procs.poll,
    contextState,
    glAttributes, extensions, limits);

  var nextState = core.next;
  var canvas = gl.canvas;

  var rafCallbacks = [];
  var lossCallbacks = [];
  var restoreCallbacks = [];
  var destroyCallbacks = [config.onDestroy];

  var activeRAF = null;
  function handleRAF () {
    if (rafCallbacks.length === 0) {
      if (timer) {
        timer.update();
      }
      activeRAF = null;
      return
    }

    // schedule next animation frame
    activeRAF = raf.next(handleRAF);

    // poll for changes
    poll();

    // fire a callback for all pending rafs
    for (var i = rafCallbacks.length - 1; i >= 0; --i) {
      var cb = rafCallbacks[i];
      if (cb) {
        cb(contextState, null, 0);
      }
    }

    // flush all pending webgl calls
    gl.flush();

    // poll GPU timers *after* gl.flush so we don't delay command dispatch
    if (timer) {
      timer.update();
    }
  }

  function startRAF () {
    if (!activeRAF && rafCallbacks.length > 0) {
      activeRAF = raf.next(handleRAF);
    }
  }

  function stopRAF () {
    if (activeRAF) {
      raf.cancel(handleRAF);
      activeRAF = null;
    }
  }

  function handleContextLoss (event) {
    event.preventDefault();

    // set context lost flag
    contextLost = true;

    // pause request animation frame
    stopRAF();

    // lose context
    lossCallbacks.forEach(function (cb) {
      cb();
    });
  }

  function handleContextRestored (event) {
    // clear error code
    gl.getError();

    // clear context lost flag
    contextLost = false;

    // refresh state
    extensionState.restore();
    shaderState.restore();
    bufferState.restore();
    textureState.restore();
    renderbufferState.restore();
    framebufferState.restore();
    if (timer) {
      timer.restore();
    }

    // refresh state
    core.procs.refresh();

    // restart RAF
    startRAF();

    // restore context
    restoreCallbacks.forEach(function (cb) {
      cb();
    });
  }

  if (canvas) {
    canvas.addEventListener(CONTEXT_LOST_EVENT, handleContextLoss, false);
    canvas.addEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored, false);
  }

  function destroy () {
    rafCallbacks.length = 0;
    stopRAF();

    if (canvas) {
      canvas.removeEventListener(CONTEXT_LOST_EVENT, handleContextLoss);
      canvas.removeEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored);
    }

    shaderState.clear();
    framebufferState.clear();
    renderbufferState.clear();
    textureState.clear();
    elementState.clear();
    bufferState.clear();

    if (timer) {
      timer.clear();
    }

    destroyCallbacks.forEach(function (cb) {
      cb();
    });
  }

  function compileProcedure (options) {
    check$1(!!options, 'invalid args to regl({...})');
    check$1.type(options, 'object', 'invalid args to regl({...})');

    function flattenNestedOptions (options) {
      var result = extend({}, options);
      delete result.uniforms;
      delete result.attributes;
      delete result.context;

      if ('stencil' in result && result.stencil.op) {
        result.stencil.opBack = result.stencil.opFront = result.stencil.op;
        delete result.stencil.op;
      }

      function merge (name) {
        if (name in result) {
          var child = result[name];
          delete result[name];
          Object.keys(child).forEach(function (prop) {
            result[name + '.' + prop] = child[prop];
          });
        }
      }
      merge('blend');
      merge('depth');
      merge('cull');
      merge('stencil');
      merge('polygonOffset');
      merge('scissor');
      merge('sample');

      return result
    }

    function separateDynamic (object) {
      var staticItems = {};
      var dynamicItems = {};
      Object.keys(object).forEach(function (option) {
        var value = object[option];
        if (dynamic.isDynamic(value)) {
          dynamicItems[option] = dynamic.unbox(value, option);
        } else {
          staticItems[option] = value;
        }
      });
      return {
        dynamic: dynamicItems,
        static: staticItems
      }
    }

    // Treat context variables separate from other dynamic variables
    var context = separateDynamic(options.context || {});
    var uniforms = separateDynamic(options.uniforms || {});
    var attributes = separateDynamic(options.attributes || {});
    var opts = separateDynamic(flattenNestedOptions(options));

    var stats$$1 = {
      gpuTime: 0.0,
      cpuTime: 0.0,
      count: 0
    };

    var compiled = core.compile(opts, attributes, uniforms, context, stats$$1);

    var draw = compiled.draw;
    var batch = compiled.batch;
    var scope = compiled.scope;

    // FIXME: we should modify code generation for batch commands so this
    // isn't necessary
    var EMPTY_ARRAY = [];
    function reserve (count) {
      while (EMPTY_ARRAY.length < count) {
        EMPTY_ARRAY.push(null);
      }
      return EMPTY_ARRAY
    }

    function REGLCommand (args, body) {
      var i;
      if (contextLost) {
        check$1.raise('context lost');
      }
      if (typeof args === 'function') {
        return scope.call(this, null, args, 0)
      } else if (typeof body === 'function') {
        if (typeof args === 'number') {
          for (i = 0; i < args; ++i) {
            scope.call(this, null, body, i);
          }
          return
        } else if (Array.isArray(args)) {
          for (i = 0; i < args.length; ++i) {
            scope.call(this, args[i], body, i);
          }
          return
        } else {
          return scope.call(this, args, body, 0)
        }
      } else if (typeof args === 'number') {
        if (args > 0) {
          return batch.call(this, reserve(args | 0), args | 0)
        }
      } else if (Array.isArray(args)) {
        if (args.length) {
          return batch.call(this, args, args.length)
        }
      } else {
        return draw.call(this, args)
      }
    }

    return extend(REGLCommand, {
      stats: stats$$1
    })
  }

  var setFBO = framebufferState.setFBO = compileProcedure({
    framebuffer: dynamic.define.call(null, DYN_PROP, 'framebuffer')
  });

  function clearImpl (_, options) {
    var clearFlags = 0;
    core.procs.poll();

    var c = options.color;
    if (c) {
      gl.clearColor(+c[0] || 0, +c[1] || 0, +c[2] || 0, +c[3] || 0);
      clearFlags |= GL_COLOR_BUFFER_BIT;
    }
    if ('depth' in options) {
      gl.clearDepth(+options.depth);
      clearFlags |= GL_DEPTH_BUFFER_BIT;
    }
    if ('stencil' in options) {
      gl.clearStencil(options.stencil | 0);
      clearFlags |= GL_STENCIL_BUFFER_BIT;
    }

    check$1(!!clearFlags, 'called regl.clear with no buffer specified');
    gl.clear(clearFlags);
  }

  function clear (options) {
    check$1(
      typeof options === 'object' && options,
      'regl.clear() takes an object as input');
    if ('framebuffer' in options) {
      if (options.framebuffer &&
          options.framebuffer_reglType === 'framebufferCube') {
        for (var i = 0; i < 6; ++i) {
          setFBO(extend({
            framebuffer: options.framebuffer.faces[i]
          }, options), clearImpl);
        }
      } else {
        setFBO(options, clearImpl);
      }
    } else {
      clearImpl(null, options);
    }
  }

  function frame (cb) {
    check$1.type(cb, 'function', 'regl.frame() callback must be a function');
    rafCallbacks.push(cb);

    function cancel () {
      // FIXME:  should we check something other than equals cb here?
      // what if a user calls frame twice with the same callback...
      //
      var i = find(rafCallbacks, cb);
      check$1(i >= 0, 'cannot cancel a frame twice');
      function pendingCancel () {
        var index = find(rafCallbacks, pendingCancel);
        rafCallbacks[index] = rafCallbacks[rafCallbacks.length - 1];
        rafCallbacks.length -= 1;
        if (rafCallbacks.length <= 0) {
          stopRAF();
        }
      }
      rafCallbacks[i] = pendingCancel;
    }

    startRAF();

    return {
      cancel: cancel
    }
  }

  // poll viewport
  function pollViewport () {
    var viewport = nextState.viewport;
    var scissorBox = nextState.scissor_box;
    viewport[0] = viewport[1] = scissorBox[0] = scissorBox[1] = 0;
    contextState.viewportWidth =
      contextState.framebufferWidth =
      contextState.drawingBufferWidth =
      viewport[2] =
      scissorBox[2] = gl.drawingBufferWidth;
    contextState.viewportHeight =
      contextState.framebufferHeight =
      contextState.drawingBufferHeight =
      viewport[3] =
      scissorBox[3] = gl.drawingBufferHeight;
  }

  function poll () {
    contextState.tick += 1;
    contextState.time = now();
    pollViewport();
    core.procs.poll();
  }

  function refresh () {
    pollViewport();
    core.procs.refresh();
    if (timer) {
      timer.update();
    }
  }

  function now () {
    return (clock() - START_TIME) / 1000.0
  }

  refresh();

  function addListener (event, callback) {
    check$1.type(callback, 'function', 'listener callback must be a function');

    var callbacks;
    switch (event) {
      case 'frame':
        return frame(callback)
      case 'lost':
        callbacks = lossCallbacks;
        break
      case 'restore':
        callbacks = restoreCallbacks;
        break
      case 'destroy':
        callbacks = destroyCallbacks;
        break
      default:
        check$1.raise('invalid event, must be one of frame,lost,restore,destroy');
    }

    callbacks.push(callback);
    return {
      cancel: function () {
        for (var i = 0; i < callbacks.length; ++i) {
          if (callbacks[i] === callback) {
            callbacks[i] = callbacks[callbacks.length - 1];
            callbacks.pop();
            return
          }
        }
      }
    }
  }

  var regl = extend(compileProcedure, {
    // Clear current FBO
    clear: clear,

    // Short cuts for dynamic variables
    prop: dynamic.define.bind(null, DYN_PROP),
    context: dynamic.define.bind(null, DYN_CONTEXT),
    this: dynamic.define.bind(null, DYN_STATE),

    // executes an empty draw command
    draw: compileProcedure({}),

    // Resources
    buffer: function (options) {
      return bufferState.create(options, GL_ARRAY_BUFFER, false, false)
    },
    elements: function (options) {
      return elementState.create(options, false)
    },
    texture: textureState.create2D,
    cube: textureState.createCube,
    renderbuffer: renderbufferState.create,
    framebuffer: framebufferState.create,
    framebufferCube: framebufferState.createCube,

    // Expose context attributes
    attributes: glAttributes,

    // Frame rendering
    frame: frame,
    on: addListener,

    // System limits
    limits: limits,
    hasExtension: function (name) {
      return limits.extensions.indexOf(name.toLowerCase()) >= 0
    },

    // Read pixels
    read: readPixels,

    // Destroy regl and all associated resources
    destroy: destroy,

    // Direct GL state manipulation
    _gl: gl,
    _refresh: refresh,

    poll: function () {
      poll();
      if (timer) {
        timer.update();
      }
    },

    // Current time
    now: now,

    // regl Statistics Information
    stats: stats$$1
  });

  config.onDone(null, regl);

  return regl
}

return wrapREGL;

})));


},{}],"../../../node_modules/@thi.ng/hdom/api.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEBUG = false;

},{}],"../../../node_modules/@thi.ng/api/api.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EPS = 1e-6;
exports.EVENT_ALL = "*";
exports.EVENT_ENABLE = "enable";
exports.EVENT_DISABLE = "disable";
exports.SEMAPHORE = Symbol();

},{}],"../../../node_modules/@thi.ng/equiv/index.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OBJP = Object.getPrototypeOf({});
const FN = "function";
const STR = "string";
exports.equiv = (a, b) => {
    let proto;
    if (a === b) {
        return true;
    }
    if (a != null) {
        if (typeof a.equiv === FN) {
            return a.equiv(b);
        }
    }
    else {
        return a == b;
    }
    if (b != null) {
        if (typeof b.equiv === FN) {
            return b.equiv(a);
        }
    }
    else {
        return a == b;
    }
    if (typeof a === STR || typeof b === STR) {
        return false;
    }
    if ((proto = Object.getPrototypeOf(a), proto == null || proto === OBJP) &&
        (proto = Object.getPrototypeOf(b), proto == null || proto === OBJP)) {
        return exports.equivObject(a, b);
    }
    if (typeof a !== FN && a.length !== undefined &&
        typeof b !== FN && b.length !== undefined) {
        return exports.equivArrayLike(a, b);
    }
    if (a instanceof Set && b instanceof Set) {
        return exports.equivSet(a, b);
    }
    if (a instanceof Map && b instanceof Map) {
        return exports.equivMap(a, b);
    }
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.toString() === b.toString();
    }
    // NaN
    return (a !== a && b !== b);
};
exports.equivArrayLike = (a, b, _equiv = exports.equiv) => {
    let l = a.length;
    if (l === b.length) {
        while (--l >= 0 && _equiv(a[l], b[l]))
            ;
    }
    return l < 0;
};
exports.equivSet = (a, b, _equiv = exports.equiv) => (a.size === b.size) &&
    _equiv([...a.keys()].sort(), [...b.keys()].sort());
exports.equivMap = (a, b, _equiv = exports.equiv) => (a.size === b.size) &&
    _equiv([...a].sort(), [...b].sort());
exports.equivObject = (a, b, _equiv = exports.equiv) => {
    if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
    }
    for (let k in a) {
        if (!b.hasOwnProperty(k) || !_equiv(a[k], b[k])) {
            return false;
        }
    }
    return true;
};

},{}],"../../../node_modules/@thi.ng/diff/array.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const equiv_1 = require("@thi.ng/equiv");
let _cachedFP;
let _cachedPath;
let _cachedEPC = [];
let _cachedPathPos = [];
const cachedFP = (size) => _cachedFP && _cachedFP.length >= size ?
    _cachedFP :
    (_cachedFP = new Int32Array(size));
const cachedPath = (size) => _cachedPath && _cachedPath.length >= size ?
    _cachedPath :
    (_cachedPath = new Int32Array(size));
const simpleDiff = (state, src, key, logDir, mode) => {
    const n = src.length;
    const linear = state.linear;
    state.distance = n;
    if (mode !== 0 /* ONLY_DISTANCE */) {
        for (let i = 0, j = 0; i < n; i++, j += 3) {
            linear[j] = logDir;
            linear[j + 1] = i;
            linear[j + 2] = src[i];
        }
        if (mode === 2 /* FULL */) {
            const _state = state[key];
            for (let i = 0; i < n; i++) {
                _state[i] = src[i];
            }
        }
    }
    return state;
};
/**
 * Based on "An O(NP) Sequence Comparison Algorithm""
 * by Wu, Manber, Myers and Miller
 *
 * - http://www.itu.dk/stud/speciale/bepjea/xwebtex/litt/an-onp-sequence-comparison-algorithm.pdf
 * - https://github.com/cubicdaiya/onp
 *
 * Various optimizations, fixes & refactorings.
 * By default uses `@thi.ng/equiv` for equality checks.
 *
 * @param a "old" array
 * @param b "new" array
 * @param mode result mode
 * @param equiv equality predicate function
 */
exports.diffArray = (a, b, mode = 2 /* FULL */, equiv = equiv_1.equiv) => {
    const state = {
        distance: 0,
        adds: {},
        dels: {},
        const: {},
        linear: []
    };
    if (a === b || (a == null && b == null)) {
        return state;
    }
    else if (a == null || a.length === 0) {
        return simpleDiff(state, b, "adds", 1, mode);
    }
    else if (b == null || b.length === 0) {
        return simpleDiff(state, a, "dels", -1, mode);
    }
    const reverse = a.length >= b.length;
    let _a, _b, na, nb;
    if (reverse) {
        _a = b;
        _b = a;
    }
    else {
        _a = a;
        _b = b;
    }
    na = _a.length;
    nb = _b.length;
    const offset = na + 1;
    const delta = nb - na;
    const doff = delta + offset;
    const size = na + nb + 3;
    const path = cachedPath(size).fill(-1, 0, size);
    const fp = cachedFP(size).fill(-1, 0, size);
    const epc = _cachedEPC;
    const pathPos = _cachedPathPos;
    epc.length = 0;
    pathPos.length = 0;
    const snake = (k, p, pp) => {
        const koff = k + offset;
        let r, y;
        if (p > pp) {
            r = path[koff - 1];
            y = p;
        }
        else {
            r = path[koff + 1];
            y = pp;
        }
        let x = y - k;
        while (x < na && y < nb && equiv(_a[x], _b[y])) {
            x++;
            y++;
        }
        path[koff] = pathPos.length / 3;
        pathPos.push(x, y, r);
        return y;
    };
    let p = -1, k, ko;
    do {
        p++;
        for (k = -p, ko = k + offset; k < delta; k++, ko++) {
            fp[ko] = snake(k, fp[ko - 1] + 1, fp[ko + 1]);
        }
        for (k = delta + p, ko = k + offset; k > delta; k--, ko--) {
            fp[ko] = snake(k, fp[ko - 1] + 1, fp[ko + 1]);
        }
        fp[doff] = snake(delta, fp[doff - 1] + 1, fp[doff + 1]);
    } while (fp[doff] !== nb);
    state.distance = delta + 2 * p;
    if (mode !== 0 /* ONLY_DISTANCE */) {
        p = path[doff] * 3;
        while (p >= 0) {
            epc.push(p);
            p = pathPos[p + 2] * 3;
        }
        if (mode === 2 /* FULL */) {
            buildFullLog(epc, pathPos, state, _a, _b, reverse);
        }
        else {
            buildLinearLog(epc, pathPos, state, _a, _b, reverse);
        }
    }
    return state;
};
const buildFullLog = (epc, pathPos, state, a, b, reverse) => {
    const linear = state.linear;
    const _const = state.const;
    let i = epc.length, px = 0, py = 0;
    let adds, dels, aID, dID;
    if (reverse) {
        adds = state.dels;
        dels = state.adds;
        aID = -1;
        dID = 1;
    }
    else {
        adds = state.adds;
        dels = state.dels;
        aID = 1;
        dID = -1;
    }
    for (; --i >= 0;) {
        const e = epc[i];
        const ppx = pathPos[e];
        const ppy = pathPos[e + 1];
        const d = ppy - ppx;
        while (px < ppx || py < ppy) {
            const dp = py - px;
            if (d > dp) {
                linear.push(aID, py, adds[py] = b[py]);
                py++;
            }
            else if (d < dp) {
                linear.push(dID, px, dels[px] = a[px]);
                px++;
            }
            else {
                linear.push(0, px, _const[px] = a[px]);
                px++;
                py++;
            }
        }
    }
};
const buildLinearLog = (epc, pathPos, state, a, b, reverse) => {
    const linear = state.linear;
    const aID = reverse ? -1 : 1;
    const dID = reverse ? 1 : -1;
    let i = epc.length, px = 0, py = 0;
    for (; --i >= 0;) {
        const e = epc[i];
        const ppx = pathPos[e];
        const ppy = pathPos[e + 1];
        const d = ppy - ppx;
        while (px < ppx || py < ppy) {
            const dp = py - px;
            if (d > dp) {
                linear.push(aID, py, b[py]);
                py++;
            }
            else if (d < dp) {
                linear.push(dID, px, a[px]);
                px++;
            }
            else {
                linear.push(0, px, a[px]);
                px++;
                py++;
            }
        }
    }
};

},{"@thi.ng/equiv":"../../../node_modules/@thi.ng/equiv/index.js"}],"../../../node_modules/@thi.ng/diff/object.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const equiv_1 = require("@thi.ng/equiv");
exports.diffObject = (a, b, mode = 2 /* FULL */, _equiv = equiv_1.equiv) => a === b ?
    { distance: 0 } :
    mode === 0 /* ONLY_DISTANCE */ ?
        diffObjectDist(a, b, _equiv) :
        diffObjectFull(a, b, _equiv);
const diffObjectDist = (a, b, _equiv) => {
    let d = 0;
    for (let k in a) {
        const vb = b[k];
        (vb === undefined || !_equiv(a[k], vb)) && d++;
    }
    for (let k in b) {
        !(k in a) && d++;
    }
    return { distance: d };
};
const diffObjectFull = (a, b, _equiv) => {
    let d = 0;
    const adds = [];
    const dels = [];
    const edits = [];
    for (let k in a) {
        const vb = b[k];
        if (vb === undefined) {
            dels.push(k);
            d++;
        }
        else if (!_equiv(a[k], vb)) {
            edits.push(k, vb);
            d++;
        }
    }
    for (let k in b) {
        if (!(k in a)) {
            adds.push(k);
            d++;
        }
    }
    return { distance: d, adds, dels, edits };
};

},{"@thi.ng/equiv":"../../../node_modules/@thi.ng/equiv/index.js"}],"../../../node_modules/@thi.ng/hdom/diff.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@thi.ng/api/api");
const array_1 = require("@thi.ng/diff/array");
const object_1 = require("@thi.ng/diff/object");
const equiv_1 = require("@thi.ng/equiv");
const isArray = Array.isArray;
const max = Math.max;
// child index tracking template buffer
const INDEX = (() => {
    const res = new Array(2048);
    for (let i = 2, n = res.length; i < n; i++) {
        res[i] = i - 2;
    }
    return res;
})();
const buildIndex = (n) => {
    if (n <= INDEX.length) {
        return INDEX.slice(0, n);
    }
    const res = new Array(n);
    while (--n >= 2) {
        res[n] = n - 2;
    }
    return res;
};
/**
 * See `HDOMImplementation` interface for further details.
 *
 * @param opts
 * @param impl hdom implementation
 * @param parent
 * @param prev previous tree
 * @param curr current tree
 * @param child child index
 */
exports.diffTree = (opts, impl, parent, prev, curr, child = 0) => {
    const attribs = curr[1];
    if (attribs.__skip) {
        return;
    }
    // always replace element if __diff = false
    if (attribs.__diff === false) {
        exports.releaseTree(prev);
        impl.replaceChild(opts, parent, child, curr);
        return;
    }
    // delegate to branch-local implementation
    let _impl = attribs.__impl;
    if (_impl && _impl !== impl) {
        return _impl.diffTree(opts, _impl, parent, prev, curr, child);
    }
    const delta = array_1.diffArray(prev, curr, 1 /* ONLY_DISTANCE_LINEAR */, exports.equiv);
    if (delta.distance === 0) {
        return;
    }
    const edits = delta.linear;
    const el = impl.getChild(parent, child);
    let i;
    let ii;
    let j;
    let idx;
    let k;
    let eq;
    let status;
    let val;
    if (edits[0] !== 0 || prev[1].key !== attribs.key) {
        // DEBUG && console.log("replace:", prev, curr);
        exports.releaseTree(prev);
        impl.replaceChild(opts, parent, child, curr);
        return;
    }
    if ((val = prev.__release) && val !== curr.__release) {
        exports.releaseTree(prev);
    }
    if (edits[3] !== 0) {
        exports.diffAttributes(impl, el, prev[1], curr[1]);
        // if attribs changed & distance == 2 then we're done here...
        if (delta.distance === 2) {
            return;
        }
    }
    const numEdits = edits.length;
    const prevLength = prev.length - 1;
    const equivKeys = extractEquivElements(edits);
    const offsets = buildIndex(prevLength + 1);
    for (i = 2, ii = 6; ii < numEdits; i++, ii += 3) {
        status = edits[ii];
        if (status === -1) {
            // element removed / edited?
            val = edits[ii + 2];
            if (isArray(val)) {
                k = val[1].key;
                if (k !== undefined && equivKeys[k][2] !== undefined) {
                    eq = equivKeys[k];
                    k = eq[0];
                    // DEBUG && console.log(`diff equiv key @ ${k}:`, prev[k], curr[eq[2]]);
                    exports.diffTree(opts, impl, el, prev[k], curr[eq[2]], offsets[k]);
                }
                else {
                    idx = edits[ii + 1];
                    // DEBUG && console.log("remove @", offsets[idx], val);
                    exports.releaseTree(val);
                    impl.removeChild(el, offsets[idx]);
                    for (j = prevLength; j >= idx; j--) {
                        offsets[j] = max(offsets[j] - 1, 0);
                    }
                }
            }
            else if (typeof val === "string") {
                impl.setContent(el, "");
            }
        }
        else if (status === 1) {
            // element added/inserted?
            val = edits[ii + 2];
            if (typeof val === "string") {
                impl.setContent(el, val);
            }
            else if (isArray(val)) {
                k = val[1].key;
                if (k === undefined || equivKeys[k][0] === undefined) {
                    idx = edits[ii + 1];
                    // DEBUG && console.log("insert @", offsets[idx], val);
                    impl.createTree(opts, el, val, offsets[idx]);
                    for (j = prevLength; j >= idx; j--) {
                        offsets[j]++;
                    }
                }
            }
        }
    }
    // call __init after all children have been added/updated
    if ((val = curr.__init) && val != prev.__init) {
        val.apply(curr, [el, ...(curr.__args)]);
    }
};
/**
 * Helper function for `diffTree()` to compute & apply the difference
 * between a node's `prev` and `curr` attributes.
 *
 * @param impl
 * @param el
 * @param prev
 * @param curr
 */
exports.diffAttributes = (impl, el, prev, curr) => {
    const delta = object_1.diffObject(prev, curr, 2 /* FULL */, equiv_1.equiv);
    impl.removeAttribs(el, delta.dels, prev);
    let val = api_1.SEMAPHORE;
    let i, e, edits;
    for (edits = delta.edits, i = edits.length; (i -= 2) >= 0;) {
        const a = edits[i];
        if (a.indexOf("on") === 0) {
            impl.removeAttribs(el, [a], prev);
        }
        if (a !== "value") {
            impl.setAttrib(el, a, edits[i + 1], curr);
        }
        else {
            val = edits[i + 1];
        }
    }
    for (edits = delta.adds, i = edits.length; --i >= 0;) {
        e = edits[i];
        if (e !== "value") {
            impl.setAttrib(el, e, curr[e], curr);
        }
        else {
            val = curr[e];
        }
    }
    if (val !== api_1.SEMAPHORE) {
        impl.setAttrib(el, "value", val, curr);
    }
};
/**
 * Recursively attempts to call the `release` lifecycle method on every
 * element in given tree (branch), using depth-first descent. Each
 * element is checked for the presence of the `__release` control
 * attribute. If (and only if) it is set to `false`, further descent
 * into that element's branch is skipped.
 *
 * @param tag
 */
exports.releaseTree = (tag) => {
    if (isArray(tag)) {
        let x;
        if ((x = tag[1]) && x.__release === false) {
            return;
        }
        if (tag.__release) {
            // DEBUG && console.log("call __release", tag);
            tag.__release.apply(tag.__this, tag.__args);
            delete tag.__release;
        }
        for (x = tag.length; --x >= 2;) {
            exports.releaseTree(tag[x]);
        }
    }
};
const extractEquivElements = (edits) => {
    let k;
    let val;
    let ek;
    const equiv = {};
    for (let i = edits.length; (i -= 3) >= 0;) {
        val = edits[i + 2];
        if (isArray(val) && (k = val[1].key) !== undefined) {
            ek = equiv[k];
            !ek && (equiv[k] = ek = [, ,]);
            ek[edits[i] + 1] = edits[i + 1];
        }
    }
    return equiv;
};
const OBJP = Object.getPrototypeOf({});
const FN = "function";
const STR = "string";
/**
 * Customized version @thi.ng/equiv which takes `__diff` attributes into
 * account (at any nesting level). If an hdom element's attribute object
 * contains `__diff: false`, the object will ALWAYS be considered
 * unequal, even if all other attributes in the object are equivalent.
 *
 * @param a
 * @param b
 */
exports.equiv = (a, b) => {
    let proto;
    if (a === b) {
        return true;
    }
    if (a != null) {
        if (typeof a.equiv === FN) {
            return a.equiv(b);
        }
    }
    else {
        return a == b;
    }
    if (b != null) {
        if (typeof b.equiv === FN) {
            return b.equiv(a);
        }
    }
    else {
        return a == b;
    }
    if (typeof a === STR || typeof b === STR) {
        return false;
    }
    if ((proto = Object.getPrototypeOf(a), proto == null || proto === OBJP) &&
        (proto = Object.getPrototypeOf(b), proto == null || proto === OBJP)) {
        return !(a.__diff === false || b.__diff === false) &&
            equiv_1.equivObject(a, b, exports.equiv);
    }
    if (typeof a !== FN && a.length !== undefined &&
        typeof b !== FN && b.length !== undefined) {
        return equiv_1.equivArrayLike(a, b, exports.equiv);
    }
    if (a instanceof Set && b instanceof Set) {
        return equiv_1.equivSet(a, b, exports.equiv);
    }
    if (a instanceof Map && b instanceof Map) {
        return equiv_1.equivMap(a, b, exports.equiv);
    }
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.toString() === b.toString();
    }
    // NaN
    return (a !== a && b !== b);
};

},{"@thi.ng/api/api":"../../../node_modules/@thi.ng/api/api.js","@thi.ng/diff/array":"../../../node_modules/@thi.ng/diff/array.js","@thi.ng/diff/object":"../../../node_modules/@thi.ng/diff/object.js","@thi.ng/equiv":"../../../node_modules/@thi.ng/equiv/index.js"}],"../../../node_modules/@thi.ng/checks/is-array.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArray = Array.isArray;

},{}],"../../../node_modules/@thi.ng/checks/is-not-string-iterable.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNotStringAndIterable(x) {
    return x != null &&
        typeof x !== "string" &&
        typeof x[Symbol.iterator] === "function";
}
exports.isNotStringAndIterable = isNotStringAndIterable;

},{}],"../../../node_modules/@thi.ng/hiccup/api.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVG_NS = "http://www.w3.org/2000/svg";
exports.XLINK_NS = "http://www.w3.org/1999/xlink";
exports.TAG_REGEXP = /^([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?$/;
// tslint:disable-next-line
exports.SVG_TAGS = "animate animateColor animateMotion animateTransform circle clipPath color-profile defs desc discard ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter font foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect set stop style svg switch symbol text textPath title tref tspan use view"
    .split(" ")
    .reduce((acc, x) => (acc[x] = 1, acc), {});
// tslint:disable-next-line
exports.VOID_TAGS = "area base br circle col command ellipse embed hr img input keygen line link meta param path polygon polyline rect source stop track use wbr"
    .split(" ")
    .reduce((acc, x) => (acc[x] = 1, acc), {});
exports.ENTITIES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
};
exports.COMMENT = "__COMMENT__";
exports.NO_SPANS = {
    button: 1,
    option: 1,
    text: 1,
    textarea: 1,
};
exports.ENTITY_RE = new RegExp(`[${Object.keys(exports.ENTITIES)}]`, "g");

},{}],"../../../node_modules/@thi.ng/checks/is-function.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFunction(x) {
    return typeof x === "function";
}
exports.isFunction = isFunction;

},{}],"../../../node_modules/@thi.ng/hiccup/css.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_function_1 = require("@thi.ng/checks/is-function");
exports.css = (rules) => {
    let css = "", v;
    for (let r in rules) {
        v = rules[r];
        if (is_function_1.isFunction(v)) {
            v = v(rules);
        }
        v != null && (css += `${r}:${v};`);
    }
    return css;
};

},{"@thi.ng/checks/is-function":"../../../node_modules/@thi.ng/checks/is-function.js"}],"../../../node_modules/@thi.ng/hdom/dom.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isa = require("@thi.ng/checks/is-array");
const isi = require("@thi.ng/checks/is-not-string-iterable");
const api_1 = require("@thi.ng/hiccup/api");
const css_1 = require("@thi.ng/hiccup/css");
const isArray = isa.isArray;
const isNotStringAndIterable = isi.isNotStringAndIterable;
/**
 * See `HDOMImplementation` interface for further details.
 *
 * @param opts
 * @param parent
 * @param tree
 * @param insert
 */
exports.createTree = (opts, impl, parent, tree, insert) => {
    if (isArray(tree)) {
        const tag = tree[0];
        if (typeof tag === "function") {
            return exports.createTree(opts, impl, parent, tag.apply(null, [opts.ctx, ...tree.slice(1)]), insert);
        }
        const attribs = tree[1];
        if (attribs.__impl) {
            return attribs.__impl
                .createTree(opts, parent, tree, insert);
        }
        const el = impl.createElement(parent, tag, attribs, insert);
        if (tree.length > 2) {
            const n = tree.length;
            for (let i = 2; i < n; i++) {
                exports.createTree(opts, impl, el, tree[i]);
            }
        }
        if (tree.__init) {
            tree.__init.apply(tree.__this, [el, ...tree.__args]);
        }
        return el;
    }
    if (isNotStringAndIterable(tree)) {
        const res = [];
        for (let t of tree) {
            res.push(exports.createTree(opts, impl, parent, t));
        }
        return res;
    }
    if (tree == null) {
        return parent;
    }
    return impl.createTextElement(parent, tree);
};
/**
 * See `HDOMImplementation` interface for further details.
 *
 * @param opts
 * @param parent
 * @param tree
 * @param index
 */
exports.hydrateTree = (opts, impl, parent, tree, index = 0) => {
    if (isArray(tree)) {
        const el = impl.getChild(parent, index);
        if (typeof tree[0] === "function") {
            exports.hydrateTree(opts, impl, parent, tree[0].apply(null, [opts.ctx, ...tree.slice(1)]), index);
        }
        const attribs = tree[1];
        if (attribs.__impl) {
            return attribs.__impl
                .hydrateTree(opts, parent, tree, index);
        }
        if (tree.__init) {
            tree.__init.apply(tree.__this, [el, ...tree.__args]);
        }
        for (let a in attribs) {
            if (a.indexOf("on") === 0) {
                impl.setAttrib(el, a, attribs[a]);
            }
        }
        for (let n = tree.length, i = 2; i < n; i++) {
            exports.hydrateTree(opts, impl, el, tree[i], i - 2);
        }
    }
    else if (isNotStringAndIterable(tree)) {
        for (let t of tree) {
            exports.hydrateTree(opts, impl, parent, t, index);
            index++;
        }
    }
};
/**
 * Creates a new DOM element of type `tag` with optional `attribs`. If
 * `parent` is not `null`, the new element will be inserted as child at
 * given `insert` index. If `insert` is missing, the element will be
 * appended to the `parent`'s list of children. Returns new DOM node.
 *
 * If `tag` is a known SVG element name, the new element will be created
 * with the proper SVG XML namespace.
 *
 * @param parent
 * @param tag
 * @param attribs
 * @param insert
 */
exports.createElement = (parent, tag, attribs, insert) => {
    const el = api_1.SVG_TAGS[tag] ?
        document.createElementNS(api_1.SVG_NS, tag) :
        document.createElement(tag);
    if (parent) {
        if (insert == null) {
            parent.appendChild(el);
        }
        else {
            parent.insertBefore(el, parent.children[insert]);
        }
    }
    if (attribs) {
        exports.setAttribs(el, attribs);
    }
    return el;
};
exports.createTextElement = (parent, content, insert) => {
    const el = document.createTextNode(content);
    if (parent) {
        if (insert === undefined) {
            parent.appendChild(el);
        }
        else {
            parent.insertBefore(el, parent.children[insert]);
        }
    }
    return el;
};
exports.getChild = (parent, child) => parent.children[child];
exports.replaceChild = (opts, impl, parent, child, tree) => (impl.removeChild(parent, child),
    impl.createTree(opts, parent, tree, child));
exports.cloneWithNewAttribs = (el, attribs) => {
    const res = el.cloneNode(true);
    exports.setAttribs(res, attribs);
    el.parentNode.replaceChild(res, el);
    return res;
};
exports.setContent = (el, body) => el.textContent = body;
exports.setAttribs = (el, attribs) => {
    for (let k in attribs) {
        exports.setAttrib(el, k, attribs[k], attribs);
    }
    return el;
};
/**
 * Sets a single attribute on given element. If attrib name is NOT an
 * event name (prefix: "on") and its value is a function, it is called
 * with given `attribs` object (usually the full attrib object passed to
 * `setAttribs`) and the function's return value is used as the actual
 * attrib value.
 *
 * Special rules apply for certain attributes:
 *
 * - "style": delegated to `setStyle()`
 * - "value": delegated to `updateValueAttrib()`
 * - attrib IDs starting with "on" are treated as event listeners
 *
 * If the given (or computed) attrib value is `false` or `undefined` the
 * attrib is removed from the element.
 *
 * @param el
 * @param id
 * @param val
 * @param attribs
 */
exports.setAttrib = (el, id, val, attribs) => {
    if (id.startsWith("__"))
        return;
    const isListener = id.indexOf("on") === 0;
    if (!isListener && typeof val === "function") {
        val = val(attribs);
    }
    if (val !== undefined && val !== false) {
        switch (id) {
            case "style":
                exports.setStyle(el, val);
                break;
            case "value":
                exports.updateValueAttrib(el, val);
                break;
            case "checked":
                // TODO add more native attribs?
                el[id] = val;
                break;
            default:
                if (isListener) {
                    el.addEventListener(id.substr(2), val);
                }
                else {
                    el.setAttribute(id, val);
                }
        }
    }
    else {
        el[id] != null ? (el[id] = null) : el.removeAttribute(id);
    }
    return el;
};
/**
 * Updates an element's `value` property. For form elements it too
 * ensures the edit cursor retains its position.
 *
 * @param el
 * @param v
 */
exports.updateValueAttrib = (el, v) => {
    let ev;
    switch (el.type) {
        case "text":
        case "textarea":
        case "password":
        case "email":
        case "url":
        case "tel":
        case "search":
            if ((ev = el.value) !== undefined && typeof v === "string") {
                const off = v.length - (ev.length - el.selectionStart);
                el.value = v;
                el.selectionStart = el.selectionEnd = off;
                break;
            }
        default:
            el.value = v;
    }
};
exports.removeAttribs = (el, attribs, prev) => {
    for (let i = attribs.length; --i >= 0;) {
        const a = attribs[i];
        if (a.indexOf("on") === 0) {
            el.removeEventListener(a.substr(2), prev[a]);
        }
        else {
            el[a] ? (el[a] = null) : el.removeAttribute(a);
        }
    }
};
exports.setStyle = (el, styles) => (el.setAttribute("style", css_1.css(styles)), el);
exports.clearDOM = (el) => el.innerHTML = "";
exports.removeChild = (parent, childIdx) => {
    const n = parent.children[childIdx];
    if (n !== undefined) {
        n.remove();
    }
};

},{"@thi.ng/checks/is-array":"../../../node_modules/@thi.ng/checks/is-array.js","@thi.ng/checks/is-not-string-iterable":"../../../node_modules/@thi.ng/checks/is-not-string-iterable.js","@thi.ng/hiccup/api":"../../../node_modules/@thi.ng/hiccup/api.js","@thi.ng/hiccup/css":"../../../node_modules/@thi.ng/hiccup/css.js"}],"../../../node_modules/@thi.ng/checks/is-plain-object.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OBJP = Object.getPrototypeOf({});
/**
 * Similar to `isObject()`, but also checks if prototype is that of
 * `Object` (or `null`).
 *
 * @param x
 */
function isPlainObject(x) {
    let proto;
    return Object.prototype.toString.call(x) === "[object Object]" &&
        (proto = Object.getPrototypeOf(x), proto === null || proto === OBJP);
}
exports.isPlainObject = isPlainObject;

},{}],"../../../node_modules/@thi.ng/errors/illegal-arguments.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IllegalArgumentError extends Error {
    constructor(msg) {
        super("illegal argument(s)" + (msg !== undefined ? ": " + msg : ""));
    }
}
exports.IllegalArgumentError = IllegalArgumentError;
function illegalArgs(msg) {
    throw new IllegalArgumentError(msg);
}
exports.illegalArgs = illegalArgs;

},{}],"../../../node_modules/@thi.ng/hdom/normalize.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isa = require("@thi.ng/checks/is-array");
const insi = require("@thi.ng/checks/is-not-string-iterable");
const iso = require("@thi.ng/checks/is-plain-object");
const illegal_arguments_1 = require("@thi.ng/errors/illegal-arguments");
const api_1 = require("@thi.ng/hiccup/api");
const isArray = isa.isArray;
const isNotStringAndIterable = insi.isNotStringAndIterable;
const isPlainObject = iso.isPlainObject;
/**
 * Expands single hiccup element/component into its canonical form:
 *
 * ```
 * [tagname, {attribs}, ...children]
 * ```
 *
 * Emmet-style ID and class names in the original tagname are moved into
 * the attribs object, e.g.:
 *
 * ```
 * ["div#foo.bar.baz"] => ["div", {id: "foo", class: "bar baz"}]
 * ```
 *
 * If both Emmet-style classes AND a `class` attrib exists, the former
 * are appended to the latter:
 *
 * ```
 * ["div.bar.baz", {class: "foo"}] => ["div", {class: "foo bar baz"}]
 * ```
 *
 * @param spec
 * @param keys
 */
exports.normalizeElement = (spec, keys) => {
    let tag = spec[0], hasAttribs = isPlainObject(spec[1]), match, id, clazz, attribs;
    if (typeof tag !== "string" || !(match = api_1.TAG_REGEXP.exec(tag))) {
        illegal_arguments_1.illegalArgs(`${tag} is not a valid tag name`);
    }
    // return orig if already normalized and satisfies key requirement
    if (tag === match[1] && hasAttribs && (!keys || spec[1].key)) {
        return spec;
    }
    attribs = hasAttribs ? Object.assign({}, spec[1]) : {};
    id = match[2];
    clazz = match[3];
    if (id) {
        attribs.id = id;
    }
    if (clazz) {
        clazz = clazz.replace(/\./g, " ");
        if (attribs.class) {
            attribs.class += " " + clazz;
        }
        else {
            attribs.class = clazz;
        }
    }
    return [match[1], attribs, ...spec.slice(hasAttribs ? 2 : 1)];
};
/**
 * See `HDOMImplementation` interface for further details.
 *
 * @param opts
 * @param tree
 */
exports.normalizeTree = (opts, tree) => _normalizeTree(tree, opts, opts.ctx, [0], opts.keys !== false, opts.span !== false);
const _normalizeTree = (tree, opts, ctx, path, keys, span) => {
    if (tree == null) {
        return;
    }
    if (isArray(tree)) {
        if (tree.length === 0) {
            return;
        }
        let norm, nattribs = tree[1], impl;
        // if available, use branch-local normalize implementation
        if (nattribs && (impl = nattribs.__impl) && (impl = impl.normalizeTree)) {
            return impl(opts, tree);
        }
        const tag = tree[0];
        // use result of function call
        // pass ctx as first arg and remaining array elements as rest args
        if (typeof tag === "function") {
            return _normalizeTree(tag.apply(null, [ctx, ...tree.slice(1)]), opts, ctx, path, keys, span);
        }
        // component object w/ life cycle methods
        // (render() is the only required hook)
        if (typeof tag.render === "function") {
            const args = [ctx, ...tree.slice(1)];
            norm = _normalizeTree(tag.render.apply(tag, args), opts, ctx, path, keys, span);
            if (isArray(norm)) {
                norm.__this = tag;
                norm.__init = tag.init;
                norm.__release = tag.release;
                norm.__args = args;
            }
            return norm;
        }
        norm = exports.normalizeElement(tree, keys);
        nattribs = norm[1];
        if (nattribs.__normalize === false) {
            return norm;
        }
        if (keys && nattribs.key === undefined) {
            nattribs.key = path.join("-");
        }
        if (norm.length > 2) {
            const tag = norm[0];
            const res = [tag, nattribs];
            span = span && !api_1.NO_SPANS[tag];
            for (let i = 2, j = 2, k = 0, n = norm.length; i < n; i++) {
                let el = norm[i];
                if (el != null) {
                    const isarray = isArray(el);
                    if ((isarray && isArray(el[0])) || (!isarray && isNotStringAndIterable(el))) {
                        for (let c of el) {
                            c = _normalizeTree(c, opts, ctx, path.concat(k), keys, span);
                            if (c !== undefined) {
                                res[j++] = c;
                            }
                            k++;
                        }
                    }
                    else {
                        el = _normalizeTree(el, opts, ctx, path.concat(k), keys, span);
                        if (el !== undefined) {
                            res[j++] = el;
                        }
                        k++;
                    }
                }
            }
            return res;
        }
        return norm;
    }
    if (typeof tree === "function") {
        return _normalizeTree(tree(ctx), opts, ctx, path, keys, span);
    }
    if (typeof tree.toHiccup === "function") {
        return _normalizeTree(tree.toHiccup(opts.ctx), opts, ctx, path, keys, span);
    }
    if (typeof tree.deref === "function") {
        return _normalizeTree(tree.deref(), opts, ctx, path, keys, span);
    }
    return span ?
        ["span", keys ? { key: path.join("-") } : {}, tree.toString()] :
        tree.toString();
};

},{"@thi.ng/checks/is-array":"../../../node_modules/@thi.ng/checks/is-array.js","@thi.ng/checks/is-not-string-iterable":"../../../node_modules/@thi.ng/checks/is-not-string-iterable.js","@thi.ng/checks/is-plain-object":"../../../node_modules/@thi.ng/checks/is-plain-object.js","@thi.ng/errors/illegal-arguments":"../../../node_modules/@thi.ng/errors/illegal-arguments.js","@thi.ng/hiccup/api":"../../../node_modules/@thi.ng/hiccup/api.js"}],"../../../node_modules/@thi.ng/hdom/default.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diff_1 = require("./diff");
const dom_1 = require("./dom");
const normalize_1 = require("./normalize");
/**
 * Default target implementation to manipulate browser DOM.
 */
exports.DEFAULT_IMPL = {
    createTree(opts, parent, tree, child) {
        return dom_1.createTree(opts, this, parent, tree, child);
    },
    hydrateTree(opts, parent, tree, child) {
        return dom_1.hydrateTree(opts, this, parent, tree, child);
    },
    diffTree(opts, parent, prev, curr, child) {
        diff_1.diffTree(opts, this, parent, prev, curr, child);
    },
    normalizeTree: normalize_1.normalizeTree,
    getElementById(id) {
        return document.getElementById(id);
    },
    getChild: dom_1.getChild,
    createElement: dom_1.createElement,
    createTextElement: dom_1.createTextElement,
    replaceChild(opts, parent, child, tree) {
        dom_1.replaceChild(opts, this, parent, child, tree);
    },
    removeChild: dom_1.removeChild,
    setContent: dom_1.setContent,
    removeAttribs: dom_1.removeAttribs,
    setAttrib: dom_1.setAttrib,
};

},{"./diff":"../../../node_modules/@thi.ng/hdom/diff.js","./dom":"../../../node_modules/@thi.ng/hdom/dom.js","./normalize":"../../../node_modules/@thi.ng/hdom/normalize.js"}],"../../../node_modules/@thi.ng/checks/implements-function.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function implementsFunction(x, fn) {
    return x != null && typeof x[fn] === "function";
}
exports.implementsFunction = implementsFunction;

},{}],"../../../node_modules/@thi.ng/hiccup/deref.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const implements_function_1 = require("@thi.ng/checks/implements-function");
/**
 * Takes an arbitrary `ctx` object and array of `keys`. Attempts to call
 * `.deref()` on all given keys' values and stores result values instead
 * of original. Returns updated copy of `ctx` or original if `ctx` is
 * `null` or no keys were given.
 *
 * @param ctx
 * @param keys
 */
exports.derefContext = (ctx, keys) => {
    if (ctx == null || !keys || !keys.length)
        return ctx;
    const res = Object.assign({}, ctx);
    for (let k of keys) {
        const v = res[k];
        implements_function_1.implementsFunction(v, "deref") && (res[k] = v.deref());
    }
    return res;
};

},{"@thi.ng/checks/implements-function":"../../../node_modules/@thi.ng/checks/implements-function.js"}],"../../../node_modules/@thi.ng/checks/is-string.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isString(x) {
    return typeof x === "string";
}
exports.isString = isString;

},{}],"../../../node_modules/@thi.ng/hdom/utils.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_string_1 = require("@thi.ng/checks/is-string");
exports.resolveRoot = (root, impl) => is_string_1.isString(root) ?
    impl.getElementById(root) :
    root;

},{"@thi.ng/checks/is-string":"../../../node_modules/@thi.ng/checks/is-string.js"}],"../../../node_modules/@thi.ng/hdom/render-once.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deref_1 = require("@thi.ng/hiccup/deref");
const default_1 = require("./default");
const utils_1 = require("./utils");
/**
 * One-off hdom tree conversion & target DOM application. Takes same
 * options as `start()`, but performs no diffing and only creates or
 * hydrates target once. The given tree is first normalized and if
 * result is `null` or `undefined` no further action will be taken.
 *
 * @param tree
 * @param opts
 * @param impl
 */
exports.renderOnce = (tree, opts = {}, impl = default_1.DEFAULT_IMPL) => {
    opts = Object.assign({ root: "app" }, opts);
    opts.ctx = deref_1.derefContext(opts.ctx, opts.autoDerefKeys);
    const root = utils_1.resolveRoot(opts.root, impl);
    tree = impl.normalizeTree(opts, tree);
    if (!tree)
        return;
    opts.hydrate ?
        impl.hydrateTree(opts, root, tree) :
        impl.createTree(opts, root, tree);
};

},{"@thi.ng/hiccup/deref":"../../../node_modules/@thi.ng/hiccup/deref.js","./default":"../../../node_modules/@thi.ng/hdom/default.js","./utils":"../../../node_modules/@thi.ng/hdom/utils.js"}],"../../../node_modules/@thi.ng/hdom/start.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deref_1 = require("@thi.ng/hiccup/deref");
const default_1 = require("./default");
const utils_1 = require("./utils");
/**
 * Takes an hiccup tree (array, function or component object w/ life
 * cycle methods) and an optional object of DOM update options. Starts
 * RAF update loop, in each iteration first normalizing given tree, then
 * computing diff to previous frame's tree and applying any changes to
 * the real DOM. The `ctx` option can be used for passing arbitrary
 * config data or state down into the hiccup component tree. Any
 * embedded component function in the tree will receive this context
 * object (shallow copy) as first argument, as will life cycle methods
 * in component objects. If the `autoDerefKeys` option is given, attempts
 * to auto-expand/deref the given keys in the user supplied context
 * object (`ctx` option) prior to *each* tree normalization. All of
 * these values should implement the thi.ng/api `IDeref` interface (e.g.
 * atoms, cursors, views, rstreams etc.). This feature can be used to
 * define dynamic contexts linked to the main app state, e.g. using
 * derived views provided by thi.ng/atom.
 *
 * **Selective updates**: No updates will be applied if the given hiccup
 * tree is `undefined` or `null` or a root component function returns no
 * value. This way a given root function can do some state handling of
 * its own and implement fail-fast checks to determine no DOM updates
 * are necessary, save effort re-creating a new hiccup tree and request
 * skipping DOM updates via this function. In this case, the previous
 * DOM tree is kept around until the root function returns a tree again,
 * which then is diffed and applied against the previous tree kept as
 * usual. Any number of frames may be skipped this way.
 *
 * **Important:** Unless the `hydrate` option is enabled, the parent
 * element given is assumed to have NO children at the time when
 * `start()` is called. Since hdom does NOT track the real DOM, the
 * resulting changes will result in potentially undefined behavior if
 * the parent element wasn't empty. Likewise, if `hydrate` is enabled,
 * it is assumed that an equivalent DOM (minus listeners) already exists
 * (i.e. generated via SSR) when `start()` is called. Any other
 * discrepancies between the pre-existing DOM and the hdom trees will
 * cause undefined behavior.
 *
 * Returns a function, which when called, immediately cancels the update
 * loop.
 *
 * @param tree hiccup DOM tree
 * @param opts options
 * @param impl hdom target implementation
 */
exports.start = (tree, opts = {}, impl = default_1.DEFAULT_IMPL) => {
    const _opts = Object.assign({ root: "app" }, opts);
    let prev = [];
    let isActive = true;
    const root = utils_1.resolveRoot(_opts.root, impl);
    const update = () => {
        if (isActive) {
            _opts.ctx = deref_1.derefContext(opts.ctx, _opts.autoDerefKeys);
            const curr = impl.normalizeTree(_opts, tree);
            if (curr != null) {
                if (_opts.hydrate) {
                    impl.hydrateTree(_opts, root, curr);
                    _opts.hydrate = false;
                }
                else {
                    impl.diffTree(_opts, root, prev, curr);
                }
                prev = curr;
            }
            // check again in case one of the components called cancel
            isActive && requestAnimationFrame(update);
        }
    };
    requestAnimationFrame(update);
    return () => (isActive = false);
};

},{"@thi.ng/hiccup/deref":"../../../node_modules/@thi.ng/hiccup/deref.js","./default":"../../../node_modules/@thi.ng/hdom/default.js","./utils":"../../../node_modules/@thi.ng/hdom/utils.js"}],"../../../node_modules/@thi.ng/hdom/index.js":[function(require,module,exports) {
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./api"));
__export(require("./default"));
__export(require("./diff"));
__export(require("./dom"));
__export(require("./normalize"));
__export(require("./render-once"));
__export(require("./start"));

},{"./api":"../../../node_modules/@thi.ng/hdom/api.js","./default":"../../../node_modules/@thi.ng/hdom/default.js","./diff":"../../../node_modules/@thi.ng/hdom/diff.js","./dom":"../../../node_modules/@thi.ng/hdom/dom.js","./normalize":"../../../node_modules/@thi.ng/hdom/normalize.js","./render-once":"../../../node_modules/@thi.ng/hdom/render-once.js","./start":"../../../node_modules/@thi.ng/hdom/start.js"}],"../../../node_modules/@thi.ng/hdom-components/canvas.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Configurable canvas component. Used as common base for `canvasWebGL`
 * and `canvas2D` wrappers.
 *
 * @param type canvas context type
 * @param handlers user handlers
 * @param opts canvas context creation options
 */
const _canvas = (type, { init, update, release }, opts) => {
    let el, ctx;
    let frame = 0;
    let time = 0;
    return {
        init(_el, hctx, ...args) {
            el = _el;
            exports.adaptDPI(el, el.width, el.height);
            ctx = el.getContext(type, opts);
            time = Date.now();
            init && init(el, ctx, hctx, ...args);
            update && update(el, ctx, hctx, time, frame++, ...args);
        },
        render(hctx, ...args) {
            ctx && update && update(el, ctx, hctx, Date.now() - time, frame++, ...args);
            return ["canvas", args[0]];
        },
        release(hctx, ...args) {
            release && release(el, ctx, hctx, ...args);
        }
    };
};
/**
 * Higher order WebGL canvas component delegating to user provided
 * handlers.
 *
 * Note: Since this is an higher order component, if used within a
 * non-static parent component, this function itself cannot be directly
 * inlined into hdom tree and must be initialized prior/outside, however
 * the returned component can be used as normal.
 *
 * ```
 * const glcanvas = canvasWebGL({
 *   render: (canv, gl, hctx, time, frame, ...args) => {
 *     const col = 0.5 + 0.5 * Math.sin(time);
 *     gl.clearColor(col, col, col, 1);
 *   }
 * });
 * ...
 * [glcanvas, {id: "foo", width: 640, height: 480}]
 * ```
 *
 * @param handlers user provided handlers
 * @param opts canvas context creation options
 */
exports.canvasWebGL = (handlers, opts) => _canvas("webgl", handlers, opts);
/**
 * Same as `canvasWebGL` but targets WebGL2.
 *
 * @param handlers user provided handlers
 * @param opts canvas context creation options
 */
exports.canvasWebGL2 = (handlers, opts) => _canvas("webgl2", handlers, opts);
/**
 * Similar to `canvasWebGL`, but targets default 2D drawing context.
 *
 * @param handlers user provided handlers
 * @param glopts canvas context creation options
 */
exports.canvas2D = (handlers, opts) => _canvas("2d", handlers, opts);
/**
 * Sets the canvas size to given `width` & `height` and adjusts style to
 * compensate for HDPI devices. Note: For 2D canvases, this will
 * automatically clear any prior canvas content.
 *
 * @param canvas
 * @param width uncompensated pixel width
 * @param height uncompensated pixel height
 */
exports.adaptDPI = (canvas, width, height) => {
    const dpr = window.devicePixelRatio || 1;
    if (dpr != 1) {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    return dpr;
};

},{}],"../../../node_modules/@thi.ng/checks/exists-not-null.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function existsAndNotNull(x) {
    return x != null;
}
exports.existsAndNotNull = existsAndNotNull;

},{}],"../../../node_modules/@thi.ng/checks/exists.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function exists(x) {
    return x !== undefined;
}
exports.exists = exists;

},{}],"../../../node_modules/@thi.ng/checks/has-crypto.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasCrypto() {
    return typeof window !== "undefined" && window["crypto"] !== undefined;
}
exports.hasCrypto = hasCrypto;

},{}],"../../../node_modules/@thi.ng/checks/has-max-length.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasMaxLength(len, x) {
    return x != null && x.length <= len;
}
exports.hasMaxLength = hasMaxLength;

},{}],"../../../node_modules/@thi.ng/checks/has-min-length.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasMinLength(len, x) {
    return x != null && x.length >= len;
}
exports.hasMinLength = hasMinLength;

},{}],"../../../node_modules/@thi.ng/checks/has-performance.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_function_1 = require("./is-function");
function hasPerformance() {
    return typeof performance !== 'undefined' && is_function_1.isFunction(performance.now);
}
exports.hasPerformance = hasPerformance;

},{"./is-function":"../../../node_modules/@thi.ng/checks/is-function.js"}],"../../../node_modules/@thi.ng/checks/has-wasm.js":[function(require,module,exports) {
var global = arguments[3];
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasWASM() {
    return (typeof window !== "undefined" && typeof window["WebAssembly"] !== "undefined") ||
        (typeof global !== "undefined" && typeof global["WebAssembly"] !== "undefined");
}
exports.hasWASM = hasWASM;

},{}],"../../../node_modules/@thi.ng/checks/has-webgl.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasWebGL() {
    try {
        document.createElement("canvas").getContext("webgl");
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.hasWebGL = hasWebGL;

},{}],"../../../node_modules/@thi.ng/checks/has-websocket.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasWebSocket() {
    return typeof WebSocket !== "undefined";
}
exports.hasWebSocket = hasWebSocket;

},{}],"../../../node_modules/@thi.ng/checks/is-arraylike.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isArrayLike(x) {
    return (x != null && typeof x !== "function" && x.length !== undefined);
}
exports.isArrayLike = isArrayLike;

},{}],"../../../node_modules/@thi.ng/checks/is-blob.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isBlob(x) {
    return x instanceof Blob;
}
exports.isBlob = isBlob;

},{}],"../../../node_modules/@thi.ng/checks/is-boolean.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isBoolean(x) {
    return typeof x === "boolean";
}
exports.isBoolean = isBoolean;

},{}],"../../../node_modules/@thi.ng/checks/is-chrome.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isChrome() {
    return typeof window !== "undefined" && !!window["chrome"];
}
exports.isChrome = isChrome;

},{}],"../../../node_modules/@thi.ng/checks/is-date.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDate(x) {
    return x instanceof Date;
}
exports.isDate = isDate;

},{}],"../../../node_modules/@thi.ng/checks/is-even.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isEven(x) {
    return (x % 2) === 0;
}
exports.isEven = isEven;

},{}],"../../../node_modules/@thi.ng/checks/is-false.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFalse(x) {
    return x === false;
}
exports.isFalse = isFalse;

},{}],"../../../node_modules/@thi.ng/checks/is-file.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFile(x) {
    return x instanceof File;
}
exports.isFile = isFile;

},{}],"../../../node_modules/@thi.ng/checks/is-firefox.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isFirefox() {
    return typeof window !== "undefined" && !!window["InstallTrigger"];
}
exports.isFirefox = isFirefox;

},{}],"../../../node_modules/@thi.ng/checks/is-ie.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isIE() {
    return typeof document !== "undefined" &&
        (typeof document["documentMode"] !== "undefined" ||
            navigator.userAgent.indexOf("MSIE") > 0);
}
exports.isIE = isIE;

},{}],"../../../node_modules/@thi.ng/checks/is-in-range.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isInRange(min, max, x) {
    return x >= min && x <= max;
}
exports.isInRange = isInRange;

},{}],"../../../node_modules/@thi.ng/checks/is-int32.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isInt32(x) {
    return typeof x === "number" && (x | 0) === x;
}
exports.isInt32 = isInt32;

},{}],"../../../node_modules/@thi.ng/checks/is-iterable.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isIterable(x) {
    return x != null && typeof x[Symbol.iterator] === "function";
}
exports.isIterable = isIterable;

},{}],"../../../node_modules/@thi.ng/checks/is-map.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isMap(x) {
    return x instanceof Map;
}
exports.isMap = isMap;

},{}],"../../../node_modules/@thi.ng/checks/is-mobile.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isMobile() {
    return typeof navigator !== "undefined" &&
        /mobile|tablet|ip(ad|hone|od)|android|silk/i.test(navigator.userAgent) &&
        !/crios/i.test(navigator.userAgent);
}
exports.isMobile = isMobile;

},{}],"../../../node_modules/@thi.ng/checks/is-nan.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNaN(x) {
    return x !== x;
}
exports.isNaN = isNaN;

},{}],"../../../node_modules/@thi.ng/checks/is-negative.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNegative(x) {
    return typeof x === "number" && x < 0;
}
exports.isNegative = isNegative;

},{}],"../../../node_modules/parcel-bundler/src/builtins/_empty.js":[function(require,module,exports) {

},{}],"../../../node_modules/@thi.ng/checks/is-node.js":[function(require,module,exports) {
var process = require("process");
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNode() {
    if (typeof process === "object") {
        if (typeof process.versions === "object") {
            if (typeof process.versions.node !== "undefined") {
                return true;
            }
        }
    }
    return false;
}
exports.isNode = isNode;

},{"process":"../../../node_modules/parcel-bundler/src/builtins/_empty.js"}],"../../../node_modules/@thi.ng/checks/is-null.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNull(x) {
    return x === null;
}
exports.isNull = isNull;

},{}],"../../../node_modules/@thi.ng/checks/is-number.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isNumber(x) {
    return typeof x === "number";
}
exports.isNumber = isNumber;

},{}],"../../../node_modules/@thi.ng/checks/is-object.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObject(x) {
    return x !== null && typeof x === "object";
}
exports.isObject = isObject;

},{}],"../../../node_modules/@thi.ng/checks/is-odd.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isOdd(x) {
    return (x % 2) !== 0;
}
exports.isOdd = isOdd;

},{}],"../../../node_modules/@thi.ng/checks/is-positive.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isPosititve(x) {
    return typeof x === "number" && x > 0;
}
exports.isPosititve = isPosititve;

},{}],"../../../node_modules/@thi.ng/checks/is-promise.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isPromise(x) {
    return x instanceof Promise;
}
exports.isPromise = isPromise;

},{}],"../../../node_modules/@thi.ng/checks/is-promiselike.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const implements_function_1 = require("./implements-function");
function isPromiseLike(x) {
    return x instanceof Promise ||
        (implements_function_1.implementsFunction(x, "then") && implements_function_1.implementsFunction(x, "catch"));
}
exports.isPromiseLike = isPromiseLike;

},{"./implements-function":"../../../node_modules/@thi.ng/checks/implements-function.js"}],"../../../node_modules/@thi.ng/checks/is-regexp.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isRegExp(x) {
    return x instanceof RegExp;
}
exports.isRegExp = isRegExp;

},{}],"../../../node_modules/@thi.ng/checks/is-safari.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_chrome_1 = require("./is-chrome");
function isSafari() {
    return typeof navigator !== "undefined" && /Safari/.test(navigator.userAgent) && !is_chrome_1.isChrome();
}
exports.isSafari = isSafari;

},{"./is-chrome":"../../../node_modules/@thi.ng/checks/is-chrome.js"}],"../../../node_modules/@thi.ng/checks/is-set.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isSet(x) {
    return x instanceof Set;
}
exports.isSet = isSet;

},{}],"../../../node_modules/@thi.ng/checks/is-symbol.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isSymbol(x) {
    return typeof x === "symbol";
}
exports.isSymbol = isSymbol;

},{}],"../../../node_modules/@thi.ng/checks/is-transferable.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isTransferable(x) {
    return x instanceof ArrayBuffer ||
        (typeof SharedArrayBuffer !== "undefined" && x instanceof SharedArrayBuffer) ||
        (typeof MessagePort !== "undefined" && x instanceof MessagePort);
}
exports.isTransferable = isTransferable;

},{}],"../../../node_modules/@thi.ng/checks/is-true.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isTrue(x) {
    return x === true;
}
exports.isTrue = isTrue;

},{}],"../../../node_modules/@thi.ng/checks/is-typedarray.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isTypedArray(x) {
    return x && (x.constructor === Float32Array ||
        x.constructor === Uint32Array ||
        x.constructor === Uint8Array ||
        x.constructor === Uint8ClampedArray ||
        x.constructor === Int8Array ||
        x.constructor === Uint16Array ||
        x.constructor === Int16Array ||
        x.constructor === Int32Array ||
        x.constructor === Float64Array);
}
exports.isTypedArray = isTypedArray;

},{}],"../../../node_modules/@thi.ng/checks/is-uint32.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isUint32(x) {
    return typeof x === "number" && (x >>> 0) === x;
}
exports.isUint32 = isUint32;

},{}],"../../../node_modules/@thi.ng/checks/is-undefined.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isUndefined(x) {
    return x === undefined;
}
exports.isUndefined = isUndefined;

},{}],"../../../node_modules/@thi.ng/checks/is-uuid.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isUUID(x) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
}
exports.isUUID = isUUID;

},{}],"../../../node_modules/@thi.ng/checks/is-uuid4.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isUUIDv4(x) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}
exports.isUUIDv4 = isUUIDv4;

},{}],"../../../node_modules/@thi.ng/checks/is-zero.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isZero(x) {
    return x === 0;
}
exports.isZero = isZero;

},{}],"../../../node_modules/@thi.ng/checks/index.js":[function(require,module,exports) {
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./exists-not-null"));
__export(require("./exists"));
__export(require("./has-crypto"));
__export(require("./has-max-length"));
__export(require("./has-min-length"));
__export(require("./has-performance"));
__export(require("./has-wasm"));
__export(require("./has-webgl"));
__export(require("./has-websocket"));
__export(require("./implements-function"));
__export(require("./is-array"));
__export(require("./is-arraylike"));
__export(require("./is-blob"));
__export(require("./is-boolean"));
__export(require("./is-chrome"));
__export(require("./is-date"));
__export(require("./is-even"));
__export(require("./is-false"));
__export(require("./is-file"));
__export(require("./is-firefox"));
__export(require("./is-function"));
__export(require("./is-ie"));
__export(require("./is-in-range"));
__export(require("./is-int32"));
__export(require("./is-iterable"));
__export(require("./is-map"));
__export(require("./is-mobile"));
__export(require("./is-nan"));
__export(require("./is-negative"));
__export(require("./is-node"));
__export(require("./is-not-string-iterable"));
__export(require("./is-null"));
__export(require("./is-number"));
__export(require("./is-object"));
__export(require("./is-odd"));
__export(require("./is-plain-object"));
__export(require("./is-positive"));
__export(require("./is-promise"));
__export(require("./is-promiselike"));
__export(require("./is-regexp"));
__export(require("./is-safari"));
__export(require("./is-set"));
__export(require("./is-string"));
__export(require("./is-symbol"));
__export(require("./is-transferable"));
__export(require("./is-true"));
__export(require("./is-typedarray"));
__export(require("./is-uint32"));
__export(require("./is-undefined"));
__export(require("./is-uuid"));
__export(require("./is-uuid4"));
__export(require("./is-zero"));

},{"./exists-not-null":"../../../node_modules/@thi.ng/checks/exists-not-null.js","./exists":"../../../node_modules/@thi.ng/checks/exists.js","./has-crypto":"../../../node_modules/@thi.ng/checks/has-crypto.js","./has-max-length":"../../../node_modules/@thi.ng/checks/has-max-length.js","./has-min-length":"../../../node_modules/@thi.ng/checks/has-min-length.js","./has-performance":"../../../node_modules/@thi.ng/checks/has-performance.js","./has-wasm":"../../../node_modules/@thi.ng/checks/has-wasm.js","./has-webgl":"../../../node_modules/@thi.ng/checks/has-webgl.js","./has-websocket":"../../../node_modules/@thi.ng/checks/has-websocket.js","./implements-function":"../../../node_modules/@thi.ng/checks/implements-function.js","./is-array":"../../../node_modules/@thi.ng/checks/is-array.js","./is-arraylike":"../../../node_modules/@thi.ng/checks/is-arraylike.js","./is-blob":"../../../node_modules/@thi.ng/checks/is-blob.js","./is-boolean":"../../../node_modules/@thi.ng/checks/is-boolean.js","./is-chrome":"../../../node_modules/@thi.ng/checks/is-chrome.js","./is-date":"../../../node_modules/@thi.ng/checks/is-date.js","./is-even":"../../../node_modules/@thi.ng/checks/is-even.js","./is-false":"../../../node_modules/@thi.ng/checks/is-false.js","./is-file":"../../../node_modules/@thi.ng/checks/is-file.js","./is-firefox":"../../../node_modules/@thi.ng/checks/is-firefox.js","./is-function":"../../../node_modules/@thi.ng/checks/is-function.js","./is-ie":"../../../node_modules/@thi.ng/checks/is-ie.js","./is-in-range":"../../../node_modules/@thi.ng/checks/is-in-range.js","./is-int32":"../../../node_modules/@thi.ng/checks/is-int32.js","./is-iterable":"../../../node_modules/@thi.ng/checks/is-iterable.js","./is-map":"../../../node_modules/@thi.ng/checks/is-map.js","./is-mobile":"../../../node_modules/@thi.ng/checks/is-mobile.js","./is-nan":"../../../node_modules/@thi.ng/checks/is-nan.js","./is-negative":"../../../node_modules/@thi.ng/checks/is-negative.js","./is-node":"../../../node_modules/@thi.ng/checks/is-node.js","./is-not-string-iterable":"../../../node_modules/@thi.ng/checks/is-not-string-iterable.js","./is-null":"../../../node_modules/@thi.ng/checks/is-null.js","./is-number":"../../../node_modules/@thi.ng/checks/is-number.js","./is-object":"../../../node_modules/@thi.ng/checks/is-object.js","./is-odd":"../../../node_modules/@thi.ng/checks/is-odd.js","./is-plain-object":"../../../node_modules/@thi.ng/checks/is-plain-object.js","./is-positive":"../../../node_modules/@thi.ng/checks/is-positive.js","./is-promise":"../../../node_modules/@thi.ng/checks/is-promise.js","./is-promiselike":"../../../node_modules/@thi.ng/checks/is-promiselike.js","./is-regexp":"../../../node_modules/@thi.ng/checks/is-regexp.js","./is-safari":"../../../node_modules/@thi.ng/checks/is-safari.js","./is-set":"../../../node_modules/@thi.ng/checks/is-set.js","./is-string":"../../../node_modules/@thi.ng/checks/is-string.js","./is-symbol":"../../../node_modules/@thi.ng/checks/is-symbol.js","./is-transferable":"../../../node_modules/@thi.ng/checks/is-transferable.js","./is-true":"../../../node_modules/@thi.ng/checks/is-true.js","./is-typedarray":"../../../node_modules/@thi.ng/checks/is-typedarray.js","./is-uint32":"../../../node_modules/@thi.ng/checks/is-uint32.js","./is-undefined":"../../../node_modules/@thi.ng/checks/is-undefined.js","./is-uuid":"../../../node_modules/@thi.ng/checks/is-uuid.js","./is-uuid4":"../../../node_modules/@thi.ng/checks/is-uuid4.js","./is-zero":"../../../node_modules/@thi.ng/checks/is-zero.js"}],"../../../node_modules/@tstackgl/regl-draw/dist/frameCatch.js":[function(require,module,exports) {
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
function createFrameCatch(regl) {
    return function frameCatch(func) {
        var loop = regl.frame(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            try {
                func.apply(void 0, __spread(args));
            }
            catch (err) {
                loop.cancel();
                throw err;
            }
        });
        return loop;
    };
}
exports.createFrameCatch = createFrameCatch;

},{}],"../../../node_modules/sliced/index.js":[function(require,module,exports) {

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],"../../../node_modules/@tstackgl/geometry/src/mesh-combine-normals.ts":[function(require,module,exports) {
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var slice = require("sliced");
function combine(meshes) {
    var hasNormals = meshes.every(function (mesh) { return mesh.normals && mesh.positions.length === mesh.normals.length; });
    var hasColors = meshes.every(function (mesh) { return mesh.colors && mesh.positions.length === mesh.colors.length; });
    var pos = [];
    var cel = [];
    var nor = [];
    var color = [];
    var p = 0;
    var c = 0;
    var k = 0;
    var j = 0;
    for (var i = 0; i < meshes.length; i++) {
        var mpos = meshes[i].positions;
        var mcel = meshes[i].cells;
        var mnor = meshes[i].normals;
        var mcol = meshes[i].colors;
        for (j = 0; j < mpos.length; j++) {
            pos[j + p] = slice(mpos[j]);
            if (hasNormals)
                nor[j + p] = slice(mnor[j]);
            if (hasColors)
                color[j + p] = slice(mcol[j]);
        }
        for (j = 0; j < mcel.length; j++) {
            cel[(k = j + c)] = slice(mcel[j]);
            for (var l = 0; l < cel[k].length; l++) {
                cel[k][l] += p;
            }
        }
        p += mpos.length;
        c += mcel.length;
    }
    return __assign({ cells: cel, positions: pos }, (hasNormals && { normals: nor }), (hasColors && { colors: color }));
}
exports.combine = combine;

},{"sliced":"../../../node_modules/sliced/index.js"}],"../../../node_modules/gl-mat4/create.js":[function(require,module,exports) {
module.exports = create;

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create() {
    var out = new Float32Array(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};
},{}],"../../../node_modules/gl-mat4/clone.js":[function(require,module,exports) {
module.exports = clone;

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function clone(a) {
    var out = new Float32Array(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};
},{}],"../../../node_modules/gl-mat4/copy.js":[function(require,module,exports) {
module.exports = copy;

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};
},{}],"../../../node_modules/gl-mat4/identity.js":[function(require,module,exports) {
module.exports = identity;

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};
},{}],"../../../node_modules/gl-mat4/transpose.js":[function(require,module,exports) {
module.exports = transpose;

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function transpose(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};
},{}],"../../../node_modules/gl-mat4/invert.js":[function(require,module,exports) {
module.exports = invert;

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};
},{}],"../../../node_modules/gl-mat4/adjoint.js":[function(require,module,exports) {
module.exports = adjoint;

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function adjoint(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};
},{}],"../../../node_modules/gl-mat4/determinant.js":[function(require,module,exports) {
module.exports = determinant;

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};
},{}],"../../../node_modules/gl-mat4/multiply.js":[function(require,module,exports) {
module.exports = multiply;

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
function multiply(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};
},{}],"../../../node_modules/gl-mat4/translate.js":[function(require,module,exports) {
module.exports = translate;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};
},{}],"../../../node_modules/gl-mat4/scale.js":[function(require,module,exports) {
module.exports = scale;

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function scale(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};
},{}],"../../../node_modules/gl-mat4/rotate.js":[function(require,module,exports) {
module.exports = rotate;

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function rotate(out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < 0.000001) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};
},{}],"../../../node_modules/gl-mat4/rotateX.js":[function(require,module,exports) {
module.exports = rotateX;

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};
},{}],"../../../node_modules/gl-mat4/rotateY.js":[function(require,module,exports) {
module.exports = rotateY;

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};
},{}],"../../../node_modules/gl-mat4/rotateZ.js":[function(require,module,exports) {
module.exports = rotateZ;

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};
},{}],"../../../node_modules/gl-mat4/fromRotation.js":[function(require,module,exports) {
module.exports = fromRotation

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest)
 *     mat4.rotate(dest, dest, rad, axis)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function fromRotation(out, rad, axis) {
  var s, c, t
  var x = axis[0]
  var y = axis[1]
  var z = axis[2]
  var len = Math.sqrt(x * x + y * y + z * z)

  if (Math.abs(len) < 0.000001) {
    return null
  }

  len = 1 / len
  x *= len
  y *= len
  z *= len

  s = Math.sin(rad)
  c = Math.cos(rad)
  t = 1 - c

  // Perform rotation-specific matrix multiplication
  out[0] = x * x * t + c
  out[1] = y * x * t + z * s
  out[2] = z * x * t - y * s
  out[3] = 0
  out[4] = x * y * t - z * s
  out[5] = y * y * t + c
  out[6] = z * y * t + x * s
  out[7] = 0
  out[8] = x * z * t + y * s
  out[9] = y * z * t - x * s
  out[10] = z * z * t + c
  out[11] = 0
  out[12] = 0
  out[13] = 0
  out[14] = 0
  out[15] = 1
  return out
}

},{}],"../../../node_modules/gl-mat4/fromRotationTranslation.js":[function(require,module,exports) {
module.exports = fromRotationTranslation;

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
function fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};
},{}],"../../../node_modules/gl-mat4/fromScaling.js":[function(require,module,exports) {
module.exports = fromScaling

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest)
 *     mat4.scale(dest, dest, vec)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Scaling vector
 * @returns {mat4} out
 */
function fromScaling(out, v) {
  out[0] = v[0]
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 0
  out[5] = v[1]
  out[6] = 0
  out[7] = 0
  out[8] = 0
  out[9] = 0
  out[10] = v[2]
  out[11] = 0
  out[12] = 0
  out[13] = 0
  out[14] = 0
  out[15] = 1
  return out
}

},{}],"../../../node_modules/gl-mat4/fromTranslation.js":[function(require,module,exports) {
module.exports = fromTranslation

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest)
 *     mat4.translate(dest, dest, vec)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
function fromTranslation(out, v) {
  out[0] = 1
  out[1] = 0
  out[2] = 0
  out[3] = 0
  out[4] = 0
  out[5] = 1
  out[6] = 0
  out[7] = 0
  out[8] = 0
  out[9] = 0
  out[10] = 1
  out[11] = 0
  out[12] = v[0]
  out[13] = v[1]
  out[14] = v[2]
  out[15] = 1
  return out
}

},{}],"../../../node_modules/gl-mat4/fromXRotation.js":[function(require,module,exports) {
module.exports = fromXRotation

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest)
 *     mat4.rotateX(dest, dest, rad)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromXRotation(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad)

    // Perform axis-specific matrix multiplication
    out[0] = 1
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 0
    out[5] = c
    out[6] = s
    out[7] = 0
    out[8] = 0
    out[9] = -s
    out[10] = c
    out[11] = 0
    out[12] = 0
    out[13] = 0
    out[14] = 0
    out[15] = 1
    return out
}
},{}],"../../../node_modules/gl-mat4/fromYRotation.js":[function(require,module,exports) {
module.exports = fromYRotation

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest)
 *     mat4.rotateY(dest, dest, rad)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromYRotation(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad)

    // Perform axis-specific matrix multiplication
    out[0] = c
    out[1] = 0
    out[2] = -s
    out[3] = 0
    out[4] = 0
    out[5] = 1
    out[6] = 0
    out[7] = 0
    out[8] = s
    out[9] = 0
    out[10] = c
    out[11] = 0
    out[12] = 0
    out[13] = 0
    out[14] = 0
    out[15] = 1
    return out
}
},{}],"../../../node_modules/gl-mat4/fromZRotation.js":[function(require,module,exports) {
module.exports = fromZRotation

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest)
 *     mat4.rotateZ(dest, dest, rad)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromZRotation(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad)

    // Perform axis-specific matrix multiplication
    out[0] = c
    out[1] = s
    out[2] = 0
    out[3] = 0
    out[4] = -s
    out[5] = c
    out[6] = 0
    out[7] = 0
    out[8] = 0
    out[9] = 0
    out[10] = 1
    out[11] = 0
    out[12] = 0
    out[13] = 0
    out[14] = 0
    out[15] = 1
    return out
}
},{}],"../../../node_modules/gl-mat4/fromQuat.js":[function(require,module,exports) {
module.exports = fromQuat;

/**
 * Creates a matrix from a quaternion rotation.
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @returns {mat4} out
 */
function fromQuat(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};
},{}],"../../../node_modules/gl-mat4/frustum.js":[function(require,module,exports) {
module.exports = frustum;

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
function frustum(out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};
},{}],"../../../node_modules/gl-mat4/perspective.js":[function(require,module,exports) {
module.exports = perspective;

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspective(out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};
},{}],"../../../node_modules/gl-mat4/perspectiveFromFieldOfView.js":[function(require,module,exports) {
module.exports = perspectiveFromFieldOfView;

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspectiveFromFieldOfView(out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI/180.0),
        downTan = Math.tan(fov.downDegrees * Math.PI/180.0),
        leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0),
        rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0),
        xScale = 2.0 / (leftTan + rightTan),
        yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
}


},{}],"../../../node_modules/gl-mat4/ortho.js":[function(require,module,exports) {
module.exports = ortho;

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function ortho(out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};
},{}],"../../../node_modules/gl-mat4/lookAt.js":[function(require,module,exports) {
var identity = require('./identity');

module.exports = lookAt;

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < 0.000001 &&
        Math.abs(eyey - centery) < 0.000001 &&
        Math.abs(eyez - centerz) < 0.000001) {
        return identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};
},{"./identity":"../../../node_modules/gl-mat4/identity.js"}],"../../../node_modules/gl-mat4/str.js":[function(require,module,exports) {
module.exports = str;

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};
},{}],"../../../node_modules/gl-mat4/index.js":[function(require,module,exports) {
module.exports = {
  create: require('./create')
  , clone: require('./clone')
  , copy: require('./copy')
  , identity: require('./identity')
  , transpose: require('./transpose')
  , invert: require('./invert')
  , adjoint: require('./adjoint')
  , determinant: require('./determinant')
  , multiply: require('./multiply')
  , translate: require('./translate')
  , scale: require('./scale')
  , rotate: require('./rotate')
  , rotateX: require('./rotateX')
  , rotateY: require('./rotateY')
  , rotateZ: require('./rotateZ')
  , fromRotation: require('./fromRotation')
  , fromRotationTranslation: require('./fromRotationTranslation')
  , fromScaling: require('./fromScaling')
  , fromTranslation: require('./fromTranslation')
  , fromXRotation: require('./fromXRotation')
  , fromYRotation: require('./fromYRotation')
  , fromZRotation: require('./fromZRotation')
  , fromQuat: require('./fromQuat')
  , frustum: require('./frustum')
  , perspective: require('./perspective')
  , perspectiveFromFieldOfView: require('./perspectiveFromFieldOfView')
  , ortho: require('./ortho')
  , lookAt: require('./lookAt')
  , str: require('./str')
}

},{"./create":"../../../node_modules/gl-mat4/create.js","./clone":"../../../node_modules/gl-mat4/clone.js","./copy":"../../../node_modules/gl-mat4/copy.js","./identity":"../../../node_modules/gl-mat4/identity.js","./transpose":"../../../node_modules/gl-mat4/transpose.js","./invert":"../../../node_modules/gl-mat4/invert.js","./adjoint":"../../../node_modules/gl-mat4/adjoint.js","./determinant":"../../../node_modules/gl-mat4/determinant.js","./multiply":"../../../node_modules/gl-mat4/multiply.js","./translate":"../../../node_modules/gl-mat4/translate.js","./scale":"../../../node_modules/gl-mat4/scale.js","./rotate":"../../../node_modules/gl-mat4/rotate.js","./rotateX":"../../../node_modules/gl-mat4/rotateX.js","./rotateY":"../../../node_modules/gl-mat4/rotateY.js","./rotateZ":"../../../node_modules/gl-mat4/rotateZ.js","./fromRotation":"../../../node_modules/gl-mat4/fromRotation.js","./fromRotationTranslation":"../../../node_modules/gl-mat4/fromRotationTranslation.js","./fromScaling":"../../../node_modules/gl-mat4/fromScaling.js","./fromTranslation":"../../../node_modules/gl-mat4/fromTranslation.js","./fromXRotation":"../../../node_modules/gl-mat4/fromXRotation.js","./fromYRotation":"../../../node_modules/gl-mat4/fromYRotation.js","./fromZRotation":"../../../node_modules/gl-mat4/fromZRotation.js","./fromQuat":"../../../node_modules/gl-mat4/fromQuat.js","./frustum":"../../../node_modules/gl-mat4/frustum.js","./perspective":"../../../node_modules/gl-mat4/perspective.js","./perspectiveFromFieldOfView":"../../../node_modules/gl-mat4/perspectiveFromFieldOfView.js","./ortho":"../../../node_modules/gl-mat4/ortho.js","./lookAt":"../../../node_modules/gl-mat4/lookAt.js","./str":"../../../node_modules/gl-mat4/str.js"}],"../../../node_modules/gl-vec3/epsilon.js":[function(require,module,exports) {
module.exports = 0.000001

},{}],"../../../node_modules/gl-vec3/create.js":[function(require,module,exports) {
module.exports = create;

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
    var out = new Float32Array(3)
    out[0] = 0
    out[1] = 0
    out[2] = 0
    return out
}
},{}],"../../../node_modules/gl-vec3/clone.js":[function(require,module,exports) {
module.exports = clone;

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function clone(a) {
    var out = new Float32Array(3)
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/fromValues.js":[function(require,module,exports) {
module.exports = fromValues;

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
    var out = new Float32Array(3)
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}
},{}],"../../../node_modules/gl-vec3/normalize.js":[function(require,module,exports) {
module.exports = normalize;

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    var len = x*x + y*y + z*z
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len)
        out[0] = a[0] * len
        out[1] = a[1] * len
        out[2] = a[2] * len
    }
    return out
}
},{}],"../../../node_modules/gl-vec3/dot.js":[function(require,module,exports) {
module.exports = dot;

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
},{}],"../../../node_modules/gl-vec3/angle.js":[function(require,module,exports) {
module.exports = angle

var fromValues = require('./fromValues')
var normalize = require('./normalize')
var dot = require('./dot')

/**
 * Get the angle between two 3D vectors
 * @param {vec3} a The first operand
 * @param {vec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
    var tempA = fromValues(a[0], a[1], a[2])
    var tempB = fromValues(b[0], b[1], b[2])
 
    normalize(tempA, tempA)
    normalize(tempB, tempB)
 
    var cosine = dot(tempA, tempB)

    if(cosine > 1.0){
        return 0
    } else {
        return Math.acos(cosine)
    }     
}

},{"./fromValues":"../../../node_modules/gl-vec3/fromValues.js","./normalize":"../../../node_modules/gl-vec3/normalize.js","./dot":"../../../node_modules/gl-vec3/dot.js"}],"../../../node_modules/gl-vec3/copy.js":[function(require,module,exports) {
module.exports = copy;

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/set.js":[function(require,module,exports) {
module.exports = set;

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}
},{}],"../../../node_modules/gl-vec3/equals.js":[function(require,module,exports) {
module.exports = equals

var EPSILON = require('./epsilon')

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0]
  var a1 = a[1]
  var a2 = a[2]
  var b0 = b[0]
  var b1 = b[1]
  var b2 = b[2]
  return (Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
          Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
          Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)))
}

},{"./epsilon":"../../../node_modules/gl-vec3/epsilon.js"}],"../../../node_modules/gl-vec3/exactEquals.js":[function(require,module,exports) {
module.exports = exactEquals

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec3} a The first vector.
 * @param {vec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

},{}],"../../../node_modules/gl-vec3/add.js":[function(require,module,exports) {
module.exports = add;

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    out[2] = a[2] + b[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/subtract.js":[function(require,module,exports) {
module.exports = subtract;

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    out[2] = a[2] - b[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/sub.js":[function(require,module,exports) {
module.exports = require('./subtract')

},{"./subtract":"../../../node_modules/gl-vec3/subtract.js"}],"../../../node_modules/gl-vec3/multiply.js":[function(require,module,exports) {
module.exports = multiply;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    out[2] = a[2] * b[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/mul.js":[function(require,module,exports) {
module.exports = require('./multiply')

},{"./multiply":"../../../node_modules/gl-vec3/multiply.js"}],"../../../node_modules/gl-vec3/divide.js":[function(require,module,exports) {
module.exports = divide;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
    out[0] = a[0] / b[0]
    out[1] = a[1] / b[1]
    out[2] = a[2] / b[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/div.js":[function(require,module,exports) {
module.exports = require('./divide')

},{"./divide":"../../../node_modules/gl-vec3/divide.js"}],"../../../node_modules/gl-vec3/min.js":[function(require,module,exports) {
module.exports = min;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
    out[0] = Math.min(a[0], b[0])
    out[1] = Math.min(a[1], b[1])
    out[2] = Math.min(a[2], b[2])
    return out
}
},{}],"../../../node_modules/gl-vec3/max.js":[function(require,module,exports) {
module.exports = max;

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
    out[0] = Math.max(a[0], b[0])
    out[1] = Math.max(a[1], b[1])
    out[2] = Math.max(a[2], b[2])
    return out
}
},{}],"../../../node_modules/gl-vec3/floor.js":[function(require,module,exports) {
module.exports = floor

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to floor
 * @returns {vec3} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0])
  out[1] = Math.floor(a[1])
  out[2] = Math.floor(a[2])
  return out
}

},{}],"../../../node_modules/gl-vec3/ceil.js":[function(require,module,exports) {
module.exports = ceil

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to ceil
 * @returns {vec3} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0])
  out[1] = Math.ceil(a[1])
  out[2] = Math.ceil(a[2])
  return out
}

},{}],"../../../node_modules/gl-vec3/round.js":[function(require,module,exports) {
module.exports = round

/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to round
 * @returns {vec3} out
 */
function round(out, a) {
  out[0] = Math.round(a[0])
  out[1] = Math.round(a[1])
  out[2] = Math.round(a[2])
  return out
}

},{}],"../../../node_modules/gl-vec3/scale.js":[function(require,module,exports) {
module.exports = scale;

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
    out[0] = a[0] * b
    out[1] = a[1] * b
    out[2] = a[2] * b
    return out
}
},{}],"../../../node_modules/gl-vec3/scaleAndAdd.js":[function(require,module,exports) {
module.exports = scaleAndAdd;

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale)
    out[1] = a[1] + (b[1] * scale)
    out[2] = a[2] + (b[2] * scale)
    return out
}
},{}],"../../../node_modules/gl-vec3/distance.js":[function(require,module,exports) {
module.exports = distance;

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2]
    return Math.sqrt(x*x + y*y + z*z)
}
},{}],"../../../node_modules/gl-vec3/dist.js":[function(require,module,exports) {
module.exports = require('./distance')

},{"./distance":"../../../node_modules/gl-vec3/distance.js"}],"../../../node_modules/gl-vec3/squaredDistance.js":[function(require,module,exports) {
module.exports = squaredDistance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2]
    return x*x + y*y + z*z
}
},{}],"../../../node_modules/gl-vec3/sqrDist.js":[function(require,module,exports) {
module.exports = require('./squaredDistance')

},{"./squaredDistance":"../../../node_modules/gl-vec3/squaredDistance.js"}],"../../../node_modules/gl-vec3/length.js":[function(require,module,exports) {
module.exports = length;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return Math.sqrt(x*x + y*y + z*z)
}
},{}],"../../../node_modules/gl-vec3/len.js":[function(require,module,exports) {
module.exports = require('./length')

},{"./length":"../../../node_modules/gl-vec3/length.js"}],"../../../node_modules/gl-vec3/squaredLength.js":[function(require,module,exports) {
module.exports = squaredLength;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return x*x + y*y + z*z
}
},{}],"../../../node_modules/gl-vec3/sqrLen.js":[function(require,module,exports) {
module.exports = require('./squaredLength')

},{"./squaredLength":"../../../node_modules/gl-vec3/squaredLength.js"}],"../../../node_modules/gl-vec3/negate.js":[function(require,module,exports) {
module.exports = negate;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
    out[0] = -a[0]
    out[1] = -a[1]
    out[2] = -a[2]
    return out
}
},{}],"../../../node_modules/gl-vec3/inverse.js":[function(require,module,exports) {
module.exports = inverse;

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0]
  out[1] = 1.0 / a[1]
  out[2] = 1.0 / a[2]
  return out
}
},{}],"../../../node_modules/gl-vec3/cross.js":[function(require,module,exports) {
module.exports = cross;

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
}
},{}],"../../../node_modules/gl-vec3/lerp.js":[function(require,module,exports) {
module.exports = lerp;

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2]
    out[0] = ax + t * (b[0] - ax)
    out[1] = ay + t * (b[1] - ay)
    out[2] = az + t * (b[2] - az)
    return out
}
},{}],"../../../node_modules/gl-vec3/random.js":[function(require,module,exports) {
module.exports = random;

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
    scale = scale || 1.0

    var r = Math.random() * 2.0 * Math.PI
    var z = (Math.random() * 2.0) - 1.0
    var zScale = Math.sqrt(1.0-z*z) * scale

    out[0] = Math.cos(r) * zScale
    out[1] = Math.sin(r) * zScale
    out[2] = z * scale
    return out
}
},{}],"../../../node_modules/gl-vec3/transformMat4.js":[function(require,module,exports) {
module.exports = transformMat4;

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15]
    w = w || 1.0
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
    return out
}
},{}],"../../../node_modules/gl-vec3/transformMat3.js":[function(require,module,exports) {
module.exports = transformMat3;

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
    var x = a[0], y = a[1], z = a[2]
    out[0] = x * m[0] + y * m[3] + z * m[6]
    out[1] = x * m[1] + y * m[4] + z * m[7]
    out[2] = x * m[2] + y * m[5] + z * m[8]
    return out
}
},{}],"../../../node_modules/gl-vec3/transformQuat.js":[function(require,module,exports) {
module.exports = transformQuat;

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx
    return out
}
},{}],"../../../node_modules/gl-vec3/rotateX.js":[function(require,module,exports) {
module.exports = rotateX;

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateX(out, a, b, c){
    var by = b[1]
    var bz = b[2]

    // Translate point to the origin
    var py = a[1] - by
    var pz = a[2] - bz

    var sc = Math.sin(c)
    var cc = Math.cos(c)

    // perform rotation and translate to correct position
    out[0] = a[0]
    out[1] = by + py * cc - pz * sc
    out[2] = bz + py * sc + pz * cc

    return out
}

},{}],"../../../node_modules/gl-vec3/rotateY.js":[function(require,module,exports) {
module.exports = rotateY;

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateY(out, a, b, c){
    var bx = b[0]
    var bz = b[2]

    // translate point to the origin
    var px = a[0] - bx
    var pz = a[2] - bz
    
    var sc = Math.sin(c)
    var cc = Math.cos(c)
  
    // perform rotation and translate to correct position
    out[0] = bx + pz * sc + px * cc
    out[1] = a[1]
    out[2] = bz + pz * cc - px * sc
  
    return out
}

},{}],"../../../node_modules/gl-vec3/rotateZ.js":[function(require,module,exports) {
module.exports = rotateZ;

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
function rotateZ(out, a, b, c){
    var bx = b[0]
    var by = b[1]

    //Translate point to the origin
    var px = a[0] - bx
    var py = a[1] - by
  
    var sc = Math.sin(c)
    var cc = Math.cos(c)

    // perform rotation and translate to correct position
    out[0] = bx + px * cc - py * sc
    out[1] = by + px * sc + py * cc
    out[2] = a[2]
  
    return out
}

},{}],"../../../node_modules/gl-vec3/forEach.js":[function(require,module,exports) {
module.exports = forEach;

var vec = require('./create')()

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
function forEach(a, stride, offset, count, fn, arg) {
        var i, l
        if(!stride) {
            stride = 3
        }

        if(!offset) {
            offset = 0
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length)
        } else {
            l = a.length
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i] 
            vec[1] = a[i+1] 
            vec[2] = a[i+2]
            fn(vec, vec, arg)
            a[i] = vec[0] 
            a[i+1] = vec[1] 
            a[i+2] = vec[2]
        }
        
        return a
}
},{"./create":"../../../node_modules/gl-vec3/create.js"}],"../../../node_modules/gl-vec3/index.js":[function(require,module,exports) {
module.exports = {
  EPSILON: require('./epsilon')
  , create: require('./create')
  , clone: require('./clone')
  , angle: require('./angle')
  , fromValues: require('./fromValues')
  , copy: require('./copy')
  , set: require('./set')
  , equals: require('./equals')
  , exactEquals: require('./exactEquals')
  , add: require('./add')
  , subtract: require('./subtract')
  , sub: require('./sub')
  , multiply: require('./multiply')
  , mul: require('./mul')
  , divide: require('./divide')
  , div: require('./div')
  , min: require('./min')
  , max: require('./max')
  , floor: require('./floor')
  , ceil: require('./ceil')
  , round: require('./round')
  , scale: require('./scale')
  , scaleAndAdd: require('./scaleAndAdd')
  , distance: require('./distance')
  , dist: require('./dist')
  , squaredDistance: require('./squaredDistance')
  , sqrDist: require('./sqrDist')
  , length: require('./length')
  , len: require('./len')
  , squaredLength: require('./squaredLength')
  , sqrLen: require('./sqrLen')
  , negate: require('./negate')
  , inverse: require('./inverse')
  , normalize: require('./normalize')
  , dot: require('./dot')
  , cross: require('./cross')
  , lerp: require('./lerp')
  , random: require('./random')
  , transformMat4: require('./transformMat4')
  , transformMat3: require('./transformMat3')
  , transformQuat: require('./transformQuat')
  , rotateX: require('./rotateX')
  , rotateY: require('./rotateY')
  , rotateZ: require('./rotateZ')
  , forEach: require('./forEach')
}

},{"./epsilon":"../../../node_modules/gl-vec3/epsilon.js","./create":"../../../node_modules/gl-vec3/create.js","./clone":"../../../node_modules/gl-vec3/clone.js","./angle":"../../../node_modules/gl-vec3/angle.js","./fromValues":"../../../node_modules/gl-vec3/fromValues.js","./copy":"../../../node_modules/gl-vec3/copy.js","./set":"../../../node_modules/gl-vec3/set.js","./equals":"../../../node_modules/gl-vec3/equals.js","./exactEquals":"../../../node_modules/gl-vec3/exactEquals.js","./add":"../../../node_modules/gl-vec3/add.js","./subtract":"../../../node_modules/gl-vec3/subtract.js","./sub":"../../../node_modules/gl-vec3/sub.js","./multiply":"../../../node_modules/gl-vec3/multiply.js","./mul":"../../../node_modules/gl-vec3/mul.js","./divide":"../../../node_modules/gl-vec3/divide.js","./div":"../../../node_modules/gl-vec3/div.js","./min":"../../../node_modules/gl-vec3/min.js","./max":"../../../node_modules/gl-vec3/max.js","./floor":"../../../node_modules/gl-vec3/floor.js","./ceil":"../../../node_modules/gl-vec3/ceil.js","./round":"../../../node_modules/gl-vec3/round.js","./scale":"../../../node_modules/gl-vec3/scale.js","./scaleAndAdd":"../../../node_modules/gl-vec3/scaleAndAdd.js","./distance":"../../../node_modules/gl-vec3/distance.js","./dist":"../../../node_modules/gl-vec3/dist.js","./squaredDistance":"../../../node_modules/gl-vec3/squaredDistance.js","./sqrDist":"../../../node_modules/gl-vec3/sqrDist.js","./length":"../../../node_modules/gl-vec3/length.js","./len":"../../../node_modules/gl-vec3/len.js","./squaredLength":"../../../node_modules/gl-vec3/squaredLength.js","./sqrLen":"../../../node_modules/gl-vec3/sqrLen.js","./negate":"../../../node_modules/gl-vec3/negate.js","./inverse":"../../../node_modules/gl-vec3/inverse.js","./normalize":"../../../node_modules/gl-vec3/normalize.js","./dot":"../../../node_modules/gl-vec3/dot.js","./cross":"../../../node_modules/gl-vec3/cross.js","./lerp":"../../../node_modules/gl-vec3/lerp.js","./random":"../../../node_modules/gl-vec3/random.js","./transformMat4":"../../../node_modules/gl-vec3/transformMat4.js","./transformMat3":"../../../node_modules/gl-vec3/transformMat3.js","./transformQuat":"../../../node_modules/gl-vec3/transformQuat.js","./rotateX":"../../../node_modules/gl-vec3/rotateX.js","./rotateY":"../../../node_modules/gl-vec3/rotateY.js","./rotateZ":"../../../node_modules/gl-vec3/rotateZ.js","./forEach":"../../../node_modules/gl-vec3/forEach.js"}],"../../../node_modules/angle-normals/angle-normals.js":[function(require,module,exports) {
'use strict'

module.exports = angleNormals

function hypot(x, y, z) {
  return Math.sqrt(Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2))
}

function weight(s, r, a) {
  return Math.atan2(r, (s - a))
}

function mulAdd(dest, s, x, y, z) {
  dest[0] += s * x
  dest[1] += s * y
  dest[2] += s * z
}

function angleNormals(cells, positions) {
  var numVerts = positions.length
  var numCells = cells.length

  //Allocate normal array
  var normals = new Array(numVerts)
  for(var i=0; i<numVerts; ++i) {
    normals[i] = [0,0,0]
  }

  //Scan cells, and
  for(var i=0; i<numCells; ++i) {
    var cell = cells[i]
    var a = positions[cell[0]]
    var b = positions[cell[1]]
    var c = positions[cell[2]]

    var abx = a[0] - b[0]
    var aby = a[1] - b[1]
    var abz = a[2] - b[2]
    var ab = hypot(abx, aby, abz)

    var bcx = b[0] - c[0]
    var bcy = b[1] - c[1]
    var bcz = b[2] - c[2]
    var bc = hypot(bcx, bcy, bcz)

    var cax = c[0] - a[0]
    var cay = c[1] - a[1]
    var caz = c[2] - a[2]
    var ca = hypot(cax, cay, caz)

    if(Math.min(ab, bc, ca) < 1e-6) {
      continue
    }

    var s = 0.5 * (ab + bc + ca)
    var r = Math.sqrt((s - ab)*(s - bc)*(s - ca)/s)

    var nx = aby * bcz - abz * bcy
    var ny = abz * bcx - abx * bcz
    var nz = abx * bcy - aby * bcx
    var nl = hypot(nx, ny, nz)
    nx /= nl
    ny /= nl
    nz /= nl

    mulAdd(normals[cell[0]], weight(s, r, bc), nx, ny, nz)
    mulAdd(normals[cell[1]], weight(s, r, ca), nx, ny, nz)
    mulAdd(normals[cell[2]], weight(s, r, ab), nx, ny, nz)
  }

  //Normalize all the normals
  for(var i=0; i<numVerts; ++i) {
    var n = normals[i]
    var l = Math.sqrt(
      Math.pow(n[0], 2) +
      Math.pow(n[1], 2) +
      Math.pow(n[2], 2))
    if(l < 1e-8) {
      n[0] = 1
      n[1] = 0
      n[2] = 0
      continue
    }
    n[0] /= l
    n[1] /= l
    n[2] /= l
  }

  return normals
}

},{}],"../../../node_modules/@tstackgl/geometry/src/shape/primitive-pyramid.ts":[function(require,module,exports) {
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var normals = require("angle-normals");
/*

TODO:
- angle normals definition
- uv

*/
var defaultOption = {
    scale: 1,
    height: 1,
    skew: [0, 0]
};
function geoPyramid(option) {
    var geo = {
        positions: [],
        cells: [],
        normals: []
    };
    option = __assign({}, defaultOption, option);
    var scale = option.scale;
    var height = option.height;
    var skew = option.skew;
    geo.positions = [
        // base
        [-scale, -scale, 0],
        [-scale, scale, 0],
        [scale, scale, 0],
        [scale, -scale, 0],
        // faces
        [-scale, scale, 0],
        [-scale, -scale, 0],
        [skew[0], skew[1], height],
        [scale, scale, 0],
        [-scale, scale, 0],
        [skew[0], skew[1], height],
        [scale, -scale, 0],
        [scale, scale, 0],
        [skew[0], skew[1], height],
        [-scale, -scale, 0],
        [scale, -scale, 0],
        [skew[0], skew[1], height],
    ];
    geo.cells = [
        // base
        [0, 1, 2],
        [2, 3, 0],
        // faces
        [4, 5, 6],
        [7, 8, 9],
        [10, 11, 12],
        [13, 14, 15],
    ];
    geo.normals = normals(geo.cells, geo.positions);
    return geo;
}
exports["default"] = geoPyramid;

},{"angle-normals":"../../../node_modules/angle-normals/angle-normals.js"}],"../../../node_modules/@tstackgl/regl-draw/dist/regl-axes.js":[function(require,module,exports) {
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mesh_combine_normals_1 = require("@tstackgl/geometry/src/mesh-combine-normals");
var regl_1 = __importDefault(require("regl"));
var gl_mat4_1 = __importDefault(require("gl-mat4"));
var gl_vec3_1 = __importDefault(require("gl-vec3"));
var primitive_pyramid_1 = __importDefault(require("@tstackgl/geometry/src/shape/primitive-pyramid"));
var vert = "\n  precision mediump float;\n  uniform mat4 projection, view;\n  attribute vec3 position;\n  attribute vec3 colorAttribute;\n  varying vec3 color;\n  void main () {\n    color = colorAttribute;\n    gl_Position = projection * view * vec4(position, 1);\n  }\n";
var frag = "\n  precision mediump float;\n  varying vec3 color;\n  void main () {\n    gl_FragColor = vec4(color, 1.0);\n  }\n";
// ----------------------------------------------------------------- lines
function createAxesLines(regl, scale) {
    var mesh = {
        positions: [[0, 0, 0], [scale, 0, 0], [0, 0, 0], [0, scale, 0], [0, 0, 0], [0, 0, scale]],
        cells: [[0, 1], [2, 3], [4, 5]],
        colors: [[1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 1, 0], [0, 0, 1], [0, 0, 1]],
    };
    return regl({
        vert: vert,
        frag: frag,
        attributes: {
            position: mesh.positions,
            colorAttribute: mesh.colors,
        },
        elements: mesh.cells,
    });
}
// ----------------------------------------------------------------- arrows
function createAxes(regl, scale) {
    var arrowPyramidOpts = { scale: 0.1, height: 0.22 };
    function transformAxies(dir, axis) {
        var out = gl_mat4_1.default.create();
        out = gl_mat4_1.default.translate(out, out, dir);
        gl_mat4_1.default.rotate(out, out, Math.PI / 2, axis);
        return out;
    }
    function getAxis(translationVec, colorVec, rotationVec) {
        var arrow = primitive_pyramid_1.default(arrowPyramidOpts);
        arrow.positions = arrow.positions.map(function (position) {
            var mat = transformAxies(translationVec, rotationVec);
            return gl_vec3_1.default.transformMat4(gl_vec3_1.default.create(), position, mat);
        });
        arrow.colors = arrow.positions.map(function (p) { return colorVec; });
        return arrow;
    }
    var xArrow = getAxis([scale, 0, 0], [1, 0, 0], [0, 1, 0]);
    var yArrow = getAxis([0, scale, 0], [0, 1, 0], [-1, 0, 0]);
    var zArrow = getAxis([0, 0, scale], [0, 0, 2], [0, 0, 1]);
    var meshes = [xArrow, yArrow, zArrow];
    var mesh = mesh_combine_normals_1.combine(meshes);
    mesh.colors = [].concat(meshes.map(function (x) { return x.colors; }));
    return regl({
        vert: vert,
        frag: frag,
        attributes: {
            position: mesh.positions,
            colorAttribute: mesh.colors,
            createRegl: regl_1.default,
        },
        elements: mesh.cells,
    });
}
function createXYZ(regl, scale) {
    if (scale === void 0) { scale = 1; }
    var axes = createAxes(regl, scale);
    var axesLines = createAxesLines(regl, scale);
    return function drawAxes() {
        axes();
        axesLines();
    };
}
exports.createXYZ = createXYZ;

},{"@tstackgl/geometry/src/mesh-combine-normals":"../../../node_modules/@tstackgl/geometry/src/mesh-combine-normals.ts","regl":"../../../node_modules/regl/dist/regl.js","gl-mat4":"../../../node_modules/gl-mat4/index.js","gl-vec3":"../../../node_modules/gl-vec3/index.js","@tstackgl/geometry/src/shape/primitive-pyramid":"../../../node_modules/@tstackgl/geometry/src/shape/primitive-pyramid.ts"}],"../../../node_modules/vectors/normalize-nd.js":[function(require,module,exports) {
module.exports = normalize

function normalize(vec) {
  var mag = 0
  for (var n = 0; n < vec.length; n++) {
    mag += vec[n] * vec[n]
  }
  mag = Math.sqrt(mag)

  // avoid dividing by zero
  if (mag === 0) {
    return Array.apply(null, new Array(vec.length)).map(Number.prototype.valueOf, 0)
  }

  for (var n = 0; n < vec.length; n++) {
    vec[n] /= mag
  }

  return vec
}

},{}],"../../../node_modules/icosphere/index.js":[function(require,module,exports) {
var normalize = require('vectors/normalize-nd')

module.exports = icosphere

function icosphere(subdivisions) {
  subdivisions = +subdivisions|0

  var positions = []
  var faces = []
  var t = 0.5 + Math.sqrt(5) / 2

  positions.push([-1, +t,  0])
  positions.push([+1, +t,  0])
  positions.push([-1, -t,  0])
  positions.push([+1, -t,  0])

  positions.push([ 0, -1, +t])
  positions.push([ 0, +1, +t])
  positions.push([ 0, -1, -t])
  positions.push([ 0, +1, -t])

  positions.push([+t,  0, -1])
  positions.push([+t,  0, +1])
  positions.push([-t,  0, -1])
  positions.push([-t,  0, +1])

  faces.push([0, 11, 5])
  faces.push([0, 5, 1])
  faces.push([0, 1, 7])
  faces.push([0, 7, 10])
  faces.push([0, 10, 11])

  faces.push([1, 5, 9])
  faces.push([5, 11, 4])
  faces.push([11, 10, 2])
  faces.push([10, 7, 6])
  faces.push([7, 1, 8])

  faces.push([3, 9, 4])
  faces.push([3, 4, 2])
  faces.push([3, 2, 6])
  faces.push([3, 6, 8])
  faces.push([3, 8, 9])

  faces.push([4, 9, 5])
  faces.push([2, 4, 11])
  faces.push([6, 2, 10])
  faces.push([8, 6, 7])
  faces.push([9, 8, 1])

  var complex = {
      cells: faces
    , positions: positions
  }

  while (subdivisions-- > 0) {
    complex = subdivide(complex)
  }

  positions = complex.positions
  for (var i = 0; i < positions.length; i++) {
    normalize(positions[i])
  }

  return complex
}

// TODO: work out the second half of loop subdivision
// and extract this into its own module.
function subdivide(complex) {
  var positions = complex.positions
  var cells = complex.cells

  var newCells = []
  var newPositions = []
  var midpoints = {}
  var f = [0, 1, 2]
  var l = 0

  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    var c0 = cell[0]
    var c1 = cell[1]
    var c2 = cell[2]
    var v0 = positions[c0]
    var v1 = positions[c1]
    var v2 = positions[c2]

    var a = getMidpoint(v0, v1)
    var b = getMidpoint(v1, v2)
    var c = getMidpoint(v2, v0)

    var ai = newPositions.indexOf(a)
    if (ai === -1) ai = l++, newPositions.push(a)
    var bi = newPositions.indexOf(b)
    if (bi === -1) bi = l++, newPositions.push(b)
    var ci = newPositions.indexOf(c)
    if (ci === -1) ci = l++, newPositions.push(c)

    var v0i = newPositions.indexOf(v0)
    if (v0i === -1) v0i = l++, newPositions.push(v0)
    var v1i = newPositions.indexOf(v1)
    if (v1i === -1) v1i = l++, newPositions.push(v1)
    var v2i = newPositions.indexOf(v2)
    if (v2i === -1) v2i = l++, newPositions.push(v2)

    newCells.push([v0i, ai, ci])
    newCells.push([v1i, bi, ai])
    newCells.push([v2i, ci, bi])
    newCells.push([ai, bi, ci])
  }

  return {
      cells: newCells
    , positions: newPositions
  }

  // reuse midpoint vertices between iterations.
  // Otherwise, there'll be duplicate vertices in the final
  // mesh, resulting in sharp edges.
  function getMidpoint(a, b) {
    var point = midpoint(a, b)
    var pointKey = pointToKey(point)
    var cachedPoint = midpoints[pointKey]
    if (cachedPoint) {
      return cachedPoint
    } else {
      return midpoints[pointKey] = point
    }
  }

  function pointToKey(point) {
    return point[0].toPrecision(6) + ','
         + point[1].toPrecision(6) + ','
         + point[2].toPrecision(6)
  }

  function midpoint(a, b) {
    return [
        (a[0] + b[0]) / 2
      , (a[1] + b[1]) / 2
      , (a[2] + b[2]) / 2
    ]
  }
}

},{"vectors/normalize-nd":"../../../node_modules/vectors/normalize-nd.js"}],"../../../node_modules/gl-vec2/cross.js":[function(require,module,exports) {
module.exports = cross

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0]
    out[0] = out[1] = 0
    out[2] = z
    return out
}
},{}],"../../../node_modules/gl-vec2/subtract.js":[function(require,module,exports) {
module.exports = subtract

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function subtract(out, a, b) {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    return out
}
},{}],"../../../node_modules/primitive-icosphere/lib/is-uv-seam.js":[function(require,module,exports) {
var cross2 = require('gl-vec2/cross')
var sub2 = require('gl-vec2/subtract')

var tmpX = [0, 0, 0]
var tmpY = [0, 0, 0]

module.exports = function isUVBroken (uvs, a, b, c) {
  var uvA = uvs[a]
  var uvB = uvs[b]
  var uvC = uvs[c]
  sub2(tmpX, uvB, uvA)
  sub2(tmpY, uvC, uvA)
  cross2(tmpX, tmpX, tmpY)
  return tmpX[2] < 0
}

},{"gl-vec2/cross":"../../../node_modules/gl-vec2/cross.js","gl-vec2/subtract":"../../../node_modules/gl-vec2/subtract.js"}],"../../../node_modules/primitive-icosphere/lib/fix-wrapped-uvs.js":[function(require,module,exports) {
var isSeam = require('./is-uv-seam')
var MIN = 0.25
var MAX = 0.75

module.exports = fixWrappedUVs

function fixWrappedUVs (mesh) {
  var positions = mesh.positions
  var cells = mesh.cells
  var uvs = mesh.uvs

  var newVertices = positions.slice()
  var newUvs = uvs.slice()
  var visited = {}

  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]

    var a = cell[0]
    var b = cell[1]
    var c = cell[2]

    if (!isSeam(uvs, a, b, c)) {
      continue
    }

    var p0 = positions[a]
    var p1 = positions[b]
    var p2 = positions[c]
    var uv0 = uvs[a]
    var uv1 = uvs[b]
    var uv2 = uvs[c]

    if (uv0[0] < MIN) {
      a = revisit(visited, a, uv0, p0)
    }
    if (uv1[0] < MIN) {
      b = revisit(visited, b, uv1, p1)
    }
    if (uv2[0] < MIN) {
      c = revisit(visited, c, uv2, p2)
    }

    cell[0] = a
    cell[1] = b
    cell[2] = c
  }

  fixUVEdges(cells, newUvs)
  // modify mesh in place with new lists
  mesh.positions = newVertices
  mesh.uvs = newUvs

  function revisit (cache, face, uv, position) {
    if (!(face in cache)) {
      newVertices.push(position.slice())
      newUvs.push(uv.slice())
      var verticeIndex = newVertices.length - 1
      cache[face] = verticeIndex
      return verticeIndex
    } else {
      return cache[face]
    }
  }
}

function fixUVEdges (cells, uvs) {
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    var uv0 = uvs[cell[0]]
    var uv1 = uvs[cell[1]]
    var uv2 = uvs[cell[2]]

    var max = Math.max(uv0[0], uv1[0], uv2[0])
    var min = Math.min(uv0[0], uv1[0], uv2[0])
    if (max > MAX && min < MIN) {
      if (uv0[0] < MIN) uv0[0] += 1
      if (uv1[0] < MIN) uv1[0] += 1
      if (uv2[0] < MIN) uv2[0] += 1
    }
  }
}

},{"./is-uv-seam":"../../../node_modules/primitive-icosphere/lib/is-uv-seam.js"}],"../../../node_modules/primitive-icosphere/lib/fix-pole-uvs.js":[function(require,module,exports) {
module.exports = fixPoleUVs
function fixPoleUVs (mesh) {
  var positions = mesh.positions
  var cells = mesh.cells
  var uvs = mesh.uvs

  var northIndex = firstYIndex(positions, 1)
  var southIndex = firstYIndex(positions, -1)
  if (northIndex === -1 || southIndex === -1) {
    // could not find any poles, bail early
    return
  }

  var newVertices = positions.slice()
  var newUvs = uvs.slice()
  var verticeIndex = newVertices.length - 1

  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i]
    var a = cell[0]
    var b = cell[1]
    var c = cell[2]

    if (a === northIndex) {
      visit(cell, northIndex, b, c)
    } else if (a === southIndex) {
      visit(cell, southIndex, b, c)
    }
  }

  mesh.positions = newVertices
  mesh.uvs = newUvs

  function visit (cell, poleIndex, b, c) {
    var uv1 = uvs[b]
    var uv2 = uvs[c]
    uvs[poleIndex][0] = (uv1[0] + uv2[0]) / 2
    verticeIndex++
    newVertices.push(positions[poleIndex].slice())
    newUvs.push(uvs[poleIndex].slice())
    cell[0] = verticeIndex
  }
}

function firstYIndex (list, value) {
  for (var i = 0; i < list.length; i++) {
    var vec = list[i]
    if (Math.abs(vec[1] - value) <= 1e-4) {
      return i
    }
  }
  return -1
}

},{}],"../../../node_modules/primitive-icosphere/index.js":[function(require,module,exports) {
var icosphere = require('icosphere')
var normalize = require('gl-vec3/normalize')
var scale = require('gl-vec3/scale')
var fixWrappedUVs = require('./lib/fix-wrapped-uvs')
var fixPoles = require('./lib/fix-pole-uvs')

module.exports = function primitiveIcosphere (radius, opt) {
  opt = opt || {}
  radius = typeof radius !== 'undefined' ? radius : 1

  var subdivisions = typeof opt.subdivisions !== 'undefined' ? opt.subdivisions : 2
  var complex = icosphere(subdivisions)

  var normals = []
  var uvs = []
  var i, position

  for (i = 0; i < complex.positions.length; i++) {
    position = complex.positions[i]

    // get UV from unit icosphere
    var u = 0.5 * (-(Math.atan2(position[2], -position[0]) / Math.PI) + 1.0)
    var v = 0.5 + Math.asin(position[1]) / Math.PI
    uvs.push([ 1 - u, 1 - v ])
  }

  var mesh = {
    positions: complex.positions,
    cells: complex.cells,
    uvs: uvs,
    normals: normals
  }

  // attempt to fix some of the glaring seam issues
  fixPoles(mesh)
  fixWrappedUVs(mesh)

  // now determine normals
  for (i = 0; i < mesh.positions.length; i++) {
    position = mesh.positions[i]

    // get normal
    var normal = normalize([0, 0, 0], position)
    normals.push(normal)

    // and scale sphere to radius
    scale(position, position, radius)
  }

  return mesh
}

},{"icosphere":"../../../node_modules/icosphere/index.js","gl-vec3/normalize":"../../../node_modules/gl-vec3/normalize.js","gl-vec3/scale":"../../../node_modules/gl-vec3/scale.js","./lib/fix-wrapped-uvs":"../../../node_modules/primitive-icosphere/lib/fix-wrapped-uvs.js","./lib/fix-pole-uvs":"../../../node_modules/primitive-icosphere/lib/fix-pole-uvs.js"}],"../../../node_modules/@tstackgl/regl-draw/dist/draw-debug.js":[function(require,module,exports) {
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var primitive_icosphere_1 = __importDefault(require("primitive-icosphere"));
var vert = "\nprecision mediump float;\n\nuniform mat4 projection, view;\nuniform vec3 translate;\nattribute vec3 position, normal;\n\nvoid main () {\n  vec4 mpos = projection * view * vec4(position + translate, 1.0);\n  gl_Position = mpos;\n}";
var frag = "\nprecision mediump float;\n\nvarying vec3 vViewPos;\nuniform vec4 color;\n\nvoid main () {\n  gl_FragColor = color;\n}";
function createDrawPointDebug(regl, radius) {
    if (radius === void 0) { radius = 0.3; }
    var mesh = primitive_icosphere_1.default(radius, { subdivisions: 2 });
    var draw = regl({
        frag: frag,
        vert: vert,
        attributes: {
            position: function () { return mesh.positions; },
            normal: function () { return mesh.normals; },
        },
        uniforms: {
            color: regl.prop('color'),
            translate: regl.prop('translate'),
        },
        elements: function () { return mesh.cells; },
    });
    return {
        draw: draw,
    };
}
exports.createDrawPointDebug = createDrawPointDebug;

},{"primitive-icosphere":"../../../node_modules/primitive-icosphere/index.js"}],"../../../node_modules/normals/normals.js":[function(require,module,exports) {
var DEFAULT_NORMALS_EPSILON = 1e-6;
var DEFAULT_FACE_EPSILON = 1e-6;

//Estimate the vertex normals of a mesh
exports.vertexNormals = function(faces, positions, specifiedEpsilon) {

  var N         = positions.length;
  var normals   = new Array(N);
  var epsilon   = specifiedEpsilon === void(0) ? DEFAULT_NORMALS_EPSILON : specifiedEpsilon;

  //Initialize normal array
  for(var i=0; i<N; ++i) {
    normals[i] = [0.0, 0.0, 0.0];
  }

  //Walk over all the faces and add per-vertex contribution to normal weights
  for(var i=0; i<faces.length; ++i) {
    var f = faces[i];
    var p = 0;
    var c = f[f.length-1];
    var n = f[0];
    for(var j=0; j<f.length; ++j) {

      //Shift indices back
      p = c;
      c = n;
      n = f[(j+1) % f.length];

      var v0 = positions[p];
      var v1 = positions[c];
      var v2 = positions[n];

      //Compute infineteismal arcs
      var d01 = new Array(3);
      var m01 = 0.0;
      var d21 = new Array(3);
      var m21 = 0.0;
      for(var k=0; k<3; ++k) {
        d01[k] = v0[k]  - v1[k];
        m01   += d01[k] * d01[k];
        d21[k] = v2[k]  - v1[k];
        m21   += d21[k] * d21[k];
      }

      //Accumulate values in normal
      if(m01 * m21 > epsilon) {
        var norm = normals[c];
        var w = 1.0 / Math.sqrt(m01 * m21);
        for(var k=0; k<3; ++k) {
          var u = (k+1)%3;
          var v = (k+2)%3;
          norm[k] += w * (d21[u] * d01[v] - d21[v] * d01[u]);
        }
      }
    }
  }

  //Scale all normals to unit length
  for(var i=0; i<N; ++i) {
    var norm = normals[i];
    var m = 0.0;
    for(var k=0; k<3; ++k) {
      m += norm[k] * norm[k];
    }
    if(m > epsilon) {
      var w = 1.0 / Math.sqrt(m);
      for(var k=0; k<3; ++k) {
        norm[k] *= w;
      }
    } else {
      for(var k=0; k<3; ++k) {
        norm[k] = 0.0;
      }
    }
  }

  //Return the resulting set of patches
  return normals;
}

//Compute face normals of a mesh
exports.faceNormals = function(faces, positions, specifiedEpsilon) {

  var N         = faces.length;
  var normals   = new Array(N);
  var epsilon   = specifiedEpsilon === void(0) ? DEFAULT_FACE_EPSILON : specifiedEpsilon;

  for(var i=0; i<N; ++i) {
    var f = faces[i];
    var pos = new Array(3);
    for(var j=0; j<3; ++j) {
      pos[j] = positions[f[j]];
    }

    var d01 = new Array(3);
    var d21 = new Array(3);
    for(var j=0; j<3; ++j) {
      d01[j] = pos[1][j] - pos[0][j];
      d21[j] = pos[2][j] - pos[0][j];
    }

    var n = new Array(3);
    var l = 0.0;
    for(var j=0; j<3; ++j) {
      var u = (j+1)%3;
      var v = (j+2)%3;
      n[j] = d01[u] * d21[v] - d01[v] * d21[u];
      l += n[j] * n[j];
    }
    if(l > epsilon) {
      l = 1.0 / Math.sqrt(l);
    } else {
      l = 0.0;
    }
    for(var j=0; j<3; ++j) {
      n[j] *= l;
    }
    normals[i] = n;
  }
  return normals;
}



},{}],"../../../node_modules/@tstackgl/geometry/dist/calc/get-centroid.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getCentroid(points) {
    // TODO: refactor with transducers
    var l = points.length;
    if (l === 0) {
        return [];
    }
    return points.reduce(function (center, p, i) {
        for (var j = 0; j < p.length; j++) {
            center[j] += p[j];
        }
        if (i === l - 1) {
            for (var j = 0; j < p.length; j++) {
                center[j] /= l;
            }
        }
        return center;
    }, new Float32Array(points[0].length));
}
exports.getCentroid = getCentroid;
function getCentroidFromCells(cells, positions) {
    return cells.map(function (face) { return getCentroid(face.map(function (index) { return positions[index]; })); });
}
exports.getCentroidFromCells = getCentroidFromCells;

},{}],"../../../node_modules/earcut/src/earcut.js":[function(require,module,exports) {
'use strict';

module.exports = earcut;
module.exports.default = earcut;

function earcut(data, holeIndices, dim) {

    dim = dim || 2;

    var hasHoles = holeIndices && holeIndices.length,
        outerLen = hasHoles ? holeIndices[0] * dim : data.length,
        outerNode = linkedList(data, 0, outerLen, dim, true),
        triangles = [];

    if (!outerNode || outerNode.next === outerNode.prev) return triangles;

    var minX, minY, maxX, maxY, x, y, invSize;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
    if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (var i = dim; i < outerLen; i += dim) {
            x = data[i];
            y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        // minX, minY and invSize are later used to transform coords into integers for z-order calculation
        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 1 / invSize : 0;
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

    return triangles;
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    var i, last;

    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
    } else {
        for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
    }

    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }

    return last;
}

// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    var p = start,
        again;
    do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) break;
            again = true;

        } else {
            p = p.next;
        }
    } while (again || p !== end);

    return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) return;

    // interlink polygon nodes in z-order
    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    var stop = ear,
        prev, next;

    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            // cut off the triangle
            triangles.push(prev.i / dim);
            triangles.push(ear.i / dim);
            triangles.push(next.i / dim);

            removeNode(ear);

            // skipping the next vertex leads to less sliver triangles
            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

            // if this didn't work, try curing all small self-intersections locally
            } else if (pass === 1) {
                ear = cureLocalIntersections(ear, triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

            // as a last resort, try splitting the remaining polygon into two
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }

            break;
        }
    }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // now make sure we don't have other points inside the potential ear
    var p = ear.next.next;

    while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, invSize) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // triangle bbox; min & max are calculated like this for speed
    var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
        minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
        maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
        maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

    // z-order range for the current triangle bbox;
    var minZ = zOrder(minTX, minTY, minX, minY, invSize),
        maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

    var p = ear.prevZ,
        n = ear.nextZ;

    // look for points inside the triangle in both directions
    while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;

        if (n !== ear.prev && n !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    // look for remaining points in decreasing z-order
    while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    // look for remaining points in increasing z-order
    while (n && n.z <= maxZ) {
        if (n !== ear.prev && n !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles, dim) {
    var p = start;
    do {
        var a = p.prev,
            b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

            triangles.push(a.i / dim);
            triangles.push(p.i / dim);
            triangles.push(b.i / dim);

            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);

            p = start = b;
        }
        p = p.next;
    } while (p !== start);

    return p;
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    // look for a valid diagonal that divides the polygon into two
    var a = start;
    do {
        var b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                var c = splitPolygon(a, b);

                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, invSize);
                earcutLinked(c, triangles, dim, minX, minY, invSize);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    var queue = [],
        i, len, start, end, list;

    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareX);

    // process holes from left to right
    for (i = 0; i < queue.length; i++) {
        eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
    }

    return outerNode;
}

function compareX(a, b) {
    return a.x - b.x;
}

// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
    outerNode = findHoleBridge(hole, outerNode);
    if (outerNode) {
        var b = splitPolygon(outerNode, hole);
        filterPoints(b, b.next);
    }
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    var p = outerNode,
        hx = hole.x,
        hy = hole.y,
        qx = -Infinity,
        m;

    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                if (x === hx) {
                    if (hy === p.y) return p;
                    if (hy === p.next.y) return p.next;
                }
                m = p.x < p.next.x ? p : p.next;
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    if (hx === qx) return m.prev; // hole touches outer segment; pick lower endpoint

    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point

    var stop = m,
        mx = m.x,
        my = m.y,
        tanMin = Infinity,
        tan;

    p = m.next;

    while (p !== stop) {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

            tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

            if ((tan < tanMin || (tan === tanMin && p.x > m.x)) && locallyInside(p, hole)) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    }

    return m;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
    var p = start;
    do {
        if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    var i, p, q, e, tail, numMerges, pSize, qSize,
        inSize = 1;

    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }
            qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {

                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
    // coords are transformed into non-negative 15-bit integer range
    x = 32767 * (x - minX) * invSize;
    y = 32767 * (y - minY) * invSize;

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
    var p = start,
        leftmost = start;
    do {
        if (p.x < leftmost.x) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
           (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
           (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
           locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b);
}

// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    if ((equals(p1, q1) && equals(p2, q2)) ||
        (equals(p1, q2) && equals(p2, q1))) return true;
    return area(p1, q1, p2) > 0 !== area(p1, q1, q2) > 0 &&
           area(p2, q2, p1) > 0 !== area(p2, q2, q1) > 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    var p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    var p = a,
        inside = false,
        px = (a.x + b.x) / 2,
        py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    var a2 = new Node(a.i, a.x, a.y),
        b2 = new Node(b.i, b.x, b.y),
        an = a.next,
        bp = b.prev;

    a.next = b;
    b.prev = a;

    a2.next = an;
    an.prev = a2;

    b2.next = a2;
    a2.prev = b2;

    bp.next = b2;
    b2.prev = bp;

    return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    var p = new Node(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;

    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function Node(i, x, y) {
    // vertex index in coordinates array
    this.i = i;

    // vertex coordinates
    this.x = x;
    this.y = y;

    // previous and next vertex nodes in a polygon ring
    this.prev = null;
    this.next = null;

    // z-order curve value
    this.z = null;

    // previous and next nodes in z-order
    this.prevZ = null;
    this.nextZ = null;

    // indicates whether this is a steiner point
    this.steiner = false;
}

// return a percentage difference between the polygon area and its triangulation area;
// used to verify correctness of triangulation
earcut.deviation = function (data, holeIndices, dim, triangles) {
    var hasHoles = holeIndices && holeIndices.length;
    var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

    var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
    if (hasHoles) {
        for (var i = 0, len = holeIndices.length; i < len; i++) {
            var start = holeIndices[i] * dim;
            var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            polygonArea -= Math.abs(signedArea(data, start, end, dim));
        }
    }

    var trianglesArea = 0;
    for (i = 0; i < triangles.length; i += 3) {
        var a = triangles[i] * dim;
        var b = triangles[i + 1] * dim;
        var c = triangles[i + 2] * dim;
        trianglesArea += Math.abs(
            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
    }

    return polygonArea === 0 && trianglesArea === 0 ? 0 :
        Math.abs((trianglesArea - polygonArea) / polygonArea);
};

function signedArea(data, start, end, dim) {
    var sum = 0;
    for (var i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}

// turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
earcut.flatten = function (data) {
    var dim = data[0][0].length,
        result = {vertices: [], holes: [], dimensions: dim},
        holeIndex = 0;

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
            holeIndex += data[i - 1].length;
            result.holes.push(holeIndex);
        }
    }
    return result;
};

},{}],"../../../node_modules/@thi.ng/transducers/func/ensure-iterable.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arguments_1 = require("@thi.ng/errors/illegal-arguments");
function ensureIterable(x) {
    if (!(x != null && x[Symbol.iterator])) {
        illegal_arguments_1.illegalArgs(`value is not iterable: ${x}`);
    }
    return x;
}
exports.ensureIterable = ensureIterable;

},{"@thi.ng/errors/illegal-arguments":"../../../node_modules/@thi.ng/errors/illegal-arguments.js"}],"../../../node_modules/@thi.ng/transducers/func/ensure-array.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_array_1 = require("@thi.ng/checks/is-array");
const is_arraylike_1 = require("@thi.ng/checks/is-arraylike");
const ensure_iterable_1 = require("./ensure-iterable");
/**
 * Helper function to avoid unnecessary copying if `x` is already an
 * array. First checks if `x` is an array and if so returns it. Else
 * attempts to obtain an iterator from `x` and if successful collects it
 * as array and returns it. Throws error if `x` isn't iterable.
 *
 * @param x
 */
function ensureArray(x) {
    return is_array_1.isArray(x) ? x : [...ensure_iterable_1.ensureIterable(x)];
}
exports.ensureArray = ensureArray;
function ensureArrayLike(x) {
    return is_arraylike_1.isArrayLike(x) ? x : [...ensure_iterable_1.ensureIterable(x)];
}
exports.ensureArrayLike = ensureArrayLike;

},{"@thi.ng/checks/is-array":"../../../node_modules/@thi.ng/checks/is-array.js","@thi.ng/checks/is-arraylike":"../../../node_modules/@thi.ng/checks/is-arraylike.js","./ensure-iterable":"../../../node_modules/@thi.ng/transducers/func/ensure-iterable.js"}],"../../../node_modules/@thi.ng/transducers/iter/wrap.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arguments_1 = require("@thi.ng/errors/illegal-arguments");
const ensure_array_1 = require("../func/ensure-array");
/**
 * Yields iterator of `src` with the last `n` values of `src` prepended
 * at the beginning (if `left` is truthy) and/or the first `n` values
 * appended at the end (if `right` is truthy). Wraps both sides by
 * default and throws error if `n` < 0 or larger than `src.length`.
 *
 * @param src
 * @param n
 * @param left
 * @param right
 */
function* wrap(src, n = 1, left = true, right = true) {
    const _src = ensure_array_1.ensureArray(src);
    (n < 0 || n > _src.length) && illegal_arguments_1.illegalArgs(`wrong number of wrap items: got ${n}, but max: ${_src.length}`);
    if (left) {
        for (let m = _src.length, i = m - n; i < m; i++) {
            yield _src[i];
        }
    }
    yield* _src;
    if (right) {
        for (let i = 0; i < n; i++) {
            yield _src[i];
        }
    }
}
exports.wrap = wrap;

},{"@thi.ng/errors/illegal-arguments":"../../../node_modules/@thi.ng/errors/illegal-arguments.js","../func/ensure-array":"../../../node_modules/@thi.ng/transducers/func/ensure-array.js"}],"../../../node_modules/@thi.ng/transducers/reduced.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Reduced {
    constructor(val) {
        this.value = val;
    }
    deref() {
        return this.value;
    }
}
exports.Reduced = Reduced;
function reduced(x) {
    return new Reduced(x);
}
exports.reduced = reduced;
function isReduced(x) {
    return x instanceof Reduced;
}
exports.isReduced = isReduced;
function ensureReduced(x) {
    return x instanceof Reduced ? x : new Reduced(x);
}
exports.ensureReduced = ensureReduced;
function unreduced(x) {
    return x instanceof Reduced ? x.deref() : x;
}
exports.unreduced = unreduced;

},{}],"../../../node_modules/@thi.ng/errors/illegal-arity.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IllegalArityError extends Error {
    constructor(n) {
        super(`illegal arity: ${n}`);
    }
}
exports.IllegalArityError = IllegalArityError;
function illegalArity(n) {
    throw new IllegalArityError(n);
}
exports.illegalArity = illegalArity;

},{}],"../../../node_modules/@thi.ng/transducers/reduce.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const implements_function_1 = require("@thi.ng/checks/implements-function");
const is_arraylike_1 = require("@thi.ng/checks/is-arraylike");
const is_iterable_1 = require("@thi.ng/checks/is-iterable");
const illegal_arity_1 = require("@thi.ng/errors/illegal-arity");
const reduced_1 = require("./reduced");
function reduce(...args) {
    let acc, xs;
    switch (args.length) {
        case 3:
            xs = args[2];
            acc = args[1];
            break;
        case 2:
            xs = args[1];
            break;
        default:
            illegal_arity_1.illegalArity(args.length);
    }
    const rfn = args[0];
    const init = rfn[0];
    const complete = rfn[1];
    const reduce = rfn[2];
    acc = acc == null ? init() : acc;
    if (implements_function_1.implementsFunction(xs, "$reduce")) {
        acc = xs.$reduce(reduce, acc);
    }
    else if (is_arraylike_1.isArrayLike(xs)) {
        for (let i = 0, n = xs.length; i < n; i++) {
            acc = reduce(acc, xs[i]);
            if (reduced_1.isReduced(acc)) {
                acc = acc.deref();
                break;
            }
        }
    }
    else {
        for (let x of xs) {
            acc = reduce(acc, x);
            if (reduced_1.isReduced(acc)) {
                acc = acc.deref();
                break;
            }
        }
    }
    return reduced_1.unreduced(complete(acc));
}
exports.reduce = reduce;
/**
 * Convenience helper for building a full `Reducer` using the identity
 * function (i.e. `(x) => x`) as completion step (true for 90% of all
 * bundled transducers).
 *
 * @param init init step of reducer
 * @param rfn reduction step of reducer
 */
function reducer(init, rfn) {
    return [init, (acc) => acc, rfn];
}
exports.reducer = reducer;
exports.$$reduce = (rfn, args) => {
    const n = args.length - 1;
    return is_iterable_1.isIterable(args[n]) ?
        args.length > 1 ?
            reduce(rfn.apply(null, args.slice(0, n)), args[n]) :
            reduce(rfn(), args[0]) :
        undefined;
};

},{"@thi.ng/checks/implements-function":"../../../node_modules/@thi.ng/checks/implements-function.js","@thi.ng/checks/is-arraylike":"../../../node_modules/@thi.ng/checks/is-arraylike.js","@thi.ng/checks/is-iterable":"../../../node_modules/@thi.ng/checks/is-iterable.js","@thi.ng/errors/illegal-arity":"../../../node_modules/@thi.ng/errors/illegal-arity.js","./reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/rfn/push.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function push(xs) {
    return xs ?
        [...xs] :
        reduce_1.reducer(() => [], (acc, x) => (acc.push(x), acc));
}
exports.push = push;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/iterator.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@thi.ng/api/api");
const is_iterable_1 = require("@thi.ng/checks/is-iterable");
const reduced_1 = require("./reduced");
const push_1 = require("./rfn/push");
/**
 * Takes a transducer and input iterable. Returns iterator of
 * transformed results.
 *
 * @param xform
 * @param xs
 */
function* iterator(xform, xs) {
    const rfn = xform(push_1.push());
    const complete = rfn[1];
    const reduce = rfn[2];
    for (let x of xs) {
        const y = reduce([], x);
        if (reduced_1.isReduced(y)) {
            yield* reduced_1.unreduced(complete(y.deref()));
            return;
        }
        if (y.length) {
            yield* y;
        }
    }
    yield* reduced_1.unreduced(complete([]));
}
exports.iterator = iterator;
/**
 * Optimized version of `iterator()` for transducers which are
 * guaranteed to:
 *
 * 1) Only produce none or a single result per input
 * 2) Do not require a `completion` reduction step
 *
 * @param xform
 * @param xs
 */
function* iterator1(xform, xs) {
    const reduce = xform([null, null, (_, x) => x])[2];
    for (let x of xs) {
        let y = reduce(api_1.SEMAPHORE, x);
        if (reduced_1.isReduced(y)) {
            y = reduced_1.unreduced(y.deref());
            if (y !== api_1.SEMAPHORE) {
                yield y;
            }
            return;
        }
        if (y !== api_1.SEMAPHORE) {
            yield y;
        }
    }
}
exports.iterator1 = iterator1;
/**
 * Helper function used by various transducers to wrap themselves as
 * transforming iterators. Delegates to `iterator1()` by default.
 *
 * @param xform
 * @param args
 * @param impl
 */
exports.$iter = (xform, args, impl = iterator1) => {
    const n = args.length - 1;
    return is_iterable_1.isIterable(args[n]) ?
        args.length > 1 ?
            impl(xform.apply(null, args.slice(0, n)), args[n]) :
            impl(xform(), args[0]) :
        undefined;
};

},{"@thi.ng/api/api":"../../../node_modules/@thi.ng/api/api.js","@thi.ng/checks/is-iterable":"../../../node_modules/@thi.ng/checks/is-iterable.js","./reduced":"../../../node_modules/@thi.ng/transducers/reduced.js","./rfn/push":"../../../node_modules/@thi.ng/transducers/rfn/push.js"}],"../../../node_modules/@thi.ng/transducers/xform/partition.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
function partition(...args) {
    const iter = iterator_1.$iter(partition, args, iterator_1.iterator);
    if (iter) {
        return iter;
    }
    let size = args[0], all, step;
    if (typeof args[1] == "number") {
        step = args[1];
        all = args[2];
    }
    else {
        step = size;
        all = args[1];
    }
    return ([init, complete, reduce]) => {
        let buf = [];
        let skip = 0;
        return [
            init,
            (acc) => {
                if (all && buf.length > 0) {
                    acc = reduce(acc, buf);
                    buf = [];
                }
                return complete(acc);
            },
            (acc, x) => {
                if (skip <= 0) {
                    if (buf.length < size) {
                        buf.push(x);
                    }
                    if (buf.length === size) {
                        acc = reduce(acc, buf);
                        buf = step < size ? buf.slice(step) : [];
                        skip = step - size;
                    }
                }
                else {
                    skip--;
                }
                return acc;
            }
        ];
    };
}
exports.partition = partition;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@tstackgl/geometry/dist/edge.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var wrap_1 = require("@thi.ng/transducers/iter/wrap");
var partition_1 = require("@thi.ng/transducers/xform/partition");
function polygonToSegments(array) {
    return partition_1.partition(2, 1, wrap_1.wrap(array, 1, false, true));
}
exports.polygonToSegments = polygonToSegments;

},{"@thi.ng/transducers/iter/wrap":"../../../node_modules/@thi.ng/transducers/iter/wrap.js","@thi.ng/transducers/xform/partition":"../../../node_modules/@thi.ng/transducers/xform/partition.js"}],"../../../node_modules/gl-vec2/epsilon.js":[function(require,module,exports) {
module.exports = 0.000001

},{}],"../../../node_modules/gl-vec2/create.js":[function(require,module,exports) {
module.exports = create

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
function create() {
    var out = new Float32Array(2)
    out[0] = 0
    out[1] = 0
    return out
}
},{}],"../../../node_modules/gl-vec2/clone.js":[function(require,module,exports) {
module.exports = clone

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
function clone(a) {
    var out = new Float32Array(2)
    out[0] = a[0]
    out[1] = a[1]
    return out
}
},{}],"../../../node_modules/gl-vec2/fromValues.js":[function(require,module,exports) {
module.exports = fromValues

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
function fromValues(x, y) {
    var out = new Float32Array(2)
    out[0] = x
    out[1] = y
    return out
}
},{}],"../../../node_modules/gl-vec2/copy.js":[function(require,module,exports) {
module.exports = copy

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
function copy(out, a) {
    out[0] = a[0]
    out[1] = a[1]
    return out
}
},{}],"../../../node_modules/gl-vec2/set.js":[function(require,module,exports) {
module.exports = set

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
function set(out, x, y) {
    out[0] = x
    out[1] = y
    return out
}
},{}],"../../../node_modules/gl-vec2/equals.js":[function(require,module,exports) {
module.exports = equals

var EPSILON = require('./epsilon')

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0]
  var a1 = a[1]
  var b0 = b[0]
  var b1 = b[1]
  return (Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
          Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)))
}

},{"./epsilon":"../../../node_modules/gl-vec2/epsilon.js"}],"../../../node_modules/gl-vec2/exactEquals.js":[function(require,module,exports) {
module.exports = exactEquals

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {vec2} a The first vector.
 * @param {vec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

},{}],"../../../node_modules/gl-vec2/add.js":[function(require,module,exports) {
module.exports = add

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function add(out, a, b) {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    return out
}
},{}],"../../../node_modules/gl-vec2/sub.js":[function(require,module,exports) {
module.exports = require('./subtract')

},{"./subtract":"../../../node_modules/gl-vec2/subtract.js"}],"../../../node_modules/gl-vec2/multiply.js":[function(require,module,exports) {
module.exports = multiply

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function multiply(out, a, b) {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    return out
}
},{}],"../../../node_modules/gl-vec2/mul.js":[function(require,module,exports) {
module.exports = require('./multiply')

},{"./multiply":"../../../node_modules/gl-vec2/multiply.js"}],"../../../node_modules/gl-vec2/divide.js":[function(require,module,exports) {
module.exports = divide

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function divide(out, a, b) {
    out[0] = a[0] / b[0]
    out[1] = a[1] / b[1]
    return out
}
},{}],"../../../node_modules/gl-vec2/div.js":[function(require,module,exports) {
module.exports = require('./divide')

},{"./divide":"../../../node_modules/gl-vec2/divide.js"}],"../../../node_modules/gl-vec2/inverse.js":[function(require,module,exports) {
module.exports = inverse

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to invert
 * @returns {vec2} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0]
  out[1] = 1.0 / a[1]
  return out
}

},{}],"../../../node_modules/gl-vec2/min.js":[function(require,module,exports) {
module.exports = min

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function min(out, a, b) {
    out[0] = Math.min(a[0], b[0])
    out[1] = Math.min(a[1], b[1])
    return out
}
},{}],"../../../node_modules/gl-vec2/max.js":[function(require,module,exports) {
module.exports = max

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function max(out, a, b) {
    out[0] = Math.max(a[0], b[0])
    out[1] = Math.max(a[1], b[1])
    return out
}
},{}],"../../../node_modules/gl-vec2/rotate.js":[function(require,module,exports) {
module.exports = rotate

/**
 * Rotates a vec2 by an angle
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to rotate
 * @param {Number} angle the angle of rotation (in radians)
 * @returns {vec2} out
 */
function rotate(out, a, angle) {
  var c = Math.cos(angle),
      s = Math.sin(angle)
  var x = a[0],
      y = a[1]

  out[0] = x * c - y * s
  out[1] = x * s + y * c

  return out
}


},{}],"../../../node_modules/gl-vec2/floor.js":[function(require,module,exports) {
module.exports = floor

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to floor
 * @returns {vec2} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0])
  out[1] = Math.floor(a[1])
  return out
}

},{}],"../../../node_modules/gl-vec2/ceil.js":[function(require,module,exports) {
module.exports = ceil

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to ceil
 * @returns {vec2} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0])
  out[1] = Math.ceil(a[1])
  return out
}

},{}],"../../../node_modules/gl-vec2/round.js":[function(require,module,exports) {
module.exports = round

/**
 * Math.round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to round
 * @returns {vec2} out
 */
function round(out, a) {
  out[0] = Math.round(a[0])
  out[1] = Math.round(a[1])
  return out
}

},{}],"../../../node_modules/gl-vec2/scale.js":[function(require,module,exports) {
module.exports = scale

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
function scale(out, a, b) {
    out[0] = a[0] * b
    out[1] = a[1] * b
    return out
}
},{}],"../../../node_modules/gl-vec2/scaleAndAdd.js":[function(require,module,exports) {
module.exports = scaleAndAdd

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
function scaleAndAdd(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale)
    out[1] = a[1] + (b[1] * scale)
    return out
}
},{}],"../../../node_modules/gl-vec2/distance.js":[function(require,module,exports) {
module.exports = distance

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1]
    return Math.sqrt(x*x + y*y)
}
},{}],"../../../node_modules/gl-vec2/dist.js":[function(require,module,exports) {
module.exports = require('./distance')

},{"./distance":"../../../node_modules/gl-vec2/distance.js"}],"../../../node_modules/gl-vec2/squaredDistance.js":[function(require,module,exports) {
module.exports = squaredDistance

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1]
    return x*x + y*y
}
},{}],"../../../node_modules/gl-vec2/sqrDist.js":[function(require,module,exports) {
module.exports = require('./squaredDistance')

},{"./squaredDistance":"../../../node_modules/gl-vec2/squaredDistance.js"}],"../../../node_modules/gl-vec2/length.js":[function(require,module,exports) {
module.exports = length

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
    var x = a[0],
        y = a[1]
    return Math.sqrt(x*x + y*y)
}
},{}],"../../../node_modules/gl-vec2/len.js":[function(require,module,exports) {
module.exports = require('./length')

},{"./length":"../../../node_modules/gl-vec2/length.js"}],"../../../node_modules/gl-vec2/squaredLength.js":[function(require,module,exports) {
module.exports = squaredLength

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
    var x = a[0],
        y = a[1]
    return x*x + y*y
}
},{}],"../../../node_modules/gl-vec2/sqrLen.js":[function(require,module,exports) {
module.exports = require('./squaredLength')

},{"./squaredLength":"../../../node_modules/gl-vec2/squaredLength.js"}],"../../../node_modules/gl-vec2/negate.js":[function(require,module,exports) {
module.exports = negate

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
function negate(out, a) {
    out[0] = -a[0]
    out[1] = -a[1]
    return out
}
},{}],"../../../node_modules/gl-vec2/normalize.js":[function(require,module,exports) {
module.exports = normalize

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
function normalize(out, a) {
    var x = a[0],
        y = a[1]
    var len = x*x + y*y
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len)
        out[0] = a[0] * len
        out[1] = a[1] * len
    }
    return out
}
},{}],"../../../node_modules/gl-vec2/dot.js":[function(require,module,exports) {
module.exports = dot

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1]
}
},{}],"../../../node_modules/gl-vec2/lerp.js":[function(require,module,exports) {
module.exports = lerp

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
function lerp(out, a, b, t) {
    var ax = a[0],
        ay = a[1]
    out[0] = ax + t * (b[0] - ax)
    out[1] = ay + t * (b[1] - ay)
    return out
}
},{}],"../../../node_modules/gl-vec2/random.js":[function(require,module,exports) {
module.exports = random

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
function random(out, scale) {
    scale = scale || 1.0
    var r = Math.random() * 2.0 * Math.PI
    out[0] = Math.cos(r) * scale
    out[1] = Math.sin(r) * scale
    return out
}
},{}],"../../../node_modules/gl-vec2/transformMat2.js":[function(require,module,exports) {
module.exports = transformMat2

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2(out, a, m) {
    var x = a[0],
        y = a[1]
    out[0] = m[0] * x + m[2] * y
    out[1] = m[1] * x + m[3] * y
    return out
}
},{}],"../../../node_modules/gl-vec2/transformMat2d.js":[function(require,module,exports) {
module.exports = transformMat2d

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2d(out, a, m) {
    var x = a[0],
        y = a[1]
    out[0] = m[0] * x + m[2] * y + m[4]
    out[1] = m[1] * x + m[3] * y + m[5]
    return out
}
},{}],"../../../node_modules/gl-vec2/transformMat3.js":[function(require,module,exports) {
module.exports = transformMat3

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat3(out, a, m) {
    var x = a[0],
        y = a[1]
    out[0] = m[0] * x + m[3] * y + m[6]
    out[1] = m[1] * x + m[4] * y + m[7]
    return out
}
},{}],"../../../node_modules/gl-vec2/transformMat4.js":[function(require,module,exports) {
module.exports = transformMat4

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat4(out, a, m) {
    var x = a[0], 
        y = a[1]
    out[0] = m[0] * x + m[4] * y + m[12]
    out[1] = m[1] * x + m[5] * y + m[13]
    return out
}
},{}],"../../../node_modules/gl-vec2/forEach.js":[function(require,module,exports) {
module.exports = forEach

var vec = require('./create')()

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
function forEach(a, stride, offset, count, fn, arg) {
    var i, l
    if(!stride) {
        stride = 2
    }

    if(!offset) {
        offset = 0
    }
    
    if(count) {
        l = Math.min((count * stride) + offset, a.length)
    } else {
        l = a.length
    }

    for(i = offset; i < l; i += stride) {
        vec[0] = a[i]
        vec[1] = a[i+1]
        fn(vec, vec, arg)
        a[i] = vec[0]
        a[i+1] = vec[1]
    }
    
    return a
}
},{"./create":"../../../node_modules/gl-vec2/create.js"}],"../../../node_modules/gl-vec2/limit.js":[function(require,module,exports) {
module.exports = limit;

/**
 * Limit the magnitude of this vector to the value used for the `max`
 * parameter.
 *
 * @param  {vec2} the vector to limit
 * @param  {Number} max the maximum magnitude for the vector
 * @returns {vec2} out
 */
function limit(out, a, max) {
  var mSq = a[0] * a[0] + a[1] * a[1];

  if (mSq > max * max) {
    var n = Math.sqrt(mSq);
    out[0] = a[0] / n * max;
    out[1] = a[1] / n * max;
  } else {
    out[0] = a[0];
    out[1] = a[1];
  }

  return out;
}

},{}],"../../../node_modules/gl-vec2/index.js":[function(require,module,exports) {
module.exports = {
  EPSILON: require('./epsilon')
  , create: require('./create')
  , clone: require('./clone')
  , fromValues: require('./fromValues')
  , copy: require('./copy')
  , set: require('./set')
  , equals: require('./equals')
  , exactEquals: require('./exactEquals')
  , add: require('./add')
  , subtract: require('./subtract')
  , sub: require('./sub')
  , multiply: require('./multiply')
  , mul: require('./mul')
  , divide: require('./divide')
  , div: require('./div')
  , inverse: require('./inverse')
  , min: require('./min')
  , max: require('./max')
  , rotate: require('./rotate')
  , floor: require('./floor')
  , ceil: require('./ceil')
  , round: require('./round')
  , scale: require('./scale')
  , scaleAndAdd: require('./scaleAndAdd')
  , distance: require('./distance')
  , dist: require('./dist')
  , squaredDistance: require('./squaredDistance')
  , sqrDist: require('./sqrDist')
  , length: require('./length')
  , len: require('./len')
  , squaredLength: require('./squaredLength')
  , sqrLen: require('./sqrLen')
  , negate: require('./negate')
  , normalize: require('./normalize')
  , dot: require('./dot')
  , cross: require('./cross')
  , lerp: require('./lerp')
  , random: require('./random')
  , transformMat2: require('./transformMat2')
  , transformMat2d: require('./transformMat2d')
  , transformMat3: require('./transformMat3')
  , transformMat4: require('./transformMat4')
  , forEach: require('./forEach')
  , limit: require('./limit')
}

},{"./epsilon":"../../../node_modules/gl-vec2/epsilon.js","./create":"../../../node_modules/gl-vec2/create.js","./clone":"../../../node_modules/gl-vec2/clone.js","./fromValues":"../../../node_modules/gl-vec2/fromValues.js","./copy":"../../../node_modules/gl-vec2/copy.js","./set":"../../../node_modules/gl-vec2/set.js","./equals":"../../../node_modules/gl-vec2/equals.js","./exactEquals":"../../../node_modules/gl-vec2/exactEquals.js","./add":"../../../node_modules/gl-vec2/add.js","./subtract":"../../../node_modules/gl-vec2/subtract.js","./sub":"../../../node_modules/gl-vec2/sub.js","./multiply":"../../../node_modules/gl-vec2/multiply.js","./mul":"../../../node_modules/gl-vec2/mul.js","./divide":"../../../node_modules/gl-vec2/divide.js","./div":"../../../node_modules/gl-vec2/div.js","./inverse":"../../../node_modules/gl-vec2/inverse.js","./min":"../../../node_modules/gl-vec2/min.js","./max":"../../../node_modules/gl-vec2/max.js","./rotate":"../../../node_modules/gl-vec2/rotate.js","./floor":"../../../node_modules/gl-vec2/floor.js","./ceil":"../../../node_modules/gl-vec2/ceil.js","./round":"../../../node_modules/gl-vec2/round.js","./scale":"../../../node_modules/gl-vec2/scale.js","./scaleAndAdd":"../../../node_modules/gl-vec2/scaleAndAdd.js","./distance":"../../../node_modules/gl-vec2/distance.js","./dist":"../../../node_modules/gl-vec2/dist.js","./squaredDistance":"../../../node_modules/gl-vec2/squaredDistance.js","./sqrDist":"../../../node_modules/gl-vec2/sqrDist.js","./length":"../../../node_modules/gl-vec2/length.js","./len":"../../../node_modules/gl-vec2/len.js","./squaredLength":"../../../node_modules/gl-vec2/squaredLength.js","./sqrLen":"../../../node_modules/gl-vec2/sqrLen.js","./negate":"../../../node_modules/gl-vec2/negate.js","./normalize":"../../../node_modules/gl-vec2/normalize.js","./dot":"../../../node_modules/gl-vec2/dot.js","./cross":"../../../node_modules/gl-vec2/cross.js","./lerp":"../../../node_modules/gl-vec2/lerp.js","./random":"../../../node_modules/gl-vec2/random.js","./transformMat2":"../../../node_modules/gl-vec2/transformMat2.js","./transformMat2d":"../../../node_modules/gl-vec2/transformMat2d.js","./transformMat3":"../../../node_modules/gl-vec2/transformMat3.js","./transformMat4":"../../../node_modules/gl-vec2/transformMat4.js","./forEach":"../../../node_modules/gl-vec2/forEach.js","./limit":"../../../node_modules/gl-vec2/limit.js"}],"../../../node_modules/@tstackgl/geometry/dist/calc/pivot.js":[function(require,module,exports) {
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var gl_vec2_1 = __importDefault(require("gl-vec2"));
function scaleAroundCenter2(out, input, center, scale) {
    out[0] = (input[0] - center[0]) * scale + center[0];
    out[1] = (input[1] - center[1]) * scale + center[1];
    return out;
}
exports.scaleAroundCenter2 = scaleAroundCenter2;
function rotateAroundCenter2(out, input, center, angle) {
    gl_vec2_1.default.sub(out, input, center);
    gl_vec2_1.default.rotate(out, out, angle);
    gl_vec2_1.default.add(out, out, center);
    return out;
}
exports.rotateAroundCenter2 = rotateAroundCenter2;
function scaleAroundCenter3(out, input, center, scale) {
    out[0] = (input[0] - center[0]) * scale + center[0];
    out[1] = (input[1] - center[1]) * scale + center[1];
    out[2] = (input[2] - center[2]) * scale + center[2];
    return out;
}
exports.scaleAroundCenter3 = scaleAroundCenter3;

},{"gl-vec2":"../../../node_modules/gl-vec2/index.js"}],"../../../node_modules/@thi.ng/transducers/func/compr.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Reducer composition helper. Takes existing reducer `rfn` (a 3-tuple)
 * and a reducing function `fn`. Returns a new reducer tuple of this
 * form:
 *
 * ```
 * [rfn[0], rfn[1], fn]
 * ```
 *
 * `rfn[2]` reduces values of type `B` into an accumulator of type `A`.
 * `fn` accepts values of type `C` and produces interim results of type
 * `B`, which are then (possibly) passed to the "inner" `rfn[2]`
 * function. Therefore the resulting reducer takes inputs of `C` and an
 * accumulator of type `A`.
 *
 * It is assumed that `fn` internally calls `rfn[2]` to pass its own
 * results for further processing by the nested reducer `rfn`.
 *
 * @param rfn
 * @param fn
 */
function compR(rfn, fn) {
    return [rfn[0], rfn[1], fn];
}
exports.compR = compR;

},{}],"../../../node_modules/@thi.ng/transducers/xform/map.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function map(fn, src) {
    return src ?
        iterator_1.iterator1(map(fn), src) :
        (rfn) => {
            const r = rfn[2];
            return compr_1.compR(rfn, (acc, x) => r(acc, fn(x)));
        };
}
exports.map = map;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/transduce.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arity_1 = require("@thi.ng/errors/illegal-arity");
const reduce_1 = require("./reduce");
const map_1 = require("./xform/map");
function transduce(...args) {
    let acc, xs;
    switch (args.length) {
        case 4:
            xs = args[3];
            acc = args[2];
            break;
        case 3:
            xs = args[2];
            break;
        case 2:
            return map_1.map((x) => transduce(args[0], args[1], x));
        default:
            illegal_arity_1.illegalArity(args.length);
    }
    return reduce_1.reduce(args[0](args[1]), acc, xs);
}
exports.transduce = transduce;

},{"@thi.ng/errors/illegal-arity":"../../../node_modules/@thi.ng/errors/illegal-arity.js","./reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","./xform/map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/run.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transduce_1 = require("./transduce");
const nop = () => { };
function run(tx, ...args) {
    if (args.length === 1) {
        transduce_1.transduce(tx, [nop, nop, nop], args[0]);
    }
    else {
        const fx = args[0];
        transduce_1.transduce(tx, [nop, nop, (_, x) => fx(x)], args[1]);
    }
}
exports.run = run;

},{"./transduce":"../../../node_modules/@thi.ng/transducers/transduce.js"}],"../../../node_modules/@thi.ng/transducers/step.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduced_1 = require("./reduced");
const push_1 = require("./rfn/push");
/**
 * Single-step transducer execution wrapper.
 * Returns array if transducer produces multiple results
 * and undefined if there was no output. Else returns single
 * result value.
 *
 * Likewise, once a transducer has produced a final / reduced
 * value, all further invocations of the stepper function will
 * return undefined.
 *
 * ```
 * // single result
 * step(map(x => x * 10))(1);
 * // 10
 *
 * // multiple results
 * step(mapcat(x => [x, x + 1, x + 2]))(1)
 * // [ 1, 2, 3 ]
 *
 * // no result
 * f = step(filter(even))
 * f(1); // undefined
 * f(2); // 2
 *
 * // reduced value termination
 * f = step(take(2));
 * f(1); // 1
 * f(1); // 1
 * f(1); // undefined
 * f(1); // undefined
 * ```
 *
 * @param tx
 */
function step(tx) {
    const [_, complete, reduce] = tx(push_1.push());
    _;
    let done = false;
    return (x) => {
        if (!done) {
            let acc = reduce([], x);
            done = reduced_1.isReduced(acc);
            if (done) {
                acc = complete(acc.deref());
            }
            return acc.length === 1 ?
                acc[0] :
                acc.length > 0 ?
                    acc :
                    undefined;
        }
    };
}
exports.step = step;

},{"./reduced":"../../../node_modules/@thi.ng/transducers/reduced.js","./rfn/push":"../../../node_modules/@thi.ng/transducers/rfn/push.js"}],"../../../node_modules/@thi.ng/transducers/rfn/add.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function add(...args) {
    const res = reduce_1.$$reduce(add, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0] || 0;
    return reduce_1.reducer(() => init, (acc, x) => acc + x);
}
exports.add = add;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/assoc-map.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function assocMap(xs) {
    return xs ?
        reduce_1.reduce(assocMap(), xs) :
        reduce_1.reducer(() => new Map(), (acc, [k, v]) => acc.set(k, v));
}
exports.assocMap = assocMap;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/assoc-obj.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function assocObj(xs) {
    return xs ?
        reduce_1.reduce(assocObj(), xs) :
        reduce_1.reducer(() => new Object(), (acc, [k, v]) => (acc[k] = v, acc));
}
exports.assocObj = assocObj;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/conj.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function conj(xs) {
    return xs ?
        reduce_1.reduce(conj(), xs) :
        reduce_1.reducer(() => new Set(), (acc, x) => acc.add(x));
}
exports.conj = conj;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/count.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function count(...args) {
    const res = reduce_1.$$reduce(count, args);
    if (res !== undefined) {
        return res;
    }
    let offset = args[0] || 0;
    let step = args[1] || 1;
    return reduce_1.reducer(() => offset, (acc, _) => acc + step);
}
exports.count = count;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/div.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function div(init, xs) {
    return xs ?
        reduce_1.reduce(div(init), xs) :
        reduce_1.reducer(() => init, (acc, x) => acc / x);
}
exports.div = div;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/every.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
const reduced_1 = require("../reduced");
function every(...args) {
    const res = reduce_1.$$reduce(every, args);
    if (res !== undefined) {
        return res;
    }
    const pred = args[0];
    return reduce_1.reducer(() => true, pred ?
        (acc, x) => (pred(x) ? acc : reduced_1.reduced(false)) :
        (acc, x) => (x ? acc : reduced_1.reduced(false)));
}
exports.every = every;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/rfn/fill.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function fill(...args) {
    const res = reduce_1.$$reduce(fill, args);
    if (res !== undefined) {
        return res;
    }
    let start = args[0] || 0;
    return reduce_1.reducer(() => [], (acc, x) => (acc[start++] = x, acc));
}
exports.fill = fill;
function fillN(...args) {
    return fill(...args);
}
exports.fillN = fillN;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/func/identity.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function identity(x) { return x; }
exports.identity = identity;

},{}],"../../../node_modules/@thi.ng/transducers/rfn/group-by-map.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("../func/identity");
const reduce_1 = require("../reduce");
const push_1 = require("./push");
function groupByMap(...args) {
    const res = reduce_1.$$reduce(groupByMap, args);
    if (res !== undefined) {
        return res;
    }
    const opts = Object.assign({ key: identity_1.identity, group: push_1.push() }, args[0]);
    const [init, _, reduce] = opts.group;
    _;
    return reduce_1.reducer(() => new Map(), (acc, x) => {
        const k = opts.key(x);
        return acc.set(k, acc.has(k) ?
            reduce(acc.get(k), x) :
            reduce(init(), x));
    });
}
exports.groupByMap = groupByMap;

},{"../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","./push":"../../../node_modules/@thi.ng/transducers/rfn/push.js"}],"../../../node_modules/@thi.ng/transducers/rfn/frequencies.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("../func/identity");
const reduce_1 = require("../reduce");
const count_1 = require("./count");
const group_by_map_1 = require("./group-by-map");
function frequencies(...args) {
    return reduce_1.$$reduce(frequencies, args) ||
        group_by_map_1.groupByMap({ key: args[0] || identity_1.identity, group: count_1.count() });
}
exports.frequencies = frequencies;

},{"../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","./count":"../../../node_modules/@thi.ng/transducers/rfn/count.js","./group-by-map":"../../../node_modules/@thi.ng/transducers/rfn/group-by-map.js"}],"../../../node_modules/@thi.ng/transducers/rfn/group-by-obj.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const identity_1 = require("../func/identity");
const reduce_1 = require("../reduce");
const push_1 = require("./push");
function groupByObj(...args) {
    const res = reduce_1.$$reduce(groupByObj, args);
    if (res) {
        return res;
    }
    const _opts = Object.assign({ key: identity_1.identity, group: push_1.push() }, args[0]);
    const [_init, _, _reduce] = _opts.group;
    _;
    return reduce_1.reducer(() => ({}), (acc, x) => {
        const k = _opts.key(x);
        acc[k] = acc[k] ?
            _reduce(acc[k], x) :
            _reduce(_init(), x);
        return acc;
    });
}
exports.groupByObj = groupByObj;

},{"../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","./push":"../../../node_modules/@thi.ng/transducers/rfn/push.js"}],"../../../node_modules/@thi.ng/transducers/rfn/group-binary.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const group_by_obj_1 = require("./group-by-obj");
const push_1 = require("./push");
function branchPred(key, b, l, r) {
    return (x) => key(x) & b ? r : l;
}
/**
 * Creates a bottom-up, unbalanced binary tree of desired depth and
 * choice of data structures. Any value can be indexed, as long as a
 * numeric representation (key) can be obtained. This numeric key is
 * produced by the supplied `key` function. IMPORTANT: the returned
 * values MUST be unsigned and less than the provided bit length (i.e.
 * `0 .. (2^bits) - 1` range).
 *
 * By default the tree is constructed using plain objects for branches,
 * with left branches stored as "l" and right ones as "r". The original
 * values are stored at the lowest tree level using a customizable
 * nested reducer. By default leaves are collected in arrays (using the
 * `push()` reducer), but any suitable reducer can be used (e.g.
 * `conj()` to collect values into sets).
 *
 * Index by lowest 4-bits of ID value:
 *
 * ```
 * tree = reduce(
 *   groupBinary(4, x => x.id & 0xf),
 *   [{id: 3}, {id: 8}, {id: 15}, {id: 0}]
 * )
 *
 * tree.l.l.l.l
 * // [ { id: 0 } ]
 * tree.r.r.r.r
 * // [ { id: 15 } ]
 * tree.l.l.r.r
 * // [ { id: 3 } ]
 * ```
 *
 * Collecting as array:
 *
 * ```
 * tree = reduce(
 *   groupBinary(4, identity, ()=>[], push(), 0, 1),
 *   [1,2,3,4,5,6,7]
 * )
 *
 * tree[0][1][0][1] // 0101 == 5 in binary
 * // [ 5 ]
 *
 * tree[0][1][1]    // 011* == branch
 * // [ [ 6 ], [ 7 ] ]
 * ```
 *
 * Using `frequencies` as leaf reducer:
 *
 * ```
 * tree = reduce(
 *   groupBinary(3, (x: string) => x.length, null, frequencies()),
 *   "aa bbb dddd ccccc bbb eeee fff".split(" ")
 * )
 * // [ [ undefined,
 * //     [ Map { 'aa' => 1 },
 * //       Map { 'bbb' => 2, 'fff' => 1 } ] ],
 * //   [ [ Map { 'dddd' => 1, 'eeee' => 1 },
 * //       Map { 'ccccc' => 1 } ] ] ]
 *
 * tree[0][1][1]
 * // Map { 'bbb' => 2, 'fff' => 1 }
 * ```
 *
 * @param bits index range (always from 0)
 * @param key key function
 * @param branch function to create a new branch container (object or
 * array)
 * @param leaf reducer for leaf collection
 * @param left key for storing left branches (e.g. `0` for arrays)
 * @param right key for storing right branches (e.g. `1` for arrays)
 */
function groupBinary(bits, key, branch, leaf, left = "l", right = "r") {
    const init = branch || (() => ({}));
    let rfn = group_by_obj_1.groupByObj({
        key: branchPred(key, 1, left, right),
        group: leaf || push_1.push(),
    });
    for (let i = 2, maxIndex = 1 << bits; i < maxIndex; i <<= 1) {
        rfn = group_by_obj_1.groupByObj({ key: branchPred(key, i, left, right), group: [init, rfn[1], rfn[2]] });
    }
    return [init, rfn[1], rfn[2]];
}
exports.groupBinary = groupBinary;

},{"./group-by-obj":"../../../node_modules/@thi.ng/transducers/rfn/group-by-obj.js","./push":"../../../node_modules/@thi.ng/transducers/rfn/push.js"}],"../../../node_modules/@thi.ng/transducers/rfn/last.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function last(xs) {
    return xs ?
        reduce_1.reduce(last(), xs) :
        reduce_1.reducer(() => undefined, (_, x) => x);
}
exports.last = last;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/compare/index.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function compare(a, b) {
    if (a === b) {
        return 0;
    }
    if (a == null) {
        return b == null ? 0 : -1;
    }
    if (b == null) {
        return a == null ? 0 : 1;
    }
    if (typeof a.compare === "function") {
        return a.compare(b);
    }
    if (typeof b.compare === "function") {
        return -b.compare(a);
    }
    return a < b ? -1 : a > b ? 1 : 0;
}
exports.compare = compare;

},{}],"../../../node_modules/@thi.ng/transducers/rfn/max-compare.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compare_1 = require("@thi.ng/compare");
const reduce_1 = require("../reduce");
function maxCompare(...args) {
    const res = reduce_1.$$reduce(maxCompare, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0];
    const cmp = args[1] || compare_1.compare;
    return reduce_1.reducer(init, (acc, x) => cmp(acc, x) >= 0 ? acc : x);
}
exports.maxCompare = maxCompare;

},{"@thi.ng/compare":"../../../node_modules/@thi.ng/compare/index.js","../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/max.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function max(xs) {
    return xs ?
        reduce_1.reduce(max(), xs) :
        reduce_1.reducer(() => -Infinity, (acc, x) => Math.max(acc, x));
}
exports.max = max;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/mean.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function mean(xs) {
    let n = 0;
    return xs ?
        reduce_1.reduce(mean(), xs) :
        [
            () => 0,
            (acc) => acc / n,
            (acc, x) => (n++, acc + x),
        ];
}
exports.mean = mean;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/min-compare.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compare_1 = require("@thi.ng/compare");
const reduce_1 = require("../reduce");
function minCompare(...args) {
    const res = reduce_1.$$reduce(minCompare, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0];
    const cmp = args[1] || compare_1.compare;
    return reduce_1.reducer(init, (acc, x) => cmp(acc, x) <= 0 ? acc : x);
}
exports.minCompare = minCompare;

},{"@thi.ng/compare":"../../../node_modules/@thi.ng/compare/index.js","../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/min.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function min(xs) {
    return xs ?
        reduce_1.reduce(min(), xs) :
        reduce_1.reducer(() => Infinity, (acc, x) => Math.min(acc, x));
}
exports.min = min;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/mul.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function mul(...args) {
    const res = reduce_1.$$reduce(mul, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0] || 1;
    return reduce_1.reducer(() => init, (acc, x) => acc * x);
}
exports.mul = mul;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/push-copy.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function pushCopy() {
    return reduce_1.reducer(() => [], (acc, x) => ((acc = acc.slice()).push(x), acc));
}
exports.pushCopy = pushCopy;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/reductions.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
const reduced_1 = require("../reduced");
function reductions(rfn, xs) {
    const [init, complete, _reduce] = rfn;
    return xs ?
        reduce_1.reduce(reductions(rfn), xs) :
        [
            () => [init()],
            (acc) => (acc[acc.length - 1] = complete(acc[acc.length - 1]), acc),
            (acc, x) => {
                const res = _reduce(acc[acc.length - 1], x);
                if (reduced_1.isReduced(res)) {
                    acc.push(res.deref());
                    return reduced_1.reduced(acc);
                }
                acc.push(res);
                return acc;
            }
        ];
}
exports.reductions = reductions;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/rfn/some.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
const reduced_1 = require("../reduced");
function some(...args) {
    const res = reduce_1.$$reduce(some, args);
    if (res !== undefined) {
        return res;
    }
    const pred = args[0];
    return reduce_1.reducer(() => false, pred ?
        (acc, x) => (pred(x) ? reduced_1.reduced(true) : acc) :
        (acc, x) => (x ? reduced_1.reduced(true) : acc));
}
exports.some = some;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/rfn/str.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function str(sep, xs) {
    sep = sep || "";
    let first = true;
    return xs ?
        [...xs].join(sep) :
        reduce_1.reducer(() => "", (acc, x) => (acc = first ? acc + x : acc + sep + x, first = false, acc));
}
exports.str = str;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/rfn/sub.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduce_1 = require("../reduce");
function sub(...args) {
    const res = reduce_1.$$reduce(sub, args);
    if (res !== undefined) {
        return res;
    }
    const init = args[0] || 0;
    return reduce_1.reducer(() => init, (acc, x) => acc - x);
}
exports.sub = sub;

},{"../reduce":"../../../node_modules/@thi.ng/transducers/reduce.js"}],"../../../node_modules/@thi.ng/transducers/xform/base64.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_SAFE = B64_CHARS.substr(0, 62) + "-_";
function base64Decode(src) {
    return src ?
        iterator_1.iterator1(base64Decode(), src) :
        (rfn) => {
            const r = rfn[2];
            let bc = 0, bs = 0;
            return compr_1.compR(rfn, (acc, x) => {
                switch (x) {
                    case "-":
                        x = "+";
                        break;
                    case "_":
                        x = "/";
                        break;
                    case "=":
                        return reduced_1.reduced(acc);
                    default:
                }
                let y = B64_CHARS.indexOf(x);
                bs = bc & 3 ? (bs << 6) + y : y;
                if (bc++ & 3) {
                    acc = r(acc, 255 & bs >> (-2 * bc & 6));
                }
                return acc;
            });
        };
}
exports.base64Decode = base64Decode;
function base64Encode(...args) {
    const iter = iterator_1.$iter(base64Encode, args, iterator_1.iterator);
    if (iter) {
        return [...iter].join("");
    }
    return (([init, complete, reduce]) => {
        let state = 0;
        let b;
        const opts = Object.assign({ safe: false, buffer: 1024 }, args[0]);
        const chars = opts.safe ? B64_SAFE : B64_CHARS;
        const buf = [];
        return [
            init,
            (acc) => {
                switch (state) {
                    case 1:
                        buf.push(chars[b >> 18 & 0x3f], chars[b >> 12 & 0x3f], "=", "=");
                        break;
                    case 2:
                        buf.push(chars[b >> 18 & 0x3f], chars[b >> 12 & 0x3f], chars[b >> 6 & 0x3f], "=");
                        break;
                    default:
                }
                while (buf.length && !reduced_1.isReduced(acc)) {
                    acc = reduce(acc, buf.shift());
                }
                return complete(acc);
            },
            (acc, x) => {
                switch (state) {
                    case 0:
                        state = 1;
                        b = x << 16;
                        break;
                    case 1:
                        state = 2;
                        b += x << 8;
                        break;
                    default:
                        state = 0;
                        b += x;
                        buf.push(chars[b >> 18 & 0x3f], chars[b >> 12 & 0x3f], chars[b >> 6 & 0x3f], chars[b & 0x3f]);
                        if (buf.length >= opts.buffer) {
                            for (let i = 0, n = buf.length; i < n && !reduced_1.isReduced(acc); i++) {
                                acc = reduce(acc, buf[i]);
                            }
                            buf.length = 0;
                        }
                }
                return acc;
            }
        ];
    });
}
exports.base64Encode = base64Encode;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/benchmark.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function benchmark(src) {
    return src ?
        iterator_1.iterator1(benchmark(), src) :
        (rfn) => {
            const r = rfn[2];
            let prev = Date.now();
            return compr_1.compR(rfn, (acc, _) => {
                const t = Date.now();
                const x = t - prev;
                prev = t;
                return r(acc, x);
            });
        };
}
exports.benchmark = benchmark;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/bits.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function bits(...args) {
    return iterator_1.$iter(bits, args, iterator_1.iterator) ||
        ((rfn) => {
            const reduce = rfn[2];
            const size = (args[0] || 8) - 1;
            const msb = args[1] !== false;
            return compr_1.compR(rfn, msb ?
                (acc, x) => {
                    for (let i = size; i >= 0 && !reduced_1.isReduced(acc); i--) {
                        acc = reduce(acc, (x >>> i) & 1);
                    }
                    return acc;
                } :
                (acc, x) => {
                    for (let i = 0; i <= size && !reduced_1.isReduced(acc); i++) {
                        acc = reduce(acc, (x >>> i) & 1);
                    }
                    return acc;
                });
        });
}
exports.bits = bits;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/cat.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const reduced_1 = require("../reduced");
/**
 * Transducer to concatenate iterable values.
 */
function cat() {
    return (rfn) => {
        const r = rfn[2];
        return compr_1.compR(rfn, (acc, x) => {
            if (x) {
                for (let y of x) {
                    acc = r(acc, y);
                    if (reduced_1.isReduced(acc)) {
                        break;
                    }
                }
            }
            return acc;
        });
    };
}
exports.cat = cat;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/iter/range.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduced_1 = require("../reduced");
function range(from, to, step) {
    return new Range(from, to, step);
}
exports.range = range;
;
/**
 * Simple class wrapper around given range interval and implementing
 * `Iterable` and `IReducible` interfaces, the latter is used to
 * accelerate use with `reduce`.
 */
class Range {
    constructor(from, to, step) {
        if (from === undefined) {
            from = 0;
            to = Infinity;
        }
        else if (to === undefined) {
            to = from;
            from = 0;
        }
        step = step === undefined ? (from < to ? 1 : -1) : step;
        this.from = from;
        this.to = to;
        this.step = step;
    }
    *[Symbol.iterator]() {
        const step = this.step;
        const to = this.to;
        let from = this.from;
        if (step > 0) {
            while (from < to) {
                yield from;
                from += step;
            }
        }
        else if (step < 0) {
            while (from > to) {
                yield from;
                from += step;
            }
        }
    }
    $reduce(rfn, acc) {
        const step = this.step;
        if (step > 0) {
            for (let i = this.from, n = this.to; i < n && !reduced_1.isReduced(acc); i += step) {
                acc = rfn(acc, i);
            }
        }
        else {
            for (let i = this.from, n = this.to; i > n && !reduced_1.isReduced(acc); i += step) {
                acc = rfn(acc, i);
            }
        }
        return acc;
    }
}
exports.Range = Range;

},{"../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/iter/range2d.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arity_1 = require("@thi.ng/errors/illegal-arity");
const range_1 = require("./range");
function* range2d(...args) {
    let fromX, toX, fromY, toY, stepX, stepY;
    switch (args.length) {
        case 6:
            stepX = args[4];
            stepY = args[5];
        case 4:
            [fromX, toX, fromY, toY] = args;
            break;
        case 2:
            [toX, toY] = args;
            fromX = fromY = 0;
            break;
        default:
            illegal_arity_1.illegalArity(args.length);
    }
    const rx = range_1.range(fromX, toX, stepX);
    for (let y of range_1.range(fromY, toY, stepY)) {
        for (let x of rx) {
            yield [x, y];
        }
    }
}
exports.range2d = range2d;

},{"@thi.ng/errors/illegal-arity":"../../../node_modules/@thi.ng/errors/illegal-arity.js","./range":"../../../node_modules/@thi.ng/transducers/iter/range.js"}],"../../../node_modules/@thi.ng/transducers/iter/tuples.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* tuples(...src) {
    const iters = src.map((s) => s[Symbol.iterator]());
    while (true) {
        const tuple = [];
        for (let i of iters) {
            let v = i.next();
            if (v.done) {
                return;
            }
            tuple.push(v.value);
        }
        yield tuple;
    }
}
exports.tuples = tuples;

},{}],"../../../node_modules/@thi.ng/transducers/xform/convolve.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arguments_1 = require("@thi.ng/errors/illegal-arguments");
const range2d_1 = require("../iter/range2d");
const tuples_1 = require("../iter/tuples");
const iterator_1 = require("../iterator");
const add_1 = require("../rfn/add");
const transduce_1 = require("../transduce");
const map_1 = require("./map");
exports.buildKernel2d = (weights, w, h) => {
    const w2 = w >> 1;
    const h2 = h >> 1;
    return [...tuples_1.tuples(weights, range2d_1.range2d(-w2, w2 + 1, -h2, h2 + 1))];
};
const kernelLookup2d = (src, x, y, width, height, wrap, border) => wrap ?
    ([w, [ox, oy]]) => {
        const xx = x < -ox ? width + ox : x >= width - ox ? ox - 1 : x + ox;
        const yy = y < -oy ? height + oy : y >= height - oy ? oy - 1 : y + oy;
        return w * src[yy * width + xx];
    } :
    ([w, [ox, oy]]) => {
        return (x < -ox || y < -oy || x >= width - ox || y >= height - oy) ?
            border :
            w * src[(y + oy) * width + x + ox];
    };
function convolve2d(opts, _src) {
    if (_src) {
        return iterator_1.iterator1(convolve2d(opts), _src);
    }
    const { src, width, height } = opts;
    const wrap = opts.wrap !== false;
    const border = opts.border || 0;
    let kernel = opts.kernel;
    if (!kernel) {
        if (!(opts.weights && opts.kwidth && opts.kheight)) {
            illegal_arguments_1.illegalArgs(`no kernel or kernel config`);
        }
        kernel = exports.buildKernel2d(opts.weights, opts.kwidth, opts.kheight);
    }
    return map_1.map((p) => transduce_1.transduce(map_1.map(kernelLookup2d(src, p[0], p[1], width, height, wrap, border)), add_1.add(), kernel));
}
exports.convolve2d = convolve2d;

},{"@thi.ng/errors/illegal-arguments":"../../../node_modules/@thi.ng/errors/illegal-arguments.js","../iter/range2d":"../../../node_modules/@thi.ng/transducers/iter/range2d.js","../iter/tuples":"../../../node_modules/@thi.ng/transducers/iter/tuples.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../rfn/add":"../../../node_modules/@thi.ng/transducers/rfn/add.js","../transduce":"../../../node_modules/@thi.ng/transducers/transduce.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/dedupe.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@thi.ng/api/api");
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function dedupe(...args) {
    return iterator_1.$iter(dedupe, args) ||
        ((rfn) => {
            const r = rfn[2];
            const equiv = args[0];
            let prev = api_1.SEMAPHORE;
            return compr_1.compR(rfn, equiv ?
                (acc, x) => {
                    acc = equiv(prev, x) ? acc : r(acc, x);
                    prev = x;
                    return acc;
                } :
                (acc, x) => {
                    acc = prev === x ? acc : r(acc, x);
                    prev = x;
                    return acc;
                });
        });
}
exports.dedupe = dedupe;

},{"@thi.ng/api/api":"../../../node_modules/@thi.ng/api/api.js","../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/func/delay.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function delay(x, t) {
    return new Promise((resolve) => setTimeout(() => resolve(x), t));
}
exports.delay = delay;

},{}],"../../../node_modules/@thi.ng/transducers/xform/delayed.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const delay_1 = require("../func/delay");
const map_1 = require("./map");
/**
 * Yields transducer which wraps incoming values in promises, which
 * resolve after specified delay time (in ms).
 *
 * **Only to be used in async contexts and NOT with `transduce`
 * directly.**
 *
 * @param t
 */
function delayed(t) {
    return map_1.map((x) => delay_1.delay(x, t));
}
exports.delayed = delayed;

},{"../func/delay":"../../../node_modules/@thi.ng/transducers/func/delay.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/distinct.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function distinct(...args) {
    return iterator_1.$iter(distinct, args) ||
        ((rfn) => {
            const r = rfn[2];
            const opts = (args[0] || {});
            const key = opts.key;
            const seen = (opts.cache || (() => new Set()))();
            return compr_1.compR(rfn, key ?
                (acc, x) => {
                    const k = key(x);
                    return !seen.has(k) ? (seen.add(k), r(acc, x)) : acc;
                } :
                (acc, x) => !seen.has(x) ? (seen.add(x), r(acc, x)) : acc);
        });
}
exports.distinct = distinct;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/throttle.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function throttle(pred, src) {
    return src ?
        iterator_1.iterator1(throttle(pred), src) :
        (rfn) => {
            const r = rfn[2];
            const _pred = pred();
            return compr_1.compR(rfn, (acc, x) => _pred(x) ? r(acc, x) : acc);
        };
}
exports.throttle = throttle;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/drop-nth.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const throttle_1 = require("./throttle");
const iterator_1 = require("../iterator");
function dropNth(n, src) {
    if (src) {
        return iterator_1.iterator1(dropNth(n), src);
    }
    n = Math.max(0, n - 1);
    return throttle_1.throttle(() => {
        let skip = n;
        return () => skip-- > 0 ? true : (skip = n, false);
    });
}
exports.dropNth = dropNth;

},{"./throttle":"../../../node_modules/@thi.ng/transducers/xform/throttle.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/drop-while.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function dropWhile(...args) {
    return iterator_1.$iter(dropWhile, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0];
            let ok = true;
            return compr_1.compR(rfn, (acc, x) => (ok = ok && pred(x)) ? acc : r(acc, x));
        });
}
exports.dropWhile = dropWhile;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/drop.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function drop(n, src) {
    return src ?
        iterator_1.iterator1(drop(n), src) :
        (rfn) => {
            const r = rfn[2];
            let m = n;
            return compr_1.compR(rfn, (acc, x) => m > 0 ? (m--, acc) : r(acc, x));
        };
}
exports.drop = drop;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/duplicate.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function duplicate(n = 1, src) {
    return src ?
        iterator_1.iterator(duplicate(n), src) :
        (rfn) => {
            const r = rfn[2];
            return compr_1.compR(rfn, (acc, x) => {
                for (let i = n; i >= 0 && !reduced_1.isReduced(acc); i--) {
                    acc = r(acc, x);
                }
                return acc;
            });
        };
}
exports.duplicate = duplicate;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/filter.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const compr_1 = require("../func/compr");
function filter(pred, src) {
    return src ?
        iterator_1.iterator1(filter(pred), src) :
        (rfn) => {
            const r = rfn[2];
            return compr_1.compR(rfn, (acc, x) => pred(x) ? r(acc, x) : acc);
        };
}
exports.filter = filter;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js"}],"../../../node_modules/@thi.ng/transducers/func/fuzzy-match.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const equiv_1 = require("@thi.ng/equiv");
/**
 * Performs a fuzzy search of `query` in `domain` and returns `true` if
 * successful. The optional `eq` predicate can be used to customize item
 * equality checking. Uses @thi.ng/equiv by default.
 *
 * Related transducer: `filterFuzzy()` (/xform/filter-fuzzy.ts)
 *
 * Adapted and generalized from:
 * https://github.com/bevacqua/fufuzzyzzysearch (MIT)
 *
 * @param domain
 * @param query
 * @param eq
 */
function fuzzyMatch(domain, query, eq = equiv_1.equiv) {
    const nd = domain.length;
    const nq = query.length;
    if (nq > nd) {
        return false;
    }
    if (nq === nd) {
        return eq(query, domain);
    }
    next: for (let i = 0, j = 0; i < nq; i++) {
        const q = query[i];
        while (j < nd) {
            if (eq(domain[j++], q)) {
                continue next;
            }
        }
        return false;
    }
    return true;
}
exports.fuzzyMatch = fuzzyMatch;

},{"@thi.ng/equiv":"../../../node_modules/@thi.ng/equiv/index.js"}],"../../../node_modules/@thi.ng/transducers/xform/filter-fuzzy.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fuzzy_match_1 = require("../func/fuzzy-match");
const iterator_1 = require("../iterator");
const filter_1 = require("./filter");
function filterFuzzy(...args) {
    const iter = args.length > 1 && iterator_1.$iter(filterFuzzy, args);
    if (iter) {
        return iter;
    }
    const query = args[0];
    const { key, equiv } = (args[1] || {});
    return filter_1.filter((x) => fuzzy_match_1.fuzzyMatch(key != null ? key(x) : x, query, equiv));
}
exports.filterFuzzy = filterFuzzy;

},{"../func/fuzzy-match":"../../../node_modules/@thi.ng/transducers/func/fuzzy-match.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./filter":"../../../node_modules/@thi.ng/transducers/xform/filter.js"}],"../../../node_modules/@thi.ng/transducers/xform/flatten-with.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function flattenWith(fn, src) {
    return src ?
        iterator_1.iterator(flattenWith(fn), src) :
        (rfn) => {
            const reduce = rfn[2];
            const flatten = (acc, x) => {
                const xx = fn(x);
                if (xx) {
                    for (let y of xx) {
                        acc = flatten(acc, y);
                        if (reduced_1.isReduced(acc)) {
                            break;
                        }
                    }
                    return acc;
                }
                return reduce(acc, x);
            };
            return compr_1.compR(rfn, flatten);
        };
}
exports.flattenWith = flattenWith;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/flatten.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flatten_with_1 = require("./flatten-with");
function flatten(src) {
    return flatten_with_1.flattenWith((x) => x != null && x[Symbol.iterator] && typeof x !== "string" ? x : undefined, src);
}
exports.flatten = flatten;

},{"./flatten-with":"../../../node_modules/@thi.ng/transducers/xform/flatten-with.js"}],"../../../node_modules/@thi.ng/memoize/memoizej.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function memoizeJ(fn, cache) {
    !cache && (cache = {});
    return (...args) => {
        const key = JSON.stringify(args);
        if (key !== undefined) {
            return key in cache ?
                cache[key] :
                (cache[key] = fn.apply(null, args));
        }
        return fn.apply(null, args);
    };
}
exports.memoizeJ = memoizeJ;

},{}],"../../../node_modules/@thi.ng/strings/repeat.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memoizej_1 = require("@thi.ng/memoize/memoizej");
/**
 * @param ch character
 * @param n repeat count
 */
exports.repeat = memoizej_1.memoizeJ((ch, n) => ch.repeat(n));

},{"@thi.ng/memoize/memoizej":"../../../node_modules/@thi.ng/memoize/memoizej.js"}],"../../../node_modules/@thi.ng/strings/radix.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memoizej_1 = require("@thi.ng/memoize/memoizej");
const repeat_1 = require("./repeat");
/**
 * Returns a `Stringer` which formats given numbers to `radix`, `len`
 * and with optional prefix (not included in `len`).
 *
 * @param radix
 * @param len
 * @param prefix
 */
exports.radix = memoizej_1.memoizeJ((radix, n, prefix = "") => {
    const buf = repeat_1.repeat("0", n);
    return (x) => {
        x = (x >>> 0).toString(radix);
        return prefix + (x.length < n ? buf.substr(x.length) + x : x);
    };
});
/**
 * 8bit binary conversion preset.
 */
exports.B8 = exports.radix(2, 8);
/**
 * 8bit hex conversion preset.
 * Assumes unsigned inputs.
 */
exports.U8 = exports.radix(16, 2);
/**
 * 16bit hex conversion preset.
 * Assumes unsigned inputs.
 */
exports.U16 = exports.radix(16, 4);
/**
 * 24bit hex conversion preset.
 * Assumes unsigned inputs.
 */
exports.U24 = exports.radix(16, 6);
/**
 * 32bit hex conversion preset.
 * Assumes unsigned inputs.
 */
exports.U32 = exports.radix(16, 8);
/**
 * 64bit hex conversion preset (2x 32bit ints)
 * Assumes unsigned inputs.
 */
exports.U64 = (hi, lo) => exports.U32(hi) + exports.U32(lo);

},{"@thi.ng/memoize/memoizej":"../../../node_modules/@thi.ng/memoize/memoizej.js","./repeat":"../../../node_modules/@thi.ng/strings/repeat.js"}],"../../../node_modules/@thi.ng/compose/comp.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arity_1 = require("@thi.ng/errors/illegal-arity");
function comp(...fns) {
    let [a, b, c, d, e, f, g, h, i, j] = fns;
    switch (fns.length) {
        case 0:
            illegal_arity_1.illegalArity(0);
        case 1:
            return a;
        case 2:
            return (...xs) => a(b(...xs));
        case 3:
            return (...xs) => a(b(c(...xs)));
        case 4:
            return (...xs) => a(b(c(d(...xs))));
        case 5:
            return (...xs) => a(b(c(d(e(...xs)))));
        case 6:
            return (...xs) => a(b(c(d(e(f(...xs))))));
        case 7:
            return (...xs) => a(b(c(d(e(f(g(...xs)))))));
        case 8:
            return (...xs) => a(b(c(d(e(f(g(h(...xs))))))));
        case 9:
            return (...xs) => a(b(c(d(e(f(g(h(i(...xs)))))))));
        case 10:
        default:
            const fn = (...xs) => a(b(c(d(e(f(g(h(i(j(...xs))))))))));
            return fns.length === 10 ? fn : compI(fn, ...fns.slice(10));
    }
}
exports.comp = comp;
function compI(...fns) {
    return comp.apply(null, fns.reverse());
}
exports.compI = compI;

},{"@thi.ng/errors/illegal-arity":"../../../node_modules/@thi.ng/errors/illegal-arity.js"}],"../../../node_modules/@thi.ng/transducers/func/comp.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("@thi.ng/compose/comp");
function comp(...fns) {
    return comp_1.comp.apply(null, fns);
}
exports.comp = comp;

},{"@thi.ng/compose/comp":"../../../node_modules/@thi.ng/compose/comp.js"}],"../../../node_modules/@thi.ng/compose/juxt.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function juxt(...fns) {
    const [a, b, c, d, e, f, g, h] = fns;
    switch (fns.length) {
        case 1:
            return (x) => [a(x)];
        case 2:
            return (x) => [a(x), b(x)];
        case 3:
            return (x) => [a(x), b(x), c(x)];
        case 4:
            return (x) => [a(x), b(x), c(x), d(x)];
        case 5:
            return (x) => [a(x), b(x), c(x), d(x), e(x)];
        case 6:
            return (x) => [a(x), b(x), c(x), d(x), e(x), f(x)];
        case 7:
            return (x) => [a(x), b(x), c(x), d(x), e(x), f(x), g(x)];
        case 8:
            return (x) => [a(x), b(x), c(x), d(x), e(x), f(x), g(x), h(x)];
        default:
            return (x) => {
                let res = new Array(fns.length);
                for (let i = fns.length - 1; i >= 0; i--) {
                    res[i] = fns[i](x);
                }
                return res;
            };
    }
}
exports.juxt = juxt;

},{}],"../../../node_modules/@thi.ng/transducers/func/juxt.js":[function(require,module,exports) {
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("@thi.ng/compose/juxt"));

},{"@thi.ng/compose/juxt":"../../../node_modules/@thi.ng/compose/juxt.js"}],"../../../node_modules/@thi.ng/transducers/xform/map-indexed.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function mapIndexed(...args) {
    return iterator_1.$iter(mapIndexed, args) ||
        ((rfn) => {
            const r = rfn[2];
            const fn = args[0];
            let i = args[1] || 0;
            return compr_1.compR(rfn, (acc, x) => r(acc, fn(i++, x)));
        });
}
exports.mapIndexed = mapIndexed;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/pad-last.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function padLast(n, fill, src) {
    return src ?
        iterator_1.iterator(padLast(n, fill), src) :
        ([init, complete, reduce]) => {
            let m = 0;
            return [
                init,
                (acc) => {
                    let rem = m % n;
                    if (rem > 0) {
                        while (++rem <= n && !reduced_1.isReduced(acc)) {
                            acc = reduce(acc, fill);
                        }
                    }
                    return complete(acc);
                },
                (acc, x) => (m++, reduce(acc, x))
            ];
        };
}
exports.padLast = padLast;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/hex-dump.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const radix_1 = require("@thi.ng/strings/radix");
const comp_1 = require("../func/comp");
const juxt_1 = require("../func/juxt");
const iterator_1 = require("../iterator");
const map_1 = require("./map");
const map_indexed_1 = require("./map-indexed");
const pad_last_1 = require("./pad-last");
const partition_1 = require("./partition");
function hexDump(...args) {
    const iter = iterator_1.$iter(hexDump, args);
    if (iter) {
        return iter;
    }
    const { cols, address } = Object.assign({ cols: 16, address: 0 }, args[0]);
    return comp_1.comp(pad_last_1.padLast(cols, 0), map_1.map(juxt_1.juxt(radix_1.U8, (x) => x > 31 && x < 128 ? String.fromCharCode(x) : ".")), partition_1.partition(cols, true), map_1.map(juxt_1.juxt((x) => x.map((y) => y[0]).join(" "), (x) => x.map((y) => y[1]).join(""))), map_indexed_1.mapIndexed((i, [h, a]) => `${radix_1.U32(address + i * cols)} | ${h} | ${a}`));
}
exports.hexDump = hexDump;

},{"@thi.ng/strings/radix":"../../../node_modules/@thi.ng/strings/radix.js","../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../func/juxt":"../../../node_modules/@thi.ng/transducers/func/juxt.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js","./map-indexed":"../../../node_modules/@thi.ng/transducers/xform/map-indexed.js","./pad-last":"../../../node_modules/@thi.ng/transducers/xform/pad-last.js","./partition":"../../../node_modules/@thi.ng/transducers/xform/partition.js"}],"../../../node_modules/@thi.ng/transducers/xform/indexed.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const map_indexed_1 = require("./map-indexed");
function indexed(...args) {
    const iter = iterator_1.$iter(indexed, args);
    if (iter) {
        return iter;
    }
    const from = args[0] || 0;
    return map_indexed_1.mapIndexed((i, x) => [from + i, x]);
}
exports.indexed = indexed;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map-indexed":"../../../node_modules/@thi.ng/transducers/xform/map-indexed.js"}],"../../../node_modules/@thi.ng/transducers/xform/interleave.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function interleave(sep, src) {
    return src ?
        iterator_1.iterator(interleave(sep), src) :
        (rfn) => {
            const r = rfn[2];
            const _sep = typeof sep === "function" ? sep : () => sep;
            return compr_1.compR(rfn, (acc, x) => {
                acc = r(acc, _sep());
                return reduced_1.isReduced(acc) ? acc : r(acc, x);
            });
        };
}
exports.interleave = interleave;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/interpose.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function interpose(sep, src) {
    return src ?
        iterator_1.iterator(interpose(sep), src) :
        (rfn) => {
            const r = rfn[2];
            const _sep = typeof sep === "function" ? sep : () => sep;
            let first = true;
            return compr_1.compR(rfn, (acc, x) => {
                if (first) {
                    first = false;
                    return r(acc, x);
                }
                acc = r(acc, _sep());
                return reduced_1.isReduced(acc) ? acc : r(acc, x);
            });
        };
}
exports.interpose = interpose;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/keep.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const identity_1 = require("../func/identity");
const iterator_1 = require("../iterator");
function keep(...args) {
    return iterator_1.$iter(keep, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0] || identity_1.identity;
            return compr_1.compR(rfn, (acc, x) => pred(x) != null ? r(acc, x) : acc);
        });
}
exports.keep = keep;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/labeled.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_function_1 = require("@thi.ng/checks/is-function");
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function labeled(id, src) {
    return src ?
        iterator_1.iterator1(labeled(id), src) :
        map_1.map(is_function_1.isFunction(id) ?
            (x) => [id(x), x] :
            (x) => [id, x]);
}
exports.labeled = labeled;

},{"@thi.ng/checks/is-function":"../../../node_modules/@thi.ng/checks/is-function.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/func/deep-transform.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_function_1 = require("@thi.ng/checks/is-function");
/**
 * Higher-order deep object transformer. Accepts a nested `spec`
 * array reflecting same key structure as the object to be mapped,
 * but with functions or sub-specs as their values.
 * Returns a new function, which when called, recursively applies
 * nested transformers in post-order traversal (child transformers
 * are run first) and returns the result of the root transformer.
 *
 * The transform specs are given as arrays in this format:
 *
 * ```
 * [tx-function, {key1: [tx-function, {...}], key2: tx-fn}]
 * ```
 *
 * If a key in the spec has no further sub maps, its transform
 * function can be given directly without having to wrap it into
 * the usual array structure.
 *
 * ```
 * // source object to be transformed
 * src = {
 *    meta: {
 *      author: { name: "Alice", email: "a@b.com" },
 *      date: 1041510896000
 *    },
 *    type: "post",
 *    title: "Hello world",
 *    body: "Ratione necessitatibus doloremque itaque."
 * };
 *
 * // deep transformation spec
 * spec = [
 *    // root transform (called last)
 *    ({type, meta, title, body}) => ["div", {class: type}, title, meta, body],
 *    // object of transform sub-specs
 *    {
 *      meta: [
 *        ({author, date}) => ["div.meta", author, `(${date})`],
 *        {
 *          author: ({email, name}) => ["a", {href: `mailto:${email}`}, name],
 *          date: (d) => new Date(d).toLocaleString()
 *        }
 *      ],
 *      title: (title) => ["h1", title]
 *    }
 * ];
 *
 * // build transformer & apply to src
 * deepTransform(spec)(src);
 *
 * // [ "div",
 * //   { class: "article" },
 * //   [ "h1", "Hello world" ],
 * //   [ "div.meta",
 * //     [ "a", { href: "mailto:a@.b.com" }, "Alice" ],
 * //     "(1/2/2003, 12:34:56 PM)" ],
 * //   "Ratione necessitatibus doloremque itaque." ]
 * ```
 *
 * @param spec transformation spec
 */
function deepTransform(spec) {
    if (is_function_1.isFunction(spec)) {
        return spec;
    }
    const mapfns = Object.keys(spec[1] || {}).reduce((acc, k) => (acc[k] = deepTransform(spec[1][k]), acc), {});
    return (x) => {
        const res = Object.assign({}, x);
        for (let k in mapfns) {
            res[k] = mapfns[k](res[k]);
        }
        return spec[0](res);
    };
}
exports.deepTransform = deepTransform;

},{"@thi.ng/checks/is-function":"../../../node_modules/@thi.ng/checks/is-function.js"}],"../../../node_modules/@thi.ng/transducers/xform/map-deep.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deep_transform_1 = require("../func/deep-transform");
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function mapDeep(spec, src) {
    return src ?
        iterator_1.iterator1(mapDeep(spec), src) :
        map_1.map(deep_transform_1.deepTransform(spec));
}
exports.mapDeep = mapDeep;

},{"../func/deep-transform":"../../../node_modules/@thi.ng/transducers/func/deep-transform.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/map-keys.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function mapKeys(...args) {
    const iter = iterator_1.$iter(mapKeys, args);
    if (iter) {
        return iter;
    }
    const keys = args[0];
    const copy = args[1] !== false;
    return map_1.map((x) => {
        const res = copy ? Object.assign({}, x) : x;
        for (let k in keys) {
            res[k] = keys[k](x[k]);
        }
        return res;
    });
}
exports.mapKeys = mapKeys;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/map-nth.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function mapNth(...args) {
    const iter = iterator_1.$iter(mapNth, args);
    if (iter) {
        return iter;
    }
    let n = args[0] - 1, offset, fn;
    if (typeof args[1] === "number") {
        offset = args[1];
        fn = args[2];
    }
    else {
        fn = args[1];
        offset = 0;
    }
    return (rfn) => {
        const r = rfn[2];
        let skip = 0, off = offset;
        return compr_1.compR(rfn, (acc, x) => {
            if (off === 0) {
                if (skip === 0) {
                    skip = n;
                    return r(acc, fn(x));
                }
                skip--;
            }
            else {
                off--;
            }
            return r(acc, x);
        });
    };
}
exports.mapNth = mapNth;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/map-vals.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function mapVals(...args) {
    const iter = iterator_1.$iter(mapVals, args);
    if (iter) {
        return iter;
    }
    const fn = args[0];
    const copy = args[1] !== false;
    return map_1.map((x) => {
        const res = copy ? {} : x;
        for (let k in x) {
            res[k] = fn(x[k]);
        }
        return res;
    });
}
exports.mapVals = mapVals;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/mapcat.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("../func/comp");
const iterator_1 = require("../iterator");
const cat_1 = require("./cat");
const map_1 = require("./map");
function mapcat(fn, src) {
    return src ?
        iterator_1.iterator(mapcat(fn), src) :
        comp_1.comp(map_1.map(fn), cat_1.cat());
}
exports.mapcat = mapcat;

},{"../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./cat":"../../../node_modules/@thi.ng/transducers/xform/cat.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/take.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function take(n, src) {
    return src ?
        iterator_1.iterator(take(n), src) :
        (rfn) => {
            const r = rfn[2];
            let m = n;
            return compr_1.compR(rfn, (acc, x) => --m > 0 ? r(acc, x) :
                m === 0 ? reduced_1.ensureReduced(r(acc, x)) :
                    reduced_1.reduced(acc));
        };
}
exports.take = take;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/match-first.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("../func/comp");
const iterator_1 = require("../iterator");
const filter_1 = require("./filter");
const take_1 = require("./take");
function matchFirst(pred, src) {
    return src ?
        [...iterator_1.iterator1(matchFirst(pred), src)][0] :
        comp_1.comp(filter_1.filter(pred), take_1.take(1));
}
exports.matchFirst = matchFirst;

},{"../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./filter":"../../../node_modules/@thi.ng/transducers/xform/filter.js","./take":"../../../node_modules/@thi.ng/transducers/xform/take.js"}],"../../../node_modules/@thi.ng/transducers/xform/take-last.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function takeLast(n, src) {
    return src ?
        iterator_1.iterator(takeLast(n), src) :
        ([init, complete, reduce]) => {
            const buf = [];
            return [
                init,
                (acc) => {
                    while (buf.length && !reduced_1.isReduced(acc)) {
                        acc = reduce(acc, buf.shift());
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    if (buf.length === n) {
                        buf.shift();
                    }
                    buf.push(x);
                    return acc;
                }
            ];
        };
}
exports.takeLast = takeLast;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/match-last.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("../func/comp");
const iterator_1 = require("../iterator");
const filter_1 = require("./filter");
const take_last_1 = require("./take-last");
function matchLast(pred, src) {
    return src ?
        [...iterator_1.iterator(matchLast(pred), src)][0] :
        comp_1.comp(filter_1.filter(pred), take_last_1.takeLast(1));
}
exports.matchLast = matchLast;

},{"../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./filter":"../../../node_modules/@thi.ng/transducers/xform/filter.js","./take-last":"../../../node_modules/@thi.ng/transducers/xform/take-last.js"}],"../../../node_modules/@thi.ng/transducers/xform/moving-average.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arguments_1 = require("@thi.ng/errors/illegal-arguments");
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function movingAverage(period, src) {
    return src ?
        iterator_1.iterator1(movingAverage(period), src) :
        (rfn) => {
            period |= 0;
            period < 2 && illegal_arguments_1.illegalArgs("period must be >= 2");
            const reduce = rfn[2];
            const window = [];
            let sum = 0;
            return compr_1.compR(rfn, (acc, x) => {
                const n = window.push(x);
                sum += x;
                n > period && (sum -= window.shift());
                return n >= period ? reduce(acc, sum / period) : acc;
            });
        };
}
exports.movingAverage = movingAverage;
;

},{"@thi.ng/errors/illegal-arguments":"../../../node_modules/@thi.ng/errors/illegal-arguments.js","../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/moving-median.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compare_1 = require("@thi.ng/compare");
const comp_1 = require("../func/comp");
const identity_1 = require("../func/identity");
const iterator_1 = require("../iterator");
const map_1 = require("./map");
const partition_1 = require("./partition");
function movingMedian(...args) {
    const iter = iterator_1.$iter(movingMedian, args);
    if (iter) {
        return iter;
    }
    const { key, compare } = Object.assign({ key: identity_1.identity, compare: compare_1.compare }, args[1]);
    const n = args[0];
    const m = n >> 1;
    return comp_1.comp(partition_1.partition(n, 1, true), map_1.map((window) => window.slice().sort((a, b) => compare(key(a), key(b)))[m]));
}
exports.movingMedian = movingMedian;

},{"@thi.ng/compare":"../../../node_modules/@thi.ng/compare/index.js","../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js","./partition":"../../../node_modules/@thi.ng/transducers/xform/partition.js"}],"../../../node_modules/@thi.ng/transducers/xform/multiplex.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const juxt_1 = require("../func/juxt");
const step_1 = require("../step");
const map_1 = require("./map");
function multiplex(...args) {
    return map_1.map(juxt_1.juxt.apply(null, args.map(step_1.step)));
}
exports.multiplex = multiplex;

},{"../func/juxt":"../../../node_modules/@thi.ng/transducers/func/juxt.js","../step":"../../../node_modules/@thi.ng/transducers/step.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/func/renamer.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function renamer(kmap) {
    const ks = Object.keys(kmap);
    const [a2, b2, c2] = ks;
    const [a1, b1, c1] = ks.map((k) => kmap[k]);
    switch (ks.length) {
        case 3:
            return (x) => {
                const res = {};
                let v;
                v = x[c1], v !== undefined && (res[c2] = v);
                v = x[b1], v !== undefined && (res[b2] = v);
                v = x[a1], v !== undefined && (res[a2] = v);
                return res;
            };
        case 2:
            return (x) => {
                const res = {};
                let v;
                v = x[b1], v !== undefined && (res[b2] = v);
                v = x[a1], v !== undefined && (res[a2] = v);
                return res;
            };
        case 1:
            return (x) => {
                const res = {};
                let v = x[a1];
                v !== undefined && (res[a2] = v);
                return res;
            };
        default:
            return (x) => {
                let k, v;
                const res = {};
                for (let i = ks.length - 1; i >= 0; i--) {
                    k = ks[i], v = x[kmap[k]], v !== undefined && (res[k] = v);
                }
                return res;
            };
    }
}
exports.renamer = renamer;

},{}],"../../../node_modules/@thi.ng/transducers/xform/rename.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_array_1 = require("@thi.ng/checks/is-array");
const comp_1 = require("../func/comp");
const renamer_1 = require("../func/renamer");
const iterator_1 = require("../iterator");
const transduce_1 = require("../transduce");
const filter_1 = require("./filter");
const map_1 = require("./map");
function rename(...args) {
    const iter = args.length > 2 && iterator_1.$iter(rename, args);
    if (iter) {
        return iter;
    }
    let kmap = args[0];
    if (is_array_1.isArray(kmap)) {
        kmap = kmap.reduce((acc, k, i) => (acc[k] = i, acc), {});
    }
    if (args[1]) {
        const ks = Object.keys(kmap);
        return map_1.map((y) => transduce_1.transduce(comp_1.comp(map_1.map((k) => [k, y[kmap[k]]]), filter_1.filter(x => x[1] !== undefined)), args[1], ks));
    }
    else {
        return map_1.map(renamer_1.renamer(kmap));
    }
}
exports.rename = rename;

},{"@thi.ng/checks/is-array":"../../../node_modules/@thi.ng/checks/is-array.js","../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../func/renamer":"../../../node_modules/@thi.ng/transducers/func/renamer.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../transduce":"../../../node_modules/@thi.ng/transducers/transduce.js","./filter":"../../../node_modules/@thi.ng/transducers/xform/filter.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/multiplex-obj.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("../func/comp");
const iterator_1 = require("../iterator");
const multiplex_1 = require("./multiplex");
const rename_1 = require("./rename");
function multiplexObj(...args) {
    const iter = iterator_1.$iter(multiplexObj, args);
    if (iter) {
        return iter;
    }
    const [xforms, rfn] = args;
    const ks = Object.keys(xforms);
    return comp_1.comp(multiplex_1.multiplex.apply(null, ks.map((k) => xforms[k])), rename_1.rename(ks, rfn));
}
exports.multiplexObj = multiplexObj;

},{"../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./multiplex":"../../../node_modules/@thi.ng/transducers/xform/multiplex.js","./rename":"../../../node_modules/@thi.ng/transducers/xform/rename.js"}],"../../../node_modules/@thi.ng/transducers/xform/noop.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * No-op / pass-through transducer, essentially the same as:
 * `map(identity)`, but faster. Useful for testing and / or to keep
 * existing values in a `multiplex()` tuple lane.
 */
function noop() {
    return (rfn) => rfn;
}
exports.noop = noop;

},{}],"../../../node_modules/@thi.ng/transducers/xform/page.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("../func/comp");
const iterator_1 = require("../iterator");
const drop_1 = require("./drop");
const take_1 = require("./take");
function page(...args) {
    return iterator_1.$iter(page, args) ||
        comp_1.comp(drop_1.drop(args[0] * (args[1] || 10)), take_1.take(args[1] || 10));
}
exports.page = page;

},{"../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./drop":"../../../node_modules/@thi.ng/transducers/xform/drop.js","./take":"../../../node_modules/@thi.ng/transducers/xform/take.js"}],"../../../node_modules/@thi.ng/transducers/xform/partition-bits.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function partitionBits(...args) {
    return iterator_1.$iter(partitionBits, args, iterator_1.iterator) ||
        ((rfn) => {
            const destSize = args[0];
            const srcSize = args[1] || 8;
            return destSize < srcSize ?
                small(rfn, destSize, srcSize) :
                destSize > srcSize ?
                    large(rfn, destSize, srcSize) :
                    rfn;
        });
}
exports.partitionBits = partitionBits;
const small = ([init, complete, reduce], n, wordSize) => {
    const maxb = wordSize - n;
    const m1 = (1 << wordSize) - 1;
    const m2 = (1 << n) - 1;
    let r = 0;
    let y = 0;
    return [
        init,
        (acc) => complete(r > 0 ? reduce(acc, y) : acc),
        (acc, x) => {
            let b = 0;
            do {
                acc = reduce(acc, y + ((x >>> (maxb + r)) & m2));
                b += n - r;
                x = (x << (n - r)) & m1;
                y = 0;
                r = 0;
            } while (b <= maxb && !reduced_1.isReduced(acc));
            r = wordSize - b;
            y = r > 0 ? (x >>> maxb) & m2 : 0;
            return acc;
        }
    ];
};
const large = ([init, complete, reduce], n, wordSize) => {
    const m1 = (1 << wordSize) - 1;
    let r = 0;
    let y = 0;
    return [
        init,
        (acc) => complete(r > 0 ? reduce(acc, y) : acc),
        (acc, x) => {
            if (r + wordSize <= n) {
                y |= (x & m1) << (n - wordSize - r);
                r += wordSize;
                if (r === n) {
                    acc = reduce(acc, y);
                    y = 0;
                    r = 0;
                }
            }
            else {
                const k = n - r;
                r = wordSize - k;
                acc = reduce(acc, y | ((x >>> r) & ((1 << k) - 1)));
                y = (x & ((1 << r) - 1)) << (n - r);
            }
            return acc;
        }
    ];
};

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/partition-by.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("@thi.ng/api/api");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function partitionBy(...args) {
    return iterator_1.$iter(partitionBy, args, iterator_1.iterator) ||
        (([init, complete, reduce]) => {
            const fn = args[0];
            const f = args[1] === true ? fn() : fn;
            let prev = api_1.SEMAPHORE, chunk;
            return [
                init,
                (acc) => {
                    if (chunk && chunk.length) {
                        acc = reduce(acc, chunk);
                        chunk = null;
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    const curr = f(x);
                    if (prev === api_1.SEMAPHORE) {
                        prev = curr;
                        chunk = [x];
                    }
                    else if (curr === prev) {
                        chunk.push(x);
                    }
                    else {
                        chunk && (acc = reduce(acc, chunk));
                        chunk = reduced_1.isReduced(acc) ? null : [x];
                        prev = curr;
                    }
                    return acc;
                }
            ];
        });
}
exports.partitionBy = partitionBy;

},{"@thi.ng/api/api":"../../../node_modules/@thi.ng/api/api.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/partition-of.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const partition_by_1 = require("./partition-by");
function partitionOf(sizes, src) {
    return src ?
        iterator_1.iterator(partitionOf(sizes), src) :
        partition_by_1.partitionBy(() => {
            let i = 0, j = 0;
            return () => {
                if (i++ === sizes[j]) {
                    i = 1;
                    j = (j + 1) % sizes.length;
                }
                return j;
            };
        }, true);
}
exports.partitionOf = partitionOf;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./partition-by":"../../../node_modules/@thi.ng/transducers/xform/partition-by.js"}],"../../../node_modules/@thi.ng/transducers/xform/partition-sort.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compare_1 = require("@thi.ng/compare");
const comp_1 = require("../func/comp");
const identity_1 = require("../func/identity");
const iterator_1 = require("../iterator");
const mapcat_1 = require("./mapcat");
const partition_1 = require("./partition");
function partitionSort(...args) {
    const iter = iterator_1.$iter(partitionSort, args, iterator_1.iterator);
    if (iter) {
        return iter;
    }
    const { key, compare } = Object.assign({ key: identity_1.identity, compare: compare_1.compare }, args[1]);
    return comp_1.comp(partition_1.partition(args[0], true), mapcat_1.mapcat((window) => window.slice().sort((a, b) => compare(key(a), key(b)))));
}
exports.partitionSort = partitionSort;

},{"@thi.ng/compare":"../../../node_modules/@thi.ng/compare/index.js","../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./mapcat":"../../../node_modules/@thi.ng/transducers/xform/mapcat.js","./partition":"../../../node_modules/@thi.ng/transducers/xform/partition.js"}],"../../../node_modules/@thi.ng/transducers/xform/partition-sync.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const is_array_1 = require("@thi.ng/checks/is-array");
const identity_1 = require("../func/identity");
const iterator_1 = require("../iterator");
function partitionSync(...args) {
    return iterator_1.$iter(partitionSync, args, iterator_1.iterator) ||
        (([init, complete, reduce]) => {
            let curr = {};
            let first = true;
            const currKeys = new Set();
            const { key, mergeOnly, reset, all } = Object.assign({ key: identity_1.identity, mergeOnly: false, reset: true, all: true }, args[1]);
            const ks = is_array_1.isArray(args[0]) ? new Set(args[0]) : args[0];
            return [
                init,
                (acc) => {
                    if ((reset && all && currKeys.size > 0) || (!reset && first)) {
                        acc = reduce(acc, curr);
                        curr = undefined;
                        currKeys.clear();
                        first = false;
                    }
                    return complete(acc);
                },
                (acc, x) => {
                    const k = key(x);
                    if (ks.has(k)) {
                        curr[k] = x;
                        currKeys.add(k);
                        if (mergeOnly || currKeys.size >= ks.size) {
                            acc = reduce(acc, curr);
                            first = false;
                            if (reset) {
                                curr = {};
                                currKeys.clear();
                            }
                            else {
                                curr = Object.assign({}, curr);
                            }
                        }
                    }
                    return acc;
                }
            ];
        });
}
exports.partitionSync = partitionSync;

},{"@thi.ng/checks/is-array":"../../../node_modules/@thi.ng/checks/is-array.js","../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/pluck.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function pluck(key, src) {
    return src ?
        iterator_1.iterator1(pluck(key), src) :
        map_1.map((x) => x[key]);
}
exports.pluck = pluck;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/sample.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function sample(prob, src) {
    return src ?
        iterator_1.iterator1(sample(prob), src) :
        (rfn) => {
            const r = rfn[2];
            return compr_1.compR(rfn, (acc, x) => Math.random() < prob ? r(acc, x) : acc);
        };
}
exports.sample = sample;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/xform/scan.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function scan(...args) {
    return (args.length > 2 && iterator_1.$iter(scan, args, iterator_1.iterator)) ||
        (([inito, completeo, reduceo]) => {
            const [initi, completei, reducei] = args[0];
            let acc = args.length > 1 && args[1] != null ? args[1] : initi();
            return [
                inito,
                (_acc) => {
                    let a = completei(acc);
                    if (a !== acc) {
                        _acc = reduced_1.unreduced(reduceo(_acc, a));
                    }
                    acc = a;
                    return completeo(_acc);
                },
                (_acc, x) => {
                    acc = reducei(acc, x);
                    if (reduced_1.isReduced(acc)) {
                        return reduced_1.ensureReduced(reduceo(_acc, acc.deref()));
                    }
                    return reduceo(_acc, acc);
                }
            ];
        });
}
exports.scan = scan;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/func/key-selector.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renamer_1 = require("./renamer");
function keySelector(keys) {
    return renamer_1.renamer(keys.reduce((acc, x) => (acc[x] = x, acc), {}));
}
exports.keySelector = keySelector;

},{"./renamer":"../../../node_modules/@thi.ng/transducers/func/renamer.js"}],"../../../node_modules/@thi.ng/transducers/xform/select-keys.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const key_selector_1 = require("../func/key-selector");
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function selectKeys(keys, src) {
    return src ?
        iterator_1.iterator1(selectKeys(keys), src) :
        map_1.map(key_selector_1.keySelector(keys));
}
exports.selectKeys = selectKeys;

},{"../func/key-selector":"../../../node_modules/@thi.ng/transducers/func/key-selector.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/side-effect.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const map_1 = require("./map");
/**
 * Helper transducer. Applies given `fn` to each input value, presumably
 * for side effects. Discards function's result and yields original
 * inputs.
 *
 * @param fn side effect
 */
function sideEffect(fn) {
    return map_1.map((x) => (fn(x), x));
}
exports.sideEffect = sideEffect;

},{"./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/sliding-window.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
function slidingWindow(...args) {
    const iter = iterator_1.$iter(slidingWindow, args);
    if (iter) {
        return iter;
    }
    const size = args[0];
    const partial = args[1] !== false;
    return (rfn) => {
        const reduce = rfn[2];
        let buf = [];
        return compr_1.compR(rfn, (acc, x) => {
            buf.push(x);
            if (partial || buf.length === size) {
                acc = reduce(acc, buf);
                buf = buf.slice(buf.length === size ? 1 : 0);
            }
            return acc;
        });
    };
}
exports.slidingWindow = slidingWindow;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js"}],"../../../node_modules/@thi.ng/transducers/func/shuffle.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function shuffleN(buf, n) {
    const l = buf.length;
    n = n < l ? n : l;
    while (--n >= 0) {
        const a = (Math.random() * l) | 0;
        const b = (Math.random() * l) | 0;
        const t = buf[a];
        buf[a] = buf[b];
        buf[b] = t;
    }
}
exports.shuffleN = shuffleN;

},{}],"../../../node_modules/@thi.ng/transducers/xform/stream-shuffle.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shuffle_1 = require("../func/shuffle");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function streamShuffle(...args) {
    return iterator_1.$iter(streamShuffle, args, iterator_1.iterator) ||
        (([init, complete, reduce]) => {
            const n = args[0];
            const maxSwaps = args[1] || n;
            const buf = [];
            return [
                init,
                (acc) => {
                    while (buf.length && !reduced_1.isReduced(acc)) {
                        shuffle_1.shuffleN(buf, maxSwaps);
                        acc = reduce(acc, buf.shift());
                    }
                    acc = complete(acc);
                    return acc;
                },
                (acc, x) => {
                    buf.push(x);
                    shuffle_1.shuffleN(buf, maxSwaps);
                    if (buf.length === n) {
                        acc = reduce(acc, buf.shift());
                    }
                    return acc;
                }
            ];
        });
}
exports.streamShuffle = streamShuffle;

},{"../func/shuffle":"../../../node_modules/@thi.ng/transducers/func/shuffle.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/func/binary-search.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns the supposed index of `x` in pre-sorted array-like collection
 * `arr`. The `key` function first is used to obtain the actual sort
 * value of `x` and each array item. The `cmp` comparator is then used to
 * identify the index of `x`.
 *
 * @param arr
 * @param key
 * @param cmp
 * @param x
 * @returns index of `x`, else `-index` if item could not be found
 */
function binarySearch(arr, key, cmp, x) {
    const kx = key(x);
    let low = 0;
    let high = arr.length - 1;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const c = cmp(key(arr[mid]), kx);
        if (c < 0) {
            low = mid + 1;
        }
        else if (c > 0) {
            high = mid - 1;
        }
        else {
            return mid;
        }
    }
    return -low;
}
exports.binarySearch = binarySearch;

},{}],"../../../node_modules/@thi.ng/transducers/xform/stream-sort.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compare_1 = require("@thi.ng/compare");
const binary_search_1 = require("../func/binary-search");
const identity_1 = require("../func/identity");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function streamSort(...args) {
    const iter = iterator_1.$iter(streamSort, args, iterator_1.iterator);
    if (iter) {
        return iter;
    }
    const { key, compare } = Object.assign({ key: identity_1.identity, compare: compare_1.compare }, args[1]);
    const n = args[0];
    return ([init, complete, reduce]) => {
        const buf = [];
        return [
            init,
            (acc) => {
                while (buf.length && !reduced_1.isReduced(acc)) {
                    acc = reduce(acc, buf.shift());
                }
                return complete(acc);
            },
            (acc, x) => {
                const idx = binary_search_1.binarySearch(buf, key, compare, x);
                buf.splice(Math.abs(idx), 0, x);
                if (buf.length === n) {
                    acc = reduce(acc, buf.shift());
                }
                return acc;
            }
        ];
    };
}
exports.streamSort = streamSort;

},{"@thi.ng/compare":"../../../node_modules/@thi.ng/compare/index.js","../func/binary-search":"../../../node_modules/@thi.ng/transducers/func/binary-search.js","../func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/struct.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comp_1 = require("../func/comp");
const iterator_1 = require("../iterator");
const map_keys_1 = require("./map-keys");
const partition_1 = require("./partition");
const partition_of_1 = require("./partition-of");
const rename_1 = require("./rename");
function struct(fields, src) {
    return src ?
        iterator_1.iterator(struct(fields), src) :
        comp_1.comp(partition_of_1.partitionOf(fields.map((f) => f[1])), partition_1.partition(fields.length), rename_1.rename(fields.map((f) => f[0])), map_keys_1.mapKeys(fields.reduce((acc, f) => (f[2] ? (acc[f[0]] = f[2], acc) : acc), {}), false));
}
exports.struct = struct;

},{"../func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map-keys":"../../../node_modules/@thi.ng/transducers/xform/map-keys.js","./partition":"../../../node_modules/@thi.ng/transducers/xform/partition.js","./partition-of":"../../../node_modules/@thi.ng/transducers/xform/partition-of.js","./rename":"../../../node_modules/@thi.ng/transducers/xform/rename.js"}],"../../../node_modules/@thi.ng/transducers/func/swizzler.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns optimized function to select, repeat, reshape and / or
 * reorder array/object values in the specified index order. The
 * returned function can be used directly or as mapping function for the
 * `map` transducer. Fast paths for up to 8 indices are provided, before
 * a loop based approach is used.
 *
 * ```
 * swizzler([0, 0, 0])([1, 2, 3, 4])    // [ 1, 1, 1 ]
 * swizzler([1, 1, 3, 3])([1, 2, 3, 4]) // [ 2, 2, 4, 4 ]
 * swizzler([2, 0])([1, 2, 3])          // [ 3, 1 ]
 * ```
 *
 * Even though, objects can be used as input to the generated function,
 * the returned values will always be in array form.
 *
 * ```
 * swizzler(["a", "c", "b"])({a: 1, b: 2, c: 3}) // [ 1, 3, 2 ]
 * ```
 *
 * @param order indices
 */
function swizzler(order) {
    const [a, b, c, d, e, f, g, h] = order;
    switch (order.length) {
        case 0:
            return () => [];
        case 1:
            return (x) => [x[a]];
        case 2:
            return (x) => [x[a], x[b]];
        case 3:
            return (x) => [x[a], x[b], x[c]];
        case 4:
            return (x) => [x[a], x[b], x[c], x[d]];
        case 5:
            return (x) => [x[a], x[b], x[c], x[d], x[e]];
        case 6:
            return (x) => [x[a], x[b], x[c], x[d], x[e], x[f]];
        case 7:
            return (x) => [x[a], x[b], x[c], x[d], x[e], x[f], x[g]];
        case 8:
            return (x) => [x[a], x[b], x[c], x[d], x[e], x[f], x[g], x[h]];
        default:
            return (x) => {
                const res = [];
                for (let i = order.length - 1; i >= 0; i--) {
                    res[i] = x[order[i]];
                }
                return res;
            };
    }
}
exports.swizzler = swizzler;

},{}],"../../../node_modules/@thi.ng/transducers/xform/swizzle.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swizzler_1 = require("../func/swizzler");
const iterator_1 = require("../iterator");
const map_1 = require("./map");
function swizzle(order, src) {
    return src ?
        iterator_1.iterator1(swizzle(order), src) :
        map_1.map(swizzler_1.swizzler(order));
}
exports.swizzle = swizzle;

},{"../func/swizzler":"../../../node_modules/@thi.ng/transducers/func/swizzler.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./map":"../../../node_modules/@thi.ng/transducers/xform/map.js"}],"../../../node_modules/@thi.ng/transducers/xform/take-nth.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const throttle_1 = require("./throttle");
function takeNth(n, src) {
    if (src) {
        return iterator_1.iterator1(takeNth(n), src);
    }
    n = Math.max(0, n - 1);
    return throttle_1.throttle(() => {
        let skip = 0;
        return () => (skip === 0 ? (skip = n, true) : (skip--, false));
    });
}
exports.takeNth = takeNth;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./throttle":"../../../node_modules/@thi.ng/transducers/xform/throttle.js"}],"../../../node_modules/@thi.ng/transducers/xform/take-while.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function takeWhile(...args) {
    return iterator_1.$iter(takeWhile, args) ||
        ((rfn) => {
            const r = rfn[2];
            const pred = args[0];
            let ok = true;
            return compr_1.compR(rfn, (acc, x) => (ok = ok && pred(x)) ? r(acc, x) : reduced_1.reduced(acc));
        });
}
exports.takeWhile = takeWhile;

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/throttle-time.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const throttle_1 = require("./throttle");
function throttleTime(delay, src) {
    return src ?
        iterator_1.iterator1(throttleTime(delay), src) :
        throttle_1.throttle(() => {
            let last = 0;
            return () => {
                const t = Date.now();
                return t - last >= delay ? (last = t, true) : false;
            };
        });
}
exports.throttleTime = throttleTime;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./throttle":"../../../node_modules/@thi.ng/transducers/xform/throttle.js"}],"../../../node_modules/@thi.ng/transducers/xform/trace.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const side_effect_1 = require("./side-effect");
function trace(prefix = "") {
    return side_effect_1.sideEffect((x) => console.log(prefix, x));
}
exports.trace = trace;

},{"./side-effect":"../../../node_modules/@thi.ng/transducers/xform/side-effect.js"}],"../../../node_modules/@thi.ng/transducers/xform/utf8.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compr_1 = require("../func/compr");
const iterator_1 = require("../iterator");
const reduced_1 = require("../reduced");
function utf8Decode(src) {
    return src ?
        [...iterator_1.iterator1(utf8Decode(), src)].join("") :
        (rfn) => {
            const r = rfn[2];
            let state = 0, u0, u1, u2, u3, u4;
            return compr_1.compR(rfn, (acc, x) => {
                switch (state) {
                    case 0:
                    default:
                        if (x < 0x80) {
                            return r(acc, String.fromCharCode(x));
                        }
                        u0 = x;
                        state = 1;
                        break;
                    case 1:
                        u1 = x & 0x3f;
                        if ((u0 & 0xe0) === 0xc0) {
                            state = 0;
                            return r(acc, String.fromCharCode(((u0 & 0x1f) << 6) | u1));
                        }
                        state = 2;
                        break;
                    case 2:
                        u2 = x & 0x3f;
                        if ((u0 & 0xf0) === 0xe0) {
                            state = 0;
                            return r(acc, String.fromCharCode(((u0 & 0x0f) << 12) | (u1 << 6) | u2));
                        }
                        state = 3;
                        break;
                    case 3:
                        u3 = x & 0x3f;
                        if ((u0 & 0xf8) === 0xf0) {
                            state = 0;
                            return r(acc, codePoint(((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3));
                        }
                        state = 4;
                        break;
                    case 4:
                        u4 = x & 0x3f;
                        if ((u0 & 0xfc) === 0xf8) {
                            state = 0;
                            return r(acc, codePoint(((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4));
                        }
                        state = 5;
                        break;
                    case 5:
                        state = 0;
                        return r(acc, codePoint(((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | (x & 0x3f)));
                }
                return acc;
            });
        };
}
exports.utf8Decode = utf8Decode;
function utf8Encode(src) {
    return src != null ?
        iterator_1.iterator(utf8Encode(), src) :
        (rfn) => {
            const r = rfn[2];
            return compr_1.compR(rfn, (acc, x) => {
                let u = x.charCodeAt(0), buf;
                if (u >= 0xd800 && u <= 0xdfff) {
                    u = 0x10000 + ((u & 0x3ff) << 10) | (x.charCodeAt(1) & 0x3ff);
                }
                if (u < 0x80) {
                    return r(acc, u);
                }
                else if (u < 0x800) {
                    buf = [
                        0xc0 | (u >> 6),
                        0x80 | (u & 0x3f)
                    ];
                }
                else if (u < 0x10000) {
                    buf = [
                        0xe0 | (u >> 12),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f)
                    ];
                }
                else if (u < 0x200000) {
                    buf = [
                        0xf0 | (u >> 18),
                        0x80 | ((u >> 12) & 0x3f),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f)
                    ];
                }
                else if (u < 0x4000000) {
                    buf = [
                        0xf8 | (u >> 24),
                        0x80 | ((u >> 18) & 0x3f),
                        0x80 | ((u >> 12) & 0x3f),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f)
                    ];
                }
                else {
                    buf = [
                        0xfc | (u >> 30),
                        0x80 | ((u >> 24) & 0x3f),
                        0x80 | ((u >> 18) & 0x3f),
                        0x80 | ((u >> 12) & 0x3f),
                        0x80 | ((u >> 6) & 0x3f),
                        0x80 | (u & 0x3f)
                    ];
                }
                for (let i = 0, n = buf.length; i < n; i++) {
                    acc = r(acc, buf[i]);
                    if (reduced_1.isReduced(acc)) {
                        break;
                    }
                }
                return acc;
            });
        };
}
exports.utf8Encode = utf8Encode;
const codePoint = (x) => x < 0x10000 ?
    String.fromCharCode(x) :
    (x -= 0x10000, String.fromCharCode(0xd800 | (x >> 10), 0xdc00 | (x & 0x3ff)));

},{"../func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/xform/word-wrap.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const iterator_1 = require("../iterator");
const partition_by_1 = require("./partition-by");
function wordWrap(...args) {
    const iter = iterator_1.$iter(wordWrap, args, iterator_1.iterator);
    if (iter) {
        return iter;
    }
    const lineLength = args[0];
    const { delim, always } = Object.assign({ delim: 1, always: true }, args[1]);
    return partition_by_1.partitionBy(() => {
        let n = 0;
        let flag = false;
        return (w) => {
            n += w.length + delim;
            if (n > lineLength + (always ? 0 : delim)) {
                flag = !flag;
                n = w.length + delim;
            }
            return flag;
        };
    }, true);
}
exports.wordWrap = wordWrap;

},{"../iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./partition-by":"../../../node_modules/@thi.ng/transducers/xform/partition-by.js"}],"../../../node_modules/@thi.ng/transducers/func/constantly.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function constantly(x) {
    return () => x;
}
exports.constantly = constantly;

},{}],"../../../node_modules/@thi.ng/transducers/func/even.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_even_1 = require("@thi.ng/checks/is-even");
exports.even = is_even_1.isEven;

},{"@thi.ng/checks/is-even":"../../../node_modules/@thi.ng/checks/is-even.js"}],"../../../node_modules/@thi.ng/transducers/func/hex.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const radix_1 = require("@thi.ng/strings/radix");
/**
 * @deprecated use thi.ng/strings `radix()` instead
 *
 * @param digits
 * @param prefix
 */
exports.hex = (digits = 2, prefix = "") => radix_1.radix(16, digits, prefix);

},{"@thi.ng/strings/radix":"../../../node_modules/@thi.ng/strings/radix.js"}],"../../../node_modules/@thi.ng/transducers/func/juxtr.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reduced_1 = require("../reduced");
function juxtR(...rs) {
    let [a, b, c] = rs;
    const n = rs.length;
    switch (n) {
        case 1: {
            const r = a[2];
            return [
                () => [a[0]()],
                (acc) => [a[1](acc[0])],
                (acc, x) => {
                    const aa1 = r(acc[0], x);
                    if (reduced_1.isReduced(aa1)) {
                        return reduced_1.reduced([reduced_1.unreduced(aa1)]);
                    }
                    return [aa1];
                }
            ];
        }
        case 2: {
            const ra = a[2];
            const rb = b[2];
            return [
                () => [a[0](), b[0]()],
                (acc) => [a[1](acc[0]), b[1](acc[1])],
                (acc, x) => {
                    const aa1 = ra(acc[0], x);
                    const aa2 = rb(acc[1], x);
                    if (reduced_1.isReduced(aa1) || reduced_1.isReduced(aa2)) {
                        return reduced_1.reduced([reduced_1.unreduced(aa1), reduced_1.unreduced(aa2)]);
                    }
                    return [aa1, aa2];
                }
            ];
        }
        case 3: {
            const ra = a[2];
            const rb = b[2];
            const rc = c[2];
            return [
                () => [a[0](), b[0](), c[0]()],
                (acc) => [a[1](acc[0]), b[1](acc[1]), c[1](acc[2])],
                (acc, x) => {
                    const aa1 = ra(acc[0], x);
                    const aa2 = rb(acc[1], x);
                    const aa3 = rc(acc[2], x);
                    if (reduced_1.isReduced(aa1) || reduced_1.isReduced(aa2) || reduced_1.isReduced(aa3)) {
                        return reduced_1.reduced([reduced_1.unreduced(aa1), reduced_1.unreduced(aa2), reduced_1.unreduced(aa3)]);
                    }
                    return [aa1, aa2, aa3];
                }
            ];
        }
        default:
            return [
                () => rs.map((r) => r[0]()),
                (acc) => rs.map((r, i) => r[1](acc[i])),
                (acc, x) => {
                    let done = false;
                    const res = [];
                    for (let i = 0; i < n; i++) {
                        let a = rs[i][2](acc[i], x);
                        if (reduced_1.isReduced(a)) {
                            done = true;
                            a = reduced_1.unreduced(a);
                        }
                        res[i] = a;
                    }
                    return done ? reduced_1.reduced(res) : res;
                }
            ];
    }
}
exports.juxtR = juxtR;

},{"../reduced":"../../../node_modules/@thi.ng/transducers/reduced.js"}],"../../../node_modules/@thi.ng/transducers/func/lookup.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns function accepting a single index arg used to
 * lookup value in given array. No bounds checks are done.
 *
 * ```
 * [...map(lookup1d([10, 20, 30]), [2,0,1])]
 * // [ 30, 10, 20 ]
 * ```
 *
 * @param src source data
 */
function lookup1d(src) {
    return (i) => src[i];
}
exports.lookup1d = lookup1d;
/**
 * Returns function accepting a single `[x, y]` index tuple,
 * used to lookup value in given array. Useful for transducers
 * processing 2D data. **Note**: The source data MUST be in
 * row major linearized format, i.e. 1D representation of 2D data
 * (pixel buffer). No bounds checks are done.
 *
 * ```
 * [...map(lookup2d([...range(9)], 3), range2d(2, -1, 0, 3))]
 * // [ 2, 1, 0, 5, 4, 3, 8, 7, 6 ]
 * ```
 *
 * @param src source data
 * @param width number of items along X (columns)
 */
function lookup2d(src, width) {
    return (i) => src[i[0] + i[1] * width];
}
exports.lookup2d = lookup2d;
/**
 * Same as `lookup2d()`, but for 3D data. The index ordering of the
 * source data MUST be in Z, Y, X order (i.e. a stack of row major 2D slices).
 * No bounds checks are done.
 *
 * @param src source data
 * @param width number of items along X (columns)
 * @param height number of items along Y (rows)
 */
function lookup3d(src, width, height) {
    const stridez = width * height;
    return (i) => src[i[0] + i[1] * width + i[2] * stridez];
}
exports.lookup3d = lookup3d;

},{}],"../../../node_modules/@thi.ng/transducers/func/odd.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var is_odd_1 = require("@thi.ng/checks/is-odd");
exports.odd = is_odd_1.isOdd;

},{"@thi.ng/checks/is-odd":"../../../node_modules/@thi.ng/checks/is-odd.js"}],"../../../node_modules/@thi.ng/transducers/func/peek.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns last element of given array.
 *
 * @param x
 */
function peek(x) {
    return x[x.length - 1];
}
exports.peek = peek;

},{}],"../../../node_modules/@thi.ng/transducers/iter/repeat.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* repeat(x, n = Infinity) {
    while (n-- > 0) {
        yield x;
    }
}
exports.repeat = repeat;

},{}],"../../../node_modules/@thi.ng/transducers/func/weighted-random.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const repeat_1 = require("../iter/repeat");
const tuples_1 = require("../iter/tuples");
/**
 * If `weights` are given, it must be the same size as `choices`. If omitted,
 * each choice will have same probability.
 *
 * https://www.electricmonk.nl/log/2009/12/23/weighted-random-distribution/
 *
 * @param choices
 * @param weights
 */
function weightedRandom(choices, weights) {
    const n = choices.length;
    const opts = [...tuples_1.tuples(choices, weights || repeat_1.repeat(1))].sort((a, b) => b[1] - a[1]);
    let total = 0, i, r, sum;
    for (i = 0; i < n; i++) {
        total += weights[i];
    }
    return () => {
        r = Math.random() * total;
        sum = total;
        for (i = 0; i < n; i++) {
            sum -= opts[i][1];
            if (sum <= r) {
                return opts[i][0];
            }
        }
    };
}
exports.weightedRandom = weightedRandom;

},{"../iter/repeat":"../../../node_modules/@thi.ng/transducers/iter/repeat.js","../iter/tuples":"../../../node_modules/@thi.ng/transducers/iter/tuples.js"}],"../../../node_modules/@thi.ng/transducers/iter/repeatedly.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* repeatedly(fn, n = Infinity) {
    while (n-- > 0) {
        yield fn();
    }
}
exports.repeatedly = repeatedly;

},{}],"../../../node_modules/@thi.ng/transducers/iter/choices.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const weighted_random_1 = require("../func/weighted-random");
const repeatedly_1 = require("./repeatedly");
/**
 * Returns an infinite iterator of random choices and their (optional)
 * weights. If `weights` is given, it must have at least the same size
 * as `choices`. If omitted, each choice will have same probability.
 *
 * See: `weightedRandom()`
 *
 * ```
 * transduce(take(1000), frequencies(), choices("abcd", [1, 0.5, 0.25, 0.125]))
 * // Map { 'c' => 132, 'a' => 545, 'b' => 251, 'd' => 72 }
 * ```
 *
 * @param choices
 * @param weights
 */
function choices(choices, weights) {
    return repeatedly_1.repeatedly(weights ?
        weighted_random_1.weightedRandom(choices, weights) :
        () => choices[(Math.random() * choices.length) | 0]);
}
exports.choices = choices;

},{"../func/weighted-random":"../../../node_modules/@thi.ng/transducers/func/weighted-random.js","./repeatedly":"../../../node_modules/@thi.ng/transducers/iter/repeatedly.js"}],"../../../node_modules/@thi.ng/transducers/func/random-id.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const choices_1 = require("../iter/choices");
const take_1 = require("../xform/take");
/**
 * Generates and returns a random string of `len` characters (default
 * 4), plus optional given `prefix` and using only provided `syms`
 * characters (default lowercase a-z).
 *
 * ```
 * randomID()
 * "qgdt"
 *
 * randomID(8, "id-", "0123456789ABCDEF")
 * "id-94EF6E1A"
 * ```
 *
 * @param len
 * @param prefix
 * @param syms
 */
exports.randomID = (len = 4, prefix = "", syms = "abcdefghijklmnopqrstuvwxyz") => [prefix, ...take_1.take(len, choices_1.choices(syms))].join("");

},{"../iter/choices":"../../../node_modules/@thi.ng/transducers/iter/choices.js","../xform/take":"../../../node_modules/@thi.ng/transducers/xform/take.js"}],"../../../node_modules/@thi.ng/transducers/iter/as-iterable.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helper function to (re)provide given iterable in iterator form.
 *
 * @param src
 */
function* asIterable(src) {
    yield* src;
}
exports.asIterable = asIterable;

},{}],"../../../node_modules/@thi.ng/transducers/iter/concat.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ensure_iterable_1 = require("../func/ensure-iterable");
/**
 * Yields iterator producing concatenation of given iterables.
 * Undefined & null inputs are silently ignored, however any
 * such values produced or contained in an input will remain.
 *
 * ```
 * [...concat([1, 2, 3], null, [4, 5])]
 * // [ 1, 2, 3, 4, 5 ]
 *
 * [...concat([1, 2, 3, undefined], null, [4, 5])]
 * // [ 1, 2, 3, undefined, 4, 5 ]
 * ```
 *
 * @param xs
 */
function* concat(...xs) {
    for (let x of xs) {
        x != null && (yield* ensure_iterable_1.ensureIterable(x));
    }
}
exports.concat = concat;

},{"../func/ensure-iterable":"../../../node_modules/@thi.ng/transducers/func/ensure-iterable.js"}],"../../../node_modules/@thi.ng/transducers/iter/cycle.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* cycle(input) {
    let cache = [];
    for (let i of input) {
        cache.push(i);
        yield i;
    }
    if (cache.length > 0) {
        while (true) {
            yield* cache;
        }
    }
}
exports.cycle = cycle;

},{}],"../../../node_modules/@thi.ng/transducers/iter/iterate.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* iterate(fn, seed) {
    while (true) {
        yield seed;
        seed = fn(seed);
    }
}
exports.iterate = iterate;

},{}],"../../../node_modules/@thi.ng/transducers/iter/keys.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* keys(x) {
    for (let k in x) {
        if (x.hasOwnProperty(k)) {
            yield k;
        }
    }
}
exports.keys = keys;

},{}],"../../../node_modules/@thi.ng/transducers/iter/norm-range.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Yields sequence of `n+1` monotonically increasing numbers in the
 * closed interval (0.0 .. 1.0). If `n <= 0`, yields nothing.
 *
 * ```
 * [...normRange(4)]
 * // [0, 0.25, 0.5, 0.75, 1.0]
 * ```
 *
 * @param n number of steps
 * @param inclLast include last value (i.e. `1.0`)
 */
function* normRange(n, inclLast = true) {
    if (n > 0) {
        for (let i = 0, m = inclLast ? n + 1 : n; i < m; i++) {
            yield i / n;
        }
    }
}
exports.normRange = normRange;

},{}],"../../../node_modules/@thi.ng/transducers/iter/pairs.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* pairs(x) {
    for (let k in x) {
        if (x.hasOwnProperty(k)) {
            yield [k, x[k]];
        }
    }
}
exports.pairs = pairs;

},{}],"../../../node_modules/@thi.ng/transducers/iter/permutations.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arguments_1 = require("@thi.ng/errors/illegal-arguments");
const ensure_array_1 = require("../func/ensure-array");
const range_1 = require("./range");
function* permutations(...src) {
    const n = src.length - 1;
    if (n < 0) {
        return;
    }
    const step = new Array(n + 1).fill(0);
    const realized = src.map(ensure_array_1.ensureArrayLike);
    const total = realized.reduce((acc, x) => acc * x.length, 1);
    for (let i = 0; i < total; i++) {
        const tuple = [];
        for (let j = n; j >= 0; j--) {
            const r = realized[j];
            let s = step[j];
            if (s === r.length) {
                step[j] = s = 0;
                j > 0 && (step[j - 1]++);
            }
            tuple[j] = r[s];
        }
        step[n]++;
        yield tuple;
    }
}
exports.permutations = permutations;
/**
 * Iterator yielding the Cartesian Product for `n` items of `m` values
 * each. If `m` is not given, defaults to value of `n`. The range of `m`
 * is `0..m-1`. The optional `offsets` array can be used to define start
 * values for each dimension.
 *
 * ```
 * [...permutationsN(2)]
 * // [ [0, 0], [0, 1], [1, 0], [1, 1] ]
 *
 * [...permutationsN(2, 3)]
 * // [ [0, 0], [0, 1], [0, 2],
 * //   [1, 0], [1, 1], [1, 2],
 * //   [2, 0], [2, 1], [2, 2] ]
 *
 * [...permutationsN(2, 3, [10, 20])]
 * // [ [ 10, 20 ], [ 10, 21 ], [ 11, 20 ], [ 11, 21 ] ]
 * ```
 *
 * @param n
 * @param m
 * @param offsets
 */
function permutationsN(n, m = n, offsets) {
    if (offsets && offsets.length < n) {
        illegal_arguments_1.illegalArgs(`insufficient offsets, got ${offsets.length}, needed ${n}`);
    }
    const seqs = [];
    while (--n >= 0) {
        const o = offsets ? offsets[n] : 0;
        seqs[n] = range_1.range(o, o + m);
    }
    return permutations.apply(null, seqs);
}
exports.permutationsN = permutationsN;

},{"@thi.ng/errors/illegal-arguments":"../../../node_modules/@thi.ng/errors/illegal-arguments.js","../func/ensure-array":"../../../node_modules/@thi.ng/transducers/func/ensure-array.js","./range":"../../../node_modules/@thi.ng/transducers/iter/range.js"}],"../../../node_modules/@thi.ng/transducers/iter/range3d.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const illegal_arity_1 = require("@thi.ng/errors/illegal-arity");
const range_1 = require("./range");
function* range3d(...args) {
    let fromX, toX, fromY, toY, fromZ, toZ, stepX, stepY, stepZ;
    switch (args.length) {
        case 9:
            stepX = args[6];
            stepY = args[7];
            stepZ = args[8];
        case 6:
            [fromX, toX, fromY, toY, fromZ, toZ] = args;
            break;
        case 3:
            [toX, toY, toZ] = args;
            fromX = fromY = fromZ = 0;
            break;
        default:
            illegal_arity_1.illegalArity(args.length);
    }
    const rx = range_1.range(fromX, toX, stepX);
    const ry = range_1.range(fromY, toY, stepY);
    for (let z of range_1.range(fromZ, toZ, stepZ)) {
        for (let y of ry) {
            for (let x of rx) {
                yield [x, y, z];
            }
        }
    }
}
exports.range3d = range3d;

},{"@thi.ng/errors/illegal-arity":"../../../node_modules/@thi.ng/errors/illegal-arity.js","./range":"../../../node_modules/@thi.ng/transducers/iter/range.js"}],"../../../node_modules/@thi.ng/transducers/iter/reverse.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ensure_array_1 = require("../func/ensure-array");
/**
 * Yields iterator which consumes input and yield its values in reverse
 * order. Important: Input MUST be finite.
 *
 * ```
 * [...tx.reverse("hello world")]
 * // [ "d", "l", "r", "o", "w", " ", "o", "l", "l", "e", "h" ]
 * ```
 *
 * @param input
 */
function* reverse(input) {
    const _input = ensure_array_1.ensureArray(input);
    let n = _input.length;
    while (--n >= 0) {
        yield _input[n];
    }
}
exports.reverse = reverse;

},{"../func/ensure-array":"../../../node_modules/@thi.ng/transducers/func/ensure-array.js"}],"../../../node_modules/@thi.ng/transducers/iter/vals.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* vals(x) {
    for (let k in x) {
        if (x.hasOwnProperty(k)) {
            yield x[k];
        }
    }
}
exports.vals = vals;

},{}],"../../../node_modules/@thi.ng/transducers/index.js":[function(require,module,exports) {
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./iterator"));
__export(require("./reduce"));
__export(require("./reduced"));
__export(require("./run"));
__export(require("./step"));
__export(require("./transduce"));
__export(require("./rfn/add"));
__export(require("./rfn/assoc-map"));
__export(require("./rfn/assoc-obj"));
__export(require("./rfn/conj"));
__export(require("./rfn/count"));
__export(require("./rfn/div"));
__export(require("./rfn/every"));
__export(require("./rfn/fill"));
__export(require("./rfn/frequencies"));
__export(require("./rfn/group-binary"));
__export(require("./rfn/group-by-map"));
__export(require("./rfn/group-by-obj"));
__export(require("./rfn/last"));
__export(require("./rfn/max-compare"));
__export(require("./rfn/max"));
__export(require("./rfn/mean"));
__export(require("./rfn/min-compare"));
__export(require("./rfn/min"));
__export(require("./rfn/mul"));
__export(require("./rfn/push-copy"));
__export(require("./rfn/push"));
__export(require("./rfn/reductions"));
__export(require("./rfn/some"));
__export(require("./rfn/str"));
__export(require("./rfn/sub"));
__export(require("./xform/base64"));
__export(require("./xform/benchmark"));
__export(require("./xform/bits"));
__export(require("./xform/cat"));
__export(require("./xform/convolve"));
__export(require("./xform/dedupe"));
__export(require("./xform/delayed"));
__export(require("./xform/distinct"));
__export(require("./xform/drop-nth"));
__export(require("./xform/drop-while"));
__export(require("./xform/drop"));
__export(require("./xform/duplicate"));
__export(require("./xform/filter"));
__export(require("./xform/filter-fuzzy"));
__export(require("./xform/flatten-with"));
__export(require("./xform/flatten"));
__export(require("./xform/hex-dump"));
__export(require("./xform/indexed"));
__export(require("./xform/interleave"));
__export(require("./xform/interpose"));
__export(require("./xform/keep"));
__export(require("./xform/labeled"));
__export(require("./xform/map-deep"));
__export(require("./xform/map-indexed"));
__export(require("./xform/map-keys"));
__export(require("./xform/map-nth"));
__export(require("./xform/map-vals"));
__export(require("./xform/map"));
__export(require("./xform/mapcat"));
__export(require("./xform/match-first"));
__export(require("./xform/match-last"));
__export(require("./xform/moving-average"));
__export(require("./xform/moving-median"));
__export(require("./xform/multiplex"));
__export(require("./xform/multiplex-obj"));
__export(require("./xform/noop"));
__export(require("./xform/pad-last"));
__export(require("./xform/page"));
__export(require("./xform/partition-bits"));
__export(require("./xform/partition-by"));
__export(require("./xform/partition-of"));
__export(require("./xform/partition-sort"));
__export(require("./xform/partition-sync"));
__export(require("./xform/partition"));
__export(require("./xform/pluck"));
__export(require("./xform/rename"));
__export(require("./xform/sample"));
__export(require("./xform/scan"));
__export(require("./xform/select-keys"));
__export(require("./xform/side-effect"));
__export(require("./xform/sliding-window"));
__export(require("./xform/stream-shuffle"));
__export(require("./xform/stream-sort"));
__export(require("./xform/struct"));
__export(require("./xform/swizzle"));
__export(require("./xform/take-nth"));
__export(require("./xform/take-last"));
__export(require("./xform/take-while"));
__export(require("./xform/take"));
__export(require("./xform/throttle"));
__export(require("./xform/throttle-time"));
__export(require("./xform/trace"));
__export(require("./xform/utf8"));
__export(require("./xform/word-wrap"));
__export(require("./func/binary-search"));
__export(require("./func/comp"));
__export(require("./func/compr"));
__export(require("./func/constantly"));
__export(require("./func/deep-transform"));
__export(require("./func/delay"));
__export(require("./func/ensure-array"));
__export(require("./func/ensure-iterable"));
__export(require("./func/even"));
__export(require("./func/fuzzy-match"));
__export(require("./func/hex"));
__export(require("./func/identity"));
__export(require("./func/juxt"));
__export(require("./func/juxtr"));
__export(require("./func/key-selector"));
__export(require("./func/lookup"));
__export(require("./func/odd"));
__export(require("./func/peek"));
__export(require("./func/random-id"));
__export(require("./func/renamer"));
__export(require("./func/swizzler"));
__export(require("./func/weighted-random"));
__export(require("./iter/as-iterable"));
__export(require("./iter/choices"));
__export(require("./iter/concat"));
__export(require("./iter/cycle"));
__export(require("./iter/iterate"));
__export(require("./iter/keys"));
__export(require("./iter/norm-range"));
__export(require("./iter/pairs"));
__export(require("./iter/permutations"));
__export(require("./iter/range"));
__export(require("./iter/range2d"));
__export(require("./iter/range3d"));
__export(require("./iter/repeat"));
__export(require("./iter/repeatedly"));
__export(require("./iter/reverse"));
__export(require("./iter/tuples"));
__export(require("./iter/vals"));
__export(require("./iter/wrap"));

},{"./iterator":"../../../node_modules/@thi.ng/transducers/iterator.js","./reduce":"../../../node_modules/@thi.ng/transducers/reduce.js","./reduced":"../../../node_modules/@thi.ng/transducers/reduced.js","./run":"../../../node_modules/@thi.ng/transducers/run.js","./step":"../../../node_modules/@thi.ng/transducers/step.js","./transduce":"../../../node_modules/@thi.ng/transducers/transduce.js","./rfn/add":"../../../node_modules/@thi.ng/transducers/rfn/add.js","./rfn/assoc-map":"../../../node_modules/@thi.ng/transducers/rfn/assoc-map.js","./rfn/assoc-obj":"../../../node_modules/@thi.ng/transducers/rfn/assoc-obj.js","./rfn/conj":"../../../node_modules/@thi.ng/transducers/rfn/conj.js","./rfn/count":"../../../node_modules/@thi.ng/transducers/rfn/count.js","./rfn/div":"../../../node_modules/@thi.ng/transducers/rfn/div.js","./rfn/every":"../../../node_modules/@thi.ng/transducers/rfn/every.js","./rfn/fill":"../../../node_modules/@thi.ng/transducers/rfn/fill.js","./rfn/frequencies":"../../../node_modules/@thi.ng/transducers/rfn/frequencies.js","./rfn/group-binary":"../../../node_modules/@thi.ng/transducers/rfn/group-binary.js","./rfn/group-by-map":"../../../node_modules/@thi.ng/transducers/rfn/group-by-map.js","./rfn/group-by-obj":"../../../node_modules/@thi.ng/transducers/rfn/group-by-obj.js","./rfn/last":"../../../node_modules/@thi.ng/transducers/rfn/last.js","./rfn/max-compare":"../../../node_modules/@thi.ng/transducers/rfn/max-compare.js","./rfn/max":"../../../node_modules/@thi.ng/transducers/rfn/max.js","./rfn/mean":"../../../node_modules/@thi.ng/transducers/rfn/mean.js","./rfn/min-compare":"../../../node_modules/@thi.ng/transducers/rfn/min-compare.js","./rfn/min":"../../../node_modules/@thi.ng/transducers/rfn/min.js","./rfn/mul":"../../../node_modules/@thi.ng/transducers/rfn/mul.js","./rfn/push-copy":"../../../node_modules/@thi.ng/transducers/rfn/push-copy.js","./rfn/push":"../../../node_modules/@thi.ng/transducers/rfn/push.js","./rfn/reductions":"../../../node_modules/@thi.ng/transducers/rfn/reductions.js","./rfn/some":"../../../node_modules/@thi.ng/transducers/rfn/some.js","./rfn/str":"../../../node_modules/@thi.ng/transducers/rfn/str.js","./rfn/sub":"../../../node_modules/@thi.ng/transducers/rfn/sub.js","./xform/base64":"../../../node_modules/@thi.ng/transducers/xform/base64.js","./xform/benchmark":"../../../node_modules/@thi.ng/transducers/xform/benchmark.js","./xform/bits":"../../../node_modules/@thi.ng/transducers/xform/bits.js","./xform/cat":"../../../node_modules/@thi.ng/transducers/xform/cat.js","./xform/convolve":"../../../node_modules/@thi.ng/transducers/xform/convolve.js","./xform/dedupe":"../../../node_modules/@thi.ng/transducers/xform/dedupe.js","./xform/delayed":"../../../node_modules/@thi.ng/transducers/xform/delayed.js","./xform/distinct":"../../../node_modules/@thi.ng/transducers/xform/distinct.js","./xform/drop-nth":"../../../node_modules/@thi.ng/transducers/xform/drop-nth.js","./xform/drop-while":"../../../node_modules/@thi.ng/transducers/xform/drop-while.js","./xform/drop":"../../../node_modules/@thi.ng/transducers/xform/drop.js","./xform/duplicate":"../../../node_modules/@thi.ng/transducers/xform/duplicate.js","./xform/filter":"../../../node_modules/@thi.ng/transducers/xform/filter.js","./xform/filter-fuzzy":"../../../node_modules/@thi.ng/transducers/xform/filter-fuzzy.js","./xform/flatten-with":"../../../node_modules/@thi.ng/transducers/xform/flatten-with.js","./xform/flatten":"../../../node_modules/@thi.ng/transducers/xform/flatten.js","./xform/hex-dump":"../../../node_modules/@thi.ng/transducers/xform/hex-dump.js","./xform/indexed":"../../../node_modules/@thi.ng/transducers/xform/indexed.js","./xform/interleave":"../../../node_modules/@thi.ng/transducers/xform/interleave.js","./xform/interpose":"../../../node_modules/@thi.ng/transducers/xform/interpose.js","./xform/keep":"../../../node_modules/@thi.ng/transducers/xform/keep.js","./xform/labeled":"../../../node_modules/@thi.ng/transducers/xform/labeled.js","./xform/map-deep":"../../../node_modules/@thi.ng/transducers/xform/map-deep.js","./xform/map-indexed":"../../../node_modules/@thi.ng/transducers/xform/map-indexed.js","./xform/map-keys":"../../../node_modules/@thi.ng/transducers/xform/map-keys.js","./xform/map-nth":"../../../node_modules/@thi.ng/transducers/xform/map-nth.js","./xform/map-vals":"../../../node_modules/@thi.ng/transducers/xform/map-vals.js","./xform/map":"../../../node_modules/@thi.ng/transducers/xform/map.js","./xform/mapcat":"../../../node_modules/@thi.ng/transducers/xform/mapcat.js","./xform/match-first":"../../../node_modules/@thi.ng/transducers/xform/match-first.js","./xform/match-last":"../../../node_modules/@thi.ng/transducers/xform/match-last.js","./xform/moving-average":"../../../node_modules/@thi.ng/transducers/xform/moving-average.js","./xform/moving-median":"../../../node_modules/@thi.ng/transducers/xform/moving-median.js","./xform/multiplex":"../../../node_modules/@thi.ng/transducers/xform/multiplex.js","./xform/multiplex-obj":"../../../node_modules/@thi.ng/transducers/xform/multiplex-obj.js","./xform/noop":"../../../node_modules/@thi.ng/transducers/xform/noop.js","./xform/pad-last":"../../../node_modules/@thi.ng/transducers/xform/pad-last.js","./xform/page":"../../../node_modules/@thi.ng/transducers/xform/page.js","./xform/partition-bits":"../../../node_modules/@thi.ng/transducers/xform/partition-bits.js","./xform/partition-by":"../../../node_modules/@thi.ng/transducers/xform/partition-by.js","./xform/partition-of":"../../../node_modules/@thi.ng/transducers/xform/partition-of.js","./xform/partition-sort":"../../../node_modules/@thi.ng/transducers/xform/partition-sort.js","./xform/partition-sync":"../../../node_modules/@thi.ng/transducers/xform/partition-sync.js","./xform/partition":"../../../node_modules/@thi.ng/transducers/xform/partition.js","./xform/pluck":"../../../node_modules/@thi.ng/transducers/xform/pluck.js","./xform/rename":"../../../node_modules/@thi.ng/transducers/xform/rename.js","./xform/sample":"../../../node_modules/@thi.ng/transducers/xform/sample.js","./xform/scan":"../../../node_modules/@thi.ng/transducers/xform/scan.js","./xform/select-keys":"../../../node_modules/@thi.ng/transducers/xform/select-keys.js","./xform/side-effect":"../../../node_modules/@thi.ng/transducers/xform/side-effect.js","./xform/sliding-window":"../../../node_modules/@thi.ng/transducers/xform/sliding-window.js","./xform/stream-shuffle":"../../../node_modules/@thi.ng/transducers/xform/stream-shuffle.js","./xform/stream-sort":"../../../node_modules/@thi.ng/transducers/xform/stream-sort.js","./xform/struct":"../../../node_modules/@thi.ng/transducers/xform/struct.js","./xform/swizzle":"../../../node_modules/@thi.ng/transducers/xform/swizzle.js","./xform/take-nth":"../../../node_modules/@thi.ng/transducers/xform/take-nth.js","./xform/take-last":"../../../node_modules/@thi.ng/transducers/xform/take-last.js","./xform/take-while":"../../../node_modules/@thi.ng/transducers/xform/take-while.js","./xform/take":"../../../node_modules/@thi.ng/transducers/xform/take.js","./xform/throttle":"../../../node_modules/@thi.ng/transducers/xform/throttle.js","./xform/throttle-time":"../../../node_modules/@thi.ng/transducers/xform/throttle-time.js","./xform/trace":"../../../node_modules/@thi.ng/transducers/xform/trace.js","./xform/utf8":"../../../node_modules/@thi.ng/transducers/xform/utf8.js","./xform/word-wrap":"../../../node_modules/@thi.ng/transducers/xform/word-wrap.js","./func/binary-search":"../../../node_modules/@thi.ng/transducers/func/binary-search.js","./func/comp":"../../../node_modules/@thi.ng/transducers/func/comp.js","./func/compr":"../../../node_modules/@thi.ng/transducers/func/compr.js","./func/constantly":"../../../node_modules/@thi.ng/transducers/func/constantly.js","./func/deep-transform":"../../../node_modules/@thi.ng/transducers/func/deep-transform.js","./func/delay":"../../../node_modules/@thi.ng/transducers/func/delay.js","./func/ensure-array":"../../../node_modules/@thi.ng/transducers/func/ensure-array.js","./func/ensure-iterable":"../../../node_modules/@thi.ng/transducers/func/ensure-iterable.js","./func/even":"../../../node_modules/@thi.ng/transducers/func/even.js","./func/fuzzy-match":"../../../node_modules/@thi.ng/transducers/func/fuzzy-match.js","./func/hex":"../../../node_modules/@thi.ng/transducers/func/hex.js","./func/identity":"../../../node_modules/@thi.ng/transducers/func/identity.js","./func/juxt":"../../../node_modules/@thi.ng/transducers/func/juxt.js","./func/juxtr":"../../../node_modules/@thi.ng/transducers/func/juxtr.js","./func/key-selector":"../../../node_modules/@thi.ng/transducers/func/key-selector.js","./func/lookup":"../../../node_modules/@thi.ng/transducers/func/lookup.js","./func/odd":"../../../node_modules/@thi.ng/transducers/func/odd.js","./func/peek":"../../../node_modules/@thi.ng/transducers/func/peek.js","./func/random-id":"../../../node_modules/@thi.ng/transducers/func/random-id.js","./func/renamer":"../../../node_modules/@thi.ng/transducers/func/renamer.js","./func/swizzler":"../../../node_modules/@thi.ng/transducers/func/swizzler.js","./func/weighted-random":"../../../node_modules/@thi.ng/transducers/func/weighted-random.js","./iter/as-iterable":"../../../node_modules/@thi.ng/transducers/iter/as-iterable.js","./iter/choices":"../../../node_modules/@thi.ng/transducers/iter/choices.js","./iter/concat":"../../../node_modules/@thi.ng/transducers/iter/concat.js","./iter/cycle":"../../../node_modules/@thi.ng/transducers/iter/cycle.js","./iter/iterate":"../../../node_modules/@thi.ng/transducers/iter/iterate.js","./iter/keys":"../../../node_modules/@thi.ng/transducers/iter/keys.js","./iter/norm-range":"../../../node_modules/@thi.ng/transducers/iter/norm-range.js","./iter/pairs":"../../../node_modules/@thi.ng/transducers/iter/pairs.js","./iter/permutations":"../../../node_modules/@thi.ng/transducers/iter/permutations.js","./iter/range":"../../../node_modules/@thi.ng/transducers/iter/range.js","./iter/range2d":"../../../node_modules/@thi.ng/transducers/iter/range2d.js","./iter/range3d":"../../../node_modules/@thi.ng/transducers/iter/range3d.js","./iter/repeat":"../../../node_modules/@thi.ng/transducers/iter/repeat.js","./iter/repeatedly":"../../../node_modules/@thi.ng/transducers/iter/repeatedly.js","./iter/reverse":"../../../node_modules/@thi.ng/transducers/iter/reverse.js","./iter/tuples":"../../../node_modules/@thi.ng/transducers/iter/tuples.js","./iter/vals":"../../../node_modules/@thi.ng/transducers/iter/vals.js","./iter/wrap":"../../../node_modules/@thi.ng/transducers/iter/wrap.js"}],"../../../node_modules/@tstackgl/geometry/dist/calc/extrude/extrude.js":[function(require,module,exports) {
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import * as tx from '@thi.ng/transducers'
var earcut_1 = __importDefault(require("earcut"));
var get_centroid_1 = require("../get-centroid");
var edge_1 = require("../../edge");
var pivot_1 = require("../pivot");
var transducers_1 = require("@thi.ng/transducers");
function triangulate(vertices, holes, dimensions) {
    if (dimensions === void 0) { dimensions = 2; }
    return earcut_1.default(vertices, holes, dimensions);
}
var identity = function (x) { return x; };
function getSideCells(segmentsTopCells, segmentsBottomCells) {
    return __spread(transducers_1.mapcat(identity, transducers_1.map(function (_a) {
        var _b = __read(_a, 2), segment1 = _b[0], segment2 = _b[1];
        return [
            [segment2[1], segment2[0], segment1[0]],
            [segment2[1], segment1[0], segment1[1]],
        ];
    }, transducers_1.tuples(segmentsTopCells, segmentsBottomCells))));
}
exports.getSideCells = getSideCells;
function extrude(inputPolygons, opts) {
    if (opts === void 0) { opts = {
        depthTop: 2,
        depthBottom: -1,
        bevelTop: 0.2,
        bevelBottom: 0.9,
    }; }
    var newPolygon = inputPolygons;
    var hasHoles = newPolygon.length > 1;
    var _a = earcut_1.default.flatten(newPolygon), vertices = _a.vertices, holes = _a.holes, dimensions = _a.dimensions;
    if (dimensions !== 2) {
        throw new Error('Only 2D polygon points are supported');
    }
    // convertToClockwise(vertices, holes) // TODO: does not seems to work well, actually
    var indices = triangulate(vertices, holes, dimensions);
    var depthTop = opts.depthTop, depthBottom = opts.depthBottom, bevelTop = opts.bevelTop, bevelBottom = opts.bevelBottom;
    var center = get_centroid_1.getCentroid(inputPolygons[0]);
    var centers = [__spread(center, [depthTop]), __spread(center, [depthBottom])];
    // positions is an array of the faces extruded:
    // once with z = depthTop, once with z = depthBottom
    var nPos = vertices.length;
    var xy = transducers_1.partition(2, transducers_1.wrap(vertices, nPos, false));
    var offsetsDepth = transducers_1.concat(transducers_1.repeat(depthTop, nPos / 2), transducers_1.repeat(depthBottom, nPos / 2));
    var positions = __spread(transducers_1.map(function (_a) {
        var _b = __read(_a, 2), _c = __read(_b[0], 2), x = _c[0], y = _c[1], z = _b[1];
        return [x, y, z];
    }, transducers_1.tuples(xy, offsetsDepth)));
    // TODO: bevel should be done on 2d polygon actually, and triangulate twice for bottom and top, shit!
    // apply bevelTop to top external polygon and bevelBottom to bottom external polygon
    for (var i = 0; i < inputPolygons[0].length; i++) {
        positions[i] = pivot_1.scaleAroundCenter3(positions[i], positions[i], centers[0], bevelTop);
    }
    for (var i = positions.length / 2; i < positions.length / 2 + inputPolygons[0].length; i++) {
        positions[i] = pivot_1.scaleAroundCenter3(positions[i], positions[i], centers[1], bevelBottom);
    }
    var nCell = indices.length / 3;
    var facesTop = __spread(transducers_1.partition(3, indices));
    // notice that for normals directions the bottom face index has to be reversed: that's why `.slice().reverse()`
    var facesBottom = transducers_1.map(function (face) { return face.slice().reverse(); }, facesTop);
    var facesTopBottom = transducers_1.concat(facesTop, facesBottom);
    var offsetsIndex = transducers_1.concat(transducers_1.repeat(0, nCell), transducers_1.repeat(nPos / 2, nCell));
    var cells = __spread(transducers_1.map(function (_a) {
        var _b = __read(_a, 2), face = _b[0], n = _b[1];
        return face.map(function (f) { return f + n; });
    }, transducers_1.tuples(facesTopBottom, offsetsIndex)));
    var sideCells = [];
    if (!hasHoles) {
        var len = inputPolygons[0].length * 2;
        var flatCells = __spread(transducers_1.range(len));
        var segmentsTopCells = edge_1.polygonToSegments(transducers_1.take(len / 2, flatCells));
        var segmentsBottomCells = edge_1.polygonToSegments(transducers_1.takeLast(len / 2, flatCells));
        sideCells = getSideCells(segmentsTopCells, segmentsBottomCells);
    }
    else {
        var polygonsIdx = [
            transducers_1.range(0, inputPolygons[0].length),
            transducers_1.range(positions.length / 2, positions.length / 2 + inputPolygons[0].length),
        ];
        var segmentsTopCells = edge_1.polygonToSegments(polygonsIdx[0]);
        var segmentsBottomCells = edge_1.polygonToSegments(polygonsIdx[1]);
        sideCells = getSideCells(segmentsTopCells, segmentsBottomCells);
        // TODO: refactor with transducers
        var cursor_1 = inputPolygons[0].length;
        var holesIdx = inputPolygons.slice(1).map(function (hole) {
            var ret = [
                transducers_1.range(cursor_1, cursor_1 + hole.length),
                transducers_1.range(positions.length / 2 + cursor_1, positions.length / 2 + cursor_1 + hole.length),
            ];
            cursor_1 += hole.length;
            return ret;
        });
        var holesSideCells = holesIdx.reduce(function (acc, holeIdx) {
            var segmentsTopCells = edge_1.polygonToSegments(holeIdx[0]);
            var segmentsBottomCells = edge_1.polygonToSegments(holeIdx[1]);
            var holeSideCells = getSideCells(segmentsTopCells, segmentsBottomCells);
            acc.push.apply(acc, __spread(holeSideCells));
            return acc;
        }, []);
        sideCells.push.apply(sideCells, __spread(holesSideCells));
    }
    cells.push.apply(cells, __spread(sideCells));
    return {
        positions: positions,
        cells: cells,
    };
}
exports.extrude = extrude;

},{"earcut":"../../../node_modules/earcut/src/earcut.js","../get-centroid":"../../../node_modules/@tstackgl/geometry/dist/calc/get-centroid.js","../../edge":"../../../node_modules/@tstackgl/geometry/dist/edge.js","../pivot":"../../../node_modules/@tstackgl/geometry/dist/calc/pivot.js","@thi.ng/transducers":"../../../node_modules/@thi.ng/transducers/index.js"}],"../../../node_modules/@tstackgl/geometry/dist/shape/circle.js":[function(require,module,exports) {
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var tr = __importStar(require("@thi.ng/transducers"));
function pointInCircle(t, radius, center) {
    if (center === void 0) { center = [0, 0]; }
    return [Math.cos(t) * radius + center[0], Math.sin(t) * radius + center[1]];
}
exports.pointInCircle = pointInCircle;
function circleShape(radius, center, density) {
    if (center === void 0) { center = [0, 0]; }
    if (density === void 0) { density = 10; }
    return __spread(tr.map(function (i) {
        var delta = (i / density) * Math.PI * 2;
        return pointInCircle(delta, radius, center);
    }, tr.range(density)));
}
exports.circleShape = circleShape;

},{"@thi.ng/transducers":"../../../node_modules/@thi.ng/transducers/index.js"}],"../../../node_modules/@tstackgl/geometry/dist/index.js":[function(require,module,exports) {
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./calc/get-centroid"));
__export(require("./calc/extrude/extrude"));
__export(require("./shape/circle"));

},{"./calc/get-centroid":"../../../node_modules/@tstackgl/geometry/dist/calc/get-centroid.js","./calc/extrude/extrude":"../../../node_modules/@tstackgl/geometry/dist/calc/extrude/extrude.js","./shape/circle":"../../../node_modules/@tstackgl/geometry/dist/shape/circle.js"}],"../../../node_modules/@tstackgl/regl-draw/dist/draw-mesh-normals.js":[function(require,module,exports) {
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var normals_1 = require("normals");
var geometry_1 = require("@tstackgl/geometry");
var gl_vec3_1 = __importDefault(require("gl-vec3"));
var transducers_1 = require("@thi.ng/transducers");
var vert = "\nprecision mediump float;\nuniform mat4 projection, view;\nattribute vec3 position, color;\nvarying vec3 vColor;\nvoid main () {\n  vec4 mpos = projection * view * vec4(position, 1.0);\n  gl_Position = mpos;\n  vColor = color;\n}";
var frag = "\nprecision mediump float;\nvarying vec3 vColor;\nvoid main () {\n  gl_FragColor = vec4(vColor, 1.0);\n}";
function createDrawMeshNormalLines(regl, mesh, len) {
    if (len === void 0) { len = 1; }
    var faceNormalsArray = normals_1.faceNormals(mesh.cells, mesh.positions);
    var colors = __spread(transducers_1.map(function (x) { return [x[0] / 2 + 0.5, x[1] / 2 + 0.5, x[2] / 2 + 0.5]; }, transducers_1.mapcat(function (x) { return [x, x]; }, faceNormalsArray)));
    console.log({ colors: colors });
    var centersArray = geometry_1.getCentroidFromCells(mesh.cells, mesh.positions);
    var p1Array = centersArray.map(function (p0, i) {
        var out = gl_vec3_1.default.create();
        var normalScaled = gl_vec3_1.default.scale(out, faceNormalsArray[i], len);
        return gl_vec3_1.default.add(out, p0, normalScaled);
    });
    var positions = __spread(transducers_1.mapcat(function (x) { return x; }, transducers_1.tuples(centersArray, p1Array)));
    var cellsLen = centersArray.length * 2;
    var cells = __spread(transducers_1.partition(2, __spread(transducers_1.range(cellsLen))));
    var draw = regl({
        frag: frag,
        vert: vert,
        attributes: {
            position: positions,
            color: colors,
        },
        uniforms: {},
        elements: cells,
    });
    return {
        draw: draw,
    };
}
exports.createDrawMeshNormalLines = createDrawMeshNormalLines;

},{"normals":"../../../node_modules/normals/normals.js","@tstackgl/geometry":"../../../node_modules/@tstackgl/geometry/dist/index.js","gl-vec3":"../../../node_modules/gl-vec3/index.js","@thi.ng/transducers":"../../../node_modules/@thi.ng/transducers/index.js"}],"../../../node_modules/@tstackgl/regl-draw/dist/draw-mesh-unicolor.js":[function(require,module,exports) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vert = "\nprecision mediump float;\nuniform mat4 projection, view;\nattribute vec3 position;\nvoid main () {\n  vec4 mpos = projection * view * vec4(position, 1.0);\n  gl_Position = mpos;\n}";
var frag = "\nprecision mediump float;\nuniform vec4 color;\nvoid main () {\n  gl_FragColor = color;\n}";
function createDrawMeshUnicolor(regl, mesh) {
    var draw = regl({
        frag: frag,
        vert: vert,
        attributes: {
            position: function () { return mesh.positions; },
        },
        uniforms: {
            color: regl.prop('color'),
        },
        elements: function () { return mesh.cells; },
    });
    return {
        draw: draw,
    };
}
exports.createDrawMeshUnicolor = createDrawMeshUnicolor;

},{}],"../../../node_modules/@tstackgl/regl-draw/dist/draw-mesh-wireframe.js":[function(require,module,exports) {
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var transducers_1 = require("@thi.ng/transducers");
var vert = "\nprecision mediump float;\nuniform mat4 projection, view;\nattribute vec3 position;\nvoid main () {\n  vec4 mpos = projection * view * vec4(position, 1.0);\n  gl_Position = mpos;\n}";
var frag = "\nprecision mediump float;\nuniform vec4 color;\nvoid main () {\n  gl_FragColor = color;\n}";
function createDrawMeshWireframe(regl, mesh) {
    // const input: Vec3[] = [[1, 0, 3], [3, 2, 1], [5, 4, 7]]
    // expected = "[[[1,0],[0,3],[3,1]],[[3,2],[2,1],[1,3]],[[5,4],[4,7],[7,5]]]"
    var triangleToSegments = function (face) { return __spread(transducers_1.partition(2, 1, transducers_1.wrap(face, 1, false, true))); };
    var wireframeCells = __spread(transducers_1.map(triangleToSegments, mesh.cells));
    var draw = regl({
        frag: frag,
        vert: vert,
        attributes: {
            position: function () { return mesh.positions; },
        },
        uniforms: {
            color: regl.prop('color'),
        },
        elements: wireframeCells,
        primitive: 'lines',
    });
    return {
        draw: draw,
    };
}
exports.createDrawMeshWireframe = createDrawMeshWireframe;

},{"@thi.ng/transducers":"../../../node_modules/@thi.ng/transducers/index.js"}],"../../../node_modules/@tstackgl/regl-draw/dist/index.js":[function(require,module,exports) {
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./frameCatch"));
__export(require("./regl-axes"));
__export(require("./draw-debug"));
__export(require("./draw-mesh-normals"));
__export(require("./draw-mesh-unicolor"));
__export(require("./draw-mesh-wireframe"));

},{"./frameCatch":"../../../node_modules/@tstackgl/regl-draw/dist/frameCatch.js","./regl-axes":"../../../node_modules/@tstackgl/regl-draw/dist/regl-axes.js","./draw-debug":"../../../node_modules/@tstackgl/regl-draw/dist/draw-debug.js","./draw-mesh-normals":"../../../node_modules/@tstackgl/regl-draw/dist/draw-mesh-normals.js","./draw-mesh-unicolor":"../../../node_modules/@tstackgl/regl-draw/dist/draw-mesh-unicolor.js","./draw-mesh-wireframe":"../../../node_modules/@tstackgl/regl-draw/dist/draw-mesh-wireframe.js"}],"draw-basic-mesh.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var vert = "\nprecision mediump float;\n\nuniform mat4 projection, view;\nuniform vec3 translate, scale;\nattribute vec3 position, normal;\nvarying vec3 vViewPos;\n\nvoid main () {\n  vec3 pos = (position * scale) + translate;\n  vec4 mpos = projection * view * vec4(pos, 1.0);\n  vViewPos = -(projection * view * vec4(pos, 1.0)).xyz;\n  gl_Position = mpos;\n}\n";
var frag = "\nprecision mediump float;\n#extension GL_OES_standard_derivatives: enable\n\nuniform vec3 diffuseColor, ambientColor, lightDirection;\nvarying vec3 vViewPos;\n\nvec3 faceNormal(vec3 pos) {\n  vec3 fdx = dFdx(pos);\n  vec3 fdy = dFdy(pos);\n  return normalize(cross(fdx, fdy));\n}\n\nvoid main () {\n  vec3 normal = faceNormal(vViewPos);\n\n  float brightness = max(\n    dot(\n      normalize(lightDirection),\n      normalize(normal)\n    ), 0.4);\n  vec3 lightColor = ambientColor + diffuseColor * brightness;\n  gl_FragColor = vec4(lightColor, 1.0);\n}\n";

function createBasicMesh(regl, mesh) {
  return regl({
    vert: vert,
    frag: frag,
    attributes: {
      position: mesh.positions
    },
    uniforms: {
      translate: regl.prop('translate'),
      scale: regl.prop('scale'),
      diffuseColor: regl.prop('diffuseColor'),
      ambientColor: regl.prop('ambientColor'),
      lightDirection: regl.prop('lightDirection')
    },
    elements: function () {
      return mesh.cells;
    }
  });
}

exports.createBasicMesh = createBasicMesh;
},{}],"../../../node_modules/mouse-event/mouse.js":[function(require,module,exports) {
'use strict'

function mouseButtons(ev) {
  if(typeof ev === 'object') {
    if('buttons' in ev) {
      return ev.buttons
    } else if('which' in ev) {
      var b = ev.which
      if(b === 2) {
        return 4
      } else if(b === 3) {
        return 2
      } else if(b > 0) {
        return 1<<(b-1)
      }
    } else if('button' in ev) {
      var b = ev.button
      if(b === 1) {
        return 4
      } else if(b === 2) {
        return 2
      } else if(b >= 0) {
        return 1<<b
      }
    }
  }
  return 0
}
exports.buttons = mouseButtons

function mouseElement(ev) {
  return ev.target || ev.srcElement || window
}
exports.element = mouseElement

function mouseRelativeX(ev) {
  if(typeof ev === 'object') {
    if('offsetX' in ev) {
      return ev.offsetX
    }
    var target = mouseElement(ev)
    var bounds = target.getBoundingClientRect()
    return ev.clientX - bounds.left
  }
  return 0
}
exports.x = mouseRelativeX

function mouseRelativeY(ev) {
  if(typeof ev === 'object') {
    if('offsetY' in ev) {
      return ev.offsetY
    }
    var target = mouseElement(ev)
    var bounds = target.getBoundingClientRect()
    return ev.clientY - bounds.top
  }
  return 0
}
exports.y = mouseRelativeY

},{}],"../../../node_modules/mouse-change/mouse-listen.js":[function(require,module,exports) {
'use strict'

module.exports = mouseListen

var mouse = require('mouse-event')

function mouseListen (element, callback) {
  if (!callback) {
    callback = element
    element = window
  }

  var buttonState = 0
  var x = 0
  var y = 0
  var mods = {
    shift: false,
    alt: false,
    control: false,
    meta: false
  }
  var attached = false

  function updateMods (ev) {
    var changed = false
    if ('altKey' in ev) {
      changed = changed || ev.altKey !== mods.alt
      mods.alt = !!ev.altKey
    }
    if ('shiftKey' in ev) {
      changed = changed || ev.shiftKey !== mods.shift
      mods.shift = !!ev.shiftKey
    }
    if ('ctrlKey' in ev) {
      changed = changed || ev.ctrlKey !== mods.control
      mods.control = !!ev.ctrlKey
    }
    if ('metaKey' in ev) {
      changed = changed || ev.metaKey !== mods.meta
      mods.meta = !!ev.metaKey
    }
    return changed
  }

  function handleEvent (nextButtons, ev) {
    var nextX = mouse.x(ev)
    var nextY = mouse.y(ev)
    if ('buttons' in ev) {
      nextButtons = ev.buttons | 0
    }
    if (nextButtons !== buttonState ||
      nextX !== x ||
      nextY !== y ||
      updateMods(ev)) {
      buttonState = nextButtons | 0
      x = nextX || 0
      y = nextY || 0
      callback && callback(buttonState, x, y, mods)
    }
  }

  function clearState (ev) {
    handleEvent(0, ev)
  }

  function handleBlur () {
    if (buttonState ||
      x ||
      y ||
      mods.shift ||
      mods.alt ||
      mods.meta ||
      mods.control) {
      x = y = 0
      buttonState = 0
      mods.shift = mods.alt = mods.control = mods.meta = false
      callback && callback(0, 0, 0, mods)
    }
  }

  function handleMods (ev) {
    if (updateMods(ev)) {
      callback && callback(buttonState, x, y, mods)
    }
  }

  function handleMouseMove (ev) {
    if (mouse.buttons(ev) === 0) {
      handleEvent(0, ev)
    } else {
      handleEvent(buttonState, ev)
    }
  }

  function handleMouseDown (ev) {
    handleEvent(buttonState | mouse.buttons(ev), ev)
  }

  function handleMouseUp (ev) {
    handleEvent(buttonState & ~mouse.buttons(ev), ev)
  }

  function attachListeners () {
    if (attached) {
      return
    }
    attached = true

    element.addEventListener('mousemove', handleMouseMove)

    element.addEventListener('mousedown', handleMouseDown)

    element.addEventListener('mouseup', handleMouseUp)

    element.addEventListener('mouseleave', clearState)
    element.addEventListener('mouseenter', clearState)
    element.addEventListener('mouseout', clearState)
    element.addEventListener('mouseover', clearState)

    element.addEventListener('blur', handleBlur)

    element.addEventListener('keyup', handleMods)
    element.addEventListener('keydown', handleMods)
    element.addEventListener('keypress', handleMods)

    if (element !== window) {
      window.addEventListener('blur', handleBlur)

      window.addEventListener('keyup', handleMods)
      window.addEventListener('keydown', handleMods)
      window.addEventListener('keypress', handleMods)
    }
  }

  function detachListeners () {
    if (!attached) {
      return
    }
    attached = false

    element.removeEventListener('mousemove', handleMouseMove)

    element.removeEventListener('mousedown', handleMouseDown)

    element.removeEventListener('mouseup', handleMouseUp)

    element.removeEventListener('mouseleave', clearState)
    element.removeEventListener('mouseenter', clearState)
    element.removeEventListener('mouseout', clearState)
    element.removeEventListener('mouseover', clearState)

    element.removeEventListener('blur', handleBlur)

    element.removeEventListener('keyup', handleMods)
    element.removeEventListener('keydown', handleMods)
    element.removeEventListener('keypress', handleMods)

    if (element !== window) {
      window.removeEventListener('blur', handleBlur)

      window.removeEventListener('keyup', handleMods)
      window.removeEventListener('keydown', handleMods)
      window.removeEventListener('keypress', handleMods)
    }
  }

  // Attach listeners
  attachListeners()

  var result = {
    element: element
  }

  Object.defineProperties(result, {
    enabled: {
      get: function () { return attached },
      set: function (f) {
        if (f) {
          attachListeners()
        } else {
          detachListeners()
        }
      },
      enumerable: true
    },
    buttons: {
      get: function () { return buttonState },
      enumerable: true
    },
    x: {
      get: function () { return x },
      enumerable: true
    },
    y: {
      get: function () { return y },
      enumerable: true
    },
    mods: {
      get: function () { return mods },
      enumerable: true
    }
  })

  return result
}

},{"mouse-event":"../../../node_modules/mouse-event/mouse.js"}],"../../../node_modules/parse-unit/index.js":[function(require,module,exports) {
module.exports = function parseUnit(str, out) {
    if (!out)
        out = [ 0, '' ]

    str = String(str)
    var num = parseFloat(str, 10)
    out[0] = num
    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
    return out
}
},{}],"../../../node_modules/to-px/browser.js":[function(require,module,exports) {
'use strict'

var parseUnit = require('parse-unit')

module.exports = toPX

var PIXELS_PER_INCH = getSizeBrutal('in', document.body) // 96


function getPropertyInPX(element, prop) {
  var parts = parseUnit(getComputedStyle(element).getPropertyValue(prop))
  return parts[0] * toPX(parts[1], element)
}

//This brutal hack is needed
function getSizeBrutal(unit, element) {
  var testDIV = document.createElement('div')
  testDIV.style['height'] = '128' + unit
  element.appendChild(testDIV)
  var size = getPropertyInPX(testDIV, 'height') / 128
  element.removeChild(testDIV)
  return size
}

function toPX(str, element) {
  if (!str) return null

  element = element || document.body
  str = (str + '' || 'px').trim().toLowerCase()
  if(element === window || element === document) {
    element = document.body
  }

  switch(str) {
    case '%':  //Ambiguous, not sure if we should use width or height
      return element.clientHeight / 100.0
    case 'ch':
    case 'ex':
      return getSizeBrutal(str, element)
    case 'em':
      return getPropertyInPX(element, 'font-size')
    case 'rem':
      return getPropertyInPX(document.body, 'font-size')
    case 'vw':
      return window.innerWidth/100
    case 'vh':
      return window.innerHeight/100
    case 'vmin':
      return Math.min(window.innerWidth, window.innerHeight) / 100
    case 'vmax':
      return Math.max(window.innerWidth, window.innerHeight) / 100
    case 'in':
      return PIXELS_PER_INCH
    case 'cm':
      return PIXELS_PER_INCH / 2.54
    case 'mm':
      return PIXELS_PER_INCH / 25.4
    case 'pt':
      return PIXELS_PER_INCH / 72
    case 'pc':
      return PIXELS_PER_INCH / 6
    case 'px':
      return 1
  }

  // detect number of units
  var parts = parseUnit(str)
  if (!isNaN(parts[0]) && parts[1]) {
    var px = toPX(parts[1], element)
    return typeof px === 'number' ? parts[0] * px : null
  }

  return null
}

},{"parse-unit":"../../../node_modules/parse-unit/index.js"}],"../../../node_modules/mouse-wheel/wheel.js":[function(require,module,exports) {
'use strict'

var toPX = require('to-px')

module.exports = mouseWheelListen

function mouseWheelListen(element, callback, noScroll) {
  if(typeof element === 'function') {
    noScroll = !!callback
    callback = element
    element = window
  }
  var lineHeight = toPX('ex', element)
  var listener = function(ev) {
    if(noScroll) {
      ev.preventDefault()
    }
    var dx = ev.deltaX || 0
    var dy = ev.deltaY || 0
    var dz = ev.deltaZ || 0
    var mode = ev.deltaMode
    var scale = 1
    switch(mode) {
      case 1:
        scale = lineHeight
      break
      case 2:
        scale = window.innerHeight
      break
    }
    dx *= scale
    dy *= scale
    dz *= scale
    if(dx || dy || dz) {
      return callback(dx, dy, dz, ev)
    }
  }
  element.addEventListener('wheel', listener)
  return listener
}

},{"to-px":"../../../node_modules/to-px/browser.js"}],"../../../node_modules/regl-camera/regl-camera.js":[function(require,module,exports) {
var mouseChange = require('mouse-change')
var mouseWheel = require('mouse-wheel')
var identity = require('gl-mat4/identity')
var perspective = require('gl-mat4/perspective')
var lookAt = require('gl-mat4/lookAt')

module.exports = createCamera

var isBrowser = typeof window !== 'undefined'

function createCamera (regl, props_) {
  var props = props_ || {}

  // Preserve backward-compatibilty while renaming preventDefault -> noScroll
  if (typeof props.noScroll === 'undefined') {
    props.noScroll = props.preventDefault;
  }

  var cameraState = {
    view: identity(new Float32Array(16)),
    projection: identity(new Float32Array(16)),
    center: new Float32Array(props.center || 3),
    theta: props.theta || 0,
    phi: props.phi || 0,
    distance: Math.log(props.distance || 10.0),
    eye: new Float32Array(3),
    up: new Float32Array(props.up || [0, 1, 0]),
    fovy: props.fovy || Math.PI / 4.0,
    near: typeof props.near !== 'undefined' ? props.near : 0.01,
    far: typeof props.far !== 'undefined' ? props.far : 1000.0,
    noScroll: typeof props.noScroll !== 'undefined' ? props.noScroll : false,
    flipY: !!props.flipY,
    dtheta: 0,
    dphi: 0,
    rotationSpeed: typeof props.rotationSpeed !== 'undefined' ? props.rotationSpeed : 1,
    zoomSpeed: typeof props.zoomSpeed !== 'undefined' ? props.zoomSpeed : 1,
    renderOnDirty: typeof props.renderOnDirty !== undefined ? !!props.renderOnDirty : false
  }

  var element = props.element
  var damping = typeof props.damping !== 'undefined' ? props.damping : 0.9

  var right = new Float32Array([1, 0, 0])
  var front = new Float32Array([0, 0, 1])

  var minDistance = Math.log('minDistance' in props ? props.minDistance : 0.1)
  var maxDistance = Math.log('maxDistance' in props ? props.maxDistance : 1000)

  var ddistance = 0

  var prevX = 0
  var prevY = 0

  if (isBrowser && props.mouse !== false) {
    var source = element || regl._gl.canvas

    function getWidth () {
      return element ? element.offsetWidth : window.innerWidth
    }

    function getHeight () {
      return element ? element.offsetHeight : window.innerHeight
    }

    mouseChange(source, function (buttons, x, y) {
      if (buttons & 1) {
        var dx = (x - prevX) / getWidth()
        var dy = (y - prevY) / getHeight()

        cameraState.dtheta += cameraState.rotationSpeed * 4.0 * dx
        cameraState.dphi += cameraState.rotationSpeed * 4.0 * dy
        cameraState.dirty = true;
      }
      prevX = x
      prevY = y
    })

    mouseWheel(source, function (dx, dy) {
      ddistance += dy / getHeight() * cameraState.zoomSpeed
      cameraState.dirty = true;
    }, props.noScroll)
  }

  function damp (x) {
    var xd = x * damping
    if (Math.abs(xd) < 0.1) {
      return 0
    }
    cameraState.dirty = true;
    return xd
  }

  function clamp (x, lo, hi) {
    return Math.min(Math.max(x, lo), hi)
  }

  function updateCamera (props) {
    Object.keys(props).forEach(function (prop) {
      cameraState[prop] = props[prop]
    })

    var center = cameraState.center
    var eye = cameraState.eye
    var up = cameraState.up
    var dtheta = cameraState.dtheta
    var dphi = cameraState.dphi

    cameraState.theta += dtheta
    cameraState.phi = clamp(
      cameraState.phi + dphi,
      -Math.PI / 2.0,
      Math.PI / 2.0)
    cameraState.distance = clamp(
      cameraState.distance + ddistance,
      minDistance,
      maxDistance)

    cameraState.dtheta = damp(dtheta)
    cameraState.dphi = damp(dphi)
    ddistance = damp(ddistance)

    var theta = cameraState.theta
    var phi = cameraState.phi
    var r = Math.exp(cameraState.distance)

    var vf = r * Math.sin(theta) * Math.cos(phi)
    var vr = r * Math.cos(theta) * Math.cos(phi)
    var vu = r * Math.sin(phi)

    for (var i = 0; i < 3; ++i) {
      eye[i] = center[i] + vf * front[i] + vr * right[i] + vu * up[i]
    }

    lookAt(cameraState.view, eye, center, up)
  }

  cameraState.dirty = true;

  var injectContext = regl({
    context: Object.assign({}, cameraState, {
      dirty: function () {
        return cameraState.dirty;
      },
      projection: function (context) {
        perspective(cameraState.projection,
          cameraState.fovy,
          context.viewportWidth / context.viewportHeight,
          cameraState.near,
          cameraState.far)
        if (cameraState.flipY) { cameraState.projection[5] *= -1 }
        return cameraState.projection
      }
    }),
    uniforms: Object.keys(cameraState).reduce(function (uniforms, name) {
      uniforms[name] = regl.context(name)
      return uniforms
    }, {})
  })

  function setupCamera (props, block) {
    if (typeof setupCamera.dirty !== 'undefined') {
      cameraState.dirty = setupCamera.dirty || cameraState.dirty
      setupCamera.dirty = undefined;
    }

    if (props && block) {
      cameraState.dirty = true;
    }

    if (cameraState.renderOnDirty && !cameraState.dirty) return;

    if (!block) {
      block = props
      props = {}
    }

    updateCamera(props)
    injectContext(block)
    cameraState.dirty = false;
  }

  Object.keys(cameraState).forEach(function (name) {
    setupCamera[name] = cameraState[name]
  })

  return setupCamera
}

},{"mouse-change":"../../../node_modules/mouse-change/mouse-listen.js","mouse-wheel":"../../../node_modules/mouse-wheel/wheel.js","gl-mat4/identity":"../../../node_modules/gl-mat4/identity.js","gl-mat4/perspective":"../../../node_modules/gl-mat4/perspective.js","gl-mat4/lookAt":"../../../node_modules/gl-mat4/lookAt.js"}],"../../../node_modules/primitive-quad/index.js":[function(require,module,exports) {
module.exports = primitiveQuad

function primitiveQuad (scale) {
  scale = typeof scale !== 'undefined' ? scale : 1
  if (!Array.isArray(scale)) {
    scale = [scale, scale]
  }

  var positions = [
    [-scale[0], -scale[1], 0],
    [scale[0], -scale[1], 0],
    [scale[0], scale[1], 0],
    [-scale[0], scale[1], 0]
  ]
  var cells = [
    [0, 1, 2],
    [2, 3, 0]
  ]
  var uvs = [[0, 0], [1, 0], [1, 1], [0, 1]]
  var n = [0, 0, -1]
  var normals = [ n.slice(), n.slice(), n.slice(), n.slice() ]
  return {
    positions: positions,
    cells: cells,
    uvs: uvs,
    normals: normals
  }
}

},{}],"../../../node_modules/geo-3d-box/box.js":[function(require,module,exports) {
function _createConfig( properties ) {
	
	var config = {
		size : [1,1,1],
		segments : [1,1,1]
	}
	
	if( properties ) {
	
		if( Array.isArray( properties.size ) ) {
			config.size = properties.size
		} else if( typeof properties.size === "number" ) {
			config.size = [properties.size, properties.size, properties.size]
		}
	
		if( Array.isArray( properties.segments ) ) {
			config.segments = properties.segments
		} else if( typeof properties.segments === "number" ) {
			config.segments = [properties.segments, properties.segments, properties.segments]
		}
	}
	
	return config
}

function _flatten( array ) {
	var results = []
	
	for( var i=0; i < array.length; i++ ) {
		var subarray = array[i]
		for( var j=0; j < subarray.length; j++ ) {
			results.push(subarray[j])
		}
	}
	return results
}

function _generatePanel( config ) {
			
	var rows      = _generateGrid( config )
	var cells     = _generateCells( config, rows )
	var positions = _flatten( rows )
	var uvs       = _generateUvs( config, positions )
	
	return {
		positions   : positions,
		cells       : cells,
		uvs         : uvs,
		vertexCount : (config.sx + 1) * (config.sy + 1)
	}
}

function _generateUvs( config, positions ) {
	
	return positions.map(function(p) {
		return [
			p[0] / config.wx + 0.5,
			p[1] / config.wy + 0.5
		]
	})
}

function _generateGrid( config ) {
	
	var step   = config.wy / config.sy
	var halfY  = config.wy / 2
	var length = config.sy + 1
	var grid   = Array(length)
	
	for( var i=0; i < length; i++ ) {
		grid[i] = _generateRow( config, step * i - halfY)
	}
	
	return grid
}

function _generateRow( config, height ) {
	
	var halfX  = config.wx / 2
	var step   = config.wx / config.sx
	var length = config.sx + 1
	var row    = Array(length)
	
	for( var i=0; i < length; i++ ) {
		row[i] = [ step * i - halfX, height ]
	}
	
	return row
}

function _generateCells( config ) {
	
	function index( x, y ) {
		return (config.sx + 1) * y + x
	}
	
	var cells = []
	
	for( var x=0; x < config.sx; x++ ) {
		
		for( var y=0; y < config.sy; y++ ) {

			var a = index( x + 0, y + 0 )  //   d __ c
			var b = index( x + 1, y + 0 )  //    |  |
			var c = index( x + 1, y + 1 )  //    |__|
			var d = index( x + 0, y + 1 )  //   a    b
			
			cells.push( [ a, b, c ] )
			cells.push( [ c, d, a ] )
		}
	}
	
	return cells
}

function _clonePanel( panel ) {
	
	return {
		positions   : panel.positions,
		cells       : panel.cells,
		uvs         : panel.uvs,
		vertexCount : panel.vertexCount
	}
}

function _generateBoxPanels( config ) {
	
	var size = config.size
	var segs = config.segments
	
	//       yp  zm
	//        | /
	//        |/
	// xm ----+----- xp
	//       /|
	//      / |
	//    zp  ym
	
	var zp = _generatePanel({
		wx: size[0], wy: size[1],
		sx: segs[0], sy: segs[1]
	})
	var xp = _generatePanel({
		wx: size[2], wy: size[1],
		sx: segs[2], sy: segs[1]
	})
	var yp = _generatePanel({
		wx: size[0], wy: size[2],
		sx: segs[0], sy: segs[2]
	})
	
	var zm = _clonePanel(zp)
	var xm = _clonePanel(xp)
	var ym = _clonePanel(yp)
	
	zp.positions = zp.positions.map( function(p) { return [       p[0],       p[1],  size[2]/2 ] } )
	zm.positions = zm.positions.map( function(p) { return [       p[0],      -p[1], -size[2]/2 ] } )
	xp.positions = xp.positions.map( function(p) { return [  size[0]/2,      -p[1],       p[0] ] } )
	xm.positions = xm.positions.map( function(p) { return [ -size[0]/2,       p[1],       p[0] ] } )
	yp.positions = yp.positions.map( function(p) { return [       p[0],  size[1]/2,      -p[1] ] } )
	ym.positions = ym.positions.map( function(p) { return [       p[0], -size[1]/2,       p[1] ] } )
	
	zp.normals = _makeNormals( [ 0, 0, 1], zp.positions.length )
	zm.normals = _makeNormals( [ 0, 0,-1], zm.positions.length )
	xp.normals = _makeNormals( [ 1, 0, 0], xp.positions.length )
	xm.normals = _makeNormals( [-1, 0, 0], xm.positions.length )
	yp.normals = _makeNormals( [ 0, 1, 0], yp.positions.length )
	ym.normals = _makeNormals( [ 0,-1, 0], ym.positions.length )
	
	return [ zp, zm, xp, xm, yp, ym ]
}

function _makeNormals( normal, count ) {
	
	var normals = Array(count)
	
	for( var i=0; i < count; i++ ) {
		normals[i] = normal.slice()
	}
	
	return normals
}
	
function _generateBox( config ) {
	
	var panels = _generateBoxPanels( config )
	
	var positions = panels.map(function(panel) { return panel.positions })
	var uvs       = panels.map(function(panel) { return panel.uvs       })
	var normals   = panels.map(function(panel) { return panel.normals   })
	var cells     = _offsetCellIndices( panels )
	
	return {
		positions: _flatten( positions ),
		uvs:       _flatten( uvs ),
		cells:     _flatten( cells ),
		normals:   _flatten( normals ),
	}
}

function _offsetCellIndices( panels ) {
	
	/*
		From: [[[0,1,2],[2,3,0]],[[0,1,2],[2,3,0]]]
		To:   [[[0,1,2],[2,3,0]],[[6,7,8],[8,9,6]]]
	*/
	
	var offset = 0
	
	return panels.map(function(panel) {
		
		var offsetCells = panel.cells.map( function(cell) {
			return cell.map(function(v) {
				return v + offset
			})
		})
	
		offset += panel.vertexCount
	
		return offsetCells
	})
}

module.exports = function( properties ) {
	
	var config = _createConfig( properties )

	return _generateBox( config )
}
},{}],"../../../node_modules/primitive-sphere/primitive-sphere.js":[function(require,module,exports) {
var identity = require('gl-mat4/identity')
var rotateY = require('gl-mat4/rotateY')
var rotateZ = require('gl-mat4/rotateZ')

var scale = require('gl-vec3/scale')
var transformMat4 = require('gl-vec3/transformMat4')
var normalize = require('gl-vec3/normalize')

var matRotY = identity([])
var matRotZ = identity([])
var up = [0, 1, 0]
var tmpVec3 = [0, 0, 0]

module.exports = primitiveSphere
function primitiveSphere (radius, opt) {
  opt = opt || {}
  radius = typeof radius !== 'undefined' ? radius : 1
  var segments = typeof opt.segments !== 'undefined' ? opt.segments : 32

  var totalZRotationSteps = 2 + segments
  var totalYRotationSteps = 2 * totalZRotationSteps

  var indices = []
  var positions = []
  var normals = []
  var uvs = []

  for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
    var normalizedZ = zRotationStep / totalZRotationSteps
    var angleZ = (normalizedZ * Math.PI)

    for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
      var normalizedY = yRotationStep / totalYRotationSteps
      var angleY = normalizedY * Math.PI * 2

      identity(matRotZ)
      rotateZ(matRotZ, matRotZ, -angleZ)

      identity(matRotY)
      rotateY(matRotY, matRotY, angleY)

      transformMat4(tmpVec3, up, matRotZ)
      transformMat4(tmpVec3, tmpVec3, matRotY)

      scale(tmpVec3, tmpVec3, -radius)
      positions.push(tmpVec3.slice())

      normalize(tmpVec3, tmpVec3)
      normals.push(tmpVec3.slice())

      uvs.push([ normalizedY, normalizedZ ])
    }

    if (zRotationStep > 0) {
      var verticesCount = positions.length
      var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1)
      for (; (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
        indices.push([
          firstIndex,
          firstIndex + 1,
          firstIndex + totalYRotationSteps + 1
        ])
        indices.push([
          firstIndex + totalYRotationSteps + 1,
          firstIndex + 1,
          firstIndex + totalYRotationSteps + 2
        ])
      }
    }
  }

  return {
    cells: indices,
    positions: positions,
    normals: normals,
    uvs: uvs
  }
}

},{"gl-mat4/identity":"../../../node_modules/gl-mat4/identity.js","gl-mat4/rotateY":"../../../node_modules/gl-mat4/rotateY.js","gl-mat4/rotateZ":"../../../node_modules/gl-mat4/rotateZ.js","gl-vec3/scale":"../../../node_modules/gl-vec3/scale.js","gl-vec3/transformMat4":"../../../node_modules/gl-vec3/transformMat4.js","gl-vec3/normalize":"../../../node_modules/gl-vec3/normalize.js"}],"../../../node_modules/primitive-capsule/index.js":[function(require,module,exports) {
function createCapsule(radius, height, numSubdivisionsHeight, numSegments) {
  if (radius === undefined) radius = 0.5;
  if (height === undefined) height = radius * 2;
  if (numSubdivisionsHeight === undefined) numSubdivisionsHeight = 12;
  if (numSegments === undefined) numSegments = 12;

  var positions = [];
  var normals = [];
  var uvs = [];
  var cells = [];

  function calculateRing(segments, r, y, dy) {
    var segIncr = 1.0 / ( segments - 1 );

    for( var s = 0; s < segments; s++ ) {
      var x = -Math.cos( (Math.PI * 2) * s * segIncr ) * r;
      var z = Math.sin( (Math.PI * 2) * s * segIncr ) * r;

      positions.push([radius * x, radius * y + height * dy, radius * z])
      normals.push([x, y, z])

      var u = (s * segIncr);
      var v = 0.5 - ((radius * y + height * dy) / (2.0 * radius + height));
      uvs.push([u, 1.0 - v]);
    }
  }

  var ringsBody = numSubdivisionsHeight + 1;
  var ringsTotal = numSubdivisionsHeight + ringsBody;


  var bodyIncr = 1.0 / ( ringsBody - 1 );
  var ringIncr = 1.0 / ( numSubdivisionsHeight - 1 );
  for( var r = 0; r < numSubdivisionsHeight / 2; r++ ) {
    calculateRing( numSegments, Math.sin( Math.PI * r * ringIncr), Math.sin( Math.PI * ( r * ringIncr - 0.5 ) ), -0.5 );
  }

  for( var r = 0; r < ringsBody; r++ ) {
    calculateRing( numSegments, 1.0, 0.0, r * bodyIncr - 0.5);
  }

  for( var r = numSubdivisionsHeight / 2; r < numSubdivisionsHeight; r++ ) {
    calculateRing( numSegments, Math.sin( Math.PI * r * ringIncr), Math.sin( Math.PI * ( r * ringIncr - 0.5 ) ), +0.5);
  }

  for( var r = 0; r < ringsTotal - 1; r++ ) {
    for( var s = 0; s < numSegments - 1; s++ ) {
      cells.push([
        (r * numSegments + ( s + 0 )),
        (r * numSegments + ( s + 1 )),
        (( r + 1 ) * numSegments + ( s + 1 ))
      ]);
      cells.push([
        (r * numSegments + s),
        (( r + 1 ) * numSegments + ( s + 1 )),
        (( r + 1 ) * numSegments + ( s + 0 ))
      ])
    }
  }

  return {
    positions: positions,
    normals: normals,
    uvs: uvs,
    cells: cells
  }
}

module.exports = createCapsule;

},{}],"../../../node_modules/defined/index.js":[function(require,module,exports) {
module.exports = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) return arguments[i];
    }
};

},{}],"../../../node_modules/primitive-torus/index.js":[function(require,module,exports) {
var defined = require('defined')
var sub = require('gl-vec3/subtract')
var normalize = require('gl-vec3/normalize')

module.exports = createTorusMesh
function createTorusMesh (opt) {
  opt = opt || {}
  var majorRadius = defined(opt.majorRadius, 1)
  var minorRadius = defined(opt.minorRadius, 0.25)
  var minorSegments = defined(opt.minorSegments, 32)
  var majorSegments = defined(opt.majorSegments, 64)
  var arc = defined(opt.arc, Math.PI * 2)
  var PI2 = Math.PI * 2

  var center = [0, 0, 0]
  var uvs = []
  var positions = []
  var cells = []
  var tmp = [0, 0, 0]
  var normals = []

  for (var j = 0; j <= minorSegments; j++) {
    for (var i = 0; i <= majorSegments; i++) {
      var u = i / majorSegments * arc
      var v = j / minorSegments * PI2

      center[0] = majorRadius * Math.cos(u)
      center[1] = majorRadius * Math.sin(u)

      var vertex = [
        (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u),
        (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u),
        minorRadius * Math.sin(v)
      ]
      positions.push(vertex)

      sub(tmp, vertex, center)
      normalize(tmp, tmp)
      normals.push(tmp.slice())
      uvs.push([ i / majorSegments, j / minorSegments ])
    }
  }

  for (var j = 1; j <= minorSegments; j++) {
    for (var i = 1; i <= majorSegments; i++) {
      var a = (majorSegments + 1) * j + i - 1
      var b = (majorSegments + 1) * (j - 1) + i - 1
      var c = (majorSegments + 1) * (j - 1) + i
      var d = (majorSegments + 1) * j + i

      cells.push([ a, b, d ])
      cells.push([ b, c, d ])
    }
  }

  return {
    uvs: uvs,
    cells: cells,
    normals: normals,
    positions: positions
  }
}

},{"defined":"../../../node_modules/defined/index.js","gl-vec3/subtract":"../../../node_modules/gl-vec3/subtract.js","gl-vec3/normalize":"../../../node_modules/gl-vec3/normalize.js"}],"../../../node_modules/bunny/index.js":[function(require,module,exports) {
exports.positions=[[1.301895,0.122622,2.550061],[1.045326,0.139058,2.835156],[0.569251,0.155925,2.805125],[0.251886,0.144145,2.82928],[0.063033,0.131726,3.01408],[-0.277753,0.135892,3.10716],[-0.441048,0.277064,2.594331],[-1.010956,0.095285,2.668983],[-1.317639,0.069897,2.325448],[-0.751691,0.264681,2.381496],[0.684137,0.31134,2.364574],[1.347931,0.302882,2.201434],[-1.736903,0.029894,1.724111],[-1.319986,0.11998,0.912925],[1.538077,0.157372,0.481711],[1.951975,0.081742,1.1641],[1.834768,0.095832,1.602682],[2.446122,0.091817,1.37558],[2.617615,0.078644,0.742801],[-1.609748,0.04973,-0.238721],[-1.281973,0.230984,-0.180916],[-1.074501,0.248204,0.034007],[-1.201734,0.058499,0.402234],[-1.444454,0.054783,0.149579],[-4.694605,5.075882,1.043427],[-3.95963,7.767394,0.758447],[-4.753339,5.339817,0.665061],[-1.150325,9.133327,-0.368552],[-4.316107,2.893611,0.44399],[-0.809202,9.312575,-0.466061],[0.085626,5.963693,1.685666],[-1.314853,9.00142,-0.1339],[-4.364182,3.072556,1.436712],[-2.022074,7.323396,0.678657],[1.990887,6.13023,0.479643],[-3.295525,7.878917,1.409353],[0.571308,6.197569,0.670657],[0.89661,6.20018,0.337056],[0.331851,6.162372,1.186371],[-4.840066,5.599874,2.296069],[2.138989,6.031291,0.228335],[0.678923,6.026173,1.894052],[-0.781682,5.601573,1.836738],[1.181315,6.239007,0.393293],[-3.606308,7.376476,2.661452],[-0.579059,4.042511,-1.540883],[-3.064069,8.630253,-2.597539],[-2.157271,6.837012,0.300191],[-2.966013,7.821581,-1.13697],[-2.34426,8.122965,0.409043],[-0.951684,5.874251,1.415119],[-2.834853,7.748319,0.182406],[-3.242493,7.820096,0.373674],[-0.208532,5.992846,1.252084],[-3.048085,8.431527,-2.129795],[1.413245,5.806324,2.243906],[-0.051222,6.064901,0.696093],[-4.204306,2.700062,0.713875],[-4.610997,6.343405,0.344272],[-3.291336,9.30531,-3.340445],[-3.27211,7.559239,-2.324016],[-4.23882,6.498344,3.18452],[-3.945317,6.377804,3.38625],[-4.906378,5.472265,1.315193],[-3.580131,7.846717,0.709666],[-1.995504,6.645459,0.688487],[-2.595651,7.86054,0.793351],[-0.008849,0.305871,0.184484],[-0.029011,0.314116,-0.257312],[-2.522424,7.565392,1.804212],[-1.022993,8.650826,-0.855609],[-3.831265,6.595426,3.266783],[-4.042525,6.855724,3.060663],[-4.17126,7.404742,2.391387],[3.904526,3.767693,0.092179],[0.268076,6.086802,1.469223],[-3.320456,8.753222,-2.08969],[1.203048,6.26925,0.612407],[-4.406479,2.985974,0.853691],[-3.226889,6.615215,-0.404243],[0.346326,1.60211,3.509858],[-3.955476,7.253323,2.722392],[-1.23204,0.068935,1.68794],[0.625436,6.196455,1.333156],[4.469132,2.165298,1.70525],[0.950053,6.262899,0.922441],[-2.980404,5.25474,-0.663155],[-4.859043,6.28741,1.537081],[-3.077453,4.641475,-0.892167],[-0.44002,8.222503,-0.771454],[-4.034112,7.639786,0.389935],[-3.696045,6.242042,3.394679],[-1.221806,7.783617,0.196451],[0.71461,6.149895,1.656636],[-4.713539,6.163154,0.495369],[-1.509869,0.913044,-0.832413],[-1.547249,2.066753,-0.852669],[-3.757734,5.793742,3.455794],[-0.831911,0.199296,1.718536],[-3.062763,7.52718,-1.550559],[0.938688,6.103354,1.820958],[-4.037033,2.412311,0.988026],[-4.130746,2.571806,1.101689],[-0.693664,9.174283,-0.952323],[-1.286742,1.079679,-0.751219],[1.543185,1.408925,3.483132],[1.535973,2.047979,3.655029],[0.93844,5.84101,2.195219],[-0.684401,5.918492,1.20109],[1.28844,2.008676,3.710781],[-3.586722,7.435506,-1.454737],[-0.129975,4.384192,2.930593],[-1.030531,0.281374,3.214273],[-3.058751,8.137238,-3.227714],[3.649524,4.592226,1.340021],[-3.354828,7.322425,-1.412086],[0.936449,6.209237,1.512693],[-1.001832,3.590411,-1.545892],[-3.770486,4.593242,2.477056],[-0.971925,0.067797,0.921384],[-4.639832,6.865407,2.311791],[-0.441014,8.093595,-0.595999],[-2.004852,6.37142,1.635383],[4.759591,1.92818,0.328328],[3.748064,1.224074,2.140484],[-0.703601,5.285476,2.251988],[0.59532,6.21893,0.981004],[0.980799,6.257026,1.24223],[1.574697,6.204981,0.381628],[1.149594,6.173608,1.660763],[-3.501963,5.895989,3.456576],[1.071122,5.424198,2.588717],[-0.774693,8.473335,-0.276957],[3.849959,4.15542,0.396742],[-0.801715,4.973149,-1.068582],[-2.927676,0.625112,2.326393],[2.669682,4.045542,2.971184],[-4.391324,4.74086,0.343463],[1.520129,6.270031,0.775471],[1.837586,6.084731,0.109188],[1.271475,5.975024,2.032355],[-3.487968,4.513249,2.605871],[-1.32234,1.517264,-0.691879],[-1.080301,1.648226,-0.805526],[-3.365703,6.910166,-0.454902],[1.36034,0.432238,3.075004],[-3.305013,5.774685,3.39142],[3.88432,0.654141,0.12574],[3.57254,0.377934,0.302501],[4.196136,0.807999,0.212229],[3.932997,0.543123,0.380579],[4.023704,3.286125,0.537597],[1.864455,4.916544,2.691677],[-4.775427,6.499498,1.440153],[-3.464928,3.68234,2.766356],[3.648972,1.751262,2.157485],[1.179111,3.238846,3.774796],[-0.171164,0.299126,-0.592669],[-4.502912,3.316656,0.875188],[-0.948454,9.214025,-0.679508],[1.237665,6.288593,1.046],[1.523423,6.268963,1.139544],[1.436519,6.140608,1.739316],[3.723607,1.504355,2.136762],[2.009495,4.045514,3.22053],[-1.921944,7.249905,0.213973],[1.254068,1.205518,3.474709],[-0.317087,5.996269,0.525872],[-2.996914,3.934607,2.900178],[-3.316873,4.028154,2.785696],[-3.400267,4.280157,2.689268],[-3.134842,4.564875,2.697192],[1.480563,4.692567,2.834068],[0.873682,1.315452,3.541585],[1.599355,0.91622,3.246769],[-3.292102,7.125914,2.768515],[3.74296,4.511299,0.616539],[4.698935,1.55336,0.26921],[-3.274387,3.299421,2.823946],[-2.88809,3.410699,2.955248],[1.171407,1.76905,3.688472],[1.430276,3.92483,3.473666],[3.916941,2.553308,0.018941],[0.701632,2.442372,3.778639],[1.562657,2.302778,3.660957],[4.476622,1.152407,0.182131],[-0.61136,5.761367,1.598838],[-3.102154,3.691687,2.903738],[1.816012,5.546167,2.380308],[3.853928,4.25066,0.750017],[1.234681,3.581665,3.673723],[1.862271,1.361863,3.355209],[1.346844,4.146995,3.327877],[1.70672,4.080043,3.274307],[0.897242,1.908983,3.6969],[-0.587022,9.191132,-0.565301],[-0.217426,5.674606,2.019968],[0.278925,6.120777,0.485403],[1.463328,3.578742,-2.001464],[-3.072985,4.264581,2.789502],[3.62353,4.673843,0.383452],[-3.053491,8.752377,-2.908434],[-2.628687,4.505072,2.755601],[0.891047,5.113781,2.748272],[-2.923732,3.06515,2.866368],[0.848008,4.754252,2.896972],[-3.319184,8.811641,-2.327412],[0.12864,8.814781,-1.334456],[1.549501,4.549331,-1.28243],[1.647161,3.738973,3.507719],[1.250888,0.945599,3.348739],[3.809662,4.038822,0.053142],[1.483166,0.673327,3.09156],[0.829726,3.635921,3.713103],[1.352914,5.226651,2.668113],[2.237352,4.37414,3.016386],[4.507929,0.889447,0.744249],[4.57304,1.010981,0.496588],[3.931422,1.720989,2.088175],[-0.463177,5.989835,0.834346],[-2.811236,3.745023,2.969587],[-2.805135,4.219721,2.841108],[-2.836842,4.802543,2.60826],[1.776716,2.084611,3.568638],[4.046881,1.463478,2.106273],[0.316265,5.944313,1.892785],[-2.86347,2.776049,2.77242],[-2.673644,3.116508,2.907104],[-2.621149,4.018502,2.903409],[-2.573447,5.198013,2.477481],[1.104039,2.278985,3.722469],[-4.602743,4.306413,0.902296],[-2.684878,1.510731,0.535039],[0.092036,8.473269,-0.99413],[-1.280472,5.602393,1.928105],[-1.0279,4.121582,-1.403103],[-2.461081,3.304477,2.957317],[-2.375929,3.659383,2.953233],[1.417579,2.715389,3.718767],[0.819727,2.948823,3.810639],[1.329962,0.761779,3.203724],[1.73952,5.295229,2.537725],[0.952523,3.945016,3.548229],[-2.569498,0.633669,2.84818],[-2.276676,0.757013,2.780717],[-2.013147,7.354429,-0.003202],[0.93143,1.565913,3.600325],[1.249014,1.550556,3.585842],[2.287252,4.072353,3.124544],[-4.7349,7.006244,1.690653],[-3.500602,8.80386,-2.009196],[-0.582629,5.549138,2.000923],[-1.865297,6.356066,1.313593],[-3.212154,2.376143,-0.565593],[2.092889,3.493536,-1.727931],[-2.528501,2.784531,2.833758],[-2.565697,4.893154,2.559605],[-2.153366,5.04584,2.465215],[1.631311,2.568241,3.681445],[2.150193,4.699227,2.807505],[0.507599,5.01813,2.775892],[4.129862,1.863698,2.015101],[3.578279,4.50766,-0.009598],[3.491023,4.806749,1.549265],[0.619485,1.625336,3.605125],[1.107499,2.932557,3.790061],[-2.082292,6.99321,0.742601],[4.839909,1.379279,0.945274],[3.591328,4.322645,-0.259497],[1.055245,0.710686,3.16553],[-3.026494,7.842227,1.624553],[0.146569,6.119214,0.981673],[-2.043687,2.614509,2.785526],[-2.302242,3.047775,2.936355],[-2.245686,4.100424,2.87794],[2.116148,5.063507,2.572204],[-1.448406,7.64559,0.251692],[2.550717,4.9268,2.517526],[-2.955456,7.80293,-1.782407],[1.882995,4.637167,2.895436],[-2.014924,3.398262,2.954896],[-2.273654,4.771227,2.611418],[-2.162723,7.876761,0.702473],[-0.198659,5.823062,1.739272],[-1.280908,2.133189,-0.921241],[2.039932,4.251568,3.136579],[1.477815,4.354333,3.108325],[0.560504,3.744128,3.6913],[-2.234018,1.054373,2.352782],[-3.189156,7.686661,-2.514955],[-3.744736,7.69963,2.116973],[-2.283366,2.878365,2.87882],[-2.153786,4.457481,2.743529],[4.933978,1.677287,0.713773],[3.502146,0.535336,1.752511],[1.825169,4.419253,3.081198],[3.072331,0.280979,0.106534],[-0.508381,1.220392,2.878049],[-3.138824,8.445394,-1.659711],[-2.056425,2.954815,2.897241],[-2.035343,5.398477,2.215842],[-3.239915,7.126798,-0.712547],[-1.867923,7.989805,0.526518],[1.23405,6.248973,1.387189],[-0.216492,8.320933,-0.862495],[-2.079659,3.755709,2.928563],[-1.78595,4.300374,2.805295],[-1.856589,5.10678,2.386572],[-1.714362,5.544778,2.004623],[1.722403,4.200291,-1.408161],[0.195386,0.086928,-1.318006],[1.393693,3.013404,3.710686],[-0.415307,8.508471,-0.996883],[-1.853777,0.755635,2.757275],[-1.724057,3.64533,2.884251],[-1.884511,4.927802,2.530885],[-1.017174,7.783908,-0.227078],[-1.7798,2.342513,2.741749],[-1.841329,3.943996,2.88436],[1.430388,5.468067,2.503467],[-2.030296,0.940028,2.611088],[-1.677028,1.215666,2.607771],[-1.74092,2.832564,2.827295],[4.144673,0.631374,0.503358],[4.238811,0.653992,0.762436],[-1.847016,2.082815,2.642674],[4.045764,3.194073,0.852117],[-1.563989,8.112739,0.303102],[-1.781627,1.794836,2.602338],[-1.493749,2.533799,2.797251],[-1.934496,4.690689,2.658999],[-1.499174,5.777946,1.747498],[-2.387409,0.851291,1.500524],[-1.872211,8.269987,0.392533],[-4.647726,6.765771,0.833653],[-3.157482,0.341958,-0.20671],[-1.725766,3.24703,2.883579],[-1.458199,4.079031,2.836325],[-1.621548,4.515869,2.719266],[-1.607292,4.918914,2.505881],[-1.494661,5.556239,1.991599],[-1.727269,7.423769,0.012337],[-1.382497,1.161322,2.640222],[-1.52129,4.681714,2.615467],[-4.247127,2.792812,1.250843],[-1.576338,0.742947,2.769799],[-1.499257,2.172763,2.743142],[-1.480392,3.103261,2.862262],[1.049137,2.625836,3.775384],[-1.368063,1.791587,2.695516],[-1.307839,2.344534,2.767575],[-1.336758,5.092221,2.355225],[-1.5617,5.301749,2.21625],[-1.483362,8.537704,0.196752],[-1.517348,8.773614,0.074053],[-1.474302,1.492731,2.641433],[2.48718,0.644247,-0.920226],[0.818091,0.422682,3.171218],[-3.623398,6.930094,3.033045],[1.676333,3.531039,3.591591],[1.199939,5.683873,2.365623],[-1.223851,8.841201,0.025414],[-1.286307,3.847643,2.918044],[-1.25857,4.810831,2.543605],[2.603662,5.572146,1.991854],[0.138984,5.779724,2.077834],[-1.267039,3.175169,2.890889],[-1.293616,3.454612,2.911774],[-2.60112,1.277184,0.07724],[2.552779,3.649877,3.163643],[-1.038983,1.248011,2.605933],[-1.288709,4.390967,2.761214],[-1.034218,5.485963,2.011467],[-1.185576,1.464842,2.624335],[-1.045682,2.54896,2.761102],[4.259176,1.660627,2.018096],[-0.961707,1.717183,2.598342],[-1.044603,3.147464,2.855335],[-0.891998,4.685429,2.669696],[-1.027561,5.081672,2.377939],[4.386506,0.832434,0.510074],[-1.014225,9.064991,-0.175352],[-1.218752,2.895443,2.823785],[-0.972075,4.432669,2.788005],[-2.714986,0.52425,1.509798],[-0.699248,1.517219,2.645738],[-1.161581,2.078852,2.722795],[-0.845249,3.286247,2.996471],[1.068329,4.443444,2.993863],[3.98132,3.715557,1.027775],[1.658097,3.982428,-1.651688],[-4.053701,2.449888,0.734746],[-0.910935,2.214149,2.702393],[0.087824,3.96165,3.439344],[-0.779714,3.724134,2.993429],[-1.051093,3.810797,2.941957],[-0.644941,4.3859,2.870863],[-2.98403,8.666895,-3.691888],[-0.754304,2.508325,2.812999],[-4.635524,3.662891,0.913005],[-0.983299,4.125978,2.915378],[4.916497,1.905209,0.621315],[4.874983,1.728429,0.468521],[2.33127,5.181957,2.441697],[-0.653711,2.253387,2.7949],[-3.623744,8.978795,-2.46192],[-4.555927,6.160279,0.215755],[-4.940628,5.806712,1.18383],[3.308506,2.40326,-0.910776],[0.58835,5.251928,-0.992886],[2.152215,5.449733,2.331679],[-0.712755,0.766765,3.280375],[-0.741771,1.9716,2.657235],[-4.828957,5.566946,2.635623],[-3.474788,8.696771,-1.776121],[1.770417,6.205561,1.331627],[-0.620626,4.064721,2.968972],[-1.499187,2.307735,-0.978901],[4.098793,2.330245,1.667951],[1.940444,6.167057,0.935904],[-2.314436,1.104995,1.681277],[-2.733629,7.742793,1.7705],[-0.452248,4.719868,2.740834],[-0.649143,4.951713,2.541296],[-0.479417,9.43959,-0.676324],[-2.251853,6.559275,0.046819],[0.033531,8.316907,-0.789939],[-0.513125,0.995673,3.125462],[-2.637602,1.039747,0.602434],[1.527513,6.230089,1.430903],[4.036124,2.609846,1.506498],[-3.559828,7.877892,1.228076],[-4.570736,4.960193,0.838201],[-0.432121,5.157731,2.467518],[-1.206735,4.562511,-1.237054],[-0.823768,3.788746,-1.567481],[-3.095544,7.353613,-1.024577],[-4.056088,7.631119,2.062001],[-0.289385,5.382261,2.329421],[1.69752,6.136483,1.667037],[-0.168758,5.061138,2.617453],[2.853576,1.605528,-1.229958],[-4.514319,6.586675,0.352756],[-2.558081,7.741151,1.29295],[1.61116,5.92358,2.071534],[3.936921,3.354857,0.091755],[-0.1633,1.119272,3.147975],[0.067551,1.593475,3.38212],[-1.303239,2.328184,-1.011672],[-0.438093,0.73423,3.398384],[-4.62767,3.898187,0.849573],[0.286853,4.165281,3.284834],[-2.968052,8.492812,-3.493693],[-0.111896,3.696111,3.53791],[-3.808245,8.451731,-1.574742],[0.053416,5.558764,2.31107],[3.956269,3.012071,0.11121],[-0.710956,8.106561,-0.665154],[0.234725,2.717326,3.722379],[-0.031594,2.76411,3.657347],[-0.017371,4.700633,2.81911],[0.215064,5.034859,2.721426],[-0.111151,8.480333,-0.649399],[3.97942,3.575478,0.362219],[0.392962,4.735392,2.874321],[4.17015,2.085087,1.865999],[0.169054,1.244786,3.337709],[0.020049,3.165818,3.721736],[0.248212,3.595518,3.698376],[0.130706,5.295541,2.540034],[-4.541357,4.798332,1.026866],[-1.277485,1.289518,-0.667272],[3.892133,3.54263,-0.078056],[4.057379,3.03669,0.997913],[0.287719,0.884758,3.251787],[0.535771,1.144701,3.400096],[0.585303,1.399362,3.505353],[0.191551,2.076246,3.549355],[0.328656,2.394576,3.649623],[0.413124,3.240728,3.771515],[0.630361,4.501549,2.963623],[0.529441,5.854392,2.120225],[3.805796,3.769958,-0.162079],[3.447279,4.344846,-0.467276],[0.377618,5.551116,2.426017],[0.409355,1.821269,3.606333],[0.719959,2.194726,3.703851],[0.495922,3.501519,3.755661],[0.603408,5.354097,2.603088],[-4.605056,7.531978,1.19579],[0.907972,0.973128,3.356513],[0.750134,3.356137,3.765847],[0.4496,3.993244,3.504544],[-3.030738,7.48947,-1.259169],[0.707505,5.602005,2.43476],[0.668944,0.654891,3.213797],[0.593244,2.700978,3.791427],[1.467759,3.30327,3.71035],[3.316249,2.436388,2.581175],[3.26138,1.724425,2.539028],[-1.231292,7.968263,0.281414],[-0.108773,8.712307,-0.790607],[4.445684,1.819442,1.896988],[1.998959,2.281499,3.49447],[2.162269,2.113817,3.365449],[4.363397,1.406731,1.922714],[4.808,2.225842,0.611127],[2.735919,0.771812,-0.701142],[1.897735,2.878428,3.583482],[-3.31616,5.331985,3.212394],[-3.3314,6.018137,3.313018],[-3.503183,6.480103,3.222216],[-1.904453,5.750392,1.913324],[-1.339735,3.559592,-1.421817],[-1.044242,8.22539,0.037414],[1.643492,3.110676,3.647424],[3.992832,3.686244,0.710946],[1.774207,1.71842,3.475768],[-3.438842,5.5713,3.427818],[4.602447,1.2583,1.619528],[-0.925516,7.930042,0.072336],[-1.252093,3.846565,-1.420761],[-3.426857,5.072419,2.97806],[-3.160408,6.152629,3.061869],[3.739931,3.367082,2.041273],[1.027419,4.235891,3.251253],[4.777703,1.887452,1.560409],[-3.318528,6.733796,2.982968],[2.929265,4.962579,2.271079],[3.449761,2.838629,2.474576],[-3.280159,5.029875,2.787514],[4.068939,2.993629,0.741567],[0.303312,8.70927,-1.121972],[0.229852,8.981322,-1.186075],[-0.011045,9.148156,-1.047057],[-2.942683,5.579613,2.929297],[-3.145409,5.698727,3.205778],[-3.019089,6.30887,2.794323],[-3.217135,6.468191,2.970032],[-3.048298,6.993641,2.623378],[-3.07429,6.660982,2.702434],[3.612011,2.5574,2.25349],[2.54516,4.553967,2.75884],[-1.683759,7.400787,0.250868],[-1.756066,7.463557,0.448031],[-3.023761,5.149697,2.673539],[3.112376,2.677218,2.782378],[2.835327,4.581196,2.567146],[-2.973799,7.225458,2.506988],[-0.591645,8.740662,-0.505845],[3.782861,2.04337,2.03066],[3.331604,3.36343,2.605047],[2.966866,1.205497,2.537432],[0.002669,9.654748,-1.355559],[2.632801,0.58497,2.540311],[-2.819398,5.087372,2.521098],[2.616193,5.332961,2.194288],[-3.193973,4.925634,2.607924],[-3.12618,5.27524,2.944544],[-0.426003,8.516354,-0.501528],[2.802717,1.387643,2.751649],[-3.120597,7.889111,-2.75431],[2.636648,1.71702,2.991302],[-2.853151,6.711792,2.430276],[-2.843836,6.962865,2.400842],[1.9696,3.199023,3.504514],[-2.461751,0.386352,3.008994],[1.64127,0.495758,3.02958],[-4.330472,5.409831,0.025287],[-2.912387,5.980416,2.844261],[-2.490069,0.211078,2.985391],[3.581816,4.809118,0.733728],[2.693199,2.647213,3.126709],[-0.182964,8.184108,-0.638459],[-2.226855,0.444711,2.946552],[-0.720175,8.115055,0.017689],[2.645302,4.316212,2.850139],[-0.232764,9.329503,-0.918639],[4.852365,1.471901,0.65275],[2.76229,2.014994,2.957755],[-2.808374,5.354301,2.644695],[-2.790967,6.406963,2.547985],[-1.342684,0.418488,-1.669183],[2.690675,5.593587,-0.041236],[4.660146,1.6318,1.713314],[2.775667,3.007229,3.111332],[-0.396696,8.963432,-0.706202],[2.446707,2.740617,3.321433],[-4.803209,5.884634,2.603672],[-2.652003,1.6541,1.5078],[3.932327,3.972874,0.831924],[2.135906,0.955587,2.986608],[2.486131,2.053802,3.124115],[-0.386706,8.115753,-0.37565],[-2.720727,7.325044,2.224878],[-1.396946,7.638016,-0.16486],[-0.62083,7.989771,-0.144413],[-2.653272,5.729684,2.667679],[3.038188,4.65835,2.364142],[2.381721,0.739472,2.788992],[-2.345829,5.474929,2.380633],[-2.518983,6.080562,2.479383],[-2.615793,6.839622,2.186116],[-2.286566,0.143752,2.766848],[-4.771219,6.508766,1.070797],[3.717308,2.905019,2.097994],[2.50521,3.016743,3.295898],[2.208448,1.56029,3.216806],[3.346783,1.01254,2.119951],[2.653503,3.26122,3.175738],[-2.359636,5.827519,2.402297],[-1.952693,0.558102,2.853307],[-0.321562,9.414885,-1.187501],[3.138923,1.405072,2.520765],[1.493728,1.780051,3.621969],[3.01817,0.907291,2.336909],[3.183548,1.185297,2.352175],[1.608619,5.006753,2.695131],[-4.723919,6.836107,1.095288],[-1.017586,8.865429,-0.149328],[4.730762,1.214014,0.64008],[-2.135182,6.647907,1.495471],[-2.420382,6.546114,2.108209],[-2.458053,7.186346,1.896623],[3.437124,0.275798,1.138203],[0.095925,8.725832,-0.926481],[2.417376,2.429869,3.287659],[2.279951,1.200317,3.049994],[2.674753,2.326926,3.044059],[-2.328123,6.849164,1.75751],[-3.418616,7.853407,0.126248],[-3.151587,7.77543,-0.110889],[2.349144,5.653242,2.05869],[-2.273236,6.085631,2.242888],[-4.560601,4.525342,1.261241],[2.866334,3.796067,2.934717],[-2.17493,6.505518,1.791367],[3.12059,3.283157,2.818869],[3.037703,3.562356,2.866653],[0.066233,9.488418,-1.248237],[2.749941,0.975018,2.573371],[-2.155749,5.801033,2.204009],[-2.162778,6.261889,2.028596],[1.936874,0.459142,2.956718],[3.176249,4.335541,2.440447],[4.356599,1.029423,1.700589],[3.873502,3.082678,1.80431],[2.895489,4.243034,2.735259],[-0.095774,9.468195,-1.07451],[-1.124982,7.886808,-0.480851],[3.032304,3.065454,2.897927],[3.692687,4.5961,0.957858],[-3.013045,3.807235,-1.098381],[-0.790012,8.92912,-0.367572],[1.905793,0.73179,2.996728],[3.530396,3.426233,2.356583],[2.12299,0.624933,2.929167],[-2.069196,6.039284,2.01251],[-3.565623,7.182525,2.850039],[2.959264,2.376337,2.829242],[2.949071,1.822483,2.793933],[4.036142,0.763803,1.703744],[-1.993527,6.180318,1.804936],[-0.030987,0.766389,3.344766],[-0.549683,8.225193,-0.189341],[-0.765469,8.272246,-0.127174],[-2.947047,7.541648,-0.414113],[-3.050327,9.10114,-3.435619],[3.488566,2.231807,2.399836],[3.352283,4.727851,1.946438],[4.741011,2.162773,1.499574],[-1.815093,6.072079,1.580722],[-3.720969,8.267927,-0.984713],[1.932826,3.714052,3.427488],[3.323617,4.438961,2.20732],[0.254111,9.26364,-1.373244],[-1.493384,7.868585,-0.450051],[-0.841901,0.776135,-1.619467],[0.243537,6.027668,0.091687],[0.303057,0.313022,-0.531105],[-0.435273,0.474098,3.481552],[2.121507,2.622389,3.486293],[1.96194,1.101753,3.159584],[3.937991,3.407551,1.551392],[0.070906,0.295753,1.377185],[-1.93588,7.631764,0.651674],[-2.523531,0.744818,-0.30985],[2.891496,3.319875,2.983079],[4.781765,1.547061,1.523129],[-2.256064,7.571251,0.973716],[3.244861,3.058249,2.724392],[-0.145855,0.437775,3.433662],[1.586296,5.658538,2.358487],[3.658336,3.774921,2.071837],[2.840463,4.817098,2.46376],[-1.219464,8.122542,-0.672808],[-2.520906,2.664486,-1.034346],[-1.315417,8.471365,-0.709557],[3.429165,3.74686,2.446169],[3.074579,3.840758,2.767409],[3.569443,3.166337,2.333647],[2.294337,3.280051,3.359346],[2.21816,3.66578,3.269222],[2.158662,4.151444,-1.357919],[1.13862,4.380986,-1.404565],[3.388382,2.749931,-0.840949],[3.059892,5.084848,2.026066],[3.204739,2.075145,2.640706],[3.387065,1.42617,2.305275],[3.910398,2.670742,1.750179],[3.471512,1.945821,2.395881],[4.08082,1.070654,1.960171],[-1.057861,0.133036,2.146707],[-0.151749,5.53551,-0.624323],[3.233099,4.003778,2.571172],[2.611726,5.319199,-0.499388],[2.682909,1.094499,-1.206247],[-1.22823,7.656887,0.041409],[-2.293247,7.259189,0.013844],[0.081315,0.202174,3.286381],[-1.002038,5.794454,-0.187194],[3.448856,4.08091,2.258325],[0.287883,9.006888,-1.550641],[-3.851019,4.059839,-0.646922],[3.610966,4.205438,1.913129],[2.239042,2.950872,3.449959],[0.216305,0.442843,3.328052],[1.87141,2.470745,3.574559],[3.811378,2.768718,-0.228364],[2.511081,1.362724,2.969349],[-1.59813,7.866506,0.440184],[-3.307975,2.851072,-0.894978],[-0.107011,8.90573,-0.884399],[-3.855315,2.842597,-0.434541],[2.517853,1.090768,2.799687],[3.791709,2.36685,2.002703],[4.06294,2.773922,0.452723],[-2.973289,7.61703,-0.623653],[-2.95509,8.924462,-3.446319],[2.861402,0.562592,2.184397],[-1.109725,8.594206,-0.076812],[-0.725722,7.924485,-0.381133],[-1.485587,1.329994,-0.654405],[-4.342113,3.233735,1.752922],[-2.968049,7.955519,-2.09405],[-3.130948,0.446196,0.85287],[-4.958475,5.757329,1.447055],[-3.086547,7.615193,-1.953168],[-3.751923,5.412821,3.373373],[-4.599645,7.480953,1.677134],[1.133992,0.274871,0.032249],[-2.956512,8.126905,-1.785461],[-0.960645,4.73065,-1.191786],[-2.871064,0.875559,0.424881],[-4.932114,5.99614,1.483845],[-2.981761,8.124612,-1.387276],[0.362298,8.978545,-1.368024],[-4.408375,3.046271,0.602373],[2.865841,2.322263,-1.344625],[-4.7848,5.620895,0.594432],[-2.88322,0.338931,1.67231],[-4.688101,6.772931,1.872318],[-4.903948,6.164698,1.27135],[2.85663,1.005647,-0.906843],[2.691286,0.209811,0.050512],[-4.693636,6.477556,0.665796],[-4.472331,6.861067,0.477318],[0.883065,0.204907,3.073933],[-0.995867,8.048729,-0.653897],[-0.794663,5.670397,-0.390119],[3.313153,1.638006,-0.722289],[-4.856459,5.394758,1.032591],[-3.005448,7.783023,-0.819641],[3.11891,2.036974,-1.08689],[-2.364319,2.408419,2.63419],[-2.927132,8.75435,-3.537159],[-3.296222,7.964629,-3.134625],[-1.642041,4.13417,-1.301665],[2.030759,0.176372,-1.030923],[-4.559069,3.751053,0.548453],[3.438385,4.59454,-0.243215],[-2.561769,7.93935,0.177696],[2.990593,1.335314,-0.943177],[1.2808,0.276396,-0.49072],[-0.318889,0.290684,0.211143],[3.54614,3.342635,-0.767878],[-3.073372,7.780018,-2.357807],[-4.455388,4.387245,0.361038],[-4.659393,6.276064,2.767014],[0.636799,4.482223,-1.426284],[-2.987681,8.072969,-2.45245],[-2.610445,0.763554,1.792054],[3.358241,2.006707,-0.802973],[-0.498347,0.251594,0.962885],[3.1322,0.683312,2.038777],[-4.389801,7.493776,0.690247],[0.431467,4.22119,-1.614215],[-4.376181,3.213141,0.273255],[-4.872319,5.715645,0.829714],[-4.826893,6.195334,0.849912],[3.516562,2.23732,-0.677597],[3.131656,1.698841,-0.975761],[-4.754925,5.411666,1.989303],[-2.987299,7.320765,-0.629479],[-3.757635,3.274862,-0.744022],[3.487044,2.541999,-0.699933],[-4.53274,4.649505,0.77093],[-1.424192,0.099423,2.633327],[3.090867,2.476975,-1.146957],[-2.713256,0.815622,2.17311],[3.348121,3.254167,-0.984896],[-3.031379,0.16453,-0.309937],[-0.949757,4.518137,-1.309172],[-0.889509,0.095256,1.288803],[3.539594,1.966105,-0.553965],[-4.60612,7.127749,0.811958],[-2.332953,1.444713,1.624548],[3.136293,2.95805,-1.138272],[3.540808,3.069058,-0.735285],[3.678852,2.362375,-0.452543],[-4.648898,7.37438,0.954791],[-0.646871,0.19037,3.344746],[2.2825,0.29343,-0.826273],[-4.422291,7.183959,0.557517],[-4.694668,5.246103,2.541768],[-4.583691,4.145486,0.600207],[-2.934854,7.912513,-1.539269],[-3.067861,7.817472,-0.546501],[3.825095,3.229512,-0.237547],[2.532494,0.323059,2.387105],[-2.514583,0.692857,1.23597],[-4.736805,7.214384,1.259421],[-2.98071,8.409903,-2.468199],[2.621468,1.385844,-1.406355],[3.811447,3.560855,1.847828],[3.432925,1.497205,-0.489784],[3.746609,3.631538,-0.39067],[3.594909,2.832257,-0.576012],[-0.404192,5.300188,-0.856561],[-4.762996,6.483774,1.702648],[-4.756612,6.786223,1.43682],[-2.965309,8.437217,-2.785495],[2.863867,0.74087,-0.429684],[4.02503,2.968753,1.392419],[3.669036,1.833858,-0.304971],[-2.888864,0.720537,0.778057],[-2.36982,0.979443,1.054447],[-2.959259,8.222303,-2.659724],[-3.467825,7.545739,-2.333445],[2.153426,0.446256,-1.20523],[-3.229807,9.189699,-3.596609],[-3.72486,8.773707,-2.046671],[3.687218,3.297751,-0.523746],[1.381025,0.08815,-1.185668],[-2.796828,7.205622,-0.208783],[3.647194,4.066232,-0.291507],[-4.578376,3.885556,1.52546],[-2.840262,0.63094,1.89499],[-2.429514,0.922118,1.820781],[-4.675079,6.573925,2.423363],[2.806207,4.320188,-1.027372],[-1.289608,0.097241,1.321661],[-3.010731,8.141334,-2.866148],[3.202291,1.235617,-0.549025],[4.094792,2.477519,0.304581],[2.948403,0.966873,-0.664857],[-4.83297,5.920587,2.095461],[-2.169693,7.257277,0.946184],[-1.335807,3.057597,-1.303166],[-1.037877,0.64151,-1.685271],[2.627919,0.089814,0.439074],[3.815794,3.808102,1.730493],[-2.973455,8.433141,-3.08872],[-2.391558,7.331428,1.658264],[-4.333107,4.529978,1.850516],[-4.640293,3.767107,1.168841],[3.600716,4.46931,1.734024],[3.880803,1.730158,-0.172736],[3.814183,4.262372,1.167042],[4.37325,0.829542,1.413729],[2.490447,5.75111,0.011492],[3.460003,4.962436,1.188971],[3.918419,3.814234,1.358271],[-0.807595,8.840504,-0.953711],[3.752855,4.20577,1.57177],[-2.991085,8.816501,-3.244595],[-2.333196,7.128889,1.551985],[3.977718,3.570941,1.25937],[4.360071,0.755579,1.079916],[4.637579,1.027973,1.032567],[-2.317,7.421066,1.329589],[-1.013404,8.293662,-0.7823],[4.548023,1.020644,1.420462],[4.763258,1.266798,1.296203],[4.896,2.073084,1.255213],[4.015005,3.325226,1.093879],[4.94885,1.860936,0.894463],[-2.189645,6.954634,1.270077],[4.887442,1.720992,1.288526],[-3.184068,7.871802,0.956189],[-1.274318,0.839887,-1.224389],[-2.919521,7.84432,0.541629],[-2.994586,7.766102,1.96867],[-3.417504,9.241714,-3.093201],[-3.174563,7.466456,2.473617],[-3.263067,9.069412,-3.003459],[-2.841592,0.529833,2.693434],[-3.611069,9.158804,-2.829871],[-4.642828,5.927526,0.320549],[-3.809308,9.051035,-2.692749],[-2.837582,7.487987,-0.106206],[4.773025,2.330442,1.213899],[4.897435,2.209906,0.966657],[-3.067637,8.164062,-1.12661],[-3.122129,8.08074,-0.899194],[4.571019,2.358113,1.462054],[4.584884,2.454418,0.709466],[-3.661093,7.146581,-0.475948],[4.735131,2.415859,0.933939],[4.207556,2.540018,1.218293],[-3.607595,7.89161,-0.121172],[-1.527952,0.775564,-1.061903],[4.53874,2.503273,1.099583],[-3.938837,7.587988,0.082449],[-4.853582,6.152409,1.787943],[-4.752214,6.247234,2.296873],[4.602935,2.363955,0.488901],[-1.81638,6.365879,0.868272],[0.595467,4.744074,-1.32483],[1.87635,3.511986,-1.842924],[4.330947,2.534326,0.720503],[4.108736,2.750805,0.904552],[-1.890939,8.492628,-0.290768],[-3.504309,6.173058,-0.422804],[-1.611992,6.196732,0.648736],[-3.899149,7.826123,1.088845],[-3.078303,3.008813,-1.035784],[-2.798999,7.844899,1.340061],[-1.248839,5.959105,0.041761],[0.767779,4.337318,3.090817],[-3.831177,7.515605,2.432261],[-1.667528,6.156208,0.365267],[-1.726078,6.237384,1.100059],[-3.972037,4.520832,-0.370756],[-4.40449,7.636357,1.520425],[-1.34506,6.004054,1.293159],[-1.233556,6.049933,0.500651],[-3.696869,7.79732,0.37979],[-3.307798,8.949964,-2.698113],[-1.997295,6.615056,1.103691],[-3.219222,8.336394,-1.150614],[-3.452623,8.31866,-0.9417],[-3.94641,2.990494,2.212592],[-3.250025,8.030414,-0.596097],[-2.02375,1.571333,2.397939],[-3.190358,7.665013,2.268183],[-2.811918,7.618526,2.145587],[-1.005265,5.892303,0.072158],[-0.93721,5.974148,0.906669],[-4.646072,7.492193,1.45312],[-0.252931,1.797654,3.140638],[-1.076064,5.738433,1.695953],[-3.980534,7.744391,1.735791],[-0.721187,5.939396,0.526032],[-0.42818,5.919755,0.229001],[-1.43429,6.11622,0.93863],[-0.985638,5.939683,0.290636],[-4.433836,7.461372,1.966437],[-3.696398,7.844859,1.547325],[-3.390772,7.820186,1.812204],[-2.916787,7.864019,0.804341],[-3.715952,8.037269,-0.591341],[-4.204634,7.72919,1.119866],[-4.592233,5.592883,0.246264],[3.307299,5.061701,1.622917],[-3.515159,7.601467,2.368914],[-3.435742,8.533457,-1.37916],[-0.269421,4.545635,-1.366445],[-2.542124,3.768736,-1.258512],[-3.034003,7.873773,1.256854],[-2.801399,7.856028,1.080137],[3.29354,5.220894,1.081767],[-2.35109,1.299486,1.01206],[-3.232213,7.768136,2.047563],[3.290415,5.217525,0.68019],[-3.415109,7.731034,2.144326],[3.440357,4.962463,0.373387],[3.147346,5.352121,1.386923],[2.847252,5.469051,1.831981],[3.137682,5.410222,1.050188],[3.102694,5.310456,1.676434],[-3.044601,0.39515,1.994084],[2.903647,5.561338,1.518598],[-3.810148,8.093598,-0.889131],[4.234835,0.803054,1.593271],[3.240165,5.228747,0.325955],[3.037452,5.509825,0.817137],[2.635031,5.795187,1.439724],[3.071607,5.318303,0.080142],[2.909167,5.611751,1.155874],[3.044889,5.465928,0.486566],[2.502256,5.770673,1.740054],[-0.067497,0.086416,-1.190239],[2.33326,5.906051,0.138295],[0.65096,4.205423,3.308767],[-2.671137,7.936535,0.432731],[2.14463,5.879214,1.866047],[-4.776469,5.890689,0.561986],[2.72432,5.655145,0.211951],[2.730488,5.751455,0.695894],[2.572682,5.869295,1.152663],[1.906776,5.739123,2.196551],[2.344414,5.999961,0.772922],[-3.377905,7.448708,-1.863251],[2.285149,5.968156,1.459258],[2.385989,5.928974,0.3689],[2.192111,6.087516,0.959901],[2.36372,6.001101,1.074346],[1.972022,6.079603,1.591175],[1.87615,5.976698,1.91554],[-3.824761,9.05372,-2.928615],[2.044704,6.129704,1.263111],[-2.583046,0.849537,2.497344],[-0.078825,2.342205,3.520322],[-0.704686,0.537165,3.397194],[-0.257449,3.235334,3.647545],[-0.332064,1.448284,3.022583],[-2.200146,0.898284,-0.447212],[-2.497508,1.745446,1.829167],[0.30702,4.416315,2.978956],[-3.205197,3.479307,-1.040582],[0.110069,9.347725,-1.563686],[-0.82754,0.883886,3.065838],[-2.017103,1.244785,2.42512],[-0.421091,2.309929,3.153898],[-0.491604,3.796072,3.16245],[2.786955,3.501241,-1.340214],[-3.229055,4.380713,-0.899241],[3.730768,0.76845,1.90312],[-0.561079,2.652382,3.152463],[-3.461471,3.086496,2.662505],[-0.661405,3.446009,3.179939],[-0.915351,0.636755,3.243708],[-2.992964,8.915628,-3.729833],[-0.439627,3.502104,3.42665],[-1.154217,0.883181,2.800835],[-1.736193,1.465474,2.595489],[-0.423928,3.24435,3.548277],[-0.511153,2.871046,3.379749],[-0.675722,2.991756,3.143262],[-1.092602,0.599103,3.090639],[-0.89821,2.836952,2.840023],[-2.658412,0.781376,0.960575],[-2.271455,1.222857,1.330478],[-0.877861,1.111222,2.72263],[-0.306959,2.876987,3.556044],[-3.839274,7.84138,-0.918404],[-0.172094,4.083799,3.141708],[-1.548332,0.2529,2.864655],[-0.217353,4.873911,-1.223104],[-3.384242,3.181056,-0.95579],[-2.731704,0.382421,2.895502],[-1.285037,0.551267,2.947675],[0.077224,4.246579,3.066738],[-0.479979,1.77955,2.860011],[-0.716375,1.224694,2.666751],[-0.54622,3.138255,3.393457],[-2.33413,1.821222,2.124883],[-0.50653,2.037147,2.897465],[2.451291,1.211389,-1.466589],[-3.160047,2.894081,2.724286],[-4.137258,5.433431,3.21201],[0.462896,0.320456,-0.174837],[-0.37458,2.609447,3.379253],[-3.095244,0.256205,2.196446],[-4.197985,5.732991,3.262924],[-0.729747,0.246036,0.497036],[-2.356189,5.062,-0.965619],[-1.609036,0.25962,-1.487367],[-4.074381,6.074061,3.409459],[-3.619304,4.0022,2.65705],[-0.543393,8.742896,-1.056622],[-4.30356,6.858934,2.879642],[-0.716688,2.901831,-2.11202],[1.547362,0.083189,1.138764],[-0.250916,0.275268,1.201344],[-3.778035,3.13624,2.466177],[-4.594316,5.771342,3.01694],[-3.717706,3.442887,2.603344],[-4.311163,5.224669,3.019373],[-0.610389,2.095161,-1.923515],[-3.040086,6.196918,-0.429149],[-3.802695,3.768247,2.545523],[-0.159541,2.043362,3.328549],[-3.744329,4.31785,2.491889],[-3.047939,0.214155,1.873639],[-4.41685,6.113058,3.166774],[-1.165133,0.460692,-1.742134],[-1.371289,4.249996,-1.317935],[-3.447883,0.3521,0.466205],[-4.495555,6.465548,2.944147],[-3.455335,0.171653,0.390816],[-3.964028,4.017196,2.376009],[-1.323595,1.763126,-0.750772],[-3.971142,5.277524,-0.19496],[-3.222052,0.237723,0.872229],[-4.403784,3.89107,1.872077],[-3.333311,0.342997,0.661016],[-4.495871,4.29606,1.63608],[-3.636081,2.760711,2.361949],[-4.487235,3.559608,1.66737],[-4.719787,7.26888,1.658722],[-1.086143,9.035741,-0.707144],[-2.339693,1.600485,-0.404817],[-4.642011,7.123829,1.990987],[-1.498077,3.854035,-1.369787],[-4.188372,4.729363,2.02983],[-3.116344,5.882284,-0.468884],[-4.305236,4.246417,1.976991],[-3.022509,0.22819,1.065688],[-2.799916,0.52022,1.128319],[-4.262823,3.534409,2.020383],[-4.221533,3.947676,2.11735],[-3.744353,4.391712,-0.6193],[-1.272905,0.156694,-1.741753],[-3.62491,2.669825,-0.549664],[-4.180756,3.096179,1.987215],[-4.059276,4.305313,2.232924],[-2.812753,0.183226,1.370267],[-4.032437,3.512234,2.309985],[-0.03787,0.28188,0.530391],[-4.711562,5.468653,2.822838],[-4.500636,6.953314,2.564445],[-4.479433,7.216991,2.270682],[3.990562,0.50522,0.716309],[-2.512229,6.863447,-0.100658],[-2.968058,6.956639,-0.37061],[2.550375,3.142683,-1.54068],[-2.320059,3.521605,-1.279397],[-4.556319,6.64662,2.745363],[-4.281091,7.108116,2.667598],[-2.050095,8.411689,0.121353],[-2.44854,1.135487,0.851875],[3.121815,0.699943,-0.277167],[-4.69877,6.00376,2.843035],[-1.360599,8.824742,-0.595597],[1.128437,0.171611,0.301691],[-4.360146,6.289423,0.042233],[1.400795,4.088829,-1.620409],[-3.193462,8.460137,-3.559446],[-3.168771,8.878431,-3.635795],[-3.434275,9.304302,-3.460878],[-3.349993,8.808093,-3.38179],[-3.304823,8.323865,-3.325905],[-3.572607,9.308843,-3.207672],[-3.166393,8.201215,-3.43014],[-3.451638,9.05331,-3.351345],[-3.309591,8.549758,-3.375055],[-3.527992,8.793926,-3.100376],[-3.6287,8.981677,-3.076319],[-3.445505,8.001887,-2.8273],[-3.408011,8.221014,-3.039237],[-3.65928,8.740382,-2.808856],[-3.878019,8.797295,-2.462866],[-3.515132,8.232341,-2.747739],[-3.460331,8.51524,-3.06818],[-3.403703,7.658628,-2.648789],[-3.507113,8.00159,-2.582275],[-3.607373,8.174737,-2.401723],[-3.749043,8.378084,-2.226959],[-3.648514,8.502213,-2.6138],[-2.534199,0.904753,2.021148],[1.4083,5.744252,-0.571402],[-3.852536,8.571009,-2.352358],[2.868255,5.373126,-0.163705],[2.224363,4.669891,-1.061586],[-4.528281,4.885838,1.340274],[1.30817,4.609629,-1.28762],[-4.519698,3.422501,1.354826],[-3.549955,7.783228,-2.332859],[1.12313,6.120856,0.045115],[-3.620324,7.57716,-2.033423],[-0.798833,2.624133,-1.992682],[-3.617587,7.783148,-2.051383],[-3.669293,8.103776,-2.10227],[-3.892417,8.667436,-2.167288],[-0.537435,0.285345,-0.176267],[-0.841522,3.299866,-1.887861],[-0.761547,3.647082,-1.798953],[-3.661544,7.85708,-1.867924],[-3.886763,8.551783,-1.889171],[-0.591244,1.549749,-1.714784],[-0.775276,1.908218,-1.597609],[-0.961458,2.573273,-1.695549],[-2.215672,1.335009,2.143031],[-4.622674,4.130242,1.220683],[1.07344,0.290099,1.584734],[-0.976906,2.92171,-1.76667],[-1.13696,3.194401,-1.513455],[-3.743262,7.99949,-1.629286],[-2.876359,4.900986,-0.879556],[0.550835,3.905557,-2.031372],[0.777647,4.992314,-1.215703],[1.445881,4.266201,-1.414663],[1.274222,5.510543,-0.824495],[-0.864685,2.318581,-1.702389],[-0.627458,3.820722,-1.743153],[-3.867699,8.30866,-1.850066],[1.635287,5.45587,-0.83844],[-1.037876,2.538589,-1.513504],[-4.38993,4.73926,1.699639],[0.048709,4.765232,-1.279506],[-0.626548,1.339887,-1.595114],[-3.682827,7.643453,-1.723398],[-3.868783,8.180191,-1.511743],[-0.76988,1.508373,-1.419599],[-1.138374,2.766765,-1.448163],[1.699883,5.780752,-0.475361],[1.214305,0.308517,1.866405],[-1.713642,0.373461,-1.265204],[-1.582388,0.58294,-1.267977],[-0.879549,1.821581,-1.313787],[0.519057,5.858757,-0.381397],[-3.770989,2.449208,-0.132655],[0.087576,0.156713,-1.53616],[-0.942622,2.146534,-1.421494],[-1.026192,1.022164,-1.145423],[-0.964079,1.645473,-1.067631],[-1.109128,2.458789,-1.29106],[-1.037478,0.209489,-1.805424],[-3.724391,7.599686,-1.273458],[-3.787898,7.951792,-1.304794],[3.821677,2.165581,-0.181535],[-2.39467,0.304606,-0.570375],[-2.352928,1.0439,2.079369],[-0.288899,9.640684,-1.006079],[-3.472118,7.263001,-1.080326],[-1.240769,0.972352,-0.976446],[-1.845253,0.356801,-0.995574],[-2.32279,7.915361,-0.057477],[-1.08092,2.179315,-1.168821],[4.598833,2.156768,0.280264],[-4.725417,6.442373,2.056809],[-0.490347,9.46429,-0.981092],[-1.99652,0.09737,-0.765828],[-1.137793,1.888846,-0.894165],[-0.37247,4.29661,-1.465199],[-0.184631,5.692946,-0.421398],[-3.751694,7.742231,-1.086908],[-1.001416,1.298225,-0.904674],[-3.536884,7.190777,-0.788609],[-3.737597,7.511281,-0.940052],[-1.766651,0.669388,-0.873054],[3.112245,3.474345,-1.129672],[-0.175504,3.81298,-2.0479],[-3.766762,7.412514,-0.681569],[-0.63375,9.439424,-0.785128],[-0.518199,4.768982,-1.258625],[0.790619,4.212759,-1.610218],[-3.761951,3.742528,-0.756283],[0.897483,5.679808,-0.612423],[2.221126,4.427468,-1.252155],[-0.728577,5.846457,0.062702],[0.194451,9.503908,-1.482461],[-0.099243,9.385459,-1.39564],[0.643185,3.636855,-2.180247],[0.894522,5.900601,-0.356935],[2.595516,4.75731,-0.893245],[1.108497,3.936893,-1.905098],[1.989894,5.789726,-0.343268],[-3.802345,7.655508,-0.613817],[2.339353,4.96257,-0.90308],[0.12564,4.013324,-1.879236],[-4.078965,3.683254,-0.445439],[2.092899,5.256128,-0.831607],[0.427571,0.291769,1.272964],[2.335549,3.480056,-1.581949],[-0.15687,0.324827,-1.648922],[-0.536522,5.760786,-0.203535],[1.507082,0.078251,-0.923109],[-1.854742,0.134826,2.698774],[-3.939827,3.168498,-0.526144],[-3.98461,3.39869,-0.533212],[-3.961738,4.217132,-0.489147],[4.273789,2.181164,0.153786],[-0.470498,5.645664,-0.439079],[-0.414539,5.488017,-0.673379],[-0.097462,5.062739,-1.114863],[1.198092,5.882232,-0.391699],[2.855834,5.085022,-0.498678],[1.037998,4.129757,-1.701811],[1.728091,5.068444,-1.063761],[-3.832258,2.625141,-0.311384],[-4.078526,3.070256,-0.284362],[-4.080365,3.954243,-0.440471],[-0.152578,5.276267,-0.929815],[-1.489635,8.928082,-0.295891],[0.759294,5.15585,-1.087374],[-4.000338,2.801647,-0.235135],[-4.290801,3.823209,-0.19374],[-4.221493,4.25618,-0.189894],[-4.066195,4.71916,-0.201724],[-0.155386,4.076396,-1.662865],[3.054571,4.414305,-0.825985],[-1.652919,8.726499,-0.388504],[-3.042753,0.560068,-0.126425],[-2.434456,1.118088,-0.213563],[-2.623502,1.845062,-0.283697],[-4.233371,3.43941,-0.202918],[2.726702,3.82071,-1.280097],[0.184199,4.14639,-1.673653],[-1.289203,0.624562,-1.560929],[-3.823676,7.382458,-0.407223],[0.476667,5.064419,-1.143742],[-3.873651,4.955112,-0.269389],[1.349666,5.312227,-1.000274],[-2.043776,8.434488,-0.108891],[-2.763964,0.733395,-0.129294],[-4.380505,3.664409,-0.024546],[-0.71211,5.341811,-0.803281],[-3.960858,7.183112,-0.118407],[-3.822277,7.712853,-0.263221],[-2.346808,8.108588,0.063244],[-1.841731,8.642999,-0.142496],[-2.600055,0.985604,-0.043595],[-3.513057,2.213243,-0.044151],[-3.963492,2.603055,-0.080898],[-4.258066,3.14537,-0.027046],[-4.261572,5.00334,0.13004],[0.795464,3.99873,-1.905688],[-3.300873,0.384761,0.013271],[-2.770244,0.881942,0.077313],[-3.456227,1.993871,0.301054],[-4.441987,3.914144,0.177867],[-4.367075,6.611414,0.165312],[-3.201767,0.576292,0.105769],[-3.174354,0.645009,0.440373],[-2.996576,0.74262,0.161325],[-2.724979,1.656497,0.092983],[-3.261757,2.017742,-0.070763],[-4.280173,4.518235,-0.002999],[-4.471073,5.945358,0.05202],[-3.877137,2.40743,0.274928],[-4.371219,4.252758,0.078039],[-3.400914,0.40983,0.238599],[-4.44293,3.523242,0.146339],[-4.574528,5.279761,0.353923],[-4.226643,7.191282,0.269256],[-4.16361,2.843204,0.097727],[-4.528506,5.011661,0.536625],[0.35514,5.664802,-0.572814],[2.508711,5.580976,-0.266636],[2.556226,3.633779,-1.426362],[1.878456,4.533714,-1.223744],[2.460709,4.440241,-1.1395],[2.218589,5.514603,-0.560066],[2.263712,5.737023,-0.250694],[2.964981,3.814858,-1.139927],[0.991384,5.304131,-0.999867],[2.81187,4.547292,-0.916025],[2.918089,4.768382,-0.702808],[3.262403,4.414286,-0.657935],[0.652136,6.089113,0.069089],[3.361389,3.5052,-0.946123],[2.613042,5.037192,-0.697153],[0.094339,4.36858,-1.451238],[3.290862,4.155716,-0.732318],[2.658063,4.073614,-1.217455],[3.260349,3.753257,-0.946819],[1.124268,4.862463,-1.207855],[3.35158,4.899247,-0.027586],[3.194057,4.691257,-0.524566],[3.090119,5.116085,-0.23255],[2.418965,3.811753,-1.419399],[2.191789,3.877038,-1.47023],[4.043166,2.034188,0.015477],[-1.026966,0.86766,-1.410912],[1.937563,3.860005,-1.617465],[2.98904,4.101806,-0.998132],[-0.142611,5.865305,-0.100872],[3.972673,2.292069,0.089463],[3.23349,3.959925,-0.849829],[0.16304,5.857276,-0.216704],[4.122964,1.770061,-0.114906],[2.099057,4.978374,-0.98449],[3.502411,3.76181,-0.667502],[2.079484,5.939614,-0.036205],[-0.084568,3.525193,-2.253506],[0.423859,4.06095,-1.845327],[1.6013,6.006466,-0.153429],[0.271701,3.844964,-2.078748],[0.273577,5.218904,-0.994711],[-0.410578,3.92165,-1.773635],[1.941954,5.60041,-0.621569],[0.100825,5.462131,-0.774256],[-0.53016,3.619892,-2.027451],[-0.822371,5.517453,-0.605747],[-2.474925,7.670892,-0.020174],[4.01571,0.830194,-0.013793],[-0.400092,5.094112,-1.041992],[-2.887284,5.581246,-0.525324],[-1.559841,6.050972,0.079301],[-0.469317,3.291673,-2.235211],[0.337397,3.467926,-2.295458],[-2.632074,5.573701,-0.582717],[-0.030318,6.011395,0.276616],[-0.934373,0.388987,-1.780523],[-2.661263,5.844838,-0.425966],[0.549353,5.489646,-0.807268],[-2.194355,6.197491,-0.109322],[-2.289618,5.664813,-0.581098],[1.583583,3.796366,-1.844498],[0.855295,0.215979,-1.425557],[-2.627569,5.300236,-0.767174],[4.333347,2.384332,0.399129],[-1.880401,5.583843,-0.696561],[-2.172346,5.324859,-0.846246],[-2.27058,5.906265,-0.388373],[-1.960049,5.889346,-0.397593],[0.965756,3.67547,-2.105671],[-2.014066,6.431125,0.287254],[-1.776173,5.287097,-0.89091],[-2.025852,5.089562,-0.980218],[-1.886418,6.108358,-0.000667],[-1.600803,5.785347,-0.491069],[-1.66188,4.968053,-1.042535],[-1.600621,5.962818,-0.188044],[-1.588831,5.615418,-0.665456],[4.46901,1.880138,0.057248],[-1.978845,0.927399,-0.554856],[-1.408074,5.325266,-0.83967],[1.923123,4.843955,-1.101389],[-2.87378,0.117106,-0.412735],[-1.222193,5.62638,-0.539981],[-2.632537,0.166349,-0.489218],[-1.370865,5.838832,-0.341026],[-1.067742,5.448874,-0.692701],[-1.073798,5.220878,-0.908779],[-1.147562,4.950417,-1.079727],[-2.789115,4.531047,-1.042713],[-3.550826,4.170487,-0.806058],[-3.331694,4.798177,-0.69568],[-3.689404,4.688543,-0.534317],[-3.511509,5.106246,-0.483632],[1.796344,0.076137,0.080455],[-3.306354,5.473605,-0.478764],[-2.692503,3.346604,-1.20959],[-3.963056,5.187462,3.113156],[-3.901231,6.391477,-0.246984],[4.484234,1.518638,-0.001617],[4.308829,1.657716,-0.119275],[4.290045,1.339528,-0.110626],[-3.514938,3.524974,-0.909109],[-2.1943,2.12163,-0.71966],[4.108206,1.091087,-0.11416],[3.785312,1.392435,-0.28588],[4.092886,1.480476,-0.210655],[-2.965937,6.469006,-0.379085],[-3.708581,2.962974,-0.63979],[-3.297971,2.218917,-0.299872],[3.806949,0.804703,-0.11438],[3.747957,1.059258,-0.273069],[-3.101827,4.111444,-1.006255],[-1.536445,4.658913,-1.195049],[-3.549826,2.450555,-0.375694],[-3.676495,2.108366,0.534323],[-3.674738,5.925075,-0.400011],[-2.250115,2.848335,-1.121174],[-3.698062,5.667567,-0.381396],[3.468966,0.734643,-0.190624],[-3.97972,5.670078,-0.26874],[-3.002087,4.337837,-1.033421],[-3.356392,2.608308,-0.713323],[-1.833016,3.359983,-1.28775],[-1.989069,3.632416,-1.305607],[3.591254,0.542371,0.026146],[3.364927,1.082572,-0.342613],[-3.393759,3.866801,-0.937266],[-4.124865,5.549529,-0.161729],[-4.423423,5.687223,0.000103],[-1.496881,2.601785,-1.114328],[-2.642297,6.496932,-0.264175],[-3.684236,6.819423,-0.320233],[-2.286996,3.167067,-1.246651],[-1.624896,8.44848,-0.530014],[-3.666787,2.159266,0.268149],[-2.402625,2.011243,-0.56446],[-2.736166,2.259839,-0.6943],[-2.168611,3.89078,-1.292206],[-2.065956,3.345708,-1.281346],[-2.778147,2.675605,-0.995706],[-3.507431,4.513272,-0.71829],[-2.301184,4.293911,-1.238182],[3.205808,0.211078,0.394349],[-2.129936,4.870577,-1.080781],[-2.287977,2.496593,-0.934069],[-2.701833,2.931814,-1.114509],[3.294795,0.50631,-0.081062],[-2.552829,7.468771,-0.021541],[3.06721,0.944066,-0.43074],[-2.86086,1.973622,-0.303132],[-3.598818,5.419613,-0.401645],[-1.524381,0.080156,-1.61662],[-1.907291,2.646274,-1.039438],[2.950783,0.407562,-0.105407],[-1.663048,1.655038,-0.689787],[-1.728102,1.110064,-0.635963],[-2.085823,7.686296,-0.159745],[2.883518,3.157009,-1.30858],[-2.724116,0.417169,-0.389719],[-1.788636,7.862672,-0.346413],[-2.186418,1.249609,-0.434583],[-3.092434,2.606657,-0.860002],[-1.737314,3.874201,-1.330986],[2.564522,0.422967,-0.390903],[1.670782,3.538432,-1.924753],[-2.338131,4.02578,-1.286673],[-1.916516,4.054121,-1.301788],[2.87159,2.034949,-1.267139],[-1.931518,3.062883,-1.197227],[-0.816602,0.135682,3.104104],[0.469392,0.213916,-1.489608],[2.574055,1.950091,-1.514427],[2.733595,2.682546,-1.461213],[-1.915407,4.693647,-1.151721],[-3.412883,5.867094,-0.450528],[2.28822,0.120432,-0.04102],[2.244477,0.14424,-0.376933],[-1.676198,3.570698,-1.328031],[-1.821193,4.366982,-1.266271],[-1.552208,8.099221,-0.53262],[-1.727419,2.39097,-0.989456],[-2.468226,4.711663,-1.069766],[-2.451669,6.113319,-0.273788],[2.635447,2.295842,-1.518361],[-2.020809,8.150253,-0.246714],[2.292455,0.805596,-1.3042],[2.641556,1.65665,-1.466962],[2.409062,2.842538,-1.635025],[2.456682,1.459484,-1.57543],[-1.691047,3.173582,-1.247082],[-1.865642,1.957608,-0.768683],[-3.401579,0.20407,0.100932],[2.301981,1.7102,-1.650461],[2.342929,2.611944,-1.690713],[-1.676111,2.923894,-1.17835],[-2.992039,3.547631,-1.118945],[-3.571677,6.504634,-0.375455],[2.141764,1.460869,-1.702464],[-3.221958,5.146049,-0.615632],[2.19238,2.949367,-1.747242],[2.320791,2.232971,-1.706842],[2.088678,2.585235,-1.813159],[-2.196404,0.592218,-0.569709],[-2.120811,1.836483,-0.62338],[-1.949935,2.271249,-0.874128],[2.235901,1.110183,-1.510719],[2.020157,3.241128,-1.803917],[2.054336,1.949394,-1.792332],[-3.094117,4.996595,-0.740238],[2.038063,0.635949,-1.402041],[1.980644,1.684408,-1.76778],[1.587432,3.306542,-1.991131],[1.935322,0.976267,-1.602208],[1.922621,1.235522,-1.698813],[1.712495,1.911874,-1.903234],[1.912802,2.259273,-1.888698],[1.884367,0.355453,-1.312633],[1.676427,0.76283,-1.539455],[1.78453,2.83662,-1.943035],[1.697312,0.120281,-1.150324],[1.648318,2.484973,-1.999505],[-4.051804,5.958472,-0.231731],[-1.964823,1.464607,-0.58115],[1.55996,2.183486,-1.971378],[1.628125,1.045912,-1.707832],[1.701684,1.540428,-1.827156],[1.567475,4.869481,-1.184665],[1.432492,0.843779,-1.648083],[1.173837,2.978983,-2.156687],[1.235287,3.37975,-2.09515],[1.252589,1.525293,-1.949205],[1.159334,2.336379,-2.105361],[1.49061,2.695263,-2.083216],[-4.122486,6.782604,-0.02545],[1.173388,0.279193,-1.423418],[1.505684,0.380815,-1.414395],[1.391423,1.343031,-1.843557],[1.263449,2.73225,-2.144961],[1.295858,0.597122,-1.515628],[1.245851,3.729126,-1.993015],[-2.761439,6.23717,-0.365856],[0.978887,1.664888,-2.046633],[1.219542,0.982729,-1.785486],[1.315915,1.91748,-2.02788],[-3.052746,2.127222,-0.369082],[0.977656,1.36223,-1.944119],[0.936122,3.39447,-2.203007],[-2.740036,4.184702,-1.122849],[0.853581,2.864694,-2.260847],[0.719569,0.818762,-1.763618],[0.839115,1.159359,-1.907943],[0.932069,1.94559,-2.117962],[0.579321,3.326747,-2.299369],[0.86324,0.597822,-1.565106],[0.574567,1.158452,-1.943123],[0.525138,2.137252,-2.213867],[0.779941,2.342019,-2.206157],[0.915255,2.618102,-2.209041],[0.526426,3.02241,-2.321826],[0.495431,2.521396,-2.295905],[0.80799,3.156817,-2.286432],[0.273556,1.304936,-2.012509],[0.664326,1.530024,-2.048722],[0.219173,2.32907,-2.323212],[0.405324,0.695359,-1.704884],[0.398827,0.946649,-1.843899],[0.345109,1.608829,-2.100174],[-2.356743,0.062032,-0.4947],[-3.001084,0.27146,2.560034],[-2.064663,0.303055,-0.697324],[0.221271,3.174023,-2.374399],[0.195842,0.437865,-1.621473],[-0.385613,0.297763,1.960096],[1.999609,0.108928,-0.79125],[0.351698,9.227494,-1.57565],[0.021477,2.191913,-2.309353],[0.246381,2.836575,-2.356365],[1.543281,0.237539,1.901906],[0.031881,9.147022,-1.454203],[-0.001881,1.648503,-2.108044],[0.333423,1.907088,-2.204533],[0.044063,2.634032,-2.368412],[-0.028148,3.053684,-2.390082],[0.02413,3.34297,-2.36544],[-0.272645,9.02879,-1.238685],[-0.006348,0.832044,-1.758222],[-0.321105,1.458754,-1.886313],[-0.153948,8.618809,-1.105353],[-0.409303,1.137783,-1.720556],[-0.410054,1.742789,-1.957989],[-0.287905,2.380404,-2.294509],[-0.261375,2.646629,-2.356322],[-0.221986,3.215303,-2.345844],[-0.31608,0.687581,-1.71901],[-0.537705,0.855802,-1.648585],[-0.142834,1.193053,-1.87371],[-0.24371,2.044435,-2.176958],[-0.437999,2.959748,-2.299698],[-0.78895,0.176226,-1.729046],[-0.608509,0.546932,-1.734032],[-0.693698,4.478782,-1.369372],[-0.669153,8.469645,-0.911149],[-0.741857,1.082705,-1.458474],[-0.554059,2.440325,-2.141785],[2.09261,0.153182,2.57581],[1.792547,0.111794,2.563777],[1.855787,0.189541,2.835089],[1.492601,0.232246,2.987681],[-0.284918,0.236687,3.429738],[2.604841,0.11997,1.01506],[0.331271,0.168113,3.124031],[0.280606,0.308368,2.495937],[0.544591,0.325711,2.081274],[0.193145,0.19154,-0.977556],[3.810099,0.42324,1.032202],[3.54622,0.379245,1.392814],[0.61402,0.276328,0.849356],[-1.198628,0.144953,2.911457],[4.17199,0.68037,1.391526],[0.88279,0.321339,2.059129],[1.93035,0.109992,2.054154],[1.620331,0.121986,2.37203],[2.374812,0.10921,1.734876],[-0.031227,0.294412,2.593687],[4.075018,0.561914,1.038065],[-0.570366,0.126583,2.975558],[0.950052,0.318463,1.804012],[1.130034,0.117125,0.98385],[2.123049,0.08946,1.665911],[2.087572,0.068621,0.335013],[2.927337,0.167117,0.289611],[0.528876,0.313434,3.205969],[1.174911,0.162744,1.328262],[-4.88844,5.59535,1.661134],[-4.709607,5.165338,1.324082],[0.871199,0.277021,1.263831],[-3.910877,2.349318,1.272269],[1.56824,0.118605,2.768112],[1.179176,0.152617,-0.858003],[1.634629,0.247872,2.128625],[-4.627425,5.126935,1.617836],[3.845542,0.54907,1.45601],[2.654006,0.165508,1.637169],[-0.678324,0.26488,1.974741],[2.451139,0.100377,0.213768],[0.633199,0.286719,0.403357],[-0.533042,0.2524,1.373267],[0.99317,0.171106,0.624966],[-0.100063,0.306466,2.170225],[1.245943,0.092351,0.661031],[1.390414,0.198996,-0.0864],[-4.457265,5.030531,2.138242],[2.89776,0.146575,1.297468],[1.802703,0.088824,-0.490405],[1.055447,0.309261,2.392437],[2.300436,0.142429,2.104254],[2.33399,0.187756,2.416935],[2.325183,0.134349,0.574063],[2.410924,0.370971,2.637115],[1.132924,0.290511,3.061],[1.764028,0.070212,-0.80535],[2.156994,0.397657,2.844061],[0.920711,0.225527,-0.882456],[-4.552135,5.24096,2.85514],[0.210016,0.309396,2.064296],[0.612067,0.136815,-1.086002],[3.150236,0.426757,1.802703],[-0.24824,0.282258,1.470997],[0.974269,0.301311,-0.640898],[-4.401413,5.03966,2.535553],[0.644319,0.274006,-0.817806],[0.332922,0.309077,0.108474],[3.610001,0.317447,0.689353],[3.335681,0.358195,0.118477],[0.623544,0.318983,-0.4193],[-0.11012,0.307747,1.831331],[-0.407528,0.291044,2.282935],[0.069783,0.285095,0.950289],[0.970135,0.310392,-0.283742],[0.840564,0.306898,0.098854],[-0.541827,0.267753,1.683795],[-3.956082,4.55713,2.297164],[-4.161036,2.834481,1.64183],[-4.093952,4.977551,2.747747],[2.661819,0.261867,1.926145],[-3.749926,2.161875,0.895238],[-2.497776,1.3629,0.791855],[0.691482,0.304968,1.582939],[-4.013193,4.830963,2.4769],[-3.639585,2.091265,1.304415],[-3.9767,2.563053,1.6284],[-3.979915,2.788616,1.977977],[0.388782,0.312656,1.709168],[-3.40873,1.877324,0.851652],[-3.671637,5.136974,3.170734],[-3.12964,1.852012,0.157682],[-3.629687,4.852698,2.686837],[-3.196164,1.793459,0.452804],[-3.746338,2.31357,1.648551],[2.992192,0.125251,0.575976],[-3.254051,0.054431,0.314152],[-3.474644,1.925288,1.134116],[-3.418372,2.022882,1.578901],[-2.920955,1.705403,0.29842],[-3.57229,2.152022,1.607572],[-3.251259,0.09013,-0.106174],[-3.299952,1.877781,1.348623],[-3.666819,2.441459,2.004838],[-2.912646,1.824748,-0.045348],[-3.399511,2.479484,2.340393],[-3.009754,0.015286,0.075567],[-3.381443,2.316937,2.156923],[-3.352801,2.133341,1.857366],[-3.01788,1.687685,0.645867],[-2.931857,1.678712,1.158472],[-3.301008,0.08836,0.591001],[1.358025,0.19795,1.599144],[-2.999565,1.845016,1.618396],[-2.767957,0.028397,-0.196436],[-2.93962,2.078779,2.140593],[-3.346648,2.674056,2.518097],[3.324322,0.20822,0.628605],[3.091677,0.137202,0.9345],[-2.881807,0.009952,0.318439],[-2.764946,1.786619,1.693439],[-2.905542,1.932343,1.900002],[-3.140854,2.271384,2.274946],[-2.88995,2.487856,2.574759],[-2.367194,-0.000943,-0.15576],[-3.050738,0.068703,0.742988],[-2.759525,1.55679,0.877782],[-3.151775,2.48054,2.482749],[-2.578618,-0.002885,0.165716],[-2.651618,1.877246,1.981189],[-2.933973,0.133731,1.631023],[1.047628,0.100284,-1.085248],[-1.585123,0.062083,-1.394896],[-2.287917,-0.002671,0.214434],[-2.524899,0.007481,0.471788],[-2.815492,2.188198,2.343294],[-2.095142,-0.003149,-0.094574],[-2.172686,-0.000133,0.47963],[-2.732704,0.074306,1.742079],[-2.49653,2.145668,2.42691],[-1.343683,0.047721,-1.506391],[-2.581185,0.048703,0.975528],[-2.905101,0.083158,2.010052],[-2.601514,2.007801,2.223089],[-2.339464,0.02634,1.484304],[-2.907873,0.10367,2.378149],[-1.368796,0.062516,-1.049125],[-1.93244,0.02443,-0.427603],[-2.705081,0.060513,2.303802],[3.372155,0.206274,0.892293],[-1.761827,0.093202,-1.037404],[-1.700667,0.0397,-0.614221],[-1.872291,0.011979,-0.135753],[-1.929257,0.074005,0.728999],[-2.520128,0.049665,1.99054],[-2.699411,0.10092,2.603116],[3.211701,0.27302,1.423357],[-1.445362,0.1371,-0.626491],[2.921332,0.259112,1.645525],[-0.993242,0.058686,-1.408916],[-0.944986,0.157541,-1.097665],[-2.154301,0.032749,1.882001],[-2.108789,1.988557,2.442673],[-1.015659,0.25497,-0.416665],[-1.898411,0.015872,0.16715],[-1.585517,0.027121,0.453445],[-2.311105,0.061264,2.327061],[-2.637042,0.152224,2.832201],[-2.087515,2.292972,2.617585],[-0.750611,0.056697,-1.504516],[-0.472029,0.075654,-1.360203],[-0.710798,0.139244,-1.183863],[-0.97755,0.26052,-0.831167],[-0.655814,0.260843,-0.880068],[-0.897513,0.275537,-0.133042],[-2.049194,0.084947,2.455422],[-0.177837,0.076362,-1.449009],[-0.553393,0.279083,-0.59573],[-1.788636,0.06163,2.231198],[-0.34761,0.255578,-0.999614],[-1.398589,0.036482,0.65871],[-1.133918,0.05617,0.69473],[-1.43369,0.058226,1.977865],[-2.505459,1.492266,1.19295]]
exports.cells=[[2,1661,3],[1676,7,6],[712,1694,9],[3,1674,1662],[11,1672,0],[1705,0,1],[5,6,1674],[4,5,1674],[7,8,712],[2,1662,10],[1,10,1705],[11,1690,1672],[1705,11,0],[5,1676,6],[7,9,6],[7,712,9],[2,3,1662],[3,4,1674],[1,2,10],[12,82,1837],[1808,12,1799],[1808,1799,1796],[12,861,82],[861,1808,13],[1808,861,12],[1799,12,1816],[1680,14,1444],[15,17,16],[14,1678,1700],[16,17,1679],[15,1660,17],[14,1084,1678],[15,1708,18],[15,18,1660],[1680,1084,14],[1680,15,1084],[15,1680,1708],[793,813,119],[1076,793,119],[1076,1836,22],[23,19,20],[21,1076,22],[21,22,23],[23,20,21],[1076,119,1836],[806,634,470],[432,1349,806],[251,42,125],[809,1171,791],[953,631,827],[634,1210,1176],[157,1832,1834],[56,219,53],[126,38,83],[37,85,43],[59,1151,1154],[83,75,41],[77,85,138],[201,948,46],[1362,36,37],[452,775,885],[1237,95,104],[966,963,1262],[85,77,43],[36,85,37],[1018,439,1019],[41,225,481],[85,83,127],[93,83,41],[935,972,962],[116,93,100],[98,82,813],[41,75,225],[298,751,54],[1021,415,1018],[77,138,128],[766,823,1347],[593,121,573],[905,885,667],[786,744,747],[100,41,107],[604,334,765],[779,450,825],[968,962,969],[225,365,481],[365,283,196],[161,160,303],[875,399,158],[328,1817,954],[62,61,1079],[358,81,72],[74,211,133],[160,161,138],[91,62,1079],[167,56,1405],[56,167,219],[913,914,48],[344,57,102],[43,77,128],[1075,97,1079],[389,882,887],[219,108,53],[1242,859,120],[604,840,618],[754,87,762],[197,36,1362],[1439,88,1200],[1652,304,89],[81,44,940],[445,463,151],[717,520,92],[129,116,100],[1666,1811,624],[1079,97,91],[62,91,71],[688,898,526],[463,74,133],[278,826,99],[961,372,42],[799,94,1007],[100,93,41],[1314,943,1301],[184,230,109],[875,1195,231],[133,176,189],[751,755,826],[101,102,57],[1198,513,117],[748,518,97],[1145,1484,1304],[358,658,81],[971,672,993],[445,151,456],[252,621,122],[36,271,126],[85,36,126],[116,83,93],[141,171,1747],[1081,883,103],[1398,1454,149],[457,121,593],[127,116,303],[697,70,891],[457,891,1652],[1058,1668,112],[518,130,97],[214,319,131],[185,1451,1449],[463,133,516],[1428,123,177],[113,862,561],[215,248,136],[186,42,251],[127,83,116],[160,85,127],[162,129,140],[154,169,1080],[169,170,1080],[210,174,166],[1529,1492,1524],[450,875,231],[399,875,450],[171,141,170],[113,1155,452],[131,319,360],[44,175,904],[452,872,113],[746,754,407],[147,149,150],[309,390,1148],[53,186,283],[757,158,797],[303,129,162],[429,303,162],[154,168,169],[673,164,193],[38,271,75],[320,288,1022],[246,476,173],[175,548,904],[182,728,456],[199,170,169],[168,199,169],[199,171,170],[184,238,230],[246,247,180],[1496,1483,1467],[147,150,148],[828,472,445],[53,108,186],[56,53,271],[186,961,42],[1342,391,57],[1664,157,1834],[1070,204,178],[178,204,179],[285,215,295],[692,55,360],[192,193,286],[359,673,209],[586,195,653],[121,89,573],[202,171,199],[238,515,311],[174,210,240],[174,105,166],[717,276,595],[1155,1149,452],[1405,56,197],[53,283,30],[75,53,30],[45,235,1651],[210,166,490],[181,193,192],[185,620,217],[26,798,759],[1070,226,204],[220,187,179],[220,168,187],[202,222,171],[359,209,181],[182,456,736],[964,167,1405],[76,250,414],[807,1280,1833],[70,883,1652],[227,179,204],[221,199,168],[221,202,199],[360,494,131],[214,241,319],[105,247,166],[205,203,260],[388,480,939],[482,855,211],[8,807,1833],[226,255,204],[228,221,168],[166,173,490],[701,369,702],[211,855,262],[631,920,630],[1448,1147,1584],[255,227,204],[237,220,179],[228,168,220],[222,256,555],[215,259,279],[126,271,38],[108,50,186],[227,236,179],[236,237,179],[220,237,228],[228,202,221],[256,222,202],[555,256,229],[259,152,279],[27,1296,31],[186,50,961],[961,234,372],[1651,235,812],[1572,1147,1448],[255,226,1778],[255,236,227],[256,257,229],[106,184,109],[241,410,188],[177,578,620],[209,673,181],[1136,1457,79],[1507,245,718],[255,273,236],[275,410,241],[206,851,250],[1459,253,1595],[1406,677,1650],[228,274,202],[202,281,256],[348,239,496],[205,172,203],[369,248,702],[261,550,218],[261,465,550],[574,243,566],[921,900,1220],[291,273,255],[348,238,265],[109,230,194],[149,380,323],[443,270,421],[272,291,255],[274,228,237],[274,292,202],[281,257,256],[276,543,341],[152,259,275],[1111,831,249],[632,556,364],[299,273,291],[299,236,273],[280,237,236],[202,292,281],[247,246,173],[282,49,66],[1620,1233,1553],[299,280,236],[280,305,237],[237,305,274],[306,292,274],[330,257,281],[246,194,264],[166,247,173],[912,894,896],[611,320,244],[1154,1020,907],[969,962,290],[272,299,291],[305,318,274],[145,212,240],[164,248,285],[259,277,275],[193,164,295],[269,240,210],[1033,288,320],[46,948,206],[336,280,299],[330,281,292],[257,307,300],[369,136,248],[145,240,269],[502,84,465],[193,295,286],[164,285,295],[282,302,49],[161,303,429],[318,306,274],[306,330,292],[315,257,330],[315,307,257],[307,352,300],[300,352,308],[275,277,403],[353,1141,333],[1420,425,47],[611,313,320],[85,126,83],[128,1180,43],[303,116,129],[280,314,305],[314,318,305],[190,181,242],[203,214,131],[820,795,815],[322,299,272],[322,336,299],[315,339,307],[172,152,617],[172,214,203],[321,1033,320],[1401,941,946],[85,160,138],[976,454,951],[747,60,786],[317,322,272],[339,352,307],[266,33,867],[163,224,218],[247,614,180],[648,639,553],[388,172,205],[611,345,313],[313,345,320],[160,127,303],[454,672,951],[317,329,322],[314,280,336],[306,338,330],[330,339,315],[1236,115,436],[342,321,320],[1046,355,328],[328,346,325],[325,346,317],[367,314,336],[314,337,318],[337,306,318],[338,343,330],[342,320,345],[355,349,328],[346,329,317],[347,336,322],[314,362,337],[330,343,339],[340,308,352],[135,906,1022],[239,156,491],[194,230,486],[40,1015,1003],[321,355,1046],[329,382,322],[382,347,322],[347,367,336],[337,371,306],[306,371,338],[1681,296,1493],[286,172,388],[230,348,486],[348,183,486],[384,332,830],[328,349,346],[367,362,314],[371,343,338],[339,351,352],[57,344,78],[342,355,321],[386,346,349],[386,350,346],[346,350,329],[347,366,367],[343,363,339],[323,380,324],[152,275,241],[345,1045,342],[350,374,329],[339,363,351],[234,340,352],[353,361,354],[40,34,1015],[373,355,342],[373,349,355],[374,382,329],[366,347,382],[371,363,343],[351,379,352],[379,372,352],[372,234,352],[156,190,491],[319,241,692],[354,361,31],[366,377,367],[363,379,351],[133,590,516],[197,56,271],[1045,370,342],[370,373,342],[374,350,386],[377,366,382],[367,395,362],[400,337,362],[400,371,337],[378,363,371],[106,109,614],[181,673,193],[953,920,631],[376,349,373],[376,386,349],[378,379,363],[224,375,218],[279,152,172],[361,619,381],[1347,823,795],[760,857,384],[392,374,386],[394,395,367],[383,371,400],[383,378,371],[218,375,261],[197,271,36],[414,454,976],[385,376,373],[1051,382,374],[387,394,367],[377,387,367],[395,400,362],[279,172,295],[30,365,225],[450,231,825],[385,373,370],[398,374,392],[1051,377,382],[396,378,383],[348,496,183],[295,172,286],[357,269,495],[1148,390,1411],[75,30,225],[206,76,54],[412,386,376],[412,392,386],[396,383,400],[651,114,878],[123,1241,506],[238,311,265],[381,653,29],[618,815,334],[427,1032,411],[298,414,976],[791,332,384],[129,100,140],[412,404,392],[392,404,398],[140,107,360],[395,394,400],[423,379,378],[385,412,376],[406,94,58],[419,415,1021],[422,423,378],[423,125,379],[258,508,238],[311,156,265],[213,287,491],[449,411,1024],[412,1068,404],[55,140,360],[76,414,54],[394,416,400],[400,416,396],[422,378,396],[1258,796,789],[427,411,449],[427,297,1032],[1385,1366,483],[417,448,284],[1507,341,245],[162,140,444],[658,44,81],[433,125,423],[438,251,125],[429,162,439],[1342,57,1348],[765,766,442],[697,891,695],[1057,396,416],[440,423,422],[440,433,423],[433,438,125],[438,196,251],[74,482,211],[1136,79,144],[29,195,424],[242,1004,492],[57,757,28],[414,298,54],[238,348,230],[224,163,124],[295,215,279],[495,269,490],[449,446,427],[446,297,427],[1020,1163,909],[128,138,419],[66,980,443],[415,439,1018],[111,396,1057],[111,422,396],[840,249,831],[593,664,596],[218,550,155],[109,194,180],[483,268,855],[161,415,419],[1737,232,428],[360,107,494],[1006,1011,410],[444,140,55],[919,843,430],[190,242,213],[275,403,410],[131,494,488],[449,663,446],[138,161,419],[128,419,34],[439,162,444],[460,440,422],[440,438,433],[472,74,445],[491,190,213],[238,508,515],[46,206,54],[972,944,962],[1241,1428,1284],[111,460,422],[470,432,806],[248,164,702],[1025,467,453],[553,1235,648],[263,114,881],[267,293,896],[469,438,440],[455,196,438],[287,242,492],[239,265,156],[213,242,287],[1684,746,63],[663,474,446],[415,161,429],[140,100,107],[1055,459,467],[469,455,438],[259,542,277],[446,474,466],[446,466,447],[439,444,1019],[614,109,180],[190,359,181],[156,497,190],[726,474,663],[1023,458,459],[461,440,460],[269,210,490],[246,180,194],[590,133,189],[163,218,155],[467,468,453],[1063,1029,111],[111,1029,460],[1029,464,460],[461,469,440],[150,149,323],[828,445,456],[375,502,261],[474,475,466],[573,426,462],[478,1023,477],[478,458,1023],[458,479,467],[459,458,467],[468,393,453],[464,461,460],[484,365,455],[1232,182,1380],[172,617,214],[547,694,277],[542,547,277],[184,258,238],[261,502,465],[467,479,468],[484,455,469],[1380,182,864],[475,476,466],[80,447,476],[466,476,447],[415,429,439],[479,487,468],[487,287,468],[492,393,468],[260,469,461],[481,365,484],[531,473,931],[692,360,319],[726,495,474],[468,287,492],[480,464,1029],[260,461,464],[494,481,484],[74,472,482],[174,240,212],[223,106,614],[486,477,485],[478,496,458],[491,487,479],[123,402,177],[488,469,260],[488,484,469],[265,239,348],[248,215,285],[474,490,475],[477,486,478],[458,496,479],[239,491,479],[1584,1147,1334],[488,494,484],[401,123,506],[495,490,474],[490,173,475],[80,476,264],[491,287,487],[480,1029,1004],[480,205,464],[173,476,475],[485,194,486],[486,183,478],[478,183,496],[496,239,479],[848,1166,60],[268,262,855],[205,260,464],[260,203,488],[203,131,488],[246,264,476],[194,485,264],[1002,310,1664],[311,515,497],[515,359,497],[565,359,515],[1250,1236,301],[736,456,151],[654,174,567],[577,534,648],[519,505,645],[725,565,508],[150,1723,148],[584,502,505],[584,526,502],[502,526,84],[607,191,682],[560,499,660],[607,517,191],[1038,711,124],[951,672,971],[716,507,356],[868,513,1198],[615,794,608],[682,191,174],[1313,928,1211],[617,241,214],[511,71,91],[408,800,792],[192,286,525],[80,485,447],[91,97,130],[1675,324,888],[207,756,532],[582,1097,1124],[311,497,156],[510,130,146],[523,511,510],[608,708,616],[546,690,650],[511,527,358],[536,146,518],[465,418,550],[418,709,735],[520,514,500],[584,505,519],[536,518,509],[146,536,510],[538,527,511],[876,263,669],[646,524,605],[510,536,523],[527,175,358],[724,876,669],[721,724,674],[524,683,834],[558,509,522],[558,536,509],[523,538,511],[611,243,574],[528,706,556],[668,541,498],[523,537,538],[527,540,175],[532,756,533],[1013,60,747],[551,698,699],[92,520,500],[535,536,558],[536,569,523],[538,540,527],[539,548,175],[567,212,145],[401,896,293],[534,675,639],[1510,595,1507],[557,545,530],[569,536,535],[537,540,538],[540,539,175],[569,537,523],[1135,718,47],[587,681,626],[580,535,558],[99,747,278],[701,565,725],[665,132,514],[665,514,575],[132,549,653],[176,651,189],[65,47,266],[597,569,535],[569,581,537],[537,581,540],[563,539,540],[539,564,548],[1509,1233,1434],[132,653,740],[550,710,155],[714,721,644],[410,1011,188],[732,534,586],[560,562,729],[555,557,222],[580,558,545],[597,535,580],[581,563,540],[5,821,1676],[576,215,136],[649,457,741],[564,539,563],[124,711,224],[550,668,710],[550,541,668],[565,701,673],[560,613,499],[233,532,625],[545,555,580],[601,581,569],[594,904,548],[1463,1425,434],[185,149,1454],[721,674,644],[185,380,149],[577,424,586],[462,586,559],[597,601,569],[594,548,564],[566,603,574],[165,543,544],[457,89,121],[586,424,195],[725,587,606],[1078,582,1124],[588,925,866],[462,559,593],[189,878,590],[555,229,580],[602,563,581],[904,594,956],[434,1425,1438],[1024,112,821],[572,587,626],[600,597,580],[599,591,656],[600,580,229],[601,622,581],[581,622,602],[602,564,563],[602,594,564],[603,611,574],[498,529,546],[697,1145,70],[592,628,626],[610,597,600],[597,610,601],[222,557,171],[604,765,799],[573,462,593],[133,200,176],[729,607,627],[1011,692,188],[518,146,130],[585,687,609],[682,627,607],[1712,599,656],[562,592,607],[643,656,654],[257,600,229],[601,633,622],[623,594,602],[174,212,567],[725,606,701],[609,701,606],[610,633,601],[633,642,622],[380,216,324],[142,143,1249],[501,732,586],[534,577,586],[648,1235,577],[610,641,633],[310,1002,1831],[618,334,604],[1710,145,269],[707,498,659],[501,586,462],[625,501,462],[726,663,691],[300,600,257],[641,610,600],[622,629,602],[602,629,623],[55,692,444],[518,748,509],[929,1515,1411],[620,578,267],[71,511,358],[707,668,498],[650,687,585],[600,300,641],[641,657,633],[1675,888,1669],[622,636,629],[505,502,375],[541,529,498],[332,420,1053],[637,551,638],[534,639,648],[69,623,873],[300,512,641],[633,657,642],[562,660,579],[687,637,638],[709,646,605],[775,738,885],[559,549,132],[646,683,524],[641,512,657],[266,897,949],[1712,643,1657],[184,727,258],[674,724,669],[699,714,647],[628,659,572],[657,662,642],[571,881,651],[517,607,504],[598,706,528],[598,694,547],[640,552,560],[655,693,698],[698,693,721],[91,510,511],[144,301,1136],[324,216,888],[870,764,1681],[575,514,520],[276,544,543],[658,175,44],[645,505,711],[659,546,572],[700,524,655],[605,700,529],[266,867,897],[1695,1526,764],[579,659,628],[654,591,682],[586,549,559],[698,721,714],[896,401,506],[640,734,599],[664,665,575],[621,629,636],[1712,656,643],[547,644,598],[710,668,707],[640,560,734],[655,698,551],[694,528,277],[512,662,657],[504,592,626],[688,584,519],[152,241,617],[587,725,681],[598,669,706],[526,670,84],[598,528,694],[710,707,499],[579,592,562],[660,659,579],[323,324,1134],[326,895,473],[195,29,653],[84,670,915],[560,660,562],[504,626,681],[711,505,224],[651,881,114],[216,620,889],[1362,678,197],[493,99,48],[1659,691,680],[529,690,546],[430,843,709],[655,524,693],[174,191,105],[674,669,598],[98,712,82],[572,546,585],[72,61,71],[912,911,894],[106,223,184],[664,132,665],[843,646,709],[635,699,136],[699,698,714],[593,132,664],[688,526,584],[185,177,620],[533,675,534],[687,638,635],[1652,89,457],[896,506,912],[132,740,514],[689,685,282],[691,449,680],[48,436,493],[136,699,647],[739,640,554],[549,586,653],[532,533,625],[1530,695,649],[653,381,619],[736,151,531],[188,692,241],[177,402,578],[33,689,867],[689,33,685],[593,559,132],[949,65,266],[711,1038,661],[939,480,1004],[609,369,701],[616,552,615],[619,361,740],[151,463,516],[513,521,117],[691,663,449],[186,251,196],[333,302,327],[613,560,552],[616,613,552],[690,551,637],[660,707,659],[704,208,1203],[418,735,550],[163,708,124],[524,834,693],[554,640,599],[245,341,165],[565,673,359],[155,710,708],[105,191,517],[1515,198,1411],[1709,554,599],[60,289,786],[838,1295,1399],[533,534,625],[710,499,708],[556,632,410],[217,620,216],[591,627,682],[504,503,223],[643,654,567],[690,637,650],[545,557,555],[174,654,682],[719,691,1659],[727,681,508],[645,711,661],[794,615,739],[565,515,508],[282,685,302],[1150,397,1149],[638,699,635],[544,685,33],[719,726,691],[1742,1126,1733],[1724,1475,148],[556,410,403],[185,217,380],[503,504,681],[277,556,403],[32,1178,158],[1712,1709,599],[605,529,541],[635,136,369],[687,635,369],[529,700,690],[700,551,690],[89,304,573],[625,534,732],[730,302,685],[503,681,727],[702,673,701],[730,327,302],[327,353,333],[596,664,575],[660,499,707],[585,546,650],[560,729,734],[700,655,551],[176,571,651],[517,504,223],[730,685,544],[1661,1682,726],[1682,495,726],[1250,301,917],[605,524,700],[609,687,369],[516,389,895],[1553,686,1027],[673,702,164],[656,591,654],[520,596,575],[402,123,401],[828,456,728],[1645,677,1653],[528,556,277],[638,551,699],[190,497,359],[276,730,544],[1117,1525,933],[1027,686,1306],[155,708,163],[709,605,541],[647,644,547],[650,637,687],[599,734,591],[578,293,267],[1682,357,495],[510,91,130],[734,729,627],[576,542,215],[709,541,735],[735,541,550],[276,500,730],[500,327,730],[653,619,740],[414,851,454],[734,627,591],[729,562,607],[615,552,640],[525,181,192],[308,512,300],[223,503,727],[266,165,33],[92,500,276],[321,1046,1033],[585,609,606],[1200,1559,86],[628,572,626],[301,436,803],[714,644,647],[708,499,613],[721,693,724],[514,353,327],[353,740,361],[344,158,78],[708,613,616],[615,640,739],[500,514,327],[514,740,353],[1449,177,185],[462,233,625],[851,405,1163],[608,616,615],[647,542,576],[625,732,501],[1097,582,1311],[1235,424,577],[579,628,592],[607,592,504],[24,432,470],[105,614,247],[104,742,471],[542,259,215],[365,196,455],[1420,47,65],[223,727,184],[547,542,647],[572,585,606],[587,572,606],[262,780,1370],[647,576,136],[644,674,598],[271,53,75],[727,508,258],[471,742,142],[505,375,224],[357,1710,269],[725,508,681],[659,498,546],[743,1178,32],[1195,634,231],[1176,24,470],[743,1110,1178],[135,809,857],[63,746,407],[634,1176,470],[159,1112,27],[1176,1685,24],[399,450,779],[1178,856,875],[751,744,54],[436,48,772],[634,1108,1210],[769,1285,1286],[751,298,755],[746,1684,754],[754,924,87],[722,1625,756],[87,839,153],[489,795,820],[758,808,1518],[839,840,153],[831,1111,959],[1111,749,959],[810,1253,1363],[1247,1394,713],[1388,1329,1201],[1242,120,761],[857,791,384],[758,1523,808],[296,764,1504],[70,1652,891],[207,233,1638],[1348,57,28],[858,420,332],[964,1379,1278],[420,1194,816],[784,1076,1186],[1076,21,1186],[1710,767,1],[849,822,778],[806,137,787],[786,790,744],[790,54,744],[771,63,407],[785,852,818],[774,1823,272],[895,151,516],[135,1022,809],[99,826,48],[48,826,755],[808,705,408],[833,441,716],[1733,743,32],[1385,836,852],[772,827,737],[1005,49,781],[793,1697,813],[1518,441,1537],[1139,1132,859],[782,801,770],[1510,1530,676],[770,814,835],[231,787,825],[207,722,756],[26,771,798],[782,863,865],[832,54,790],[865,842,507],[799,765,94],[1175,1261,1353],[800,408,805],[262,986,200],[792,800,814],[801,792,770],[704,1203,1148],[356,1514,822],[165,544,33],[561,776,113],[1043,738,775],[815,831,820],[773,792,801],[772,48,914],[772,737,803],[436,772,803],[808,817,705],[1624,822,1527],[588,1144,788],[799,762,604],[821,1520,1676],[854,803,666],[828,482,472],[445,74,463],[831,489,820],[828,836,482],[716,782,763],[334,815,766],[815,823,766],[334,766,765],[819,805,837],[1716,1521,1412],[1684,924,754],[800,805,819],[1709,829,554],[806,1349,137],[99,1013,747],[341,595,276],[817,810,818],[1176,1691,1685],[763,782,865],[830,846,1052],[865,1499,842],[982,846,1053],[847,832,790],[1178,875,158],[817,818,705],[1302,1392,45],[96,417,284],[223,614,517],[356,507,1514],[1166,848,1179],[1349,432,26],[717,92,276],[770,835,863],[522,509,1745],[847,841,832],[832,841,46],[829,739,554],[802,824,39],[397,1043,775],[1567,849,778],[1385,483,855],[1349,26,1346],[441,801,782],[402,401,293],[1043,667,738],[759,798,1007],[819,837,728],[728,837,828],[837,852,828],[1537,441,833],[148,1475,147],[805,705,837],[716,441,782],[483,1371,780],[814,819,844],[845,753,1336],[1661,719,4],[862,847,790],[737,827,666],[201,46,841],[810,785,818],[408,705,805],[1560,1536,849],[1585,853,1786],[7,1668,807],[7,807,8],[822,1514,1527],[800,819,814],[847,862,841],[991,857,760],[705,818,837],[808,408,773],[402,293,578],[791,858,332],[1480,1228,1240],[814,844,835],[785,1385,852],[1132,120,859],[1743,1726,684],[1704,783,1279],[1623,1694,1731],[959,489,831],[1518,808,773],[862,872,841],[441,773,801],[331,512,308],[380,217,216],[841,872,201],[818,852,837],[448,1480,1240],[856,1108,1195],[1527,1514,1526],[819,182,1232],[871,724,693],[852,836,828],[770,792,814],[803,737,666],[751,826,278],[1674,1727,1699],[849,356,822],[871,693,834],[507,842,1514],[1406,1097,869],[1328,1349,1346],[823,815,795],[744,751,278],[1110,856,1178],[520,717,316],[871,834,683],[884,876,724],[165,266,47],[716,763,507],[216,889,888],[853,1585,1570],[1536,716,356],[886,873,623],[782,770,863],[432,24,26],[683,882,871],[884,724,871],[114,876,884],[516,590,389],[11,1218,1628],[862,113,872],[886,623,629],[830,1052,1120],[762,153,604],[773,408,792],[763,865,507],[153,840,604],[882,884,871],[531,151,326],[886,890,873],[133,262,200],[819,1232,844],[621,636,122],[645,892,519],[1130,1076,784],[114,263,876],[1670,10,1663],[911,670,894],[452,885,872],[872,885,201],[887,882,683],[878,884,882],[590,878,882],[890,867,689],[897,629,621],[897,886,629],[819,728,182],[519,893,688],[894,670,526],[898,894,526],[1536,356,849],[810,1363,785],[878,114,884],[879,888,892],[892,889,893],[893,898,688],[895,683,843],[895,887,683],[889,620,267],[590,882,389],[418,465,84],[949,897,621],[897,890,886],[889,267,893],[898,267,896],[531,326,473],[189,651,878],[843,683,646],[897,867,890],[888,889,892],[893,267,898],[896,894,898],[473,895,843],[895,389,887],[974,706,669],[513,1115,521],[326,151,895],[809,791,857],[211,262,133],[920,923,947],[923,90,947],[90,25,947],[25,972,935],[64,431,899],[52,899,901],[903,905,59],[437,967,73],[839,1242,761],[904,975,44],[917,301,144],[915,670,911],[905,201,885],[1684,63,1685],[1033,1194,288],[950,913,755],[912,918,911],[950,914,913],[506,918,912],[922,919,915],[911,922,915],[1004,451,492],[1263,553,639],[922,911,918],[630,920,947],[916,506,926],[916,918,506],[521,1115,1098],[916,922,918],[919,418,915],[83,38,75],[24,1685,771],[110,1230,1213],[712,8,1837],[922,930,919],[919,430,418],[1395,1402,1187],[930,922,916],[594,623,69],[35,431,968],[35,968,969],[866,924,1684],[1625,1263,675],[631,630,52],[930,931,919],[430,709,418],[302,333,49],[1446,978,1138],[799,1007,798],[931,843,919],[947,25,64],[885,738,667],[1262,963,964],[899,970,901],[1401,946,938],[1117,933,1091],[1685,63,771],[905,948,201],[979,937,980],[951,953,950],[937,270,443],[1154,903,59],[1194,954,1067],[909,405,907],[850,1151,59],[1769,811,1432],[76,206,250],[938,946,966],[965,927,942],[938,966,957],[955,975,904],[927,965,934],[52,51,631],[59,905,667],[431,935,968],[786,289,561],[252,122,671],[481,494,107],[954,1817,1067],[795,25,90],[958,965,945],[795,972,25],[902,983,955],[972,489,944],[1256,29,424],[671,331,945],[946,958,963],[956,955,904],[902,955,956],[671,512,331],[945,331,961],[662,671,122],[671,662,512],[934,65,927],[630,947,52],[666,631,910],[850,59,667],[961,331,234],[1024,411,1042],[890,69,873],[252,671,945],[975,290,940],[283,186,196],[30,283,365],[950,755,298],[946,965,958],[985,290,975],[969,290,985],[405,851,206],[935,431,64],[941,1423,1420],[964,963,167],[942,252,945],[78,757,57],[49,1005,66],[937,979,270],[631,666,827],[980,937,443],[66,689,282],[421,902,956],[947,64,52],[35,979,899],[951,971,953],[762,87,153],[27,31,381],[924,839,87],[946,963,966],[331,308,340],[957,966,1262],[473,843,931],[953,971,920],[270,969,902],[935,962,968],[51,1005,781],[969,983,902],[437,73,940],[69,421,956],[761,249,840],[263,974,669],[962,944,967],[962,437,290],[985,975,955],[907,405,948],[720,957,1262],[25,935,64],[176,200,571],[108,945,50],[250,851,414],[200,986,571],[881,974,263],[827,772,953],[970,899,980],[29,159,27],[234,331,340],[948,405,206],[980,899,979],[986,984,571],[571,984,881],[990,706,974],[946,934,965],[970,980,66],[1113,1486,1554],[984,981,881],[881,987,974],[689,66,443],[1005,901,66],[983,985,955],[165,47,718],[987,990,974],[1370,986,262],[901,970,66],[51,901,1005],[981,987,881],[988,706,990],[942,945,965],[290,437,940],[64,899,52],[988,556,706],[941,934,946],[431,35,899],[996,989,984],[984,989,981],[981,989,987],[35,969,270],[1370,995,986],[986,995,984],[989,999,987],[987,992,990],[992,988,990],[962,967,437],[951,950,976],[979,35,270],[421,270,902],[998,995,1370],[987,999,992],[988,364,556],[969,985,983],[689,443,890],[995,1000,984],[219,958,108],[998,1000,995],[999,997,992],[914,953,772],[845,1336,745],[806,787,231],[1000,996,984],[989,996,999],[50,945,961],[443,421,69],[797,158,779],[1098,1463,434],[996,1009,999],[1001,988,992],[1001,364,988],[903,907,905],[26,759,973],[997,1001,992],[632,364,1001],[1346,26,973],[998,1008,1000],[1000,1009,996],[531,931,736],[252,949,621],[286,388,525],[1174,1008,998],[1009,1010,999],[999,1010,997],[1014,1001,997],[614,105,517],[958,945,108],[525,1004,242],[963,958,219],[233,426,304],[1000,1008,1009],[1010,1014,997],[1001,1006,632],[824,413,39],[642,636,622],[480,388,205],[28,757,797],[1014,1006,1001],[1006,410,632],[975,940,44],[1234,420,858],[54,832,46],[1009,1012,1010],[167,963,219],[41,481,107],[1017,1010,1012],[122,636,662],[939,525,388],[525,939,1004],[950,953,914],[829,1735,739],[1008,880,1015],[1008,1015,1009],[1263,639,675],[956,594,69],[795,90,1347],[1179,848,1013],[759,1007,973],[1009,1015,1012],[1012,1016,1017],[1017,1014,1010],[1019,1011,1006],[927,65,949],[649,316,595],[913,48,755],[976,950,298],[1003,1015,880],[1018,1006,1014],[1021,1018,1014],[444,692,1011],[451,1029,1063],[1185,851,1163],[29,27,381],[181,525,242],[1021,1014,1017],[1016,1021,1017],[1018,1019,1006],[1019,444,1011],[927,949,942],[451,393,492],[903,1154,907],[391,101,57],[94,765,58],[419,1016,1012],[949,252,942],[907,1020,909],[765,442,58],[94,406,908],[1007,94,908],[34,1012,1015],[34,419,1012],[419,1021,1016],[451,1057,393],[907,948,905],[1034,1073,1039],[1061,906,1619],[1068,960,1034],[471,1249,104],[112,1024,1042],[372,379,125],[341,543,165],[141,1094,170],[566,243,1061],[398,1034,1039],[325,317,1823],[1493,296,1724],[850,667,1043],[1054,297,1065],[1619,135,1074],[1061,243,906],[680,1024,821],[1103,96,1245],[1440,1123,1491],[1047,1025,1044],[672,454,1231],[1484,697,1530],[993,672,1231],[178,154,1088],[1044,1041,1066],[112,1062,1058],[1530,649,676],[178,1088,1040],[1046,328,954],[243,244,1022],[954,1194,1033],[1042,411,1032],[971,993,1056],[960,1093,1034],[1754,1338,232],[385,1064,412],[1057,1063,111],[748,1071,1447],[1530,697,695],[971,1056,1270],[977,1059,1211],[649,741,316],[1060,1452,1030],[353,354,1323],[695,768,649],[398,404,1034],[596,316,741],[1836,119,13],[1513,1115,1528],[883,1081,1652],[1039,1073,1048],[462,426,233],[31,1296,354],[1055,1047,1066],[1032,1054,1045],[1521,310,1224],[119,861,13],[1194,1234,288],[1109,1771,1070],[1166,1160,776],[1044,1035,1041],[1026,960,1064],[1050,1032,1045],[1049,1041,387],[115,1013,99],[1046,954,1033],[1321,920,971],[611,1058,345],[1048,1066,1049],[1023,1055,1073],[1029,451,1004],[118,1094,141],[1094,1080,170],[1042,1032,1050],[1026,1064,385],[15,16,1084],[1096,1079,61],[1075,1071,748],[325,1817,328],[909,1163,405],[1022,1234,809],[374,398,1051],[1082,72,81],[1023,1034,1093],[1817,1794,1067],[86,1445,1400],[1507,1535,1510],[1079,1096,1075],[568,1478,1104],[1070,178,1040],[1034,1023,1073],[776,1155,113],[1103,143,142],[1140,81,73],[1082,81,1140],[1060,1030,936],[1040,1086,1109],[370,1065,385],[61,72,1082],[1087,1096,1144],[1040,1088,1086],[1651,812,752],[1062,1050,1045],[187,154,178],[179,187,178],[1099,1344,1101],[1668,1058,807],[1073,1055,1048],[1099,1336,1344],[1283,943,1123],[1049,387,1051],[1024,680,449],[61,1082,1100],[967,749,1111],[1439,1037,88],[742,1505,142],[398,1039,1051],[1107,1336,1099],[1344,1542,1101],[142,1505,1103],[477,1093,447],[477,1023,1093],[471,142,1249],[1041,1035,394],[1328,568,1104],[61,1100,1096],[154,1092,1088],[112,1042,1050],[154,187,168],[435,235,45],[1075,1096,1087],[97,1075,748],[1049,1066,1041],[816,1067,1028],[846,982,1142],[1245,96,284],[1092,154,1080],[1057,451,1063],[387,377,1051],[1055,1025,1047],[1075,1087,1089],[1106,1108,856],[1068,1034,404],[1480,1545,868],[906,135,1619],[1074,991,1095],[570,566,1061],[1025,453,1044],[745,1336,1107],[1035,1057,416],[1092,1102,1129],[1074,135,991],[1105,745,1107],[447,1026,446],[394,387,1041],[73,81,940],[1118,1108,1106],[1210,1108,874],[243,1022,906],[412,1064,1068],[1280,611,603],[960,447,1093],[1051,1039,1049],[1040,1109,1070],[1471,1037,1439],[69,890,443],[1377,703,1374],[1092,1080,1102],[1096,1100,788],[1096,788,1144],[1114,967,1111],[446,1026,297],[70,1112,883],[453,393,1057],[1118,874,1108],[1054,370,1045],[1080,1094,1102],[1039,1048,1049],[428,753,845],[1047,1044,1066],[1044,453,1035],[1472,731,1512],[1126,1121,743],[743,1121,1110],[1032,297,1054],[1480,868,1216],[71,358,72],[1133,967,1114],[1105,1119,745],[1035,453,1057],[1026,447,960],[454,851,1190],[1030,1477,652],[589,816,1028],[1110,1121,1106],[1122,1118,1106],[1116,874,1118],[1048,1055,1066],[1194,1067,816],[744,278,747],[745,1120,845],[845,1052,428],[1105,1780,1119],[1065,297,385],[1098,1529,1463],[731,1060,936],[235,434,812],[1445,1525,1117],[1106,1121,1122],[1122,1127,1118],[1127,1116,1118],[1094,118,1732],[1119,1120,745],[1406,1124,1097],[435,117,235],[1462,1440,1037],[1126,1129,1121],[1088,1092,1129],[1133,73,967],[1120,1052,845],[812,434,752],[1441,1559,1200],[1131,588,413],[1054,1065,370],[235,1098,434],[1052,1142,428],[1737,428,1142],[1496,1446,1483],[1182,1083,1654],[1121,1129,1122],[1732,1116,1127],[768,457,649],[761,1114,249],[1064,960,1068],[1135,1481,1136],[1126,952,1129],[1087,588,1131],[1087,1144,588],[859,788,1139],[1140,1133,1132],[1133,1140,73],[1822,570,1061],[394,1035,416],[1055,1023,459],[80,264,485],[1119,1128,1120],[145,1658,567],[695,891,768],[1129,1102,1122],[1122,1102,1127],[1416,1077,1413],[297,1026,385],[1052,846,1142],[1445,1117,1400],[952,1086,1129],[1714,1089,1131],[1131,1089,1087],[1100,1139,788],[112,1050,1062],[1323,354,1296],[49,333,1141],[1142,982,1737],[79,1457,1091],[1088,1129,1086],[1102,1094,1127],[1127,1094,1732],[1100,1082,1139],[1082,1132,1139],[1082,1140,1132],[1150,1043,397],[60,1166,289],[1696,1146,1698],[1297,1202,1313],[409,1297,1313],[1234,1194,420],[1408,1391,1394],[424,1235,1243],[1203,309,1148],[485,477,447],[1152,1156,850],[1153,1149,1155],[1153,1157,1149],[1149,1152,1150],[1156,1154,1151],[776,1153,1155],[1157,1152,1149],[1217,1393,1208],[1156,1159,1154],[1153,1165,1157],[1165,1152,1157],[1159,1020,1154],[1161,1153,776],[1161,1165,1153],[1165,1158,1152],[1152,1158,1156],[1158,1159,1156],[1166,776,561],[1160,1161,776],[1161,1164,1165],[1161,1160,1164],[1158,1162,1159],[1159,1162,1020],[1270,1321,971],[1164,1170,1165],[1165,1162,1158],[1162,1163,1020],[588,788,925],[1166,1167,1160],[1165,1170,1162],[1160,1167,1164],[1162,1170,1163],[1179,1167,1166],[1167,1168,1164],[1164,1168,1170],[1168,1169,1170],[1234,1022,288],[802,39,866],[1179,1168,1167],[1169,1173,1170],[1170,1173,1163],[1173,1185,1163],[1360,1267,1364],[1169,1185,1173],[611,244,243],[900,1226,1376],[1260,1408,1350],[618,840,831],[1181,1183,1179],[1179,1184,1168],[1208,1274,1291],[1183,1184,1179],[1168,1184,1169],[1387,1395,1254],[1208,1204,1172],[1182,1197,1083],[1187,1083,1197],[1213,1183,1181],[1169,1207,1185],[135,857,991],[1013,1213,1181],[1189,1183,1213],[1183,1189,1184],[1169,1184,1207],[1207,1190,1185],[1180,1389,1288],[1191,1192,1640],[1640,1192,1090],[1090,1205,1654],[1654,1205,1182],[1188,1395,1187],[1126,743,1733],[788,859,925],[809,1234,1171],[1193,1197,1182],[1189,1199,1184],[1639,1191,1637],[1639,1212,1191],[1205,1193,1182],[1198,1187,1197],[1199,1207,1184],[332,1053,846],[1090,1192,1205],[117,1188,1187],[435,1188,117],[435,1206,1188],[1199,1189,1213],[420,816,1053],[1212,1215,1191],[117,1187,1198],[45,1206,435],[120,1132,1133],[874,1116,1210],[1191,1215,1192],[1193,1216,1197],[1216,1198,1197],[1199,1214,1207],[117,521,235],[1220,1311,1078],[1220,900,1311],[1653,1215,1212],[1192,1225,1205],[1205,1209,1193],[1209,1216,1193],[1389,1217,1172],[1207,1214,454],[171,557,1747],[1805,1078,1787],[1805,1219,1078],[1198,1216,868],[666,910,854],[1230,1231,1213],[1213,1231,1199],[1199,1231,1214],[1219,1220,1078],[1215,1221,1192],[1192,1221,1225],[1225,1228,1205],[1205,1228,1209],[1209,1228,1216],[1464,1325,1223],[1215,1227,1221],[1228,1480,1216],[1226,1653,1376],[1653,1249,1215],[1221,1240,1225],[1225,1240,1228],[839,761,840],[1238,1219,1805],[1238,1220,1219],[1232,1380,1375],[1226,1249,1653],[1221,1227,1240],[233,207,532],[110,1236,1230],[1248,1231,1230],[1231,454,1214],[1249,1227,1215],[1248,1056,1231],[489,959,944],[448,1240,284],[925,859,1242],[1805,1244,1238],[1252,1220,1238],[1252,921,1220],[1236,1251,1230],[1230,1251,1248],[1056,993,1231],[1031,1264,1263],[68,1186,157],[1227,1245,1240],[1103,1245,143],[1243,1235,612],[1252,95,921],[1249,1226,1237],[1390,1387,1254],[1120,384,830],[830,332,846],[1227,143,1245],[1315,1369,1358],[1356,1269,1386],[972,795,489],[1831,1224,310],[1250,1255,1251],[1251,1056,1248],[1256,1243,103],[658,358,175],[1620,1238,1244],[1620,1252,1238],[1506,95,1252],[104,1249,1237],[1249,143,1227],[1268,1419,1329],[634,806,231],[618,831,815],[924,1242,839],[1255,1270,1251],[1251,1270,1056],[866,925,1242],[103,29,1256],[424,1243,1256],[134,1651,752],[1250,917,1255],[1172,1204,1260],[1352,1036,1276],[1265,1201,1329],[804,1282,1259],[1259,1294,723],[335,1330,1305],[407,762,799],[875,856,1195],[32,158,344],[967,944,749],[372,125,42],[1175,1354,1261],[553,612,1235],[1259,1273,1294],[1294,1283,723],[757,78,158],[407,799,798],[901,51,52],[139,1386,1389],[1386,1269,1389],[1389,1269,1217],[1148,1590,1268],[1428,1449,1450],[804,1281,1282],[1273,1259,1282],[158,399,779],[771,407,798],[521,1098,235],[917,1312,1255],[1312,1270,1255],[1217,1269,1393],[1195,1108,634],[1110,1106,856],[1210,1691,1176],[27,1112,1145],[1296,27,1145],[1171,858,791],[704,1148,1290],[1430,1436,1437],[1282,1308,1273],[1300,943,1283],[1393,1355,1274],[720,1278,769],[1287,1059,1399],[1310,1388,1272],[1312,1321,1270],[851,1185,1190],[1296,1145,1304],[26,24,771],[51,910,631],[1329,1290,1268],[1290,1148,1268],[1298,1293,733],[1281,1293,1282],[1282,1293,1308],[1308,1299,1273],[1300,1283,1294],[1340,943,1300],[1340,1301,943],[407,754,762],[1287,1399,1295],[34,139,128],[1288,1172,1260],[120,1133,1114],[1306,1113,1511],[1464,1223,1292],[1299,1294,1273],[1299,1300,1294],[1286,1295,838],[1285,1247,1286],[1247,713,1286],[1201,1265,1390],[1378,1368,1357],[1482,1320,917],[917,1320,1312],[850,1156,1151],[588,39,413],[1324,1306,686],[789,1365,928],[1223,1326,1292],[1292,1326,1298],[869,1097,1311],[790,786,561],[1323,1304,932],[1323,1296,1304],[1317,1324,686],[1306,368,1113],[1325,1342,1223],[1326,1348,1298],[1293,1327,1308],[1308,1318,1299],[704,1290,1258],[1320,1321,1312],[761,120,1114],[1684,802,866],[1674,6,1727],[1316,1323,932],[1335,1337,1305],[1348,1327,1293],[1298,1348,1293],[1333,1300,1299],[1333,1343,1300],[1328,1301,1340],[1328,1314,1301],[838,1399,1319],[921,1237,900],[409,1391,1408],[1376,1653,677],[1281,804,1458],[1331,1324,1317],[1324,368,1306],[368,1338,1307],[1327,797,1308],[797,1345,1308],[1308,1345,1318],[1318,1333,1299],[1341,1147,1572],[923,1321,1320],[923,920,1321],[39,588,866],[1141,1323,1316],[1330,1335,1305],[1337,1335,1336],[1339,1332,1325],[1223,1342,1326],[1342,1348,1326],[1348,797,1327],[1345,1333,1318],[1343,1340,1300],[1419,1265,1329],[1347,1320,1584],[1535,1141,1316],[1078,1311,582],[1344,1335,1330],[753,1331,1337],[368,1324,1331],[753,368,1331],[1332,1485,1325],[1325,1485,1342],[787,1343,1333],[137,1328,1340],[973,1341,1479],[406,1147,1341],[1171,1234,858],[1141,1535,1322],[49,1141,1322],[1344,1336,1335],[973,908,1341],[766,1347,1584],[1347,923,1320],[781,49,1322],[368,232,1338],[787,1340,1343],[787,137,1340],[568,1346,973],[58,1147,406],[442,1334,1147],[58,442,1147],[442,766,1334],[90,923,1347],[428,368,753],[779,1333,1345],[825,787,1333],[137,1349,1328],[1328,1346,568],[908,406,1341],[924,866,1242],[1336,753,1337],[428,232,368],[1115,777,1098],[1348,28,797],[797,779,1345],[779,825,1333],[1007,908,973],[583,1351,880],[1365,1246,977],[1658,145,1710],[1310,796,1388],[718,245,165],[1302,1272,1254],[1174,1351,583],[1174,715,1351],[1358,1260,1204],[1374,1373,1276],[1377,1374,1276],[678,1362,1382],[1377,1276,254],[139,34,40],[1008,1174,583],[1396,1286,1319],[768,891,457],[1316,932,1535],[1289,1371,1360],[182,736,864],[1355,1364,1274],[860,1367,1354],[1362,1222,1382],[1376,869,1311],[1590,1411,198],[1232,1375,877],[1394,1295,1286],[880,1356,1386],[880,1351,1356],[1211,1059,1287],[197,678,1405],[880,1386,1003],[1368,1253,1357],[1357,1253,1036],[715,1289,1364],[1354,1367,703],[1383,877,1375],[1266,1288,1260],[1373,1374,703],[1372,1289,1174],[1303,1366,1378],[1351,715,1355],[1665,1666,624],[1309,1357,1036],[900,1237,1226],[1174,1289,715],[1337,1331,1317],[1360,1303,1359],[1267,1354,1175],[1241,1284,1414],[1377,254,929],[1385,855,836],[1396,1319,1436],[1361,1366,1303],[1381,1368,1378],[1313,1211,1391],[1368,1385,1363],[813,82,861],[1058,1280,807],[893,519,892],[1359,1303,860],[1382,1350,1247],[1371,1303,1360],[1267,1175,1271],[769,1286,1396],[712,1837,82],[1366,1385,1381],[1365,796,1310],[1003,1386,40],[780,1371,1370],[561,862,790],[1284,1380,864],[1449,1428,177],[611,1280,1058],[1284,1375,1380],[926,506,1241],[1305,1337,1317],[309,1203,208],[1388,1201,1390],[1309,1036,1352],[1377,929,1411],[1399,1059,1257],[1112,70,1145],[289,1166,561],[1288,1389,1172],[1362,37,1180],[713,1394,1286],[1355,1393,1269],[1401,1423,941],[1274,1271,1384],[860,1378,1367],[715,1364,1355],[677,1406,869],[1297,1358,1202],[1388,1258,1329],[1180,1288,1266],[1008,583,880],[1524,1425,1463],[1390,1403,1387],[1278,1379,1247],[1278,1247,1285],[964,1278,1262],[1358,1369,1202],[1715,1699,1726],[926,1241,1414],[1341,1572,1479],[926,930,916],[1397,51,781],[409,1358,1297],[1236,436,301],[1376,677,869],[1351,1355,1356],[758,1534,1523],[1378,1357,1367],[977,1211,1365],[1135,1136,854],[1394,1391,1295],[1266,1260,1222],[1365,1302,1246],[1232,877,844],[736,930,864],[1408,1358,409],[1508,817,1523],[1381,1385,1368],[718,854,910],[854,718,1135],[1382,1222,1350],[1391,1211,1287],[1391,1287,1295],[1257,1651,134],[1414,1284,864],[1291,1369,1315],[1202,928,1313],[86,1400,1413],[1413,1200,86],[1263,1625,1031],[1413,1400,1404],[1002,1664,1834],[930,926,1414],[1399,1257,134],[520,316,596],[1393,1274,1208],[1657,1655,1712],[1407,1404,1400],[1404,1410,1413],[1649,1229,1406],[1362,1266,1222],[1384,1271,1175],[900,1376,1311],[1274,1384,1291],[1291,1384,1431],[1433,1396,1436],[1267,1359,1354],[309,1353,703],[838,1319,1286],[1407,1410,1404],[441,1518,773],[1241,123,1428],[1622,1521,1224],[1217,1208,1172],[1130,793,1076],[425,1409,1481],[1481,1409,1533],[1303,1378,860],[1350,1408,1394],[1246,1651,977],[1289,1360,1364],[1727,1694,1623],[1417,1407,1533],[1417,1410,1407],[1406,1650,1649],[1319,134,1437],[1414,864,930],[1406,1229,1124],[1354,1359,860],[1433,769,1396],[1417,1533,1409],[1416,1413,1410],[1415,1416,1410],[95,1237,921],[1392,1254,1395],[1360,1359,1267],[1258,1290,1329],[1180,128,1389],[1420,1409,425],[1417,1418,1410],[1418,1415,1410],[1422,1077,1416],[1247,1350,1394],[37,43,1180],[1204,1315,1358],[1428,1383,1375],[1356,1355,1269],[1409,1418,1417],[1302,45,1246],[1421,1416,1415],[1421,1422,1416],[1422,1494,1077],[957,720,938],[1423,1409,1420],[1423,1418,1409],[752,434,1438],[1260,1358,1408],[1363,1385,785],[1423,1426,1418],[1426,1424,1418],[1229,1649,1124],[1222,1260,1350],[1508,1523,1137],[1278,1285,769],[1482,917,144],[1418,1424,1415],[1425,1422,1421],[1425,1524,1422],[1272,1388,1390],[1391,409,1313],[1378,1366,1381],[1371,483,1361],[720,1262,1278],[29,103,159],[1271,1364,1267],[1424,1427,1415],[1537,1522,1518],[134,752,1438],[1420,934,941],[1428,1375,1284],[1277,1224,1831],[1362,1180,1266],[1401,1426,1423],[1577,1369,1291],[268,483,262],[1383,1450,1456],[1384,1175,1431],[1430,1415,1427],[1430,1421,1415],[1430,1425,1421],[1379,1382,1247],[1252,1553,1429],[1206,1392,1395],[1433,1430,1427],[309,208,1353],[1272,1390,1254],[1361,483,1366],[1523,817,808],[1302,1254,1392],[1371,1361,1303],[1426,1435,1424],[1435,1433,1424],[1433,1427,1424],[720,769,1433],[796,1258,1388],[1590,1419,1268],[1289,1372,1371],[1305,1317,1509],[998,1372,1174],[40,1386,139],[1261,1354,703],[1364,1271,1274],[134,1438,1437],[1436,1319,1437],[1317,686,1509],[1484,932,1304],[1434,1432,1509],[1420,65,934],[931,930,736],[1367,1357,1309],[1372,1370,1371],[1204,1208,1315],[1426,938,1435],[1368,1363,1253],[1207,454,1190],[1302,1310,1272],[309,1377,390],[390,1377,1411],[1370,1372,998],[1411,1590,1148],[720,1433,1435],[1450,1383,1428],[1379,678,1382],[1405,678,1379],[1208,1291,1315],[1399,134,1319],[1367,1309,1373],[1373,1352,1276],[596,741,593],[553,1264,612],[1433,1436,1430],[1437,1438,1430],[964,1405,1379],[1373,1309,1352],[1265,1403,1390],[1233,1618,1434],[1365,1310,1302],[789,796,1365],[720,1435,938],[128,139,1389],[1466,933,1525],[1191,1640,1637],[1314,1442,943],[1141,353,1323],[1489,1138,1474],[1462,1477,1440],[1474,1138,1488],[1442,1314,1443],[1446,1030,1546],[1484,1145,697],[1549,1443,1445],[1470,1572,1468],[1397,1239,1507],[1649,1825,1824],[1259,1440,1477],[1451,1450,1449],[978,1446,652],[1454,1456,1451],[1451,1456,1450],[341,1507,595],[933,1547,79],[804,1452,1060],[1454,1455,1456],[1398,1460,1454],[1455,877,1456],[1277,1831,1825],[804,1060,1458],[1339,1459,1595],[1314,1104,1443],[933,1448,1547],[147,1460,1398],[1460,1461,1454],[1454,1461,1455],[1292,1125,1464],[417,1531,1480],[1459,1339,1325],[811,1756,335],[1512,936,1490],[777,1529,1098],[147,1475,1460],[1464,253,1459],[836,855,482],[1487,1486,1307],[1104,1501,1443],[1439,1200,1532],[1475,1469,1460],[1460,1469,1461],[1325,1464,1459],[1277,1825,1649],[1532,1200,1077],[844,877,1455],[1572,933,1466],[1479,568,973],[1509,335,1305],[1339,1595,1759],[1469,1476,1461],[1461,1476,1455],[1104,1470,1468],[1464,1472,253],[1117,1091,1407],[1756,1542,335],[1206,1395,1188],[335,1542,1330],[835,844,1455],[1471,1598,1462],[1491,1442,1441],[835,1455,1476],[1441,1442,1443],[1489,1474,1473],[1251,1236,1250],[1030,1452,1477],[1598,1439,1532],[978,1598,1492],[1426,1401,938],[1448,1584,1482],[1724,1497,1475],[1475,1497,1469],[1484,1535,932],[1307,1486,1113],[1487,696,1495],[1037,1491,1441],[1030,1446,936],[1453,1487,1495],[696,1467,1495],[1138,1489,1483],[1497,1143,1469],[1469,1143,1476],[652,1598,978],[850,1043,1150],[1482,1584,1320],[1731,98,1697],[1113,1554,1573],[1524,1532,1494],[1496,1467,696],[1452,1259,1477],[296,1504,1497],[1504,1143,1497],[1143,1499,1476],[718,910,1498],[868,1540,1528],[817,1253,810],[1490,696,1487],[1440,1491,1037],[1510,676,595],[1488,1492,1517],[781,1239,1397],[1467,1519,1503],[1500,1307,1759],[1149,397,452],[1504,1514,1143],[1514,842,1143],[1125,733,1458],[1503,1531,1555],[1276,1036,1137],[1440,723,1123],[1036,1508,1137],[817,1508,1253],[103,883,1112],[1458,731,1472],[1512,1490,1487],[1487,1453,1486],[1138,978,1488],[1036,1253,1508],[1398,149,147],[1474,1517,1513],[1125,1458,1472],[1486,1453,1554],[1518,1534,758],[345,1058,1062],[928,1202,1369],[1554,1541,1505],[1464,1125,1472],[1504,764,1514],[304,426,573],[1505,742,1506],[1479,1572,1478],[1519,1483,1489],[833,716,1069],[1522,1534,1518],[1115,1513,777],[811,335,1432],[1591,1533,1407],[777,1517,1529],[1513,1517,777],[1498,910,1397],[1069,1539,833],[833,1539,1537],[1522,1551,1534],[1534,1551,1523],[1538,1137,1523],[910,51,1397],[1367,1373,703],[1466,1525,1468],[157,1186,1832],[1429,1511,1506],[1573,1505,1506],[1259,1452,804],[1503,1495,1467],[262,483,780],[1572,1466,1468],[1536,1556,716],[716,1556,1069],[1544,1523,1551],[1544,1538,1523],[1511,1573,1506],[933,1572,1448],[1543,1537,1539],[1537,1543,1522],[1091,933,79],[1519,1540,1545],[1549,1445,86],[1069,1548,1539],[1548,1543,1539],[1543,1551,1522],[1500,1487,1307],[68,784,1186],[1552,1544,1551],[1550,1538,1544],[1538,1550,1137],[1519,1473,1540],[1547,1448,1482],[1560,1563,1536],[1536,1563,1556],[1556,1548,1069],[1543,1558,1551],[1137,1550,1276],[1453,1495,1555],[1561,1543,1548],[1543,1561,1558],[1558,1566,1551],[1552,1550,1544],[1569,1557,1550],[1557,1276,1550],[1276,1557,254],[1531,1503,1480],[1535,1530,1510],[1545,1503,1519],[1547,1482,79],[1566,1552,1551],[1552,1569,1550],[1503,1545,1480],[703,1377,309],[1625,675,756],[1037,1441,88],[929,254,1557],[849,1567,1560],[1556,1564,1548],[1492,1529,1517],[1252,1429,1506],[1553,1027,1429],[1453,1555,1541],[1554,1453,1541],[1233,686,1553],[1328,1104,1314],[1564,1576,1548],[1548,1576,1561],[1557,1562,929],[1520,112,1668],[1483,1446,1138],[778,1570,1567],[1563,1564,1556],[1561,1565,1558],[1565,1566,1558],[1569,1552,1566],[1562,1557,1569],[1530,1535,1484],[1387,1402,1395],[1621,1634,1387],[1567,1568,1560],[1560,1568,1563],[1571,1569,1566],[1344,1330,1542],[1577,1431,1353],[1638,233,304],[1524,1463,1529],[1353,1431,1175],[1077,1200,1413],[1478,1470,1104],[1568,1575,1563],[1563,1575,1564],[1575,1576,1564],[1561,1576,1565],[1565,1574,1566],[1562,1515,929],[1555,96,1541],[1531,417,96],[1555,1531,96],[1246,45,1651],[208,1577,1353],[1586,1568,1567],[1574,1571,1566],[1571,1583,1569],[1474,1513,1528],[1239,1322,1535],[1478,1572,1470],[1570,1586,1567],[1488,1517,1474],[8,1833,1837],[1123,1442,1491],[1589,1568,1586],[1576,1594,1565],[1565,1594,1574],[1562,198,1515],[1559,1441,1549],[1441,1443,1549],[1135,425,1481],[1239,1535,1507],[1595,1487,1500],[1570,1585,1586],[1589,1578,1568],[1568,1578,1575],[1579,1569,1583],[1177,1577,208],[115,1236,110],[1578,1593,1575],[1587,1576,1575],[1576,1581,1594],[1571,1582,1583],[1588,1579,1583],[1579,1580,1562],[1569,1579,1562],[1562,1580,198],[1027,1511,1429],[1589,1593,1578],[1587,1581,1576],[1582,1574,1594],[1574,1582,1571],[1575,1593,1587],[1583,1582,1588],[1580,1590,198],[1587,1593,1581],[1505,1541,96],[1369,1577,1177],[1573,1554,1505],[1479,1478,568],[1585,1589,1586],[1369,1177,704],[766,1584,1334],[977,1257,1059],[1091,1591,1407],[1591,1091,1457],[1585,1604,1589],[1581,1592,1594],[1602,1582,1594],[1582,1608,1588],[1608,1579,1588],[1579,1597,1580],[1419,1590,1580],[1597,1419,1580],[1431,1577,1291],[1589,1604,1593],[1601,1596,1593],[1593,1596,1581],[1306,1511,1027],[1511,1113,1573],[1786,1412,1585],[1412,1604,1585],[1581,1596,1592],[1592,1602,1594],[1608,1599,1579],[1599,1611,1579],[1579,1611,1597],[1512,1487,253],[1519,1489,1473],[1545,1540,868],[1083,1187,1402],[1117,1407,1400],[1292,733,1125],[284,1240,1245],[1604,1600,1593],[1600,1601,1593],[1582,1607,1608],[789,1369,704],[1467,1483,1519],[1601,1613,1596],[1596,1613,1592],[1602,1607,1582],[1620,1553,1252],[1601,1605,1613],[1592,1613,1602],[1602,1606,1607],[1608,1609,1599],[1599,1609,1611],[1603,1597,1611],[1265,1419,1597],[1603,1265,1597],[1392,1206,45],[928,1369,789],[1474,1528,1473],[1104,1468,1501],[1412,1521,1604],[1613,1631,1602],[1607,1610,1608],[1608,1610,1609],[1476,863,835],[1495,1503,1555],[1498,1397,718],[1520,1668,7],[1604,1615,1600],[1605,1601,1600],[1602,1631,1606],[1606,1610,1607],[1759,1595,1500],[1292,1298,733],[1615,1604,1521],[1609,1603,1611],[652,1462,1598],[1468,1525,1445],[1443,1501,1445],[1134,1723,150],[1521,1622,1615],[1615,1616,1600],[1616,1605,1600],[1605,1616,1612],[1605,1612,1613],[1612,1617,1613],[1613,1617,1631],[1606,1614,1610],[1265,1603,1403],[448,417,1480],[1595,253,1487],[1501,1468,1445],[1383,1456,877],[1490,1496,696],[1610,1627,1609],[1627,1621,1609],[1591,1481,1533],[1598,1471,1439],[1353,1261,703],[1606,1631,1614],[1609,1621,1403],[1532,1077,1494],[1528,1115,513],[1546,652,1446],[1211,928,1365],[1540,1473,1528],[1078,1502,1787],[1425,1430,1438],[1617,1630,1631],[959,749,944],[566,570,603],[1716,310,1521],[775,452,397],[1615,1636,1616],[1616,1636,1612],[1610,1632,1627],[789,704,1258],[1457,1481,1591],[1769,1756,811],[207,1629,722],[1629,1625,722],[1224,1277,1622],[1622,1636,1615],[1636,1646,1612],[1612,1630,1617],[1631,1626,1614],[1614,1632,1610],[1506,104,95],[1481,1457,1136],[1123,943,1442],[936,1446,1496],[1499,863,1476],[1629,1031,1625],[1233,1509,686],[1633,1634,1621],[1621,1387,1403],[1472,1512,253],[1177,208,704],[1277,1636,1622],[1626,1632,1614],[1627,1633,1621],[936,1496,1490],[185,1454,1451],[731,936,1512],[1638,1635,207],[553,1263,1264],[1653,1212,1639],[1633,1627,1632],[1633,1387,1634],[1458,1060,731],[368,1307,1113],[1264,1031,1629],[1152,850,1150],[1277,1644,1636],[1646,1637,1612],[1637,1630,1612],[1647,1631,1630],[1647,1626,1631],[1422,1524,1494],[1030,652,1546],[1635,1629,207],[1635,1264,1629],[1639,1646,1636],[1637,1640,1630],[1641,1632,1626],[1632,1642,1633],[1633,1643,1387],[842,1499,1143],[865,863,1499],[1516,978,1492],[67,1130,784],[1103,1505,96],[88,1441,1200],[1644,1639,1636],[1640,1647,1630],[1647,1641,1626],[1633,1648,1643],[1492,1532,1524],[1488,1516,1492],[1037,1471,1462],[612,1264,1635],[1502,1078,1124],[1641,1642,1632],[1648,1633,1642],[1528,513,868],[1492,1598,1532],[1095,991,760],[679,157,1664],[760,1128,1785],[1277,1650,1644],[320,1022,244],[1559,1549,86],[1676,1520,7],[1488,978,1516],[1095,760,1785],[1128,384,1120],[304,312,1638],[1081,1638,312],[1081,1635,1638],[103,612,1635],[652,1477,1462],[1650,1645,1644],[1645,1639,1644],[1639,1637,1646],[1640,1090,1647],[1654,1641,1647],[1654,1642,1641],[1654,1648,1642],[1643,1402,1387],[1432,335,1509],[384,1128,760],[1652,312,304],[103,1243,612],[1277,1649,1650],[1090,1654,1647],[1643,1648,1402],[1134,324,1675],[679,68,157],[1652,1081,312],[1136,301,803],[1653,1639,1645],[723,1440,1259],[803,854,1136],[104,1506,742],[1112,159,103],[1654,1083,1648],[977,1651,1257],[1397,1507,718],[1081,103,1635],[1650,677,1645],[1083,1402,1648],[1706,1655,1671],[1624,1704,1711],[767,2,1],[608,794,294],[1678,1683,1686],[767,1682,2],[1669,1692,1675],[296,1681,764],[1671,1656,1672],[17,1673,1679],[1706,1671,1673],[1662,1674,1699],[1655,1657,1656],[418,84,915],[1526,1514,764],[1658,1657,567],[870,1695,764],[813,1697,98],[1659,821,5],[60,1013,848],[1013,110,1213],[661,1038,1692],[1660,1703,17],[1693,1673,17],[1663,1715,1743],[1013,115,110],[344,1733,32],[1670,1663,1743],[1670,1743,1738],[1677,1670,1738],[1661,4,3],[1084,1683,1678],[1728,793,1130],[1683,1767,1196],[1677,1738,1196],[1279,1786,853],[294,1038,608],[1279,1689,1786],[870,18,1708],[870,1680,1695],[1705,10,1670],[1084,1767,1683],[1196,1738,1686],[1750,870,1681],[1750,18,870],[1773,1703,1660],[1135,47,425],[150,323,1134],[1707,1655,1706],[1741,344,1687],[1685,1691,1684],[1684,1691,802],[1672,1656,0],[1038,124,608],[1671,1672,1690],[1628,1218,1767],[1686,1275,1667],[1493,1750,1681],[1773,18,1750],[1773,1660,18],[1679,1671,16],[1735,1706,1673],[1667,1678,1686],[1688,1658,1],[1656,1688,0],[1293,1281,1458],[1698,1678,1667],[1696,1130,1722],[1698,1667,1696],[1715,1662,1699],[1692,1038,294],[1682,767,357],[1669,661,1692],[802,1702,824],[1028,1067,1784],[822,1624,778],[119,813,861],[1218,1670,1677],[1703,1693,17],[1658,1710,1],[750,1730,1729],[1701,750,1729],[1693,1735,1673],[1731,1694,98],[1691,1702,802],[783,1729,1719],[1680,870,1708],[1707,1709,1655],[533,756,675],[1691,1210,1702],[11,1705,1670],[1767,1218,1196],[1218,1677,1196],[1664,1716,1721],[1729,1725,1719],[1729,1072,1725],[1210,1116,1702],[1702,1720,824],[1682,1661,2],[1713,1719,1721],[1716,1786,1713],[1730,1722,1072],[294,1717,1811],[1692,294,1666],[1659,680,821],[824,1720,1714],[1726,1731,1718],[345,1062,1045],[1738,1743,1275],[1075,1089,1071],[783,1719,1689],[1275,684,1728],[1692,1666,1665],[1675,1692,1665],[294,1811,1666],[1716,1664,310],[1678,1698,1700],[6,9,1727],[676,649,595],[381,31,361],[1723,1804,1772],[1727,9,1694],[1720,1089,1714],[1786,1716,1412],[1683,1196,1686],[1718,1697,1085],[1116,1739,1702],[1739,1734,1720],[1702,1739,1720],[1089,1720,1734],[509,748,1745],[1743,1715,1726],[1717,294,794],[1116,1732,1739],[1718,1731,1697],[1696,1667,1130],[1134,1665,1723],[1694,712,98],[101,1687,102],[391,1736,101],[662,636,642],[1734,1447,1089],[1089,1447,1071],[436,99,493],[1689,1279,783],[1485,1465,1342],[1736,1687,101],[344,1741,1733],[1741,1742,1733],[1735,829,1706],[829,1707,1706],[1485,1332,1465],[952,1126,1742],[1747,1447,1734],[879,892,645],[1730,1146,1696],[829,1709,1707],[1709,1712,1655],[118,1739,1732],[1332,1744,1465],[1687,1749,1741],[1741,1758,1742],[679,1072,68],[1072,1722,68],[118,1747,1739],[1747,1734,1739],[1465,1744,1736],[1736,1740,1687],[1704,1701,783],[1665,624,1723],[1722,1130,67],[1025,1055,467],[1444,14,1701],[558,522,530],[1657,1658,1688],[1339,1746,1332],[1332,1748,1744],[1687,1740,1749],[1741,1749,1758],[1109,952,1742],[1747,118,141],[1671,1690,1628],[1671,1628,16],[1657,1688,1656],[1745,748,1447],[357,767,1710],[1746,1748,1332],[1146,1700,1698],[1759,1307,1338],[1239,781,1322],[1745,1447,1747],[522,1745,1747],[316,717,595],[148,1493,1724],[1758,1109,1742],[1725,1072,679],[726,719,1661],[1695,1680,1526],[1772,1750,1493],[148,1772,1493],[1542,1751,1101],[952,1109,1086],[1744,1752,1736],[1736,1752,1740],[1753,1755,1740],[391,1342,1736],[821,112,1520],[557,530,1747],[530,522,1747],[994,879,645],[1542,1756,1751],[1813,1693,1703],[1746,1754,1748],[1748,1764,1744],[1752,1757,1740],[1740,1757,1753],[1749,1740,1755],[1755,1763,1749],[1763,1758,1749],[1275,1743,684],[1813,1735,1693],[1107,1099,1101],[1723,624,1804],[1403,1603,1609],[1748,1754,1764],[1744,1757,1752],[1760,1109,1758],[1465,1736,1342],[436,115,99],[1686,1738,1275],[1751,1766,1101],[1759,1754,1746],[1755,1753,1763],[1570,1279,853],[1701,1146,750],[1655,1656,1671],[11,1670,1218],[1761,1751,1756],[1766,1107,1101],[1726,1623,1731],[1711,1704,1279],[67,784,68],[558,530,545],[1620,1618,1233],[1769,1761,1756],[102,1687,344],[1338,1754,1759],[1754,232,1764],[1744,1765,1757],[1757,1763,1753],[1762,1760,1758],[1760,1771,1109],[1339,1759,1746],[1675,1665,1134],[1730,1696,1722],[1774,1751,1761],[1766,1780,1107],[1780,1105,1107],[1764,1765,1744],[1763,1762,1758],[1772,1773,1750],[1811,1813,1703],[1434,1769,1432],[1780,1766,1751],[232,1781,1764],[1711,1279,1570],[1688,1,0],[1774,1780,1751],[1764,1781,1765],[1765,1768,1757],[1757,1768,1763],[1777,1782,1760],[1762,1777,1760],[1769,1774,1761],[1763,1777,1762],[1760,1782,1771],[232,1737,1781],[1768,1776,1763],[272,255,774],[1669,994,661],[1618,1769,1434],[1765,589,1768],[1770,1777,1763],[1701,1729,783],[1783,1774,1769],[1789,1780,1774],[589,1775,1768],[1776,1770,1763],[1782,1778,1771],[1771,1778,1070],[624,1703,1773],[624,1811,1703],[1620,1244,1618],[1779,1769,1618],[1779,1783,1769],[739,1735,1813],[1775,1776,1768],[1790,1777,1770],[1777,1778,1782],[1725,679,1721],[733,1293,1458],[1802,1618,1244],[1802,1779,1618],[1788,1783,1779],[1789,1774,1783],[1796,1780,1789],[1796,1119,1780],[1823,1817,325],[1699,1727,1623],[750,1146,1730],[1497,1724,296],[1128,1119,1796],[61,62,71],[1131,413,824],[1114,1111,249],[1784,1776,1775],[1123,723,1283],[1791,1788,1779],[1788,1789,1783],[1095,1797,1074],[1028,1784,1775],[1784,1770,1776],[1777,1790,1778],[1793,1797,1095],[1797,1800,1074],[1798,1790,1770],[1805,1802,1244],[1802,1791,1779],[1792,1789,1788],[1793,1785,1128],[1793,1095,1785],[1074,1800,1619],[741,457,593],[1798,1770,1784],[1798,1794,1790],[1786,1689,1713],[684,1726,1718],[1728,1085,793],[1795,1787,1502],[1806,1802,1805],[1819,1788,1791],[1067,1798,1784],[1790,1794,1778],[1795,1502,1124],[1801,1805,1787],[1807,1791,1802],[1807,1819,1791],[1819,1792,1788],[1799,1128,1796],[994,645,661],[684,1085,1728],[684,1718,1085],[1699,1623,1726],[1801,1787,1795],[1808,1789,1792],[1808,1796,1789],[1799,1793,1128],[1809,1797,1793],[1809,1803,1797],[1803,1800,1797],[1067,1794,1798],[774,255,1778],[1673,1671,1679],[879,1669,888],[19,1807,1802],[1810,1619,1800],[879,994,1669],[1794,774,1778],[1723,1772,148],[1804,1773,1772],[1814,1795,1124],[1649,1814,1124],[1814,1801,1795],[1812,1806,1805],[19,1802,1806],[19,1819,1807],[1810,1800,1803],[1804,624,1773],[1714,1131,824],[1801,1812,1805],[1812,19,1806],[1808,1792,1819],[1799,1809,1793],[1821,1810,1803],[1717,739,1813],[1061,1619,1822],[1794,1817,774],[79,1482,144],[1815,1801,1814],[23,1819,19],[589,1028,1775],[1817,1823,774],[1689,1719,1713],[1824,1814,1649],[1827,1818,1801],[1818,1812,1801],[1818,19,1812],[1818,20,19],[1816,1809,1799],[1821,1803,1809],[1822,1619,1810],[124,708,608],[1663,10,1715],[1815,1827,1801],[1820,1808,1819],[23,1820,1819],[603,1810,1821],[603,1822,1810],[1085,1697,793],[1628,1690,11],[1527,1704,1624],[1730,1072,1729],[1526,1444,1704],[1526,1680,1444],[1704,1444,1701],[1816,1821,1809],[1722,67,68],[317,272,1823],[1716,1713,1721],[16,1628,1767],[1527,1526,1704],[1824,1826,1814],[1814,1826,1815],[1818,21,20],[1835,1808,1820],[603,570,1822],[226,1070,1778],[1013,1181,1179],[1721,679,1664],[1717,1813,1811],[1828,1827,1815],[22,1820,23],[22,1835,1820],[1830,603,1821],[719,1659,5],[643,567,1657],[1717,794,739],[1825,1826,1824],[1828,1815,1826],[1829,21,1818],[1808,1835,13],[4,719,5],[10,1662,1715],[1828,1832,1827],[1832,1818,1827],[12,1833,1816],[1833,1821,1816],[1833,1830,1821],[14,1146,1701],[1186,1829,1818],[1280,603,1830],[14,1700,1146],[1667,1728,1130],[1825,1834,1826],[1834,1828,1826],[1832,1186,1818],[1836,13,1835],[1624,1711,1570],[778,1624,1570],[1719,1725,1721],[1002,1825,1831],[1002,1834,1825],[1834,1832,1828],[1186,21,1829],[1836,1835,22],[1837,1833,12],[1280,1830,1833],[1667,1275,1728],[16,1767,1084],[589,1765,1838],[1765,1781,1838],[1781,1737,1838],[1737,982,1838],[982,1053,1838],[1053,816,1838],[816,589,1838]]

},{}],"../../../node_modules/teapot/teapot.js":[function(require,module,exports) {
exports.positions=[[5.929688,4.125,0],[5.387188,4.125,2.7475],[5.2971,4.494141,2.70917],[5.832031,4.494141,0],[5.401602,4.617188,2.753633],[5.945313,4.617188,0],[5.614209,4.494141,2.844092],[6.175781,4.494141,0],[5.848437,4.125,2.94375],[6.429688,4.125,0],[3.899688,4.125,4.97],[3.830352,4.494141,4.900664],[3.910782,4.617188,4.981094],[4.074414,4.494141,5.144727],[4.254687,4.125,5.325],[1.677188,4.125,6.4575],[1.638858,4.494141,6.367412],[1.68332,4.617188,6.471914],[1.77378,4.494141,6.684522],[1.873438,4.125,6.91875],[-1.070312,4.125,7],[-1.070312,4.494141,6.902344],[-1.070312,4.617188,7.015625],[-1.070312,4.494141,7.246094],[-1.070312,4.125,7.5],[-1.070312,4.125,7],[-4.007656,4.125,6.4575],[-3.859572,4.494141,6.367412],[-1.070312,4.494141,6.902344],[-3.847676,4.617188,6.471914],[-1.070312,4.617188,7.015625],[-3.917371,4.494141,6.684522],[-1.070312,4.494141,7.246094],[-4.014062,4.125,6.91875],[-1.070312,4.125,7.5],[-6.209063,4.125,4.97],[-6.042168,4.494141,4.900664],[-6.0725,4.617188,4.981094],[-6.217675,4.494141,5.144727],[-6.395312,4.125,5.325],[-7.591093,4.125,2.7475],[-7.464421,4.494141,2.70917],[-7.550137,4.617188,2.753633],[-7.755822,4.494141,2.844092],[-7.989062,4.125,2.94375],[-8.070313,4.125,0],[-7.972656,4.494141,0],[-8.085938,4.617188,0],[-8.316406,4.494141,0],[-8.570313,4.125,0],[-8.070313,4.125,0],[-7.527812,4.125,-2.7475],[-7.437724,4.494141,-2.70917],[-7.972656,4.494141,0],[-7.542227,4.617188,-2.753633],[-8.085938,4.617188,0],[-7.754834,4.494141,-2.844092],[-8.316406,4.494141,0],[-7.989062,4.125,-2.94375],[-8.570313,4.125,0],[-6.040312,4.125,-4.97],[-5.970977,4.494141,-4.900664],[-6.051406,4.617188,-4.981094],[-6.215039,4.494141,-5.144727],[-6.395312,4.125,-5.325],[-3.817812,4.125,-6.4575],[-3.779482,4.494141,-6.367412],[-3.823945,4.617188,-6.471914],[-3.914404,4.494141,-6.684522],[-4.014062,4.125,-6.91875],[-1.070312,4.125,-7],[-1.070312,4.494141,-6.902344],[-1.070312,4.617188,-7.015625],[-1.070312,4.494141,-7.246094],[-1.070312,4.125,-7.5],[-1.070312,4.125,-7],[1.677188,4.125,-6.4575],[1.638858,4.494141,-6.367412],[-1.070312,4.494141,-6.902344],[1.68332,4.617188,-6.471914],[-1.070312,4.617188,-7.015625],[1.77378,4.494141,-6.684522],[-1.070312,4.494141,-7.246094],[1.873438,4.125,-6.91875],[-1.070312,4.125,-7.5],[3.899688,4.125,-4.97],[3.830352,4.494141,-4.900664],[3.910782,4.617188,-4.981094],[4.074414,4.494141,-5.144727],[4.254687,4.125,-5.325],[5.387188,4.125,-2.7475],[5.2971,4.494141,-2.70917],[5.401602,4.617188,-2.753633],[5.614209,4.494141,-2.844092],[5.848437,4.125,-2.94375],[5.929688,4.125,0],[5.832031,4.494141,0],[5.945313,4.617188,0],[6.175781,4.494141,0],[6.429688,4.125,0],[6.429688,4.125,0],[5.848437,4.125,2.94375],[6.695264,2.162109,3.304053],[7.347656,2.162109,0],[7.433985,0.234375,3.61836],[8.148438,0.234375,0],[7.956494,-1.623047,3.840674],[8.714844,-1.623047,0],[8.154688,-3.375,3.925],[8.929688,-3.375,0],[4.254687,4.125,5.325],[4.906446,2.162109,5.976758],[5.475,0.234375,6.545312],[5.877149,-1.623047,6.947461],[6.029688,-3.375,7.1],[1.873438,4.125,6.91875],[2.23374,2.162109,7.765576],[2.548047,0.234375,8.504297],[2.770362,-1.623047,9.026807],[2.854688,-3.375,9.225],[-1.070312,4.125,7.5],[-1.070312,2.162109,8.417969],[-1.070312,0.234375,9.21875],[-1.070312,-1.623047,9.785156],[-1.070312,-3.375,10],[-1.070312,4.125,7.5],[-4.014062,4.125,6.91875],[-4.374365,2.162109,7.765576],[-1.070312,2.162109,8.417969],[-4.688672,0.234375,8.504297],[-1.070312,0.234375,9.21875],[-4.910986,-1.623047,9.026807],[-1.070312,-1.623047,9.785156],[-4.995313,-3.375,9.225],[-1.070312,-3.375,10],[-6.395312,4.125,5.325],[-7.047071,2.162109,5.976758],[-7.615624,0.234375,6.545312],[-8.017773,-1.623047,6.947461],[-8.170312,-3.375,7.1],[-7.989062,4.125,2.94375],[-8.835889,2.162109,3.304053],[-9.57461,0.234375,3.61836],[-10.097119,-1.623047,3.840674],[-10.295313,-3.375,3.925],[-8.570313,4.125,0],[-9.488281,2.162109,0],[-10.289063,0.234375,0],[-10.855469,-1.623047,0],[-11.070313,-3.375,0],[-8.570313,4.125,0],[-7.989062,4.125,-2.94375],[-8.835889,2.162109,-3.304053],[-9.488281,2.162109,0],[-9.57461,0.234375,-3.61836],[-10.289063,0.234375,0],[-10.097119,-1.623047,-3.840674],[-10.855469,-1.623047,0],[-10.295313,-3.375,-3.925],[-11.070313,-3.375,0],[-6.395312,4.125,-5.325],[-7.047071,2.162109,-5.976758],[-7.615624,0.234375,-6.545312],[-8.017773,-1.623047,-6.947461],[-8.170312,-3.375,-7.1],[-4.014062,4.125,-6.91875],[-4.374365,2.162109,-7.765576],[-4.688672,0.234375,-8.504297],[-4.910986,-1.623047,-9.026807],[-4.995313,-3.375,-9.225],[-1.070312,4.125,-7.5],[-1.070312,2.162109,-8.417969],[-1.070312,0.234375,-9.21875],[-1.070312,-1.623047,-9.785156],[-1.070312,-3.375,-10],[-1.070312,4.125,-7.5],[1.873438,4.125,-6.91875],[2.23374,2.162109,-7.765576],[-1.070312,2.162109,-8.417969],[2.548047,0.234375,-8.504297],[-1.070312,0.234375,-9.21875],[2.770362,-1.623047,-9.026807],[-1.070312,-1.623047,-9.785156],[2.854688,-3.375,-9.225],[-1.070312,-3.375,-10],[4.254687,4.125,-5.325],[4.906446,2.162109,-5.976758],[5.475,0.234375,-6.545312],[5.877149,-1.623047,-6.947461],[6.029688,-3.375,-7.1],[5.848437,4.125,-2.94375],[6.695264,2.162109,-3.304053],[7.433985,0.234375,-3.61836],[7.956494,-1.623047,-3.840674],[8.154688,-3.375,-3.925],[6.429688,4.125,0],[7.347656,2.162109,0],[8.148438,0.234375,0],[8.714844,-1.623047,0],[8.929688,-3.375,0],[8.929688,-3.375,0],[8.154688,-3.375,3.925],[7.794336,-4.857422,3.77168],[8.539063,-4.857422,0],[7.001562,-5.953125,3.434375],[7.679688,-5.953125,0],[6.208789,-6.697266,3.09707],[6.820313,-6.697266,0],[5.848437,-7.125,2.94375],[6.429688,-7.125,0],[6.029688,-3.375,7.1],[5.752343,-4.857422,6.822656],[5.142187,-5.953125,6.2125],[4.532031,-6.697266,5.602344],[4.254687,-7.125,5.325],[2.854688,-3.375,9.225],[2.701367,-4.857422,8.864649],[2.364063,-5.953125,8.071875],[2.026758,-6.697266,7.279101],[1.873438,-7.125,6.91875],[-1.070312,-3.375,10],[-1.070312,-4.857422,9.609375],[-1.070312,-5.953125,8.75],[-1.070312,-6.697266,7.890625],[-1.070312,-7.125,7.5],[-1.070312,-3.375,10],[-4.995313,-3.375,9.225],[-4.841992,-4.857422,8.864649],[-1.070312,-4.857422,9.609375],[-4.504687,-5.953125,8.071875],[-1.070312,-5.953125,8.75],[-4.167383,-6.697266,7.279101],[-1.070312,-6.697266,7.890625],[-4.014062,-7.125,6.91875],[-1.070312,-7.125,7.5],[-8.170312,-3.375,7.1],[-7.892968,-4.857422,6.822656],[-7.282812,-5.953125,6.2125],[-6.672656,-6.697266,5.602344],[-6.395312,-7.125,5.325],[-10.295313,-3.375,3.925],[-9.934961,-4.857422,3.77168],[-9.142187,-5.953125,3.434375],[-8.349414,-6.697266,3.09707],[-7.989062,-7.125,2.94375],[-11.070313,-3.375,0],[-10.679688,-4.857422,0],[-9.820313,-5.953125,0],[-8.960938,-6.697266,0],[-8.570313,-7.125,0],[-11.070313,-3.375,0],[-10.295313,-3.375,-3.925],[-9.934961,-4.857422,-3.77168],[-10.679688,-4.857422,0],[-9.142187,-5.953125,-3.434375],[-9.820313,-5.953125,0],[-8.349414,-6.697266,-3.09707],[-8.960938,-6.697266,0],[-7.989062,-7.125,-2.94375],[-8.570313,-7.125,0],[-8.170312,-3.375,-7.1],[-7.892968,-4.857422,-6.822656],[-7.282812,-5.953125,-6.2125],[-6.672656,-6.697266,-5.602344],[-6.395312,-7.125,-5.325],[-4.995313,-3.375,-9.225],[-4.841992,-4.857422,-8.864649],[-4.504687,-5.953125,-8.071875],[-4.167383,-6.697266,-7.279101],[-4.014062,-7.125,-6.91875],[-1.070312,-3.375,-10],[-1.070312,-4.857422,-9.609375],[-1.070312,-5.953125,-8.75],[-1.070312,-6.697266,-7.890625],[-1.070312,-7.125,-7.5],[-1.070312,-3.375,-10],[2.854688,-3.375,-9.225],[2.701367,-4.857422,-8.864649],[-1.070312,-4.857422,-9.609375],[2.364063,-5.953125,-8.071875],[-1.070312,-5.953125,-8.75],[2.026758,-6.697266,-7.279101],[-1.070312,-6.697266,-7.890625],[1.873438,-7.125,-6.91875],[-1.070312,-7.125,-7.5],[6.029688,-3.375,-7.1],[5.752343,-4.857422,-6.822656],[5.142187,-5.953125,-6.2125],[4.532031,-6.697266,-5.602344],[4.254687,-7.125,-5.325],[8.154688,-3.375,-3.925],[7.794336,-4.857422,-3.77168],[7.001562,-5.953125,-3.434375],[6.208789,-6.697266,-3.09707],[5.848437,-7.125,-2.94375],[8.929688,-3.375,0],[8.539063,-4.857422,0],[7.679688,-5.953125,0],[6.820313,-6.697266,0],[6.429688,-7.125,0],[6.429688,-7.125,0],[5.848437,-7.125,2.94375],[5.691685,-7.400391,2.877056],[6.259766,-7.400391,0],[4.853868,-7.640625,2.520586],[5.351563,-7.640625,0],[2.783648,-7.810547,1.639761],[3.107422,-7.810547,0],[-1.070312,-7.875,0],[4.254687,-7.125,5.325],[4.134043,-7.400391,5.204355],[3.489219,-7.640625,4.559531],[1.895879,-7.810547,2.966191],[-1.070312,-7.875,0],[1.873438,-7.125,6.91875],[1.806743,-7.400391,6.761997],[1.450274,-7.640625,5.92418],[0.569448,-7.810547,3.85396],[-1.070312,-7.875,0],[-1.070312,-7.125,7.5],[-1.070312,-7.400391,7.330078],[-1.070312,-7.640625,6.421875],[-1.070312,-7.810547,4.177734],[-1.070312,-7.875,0],[-1.070312,-7.125,7.5],[-4.014062,-7.125,6.91875],[-3.947368,-7.400391,6.761997],[-1.070312,-7.400391,7.330078],[-3.590898,-7.640625,5.92418],[-1.070312,-7.640625,6.421875],[-2.710073,-7.810547,3.85396],[-1.070312,-7.810547,4.177734],[-1.070312,-7.875,0],[-6.395312,-7.125,5.325],[-6.274668,-7.400391,5.204355],[-5.629844,-7.640625,4.559531],[-4.036504,-7.810547,2.966191],[-1.070312,-7.875,0],[-7.989062,-7.125,2.94375],[-7.832309,-7.400391,2.877056],[-6.994492,-7.640625,2.520586],[-4.924272,-7.810547,1.639761],[-1.070312,-7.875,0],[-8.570313,-7.125,0],[-8.400391,-7.400391,0],[-7.492188,-7.640625,0],[-5.248047,-7.810547,0],[-1.070312,-7.875,0],[-8.570313,-7.125,0],[-7.989062,-7.125,-2.94375],[-7.832309,-7.400391,-2.877056],[-8.400391,-7.400391,0],[-6.994492,-7.640625,-2.520586],[-7.492188,-7.640625,0],[-4.924272,-7.810547,-1.639761],[-5.248047,-7.810547,0],[-1.070312,-7.875,0],[-6.395312,-7.125,-5.325],[-6.274668,-7.400391,-5.204355],[-5.629844,-7.640625,-4.559531],[-4.036504,-7.810547,-2.966191],[-1.070312,-7.875,0],[-4.014062,-7.125,-6.91875],[-3.947368,-7.400391,-6.761997],[-3.590898,-7.640625,-5.92418],[-2.710073,-7.810547,-3.85396],[-1.070312,-7.875,0],[-1.070312,-7.125,-7.5],[-1.070312,-7.400391,-7.330078],[-1.070312,-7.640625,-6.421875],[-1.070312,-7.810547,-4.177734],[-1.070312,-7.875,0],[-1.070312,-7.125,-7.5],[1.873438,-7.125,-6.91875],[1.806743,-7.400391,-6.761997],[-1.070312,-7.400391,-7.330078],[1.450274,-7.640625,-5.92418],[-1.070312,-7.640625,-6.421875],[0.569448,-7.810547,-3.85396],[-1.070312,-7.810547,-4.177734],[-1.070312,-7.875,0],[4.254687,-7.125,-5.325],[4.134043,-7.400391,-5.204355],[3.489219,-7.640625,-4.559531],[1.895879,-7.810547,-2.966191],[-1.070312,-7.875,0],[5.848437,-7.125,-2.94375],[5.691685,-7.400391,-2.877056],[4.853868,-7.640625,-2.520586],[2.783648,-7.810547,-1.639761],[-1.070312,-7.875,0],[6.429688,-7.125,0],[6.259766,-7.400391,0],[5.351563,-7.640625,0],[3.107422,-7.810547,0],[-1.070312,-7.875,0],[-9.070313,2.25,0],[-8.992188,2.425781,0.84375],[-11.47583,2.405457,0.84375],[-11.40625,2.232422,0],[-13.298828,2.263184,0.84375],[-13.132813,2.109375,0],[-14.421631,1.877014,0.84375],[-14.203125,1.775391,0],[-14.804688,1.125,0.84375],[-14.570313,1.125,0],[-8.820313,2.8125,1.125],[-11.628906,2.786134,1.125],[-13.664063,2.601563,1.125],[-14.902344,2.100586,1.125],[-15.320313,1.125,1.125],[-8.648438,3.199219,0.84375],[-11.781982,3.166809,0.84375],[-14.029297,2.939941,0.84375],[-15.383057,2.324158,0.84375],[-15.835938,1.125,0.84375],[-8.570313,3.375,0],[-11.851563,3.339844,0],[-14.195313,3.09375,0],[-15.601563,2.425781,0],[-16.070313,1.125,0],[-8.570313,3.375,0],[-8.648438,3.199219,-0.84375],[-11.781982,3.166809,-0.84375],[-11.851563,3.339844,0],[-14.029297,2.939941,-0.84375],[-14.195313,3.09375,0],[-15.383057,2.324158,-0.84375],[-15.601563,2.425781,0],[-15.835938,1.125,-0.84375],[-16.070313,1.125,0],[-8.820313,2.8125,-1.125],[-11.628906,2.786134,-1.125],[-13.664063,2.601563,-1.125],[-14.902344,2.100586,-1.125],[-15.320313,1.125,-1.125],[-8.992188,2.425781,-0.84375],[-11.47583,2.405457,-0.84375],[-13.298828,2.263184,-0.84375],[-14.421631,1.877014,-0.84375],[-14.804688,1.125,-0.84375],[-9.070313,2.25,0],[-11.40625,2.232422,0],[-13.132813,2.109375,0],[-14.203125,1.775391,0],[-14.570313,1.125,0],[-14.570313,1.125,0],[-14.804688,1.125,0.84375],[-14.588013,0.00705,0.84375],[-14.375,0.105469,0],[-13.90918,-1.275146,0.84375],[-13.757813,-1.125,0],[-12.724976,-2.540863,0.84375],[-12.671875,-2.355469,0],[-10.992188,-3.609375,0.84375],[-11.070313,-3.375,0],[-15.320313,1.125,1.125],[-15.056641,-0.209473,1.125],[-14.242188,-1.605469,1.125],[-12.841797,-2.94873,1.125],[-10.820313,-4.125,1.125],[-15.835938,1.125,0.84375],[-15.525269,-0.425995,0.84375],[-14.575195,-1.935791,0.84375],[-12.958618,-3.356598,0.84375],[-10.648438,-4.640625,0.84375],[-16.070313,1.125,0],[-15.738281,-0.524414,0],[-14.726563,-2.085938,0],[-13.011719,-3.541992,0],[-10.570313,-4.875,0],[-16.070313,1.125,0],[-15.835938,1.125,-0.84375],[-15.525269,-0.425995,-0.84375],[-15.738281,-0.524414,0],[-14.575195,-1.935791,-0.84375],[-14.726563,-2.085938,0],[-12.958618,-3.356598,-0.84375],[-13.011719,-3.541992,0],[-10.648438,-4.640625,-0.84375],[-10.570313,-4.875,0],[-15.320313,1.125,-1.125],[-15.056641,-0.209473,-1.125],[-14.242188,-1.605469,-1.125],[-12.841797,-2.94873,-1.125],[-10.820313,-4.125,-1.125],[-14.804688,1.125,-0.84375],[-14.588013,0.00705,-0.84375],[-13.90918,-1.275146,-0.84375],[-12.724976,-2.540863,-0.84375],[-10.992188,-3.609375,-0.84375],[-14.570313,1.125,0],[-14.375,0.105469,0],[-13.757813,-1.125,0],[-12.671875,-2.355469,0],[-11.070313,-3.375,0],[7.429688,-0.75,0],[7.429688,-1.394531,1.85625],[10.01123,-0.677124,1.676074],[9.828125,-0.199219,0],[11.101563,0.84668,1.279688],[10.867188,1.125,0],[11.723145,2.629761,0.883301],[11.4375,2.730469,0],[12.898438,4.125,0.703125],[12.429688,4.125,0],[7.429688,-2.8125,2.475],[10.414063,-1.728516,2.234766],[11.617188,0.234375,1.70625],[12.351563,2.408203,1.177734],[13.929688,4.125,0.9375],[7.429688,-4.230469,1.85625],[10.816895,-2.779907,1.676074],[12.132813,-0.37793,1.279688],[12.97998,2.186646,0.883301],[14.960938,4.125,0.703125],[7.429688,-4.875,0],[11,-3.257813,0],[12.367188,-0.65625,0],[13.265625,2.085938,0],[15.429688,4.125,0],[7.429688,-4.875,0],[7.429688,-4.230469,-1.85625],[10.816895,-2.779907,-1.676074],[11,-3.257813,0],[12.132813,-0.37793,-1.279688],[12.367188,-0.65625,0],[12.97998,2.186646,-0.883301],[13.265625,2.085938,0],[14.960938,4.125,-0.703125],[15.429688,4.125,0],[7.429688,-2.8125,-2.475],[10.414063,-1.728516,-2.234766],[11.617188,0.234375,-1.70625],[12.351563,2.408203,-1.177734],[13.929688,4.125,-0.9375],[7.429688,-1.394531,-1.85625],[10.01123,-0.677124,-1.676074],[11.101563,0.84668,-1.279688],[11.723145,2.629761,-0.883301],[12.898438,4.125,-0.703125],[7.429688,-0.75,0],[9.828125,-0.199219,0],[10.867188,1.125,0],[11.4375,2.730469,0],[12.429688,4.125,0],[12.429688,4.125,0],[12.898438,4.125,0.703125],[13.291077,4.346237,0.65918],[12.789063,4.335938,0],[13.525879,4.422729,0.5625],[13.054688,4.40625,0],[13.532898,4.350357,0.46582],[13.132813,4.335938,0],[13.242188,4.125,0.421875],[12.929688,4.125,0],[13.929688,4.125,0.9375],[14.395508,4.368896,0.878906],[14.5625,4.458984,0.75],[14.413086,4.38208,0.621094],[13.929688,4.125,0.5625],[14.960938,4.125,0.703125],[15.499939,4.391556,0.65918],[15.599121,4.495239,0.5625],[15.293274,4.413804,0.46582],[14.617188,4.125,0.421875],[15.429688,4.125,0],[16.001953,4.401855,0],[16.070313,4.511719,0],[15.693359,4.428224,0],[14.929688,4.125,0],[15.429688,4.125,0],[14.960938,4.125,-0.703125],[15.499939,4.391556,-0.65918],[16.001953,4.401855,0],[15.599121,4.495239,-0.5625],[16.070313,4.511719,0],[15.293274,4.413804,-0.46582],[15.693359,4.428224,0],[14.617188,4.125,-0.421875],[14.929688,4.125,0],[13.929688,4.125,-0.9375],[14.395508,4.368896,-0.878906],[14.5625,4.458984,-0.75],[14.413086,4.38208,-0.621094],[13.929688,4.125,-0.5625],[12.898438,4.125,-0.703125],[13.291077,4.346237,-0.65918],[13.525879,4.422729,-0.5625],[13.532898,4.350357,-0.46582],[13.242188,4.125,-0.421875],[12.429688,4.125,0],[12.789063,4.335938,0],[13.054688,4.40625,0],[13.132813,4.335938,0],[12.929688,4.125,0],[0.501414,7.628906,0.670256],[0.632813,7.628906,0],[-1.070312,7.875,0],[0.429278,7.03125,0.639395],[0.554688,7.03125,0],[-0.162029,6.292969,0.38696],[-0.085937,6.292969,0],[-0.147812,5.625,0.3925],[-0.070312,5.625,0],[0.140489,7.628906,1.210801],[-1.070312,7.875,0],[0.084844,7.03125,1.155156],[-0.370879,6.292969,0.699434],[-0.360312,5.625,0.71],[-0.400056,7.628906,1.571726],[-1.070312,7.875,0],[-0.430918,7.03125,1.49959],[-0.683352,6.292969,0.908284],[-0.677812,5.625,0.9225],[-1.070312,7.628906,1.703125],[-1.070312,7.875,0],[-1.070312,7.03125,1.625],[-1.070312,6.292969,0.984375],[-1.070312,5.625,1],[-1.740569,7.628906,1.571726],[-1.070312,7.628906,1.703125],[-1.070312,7.875,0],[-1.709707,7.03125,1.49959],[-1.070312,7.03125,1.625],[-1.457273,6.292969,0.908284],[-1.070312,6.292969,0.984375],[-1.462812,5.625,0.9225],[-1.070312,5.625,1],[-2.281113,7.628906,1.210801],[-1.070312,7.875,0],[-2.225469,7.03125,1.155156],[-1.769746,6.292969,0.699434],[-1.780312,5.625,0.71],[-2.642038,7.628906,0.670256],[-1.070312,7.875,0],[-2.569902,7.03125,0.639395],[-1.978596,6.292969,0.38696],[-1.992812,5.625,0.3925],[-2.773438,7.628906,0],[-1.070312,7.875,0],[-2.695313,7.03125,0],[-2.054687,6.292969,0],[-2.070312,5.625,0],[-2.642038,7.628906,-0.670256],[-2.773438,7.628906,0],[-1.070312,7.875,0],[-2.569902,7.03125,-0.639395],[-2.695313,7.03125,0],[-1.978596,6.292969,-0.38696],[-2.054687,6.292969,0],[-1.992812,5.625,-0.3925],[-2.070312,5.625,0],[-2.281113,7.628906,-1.210801],[-1.070312,7.875,0],[-2.225469,7.03125,-1.155156],[-1.769746,6.292969,-0.699434],[-1.780312,5.625,-0.71],[-1.740569,7.628906,-1.571726],[-1.070312,7.875,0],[-1.709707,7.03125,-1.49959],[-1.457273,6.292969,-0.908284],[-1.462812,5.625,-0.9225],[-1.070312,7.628906,-1.703125],[-1.070312,7.875,0],[-1.070312,7.03125,-1.625],[-1.070312,6.292969,-0.984375],[-1.070312,5.625,-1],[-0.400056,7.628906,-1.571726],[-1.070312,7.628906,-1.703125],[-1.070312,7.875,0],[-0.430918,7.03125,-1.49959],[-1.070312,7.03125,-1.625],[-0.683352,6.292969,-0.908284],[-1.070312,6.292969,-0.984375],[-0.677812,5.625,-0.9225],[-1.070312,5.625,-1],[0.140489,7.628906,-1.210801],[-1.070312,7.875,0],[0.084844,7.03125,-1.155156],[-0.370879,6.292969,-0.699434],[-0.360312,5.625,-0.71],[0.501414,7.628906,-0.670256],[-1.070312,7.875,0],[0.429278,7.03125,-0.639395],[-0.162029,6.292969,-0.38696],[-0.147812,5.625,-0.3925],[0.632813,7.628906,0],[-1.070312,7.875,0],[0.554688,7.03125,0],[-0.085937,6.292969,0],[-0.070312,5.625,0],[-0.070312,5.625,0],[-0.147812,5.625,0.3925],[1.034141,5.179688,0.895391],[1.210938,5.179688,0],[2.735,4.875,1.619062],[3.054688,4.875,0],[4.262891,4.570313,2.26914],[4.710938,4.570313,0],[4.925938,4.125,2.55125],[5.429688,4.125,0],[-0.360312,5.625,0.71],[0.549375,5.179688,1.619688],[1.858438,4.875,2.92875],[3.034375,4.570313,4.104687],[3.544688,4.125,4.615],[-0.677812,5.625,0.9225],[-0.174922,5.179688,2.104453],[0.54875,4.875,3.805313],[1.198828,4.570313,5.333203],[1.480938,4.125,5.99625],[-1.070312,5.625,1],[-1.070312,5.179688,2.28125],[-1.070312,4.875,4.125],[-1.070312,4.570313,5.78125],[-1.070312,4.125,6.5],[-1.070312,5.625,1],[-1.462812,5.625,0.9225],[-1.965703,5.179688,2.104453],[-1.070312,5.179688,2.28125],[-2.689375,4.875,3.805313],[-1.070312,4.875,4.125],[-3.339453,4.570313,5.333203],[-1.070312,4.570313,5.78125],[-3.621562,4.125,5.99625],[-1.070312,4.125,6.5],[-1.780312,5.625,0.71],[-2.69,5.179688,1.619688],[-3.999062,4.875,2.92875],[-5.174999,4.570313,4.104687],[-5.685312,4.125,4.615],[-1.992812,5.625,0.3925],[-3.174765,5.179688,0.895391],[-4.875625,4.875,1.619062],[-6.403516,4.570313,2.26914],[-7.066563,4.125,2.55125],[-2.070312,5.625,0],[-3.351562,5.179688,0],[-5.195313,4.875,0],[-6.851563,4.570313,0],[-7.570313,4.125,0],[-2.070312,5.625,0],[-1.992812,5.625,-0.3925],[-3.174765,5.179688,-0.895391],[-3.351562,5.179688,0],[-4.875625,4.875,-1.619062],[-5.195313,4.875,0],[-6.403516,4.570313,-2.26914],[-6.851563,4.570313,0],[-7.066563,4.125,-2.55125],[-7.570313,4.125,0],[-1.780312,5.625,-0.71],[-2.69,5.179688,-1.619688],[-3.999062,4.875,-2.92875],[-5.174999,4.570313,-4.104687],[-5.685312,4.125,-4.615],[-1.462812,5.625,-0.9225],[-1.965703,5.179688,-2.104453],[-2.689375,4.875,-3.805313],[-3.339453,4.570313,-5.333203],[-3.621562,4.125,-5.99625],[-1.070312,5.625,-1],[-1.070312,5.179688,-2.28125],[-1.070312,4.875,-4.125],[-1.070312,4.570313,-5.78125],[-1.070312,4.125,-6.5],[-1.070312,5.625,-1],[-0.677812,5.625,-0.9225],[-0.174922,5.179688,-2.104453],[-1.070312,5.179688,-2.28125],[0.54875,4.875,-3.805313],[-1.070312,4.875,-4.125],[1.198828,4.570313,-5.333203],[-1.070312,4.570313,-5.78125],[1.480938,4.125,-5.99625],[-1.070312,4.125,-6.5],[-0.360312,5.625,-0.71],[0.549375,5.179688,-1.619688],[1.858438,4.875,-2.92875],[3.034375,4.570313,-4.104687],[3.544688,4.125,-4.615],[-0.147812,5.625,-0.3925],[1.034141,5.179688,-0.895391],[2.735,4.875,-1.619062],[4.262891,4.570313,-2.26914],[4.925938,4.125,-2.55125],[-0.070312,5.625,0],[1.210938,5.179688,0],[3.054688,4.875,0],[4.710938,4.570313,0],[5.429688,4.125,0]];
exports.cells=[[0,1,2],[2,3,0],[3,2,4],[4,5,3],[5,4,6],[6,7,5],[7,6,8],[8,9,7],[1,10,11],[11,2,1],[2,11,12],[12,4,2],[4,12,13],[13,6,4],[6,13,14],[14,8,6],[10,15,16],[16,11,10],[11,16,17],[17,12,11],[12,17,18],[18,13,12],[13,18,19],[19,14,13],[15,20,21],[21,16,15],[16,21,22],[22,17,16],[17,22,23],[23,18,17],[18,23,24],[24,19,18],[25,26,27],[27,28,25],[28,27,29],[29,30,28],[30,29,31],[31,32,30],[32,31,33],[33,34,32],[26,35,36],[36,27,26],[27,36,37],[37,29,27],[29,37,38],[38,31,29],[31,38,39],[39,33,31],[35,40,41],[41,36,35],[36,41,42],[42,37,36],[37,42,43],[43,38,37],[38,43,44],[44,39,38],[40,45,46],[46,41,40],[41,46,47],[47,42,41],[42,47,48],[48,43,42],[43,48,49],[49,44,43],[50,51,52],[52,53,50],[53,52,54],[54,55,53],[55,54,56],[56,57,55],[57,56,58],[58,59,57],[51,60,61],[61,52,51],[52,61,62],[62,54,52],[54,62,63],[63,56,54],[56,63,64],[64,58,56],[60,65,66],[66,61,60],[61,66,67],[67,62,61],[62,67,68],[68,63,62],[63,68,69],[69,64,63],[65,70,71],[71,66,65],[66,71,72],[72,67,66],[67,72,73],[73,68,67],[68,73,74],[74,69,68],[75,76,77],[77,78,75],[78,77,79],[79,80,78],[80,79,81],[81,82,80],[82,81,83],[83,84,82],[76,85,86],[86,77,76],[77,86,87],[87,79,77],[79,87,88],[88,81,79],[81,88,89],[89,83,81],[85,90,91],[91,86,85],[86,91,92],[92,87,86],[87,92,93],[93,88,87],[88,93,94],[94,89,88],[90,95,96],[96,91,90],[91,96,97],[97,92,91],[92,97,98],[98,93,92],[93,98,99],[99,94,93],[100,101,102],[102,103,100],[103,102,104],[104,105,103],[105,104,106],[106,107,105],[107,106,108],[108,109,107],[101,110,111],[111,102,101],[102,111,112],[112,104,102],[104,112,113],[113,106,104],[106,113,114],[114,108,106],[110,115,116],[116,111,110],[111,116,117],[117,112,111],[112,117,118],[118,113,112],[113,118,119],[119,114,113],[115,120,121],[121,116,115],[116,121,122],[122,117,116],[117,122,123],[123,118,117],[118,123,124],[124,119,118],[125,126,127],[127,128,125],[128,127,129],[129,130,128],[130,129,131],[131,132,130],[132,131,133],[133,134,132],[126,135,136],[136,127,126],[127,136,137],[137,129,127],[129,137,138],[138,131,129],[131,138,139],[139,133,131],[135,140,141],[141,136,135],[136,141,142],[142,137,136],[137,142,143],[143,138,137],[138,143,144],[144,139,138],[140,145,146],[146,141,140],[141,146,147],[147,142,141],[142,147,148],[148,143,142],[143,148,149],[149,144,143],[150,151,152],[152,153,150],[153,152,154],[154,155,153],[155,154,156],[156,157,155],[157,156,158],[158,159,157],[151,160,161],[161,152,151],[152,161,162],[162,154,152],[154,162,163],[163,156,154],[156,163,164],[164,158,156],[160,165,166],[166,161,160],[161,166,167],[167,162,161],[162,167,168],[168,163,162],[163,168,169],[169,164,163],[165,170,171],[171,166,165],[166,171,172],[172,167,166],[167,172,173],[173,168,167],[168,173,174],[174,169,168],[175,176,177],[177,178,175],[178,177,179],[179,180,178],[180,179,181],[181,182,180],[182,181,183],[183,184,182],[176,185,186],[186,177,176],[177,186,187],[187,179,177],[179,187,188],[188,181,179],[181,188,189],[189,183,181],[185,190,191],[191,186,185],[186,191,192],[192,187,186],[187,192,193],[193,188,187],[188,193,194],[194,189,188],[190,195,196],[196,191,190],[191,196,197],[197,192,191],[192,197,198],[198,193,192],[193,198,199],[199,194,193],[200,201,202],[202,203,200],[203,202,204],[204,205,203],[205,204,206],[206,207,205],[207,206,208],[208,209,207],[201,210,211],[211,202,201],[202,211,212],[212,204,202],[204,212,213],[213,206,204],[206,213,214],[214,208,206],[210,215,216],[216,211,210],[211,216,217],[217,212,211],[212,217,218],[218,213,212],[213,218,219],[219,214,213],[215,220,221],[221,216,215],[216,221,222],[222,217,216],[217,222,223],[223,218,217],[218,223,224],[224,219,218],[225,226,227],[227,228,225],[228,227,229],[229,230,228],[230,229,231],[231,232,230],[232,231,233],[233,234,232],[226,235,236],[236,227,226],[227,236,237],[237,229,227],[229,237,238],[238,231,229],[231,238,239],[239,233,231],[235,240,241],[241,236,235],[236,241,242],[242,237,236],[237,242,243],[243,238,237],[238,243,244],[244,239,238],[240,245,246],[246,241,240],[241,246,247],[247,242,241],[242,247,248],[248,243,242],[243,248,249],[249,244,243],[250,251,252],[252,253,250],[253,252,254],[254,255,253],[255,254,256],[256,257,255],[257,256,258],[258,259,257],[251,260,261],[261,252,251],[252,261,262],[262,254,252],[254,262,263],[263,256,254],[256,263,264],[264,258,256],[260,265,266],[266,261,260],[261,266,267],[267,262,261],[262,267,268],[268,263,262],[263,268,269],[269,264,263],[265,270,271],[271,266,265],[266,271,272],[272,267,266],[267,272,273],[273,268,267],[268,273,274],[274,269,268],[275,276,277],[277,278,275],[278,277,279],[279,280,278],[280,279,281],[281,282,280],[282,281,283],[283,284,282],[276,285,286],[286,277,276],[277,286,287],[287,279,277],[279,287,288],[288,281,279],[281,288,289],[289,283,281],[285,290,291],[291,286,285],[286,291,292],[292,287,286],[287,292,293],[293,288,287],[288,293,294],[294,289,288],[290,295,296],[296,291,290],[291,296,297],[297,292,291],[292,297,298],[298,293,292],[293,298,299],[299,294,293],[300,301,302],[302,303,300],[303,302,304],[304,305,303],[305,304,306],[306,307,305],[307,306,308],[301,309,310],[310,302,301],[302,310,311],[311,304,302],[304,311,312],[312,306,304],[306,312,313],[309,314,315],[315,310,309],[310,315,316],[316,311,310],[311,316,317],[317,312,311],[312,317,318],[314,319,320],[320,315,314],[315,320,321],[321,316,315],[316,321,322],[322,317,316],[317,322,323],[324,325,326],[326,327,324],[327,326,328],[328,329,327],[329,328,330],[330,331,329],[331,330,332],[325,333,334],[334,326,325],[326,334,335],[335,328,326],[328,335,336],[336,330,328],[330,336,337],[333,338,339],[339,334,333],[334,339,340],[340,335,334],[335,340,341],[341,336,335],[336,341,342],[338,343,344],[344,339,338],[339,344,345],[345,340,339],[340,345,346],[346,341,340],[341,346,347],[348,349,350],[350,351,348],[351,350,352],[352,353,351],[353,352,354],[354,355,353],[355,354,356],[349,357,358],[358,350,349],[350,358,359],[359,352,350],[352,359,360],[360,354,352],[354,360,361],[357,362,363],[363,358,357],[358,363,364],[364,359,358],[359,364,365],[365,360,359],[360,365,366],[362,367,368],[368,363,362],[363,368,369],[369,364,363],[364,369,370],[370,365,364],[365,370,371],[372,373,374],[374,375,372],[375,374,376],[376,377,375],[377,376,378],[378,379,377],[379,378,380],[373,381,382],[382,374,373],[374,382,383],[383,376,374],[376,383,384],[384,378,376],[378,384,385],[381,386,387],[387,382,381],[382,387,388],[388,383,382],[383,388,389],[389,384,383],[384,389,390],[386,391,392],[392,387,386],[387,392,393],[393,388,387],[388,393,394],[394,389,388],[389,394,395],[396,397,398],[398,399,396],[399,398,400],[400,401,399],[401,400,402],[402,403,401],[403,402,404],[404,405,403],[397,406,407],[407,398,397],[398,407,408],[408,400,398],[400,408,409],[409,402,400],[402,409,410],[410,404,402],[406,411,412],[412,407,406],[407,412,413],[413,408,407],[408,413,414],[414,409,408],[409,414,415],[415,410,409],[411,416,417],[417,412,411],[412,417,418],[418,413,412],[413,418,419],[419,414,413],[414,419,420],[420,415,414],[421,422,423],[423,424,421],[424,423,425],[425,426,424],[426,425,427],[427,428,426],[428,427,429],[429,430,428],[422,431,432],[432,423,422],[423,432,433],[433,425,423],[425,433,434],[434,427,425],[427,434,435],[435,429,427],[431,436,437],[437,432,431],[432,437,438],[438,433,432],[433,438,439],[439,434,433],[434,439,440],[440,435,434],[436,441,442],[442,437,436],[437,442,443],[443,438,437],[438,443,444],[444,439,438],[439,444,445],[445,440,439],[446,447,448],[448,449,446],[449,448,450],[450,451,449],[451,450,452],[452,453,451],[453,452,454],[454,455,453],[447,456,457],[457,448,447],[448,457,458],[458,450,448],[450,458,459],[459,452,450],[452,459,460],[460,454,452],[456,461,462],[462,457,456],[457,462,463],[463,458,457],[458,463,464],[464,459,458],[459,464,465],[465,460,459],[461,466,467],[467,462,461],[462,467,468],[468,463,462],[463,468,469],[469,464,463],[464,469,470],[470,465,464],[471,472,473],[473,474,471],[474,473,475],[475,476,474],[476,475,477],[477,478,476],[478,477,479],[479,480,478],[472,481,482],[482,473,472],[473,482,483],[483,475,473],[475,483,484],[484,477,475],[477,484,485],[485,479,477],[481,486,487],[487,482,481],[482,487,488],[488,483,482],[483,488,489],[489,484,483],[484,489,490],[490,485,484],[486,491,492],[492,487,486],[487,492,493],[493,488,487],[488,493,494],[494,489,488],[489,494,495],[495,490,489],[496,497,498],[498,499,496],[499,498,500],[500,501,499],[501,500,502],[502,503,501],[503,502,504],[504,505,503],[497,506,507],[507,498,497],[498,507,508],[508,500,498],[500,508,509],[509,502,500],[502,509,510],[510,504,502],[506,511,512],[512,507,506],[507,512,513],[513,508,507],[508,513,514],[514,509,508],[509,514,515],[515,510,509],[511,516,517],[517,512,511],[512,517,518],[518,513,512],[513,518,519],[519,514,513],[514,519,520],[520,515,514],[521,522,523],[523,524,521],[524,523,525],[525,526,524],[526,525,527],[527,528,526],[528,527,529],[529,530,528],[522,531,532],[532,523,522],[523,532,533],[533,525,523],[525,533,534],[534,527,525],[527,534,535],[535,529,527],[531,536,537],[537,532,531],[532,537,538],[538,533,532],[533,538,539],[539,534,533],[534,539,540],[540,535,534],[536,541,542],[542,537,536],[537,542,543],[543,538,537],[538,543,544],[544,539,538],[539,544,545],[545,540,539],[546,547,548],[548,549,546],[549,548,550],[550,551,549],[551,550,552],[552,553,551],[553,552,554],[554,555,553],[547,556,557],[557,548,547],[548,557,558],[558,550,548],[550,558,559],[559,552,550],[552,559,560],[560,554,552],[556,561,562],[562,557,556],[557,562,563],[563,558,557],[558,563,564],[564,559,558],[559,564,565],[565,560,559],[561,566,567],[567,562,561],[562,567,568],[568,563,562],[563,568,569],[569,564,563],[564,569,570],[570,565,564],[571,572,573],[573,574,571],[574,573,575],[575,576,574],[576,575,577],[577,578,576],[578,577,579],[579,580,578],[572,581,582],[582,573,572],[573,582,583],[583,575,573],[575,583,584],[584,577,575],[577,584,585],[585,579,577],[581,586,587],[587,582,581],[582,587,588],[588,583,582],[583,588,589],[589,584,583],[584,589,590],[590,585,584],[586,591,592],[592,587,586],[587,592,593],[593,588,587],[588,593,594],[594,589,588],[589,594,595],[595,590,589],[596,597,598],[597,596,599],[599,600,597],[600,599,601],[601,602,600],[602,601,603],[603,604,602],[605,596,606],[596,605,607],[607,599,596],[599,607,608],[608,601,599],[601,608,609],[609,603,601],[610,605,611],[605,610,612],[612,607,605],[607,612,613],[613,608,607],[608,613,614],[614,609,608],[615,610,616],[610,615,617],[617,612,610],[612,617,618],[618,613,612],[613,618,619],[619,614,613],[620,621,622],[621,620,623],[623,624,621],[624,623,625],[625,626,624],[626,625,627],[627,628,626],[629,620,630],[620,629,631],[631,623,620],[623,631,632],[632,625,623],[625,632,633],[633,627,625],[634,629,635],[629,634,636],[636,631,629],[631,636,637],[637,632,631],[632,637,638],[638,633,632],[639,634,640],[634,639,641],[641,636,634],[636,641,642],[642,637,636],[637,642,643],[643,638,637],[644,645,646],[645,644,647],[647,648,645],[648,647,649],[649,650,648],[650,649,651],[651,652,650],[653,644,654],[644,653,655],[655,647,644],[647,655,656],[656,649,647],[649,656,657],[657,651,649],[658,653,659],[653,658,660],[660,655,653],[655,660,661],[661,656,655],[656,661,662],[662,657,656],[663,658,664],[658,663,665],[665,660,658],[660,665,666],[666,661,660],[661,666,667],[667,662,661],[668,669,670],[669,668,671],[671,672,669],[672,671,673],[673,674,672],[674,673,675],[675,676,674],[677,668,678],[668,677,679],[679,671,668],[671,679,680],[680,673,671],[673,680,681],[681,675,673],[682,677,683],[677,682,684],[684,679,677],[679,684,685],[685,680,679],[680,685,686],[686,681,680],[687,682,688],[682,687,689],[689,684,682],[684,689,690],[690,685,684],[685,690,691],[691,686,685],[692,693,694],[694,695,692],[695,694,696],[696,697,695],[697,696,698],[698,699,697],[699,698,700],[700,701,699],[693,702,703],[703,694,693],[694,703,704],[704,696,694],[696,704,705],[705,698,696],[698,705,706],[706,700,698],[702,707,708],[708,703,702],[703,708,709],[709,704,703],[704,709,710],[710,705,704],[705,710,711],[711,706,705],[707,712,713],[713,708,707],[708,713,714],[714,709,708],[709,714,715],[715,710,709],[710,715,716],[716,711,710],[717,718,719],[719,720,717],[720,719,721],[721,722,720],[722,721,723],[723,724,722],[724,723,725],[725,726,724],[718,727,728],[728,719,718],[719,728,729],[729,721,719],[721,729,730],[730,723,721],[723,730,731],[731,725,723],[727,732,733],[733,728,727],[728,733,734],[734,729,728],[729,734,735],[735,730,729],[730,735,736],[736,731,730],[732,737,738],[738,733,732],[733,738,739],[739,734,733],[734,739,740],[740,735,734],[735,740,741],[741,736,735],[742,743,744],[744,745,742],[745,744,746],[746,747,745],[747,746,748],[748,749,747],[749,748,750],[750,751,749],[743,752,753],[753,744,743],[744,753,754],[754,746,744],[746,754,755],[755,748,746],[748,755,756],[756,750,748],[752,757,758],[758,753,752],[753,758,759],[759,754,753],[754,759,760],[760,755,754],[755,760,761],[761,756,755],[757,762,763],[763,758,757],[758,763,764],[764,759,758],[759,764,765],[765,760,759],[760,765,766],[766,761,760],[767,768,769],[769,770,767],[770,769,771],[771,772,770],[772,771,773],[773,774,772],[774,773,775],[775,776,774],[768,777,778],[778,769,768],[769,778,779],[779,771,769],[771,779,780],[780,773,771],[773,780,781],[781,775,773],[777,782,783],[783,778,777],[778,783,784],[784,779,778],[779,784,785],[785,780,779],[780,785,786],[786,781,780],[782,787,788],[788,783,782],[783,788,789],[789,784,783],[784,789,790],[790,785,784],[785,790,791],[791,786,785]];

},{}],"index.ts":[function(require,module,exports) {
"use strict";

var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __read = this && this.__read || function (o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o),
      r,
      ar = [],
      e;

  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = {
      error: error
    };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }

  return ar;
};

var __spread = this && this.__spread || function () {
  for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));

  return ar;
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

var __importStar = this && this.__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
  result["default"] = mod;
  return result;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var regl_1 = __importDefault(require("regl"));

var hdom_1 = require("@thi.ng/hdom");

var canvas_1 = require("@thi.ng/hdom-components/canvas");

var checks_1 = require("@thi.ng/checks");

var regl_draw_1 = require("@tstackgl/regl-draw");

var draw_basic_mesh_1 = require("./draw-basic-mesh");

var regl_camera_1 = __importDefault(require("regl-camera")); // TODO: remove dependency


var primitive_quad_1 = __importDefault(require("primitive-quad"));

var geo_3d_box_1 = __importDefault(require("geo-3d-box"));

var primitive_icosphere_1 = __importDefault(require("primitive-icosphere"));

var primitive_sphere_1 = __importDefault(require("primitive-sphere"));

var primitive_capsule_1 = __importDefault(require("primitive-capsule"));

var primitive_torus_1 = __importDefault(require("primitive-torus"));

var bunny_1 = __importDefault(require("bunny"));

var teapot_1 = __importDefault(require("teapot"));

var tx = __importStar(require("@thi.ng/transducers"));

var loop = {
  cancel: function () {}
}; // TODO: add createCheckerTexture from https://github.com/glo-js/glo-demo-primitive/blob/master/index.js

function createReglScene() {
  // canvas init hook
  var init = function (canvas, __) {
    var width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerHeight;
    var height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
    canvas_1.adaptDPI(canvas, width, height);
    var regl = regl_1.default({
      canvas: canvas,
      extensions: ['OES_standard_derivatives']
    });
    var frameCatch = regl_draw_1.createFrameCatch(regl);
    var camera = regl_camera_1.default(regl, {
      distance: 65,
      phi: 0.4,
      theta: 1.2
    });
    var meshes = [primitive_quad_1.default(2), geo_3d_box_1.default({
      size: 4,
      segments: 2
    }), primitive_sphere_1.default(2, {
      segments: 5
    }), primitive_icosphere_1.default(2, {
      subdivisions: 1
    }), primitive_capsule_1.default(2, 2, 8), primitive_torus_1.default({
      majorRadius: 2,
      minorSegments: 8,
      majorSegments: 18
    }), bunny_1.default, teapot_1.default];
    var lightProps = {
      diffuseColor: [0.4, 0.4, 0.4],
      ambientColor: [0.1, 0.1, 0.1],
      lightDirection: [-1.0 / Math.sqrt(3), 1.0 / Math.sqrt(3), 1.0 / Math.sqrt(3)]
    };
    var numRow = 2;

    var indexes = __spread(tx.range(meshes.length));

    var xform = tx.comp(tx.map(function (_a) {
      var _b = __read(_a, 2),
          x = _b[0],
          i = _b[1];

      return __assign({
        translate: [15 - Math.floor(i / numRow) * 10, 0, i % numRow * 10],
        scale: i < meshes.length - 2 ? [1, 1, 1] : i < meshes.length - 1 ? [0.4, 0.4, 0.4] : [0.2, 0.2, 0.2]
      }, lightProps);
    }));
    var drawCommands = meshes.map(function (mesh) {
      return draw_basic_mesh_1.createBasicMesh(regl, mesh);
    });
    loop = frameCatch(function (_a) {
      camera(function (cameraState) {
        if (!cameraState.dirty) {
          return;
        }

        regl.clear({
          color: [0, 0, 0, 1]
        });

        var props = __spread(tx.iterator1(xform, tx.tuples(meshes, indexes)));

        drawCommands.forEach(function (draw, i) {
          draw(__assign({}, props[i]));
        });
      });
    });
  };

  var update = function () {};

  return {
    init: init,
    update: update
  };
}

var app = function () {
  console.log('app');

  if (!checks_1.hasWebGL()) {
    return ['p', 'Your browser does not support WebGL :- ('];
  }

  var canvas = canvas_1.canvasWebGL(createReglScene());
  return ['div.h-100.flex.flex-column', ['p.ma0.pa2.code', 'mesh primitives'], ['div.h-100', [canvas, 200, 0.025]]];
};

hdom_1.start(app());

if (module.hot) {
  ;
  module.hot.dispose(function () {
    loop.cancel();
  });
}
},{"regl":"../../../node_modules/regl/dist/regl.js","@thi.ng/hdom":"../../../node_modules/@thi.ng/hdom/index.js","@thi.ng/hdom-components/canvas":"../../../node_modules/@thi.ng/hdom-components/canvas.js","@thi.ng/checks":"../../../node_modules/@thi.ng/checks/index.js","@tstackgl/regl-draw":"../../../node_modules/@tstackgl/regl-draw/dist/index.js","./draw-basic-mesh":"draw-basic-mesh.ts","regl-camera":"../../../node_modules/regl-camera/regl-camera.js","primitive-quad":"../../../node_modules/primitive-quad/index.js","geo-3d-box":"../../../node_modules/geo-3d-box/box.js","primitive-icosphere":"../../../node_modules/primitive-icosphere/index.js","primitive-sphere":"../../../node_modules/primitive-sphere/primitive-sphere.js","primitive-capsule":"../../../node_modules/primitive-capsule/index.js","primitive-torus":"../../../node_modules/primitive-torus/index.js","bunny":"../../../node_modules/bunny/index.js","teapot":"../../../node_modules/teapot/teapot.js","@thi.ng/transducers":"../../../node_modules/@thi.ng/transducers/index.js"}],"../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "65413" + '/');

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();
      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.ts"], null)
//# sourceMappingURL=/src.77de5100.map