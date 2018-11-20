// $begin{copyright}
//
// This file is part of WebSharper
//
// Copyright (c) 2008-2016 IntelliFactory
//
// Licensed under the Apache License, Version 2.0 (the "License"); you
// may not use this file except in compliance with the License.  You may
// obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied.  See the License for the specific language governing
// permissions and limitations under the License.
//
// $end{copyright}

IntelliFactory = {
    Runtime: {
        Ctor: function (ctor, typeFunction) {
            ctor.prototype = typeFunction.prototype;
            return ctor;
        },

        Class: function (members, base, statics) {
            var proto = members;
            if (base) {
                proto = new base();
                for (var m in members) { proto[m] = members[m] }
            }
            var typeFunction = function (copyFrom) {
                if (copyFrom) {
                    for (var f in copyFrom) { this[f] = copyFrom[f] }
                }
            }
            typeFunction.prototype = proto;
            if (statics) {
                for (var f in statics) { typeFunction[f] = statics[f] }
            }
            return typeFunction;
        },

        Clone: function (obj) {
            var res = {};
            for (var p in obj) { res[p] = obj[p] }
            return res;
        },

        NewObject:
            function (kv) {
                var o = {};
                for (var i = 0; i < kv.length; i++) {
                    o[kv[i][0]] = kv[i][1];
                }
                return o;
            },

        DeleteEmptyFields:
            function (obj, fields) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (obj[f] === void (0)) { delete obj[f]; }
                }
                return obj;
            },

        GetOptional:
            function (value) {
                return (value === void (0)) ? null : { $: 1, $0: value };
            },

        SetOptional:
            function (obj, field, value) {
                if (value) {
                    obj[field] = value.$0;
                } else {
                    delete obj[field];
                }
            },

        SetOrDelete:
            function (obj, field, value) {
                if (value === void (0)) {
                    delete obj[field];
                } else {
                    obj[field] = value;
                }
            },

        Apply: function (f, obj, args) {
            return f.apply(obj, args);
        },

        Bind: function (f, obj) {
            return function () { return f.apply(this, arguments) };
        },

        CreateFuncWithArgs: function (f) {
            return function () { return f(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithOnlyThis: function (f) {
            return function () { return f(this) };
        },

        CreateFuncWithThis: function (f) {
            return function () { return f(this).apply(null, arguments) };
        },

        CreateFuncWithThisArgs: function (f) {
            return function () { return f(this)(Array.prototype.slice.call(arguments)) };
        },

        CreateFuncWithRest: function (length, f) {
            return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
        },

        CreateFuncWithArgsRest: function (length, f) {
            return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
        },

        BindDelegate: function (func, obj) {
            var res = func.bind(obj);
            res.$Func = func;
            res.$Target = obj;
            return res;
        },

        CreateDelegate: function (invokes) {
            if (invokes.length == 0) return null;
            if (invokes.length == 1) return invokes[0];
            var del = function () {
                var res;
                for (var i = 0; i < invokes.length; i++) {
                    res = invokes[i].apply(null, arguments);
                }
                return res;
            };
            del.$Invokes = invokes;
            return del;
        },

        CombineDelegates: function (dels) {
            var invokes = [];
            for (var i = 0; i < dels.length; i++) {
                var del = dels[i];
                if (del) {
                    if ("$Invokes" in del)
                        invokes = invokes.concat(del.$Invokes);
                    else
                        invokes.push(del);
                }
            }
            return IntelliFactory.Runtime.CreateDelegate(invokes);
        },

        DelegateEqual: function (d1, d2) {
            if (d1 === d2) return true;
            if (d1 == null || d2 == null) return false;
            var i1 = d1.$Invokes || [d1];
            var i2 = d2.$Invokes || [d2];
            if (i1.length != i2.length) return false;
            for (var i = 0; i < i1.length; i++) {
                var e1 = i1[i];
                var e2 = i2[i];
                if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
                    return false;
            }
            return true;
        },

        ThisFunc: function (d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args);
            };
        },

        ThisFuncOut: function (f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args);
            };
        },

        ParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
            };
        },

        ParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(null, args.slice(0, length).concat(args[length]));
            };
        },

        ThisParamsFunc: function (length, d) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(this);
                return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
            };
        },

        ThisParamsFuncOut: function (length, f) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
            };
        },

        Curried: function (f, n, args) {
            args = args || [];
            return function (a) {
                var allArgs = args.concat([a === void (0) ? null : a]);
                if (n == 1)
                    return f.apply(null, allArgs);
                if (n == 2)
                    return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
                return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
            }
        },

        Curried2: function (f) {
            return function (a) { return function (b) { return f(a, b); } }
        },

        Curried3: function (f) {
            return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
        },

        UnionByType: function (types, value, optional) {
            var vt = typeof value;
            for (var i = 0; i < types.length; i++) {
                var t = types[i];
                if (typeof t == "number") {
                    if (Array.isArray(value) && (t == 0 || value.length == t)) {
                        return { $: i, $0: value };
                    }
                } else {
                    if (t == vt) {
                        return { $: i, $0: value };
                    }
                }
            }
            if (!optional) {
                throw new Error("Type not expected for creating Choice value.");
            }
        },

        ScriptBasePath: "./",

        ScriptPath: function (a, f) {
            return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
        },

        OnLoad:
            function (f) {
                if (!("load" in this)) {
                    this.load = [];
                }
                this.load.push(f);
            },

        Start:
            function () {
                function run(c) {
                    for (var i = 0; i < c.length; i++) {
                        c[i]();
                    }
                }
                if ("load" in this) {
                    run(this.load);
                    this.load = [];
                }
            },
    }
}

IntelliFactory.Runtime.OnLoad(function () {
    if (self.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
        WebSharper.Activator.Activate()
});

// Polyfill

if (!Date.now) {
    Date.now = function () {
        return new Date().getTime();
    };
}

if (!Math.trunc) {
    Math.trunc = function (x) {
        return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
}

if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj, proto) {
    obj.__proto__ = proto;
    return obj;
  }
}

function ignore() { };
function id(x) { return x };
function fst(x) { return x[0] };
function snd(x) { return x[1] };
function trd(x) { return x[2] };

if (!console) {
    console = {
        count: ignore,
        dir: ignore,
        error: ignore,
        group: ignore,
        groupEnd: ignore,
        info: ignore,
        log: ignore,
        profile: ignore,
        profileEnd: ignore,
        time: ignore,
        timeEnd: ignore,
        trace: ignore,
        warn: ignore
    }
};
!function(t){var e={};function r(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=t,r.c=e,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:n})},r.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=36)}([function(t,e){var r;r=function(){return this}();try{r=r||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(r=window)}t.exports=r},function(t,e,r){var n=r(24),o=function(){return!this}();function i(t,e){this.name="AuthTokenExpiredError",this.message=t,this.expiry=e,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function s(t){this.name="AuthTokenInvalidError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function a(t,e){this.name="AuthTokenNotBeforeError",this.message=t,this.date=e,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function c(t){this.name="AuthTokenError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function u(t,e){this.name="SilentMiddlewareBlockedError",this.message=t,this.type=e,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function h(t){this.name="InvalidActionError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function p(t){this.name="InvalidArgumentsError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function f(t){this.name="InvalidOptionsError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function l(t){this.name="InvalidMessageError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function d(t,e){this.name="SocketProtocolError",this.message=t,this.code=e,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function y(t){this.name="ServerProtocolError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function g(t){this.name="HTTPServerError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function m(t){this.name="ResourceLimitError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function v(t){this.name="TimeoutError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function b(t,e){this.name="BadConnectionError",this.message=t,this.type=e,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function E(t){this.name="BrokerError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function S(t,e){this.name="ProcessExitError",this.message=t,this.code=e,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}function w(t){this.name="UnknownError",this.message=t,Error.captureStackTrace&&!o?Error.captureStackTrace(this,arguments.callee):this.stack=(new Error).stack}i.prototype=Object.create(Error.prototype),s.prototype=Object.create(Error.prototype),a.prototype=Object.create(Error.prototype),c.prototype=Object.create(Error.prototype),u.prototype=Object.create(Error.prototype),h.prototype=Object.create(Error.prototype),p.prototype=Object.create(Error.prototype),f.prototype=Object.create(Error.prototype),l.prototype=Object.create(Error.prototype),d.prototype=Object.create(Error.prototype),y.prototype=Object.create(Error.prototype),g.prototype=Object.create(Error.prototype),m.prototype=Object.create(Error.prototype),v.prototype=Object.create(Error.prototype),b.prototype=Object.create(Error.prototype),E.prototype=Object.create(Error.prototype),S.prototype=Object.create(Error.prototype),w.prototype=Object.create(Error.prototype),t.exports={AuthTokenExpiredError:i,AuthTokenInvalidError:s,AuthTokenNotBeforeError:a,AuthTokenError:c,SilentMiddlewareBlockedError:u,InvalidActionError:h,InvalidArgumentsError:p,InvalidOptionsError:f,InvalidMessageError:l,SocketProtocolError:d,ServerProtocolError:y,HTTPServerError:g,ResourceLimitError:m,TimeoutError:v,BadConnectionError:b,BrokerError:E,ProcessExitError:S,UnknownError:w},t.exports.socketProtocolErrorStatuses={1001:"Socket was disconnected",1002:"A WebSocket protocol error was encountered",1003:"Server terminated socket because it received invalid data",1005:"Socket closed without status code",1006:"Socket hung up",1007:"Message format was incorrect",1008:"Encountered a policy violation",1009:"Message was too big to process",1010:"Client ended the connection because the server did not comply with extension requirements",1011:"Server encountered an unexpected fatal condition",4000:"Server ping timed out",4001:"Client pong timed out",4002:"Server failed to sign auth token",4003:"Failed to complete handshake",4004:"Client failed to save auth token",4005:"Did not receive #handshake from client before timeout",4006:"Failed to bind socket to message broker",4007:"Client connection establishment timed out"},t.exports.socketProtocolIgnoreStatuses={1000:"Socket closed normally",1001:"Socket hung up"};var T={domain:1,domainEmitter:1,domainThrown:1};t.exports.dehydrateError=function(t,e){var r;if(t&&"object"==typeof t)for(var o in r={message:t.message},e&&(r.stack=t.stack),t)T[o]||(r[o]=t[o]);else r="function"==typeof t?"[function "+(t.name||"anonymous")+"]":t;return n(r)},t.exports.hydrateError=function(t){var e=null;if(null!=t)if("object"==typeof t)for(var r in e=new Error(t.message),t)t.hasOwnProperty(r)&&(e[r]=t[r]);else e=t;return e},t.exports.decycle=n},function(t,e,r){var n=r(27);Object.create||(Object.create=r(26));var o=function(){n.call(this)};(o.prototype=Object.create(n.prototype)).emit=function(t){if("error"==t){var e=["__domainError"];if(void 0!==arguments[1]&&e.push(arguments[1]),n.prototype.emit.apply(this,e),this.domain){var r=arguments[1];r||(r=new Error('Uncaught, unspecified "error" event.')),r.domainEmitter=this,r.domain=this.domain,r.domainThrown=!1,this.domain.emit("error",r)}}n.prototype.emit.apply(this,arguments)},t.exports.SCEmitter=o},function(t,e,r){"use strict";t.exports=r(35)},function(t,e,r){"use strict";e.decode=e.parse=r(20),e.encode=e.stringify=r(19)},function(t,e,r){var n=r(1),o=n.InvalidActionError,i=function(t,e){this.socket=t,this.id=e,this.sent=!1};i.prototype._respond=function(t){if(this.sent)throw new o("Response "+this.id+" has already been sent");this.sent=!0,this.socket.send(this.socket.encode(t))},i.prototype.end=function(t){if(this.id){var e={rid:this.id};void 0!==t&&(e.data=t),this._respond(e)}},i.prototype.error=function(t,e){if(this.id){var r=n.dehydrateError(t),o={rid:this.id,error:r};void 0!==e&&(o.data=e),this._respond(o)}},i.prototype.callback=function(t,e){t?this.error(t,e):this.end(e)},t.exports.Response=i},function(t,e,r){"use strict";(function(t){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
var n=r(30),o=r(29),i=r(28);function s(){return c.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function a(t,e){if(s()<e)throw new RangeError("Invalid typed array length");return c.TYPED_ARRAY_SUPPORT?(t=new Uint8Array(e)).__proto__=c.prototype:(null===t&&(t=new c(e)),t.length=e),t}function c(t,e,r){if(!(c.TYPED_ARRAY_SUPPORT||this instanceof c))return new c(t,e,r);if("number"==typeof t){if("string"==typeof e)throw new Error("If encoding is specified then the first argument must be a string");return p(this,t)}return u(this,t,e,r)}function u(t,e,r,n){if("number"==typeof e)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&e instanceof ArrayBuffer?function(t,e,r,n){if(e.byteLength,r<0||e.byteLength<r)throw new RangeError("'offset' is out of bounds");if(e.byteLength<r+(n||0))throw new RangeError("'length' is out of bounds");e=void 0===r&&void 0===n?new Uint8Array(e):void 0===n?new Uint8Array(e,r):new Uint8Array(e,r,n);c.TYPED_ARRAY_SUPPORT?(t=e).__proto__=c.prototype:t=f(t,e);return t}(t,e,r,n):"string"==typeof e?function(t,e,r){"string"==typeof r&&""!==r||(r="utf8");if(!c.isEncoding(r))throw new TypeError('"encoding" must be a valid string encoding');var n=0|d(e,r),o=(t=a(t,n)).write(e,r);o!==n&&(t=t.slice(0,o));return t}(t,e,r):function(t,e){if(c.isBuffer(e)){var r=0|l(e.length);return 0===(t=a(t,r)).length?t:(e.copy(t,0,0,r),t)}if(e){if("undefined"!=typeof ArrayBuffer&&e.buffer instanceof ArrayBuffer||"length"in e)return"number"!=typeof e.length||(n=e.length)!=n?a(t,0):f(t,e);if("Buffer"===e.type&&i(e.data))return f(t,e.data)}var n;throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}(t,e)}function h(t){if("number"!=typeof t)throw new TypeError('"size" argument must be a number');if(t<0)throw new RangeError('"size" argument must not be negative')}function p(t,e){if(h(e),t=a(t,e<0?0:0|l(e)),!c.TYPED_ARRAY_SUPPORT)for(var r=0;r<e;++r)t[r]=0;return t}function f(t,e){var r=e.length<0?0:0|l(e.length);t=a(t,r);for(var n=0;n<r;n+=1)t[n]=255&e[n];return t}function l(t){if(t>=s())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+s().toString(16)+" bytes");return 0|t}function d(t,e){if(c.isBuffer(t))return t.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(t)||t instanceof ArrayBuffer))return t.byteLength;"string"!=typeof t&&(t=""+t);var r=t.length;if(0===r)return 0;for(var n=!1;;)switch(e){case"ascii":case"latin1":case"binary":return r;case"utf8":case"utf-8":case void 0:return Y(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*r;case"hex":return r>>>1;case"base64":return F(t).length;default:if(n)return Y(t).length;e=(""+e).toLowerCase(),n=!0}}function y(t,e,r){var n=t[e];t[e]=t[r],t[r]=n}function g(t,e,r,n,o){if(0===t.length)return-1;if("string"==typeof r?(n=r,r=0):r>2147483647?r=2147483647:r<-2147483648&&(r=-2147483648),r=+r,isNaN(r)&&(r=o?0:t.length-1),r<0&&(r=t.length+r),r>=t.length){if(o)return-1;r=t.length-1}else if(r<0){if(!o)return-1;r=0}if("string"==typeof e&&(e=c.from(e,n)),c.isBuffer(e))return 0===e.length?-1:m(t,e,r,n,o);if("number"==typeof e)return e&=255,c.TYPED_ARRAY_SUPPORT&&"function"==typeof Uint8Array.prototype.indexOf?o?Uint8Array.prototype.indexOf.call(t,e,r):Uint8Array.prototype.lastIndexOf.call(t,e,r):m(t,[e],r,n,o);throw new TypeError("val must be string, number or Buffer")}function m(t,e,r,n,o){var i,s=1,a=t.length,c=e.length;if(void 0!==n&&("ucs2"===(n=String(n).toLowerCase())||"ucs-2"===n||"utf16le"===n||"utf-16le"===n)){if(t.length<2||e.length<2)return-1;s=2,a/=2,c/=2,r/=2}function u(t,e){return 1===s?t[e]:t.readUInt16BE(e*s)}if(o){var h=-1;for(i=r;i<a;i++)if(u(t,i)===u(e,-1===h?0:i-h)){if(-1===h&&(h=i),i-h+1===c)return h*s}else-1!==h&&(i-=i-h),h=-1}else for(r+c>a&&(r=a-c),i=r;i>=0;i--){for(var p=!0,f=0;f<c;f++)if(u(t,i+f)!==u(e,f)){p=!1;break}if(p)return i}return-1}function v(t,e,r,n){r=Number(r)||0;var o=t.length-r;n?(n=Number(n))>o&&(n=o):n=o;var i=e.length;if(i%2!=0)throw new TypeError("Invalid hex string");n>i/2&&(n=i/2);for(var s=0;s<n;++s){var a=parseInt(e.substr(2*s,2),16);if(isNaN(a))return s;t[r+s]=a}return s}function b(t,e,r,n){return $(Y(e,t.length-r),t,r,n)}function E(t,e,r,n){return $(function(t){for(var e=[],r=0;r<t.length;++r)e.push(255&t.charCodeAt(r));return e}(e),t,r,n)}function S(t,e,r,n){return E(t,e,r,n)}function w(t,e,r,n){return $(F(e),t,r,n)}function T(t,e,r,n){return $(function(t,e){for(var r,n,o,i=[],s=0;s<t.length&&!((e-=2)<0);++s)r=t.charCodeAt(s),n=r>>8,o=r%256,i.push(o),i.push(n);return i}(e,t.length-r),t,r,n)}function _(t,e,r){return 0===e&&r===t.length?n.fromByteArray(t):n.fromByteArray(t.slice(e,r))}function k(t,e,r){r=Math.min(t.length,r);for(var n=[],o=e;o<r;){var i,s,a,c,u=t[o],h=null,p=u>239?4:u>223?3:u>191?2:1;if(o+p<=r)switch(p){case 1:u<128&&(h=u);break;case 2:128==(192&(i=t[o+1]))&&(c=(31&u)<<6|63&i)>127&&(h=c);break;case 3:i=t[o+1],s=t[o+2],128==(192&i)&&128==(192&s)&&(c=(15&u)<<12|(63&i)<<6|63&s)>2047&&(c<55296||c>57343)&&(h=c);break;case 4:i=t[o+1],s=t[o+2],a=t[o+3],128==(192&i)&&128==(192&s)&&128==(192&a)&&(c=(15&u)<<18|(63&i)<<12|(63&s)<<6|63&a)>65535&&c<1114112&&(h=c)}null===h?(h=65533,p=1):h>65535&&(h-=65536,n.push(h>>>10&1023|55296),h=56320|1023&h),n.push(h),o+=p}return function(t){var e=t.length;if(e<=A)return String.fromCharCode.apply(String,t);var r="",n=0;for(;n<e;)r+=String.fromCharCode.apply(String,t.slice(n,n+=A));return r}(n)}e.Buffer=c,e.SlowBuffer=function(t){+t!=t&&(t=0);return c.alloc(+t)},e.INSPECT_MAX_BYTES=50,c.TYPED_ARRAY_SUPPORT=void 0!==t.TYPED_ARRAY_SUPPORT?t.TYPED_ARRAY_SUPPORT:function(){try{var t=new Uint8Array(1);return t.__proto__={__proto__:Uint8Array.prototype,foo:function(){return 42}},42===t.foo()&&"function"==typeof t.subarray&&0===t.subarray(1,1).byteLength}catch(t){return!1}}(),e.kMaxLength=s(),c.poolSize=8192,c._augment=function(t){return t.__proto__=c.prototype,t},c.from=function(t,e,r){return u(null,t,e,r)},c.TYPED_ARRAY_SUPPORT&&(c.prototype.__proto__=Uint8Array.prototype,c.__proto__=Uint8Array,"undefined"!=typeof Symbol&&Symbol.species&&c[Symbol.species]===c&&Object.defineProperty(c,Symbol.species,{value:null,configurable:!0})),c.alloc=function(t,e,r){return function(t,e,r,n){return h(e),e<=0?a(t,e):void 0!==r?"string"==typeof n?a(t,e).fill(r,n):a(t,e).fill(r):a(t,e)}(null,t,e,r)},c.allocUnsafe=function(t){return p(null,t)},c.allocUnsafeSlow=function(t){return p(null,t)},c.isBuffer=function(t){return!(null==t||!t._isBuffer)},c.compare=function(t,e){if(!c.isBuffer(t)||!c.isBuffer(e))throw new TypeError("Arguments must be Buffers");if(t===e)return 0;for(var r=t.length,n=e.length,o=0,i=Math.min(r,n);o<i;++o)if(t[o]!==e[o]){r=t[o],n=e[o];break}return r<n?-1:n<r?1:0},c.isEncoding=function(t){switch(String(t).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},c.concat=function(t,e){if(!i(t))throw new TypeError('"list" argument must be an Array of Buffers');if(0===t.length)return c.alloc(0);var r;if(void 0===e)for(e=0,r=0;r<t.length;++r)e+=t[r].length;var n=c.allocUnsafe(e),o=0;for(r=0;r<t.length;++r){var s=t[r];if(!c.isBuffer(s))throw new TypeError('"list" argument must be an Array of Buffers');s.copy(n,o),o+=s.length}return n},c.byteLength=d,c.prototype._isBuffer=!0,c.prototype.swap16=function(){var t=this.length;if(t%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var e=0;e<t;e+=2)y(this,e,e+1);return this},c.prototype.swap32=function(){var t=this.length;if(t%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var e=0;e<t;e+=4)y(this,e,e+3),y(this,e+1,e+2);return this},c.prototype.swap64=function(){var t=this.length;if(t%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var e=0;e<t;e+=8)y(this,e,e+7),y(this,e+1,e+6),y(this,e+2,e+5),y(this,e+3,e+4);return this},c.prototype.toString=function(){var t=0|this.length;return 0===t?"":0===arguments.length?k(this,0,t):function(t,e,r){var n=!1;if((void 0===e||e<0)&&(e=0),e>this.length)return"";if((void 0===r||r>this.length)&&(r=this.length),r<=0)return"";if((r>>>=0)<=(e>>>=0))return"";for(t||(t="utf8");;)switch(t){case"hex":return R(this,e,r);case"utf8":case"utf-8":return k(this,e,r);case"ascii":return C(this,e,r);case"latin1":case"binary":return O(this,e,r);case"base64":return _(this,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return P(this,e,r);default:if(n)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),n=!0}}.apply(this,arguments)},c.prototype.equals=function(t){if(!c.isBuffer(t))throw new TypeError("Argument must be a Buffer");return this===t||0===c.compare(this,t)},c.prototype.inspect=function(){var t="",r=e.INSPECT_MAX_BYTES;return this.length>0&&(t=this.toString("hex",0,r).match(/.{2}/g).join(" "),this.length>r&&(t+=" ... ")),"<Buffer "+t+">"},c.prototype.compare=function(t,e,r,n,o){if(!c.isBuffer(t))throw new TypeError("Argument must be a Buffer");if(void 0===e&&(e=0),void 0===r&&(r=t?t.length:0),void 0===n&&(n=0),void 0===o&&(o=this.length),e<0||r>t.length||n<0||o>this.length)throw new RangeError("out of range index");if(n>=o&&e>=r)return 0;if(n>=o)return-1;if(e>=r)return 1;if(e>>>=0,r>>>=0,n>>>=0,o>>>=0,this===t)return 0;for(var i=o-n,s=r-e,a=Math.min(i,s),u=this.slice(n,o),h=t.slice(e,r),p=0;p<a;++p)if(u[p]!==h[p]){i=u[p],s=h[p];break}return i<s?-1:s<i?1:0},c.prototype.includes=function(t,e,r){return-1!==this.indexOf(t,e,r)},c.prototype.indexOf=function(t,e,r){return g(this,t,e,r,!0)},c.prototype.lastIndexOf=function(t,e,r){return g(this,t,e,r,!1)},c.prototype.write=function(t,e,r,n){if(void 0===e)n="utf8",r=this.length,e=0;else if(void 0===r&&"string"==typeof e)n=e,r=this.length,e=0;else{if(!isFinite(e))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");e|=0,isFinite(r)?(r|=0,void 0===n&&(n="utf8")):(n=r,r=void 0)}var o=this.length-e;if((void 0===r||r>o)&&(r=o),t.length>0&&(r<0||e<0)||e>this.length)throw new RangeError("Attempt to write outside buffer bounds");n||(n="utf8");for(var i=!1;;)switch(n){case"hex":return v(this,t,e,r);case"utf8":case"utf-8":return b(this,t,e,r);case"ascii":return E(this,t,e,r);case"latin1":case"binary":return S(this,t,e,r);case"base64":return w(this,t,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return T(this,t,e,r);default:if(i)throw new TypeError("Unknown encoding: "+n);n=(""+n).toLowerCase(),i=!0}},c.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var A=4096;function C(t,e,r){var n="";r=Math.min(t.length,r);for(var o=e;o<r;++o)n+=String.fromCharCode(127&t[o]);return n}function O(t,e,r){var n="";r=Math.min(t.length,r);for(var o=e;o<r;++o)n+=String.fromCharCode(t[o]);return n}function R(t,e,r){var n=t.length;(!e||e<0)&&(e=0),(!r||r<0||r>n)&&(r=n);for(var o="",i=e;i<r;++i)o+=L(t[i]);return o}function P(t,e,r){for(var n=t.slice(e,r),o="",i=0;i<n.length;i+=2)o+=String.fromCharCode(n[i]+256*n[i+1]);return o}function N(t,e,r){if(t%1!=0||t<0)throw new RangeError("offset is not uint");if(t+e>r)throw new RangeError("Trying to access beyond buffer length")}function I(t,e,r,n,o,i){if(!c.isBuffer(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(e>o||e<i)throw new RangeError('"value" argument is out of bounds');if(r+n>t.length)throw new RangeError("Index out of range")}function x(t,e,r,n){e<0&&(e=65535+e+1);for(var o=0,i=Math.min(t.length-r,2);o<i;++o)t[r+o]=(e&255<<8*(n?o:1-o))>>>8*(n?o:1-o)}function B(t,e,r,n){e<0&&(e=4294967295+e+1);for(var o=0,i=Math.min(t.length-r,4);o<i;++o)t[r+o]=e>>>8*(n?o:3-o)&255}function j(t,e,r,n,o,i){if(r+n>t.length)throw new RangeError("Index out of range");if(r<0)throw new RangeError("Index out of range")}function U(t,e,r,n,i){return i||j(t,0,r,4),o.write(t,e,r,n,23,4),r+4}function D(t,e,r,n,i){return i||j(t,0,r,8),o.write(t,e,r,n,52,8),r+8}c.prototype.slice=function(t,e){var r,n=this.length;if(t=~~t,e=void 0===e?n:~~e,t<0?(t+=n)<0&&(t=0):t>n&&(t=n),e<0?(e+=n)<0&&(e=0):e>n&&(e=n),e<t&&(e=t),c.TYPED_ARRAY_SUPPORT)(r=this.subarray(t,e)).__proto__=c.prototype;else{var o=e-t;r=new c(o,void 0);for(var i=0;i<o;++i)r[i]=this[i+t]}return r},c.prototype.readUIntLE=function(t,e,r){t|=0,e|=0,r||N(t,e,this.length);for(var n=this[t],o=1,i=0;++i<e&&(o*=256);)n+=this[t+i]*o;return n},c.prototype.readUIntBE=function(t,e,r){t|=0,e|=0,r||N(t,e,this.length);for(var n=this[t+--e],o=1;e>0&&(o*=256);)n+=this[t+--e]*o;return n},c.prototype.readUInt8=function(t,e){return e||N(t,1,this.length),this[t]},c.prototype.readUInt16LE=function(t,e){return e||N(t,2,this.length),this[t]|this[t+1]<<8},c.prototype.readUInt16BE=function(t,e){return e||N(t,2,this.length),this[t]<<8|this[t+1]},c.prototype.readUInt32LE=function(t,e){return e||N(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3]},c.prototype.readUInt32BE=function(t,e){return e||N(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3])},c.prototype.readIntLE=function(t,e,r){t|=0,e|=0,r||N(t,e,this.length);for(var n=this[t],o=1,i=0;++i<e&&(o*=256);)n+=this[t+i]*o;return n>=(o*=128)&&(n-=Math.pow(2,8*e)),n},c.prototype.readIntBE=function(t,e,r){t|=0,e|=0,r||N(t,e,this.length);for(var n=e,o=1,i=this[t+--n];n>0&&(o*=256);)i+=this[t+--n]*o;return i>=(o*=128)&&(i-=Math.pow(2,8*e)),i},c.prototype.readInt8=function(t,e){return e||N(t,1,this.length),128&this[t]?-1*(255-this[t]+1):this[t]},c.prototype.readInt16LE=function(t,e){e||N(t,2,this.length);var r=this[t]|this[t+1]<<8;return 32768&r?4294901760|r:r},c.prototype.readInt16BE=function(t,e){e||N(t,2,this.length);var r=this[t+1]|this[t]<<8;return 32768&r?4294901760|r:r},c.prototype.readInt32LE=function(t,e){return e||N(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24},c.prototype.readInt32BE=function(t,e){return e||N(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3]},c.prototype.readFloatLE=function(t,e){return e||N(t,4,this.length),o.read(this,t,!0,23,4)},c.prototype.readFloatBE=function(t,e){return e||N(t,4,this.length),o.read(this,t,!1,23,4)},c.prototype.readDoubleLE=function(t,e){return e||N(t,8,this.length),o.read(this,t,!0,52,8)},c.prototype.readDoubleBE=function(t,e){return e||N(t,8,this.length),o.read(this,t,!1,52,8)},c.prototype.writeUIntLE=function(t,e,r,n){(t=+t,e|=0,r|=0,n)||I(this,t,e,r,Math.pow(2,8*r)-1,0);var o=1,i=0;for(this[e]=255&t;++i<r&&(o*=256);)this[e+i]=t/o&255;return e+r},c.prototype.writeUIntBE=function(t,e,r,n){(t=+t,e|=0,r|=0,n)||I(this,t,e,r,Math.pow(2,8*r)-1,0);var o=r-1,i=1;for(this[e+o]=255&t;--o>=0&&(i*=256);)this[e+o]=t/i&255;return e+r},c.prototype.writeUInt8=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,1,255,0),c.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),this[e]=255&t,e+1},c.prototype.writeUInt16LE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,2,65535,0),c.TYPED_ARRAY_SUPPORT?(this[e]=255&t,this[e+1]=t>>>8):x(this,t,e,!0),e+2},c.prototype.writeUInt16BE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,2,65535,0),c.TYPED_ARRAY_SUPPORT?(this[e]=t>>>8,this[e+1]=255&t):x(this,t,e,!1),e+2},c.prototype.writeUInt32LE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,4,4294967295,0),c.TYPED_ARRAY_SUPPORT?(this[e+3]=t>>>24,this[e+2]=t>>>16,this[e+1]=t>>>8,this[e]=255&t):B(this,t,e,!0),e+4},c.prototype.writeUInt32BE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,4,4294967295,0),c.TYPED_ARRAY_SUPPORT?(this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t):B(this,t,e,!1),e+4},c.prototype.writeIntLE=function(t,e,r,n){if(t=+t,e|=0,!n){var o=Math.pow(2,8*r-1);I(this,t,e,r,o-1,-o)}var i=0,s=1,a=0;for(this[e]=255&t;++i<r&&(s*=256);)t<0&&0===a&&0!==this[e+i-1]&&(a=1),this[e+i]=(t/s>>0)-a&255;return e+r},c.prototype.writeIntBE=function(t,e,r,n){if(t=+t,e|=0,!n){var o=Math.pow(2,8*r-1);I(this,t,e,r,o-1,-o)}var i=r-1,s=1,a=0;for(this[e+i]=255&t;--i>=0&&(s*=256);)t<0&&0===a&&0!==this[e+i+1]&&(a=1),this[e+i]=(t/s>>0)-a&255;return e+r},c.prototype.writeInt8=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,1,127,-128),c.TYPED_ARRAY_SUPPORT||(t=Math.floor(t)),t<0&&(t=255+t+1),this[e]=255&t,e+1},c.prototype.writeInt16LE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,2,32767,-32768),c.TYPED_ARRAY_SUPPORT?(this[e]=255&t,this[e+1]=t>>>8):x(this,t,e,!0),e+2},c.prototype.writeInt16BE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,2,32767,-32768),c.TYPED_ARRAY_SUPPORT?(this[e]=t>>>8,this[e+1]=255&t):x(this,t,e,!1),e+2},c.prototype.writeInt32LE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,4,2147483647,-2147483648),c.TYPED_ARRAY_SUPPORT?(this[e]=255&t,this[e+1]=t>>>8,this[e+2]=t>>>16,this[e+3]=t>>>24):B(this,t,e,!0),e+4},c.prototype.writeInt32BE=function(t,e,r){return t=+t,e|=0,r||I(this,t,e,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),c.TYPED_ARRAY_SUPPORT?(this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t):B(this,t,e,!1),e+4},c.prototype.writeFloatLE=function(t,e,r){return U(this,t,e,!0,r)},c.prototype.writeFloatBE=function(t,e,r){return U(this,t,e,!1,r)},c.prototype.writeDoubleLE=function(t,e,r){return D(this,t,e,!0,r)},c.prototype.writeDoubleBE=function(t,e,r){return D(this,t,e,!1,r)},c.prototype.copy=function(t,e,r,n){if(r||(r=0),n||0===n||(n=this.length),e>=t.length&&(e=t.length),e||(e=0),n>0&&n<r&&(n=r),n===r)return 0;if(0===t.length||0===this.length)return 0;if(e<0)throw new RangeError("targetStart out of bounds");if(r<0||r>=this.length)throw new RangeError("sourceStart out of bounds");if(n<0)throw new RangeError("sourceEnd out of bounds");n>this.length&&(n=this.length),t.length-e<n-r&&(n=t.length-e+r);var o,i=n-r;if(this===t&&r<e&&e<n)for(o=i-1;o>=0;--o)t[o+e]=this[o+r];else if(i<1e3||!c.TYPED_ARRAY_SUPPORT)for(o=0;o<i;++o)t[o+e]=this[o+r];else Uint8Array.prototype.set.call(t,this.subarray(r,r+i),e);return i},c.prototype.fill=function(t,e,r,n){if("string"==typeof t){if("string"==typeof e?(n=e,e=0,r=this.length):"string"==typeof r&&(n=r,r=this.length),1===t.length){var o=t.charCodeAt(0);o<256&&(t=o)}if(void 0!==n&&"string"!=typeof n)throw new TypeError("encoding must be a string");if("string"==typeof n&&!c.isEncoding(n))throw new TypeError("Unknown encoding: "+n)}else"number"==typeof t&&(t&=255);if(e<0||this.length<e||this.length<r)throw new RangeError("Out of range index");if(r<=e)return this;var i;if(e>>>=0,r=void 0===r?this.length:r>>>0,t||(t=0),"number"==typeof t)for(i=e;i<r;++i)this[i]=t;else{var s=c.isBuffer(t)?t:Y(new c(t,n).toString()),a=s.length;for(i=0;i<r-e;++i)this[i+e]=s[i%a]}return this};var M=/[^+\/0-9A-Za-z-_]/g;function L(t){return t<16?"0"+t.toString(16):t.toString(16)}function Y(t,e){var r;e=e||1/0;for(var n=t.length,o=null,i=[],s=0;s<n;++s){if((r=t.charCodeAt(s))>55295&&r<57344){if(!o){if(r>56319){(e-=3)>-1&&i.push(239,191,189);continue}if(s+1===n){(e-=3)>-1&&i.push(239,191,189);continue}o=r;continue}if(r<56320){(e-=3)>-1&&i.push(239,191,189),o=r;continue}r=65536+(o-55296<<10|r-56320)}else o&&(e-=3)>-1&&i.push(239,191,189);if(o=null,r<128){if((e-=1)<0)break;i.push(r)}else if(r<2048){if((e-=2)<0)break;i.push(r>>6|192,63&r|128)}else if(r<65536){if((e-=3)<0)break;i.push(r>>12|224,r>>6&63|128,63&r|128)}else{if(!(r<1114112))throw new Error("Invalid code point");if((e-=4)<0)break;i.push(r>>18|240,r>>12&63|128,r>>6&63|128,63&r|128)}}return i}function F(t){return n.toByteArray(function(t){if((t=function(t){return t.trim?t.trim():t.replace(/^\s+|\s+$/g,"")}(t).replace(M,"")).length<2)return"";for(;t.length%4!=0;)t+="=";return t}(t))}function $(t,e,r,n){for(var o=0;o<n&&!(o+r>=e.length||o>=t.length);++o)e[o+r]=t[o];return o}}).call(this,r(0))},function(t,e,r){(function(e,n){var o=r(2).SCEmitter,i=r(25).SCChannel,s=(r(5).Response,r(23).AuthEngine),a=r(22),c=r(21).SCTransport,u=r(4),h=r(17),p=r(15),f=r(13),l=r(1),d=l.InvalidArgumentsError,y=l.InvalidMessageError,g=l.SocketProtocolError,m=l.TimeoutError,v="undefined"!=typeof window,b=function(t){var r=this;o.call(this),this.id=null,this.state=this.CLOSED,this.authState=this.PENDING,this.signedAuthToken=null,this.authToken=null,this.pendingReconnect=!1,this.pendingReconnectTimeout=null,this.pendingConnectCallback=!1,this.connectTimeout=t.connectTimeout,this.ackTimeout=t.ackTimeout,this.channelPrefix=t.channelPrefix||null,this.disconnectOnUnload=null==t.disconnectOnUnload||t.disconnectOnUnload,this.pingTimeout=this.ackTimeout;var n=Math.pow(2,31)-1,i=function(t){if(r[t]>n)throw new d("The "+t+" value provided exceeded the maximum amount allowed")};if(i("connectTimeout"),i("ackTimeout"),i("pingTimeout"),this._localEvents={connect:1,connectAbort:1,disconnect:1,message:1,error:1,raw:1,fail:1,kickOut:1,subscribe:1,unsubscribe:1,subscribeStateChange:1,authStateChange:1,authenticate:1,deauthenticate:1,removeAuthToken:1,subscribeRequest:1},this.connectAttempts=0,this._emitBuffer=new h,this._channels={},this.options=t,this._cid=1,this.options.callIdGenerator=function(){return r._callIdGenerator()},this.options.autoReconnect){null==this.options.autoReconnectOptions&&(this.options.autoReconnectOptions={});var c=this.options.autoReconnectOptions;null==c.initialDelay&&(c.initialDelay=1e4),null==c.randomness&&(c.randomness=1e4),null==c.multiplier&&(c.multiplier=1.5),null==c.maxDelay&&(c.maxDelay=6e4)}if(null==this.options.subscriptionRetryOptions&&(this.options.subscriptionRetryOptions={}),this.options.authEngine?this.auth=this.options.authEngine:this.auth=new s,this.options.codecEngine?this.codec=this.options.codecEngine:this.codec=a,this.options.path=this.options.path.replace(/\/$/,"")+"/",this.options.query=t.query||{},"string"==typeof this.options.query&&(this.options.query=u.parse(this.options.query)),this.options.autoConnect&&this.connect(),this._channelEmitter=new o,v&&this.disconnectOnUnload){var p=function(){r.disconnect()};e.attachEvent?e.attachEvent("onunload",p):e.addEventListener&&e.addEventListener("beforeunload",p,!1)}};b.prototype=Object.create(o.prototype),b.CONNECTING=b.prototype.CONNECTING=c.prototype.CONNECTING,b.OPEN=b.prototype.OPEN=c.prototype.OPEN,b.CLOSED=b.prototype.CLOSED=c.prototype.CLOSED,b.AUTHENTICATED=b.prototype.AUTHENTICATED="authenticated",b.UNAUTHENTICATED=b.prototype.UNAUTHENTICATED="unauthenticated",b.PENDING=b.prototype.PENDING="pending",b.ignoreStatuses=l.socketProtocolIgnoreStatuses,b.errorStatuses=l.socketProtocolErrorStatuses,b.prototype._privateEventHandlerMap={"#publish":function(t){var e=this._undecorateChannelName(t.channel);this.isSubscribed(e,!0)&&this._channelEmitter.emit(e,t.data)},"#kickOut":function(t){var e=this._undecorateChannelName(t.channel),r=this._channels[e];r&&(o.prototype.emit.call(this,"kickOut",t.message,e),r.emit("kickOut",t.message,e),this._triggerChannelUnsubscribe(r))},"#setAuthToken":function(t,e){var r=this;if(t){this.auth.saveToken(this.options.authTokenName,t.token,{},function(n){n?(e.error(n),r._onSCError(n)):(r._changeToAuthenticatedState(t.token),e.end())})}else e.error(new y("No token data provided by #setAuthToken event"))},"#removeAuthToken":function(t,e){var r=this;this.auth.removeToken(this.options.authTokenName,function(t,n){t?(e.error(t),r._onSCError(t)):(o.prototype.emit.call(r,"removeAuthToken",n),r._changeToUnauthenticatedState(),e.end())})},"#disconnect":function(t){this.transport.close(t.code,t.data)}},b.prototype._callIdGenerator=function(){return this._cid++},b.prototype.getState=function(){return this.state},b.prototype.getBytesReceived=function(){return this.transport.getBytesReceived()},b.prototype.deauthenticate=function(t){var e=this;this.auth.removeToken(this.options.authTokenName,function(r,n){r?e._onSCError(r):(e.emit("#removeAuthToken"),o.prototype.emit.call(e,"removeAuthToken",n),e._changeToUnauthenticatedState()),t&&t(r)})},b.prototype.connect=b.prototype.open=function(){var t=this;this.state==this.CLOSED&&(this.pendingReconnect=!1,this.pendingReconnectTimeout=null,clearTimeout(this._reconnectTimeoutRef),this.state=this.CONNECTING,o.prototype.emit.call(this,"connecting"),this._changeToPendingAuthState(),this.transport&&this.transport.off(),this.transport=new c(this.auth,this.codec,this.options),this.transport.on("open",function(e){t.state=t.OPEN,t._onSCOpen(e)}),this.transport.on("error",function(e){t._onSCError(e)}),this.transport.on("close",function(e,r){t.state=t.CLOSED,t._onSCClose(e,r)}),this.transport.on("openAbort",function(e,r){t.state=t.CLOSED,t._onSCClose(e,r,!0)}),this.transport.on("event",function(e,r,n){t._onSCEvent(e,r,n)}))},b.prototype.reconnect=function(){this.disconnect(),this.connect()},b.prototype.disconnect=function(t,e){if("number"!=typeof(t=t||1e3))throw new d("If specified, the code argument must be a number");this.state==this.OPEN||this.state==this.CONNECTING?this.transport.close(t,e):(this.pendingReconnect=!1,this.pendingReconnectTimeout=null,clearTimeout(this._reconnectTimeoutRef))},b.prototype._changeToPendingAuthState=function(){if(this.authState!=this.PENDING){var t=this.authState;this.authState=this.PENDING;var e={oldState:t,newState:this.authState};o.prototype.emit.call(this,"authStateChange",e)}},b.prototype._changeToUnauthenticatedState=function(){if(this.authState!=this.UNAUTHENTICATED){var t=this.authState;this.authState=this.UNAUTHENTICATED,this.signedAuthToken=null,this.authToken=null;var e={oldState:t,newState:this.authState};o.prototype.emit.call(this,"authStateChange",e),t==this.AUTHENTICATED&&o.prototype.emit.call(this,"deauthenticate"),o.prototype.emit.call(this,"authTokenChange",this.signedAuthToken)}},b.prototype._changeToAuthenticatedState=function(t){if(this.signedAuthToken=t,this.authToken=this._extractAuthTokenData(t),this.authState!=this.AUTHENTICATED){var e=this.authState;this.authState=this.AUTHENTICATED;var r={oldState:e,newState:this.authState,signedAuthToken:t,authToken:this.authToken};this.processPendingSubscriptions(),o.prototype.emit.call(this,"authStateChange",r),o.prototype.emit.call(this,"authenticate",t)}o.prototype.emit.call(this,"authTokenChange",t)},b.prototype.decodeBase64=function(t){var r;void 0===n?r=e.atob?e.atob(t):p.decode(t):r=new n(t,"base64").toString("utf8");return r},b.prototype.encodeBase64=function(t){var r;void 0===n?r=e.btoa?e.btoa(t):p.encode(t):r=new n(t,"utf8").toString("base64");return r},b.prototype._extractAuthTokenData=function(t){var e=(t||"").split(".")[1];if(null!=e){var r=e;try{return r=this.decodeBase64(r),JSON.parse(r)}catch(t){return r}}return null},b.prototype.getAuthToken=function(){return this.authToken},b.prototype.getSignedAuthToken=function(){return this.signedAuthToken},b.prototype.authenticate=function(t,e){var r=this;this._changeToPendingAuthState(),this.emit("#authenticate",t,function(n,o){o&&o.authError&&(o.authError=l.hydrateError(o.authError)),n?(r._changeToUnauthenticatedState(),e&&e(n,o)):r.auth.saveToken(r.options.authTokenName,t,{},function(n){e&&e(n,o),n?(r._changeToUnauthenticatedState(),r._onSCError(n)):o.isAuthenticated?r._changeToAuthenticatedState(t):r._changeToUnauthenticatedState()})})},b.prototype._tryReconnect=function(t){var e,r=this,n=this.connectAttempts++,o=this.options.autoReconnectOptions;if(null==t||n>0){var i=Math.round(o.initialDelay+(o.randomness||0)*Math.random());e=Math.round(i*Math.pow(o.multiplier,n))}else e=t;e>o.maxDelay&&(e=o.maxDelay),clearTimeout(this._reconnectTimeoutRef),this.pendingReconnect=!0,this.pendingReconnectTimeout=e,this._reconnectTimeoutRef=setTimeout(function(){r.connect()},e)},b.prototype._onSCOpen=function(t){var e=this;t?(this.id=t.id,this.pingTimeout=t.pingTimeout,this.transport.pingTimeout=this.pingTimeout,t.isAuthenticated?this._changeToAuthenticatedState(t.authToken):this._changeToUnauthenticatedState()):this._changeToUnauthenticatedState(),this.connectAttempts=0,this.options.autoProcessSubscriptions?this.processPendingSubscriptions():this.pendingConnectCallback=!0,o.prototype.emit.call(this,"connect",t,function(){e.processPendingSubscriptions()}),this._flushEmitBuffer()},b.prototype._onSCError=function(t){var e=this;setTimeout(function(){if(e.listeners("error").length<1)throw t;o.prototype.emit.call(e,"error",t)},0)},b.prototype._suspendSubscriptions=function(){var t,e;for(var r in this._channels)this._channels.hasOwnProperty(r)&&(e=(t=this._channels[r]).state==t.SUBSCRIBED||t.state==t.PENDING?t.PENDING:t.UNSUBSCRIBED,this._triggerChannelUnsubscribe(t,e))},b.prototype._onSCClose=function(t,e,r){if(this.id=null,this.transport&&this.transport.off(),this.pendingReconnect=!1,this.pendingReconnectTimeout=null,clearTimeout(this._reconnectTimeoutRef),this._changeToPendingAuthState(),this._suspendSubscriptions(),this.options.autoReconnect&&(4e3==t||4001==t||1005==t?this._tryReconnect(0):1e3!=t&&t<4500&&this._tryReconnect()),r?o.prototype.emit.call(this,"connectAbort",t,e):o.prototype.emit.call(this,"disconnect",t,e),!b.ignoreStatuses[t]){var n;n=e?"Socket connection failed: "+e:"Socket connection failed for unknown reasons";var i=new g(b.errorStatuses[t]||n,t);this._onSCError(i)}},b.prototype._onSCEvent=function(t,e,r){var n=this._privateEventHandlerMap[t];n?n.call(this,e,r):o.prototype.emit.call(this,t,e,function(){r&&r.callback.apply(r,arguments)})},b.prototype.decode=function(t){return this.transport.decode(t)},b.prototype.encode=function(t){return this.transport.encode(t)},b.prototype._flushEmitBuffer=function(){for(var t,e=this._emitBuffer.head;e;){t=e.next;var r=e.data;e.detach(),this.transport.emitObject(r),e=t}},b.prototype._handleEventAckTimeout=function(t,e){e&&e.detach();var r=t.callback;if(r){delete t.callback;var n=new m("Event response for '"+t.event+"' timed out");r.call(t,n,t)}},b.prototype._emit=function(t,e,r){var n=this;this.state==this.CLOSED&&this.connect();var o={event:t,data:e,callback:r},i=new h.Item;this.options.cloneData?i.data=f(o):i.data=o,o.timeout=setTimeout(function(){n._handleEventAckTimeout(o,i)},this.ackTimeout),this._emitBuffer.append(i),this.state==this.OPEN&&this._flushEmitBuffer()},b.prototype.send=function(t){this.transport.send(t)},b.prototype.emit=function(t,e,r){null==this._localEvents[t]?this._emit(t,e,r):o.prototype.emit.call(this,t,e)},b.prototype.publish=function(t,e,r){var n={channel:this._decorateChannelName(t),data:e};this.emit("#publish",n,r)},b.prototype._triggerChannelSubscribe=function(t,e){var r=t.name;if(t.state!=t.SUBSCRIBED){var n=t.state;t.state=t.SUBSCRIBED;var i={channel:r,oldState:n,newState:t.state,subscriptionOptions:e};t.emit("subscribeStateChange",i),t.emit("subscribe",r,e),o.prototype.emit.call(this,"subscribeStateChange",i),o.prototype.emit.call(this,"subscribe",r,e)}},b.prototype._triggerChannelSubscribeFail=function(t,e,r){var n=e.name,i=!e.waitForAuth||this.authState==this.AUTHENTICATED;e.state!=e.UNSUBSCRIBED&&i&&(e.state=e.UNSUBSCRIBED,e.emit("subscribeFail",t,n,r),o.prototype.emit.call(this,"subscribeFail",t,n,r))},b.prototype._cancelPendingSubscribeCallback=function(t){null!=t._pendingSubscriptionCid&&(this.transport.cancelPendingResponse(t._pendingSubscriptionCid),delete t._pendingSubscriptionCid)},b.prototype._decorateChannelName=function(t){return this.channelPrefix&&(t=this.channelPrefix+t),t},b.prototype._undecorateChannelName=function(t){return this.channelPrefix&&0==t.indexOf(this.channelPrefix)?t.replace(this.channelPrefix,""):t},b.prototype._trySubscribe=function(t){var e=this,r=!t.waitForAuth||this.authState==this.AUTHENTICATED;if(this.state==this.OPEN&&!this.pendingConnectCallback&&null==t._pendingSubscriptionCid&&r){var n={noTimeout:!0},i={channel:this._decorateChannelName(t.name)};t.waitForAuth&&(n.waitForAuth=!0,i.waitForAuth=n.waitForAuth),t.data&&(i.data=t.data),t._pendingSubscriptionCid=this.transport.emit("#subscribe",i,n,function(r){delete t._pendingSubscriptionCid,r?e._triggerChannelSubscribeFail(r,t,i):e._triggerChannelSubscribe(t,i)}),o.prototype.emit.call(this,"subscribeRequest",t.name,i)}},b.prototype.subscribe=function(t,e){var r=this._channels[t];return r?e&&r.setOptions(e):(r=new i(t,this,e),this._channels[t]=r),r.state==r.UNSUBSCRIBED&&(r.state=r.PENDING,this._trySubscribe(r)),r},b.prototype._triggerChannelUnsubscribe=function(t,e){var r=t.name,n=t.state;if(t.state=e||t.UNSUBSCRIBED,this._cancelPendingSubscribeCallback(t),n==t.SUBSCRIBED){var i={channel:r,oldState:n,newState:t.state};t.emit("subscribeStateChange",i),t.emit("unsubscribe",r),o.prototype.emit.call(this,"subscribeStateChange",i),o.prototype.emit.call(this,"unsubscribe",r)}},b.prototype._tryUnsubscribe=function(t){if(this.state==this.OPEN){this._cancelPendingSubscribeCallback(t);var e=this._decorateChannelName(t.name);this.transport.emit("#unsubscribe",e,{noTimeout:!0})}},b.prototype.unsubscribe=function(t){var e=this._channels[t];e&&e.state!=e.UNSUBSCRIBED&&(this._triggerChannelUnsubscribe(e),this._tryUnsubscribe(e))},b.prototype.channel=function(t,e){var r=this._channels[t];return r||(r=new i(t,this,e),this._channels[t]=r),r},b.prototype.destroyChannel=function(t){var e=this._channels[t];e.unwatch(),e.unsubscribe(),delete this._channels[t]},b.prototype.subscriptions=function(t){var e,r=[];for(var n in this._channels)this._channels.hasOwnProperty(n)&&(e=this._channels[n],(t?e&&(e.state==e.SUBSCRIBED||e.state==e.PENDING):e&&e.state==e.SUBSCRIBED)&&r.push(n));return r},b.prototype.isSubscribed=function(t,e){var r=this._channels[t];return e?!!r&&(r.state==r.SUBSCRIBED||r.state==r.PENDING):!!r&&r.state==r.SUBSCRIBED},b.prototype.processPendingSubscriptions=function(){var t,e=this;for(var r in this.pendingConnectCallback=!1,this._channels)this._channels.hasOwnProperty(r)&&(t=this._channels[r]).state==t.PENDING&&e._trySubscribe(t)},b.prototype.watch=function(t,e){if("function"!=typeof e)throw new d("No handler function was provided");this._channelEmitter.on(t,e)},b.prototype.unwatch=function(t,e){e?this._channelEmitter.removeListener(t,e):this._channelEmitter.removeAllListeners(t)},b.prototype.watchers=function(t){return this._channelEmitter.listeners(t)},t.exports=b}).call(this,r(0),r(6).Buffer)},function(t,e){t.exports=function(t,e){if("$"!==e)for(var r=function(t){var e,r=/(?:\.(\w+))|(?:\[(\d+)\])|(?:\["((?:[^\\"]|\\.)*)"\])/g,n=[];for(;e=r.exec(t);)n.push(e[1]||e[2]||e[3]);return n}(e),n=0;n<r.length;n++)e=r[n].toString().replace(/\\"/g,'"'),void 0===t[e]&&n!==r.length-1||(t=t[e]);return t}},function(t,e,r){var n=r(33);e.stringify=function(t,e,r,o){if(arguments.length<4)try{return 1===arguments.length?JSON.stringify(t):JSON.stringify.apply(JSON,arguments)}catch(t){}var i=o||!1;"boolean"==typeof i&&(i={date:i,function:i,regex:i,undefined:i,error:i,symbol:i,map:i,set:i,nan:i,infinity:i});var s=n.decycle(t,i,e);return 1===arguments.length?JSON.stringify(s):JSON.stringify(s,e,r)},e.parse=function(t,e){var r,o=/"\$jsan"/.test(t);return r=1===arguments.length?JSON.parse(t):JSON.parse(t,e),o&&(r=n.retrocycle(r)),r}},function(t,e,r){"use strict";e.__esModule=!0;e.defaultSocketOptions={secure:!0,hostname:"remotedev.io",port:443,autoReconnect:!0,autoReconnectOptions:{randomness:6e4}}},function(t,e,r){"use strict";function n(t){return t&&("AndroidConstants"===t[0]||"PlatformConstants"===t[0])}t.exports=function(t){if("object"!=typeof __fbBatchedBridge||"localhost"!==t&&"127.0.0.1"!==t)return t;t=function(t){var e="undefined"!=typeof window&&window.__fbBatchedBridgeConfig&&window.__fbBatchedBridgeConfig.remoteModuleConfig;if(!Array.isArray(e)||"localhost"!==t&&"127.0.0.1"!==t)return t;var r=(e.find(n)||[])[1];return r?(r.ServerHost||t).split(":")[0]:t}(t);var e,r,o,i=console.warn;return console.warn=function(){if(!(arguments[0]&&arguments[0].indexOf("Requiring module 'NativeModules' by name")>-1))return i.apply(console,arguments)},"undefined"!=typeof window&&window.__DEV__&&"function"==typeof window.require?(e=window.require("NativeModules"),console.warn=i,e&&(e.PlatformConstants||e.AndroidConstants)?(r=e.PlatformConstants,o=e.AndroidConstants,((r?r.ServerHost:o.ServerHost)||t).split(":")[0]):t):t}},function(t,e,r){(function(e){var n=r(7),o=r(1).InvalidArgumentsError,i={};function s(t){var e=t.secure?"https://":"http://",r="";if(t.query)if("string"==typeof t.query)r=t.query;else{var n=[],o=t.query;for(var i in o)o.hasOwnProperty(i)&&n.push(i+"="+o[i]);n.length&&(r="?"+n.join("&"))}return e+(t.host?t.host:t.hostname+":"+t.port)+t.path+r}function a(){return e.location&&"https:"==location.protocol}function c(t,r){var n=null==t.secure?r:t.secure;return t.port||(e.location&&location.port?location.port:n?443:80)}t.exports={connect:function(t){if((t=t||{}).host&&t.port)throw new o("The host option should already include the port number in the format hostname:port - Because of this, the host and port options cannot be specified together; use the hostname option instead");var r=a(),u={port:c(t,r),hostname:e.location&&location.hostname,path:"/socketcluster/",secure:r,autoConnect:!0,autoReconnect:!0,autoProcessSubscriptions:!0,connectTimeout:2e4,ackTimeout:1e4,timestampRequests:!1,timestampParam:"t",authEngine:null,authTokenName:"socketCluster.authToken",binaryType:"arraybuffer",multiplex:!0,cloneData:!1};for(var h in t)t.hasOwnProperty(h)&&(u[h]=t[h]);var p=s(u);return!1===u.multiplex?new n(u):(i[p]?i[p].connect():i[p]=new n(u),i[p])},destroy:function(t){t=t||{};var r=a(),n={port:c(t,r),hostname:e.location&&location.hostname,path:"/socketcluster/",secure:r};for(var o in t)t.hasOwnProperty(o)&&(n[o]=t[o]);var u=s(n),h=i[u];h&&h.disconnect(),delete i[u]},connections:i}}).call(this,r(0))},function(t,e,r){(function(e){var r=function(){"use strict";function t(t,e){return null!=e&&t instanceof e}var r,n,o;try{r=Map}catch(t){r=function(){}}try{n=Set}catch(t){n=function(){}}try{o=Promise}catch(t){o=function(){}}function i(s,c,u,h,p){"object"==typeof c&&(u=c.depth,h=c.prototype,p=c.includeNonEnumerable,c=c.circular);var f=[],l=[],d=void 0!==e;return void 0===c&&(c=!0),void 0===u&&(u=1/0),function s(u,y){if(null===u)return null;if(0===y)return u;var g,m;if("object"!=typeof u)return u;if(t(u,r))g=new r;else if(t(u,n))g=new n;else if(t(u,o))g=new o(function(t,e){u.then(function(e){t(s(e,y-1))},function(t){e(s(t,y-1))})});else if(i.__isArray(u))g=[];else if(i.__isRegExp(u))g=new RegExp(u.source,a(u)),u.lastIndex&&(g.lastIndex=u.lastIndex);else if(i.__isDate(u))g=new Date(u.getTime());else{if(d&&e.isBuffer(u))return g=new e(u.length),u.copy(g),g;t(u,Error)?g=Object.create(u):void 0===h?(m=Object.getPrototypeOf(u),g=Object.create(m)):(g=Object.create(h),m=h)}if(c){var v=f.indexOf(u);if(-1!=v)return l[v];f.push(u),l.push(g)}for(var b in t(u,r)&&u.forEach(function(t,e){var r=s(e,y-1),n=s(t,y-1);g.set(r,n)}),t(u,n)&&u.forEach(function(t){var e=s(t,y-1);g.add(e)}),u){var E;m&&(E=Object.getOwnPropertyDescriptor(m,b)),E&&null==E.set||(g[b]=s(u[b],y-1))}if(Object.getOwnPropertySymbols){var S=Object.getOwnPropertySymbols(u);for(b=0;b<S.length;b++){var w=S[b];(!(_=Object.getOwnPropertyDescriptor(u,w))||_.enumerable||p)&&(g[w]=s(u[w],y-1),_.enumerable||Object.defineProperty(g,w,{enumerable:!1}))}}if(p){var T=Object.getOwnPropertyNames(u);for(b=0;b<T.length;b++){var _,k=T[b];(_=Object.getOwnPropertyDescriptor(u,k))&&_.enumerable||(g[k]=s(u[k],y-1),Object.defineProperty(g,k,{enumerable:!1}))}}return g}(s,u)}function s(t){return Object.prototype.toString.call(t)}function a(t){var e="";return t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),e}return i.clonePrototype=function(t){if(null===t)return null;var e=function(){};return e.prototype=t,new e},i.__objToStr=s,i.__isDate=function(t){return"object"==typeof t&&"[object Date]"===s(t)},i.__isArray=function(t){return"object"==typeof t&&"[object Array]"===s(t)},i.__isRegExp=function(t){return"object"==typeof t&&"[object RegExp]"===s(t)},i.__getRegExpFlags=a,i}();"object"==typeof t&&t.exports&&(t.exports=r)}).call(this,r(6).Buffer)},function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children||(t.children=[]),Object.defineProperty(t,"loaded",{enumerable:!0,get:function(){return t.l}}),Object.defineProperty(t,"id",{enumerable:!0,get:function(){return t.i}}),t.webpackPolyfill=1),t}},function(t,e,r){(function(t,n){var o;/*! http://mths.be/base64 v0.1.0 by @mathias | MIT license */!function(i){var s="object"==typeof e&&e,a=("object"==typeof t&&t&&t.exports,"object"==typeof n&&n);a.global!==a&&a.window;var c=function(t){this.message=t};(c.prototype=new Error).name="InvalidCharacterError";var u=function(t){throw new c(t)},h="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",p=/[\t\n\f\r ]/g,f={encode:function(t){t=String(t),/[^\0-\xFF]/.test(t)&&u("The string to be encoded contains characters outside of the Latin1 range.");for(var e,r,n,o,i=t.length%3,s="",a=-1,c=t.length-i;++a<c;)e=t.charCodeAt(a)<<16,r=t.charCodeAt(++a)<<8,n=t.charCodeAt(++a),s+=h.charAt((o=e+r+n)>>18&63)+h.charAt(o>>12&63)+h.charAt(o>>6&63)+h.charAt(63&o);return 2==i?(e=t.charCodeAt(a)<<8,r=t.charCodeAt(++a),s+=h.charAt((o=e+r)>>10)+h.charAt(o>>4&63)+h.charAt(o<<2&63)+"="):1==i&&(o=t.charCodeAt(a),s+=h.charAt(o>>2)+h.charAt(o<<4&63)+"=="),s},decode:function(t){var e=(t=String(t).replace(p,"")).length;e%4==0&&(e=(t=t.replace(/==?$/,"")).length),(e%4==1||/[^+a-zA-Z0-9/]/.test(t))&&u("Invalid character: the string to be decoded is not correctly encoded.");for(var r,n,o=0,i="",s=-1;++s<e;)n=h.indexOf(t.charAt(s)),r=o%4?64*r+n:n,o++%4&&(i+=String.fromCharCode(255&r>>(-2*o&6)));return i},version:"0.1.0"};void 0===(o=function(){return f}.call(e,r,e,t))||(t.exports=o)}()}).call(this,r(14)(t),r(0))},function(t,e,r){"use strict";var n,o;function i(){if(arguments.length)return i.from(arguments)}function s(){}n="An argument without append, prepend, or detach methods was given to `List",o=i.prototype,i.of=function(){return i.from.call(this,arguments)},i.from=function(t){var e,r,n,o=new this;if(t&&(e=t.length))for(r=-1;++r<e;)null!==(n=t[r])&&void 0!==n&&o.append(n);return o},o.head=null,o.tail=null,o.toArray=function(){for(var t=this.head,e=[];t;)e.push(t),t=t.next;return e},o.prepend=function(t){if(!t)return!1;if(!t.append||!t.prepend||!t.detach)throw new Error(n+"#prepend`.");var e;return this,(e=this.head)?e.prepend(t):(t.detach(),t.list=this,this.head=t,t)},o.append=function(t){if(!t)return!1;if(!t.append||!t.prepend||!t.detach)throw new Error(n+"#append`.");var e,r;return this,(r=this.tail)?r.append(t):(e=this.head)?e.append(t):(t.detach(),t.list=this,this.head=t,t)},i.Item=s;var a=s.prototype;a.next=null,a.prev=null,a.list=null,a.detach=function(){var t=this.list,e=this.prev,r=this.next;return t?(t.tail===this&&(t.tail=e),t.head===this&&(t.head=r),t.tail===t.head&&(t.tail=null),e&&(e.next=r),r&&(r.prev=e),this.prev=this.next=this.list=null,this):this},a.prepend=function(t){if(!(t&&t.append&&t.prepend&&t.detach))throw new Error(n+"Item#prepend`.");var e=this.list,r=this.prev;return!!e&&(t.detach(),r&&(t.prev=r,r.next=t),t.next=this,t.list=e,this.prev=t,this===e.head&&(e.head=t),e.tail||(e.tail=this),t)},a.append=function(t){if(!(t&&t.append&&t.prepend&&t.detach))throw new Error(n+"Item#append`.");var e=this.list,r=this.next;return!!e&&(t.detach(),r&&(t.next=r,r.prev=t),t.prev=this,t.list=e,this.next=t,this!==e.tail&&e.tail||(e.tail=t),t)},t.exports=i},function(t,e,r){"use strict";t.exports=r(16)},function(t,e){var r,n=(r="undefined"!=typeof WorkerGlobalScope?self:"undefined"!=typeof window&&window||function(){return this}()).WebSocket||r.MozWebSocket;function o(t,e,r){return e?new n(t,e):new n(t)}n&&(o.prototype=n.prototype),t.exports=n?o:null},function(t,e,r){"use strict";var n=function(t){switch(typeof t){case"string":return t;case"boolean":return t?"true":"false";case"number":return isFinite(t)?t:"";default:return""}};t.exports=function(t,e,r,a){return e=e||"&",r=r||"=",null===t&&(t=void 0),"object"==typeof t?i(s(t),function(s){var a=encodeURIComponent(n(s))+r;return o(t[s])?i(t[s],function(t){return a+encodeURIComponent(n(t))}).join(e):a+encodeURIComponent(n(t[s]))}).join(e):a?encodeURIComponent(n(a))+r+encodeURIComponent(n(t)):""};var o=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)};function i(t,e){if(t.map)return t.map(e);for(var r=[],n=0;n<t.length;n++)r.push(e(t[n],n));return r}var s=Object.keys||function(t){var e=[];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.push(r);return e}},function(t,e,r){"use strict";function n(t,e){return Object.prototype.hasOwnProperty.call(t,e)}t.exports=function(t,e,r,i){e=e||"&",r=r||"=";var s={};if("string"!=typeof t||0===t.length)return s;var a=/\+/g;t=t.split(e);var c=1e3;i&&"number"==typeof i.maxKeys&&(c=i.maxKeys);var u=t.length;c>0&&u>c&&(u=c);for(var h=0;h<u;++h){var p,f,l,d,y=t[h].replace(a,"%20"),g=y.indexOf(r);g>=0?(p=y.substr(0,g),f=y.substr(g+1)):(p=y,f=""),l=decodeURIComponent(p),d=decodeURIComponent(f),n(s,l)?o(s[l])?s[l].push(d):s[l]=[s[l],d]:s[l]=d}return s};var o=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)}},function(t,e,r){(function(e){var n,o,i=r(2).SCEmitter,s=r(5).Response,a=r(4);e.WebSocket?(n=e.WebSocket,o=function(t,e){return new n(t)}):(n=r(18),o=function(t,e){return new n(t,null,e)});var c=r(1),u=c.TimeoutError,h=function(t,e,r){this.state=this.CLOSED,this.auth=t,this.codec=e,this.options=r,this.connectTimeout=r.connectTimeout,this.pingTimeout=r.ackTimeout,this.callIdGenerator=r.callIdGenerator,this._pingTimeoutTicker=null,this._callbackMap={},this.open()};h.prototype=Object.create(i.prototype),h.CONNECTING=h.prototype.CONNECTING="connecting",h.OPEN=h.prototype.OPEN="open",h.CLOSED=h.prototype.CLOSED="closed",h.prototype.uri=function(){var t,e=this.options.query||{},r=this.options.secure?"wss":"ws";if(this.options.timestampRequests&&(e[this.options.timestampParam]=(new Date).getTime()),(e=a.encode(e)).length&&(e="?"+e),this.options.host)t=this.options.host;else{var n="";this.options.port&&("wss"==r&&443!=this.options.port||"ws"==r&&80!=this.options.port)&&(n=":"+this.options.port),t=this.options.hostname+n}return r+"://"+t+this.options.path+e},h.prototype.open=function(){var t=this;this.state=this.CONNECTING;var e=this.uri(),r=o(e,this.options);r.binaryType=this.options.binaryType,this.socket=r,r.onopen=function(){t._onOpen()},r.onclose=function(e){var r;r=null==e.code?1005:e.code,t._onClose(r,e.reason)},r.onmessage=function(e,r){t._onMessage(e.data)},r.onerror=function(e){t.state===t.CONNECTING&&t._onClose(1006)},this._connectTimeoutRef=setTimeout(function(){t._onClose(4007),t.socket.close(4007)},this.connectTimeout)},h.prototype._onOpen=function(){var t=this;clearTimeout(this._connectTimeoutRef),this._resetPingTimeout(),this._handshake(function(e,r){e?(t._onError(e),t._onClose(4003),t.socket.close(4003)):(t.state=t.OPEN,i.prototype.emit.call(t,"open",r),t._resetPingTimeout())})},h.prototype._handshake=function(t){var e=this;this.auth.loadToken(this.options.authTokenName,function(r,n){if(r)t(r);else{e.emit("#handshake",{authToken:n},{force:!0},function(e,r){r&&(r.authToken=n,r.authError&&(r.authError=c.hydrateError(r.authError))),t(e,r)})}})},h.prototype._onClose=function(t,e){delete this.socket.onopen,delete this.socket.onclose,delete this.socket.onmessage,delete this.socket.onerror,clearTimeout(this._connectTimeoutRef),this.state==this.OPEN?(this.state=this.CLOSED,i.prototype.emit.call(this,"close",t,e)):this.state==this.CONNECTING&&(this.state=this.CLOSED,i.prototype.emit.call(this,"openAbort",t,e))},h.prototype._onMessage=function(t){i.prototype.emit.call(this,"event","message",t);var e=this.decode(t);if("#1"==e)this._resetPingTimeout(),this.socket.readyState==this.socket.OPEN&&this.sendObject("#2");else{var r=e.event;if(r){var n=new s(this,e.cid);i.prototype.emit.call(this,"event",r,e.data,n)}else if(null!=e.rid){var o=this._callbackMap[e.rid];if(o&&(clearTimeout(o.timeout),delete this._callbackMap[e.rid],o.callback)){var a=c.hydrateError(e.error);o.callback(a,e.data)}}else i.prototype.emit.call(this,"event","raw",e)}},h.prototype._onError=function(t){i.prototype.emit.call(this,"error",t)},h.prototype._resetPingTimeout=function(){var t=this;(new Date).getTime();clearTimeout(this._pingTimeoutTicker),this._pingTimeoutTicker=setTimeout(function(){t._onClose(4e3),t.socket.close(4e3)},this.pingTimeout)},h.prototype.getBytesReceived=function(){return this.socket.bytesReceived},h.prototype.close=function(t,e){if(t=t||1e3,this.state==this.OPEN){var r={code:t,data:e};this.emit("#disconnect",r),this._onClose(t,e),this.socket.close(t)}else this.state==this.CONNECTING&&(this._onClose(t,e),this.socket.close(t))},h.prototype.emitObject=function(t){var e={event:t.event,data:t.data};return t.callback&&(e.cid=t.cid=this.callIdGenerator(),this._callbackMap[t.cid]=t),this.sendObject(e),t.cid||null},h.prototype._handleEventAckTimeout=function(t){var e="Event response for '"+t.event+"' timed out",r=new u(e);t.cid&&delete this._callbackMap[t.cid];var n=t.callback;delete t.callback,n.call(t,r,t)},h.prototype.emit=function(t,e,r,n){var o,i,s=this;n?(i=r,o=n):r instanceof Function?(i={},o=r):i=r;var a={event:t,data:e,callback:o};o&&!i.noTimeout&&(a.timeout=setTimeout(function(){s._handleEventAckTimeout(a)},this.options.ackTimeout));var c=null;return(this.state==this.OPEN||i.force)&&(c=this.emitObject(a)),c},h.prototype.cancelPendingResponse=function(t){delete this._callbackMap[t]},h.prototype.decode=function(t){return this.codec.decode(t)},h.prototype.encode=function(t){return this.codec.encode(t)},h.prototype.send=function(t){this.socket.readyState!=this.socket.OPEN?this._onClose(1005):this.socket.send(t)},h.prototype.serializeObject=function(t){var e,r;try{e=this.encode(t)}catch(t){r=t,this._onError(r)}return r?null:e},h.prototype.sendObject=function(t){var e=this.serializeObject(t);null!=e&&this.send(e)},t.exports.SCTransport=h}).call(this,r(0))},function(t,e,r){(function(e){var r="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",n=/^[ \n\r\t]*[{\[]/,o=function(t,n){if(e.ArrayBuffer&&n instanceof e.ArrayBuffer)return{base64:!0,data:function(t){for(var e=new Uint8Array(t),n=e.length,o="",i=0;i<n;i+=3)o+=r[e[i]>>2],o+=r[(3&e[i])<<4|e[i+1]>>4],o+=r[(15&e[i+1])<<2|e[i+2]>>6],o+=r[63&e[i+2]];return n%3==2?o=o.substring(0,o.length-1)+"=":n%3==1&&(o=o.substring(0,o.length-2)+"=="),o}(n)};if(e.Buffer){if(n instanceof e.Buffer)return{base64:!0,data:n.toString("base64")};if(n&&"Buffer"===n.type&&Array.isArray(n.data))return{base64:!0,data:(e.Buffer.from?e.Buffer.from(n.data):new e.Buffer(n.data)).toString("base64")}}return n};t.exports.decode=function(t){if(null==t)return null;if("#1"===t||"#2"===t)return t;var e=t.toString();if(!n.test(e))return e;try{return JSON.parse(e)}catch(t){}return e},t.exports.encode=function(t){return"#1"===t||"#2"===t?t:JSON.stringify(t,o)}}).call(this,r(0))},function(t,e,r){(function(e){var r=function(){this._internalStorage={}};r.prototype._isLocalStorageEnabled=function(){var t;try{e.localStorage,e.localStorage.setItem("__scLocalStorageTest",1),e.localStorage.removeItem("__scLocalStorageTest")}catch(e){t=e}return!t},r.prototype.saveToken=function(t,r,n,o){this._isLocalStorageEnabled()&&e.localStorage?e.localStorage.setItem(t,r):this._internalStorage[t]=r,o&&o(null,r)},r.prototype.removeToken=function(t,r){var n;this.loadToken(t,function(t,e){n=e}),this._isLocalStorageEnabled()&&e.localStorage&&e.localStorage.removeItem(t),delete this._internalStorage[t],r&&r(null,n)},r.prototype.loadToken=function(t,r){r(null,this._isLocalStorageEnabled()&&e.localStorage?e.localStorage.getItem(t):this._internalStorage[t]||null)},t.exports.AuthEngine=r}).call(this,r(0))},function(t,e){t.exports=function(t){var e=[],r=[];return function t(n,o){var i,s,a;if(!("object"!=typeof n||null===n||n instanceof Boolean||n instanceof Date||n instanceof Number||n instanceof RegExp||n instanceof String)){for(i=0;i<e.length;i+=1)if(e[i]===n)return{$ref:r[i]};if(e.push(n),r.push(o),"[object Array]"===Object.prototype.toString.apply(n))for(a=[],i=0;i<n.length;i+=1)a[i]=t(n[i],o+"["+i+"]");else for(s in a={},n)Object.prototype.hasOwnProperty.call(n,s)&&(a[s]=t(n[s],o+"["+JSON.stringify(s)+"]"));return a}return n}(t,"$")}},function(t,e,r){var n=r(2).SCEmitter,o=function(t,e,r){n.call(this),this.PENDING="pending",this.SUBSCRIBED="subscribed",this.UNSUBSCRIBED="unsubscribed",this.name=t,this.state=this.UNSUBSCRIBED,this.client=e,this.options=r||{},this.setOptions(this.options)};(o.prototype=Object.create(n.prototype)).setOptions=function(t){t||(t={}),this.waitForAuth=t.waitForAuth||!1,void 0!==t.data&&(this.data=t.data)},o.prototype.getState=function(){return this.state},o.prototype.subscribe=function(t){this.client.subscribe(this.name,t)},o.prototype.unsubscribe=function(){this.client.unsubscribe(this.name)},o.prototype.isSubscribed=function(t){return this.client.isSubscribed(this.name,t)},o.prototype.publish=function(t,e){this.client.publish(this.name,t,e)},o.prototype.watch=function(t){this.client.watch(this.name,t)},o.prototype.unwatch=function(t){this.client.unwatch(this.name,t)},o.prototype.watchers=function(){return this.client.watchers(this.name)},o.prototype.destroy=function(){this.client.destroyChannel(this.name)},t.exports.SCChannel=o},function(t,e){t.exports.create=function(){function t(){}return function(e){if(1!=arguments.length)throw new Error("Object.create implementation only accepts one parameter.");return t.prototype=e,new t}}()},function(t,e){function r(t){if(t)return function(t){for(var e in r.prototype)t[e]=r.prototype[e];return t}(t)}t.exports=r,r.prototype.on=r.prototype.addEventListener=function(t,e){return this._callbacks=this._callbacks||{},(this._callbacks["$"+t]=this._callbacks["$"+t]||[]).push(e),this},r.prototype.once=function(t,e){function r(){this.off(t,r),e.apply(this,arguments)}return r.fn=e,this.on(t,r),this},r.prototype.off=r.prototype.removeListener=r.prototype.removeAllListeners=r.prototype.removeEventListener=function(t,e){if(this._callbacks=this._callbacks||{},0==arguments.length)return this._callbacks={},this;var r,n=this._callbacks["$"+t];if(!n)return this;if(1==arguments.length)return delete this._callbacks["$"+t],this;for(var o=0;o<n.length;o++)if((r=n[o])===e||r.fn===e){n.splice(o,1);break}return this},r.prototype.emit=function(t){this._callbacks=this._callbacks||{};var e=[].slice.call(arguments,1),r=this._callbacks["$"+t];if(r)for(var n=0,o=(r=r.slice(0)).length;n<o;++n)r[n].apply(this,e);return this},r.prototype.listeners=function(t){return this._callbacks=this._callbacks||{},this._callbacks["$"+t]||[]},r.prototype.hasListeners=function(t){return!!this.listeners(t).length}},function(t,e){var r={}.toString;t.exports=Array.isArray||function(t){return"[object Array]"==r.call(t)}},function(t,e){e.read=function(t,e,r,n,o){var i,s,a=8*o-n-1,c=(1<<a)-1,u=c>>1,h=-7,p=r?o-1:0,f=r?-1:1,l=t[e+p];for(p+=f,i=l&(1<<-h)-1,l>>=-h,h+=a;h>0;i=256*i+t[e+p],p+=f,h-=8);for(s=i&(1<<-h)-1,i>>=-h,h+=n;h>0;s=256*s+t[e+p],p+=f,h-=8);if(0===i)i=1-u;else{if(i===c)return s?NaN:1/0*(l?-1:1);s+=Math.pow(2,n),i-=u}return(l?-1:1)*s*Math.pow(2,i-n)},e.write=function(t,e,r,n,o,i){var s,a,c,u=8*i-o-1,h=(1<<u)-1,p=h>>1,f=23===o?Math.pow(2,-24)-Math.pow(2,-77):0,l=n?0:i-1,d=n?1:-1,y=e<0||0===e&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(a=isNaN(e)?1:0,s=h):(s=Math.floor(Math.log(e)/Math.LN2),e*(c=Math.pow(2,-s))<1&&(s--,c*=2),(e+=s+p>=1?f/c:f*Math.pow(2,1-p))*c>=2&&(s++,c/=2),s+p>=h?(a=0,s=h):s+p>=1?(a=(e*c-1)*Math.pow(2,o),s+=p):(a=e*Math.pow(2,p-1)*Math.pow(2,o),s=0));o>=8;t[r+l]=255&a,l+=d,a/=256,o-=8);for(s=s<<o|a,u+=o;u>0;t[r+l]=255&s,l+=d,s/=256,u-=8);t[r+l-d]|=128*y}},function(t,e,r){"use strict";e.byteLength=function(t){return 3*t.length/4-u(t)},e.toByteArray=function(t){var e,r,n,s,a,c=t.length;s=u(t),a=new i(3*c/4-s),r=s>0?c-4:c;var h=0;for(e=0;e<r;e+=4)n=o[t.charCodeAt(e)]<<18|o[t.charCodeAt(e+1)]<<12|o[t.charCodeAt(e+2)]<<6|o[t.charCodeAt(e+3)],a[h++]=n>>16&255,a[h++]=n>>8&255,a[h++]=255&n;2===s?(n=o[t.charCodeAt(e)]<<2|o[t.charCodeAt(e+1)]>>4,a[h++]=255&n):1===s&&(n=o[t.charCodeAt(e)]<<10|o[t.charCodeAt(e+1)]<<4|o[t.charCodeAt(e+2)]>>2,a[h++]=n>>8&255,a[h++]=255&n);return a},e.fromByteArray=function(t){for(var e,r=t.length,o=r%3,i="",s=[],a=0,c=r-o;a<c;a+=16383)s.push(h(t,a,a+16383>c?c:a+16383));1===o?(e=t[r-1],i+=n[e>>2],i+=n[e<<4&63],i+="=="):2===o&&(e=(t[r-2]<<8)+t[r-1],i+=n[e>>10],i+=n[e>>4&63],i+=n[e<<2&63],i+="=");return s.push(i),s.join("")};for(var n=[],o=[],i="undefined"!=typeof Uint8Array?Uint8Array:Array,s="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",a=0,c=s.length;a<c;++a)n[a]=s[a],o[s.charCodeAt(a)]=a;function u(t){var e=t.length;if(e%4>0)throw new Error("Invalid string. Length must be a multiple of 4");return"="===t[e-2]?2:"="===t[e-1]?1:0}function h(t,e,r){for(var o,i,s=[],a=e;a<r;a+=3)o=(t[a]<<16&16711680)+(t[a+1]<<8&65280)+(255&t[a+2]),s.push(n[(i=o)>>18&63]+n[i>>12&63]+n[i>>6&63]+n[63&i]);return s.join("")}o["-".charCodeAt(0)]=62,o["_".charCodeAt(0)]=63},function(t,e,r){var n=r(7),o=r(12);t.exports.SCSocketCreator=o,t.exports.SCSocket=n,t.exports.SCEmitter=r(2).SCEmitter,t.exports.connect=function(t){return o.connect(t)},t.exports.destroy=function(t){return o.destroy(t)},t.exports.connections=o.connections,t.exports.version="5.5.2"},function(t,e,r){var n=r(8),o=r(9);e.getRegexFlags=function(t){var e="";return t.ignoreCase&&(e+="i"),t.global&&(e+="g"),t.multiline&&(e+="m"),e},e.stringifyFunction=function(t,e){if("function"==typeof e)return e(t);var r=t.toString(),n=r.match(/^[^{]*{|^[^=]*=>/),o=n?n[0]:"<function> ",i="}"===r[r.length-1]?"}":"";return o.replace(/\r\n|\n/g," ").replace(/\s+/g," ")+" /* ... */ "+i},e.restore=function(t,e){var r=t[0],i=t.slice(1);switch(r){case"$":return n(e,t);case"r":var s=i.indexOf(","),a=i.slice(0,s),c=i.slice(s+1);return RegExp(c,a);case"d":return new Date(+i);case"f":var u=function(){throw new Error("can't run jsan parsed function")};return u.toString=function(){return i},u;case"u":return;case"e":var h=new Error(i);return h.stack="Stack is unavailable for jsan parsed errors",h;case"s":return Symbol(i);case"g":return Symbol.for(i);case"m":return new Map(o.parse(i));case"l":return new Set(o.parse(i));case"n":return NaN;case"i":return 1/0;case"y":return-1/0;default:return console.warn("unknown type",t),t}}},function(t,e,r){r(8);var n=r(32),o="undefined"!=typeof WeakMap?WeakMap:function(){var t=[],e=[];return{set:function(r,n){t.push(r),e.push(n)},get:function(r){for(var n=0;n<t.length;n++)if(t[n]===r)return e[n]}}};e.decycle=function t(e,r,i){"use strict";var s=new o,a=Object.prototype.hasOwnProperty.call(r,"circular");return function e(o,c,u){var h,p,f,l=i?i(u||"",o):o;if(r.date&&l instanceof Date)return{$jsan:"d"+l.getTime()};if(r.regex&&l instanceof RegExp)return{$jsan:"r"+n.getRegexFlags(l)+","+l.source};if(r.function&&"function"==typeof l)return{$jsan:"f"+n.stringifyFunction(l,r.function)};if(r.nan&&"number"==typeof l&&isNaN(l))return{$jsan:"n"};if(r.infinity){if(Number.POSITIVE_INFINITY===l)return{$jsan:"i"};if(Number.NEGATIVE_INFINITY===l)return{$jsan:"y"}}if(r[void 0]&&void 0===l)return{$jsan:"u"};if(r.error&&l instanceof Error)return{$jsan:"e"+l.message};if(r.symbol&&"symbol"==typeof l){var d=Symbol.keyFor(l);return void 0!==d?{$jsan:"g"+d}:{$jsan:"s"+l.toString().slice(7,-1)}}if(r.map&&"function"==typeof Map&&l instanceof Map&&"function"==typeof Array.from)return{$jsan:"m"+JSON.stringify(t(Array.from(l),r,i))};if(r.set&&"function"==typeof Set&&l instanceof Set&&"function"==typeof Array.from)return{$jsan:"l"+JSON.stringify(t(Array.from(l),r,i))};if(l&&"function"==typeof l.toJSON&&(l=l.toJSON(u)),!("object"!=typeof l||null===l||l instanceof Boolean||l instanceof Date||l instanceof Number||l instanceof RegExp||l instanceof String||"symbol"==typeof l||l instanceof Error)){if("object"==typeof l&&null!==l){var y=s.get(l);if(y)return a&&0===c.indexOf(y)?"function"==typeof r.circular?r.circular(l,c,y):r.circular:{$jsan:y};s.set(l,c)}if("[object Array]"===Object.prototype.toString.apply(l))for(f=[],h=0;h<l.length;h+=1)f[h]=e(l[h],c+"["+h+"]",h);else for(p in f={},l)if(Object.prototype.hasOwnProperty.call(l,p)){var g=/^\w+$/.test(p)?"."+p:"["+JSON.stringify(p)+"]";f[p]="$jsan"===p?[e(l[p],c+g)]:e(l[p],c+g,p)}return f}return l}(e,"$")},e.retrocycle=function(t){"use strict";return function e(r){var o,i,s;if(r&&"object"==typeof r)if("[object Array]"===Object.prototype.toString.apply(r))for(o=0;o<r.length;o+=1)(i=r[o])&&"object"==typeof i&&(i.$jsan?r[o]=n.restore(i.$jsan,t):e(i));else for(s in r){if("string"==typeof r[s]&&"$jsan"===s)return n.restore(r.$jsan,t);"$jsan"===s&&(r[s]=r[s][0]),"object"==typeof r[s]&&(i=r[s])&&"object"==typeof i&&(i.$jsan?r[s]=n.restore(i.$jsan,t):e(i))}return r}(t)}},function(t,e,r){t.exports=r(9)},function(t,e,r){"use strict";e.__esModule=!0,e.send=void 0,e.extractState=p,e.generateId=f,e.start=y,e.connect=m,e.connectViaExtension=v;var n=r(34),o=a(r(31)),i=a(r(11)),s=r(10);function a(t){return t&&t.__esModule?t:{default:t}}var c=void 0,u=void 0,h={};function p(t){if(t&&t.state)return"string"==typeof t.state?(0,n.parse)(t.state):t.state}function f(){return Math.random().toString(36).substr(2)}function l(t){t.payload||(t.payload=t.action),Object.keys(h).forEach(function(e){t.instanceId&&e!==t.instanceId||("function"==typeof h[e]?h[e](t):h[e].forEach(function(e){e(t)}))})}function d(t){if(!c){var e=void 0;e=t.port?{port:t.port,hostname:(0,i.default)(t.hostname||"localhost"),secure:!!t.secure}:s.defaultSocketOptions,c=o.default.connect(e),u||c.emit("login","master",function(t,e){t?console.log(t):((u=c.subscribe(e)).watch(l),c.on(e,l))})}}function y(t){t&&t.port&&!t.hostname&&(t.hostname="localhost"),d(t)}function g(t,e,r,o,i){y(r),setTimeout(function(){var s={payload:e?(0,n.stringify)(e):"",action:"ACTION"===o?(0,n.stringify)(function(t,e){if(t.action)return t;var r={timestamp:Date.now()};return t?e.getActionType?r.action=e.getActionType(t):"string"==typeof t?r.action={type:t}:t.type?r.action=t:r.action={type:"update"}:r.action={type:t},r}(t,r)):t,type:o||"ACTION",id:c.id,instanceId:i,name:r.name};c.emit(c.id?"log":"log-noid",s)},0)}function m(){var t=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],e=f(t.instanceId);return y(t),{init:function(r,n){g(n||{},r,t,"INIT",e)},subscribe:function(t){if(t)return h[e]||(h[e]=[]),h[e].push(t),function(){var r=h[e].indexOf(t);h[e].splice(r,1)}},unsubscribe:function(){delete h[e]},send:function(r,n){r?g(r,n,t,"ACTION",e):g(void 0,n,t,"STATE",e)},error:function(t){c.emit({type:"ERROR",payload:t,id:c.id,instanceId:e})}}}function v(t){return t&&t.remote||"undefined"==typeof window||!window.devToolsExtension?m(t):window.devToolsExtension.connect(t)}e.send=g,e.default={connect:m,connectViaExtension:v,send:g,extractState:p,generateId:f}},function(t,e,r){"use strict";r.r(e);var n=r(3);window.RemoteDev={connectViaExtension:n.connectViaExtension,extractState:n.extractState}}]);;
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
;
(function()
{
 "use strict";
 var Global,TodoMvc,Client,WebSharper,Operators,Mvu,App,TodoList,Model,Obj,UI,Var$1,EndPoint,Mvu_Router,Mvu_JsonEncoder,Mvu_JsonDecoder,Mvu_Templates,Entry,Model$1,Message,Message$1,List,T,View,Arrays,Templating,Runtime,Server,ProviderBuilder,Handler,Event,UIEvent,AttrModule,TemplateInstance,Unchecked,Router,Var,Option,Abbrev,Fresh,Numeric,Sitelets,RouterOperators,ClientSideJson,Provider,Seq,JavaScript,Pervasives,Snap,Collections,List$1,FromView,System,Guid,AttrProxy,Attrs,DomUtility,Dictionary,HashSet,Client$1,RouterModule,Route,JS,EventTarget,Node,WindowOrWorkerGlobalScope,Router$1,List$2,Object,ConcreteVar,Enumerator,T$1,Doc,Array,CheckedInput,DynamicAttrNode,DictionaryUtil,Client$2,Templates,Utils,Strings,SC$1,FSharpMap,Docs,Map,Lazy,BalancedTree,Tree,Pair,SC$2,DocElemNode,CharacterData,Prepare,Slice,Elt,An,Settings,Mailbox,LazyExtensionsProxy,LazyRecord,PathUtil,HashSetUtil,Queue,SC$3,SC$4,Attrs$1,Dyn,Updates,Docs$1,RunState,NodeSet,Anims,SC$5,MapUtil,KeyCollection,String,SC$6,Concurrency,AppendList,Char,Easing,AsyncBody,SC$7,CT,HashSet$1,Scheduler,CancellationTokenSource,DomNodes,Error,OperationCanceledException,SC$8,IntelliFactory,Runtime$1,JSON,console,RemoteDev,Math,$,Date;
 Global=self;
 TodoMvc=Global.TodoMvc=Global.TodoMvc||{};
 Client=TodoMvc.Client=TodoMvc.Client||{};
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 Mvu=WebSharper.Mvu=WebSharper.Mvu||{};
 App=Mvu.App=Mvu.App||{};
 TodoList=Client.TodoList=Client.TodoList||{};
 Model=TodoList.Model=TodoList.Model||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 UI=WebSharper.UI=WebSharper.UI||{};
 Var$1=UI.Var$1=UI.Var$1||{};
 EndPoint=Client.EndPoint=Client.EndPoint||{};
 Mvu_Router=Global.Mvu_Router=Global.Mvu_Router||{};
 Mvu_JsonEncoder=Global.Mvu_JsonEncoder=Global.Mvu_JsonEncoder||{};
 Mvu_JsonDecoder=Global.Mvu_JsonDecoder=Global.Mvu_JsonDecoder||{};
 Mvu_Templates=Global.Mvu_Templates=Global.Mvu_Templates||{};
 Entry=Client.Entry=Client.Entry||{};
 Model$1=Entry.Model=Entry.Model||{};
 Message=Entry.Message=Entry.Message||{};
 Message$1=TodoList.Message=TodoList.Message||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 View=UI.View=UI.View||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 Templating=UI.Templating=UI.Templating||{};
 Runtime=Templating.Runtime=Templating.Runtime||{};
 Server=Runtime.Server=Runtime.Server||{};
 ProviderBuilder=Server.ProviderBuilder=Server.ProviderBuilder||{};
 Handler=Server.Handler=Server.Handler||{};
 Event=Global.Event;
 UIEvent=Global.UIEvent;
 AttrModule=UI.AttrModule=UI.AttrModule||{};
 TemplateInstance=Server.TemplateInstance=Server.TemplateInstance||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 Router=UI.Router=UI.Router||{};
 Var=UI.Var=UI.Var||{};
 Option=WebSharper.Option=WebSharper.Option||{};
 Abbrev=UI.Abbrev=UI.Abbrev||{};
 Fresh=Abbrev.Fresh=Abbrev.Fresh||{};
 Numeric=WebSharper.Numeric=WebSharper.Numeric||{};
 Sitelets=WebSharper.Sitelets=WebSharper.Sitelets||{};
 RouterOperators=Sitelets.RouterOperators=Sitelets.RouterOperators||{};
 ClientSideJson=WebSharper.ClientSideJson=WebSharper.ClientSideJson||{};
 Provider=ClientSideJson.Provider=ClientSideJson.Provider||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 Snap=UI.Snap=UI.Snap||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 List$1=Collections.List=Collections.List||{};
 FromView=UI.FromView=UI.FromView||{};
 System=Global.System=Global.System||{};
 Guid=System.Guid=System.Guid||{};
 AttrProxy=UI.AttrProxy=UI.AttrProxy||{};
 Attrs=UI.Attrs=UI.Attrs||{};
 DomUtility=UI.DomUtility=UI.DomUtility||{};
 Dictionary=Collections.Dictionary=Collections.Dictionary||{};
 HashSet=Collections.HashSet=Collections.HashSet||{};
 Client$1=Runtime.Client=Runtime.Client||{};
 RouterModule=Sitelets.RouterModule=Sitelets.RouterModule||{};
 Route=Sitelets.Route=Sitelets.Route||{};
 JS=JavaScript.JS=JavaScript.JS||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 Router$1=Sitelets.Router=Sitelets.Router||{};
 List$2=Sitelets.List=Sitelets.List||{};
 Object=Global.Object;
 ConcreteVar=UI.ConcreteVar=UI.ConcreteVar||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 T$1=Enumerator.T=Enumerator.T||{};
 Doc=UI.Doc=UI.Doc||{};
 Array=UI.Array=UI.Array||{};
 CheckedInput=UI.CheckedInput=UI.CheckedInput||{};
 DynamicAttrNode=UI.DynamicAttrNode=UI.DynamicAttrNode||{};
 DictionaryUtil=Collections.DictionaryUtil=Collections.DictionaryUtil||{};
 Client$2=UI.Client=UI.Client||{};
 Templates=Client$2.Templates=Client$2.Templates||{};
 Utils=WebSharper.Utils=WebSharper.Utils||{};
 Strings=WebSharper.Strings=WebSharper.Strings||{};
 SC$1=Global.StartupCode$WebSharper_UI$Abbrev=Global.StartupCode$WebSharper_UI$Abbrev||{};
 FSharpMap=Collections.FSharpMap=Collections.FSharpMap||{};
 Docs=UI.Docs=UI.Docs||{};
 Map=Collections.Map=Collections.Map||{};
 Lazy=WebSharper.Lazy=WebSharper.Lazy||{};
 BalancedTree=Collections.BalancedTree=Collections.BalancedTree||{};
 Tree=BalancedTree.Tree=BalancedTree.Tree||{};
 Pair=Collections.Pair=Collections.Pair||{};
 SC$2=Global.StartupCode$WebSharper_UI$Attr_Client=Global.StartupCode$WebSharper_UI$Attr_Client||{};
 DocElemNode=UI.DocElemNode=UI.DocElemNode||{};
 CharacterData=Global.CharacterData;
 Prepare=Templates.Prepare=Templates.Prepare||{};
 Slice=WebSharper.Slice=WebSharper.Slice||{};
 Elt=UI.Elt=UI.Elt||{};
 An=UI.An=UI.An||{};
 Settings=Client$2.Settings=Client$2.Settings||{};
 Mailbox=Abbrev.Mailbox=Abbrev.Mailbox||{};
 LazyExtensionsProxy=WebSharper.LazyExtensionsProxy=WebSharper.LazyExtensionsProxy||{};
 LazyRecord=LazyExtensionsProxy.LazyRecord=LazyExtensionsProxy.LazyRecord||{};
 PathUtil=Sitelets.PathUtil=Sitelets.PathUtil||{};
 HashSetUtil=Collections.HashSetUtil=Collections.HashSetUtil||{};
 Queue=WebSharper.Queue=WebSharper.Queue||{};
 SC$3=Global.StartupCode$WebSharper_UI$DomUtility=Global.StartupCode$WebSharper_UI$DomUtility||{};
 SC$4=Global.StartupCode$WebSharper_UI$Templates=Global.StartupCode$WebSharper_UI$Templates||{};
 Attrs$1=Client$2.Attrs=Client$2.Attrs||{};
 Dyn=Attrs$1.Dyn=Attrs$1.Dyn||{};
 Updates=UI.Updates=UI.Updates||{};
 Docs$1=Client$2.Docs=Client$2.Docs||{};
 RunState=Docs$1.RunState=Docs$1.RunState||{};
 NodeSet=Docs$1.NodeSet=Docs$1.NodeSet||{};
 Anims=UI.Anims=UI.Anims||{};
 SC$5=Global.StartupCode$WebSharper_UI$Doc_Proxy=Global.StartupCode$WebSharper_UI$Doc_Proxy||{};
 MapUtil=Collections.MapUtil=Collections.MapUtil||{};
 KeyCollection=Collections.KeyCollection=Collections.KeyCollection||{};
 String=UI.String=UI.String||{};
 SC$6=Global.StartupCode$WebSharper_UI$Animation=Global.StartupCode$WebSharper_UI$Animation||{};
 Concurrency=WebSharper.Concurrency=WebSharper.Concurrency||{};
 AppendList=UI.AppendList=UI.AppendList||{};
 Char=WebSharper.Char=WebSharper.Char||{};
 Easing=UI.Easing=UI.Easing||{};
 AsyncBody=Concurrency.AsyncBody=Concurrency.AsyncBody||{};
 SC$7=Global.StartupCode$WebSharper_Main$Concurrency=Global.StartupCode$WebSharper_Main$Concurrency||{};
 CT=Concurrency.CT=Concurrency.CT||{};
 HashSet$1=Abbrev.HashSet=Abbrev.HashSet||{};
 Scheduler=Concurrency.Scheduler=Concurrency.Scheduler||{};
 CancellationTokenSource=WebSharper.CancellationTokenSource=WebSharper.CancellationTokenSource||{};
 DomNodes=Docs$1.DomNodes=Docs$1.DomNodes||{};
 Error=Global.Error;
 OperationCanceledException=WebSharper.OperationCanceledException=WebSharper.OperationCanceledException||{};
 SC$8=Global.StartupCode$WebSharper_UI$AppendList=Global.StartupCode$WebSharper_UI$AppendList||{};
 IntelliFactory=Global.IntelliFactory;
 Runtime$1=IntelliFactory&&IntelliFactory.Runtime;
 JSON=Global.JSON;
 console=Global.console;
 RemoteDev=Global.RemoteDev;
 Math=Global.Math;
 $=Global.jQuery;
 Date=Global.Date;
 Client.Main=function()
 {
  var x,x$1,r,r$1;
  App.Run((x=App.withLocalStorage({
   Encode:Mvu_JsonEncoder.j(),
   Decode:Mvu_JsonDecoder.j()
  },"todolist",(x$1=App.CreateSimple(Model.get_Empty(),TodoList.Update,function(d)
  {
   return function(s)
   {
    return TodoList.Render(d,s);
   };
  }),(r=Mvu_Router.r(),App.withRouting(Var$1.Lens(x$1.Var,function(model)
  {
   return model.EndPoint;
  },function($1,$2)
  {
   return Model.New($2,$1.NewTask,$1.Entries,$1.NextKey);
  }),r,function(model)
  {
   return model.EndPoint;
  },x$1)))),App.withRemoteDev({
   Encode:Mvu_JsonEncoder.j$3(),
   Decode:Mvu_JsonDecoder.j$3()
  },{
   Encode:Mvu_JsonEncoder.j(),
   Decode:Mvu_JsonDecoder.j()
  },(r$1={},r$1.hostname="localhost",r$1.port=8000,r$1),x)));
 };
 Operators.FailWith=function(msg)
 {
  throw new Error(msg);
 };
 Operators.KeyValue=function(kvp)
 {
  return[kvp.K,kvp.V];
 };
 App.CreateSimple=function(initModel,update,render)
 {
  function update$1(a,msg,mdl)
  {
   return{
    $:1,
    $0:update(msg,mdl)
   };
  }
  return App.create(initModel,Runtime$1.Curried3(update$1),render);
 };
 App.withRouting=function(lensedRouter,router,getRoute,app)
 {
  return App.New(function(dispatch)
  {
   app.Init(dispatch);
   Router.InstallHashInto(lensedRouter,getRoute(app.Var.Get()),router);
  },app.Var,app.View,app.Update,app.Render);
 };
 App.Run=function(app)
 {
  function dispatch(msg)
  {
   app.Var.UpdateMaybe((app.Update(dispatch))(msg));
  }
  app.Init(dispatch);
  return(app.Render(dispatch))(app.View);
 };
 App.create=function(initModel,update,render)
 {
  var _var;
  _var=Var$1.Create$1(initModel);
  return App.New(Global.ignore,_var,_var.get_View(),update,render);
 };
 App.withLocalStorage=function(serializer,key,app)
 {
  return App.New(function(dispatch)
  {
   var m;
   m=self.localStorage.getItem(key);
   if(m===null)
    void 0;
   else
    try
    {
     app.Var.Set(serializer.Decode(JSON.parse(m)));
    }
    catch(exn)
    {
     console.error("Error deserializing state from local storage",exn);
    }
   app.Init(dispatch);
  },app.Var,View.Map(function(v)
  {
   self.localStorage.setItem(key,JSON.stringify(serializer.Encode(v)));
   return v;
  },app.View),app.Update,app.Render);
 };
 App.withRemoteDev=function(msgSerializer,modelSerializer,options,app)
 {
  var rdev;
  function decode(m)
  {
   return typeof m=="string"?modelSerializer.Decode(JSON.parse(m)):modelSerializer.Decode(m);
  }
  function update(dispatch,msg,model)
  {
   var newModel;
   newModel=((app.Update(dispatch))(msg))(model);
   newModel==null?void 0:rdev.send(msgSerializer.Encode(msg),modelSerializer.Encode(newModel.$0));
   return newModel;
  }
  rdev=RemoteDev.connectViaExtension(options);
  rdev.subscribe(function(msg)
  {
   var $1;
   if(msg.type==="DISPATCH")
    {
     switch(msg.payload.type)
     {
      case"JUMP_TO_STATE":
      case"JUMP_TO_ACTION":
       app.Var.Set(decode(RemoteDev.extractState(msg)));
       break;
      case"IMPORT_STATE":
       app.Var.Set(decode(Arrays.last(msg.payload.nextLiftedState.computedStates).state));
       rdev.send(null,msg.payload.nextLiftedState);
       break;
      default:
       null;
       break;
     }
    }
  });
  return App.New(function(dispatch)
  {
   app.Init(dispatch);
   View.Get(function(st)
   {
    rdev.init(modelSerializer.Encode(st));
   },app.View);
  },app.Var,app.View,Runtime$1.Curried3(update),app.Render);
 };
 Model.get_Empty=function()
 {
  return Model.New(EndPoint.All,"",T.Empty,0);
 };
 Model.New=function(EndPoint$1,NewTask,Entries,NextKey)
 {
  return{
   EndPoint:EndPoint$1,
   NewTask:NewTask,
   Entries:Entries,
   NextKey:NextKey
  };
 };
 TodoList.Update=function(msg,model)
 {
  var c,msg$1,key;
  return msg.$==1?Model.New(model.EndPoint,"",List.append(model.Entries,List.ofArray([Entry.New(model.NextKey,model.NewTask)])),model.NextKey+1):msg.$==2?Model.New(model.EndPoint,model.NewTask,List.filter(function(e)
  {
   return!e.IsCompleted;
  },model.Entries),model.NextKey):msg.$==3?(c=msg.$0,Model.New(model.EndPoint,model.NewTask,List.map(function(e)
  {
   return Model$1.New(e.Id,e.Task,c,e.Editing);
  },model.Entries),model.NextKey)):msg.$==4?(msg$1=msg.$1,(key=msg.$0,Model.New(model.EndPoint,model.NewTask,List.choose(function(e)
  {
   return Entry.KeyOf(e)===key?Entry.Update(msg$1,e):{
    $:1,
    $0:e
   };
  },model.Entries),model.NextKey))):Model.New(model.EndPoint,msg.$0,model.Entries,model.NextKey);
 };
 TodoList.Render=function(dispatch,state)
 {
  var countNotCompleted,b,C,C$1,C$2,I,t,v,v$1,t$1,E,p;
  countNotCompleted=View.Map(function($1)
  {
   return List.length(List.filter(function(e)
   {
    return!e.IsCompleted;
   },$1.Entries));
  },state);
  b=(C=AttrModule.DynamicClassPred("selected",View.Map(function($1)
  {
   return $1.EndPoint.$===2;
  },state)),(C$1=AttrModule.DynamicClassPred("selected",View.Map(function($1)
  {
   return $1.EndPoint.$===1;
  },state)),(C$2=AttrModule.DynamicClassPred("selected",View.Map(function($1)
  {
   return $1.EndPoint.$===0;
  },state)),(I=View.Map(function($1)
  {
   return $1===1?"1 item left":Global.String($1)+" items left";
  },countNotCompleted),(t=(v=View.Map(function($1)
  {
   return $1.NewTask;
  },state),(v$1=View.Map(function($1)
  {
   return $1===0;
  },countNotCompleted),(t$1=(E=Doc.ConvertSeqBy(Entry.KeyOf,function(key)
  {
   return function(entry)
   {
    return Entry.Render(function(msg)
    {
     dispatch({
      $:4,
      $0:key,
      $1:msg
     });
    },View.Map(function($1)
    {
     return $1.EndPoint;
    },state),entry);
   };
  },View.Map(function($1)
  {
   return $1.Entries;
  },state)),ProviderBuilder.Make().WithHole({
   $:0,
   $0:"entries",
   $1:E
  })),t$1.WithHole(Handler.EventQ2(t$1.k,"clearcompleted",function()
  {
   return t$1.i;
  },function()
  {
   dispatch(Message$1.ClearCompleted);
  }))).WithHole({
   $:9,
   $0:"iscompleted",
   $1:new FromView.New(v$1,function(c)
   {
    dispatch({
     $:3,
     $0:c
    });
   })
  })).WithHole({
   $:8,
   $0:"task",
   $1:new FromView.New(v,function(text)
   {
    dispatch({
     $:0,
     $0:text
    });
   })
  })),t.WithHole(Handler.EventQ2(t.k,"edit",function()
  {
   return t.i;
  },function(e)
  {
   if(e.Event.key==="Enter")
    {
     dispatch(Message$1.AddEntry);
     e.Event.preventDefault();
    }
  }))).WithHole({
   $:2,
   $0:"itemsleft",
   $1:I
  })).WithHole({
   $:3,
   $0:"cssfilterall",
   $1:C$2
  })).WithHole({
   $:3,
   $0:"cssfilteractive",
   $1:C$1
  })).WithHole({
   $:3,
   $0:"cssfiltercompleted",
   $1:C
  }));
  p=Handler.CompleteHoles(b.k,b.h,[["task",0],["iscompleted",2]]);
  b.i=new TemplateInstance.New(p[1],Templates.RunFullDocTemplate(p[0]));
 };
 Obj=WebSharper.Obj=Runtime$1.Class({
  Equals:function(obj)
  {
   return this===obj;
  },
  GetHashCode:function()
  {
   return -1;
  }
 },null,Obj);
 Obj.New=Runtime$1.Ctor(function()
 {
 },Obj);
 Var$1=UI.Var$1=Runtime$1.Class({},Obj,Var$1);
 Var$1.Lens=function(_var,get,update)
 {
  var id,view,$1;
  id=Fresh.Id();
  view=View.Map(get,_var.get_View());
  $1=new Var({
   Get:function()
   {
    return get(_var.Get());
   },
   Set:function(v)
   {
    return _var.Update(function(t)
    {
     return update(t,v);
    });
   },
   SetFinal:function(v)
   {
    return this.Set(v);
   },
   Update:function(f)
   {
    return _var.Update(function(t)
    {
     return update(t,f(get(t)));
    });
   },
   UpdateMaybe:function(f)
   {
    return _var.UpdateMaybe(function(t)
    {
     var x;
     x=f(get(t));
     return x==null?null:{
      $:1,
      $0:update(t,x.$0)
     };
    });
   },
   get_View:function()
   {
    return view;
   },
   get_Id:function()
   {
    return id;
   }
  });
  Var.New.call($1);
  return $1;
 };
 Var$1.Create$1=function(v)
 {
  return new ConcreteVar.New(false,Snap.New({
   $:2,
   $0:v,
   $1:[]
  }),v);
 };
 Var$1.Set=function(_var,value)
 {
  _var.Set(value);
 };
 App.New=function(Init,Var$2,View$1,Update,Render)
 {
  return{
   Init:Init,
   Var:Var$2,
   View:View$1,
   Update:Update,
   Render:Render
  };
 };
 EndPoint.All={
  $:0
 };
 Mvu_Router.r=function()
 {
  return RouterOperators.JSUnion(void 0,[[null,[[null,[]]],[]],[null,[[null,["active"]]],[]],[null,[[null,["completed"]]],[]]]);
 };
 Mvu_JsonEncoder.j=function()
 {
  return Mvu_JsonEncoder._v?Mvu_JsonEncoder._v:Mvu_JsonEncoder._v=(Provider.EncodeRecord(void 0,[["EndPoint",Mvu_JsonEncoder.j$1,0],["NewTask",Provider.Id(),0],["Entries",Provider.EncodeList(Mvu_JsonEncoder.j$2),0],["NextKey",Provider.Id(),0]]))();
 };
 Mvu_JsonDecoder.j=function()
 {
  return Mvu_JsonDecoder._v?Mvu_JsonDecoder._v:Mvu_JsonDecoder._v=(Provider.DecodeRecord(void 0,[["EndPoint",Mvu_JsonDecoder.j$1,0],["NewTask",Provider.Id(),0],["Entries",Provider.DecodeList(Mvu_JsonDecoder.j$2),0],["NextKey",Provider.Id(),0]]))();
 };
 Mvu_JsonEncoder.j$3=function()
 {
  return Mvu_JsonEncoder._v$3?Mvu_JsonEncoder._v$3:Mvu_JsonEncoder._v$3=(Provider.EncodeUnion(void 0,"type",[["EditNewTask",[["$0","text",Provider.Id(),0]]],["AddEntry",[]],["ClearCompleted",[]],["SetAllCompleted",[["$0","completed",Provider.Id(),0]]],["EntryMessage",[["$0","key",Provider.Id(),0],["$1","message",Mvu_JsonEncoder.j$4,0]]]]))();
 };
 Mvu_JsonDecoder.j$3=function()
 {
  return Mvu_JsonDecoder._v$3?Mvu_JsonDecoder._v$3:Mvu_JsonDecoder._v$3=(Provider.DecodeUnion(void 0,"type",[["EditNewTask",[["$0","text",Provider.Id(),0]]],["AddEntry",[]],["ClearCompleted",[]],["SetAllCompleted",[["$0","completed",Provider.Id(),0]]],["EntryMessage",[["$0","key",Provider.Id(),0],["$1","message",Mvu_JsonDecoder.j$4,0]]]]))();
 };
 Mvu_JsonEncoder.j$1=function()
 {
  return Mvu_JsonEncoder._v$1?Mvu_JsonEncoder._v$1:Mvu_JsonEncoder._v$1=(Provider.EncodeUnion(void 0,"$",[[0,[]],[1,[]],[2,[]]]))();
 };
 Mvu_JsonEncoder.j$2=function()
 {
  return Mvu_JsonEncoder._v$2?Mvu_JsonEncoder._v$2:Mvu_JsonEncoder._v$2=(Provider.EncodeRecord(void 0,[["Id",Provider.Id(),0],["Task",Provider.Id(),0],["IsCompleted",Provider.Id(),0],["Editing",Provider.Id(),1]]))();
 };
 Mvu_JsonDecoder.j$1=function()
 {
  return Mvu_JsonDecoder._v$1?Mvu_JsonDecoder._v$1:Mvu_JsonDecoder._v$1=(Provider.DecodeUnion(void 0,"$",[[0,[]],[1,[]],[2,[]]]))();
 };
 Mvu_JsonDecoder.j$2=function()
 {
  return Mvu_JsonDecoder._v$2?Mvu_JsonDecoder._v$2:Mvu_JsonDecoder._v$2=(Provider.DecodeRecord(void 0,[["Id",Provider.Id(),0],["Task",Provider.Id(),0],["IsCompleted",Provider.Id(),0],["Editing",Provider.Id(),1]]))();
 };
 Mvu_JsonEncoder.j$4=function()
 {
  return Mvu_JsonEncoder._v$4?Mvu_JsonEncoder._v$4:Mvu_JsonEncoder._v$4=(Provider.EncodeUnion(void 0,"type",[["Remove",[]],["StartEdit",[]],["Edit",[["$0","text",Provider.Id(),0]]],["CommitEdit",[]],["CancelEdit",[]],["SetCompleted",[["$0","completed",Provider.Id(),0]]]]))();
 };
 Mvu_JsonDecoder.j$4=function()
 {
  return Mvu_JsonDecoder._v$4?Mvu_JsonDecoder._v$4:Mvu_JsonDecoder._v$4=(Provider.DecodeUnion(void 0,"type",[["Remove",[]],["StartEdit",[]],["Edit",[["$0","text",Provider.Id(),0]]],["CommitEdit",[]],["CancelEdit",[]],["SetCompleted",[["$0","completed",Provider.Id(),0]]]]))();
 };
 Mvu_Templates.entry=function(h)
 {
  Templates.LoadLocalTemplates("index");
  return h?Templates.NamedTemplate("index",{
   $:1,
   $0:"entry"
  },h):void 0;
 };
 Model$1.New=function(Id,Task,IsCompleted,Editing)
 {
  return{
   Id:Id,
   Task:Task,
   IsCompleted:IsCompleted,
   Editing:Editing
  };
 };
 Message.CommitEdit={
  $:3
 };
 Message.CancelEdit={
  $:4
 };
 Message.Remove={
  $:0
 };
 Message.StartEdit={
  $:1
 };
 Message$1.ClearCompleted={
  $:2
 };
 Message$1.AddEntry={
  $:1
 };
 T=List.T=Runtime$1.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.filter=function(p,l)
 {
  return List.ofSeq(Seq.filter(p,l));
 };
 List.map=function(f,x)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return x;
  else
   {
    res=new T({
     $:1
    });
    r=res;
    l=x;
    go=true;
    while(go)
     {
      r.$0=f(l.$0);
      l=l.$1;
      l.$==0?go=false:r=(t=new T({
       $:1
      }),r.$1=t,t);
     }
    r.$1=T.Empty;
    return res;
   }
 };
 List.choose=function(f,l)
 {
  return List.ofSeq(Seq.choose(f,l));
 };
 List.length=function(l)
 {
  var r,i;
  r=l;
  i=0;
  while(r.$==1)
   {
    r=List.tail(r);
    i=i+1;
   }
  return i;
 };
 List.append=function(x,y)
 {
  var r,l,go,res,t;
  if(x.$==0)
   return y;
  else
   if(y.$==0)
    return x;
   else
    {
     res=new T({
      $:1
     });
     r=res;
     l=x;
     go=true;
     while(go)
      {
       r.$0=l.$0;
       l=l.$1;
       l.$==0?go=false:r=(t=new T({
        $:1
       }),r.$1=t,t);
      }
     r.$1=y;
     return res;
    }
 };
 List.ofSeq=function(s)
 {
  var e,$1,go,r,res,t;
  if(s instanceof T)
   return s;
  else
   if(s instanceof Global.Array)
    return List.ofArray(s);
   else
    {
     e=Enumerator.Get(s);
     try
     {
      go=e.MoveNext();
      if(!go)
       $1=T.Empty;
      else
       {
        res=new T({
         $:1
        });
        r=res;
        while(go)
         {
          r.$0=e.Current();
          e.MoveNext()?r=(t=new T({
           $:1
          }),r.$1=t,t):go=false;
         }
        r.$1=T.Empty;
        $1=res;
       }
      return $1;
     }
     finally
     {
      if(typeof e=="object"&&"Dispose"in e)
       e.Dispose();
     }
    }
 };
 List.rev=function(l)
 {
  var res,r;
  res=T.Empty;
  r=l;
  while(r.$==1)
   {
    res=new T({
     $:1,
     $0:r.$0,
     $1:res
    });
    r=r.$1;
   }
  return res;
 };
 List.iter=function(f,l)
 {
  var r;
  r=l;
  while(r.$==1)
   {
    f(List.head(r));
    r=List.tail(r);
   }
 };
 List.init=function(s,f)
 {
  return List.ofArray(Arrays.init(s,f));
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 Entry.New=function(key,task)
 {
  return Model$1.New(key,task,false,null);
 };
 Entry.KeyOf=function(e)
 {
  return e.Id;
 };
 Entry.Update=function(msg,e)
 {
  var o;
  return msg.$==1?{
   $:1,
   $0:Model$1.New(e.Id,e.Task,e.IsCompleted,{
    $:1,
    $0:e.Task
   })
  }:msg.$==2?{
   $:1,
   $0:Model$1.New(e.Id,e.Task,e.IsCompleted,{
    $:1,
    $0:msg.$0
   })
  }:msg.$==3?{
   $:1,
   $0:Model$1.New(e.Id,(o=e.Editing,o==null?e.Task:o.$0),e.IsCompleted,null)
  }:msg.$==4?{
   $:1,
   $0:Model$1.New(e.Id,e.Task,e.IsCompleted,null)
  }:msg.$==5?{
   $:1,
   $0:Model$1.New(e.Id,e.Task,msg.$0,e.Editing)
  }:null;
 };
 Entry.Render=function(dispatch,endpoint,entry)
 {
  var b,t,t$1,v,t$2,t$3,v$1,C,L,p,i;
  return(b=(t=(t$1=(v=View.Map(function($1)
  {
   return $1.IsCompleted;
  },entry),(t$2=(t$3=(v$1=View.Map(function($1)
  {
   var o;
   o=$1.Editing;
   return o==null?"":o.$0;
  },entry),(C=[AttrModule.DynamicClassPred("completed",View.Map(function($1)
  {
   return $1.IsCompleted;
  },entry)),AttrModule.DynamicClassPred("editing",View.Map(function($1)
  {
   return $1.Editing!=null;
  },entry)),AttrModule.DynamicClassPred("hidden",View.Map2(function($1,$2)
  {
   return $1.$==2?!$2.IsCompleted:$1.$==1&&$2.IsCompleted;
  },endpoint,entry))],(L=Doc.TextView(View.Map(function($1)
  {
   return $1.Task;
  },entry)),ProviderBuilder.Make().WithHole({
   $:0,
   $0:"label",
   $1:L
  })).WithHole({
   $:3,
   $0:"cssattrs",
   $1:AttrProxy.Concat(C)
  })).WithHole({
   $:8,
   $0:"editingtask",
   $1:new FromView.New(v$1,function(text)
   {
    dispatch({
     $:2,
     $0:text
    });
   })
  })),t$3.WithHole(Handler.EventQ2(t$3.k,"editblur",function()
  {
   return t$3.i;
  },function()
  {
   dispatch(Message.CommitEdit);
  }))),t$2.WithHole(Handler.EventQ2(t$2.k,"editkeyup",function()
  {
   return t$2.i;
  },function(e)
  {
   var m;
   m=e.Event.key;
   m==="Enter"?dispatch(Message.CommitEdit):m==="Escape"?dispatch(Message.CancelEdit):void 0;
  }))).WithHole({
   $:9,
   $0:"iscompleted",
   $1:new FromView.New(v,function(x)
   {
    dispatch({
     $:5,
     $0:x
    });
   })
  })),t$1.WithHole(Handler.EventQ2(t$1.k,"remove",function()
  {
   return t$1.i;
  },function()
  {
   dispatch(Message.Remove);
  }))),t.WithHole(Handler.EventQ2(t.k,"startedit",function()
  {
   return t.i;
  },function()
  {
   dispatch(Message.StartEdit);
  }))),(p=Handler.CompleteHoles(b.k,b.h,[["iscompleted",2],["editingtask",0]]),(i=new TemplateInstance.New(p[1],Mvu_Templates.entry(p[0])),(b.i=i,i)))).get_Doc();
 };
 View.Map=function(fn,a)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map(fn,a());
  });
 };
 View.CreateLazy=function(observe)
 {
  var lv;
  lv={
   c:null,
   o:observe
  };
  return function()
  {
   var c,$1;
   c=lv.c;
   return c===null?(c=lv.o(),lv.c=c,($1=c.s,$1!=null&&$1.$==0)?lv.o=null:Snap.WhenObsoleteRun(c,function()
   {
    lv.c=null;
   }),c):c;
  };
 };
 View.Map2=function(fn,a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2(fn,a(),a$1());
  });
 };
 View.Sink=function(act,a)
 {
  function loop()
  {
   Snap.WhenRun(a(),act,function()
   {
    Concurrency.scheduler().Fork(loop);
   });
  }
  Concurrency.scheduler().Fork(loop);
 };
 View.Get=function(f,a)
 {
  var ok;
  function obs()
  {
   Snap.WhenRun(a(),function(v)
   {
    if(!ok[0])
     {
      ok[0]=true;
      f(v);
     }
   },function()
   {
    if(!ok[0])
     obs();
   });
  }
  ok=[false];
  obs();
 };
 View.TryGet=function(a)
 {
  return Snap.TryGet(a());
 };
 View.MapSeqCachedViewBy=function(key,conv,view)
 {
  var state;
  state=[new Dictionary.New$5()];
  return View.Map(function(xs)
  {
   var prevState,newState,result;
   prevState=state[0];
   newState=new Dictionary.New$5();
   result=Array.mapInPlace(function(x)
   {
    var k,node,n;
    k=key(x);
    node=prevState.ContainsKey(k)?(n=prevState.get_Item(k),(Var$1.Set(n.r,x),n)):View.ConvertSeqNode(function(v)
    {
     return conv(k,v);
    },x);
    newState.set_Item(k,node);
    return node.e;
   },Arrays.ofSeq(xs));
   state[0]=newState;
   return result;
  },view);
 };
 View.Const=function(x)
 {
  var o;
  o=Snap.New({
   $:0,
   $0:x
  });
  return function()
  {
   return o;
  };
 };
 View.ConvertSeqNode=function(conv,value)
 {
  var _var,view;
  _var=Var$1.Create$1(value);
  view=_var.get_View();
  return{
   e:conv(view),
   r:_var,
   w:view
  };
 };
 View.Bind=function(fn,view)
 {
  return View.Join(View.Map(fn,view));
 };
 View.Map3=function(fn,a,a$1,a$2)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map3(fn,a(),a$1(),a$2());
  });
 };
 View.Sequence=function(views)
 {
  return View.CreateLazy(function()
  {
   return Snap.Sequence(Seq.map(function(a)
   {
    return a();
   },views));
  });
 };
 View.Map2Unit=function(a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2Unit(a(),a$1());
  });
 };
 View.Join=function(a)
 {
  return View.CreateLazy(function()
  {
   return Snap.Join(a());
  });
 };
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.set=function(arr,n,x)
 {
  Arrays.checkBounds(arr,n);
  arr[n]=x;
 };
 ProviderBuilder=Server.ProviderBuilder=Runtime$1.Class({
  WithHole:function(h)
  {
   this.h.push(h);
   return this;
  }
 },null,ProviderBuilder);
 ProviderBuilder.Make=function()
 {
  var c;
  return ProviderBuilder.New(null,(c=Guid.NewGuid(),Global.String(c)),[]);
 };
 ProviderBuilder.New=function(Instance,Key,Holes)
 {
  return new ProviderBuilder({
   i:Instance,
   k:Key,
   h:Holes
  });
 };
 Handler.EventQ2=function(key,holeName,ti,f)
 {
  return{
   $:5,
   $0:holeName,
   $1:true,
   $2:function(el)
   {
    return function(ev)
    {
     return f({
      Vars:ti(),
      Target:el,
      Event:ev
     });
    };
   }
  };
 };
 Handler.CompleteHoles=function(a,filledHoles,vars)
 {
  var allVars,filledVars,e,h,$1,n;
  function c(name,ty)
  {
   var p,r,r$1,r$2;
   return filledVars.Contains(name)?null:(p=ty===0?(r=Var$1.Create$1(""),[{
    $:8,
    $0:name,
    $1:r
   },r]):ty===1?(r$1=Var$1.Create$1(0),[{
    $:13,
    $0:name,
    $1:r$1
   },r$1]):ty===2?(r$2=Var$1.Create$1(false),[{
    $:9,
    $0:name,
    $1:r$2
   },r$2]):Operators.FailWith("Invalid value type"),(allVars.set_Item(name,p[1]),{
    $:1,
    $0:p[0]
   }));
  }
  allVars=new Dictionary.New$5();
  filledVars=new HashSet.New$3();
  e=Enumerator.Get(filledHoles);
  try
  {
   while(e.MoveNext())
    {
     h=e.Current();
     (h.$==8?($1=[h.$0,Client$1.Box(h.$1)],true):h.$==11?($1=[h.$0,Client$1.Box(h.$1)],true):h.$==10?($1=[h.$0,Client$1.Box(h.$1)],true):h.$==13?($1=[h.$0,Client$1.Box(h.$1)],true):h.$==12?($1=[h.$0,Client$1.Box(h.$1)],true):h.$==9&&($1=[h.$0,Client$1.Box(h.$1)],true))?(n=$1[0],filledVars.Add(n),allVars.set_Item(n,$1[1])):void 0;
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return[Seq.append(filledHoles,Arrays.choose(function($2)
  {
   return c($2[0],$2[1]);
  },vars)),{
   $:0,
   $0:allVars
  }];
 };
 AttrModule.ClassPred=function(name,isSet)
 {
  return Attrs.Static(function(el)
  {
   if(isSet)
    DomUtility.AddClass(el,name);
   else
    DomUtility.RemoveClass(el,name);
  });
 };
 AttrModule.DynamicClassPred=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    return v?DomUtility.AddClass(el,name):DomUtility.RemoveClass(el,name);
   };
  });
 };
 AttrModule.Handler=function(name,callback)
 {
  return Attrs.Static(function(el)
  {
   el.addEventListener(name,function(d)
   {
    return(callback(el))(d);
   },false);
  });
 };
 AttrModule.OnAfterRender=function(callback)
 {
  return new AttrProxy({
   $:4,
   $0:callback
  });
 };
 AttrModule.Value=function(_var)
 {
  function g(a)
  {
   return{
    $:1,
    $0:a
   };
  }
  return AttrModule.CustomValue(_var,Global.id,function(x)
  {
   return g(Global.id(x));
  });
 };
 AttrModule.Checked=function(_var)
 {
  function onSet(el,ev)
  {
   return!Unchecked.Equals(_var.Get(),el.checked)?_var.Set(el.checked):null;
  }
  return AttrProxy.Concat([AttrModule.DynamicProp("checked",_var.get_View()),AttrModule.Handler("change",function($1)
  {
   return function($2)
   {
    return onSet($1,$2);
   };
  })]);
 };
 AttrModule.IntValue=function(_var)
 {
  return AttrModule.CustomVar(_var,function($1,$2)
  {
   var i;
   i=$2.get_Input();
   return $1.value!==i?void($1.value=i):null;
  },function(el)
  {
   var s,m,o;
   s=el.value;
   return{
    $:1,
    $0:String.isBlank(s)?(el.checkValidity?el.checkValidity():true)?new CheckedInput({
     $:2,
     $0:s
    }):new CheckedInput({
     $:1,
     $0:s
    }):(m=(o=0,[Numeric.TryParseInt32(s,{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]),m[0]?new CheckedInput({
     $:0,
     $0:m[1],
     $1:s
    }):new CheckedInput({
     $:1,
     $0:s
    }))
   };
  });
 };
 AttrModule.IntValueUnchecked=function(_var)
 {
  return AttrModule.CustomValue(_var,Global.String,function(s)
  {
   var pd;
   return String.isBlank(s)?{
    $:1,
    $0:0
   }:(pd=+s,pd!==pd>>0?null:{
    $:1,
    $0:pd
   });
  });
 };
 AttrModule.FloatValue=function(_var)
 {
  return AttrModule.CustomVar(_var,function($1,$2)
  {
   var i;
   i=$2.get_Input();
   return $1.value!==i?void($1.value=i):null;
  },function(el)
  {
   var s,i;
   s=el.value;
   return{
    $:1,
    $0:String.isBlank(s)?(el.checkValidity?el.checkValidity():true)?new CheckedInput({
     $:2,
     $0:s
    }):new CheckedInput({
     $:1,
     $0:s
    }):(i=+s,Global.isNaN(i)?new CheckedInput({
     $:1,
     $0:s
    }):new CheckedInput({
     $:0,
     $0:i,
     $1:s
    }))
   };
  });
 };
 AttrModule.FloatValueUnchecked=function(_var)
 {
  return AttrModule.CustomValue(_var,Global.String,function(s)
  {
   var pd;
   return String.isBlank(s)?{
    $:1,
    $0:0
   }:(pd=+s,Global.isNaN(pd)?null:{
    $:1,
    $0:pd
   });
  });
 };
 AttrModule.Dynamic=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    return DomUtility.SetAttr(el,name,v);
   };
  });
 };
 AttrModule.CustomValue=function(_var,toString,fromString)
 {
  return AttrModule.CustomVar(_var,function($1,$2)
  {
   $1.value=toString($2);
  },function(e)
  {
   return fromString(e.value);
  });
 };
 AttrModule.DynamicProp=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    el[name]=v;
   };
  });
 };
 AttrModule.CustomVar=function(_var,set,get)
 {
  function onChange(el,e)
  {
   return _var.UpdateMaybe(function(v)
   {
    var m,$1;
    m=get(el);
    return m!=null&&m.$==1&&(!Unchecked.Equals(m.$0,v)&&($1=[m,m.$0],true))?$1[0]:null;
   });
  }
  function set$1(e,v)
  {
   var m,$1;
   m=get(e);
   return m!=null&&m.$==1&&(Unchecked.Equals(m.$0,v)&&($1=m.$0,true))?null:set(e,v);
  }
  return AttrProxy.Concat([AttrModule.Handler("change",function($1)
  {
   return function($2)
   {
    return onChange($1,$2);
   };
  }),AttrModule.Handler("input",function($1)
  {
   return function($2)
   {
    return onChange($1,$2);
   };
  }),AttrModule.Handler("keypress",function($1)
  {
   return function($2)
   {
    return onChange($1,$2);
   };
  }),AttrModule.DynamicCustom(function($1)
  {
   return function($2)
   {
    return set$1($1,$2);
   };
  },_var.get_View())]);
 };
 AttrModule.DynamicCustom=function(set,view)
 {
  return Attrs.Dynamic(view,set);
 };
 TemplateInstance=Server.TemplateInstance=Runtime$1.Class({
  get_Doc:function()
  {
   return this.doc;
  }
 },Obj,TemplateInstance);
 TemplateInstance.New=Runtime$1.Ctor(function(c,doc)
 {
  Obj.New.call(this);
  this.doc=doc;
  this.allVars=c.$==0?c.$0:Operators.FailWith("Should not happen");
 },TemplateInstance);
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.Hash=function(o)
 {
  var m;
  m=typeof o;
  return m=="function"?0:m=="boolean"?o?1:0:m=="number"?o:m=="string"?Unchecked.hashString(o):m=="object"?o==null?0:o instanceof Global.Array?Unchecked.hashArray(o):Unchecked.hashObject(o):0;
 };
 Unchecked.hashString=function(s)
 {
  var hash,i,$1;
  if(s===null)
   return 0;
  else
   {
    hash=5381;
    for(i=0,$1=s.length-1;i<=$1;i++)hash=Unchecked.hashMix(hash,s[i].charCodeAt());
    return hash;
   }
 };
 Unchecked.hashArray=function(o)
 {
  var h,i,$1;
  h=-34948909;
  for(i=0,$1=Arrays.length(o)-1;i<=$1;i++)h=Unchecked.hashMix(h,Unchecked.Hash(Arrays.get(o,i)));
  return h;
 };
 Unchecked.hashObject=function(o)
 {
  var h,k;
  if("GetHashCode"in o)
   return o.GetHashCode();
  else
   {
    h=[0];
    for(var k$1 in o)if(function(key)
    {
     h[0]=Unchecked.hashMix(Unchecked.hashMix(h[0],Unchecked.hashString(key)),Unchecked.Hash(o[key]));
     return false;
    }(k$1))
     break;
    return h[0];
   }
 };
 Unchecked.hashMix=function(x,y)
 {
  return(x<<5)+x+y;
 };
 Unchecked.Compare=function(a,b)
 {
  var $1,m,$2,cmp,k,k$1;
  if(a===b)
   return 0;
  else
   {
    m=typeof a;
    switch(m=="function"?1:m=="boolean"?2:m=="number"?2:m=="string"?2:m=="object"?3:0)
    {
     case 0:
      return typeof b=="undefined"?0:-1;
     case 1:
      return Operators.FailWith("Cannot compare function values.");
     case 2:
      return a<b?-1:1;
     case 3:
      if(a===null)
       $2=-1;
      else
       if(b===null)
        $2=1;
       else
        if("CompareTo"in a)
         $2=a.CompareTo(b);
        else
         if("CompareTo0"in a)
          $2=a.CompareTo0(b);
         else
          if(a instanceof Global.Array&&b instanceof Global.Array)
           $2=Unchecked.compareArrays(a,b);
          else
           if(a instanceof Global.Date&&b instanceof Global.Date)
            $2=Unchecked.compareDates(a,b);
           else
            {
             cmp=[0];
             for(var k$2 in a)if(function(k$3)
             {
              return!a.hasOwnProperty(k$3)?false:!b.hasOwnProperty(k$3)?(cmp[0]=1,true):(cmp[0]=Unchecked.Compare(a[k$3],b[k$3]),cmp[0]!==0);
             }(k$2))
              break;
             if(cmp[0]===0)
              {
               for(var k$3 in b)if(function(k$4)
               {
                return!b.hasOwnProperty(k$4)?false:!a.hasOwnProperty(k$4)&&(cmp[0]=-1,true);
               }(k$3))
                break;
              }
             $2=cmp[0];
            }
      return $2;
    }
   }
 };
 Unchecked.compareArrays=function(a,b)
 {
  var cmp,i;
  if(Arrays.length(a)<Arrays.length(b))
   return -1;
  else
   if(Arrays.length(a)>Arrays.length(b))
    return 1;
   else
    {
     cmp=0;
     i=0;
     while(cmp===0&&i<Arrays.length(a))
      {
       cmp=Unchecked.Compare(Arrays.get(a,i),Arrays.get(b,i));
       i=i+1;
      }
     return cmp;
    }
 };
 Unchecked.compareDates=function(a,b)
 {
  return Unchecked.Compare(a.getTime(),b.getTime());
 };
 Router.InstallHashInto=function(_var,onParseError,router)
 {
  function parse(h)
  {
   return RouterModule.Parse(router,Route.FromHash(h,{
    $:1,
    $0:true
   }));
  }
  function cur()
  {
   return Router.getCurrentHash(parse,onParseError);
  }
  function set(value)
  {
   if(!Unchecked.Equals(_var.Get(),value))
    _var.Set(value);
  }
  self.addEventListener("popstate",function()
  {
   return set(cur());
  },false);
  self.addEventListener("hashchange",function()
  {
   return set(cur());
  },false);
  self.document.body.addEventListener("click",function(ev)
  {
   var o,o$1,href;
   o=(o$1=Router.findLinkHref(ev.target),o$1==null?null:(href=o$1.$0,Strings.StartsWith(href,"#")?parse(href):null));
   return o==null?null:(set(o.$0),ev.preventDefault());
  },false);
  View.Sink(function(value)
  {
   var url;
   if(!Unchecked.Equals(value,cur()))
    {
     url=RouterModule.HashLink(router,value);
     self.history.pushState(null,null,url);
    }
  },_var.get_View());
 };
 Router.getCurrentHash=function(parse,onParseError)
 {
  var h,m;
  h=self.location.hash;
  m=parse(h);
  return m==null?((function($1)
  {
   return function($2)
   {
    return $1("Failed to parse route: "+Utils.toSafe($2));
   };
  }(function(s)
  {
   console.log(s);
  }))(h),onParseError):m.$0;
 };
 Router.findLinkHref=function(n)
 {
  while(true)
   if(n.tagName==="A")
    return Option.ofObj(n.getAttribute("href"));
   else
    if(n===self.document.body)
     return null;
    else
     n=n.parentNode;
 };
 Var=UI.Var=Runtime$1.Class({},Obj,Var);
 Var.New=Runtime$1.Ctor(function()
 {
  Obj.New.call(this);
 },Var);
 Option.ofObj=function(o)
 {
  return o==null?null:{
   $:1,
   $0:o
  };
 };
 Fresh.Id=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return"uid"+Global.String(Fresh.counter());
 };
 Fresh.set_counter=function($1)
 {
  SC$1.$cctor();
  SC$1.counter=$1;
 };
 Fresh.counter=function()
 {
  SC$1.$cctor();
  return SC$1.counter;
 };
 Fresh.Int=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return Fresh.counter();
 };
 Numeric.TryParseInt32=function(s,r)
 {
  return Numeric.TryParse(s,-2147483648,2147483647,r);
 };
 RouterOperators.JSUnion=function(t,cases)
 {
  var parseCases;
  function getTag(value)
  {
   var constIndex;
   function p($1)
   {
    return $1!=null&&$1.$==1&&Unchecked.Equals(value,$1.$0);
   }
   constIndex=Seq.tryFindIndex(function($1)
   {
    return p($1[0]);
   },cases);
   return constIndex!=null&&constIndex.$==1?constIndex.$0:value.$;
  }
  function readFields(tag,value)
  {
   return Arrays.init(Arrays.length((Arrays.get(cases,tag))[2]),function(i)
   {
    return value["$"+Global.String(i)];
   });
  }
  function createCase(tag,fieldValues)
  {
   var o,m$1,$1;
   o=t==null?{}:new t();
   m$1=Arrays.get(cases,tag);
   return($1=m$1[0],$1!=null&&$1.$==1)?m$1[0].$0:(o.$=tag,Seq.iteri(function(i,v)
   {
    o["$"+Global.String(i)]=v;
   },fieldValues),o);
  }
  function m(i,a)
  {
   var fields;
   function m$1(m$2,p)
   {
    return[i,m$2,p,fields];
   }
   fields=a[2];
   return Seq.map(function($1)
   {
    return m$1($1[0],$1[1]);
   },a[1]);
  }
  parseCases=Seq.collect(function($1)
  {
   return m($1[0],$1[1]);
  },Seq.indexed(cases));
  return Router$1.New$1(function(path)
  {
   function m$1(i,m$2,s,fields)
   {
    var m$3,p,m$4;
    function collect(fields$1,path$1,acc)
    {
     var t$1;
     function m$5(p$1,a)
     {
      return collect(t$1,p$1,new T({
       $:1,
       $0:a,
       $1:acc
      }));
     }
     return fields$1.$==1?(t$1=fields$1.$1,Seq.collect(function($1)
     {
      return m$5($1[0],$1[1]);
     },fields$1.$0.Parse(path$1))):[[path$1,createCase(i,Arrays.ofList(List.rev(acc)))]];
    }
    return RouterOperators.isCorrectMethod(m$2,path.Method)?(m$3=List$2.startsWith(List.ofArray(s),path.Segments),m$3==null?[]:(p=m$3.$0,(m$4=List.ofArray(fields),m$4.$==0?[[Route.New(p,path.QueryArgs,path.FormData,path.Method,path.Body),createCase(i,[])]]:collect(m$4,Route.New(p,path.QueryArgs,path.FormData,path.Method,path.Body),T.Empty)))):[];
   }
   return Seq.collect(function($1)
   {
    return m$1($1[0],$1[1],$1[2],$1[3]);
   },parseCases);
  },function(value)
  {
   var tag,p,fields,p$1,casePath,fieldParts;
   function m$1(v,f)
   {
    return f.Write(v);
   }
   tag=getTag(value);
   p=Arrays.get(cases,tag);
   fields=p[2];
   p$1=Arrays.get(p[1],0);
   casePath=[Route.Segment(List.ofArray(p$1[1]),p$1[0])];
   return!Unchecked.Equals(fields,null)&&fields.length===0?{
    $:1,
    $0:casePath
   }:(fieldParts=(((Runtime$1.Curried3(Arrays.map2))(m$1))(readFields(tag,value)))(fields),Arrays.forall(function(o)
   {
    return o!=null;
   },fieldParts)?{
    $:1,
    $0:Seq.append(casePath,Seq.collect(function(o)
    {
     return o.$0;
    },fieldParts))
   }:null);
  });
 };
 RouterOperators.isCorrectMethod=function(m,p)
 {
  return p!=null&&p.$==1?m!=null&&m.$==1?Unchecked.Equals(p.$0,m.$0):true:!(m!=null&&m.$==1);
 };
 Provider.EncodeRecord=function(a,fields)
 {
  return function()
  {
   return function(x)
   {
    var o;
    function a$1(name,enc,kind)
    {
     var m;
     if(kind===0)
      o[name]=(enc(null))(x[name]);
     else
      if(kind===1)
       {
        m=x[name];
        m==null?void 0:o[name]=(enc(null))(m.$0);
       }
      else
       if(kind===2)
       {
        if(x.hasOwnProperty(name))
         o[name]=(enc(null))(x[name]);
       }
       else
        if(kind===3)
        {
         if(x[name]===void 0)
          o[name]=(enc(null))(x[name]);
        }
        else
         Operators.FailWith("Invalid field option kind");
    }
    o={};
    Arrays.iter(function($1)
    {
     return a$1($1[0],$1[1],$1[2]);
    },fields);
    return o;
   };
  };
 };
 Provider.Id=Runtime$1.Curried3(function($1,$2,x)
 {
  return x;
 });
 Provider.EncodeList=Runtime$1.Curried3(function(encEl,$1,l)
 {
  var a,e;
  a=[];
  e=encEl();
  List.iter(function(x)
  {
   a.push(e(x));
  },l);
  return a;
 });
 Provider.DecodeRecord=function(t,fields)
 {
  return function()
  {
   return function(x)
   {
    var o;
    function a(name,dec,kind)
    {
     if(kind===0)
     {
      if(x.hasOwnProperty(name))
       o[name]=(dec(null))(x[name]);
      else
       Operators.FailWith("Missing mandatory field: "+name);
     }
     else
      if(kind===1)
       o[name]=x.hasOwnProperty(name)?{
        $:1,
        $0:(dec(null))(x[name])
       }:null;
      else
       if(kind===2)
       {
        if(x.hasOwnProperty(name))
         o[name]=(dec(null))(x[name]);
       }
       else
        if(kind===3)
        {
         if(x[name]===void 0)
          o[name]=(dec(null))(x[name]);
        }
        else
         Operators.FailWith("Invalid field option kind");
    }
    o=t===void 0?{}:new t();
    Arrays.iter(function($1)
    {
     return a($1[0],$1[1],$1[2]);
    },fields);
    return o;
   };
  };
 };
 Provider.DecodeList=Runtime$1.Curried3(function(decEl,$1,a)
 {
  var e;
  e=decEl();
  return List.init(Arrays.length(a),function(i)
  {
   return e(Arrays.get(a,i));
  });
 });
 Provider.EncodeUnion=function(a,discr,cases)
 {
  return function()
  {
   return function(x)
   {
    var o,p;
    function a$1(from,to,enc,kind)
    {
     var record,k,m;
     if(from===null)
      {
       record=(enc(null))(x.$0);
       for(var k$1 in record)if(function(f)
       {
        o[f]=record[f];
        return false;
       }(k$1))
        break;
      }
     else
      if(kind===0)
       o[to]=(enc(null))(x[from]);
      else
       if(kind===1)
        {
         m=x[from];
         m==null?void 0:o[to]=(enc(null))(m.$0);
        }
       else
        Operators.FailWith("Invalid field option kind");
    }
    return typeof x==="object"&&x!=null?(o={},(p=Arrays.get(cases,x.$),(Unchecked.Equals(typeof discr,"string")?o[discr]=p[0]:void 0,Arrays.iter(function($1)
    {
     return a$1($1[0],$1[1],$1[2],$1[3]);
    },p[1]),o))):x;
   };
  };
 };
 Provider.DecodeUnion=function(t,discr,cases)
 {
  return function()
  {
   return function(x)
   {
    var tag,tagName,o,r,k;
    function p(name,a$1)
    {
     return name===tagName;
    }
    function a(from,to,dec,kind)
    {
     var r$1;
     if(from===null)
      {
       r$1=(dec(null))(x);
       to?delete r$1[discr]:void 0;
       o.$0=r$1;
      }
     else
      if(kind===0)
       o[from]=(dec(null))(x[to]);
      else
       if(kind===1)
        o[from]=x.hasOwnProperty(to)?{
         $:1,
         $0:(dec(null))(x[to])
        }:null;
       else
        Operators.FailWith("Invalid field option kind");
    }
    if(typeof x==="object"&&x!=null)
     {
      o=t===void 0?{}:new t();
      if(Unchecked.Equals(typeof discr,"string"))
       tag=(tagName=x[discr],Arrays.findIndex(function($1)
       {
        return p($1[0],$1[1]);
       },cases));
      else
       {
        r=[void 0];
        for(var k$1 in discr)if(function(k$2)
        {
         return x.hasOwnProperty(k$2)&&(r[0]=discr[k$2],true);
        }(k$1))
         break;
        tag=r[0];
       }
      o.$=tag;
      Arrays.iter(function($1)
      {
       return a($1[0],$1[1],$1[2],$1[3]);
      },(Arrays.get(cases,tag))[1]);
      return o;
     }
    else
     return x;
   };
  };
 };
 Seq.filter=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var o;
    o=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     var loop,c,res;
     loop=o.MoveNext();
     c=o.Current();
     res=false;
     while(loop)
      if(f(c))
       {
        e.c=c;
        res=true;
        loop=false;
       }
      else
       if(o.MoveNext())
        c=o.Current();
       else
        loop=false;
     return res;
    },function()
    {
     o.Dispose();
    });
   }
  };
 };
 Seq.choose=function(f,s)
 {
  return Seq.collect(function(x)
  {
   var m;
   m=f(x);
   return m==null?T.Empty:List.ofArray([m.$0]);
  },s);
 };
 Seq.append=function(s1,s2)
 {
  return{
   GetEnumerator:function()
   {
    var e1,first;
    e1=Enumerator.Get(s1);
    first=[true];
    return new T$1.New(e1,null,function(x)
    {
     var x$1;
     return x.s.MoveNext()?(x.c=x.s.Current(),true):(x$1=x.s,!Unchecked.Equals(x$1,null)?x$1.Dispose():void 0,x.s=null,first[0]&&(first[0]=false,x.s=Enumerator.Get(s2),x.s.MoveNext()?(x.c=x.s.Current(),true):(x.s.Dispose(),x.s=null,false)));
    },function(x)
    {
     var x$1;
     x$1=x.s;
     !Unchecked.Equals(x$1,null)?x$1.Dispose():void 0;
    });
   }
  };
 };
 Seq.iteri=function(p,s)
 {
  var i,e;
  i=0;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    {
     p(i,e.Current());
     i=i+1;
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.collect=function(f,s)
 {
  return Seq.concat(Seq.map(f,s));
 };
 Seq.indexed=function(s)
 {
  return Seq.mapi(function($1,$2)
  {
   return[$1,$2];
  },s);
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.tryFindIndex=function(ok,s)
 {
  var e,loop,i;
  e=Enumerator.Get(s);
  try
  {
   loop=true;
   i=0;
   while(loop&&e.MoveNext())
    if(ok(e.Current()))
     loop=false;
    else
     i=i+1;
   return loop?null:{
    $:1,
    $0:i
   };
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.tryPick=function(f,s)
 {
  var e,r;
  e=Enumerator.Get(s);
  try
  {
   r=null;
   while(Unchecked.Equals(r,null)&&e.MoveNext())
    r=f(e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.concat=function(ss)
 {
  return{
   GetEnumerator:function()
   {
    var outerE;
    outerE=Enumerator.Get(ss);
    return new T$1.New(null,null,function(st)
    {
     var m;
     while(true)
      {
       m=st.s;
       if(Unchecked.Equals(m,null))
       {
        if(outerE.MoveNext())
         {
          st.s=Enumerator.Get(outerE.Current());
          st=st;
         }
        else
         {
          outerE.Dispose();
          return false;
         }
       }
       else
        if(m.MoveNext())
         {
          st.c=m.Current();
          return true;
         }
        else
         {
          st.Dispose();
          st.s=null;
          st=st;
         }
      }
    },function(st)
    {
     var x;
     x=st.s;
     !Unchecked.Equals(x,null)?x.Dispose():void 0;
     !Unchecked.Equals(outerE,null)?outerE.Dispose():void 0;
    });
   }
  };
 };
 Seq.mapi=function(f,s)
 {
  return Seq.map2(f,Seq.initInfinite(Global.id),s);
 };
 Seq.map2=function(f,s1,s2)
 {
  return{
   GetEnumerator:function()
   {
    var e1,e2;
    e1=Enumerator.Get(s1);
    e2=Enumerator.Get(s2);
    return new T$1.New(null,null,function(e)
    {
     return e1.MoveNext()&&e2.MoveNext()&&(e.c=f(e1.Current(),e2.Current()),true);
    },function()
    {
     e1.Dispose();
     e2.Dispose();
    });
   }
  };
 };
 Seq.initInfinite=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return new T$1.New(0,null,function(e)
    {
     e.c=f(e.s);
     e.s=e.s+1;
     return true;
    },void 0);
   }
  };
 };
 Seq.forall2=function(p,s1,s2)
 {
  return!Seq.exists2(function($1,$2)
  {
   return!p($1,$2);
  },s1,s2);
 };
 Seq.head=function(s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   return e.MoveNext()?e.Current():Seq.insufficient();
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.fold=function(f,x,s)
 {
  var r,e;
  r=x;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    r=f(r,e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.exists2=function(p,s1,s2)
 {
  var e1,$1,e2,r;
  e1=Enumerator.Get(s1);
  try
  {
   e2=Enumerator.Get(s2);
   try
   {
    r=false;
    while(!r&&e1.MoveNext()&&e2.MoveNext())
     r=p(e1.Current(),e2.Current());
    $1=r;
   }
   finally
   {
    if(typeof e2=="object"&&"Dispose"in e2)
     e2.Dispose();
   }
   return $1;
  }
  finally
  {
   if(typeof e1=="object"&&"Dispose"in e1)
    e1.Dispose();
  }
 };
 Seq.iter=function(p,s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    p(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.delay=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return Enumerator.Get(f());
   }
  };
 };
 Seq.distinctBy=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var o,seen;
    o=Enumerator.Get(s);
    seen=new HashSet.New$3();
    return new T$1.New(null,null,function(e)
    {
     var cur,has;
     if(o.MoveNext())
      {
       cur=o.Current();
       has=seen.Add(f(cur));
       while(!has&&o.MoveNext())
        {
         cur=o.Current();
         has=seen.Add(f(cur));
        }
       return has&&(e.c=cur,true);
      }
     else
      return false;
    },function()
    {
     o.Dispose();
    });
   }
  };
 };
 Seq.unfold=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    return new T$1.New(s,null,function(e)
    {
     var m;
     m=f(e.s);
     return m==null?false:(e.c=m.$0[0],e.s=m.$0[1],true);
    },void 0);
   }
  };
 };
 Seq.distinct=function(s)
 {
  return Seq.distinctBy(Global.id,s);
 };
 Seq.forall=function(p,s)
 {
  return!Seq.exists(function(x)
  {
   return!p(x);
  },s);
 };
 Seq.max=function(s)
 {
  var e,m,x;
  e=Enumerator.Get(s);
  try
  {
   if(!e.MoveNext())
    Seq.seqEmpty();
   m=e.Current();
   while(e.MoveNext())
    {
     x=e.Current();
     Unchecked.Compare(x,m)===1?m=x:void 0;
    }
   return m;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.exists=function(p,s)
 {
  var e,r;
  e=Enumerator.Get(s);
  try
  {
   r=false;
   while(!r&&e.MoveNext())
    r=p(e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.seqEmpty=function()
 {
  return Operators.FailWith("The input sequence was empty.");
 };
 Seq.compareWith=function(f,s1,s2)
 {
  var e1,$1,e2,r,loop;
  e1=Enumerator.Get(s1);
  try
  {
   e2=Enumerator.Get(s2);
   try
   {
    r=0;
    loop=true;
    while(loop&&r===0)
     if(e1.MoveNext())
      r=e2.MoveNext()?f(e1.Current(),e2.Current()):1;
     else
      if(e2.MoveNext())
       r=-1;
      else
       loop=false;
    $1=r;
   }
   finally
   {
    if(typeof e2=="object"&&"Dispose"in e2)
     e2.Dispose();
   }
   return $1;
  }
  finally
  {
   if(typeof e1=="object"&&"Dispose"in e1)
    e1.Dispose();
  }
 };
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 Snap.Map=function(fn,sn)
 {
  var m,res;
  m=sn.s;
  return m!=null&&m.$==0?Snap.New({
   $:0,
   $0:fn(m.$0)
  }):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(a)
  {
   Snap.MarkDone(res,sn,fn(a));
  },res),res));
 };
 Snap.WhenObsoleteRun=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?m.$1.push(obs):m!=null&&m.$==3?m.$1.push(obs):void 0;
 };
 Snap.When=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?(Snap.EnqueueSafe(m.$1,obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),Snap.EnqueueSafe(m.$1,obs)):avail(m.$0);
 };
 Snap.MarkDone=function(res,sn,v)
 {
  var $1;
  if($1=sn.s,$1!=null&&$1.$==0)
   Snap.MarkForever(res,v);
  else
   Snap.MarkReady(res,v);
 };
 Snap.Map2=function(fn,sn1,sn2)
 {
  var $1,$2,res;
  function cont(a)
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     $3!=null&&$3.$==1?$4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,fn($3.$0[0],$4.$0[0])):Snap.MarkReady(res,fn($3.$0[0],$4.$0[0])):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:fn($1.$0,$2.$0)
  }):Snap.Map2Opt1(fn,$1.$0,sn2):$2!=null&&$2.$==0?Snap.Map2Opt2(fn,$2.$0,sn1):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.WhenRun=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  m==null?obs():m!=null&&m.$==2?(m.$1.push(obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),m.$1.push(obs)):avail(m.$0);
 };
 Snap.EnqueueSafe=function(q,x)
 {
  var qcopy,i,$1,o;
  q.push(x);
  if(q.length%20===0)
   {
    qcopy=q.slice(0);
    Queue.Clear(q);
    for(i=0,$1=Arrays.length(qcopy)-1;i<=$1;i++){
     o=Arrays.get(qcopy,i);
     typeof o=="object"?function(sn)
     {
      if(sn.s)
       q.push(sn);
     }(o):function(f)
     {
      q.push(f);
     }(o);
    }
   }
  else
   void 0;
 };
 Snap.MarkForever=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:0,
     $0:v
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.MarkReady=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:2,
     $0:v,
     $1:m.$1
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.TryGet=function(snap)
 {
  var m,$1;
  m=snap.s;
  return(m!=null&&m.$==0?($1=m.$0,true):m!=null&&m.$==2&&($1=m.$0,true))?{
   $:1,
   $0:$1
  }:null;
 };
 Snap.Map2Opt1=function(fn,x,sn2)
 {
  return Snap.Map(function(y)
  {
   return fn(x,y);
  },sn2);
 };
 Snap.Map2Opt2=function(fn,y,sn1)
 {
  return Snap.Map(function(x)
  {
   return fn(x,y);
  },sn1);
 };
 Snap.ValueAndForever=function(snap)
 {
  var m;
  m=snap.s;
  return m!=null&&m.$==0?{
   $:1,
   $0:[m.$0,true]
  }:m!=null&&m.$==2?{
   $:1,
   $0:[m.$0,false]
  }:null;
 };
 Snap.Map3=function(fn,sn1,sn2,sn3)
 {
  var $1,$2,$3,res;
  function cont(a)
  {
   var m,$4,$5,$6;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $4=Snap.ValueAndForever(sn1);
     $5=Snap.ValueAndForever(sn2);
     $6=Snap.ValueAndForever(sn3);
     $4!=null&&$4.$==1?$5!=null&&$5.$==1?$6!=null&&$6.$==1?$4.$0[1]&&$5.$0[1]&&$6.$0[1]?Snap.MarkForever(res,fn($4.$0[0],$5.$0[0],$6.$0[0])):Snap.MarkReady(res,fn($4.$0[0],$5.$0[0],$6.$0[0])):void 0:void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  $3=sn3.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?$3!=null&&$3.$==0?Snap.New({
   $:0,
   $0:fn($1.$0,$2.$0,$3.$0)
  }):Snap.Map3Opt1(fn,$1.$0,$2.$0,sn3):$3!=null&&$3.$==0?Snap.Map3Opt2(fn,$1.$0,$3.$0,sn2):Snap.Map3Opt3(fn,$1.$0,sn2,sn3):$2!=null&&$2.$==0?$3!=null&&$3.$==0?Snap.Map3Opt4(fn,$2.$0,$3.$0,sn1):Snap.Map3Opt5(fn,$2.$0,sn1,sn3):$3!=null&&$3.$==0?Snap.Map3Opt6(fn,$3.$0,sn1,sn2):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),Snap.When(sn3,cont,res),res));
 };
 Snap.Sequence=function(snaps)
 {
  var snaps$1,res,w;
  function cont(a)
  {
   var vs;
   if(w[0]===0)
    {
     vs=Arrays.map(function(s)
     {
      var m;
      m=s.s;
      return m!=null&&m.$==0?m.$0:m!=null&&m.$==2?m.$0:Operators.FailWith("value not found by View.Sequence");
     },snaps$1);
     Arrays.forall(function(a$1)
     {
      var $1;
      $1=a$1.s;
      return $1!=null&&$1.$==0;
     },snaps$1)?Snap.MarkForever(res,vs):Snap.MarkReady(res,vs);
    }
   else
    w[0]--;
  }
  snaps$1=Arrays.ofSeq(snaps);
  return snaps$1.length==0?Snap.New({
   $:0,
   $0:[]
  }):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(w=[Arrays.length(snaps$1)-1],(Arrays.iter(function(s)
  {
   Snap.When(s,cont,res);
  },snaps$1),res)));
 };
 Snap.Map2Unit=function(sn1,sn2)
 {
  var $1,$2,res;
  function cont()
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     $3!=null&&$3.$==1?$4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,null):Snap.MarkReady(res,null):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:null
  }):sn2:$2!=null&&$2.$==0?sn1:(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.Copy=function(sn)
 {
  var m,res,res$1;
  m=sn.s;
  return m==null?sn:m!=null&&m.$==2?(res=Snap.New({
   $:2,
   $0:m.$0,
   $1:[]
  }),(Snap.WhenObsolete(sn,res),res)):m!=null&&m.$==3?(res$1=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(v)
  {
   Snap.MarkDone(res$1,sn,v);
  },res$1),res$1)):sn;
 };
 Snap.Join=function(snap)
 {
  var res;
  res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  });
  Snap.When(snap,function(x)
  {
   var y;
   y=x();
   Snap.When(y,function(v)
   {
    var $1,$2;
    if(($1=y.s,$1!=null&&$1.$==0)&&($2=snap.s,$2!=null&&$2.$==0))
     Snap.MarkForever(res,v);
    else
     Snap.MarkReady(res,v);
   },res);
  },res);
  return res;
 };
 Snap.Map3Opt1=function(fn,x,y,sn3)
 {
  return Snap.Map(function(z)
  {
   return fn(x,y,z);
  },sn3);
 };
 Snap.Map3Opt2=function(fn,x,z,sn2)
 {
  return Snap.Map(function(y)
  {
   return fn(x,y,z);
  },sn2);
 };
 Snap.Map3Opt3=function(fn,x,sn2,sn3)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn(x,$1,$2);
  },sn2,sn3);
 };
 Snap.Map3Opt4=function(fn,y,z,sn1)
 {
  return Snap.Map(function(x)
  {
   return fn(x,y,z);
  },sn1);
 };
 Snap.Map3Opt5=function(fn,y,sn1,sn3)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn($1,y,$2);
  },sn1,sn3);
 };
 Snap.Map3Opt6=function(fn,z,sn1,sn2)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn($1,$2,z);
  },sn1,sn2);
 };
 Snap.WhenObsolete=function(snap,obs)
 {
  var m;
  m=snap.s;
  m==null?Snap.Obsolete(obs):m!=null&&m.$==2?Snap.EnqueueSafe(m.$1,obs):m!=null&&m.$==3?Snap.EnqueueSafe(m.$1,obs):void 0;
 };
 List$1=Collections.List=Runtime$1.Class({
  GetEnumerator:function()
  {
   return Enumerator.Get(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(this);
  }
 },null,List$1);
 FromView=UI.FromView=Runtime$1.Class({
  Get:function()
  {
   return this.current;
  },
  Update:function(f)
  {
   var g;
   View.Get((g=this.set,function(x)
   {
    return g(f(x));
   }),this.view);
  },
  Set:function(x)
  {
   this.set(x);
  },
  UpdateMaybe:function(f)
  {
   var $this;
   $this=this;
   View.Get(function(x)
   {
    var m;
    m=f(x);
    m!=null&&m.$==1?$this.set(m.$0):void 0;
   },this.view);
  },
  get_View:function()
  {
   return this.view;
  }
 },Var,FromView);
 FromView.New=Runtime$1.Ctor(function(view,set)
 {
  var $this,m;
  $this=this;
  Var.New.call(this);
  this.set=set;
  this.id=Fresh.Int();
  this.current=(m=View.TryGet(view),m==null?null:m.$0);
  this.view=View.Map(function(x)
  {
   $this.current=x;
   return x;
  },view);
 },FromView);
 Guid.NewGuid=function()
 {
  return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(new Global.RegExp("[xy]","g"),function(c)
  {
   var r,v;
   r=Math.random()*16|0;
   v=c=="x"?r:r&3|8;
   return v.toString(16);
  });
 };
 AttrProxy=UI.AttrProxy=Runtime$1.Class({},null,AttrProxy);
 AttrProxy.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Attrs.EmptyAttr(),AttrProxy.Append,x);
 };
 AttrProxy.Append=function(a,b)
 {
  return Attrs.AppendTree(a,b);
 };
 AttrProxy.Handler=function(event,q)
 {
  return AttrProxy.HandlerImpl(event,q);
 };
 AttrProxy.Create=function(name,value)
 {
  return Attrs.Static(function(el)
  {
   DomUtility.SetAttr(el,name,value);
  });
 };
 AttrProxy.HandlerImpl=function(event,q)
 {
  return Attrs.Static(function(el)
  {
   el.addEventListener(event,function(d)
   {
    return(q(el))(d);
   },false);
  });
 };
 Attrs.Static=function(attr)
 {
  return new AttrProxy({
   $:3,
   $0:attr
  });
 };
 Attrs.Dynamic=function(view,set)
 {
  return new AttrProxy({
   $:1,
   $0:new DynamicAttrNode.New(view,set)
  });
 };
 Attrs.AppendTree=function(a,b)
 {
  var x;
  return a===null?b:b===null?a:(x=new AttrProxy({
   $:2,
   $0:a,
   $1:b
  }),(Attrs.SetFlags(x,Attrs.Flags(a)|Attrs.Flags(b)),x));
 };
 Attrs.EmptyAttr=function()
 {
  SC$2.$cctor();
  return SC$2.EmptyAttr;
 };
 Attrs.SetFlags=function(a,f)
 {
  a.flags=f;
 };
 Attrs.Flags=function(a)
 {
  return a!==null&&a.hasOwnProperty("flags")?a.flags:0;
 };
 Attrs.Insert=function(elem,tree)
 {
  var nodes,oar,arr;
  function loop(node)
  {
   if(!(node===null))
    if(node!=null&&node.$==1)
     nodes.push(node.$0);
    else
     if(node!=null&&node.$==2)
      {
       loop(node.$0);
       loop(node.$1);
      }
     else
      if(node!=null&&node.$==3)
       node.$0(elem);
      else
       if(node!=null&&node.$==4)
        oar.push(node.$0);
  }
  nodes=[];
  oar=[];
  loop(tree);
  arr=nodes.slice(0);
  return Dyn.New(elem,Attrs.Flags(tree),arr,oar.length===0?null:{
   $:1,
   $0:function(el)
   {
    Seq.iter(function(f)
    {
     f(el);
    },oar);
   }
  });
 };
 Attrs.Updates=function(dyn)
 {
  return Array.MapTreeReduce(function(x)
  {
   return x.NChanged();
  },View.Const(),View.Map2Unit,dyn.DynNodes);
 };
 Attrs.Empty=function(e)
 {
  return Dyn.New(e,0,[],null);
 };
 Attrs.HasExitAnim=function(attr)
 {
  var flag;
  flag=2;
  return(attr.DynFlags&flag)===flag;
 };
 Attrs.GetExitAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetExitAnim($2);
  });
 };
 Attrs.HasEnterAnim=function(attr)
 {
  var flag;
  flag=1;
  return(attr.DynFlags&flag)===flag;
 };
 Attrs.GetEnterAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetEnterAnim($2);
  });
 };
 Attrs.HasChangeAnim=function(attr)
 {
  var flag;
  flag=4;
  return(attr.DynFlags&flag)===flag;
 };
 Attrs.GetChangeAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetChangeAnim($2);
  });
 };
 Attrs.GetAnim=function(dyn,f)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return f(n,dyn.DynElem);
  },dyn.DynNodes));
 };
 Attrs.Sync=function(elem,dyn)
 {
  Arrays.iter(function(d)
  {
   d.NSync(elem);
  },dyn.DynNodes);
 };
 DomUtility.AddClass=function(element,cl)
 {
  var c;
  c=DomUtility.getClass(element);
  c===""?DomUtility.setClass(element,cl):!DomUtility.clsRE(cl).test(c)?DomUtility.setClass(element,c+" "+cl):void 0;
 };
 DomUtility.RemoveClass=function(element,cl)
 {
  var _this;
  DomUtility.setClass(element,(_this=DomUtility.clsRE(cl),DomUtility.getClass(element).replace(_this,function($1,$2,$3)
  {
   return $2===""||$3===""?"":" ";
  })));
 };
 DomUtility.getClass=function(element)
 {
  return element instanceof Global.SVGElement?element.getAttribute("class"):element.className;
 };
 DomUtility.setClass=function(element,value)
 {
  if(element instanceof Global.SVGElement)
   element.setAttribute("class",value);
  else
   element.className=value;
 };
 DomUtility.clsRE=function(cls)
 {
  return new Global.RegExp("(\\s+|^)"+cls+"(?:\\s+"+cls+")*(\\s+|$)","g");
 };
 DomUtility.CreateText=function(s)
 {
  return DomUtility.Doc().createTextNode(s);
 };
 DomUtility.ChildrenArray=function(element)
 {
  var a,i,$1;
  a=[];
  for(i=0,$1=element.childNodes.length-1;i<=$1;i++)a.push(element.childNodes[i]);
  return a;
 };
 DomUtility.Doc=function()
 {
  SC$3.$cctor();
  return SC$3.Doc;
 };
 DomUtility.IterSelector=function(el,selector,f)
 {
  var l,i,$1;
  l=el.querySelectorAll(selector);
  for(i=0,$1=l.length-1;i<=$1;i++)f(l[i]);
 };
 DomUtility.SetAttr=function(el,name,value)
 {
  el.setAttribute(name,value);
 };
 DomUtility.InsertAt=function(parent,pos,node)
 {
  var m;
  if(!(node.parentNode===parent&&pos===(m=node.nextSibling,Unchecked.Equals(m,null)?null:m)))
   parent.insertBefore(node,pos);
 };
 DomUtility.RemoveNode=function(parent,el)
 {
  if(el.parentNode===parent)
   parent.removeChild(el);
 };
 Dictionary=Collections.Dictionary=Runtime$1.Class({
  set_Item:function(k,v)
  {
   this.set(k,v);
  },
  set:function(k,v)
  {
   var $this,h,d,m;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   d==null?(this.count=this.count+1,this.data[h]=new Global.Array({
    K:k,
    V:v
   })):(m=Arrays.tryFindIndex(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),m==null?(this.count=this.count+1,d.push({
    K:k,
    V:v
   })):d[m.$0]={
    K:k,
    V:v
   });
  },
  ContainsKey:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:Arrays.exists(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d);
  },
  get_Item:function(k)
  {
   return this.get(k);
  },
  TryGetValue:function(k,res)
  {
   var $this,d,v;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:(v=Arrays.tryPick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d),v!=null&&v.$==1&&(res.set(v.$0),true));
  },
  get:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?DictionaryUtil.notPresent():Arrays.pick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d);
  },
  Remove:function(k)
  {
   return this.remove(k);
  },
  get_Keys:function()
  {
   return new KeyCollection.New(this);
  },
  remove:function(k)
  {
   var $this,h,d,r;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   return d==null?false:(r=Arrays.filter(function(a)
   {
    return!$this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),Arrays.length(r)<d.length&&(this.count=this.count-1,this.data[h]=r,true));
  },
  GetEnumerator:function()
  {
   return Enumerator.Get0(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(Arrays.concat(JS.GetFieldValues(this.data)));
  }
 },Obj,Dictionary);
 Dictionary.New$5=Runtime$1.Ctor(function()
 {
  Dictionary.New$6.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },Dictionary);
 Dictionary.New$6=Runtime$1.Ctor(function(init,equals,hash)
 {
  var e,x;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.count=0;
  this.data=[];
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     this.set(x.K,x.V);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },Dictionary);
 HashSet=Collections.HashSet=Runtime$1.Class({
  Add:function(item)
  {
   return this.add(item);
  },
  Contains:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrContains(item,arr);
  },
  add:function(item)
  {
   var h,arr;
   h=this.hash(item);
   arr=this.data[h];
   return arr==null?(this.data[h]=[item],this.count=this.count+1,true):this.arrContains(item,arr)?false:(arr.push(item),this.count=this.count+1,true);
  },
  arrContains:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     c=false;
    else
     i=i+1;
   return!c;
  },
  ExceptWith:function(xs)
  {
   var e;
   e=Enumerator.Get(xs);
   try
   {
    while(e.MoveNext())
     this.Remove(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
  },
  get_Count:function()
  {
   return this.count;
  },
  CopyTo:function(arr)
  {
   var i,all,i$1,$1;
   i=0;
   all=HashSetUtil.concat(this.data);
   for(i$1=0,$1=all.length-1;i$1<=$1;i$1++)Arrays.set(arr,i$1,all[i$1]);
  },
  IntersectWith:function(xs)
  {
   var other,all,i,$1,item;
   other=new HashSet.New$4(xs,this.equals,this.hash);
   all=HashSetUtil.concat(this.data);
   for(i=0,$1=all.length-1;i<=$1;i++){
    item=all[i];
    !other.Contains(item)?this.Remove(item):void 0;
   }
  },
  Remove:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrRemove(item,arr)&&(this.count=this.count-1,true);
  },
  arrRemove:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     {
      arr.splice.apply(arr,[i,1]);
      c=false;
     }
    else
     i=i+1;
   return!c;
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  }
 },Obj,HashSet);
 HashSet.New$3=Runtime$1.Ctor(function()
 {
  HashSet.New$4.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 HashSet.New$4=Runtime$1.Ctor(function(init,equals,hash)
 {
  var e;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.data=[];
  this.count=0;
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    this.add(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },HashSet);
 HashSet.New$2=Runtime$1.Ctor(function(init)
 {
  HashSet.New$4.call(this,init,Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 Client$1.Box=Global.id;
 Arrays.choose=function(f,arr)
 {
  var q,i,$1,m;
  q=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   m=f(arr[i]);
   m==null?void 0:q.push(m.$0);
  }
  return q;
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Arrays.map2=function(f,arr1,arr2)
 {
  var r,i,$1;
  Arrays.checkLength(arr1,arr2);
  r=new Global.Array(arr2.length);
  for(i=0,$1=arr2.length-1;i<=$1;i++)r[i]=f(arr1[i],arr2[i]);
  return r;
 };
 Arrays.forall=function(f,x)
 {
  var a,i,$1,l;
  a=true;
  i=0;
  l=Arrays.length(x);
  while(a&&i<l)
   if(f(x[i]))
    i=i+1;
   else
    a=false;
  return a;
 };
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  size<0?Operators.FailWith("Negative size given."):null;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 Arrays.iter=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(arr[i]);
 };
 Arrays.last=function(arr)
 {
  Arrays.nonEmpty(arr);
  return arr[arr.length-1];
 };
 Arrays.findIndex=function(f,arr)
 {
  var m;
  m=Arrays.tryFindIndex(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.checkLength=function(arr1,arr2)
 {
  if(arr1.length!==arr2.length)
   Operators.FailWith("The arrays have different lengths.");
 };
 Arrays.nonEmpty=function(arr)
 {
  if(arr.length===0)
   Operators.FailWith("The input array was empty.");
 };
 Arrays.tryFindIndex=function(f,arr)
 {
  var res,i;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    f(arr[i])?res={
     $:1,
     $0:i
    }:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.concat=function(xs)
 {
  return Global.Array.prototype.concat.apply([],Arrays.ofSeq(xs));
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.exists=function(f,x)
 {
  var e,i,$1,l;
  e=false;
  i=0;
  l=Arrays.length(x);
  while(!e&&i<l)
   if(f(x[i]))
    e=true;
   else
    i=i+1;
  return e;
 };
 Arrays.tryPick=function(f,arr)
 {
  var res,i,m;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    m=f(arr[i]);
    m!=null&&m.$==1?res=m:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.filter=function(f,arr)
 {
  var r,i,$1;
  r=[];
  for(i=0,$1=arr.length-1;i<=$1;i++)if(f(arr[i]))
   r.push(arr[i]);
  return r;
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.foldBack=function(f,arr,zero)
 {
  var acc,$1,len,i,$2;
  acc=zero;
  len=arr.length;
  for(i=1,$2=len;i<=$2;i++)acc=f(arr[len-i],acc);
  return acc;
 };
 Arrays.pick=function(f,arr)
 {
  var m;
  m=Arrays.tryPick(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.sortInPlace=function(arr)
 {
  Arrays.mapInPlace(function(t)
  {
   return t[0];
  },Arrays.mapiInPlace(function($1,$2)
  {
   return[$2,$1];
  },arr).sort(Unchecked.Compare));
 };
 Arrays.create=function(size,value)
 {
  var r,i,$1;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=value;
  return r;
 };
 View=UI.View=Runtime$1.Class({},null,View);
 RouterModule.Parse=function(router,path)
 {
  function c(path$1,value)
  {
   return path$1.Segments.$==0?{
    $:1,
    $0:value
   }:null;
  }
  return Seq.tryPick(function($1)
  {
   return c($1[0],$1[1]);
  },router.Parse(path));
 };
 RouterModule.HashLink=function(router,endpoint)
 {
  return"#"+RouterModule.Link(router,endpoint);
 };
 RouterModule.Link=function(router,endpoint)
 {
  var m;
  m=RouterModule.Write(router,endpoint);
  return m==null?"":m.$0.ToLink();
 };
 RouterModule.Write=function(router,endpoint)
 {
  var o;
  o=router.Write(endpoint);
  return o==null?null:{
   $:1,
   $0:Route.Combine(o.$0)
  };
 };
 Route=Sitelets.Route=Runtime$1.Class({
  ToLink:function()
  {
   return PathUtil.WriteLink(this.Segments,this.QueryArgs);
  }
 },null,Route);
 Route.FromHash=function(path,strict)
 {
  var m,h;
  m=path.indexOf("#");
  return m===-1?Route.get_Empty():(h=path.substring(m+1),strict!=null&&strict.$0?h===""||h==="/"?Route.get_Empty():Strings.StartsWith(h,"/")?Route.FromUrl(h.substring(1),{
   $:1,
   $0:true
  }):Route.Segment$2(h):Route.FromUrl(path.substring(m),{
   $:1,
   $0:false
  }));
 };
 Route.Segment=function(s,m)
 {
  var i;
  i=Route.get_Empty();
  return Route.New(s,i.QueryArgs,i.FormData,m,i.Body);
 };
 Route.get_Empty=function()
 {
  return Route.New(T.Empty,new FSharpMap.New([]),new FSharpMap.New([]),null,Lazy.CreateFromValue(null));
 };
 Route.FromUrl=function(path,strict)
 {
  var p,m,i;
  p=(m=path.indexOf("?"),m===-1?[path,new FSharpMap.New([])]:[Strings.Substring(path,0,m),Route.ParseQuery(path.substring(m+1))]);
  i=Route.get_Empty();
  return Route.New(List.ofArray(Strings.SplitChars(p[0],["/"],strict!=null&&strict.$0?0:1)),p[1],i.FormData,i.Method,i.Body);
 };
 Route.Segment$2=function(s)
 {
  var i;
  i=Route.get_Empty();
  return Route.New(List.ofArray([s]),i.QueryArgs,i.FormData,i.Method,i.Body);
 };
 Route.ParseQuery=function(q)
 {
  return Map.OfArray(Arrays.ofSeq(Arrays.choose(function(kv)
  {
   var m,v;
   m=Strings.SplitChars(kv,["="],0);
   return!Unchecked.Equals(m,null)&&m.length===2?(v=Arrays.get(m,1),{
    $:1,
    $0:[Arrays.get(m,0),v]
   }):((function($1)
   {
    return function($2)
    {
     return $1("wrong format for query argument: "+Utils.toSafe($2));
    };
   }(function(s)
   {
    console.log(s);
   }))(kv),null);
  },Strings.SplitChars(q,["&"],0))));
 };
 Route.Combine=function(paths)
 {
  var method,body,queryArgs,formData,i,$1,paths$1,m,segments,l;
  paths$1=Arrays.ofSeq(paths);
  m=Arrays.length(paths$1);
  if(m===0)
   return Route.get_Empty();
  else
   if(m===1)
    return Arrays.get(paths$1,0);
   else
    {
     method=null;
     body=null;
     segments=[];
     queryArgs=new FSharpMap.New([]);
     formData=new FSharpMap.New([]);
     i=0;
     l=Arrays.length(paths$1);
     while(i<l)
      (function()
      {
       var p,m$1,m$2;
       p=Arrays.get(paths$1,i);
       m$1=p.Method;
       m$1!=null&&m$1.$==1?method=m$1:void 0;
       m$2=p.Body.f();
       m$2===null?void 0:body=m$2;
       queryArgs=Map.FoldBack(function(k,v,t)
       {
        return t.Add(k,v);
       },queryArgs,p.QueryArgs);
       formData=Map.FoldBack(function(k,v,t)
       {
        return t.Add(k,v);
       },formData,p.FormData);
       List.iter(function(a)
       {
        segments.push(a);
       },p.Segments);
       i=i+1;
      }());
     return Route.New(List.ofSeq(segments),queryArgs,formData,method,Lazy.CreateFromValue(body));
    }
 };
 Route.New=function(Segments,QueryArgs,FormData,Method,Body)
 {
  return new Route({
   Segments:Segments,
   QueryArgs:QueryArgs,
   FormData:FormData,
   Method:Method,
   Body:Body
  });
 };
 JS.GetFieldValues=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push(o[k$1]);
  return r;
 };
 Router$1.New$1=function(Parse,Write)
 {
  return{
   Parse:Parse,
   Write:Write
  };
 };
 List$2.startsWith=function(s,l)
 {
  var $1;
  switch(s.$==1?l.$==1?Unchecked.Equals(s.$0,l.$0)?($1=[l.$0,l.$1,s.$0,s.$1],1):2:2:0)
  {
   case 0:
    return{
     $:1,
     $0:l
    };
   case 1:
    return List$2.startsWith($1[3],$1[1]);
   case 2:
    return null;
  }
 };
 ConcreteVar=UI.ConcreteVar=Runtime$1.Class({
  Get:function()
  {
   return this.current;
  },
  Update:function(f)
  {
   this.Set(f(this.Get()));
  },
  Set:function(v)
  {
   if(this.isConst)
    (function($1)
    {
     return $1("WebSharper.UI: invalid attempt to change value of a Var after calling SetFinal");
    }(function(s)
    {
     console.log(s);
    }));
   else
    {
     Snap.Obsolete(this.snap);
     this.current=v;
     this.snap=Snap.New({
      $:2,
      $0:v,
      $1:[]
     });
    }
  },
  UpdateMaybe:function(f)
  {
   var m;
   m=f(this.Get());
   m!=null&&m.$==1?this.Set(m.$0):void 0;
  },
  get_View:function()
  {
   return this.view;
  }
 },Var,ConcreteVar);
 ConcreteVar.New=Runtime$1.Ctor(function(isConst,initSnap,initValue)
 {
  var $this;
  $this=this;
  Var.New.call(this);
  this.isConst=isConst;
  this.current=initValue;
  this.snap=initSnap;
  this.view=function()
  {
   return $this.snap;
  };
  this.id=Fresh.Int();
 },ConcreteVar);
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 Enumerator.Get0=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):"GetEnumerator0"in x?x.GetEnumerator0():x.GetEnumerator();
 };
 T$1=Enumerator.T=Runtime$1.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime$1.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 Snap.Obsolete=function(sn)
 {
  var $1,m,i,$2,o;
  m=sn.s;
  if(m==null||(m!=null&&m.$==2?($1=m.$1,false):m!=null&&m.$==3?($1=m.$1,false):true))
   void 0;
  else
   {
    sn.s=null;
    for(i=0,$2=Arrays.length($1)-1;i<=$2;i++){
     o=Arrays.get($1,i);
     typeof o=="object"?function(sn$1)
     {
      Snap.Obsolete(sn$1);
     }(o):o();
    }
   }
 };
 Snap.New=function(State)
 {
  return{
   s:State
  };
 };
 Doc=UI.Doc=Runtime$1.Class({},Obj,Doc);
 Doc.ConvertSeqBy=function(key,render,view)
 {
  return Doc.Flatten(View.MapSeqCachedViewBy(key,function($1,$2)
  {
   return(render($1))($2);
  },view));
 };
 Doc.TextNode=function(v)
 {
  return Doc.Mk({
   $:5,
   $0:DomUtility.CreateText(v)
  },View.Const());
 };
 Doc.TextView=function(txt)
 {
  var node;
  node=Docs.CreateTextNode();
  return Doc.Mk({
   $:4,
   $0:node
  },View.Map(function(t)
  {
   Docs.UpdateTextNode(node,t);
  },txt));
 };
 Doc.Flatten=function(view)
 {
  return Doc.EmbedView(View.Map(Doc.Concat,view));
 };
 Doc.Mk=function(node,updates)
 {
  return new Doc.New(node,updates);
 };
 Doc.RunInPlace=function(childrenOnly,parent,doc)
 {
  var st;
  st=Docs.CreateRunState(parent,doc.docNode);
  View.Sink(An.get_UseAnimations()||Settings.BatchUpdatesEnabled()?Mailbox.StartProcessor(Docs.PerformAnimatedUpdate(childrenOnly,st,doc.docNode)):function()
  {
   Docs.PerformSyncUpdate(childrenOnly,st,doc.docNode);
  },doc.updates);
 };
 Doc.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Doc.get_Empty(),Doc.Append,x);
 };
 Doc.EmbedView=function(view)
 {
  var node;
  node=Docs.CreateEmbedNode();
  return Doc.Mk({
   $:2,
   $0:node
  },View.Map(Global.ignore,View.Bind(function(doc)
  {
   Docs.UpdateEmbedNode(node,doc.docNode);
   return doc.updates;
  },view)));
 };
 Doc.get_Empty=function()
 {
  return Doc.Mk(null,View.Const());
 };
 Doc.Append=function(a,b)
 {
  return Doc.Mk({
   $:0,
   $0:a.docNode,
   $1:b.docNode
  },View.Map2Unit(a.updates,b.updates));
 };
 Doc.New=Runtime$1.Ctor(function(docNode,updates)
 {
  Obj.New.call(this);
  this.docNode=docNode;
  this.updates=updates;
 },Doc);
 Array.ofSeqNonCopying=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs;
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    if(xs===null)
     return[];
    else
     {
      q=[];
      o=Enumerator.Get(xs);
      try
      {
       while(o.MoveNext())
        q.push(o.Current());
       return q;
      }
      finally
      {
       if(typeof o=="object"&&"Dispose"in o)
        o.Dispose();
      }
     }
 };
 Array.TreeReduce=function(defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l)?Arrays.get(array,off):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 Array.mapInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(arr[i]);
  return arr;
 };
 Array.MapTreeReduce=function(mapping,defaultValue,reduction,array)
 {
  var l;
  function loop(off,len)
  {
   var $1,l2;
   return len<=0?defaultValue:len===1&&(off>=0&&off<l)?mapping(Arrays.get(array,off)):(l2=len/2>>0,reduction(loop(off,l2),loop(off+l2,len-l2)));
  }
  l=Arrays.length(array);
  return loop(0,l);
 };
 CheckedInput=UI.CheckedInput=Runtime$1.Class({
  get_Input:function()
  {
   return this.$==1?this.$0:this.$==2?this.$0:this.$1;
  }
 },null,CheckedInput);
 DynamicAttrNode=UI.DynamicAttrNode=Runtime$1.Class({
  NChanged:function()
  {
   return this.updates;
  },
  NGetExitAnim:function(parent)
  {
   return An.get_Empty();
  },
  NGetEnterAnim:function(parent)
  {
   return An.get_Empty();
  },
  NGetChangeAnim:function(parent)
  {
   return An.get_Empty();
  },
  NSync:function(parent)
  {
   if(this.dirty)
    {
     (this.push(parent))(this.value);
     this.dirty=false;
    }
  }
 },Obj,DynamicAttrNode);
 DynamicAttrNode.New=Runtime$1.Ctor(function(view,push)
 {
  var $this;
  $this=this;
  Obj.New.call(this);
  this.push=push;
  this.value=void 0;
  this.dirty=false;
  this.updates=View.Map(function(x)
  {
   $this.value=x;
   $this.dirty=true;
  },view);
 },DynamicAttrNode);
 DictionaryUtil.notPresent=function()
 {
  return Operators.FailWith("The given key was not present in the dictionary.");
 };
 Templates.RunFullDocTemplate=function(fillWith)
 {
  var x,a;
  Templates.LoadLocalTemplates("");
  Templates.PrepareTemplateStrict("",null,DomUtility.ChildrenArray(self.document.body),{
   $:1,
   $0:self.document.body
  },null);
  x=Templates.ChildrenTemplate(self.document.body,fillWith);
  a=self.document.body;
  (function(a$1)
  {
   Doc.RunInPlace(true,a,a$1);
  }(x));
  return x;
 };
 Templates.LoadLocalTemplates=function(baseName)
 {
  !Templates.LocalTemplatesLoaded()?(Templates.set_LocalTemplatesLoaded(true),Templates.LoadNestedTemplates(self.document.body,"")):void 0;
  Templates.LoadedTemplates().set_Item(baseName,Templates.LoadedTemplateFile(""));
 };
 Templates.NamedTemplate=function(baseName,name,fillWith)
 {
  var m,o;
  m=(o=null,[Templates.LoadedTemplateFile(baseName).TryGetValue(name==null?"":name.$0,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?Templates.ChildrenTemplate(m[1].cloneNode(true),fillWith):(console.warn("Local template doesn't exist",name),Doc.get_Empty());
 };
 Templates.PrepareTemplateStrict=function(baseName,name,els,root,prepareLocalTemplate)
 {
  var fakeroot,name$1;
  function recF(recI,$1)
  {
   var next,m,$2,x,f,name$2,p,instName,instBaseName,d,t,instance,usedHoles,mappings,attrs,i,$3,name$3,m$1,i$1,$4,n,singleTextFill,i$2,$5,n$1;
   function g(v)
   {
   }
   while(true)
    switch(recI)
    {
     case 0:
      if($1!==null)
       {
        next=$1.nextSibling;
        if(Unchecked.Equals($1.nodeType,Node.TEXT_NODE))
         Prepare.convertTextNode($1);
        else
         if(Unchecked.Equals($1.nodeType,Node.ELEMENT_NODE))
          convertElement($1);
        $1=next;
       }
      else
       return null;
      break;
     case 1:
      name$2=Slice.string($1.nodeName,{
       $:1,
       $0:3
      },null).toLowerCase();
      p=(m=name$2.indexOf("."),m===-1?[baseName,name$2]:[Slice.string(name$2,null,{
       $:1,
       $0:m-1
      }),Slice.string(name$2,{
       $:1,
       $0:m+1
      },null)]);
      instName=p[1];
      instBaseName=p[0];
      if(instBaseName!==""&&!Templates.LoadedTemplates().ContainsKey(instBaseName))
       return Prepare.failNotLoaded(instName);
      else
       {
        if(instBaseName===""&&prepareLocalTemplate!=null)
         prepareLocalTemplate.$0(instName);
        d=Templates.LoadedTemplates().get_Item(instBaseName);
        if(!d.ContainsKey(instName))
         return Prepare.failNotLoaded(instName);
        else
         {
          t=d.get_Item(instName);
          instance=t.cloneNode(true);
          usedHoles=new HashSet.New$3();
          mappings=new Dictionary.New$5();
          attrs=$1.attributes;
          for(i=0,$3=attrs.length-1;i<=$3;i++){
           name$3=attrs.item(i).name.toLowerCase();
           mappings.set_Item(name$3,(m$1=attrs.item(i).nodeValue,m$1===""?name$3:m$1.toLowerCase()));
           !usedHoles.Add(name$3)?console.warn("Hole mapped twice",name$3):void 0;
          }
          for(i$1=0,$4=$1.childNodes.length-1;i$1<=$4;i$1++){
           n=$1.childNodes[i$1];
           Unchecked.Equals(n.nodeType,Node.ELEMENT_NODE)?!usedHoles.Add(n.nodeName.toLowerCase())?console.warn("Hole filled twice",instName):void 0:void 0;
          }
          singleTextFill=$1.childNodes.length===1&&Unchecked.Equals($1.firstChild.nodeType,Node.TEXT_NODE);
          if(singleTextFill)
           {
            x=Prepare.fillTextHole(instance,$1.firstChild.textContent,instName);
            ((function(a)
            {
             return function(o)
             {
              if(o!=null)
               a(o.$0);
             };
            }((f=function(usedHoles$1)
            {
             return function(a)
             {
              return usedHoles$1.Add(a);
             };
            }(usedHoles),function(x$1)
            {
             return g(f(x$1));
            })))(x));
           }
          Prepare.removeHolesExcept(instance,usedHoles);
          if(!singleTextFill)
           {
            for(i$2=0,$5=$1.childNodes.length-1;i$2<=$5;i$2++){
             n$1=$1.childNodes[i$2];
             Unchecked.Equals(n$1.nodeType,Node.ELEMENT_NODE)?n$1.hasAttributes()?Prepare.fillInstanceAttrs(instance,n$1):fillDocHole(instance,n$1):void 0;
            }
           }
          Prepare.mapHoles(instance,mappings);
          Prepare.fill(instance,$1.parentNode,$1);
          $1.parentNode.removeChild($1);
          return;
         }
       }
      break;
    }
  }
  function fillDocHole(instance,fillWith)
  {
   var m,name$2,m$1;
   function fillHole(p,n)
   {
    var parsed,i,$1;
    if(name$2==="title"&&fillWith.hasChildNodes())
     {
      parsed=$.parseHTML(fillWith.textContent);
      fillWith.removeChild(fillWith.firstChild);
      for(i=0,$1=parsed.length-1;i<=$1;i++)fillWith.appendChild(Arrays.get(parsed,i));
     }
    else
     null;
    convertElement(fillWith);
    return Prepare.fill(fillWith,p,n);
   }
   name$2=fillWith.nodeName.toLowerCase();
   DomUtility.IterSelector(instance,"[ws-attr-holes]",function(e)
   {
    var holeAttrs,i,$1,attrName,_this;
    holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
    for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
     attrName=Arrays.get(holeAttrs,i);
     e.setAttribute(attrName,(_this=new Global.RegExp("\\${"+name$2+"}","ig"),e.getAttribute(attrName).replace(_this,fillWith.textContent)));
    }
   });
   m$1=instance.querySelector("[ws-hole="+name$2+"]");
   if(Unchecked.Equals(m$1,null))
    {
     m=instance.querySelector("[ws-replace="+name$2+"]");
     return Unchecked.Equals(m,null)?null:(fillHole(m.parentNode,m),void m.parentNode.removeChild(m));
    }
   else
    {
     while(m$1.hasChildNodes())
      m$1.removeChild(m$1.lastChild);
     m$1.removeAttribute("ws-hole");
     return fillHole(m$1,null);
    }
  }
  function convertElement(el)
  {
   if(Strings.StartsWith(el.nodeName.toLowerCase(),"ws-"))
    convertInstantiation(el);
   else
    {
     Prepare.convertAttrs(el);
     convertNodeAndSiblings(el.firstChild);
    }
  }
  function convertNodeAndSiblings(n)
  {
   return recF(0,n);
  }
  function convertInstantiation(el)
  {
   return recF(1,el);
  }
  fakeroot=root==null?Templates.FakeRoot(els):root.$0;
  name$1=(name==null?"":name.$0).toLowerCase();
  Templates.LoadedTemplateFile(baseName).set_Item(name$1,fakeroot);
  Arrays.length(els)>0?(function(el)
  {
   var m,m$1,name$2,name$3;
   while(true)
    {
     m=el.querySelector("[ws-template]");
     if(Unchecked.Equals(m,null))
      {
       m$1=el.querySelector("[ws-children-template]");
       if(Unchecked.Equals(m$1,null))
        return null;
       else
        {
         name$2=m$1.getAttribute("ws-children-template");
         m$1.removeAttribute("ws-children-template");
         Templates.PrepareTemplateStrict(baseName,{
          $:1,
          $0:name$2
         },DomUtility.ChildrenArray(m$1),null,null);
         el=el;
        }
      }
     else
      {
       name$3=m.getAttribute("ws-template");
       (Templates.PrepareSingleTemplate(baseName,{
        $:1,
        $0:name$3
       },m))(null);
       el=el;
      }
    }
  }(fakeroot),convertNodeAndSiblings(Arrays.get(els,0))):void 0;
 };
 Templates.ChildrenTemplate=function(el,fillWith)
 {
  var p,updates,docTreeNode,m,$1;
  p=Templates.InlineTemplate(el,fillWith);
  updates=p[1];
  docTreeNode=p[0];
  m=docTreeNode.Els;
  return!Unchecked.Equals(m,null)&&m.length===1&&(Arrays.get(m,0)instanceof Node&&(Unchecked.Equals(Arrays.get(m,0).nodeType,Node.ELEMENT_NODE)&&($1=Arrays.get(m,0),true)))?Elt.TreeNode(docTreeNode,updates):Doc.Mk({
   $:6,
   $0:docTreeNode
  },updates);
 };
 Templates.LocalTemplatesLoaded=function()
 {
  SC$4.$cctor();
  return SC$4.LocalTemplatesLoaded;
 };
 Templates.set_LocalTemplatesLoaded=function($1)
 {
  SC$4.$cctor();
  SC$4.LocalTemplatesLoaded=$1;
 };
 Templates.LoadNestedTemplates=function(root,baseName)
 {
  var loadedTpls,rawTpls,wsTemplates,i,$1,node,name,wsChildrenTemplates,i$1,$2,node$1,name$1,els,instantiated;
  function prepareTemplate(name$2)
  {
   var m,o;
   if(!loadedTpls.ContainsKey(name$2))
    {
     m=(o=null,[rawTpls.TryGetValue(name$2,{
      get:function()
      {
       return o;
      },
      set:function(v)
      {
       o=v;
      }
     }),o]);
     m[0]?(instantiated.Add(name$2),rawTpls.Remove(name$2),Templates.PrepareTemplateStrict(baseName,{
      $:1,
      $0:name$2
     },m[1][0],{
      $:1,
      $0:m[1][1]
     },{
      $:1,
      $0:prepareTemplate
     })):console.warn(instantiated.Contains(name$2)?"Encountered loop when instantiating "+name$2:"Local template does not exist: "+name$2);
    }
  }
  loadedTpls=Templates.LoadedTemplateFile(baseName);
  rawTpls=new Dictionary.New$5();
  wsTemplates=root.querySelectorAll("[ws-template]");
  for(i=0,$1=wsTemplates.length-1;i<=$1;i++){
   node=wsTemplates[i];
   name=node.getAttribute("ws-template").toLowerCase();
   node.removeAttribute("ws-template");
   rawTpls.set_Item(name,[[node],Templates.FakeRootSingle(node)]);
  }
  wsChildrenTemplates=root.querySelectorAll("[ws-children-template]");
  for(i$1=0,$2=wsChildrenTemplates.length-1;i$1<=$2;i$1++){
   node$1=wsChildrenTemplates[i$1];
   name$1=node$1.getAttribute("ws-children-template").toLowerCase();
   node$1.removeAttribute("ws-children-template");
   rawTpls.set_Item(name$1,(els=DomUtility.ChildrenArray(node$1),[els,Templates.FakeRoot(els)]));
  }
  instantiated=new HashSet.New$3();
  while(rawTpls.count>0)
   prepareTemplate(Seq.head(rawTpls.get_Keys()));
 };
 Templates.LoadedTemplates=function()
 {
  SC$4.$cctor();
  return SC$4.LoadedTemplates;
 };
 Templates.LoadedTemplateFile=function(name)
 {
  var m,o,d;
  m=(o=null,[Templates.LoadedTemplates().TryGetValue(name,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?m[1]:(d=new Dictionary.New$5(),(Templates.LoadedTemplates().set_Item(name,d),d));
 };
 Templates.FakeRoot=function(els)
 {
  var fakeroot,i,$1;
  fakeroot=self.document.createElement("div");
  for(i=0,$1=els.length-1;i<=$1;i++)fakeroot.appendChild(Arrays.get(els,i));
  return fakeroot;
 };
 Templates.PrepareSingleTemplate=function(baseName,name,el)
 {
  var root,e,r;
  root=Templates.FakeRootSingle(el);
  e=[el];
  r={
   $:1,
   $0:root
  };
  return function(p)
  {
   Templates.PrepareTemplateStrict(baseName,name,e,r,p);
  };
 };
 Templates.InlineTemplate=function(el,fillWith)
 {
  var els,$1,$2,$3,holes,updates,attrs,afterRender,fw,e,x;
  function addAttr(el$1,attr)
  {
   var attr$1,m,f;
   attr$1=Attrs.Insert(el$1,attr);
   updates.push(Attrs.Updates(attr$1));
   attrs.push([el$1,attr$1]);
   m=Runtime$1.GetOptional(attr$1.OnAfterRender);
   return m==null?null:(f=m.$0,void afterRender.push(function()
   {
    f(el$1);
   }));
  }
  function tryGetAsDoc(name)
  {
   var m,o;
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   return m[0]?m[1].$==0?{
    $:1,
    $0:m[1].$1
   }:m[1].$==1?{
    $:1,
    $0:Doc.TextNode(m[1].$1)
   }:m[1].$==2?{
    $:1,
    $0:Doc.TextView(m[1].$1)
   }:m[1].$==8?{
    $:1,
    $0:Doc.TextView(m[1].$1.get_View())
   }:m[1].$==9?{
    $:1,
    $0:Doc.TextView(View.Map(Global.String,m[1].$1.get_View()))
   }:m[1].$==10?{
    $:1,
    $0:Doc.TextView(View.Map(function(i)
    {
     return i.get_Input();
    },m[1].$1.get_View()))
   }:m[1].$==11?{
    $:1,
    $0:Doc.TextView(View.Map(Global.String,m[1].$1.get_View()))
   }:m[1].$==12?{
    $:1,
    $0:Doc.TextView(View.Map(function(i)
    {
     return i.get_Input();
    },m[1].$1.get_View()))
   }:m[1].$==13?{
    $:1,
    $0:Doc.TextView(View.Map(Global.String,m[1].$1.get_View()))
   }:(console.warn("Content hole filled with attribute data",name),null):null;
  }
  holes=[];
  updates=[];
  attrs=[];
  afterRender=[];
  fw=new Dictionary.New$5();
  e=Enumerator.Get(fillWith);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     fw.set_Item(x.$0,x);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  els=DomUtility.ChildrenArray(el);
  DomUtility.IterSelector(el,"[ws-hole]",function(p)
  {
   var m,doc,name;
   name=p.getAttribute("ws-hole");
   p.removeAttribute("ws-hole");
   while(p.hasChildNodes())
    p.removeChild(p.lastChild);
   m=tryGetAsDoc(name);
   m!=null&&m.$==1?(doc=m.$0,Docs.LinkElement(p,doc.docNode),holes.push(DocElemNode.New(Attrs.Empty(p),doc.docNode,null,p,Fresh.Int(),null)),updates.push(doc.updates)):void 0;
  });
  DomUtility.IterSelector(el,"[ws-replace]",function(e$1)
  {
   var m,doc,p,after,before,o;
   m=tryGetAsDoc(e$1.getAttribute("ws-replace"));
   m!=null&&m.$==1?(doc=m.$0,p=e$1.parentNode,after=self.document.createTextNode(""),p.replaceChild(after,e$1),before=Docs.InsertBeforeDelim(after,doc.docNode),o=Arrays.tryFindIndex(function(y)
   {
    return e$1===y;
   },els),o==null?void 0:Arrays.set(els,o.$0,doc.docNode),holes.push(DocElemNode.New(Attrs.Empty(p),doc.docNode,{
    $:1,
    $0:[before,after]
   },p,Fresh.Int(),null)),updates.push(doc.updates)):void 0;
  });
  DomUtility.IterSelector(el,"[ws-attr]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-attr");
   e$1.removeAttribute("ws-attr");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   m[0]?m[1].$==3?addAttr(e$1,m[1].$1):console.warn("Attribute hole filled with non-attribute data",name):void 0;
  });
  DomUtility.IterSelector(el,"[ws-on]",function(e$1)
  {
   addAttr(e$1,AttrProxy.Concat(Arrays.choose(function(x$1)
   {
    var a,m,o;
    a=Strings.SplitChars(x$1,[":"],1);
    m=(o=null,[fw.TryGetValue(Arrays.get(a,1),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    return m[0]?m[1].$==4?{
     $:1,
     $0:AttrModule.Handler(Arrays.get(a,0),m[1].$1)
    }:m[1].$==5?{
     $:1,
     $0:AttrProxy.Handler(Arrays.get(a,0),m[1].$2)
    }:(console.warn("Event hole on"+Arrays.get(a,0)+" filled with non-event data",Arrays.get(a,1)),null):null;
   },Strings.SplitChars(e$1.getAttribute("ws-on"),[" "],1))));
   e$1.removeAttribute("ws-on");
  });
  DomUtility.IterSelector(el,"[ws-onafterrender]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-onafterrender");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   m[0]?m[1].$==6?(e$1.removeAttribute("ws-onafterrender"),addAttr(e$1,AttrModule.OnAfterRender(m[1].$1))):m[1].$==7?(e$1.removeAttribute("ws-onafterrender"),addAttr(e$1,AttrModule.OnAfterRender(m[1].$1))):console.warn("onafterrender hole filled with non-onafterrender data",name):void 0;
  });
  DomUtility.IterSelector(el,"[ws-var]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-var");
   e$1.removeAttribute("ws-var");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   m[0]?m[1].$==8?addAttr(e$1,AttrModule.Value(m[1].$1)):m[1].$==9?addAttr(e$1,AttrModule.Checked(m[1].$1)):m[1].$==10?addAttr(e$1,AttrModule.IntValue(m[1].$1)):m[1].$==11?addAttr(e$1,AttrModule.IntValueUnchecked(m[1].$1)):m[1].$==12?addAttr(e$1,AttrModule.FloatValue(m[1].$1)):m[1].$==13?addAttr(e$1,AttrModule.FloatValueUnchecked(m[1].$1)):console.warn("Var hole filled with non-Var data",name):void 0;
  });
  DomUtility.IterSelector(el,"[ws-attr-holes]",function(e$1)
  {
   var re,holeAttrs,i,$4;
   re=new Global.RegExp(Templates.TextHoleRE(),"g");
   holeAttrs=Strings.SplitChars(e$1.getAttribute("ws-attr-holes"),[" "],1);
   e$1.removeAttribute("ws-attr-holes");
   for(i=0,$4=holeAttrs.length-1;i<=$4;i++)(function()
   {
    var m,lastIndex,$5,finalText,value,s,s$1,s$2,s$3,attrName,s$4,res,textBefore;
    attrName=Arrays.get(holeAttrs,i);
    s$4=e$1.getAttribute(attrName);
    m=null;
    lastIndex=0;
    res=[];
    while(m=re.exec(s$4),m!==null)
     {
      textBefore=Slice.string(s$4,{
       $:1,
       $0:lastIndex
      },{
       $:1,
       $0:re.lastIndex-Arrays.get(m,0).length-1
      });
      lastIndex=re.lastIndex;
      res.push([textBefore,Arrays.get(m,1)]);
     }
    finalText=Slice.string(s$4,{
     $:1,
     $0:lastIndex
    },null);
    re.lastIndex=0;
    value=Arrays.foldBack(function($6,$7)
    {
     return(function(t)
     {
      var textBefore$1,holeName;
      textBefore$1=t[0];
      holeName=t[1];
      return function(t$1)
      {
       var textAfter,views,holeContent,m$1,o;
       textAfter=t$1[0];
       views=t$1[1];
       holeContent=(m$1=(o=null,[fw.TryGetValue(holeName,{
        get:function()
        {
         return o;
        },
        set:function(v)
        {
         o=v;
        }
       }),o]),m$1[0]?m$1[1].$==1?{
        $:0,
        $0:m$1[1].$1
       }:m$1[1].$==2?{
        $:1,
        $0:m$1[1].$1
       }:m$1[1].$==8?{
        $:1,
        $0:m$1[1].$1.get_View()
       }:m$1[1].$==9?{
        $:1,
        $0:View.Map(Global.String,m$1[1].$1.get_View())
       }:m$1[1].$==10?{
        $:1,
        $0:View.Map(function(i$1)
        {
         return i$1.get_Input();
        },m$1[1].$1.get_View())
       }:m$1[1].$==11?{
        $:1,
        $0:View.Map(Global.String,m$1[1].$1.get_View())
       }:m$1[1].$==12?{
        $:1,
        $0:View.Map(function(i$1)
        {
         return i$1.get_Input();
        },m$1[1].$1.get_View())
       }:m$1[1].$==13?{
        $:1,
        $0:View.Map(Global.String,m$1[1].$1.get_View())
       }:(console.warn("Attribute value hole filled with non-text data",holeName),{
        $:0,
        $0:""
       }):{
        $:0,
        $0:""
       });
       return holeContent.$==1?[textBefore$1,new T({
        $:1,
        $0:textAfter===""?holeContent.$0:View.Map(function(s$5)
        {
         return s$5+textAfter;
        },holeContent.$0),
        $1:views
       })]:[textBefore$1+holeContent.$0+textAfter,views];
      };
     }($6))($7);
    },res,[finalText,T.Empty]);
    return addAttr(e$1,value[1].$==1?value[1].$1.$==1?value[1].$1.$1.$==1?value[1].$1.$1.$1.$==0?(s=value[0],AttrModule.Dynamic(attrName,View.Map3(function(v1,v2,v3)
    {
     return s+v1+v2+v3;
    },value[1].$0,value[1].$1.$0,value[1].$1.$1.$0))):(s$1=value[0],AttrModule.Dynamic(attrName,View.Map(function(vs)
    {
     return s$1+Strings.concat("",vs);
    },View.Sequence(value[1])))):(s$2=value[0],AttrModule.Dynamic(attrName,View.Map2(function(v1,v2)
    {
     return s$2+v1+v2;
    },value[1].$0,value[1].$1.$0))):value[0]===""?AttrModule.Dynamic(attrName,value[1].$0):(s$3=value[0],AttrModule.Dynamic(attrName,View.Map(function(v)
    {
     return s$3+v;
    },value[1].$0))):AttrProxy.Create(attrName,value[0]));
   }());
  });
  return[Runtime$1.DeleteEmptyFields({
   Els:els,
   Dirty:true,
   Holes:holes,
   Attrs:attrs,
   Render:($1=afterRender.length==0?null:{
    $:1,
    $0:function(el$1)
    {
     Arrays.iter(function(f)
     {
      f(el$1);
     },afterRender);
    }
   },$1?$1.$0:void 0),
   El:($2=!Unchecked.Equals(els,null)&&els.length===1&&(Arrays.get(els,0)instanceof Node&&(Arrays.get(els,0)instanceof Global.Element&&($3=Arrays.get(els,0),true)))?{
    $:1,
    $0:$3
   }:null,$2?$2.$0:void 0)
  },["Render","El"]),Array.TreeReduce(View.Const(),View.Map2Unit,updates)];
 };
 Templates.FakeRootSingle=function(el)
 {
  var m,m$1,n;
  el.removeAttribute("ws-template");
  m=el.getAttribute("ws-replace");
  m===null?void 0:(el.removeAttribute("ws-replace"),m$1=el.parentNode,Unchecked.Equals(m$1,null)?void 0:(n=self.document.createElement(el.tagName),n.setAttribute("ws-replace",m),m$1.replaceChild(n,el)));
  return Templates.FakeRoot([el]);
 };
 Templates.TextHoleRE=function()
 {
  SC$4.$cctor();
  return SC$4.TextHoleRE;
 };
 Utils.toSafe=function(s)
 {
  return s==null?"":s;
 };
 Strings.StartsWith=function(t,s)
 {
  return t.substring(0,s.length)==s;
 };
 Strings.Substring=function(s,ix,ct)
 {
  return s.substr(ix,ct);
 };
 Strings.SplitChars=function(s,sep,opts)
 {
  return Strings.Split(s,new Global.RegExp("["+Strings.RegexEscape(sep.join(""))+"]"),opts);
 };
 Strings.concat=function(separator,strings)
 {
  return Arrays.ofSeq(strings).join(separator);
 };
 Strings.Split=function(s,pat,opts)
 {
  return opts===1?Arrays.filter(function(x)
  {
   return x!=="";
  },Strings.SplitWith(s,pat)):Strings.SplitWith(s,pat);
 };
 Strings.RegexEscape=function(s)
 {
  return s.replace(new Global.RegExp("[-\\/\\\\^$*+?.()|[\\]{}]","g"),"\\$&");
 };
 Strings.SplitWith=function(str,pat)
 {
  return str.split(pat);
 };
 Strings.forall=function(f,s)
 {
  return Seq.forall(f,Strings.protect(s));
 };
 Strings.IsNullOrEmpty=function(x)
 {
  return x==null||x=="";
 };
 Strings.Join=function(sep,values)
 {
  return values.join(sep);
 };
 Strings.protect=function(s)
 {
  return s===null?"":s;
 };
 SC$1.$cctor=function()
 {
  SC$1.$cctor=Global.ignore;
  SC$1.counter=0;
 };
 FSharpMap=Collections.FSharpMap=Runtime$1.Class({
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kv)
   {
    return{
     K:kv.Key,
     V:kv.Value
    };
   },BalancedTree.Enumerate(false,this.tree)));
  },
  Equals:function(other)
  {
   return this.get_Count()===other.get_Count()&&Seq.forall2(Unchecked.Equals,this,other);
  },
  get_Count:function()
  {
   var tree;
   tree=this.tree;
   return tree==null?0:tree.Count;
  },
  GetHashCode:function()
  {
   return Unchecked.Hash(Arrays.ofSeq(this));
  },
  Add:function(k,v)
  {
   return new FSharpMap.New$1(BalancedTree.Add(Pair.New(k,v),this.tree));
  },
  get_IsEmpty:function()
  {
   return this.tree==null;
  },
  get_Tree:function()
  {
   return this.tree;
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  },
  GetEnumerator0:function()
  {
   return this.GetEnumerator$1();
  },
  CompareTo0:function(other)
  {
   return Seq.compareWith(Unchecked.Compare,this,other);
  }
 },Obj,FSharpMap);
 FSharpMap.New=Runtime$1.Ctor(function(s)
 {
  FSharpMap.New$1.call(this,MapUtil.fromSeq(s));
 },FSharpMap);
 FSharpMap.New$1=Runtime$1.Ctor(function(tree)
 {
  Obj.New.call(this);
  this.tree=tree;
 },FSharpMap);
 Docs.CreateTextNode=function()
 {
  return{
   Text:DomUtility.CreateText(""),
   Dirty:false,
   Value:""
  };
 };
 Docs.UpdateTextNode=function(n,t)
 {
  n.Value=t;
  n.Dirty=true;
 };
 Docs.CreateRunState=function(parent,doc)
 {
  return RunState.New(NodeSet.get_Empty(),Docs.CreateElemNode(parent,Attrs.EmptyAttr(),doc));
 };
 Docs.PerformAnimatedUpdate=function(childrenOnly,st,doc)
 {
  var b;
  return An.get_UseAnimations()?(b=null,Concurrency.Delay(function()
  {
   var cur,change,enter;
   cur=NodeSet.FindAll(doc);
   change=Docs.ComputeChangeAnim(st,cur);
   enter=Docs.ComputeEnterAnim(st,cur);
   return Concurrency.Bind(An.Play(An.Append(change,Docs.ComputeExitAnim(st,cur))),function()
   {
    return Concurrency.Bind(Docs.SyncElemNodesNextFrame(childrenOnly,st),function()
    {
     return Concurrency.Bind(An.Play(enter),function()
     {
      st.PreviousNodes=cur;
      return Concurrency.Return(null);
     });
    });
   });
  })):Docs.SyncElemNodesNextFrame(childrenOnly,st);
 };
 Docs.PerformSyncUpdate=function(childrenOnly,st,doc)
 {
  var cur;
  cur=NodeSet.FindAll(doc);
  Docs.SyncElemNode(childrenOnly,st.Top);
  st.PreviousNodes=cur;
 };
 Docs.CreateEmbedNode=function()
 {
  return{
   Current:null,
   Dirty:false
  };
 };
 Docs.UpdateEmbedNode=function(node,upd)
 {
  node.Current=upd;
  node.Dirty=true;
 };
 Docs.LinkElement=function(el,children)
 {
  Docs.InsertDoc(el,children,null);
 };
 Docs.InsertBeforeDelim=function(afterDelim,doc)
 {
  var p,before;
  p=afterDelim.parentNode;
  before=self.document.createTextNode("");
  p.insertBefore(before,afterDelim);
  Docs.LinkPrevElement(afterDelim,doc);
  return before;
 };
 Docs.CreateElemNode=function(el,attr,children)
 {
  var attr$1;
  Docs.LinkElement(el,children);
  attr$1=Attrs.Insert(el,attr);
  return DocElemNode.New(attr$1,children,null,el,Fresh.Int(),Runtime$1.GetOptional(attr$1.OnAfterRender));
 };
 Docs.SyncElemNodesNextFrame=function(childrenOnly,st)
 {
  function a(ok)
  {
   Global.requestAnimationFrame(function()
   {
    Docs.SyncElemNode(childrenOnly,st.Top);
    ok();
   });
  }
  return Settings.BatchUpdatesEnabled()?Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  }):(Docs.SyncElemNode(childrenOnly,st.Top),Concurrency.Return(null));
 };
 Docs.ComputeExitAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetExitAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(cur,NodeSet.Filter(function(n)
  {
   return Attrs.HasExitAnim(n.Attr);
  },st.PreviousNodes)))));
 };
 Docs.ComputeEnterAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetEnterAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(st.PreviousNodes,NodeSet.Filter(function(n)
  {
   return Attrs.HasEnterAnim(n.Attr);
  },cur)))));
 };
 Docs.ComputeChangeAnim=function(st,cur)
 {
  var relevant;
  function a(n)
  {
   return Attrs.HasChangeAnim(n.Attr);
  }
  relevant=function(a$1)
  {
   return NodeSet.Filter(a,a$1);
  };
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetChangeAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Intersect(relevant(st.PreviousNodes),relevant(cur)))));
 };
 Docs.SyncElemNode=function(childrenOnly,el)
 {
  !childrenOnly?Docs.SyncElement(el):void 0;
  Docs.Sync(el.Children);
  Docs.AfterRender(el);
 };
 Docs.InsertDoc=function(parent,doc,pos)
 {
  var d;
  return doc!=null&&doc.$==1?Docs.InsertNode(parent,doc.$0.El,pos):doc!=null&&doc.$==2?(d=doc.$0,(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos))):doc==null?pos:doc!=null&&doc.$==4?Docs.InsertNode(parent,doc.$0.Text,pos):doc!=null&&doc.$==5?Docs.InsertNode(parent,doc.$0,pos):doc!=null&&doc.$==6?Arrays.foldBack(function($1,$2)
  {
   return $1==null||$1.constructor===Object?Docs.InsertDoc(parent,$1,$2):Docs.InsertNode(parent,$1,$2);
  },doc.$0.Els,pos):Docs.InsertDoc(parent,doc.$0,Docs.InsertDoc(parent,doc.$1,pos));
 };
 Docs.LinkPrevElement=function(el,children)
 {
  Docs.InsertDoc(el.parentNode,children,el);
 };
 Docs.SyncElement=function(el)
 {
  function hasDirtyChildren(el$1)
  {
   function dirty(doc)
   {
    var d,t;
    return doc!=null&&doc.$==0?dirty(doc.$0)||dirty(doc.$1):doc!=null&&doc.$==2?(d=doc.$0,d.Dirty||dirty(d.Current)):doc!=null&&doc.$==6&&(t=doc.$0,t.Dirty||Arrays.exists(hasDirtyChildren,t.Holes));
   }
   return dirty(el$1.Children);
  }
  Attrs.Sync(el.El,el.Attr);
  hasDirtyChildren(el)?Docs.DoSyncElement(el):void 0;
 };
 Docs.Sync=function(doc)
 {
  var d,t;
  if(doc!=null&&doc.$==1)
   Docs.SyncElemNode(false,doc.$0);
  else
   if(doc!=null&&doc.$==2)
    Docs.Sync(doc.$0.Current);
   else
    if(doc==null)
     ;
    else
     if(doc!=null&&doc.$==5)
      ;
     else
      if(doc!=null&&doc.$==4)
       {
        d=doc.$0;
        d.Dirty?(d.Text.nodeValue=d.Value,d.Dirty=false):void 0;
       }
      else
       if(doc!=null&&doc.$==6)
        {
         t=doc.$0;
         Arrays.iter(function(e)
         {
          Docs.SyncElemNode(false,e);
         },t.Holes);
         Arrays.iter(function(t$1)
         {
          Attrs.Sync(t$1[0],t$1[1]);
         },t.Attrs);
         Docs.AfterRender(t);
        }
       else
        {
         Docs.Sync(doc.$0);
         Docs.Sync(doc.$1);
        }
 };
 Docs.AfterRender=function(el)
 {
  var m;
  m=Runtime$1.GetOptional(el.Render);
  m!=null&&m.$==1?(m.$0(el.El),Runtime$1.SetOptional(el,"Render",null)):void 0;
 };
 Docs.InsertNode=function(parent,node,pos)
 {
  DomUtility.InsertAt(parent,pos,node);
  return node;
 };
 Docs.DoSyncElement=function(el)
 {
  var parent,p,m;
  function ins(doc,pos)
  {
   var d,t;
   return doc!=null&&doc.$==1?doc.$0.El:doc!=null&&doc.$==2?(d=doc.$0,d.Dirty?(d.Dirty=false,Docs.InsertDoc(parent,d.Current,pos)):ins(d.Current,pos)):doc==null?pos:doc!=null&&doc.$==4?doc.$0.Text:doc!=null&&doc.$==5?doc.$0:doc!=null&&doc.$==6?(t=doc.$0,(t.Dirty?t.Dirty=false:void 0,Arrays.foldBack(function($1,$2)
   {
    return $1==null||$1.constructor===Object?ins($1,$2):$1;
   },t.Els,pos))):ins(doc.$0,ins(doc.$1,pos));
  }
  parent=el.El;
  DomNodes.Iter((p=el.El,function(e)
  {
   DomUtility.RemoveNode(p,e);
  }),DomNodes.Except(DomNodes.DocChildren(el),DomNodes.Children(el.El,Runtime$1.GetOptional(el.Delimiters))));
  ins(el.Children,(m=Runtime$1.GetOptional(el.Delimiters),m!=null&&m.$==1?m.$0[1]:null));
 };
 Map.OfArray=function(a)
 {
  return new FSharpMap.New$1(BalancedTree.OfSeq(Seq.map(function($1)
  {
   return Pair.New($1[0],$1[1]);
  },a)));
 };
 Map.FoldBack=function(f,m,s)
 {
  return Seq.fold(function(s$1,kv)
  {
   return f(kv.Key,kv.Value,s$1);
  },s,BalancedTree.Enumerate(true,m.get_Tree()));
 };
 Map.ToSeq=function(m)
 {
  return Seq.map(function(kv)
  {
   return[kv.Key,kv.Value];
  },BalancedTree.Enumerate(false,m.get_Tree()));
 };
 Lazy.CreateFromValue=function(v)
 {
  return LazyRecord.New(true,v,Lazy.cachedLazy);
 };
 Lazy.cachedLazy=function()
 {
  return this.v;
 };
 Lazy.Create=function(f)
 {
  return LazyRecord.New(false,f,Lazy.forceLazy);
 };
 Lazy.forceLazy=function()
 {
  var v;
  v=this.v();
  this.c=true;
  this.v=v;
  this.f=Lazy.cachedLazy;
  return v;
 };
 Tree.New=function(Node$1,Left,Right,Height,Count)
 {
  return{
   Node:Node$1,
   Left:Left,
   Right:Right,
   Height:Height,
   Count:Count
  };
 };
 Pair=Collections.Pair=Runtime$1.Class({
  Equals:function(other)
  {
   return Unchecked.Equals(this.Key,other.Key);
  },
  GetHashCode:function()
  {
   return Unchecked.Hash(this.Key);
  },
  CompareTo0:function(other)
  {
   return Unchecked.Compare(this.Key,other.Key);
  }
 },null,Pair);
 Pair.New=function(Key,Value)
 {
  return new Pair({
   Key:Key,
   Value:Value
  });
 };
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.EmptyAttr=null;
 };
 DocElemNode=UI.DocElemNode=Runtime$1.Class({
  Equals:function(o)
  {
   return this.ElKey===o.ElKey;
  },
  GetHashCode:function()
  {
   return this.ElKey;
  }
 },null,DocElemNode);
 DocElemNode.New=function(Attr,Children,Delimiters,El,ElKey,Render)
 {
  var $1;
  return new DocElemNode(($1={
   Attr:Attr,
   Children:Children,
   El:El,
   ElKey:ElKey
  },(Runtime$1.SetOptional($1,"Delimiters",Delimiters),Runtime$1.SetOptional($1,"Render",Render),$1)));
 };
 Prepare.convertTextNode=function(n)
 {
  var m,li,$1,s,strRE,hole;
  m=null;
  li=0;
  s=n.textContent;
  strRE=new Global.RegExp(Templates.TextHoleRE(),"g");
  while(m=strRE.exec(s),m!==null)
   {
    n.parentNode.insertBefore(self.document.createTextNode(Slice.string(s,{
     $:1,
     $0:li
    },{
     $:1,
     $0:strRE.lastIndex-Arrays.get(m,0).length-1
    })),n);
    li=strRE.lastIndex;
    hole=self.document.createElement("span");
    hole.setAttribute("ws-replace",Arrays.get(m,1).toLowerCase());
    n.parentNode.insertBefore(hole,n);
   }
  strRE.lastIndex=0;
  n.textContent=Slice.string(s,{
   $:1,
   $0:li
  },null);
 };
 Prepare.failNotLoaded=function(name)
 {
  console.warn("Instantiating non-loaded template",name);
 };
 Prepare.fillTextHole=function(instance,fillWith,templateName)
 {
  var m;
  m=instance.querySelector("[ws-replace]");
  return Unchecked.Equals(m,null)?(console.warn("Filling non-existent text hole",templateName),null):(m.parentNode.replaceChild(new Global.Text(fillWith),m),{
   $:1,
   $0:m.getAttribute("ws-replace")
  });
 };
 Prepare.removeHolesExcept=function(instance,dontRemove)
 {
  function run(attrName)
  {
   DomUtility.IterSelector(instance,"["+attrName+"]",function(e)
   {
    if(!dontRemove.Contains(e.getAttribute(attrName)))
     e.removeAttribute(attrName);
   });
  }
  run("ws-attr");
  run("ws-onafterrender");
  run("ws-var");
  DomUtility.IterSelector(instance,"[ws-hole]",function(e)
  {
   if(!dontRemove.Contains(e.getAttribute("ws-hole")))
    {
     e.removeAttribute("ws-hole");
     while(e.hasChildNodes())
      e.removeChild(e.lastChild);
    }
  });
  DomUtility.IterSelector(instance,"[ws-replace]",function(e)
  {
   if(!dontRemove.Contains(e.getAttribute("ws-replace")))
    e.parentNode.removeChild(e);
  });
  DomUtility.IterSelector(instance,"[ws-on]",function(e)
  {
   e.setAttribute("ws-on",Strings.concat(" ",Arrays.filter(function(x)
   {
    return dontRemove.Contains(Arrays.get(Strings.SplitChars(x,[":"],1),1));
   },Strings.SplitChars(e.getAttribute("ws-on"),[" "],1))));
  });
  DomUtility.IterSelector(instance,"[ws-attr-holes]",function(e)
  {
   var holeAttrs,i,$1,attrName,_this;
   holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
   for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
    attrName=Arrays.get(holeAttrs,i);
    e.setAttribute(attrName,(_this=new Global.RegExp(Templates.TextHoleRE(),"g"),e.getAttribute(attrName).replace(_this,function($2,$3)
    {
     return dontRemove.Contains($3)?$2:"";
    })));
   }
  });
 };
 Prepare.fillInstanceAttrs=function(instance,fillWith)
 {
  var name,m,i,$1,a;
  Prepare.convertAttrs(fillWith);
  name=fillWith.nodeName.toLowerCase();
  m=instance.querySelector("[ws-attr="+name+"]");
  if(Unchecked.Equals(m,null))
   console.warn("Filling non-existent attr hole",name);
  else
   {
    m.removeAttribute("ws-attr");
    for(i=0,$1=fillWith.attributes.length-1;i<=$1;i++){
     a=fillWith.attributes.item(i);
     a.name==="class"&&m.hasAttribute("class")?m.setAttribute("class",m.getAttribute("class")+" "+a.nodeValue):m.setAttribute(a.name,a.nodeValue);
    }
   }
 };
 Prepare.mapHoles=function(t,mappings)
 {
  function run(attrName)
  {
   DomUtility.IterSelector(t,"["+attrName+"]",function(e)
   {
    var m,o;
    m=(o=null,[mappings.TryGetValue(e.getAttribute(attrName).toLowerCase(),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    m[0]?e.setAttribute(attrName,m[1]):void 0;
   });
  }
  run("ws-hole");
  run("ws-replace");
  run("ws-attr");
  run("ws-onafterrender");
  run("ws-var");
  DomUtility.IterSelector(t,"[ws-on]",function(e)
  {
   e.setAttribute("ws-on",Strings.concat(" ",Arrays.map(function(x)
   {
    var a,m,o;
    a=Strings.SplitChars(x,[":"],1);
    m=(o=null,[mappings.TryGetValue(Arrays.get(a,1),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    return m[0]?Arrays.get(a,0)+":"+m[1]:x;
   },Strings.SplitChars(e.getAttribute("ws-on"),[" "],1))));
  });
  DomUtility.IterSelector(t,"[ws-attr-holes]",function(e)
  {
   var holeAttrs,i,$1;
   holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
   for(i=0,$1=holeAttrs.length-1;i<=$1;i++)(function()
   {
    var attrName;
    function f(s,a)
    {
     var a$1;
     a$1=Operators.KeyValue(a);
     return s.replace(new Global.RegExp("\\${"+a$1[0]+"}","ig"),"${"+a$1[1]+"}");
    }
    attrName=Arrays.get(holeAttrs,i);
    return e.setAttribute(attrName,(((Runtime$1.Curried3(Seq.fold))(f))(e.getAttribute(attrName)))(mappings));
   }());
  });
 };
 Prepare.fill=function(fillWith,p,n)
 {
  while(true)
   if(fillWith.hasChildNodes())
    n=p.insertBefore(fillWith.lastChild,n);
   else
    return null;
 };
 Prepare.convertAttrs=function(el)
 {
  var attrs,toRemove,events,holedAttrs,i,$1,a,_this;
  function lowercaseAttr(name)
  {
   var m;
   m=el.getAttribute(name);
   m===null?void 0:el.setAttribute(name,m.toLowerCase());
  }
  attrs=el.attributes;
  toRemove=[];
  events=[];
  holedAttrs=[];
  for(i=0,$1=attrs.length-1;i<=$1;i++){
   a=attrs.item(i);
   Strings.StartsWith(a.nodeName,"ws-on")&&a.nodeName!=="ws-onafterrender"&&a.nodeName!=="ws-on"?(toRemove.push(a.nodeName),events.push(Slice.string(a.nodeName,{
    $:1,
    $0:"ws-on".length
   },null)+":"+a.nodeValue.toLowerCase())):!Strings.StartsWith(a.nodeName,"ws-")&&(new Global.RegExp(Templates.TextHoleRE())).test(a.nodeValue)?(a.nodeValue=(_this=new Global.RegExp(Templates.TextHoleRE(),"g"),a.nodeValue.replace(_this,function($2,$3)
   {
    return"${"+$3.toLowerCase()+"}";
   })),holedAttrs.push(a.nodeName)):void 0;
  }
  !(events.length==0)?el.setAttribute("ws-on",Strings.concat(" ",events)):void 0;
  !(holedAttrs.length==0)?el.setAttribute("ws-attr-holes",Strings.concat(" ",holedAttrs)):void 0;
  lowercaseAttr("ws-hole");
  lowercaseAttr("ws-replace");
  lowercaseAttr("ws-attr");
  lowercaseAttr("ws-onafterrender");
  lowercaseAttr("ws-var");
  Arrays.iter(function(a$1)
  {
   el.removeAttribute(a$1);
  },toRemove);
 };
 Slice.string=function(source,start,finish)
 {
  return start==null?finish!=null&&finish.$==1?source.slice(0,finish.$0+1):"":finish==null?source.slice(start.$0):source.slice(start.$0,finish.$0+1);
 };
 Elt=UI.Elt=Runtime$1.Class({},Doc,Elt);
 Elt.TreeNode=function(tree,updates)
 {
  var rvUpdates,x;
  function f(t)
  {
   return t[1];
  }
  rvUpdates=Updates.Create(updates);
  return new Elt.New$1({
   $:6,
   $0:tree
  },View.Map2Unit((x=Arrays.map(function(x$1)
  {
   return Attrs.Updates(f(x$1));
  },tree.Attrs),Array.TreeReduce(View.Const(),View.Map2Unit,x)),rvUpdates.v),Arrays.get(tree.Els,0),rvUpdates);
 };
 Elt.New$1=Runtime$1.Ctor(function(docNode,updates,elt,rvUpdates)
 {
  Doc.New.call(this,docNode,updates);
  this.docNode$1=docNode;
  this.updates$1=updates;
  this.elt=elt;
  this.rvUpdates=rvUpdates;
 },Elt);
 An.get_UseAnimations=function()
 {
  return Anims.UseAnimations();
 };
 An.Play=function(anim)
 {
  var b;
  b=null;
  return Concurrency.Delay(function()
  {
   return Concurrency.Bind(An.Run(Global.ignore,Anims.Actions(anim)),function()
   {
    Anims.Finalize(anim);
    return Concurrency.Return(null);
   });
  });
 };
 An.Append=function(a,a$1)
 {
  return{
   $:0,
   $0:AppendList.Append(a.$0,a$1.$0)
  };
 };
 An.Run=function(k,anim)
 {
  var dur;
  function a(ok)
  {
   function loop(start,now)
   {
    var t;
    t=now-start;
    anim.Compute(t);
    k();
    return t<=dur?void Global.requestAnimationFrame(function(t$1)
    {
     loop(start,t$1);
    }):ok();
   }
   Global.requestAnimationFrame(function(t)
   {
    loop(t,t);
   });
  }
  dur=anim.Duration;
  return dur===0?Concurrency.Zero():Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  });
 };
 An.Concat=function(xs)
 {
  return{
   $:0,
   $0:AppendList.Concat(Seq.map(Anims.List,xs))
  };
 };
 An.get_Empty=function()
 {
  return{
   $:0,
   $0:AppendList.Empty()
  };
 };
 Settings.BatchUpdatesEnabled=function()
 {
  SC$5.$cctor();
  return SC$5.BatchUpdatesEnabled;
 };
 Mailbox.StartProcessor=function(procAsync)
 {
  var st;
  function work()
  {
   var b;
   b=null;
   return Concurrency.Delay(function()
   {
    return Concurrency.Bind(procAsync,function()
    {
     var m;
     m=st[0];
     return m===1?(st[0]=0,Concurrency.Zero()):m===2?(st[0]=1,work()):Concurrency.Zero();
    });
   });
  }
  st=[0];
  return function()
  {
   var m;
   m=st[0];
   m===0?(st[0]=1,Concurrency.Start(work(),null)):m===1?st[0]=2:void 0;
  };
 };
 LazyRecord.New=function(created,evalOrVal,force)
 {
  return{
   c:created,
   v:evalOrVal,
   f:force
  };
 };
 PathUtil.WriteLink=function(s,q)
 {
  var query;
  query=q.get_IsEmpty()?"":"?"+PathUtil.WriteQuery(q);
  return"/"+PathUtil.Concat(s)+query;
 };
 PathUtil.Concat=function(xs)
 {
  var sb,start;
  sb=[];
  start=true;
  List.iter(function(x)
  {
   if(!Strings.IsNullOrEmpty(x))
    {
     start?start=false:sb.push("/");
     sb.push(x);
    }
  },xs);
  return Strings.Join("",Arrays.ofSeq(sb));
 };
 PathUtil.WriteQuery=function(q)
 {
  function m(k,v)
  {
   return k+"="+v;
  }
  return Strings.concat("&",Seq.map(function($1)
  {
   return m($1[0],$1[1]);
  },Map.ToSeq(q)));
 };
 HashSetUtil.concat=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push.apply(r,o[k$1]);
  return r;
 };
 BalancedTree.Enumerate=function(flip,t)
 {
  function gen(t$1,spine)
  {
   var t$2;
   while(true)
    if(t$1==null)
     return spine.$==1?{
      $:1,
      $0:[spine.$0[0],[spine.$0[1],spine.$1]]
     }:null;
    else
     if(flip)
      {
       t$2=t$1;
       t$1=t$2.Right;
       spine=new T({
        $:1,
        $0:[t$2.Node,t$2.Left],
        $1:spine
       });
      }
     else
      {
       t$2=t$1;
       t$1=t$2.Left;
       spine=new T({
        $:1,
        $0:[t$2.Node,t$2.Right],
        $1:spine
       });
      }
  }
  return Seq.unfold(function($1)
  {
   return gen($1[0],$1[1]);
  },[t,T.Empty]);
 };
 BalancedTree.OfSeq=function(data)
 {
  var a;
  a=Arrays.ofSeq(Seq.distinct(data));
  Arrays.sortInPlace(a);
  return BalancedTree.Build(a,0,a.length-1);
 };
 BalancedTree.Build=function(data,min,max)
 {
  var center,left,right;
  return max-min+1<=0?null:(center=(min+max)/2>>0,(left=BalancedTree.Build(data,min,center-1),(right=BalancedTree.Build(data,center+1,max),BalancedTree.Branch(Arrays.get(data,center),left,right))));
 };
 BalancedTree.Add=function(x,t)
 {
  return BalancedTree.Put(function($1,$2)
  {
   return $2;
  },x,t);
 };
 BalancedTree.Branch=function(node,left,right)
 {
  var a,b;
  return Tree.New(node,left,right,1+(a=left==null?0:left.Height,(b=right==null?0:right.Height,Unchecked.Compare(a,b)===1?a:b)),1+(left==null?0:left.Count)+(right==null?0:right.Count));
 };
 BalancedTree.Put=function(combine,k,t)
 {
  var p,t$1;
  p=BalancedTree.Lookup(k,t);
  t$1=p[0];
  return t$1==null?BalancedTree.Rebuild(p[1],BalancedTree.Branch(k,null,null)):BalancedTree.Rebuild(p[1],BalancedTree.Branch(combine(t$1.Node,k),t$1.Left,t$1.Right));
 };
 BalancedTree.Lookup=function(k,t)
 {
  var spine,t$1,loop,m;
  spine=[];
  t$1=t;
  loop=true;
  while(loop)
   if(t$1==null)
    loop=false;
   else
    {
     m=Unchecked.Compare(k,t$1.Node);
     m===0?loop=false:m===1?(spine.unshift([true,t$1.Node,t$1.Left]),t$1=t$1.Right):(spine.unshift([false,t$1.Node,t$1.Right]),t$1=t$1.Left);
    }
  return[t$1,spine];
 };
 BalancedTree.Rebuild=function(spine,t)
 {
  var t$1,i,$1,m,x,l,m$1,x$1,r,m$2;
  function h(x$2)
  {
   return x$2==null?0:x$2.Height;
  }
  t$1=t;
  for(i=0,$1=Arrays.length(spine)-1;i<=$1;i++){
   t$1=(m=Arrays.get(spine,i),m[0]?(x=m[1],(l=m[2],h(t$1)>h(l)+1?h(t$1.Left)===h(t$1.Right)+1?(m$1=t$1.Left,BalancedTree.Branch(m$1.Node,BalancedTree.Branch(x,l,m$1.Left),BalancedTree.Branch(t$1.Node,m$1.Right,t$1.Right))):BalancedTree.Branch(t$1.Node,BalancedTree.Branch(x,l,t$1.Left),t$1.Right):BalancedTree.Branch(x,l,t$1))):(x$1=m[1],(r=m[2],h(t$1)>h(r)+1?h(t$1.Right)===h(t$1.Left)+1?(m$2=t$1.Right,BalancedTree.Branch(m$2.Node,BalancedTree.Branch(t$1.Node,t$1.Left,m$2.Left),BalancedTree.Branch(x$1,m$2.Right,r))):BalancedTree.Branch(t$1.Node,t$1.Left,BalancedTree.Branch(x$1,t$1.Right,r)):BalancedTree.Branch(x$1,t$1,r))));
  }
  return t$1;
 };
 Queue.Clear=function(a)
 {
  a.splice(0,Arrays.length(a));
 };
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.Doc=self.document;
 };
 SC$4.$cctor=function()
 {
  SC$4.$cctor=Global.ignore;
  SC$4.LoadedTemplates=new Dictionary.New$5();
  SC$4.LocalTemplatesLoaded=false;
  SC$4.TextHoleRE="\\${([^}]+)}";
 };
 Dyn.New=function(DynElem,DynFlags,DynNodes,OnAfterRender)
 {
  var $1;
  $1={
   DynElem:DynElem,
   DynFlags:DynFlags,
   DynNodes:DynNodes
  };
  Runtime$1.SetOptional($1,"OnAfterRender",OnAfterRender);
  return $1;
 };
 Updates=UI.Updates=Runtime$1.Class({},null,Updates);
 Updates.Create=function(v)
 {
  var _var;
  _var=null;
  _var=Updates.New(v,null,function()
  {
   var c;
   c=_var.s;
   return c===null?(c=Snap.Copy(_var.c()),_var.s=c,Snap.WhenObsoleteRun(c,function()
   {
    _var.s=null;
   }),c):c;
  });
  return _var;
 };
 Updates.New=function(Current,Snap$1,VarView)
 {
  return new Updates({
   c:Current,
   s:Snap$1,
   v:VarView
  });
 };
 RunState.New=function(PreviousNodes,Top)
 {
  return{
   PreviousNodes:PreviousNodes,
   Top:Top
  };
 };
 NodeSet.get_Empty=function()
 {
  return{
   $:0,
   $0:new HashSet.New$3()
  };
 };
 NodeSet.FindAll=function(doc)
 {
  var q;
  function loop(node)
  {
   if(node!=null&&node.$==0)
    {
     loop(node.$0);
     loop(node.$1);
    }
   else
    if(node!=null&&node.$==1)
     loopEN(node.$0);
    else
     if(node!=null&&node.$==2)
      loop(node.$0.Current);
     else
      if(node!=null&&node.$==6)
       Arrays.iter(loopEN,node.$0.Holes);
  }
  function loopEN(el)
  {
   q.push(el);
   loop(el.Children);
  }
  q=[];
  loop(doc);
  return{
   $:0,
   $0:new HashSet.New$2(q)
  };
 };
 NodeSet.Filter=function(f,a)
 {
  return{
   $:0,
   $0:HashSet$1.Filter(f,a.$0)
  };
 };
 NodeSet.Except=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Except(a.$0,a$1.$0)
  };
 };
 NodeSet.ToArray=function(a)
 {
  return HashSet$1.ToArray(a.$0);
 };
 NodeSet.Intersect=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Intersect(a.$0,a$1.$0)
  };
 };
 Anims.UseAnimations=function()
 {
  SC$6.$cctor();
  return SC$6.UseAnimations;
 };
 Anims.Actions=function(a)
 {
  return Anims.ConcatActions(Arrays.choose(function(a$1)
  {
   return a$1.$==1?{
    $:1,
    $0:a$1.$0
   }:null;
  },AppendList.ToArray(a.$0)));
 };
 Anims.Finalize=function(a)
 {
  Arrays.iter(function(a$1)
  {
   if(a$1.$==0)
    a$1.$0();
  },AppendList.ToArray(a.$0));
 };
 Anims.ConcatActions=function(xs)
 {
  var xs$1,m,dur,xs$2;
  xs$1=Array.ofSeqNonCopying(xs);
  m=Arrays.length(xs$1);
  return m===0?Anims.Const():m===1?Arrays.get(xs$1,0):(dur=Seq.max(Seq.map(function(anim)
  {
   return anim.Duration;
  },xs$1)),(xs$2=Arrays.map(function(a)
  {
   return Anims.Prolong(dur,a);
  },xs$1),Anims.Def(dur,function(t)
  {
   Arrays.iter(function(anim)
   {
    anim.Compute(t);
   },xs$2);
  })));
 };
 Anims.List=function(a)
 {
  return a.$0;
 };
 Anims.Const=function(v)
 {
  return Anims.Def(0,function()
  {
   return v;
  });
 };
 Anims.Def=function(d,f)
 {
  return{
   Compute:f,
   Duration:d
  };
 };
 Anims.Prolong=function(nextDuration,anim)
 {
  var comp,dur,last;
  comp=anim.Compute;
  dur=anim.Duration;
  last=Lazy.Create(function()
  {
   return anim.Compute(anim.Duration);
  });
  return{
   Compute:function(t)
   {
    return t>=dur?last.f():comp(t);
   },
   Duration:nextDuration
  };
 };
 SC$5.$cctor=function()
 {
  SC$5.$cctor=Global.ignore;
  SC$5.BatchUpdatesEnabled=true;
 };
 MapUtil.fromSeq=function(s)
 {
  var a;
  a=Arrays.ofSeq(Seq.delay(function()
  {
   return Seq.collect(function(m)
   {
    return[Pair.New(m[0],m[1])];
   },Seq.distinctBy(function(t)
   {
    return t[0];
   },s));
  }));
  Arrays.sortInPlace(a);
  return BalancedTree.Build(a,0,a.length-1);
 };
 Seq.insufficient=function()
 {
  return Operators.FailWith("The input sequence has an insufficient number of elements.");
 };
 Arrays.mapiInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(i,arr[i]);
  return arr;
 };
 Arrays.mapInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(arr[i]);
 };
 KeyCollection=Collections.KeyCollection=Runtime$1.Class({
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kvp)
   {
    return kvp.K;
   },this.d));
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  },
  GetEnumerator0:function()
  {
   return this.GetEnumerator$1();
  }
 },Obj,KeyCollection);
 KeyCollection.New=Runtime$1.Ctor(function(d)
 {
  Obj.New.call(this);
  this.d=d;
 },KeyCollection);
 String.isBlank=function(s)
 {
  return Strings.forall(Char.IsWhiteSpace,s);
 };
 SC$6.$cctor=function()
 {
  SC$6.$cctor=Global.ignore;
  SC$6.CubicInOut=Easing.Custom(function(t)
  {
   var t2;
   t2=t*t;
   return 3*t2-2*(t2*t);
  });
  SC$6.UseAnimations=true;
 };
 Concurrency.Delay=function(mk)
 {
  return function(c)
  {
   try
   {
    (mk(null))(c);
   }
   catch(e)
   {
    c.k({
     $:1,
     $0:e
    });
   }
  };
 };
 Concurrency.Bind=function(r,f)
 {
  return Concurrency.checkCancel(function(c)
  {
   r(AsyncBody.New(function(a)
   {
    var x;
    if(a.$==0)
     {
      x=a.$0;
      Concurrency.scheduler().Fork(function()
      {
       try
       {
        (f(x))(c);
       }
       catch(e)
       {
        c.k({
         $:1,
         $0:e
        });
       }
      });
     }
    else
     Concurrency.scheduler().Fork(function()
     {
      c.k(a);
     });
   },c.ct));
  });
 };
 Concurrency.Zero=function()
 {
  SC$7.$cctor();
  return SC$7.Zero;
 };
 Concurrency.Start=function(c,ctOpt)
 {
  var ct,d;
  ct=(d=(Concurrency.defCTS())[0],ctOpt==null?d:ctOpt.$0);
  Concurrency.scheduler().Fork(function()
  {
   if(!ct.c)
    c(AsyncBody.New(function(a)
    {
     if(a.$==1)
      Concurrency.UncaughtAsyncError(a.$0);
    },ct));
  });
 };
 Concurrency.Return=function(x)
 {
  return function(c)
  {
   c.k({
    $:0,
    $0:x
   });
  };
 };
 Concurrency.checkCancel=function(r)
 {
  return function(c)
  {
   if(c.ct.c)
    Concurrency.cancel(c);
   else
    r(c);
  };
 };
 Concurrency.defCTS=function()
 {
  SC$7.$cctor();
  return SC$7.defCTS;
 };
 Concurrency.UncaughtAsyncError=function(e)
 {
  console.log("WebSharper: Uncaught asynchronous exception",e);
 };
 Concurrency.FromContinuations=function(subscribe)
 {
  return function(c)
  {
   var continued;
   function once(cont)
   {
    if(continued[0])
     Operators.FailWith("A continuation provided by Async.FromContinuations was invoked multiple times");
    else
     {
      continued[0]=true;
      Concurrency.scheduler().Fork(cont);
     }
   }
   continued=[false];
   subscribe(function(a)
   {
    once(function()
    {
     c.k({
      $:0,
      $0:a
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:1,
      $0:e
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:2,
      $0:e
     });
    });
   });
  };
 };
 Concurrency.cancel=function(c)
 {
  c.k({
   $:2,
   $0:new OperationCanceledException.New(c.ct)
  });
 };
 Concurrency.scheduler=function()
 {
  SC$7.$cctor();
  return SC$7.scheduler;
 };
 AppendList.Append=function(x,y)
 {
  return x.$==0?y:y.$==0?x:{
   $:2,
   $0:x,
   $1:y
  };
 };
 AppendList.ToArray=function(xs)
 {
  var out;
  function loop(xs$1)
  {
   if(xs$1.$==1)
    out.push(xs$1.$0);
   else
    if(xs$1.$==2)
     {
      loop(xs$1.$0);
      loop(xs$1.$1);
     }
    else
     if(xs$1.$==3)
      Arrays.iter(function(v)
      {
       out.push(v);
      },xs$1.$0);
  }
  out=[];
  loop(xs);
  return out.slice(0);
 };
 AppendList.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(AppendList.Empty(),AppendList.Append,x);
 };
 AppendList.Empty=function()
 {
  SC$8.$cctor();
  return SC$8.Empty;
 };
 Char.IsWhiteSpace=function(c)
 {
  return c.match(new Global.RegExp("\\s"))!==null;
 };
 Numeric.TryParse=function(s,min,max,r)
 {
  var x,ok;
  x=+s;
  ok=x===x-x%1&&x>=min&&x<=max;
  ok?r.set(x):void 0;
  return ok;
 };
 Easing=UI.Easing=Runtime$1.Class({},Obj,Easing);
 Easing.Custom=function(f)
 {
  return new Easing.New(f);
 };
 Easing.New=Runtime$1.Ctor(function(transformTime)
 {
  Obj.New.call(this);
  this.transformTime=transformTime;
 },Easing);
 AsyncBody.New=function(k,ct)
 {
  return{
   k:k,
   ct:ct
  };
 };
 SC$7.$cctor=function()
 {
  SC$7.$cctor=Global.ignore;
  SC$7.noneCT=CT.New(false,[]);
  SC$7.scheduler=new Scheduler.New();
  SC$7.defCTS=[new CancellationTokenSource.New()];
  SC$7.Zero=Concurrency.Return();
  SC$7.GetCT=function(c)
  {
   c.k({
    $:0,
    $0:c.ct
   });
  };
 };
 CT.New=function(IsCancellationRequested,Registrations)
 {
  return{
   c:IsCancellationRequested,
   r:Registrations
  };
 };
 HashSet$1.Filter=function(ok,set)
 {
  return new HashSet.New$2(Arrays.filter(ok,HashSet$1.ToArray(set)));
 };
 HashSet$1.Except=function(excluded,included)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(included));
  set.ExceptWith(HashSet$1.ToArray(excluded));
  return set;
 };
 HashSet$1.ToArray=function(set)
 {
  var arr;
  arr=Arrays.create(set.get_Count(),void 0);
  set.CopyTo(arr);
  return arr;
 };
 HashSet$1.Intersect=function(a,b)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(a));
  set.IntersectWith(HashSet$1.ToArray(b));
  return set;
 };
 Scheduler=Concurrency.Scheduler=Runtime$1.Class({
  Fork:function(action)
  {
   var $this;
   $this=this;
   this.robin.push(action);
   this.idle?(this.idle=false,Global.setTimeout(function()
   {
    $this.tick();
   },0)):void 0;
  },
  tick:function()
  {
   var loop,$this,t;
   $this=this;
   t=Date.now();
   loop=true;
   while(loop)
    if(this.robin.length===0)
     {
      this.idle=true;
      loop=false;
     }
    else
     {
      (this.robin.shift())();
      Date.now()-t>40?(Global.setTimeout(function()
      {
       $this.tick();
      },0),loop=false):void 0;
     }
  }
 },Obj,Scheduler);
 Scheduler.New=Runtime$1.Ctor(function()
 {
  Obj.New.call(this);
  this.idle=true;
  this.robin=[];
 },Scheduler);
 CancellationTokenSource=WebSharper.CancellationTokenSource=Runtime$1.Class({},Obj,CancellationTokenSource);
 CancellationTokenSource.New=Runtime$1.Ctor(function()
 {
  Obj.New.call(this);
  this.c=false;
  this.pending=null;
  this.r=[];
  this.init=1;
 },CancellationTokenSource);
 DomNodes.Children=function(elem,delims)
 {
  var n,o,a;
  if(delims!=null&&delims.$==1)
   {
    a=[];
    n=delims.$0[0].nextSibling;
    while(n!==delims.$0[1])
     {
      a.push(n);
      n=n.nextSibling;
     }
    return{
     $:0,
     $0:a
    };
   }
  else
   return{
    $:0,
    $0:Arrays.init(elem.childNodes.length,(o=elem.childNodes,function(a$1)
    {
     return o[a$1];
    }))
   };
 };
 DomNodes.Except=function(a,a$1)
 {
  var excluded;
  excluded=a.$0;
  return{
   $:0,
   $0:Arrays.filter(function(n)
   {
    return Arrays.forall(function(k)
    {
     return!(n===k);
    },excluded);
   },a$1.$0)
  };
 };
 DomNodes.Iter=function(f,a)
 {
  Arrays.iter(f,a.$0);
 };
 DomNodes.DocChildren=function(node)
 {
  var q;
  function loop(doc)
  {
   if(doc!=null&&doc.$==2)
    loop(doc.$0.Current);
   else
    if(doc!=null&&doc.$==1)
     q.push(doc.$0.El);
    else
     if(doc==null)
      ;
     else
      if(doc!=null&&doc.$==5)
       q.push(doc.$0);
      else
       if(doc!=null&&doc.$==4)
        q.push(doc.$0.Text);
       else
        if(doc!=null&&doc.$==6)
         Arrays.iter(function(a)
         {
          if(a==null||a.constructor===Object)
           loop(a);
          else
           q.push(a);
         },doc.$0.Els);
        else
         {
          loop(doc.$0);
          loop(doc.$1);
         }
  }
  q=[];
  loop(node.Children);
  return{
   $:0,
   $0:Array.ofSeqNonCopying(q)
  };
 };
 OperationCanceledException=WebSharper.OperationCanceledException=Runtime$1.Class({},Error,OperationCanceledException);
 OperationCanceledException.New=Runtime$1.Ctor(function(ct)
 {
  OperationCanceledException.New$1.call(this,"The operation was canceled.",null,ct);
 },OperationCanceledException);
 OperationCanceledException.New$1=Runtime$1.Ctor(function(message,inner,ct)
 {
  this.message=message;
  this.inner=inner;
  Object.setPrototypeOf(this,OperationCanceledException.prototype);
  this.ct=ct;
 },OperationCanceledException);
 SC$8.$cctor=function()
 {
  SC$8.$cctor=Global.ignore;
  SC$8.Empty={
   $:0
  };
 };
 Runtime$1.OnLoad(function()
 {
  Client.Main();
 });
}());


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
