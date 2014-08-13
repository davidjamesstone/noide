(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],2:[function(require,module,exports){
/**
The following batches are equivalent:

var beautify_js = require('js-beautify');
var beautify_js = require('js-beautify').js;
var beautify_js = require('js-beautify').js_beautify;

var beautify_css = require('js-beautify').css;
var beautify_css = require('js-beautify').css_beautify;

var beautify_html = require('js-beautify').html;
var beautify_html = require('js-beautify').html_beautify;

All methods returned accept two arguments, the source string and an options object.
**/

function get_beautify(js_beautify, css_beautify, html_beautify) {
    // the default is js
    var beautify = function (src, config) {
        return js_beautify.js_beautify(src, config);
    };
    
    // short aliases
    beautify.js   = js_beautify.js_beautify;
    beautify.css  = css_beautify.css_beautify;
    beautify.html = html_beautify.html_beautify;

    // legacy aliases
    beautify.js_beautify   = js_beautify.js_beautify;
    beautify.css_beautify  = css_beautify.css_beautify;
    beautify.html_beautify = html_beautify.html_beautify;
    
    return beautify;
}

if (typeof define === "function" && define.amd) {
    // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
    define([
        "./lib/beautify",
        "./lib/beautify-css",
        "./lib/beautify-html"
    ], function(js_beautify, css_beautify, html_beautify) {
        return get_beautify(js_beautify, css_beautify, html_beautify);
    });
} else {
    (function(mod) {
        var js_beautify = require('./lib/beautify');
        var css_beautify = require('./lib/beautify-css');
        var html_beautify = require('./lib/beautify-html');

        mod.exports = get_beautify(js_beautify, css_beautify, html_beautify);

    })(module);
}


},{"./lib/beautify":5,"./lib/beautify-css":3,"./lib/beautify-html":4}],3:[function(require,module,exports){
(function (global){
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2013 Einar Lielmanis and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.


 CSS Beautifier
---------------

    Written by Harutyun Amirjanyan, (amirjanyan@gmail.com)

    Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
        http://jsbeautifier.org/

    Usage:
        css_beautify(source_text);
        css_beautify(source_text, options);

    The options are (default in brackets):
        indent_size (4)                   — indentation size,
        indent_char (space)               — character to indent with,
        selector_separator_newline (true) - separate selectors with newline or
                                            not (e.g. "a,\nbr" or "a, br")
        end_with_newline (false)          - end with a newline

    e.g

    css_beautify(css_source_text, {
      'indent_size': 1,
      'indent_char': '\t',
      'selector_separator': ' ',
      'end_with_newline': false,
    });
*/

// http://www.w3.org/TR/CSS21/syndata.html#tokenization
// http://www.w3.org/TR/css3-syntax/

(function () {
    function css_beautify(source_text, options) {
        options = options || {};
        var indentSize = options.indent_size || 4;
        var indentCharacter = options.indent_char || ' ';
        var selectorSeparatorNewline = (options.selector_separator_newline === undefined) ? true : options.selector_separator_newline;
        var endWithNewline = (options.end_with_newline === undefined) ? false : options.end_with_newline;

        // compatibility
        if (typeof indentSize === "string") {
            indentSize = parseInt(indentSize, 10);
        }


        // tokenizer
        var whiteRe = /^\s+$/;
        var wordRe = /[\w$\-_]/;

        var pos = -1,
            ch;

        function next() {
            ch = source_text.charAt(++pos);
            return ch;
        }

        function peek() {
            return source_text.charAt(pos + 1);
        }

        function eatString(endChar) {
            var start = pos;
            while (next()) {
                if (ch === "\\") {
                    next();
                    next();
                } else if (ch === endChar) {
                    break;
                } else if (ch === "\n") {
                    break;
                }
            }
            return source_text.substring(start, pos + 1);
        }

        function eatWhitespace() {
            var start = pos;
            while (whiteRe.test(peek())) {
                pos++;
            }
            return pos !== start;
        }

        function skipWhitespace() {
            var start = pos;
            do {} while (whiteRe.test(next()));
            return pos !== start + 1;
        }

        function eatComment(singleLine) {
            var start = pos;
            next();
            while (next()) {
                if (ch === "*" && peek() === "/") {
                    pos++;
                    break;
                } else if (singleLine && ch === "\n") {
                    break;
                }
            }

            return source_text.substring(start, pos + 1);
        }


        function lookBack(str) {
            return source_text.substring(pos - str.length, pos).toLowerCase() ===
                str;
        }

        function isCommentOnLine() {
            var endOfLine = source_text.indexOf('\n', pos);
            if (endOfLine === -1) {
                return false;
            }
            var restOfLine = source_text.substring(pos, endOfLine);
            return restOfLine.indexOf('//') !== -1;
        }

        // printer
        var indentString = source_text.match(/^[\r\n]*[\t ]*/)[0];
        var singleIndent = new Array(indentSize + 1).join(indentCharacter);
        var indentLevel = 0;
        var nestedLevel = 0;

        function indent() {
            indentLevel++;
            indentString += singleIndent;
        }

        function outdent() {
            indentLevel--;
            indentString = indentString.slice(0, -indentSize);
        }

        var print = {};
        print["{"] = function (ch) {
            print.singleSpace();
            output.push(ch);
            print.newLine();
        };
        print["}"] = function (ch) {
            print.newLine();
            output.push(ch);
            print.newLine();
        };

        print._lastCharWhitespace = function () {
            return whiteRe.test(output[output.length - 1]);
        };

        print.newLine = function (keepWhitespace) {
            if (!keepWhitespace) {
                while (print._lastCharWhitespace()) {
                    output.pop();
                }
            }

            if (output.length) {
                output.push('\n');
            }
            if (indentString) {
                output.push(indentString);
            }
        };
        print.singleSpace = function () {
            if (output.length && !print._lastCharWhitespace()) {
                output.push(' ');
            }
        };
        var output = [];
        if (indentString) {
            output.push(indentString);
        }
        /*_____________________--------------------_____________________*/

        var insideRule = false;
        var enteringConditionalGroup = false;

        while (true) {
            var isAfterSpace = skipWhitespace();

            if (!ch) {
                break;
            } else if (ch === '/' && peek() === '*') { /* css comment */
                print.newLine();
                output.push(eatComment(), "\n", indentString);
                var header = lookBack("");
                if (header) {
                    print.newLine();
                }
            } else if (ch === '/' && peek() === '/') { // single line comment
                output.push(eatComment(true), indentString);
            } else if (ch === '@') {
                // strip trailing space, if present, for hash property checks
                var atRule = eatString(" ").replace(/ $/, '');

                // pass along the space we found as a separate item
                output.push(atRule, ch);

                // might be a nesting at-rule
                if (atRule in css_beautify.NESTED_AT_RULE) {
                    nestedLevel += 1;
                    if (atRule in css_beautify.CONDITIONAL_GROUP_RULE) {
                        enteringConditionalGroup = true;
                    }
                }
            } else if (ch === '{') {
                eatWhitespace();
                if (peek() === '}') {
                    next();
                    output.push(" {}");
                } else {
                    indent();
                    print["{"](ch);
                    // when entering conditional groups, only rulesets are allowed
                    if (enteringConditionalGroup) {
                        enteringConditionalGroup = false;
                        insideRule = (indentLevel > nestedLevel);
                    } else {
                        // otherwise, declarations are also allowed
                        insideRule = (indentLevel >= nestedLevel);
                    }
                }
            } else if (ch === '}') {
                outdent();
                print["}"](ch);
                insideRule = false;
                if (nestedLevel) {
                    nestedLevel--;
                }
            } else if (ch === ":") {
                eatWhitespace();
                if (insideRule || enteringConditionalGroup) {
                    // 'property: value' delimiter
                    // which could be in a conditional group query
                    output.push(ch, " ");
                } else {
                    if (peek() === ":") {
                        // pseudo-element
                        next();
                        output.push("::");
                    } else {
                        // pseudo-class
                        output.push(ch);
                    }
                }
            } else if (ch === '"' || ch === '\'') {
                output.push(eatString(ch));
            } else if (ch === ';') {
                if (isCommentOnLine()) {
                    var beforeComment = eatString('/');
                    var comment = eatComment(true);
                    output.push(beforeComment, comment.substring(1, comment.length - 1), '\n', indentString);
                } else {
                    output.push(ch, '\n', indentString);
                }
            } else if (ch === '(') { // may be a url
                if (lookBack("url")) {
                    output.push(ch);
                    eatWhitespace();
                    if (next()) {
                        if (ch !== ')' && ch !== '"' && ch !== '\'') {
                            output.push(eatString(')'));
                        } else {
                            pos--;
                        }
                    }
                } else {
                    if (isAfterSpace) {
                        print.singleSpace();
                    }
                    output.push(ch);
                    eatWhitespace();
                }
            } else if (ch === ')') {
                output.push(ch);
            } else if (ch === ',') {
                eatWhitespace();
                output.push(ch);
                if (!insideRule && selectorSeparatorNewline) {
                    print.newLine();
                } else {
                    print.singleSpace();
                }
            } else if (ch === ']') {
                output.push(ch);
            } else if (ch === '[' || ch === '=') { // no whitespace before or after
                eatWhitespace();
                output.push(ch);
            } else {
                if (isAfterSpace) {
                    print.singleSpace();
                }

                output.push(ch);
            }
        }


        var sweetCode = output.join('').replace(/[\n ]+$/, '');

        // establish end_with_newline
        var should = endWithNewline;
        var actually = /\n$/.test(sweetCode);
        if (should && !actually) {
            sweetCode += "\n";
        } else if (!should && actually) {
            sweetCode = sweetCode.slice(0, -1);
        }

        return sweetCode;
    }

    // https://developer.mozilla.org/en-US/docs/Web/CSS/At-rule
    css_beautify.NESTED_AT_RULE = {
        "@page": true,
        "@font-face": true,
        "@keyframes": true,
        // also in CONDITIONAL_GROUP_RULE below
        "@media": true,
        "@supports": true,
        "@document": true
    };
    css_beautify.CONDITIONAL_GROUP_RULE = {
        "@media": true,
        "@supports": true,
        "@document": true
    };

    /*global define */
    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function () {
            return { css_beautify: css_beautify };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        exports.css_beautify = css_beautify;
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.css_beautify = css_beautify;
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.css_beautify = css_beautify;
    }

}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],4:[function(require,module,exports){
(function (global){
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2013 Einar Lielmanis and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.


 Style HTML
---------------

  Written by Nochum Sossonko, (nsossonko@hotmail.com)

  Based on code initially developed by: Einar Lielmanis, <einar@jsbeautifier.org>
    http://jsbeautifier.org/

  Usage:
    style_html(html_source);

    style_html(html_source, options);

  The options are:
    indent_inner_html (default false)  — indent <head> and <body> sections,
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    wrap_line_length (default 250)            -  maximum amount of characters per line (0 = disable)
    brace_style (default "collapse") - "collapse" | "expand" | "end-expand"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.
    unformatted (defaults to inline tags) - list of tags, that shouldn't be reformatted
    indent_scripts (default normal)  - "keep"|"separate"|"normal"
    preserve_newlines (default true) - whether existing line breaks before elements should be preserved
                                        Only works before elements, not inside tags or for text.
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk
    indent_handlebars (default false) - format and indent {{#foo}} and {{/foo}}

    e.g.

    style_html(html_source, {
      'indent_inner_html': false,
      'indent_size': 2,
      'indent_char': ' ',
      'wrap_line_length': 78,
      'brace_style': 'expand',
      'unformatted': ['a', 'sub', 'sup', 'b', 'i', 'u'],
      'preserve_newlines': true,
      'max_preserve_newlines': 5,
      'indent_handlebars': false
    });
*/

(function() {

    function trim(s) {
        return s.replace(/^\s+|\s+$/g, '');
    }

    function ltrim(s) {
        return s.replace(/^\s+/g, '');
    }

    function style_html(html_source, options, js_beautify, css_beautify) {
        //Wrapper function to invoke all the necessary constructors and deal with the output.

        var multi_parser,
            indent_inner_html,
            indent_size,
            indent_character,
            wrap_line_length,
            brace_style,
            unformatted,
            preserve_newlines,
            max_preserve_newlines,
            indent_handlebars;

        options = options || {};

        // backwards compatibility to 1.3.4
        if ((options.wrap_line_length === undefined || parseInt(options.wrap_line_length, 10) === 0) &&
                (options.max_char !== undefined && parseInt(options.max_char, 10) !== 0)) {
            options.wrap_line_length = options.max_char;
        }

        indent_inner_html = (options.indent_inner_html === undefined) ? false : options.indent_inner_html;
        indent_size = (options.indent_size === undefined) ? 4 : parseInt(options.indent_size, 10);
        indent_character = (options.indent_char === undefined) ? ' ' : options.indent_char;
        brace_style = (options.brace_style === undefined) ? 'collapse' : options.brace_style;
        wrap_line_length =  parseInt(options.wrap_line_length, 10) === 0 ? 32786 : parseInt(options.wrap_line_length || 250, 10);
        unformatted = options.unformatted || ['a', 'span', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
        max_preserve_newlines = preserve_newlines ?
            (isNaN(parseInt(options.max_preserve_newlines, 10)) ? 32786 : parseInt(options.max_preserve_newlines, 10))
            : 0;
        indent_handlebars = (options.indent_handlebars === undefined) ? false : options.indent_handlebars;

        function Parser() {

            this.pos = 0; //Parser position
            this.token = '';
            this.current_mode = 'CONTENT'; //reflects the current Parser mode: TAG/CONTENT
            this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
                parent: 'parent1',
                parentcount: 1,
                parent1: ''
            };
            this.tag_type = '';
            this.token_text = this.last_token = this.last_text = this.token_type = '';
            this.newlines = 0;
            this.indent_content = indent_inner_html;

            this.Utils = { //Uilities made available to the various functions
                whitespace: "\n\r\t ".split(''),
                single_token: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed,?php,?,?='.split(','), //all the single tags for HTML
                extra_liners: 'head,body,/html'.split(','), //for tags that need a line of whitespace before them
                in_array: function(what, arr) {
                    for (var i = 0; i < arr.length; i++) {
                        if (what === arr[i]) {
                            return true;
                        }
                    }
                    return false;
                }
            };

            this.traverse_whitespace = function() {
                var input_char = '';

                input_char = this.input.charAt(this.pos);
                if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                    this.newlines = 0;
                    while (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (preserve_newlines && input_char === '\n' && this.newlines <= max_preserve_newlines) {
                            this.newlines += 1;
                        }

                        this.pos++;
                        input_char = this.input.charAt(this.pos);
                    }
                    return true;
                }
                return false;
            };

            this.get_content = function() { //function to capture regular content between tags

                var input_char = '',
                    content = [],
                    space = false; //if a space is needed

                while (this.input.charAt(this.pos) !== '<') {
                    if (this.pos >= this.input.length) {
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }

                    if (this.traverse_whitespace()) {
                        if (content.length) {
                            space = true;
                        }
                        continue; //don't want to insert unnecessary space
                    }

                    if (indent_handlebars) {
                        // Handlebars parsing is complicated.
                        // {{#foo}} and {{/foo}} are formatted tags.
                        // {{something}} should get treated as content, except:
                        // {{else}} specifically behaves like {{#if}} and {{/if}}
                        var peek3 = this.input.substr(this.pos, 3);
                        if (peek3 === '{{#' || peek3 === '{{/') {
                            // These are tags and not content.
                            break;
                        } else if (this.input.substr(this.pos, 2) === '{{') {
                            if (this.get_tag(true) === '{{else}}') {
                                break;
                            }
                        }
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (space) {
                        if (this.line_char_count >= this.wrap_line_length) { //insert a line when the wrap_line_length is reached
                            this.print_newline(false, content);
                            this.print_indentation(content);
                        } else {
                            this.line_char_count++;
                            content.push(' ');
                        }
                        space = false;
                    }
                    this.line_char_count++;
                    content.push(input_char); //letter at-a-time (or string) inserted to an array
                }
                return content.length ? content.join('') : '';
            };

            this.get_contents_to = function(name) { //get the full content of a script or style to pass to js_beautify
                if (this.pos === this.input.length) {
                    return ['', 'TK_EOF'];
                }
                var input_char = '';
                var content = '';
                var reg_match = new RegExp('</' + name + '\\s*>', 'igm');
                reg_match.lastIndex = this.pos;
                var reg_array = reg_match.exec(this.input);
                var end_script = reg_array ? reg_array.index : this.input.length; //absolute end of script
                if (this.pos < end_script) { //get everything in between the script tags
                    content = this.input.substring(this.pos, end_script);
                    this.pos = end_script;
                }
                return content;
            };

            this.record_tag = function(tag) { //function to record a tag and its parent in this.tags Object
                if (this.tags[tag + 'count']) { //check for the existence of this tag type
                    this.tags[tag + 'count']++;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                } else { //otherwise initialize this tag type
                    this.tags[tag + 'count'] = 1;
                    this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
                }
                this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
                this.tags.parent = tag + this.tags[tag + 'count']; //and make this the current parent (i.e. in the case of a div 'div1')
            };

            this.retrieve_tag = function(tag) { //function to retrieve the opening tag to the corresponding closer
                if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
                    var temp_parent = this.tags.parent; //check to see if it's a closable tag.
                    while (temp_parent) { //till we reach '' (the initial value);
                        if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
                            break;
                        }
                        temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
                    }
                    if (temp_parent) { //if we caught something
                        this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
                        this.tags.parent = this.tags[temp_parent + 'parent']; //and set the current parent
                    }
                    delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
                    delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
                    if (this.tags[tag + 'count'] === 1) {
                        delete this.tags[tag + 'count'];
                    } else {
                        this.tags[tag + 'count']--;
                    }
                }
            };

            this.indent_to_tag = function(tag) {
                // Match the indentation level to the last use of this tag, but don't remove it.
                if (!this.tags[tag + 'count']) {
                    return;
                }
                var temp_parent = this.tags.parent;
                while (temp_parent) {
                    if (tag + this.tags[tag + 'count'] === temp_parent) {
                        break;
                    }
                    temp_parent = this.tags[temp_parent + 'parent'];
                }
                if (temp_parent) {
                    this.indent_level = this.tags[tag + this.tags[tag + 'count']];
                }
            };

            this.get_tag = function(peek) { //function to get a full tag and parse its type
                var input_char = '',
                    content = [],
                    comment = '',
                    space = false,
                    tag_start, tag_end,
                    tag_start_char,
                    orig_pos = this.pos,
                    orig_line_char_count = this.line_char_count;

                peek = peek !== undefined ? peek : false;

                do {
                    if (this.pos >= this.input.length) {
                        if (peek) {
                            this.pos = orig_pos;
                            this.line_char_count = orig_line_char_count;
                        }
                        return content.length ? content.join('') : ['', 'TK_EOF'];
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) { //don't want to insert unnecessary space
                        space = true;
                        continue;
                    }

                    if (input_char === "'" || input_char === '"') {
                        input_char += this.get_unformatted(input_char);
                        space = true;

                    }

                    if (input_char === '=') { //no space before =
                        space = false;
                    }

                    if (content.length && content[content.length - 1] !== '=' && input_char !== '>' && space) {
                        //no space after = or before >
                        if (this.line_char_count >= this.wrap_line_length) {
                            this.print_newline(false, content);
                            this.print_indentation(content);
                        } else {
                            content.push(' ');
                            this.line_char_count++;
                        }
                        space = false;
                    }

                    if (indent_handlebars && tag_start_char === '<') {
                        // When inside an angle-bracket tag, put spaces around
                        // handlebars not inside of strings.
                        if ((input_char + this.input.charAt(this.pos)) === '{{') {
                            input_char += this.get_unformatted('}}');
                            if (content.length && content[content.length - 1] !== ' ' && content[content.length - 1] !== '<') {
                                input_char = ' ' + input_char;
                            }
                            space = true;
                        }
                    }

                    if (input_char === '<' && !tag_start_char) {
                        tag_start = this.pos - 1;
                        tag_start_char = '<';
                    }

                    if (indent_handlebars && !tag_start_char) {
                        if (content.length >= 2 && content[content.length - 1] === '{' && content[content.length - 2] == '{') {
                            if (input_char === '#' || input_char === '/') {
                                tag_start = this.pos - 3;
                            } else {
                                tag_start = this.pos - 2;
                            }
                            tag_start_char = '{';
                        }
                    }

                    this.line_char_count++;
                    content.push(input_char); //inserts character at-a-time (or string)

                    if (content[1] && content[1] === '!') { //if we're in a comment, do something special
                        // We treat all comments as literals, even more than preformatted tags
                        // we just look for the appropriate close tag
                        content = [this.get_comment(tag_start)];
                        break;
                    }

                    if (indent_handlebars && tag_start_char === '{' && content.length > 2 && content[content.length - 2] === '}' && content[content.length - 1] === '}') {
                        break;
                    }
                } while (input_char !== '>');

                var tag_complete = content.join('');
                var tag_index;
                var tag_offset;

                if (tag_complete.indexOf(' ') !== -1) { //if there's whitespace, thats where the tag name ends
                    tag_index = tag_complete.indexOf(' ');
                } else if (tag_complete[0] === '{') {
                    tag_index = tag_complete.indexOf('}');
                } else { //otherwise go with the tag ending
                    tag_index = tag_complete.indexOf('>');
                }
                if (tag_complete[0] === '<' || !indent_handlebars) {
                    tag_offset = 1;
                } else {
                    tag_offset = tag_complete[2] === '#' ? 3 : 2;
                }
                var tag_check = tag_complete.substring(tag_offset, tag_index).toLowerCase();
                if (tag_complete.charAt(tag_complete.length - 2) === '/' ||
                    this.Utils.in_array(tag_check, this.Utils.single_token)) { //if this tag name is a single tag type (either in the list or has a closing /)
                    if (!peek) {
                        this.tag_type = 'SINGLE';
                    }
                } else if (indent_handlebars && tag_complete[0] === '{' && tag_check === 'else') {
                    if (!peek) {
                        this.indent_to_tag('if');
                        this.tag_type = 'HANDLEBARS_ELSE';
                        this.indent_content = true;
                        this.traverse_whitespace();
                    }
                } else if (tag_check === 'script') { //for later script handling
                    if (!peek) {
                        this.record_tag(tag_check);
                        this.tag_type = 'SCRIPT';
                    }
                } else if (tag_check === 'style') { //for future style handling (for now it justs uses get_content)
                    if (!peek) {
                        this.record_tag(tag_check);
                        this.tag_type = 'STYLE';
                    }
                } else if (this.is_unformatted(tag_check, unformatted)) { // do not reformat the "unformatted" tags
                    comment = this.get_unformatted('</' + tag_check + '>', tag_complete); //...delegate to get_unformatted function
                    content.push(comment);
                    // Preserve collapsed whitespace either before or after this tag.
                    if (tag_start > 0 && this.Utils.in_array(this.input.charAt(tag_start - 1), this.Utils.whitespace)) {
                        content.splice(0, 0, this.input.charAt(tag_start - 1));
                    }
                    tag_end = this.pos - 1;
                    if (this.Utils.in_array(this.input.charAt(tag_end + 1), this.Utils.whitespace)) {
                        content.push(this.input.charAt(tag_end + 1));
                    }
                    this.tag_type = 'SINGLE';
                } else if (tag_check.charAt(0) === '!') { //peek for <! comment
                    // for comments content is already correct.
                    if (!peek) {
                        this.tag_type = 'SINGLE';
                        this.traverse_whitespace();
                    }
                } else if (!peek) {
                    if (tag_check.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
                        this.retrieve_tag(tag_check.substring(1)); //remove it and all ancestors
                        this.tag_type = 'END';
                        this.traverse_whitespace();
                    } else { //otherwise it's a start-tag
                        this.record_tag(tag_check); //push it on the tag stack
                        if (tag_check.toLowerCase() !== 'html') {
                            this.indent_content = true;
                        }
                        this.tag_type = 'START';

                        // Allow preserving of newlines after a start tag
                        this.traverse_whitespace();
                    }
                    if (this.Utils.in_array(tag_check, this.Utils.extra_liners)) { //check if this double needs an extra line
                        this.print_newline(false, this.output);
                        if (this.output.length && this.output[this.output.length - 2] !== '\n') {
                            this.print_newline(true, this.output);
                        }
                    }
                }

                if (peek) {
                    this.pos = orig_pos;
                    this.line_char_count = orig_line_char_count;
                }

                return content.join(''); //returns fully formatted tag
            };

            this.get_comment = function(start_pos) { //function to return comment content in its entirety
                // this is will have very poor perf, but will work for now.
                var comment = '',
                    delimiter = '>',
                    matched = false;

                this.pos = start_pos;
                input_char = this.input.charAt(this.pos);
                this.pos++;

                while (this.pos <= this.input.length) {
                    comment += input_char;

                    // only need to check for the delimiter if the last chars match
                    if (comment[comment.length - 1] === delimiter[delimiter.length - 1] &&
                        comment.indexOf(delimiter) !== -1) {
                        break;
                    }

                    // only need to search for custom delimiter for the first few characters
                    if (!matched && comment.length < 10) {
                        if (comment.indexOf('<![if') === 0) { //peek for <![if conditional comment
                            delimiter = '<![endif]>';
                            matched = true;
                        } else if (comment.indexOf('<![cdata[') === 0) { //if it's a <[cdata[ comment...
                            delimiter = ']]>';
                            matched = true;
                        } else if (comment.indexOf('<![') === 0) { // some other ![ comment? ...
                            delimiter = ']>';
                            matched = true;
                        } else if (comment.indexOf('<!--') === 0) { // <!-- comment ...
                            delimiter = '-->';
                            matched = true;
                        }
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;
                }

                return comment;
            };

            this.get_unformatted = function(delimiter, orig_tag) { //function to return unformatted content in its entirety

                if (orig_tag && orig_tag.toLowerCase().indexOf(delimiter) !== -1) {
                    return '';
                }
                var input_char = '';
                var content = '';
                var min_index = 0;
                var space = true;
                do {

                    if (this.pos >= this.input.length) {
                        return content;
                    }

                    input_char = this.input.charAt(this.pos);
                    this.pos++;

                    if (this.Utils.in_array(input_char, this.Utils.whitespace)) {
                        if (!space) {
                            this.line_char_count--;
                            continue;
                        }
                        if (input_char === '\n' || input_char === '\r') {
                            content += '\n';
                            /*  Don't change tab indention for unformatted blocks.  If using code for html editing, this will greatly affect <pre> tags if they are specified in the 'unformatted array'
                for (var i=0; i<this.indent_level; i++) {
                  content += this.indent_string;
                }
                space = false; //...and make sure other indentation is erased
                */
                            this.line_char_count = 0;
                            continue;
                        }
                    }
                    content += input_char;
                    this.line_char_count++;
                    space = true;

                    if (indent_handlebars && input_char === '{' && content.length && content[content.length - 2] === '{') {
                        // Handlebars expressions in strings should also be unformatted.
                        content += this.get_unformatted('}}');
                        // These expressions are opaque.  Ignore delimiters found in them.
                        min_index = content.length;
                    }
                } while (content.toLowerCase().indexOf(delimiter, min_index) === -1);
                return content;
            };

            this.get_token = function() { //initial handler for token-retrieval
                var token;

                if (this.last_token === 'TK_TAG_SCRIPT' || this.last_token === 'TK_TAG_STYLE') { //check if we need to format javascript
                    var type = this.last_token.substr(7);
                    token = this.get_contents_to(type);
                    if (typeof token !== 'string') {
                        return token;
                    }
                    return [token, 'TK_' + type];
                }
                if (this.current_mode === 'CONTENT') {
                    token = this.get_content();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        return [token, 'TK_CONTENT'];
                    }
                }

                if (this.current_mode === 'TAG') {
                    token = this.get_tag();
                    if (typeof token !== 'string') {
                        return token;
                    } else {
                        var tag_name_type = 'TK_TAG_' + this.tag_type;
                        return [token, tag_name_type];
                    }
                }
            };

            this.get_full_indent = function(level) {
                level = this.indent_level + level || 0;
                if (level < 1) {
                    return '';
                }

                return Array(level + 1).join(this.indent_string);
            };

            this.is_unformatted = function(tag_check, unformatted) {
                //is this an HTML5 block-level link?
                if (!this.Utils.in_array(tag_check, unformatted)) {
                    return false;
                }

                if (tag_check.toLowerCase() !== 'a' || !this.Utils.in_array('a', unformatted)) {
                    return true;
                }

                //at this point we have an  tag; is its first child something we want to remain
                //unformatted?
                var next_tag = this.get_tag(true /* peek. */ );

                // test next_tag to see if it is just html tag (no external content)
                var tag = (next_tag || "").match(/^\s*<\s*\/?([a-z]*)\s*[^>]*>\s*$/);

                // if next_tag comes back but is not an isolated tag, then
                // let's treat the 'a' tag as having content
                // and respect the unformatted option
                if (!tag || this.Utils.in_array(tag, unformatted)) {
                    return true;
                } else {
                    return false;
                }
            };

            this.printer = function(js_source, indent_character, indent_size, wrap_line_length, brace_style) { //handles input/output and some other printing functions

                this.input = js_source || ''; //gets the input for the Parser
                this.output = [];
                this.indent_character = indent_character;
                this.indent_string = '';
                this.indent_size = indent_size;
                this.brace_style = brace_style;
                this.indent_level = 0;
                this.wrap_line_length = wrap_line_length;
                this.line_char_count = 0; //count to see if wrap_line_length was exceeded

                for (var i = 0; i < this.indent_size; i++) {
                    this.indent_string += this.indent_character;
                }

                this.print_newline = function(force, arr) {
                    this.line_char_count = 0;
                    if (!arr || !arr.length) {
                        return;
                    }
                    if (force || (arr[arr.length - 1] !== '\n')) { //we might want the extra line
                        arr.push('\n');
                    }
                };

                this.print_indentation = function(arr) {
                    for (var i = 0; i < this.indent_level; i++) {
                        arr.push(this.indent_string);
                        this.line_char_count += this.indent_string.length;
                    }
                };

                this.print_token = function(text) {
                    if (text || text !== '') {
                        if (this.output.length && this.output[this.output.length - 1] === '\n') {
                            this.print_indentation(this.output);
                            text = ltrim(text);
                        }
                    }
                    this.print_token_raw(text);
                };

                this.print_token_raw = function(text) {
                    if (text && text !== '') {
                        if (text.length > 1 && text[text.length - 1] === '\n') {
                            // unformatted tags can grab newlines as their last character
                            this.output.push(text.slice(0, -1));
                            this.print_newline(false, this.output);
                        } else {
                            this.output.push(text);
                        }
                    }

                    for (var n = 0; n < this.newlines; n++) {
                        this.print_newline(n > 0, this.output);
                    }
                    this.newlines = 0;
                };

                this.indent = function() {
                    this.indent_level++;
                };

                this.unindent = function() {
                    if (this.indent_level > 0) {
                        this.indent_level--;
                    }
                };
            };
            return this;
        }

        /*_____________________--------------------_____________________*/

        multi_parser = new Parser(); //wrapping functions Parser
        multi_parser.printer(html_source, indent_character, indent_size, wrap_line_length, brace_style); //initialize starting values

        while (true) {
            var t = multi_parser.get_token();
            multi_parser.token_text = t[0];
            multi_parser.token_type = t[1];

            if (multi_parser.token_type === 'TK_EOF') {
                break;
            }

            switch (multi_parser.token_type) {
                case 'TK_TAG_START':
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                    if (multi_parser.indent_content) {
                        multi_parser.indent();
                        multi_parser.indent_content = false;
                    }
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_STYLE':
                case 'TK_TAG_SCRIPT':
                    multi_parser.print_newline(false, multi_parser.output);
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_END':
                    //Print new line only if the tag has no content and has child
                    if (multi_parser.last_token === 'TK_CONTENT' && multi_parser.last_text === '') {
                        var tag_name = multi_parser.token_text.match(/\w+/)[0];
                        var tag_extracted_from_last_output = null;
                        if (multi_parser.output.length) {
                            tag_extracted_from_last_output = multi_parser.output[multi_parser.output.length - 1].match(/(?:<|{{#)\s*(\w+)/);
                        }
                        if (tag_extracted_from_last_output === null ||
                            tag_extracted_from_last_output[1] !== tag_name) {
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_SINGLE':
                    // Don't add a newline before elements that should remain unformatted.
                    var tag_check = multi_parser.token_text.match(/^\s*<([a-z]+)/i);
                    if (!tag_check || !multi_parser.Utils.in_array(tag_check[1], unformatted)) {
                        multi_parser.print_newline(false, multi_parser.output);
                    }
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_TAG_HANDLEBARS_ELSE':
                    multi_parser.print_token(multi_parser.token_text);
                    if (multi_parser.indent_content) {
                        multi_parser.indent();
                        multi_parser.indent_content = false;
                    }
                    multi_parser.current_mode = 'CONTENT';
                    break;
                case 'TK_CONTENT':
                    multi_parser.print_token(multi_parser.token_text);
                    multi_parser.current_mode = 'TAG';
                    break;
                case 'TK_STYLE':
                case 'TK_SCRIPT':
                    if (multi_parser.token_text !== '') {
                        multi_parser.print_newline(false, multi_parser.output);
                        var text = multi_parser.token_text,
                            _beautifier,
                            script_indent_level = 1;
                        if (multi_parser.token_type === 'TK_SCRIPT') {
                            _beautifier = typeof js_beautify === 'function' && js_beautify;
                        } else if (multi_parser.token_type === 'TK_STYLE') {
                            _beautifier = typeof css_beautify === 'function' && css_beautify;
                        }

                        if (options.indent_scripts === "keep") {
                            script_indent_level = 0;
                        } else if (options.indent_scripts === "separate") {
                            script_indent_level = -multi_parser.indent_level;
                        }

                        var indentation = multi_parser.get_full_indent(script_indent_level);
                        if (_beautifier) {
                            // call the Beautifier if avaliable
                            text = _beautifier(text.replace(/^\s*/, indentation), options);
                        } else {
                            // simply indent the string otherwise
                            var white = text.match(/^\s*/)[0];
                            var _level = white.match(/[^\n\r]*$/)[0].split(multi_parser.indent_string).length - 1;
                            var reindent = multi_parser.get_full_indent(script_indent_level - _level);
                            text = text.replace(/^\s*/, indentation)
                                .replace(/\r\n|\r|\n/g, '\n' + reindent)
                                .replace(/\s+$/, '');
                        }
                        if (text) {
                            multi_parser.print_token_raw(indentation + trim(text));
                            multi_parser.print_newline(false, multi_parser.output);
                        }
                    }
                    multi_parser.current_mode = 'TAG';
                    break;
            }
            multi_parser.last_token = multi_parser.token_type;
            multi_parser.last_text = multi_parser.token_text;
        }
        return multi_parser.output.join('');
    }

    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define(["require", "./beautify", "./beautify-css"], function(requireamd) {
            var js_beautify =  requireamd("./beautify");
            var css_beautify =  requireamd("./beautify-css");
            
            return {
              html_beautify: function(html_source, options) {
                return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
              }
            };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var html_beautify = require("beautify").html_beautify`.
        var js_beautify = require('./beautify.js');
        var css_beautify = require('./beautify-css.js');

        exports.html_beautify = function(html_source, options) {
            return style_html(html_source, options, js_beautify.js_beautify, css_beautify.css_beautify);
        };
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.html_beautify = function(html_source, options) {
            return style_html(html_source, options, window.js_beautify, window.css_beautify);
        };
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.html_beautify = function(html_source, options) {
            return style_html(html_source, options, global.js_beautify, global.css_beautify);
        };
    }

}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./beautify-css.js":3,"./beautify.js":5}],5:[function(require,module,exports){
(function (global){
/*jshint curly:true, eqeqeq:true, laxbreak:true, noempty:false */
/*

  The MIT License (MIT)

  Copyright (c) 2007-2013 Einar Lielmanis and contributors.

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation files
  (the "Software"), to deal in the Software without restriction,
  including without limitation the rights to use, copy, modify, merge,
  publish, distribute, sublicense, and/or sell copies of the Software,
  and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
  BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
  ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 JS Beautifier
---------------


  Written by Einar Lielmanis, <einar@jsbeautifier.org>
      http://jsbeautifier.org/

  Originally converted to javascript by Vital, <vital76@gmail.com>
  "End braces on own line" added by Chris J. Shull, <chrisjshull@gmail.com>
  Parsing improvements for brace-less statements by Liam Newman <bitwiseman@gmail.com>


  Usage:
    js_beautify(js_source_text);
    js_beautify(js_source_text, options);

  The options are:
    indent_size (default 4)          - indentation size,
    indent_char (default space)      - character to indent with,
    preserve_newlines (default true) - whether existing line breaks should be preserved,
    max_preserve_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk,

    jslint_happy (default false) - if true, then jslint-stricter mode is enforced.

            jslint_happy   !jslint_happy
            ---------------------------------
             function ()      function()

    brace_style (default "collapse") - "collapse" | "expand" | "end-expand"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.

    space_before_conditional (default true) - should the space before conditional statement be added, "if(true)" vs "if (true)",

    unescape_strings (default false) - should printable characters in strings encoded in \xNN notation be unescaped, "example" vs "\x65\x78\x61\x6d\x70\x6c\x65"

    wrap_line_length (default unlimited) - lines should wrap at next opportunity after this number of characters.
          NOTE: This is not a hard limit. Lines will continue until a point where a newline would
                be preserved if it were present.

    e.g

    js_beautify(js_source_text, {
      'indent_size': 1,
      'indent_char': '\t'
    });

*/

(function() {

    var acorn = {};
    (function (exports) {
      // This section of code is taken from acorn.
      //
      // Acorn was written by Marijn Haverbeke and released under an MIT
      // license. The Unicode regexps (for identifiers and whitespace) were
      // taken from [Esprima](http://esprima.org) by Ariya Hidayat.
      //
      // Git repositories for Acorn are available at
      //
      //     http://marijnhaverbeke.nl/git/acorn
      //     https://github.com/marijnh/acorn.git

      // ## Character categories

      // Big ugly regular expressions that match characters in the
      // whitespace, identifier, and identifier-start categories. These
      // are only applied when a character is found to actually have a
      // code point above 128.

      var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
      var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
      var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
      var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
      var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

      // Whether a single character denotes a newline.

      var newline = /[\n\r\u2028\u2029]/;

      // Matches a whole line break (where CRLF is considered a single
      // line break). Used to count lines.

      var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

      // Test whether a given character code starts an identifier.

      var isIdentifierStart = exports.isIdentifierStart = function(code) {
        if (code < 65) return code === 36;
        if (code < 91) return true;
        if (code < 97) return code === 95;
        if (code < 123)return true;
        return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
      };

      // Test whether a given character is part of an identifier.

      var isIdentifierChar = exports.isIdentifierChar = function(code) {
        if (code < 48) return code === 36;
        if (code < 58) return true;
        if (code < 65) return false;
        if (code < 91) return true;
        if (code < 97) return code === 95;
        if (code < 123)return true;
        return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
      };
    })(acorn);

    function js_beautify(js_source_text, options) {
        "use strict";
        var beautifier = new Beautifier(js_source_text, options);
        return beautifier.beautify();
    }

    function Beautifier(js_source_text, options) {
        "use strict";
        var input, output_lines;
        var token_text, token_type, last_type, last_last_text, indent_string;
        var flags, previous_flags, flag_store;
        var whitespace, wordchar, punct, parser_pos, line_starters, reserved_words, digits;
        var prefix;
        var input_wanted_newline;
        var output_wrapped, output_space_before_token;
        var input_length, n_newlines, whitespace_before_token;
        var handlers, MODE, opt;
        var preindent_string = '';



        whitespace = "\n\r\t ".split('');
        wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
        digits = '0123456789'.split('');

        punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! , : ? ^ ^= |= :: =>';
        punct += ' <%= <% %> <?= <? ?>'; // try to be a good boy and try not to break the markup language identifiers
        punct = punct.split(' ');

        // words which should always start on new line.
        line_starters = 'continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function'.split(',');
        reserved_words = line_starters.concat(['do', 'in', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof']);


        MODE = {
            BlockStatement: 'BlockStatement', // 'BLOCK'
            Statement: 'Statement', // 'STATEMENT'
            ObjectLiteral: 'ObjectLiteral', // 'OBJECT',
            ArrayLiteral: 'ArrayLiteral', //'[EXPRESSION]',
            ForInitializer: 'ForInitializer', //'(FOR-EXPRESSION)',
            Conditional: 'Conditional', //'(COND-EXPRESSION)',
            Expression: 'Expression' //'(EXPRESSION)'
        };

        handlers = {
            'TK_START_EXPR': handle_start_expr,
            'TK_END_EXPR': handle_end_expr,
            'TK_START_BLOCK': handle_start_block,
            'TK_END_BLOCK': handle_end_block,
            'TK_WORD': handle_word,
            'TK_RESERVED': handle_word,
            'TK_SEMICOLON': handle_semicolon,
            'TK_STRING': handle_string,
            'TK_EQUALS': handle_equals,
            'TK_OPERATOR': handle_operator,
            'TK_COMMA': handle_comma,
            'TK_BLOCK_COMMENT': handle_block_comment,
            'TK_INLINE_COMMENT': handle_inline_comment,
            'TK_COMMENT': handle_comment,
            'TK_DOT': handle_dot,
            'TK_UNKNOWN': handle_unknown
        };

        function create_flags(flags_base, mode) {
            var next_indent_level = 0;
            if (flags_base) {
                next_indent_level = flags_base.indentation_level;
                if (!just_added_newline() &&
                    flags_base.line_indent_level > next_indent_level) {
                    next_indent_level = flags_base.line_indent_level;
                }
            }

            var next_flags = {
                mode: mode,
                parent: flags_base,
                last_text: flags_base ? flags_base.last_text : '', // last token text
                last_word: flags_base ? flags_base.last_word : '', // last 'TK_WORD' passed
                declaration_statement: false,
                declaration_assignment: false,
                in_html_comment: false,
                multiline_frame: false,
                if_block: false,
                else_block: false,
                do_block: false,
                do_while: false,
                in_case_statement: false, // switch(..){ INSIDE HERE }
                in_case: false, // we're on the exact line with "case 0:"
                case_body: false, // the indented case-action block
                indentation_level: next_indent_level,
                line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
                start_line_index: output_lines.length,
                had_comment: false,
                ternary_depth: 0
            };
            return next_flags;
        }

        // Using object instead of string to allow for later expansion of info about each line

        function create_output_line() {
            return {
                text: []
            };
        }

        // Some interpreters have unexpected results with foo = baz || bar;
        options = options ? options : {};
        opt = {};

        // compatibility
        if (options.space_after_anon_function !== undefined && options.jslint_happy === undefined) {
            options.jslint_happy = options.space_after_anon_function;
        }
        if (options.braces_on_own_line !== undefined) { //graceful handling of deprecated option
            opt.brace_style = options.braces_on_own_line ? "expand" : "collapse";
        }
        opt.brace_style = options.brace_style ? options.brace_style : (opt.brace_style ? opt.brace_style : "collapse");

        // graceful handling of deprecated option
        if (opt.brace_style === "expand-strict") {
            opt.brace_style = "expand";
        }


        opt.indent_size = options.indent_size ? parseInt(options.indent_size, 10) : 4;
        opt.indent_char = options.indent_char ? options.indent_char : ' ';
        opt.preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
        opt.break_chained_methods = (options.break_chained_methods === undefined) ? false : options.break_chained_methods;
        opt.max_preserve_newlines = (options.max_preserve_newlines === undefined) ? 0 : parseInt(options.max_preserve_newlines, 10);
        opt.space_in_paren = (options.space_in_paren === undefined) ? false : options.space_in_paren;
        opt.space_in_empty_paren = (options.space_in_empty_paren === undefined) ? false : options.space_in_empty_paren;
        opt.jslint_happy = (options.jslint_happy === undefined) ? false : options.jslint_happy;
        opt.keep_array_indentation = (options.keep_array_indentation === undefined) ? false : options.keep_array_indentation;
        opt.space_before_conditional = (options.space_before_conditional === undefined) ? true : options.space_before_conditional;
        opt.unescape_strings = (options.unescape_strings === undefined) ? false : options.unescape_strings;
        opt.wrap_line_length = (options.wrap_line_length === undefined) ? 0 : parseInt(options.wrap_line_length, 10);
        opt.e4x = (options.e4x === undefined) ? false : options.e4x;

        if(options.indent_with_tabs){
            opt.indent_char = '\t';
            opt.indent_size = 1;
        }

        //----------------------------------
        indent_string = '';
        while (opt.indent_size > 0) {
            indent_string += opt.indent_char;
            opt.indent_size -= 1;
        }

        while (js_source_text && (js_source_text.charAt(0) === ' ' || js_source_text.charAt(0) === '\t')) {
            preindent_string += js_source_text.charAt(0);
            js_source_text = js_source_text.substring(1);
        }
        input = js_source_text;
        // cache the source's length.
        input_length = js_source_text.length;

        last_type = 'TK_START_BLOCK'; // last token type
        last_last_text = ''; // pre-last token text
        output_lines = [create_output_line()];
        output_wrapped = false;
        output_space_before_token = false;
        whitespace_before_token = [];

        // Stack of parsing/formatting states, including MODE.
        // We tokenize, parse, and output in an almost purely a forward-only stream of token input
        // and formatted output.  This makes the beautifier less accurate than full parsers
        // but also far more tolerant of syntax errors.
        //
        // For example, the default mode is MODE.BlockStatement. If we see a '{' we push a new frame of type
        // MODE.BlockStatement on the the stack, even though it could be object literal.  If we later
        // encounter a ":", we'll switch to to MODE.ObjectLiteral.  If we then see a ";",
        // most full parsers would die, but the beautifier gracefully falls back to
        // MODE.BlockStatement and continues on.
        flag_store = [];
        set_mode(MODE.BlockStatement);

        parser_pos = 0;

        this.beautify = function() {
            /*jshint onevar:true */
            var t, i, keep_whitespace, sweet_code;

            while (true) {
                t = get_next_token();
                token_text = t[0];
                token_type = t[1];

                if (token_type === 'TK_EOF') {
                    // Unwind any open statements
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    break;
                }

                keep_whitespace = opt.keep_array_indentation && is_array(flags.mode);
                input_wanted_newline = n_newlines > 0;

                if (keep_whitespace) {
                    for (i = 0; i < n_newlines; i += 1) {
                        print_newline(i > 0);
                    }
                } else {
                    if (opt.max_preserve_newlines && n_newlines > opt.max_preserve_newlines) {
                        n_newlines = opt.max_preserve_newlines;
                    }

                    if (opt.preserve_newlines) {
                        if (n_newlines > 1) {
                            print_newline();
                            for (i = 1; i < n_newlines; i += 1) {
                                print_newline(true);
                            }
                        }
                    }
                }

                handlers[token_type]();

                // The cleanest handling of inline comments is to treat them as though they aren't there.
                // Just continue formatting and the behavior should be logical.
                // Also ignore unknown tokens.  Again, this should result in better behavior.
                if (token_type !== 'TK_INLINE_COMMENT' && token_type !== 'TK_COMMENT' &&
                    token_type !== 'TK_BLOCK_COMMENT' && token_type !== 'TK_UNKNOWN') {
                    last_last_text = flags.last_text;
                    last_type = token_type;
                    flags.last_text = token_text;
                }
                flags.had_comment = (token_type === 'TK_INLINE_COMMENT' || token_type === 'TK_COMMENT'
                    || token_type === 'TK_BLOCK_COMMENT');
            }


            sweet_code = output_lines[0].text.join('');
            for (var line_index = 1; line_index < output_lines.length; line_index++) {
                sweet_code += '\n' + output_lines[line_index].text.join('');
            }
            sweet_code = sweet_code.replace(/[\r\n ]+$/, '');
            return sweet_code;
        };

        function trim_output(eat_newlines) {
            eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;

            if (output_lines.length) {
                trim_output_line(output_lines[output_lines.length - 1], eat_newlines);

                while (eat_newlines && output_lines.length > 1 &&
                    output_lines[output_lines.length - 1].text.length === 0) {
                    output_lines.pop();
                    trim_output_line(output_lines[output_lines.length - 1], eat_newlines);
                }
            }
        }

        function trim_output_line(line) {
            while (line.text.length &&
                (line.text[line.text.length - 1] === ' ' ||
                    line.text[line.text.length - 1] === indent_string ||
                    line.text[line.text.length - 1] === preindent_string)) {
                line.text.pop();
            }
        }

        function trim(s) {
            return s.replace(/^\s+|\s+$/g, '');
        }

        // we could use just string.split, but
        // IE doesn't like returning empty strings

        function split_newlines(s) {
            //return s.split(/\x0d\x0a|\x0a/);

            s = s.replace(/\x0d/g, '');
            var out = [],
                idx = s.indexOf("\n");
            while (idx !== -1) {
                out.push(s.substring(0, idx));
                s = s.substring(idx + 1);
                idx = s.indexOf("\n");
            }
            if (s.length) {
                out.push(s);
            }
            return out;
        }

        function just_added_newline() {
            var line = output_lines[output_lines.length - 1];
            return line.text.length === 0;
        }

        function just_added_blankline() {
            if (just_added_newline()) {
                if (output_lines.length === 1) {
                    return true; // start of the file and newline = blank
                }

                var line = output_lines[output_lines.length - 2];
                return line.text.length === 0;
            }
            return false;
        }

        function allow_wrap_or_preserved_newline(force_linewrap) {
            force_linewrap = (force_linewrap === undefined) ? false : force_linewrap;
            if (opt.wrap_line_length && !force_linewrap) {
                var line = output_lines[output_lines.length - 1];
                var proposed_line_length = 0;
                // never wrap the first token of a line.
                if (line.text.length > 0) {
                    proposed_line_length = line.text.join('').length + token_text.length +
                        (output_space_before_token ? 1 : 0);
                    if (proposed_line_length >= opt.wrap_line_length) {
                        force_linewrap = true;
                    }
                }
            }
            if (((opt.preserve_newlines && input_wanted_newline) || force_linewrap) && !just_added_newline()) {
                print_newline(false, true);

                // Expressions and array literals already indent their contents.
                if (!(is_array(flags.mode) || is_expression(flags.mode) || flags.mode === MODE.Statement)) {
                    output_wrapped = true;
                }
            }
        }

        function print_newline(force_newline, preserve_statement_flags) {
            output_wrapped = false;
            output_space_before_token = false;

            if (!preserve_statement_flags) {
                if (flags.last_text !== ';' && flags.last_text !== ',' && flags.last_text !== '=' && last_type !== 'TK_OPERATOR') {
                    while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
                        restore_mode();
                    }
                }
            }

            if (output_lines.length === 1 && just_added_newline()) {
                return; // no newline on start of file
            }

            if (force_newline || !just_added_newline()) {
                flags.multiline_frame = true;
                output_lines.push(create_output_line());
            }
        }

        function print_token_line_indentation() {
            if (just_added_newline()) {
                var line = output_lines[output_lines.length - 1];
                if (opt.keep_array_indentation && is_array(flags.mode) && input_wanted_newline) {
                    // prevent removing of this whitespace as redundant
                    line.text.push('');
                    for (var i = 0; i < whitespace_before_token.length; i += 1) {
                        line.text.push(whitespace_before_token[i]);
                    }
                } else {
                    if (preindent_string) {
                        line.text.push(preindent_string);
                    }

                    print_indent_string(flags.indentation_level +
                        (output_wrapped ? 1 : 0));
                }
            }
        }

        function print_indent_string(level) {
            // Never indent your first output indent at the start of the file
            if (output_lines.length > 1) {
                var line = output_lines[output_lines.length - 1];

                flags.line_indent_level = level;
                for (var i = 0; i < level; i += 1) {
                    line.text.push(indent_string);
                }
            }
        }

        function print_token_space_before() {
            var line = output_lines[output_lines.length - 1];
            if (output_space_before_token && line.text.length) {
                var last_output = line.text[line.text.length - 1];
                if (last_output !== ' ' && last_output !== indent_string) { // prevent occassional duplicate space
                    line.text.push(' ');
                }
            }
        }

        function print_token(printable_token) {
            printable_token = printable_token || token_text;
            print_token_line_indentation();
            output_wrapped = false;
            print_token_space_before();
            output_space_before_token = false;
            output_lines[output_lines.length - 1].text.push(printable_token);
        }

        function indent() {
            flags.indentation_level += 1;
        }

        function deindent() {
            if (flags.indentation_level > 0 &&
                ((!flags.parent) || flags.indentation_level > flags.parent.indentation_level))
                flags.indentation_level -= 1;
        }

        function remove_redundant_indentation(frame) {
            // This implementation is effective but has some issues:
            //     - less than great performance due to array splicing
            //     - can cause line wrap to happen too soon due to indent removal
            //           after wrap points are calculated
            // These issues are minor compared to ugly indentation.

            if (frame.multiline_frame) return;

            // remove one indent from each line inside this section
            var index = frame.start_line_index;
            var splice_index = 0;
            var line;

            while (index < output_lines.length) {
                line = output_lines[index];
                index++;

                // skip empty lines
                if (line.text.length === 0) {
                    continue;
                }

                // skip the preindent string if present
                if (preindent_string && line.text[0] === preindent_string) {
                    splice_index = 1;
                } else {
                    splice_index = 0;
                }

                // remove one indent, if present
                if (line.text[splice_index] === indent_string) {
                    line.text.splice(splice_index, 1);
                }
            }
        }

        function set_mode(mode) {
            if (flags) {
                flag_store.push(flags);
                previous_flags = flags;
            } else {
                previous_flags = create_flags(null, mode);
            }

            flags = create_flags(previous_flags, mode);
        }

        function is_array(mode) {
            return mode === MODE.ArrayLiteral;
        }

        function is_expression(mode) {
            return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
        }

        function restore_mode() {
            if (flag_store.length > 0) {
                previous_flags = flags;
                flags = flag_store.pop();
                if (previous_flags.mode === MODE.Statement) {
                    remove_redundant_indentation(previous_flags);
                }
            }
        }

        function start_of_object_property() {
            return flags.mode === MODE.ObjectLiteral && flags.last_text === ':' &&
                flags.ternary_depth === 0;
        }

        function start_of_statement() {
            if (
                    (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && token_type === 'TK_WORD') ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'do') ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'return' && !input_wanted_newline) ||
                    (last_type === 'TK_RESERVED' && flags.last_text === 'else' && !(token_type === 'TK_RESERVED' && token_text === 'if')) ||
                    (last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional))) {

                set_mode(MODE.Statement);
                indent();

                if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && token_type === 'TK_WORD') {
                    flags.declaration_statement = true;
                }

                // Issue #276:
                // If starting a new statement with [if, for, while, do], push to a new line.
                // if (a) if (b) if(c) d(); else e(); else f();
                allow_wrap_or_preserved_newline(
                    token_type === 'TK_RESERVED' && in_array(token_text, ['do', 'for', 'if', 'while']));

                output_wrapped = false;

                return true;
            }
            return false;
        }

        function all_lines_start_with(lines, c) {
            for (var i = 0; i < lines.length; i++) {
                var line = trim(lines[i]);
                if (line.charAt(0) !== c) {
                    return false;
                }
            }
            return true;
        }

        function is_special_word(word) {
            return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
        }

        function in_array(what, arr) {
            for (var i = 0; i < arr.length; i += 1) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
        }

        function unescape_string(s) {
            var esc = false,
                out = '',
                pos = 0,
                s_hex = '',
                escaped = 0,
                c;

            while (esc || pos < s.length) {

                c = s.charAt(pos);
                pos++;

                if (esc) {
                    esc = false;
                    if (c === 'x') {
                        // simple hex-escape \x24
                        s_hex = s.substr(pos, 2);
                        pos += 2;
                    } else if (c === 'u') {
                        // unicode-escape, \u2134
                        s_hex = s.substr(pos, 4);
                        pos += 4;
                    } else {
                        // some common escape, e.g \n
                        out += '\\' + c;
                        continue;
                    }
                    if (!s_hex.match(/^[0123456789abcdefABCDEF]+$/)) {
                        // some weird escaping, bail out,
                        // leaving whole string intact
                        return s;
                    }

                    escaped = parseInt(s_hex, 16);

                    if (escaped >= 0x00 && escaped < 0x20) {
                        // leave 0x00...0x1f escaped
                        if (c === 'x') {
                            out += '\\x' + s_hex;
                        } else {
                            out += '\\u' + s_hex;
                        }
                        continue;
                    } else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
                        // single-quote, apostrophe, backslash - escape these
                        out += '\\' + String.fromCharCode(escaped);
                    } else if (c === 'x' && escaped > 0x7e && escaped <= 0xff) {
                        // we bail out on \x7f..\xff,
                        // leaving whole string escaped,
                        // as it's probably completely binary
                        return s;
                    } else {
                        out += String.fromCharCode(escaped);
                    }
                } else if (c === '\\') {
                    esc = true;
                } else {
                    out += c;
                }
            }
            return out;
        }

        function is_next(find) {
            var local_pos = parser_pos;
            var c = input.charAt(local_pos);
            while (in_array(c, whitespace) && c !== find) {
                local_pos++;
                if (local_pos >= input_length) {
                    return false;
                }
                c = input.charAt(local_pos);
            }
            return c === find;
        }

        function get_next_token() {
            var i, resulting_string;

            n_newlines = 0;

            if (parser_pos >= input_length) {
                return ['', 'TK_EOF'];
            }

            input_wanted_newline = false;
            whitespace_before_token = [];

            var c = input.charAt(parser_pos);
            parser_pos += 1;

            while (in_array(c, whitespace)) {

                if (c === '\n') {
                    n_newlines += 1;
                    whitespace_before_token = [];
                } else if (n_newlines) {
                    if (c === indent_string) {
                        whitespace_before_token.push(indent_string);
                    } else if (c !== '\r') {
                        whitespace_before_token.push(' ');
                    }
                }

                if (parser_pos >= input_length) {
                    return ['', 'TK_EOF'];
                }

                c = input.charAt(parser_pos);
                parser_pos += 1;
            }

            // NOTE: because beautifier doesn't fully parse, it doesn't use acorn.isIdentifierStart.
            // It just treats all identifiers and numbers and such the same.
            if (acorn.isIdentifierChar(input.charCodeAt(parser_pos-1))) {
                if (parser_pos < input_length) {
                    while (acorn.isIdentifierChar(input.charCodeAt(parser_pos))) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos === input_length) {
                            break;
                        }
                    }
                }

                // small and surprisingly unugly hack for 1E-10 representation
                if (parser_pos !== input_length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {

                    var sign = input.charAt(parser_pos);
                    parser_pos += 1;

                    var t = get_next_token();
                    c += sign + t[0];
                    return [c, 'TK_WORD'];
                }

                if (!(last_type === 'TK_DOT' ||
                        (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['set', 'get'])))
                    && in_array(c, reserved_words)) {
                    if (c === 'in') { // hack for 'in' operator
                        return [c, 'TK_OPERATOR'];
                    }
                    return [c, 'TK_RESERVED'];
                }
                return [c, 'TK_WORD'];
            }

            if (c === '(' || c === '[') {
                return [c, 'TK_START_EXPR'];
            }

            if (c === ')' || c === ']') {
                return [c, 'TK_END_EXPR'];
            }

            if (c === '{') {
                return [c, 'TK_START_BLOCK'];
            }

            if (c === '}') {
                return [c, 'TK_END_BLOCK'];
            }

            if (c === ';') {
                return [c, 'TK_SEMICOLON'];
            }

            if (c === '/') {
                var comment = '';
                // peek for comment /* ... */
                var inline_comment = true;
                if (input.charAt(parser_pos) === '*') {
                    parser_pos += 1;
                    if (parser_pos < input_length) {
                        while (parser_pos < input_length && !(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/')) {
                            c = input.charAt(parser_pos);
                            comment += c;
                            if (c === "\n" || c === "\r") {
                                inline_comment = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                break;
                            }
                        }
                    }
                    parser_pos += 2;
                    if (inline_comment && n_newlines === 0) {
                        return ['/*' + comment + '*/', 'TK_INLINE_COMMENT'];
                    } else {
                        return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
                    }
                }
                // peek for comment // ...
                if (input.charAt(parser_pos) === '/') {
                    comment = c;
                    while (input.charAt(parser_pos) !== '\r' && input.charAt(parser_pos) !== '\n') {
                        comment += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input_length) {
                            break;
                        }
                    }
                    return [comment, 'TK_COMMENT'];
                }

            }


            if (c === '`' || c === "'" || c === '"' || // string
                (
                    (c === '/') || // regexp
                    (opt.e4x && c === "<" && input.slice(parser_pos - 1).match(/^<([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])\s*([-a-zA-Z:0-9_.]+=('[^']*'|"[^"]*"|{[^{}]*})\s*)*\/?\s*>/)) // xml
                ) && ( // regex and xml can only appear in specific locations during parsing
                    (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) ||
                    (last_type === 'TK_END_EXPR' && in_array(previous_flags.mode, [MODE.Conditional, MODE.ForInitializer])) ||
                    (in_array(last_type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK',
                        'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA'
                    ]))
                )) {

                var sep = c,
                    esc = false,
                    has_char_escapes = false;

                resulting_string = c;

                if (parser_pos < input_length) {
                    if (sep === '/') {
                        //
                        // handle regexp
                        //
                        var in_char_class = false;
                        while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (!esc) {
                                esc = input.charAt(parser_pos) === '\\';
                                if (input.charAt(parser_pos) === '[') {
                                    in_char_class = true;
                                } else if (input.charAt(parser_pos) === ']') {
                                    in_char_class = false;
                                }
                            } else {
                                esc = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when end-of-file reached.
                                // bail out with what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    } else if (opt.e4x && sep === '<') {
                        //
                        // handle e4x xml literals
                        //
                        var xmlRegExp = /<(\/?)([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])\s*([-a-zA-Z:0-9_.]+=('[^']*'|"[^"]*"|{[^{}]*})\s*)*(\/?)\s*>/g;
                        var xmlStr = input.slice(parser_pos - 1);
                        var match = xmlRegExp.exec(xmlStr);
                        if (match && match.index === 0) {
                            var rootTag = match[2];
                            var depth = 0;
                            while (match) {
                                var isEndTag = !! match[1];
                                var tagName = match[2];
                                var isSingletonTag = ( !! match[match.length - 1]) || (tagName.slice(0, 8) === "![CDATA[");
                                if (tagName === rootTag && !isSingletonTag) {
                                    if (isEndTag) {
                                        --depth;
                                    } else {
                                        ++depth;
                                    }
                                }
                                if (depth <= 0) {
                                    break;
                                }
                                match = xmlRegExp.exec(xmlStr);
                            }
                            var xmlLength = match ? match.index + match[0].length : xmlStr.length;
                            parser_pos += xmlLength - 1;
                            return [xmlStr.slice(0, xmlLength), "TK_STRING"];
                        }
                    } else {
                        //
                        // handle string
                        //
                        while (esc || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (esc) {
                                if (input.charAt(parser_pos) === 'x' || input.charAt(parser_pos) === 'u') {
                                    has_char_escapes = true;
                                }
                                esc = false;
                            } else {
                                esc = input.charAt(parser_pos) === '\\';
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when end-of-file reached.
                                // bail out with what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }

                    }
                }

                parser_pos += 1;
                resulting_string += sep;

                if (has_char_escapes && opt.unescape_strings) {
                    resulting_string = unescape_string(resulting_string);
                }

                if (sep === '/') {
                    // regexps may have modifiers /regexp/MOD , so fetch those, too
                    while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
                        resulting_string += input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }

            if (c === '#') {


                if (output_lines.length === 1 && output_lines[0].text.length === 0 &&
                    input.charAt(parser_pos) === '!') {
                    // shebang
                    resulting_string = c;
                    while (parser_pos < input_length && c !== '\n') {
                        c = input.charAt(parser_pos);
                        resulting_string += c;
                        parser_pos += 1;
                    }
                    return [trim(resulting_string) + '\n', 'TK_UNKNOWN'];
                }



                // Spidermonkey-specific sharp variables for circular references
                // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
                // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
                var sharp = '#';
                if (parser_pos < input_length && in_array(input.charAt(parser_pos), digits)) {
                    do {
                        c = input.charAt(parser_pos);
                        sharp += c;
                        parser_pos += 1;
                    } while (parser_pos < input_length && c !== '#' && c !== '=');
                    if (c === '#') {
                        //
                    } else if (input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
                        sharp += '[]';
                        parser_pos += 2;
                    } else if (input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
                        sharp += '{}';
                        parser_pos += 2;
                    }
                    return [sharp, 'TK_WORD'];
                }
            }

            if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
                parser_pos += 3;
                c = '<!--';
                while (input.charAt(parser_pos) !== '\n' && parser_pos < input_length) {
                    c += input.charAt(parser_pos);
                    parser_pos++;
                }
                flags.in_html_comment = true;
                return [c, 'TK_COMMENT'];
            }

            if (c === '-' && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
                flags.in_html_comment = false;
                parser_pos += 2;
                return ['-->', 'TK_COMMENT'];
            }

            if (c === '.') {
                return [c, 'TK_DOT'];
            }

            if (in_array(c, punct)) {
                while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input_length) {
                        break;
                    }
                }

                if (c === ',') {
                    return [c, 'TK_COMMA'];
                } else if (c === '=') {
                    return [c, 'TK_EQUALS'];
                } else {
                    return [c, 'TK_OPERATOR'];
                }
            }

            return [c, 'TK_UNKNOWN'];
        }

        function handle_start_expr() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            }

            var next_mode = MODE.Expression;
            if (token_text === '[') {

                if (last_type === 'TK_WORD' || flags.last_text === ')') {
                    // this is array index specifier, break immediately
                    // a[x], fn()[x]
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, line_starters)) {
                        output_space_before_token = true;
                    }
                    set_mode(next_mode);
                    print_token();
                    indent();
                    if (opt.space_in_paren) {
                        output_space_before_token = true;
                    }
                    return;
                }

                next_mode = MODE.ArrayLiteral;
                if (is_array(flags.mode)) {
                    if (flags.last_text === '[' ||
                        (flags.last_text === ',' && (last_last_text === ']' || last_last_text === '}'))) {
                        // ], [ goes to new line
                        // }, [ goes to new line
                        if (!opt.keep_array_indentation) {
                            print_newline();
                        }
                    }
                }

            } else {
                if (last_type === 'TK_RESERVED' && flags.last_text === 'for') {
                    next_mode = MODE.ForInitializer;
                } else if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['if', 'while'])) {
                    next_mode = MODE.Conditional;
                } else {
                    // next_mode = MODE.Expression;
                }
            }

            if (flags.last_text === ';' || last_type === 'TK_START_BLOCK') {
                print_newline();
            } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
                // TODO: Consider whether forcing this is required.  Review failing tests when removed.
                allow_wrap_or_preserved_newline(input_wanted_newline);
                output_wrapped = false;
                // do nothing on (( and )( and ][ and ]( and .(
            } else if (!(last_type === 'TK_RESERVED' && token_text === '(') && last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                output_space_before_token = true;
            } else if (last_type === 'TK_RESERVED' && (flags.last_word === 'function' || flags.last_word === 'typeof')) {
                // function() vs function ()
                if (opt.jslint_happy) {
                    output_space_before_token = true;
                }
            } else if (last_type === 'TK_RESERVED' && (in_array(flags.last_text, line_starters) || flags.last_text === 'catch')) {
                if (opt.space_before_conditional) {
                    output_space_before_token = true;
                }
            }

            // Support of this kind of newline preservation.
            // a = (b &&
            //     (c || d));
            if (token_text === '(') {
                if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                    if (!start_of_object_property()) {
                        allow_wrap_or_preserved_newline();
                    }
                }
            }

            set_mode(next_mode);
            print_token();
            if (opt.space_in_paren) {
                output_space_before_token = true;
            }

            // In all cases, if we newline while inside an expression it should be indented.
            indent();
        }

        function handle_end_expr() {
            // statements inside expressions are not valid syntax, but...
            // statements must all be closed when their container closes
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }

            if (flags.multiline_frame) {
                allow_wrap_or_preserved_newline(token_text === ']' && is_array(flags.mode) && !opt.keep_array_indentation);
                output_wrapped = false;
            }

            if (opt.space_in_paren) {
                if (last_type === 'TK_START_EXPR' && ! opt.space_in_empty_paren) {
                    // () [] no inner space in empty parens like these, ever, ref #320
                    trim_output();
                    output_space_before_token = false;
                } else {
                    output_space_before_token = true;
                }
            }
            if (token_text === ']' && opt.keep_array_indentation) {
                print_token();
                restore_mode();
            } else {
                restore_mode();
                print_token();
            }
            remove_redundant_indentation(previous_flags);

            // do {} while () // no statement required after
            if (flags.do_while && previous_flags.mode === MODE.Conditional) {
                previous_flags.mode = MODE.Expression;
                flags.do_block = false;
                flags.do_while = false;

            }
        }

        function handle_start_block() {
            set_mode(MODE.BlockStatement);

            var empty_braces = is_next('}');
            var empty_anonymous_function = empty_braces && flags.last_word === 'function' &&
                last_type === 'TK_END_EXPR';

            if (opt.brace_style === "expand") {
                if (last_type !== 'TK_OPERATOR' &&
                    (empty_anonymous_function ||
                        last_type === 'TK_EQUALS' ||
                        (last_type === 'TK_RESERVED' && is_special_word(flags.last_text) && flags.last_text !== 'else'))) {
                    output_space_before_token = true;
                } else {
                    print_newline(false, true);
                }
            } else { // collapse
                if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                    if (last_type === 'TK_START_BLOCK') {
                        print_newline();
                    } else {
                        output_space_before_token = true;
                    }
                } else {
                    // if TK_OPERATOR or TK_START_EXPR
                    if (is_array(previous_flags.mode) && flags.last_text === ',') {
                        if (last_last_text === '}') {
                            // }, { in array context
                            output_space_before_token = true;
                        } else {
                            print_newline(); // [a, b, c, {
                        }
                    }
                }
            }
            print_token();
            indent();
        }

        function handle_end_block() {
            // statements must all be closed when their container closes
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }
            var empty_braces = last_type === 'TK_START_BLOCK';

            if (opt.brace_style === "expand") {
                if (!empty_braces) {
                    print_newline();
                }
            } else {
                // skip {}
                if (!empty_braces) {
                    if (is_array(flags.mode) && opt.keep_array_indentation) {
                        // we REALLY need a newline here, but newliner would skip that
                        opt.keep_array_indentation = false;
                        print_newline();
                        opt.keep_array_indentation = true;

                    } else {
                        print_newline();
                    }
                }
            }
            restore_mode();
            print_token();
        }

        function handle_word() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
            } else if (input_wanted_newline && !is_expression(flags.mode) &&
                (last_type !== 'TK_OPERATOR' || (flags.last_text === '--' || flags.last_text === '++')) &&
                last_type !== 'TK_EQUALS' &&
                (opt.preserve_newlines || !(last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const', 'set', 'get'])))) {

                print_newline();
            }

            if (flags.do_block && !flags.do_while) {
                if (token_type === 'TK_RESERVED' && token_text === 'while') {
                    // do {} ## while ()
                    output_space_before_token = true;
                    print_token();
                    output_space_before_token = true;
                    flags.do_while = true;
                    return;
                } else {
                    // do {} should always have while as the next word.
                    // if we don't see the expected while, recover
                    print_newline();
                    flags.do_block = false;
                }
            }

            // if may be followed by else, or not
            // Bare/inline ifs are tricky
            // Need to unwind the modes correctly: if (a) if (b) c(); else d(); else e();
            if (flags.if_block) {
                if (!flags.else_block && (token_type === 'TK_RESERVED' && token_text === 'else')) {
                    flags.else_block = true;
                } else {
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    flags.if_block = false;
                    flags.else_block = false;
                }
            }

            if (token_type === 'TK_RESERVED' && (token_text === 'case' || (token_text === 'default' && flags.in_case_statement))) {
                print_newline();
                if (flags.case_body || opt.jslint_happy) {
                    // switch cases following one another
                    deindent();
                    flags.case_body = false;
                }
                print_token();
                flags.in_case = true;
                flags.in_case_statement = true;
                return;
            }

            if (token_type === 'TK_RESERVED' && token_text === 'function') {
                if (in_array(flags.last_text, ['}', ';']) || (just_added_newline() && ! in_array(flags.last_text, ['{', ':', '=', ',']))) {
                    // make sure there is a nice clean space of at least one blank line
                    // before a new function definition
                    if ( ! just_added_blankline() && ! flags.had_comment) {
                        print_newline();
                        print_newline(true);
                    }
                }
                if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set', 'new', 'return'])) {
                        output_space_before_token = true;
                    } else {
                        print_newline();
                    }
                } else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
                    // foo = function
                    output_space_before_token = true;
                } else if (is_expression(flags.mode)) {
                    // (function
                } else {
                    print_newline();
                }
            }

            if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline();
                }
            }

            if (token_type === 'TK_RESERVED' && token_text === 'function') {
                print_token();
                flags.last_word = token_text;
                return;
            }

            prefix = 'NONE';

            if (last_type === 'TK_END_BLOCK') {
                if (!(token_type === 'TK_RESERVED' && in_array(token_text, ['else', 'catch', 'finally']))) {
                    prefix = 'NEWLINE';
                } else {
                    if (opt.brace_style === "expand" || opt.brace_style === "end-expand") {
                        prefix = 'NEWLINE';
                    } else {
                        prefix = 'SPACE';
                        output_space_before_token = true;
                    }
                }
            } else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
                // TODO: Should this be for STATEMENT as well?
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                prefix = 'SPACE';
            } else if (last_type === 'TK_STRING') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                prefix = 'SPACE';
            } else if (last_type === 'TK_START_BLOCK') {
                prefix = 'NEWLINE';
            } else if (last_type === 'TK_END_EXPR') {
                output_space_before_token = true;
                prefix = 'NEWLINE';
            }

            if (token_type === 'TK_RESERVED' && in_array(token_text, line_starters) && flags.last_text !== ')') {
                if (flags.last_text === 'else') {
                    prefix = 'SPACE';
                } else {
                    prefix = 'NEWLINE';
                }

            }

            if (token_type === 'TK_RESERVED' && in_array(token_text, ['else', 'catch', 'finally'])) {
                if (last_type !== 'TK_END_BLOCK' || opt.brace_style === "expand" || opt.brace_style === "end-expand") {
                    print_newline();
                } else {
                    trim_output(true);
                    var line = output_lines[output_lines.length - 1];
                    // If we trimmed and there's something other than a close block before us
                    // put a newline back in.  Handles '} // comment' scenario.
                    if (line.text[line.text.length - 1] !== '}') {
                        print_newline();
                    }
                    output_space_before_token = true;
                }
            } else if (prefix === 'NEWLINE') {
                if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                    // no newline between 'return nnn'
                    output_space_before_token = true;
                } else if (last_type !== 'TK_END_EXPR') {
                    if ((last_type !== 'TK_START_EXPR' || !(token_type === 'TK_RESERVED' && in_array(token_text, ['var', 'let', 'const']))) && flags.last_text !== ':') {
                        // no need to force newline on 'var': for (var x = 0...)
                        if (token_type === 'TK_RESERVED' && token_text === 'if' && flags.last_word === 'else' && flags.last_text !== '{') {
                            // no newline for } else if {
                            output_space_before_token = true;
                        } else {
                            print_newline();
                        }
                    }
                } else if (token_type === 'TK_RESERVED' && in_array(token_text, line_starters) && flags.last_text !== ')') {
                    print_newline();
                }
            } else if (is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
                print_newline(); // }, in lists get a newline treatment
            } else if (prefix === 'SPACE') {
                output_space_before_token = true;
            }
            print_token();
            flags.last_word = token_text;

            if (token_type === 'TK_RESERVED' && token_text === 'do') {
                flags.do_block = true;
            }

            if (token_type === 'TK_RESERVED' && token_text === 'if') {
                flags.if_block = true;
            }
        }

        function handle_semicolon() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
                // Semicolon can be the start (and end) of a statement
                output_space_before_token = false;
            }
            while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
                restore_mode();
            }
            print_token();
            if (flags.mode === MODE.ObjectLiteral) {
                // if we're in OBJECT mode and see a semicolon, its invalid syntax
                // recover back to treating this as a BLOCK
                flags.mode = MODE.BlockStatement;
            }
        }

        function handle_string() {
            if (start_of_statement()) {
                // The conditional starts the statement if appropriate.
                // One difference - strings want at least a space before
                output_space_before_token = true;
            } else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                output_space_before_token = true;
            } else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline();
                }
            } else {
                print_newline();
            }
            print_token();
        }

        function handle_equals() {
            if (flags.declaration_statement) {
                // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
                flags.declaration_assignment = true;
            }
            output_space_before_token = true;
            print_token();
            output_space_before_token = true;
        }

        function handle_comma() {
            if (flags.declaration_statement) {
                if (is_expression(flags.parent.mode)) {
                    // do not break on comma, for(var a = 1, b = 2)
                    flags.declaration_assignment = false;
                }

                print_token();

                if (flags.declaration_assignment) {
                    flags.declaration_assignment = false;
                    print_newline(false, true);
                } else {
                    output_space_before_token = true;
                }
                return;
            }

            if (last_type === 'TK_END_BLOCK' && flags.mode !== MODE.Expression) {
                print_token();
                if (flags.mode === MODE.ObjectLiteral && flags.last_text === '}') {
                    print_newline();
                } else {
                    output_space_before_token = true;
                }
            } else {
                if (flags.mode === MODE.ObjectLiteral) {
                    print_token();
                    print_newline();
                } else {
                    // EXPR or DO_BLOCK
                    print_token();
                    output_space_before_token = true;
                }
            }
        }

        function handle_operator() {
            var space_before = true;
            var space_after = true;
            if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                // "return" had a special handling in TK_WORD. Now we need to return the favor
                output_space_before_token = true;
                print_token();
                return;
            }

            // hack for actionscript's import .*;
            if (token_text === '*' && last_type === 'TK_DOT' && !last_last_text.match(/^\d+$/)) {
                print_token();
                return;
            }

            if (token_text === ':' && flags.in_case) {
                flags.case_body = true;
                indent();
                print_token();
                print_newline();
                flags.in_case = false;
                return;
            }

            if (token_text === '::') {
                // no spaces around exotic namespacing syntax operator
                print_token();
                return;
            }

            // http://www.ecma-international.org/ecma-262/5.1/#sec-7.9.1
            // if there is a newline between -- or ++ and anything else we should preserve it.
            if (input_wanted_newline && (token_text === '--' || token_text === '++')) {
                print_newline();
            }

            // Allow line wrapping between operators
            if (last_type === 'TK_OPERATOR') {
                allow_wrap_or_preserved_newline();
            }

            if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(flags.last_text, line_starters) || flags.last_text === ','))) {
                // unary operators (and binary +/- pretending to be unary) special cases

                space_before = false;
                space_after = false;

                if (flags.last_text === ';' && is_expression(flags.mode)) {
                    // for (;; ++i)
                    //        ^^^
                    space_before = true;
                }

                if (last_type === 'TK_RESERVED') {
                    space_before = true;
                }

                if ((flags.mode === MODE.BlockStatement || flags.mode === MODE.Statement) && (flags.last_text === '{' || flags.last_text === ';')) {
                    // { foo; --i }
                    // foo(); --bar;
                    print_newline();
                }
            } else if (token_text === ':') {
                if (flags.ternary_depth === 0) {
                    if (flags.mode === MODE.BlockStatement) {
                        flags.mode = MODE.ObjectLiteral;
                    }
                    space_before = false;
                } else {
                    flags.ternary_depth -= 1;
                }
            } else if (token_text === '?') {
                flags.ternary_depth += 1;
            }
            output_space_before_token = output_space_before_token || space_before;
            print_token();
            output_space_before_token = space_after;
        }

        function handle_block_comment() {
            var lines = split_newlines(token_text);
            var j; // iterator for this case
            var javadoc = false;

            // block comment starts with a new line
            print_newline(false, true);
            if (lines.length > 1) {
                if (all_lines_start_with(lines.slice(1), '*')) {
                    javadoc = true;
                }
            }

            // first line always indented
            print_token(lines[0]);
            for (j = 1; j < lines.length; j++) {
                print_newline(false, true);
                if (javadoc) {
                    // javadoc: reformat and re-indent
                    print_token(' ' + trim(lines[j]));
                } else {
                    // normal comments output raw
                    output_lines[output_lines.length - 1].text.push(lines[j]);
                }
            }

            // for comments of more than one line, make sure there's a new line after
            print_newline(false, true);
        }

        function handle_inline_comment() {
            output_space_before_token = true;
            print_token();
            output_space_before_token = true;
        }

        function handle_comment() {
            if (input_wanted_newline) {
                print_newline(false, true);
            } else {
                trim_output(true);
            }

            output_space_before_token = true;
            print_token();
            print_newline(false, true);
        }

        function handle_dot() {
            if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                output_space_before_token = true;
            } else {
                // allow preserved newlines before dots in general
                // force newlines on dots after close paren when break_chained - for bar().baz()
                allow_wrap_or_preserved_newline(flags.last_text === ')' && opt.break_chained_methods);
            }

            print_token();
        }

        function handle_unknown() {
            print_token();

            if (token_text[token_text.length - 1] === '\n') {
                print_newline();
            }
        }
    }


    if (typeof define === "function" && define.amd) {
        // Add support for AMD ( https://github.com/amdjs/amdjs-api/wiki/AMD#defineamd-property- )
        define([], function() {
            return { js_beautify: js_beautify };
        });
    } else if (typeof exports !== "undefined") {
        // Add support for CommonJS. Just put this file somewhere on your require.paths
        // and you will be able to `var js_beautify = require("beautify").js_beautify`.
        exports.js_beautify = js_beautify;
    } else if (typeof window !== "undefined") {
        // If we're running a web page and don't have either of the above, add our one global
        window.js_beautify = js_beautify;
    } else if (typeof global !== "undefined") {
        // If we don't even have window, try global.
        global.js_beautify = js_beautify;
    }

}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
var filesystem = require('../file-system');
var watcher = require('../file-system-watcher');
var sessionManager = require('../session-manager');
var Editor = require('../editor');
var Session = require('../editor/session');


// todo: sort out the session/editor/manager bindings.
// Not sure if sessions are getting destroyed correctly.


app.controller('AppCtrl', ['$scope', '$modal', 'dialog',
  function($scope, $modal, $dialog) {

    var codeEditor;

    /*
     * Set root scope properties
     */
    $scope.fsTree = watcher.tree;
    $scope.fsList = watcher.list;
    $scope.sessions = sessionManager.sessions;
    $scope.activeSession = null;

    watcher.on('change', function() {
      $scope.fsTree = watcher.tree;
      $scope.fsList = watcher.list;
      $scope.$apply();
    });

    watcher.on('unlink', function(fso) {
      var session = sessionManager.getSession(fso.path);
      if (session) {
        removeSession(session);
      }
    });

    sessionManager.on('change', function() {
      $scope.$apply();
    });

    function removeSession(session) {

      // check if it's the active session
      if ($scope.activeSession === session) {
        $scope.getEditor().clearSession();
        $scope.activeSession = null;
      }

      // todo: sort this out //
      // remove the session
      setTimeout(function() {
        // do this after a short delay to avoid
        // Error: $rootScope:inprog. Action Already In Progress
        sessionManager.remove(session.fso.path);
      }, 1);

    }

    function saveSession(session) {
      var path = session.fso.path;
      var contents = session.getValue();
      filesystem.writeFile(path, contents, function(response) {
        if (response.err) {
          $dialog.alert({
            title: 'File System Write Error',
            message: JSON.stringify(response.err)
          });
        } else {
          session.markClean();
        }
      });
    }

    function initializeCodeEditor() {
      codeEditor = new Editor(document.getElementById('code-editor'));

      codeEditor.on('save', function(session) {
        saveSession(session);
      });

      codeEditor.on('saveall', function() {
        var sessions = sessionManager.sessions;
        for (var path in sessions) {
          var session = sessions[path];
          if (session.isDirty()) {
            saveSession(session);
          }
        }
      });

      codeEditor.on('help', function() {
        $modal.open({
          templateUrl: 'keyboard-shortcuts.html',
          controller: function SimpleModalCtrl($scope, $modalInstance) {
            $scope.ok = function () {
              $modalInstance.close();
            };
          },
          size: 'lg'
        });
      });

      return codeEditor;
    }

    $scope.getEditor = function() {
      return codeEditor || initializeCodeEditor();
    };

    $scope.open = function(fso) {
      var existing = sessionManager.getSession(fso.path);
      if (!existing) {
        filesystem.readFile(fso.path, function(response) {
          var data = response.data;

          var session = new Session(data);
          sessionManager.add(data.path, session);
          openSession(session);
        });
      } else {
        openSession(existing);
      }
    };

    $scope.clickSession = function(e, session) {
      // activate or close
      if (e.target.className === 'close') {
        closeSession(session);
      } else  {
        openSession(session);
      }
    };

    function openSession(session) {
      $scope.activeSession = session;
      $scope.getEditor().setSession(session);
    }

    function closeSession(session) {
      removeSession(session);
    }
  }
]);

},{"../editor":11,"../editor/session":12,"../file-system":14,"../file-system-watcher":13,"../session-manager":17}],7:[function(require,module,exports){
var p = require('path');
var filesystem = require('../file-system');
var utils = require('../utils');
var handler = utils.ui.responseHandler;


app.controller('TreeCtrl', ['$scope', '$modal', '$log', 'dialog',
  function($scope, $modal, $log, $dialog) {

    var expanded = Object.create(null);

    $scope.showMenu = false;
    $scope.active = null;
    $scope.pasteBuffer = null;

    function genericFileSystemCallback(response) {
      // notify of any errors, otherwise silent.
      // The File System Watcher will handle the state changes in the file system
      if (response.err) {
        $dialog.alert({
          title: 'File System Error',
          message: JSON.stringify(response.err)
        });
      }
    }

    $scope.getClassName = function(fso) {
      var classes = ['fso'];
      classes.push(fso.isDirectory ? 'dir' : 'file');

      if (fso === $scope.active) {
        classes.push('active');
      }

      return classes.join(' ');
    };

    $scope.getIconClassName = function(fso) {
      var classes = ['fa'];

      if (fso.isDirectory) {
        classes.push($scope.isExpanded(fso) ? 'fa-folder-open' : 'fa-folder');
      } else {
        classes.push('fa-file-o');
      }

      return classes.join(' ');
    };

    $scope.isExpanded = function(fso) {
      return !!expanded[fso.path];
    };

    $scope.rightClickNode = function(e, fso) {
      console.log('RClicked ' + fso.name);
      $scope.menuX = e.pageX;
      $scope.menuY = e.pageY;
      $scope.active = fso;
      $scope.showMenu = true;
    };

    $scope.clickNode = function(e, fso) {
      e.preventDefault();
      e.stopPropagation();

      $scope.active = fso;

      if (fso.isDirectory) {
        var isExpanded = $scope.isExpanded(fso);
        if (isExpanded) {
          delete expanded[fso.path];
        } else {
          expanded[fso.path] = true;
        }
      } else {
        $scope.open(fso);
      }

      return false;
    };

    $scope.delete = function(e, fso) {

      e.preventDefault();

      $dialog.confirm({
        title: 'Delete ' + (fso.isDirectory ? 'folder' : 'file'),
        message: 'Delete [' + fso.name + ']. Are you sure?'
      }).then(function() {
        filesystem.remove(fso.path, genericFileSystemCallback);
      }, function() {
        $log.info('Delete modal dismissed');
      });

    };

    $scope.rename = function(e, fso) {

      e.preventDefault();

      $dialog.prompt({
        title: 'Rename ' + (fso.isDirectory ? 'folder' : 'file'),
        message: 'Please enter a new name',
        defaultValue: fso.name,
        placeholder: fso.isDirectory ? 'Folder name' : 'File name'
      }).then(function(value) {
        var oldPath = fso.path;
        var newPath = p.resolve(fso.dir, value);
        filesystem.rename(oldPath, newPath, genericFileSystemCallback);
      }, function() {
        $log.info('Rename modal dismissed');
      });

    };

    $scope.mkfile = function(e, fso) {

      e.preventDefault();

      $dialog.prompt({
        title: 'Add new file',
        placeholder: 'File name',
        message: 'Please enter the new file name'
      }).then(function(value) {
        filesystem.mkfile(p.resolve(fso.path, value), genericFileSystemCallback);
      }, function() {
        $log.info('Make file modal dismissed');
      });

    };

    $scope.mkdir = function(e, fso) {

      e.preventDefault();

      $dialog.prompt({
        title: 'Add new folder',
        placeholder: 'Folder name',
        message: 'Please enter the new folder name'
      }).then(function(value) {
        filesystem.mkdir(p.resolve(fso.path, value), genericFileSystemCallback);
      }, function() {
        $log.info('Make directory modal dismissed');
      });

    };

    $scope.paste = function(e, fso) {

      e.preventDefault();

      var pasteBuffer = $scope.pasteBuffer;

      if (pasteBuffer.op === 'copy') {
        filesystem.copy(pasteBuffer.fso.path, p.resolve(fso.path, pasteBuffer.fso.name), genericFileSystemCallback);
      } else if (pasteBuffer.op === 'cut') {
        filesystem.rename(pasteBuffer.fso.path, p.resolve(fso.path, pasteBuffer.fso.name), genericFileSystemCallback);
      }

      $scope.pasteBuffer = null;

    };

    $scope.showPaste = function(e, active) {
      var pasteBuffer = $scope.pasteBuffer;

      if (pasteBuffer && active.isDirectory) {
        if (!pasteBuffer.fso.isDirectory) {
          return true;
        } else if (active.path.toLowerCase().indexOf(pasteBuffer.fso.path.toLowerCase()) !== 0) { // disallow pasting into self or a decendent
          return true;
        }
      }
      return false;
    };

    $scope.setPasteBuffer = function(e, fso, op) {

      e.preventDefault();

      $scope.pasteBuffer = {
        fso: fso,
        op: op
      };

    };

  }
]);

},{"../file-system":14,"../utils":19,"path":20}],8:[function(require,module,exports){
app.directive('ngRightClick', function($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(e) {
      scope.$apply(function() {
        e.preventDefault();
        e.stopPropagation();
        fn(scope, {
          $event: e
        });
        return false;
      });
    });
  };
});

},{}],9:[function(require,module,exports){
var config = require('./config').editor;
var beautifyConfig = require('./config').beautify;
var beautify_js = require('js-beautify');
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;

ace.require("ace/ext/emmet");
ace.require("ace/ext/language_tools");

module.exports = function(el) {

  var editor = ace.edit(el);

  editor.setOptions({
    enableEmmet: true,
    enableSnippets: true,
    enableBasicAutocompletion: true
  });

  if (typeof config.theme === 'string') {
    editor.setTheme('ace/theme/' + config.theme);
  }
  if (typeof config.showPrintMargin === 'boolean') {
    editor.setShowPrintMargin(config.showPrintMargin);
  }
  if (typeof config.showInvisibles === 'boolean') {
    editor.setShowInvisibles(config.showInvisibles);
  }
  if (typeof config.highlightActiveLine === 'boolean') {
    editor.setHighlightActiveLine(config.highlightActiveLine);
  }
  if (typeof config.showGutter === 'boolean') {
    editor.renderer.setShowGutter(config.showGutter);
  }
  if (typeof config.fontSize === 'number') {
    editor.setFontSize(config.fontSize);
  }

  editor.commands.addCommands([{
    name: 'beautify',
    bindKey: {
      win: 'Ctrl-B',
      mac: 'Command-B'
    },
    exec: function(editor, line) {
      var cfg, fn;
      var fso = editor.getSession().fso;

      switch (fso.ext) {
        case '.css':
          {
            fn = beautify_css;
            cfg = beautifyConfig ? beautifyConfig.css : null;
          }
          break;
        case '.html':
          {
            fn = beautify_html;
            cfg = beautifyConfig ? beautifyConfig.html : null;
          }
          break;
        case '.js':
        case '.json':
          {
            fn = beautify_js;
            cfg = beautifyConfig ? beautifyConfig.js : null;
          }
          break;
      }

      if (fn) {
        editor.setValue(fn(editor.getValue(), cfg));
      }
    },
    readOnly: false // this command should not apply in readOnly mode
  }]);

  return editor;
};

},{"./config":10,"js-beautify":2}],10:[function(require,module,exports){
module.exports={
  "editor": {
    "theme": "monokai",
    "tabSize": 2,
    "useSoftTabs": true,
    "highlightActiveLine": true,
    "showPrintMargin": false,
    "showGutter": true,
    "fontSize": "12px",
    "useWorker": true,
    "showInvisibles": true,
    "modes": {
      ".js": "ace/mode/javascript",
      ".css": "ace/mode/css",
      ".html": "ace/mode/html",
      ".htm": "ace/mode/html",
      ".ejs": "ace/mode/html",
      ".json": "ace/mode/json",
      ".md": "ace/mode/markdown",
      ".coffee": "ace/mode/coffee",
      ".jade": "ace/mode/jade",
      ".php": "ace/mode/php",
      ".py": "ace/mode/python",
      ".scss": "ace/mode/sass",
      ".txt": "ace/mode/text",
      ".typescript": "ace/mode/typescript",
      ".xml": "ace/mode/xml"
    }
  },
  "beautify": {
    "js": {
      "indent_size": 2,
      "indent_char": " ",
      "indent_level": 0,
      "indent_with_tabs": false,
      "preserve_newlines": true,
      "max_preserve_newlines": 3,
      "jslint_happy": false,
      "brace_style": "collapse",
      "keep_array_indentation": false,
      "keep_function_indentation": false,
      "space_before_conditional": true,
      "break_chained_methods": false,
      "eval_code": false,
      "unescape_strings": false,
      "wrap_line_length": 0
    },
    "css": {
      "indent_size": 2,
      "indent_char": " "
    },
    "html": {
      "indent_size": 2,
      "indent_char": " ",
      "brace_style": "collapse",
      "indent_scripts ": "normal"
    }
  }
}

},{}],11:[function(require,module,exports){
var emitter = require('emitter-component');
var config = require('./config').editor;

function Editor(el) {
  this._editor = require('./ace')(el);
  this._editor.commands.addCommands([{
    name: 'save',
    bindKey: {
      win: 'Ctrl-S',
      mac: 'Command-S'
    },
    exec: this._onSave.bind(this),
    readOnly: false // this command should not apply in readOnly mode
  }, {
    name: 'saveall',
    bindKey: {
      win: 'Ctrl-Shift-S',
      mac: 'Command-Option-S'
    },
    exec: this._onSaveAll.bind(this),
    readOnly: false // this command should not apply in readOnly mode
  }, {
    name: 'help',
    bindKey: {
      win: 'Ctrl-H',
      mac: 'Command-H'
    },
    exec: this._onHelp.bind(this),
    readOnly: true // this command should apply in readOnly mode
  }]);
  this._session = null;
}
Editor.prototype = {
  getSession: function() {
    return this._session;
  },
  setSession: function(session) {
    this._session = session;
    this._editor.setSession(session._session);
  },
  clearSession: function() {
    this._session = null;
  },
  getValue: function() {
    return this._editor.getValue();
  },
  _onSave: function(editor, line) {
    this.emit('save', this._session);
  },
  _onSaveAll: function(editor, line) {
    this.emit('saveall');
  },
  _onHelp: function(editor, line) {
    this.emit('help');
  }
};

emitter(Editor.prototype);

module.exports = Editor;

},{"./ace":9,"./config":10,"emitter-component":1}],12:[function(require,module,exports){
var utils = require('../utils');
var emitter = require('emitter-component');
var config = require('./config').editor;
var EditSession = ace.require('ace/edit_session').EditSession;
var UndoManager = ace.require('ace/undomanager').UndoManager;

/*
 * Session constructor
 */
function Session(fso) {
  this.fso = fso;

  var path = fso.path;
  var contents = fso.contents;
  var session = new EditSession(contents);
  var mode = config.modes[fso.ext.toLowerCase()] || 'ace/mode/asciidoc';

  session.fso = fso; // to give ace editor access to the fso;
  session.setMode(mode);
  session.setUndoManager(new UndoManager());

  if (typeof config.tabSize === 'number') {
    session.setTabSize(config.tabSize);
  }
  if (typeof config.useSoftTabs === 'boolean') {
    session.setUseSoftTabs(config.useSoftTabs);
  }

  this._session = session;
  this._undoManager = session.getUndoManager();
}
Session.prototype.getValue = function() {
  return this._session.getValue();
};
Session.prototype.isDirty = function() {
  return !this._undoManager.isClean();
};
Session.prototype.markClean = function() {
  this._undoManager.markClean();
};

emitter(Session.prototype);

module.exports = Session;

},{"../utils":19,"./config":10,"emitter-component":1}],13:[function(require,module,exports){
var utils = require('./utils');
var emitter = require('emitter-component');

/*
 * FileSystemWatcher constructor
 */
function FileSystemWatcher() {

  var socket = io.connect(utils.urlRoot() + '/fswatch');

  this._watched = {};

  socket.on('connection', function(res) {

    var data = res.data;

    utils.extend(this._watched, data);

    this.emit('connection', this._watched);
    this.emit('change');

  }.bind(this));

  socket.on('add', function(res) {

    var data = res.data;
    this._watched[data.path] = data;

    this.emit('add', data);
    this.emit('change');

  }.bind(this));

  socket.on('addDir', function(res) {

    var data = res.data;
    this._watched[data.path] = data;

    this.emit('addDir', res.data);
    this.emit('change');

  }.bind(this));

  socket.on('change', function(res) {

    var data = res.data;

    this.emit('modified', data);

  }.bind(this));

  socket.on('unlink', function(res) {

    var data = res.data;
    var fso = this._watched[data.path];

    if (fso) {
      delete this._watched[data.path];
      this.emit('unlink', fso);
      this.emit('change');
    }

  }.bind(this));

  socket.on('unlinkDir', function(res) {

    var data = res.data;
    var fso = this._watched[data.path];

    if (fso) {
      delete this._watched[data.path];
      this.emit('unlinkDir', fso);
      this.emit('change');
    }

  }.bind(this));

  socket.on('error', function(res) {

    this.emit('error', res.err);

  }.bind(this));

  function treeify(list, idAttr, parentAttr, childrenAttr) {

    var treeList = [];
    var lookup = {};
    var path, obj;

    for (path in list) {

      obj = list[path];
      obj.label = obj.name;
      lookup[obj[idAttr]] = obj;
      obj[childrenAttr] = [];
    }

    for (path in list) {
      obj = list[path];
      if (lookup[obj[parentAttr]]) {
        lookup[obj[parentAttr]][childrenAttr].push(obj);
      } else {
        treeList.push(obj);
      }
    }

    return treeList;

  }

  Object.defineProperties(this, {
    list: {
      get: function() {
        return this._watched;
      }
    },
    tree: {
      get: function() {
        return treeify(this._watched, 'path', 'dir', 'children');
      }
    }
  });

  this._socket = socket;
}
emitter(FileSystemWatcher.prototype);

var FileSystemWatcher = new FileSystemWatcher();

module.exports = FileSystemWatcher;

},{"./utils":19,"emitter-component":1}],14:[function(require,module,exports){
var utils = require('./utils');
var emitter = require('emitter-component');;

/*
 * FileSystem constructor
 */
function FileSystem(socket) {

  socket.on('mkdir', function(response) {
    this.emit('mkdir', response);
  }.bind(this));

  socket.on('mkfile', function(response) {
    this.emit('mkfile', response);
  }.bind(this));

  socket.on('copy', function(response) {
    this.emit('copy', response);
  }.bind(this));

  socket.on('rename', function(response) {
    this.emit('rename', response);
  }.bind(this));

  socket.on('remove', function(response) {
    this.emit('remove', response);
  }.bind(this));

  socket.on('readfile', function(response) {
    this.emit('readfile', response);
  }.bind(this));

  socket.on('writefile', function(response) {
    this.emit('writefile', response);
  }.bind(this));

  this._socket = socket;

}
FileSystem.prototype.mkdir = function(path, callback) {
  this._socket.emit('mkdir', path, callback);
};
FileSystem.prototype.mkfile = function(path, callback) {
  this._socket.emit('mkfile', path, callback);
};
FileSystem.prototype.copy = function(source, destination, callback) {
  this._socket.emit('copy', source, destination, callback);
};
FileSystem.prototype.rename = function(oldPath, newPath, callback) {
  this._socket.emit('rename', oldPath, newPath, callback);
};
FileSystem.prototype.remove = function(path, callback) {
  this._socket.emit('remove', path, callback);
};
FileSystem.prototype.readFile = function(path, callback) {
  this._socket.emit('readfile', path, callback);
};
FileSystem.prototype.writeFile = function(path, contents, callback) {
  this._socket.emit('writefile', path, contents, callback);
};

emitter(FileSystem.prototype);


var socket = io.connect(utils.urlRoot() + '/fs');

socket.on('connection', function(data) {
  console.log('fs connected' + data);
});

var fileSystem = new FileSystem(socket);

module.exports = fileSystem;

},{"./utils":19,"emitter-component":1}],15:[function(require,module,exports){
var p = require('path');
var filesystem = require('./file-system');
var watcher = require('./file-system-watcher');
var sessionManager = require('./session-manager');
var Editor = require('./editor');
var Session = require('./editor/session');

window.app = angular.module('app', ['ui.bootstrap']);

/*
 * Register Controllers
 */
require('./controllers/app');
require('./controllers/tree');

/*
 * Register Directives
 */
require('./directives/right-click');

/*
 * Register Common Services
 */
require('./services/dialog');

/*
 * Initialize Splitter
 */
require('./splitter');

},{"./controllers/app":6,"./controllers/tree":7,"./directives/right-click":8,"./editor":11,"./editor/session":12,"./file-system":14,"./file-system-watcher":13,"./services/dialog":16,"./session-manager":17,"./splitter":18,"path":20}],16:[function(require,module,exports){
app.service('dialog', ['$modal', function($modal) {

  var service = {};

  service.alert = function(data) {

    return $modal.open({
      templateUrl: 'alert.html',
      controller: 'AlertCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message
          };
        }
      }
    }).result;

  };

  service.confirm = function(data) {

    return $modal.open({
      templateUrl: 'confirm.html',
      controller: 'ConfirmCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message
          };
        }
      }
    }).result;

  };

  service.prompt = function(data) {

    return $modal.open({
      templateUrl: 'prompt.html',
      controller: 'PromptCtrl',
      resolve: {
        data: function() {
          return {
            title: data.title,
            message: data.message,
            defaultValue: data.defaultValue,
            placeholder: data.placeholder
          };
        }
      }
    }).result;

  };

  return service;

}]);

app.controller('AlertCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;

    $scope.ok = function () {
      $modalInstance.close();
    };
  }
]);

app.controller('ConfirmCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;

    $scope.ok = function () {
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);

app.controller('PromptCtrl', ['$scope', '$modalInstance', 'data',
  function($scope, $modalInstance, data) {

    $scope.title = data.title;
    $scope.message = data.message;
    $scope.placeholder = data.placeholder;
    $scope.input = { value: data.defaultValue };

    $scope.ok = function () {
      $modalInstance.close($scope.input.value);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  }
]);

},{}],17:[function(require,module,exports){
var utils = require('./utils');
var emitter = require('emitter-component');
var EditSession = ace.require('ace/edit_session').EditSession;
var UndoManager = ace.require('ace/undomanager').UndoManager;

/*
 * SessionManager constructor
 */
function SessionManager() {

  this.isDirty = false;
  this.sessions = {};

  setInterval(function() {

    var sessions = this.sessions;
    for (var path in sessions) {
      if (sessions[path].isDirty()) {
        this._setIsDirty(true);
        return;
      }
    }
    this._setIsDirty(false);

  }.bind(this), 300);

}
SessionManager.prototype = {
  add: function(path, session) {
    this.sessions[path] = session;
    this.emit('sessionadd', session);
    this.emit('change');
  },
  remove: function(path) {
    var removed = this.sessions[path];
    if (removed) {
      delete this.sessions[path];
      this.emit('sessionremove', removed);
      this.emit('change');
    }
  },
  getSession: function(path) {
    return this.sessions[path];
  },
  _setIsDirty: function(value) {
    //if (this.isDirty !== value) {
      this.isDirty = value;
      this.emit('dirtychanged', value);
      this.emit('change');
    //}
  }
};

emitter(SessionManager.prototype);

var sessionManager = new SessionManager();

module.exports = sessionManager;

},{"./utils":19,"emitter-component":1}],18:[function(require,module,exports){
// todo - find a directive to do this / change to directive
;(function() {

var w = window, d = document;

function split(handler, leftEl, rightEl) {

  var splitter;

  splitter = {
    lastX: 0,
    leftEl: null,
    rightEl: null,

    init: function(handler, leftEl, rightEl) {
      var self = this;

      this.leftEl = leftEl;
      this.rightEl = rightEl;

      handler.addEventListener('mousedown', function(evt) {
        evt.preventDefault();	/* prevent text selection */

        self.lastX = evt.clientX;

        w.addEventListener('mousemove', self.drag);
        w.addEventListener('mouseup', self.endDrag);
      });
    },

    drag: function(evt) {
      var wL, wR, wDiff = evt.clientX - splitter.lastX;

      wL = d.defaultView.getComputedStyle(splitter.leftEl, '').getPropertyValue('width');
      wR = d.defaultView.getComputedStyle(splitter.rightEl, '').getPropertyValue('width');
      wL = parseInt(wL, 10) + wDiff;
      wR = parseInt(wR, 10) - wDiff;
      splitter.leftEl.style.width = wL + 'px';
      splitter.rightEl.style.width = wR + 'px';

      splitter.lastX = evt.clientX;
    },

    endDrag: function() {
      w.removeEventListener('mousemove', splitter.drag);
      w.removeEventListener('mouseup', splitter.endDrag);
    }
  };

  splitter.init(handler, leftEl, rightEl);
}

split(d.getElementsByClassName('splitter')[0], d.getElementsByTagName('nav')[0], d.getElementsByTagName('article')[0]);
split(d.getElementsByClassName('splitter')[1], d.getElementsByTagName('article')[0], d.getElementsByTagName('aside')[0]);

})();

},{}],19:[function(require,module,exports){
/* global dialog */

module.exports = {
  getuid: function() {
    return ('' + Math.random()).replace(/\D/g, '');
  },
  getuidstr: function() {
    return (+new Date()).toString(36);
  },
  urlRoot: function() {
    var location = window.location;
    return location.protocol + '//' + location.host;
  },
  encodeString: function(str) {
    return btoa(encodeURIComponent(str));
  },
  decodeString: function(str) {
    return decodeURIComponent(atob(str));
  },
  extend: function extend(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || typeof add !== 'object') {
      return origin;
    }

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  },
  ui: {
    responseHandler: function(fn) {
      return function(rsp, showError) {
        showError = showError || true;
        if (rsp.err) {
          if (showError) {
            dialog.alert({
              title: 'Error',
              message: JSON.stringify(rsp.err)
            });
          }
        } else {
          fn(rsp.data);
        }
      };
    }
  }
};

},{}],20:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("lppjwH"))
},{"lppjwH":21}],21:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[15])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL25vZGVfbW9kdWxlcy9lbWl0dGVyLWNvbXBvbmVudC9pbmRleC5qcyIsIi9Vc2Vycy9ndWVzdC9Eb2N1bWVudHMvbm9pZGUvbm9kZV9tb2R1bGVzL2pzLWJlYXV0aWZ5L2pzL2luZGV4LmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9ub2RlX21vZHVsZXMvanMtYmVhdXRpZnkvanMvbGliL2JlYXV0aWZ5LWNzcy5qcyIsIi9Vc2Vycy9ndWVzdC9Eb2N1bWVudHMvbm9pZGUvbm9kZV9tb2R1bGVzL2pzLWJlYXV0aWZ5L2pzL2xpYi9iZWF1dGlmeS1odG1sLmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9ub2RlX21vZHVsZXMvanMtYmVhdXRpZnkvanMvbGliL2JlYXV0aWZ5LmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L2NvbnRyb2xsZXJzL2FwcC5qcyIsIi9Vc2Vycy9ndWVzdC9Eb2N1bWVudHMvbm9pZGUvc3JjL2NsaWVudC9jb250cm9sbGVycy90cmVlLmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L2RpcmVjdGl2ZXMvcmlnaHQtY2xpY2suanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvZWRpdG9yL2FjZS5qcyIsIi9Vc2Vycy9ndWVzdC9Eb2N1bWVudHMvbm9pZGUvc3JjL2NsaWVudC9lZGl0b3IvY29uZmlnLmpzb24iLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvZWRpdG9yL2luZGV4LmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L2VkaXRvci9zZXNzaW9uLmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L2ZpbGUtc3lzdGVtLXdhdGNoZXIuanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvZmlsZS1zeXN0ZW0uanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvaWRlLmpzIiwiL1VzZXJzL2d1ZXN0L0RvY3VtZW50cy9ub2lkZS9zcmMvY2xpZW50L3NlcnZpY2VzL2RpYWxvZy5qcyIsIi9Vc2Vycy9ndWVzdC9Eb2N1bWVudHMvbm9pZGUvc3JjL2NsaWVudC9zZXNzaW9uLW1hbmFnZXIuanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvc3BsaXR0ZXIuanMiLCIvVXNlcnMvZ3Vlc3QvRG9jdW1lbnRzL25vaWRlL3NyYy9jbGllbnQvdXRpbHMuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcGF0aC1icm93c2VyaWZ5L2luZGV4LmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDLzBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBFbWl0dGVyO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYEVtaXR0ZXJgLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlcihvYmopIHtcbiAgaWYgKG9iaikgcmV0dXJuIG1peGluKG9iaik7XG59O1xuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1tldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG5cbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgc2VsZi5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgb24uZm4gPSBmbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYjtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRW1pdCBgZXZlbnRgIHdpdGggdGhlIGdpdmVuIGFyZ3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge01peGVkfSAuLi5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICwgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcblxuICBpZiAoY2FsbGJhY2tzKSB7XG4gICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLnNsaWNlKDApO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGNhbGxiYWNrc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0FycmF5fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW107XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHRoaXMgZW1pdHRlciBoYXMgYGV2ZW50YCBoYW5kbGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmhhc0xpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XG59O1xuIiwiLyoqXG5UaGUgZm9sbG93aW5nIGJhdGNoZXMgYXJlIGVxdWl2YWxlbnQ6XG5cbnZhciBiZWF1dGlmeV9qcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5Jyk7XG52YXIgYmVhdXRpZnlfanMgPSByZXF1aXJlKCdqcy1iZWF1dGlmeScpLmpzO1xudmFyIGJlYXV0aWZ5X2pzID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5qc19iZWF1dGlmeTtcblxudmFyIGJlYXV0aWZ5X2NzcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuY3NzO1xudmFyIGJlYXV0aWZ5X2NzcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuY3NzX2JlYXV0aWZ5O1xuXG52YXIgYmVhdXRpZnlfaHRtbCA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuaHRtbDtcbnZhciBiZWF1dGlmeV9odG1sID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5odG1sX2JlYXV0aWZ5O1xuXG5BbGwgbWV0aG9kcyByZXR1cm5lZCBhY2NlcHQgdHdvIGFyZ3VtZW50cywgdGhlIHNvdXJjZSBzdHJpbmcgYW5kIGFuIG9wdGlvbnMgb2JqZWN0LlxuKiovXG5cbmZ1bmN0aW9uIGdldF9iZWF1dGlmeShqc19iZWF1dGlmeSwgY3NzX2JlYXV0aWZ5LCBodG1sX2JlYXV0aWZ5KSB7XG4gICAgLy8gdGhlIGRlZmF1bHQgaXMganNcbiAgICB2YXIgYmVhdXRpZnkgPSBmdW5jdGlvbiAoc3JjLCBjb25maWcpIHtcbiAgICAgICAgcmV0dXJuIGpzX2JlYXV0aWZ5LmpzX2JlYXV0aWZ5KHNyYywgY29uZmlnKTtcbiAgICB9O1xuICAgIFxuICAgIC8vIHNob3J0IGFsaWFzZXNcbiAgICBiZWF1dGlmeS5qcyAgID0ganNfYmVhdXRpZnkuanNfYmVhdXRpZnk7XG4gICAgYmVhdXRpZnkuY3NzICA9IGNzc19iZWF1dGlmeS5jc3NfYmVhdXRpZnk7XG4gICAgYmVhdXRpZnkuaHRtbCA9IGh0bWxfYmVhdXRpZnkuaHRtbF9iZWF1dGlmeTtcblxuICAgIC8vIGxlZ2FjeSBhbGlhc2VzXG4gICAgYmVhdXRpZnkuanNfYmVhdXRpZnkgICA9IGpzX2JlYXV0aWZ5LmpzX2JlYXV0aWZ5O1xuICAgIGJlYXV0aWZ5LmNzc19iZWF1dGlmeSAgPSBjc3NfYmVhdXRpZnkuY3NzX2JlYXV0aWZ5O1xuICAgIGJlYXV0aWZ5Lmh0bWxfYmVhdXRpZnkgPSBodG1sX2JlYXV0aWZ5Lmh0bWxfYmVhdXRpZnk7XG4gICAgXG4gICAgcmV0dXJuIGJlYXV0aWZ5O1xufVxuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EICggaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL0FNRCNkZWZpbmVhbWQtcHJvcGVydHktIClcbiAgICBkZWZpbmUoW1xuICAgICAgICBcIi4vbGliL2JlYXV0aWZ5XCIsXG4gICAgICAgIFwiLi9saWIvYmVhdXRpZnktY3NzXCIsXG4gICAgICAgIFwiLi9saWIvYmVhdXRpZnktaHRtbFwiXG4gICAgXSwgZnVuY3Rpb24oanNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSwgaHRtbF9iZWF1dGlmeSkge1xuICAgICAgICByZXR1cm4gZ2V0X2JlYXV0aWZ5KGpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnksIGh0bWxfYmVhdXRpZnkpO1xuICAgIH0pO1xufSBlbHNlIHtcbiAgICAoZnVuY3Rpb24obW9kKSB7XG4gICAgICAgIHZhciBqc19iZWF1dGlmeSA9IHJlcXVpcmUoJy4vbGliL2JlYXV0aWZ5Jyk7XG4gICAgICAgIHZhciBjc3NfYmVhdXRpZnkgPSByZXF1aXJlKCcuL2xpYi9iZWF1dGlmeS1jc3MnKTtcbiAgICAgICAgdmFyIGh0bWxfYmVhdXRpZnkgPSByZXF1aXJlKCcuL2xpYi9iZWF1dGlmeS1odG1sJyk7XG5cbiAgICAgICAgbW9kLmV4cG9ydHMgPSBnZXRfYmVhdXRpZnkoanNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSwgaHRtbF9iZWF1dGlmeSk7XG5cbiAgICB9KShtb2R1bGUpO1xufVxuXG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKmpzaGludCBjdXJseTp0cnVlLCBlcWVxZXE6dHJ1ZSwgbGF4YnJlYWs6dHJ1ZSwgbm9lbXB0eTpmYWxzZSAqL1xuLypcblxuICBUaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuICBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMyBFaW5hciBMaWVsbWFuaXMgYW5kIGNvbnRyaWJ1dG9ycy5cblxuICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvblxuICBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlc1xuICAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sXG4gIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsXG4gIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsXG4gIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG4gIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuICBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTXG4gIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuICBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gIFNPRlRXQVJFLlxuXG5cbiBDU1MgQmVhdXRpZmllclxuLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBXcml0dGVuIGJ5IEhhcnV0eXVuIEFtaXJqYW55YW4sIChhbWlyamFueWFuQGdtYWlsLmNvbSlcblxuICAgIEJhc2VkIG9uIGNvZGUgaW5pdGlhbGx5IGRldmVsb3BlZCBieTogRWluYXIgTGllbG1hbmlzLCA8ZWluYXJAanNiZWF1dGlmaWVyLm9yZz5cbiAgICAgICAgaHR0cDovL2pzYmVhdXRpZmllci5vcmcvXG5cbiAgICBVc2FnZTpcbiAgICAgICAgY3NzX2JlYXV0aWZ5KHNvdXJjZV90ZXh0KTtcbiAgICAgICAgY3NzX2JlYXV0aWZ5KHNvdXJjZV90ZXh0LCBvcHRpb25zKTtcblxuICAgIFRoZSBvcHRpb25zIGFyZSAoZGVmYXVsdCBpbiBicmFja2V0cyk6XG4gICAgICAgIGluZGVudF9zaXplICg0KSAgICAgICAgICAgICAgICAgICDigJQgaW5kZW50YXRpb24gc2l6ZSxcbiAgICAgICAgaW5kZW50X2NoYXIgKHNwYWNlKSAgICAgICAgICAgICAgIOKAlCBjaGFyYWN0ZXIgdG8gaW5kZW50IHdpdGgsXG4gICAgICAgIHNlbGVjdG9yX3NlcGFyYXRvcl9uZXdsaW5lICh0cnVlKSAtIHNlcGFyYXRlIHNlbGVjdG9ycyB3aXRoIG5ld2xpbmUgb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90IChlLmcuIFwiYSxcXG5iclwiIG9yIFwiYSwgYnJcIilcbiAgICAgICAgZW5kX3dpdGhfbmV3bGluZSAoZmFsc2UpICAgICAgICAgIC0gZW5kIHdpdGggYSBuZXdsaW5lXG5cbiAgICBlLmdcblxuICAgIGNzc19iZWF1dGlmeShjc3Nfc291cmNlX3RleHQsIHtcbiAgICAgICdpbmRlbnRfc2l6ZSc6IDEsXG4gICAgICAnaW5kZW50X2NoYXInOiAnXFx0JyxcbiAgICAgICdzZWxlY3Rvcl9zZXBhcmF0b3InOiAnICcsXG4gICAgICAnZW5kX3dpdGhfbmV3bGluZSc6IGZhbHNlLFxuICAgIH0pO1xuKi9cblxuLy8gaHR0cDovL3d3dy53My5vcmcvVFIvQ1NTMjEvc3luZGF0YS5odG1sI3Rva2VuaXphdGlvblxuLy8gaHR0cDovL3d3dy53My5vcmcvVFIvY3NzMy1zeW50YXgvXG5cbihmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gY3NzX2JlYXV0aWZ5KHNvdXJjZV90ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB2YXIgaW5kZW50U2l6ZSA9IG9wdGlvbnMuaW5kZW50X3NpemUgfHwgNDtcbiAgICAgICAgdmFyIGluZGVudENoYXJhY3RlciA9IG9wdGlvbnMuaW5kZW50X2NoYXIgfHwgJyAnO1xuICAgICAgICB2YXIgc2VsZWN0b3JTZXBhcmF0b3JOZXdsaW5lID0gKG9wdGlvbnMuc2VsZWN0b3Jfc2VwYXJhdG9yX25ld2xpbmUgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5zZWxlY3Rvcl9zZXBhcmF0b3JfbmV3bGluZTtcbiAgICAgICAgdmFyIGVuZFdpdGhOZXdsaW5lID0gKG9wdGlvbnMuZW5kX3dpdGhfbmV3bGluZSA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5lbmRfd2l0aF9uZXdsaW5lO1xuXG4gICAgICAgIC8vIGNvbXBhdGliaWxpdHlcbiAgICAgICAgaWYgKHR5cGVvZiBpbmRlbnRTaXplID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpbmRlbnRTaXplID0gcGFyc2VJbnQoaW5kZW50U2l6ZSwgMTApO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyB0b2tlbml6ZXJcbiAgICAgICAgdmFyIHdoaXRlUmUgPSAvXlxccyskLztcbiAgICAgICAgdmFyIHdvcmRSZSA9IC9bXFx3JFxcLV9dLztcblxuICAgICAgICB2YXIgcG9zID0gLTEsXG4gICAgICAgICAgICBjaDtcblxuICAgICAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgY2ggPSBzb3VyY2VfdGV4dC5jaGFyQXQoKytwb3MpO1xuICAgICAgICAgICAgcmV0dXJuIGNoO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGVlaygpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5jaGFyQXQocG9zICsgMSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlYXRTdHJpbmcoZW5kQ2hhcikge1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gcG9zO1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSkge1xuICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gZW5kQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSBcIlxcblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyArIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZWF0V2hpdGVzcGFjZSgpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvcztcbiAgICAgICAgICAgIHdoaWxlICh3aGl0ZVJlLnRlc3QocGVlaygpKSkge1xuICAgICAgICAgICAgICAgIHBvcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBvcyAhPT0gc3RhcnQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBza2lwV2hpdGVzcGFjZSgpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvcztcbiAgICAgICAgICAgIGRvIHt9IHdoaWxlICh3aGl0ZVJlLnRlc3QobmV4dCgpKSk7XG4gICAgICAgICAgICByZXR1cm4gcG9zICE9PSBzdGFydCArIDE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBlYXRDb21tZW50KHNpbmdsZUxpbmUpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHBvcztcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIHdoaWxlIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09IFwiKlwiICYmIHBlZWsoKSA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9zKys7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2luZ2xlTGluZSAmJiBjaCA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5zdWJzdHJpbmcoc3RhcnQsIHBvcyArIDEpO1xuICAgICAgICB9XG5cblxuICAgICAgICBmdW5jdGlvbiBsb29rQmFjayhzdHIpIHtcbiAgICAgICAgICAgIHJldHVybiBzb3VyY2VfdGV4dC5zdWJzdHJpbmcocG9zIC0gc3RyLmxlbmd0aCwgcG9zKS50b0xvd2VyQ2FzZSgpID09PVxuICAgICAgICAgICAgICAgIHN0cjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzQ29tbWVudE9uTGluZSgpIHtcbiAgICAgICAgICAgIHZhciBlbmRPZkxpbmUgPSBzb3VyY2VfdGV4dC5pbmRleE9mKCdcXG4nLCBwb3MpO1xuICAgICAgICAgICAgaWYgKGVuZE9mTGluZSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmVzdE9mTGluZSA9IHNvdXJjZV90ZXh0LnN1YnN0cmluZyhwb3MsIGVuZE9mTGluZSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdE9mTGluZS5pbmRleE9mKCcvLycpICE9PSAtMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHByaW50ZXJcbiAgICAgICAgdmFyIGluZGVudFN0cmluZyA9IHNvdXJjZV90ZXh0Lm1hdGNoKC9eW1xcclxcbl0qW1xcdCBdKi8pWzBdO1xuICAgICAgICB2YXIgc2luZ2xlSW5kZW50ID0gbmV3IEFycmF5KGluZGVudFNpemUgKyAxKS5qb2luKGluZGVudENoYXJhY3Rlcik7XG4gICAgICAgIHZhciBpbmRlbnRMZXZlbCA9IDA7XG4gICAgICAgIHZhciBuZXN0ZWRMZXZlbCA9IDA7XG5cbiAgICAgICAgZnVuY3Rpb24gaW5kZW50KCkge1xuICAgICAgICAgICAgaW5kZW50TGV2ZWwrKztcbiAgICAgICAgICAgIGluZGVudFN0cmluZyArPSBzaW5nbGVJbmRlbnQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBvdXRkZW50KCkge1xuICAgICAgICAgICAgaW5kZW50TGV2ZWwtLTtcbiAgICAgICAgICAgIGluZGVudFN0cmluZyA9IGluZGVudFN0cmluZy5zbGljZSgwLCAtaW5kZW50U2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJpbnQgPSB7fTtcbiAgICAgICAgcHJpbnRbXCJ7XCJdID0gZnVuY3Rpb24gKGNoKSB7XG4gICAgICAgICAgICBwcmludC5zaW5nbGVTcGFjZSgpO1xuICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICB9O1xuICAgICAgICBwcmludFtcIn1cIl0gPSBmdW5jdGlvbiAoY2gpIHtcbiAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgIHByaW50Lm5ld0xpbmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcmludC5fbGFzdENoYXJXaGl0ZXNwYWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHdoaXRlUmUudGVzdChvdXRwdXRbb3V0cHV0Lmxlbmd0aCAtIDFdKTtcbiAgICAgICAgfTtcblxuICAgICAgICBwcmludC5uZXdMaW5lID0gZnVuY3Rpb24gKGtlZXBXaGl0ZXNwYWNlKSB7XG4gICAgICAgICAgICBpZiAoIWtlZXBXaGl0ZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHByaW50Ll9sYXN0Q2hhcldoaXRlc3BhY2UoKSkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucG9wKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3V0cHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKCdcXG4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpbmRlbnRTdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChpbmRlbnRTdHJpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBwcmludC5zaW5nbGVTcGFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChvdXRwdXQubGVuZ3RoICYmICFwcmludC5fbGFzdENoYXJXaGl0ZXNwYWNlKCkpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaCgnICcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgIGlmIChpbmRlbnRTdHJpbmcpIHtcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKGluZGVudFN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgICAgLypfX19fX19fX19fX19fX19fX19fX18tLS0tLS0tLS0tLS0tLS0tLS0tLV9fX19fX19fX19fX19fX19fX19fXyovXG5cbiAgICAgICAgdmFyIGluc2lkZVJ1bGUgPSBmYWxzZTtcbiAgICAgICAgdmFyIGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCA9IGZhbHNlO1xuXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgaXNBZnRlclNwYWNlID0gc2tpcFdoaXRlc3BhY2UoKTtcblxuICAgICAgICAgICAgaWYgKCFjaCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJy8nICYmIHBlZWsoKSA9PT0gJyonKSB7IC8qIGNzcyBjb21tZW50ICovXG4gICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGVhdENvbW1lbnQoKSwgXCJcXG5cIiwgaW5kZW50U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB2YXIgaGVhZGVyID0gbG9va0JhY2soXCJcIik7XG4gICAgICAgICAgICAgICAgaWYgKGhlYWRlcikge1xuICAgICAgICAgICAgICAgICAgICBwcmludC5uZXdMaW5lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJy8nICYmIHBlZWsoKSA9PT0gJy8nKSB7IC8vIHNpbmdsZSBsaW5lIGNvbW1lbnRcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRDb21tZW50KHRydWUpLCBpbmRlbnRTdHJpbmcpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ0AnKSB7XG4gICAgICAgICAgICAgICAgLy8gc3RyaXAgdHJhaWxpbmcgc3BhY2UsIGlmIHByZXNlbnQsIGZvciBoYXNoIHByb3BlcnR5IGNoZWNrc1xuICAgICAgICAgICAgICAgIHZhciBhdFJ1bGUgPSBlYXRTdHJpbmcoXCIgXCIpLnJlcGxhY2UoLyAkLywgJycpO1xuXG4gICAgICAgICAgICAgICAgLy8gcGFzcyBhbG9uZyB0aGUgc3BhY2Ugd2UgZm91bmQgYXMgYSBzZXBhcmF0ZSBpdGVtXG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goYXRSdWxlLCBjaCk7XG5cbiAgICAgICAgICAgICAgICAvLyBtaWdodCBiZSBhIG5lc3RpbmcgYXQtcnVsZVxuICAgICAgICAgICAgICAgIGlmIChhdFJ1bGUgaW4gY3NzX2JlYXV0aWZ5Lk5FU1RFRF9BVF9SVUxFKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lc3RlZExldmVsICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhdFJ1bGUgaW4gY3NzX2JlYXV0aWZ5LkNPTkRJVElPTkFMX0dST1VQX1JVTEUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAneycpIHtcbiAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKHBlZWsoKSA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goXCIge31cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50W1wie1wiXShjaCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdoZW4gZW50ZXJpbmcgY29uZGl0aW9uYWwgZ3JvdXBzLCBvbmx5IHJ1bGVzZXRzIGFyZSBhbGxvd2VkXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbnRlcmluZ0NvbmRpdGlvbmFsR3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5zaWRlUnVsZSA9IChpbmRlbnRMZXZlbCA+IG5lc3RlZExldmVsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgZGVjbGFyYXRpb25zIGFyZSBhbHNvIGFsbG93ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2lkZVJ1bGUgPSAoaW5kZW50TGV2ZWwgPj0gbmVzdGVkTGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgb3V0ZGVudCgpO1xuICAgICAgICAgICAgICAgIHByaW50W1wifVwiXShjaCk7XG4gICAgICAgICAgICAgICAgaW5zaWRlUnVsZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChuZXN0ZWRMZXZlbCkge1xuICAgICAgICAgICAgICAgICAgICBuZXN0ZWRMZXZlbC0tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgIGlmIChpbnNpZGVSdWxlIHx8IGVudGVyaW5nQ29uZGl0aW9uYWxHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAvLyAncHJvcGVydHk6IHZhbHVlJyBkZWxpbWl0ZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gd2hpY2ggY291bGQgYmUgaW4gYSBjb25kaXRpb25hbCBncm91cCBxdWVyeVxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCwgXCIgXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwZWVrKCkgPT09IFwiOlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwc2V1ZG8tZWxlbWVudFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goXCI6OlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBzZXVkby1jbGFzc1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1wiJyB8fCBjaCA9PT0gJ1xcJycpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRTdHJpbmcoY2gpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICc7Jykge1xuICAgICAgICAgICAgICAgIGlmIChpc0NvbW1lbnRPbkxpbmUoKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmVmb3JlQ29tbWVudCA9IGVhdFN0cmluZygnLycpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWVudCA9IGVhdENvbW1lbnQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGJlZm9yZUNvbW1lbnQsIGNvbW1lbnQuc3Vic3RyaW5nKDEsIGNvbW1lbnQubGVuZ3RoIC0gMSksICdcXG4nLCBpbmRlbnRTdHJpbmcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoLCAnXFxuJywgaW5kZW50U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKCcpIHsgLy8gbWF5IGJlIGEgdXJsXG4gICAgICAgICAgICAgICAgaWYgKGxvb2tCYWNrKFwidXJsXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgZWF0V2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2ggIT09ICcpJyAmJiBjaCAhPT0gJ1wiJyAmJiBjaCAhPT0gJ1xcJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChlYXRTdHJpbmcoJyknKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcy0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzQWZ0ZXJTcGFjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnQuc2luZ2xlU3BhY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICAgICAgICAgIGVhdFdoaXRlc3BhY2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnKScpIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChjaCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09PSAnLCcpIHtcbiAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgICAgIGlmICghaW5zaWRlUnVsZSAmJiBzZWxlY3RvclNlcGFyYXRvck5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnQubmV3TGluZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gJ1snIHx8IGNoID09PSAnPScpIHsgLy8gbm8gd2hpdGVzcGFjZSBiZWZvcmUgb3IgYWZ0ZXJcbiAgICAgICAgICAgICAgICBlYXRXaGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNBZnRlclNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50LnNpbmdsZVNwYWNlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goY2gpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgc3dlZXRDb2RlID0gb3V0cHV0LmpvaW4oJycpLnJlcGxhY2UoL1tcXG4gXSskLywgJycpO1xuXG4gICAgICAgIC8vIGVzdGFibGlzaCBlbmRfd2l0aF9uZXdsaW5lXG4gICAgICAgIHZhciBzaG91bGQgPSBlbmRXaXRoTmV3bGluZTtcbiAgICAgICAgdmFyIGFjdHVhbGx5ID0gL1xcbiQvLnRlc3Qoc3dlZXRDb2RlKTtcbiAgICAgICAgaWYgKHNob3VsZCAmJiAhYWN0dWFsbHkpIHtcbiAgICAgICAgICAgIHN3ZWV0Q29kZSArPSBcIlxcblwiO1xuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGQgJiYgYWN0dWFsbHkpIHtcbiAgICAgICAgICAgIHN3ZWV0Q29kZSA9IHN3ZWV0Q29kZS5zbGljZSgwLCAtMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3dlZXRDb2RlO1xuICAgIH1cblxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9BdC1ydWxlXG4gICAgY3NzX2JlYXV0aWZ5Lk5FU1RFRF9BVF9SVUxFID0ge1xuICAgICAgICBcIkBwYWdlXCI6IHRydWUsXG4gICAgICAgIFwiQGZvbnQtZmFjZVwiOiB0cnVlLFxuICAgICAgICBcIkBrZXlmcmFtZXNcIjogdHJ1ZSxcbiAgICAgICAgLy8gYWxzbyBpbiBDT05ESVRJT05BTF9HUk9VUF9SVUxFIGJlbG93XG4gICAgICAgIFwiQG1lZGlhXCI6IHRydWUsXG4gICAgICAgIFwiQHN1cHBvcnRzXCI6IHRydWUsXG4gICAgICAgIFwiQGRvY3VtZW50XCI6IHRydWVcbiAgICB9O1xuICAgIGNzc19iZWF1dGlmeS5DT05ESVRJT05BTF9HUk9VUF9SVUxFID0ge1xuICAgICAgICBcIkBtZWRpYVwiOiB0cnVlLFxuICAgICAgICBcIkBzdXBwb3J0c1wiOiB0cnVlLFxuICAgICAgICBcIkBkb2N1bWVudFwiOiB0cnVlXG4gICAgfTtcblxuICAgIC8qZ2xvYmFsIGRlZmluZSAqL1xuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQU1EICggaHR0cHM6Ly9naXRodWIuY29tL2FtZGpzL2FtZGpzLWFwaS93aWtpL0FNRCNkZWZpbmVhbWQtcHJvcGVydHktIClcbiAgICAgICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4geyBjc3NfYmVhdXRpZnk6IGNzc19iZWF1dGlmeSB9O1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBDb21tb25KUy4gSnVzdCBwdXQgdGhpcyBmaWxlIHNvbWV3aGVyZSBvbiB5b3VyIHJlcXVpcmUucGF0aHNcbiAgICAgICAgLy8gYW5kIHlvdSB3aWxsIGJlIGFibGUgdG8gYHZhciBodG1sX2JlYXV0aWZ5ID0gcmVxdWlyZShcImJlYXV0aWZ5XCIpLmh0bWxfYmVhdXRpZnlgLlxuICAgICAgICBleHBvcnRzLmNzc19iZWF1dGlmeSA9IGNzc19iZWF1dGlmeTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UncmUgcnVubmluZyBhIHdlYiBwYWdlIGFuZCBkb24ndCBoYXZlIGVpdGhlciBvZiB0aGUgYWJvdmUsIGFkZCBvdXIgb25lIGdsb2JhbFxuICAgICAgICB3aW5kb3cuY3NzX2JlYXV0aWZ5ID0gY3NzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBldmVuIGhhdmUgd2luZG93LCB0cnkgZ2xvYmFsLlxuICAgICAgICBnbG9iYWwuY3NzX2JlYXV0aWZ5ID0gY3NzX2JlYXV0aWZ5O1xuICAgIH1cblxufSgpKTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKmpzaGludCBjdXJseTp0cnVlLCBlcWVxZXE6dHJ1ZSwgbGF4YnJlYWs6dHJ1ZSwgbm9lbXB0eTpmYWxzZSAqL1xuLypcblxuICBUaGUgTUlUIExpY2Vuc2UgKE1JVClcblxuICBDb3B5cmlnaHQgKGMpIDIwMDctMjAxMyBFaW5hciBMaWVsbWFuaXMgYW5kIGNvbnRyaWJ1dG9ycy5cblxuICBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvblxuICBvYnRhaW5pbmcgYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlc1xuICAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sXG4gIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsXG4gIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsXG4gIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG4gIGluY2x1ZGVkIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG4gIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsXG4gIEVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuICBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORFxuICBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTXG4gIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuICBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gIFNPRlRXQVJFLlxuXG5cbiBTdHlsZSBIVE1MXG4tLS0tLS0tLS0tLS0tLS1cblxuICBXcml0dGVuIGJ5IE5vY2h1bSBTb3Nzb25rbywgKG5zb3Nzb25rb0Bob3RtYWlsLmNvbSlcblxuICBCYXNlZCBvbiBjb2RlIGluaXRpYWxseSBkZXZlbG9wZWQgYnk6IEVpbmFyIExpZWxtYW5pcywgPGVpbmFyQGpzYmVhdXRpZmllci5vcmc+XG4gICAgaHR0cDovL2pzYmVhdXRpZmllci5vcmcvXG5cbiAgVXNhZ2U6XG4gICAgc3R5bGVfaHRtbChodG1sX3NvdXJjZSk7XG5cbiAgICBzdHlsZV9odG1sKGh0bWxfc291cmNlLCBvcHRpb25zKTtcblxuICBUaGUgb3B0aW9ucyBhcmU6XG4gICAgaW5kZW50X2lubmVyX2h0bWwgKGRlZmF1bHQgZmFsc2UpICDigJQgaW5kZW50IDxoZWFkPiBhbmQgPGJvZHk+IHNlY3Rpb25zLFxuICAgIGluZGVudF9zaXplIChkZWZhdWx0IDQpICAgICAgICAgIOKAlCBpbmRlbnRhdGlvbiBzaXplLFxuICAgIGluZGVudF9jaGFyIChkZWZhdWx0IHNwYWNlKSAgICAgIOKAlCBjaGFyYWN0ZXIgdG8gaW5kZW50IHdpdGgsXG4gICAgd3JhcF9saW5lX2xlbmd0aCAoZGVmYXVsdCAyNTApICAgICAgICAgICAgLSAgbWF4aW11bSBhbW91bnQgb2YgY2hhcmFjdGVycyBwZXIgbGluZSAoMCA9IGRpc2FibGUpXG4gICAgYnJhY2Vfc3R5bGUgKGRlZmF1bHQgXCJjb2xsYXBzZVwiKSAtIFwiY29sbGFwc2VcIiB8IFwiZXhwYW5kXCIgfCBcImVuZC1leHBhbmRcIlxuICAgICAgICAgICAgcHV0IGJyYWNlcyBvbiB0aGUgc2FtZSBsaW5lIGFzIGNvbnRyb2wgc3RhdGVtZW50cyAoZGVmYXVsdCksIG9yIHB1dCBicmFjZXMgb24gb3duIGxpbmUgKEFsbG1hbiAvIEFOU0kgc3R5bGUpLCBvciBqdXN0IHB1dCBlbmQgYnJhY2VzIG9uIG93biBsaW5lLlxuICAgIHVuZm9ybWF0dGVkIChkZWZhdWx0cyB0byBpbmxpbmUgdGFncykgLSBsaXN0IG9mIHRhZ3MsIHRoYXQgc2hvdWxkbid0IGJlIHJlZm9ybWF0dGVkXG4gICAgaW5kZW50X3NjcmlwdHMgKGRlZmF1bHQgbm9ybWFsKSAgLSBcImtlZXBcInxcInNlcGFyYXRlXCJ8XCJub3JtYWxcIlxuICAgIHByZXNlcnZlX25ld2xpbmVzIChkZWZhdWx0IHRydWUpIC0gd2hldGhlciBleGlzdGluZyBsaW5lIGJyZWFrcyBiZWZvcmUgZWxlbWVudHMgc2hvdWxkIGJlIHByZXNlcnZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE9ubHkgd29ya3MgYmVmb3JlIGVsZW1lbnRzLCBub3QgaW5zaWRlIHRhZ3Mgb3IgZm9yIHRleHQuXG4gICAgbWF4X3ByZXNlcnZlX25ld2xpbmVzIChkZWZhdWx0IHVubGltaXRlZCkgLSBtYXhpbXVtIG51bWJlciBvZiBsaW5lIGJyZWFrcyB0byBiZSBwcmVzZXJ2ZWQgaW4gb25lIGNodW5rXG4gICAgaW5kZW50X2hhbmRsZWJhcnMgKGRlZmF1bHQgZmFsc2UpIC0gZm9ybWF0IGFuZCBpbmRlbnQge3sjZm9vfX0gYW5kIHt7L2Zvb319XG5cbiAgICBlLmcuXG5cbiAgICBzdHlsZV9odG1sKGh0bWxfc291cmNlLCB7XG4gICAgICAnaW5kZW50X2lubmVyX2h0bWwnOiBmYWxzZSxcbiAgICAgICdpbmRlbnRfc2l6ZSc6IDIsXG4gICAgICAnaW5kZW50X2NoYXInOiAnICcsXG4gICAgICAnd3JhcF9saW5lX2xlbmd0aCc6IDc4LFxuICAgICAgJ2JyYWNlX3N0eWxlJzogJ2V4cGFuZCcsXG4gICAgICAndW5mb3JtYXR0ZWQnOiBbJ2EnLCAnc3ViJywgJ3N1cCcsICdiJywgJ2knLCAndSddLFxuICAgICAgJ3ByZXNlcnZlX25ld2xpbmVzJzogdHJ1ZSxcbiAgICAgICdtYXhfcHJlc2VydmVfbmV3bGluZXMnOiA1LFxuICAgICAgJ2luZGVudF9oYW5kbGViYXJzJzogZmFsc2VcbiAgICB9KTtcbiovXG5cbihmdW5jdGlvbigpIHtcblxuICAgIGZ1bmN0aW9uIHRyaW0ocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbHRyaW0ocykge1xuICAgICAgICByZXR1cm4gcy5yZXBsYWNlKC9eXFxzKy9nLCAnJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3R5bGVfaHRtbChodG1sX3NvdXJjZSwgb3B0aW9ucywganNfYmVhdXRpZnksIGNzc19iZWF1dGlmeSkge1xuICAgICAgICAvL1dyYXBwZXIgZnVuY3Rpb24gdG8gaW52b2tlIGFsbCB0aGUgbmVjZXNzYXJ5IGNvbnN0cnVjdG9ycyBhbmQgZGVhbCB3aXRoIHRoZSBvdXRwdXQuXG5cbiAgICAgICAgdmFyIG11bHRpX3BhcnNlcixcbiAgICAgICAgICAgIGluZGVudF9pbm5lcl9odG1sLFxuICAgICAgICAgICAgaW5kZW50X3NpemUsXG4gICAgICAgICAgICBpbmRlbnRfY2hhcmFjdGVyLFxuICAgICAgICAgICAgd3JhcF9saW5lX2xlbmd0aCxcbiAgICAgICAgICAgIGJyYWNlX3N0eWxlLFxuICAgICAgICAgICAgdW5mb3JtYXR0ZWQsXG4gICAgICAgICAgICBwcmVzZXJ2ZV9uZXdsaW5lcyxcbiAgICAgICAgICAgIG1heF9wcmVzZXJ2ZV9uZXdsaW5lcyxcbiAgICAgICAgICAgIGluZGVudF9oYW5kbGViYXJzO1xuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHRvIDEuMy40XG4gICAgICAgIGlmICgob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoID09PSB1bmRlZmluZWQgfHwgcGFyc2VJbnQob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoLCAxMCkgPT09IDApICYmXG4gICAgICAgICAgICAgICAgKG9wdGlvbnMubWF4X2NoYXIgIT09IHVuZGVmaW5lZCAmJiBwYXJzZUludChvcHRpb25zLm1heF9jaGFyLCAxMCkgIT09IDApKSB7XG4gICAgICAgICAgICBvcHRpb25zLndyYXBfbGluZV9sZW5ndGggPSBvcHRpb25zLm1heF9jaGFyO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5kZW50X2lubmVyX2h0bWwgPSAob3B0aW9ucy5pbmRlbnRfaW5uZXJfaHRtbCA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5pbmRlbnRfaW5uZXJfaHRtbDtcbiAgICAgICAgaW5kZW50X3NpemUgPSAob3B0aW9ucy5pbmRlbnRfc2l6ZSA9PT0gdW5kZWZpbmVkKSA/IDQgOiBwYXJzZUludChvcHRpb25zLmluZGVudF9zaXplLCAxMCk7XG4gICAgICAgIGluZGVudF9jaGFyYWN0ZXIgPSAob3B0aW9ucy5pbmRlbnRfY2hhciA9PT0gdW5kZWZpbmVkKSA/ICcgJyA6IG9wdGlvbnMuaW5kZW50X2NoYXI7XG4gICAgICAgIGJyYWNlX3N0eWxlID0gKG9wdGlvbnMuYnJhY2Vfc3R5bGUgPT09IHVuZGVmaW5lZCkgPyAnY29sbGFwc2UnIDogb3B0aW9ucy5icmFjZV9zdHlsZTtcbiAgICAgICAgd3JhcF9saW5lX2xlbmd0aCA9ICBwYXJzZUludChvcHRpb25zLndyYXBfbGluZV9sZW5ndGgsIDEwKSA9PT0gMCA/IDMyNzg2IDogcGFyc2VJbnQob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoIHx8IDI1MCwgMTApO1xuICAgICAgICB1bmZvcm1hdHRlZCA9IG9wdGlvbnMudW5mb3JtYXR0ZWQgfHwgWydhJywgJ3NwYW4nLCAnYmRvJywgJ2VtJywgJ3N0cm9uZycsICdkZm4nLCAnY29kZScsICdzYW1wJywgJ2tiZCcsICd2YXInLCAnY2l0ZScsICdhYmJyJywgJ2Fjcm9ueW0nLCAncScsICdzdWInLCAnc3VwJywgJ3R0JywgJ2knLCAnYicsICdiaWcnLCAnc21hbGwnLCAndScsICdzJywgJ3N0cmlrZScsICdmb250JywgJ2lucycsICdkZWwnLCAncHJlJywgJ2FkZHJlc3MnLCAnZHQnLCAnaDEnLCAnaDInLCAnaDMnLCAnaDQnLCAnaDUnLCAnaDYnXTtcbiAgICAgICAgcHJlc2VydmVfbmV3bGluZXMgPSAob3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcyA9PT0gdW5kZWZpbmVkKSA/IHRydWUgOiBvcHRpb25zLnByZXNlcnZlX25ld2xpbmVzO1xuICAgICAgICBtYXhfcHJlc2VydmVfbmV3bGluZXMgPSBwcmVzZXJ2ZV9uZXdsaW5lcyA/XG4gICAgICAgICAgICAoaXNOYU4ocGFyc2VJbnQob3B0aW9ucy5tYXhfcHJlc2VydmVfbmV3bGluZXMsIDEwKSkgPyAzMjc4NiA6IHBhcnNlSW50KG9wdGlvbnMubWF4X3ByZXNlcnZlX25ld2xpbmVzLCAxMCkpXG4gICAgICAgICAgICA6IDA7XG4gICAgICAgIGluZGVudF9oYW5kbGViYXJzID0gKG9wdGlvbnMuaW5kZW50X2hhbmRsZWJhcnMgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuaW5kZW50X2hhbmRsZWJhcnM7XG5cbiAgICAgICAgZnVuY3Rpb24gUGFyc2VyKCkge1xuXG4gICAgICAgICAgICB0aGlzLnBvcyA9IDA7IC8vUGFyc2VyIHBvc2l0aW9uXG4gICAgICAgICAgICB0aGlzLnRva2VuID0gJyc7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJzsgLy9yZWZsZWN0cyB0aGUgY3VycmVudCBQYXJzZXIgbW9kZTogVEFHL0NPTlRFTlRcbiAgICAgICAgICAgIHRoaXMudGFncyA9IHsgLy9BbiBvYmplY3QgdG8gaG9sZCB0YWdzLCB0aGVpciBwb3NpdGlvbiwgYW5kIHRoZWlyIHBhcmVudC10YWdzLCBpbml0aWF0ZWQgd2l0aCBkZWZhdWx0IHZhbHVlc1xuICAgICAgICAgICAgICAgIHBhcmVudDogJ3BhcmVudDEnLFxuICAgICAgICAgICAgICAgIHBhcmVudGNvdW50OiAxLFxuICAgICAgICAgICAgICAgIHBhcmVudDE6ICcnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy50YWdfdHlwZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy50b2tlbl90ZXh0ID0gdGhpcy5sYXN0X3Rva2VuID0gdGhpcy5sYXN0X3RleHQgPSB0aGlzLnRva2VuX3R5cGUgPSAnJztcbiAgICAgICAgICAgIHRoaXMubmV3bGluZXMgPSAwO1xuICAgICAgICAgICAgdGhpcy5pbmRlbnRfY29udGVudCA9IGluZGVudF9pbm5lcl9odG1sO1xuXG4gICAgICAgICAgICB0aGlzLlV0aWxzID0geyAvL1VpbGl0aWVzIG1hZGUgYXZhaWxhYmxlIHRvIHRoZSB2YXJpb3VzIGZ1bmN0aW9uc1xuICAgICAgICAgICAgICAgIHdoaXRlc3BhY2U6IFwiXFxuXFxyXFx0IFwiLnNwbGl0KCcnKSxcbiAgICAgICAgICAgICAgICBzaW5nbGVfdG9rZW46ICdicixpbnB1dCxsaW5rLG1ldGEsIWRvY3R5cGUsYmFzZWZvbnQsYmFzZSxhcmVhLGhyLHdicixwYXJhbSxpbWcsaXNpbmRleCw/eG1sLGVtYmVkLD9waHAsPyw/PScuc3BsaXQoJywnKSwgLy9hbGwgdGhlIHNpbmdsZSB0YWdzIGZvciBIVE1MXG4gICAgICAgICAgICAgICAgZXh0cmFfbGluZXJzOiAnaGVhZCxib2R5LC9odG1sJy5zcGxpdCgnLCcpLCAvL2ZvciB0YWdzIHRoYXQgbmVlZCBhIGxpbmUgb2Ygd2hpdGVzcGFjZSBiZWZvcmUgdGhlbVxuICAgICAgICAgICAgICAgIGluX2FycmF5OiBmdW5jdGlvbih3aGF0LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aGF0ID09PSBhcnJbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy50cmF2ZXJzZV93aGl0ZXNwYWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJztcblxuICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgPSB0aGlzLmlucHV0LmNoYXJBdCh0aGlzLnBvcyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuVXRpbHMuaW5fYXJyYXkoaW5wdXRfY2hhciwgdGhpcy5VdGlscy53aGl0ZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld2xpbmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMuVXRpbHMuaW5fYXJyYXkoaW5wdXRfY2hhciwgdGhpcy5VdGlscy53aGl0ZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByZXNlcnZlX25ld2xpbmVzICYmIGlucHV0X2NoYXIgPT09ICdcXG4nICYmIHRoaXMubmV3bGluZXMgPD0gbWF4X3ByZXNlcnZlX25ld2xpbmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXdsaW5lcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5nZXRfY29udGVudCA9IGZ1bmN0aW9uKCkgeyAvL2Z1bmN0aW9uIHRvIGNhcHR1cmUgcmVndWxhciBjb250ZW50IGJldHdlZW4gdGFnc1xuXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IGZhbHNlOyAvL2lmIGEgc3BhY2UgaXMgbmVlZGVkXG5cbiAgICAgICAgICAgICAgICB3aGlsZSAodGhpcy5pbnB1dC5jaGFyQXQodGhpcy5wb3MpICE9PSAnPCcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucG9zID49IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudC5sZW5ndGggPyBjb250ZW50LmpvaW4oJycpIDogWycnLCAnVEtfRU9GJ107XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmF2ZXJzZV93aGl0ZXNwYWNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlOyAvL2Rvbid0IHdhbnQgdG8gaW5zZXJ0IHVubmVjZXNzYXJ5IHNwYWNlXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZWJhcnMgcGFyc2luZyBpcyBjb21wbGljYXRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHt7I2Zvb319IGFuZCB7ey9mb299fSBhcmUgZm9ybWF0dGVkIHRhZ3MuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB7e3NvbWV0aGluZ319IHNob3VsZCBnZXQgdHJlYXRlZCBhcyBjb250ZW50LCBleGNlcHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB7e2Vsc2V9fSBzcGVjaWZpY2FsbHkgYmVoYXZlcyBsaWtlIHt7I2lmfX0gYW5kIHt7L2lmfX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwZWVrMyA9IHRoaXMuaW5wdXQuc3Vic3RyKHRoaXMucG9zLCAzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWVrMyA9PT0gJ3t7IycgfHwgcGVlazMgPT09ICd7ey8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVGhlc2UgYXJlIHRhZ3MgYW5kIG5vdCBjb250ZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmlucHV0LnN1YnN0cih0aGlzLnBvcywgMikgPT09ICd7eycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRfdGFnKHRydWUpID09PSAne3tlbHNlfX0nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgPSB0aGlzLmlucHV0LmNoYXJBdCh0aGlzLnBvcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zKys7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5saW5lX2NoYXJfY291bnQgPj0gdGhpcy53cmFwX2xpbmVfbGVuZ3RoKSB7IC8vaW5zZXJ0IGEgbGluZSB3aGVuIHRoZSB3cmFwX2xpbmVfbGVuZ3RoIGlzIHJlYWNoZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIGNvbnRlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfaW5kZW50YXRpb24oY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaChpbnB1dF9jaGFyKTsgLy9sZXR0ZXIgYXQtYS10aW1lIChvciBzdHJpbmcpIGluc2VydGVkIHRvIGFuIGFycmF5XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50Lmxlbmd0aCA/IGNvbnRlbnQuam9pbignJykgOiAnJztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2NvbnRlbnRzX3RvID0gZnVuY3Rpb24obmFtZSkgeyAvL2dldCB0aGUgZnVsbCBjb250ZW50IG9mIGEgc2NyaXB0IG9yIHN0eWxlIHRvIHBhc3MgdG8ganNfYmVhdXRpZnlcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPT09IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbJycsICdUS19FT0YnXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJztcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9ICcnO1xuICAgICAgICAgICAgICAgIHZhciByZWdfbWF0Y2ggPSBuZXcgUmVnRXhwKCc8LycgKyBuYW1lICsgJ1xcXFxzKj4nLCAnaWdtJyk7XG4gICAgICAgICAgICAgICAgcmVnX21hdGNoLmxhc3RJbmRleCA9IHRoaXMucG9zO1xuICAgICAgICAgICAgICAgIHZhciByZWdfYXJyYXkgPSByZWdfbWF0Y2guZXhlYyh0aGlzLmlucHV0KTtcbiAgICAgICAgICAgICAgICB2YXIgZW5kX3NjcmlwdCA9IHJlZ19hcnJheSA/IHJlZ19hcnJheS5pbmRleCA6IHRoaXMuaW5wdXQubGVuZ3RoOyAvL2Fic29sdXRlIGVuZCBvZiBzY3JpcHRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPCBlbmRfc2NyaXB0KSB7IC8vZ2V0IGV2ZXJ5dGhpbmcgaW4gYmV0d2VlbiB0aGUgc2NyaXB0IHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHRoaXMuaW5wdXQuc3Vic3RyaW5nKHRoaXMucG9zLCBlbmRfc2NyaXB0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBlbmRfc2NyaXB0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucmVjb3JkX3RhZyA9IGZ1bmN0aW9uKHRhZykgeyAvL2Z1bmN0aW9uIHRvIHJlY29yZCBhIHRhZyBhbmQgaXRzIHBhcmVudCBpbiB0aGlzLnRhZ3MgT2JqZWN0XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSkgeyAvL2NoZWNrIGZvciB0aGUgZXhpc3RlbmNlIG9mIHRoaXMgdGFnIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArICdjb3VudCddKys7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFnc1t0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J11dID0gdGhpcy5pbmRlbnRfbGV2ZWw7IC8vYW5kIHJlY29yZCB0aGUgcHJlc2VudCBpbmRlbnQgbGV2ZWxcbiAgICAgICAgICAgICAgICB9IGVsc2UgeyAvL290aGVyd2lzZSBpbml0aWFsaXplIHRoaXMgdGFnIHR5cGVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArICdjb3VudCddID0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXV0gPSB0aGlzLmluZGVudF9sZXZlbDsgLy9hbmQgcmVjb3JkIHRoZSBwcmVzZW50IGluZGVudCBsZXZlbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddICsgJ3BhcmVudCddID0gdGhpcy50YWdzLnBhcmVudDsgLy9zZXQgdGhlIHBhcmVudCAoaS5lLiBpbiB0aGUgY2FzZSBvZiBhIGRpdiB0aGlzLnRhZ3MuZGl2MXBhcmVudClcbiAgICAgICAgICAgICAgICB0aGlzLnRhZ3MucGFyZW50ID0gdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddOyAvL2FuZCBtYWtlIHRoaXMgdGhlIGN1cnJlbnQgcGFyZW50IChpLmUuIGluIHRoZSBjYXNlIG9mIGEgZGl2ICdkaXYxJylcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucmV0cmlldmVfdGFnID0gZnVuY3Rpb24odGFnKSB7IC8vZnVuY3Rpb24gdG8gcmV0cmlldmUgdGhlIG9wZW5pbmcgdGFnIHRvIHRoZSBjb3JyZXNwb25kaW5nIGNsb3NlclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10pIHsgLy9pZiB0aGUgb3BlbmVuZXIgaXMgbm90IGluIHRoZSBPYmplY3Qgd2UgaWdub3JlIGl0XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wX3BhcmVudCA9IHRoaXMudGFncy5wYXJlbnQ7IC8vY2hlY2sgdG8gc2VlIGlmIGl0J3MgYSBjbG9zYWJsZSB0YWcuXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh0ZW1wX3BhcmVudCkgeyAvL3RpbGwgd2UgcmVhY2ggJycgKHRoZSBpbml0aWFsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J10gPT09IHRlbXBfcGFyZW50KSB7IC8vaWYgdGhpcyBpcyBpdCB1c2UgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzW3RlbXBfcGFyZW50ICsgJ3BhcmVudCddOyAvL290aGVyd2lzZSBrZWVwIG9uIGNsaW1iaW5nIHVwIHRoZSBET00gVHJlZVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZW1wX3BhcmVudCkgeyAvL2lmIHdlIGNhdWdodCBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X2xldmVsID0gdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXV07IC8vc2V0IHRoZSBpbmRlbnRfbGV2ZWwgYWNjb3JkaW5nbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFncy5wYXJlbnQgPSB0aGlzLnRhZ3NbdGVtcF9wYXJlbnQgKyAncGFyZW50J107IC8vYW5kIHNldCB0aGUgY3VycmVudCBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50YWdzW3RhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSArICdwYXJlbnQnXTsgLy9kZWxldGUgdGhlIGNsb3NlZCB0YWdzIHBhcmVudCByZWZlcmVuY2UuLi5cbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudGFnc1t0YWcgKyB0aGlzLnRhZ3NbdGFnICsgJ2NvdW50J11dOyAvLy4uLmFuZCB0aGUgdGFnIGl0c2VsZlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50YWdzW3RhZyArICdjb3VudCddID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50YWdzW3RhZyArICdjb3VudCddO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdzW3RhZyArICdjb3VudCddLS07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmluZGVudF90b190YWcgPSBmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgICAgICAgICAvLyBNYXRjaCB0aGUgaW5kZW50YXRpb24gbGV2ZWwgdG8gdGhlIGxhc3QgdXNlIG9mIHRoaXMgdGFnLCBidXQgZG9uJ3QgcmVtb3ZlIGl0LlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy50YWdzW3RhZyArICdjb3VudCddKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzLnBhcmVudDtcbiAgICAgICAgICAgICAgICB3aGlsZSAodGVtcF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhZyArIHRoaXMudGFnc1t0YWcgKyAnY291bnQnXSA9PT0gdGVtcF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRlbXBfcGFyZW50ID0gdGhpcy50YWdzW3RlbXBfcGFyZW50ICsgJ3BhcmVudCddO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGVtcF9wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwgPSB0aGlzLnRhZ3NbdGFnICsgdGhpcy50YWdzW3RhZyArICdjb3VudCddXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF90YWcgPSBmdW5jdGlvbihwZWVrKSB7IC8vZnVuY3Rpb24gdG8gZ2V0IGEgZnVsbCB0YWcgYW5kIHBhcnNlIGl0cyB0eXBlXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0X2NoYXIgPSAnJyxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFtdLFxuICAgICAgICAgICAgICAgICAgICBjb21tZW50ID0gJycsXG4gICAgICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydCwgdGFnX2VuZCxcbiAgICAgICAgICAgICAgICAgICAgdGFnX3N0YXJ0X2NoYXIsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdfcG9zID0gdGhpcy5wb3MsXG4gICAgICAgICAgICAgICAgICAgIG9yaWdfbGluZV9jaGFyX2NvdW50ID0gdGhpcy5saW5lX2NoYXJfY291bnQ7XG5cbiAgICAgICAgICAgICAgICBwZWVrID0gcGVlayAhPT0gdW5kZWZpbmVkID8gcGVlayA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBvcmlnX3BvcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVfY2hhcl9jb3VudCA9IG9yaWdfbGluZV9jaGFyX2NvdW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQubGVuZ3RoID8gY29udGVudC5qb2luKCcnKSA6IFsnJywgJ1RLX0VPRiddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5VdGlscy5pbl9hcnJheShpbnB1dF9jaGFyLCB0aGlzLlV0aWxzLndoaXRlc3BhY2UpKSB7IC8vZG9uJ3Qgd2FudCB0byBpbnNlcnQgdW5uZWNlc3Nhcnkgc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09IFwiJ1wiIHx8IGlucHV0X2NoYXIgPT09ICdcIicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0X2NoYXIgKz0gdGhpcy5nZXRfdW5mb3JtYXR0ZWQoaW5wdXRfY2hhcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGFjZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAnPScpIHsgLy9ubyBzcGFjZSBiZWZvcmUgPVxuICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gIT09ICc9JyAmJiBpbnB1dF9jaGFyICE9PSAnPicgJiYgc3BhY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vbm8gc3BhY2UgYWZ0ZXIgPSBvciBiZWZvcmUgPlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGluZV9jaGFyX2NvdW50ID49IHRoaXMud3JhcF9saW5lX2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfbmV3bGluZShmYWxzZSwgY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9pbmRlbnRhdGlvbihjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNwYWNlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgdGFnX3N0YXJ0X2NoYXIgPT09ICc8Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2hlbiBpbnNpZGUgYW4gYW5nbGUtYnJhY2tldCB0YWcsIHB1dCBzcGFjZXMgYXJvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGViYXJzIG5vdCBpbnNpZGUgb2Ygc3RyaW5ncy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoaW5wdXRfY2hhciArIHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKSkgPT09ICd7eycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyICs9IHRoaXMuZ2V0X3VuZm9ybWF0dGVkKCd9fScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50Lmxlbmd0aCAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gIT09ICcgJyAmJiBjb250ZW50W2NvbnRlbnQubGVuZ3RoIC0gMV0gIT09ICc8Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dF9jaGFyID0gJyAnICsgaW5wdXRfY2hhcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGlucHV0X2NoYXIgPT09ICc8JyAmJiAhdGFnX3N0YXJ0X2NoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydCA9IHRoaXMucG9zIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydF9jaGFyID0gJzwnO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGVudF9oYW5kbGViYXJzICYmICF0YWdfc3RhcnRfY2hhcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnRlbnQubGVuZ3RoID49IDIgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdID09PSAneycgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDJdID09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAnIycgfHwgaW5wdXRfY2hhciA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydCA9IHRoaXMucG9zIC0gMztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdfc3RhcnQgPSB0aGlzLnBvcyAtIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19zdGFydF9jaGFyID0gJ3snO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5wdXNoKGlucHV0X2NoYXIpOyAvL2luc2VydHMgY2hhcmFjdGVyIGF0LWEtdGltZSAob3Igc3RyaW5nKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb250ZW50WzFdICYmIGNvbnRlbnRbMV0gPT09ICchJykgeyAvL2lmIHdlJ3JlIGluIGEgY29tbWVudCwgZG8gc29tZXRoaW5nIHNwZWNpYWxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIHRyZWF0IGFsbCBjb21tZW50cyBhcyBsaXRlcmFscywgZXZlbiBtb3JlIHRoYW4gcHJlZm9ybWF0dGVkIHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIGp1c3QgbG9vayBmb3IgdGhlIGFwcHJvcHJpYXRlIGNsb3NlIHRhZ1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IFt0aGlzLmdldF9jb21tZW50KHRhZ19zdGFydCldO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgdGFnX3N0YXJ0X2NoYXIgPT09ICd7JyAmJiBjb250ZW50Lmxlbmd0aCA+IDIgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDJdID09PSAnfScgJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDFdID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAoaW5wdXRfY2hhciAhPT0gJz4nKTtcblxuICAgICAgICAgICAgICAgIHZhciB0YWdfY29tcGxldGUgPSBjb250ZW50LmpvaW4oJycpO1xuICAgICAgICAgICAgICAgIHZhciB0YWdfaW5kZXg7XG4gICAgICAgICAgICAgICAgdmFyIHRhZ19vZmZzZXQ7XG5cbiAgICAgICAgICAgICAgICBpZiAodGFnX2NvbXBsZXRlLmluZGV4T2YoJyAnKSAhPT0gLTEpIHsgLy9pZiB0aGVyZSdzIHdoaXRlc3BhY2UsIHRoYXRzIHdoZXJlIHRoZSB0YWcgbmFtZSBlbmRzXG4gICAgICAgICAgICAgICAgICAgIHRhZ19pbmRleCA9IHRhZ19jb21wbGV0ZS5pbmRleE9mKCcgJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY29tcGxldGVbMF0gPT09ICd7Jykge1xuICAgICAgICAgICAgICAgICAgICB0YWdfaW5kZXggPSB0YWdfY29tcGxldGUuaW5kZXhPZignfScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7IC8vb3RoZXJ3aXNlIGdvIHdpdGggdGhlIHRhZyBlbmRpbmdcbiAgICAgICAgICAgICAgICAgICAgdGFnX2luZGV4ID0gdGFnX2NvbXBsZXRlLmluZGV4T2YoJz4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRhZ19jb21wbGV0ZVswXSA9PT0gJzwnIHx8ICFpbmRlbnRfaGFuZGxlYmFycykge1xuICAgICAgICAgICAgICAgICAgICB0YWdfb2Zmc2V0ID0gMTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YWdfb2Zmc2V0ID0gdGFnX2NvbXBsZXRlWzJdID09PSAnIycgPyAzIDogMjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRhZ19jaGVjayA9IHRhZ19jb21wbGV0ZS5zdWJzdHJpbmcodGFnX29mZnNldCwgdGFnX2luZGV4KS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh0YWdfY29tcGxldGUuY2hhckF0KHRhZ19jb21wbGV0ZS5sZW5ndGggLSAyKSA9PT0gJy8nIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVXRpbHMuaW5fYXJyYXkodGFnX2NoZWNrLCB0aGlzLlV0aWxzLnNpbmdsZV90b2tlbikpIHsgLy9pZiB0aGlzIHRhZyBuYW1lIGlzIGEgc2luZ2xlIHRhZyB0eXBlIChlaXRoZXIgaW4gdGhlIGxpc3Qgb3IgaGFzIGEgY2xvc2luZyAvKVxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU0lOR0xFJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZW50X2hhbmRsZWJhcnMgJiYgdGFnX2NvbXBsZXRlWzBdID09PSAneycgJiYgdGFnX2NoZWNrID09PSAnZWxzZScpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF90b190YWcoJ2lmJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ0hBTkRMRUJBUlNfRUxTRSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9jb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhdmVyc2Vfd2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY2hlY2sgPT09ICdzY3JpcHQnKSB7IC8vZm9yIGxhdGVyIHNjcmlwdCBoYW5kbGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVjb3JkX3RhZyh0YWdfY2hlY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50YWdfdHlwZSA9ICdTQ1JJUFQnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdfY2hlY2sgPT09ICdzdHlsZScpIHsgLy9mb3IgZnV0dXJlIHN0eWxlIGhhbmRsaW5nIChmb3Igbm93IGl0IGp1c3RzIHVzZXMgZ2V0X2NvbnRlbnQpXG4gICAgICAgICAgICAgICAgICAgIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWNvcmRfdGFnKHRhZ19jaGVjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NUWUxFJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5pc191bmZvcm1hdHRlZCh0YWdfY2hlY2ssIHVuZm9ybWF0dGVkKSkgeyAvLyBkbyBub3QgcmVmb3JtYXQgdGhlIFwidW5mb3JtYXR0ZWRcIiB0YWdzXG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgPSB0aGlzLmdldF91bmZvcm1hdHRlZCgnPC8nICsgdGFnX2NoZWNrICsgJz4nLCB0YWdfY29tcGxldGUpOyAvLy4uLmRlbGVnYXRlIHRvIGdldF91bmZvcm1hdHRlZCBmdW5jdGlvblxuICAgICAgICAgICAgICAgICAgICBjb250ZW50LnB1c2goY29tbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXNlcnZlIGNvbGxhcHNlZCB3aGl0ZXNwYWNlIGVpdGhlciBiZWZvcmUgb3IgYWZ0ZXIgdGhpcyB0YWcuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWdfc3RhcnQgPiAwICYmIHRoaXMuVXRpbHMuaW5fYXJyYXkodGhpcy5pbnB1dC5jaGFyQXQodGFnX3N0YXJ0IC0gMSksIHRoaXMuVXRpbHMud2hpdGVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuc3BsaWNlKDAsIDAsIHRoaXMuaW5wdXQuY2hhckF0KHRhZ19zdGFydCAtIDEpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0YWdfZW5kID0gdGhpcy5wb3MgLSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5VdGlscy5pbl9hcnJheSh0aGlzLmlucHV0LmNoYXJBdCh0YWdfZW5kICsgMSksIHRoaXMuVXRpbHMud2hpdGVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQucHVzaCh0aGlzLmlucHV0LmNoYXJBdCh0YWdfZW5kICsgMSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU0lOR0xFJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRhZ19jaGVjay5jaGFyQXQoMCkgPT09ICchJykgeyAvL3BlZWsgZm9yIDwhIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGNvbW1lbnRzIGNvbnRlbnQgaXMgYWxyZWFkeSBjb3JyZWN0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBlZWspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnU0lOR0xFJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhdmVyc2Vfd2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghcGVlaykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGFnX2NoZWNrLmNoYXJBdCgwKSA9PT0gJy8nKSB7IC8vdGhpcyB0YWcgaXMgYSBkb3VibGUgdGFnIHNvIGNoZWNrIGZvciB0YWctZW5kaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHJpZXZlX3RhZyh0YWdfY2hlY2suc3Vic3RyaW5nKDEpKTsgLy9yZW1vdmUgaXQgYW5kIGFsbCBhbmNlc3RvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFnX3R5cGUgPSAnRU5EJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhdmVyc2Vfd2hpdGVzcGFjZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgeyAvL290aGVyd2lzZSBpdCdzIGEgc3RhcnQtdGFnXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlY29yZF90YWcodGFnX2NoZWNrKTsgLy9wdXNoIGl0IG9uIHRoZSB0YWcgc3RhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdfY2hlY2sudG9Mb3dlckNhc2UoKSAhPT0gJ2h0bWwnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfY29udGVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRhZ190eXBlID0gJ1NUQVJUJztcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsb3cgcHJlc2VydmluZyBvZiBuZXdsaW5lcyBhZnRlciBhIHN0YXJ0IHRhZ1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmF2ZXJzZV93aGl0ZXNwYWNlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuVXRpbHMuaW5fYXJyYXkodGFnX2NoZWNrLCB0aGlzLlV0aWxzLmV4dHJhX2xpbmVycykpIHsgLy9jaGVjayBpZiB0aGlzIGRvdWJsZSBuZWVkcyBhbiBleHRyYSBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dC5sZW5ndGggJiYgdGhpcy5vdXRwdXRbdGhpcy5vdXRwdXQubGVuZ3RoIC0gMl0gIT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9uZXdsaW5lKHRydWUsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChwZWVrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zID0gb3JpZ19wb3M7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gb3JpZ19saW5lX2NoYXJfY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQuam9pbignJyk7IC8vcmV0dXJucyBmdWxseSBmb3JtYXR0ZWQgdGFnXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF9jb21tZW50ID0gZnVuY3Rpb24oc3RhcnRfcG9zKSB7IC8vZnVuY3Rpb24gdG8gcmV0dXJuIGNvbW1lbnQgY29udGVudCBpbiBpdHMgZW50aXJldHlcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIHdpbGwgaGF2ZSB2ZXJ5IHBvb3IgcGVyZiwgYnV0IHdpbGwgd29yayBmb3Igbm93LlxuICAgICAgICAgICAgICAgIHZhciBjb21tZW50ID0gJycsXG4gICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICc+JyxcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wb3MgPSBzdGFydF9wb3M7XG4gICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICB0aGlzLnBvcysrO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRoaXMucG9zIDw9IHRoaXMuaW5wdXQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgKz0gaW5wdXRfY2hhcjtcblxuICAgICAgICAgICAgICAgICAgICAvLyBvbmx5IG5lZWQgdG8gY2hlY2sgZm9yIHRoZSBkZWxpbWl0ZXIgaWYgdGhlIGxhc3QgY2hhcnMgbWF0Y2hcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnRbY29tbWVudC5sZW5ndGggLSAxXSA9PT0gZGVsaW1pdGVyW2RlbGltaXRlci5sZW5ndGggLSAxXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudC5pbmRleE9mKGRlbGltaXRlcikgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIG9ubHkgbmVlZCB0byBzZWFyY2ggZm9yIGN1c3RvbSBkZWxpbWl0ZXIgZm9yIHRoZSBmaXJzdCBmZXcgY2hhcmFjdGVyc1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoZWQgJiYgY29tbWVudC5sZW5ndGggPCAxMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbW1lbnQuaW5kZXhPZignPCFbaWYnKSA9PT0gMCkgeyAvL3BlZWsgZm9yIDwhW2lmIGNvbmRpdGlvbmFsIGNvbW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxpbWl0ZXIgPSAnPCFbZW5kaWZdPic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1lbnQuaW5kZXhPZignPCFbY2RhdGFbJykgPT09IDApIHsgLy9pZiBpdCdzIGEgPFtjZGF0YVsgY29tbWVudC4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICddXT4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tZW50LmluZGV4T2YoJzwhWycpID09PSAwKSB7IC8vIHNvbWUgb3RoZXIgIVsgY29tbWVudD8gLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsaW1pdGVyID0gJ10+JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWVudC5pbmRleE9mKCc8IS0tJykgPT09IDApIHsgLy8gPCEtLSBjb21tZW50IC4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGltaXRlciA9ICctLT4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tbWVudDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X3VuZm9ybWF0dGVkID0gZnVuY3Rpb24oZGVsaW1pdGVyLCBvcmlnX3RhZykgeyAvL2Z1bmN0aW9uIHRvIHJldHVybiB1bmZvcm1hdHRlZCBjb250ZW50IGluIGl0cyBlbnRpcmV0eVxuXG4gICAgICAgICAgICAgICAgaWYgKG9yaWdfdGFnICYmIG9yaWdfdGFnLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihkZWxpbWl0ZXIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpbnB1dF9jaGFyID0gJyc7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSAnJztcbiAgICAgICAgICAgICAgICB2YXIgbWluX2luZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGRvIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wb3MgPj0gdGhpcy5pbnB1dC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5wdXRfY2hhciA9IHRoaXMuaW5wdXQuY2hhckF0KHRoaXMucG9zKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3MrKztcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5VdGlscy5pbl9hcnJheShpbnB1dF9jaGFyLCB0aGlzLlV0aWxzLndoaXRlc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnB1dF9jaGFyID09PSAnXFxuJyB8fCBpbnB1dF9jaGFyID09PSAnXFxyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgKz0gJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogIERvbid0IGNoYW5nZSB0YWIgaW5kZW50aW9uIGZvciB1bmZvcm1hdHRlZCBibG9ja3MuICBJZiB1c2luZyBjb2RlIGZvciBodG1sIGVkaXRpbmcsIHRoaXMgd2lsbCBncmVhdGx5IGFmZmVjdCA8cHJlPiB0YWdzIGlmIHRoZXkgYXJlIHNwZWNpZmllZCBpbiB0aGUgJ3VuZm9ybWF0dGVkIGFycmF5J1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTx0aGlzLmluZGVudF9sZXZlbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICBjb250ZW50ICs9IHRoaXMuaW5kZW50X3N0cmluZztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3BhY2UgPSBmYWxzZTsgLy8uLi5hbmQgbWFrZSBzdXJlIG90aGVyIGluZGVudGF0aW9uIGlzIGVyYXNlZFxuICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgKz0gaW5wdXRfY2hhcjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgc3BhY2UgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRlbnRfaGFuZGxlYmFycyAmJiBpbnB1dF9jaGFyID09PSAneycgJiYgY29udGVudC5sZW5ndGggJiYgY29udGVudFtjb250ZW50Lmxlbmd0aCAtIDJdID09PSAneycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhbmRsZWJhcnMgZXhwcmVzc2lvbnMgaW4gc3RyaW5ncyBzaG91bGQgYWxzbyBiZSB1bmZvcm1hdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgKz0gdGhpcy5nZXRfdW5mb3JtYXR0ZWQoJ319Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVzZSBleHByZXNzaW9ucyBhcmUgb3BhcXVlLiAgSWdub3JlIGRlbGltaXRlcnMgZm91bmQgaW4gdGhlbS5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbl9pbmRleCA9IGNvbnRlbnQubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAoY29udGVudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoZGVsaW1pdGVyLCBtaW5faW5kZXgpID09PSAtMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnQ7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdldF90b2tlbiA9IGZ1bmN0aW9uKCkgeyAvL2luaXRpYWwgaGFuZGxlciBmb3IgdG9rZW4tcmV0cmlldmFsXG4gICAgICAgICAgICAgICAgdmFyIHRva2VuO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdF90b2tlbiA9PT0gJ1RLX1RBR19TQ1JJUFQnIHx8IHRoaXMubGFzdF90b2tlbiA9PT0gJ1RLX1RBR19TVFlMRScpIHsgLy9jaGVjayBpZiB3ZSBuZWVkIHRvIGZvcm1hdCBqYXZhc2NyaXB0XG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gdGhpcy5sYXN0X3Rva2VuLnN1YnN0cig3KTtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmdldF9jb250ZW50c190byh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3Rva2VuLCAnVEtfJyArIHR5cGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50X21vZGUgPT09ICdDT05URU5UJykge1xuICAgICAgICAgICAgICAgICAgICB0b2tlbiA9IHRoaXMuZ2V0X2NvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbdG9rZW4sICdUS19DT05URU5UJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50X21vZGUgPT09ICdUQUcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuID0gdGhpcy5nZXRfdGFnKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdG9rZW4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW47XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnX25hbWVfdHlwZSA9ICdUS19UQUdfJyArIHRoaXMudGFnX3R5cGU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3Rva2VuLCB0YWdfbmFtZV90eXBlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0X2Z1bGxfaW5kZW50ID0gZnVuY3Rpb24obGV2ZWwpIHtcbiAgICAgICAgICAgICAgICBsZXZlbCA9IHRoaXMuaW5kZW50X2xldmVsICsgbGV2ZWwgfHwgMDtcbiAgICAgICAgICAgICAgICBpZiAobGV2ZWwgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkobGV2ZWwgKyAxKS5qb2luKHRoaXMuaW5kZW50X3N0cmluZyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmlzX3VuZm9ybWF0dGVkID0gZnVuY3Rpb24odGFnX2NoZWNrLCB1bmZvcm1hdHRlZCkge1xuICAgICAgICAgICAgICAgIC8vaXMgdGhpcyBhbiBIVE1MNSBibG9jay1sZXZlbCBsaW5rP1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5VdGlscy5pbl9hcnJheSh0YWdfY2hlY2ssIHVuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRhZ19jaGVjay50b0xvd2VyQ2FzZSgpICE9PSAnYScgfHwgIXRoaXMuVXRpbHMuaW5fYXJyYXkoJ2EnLCB1bmZvcm1hdHRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9hdCB0aGlzIHBvaW50IHdlIGhhdmUgYW4gIHRhZzsgaXMgaXRzIGZpcnN0IGNoaWxkIHNvbWV0aGluZyB3ZSB3YW50IHRvIHJlbWFpblxuICAgICAgICAgICAgICAgIC8vdW5mb3JtYXR0ZWQ/XG4gICAgICAgICAgICAgICAgdmFyIG5leHRfdGFnID0gdGhpcy5nZXRfdGFnKHRydWUgLyogcGVlay4gKi8gKTtcblxuICAgICAgICAgICAgICAgIC8vIHRlc3QgbmV4dF90YWcgdG8gc2VlIGlmIGl0IGlzIGp1c3QgaHRtbCB0YWcgKG5vIGV4dGVybmFsIGNvbnRlbnQpXG4gICAgICAgICAgICAgICAgdmFyIHRhZyA9IChuZXh0X3RhZyB8fCBcIlwiKS5tYXRjaCgvXlxccyo8XFxzKlxcLz8oW2Etel0qKVxccypbXj5dKj5cXHMqJC8pO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgbmV4dF90YWcgY29tZXMgYmFjayBidXQgaXMgbm90IGFuIGlzb2xhdGVkIHRhZywgdGhlblxuICAgICAgICAgICAgICAgIC8vIGxldCdzIHRyZWF0IHRoZSAnYScgdGFnIGFzIGhhdmluZyBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gYW5kIHJlc3BlY3QgdGhlIHVuZm9ybWF0dGVkIG9wdGlvblxuICAgICAgICAgICAgICAgIGlmICghdGFnIHx8IHRoaXMuVXRpbHMuaW5fYXJyYXkodGFnLCB1bmZvcm1hdHRlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMucHJpbnRlciA9IGZ1bmN0aW9uKGpzX3NvdXJjZSwgaW5kZW50X2NoYXJhY3RlciwgaW5kZW50X3NpemUsIHdyYXBfbGluZV9sZW5ndGgsIGJyYWNlX3N0eWxlKSB7IC8vaGFuZGxlcyBpbnB1dC9vdXRwdXQgYW5kIHNvbWUgb3RoZXIgcHJpbnRpbmcgZnVuY3Rpb25zXG5cbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0ID0ganNfc291cmNlIHx8ICcnOyAvL2dldHMgdGhlIGlucHV0IGZvciB0aGUgUGFyc2VyXG4gICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9jaGFyYWN0ZXIgPSBpbmRlbnRfY2hhcmFjdGVyO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X3N0cmluZyA9ICcnO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZW50X3NpemUgPSBpbmRlbnRfc2l6ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmJyYWNlX3N0eWxlID0gYnJhY2Vfc3R5bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMud3JhcF9saW5lX2xlbmd0aCA9IHdyYXBfbGluZV9sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lX2NoYXJfY291bnQgPSAwOyAvL2NvdW50IHRvIHNlZSBpZiB3cmFwX2xpbmVfbGVuZ3RoIHdhcyBleGNlZWRlZFxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluZGVudF9zaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfc3RyaW5nICs9IHRoaXMuaW5kZW50X2NoYXJhY3RlcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUgPSBmdW5jdGlvbihmb3JjZSwgYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhcnIgfHwgIWFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZm9yY2UgfHwgKGFyclthcnIubGVuZ3RoIC0gMV0gIT09ICdcXG4nKSkgeyAvL3dlIG1pZ2h0IHdhbnQgdGhlIGV4dHJhIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyci5wdXNoKCdcXG4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByaW50X2luZGVudGF0aW9uID0gZnVuY3Rpb24oYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbmRlbnRfbGV2ZWw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyLnB1c2godGhpcy5pbmRlbnRfc3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGluZV9jaGFyX2NvdW50ICs9IHRoaXMuaW5kZW50X3N0cmluZy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludF90b2tlbiA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQgfHwgdGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dC5sZW5ndGggJiYgdGhpcy5vdXRwdXRbdGhpcy5vdXRwdXQubGVuZ3RoIC0gMV0gPT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludF9pbmRlbnRhdGlvbih0aGlzLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGx0cmltKHRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRfdG9rZW5fcmF3KHRleHQpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLnByaW50X3Rva2VuX3JhdyA9IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQgJiYgdGV4dCAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA+IDEgJiYgdGV4dFt0ZXh0Lmxlbmd0aCAtIDFdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVuZm9ybWF0dGVkIHRhZ3MgY2FuIGdyYWIgbmV3bGluZXMgYXMgdGhlaXIgbGFzdCBjaGFyYWN0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5wdXNoKHRleHQuc2xpY2UoMCwgLTEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUoZmFsc2UsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdGhpcy5uZXdsaW5lczsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50X25ld2xpbmUobiA+IDAsIHRoaXMub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5ld2xpbmVzID0gMDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy5pbmRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRlbnRfbGV2ZWwrKztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdGhpcy51bmluZGVudCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5pbmRlbnRfbGV2ZWwgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGVudF9sZXZlbC0tO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qX19fX19fX19fX19fX19fX19fX19fLS0tLS0tLS0tLS0tLS0tLS0tLS1fX19fX19fX19fX19fX19fX19fX18qL1xuXG4gICAgICAgIG11bHRpX3BhcnNlciA9IG5ldyBQYXJzZXIoKTsgLy93cmFwcGluZyBmdW5jdGlvbnMgUGFyc2VyXG4gICAgICAgIG11bHRpX3BhcnNlci5wcmludGVyKGh0bWxfc291cmNlLCBpbmRlbnRfY2hhcmFjdGVyLCBpbmRlbnRfc2l6ZSwgd3JhcF9saW5lX2xlbmd0aCwgYnJhY2Vfc3R5bGUpOyAvL2luaXRpYWxpemUgc3RhcnRpbmcgdmFsdWVzXG5cbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciB0ID0gbXVsdGlfcGFyc2VyLmdldF90b2tlbigpO1xuICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnRva2VuX3RleHQgPSB0WzBdO1xuICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPSB0WzFdO1xuXG4gICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPT09ICdUS19FT0YnKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN3aXRjaCAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdUS19UQUdfU1RBUlQnOlxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZShmYWxzZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIuaW5kZW50X2NvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5pbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5pbmRlbnRfY29udGVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5jdXJyZW50X21vZGUgPSAnQ09OVEVOVCc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1RLX1RBR19TVFlMRSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX1NDUklQVCc6XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF9uZXdsaW5lKGZhbHNlLCBtdWx0aV9wYXJzZXIub3V0cHV0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX0VORCc6XG4gICAgICAgICAgICAgICAgICAgIC8vUHJpbnQgbmV3IGxpbmUgb25seSBpZiB0aGUgdGFnIGhhcyBubyBjb250ZW50IGFuZCBoYXMgY2hpbGRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci5sYXN0X3Rva2VuID09PSAnVEtfQ09OVEVOVCcgJiYgbXVsdGlfcGFyc2VyLmxhc3RfdGV4dCA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWdfbmFtZSA9IG11bHRpX3BhcnNlci50b2tlbl90ZXh0Lm1hdGNoKC9cXHcrLylbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnX2V4dHJhY3RlZF9mcm9tX2xhc3Rfb3V0cHV0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIub3V0cHV0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19leHRyYWN0ZWRfZnJvbV9sYXN0X291dHB1dCA9IG11bHRpX3BhcnNlci5vdXRwdXRbbXVsdGlfcGFyc2VyLm91dHB1dC5sZW5ndGggLSAxXS5tYXRjaCgvKD86PHx7eyMpXFxzKihcXHcrKS8pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhZ19leHRyYWN0ZWRfZnJvbV9sYXN0X291dHB1dCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ19leHRyYWN0ZWRfZnJvbV9sYXN0X291dHB1dFsxXSAhPT0gdGFnX25hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZShmYWxzZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdDT05URU5UJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfVEFHX1NJTkdMRSc6XG4gICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGFkZCBhIG5ld2xpbmUgYmVmb3JlIGVsZW1lbnRzIHRoYXQgc2hvdWxkIHJlbWFpbiB1bmZvcm1hdHRlZC5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ19jaGVjayA9IG11bHRpX3BhcnNlci50b2tlbl90ZXh0Lm1hdGNoKC9eXFxzKjwoW2Etel0rKS9pKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0YWdfY2hlY2sgfHwgIW11bHRpX3BhcnNlci5VdGlscy5pbl9hcnJheSh0YWdfY2hlY2tbMV0sIHVuZm9ybWF0dGVkKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUoZmFsc2UsIG11bHRpX3BhcnNlci5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbihtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5jdXJyZW50X21vZGUgPSAnQ09OVEVOVCc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1RLX1RBR19IQU5ETEVCQVJTX0VMU0UnOlxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfdG9rZW4obXVsdGlfcGFyc2VyLnRva2VuX3RleHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobXVsdGlfcGFyc2VyLmluZGVudF9jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuaW5kZW50X2NvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIuY3VycmVudF9tb2RlID0gJ0NPTlRFTlQnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19DT05URU5UJzpcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X3Rva2VuKG11bHRpX3BhcnNlci50b2tlbl90ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdUQUcnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdUS19TVFlMRSc6XG4gICAgICAgICAgICAgICAgY2FzZSAnVEtfU0NSSVBUJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpX3BhcnNlci50b2tlbl90ZXh0ICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLnByaW50X25ld2xpbmUoZmFsc2UsIG11bHRpX3BhcnNlci5vdXRwdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRleHQgPSBtdWx0aV9wYXJzZXIudG9rZW5fdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYmVhdXRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRfaW5kZW50X2xldmVsID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aV9wYXJzZXIudG9rZW5fdHlwZSA9PT0gJ1RLX1NDUklQVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYmVhdXRpZmllciA9IHR5cGVvZiBqc19iZWF1dGlmeSA9PT0gJ2Z1bmN0aW9uJyAmJiBqc19iZWF1dGlmeTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobXVsdGlfcGFyc2VyLnRva2VuX3R5cGUgPT09ICdUS19TVFlMRScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYmVhdXRpZmllciA9IHR5cGVvZiBjc3NfYmVhdXRpZnkgPT09ICdmdW5jdGlvbicgJiYgY3NzX2JlYXV0aWZ5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5pbmRlbnRfc2NyaXB0cyA9PT0gXCJrZWVwXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRfaW5kZW50X2xldmVsID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pbmRlbnRfc2NyaXB0cyA9PT0gXCJzZXBhcmF0ZVwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0X2luZGVudF9sZXZlbCA9IC1tdWx0aV9wYXJzZXIuaW5kZW50X2xldmVsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZW50YXRpb24gPSBtdWx0aV9wYXJzZXIuZ2V0X2Z1bGxfaW5kZW50KHNjcmlwdF9pbmRlbnRfbGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF9iZWF1dGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2FsbCB0aGUgQmVhdXRpZmllciBpZiBhdmFsaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gX2JlYXV0aWZpZXIodGV4dC5yZXBsYWNlKC9eXFxzKi8sIGluZGVudGF0aW9uKSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbXBseSBpbmRlbnQgdGhlIHN0cmluZyBvdGhlcndpc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgd2hpdGUgPSB0ZXh0Lm1hdGNoKC9eXFxzKi8pWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBfbGV2ZWwgPSB3aGl0ZS5tYXRjaCgvW15cXG5cXHJdKiQvKVswXS5zcGxpdChtdWx0aV9wYXJzZXIuaW5kZW50X3N0cmluZykubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVpbmRlbnQgPSBtdWx0aV9wYXJzZXIuZ2V0X2Z1bGxfaW5kZW50KHNjcmlwdF9pbmRlbnRfbGV2ZWwgLSBfbGV2ZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoL15cXHMqLywgaW5kZW50YXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHJcXG58XFxyfFxcbi9nLCAnXFxuJyArIHJlaW5kZW50KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpX3BhcnNlci5wcmludF90b2tlbl9yYXcoaW5kZW50YXRpb24gKyB0cmltKHRleHQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aV9wYXJzZXIucHJpbnRfbmV3bGluZShmYWxzZSwgbXVsdGlfcGFyc2VyLm91dHB1dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbXVsdGlfcGFyc2VyLmN1cnJlbnRfbW9kZSA9ICdUQUcnO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG11bHRpX3BhcnNlci5sYXN0X3Rva2VuID0gbXVsdGlfcGFyc2VyLnRva2VuX3R5cGU7XG4gICAgICAgICAgICBtdWx0aV9wYXJzZXIubGFzdF90ZXh0ID0gbXVsdGlfcGFyc2VyLnRva2VuX3RleHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG11bHRpX3BhcnNlci5vdXRwdXQuam9pbignJyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBBTUQgKCBodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EI2RlZmluZWFtZC1wcm9wZXJ0eS0gKVxuICAgICAgICBkZWZpbmUoW1wicmVxdWlyZVwiLCBcIi4vYmVhdXRpZnlcIiwgXCIuL2JlYXV0aWZ5LWNzc1wiXSwgZnVuY3Rpb24ocmVxdWlyZWFtZCkge1xuICAgICAgICAgICAgdmFyIGpzX2JlYXV0aWZ5ID0gIHJlcXVpcmVhbWQoXCIuL2JlYXV0aWZ5XCIpO1xuICAgICAgICAgICAgdmFyIGNzc19iZWF1dGlmeSA9ICByZXF1aXJlYW1kKFwiLi9iZWF1dGlmeS1jc3NcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGh0bWxfYmVhdXRpZnk6IGZ1bmN0aW9uKGh0bWxfc291cmNlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIGpzX2JlYXV0aWZ5LmpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnkuY3NzX2JlYXV0aWZ5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBBZGQgc3VwcG9ydCBmb3IgQ29tbW9uSlMuIEp1c3QgcHV0IHRoaXMgZmlsZSBzb21ld2hlcmUgb24geW91ciByZXF1aXJlLnBhdGhzXG4gICAgICAgIC8vIGFuZCB5b3Ugd2lsbCBiZSBhYmxlIHRvIGB2YXIgaHRtbF9iZWF1dGlmeSA9IHJlcXVpcmUoXCJiZWF1dGlmeVwiKS5odG1sX2JlYXV0aWZ5YC5cbiAgICAgICAgdmFyIGpzX2JlYXV0aWZ5ID0gcmVxdWlyZSgnLi9iZWF1dGlmeS5qcycpO1xuICAgICAgICB2YXIgY3NzX2JlYXV0aWZ5ID0gcmVxdWlyZSgnLi9iZWF1dGlmeS1jc3MuanMnKTtcblxuICAgICAgICBleHBvcnRzLmh0bWxfYmVhdXRpZnkgPSBmdW5jdGlvbihodG1sX3NvdXJjZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIGpzX2JlYXV0aWZ5LmpzX2JlYXV0aWZ5LCBjc3NfYmVhdXRpZnkuY3NzX2JlYXV0aWZ5KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UncmUgcnVubmluZyBhIHdlYiBwYWdlIGFuZCBkb24ndCBoYXZlIGVpdGhlciBvZiB0aGUgYWJvdmUsIGFkZCBvdXIgb25lIGdsb2JhbFxuICAgICAgICB3aW5kb3cuaHRtbF9iZWF1dGlmeSA9IGZ1bmN0aW9uKGh0bWxfc291cmNlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gc3R5bGVfaHRtbChodG1sX3NvdXJjZSwgb3B0aW9ucywgd2luZG93LmpzX2JlYXV0aWZ5LCB3aW5kb3cuY3NzX2JlYXV0aWZ5KTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gSWYgd2UgZG9uJ3QgZXZlbiBoYXZlIHdpbmRvdywgdHJ5IGdsb2JhbC5cbiAgICAgICAgZ2xvYmFsLmh0bWxfYmVhdXRpZnkgPSBmdW5jdGlvbihodG1sX3NvdXJjZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHN0eWxlX2h0bWwoaHRtbF9zb3VyY2UsIG9wdGlvbnMsIGdsb2JhbC5qc19iZWF1dGlmeSwgZ2xvYmFsLmNzc19iZWF1dGlmeSk7XG4gICAgICAgIH07XG4gICAgfVxuXG59KCkpO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qanNoaW50IGN1cmx5OnRydWUsIGVxZXFlcTp0cnVlLCBsYXhicmVhazp0cnVlLCBub2VtcHR5OmZhbHNlICovXG4vKlxuXG4gIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4gIENvcHlyaWdodCAoYykgMjAwNy0yMDEzIEVpbmFyIExpZWxtYW5pcyBhbmQgY29udHJpYnV0b3JzLlxuXG4gIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uXG4gIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzXG4gICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbixcbiAgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSxcbiAgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSxcbiAgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbyxcbiAgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cbiAgVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmVcbiAgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiAgVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbiAgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4gIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EXG4gIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlNcbiAgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4gIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOXG4gIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAgU09GVFdBUkUuXG5cbiBKUyBCZWF1dGlmaWVyXG4tLS0tLS0tLS0tLS0tLS1cblxuXG4gIFdyaXR0ZW4gYnkgRWluYXIgTGllbG1hbmlzLCA8ZWluYXJAanNiZWF1dGlmaWVyLm9yZz5cbiAgICAgIGh0dHA6Ly9qc2JlYXV0aWZpZXIub3JnL1xuXG4gIE9yaWdpbmFsbHkgY29udmVydGVkIHRvIGphdmFzY3JpcHQgYnkgVml0YWwsIDx2aXRhbDc2QGdtYWlsLmNvbT5cbiAgXCJFbmQgYnJhY2VzIG9uIG93biBsaW5lXCIgYWRkZWQgYnkgQ2hyaXMgSi4gU2h1bGwsIDxjaHJpc2pzaHVsbEBnbWFpbC5jb20+XG4gIFBhcnNpbmcgaW1wcm92ZW1lbnRzIGZvciBicmFjZS1sZXNzIHN0YXRlbWVudHMgYnkgTGlhbSBOZXdtYW4gPGJpdHdpc2VtYW5AZ21haWwuY29tPlxuXG5cbiAgVXNhZ2U6XG4gICAganNfYmVhdXRpZnkoanNfc291cmNlX3RleHQpO1xuICAgIGpzX2JlYXV0aWZ5KGpzX3NvdXJjZV90ZXh0LCBvcHRpb25zKTtcblxuICBUaGUgb3B0aW9ucyBhcmU6XG4gICAgaW5kZW50X3NpemUgKGRlZmF1bHQgNCkgICAgICAgICAgLSBpbmRlbnRhdGlvbiBzaXplLFxuICAgIGluZGVudF9jaGFyIChkZWZhdWx0IHNwYWNlKSAgICAgIC0gY2hhcmFjdGVyIHRvIGluZGVudCB3aXRoLFxuICAgIHByZXNlcnZlX25ld2xpbmVzIChkZWZhdWx0IHRydWUpIC0gd2hldGhlciBleGlzdGluZyBsaW5lIGJyZWFrcyBzaG91bGQgYmUgcHJlc2VydmVkLFxuICAgIG1heF9wcmVzZXJ2ZV9uZXdsaW5lcyAoZGVmYXVsdCB1bmxpbWl0ZWQpIC0gbWF4aW11bSBudW1iZXIgb2YgbGluZSBicmVha3MgdG8gYmUgcHJlc2VydmVkIGluIG9uZSBjaHVuayxcblxuICAgIGpzbGludF9oYXBweSAoZGVmYXVsdCBmYWxzZSkgLSBpZiB0cnVlLCB0aGVuIGpzbGludC1zdHJpY3RlciBtb2RlIGlzIGVuZm9yY2VkLlxuXG4gICAgICAgICAgICBqc2xpbnRfaGFwcHkgICAhanNsaW50X2hhcHB5XG4gICAgICAgICAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgICBmdW5jdGlvbiAoKSAgICAgIGZ1bmN0aW9uKClcblxuICAgIGJyYWNlX3N0eWxlIChkZWZhdWx0IFwiY29sbGFwc2VcIikgLSBcImNvbGxhcHNlXCIgfCBcImV4cGFuZFwiIHwgXCJlbmQtZXhwYW5kXCJcbiAgICAgICAgICAgIHB1dCBicmFjZXMgb24gdGhlIHNhbWUgbGluZSBhcyBjb250cm9sIHN0YXRlbWVudHMgKGRlZmF1bHQpLCBvciBwdXQgYnJhY2VzIG9uIG93biBsaW5lIChBbGxtYW4gLyBBTlNJIHN0eWxlKSwgb3IganVzdCBwdXQgZW5kIGJyYWNlcyBvbiBvd24gbGluZS5cblxuICAgIHNwYWNlX2JlZm9yZV9jb25kaXRpb25hbCAoZGVmYXVsdCB0cnVlKSAtIHNob3VsZCB0aGUgc3BhY2UgYmVmb3JlIGNvbmRpdGlvbmFsIHN0YXRlbWVudCBiZSBhZGRlZCwgXCJpZih0cnVlKVwiIHZzIFwiaWYgKHRydWUpXCIsXG5cbiAgICB1bmVzY2FwZV9zdHJpbmdzIChkZWZhdWx0IGZhbHNlKSAtIHNob3VsZCBwcmludGFibGUgY2hhcmFjdGVycyBpbiBzdHJpbmdzIGVuY29kZWQgaW4gXFx4Tk4gbm90YXRpb24gYmUgdW5lc2NhcGVkLCBcImV4YW1wbGVcIiB2cyBcIlxceDY1XFx4NzhcXHg2MVxceDZkXFx4NzBcXHg2Y1xceDY1XCJcblxuICAgIHdyYXBfbGluZV9sZW5ndGggKGRlZmF1bHQgdW5saW1pdGVkKSAtIGxpbmVzIHNob3VsZCB3cmFwIGF0IG5leHQgb3Bwb3J0dW5pdHkgYWZ0ZXIgdGhpcyBudW1iZXIgb2YgY2hhcmFjdGVycy5cbiAgICAgICAgICBOT1RFOiBUaGlzIGlzIG5vdCBhIGhhcmQgbGltaXQuIExpbmVzIHdpbGwgY29udGludWUgdW50aWwgYSBwb2ludCB3aGVyZSBhIG5ld2xpbmUgd291bGRcbiAgICAgICAgICAgICAgICBiZSBwcmVzZXJ2ZWQgaWYgaXQgd2VyZSBwcmVzZW50LlxuXG4gICAgZS5nXG5cbiAgICBqc19iZWF1dGlmeShqc19zb3VyY2VfdGV4dCwge1xuICAgICAgJ2luZGVudF9zaXplJzogMSxcbiAgICAgICdpbmRlbnRfY2hhcic6ICdcXHQnXG4gICAgfSk7XG5cbiovXG5cbihmdW5jdGlvbigpIHtcblxuICAgIHZhciBhY29ybiA9IHt9O1xuICAgIChmdW5jdGlvbiAoZXhwb3J0cykge1xuICAgICAgLy8gVGhpcyBzZWN0aW9uIG9mIGNvZGUgaXMgdGFrZW4gZnJvbSBhY29ybi5cbiAgICAgIC8vXG4gICAgICAvLyBBY29ybiB3YXMgd3JpdHRlbiBieSBNYXJpam4gSGF2ZXJiZWtlIGFuZCByZWxlYXNlZCB1bmRlciBhbiBNSVRcbiAgICAgIC8vIGxpY2Vuc2UuIFRoZSBVbmljb2RlIHJlZ2V4cHMgKGZvciBpZGVudGlmaWVycyBhbmQgd2hpdGVzcGFjZSkgd2VyZVxuICAgICAgLy8gdGFrZW4gZnJvbSBbRXNwcmltYV0oaHR0cDovL2VzcHJpbWEub3JnKSBieSBBcml5YSBIaWRheWF0LlxuICAgICAgLy9cbiAgICAgIC8vIEdpdCByZXBvc2l0b3JpZXMgZm9yIEFjb3JuIGFyZSBhdmFpbGFibGUgYXRcbiAgICAgIC8vXG4gICAgICAvLyAgICAgaHR0cDovL21hcmlqbmhhdmVyYmVrZS5ubC9naXQvYWNvcm5cbiAgICAgIC8vICAgICBodHRwczovL2dpdGh1Yi5jb20vbWFyaWpuaC9hY29ybi5naXRcblxuICAgICAgLy8gIyMgQ2hhcmFjdGVyIGNhdGVnb3JpZXNcblxuICAgICAgLy8gQmlnIHVnbHkgcmVndWxhciBleHByZXNzaW9ucyB0aGF0IG1hdGNoIGNoYXJhY3RlcnMgaW4gdGhlXG4gICAgICAvLyB3aGl0ZXNwYWNlLCBpZGVudGlmaWVyLCBhbmQgaWRlbnRpZmllci1zdGFydCBjYXRlZ29yaWVzLiBUaGVzZVxuICAgICAgLy8gYXJlIG9ubHkgYXBwbGllZCB3aGVuIGEgY2hhcmFjdGVyIGlzIGZvdW5kIHRvIGFjdHVhbGx5IGhhdmUgYVxuICAgICAgLy8gY29kZSBwb2ludCBhYm92ZSAxMjguXG5cbiAgICAgIHZhciBub25BU0NJSXdoaXRlc3BhY2UgPSAvW1xcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1ZmVmZl0vO1xuICAgICAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgPSBcIlxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1ZDAtXFx1MDVlYVxcdTA1ZjAtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzZFxcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYxXFx1MGI3MVxcdTBiODNcXHUwYjg1LVxcdTBiOGFcXHUwYjhlLVxcdTBiOTBcXHUwYjkyLVxcdTBiOTVcXHUwYjk5XFx1MGI5YVxcdTBiOWNcXHUwYjllXFx1MGI5ZlxcdTBiYTNcXHUwYmE0XFx1MGJhOC1cXHUwYmFhXFx1MGJhZS1cXHUwYmI5XFx1MGJkMFxcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2RcXHUwYzU4XFx1MGM1OVxcdTBjNjBcXHUwYzYxXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNS1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDYwXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWMxLVxcdTE5YzdcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRiXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjFcXHUxY2Y1XFx1MWNmNlxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEyZFxcdTIxMmYtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjMmVcXHUyYzMwLVxcdTJjNWVcXHUyYzYwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDlkLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmRcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmFcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYjVcXHU0ZTAwLVxcdTlmY2NcXHVhMDAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5N1xcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOTBhLVxcdWE5MjVcXHVhOTMwLVxcdWE5NDZcXHVhOTYwLVxcdWE5N2NcXHVhOTg0LVxcdWE5YjJcXHVhOWNmXFx1YWEwMC1cXHVhYTI4XFx1YWE0MC1cXHVhYTQyXFx1YWE0NC1cXHVhYTRiXFx1YWE2MC1cXHVhYTc2XFx1YWE3YVxcdWFhODAtXFx1YWFhZlxcdWFhYjFcXHVhYWI1XFx1YWFiNlxcdWFhYjktXFx1YWFiZFxcdWFhYzBcXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVhXFx1YWFmMi1cXHVhYWY0XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmUyXFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZFxcdWZiMWYtXFx1ZmIyOFxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwXFx1ZmI0MVxcdWZiNDNcXHVmYjQ0XFx1ZmI0Ni1cXHVmYmIxXFx1ZmJkMy1cXHVmZDNkXFx1ZmQ1MC1cXHVmZDhmXFx1ZmQ5Mi1cXHVmZGM3XFx1ZmRmMC1cXHVmZGZiXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYyMS1cXHVmZjNhXFx1ZmY0MS1cXHVmZjVhXFx1ZmY2Ni1cXHVmZmJlXFx1ZmZjMi1cXHVmZmM3XFx1ZmZjYS1cXHVmZmNmXFx1ZmZkMi1cXHVmZmQ3XFx1ZmZkYS1cXHVmZmRjXCI7XG4gICAgICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgPSBcIlxcdTAzMDAtXFx1MDM2ZlxcdTA0ODMtXFx1MDQ4N1xcdTA1OTEtXFx1MDViZFxcdTA1YmZcXHUwNWMxXFx1MDVjMlxcdTA1YzRcXHUwNWM1XFx1MDVjN1xcdTA2MTAtXFx1MDYxYVxcdTA2MjAtXFx1MDY0OVxcdTA2NzItXFx1MDZkM1xcdTA2ZTctXFx1MDZlOFxcdTA2ZmItXFx1MDZmY1xcdTA3MzAtXFx1MDc0YVxcdTA4MDAtXFx1MDgxNFxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NDAtXFx1MDg1N1xcdTA4ZTQtXFx1MDhmZVxcdTA5MDAtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjItXFx1MDk2M1xcdTA5NjYtXFx1MDk2ZlxcdTA5ODEtXFx1MDk4M1xcdTA5YmNcXHUwOWJlLVxcdTA5YzRcXHUwOWM3XFx1MDljOFxcdTA5ZDdcXHUwOWRmLVxcdTA5ZTBcXHUwYTAxLVxcdTBhMDNcXHUwYTNjXFx1MGEzZS1cXHUwYTQyXFx1MGE0N1xcdTBhNDhcXHUwYTRiLVxcdTBhNGRcXHUwYTUxXFx1MGE2Ni1cXHUwYTcxXFx1MGE3NVxcdTBhODEtXFx1MGE4M1xcdTBhYmNcXHUwYWJlLVxcdTBhYzVcXHUwYWM3LVxcdTBhYzlcXHUwYWNiLVxcdTBhY2RcXHUwYWUyLVxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNWYtXFx1MGI2MFxcdTBiNjYtXFx1MGI2ZlxcdTBiODJcXHUwYmJlLVxcdTBiYzJcXHUwYmM2LVxcdTBiYzhcXHUwYmNhLVxcdTBiY2RcXHUwYmQ3XFx1MGJlNi1cXHUwYmVmXFx1MGMwMS1cXHUwYzAzXFx1MGM0Ni1cXHUwYzQ4XFx1MGM0YS1cXHUwYzRkXFx1MGM1NVxcdTBjNTZcXHUwYzYyLVxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgyXFx1MGM4M1xcdTBjYmNcXHUwY2JlLVxcdTBjYzRcXHUwY2M2LVxcdTBjYzhcXHUwY2NhLVxcdTBjY2RcXHUwY2Q1XFx1MGNkNlxcdTBjZTItXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBkMDJcXHUwZDAzXFx1MGQ0Ni1cXHUwZDQ4XFx1MGQ1N1xcdTBkNjItXFx1MGQ2M1xcdTBkNjYtXFx1MGQ2ZlxcdTBkODJcXHUwZDgzXFx1MGRjYVxcdTBkY2YtXFx1MGRkNFxcdTBkZDZcXHUwZGQ4LVxcdTBkZGZcXHUwZGYyXFx1MGRmM1xcdTBlMzQtXFx1MGUzYVxcdTBlNDAtXFx1MGU0NVxcdTBlNTAtXFx1MGU1OVxcdTBlYjQtXFx1MGViOVxcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGY0MS1cXHUwZjQ3XFx1MGY3MS1cXHUwZjg0XFx1MGY4Ni1cXHUwZjg3XFx1MGY4ZC1cXHUwZjk3XFx1MGY5OS1cXHUwZmJjXFx1MGZjNlxcdTEwMDAtXFx1MTAyOVxcdTEwNDAtXFx1MTA0OVxcdTEwNjctXFx1MTA2ZFxcdTEwNzEtXFx1MTA3NFxcdTEwODItXFx1MTA4ZFxcdTEwOGYtXFx1MTA5ZFxcdTEzNWQtXFx1MTM1ZlxcdTE3MGUtXFx1MTcxMFxcdTE3MjAtXFx1MTczMFxcdTE3NDAtXFx1MTc1MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN2IyXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE5MjAtXFx1MTkyYlxcdTE5MzAtXFx1MTkzYlxcdTE5NTEtXFx1MTk2ZFxcdTE5YjAtXFx1MTljMFxcdTE5YzgtXFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMDAtXFx1MWExNVxcdTFhMjAtXFx1MWE1M1xcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFiNDYtXFx1MWI0YlxcdTFiNTAtXFx1MWI1OVxcdTFiNmItXFx1MWI3M1xcdTFiYjAtXFx1MWJiOVxcdTFiZTYtXFx1MWJmM1xcdTFjMDAtXFx1MWMyMlxcdTFjNDAtXFx1MWM0OVxcdTFjNWItXFx1MWM3ZFxcdTFjZDAtXFx1MWNkMlxcdTFkMDAtXFx1MWRiZVxcdTFlMDEtXFx1MWYxNVxcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjBkMC1cXHUyMGRjXFx1MjBlMVxcdTIwZTUtXFx1MjBmMFxcdTJkODEtXFx1MmQ5NlxcdTJkZTAtXFx1MmRmZlxcdTMwMjEtXFx1MzAyOFxcdTMwOTlcXHUzMDlhXFx1YTY0MC1cXHVhNjZkXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZlxcdWE2ZjAtXFx1YTZmMVxcdWE3ZjgtXFx1YTgwMFxcdWE4MDZcXHVhODBiXFx1YTgyMy1cXHVhODI3XFx1YTg4MC1cXHVhODgxXFx1YThiNC1cXHVhOGM0XFx1YThkMC1cXHVhOGQ5XFx1YThmMy1cXHVhOGY3XFx1YTkwMC1cXHVhOTA5XFx1YTkyNi1cXHVhOTJkXFx1YTkzMC1cXHVhOTQ1XFx1YTk4MC1cXHVhOTgzXFx1YTliMy1cXHVhOWMwXFx1YWEwMC1cXHVhYTI3XFx1YWE0MC1cXHVhYTQxXFx1YWE0Yy1cXHVhYTRkXFx1YWE1MC1cXHVhYTU5XFx1YWE3YlxcdWFhZTAtXFx1YWFlOVxcdWFhZjItXFx1YWFmM1xcdWFiYzAtXFx1YWJlMVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1ZmIyMC1cXHVmYjI4XFx1ZmUwMC1cXHVmZTBmXFx1ZmUyMC1cXHVmZTI2XFx1ZmUzM1xcdWZlMzRcXHVmZTRkLVxcdWZlNGZcXHVmZjEwLVxcdWZmMTlcXHVmZjNmXCI7XG4gICAgICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIFwiXVwiKTtcbiAgICAgIHZhciBub25BU0NJSWlkZW50aWZpZXIgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzICsgXCJdXCIpO1xuXG4gICAgICAvLyBXaGV0aGVyIGEgc2luZ2xlIGNoYXJhY3RlciBkZW5vdGVzIGEgbmV3bGluZS5cblxuICAgICAgdmFyIG5ld2xpbmUgPSAvW1xcblxcclxcdTIwMjhcXHUyMDI5XS87XG5cbiAgICAgIC8vIE1hdGNoZXMgYSB3aG9sZSBsaW5lIGJyZWFrICh3aGVyZSBDUkxGIGlzIGNvbnNpZGVyZWQgYSBzaW5nbGVcbiAgICAgIC8vIGxpbmUgYnJlYWspLiBVc2VkIHRvIGNvdW50IGxpbmVzLlxuXG4gICAgICB2YXIgbGluZUJyZWFrID0gL1xcclxcbnxbXFxuXFxyXFx1MjAyOFxcdTIwMjldL2c7XG5cbiAgICAgIC8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBjb2RlIHN0YXJ0cyBhbiBpZGVudGlmaWVyLlxuXG4gICAgICB2YXIgaXNJZGVudGlmaWVyU3RhcnQgPSBleHBvcnRzLmlzSWRlbnRpZmllclN0YXJ0ID0gZnVuY3Rpb24oY29kZSkge1xuICAgICAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gY29kZSA9PT0gMzY7XG4gICAgICAgIGlmIChjb2RlIDwgOTEpIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgICAgIGlmIChjb2RlIDwgMTIzKXJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSk7XG4gICAgICB9O1xuXG4gICAgICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgaXMgcGFydCBvZiBhbiBpZGVudGlmaWVyLlxuXG4gICAgICB2YXIgaXNJZGVudGlmaWVyQ2hhciA9IGV4cG9ydHMuaXNJZGVudGlmaWVyQ2hhciA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgaWYgKGNvZGUgPCA0OCkgcmV0dXJuIGNvZGUgPT09IDM2O1xuICAgICAgICBpZiAoY29kZSA8IDU4KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKGNvZGUgPCA2NSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgICAgICBpZiAoY29kZSA8IDEyMylyZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXIudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKTtcbiAgICAgIH07XG4gICAgfSkoYWNvcm4pO1xuXG4gICAgZnVuY3Rpb24ganNfYmVhdXRpZnkoanNfc291cmNlX3RleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICAgIHZhciBiZWF1dGlmaWVyID0gbmV3IEJlYXV0aWZpZXIoanNfc291cmNlX3RleHQsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gYmVhdXRpZmllci5iZWF1dGlmeSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIEJlYXV0aWZpZXIoanNfc291cmNlX3RleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgICAgIHZhciBpbnB1dCwgb3V0cHV0X2xpbmVzO1xuICAgICAgICB2YXIgdG9rZW5fdGV4dCwgdG9rZW5fdHlwZSwgbGFzdF90eXBlLCBsYXN0X2xhc3RfdGV4dCwgaW5kZW50X3N0cmluZztcbiAgICAgICAgdmFyIGZsYWdzLCBwcmV2aW91c19mbGFncywgZmxhZ19zdG9yZTtcbiAgICAgICAgdmFyIHdoaXRlc3BhY2UsIHdvcmRjaGFyLCBwdW5jdCwgcGFyc2VyX3BvcywgbGluZV9zdGFydGVycywgcmVzZXJ2ZWRfd29yZHMsIGRpZ2l0cztcbiAgICAgICAgdmFyIHByZWZpeDtcbiAgICAgICAgdmFyIGlucHV0X3dhbnRlZF9uZXdsaW5lO1xuICAgICAgICB2YXIgb3V0cHV0X3dyYXBwZWQsIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW47XG4gICAgICAgIHZhciBpbnB1dF9sZW5ndGgsIG5fbmV3bGluZXMsIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuO1xuICAgICAgICB2YXIgaGFuZGxlcnMsIE1PREUsIG9wdDtcbiAgICAgICAgdmFyIHByZWluZGVudF9zdHJpbmcgPSAnJztcblxuXG5cbiAgICAgICAgd2hpdGVzcGFjZSA9IFwiXFxuXFxyXFx0IFwiLnNwbGl0KCcnKTtcbiAgICAgICAgd29yZGNoYXIgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODlfJCcuc3BsaXQoJycpO1xuICAgICAgICBkaWdpdHMgPSAnMDEyMzQ1Njc4OScuc3BsaXQoJycpO1xuXG4gICAgICAgIHB1bmN0ID0gJysgLSAqIC8gJSAmICsrIC0tID0gKz0gLT0gKj0gLz0gJT0gPT0gPT09ICE9ICE9PSA+IDwgPj0gPD0gPj4gPDwgPj4+ID4+Pj0gPj49IDw8PSAmJiAmPSB8IHx8ICEgLCA6ID8gXiBePSB8PSA6OiA9Pic7XG4gICAgICAgIHB1bmN0ICs9ICcgPCU9IDwlICU+IDw/PSA8PyA/Pic7IC8vIHRyeSB0byBiZSBhIGdvb2QgYm95IGFuZCB0cnkgbm90IHRvIGJyZWFrIHRoZSBtYXJrdXAgbGFuZ3VhZ2UgaWRlbnRpZmllcnNcbiAgICAgICAgcHVuY3QgPSBwdW5jdC5zcGxpdCgnICcpO1xuXG4gICAgICAgIC8vIHdvcmRzIHdoaWNoIHNob3VsZCBhbHdheXMgc3RhcnQgb24gbmV3IGxpbmUuXG4gICAgICAgIGxpbmVfc3RhcnRlcnMgPSAnY29udGludWUsdHJ5LHRocm93LHJldHVybix2YXIsbGV0LGNvbnN0LGlmLHN3aXRjaCxjYXNlLGRlZmF1bHQsZm9yLHdoaWxlLGJyZWFrLGZ1bmN0aW9uJy5zcGxpdCgnLCcpO1xuICAgICAgICByZXNlcnZlZF93b3JkcyA9IGxpbmVfc3RhcnRlcnMuY29uY2F0KFsnZG8nLCAnaW4nLCAnZWxzZScsICdnZXQnLCAnc2V0JywgJ25ldycsICdjYXRjaCcsICdmaW5hbGx5JywgJ3R5cGVvZiddKTtcblxuXG4gICAgICAgIE1PREUgPSB7XG4gICAgICAgICAgICBCbG9ja1N0YXRlbWVudDogJ0Jsb2NrU3RhdGVtZW50JywgLy8gJ0JMT0NLJ1xuICAgICAgICAgICAgU3RhdGVtZW50OiAnU3RhdGVtZW50JywgLy8gJ1NUQVRFTUVOVCdcbiAgICAgICAgICAgIE9iamVjdExpdGVyYWw6ICdPYmplY3RMaXRlcmFsJywgLy8gJ09CSkVDVCcsXG4gICAgICAgICAgICBBcnJheUxpdGVyYWw6ICdBcnJheUxpdGVyYWwnLCAvLydbRVhQUkVTU0lPTl0nLFxuICAgICAgICAgICAgRm9ySW5pdGlhbGl6ZXI6ICdGb3JJbml0aWFsaXplcicsIC8vJyhGT1ItRVhQUkVTU0lPTiknLFxuICAgICAgICAgICAgQ29uZGl0aW9uYWw6ICdDb25kaXRpb25hbCcsIC8vJyhDT05ELUVYUFJFU1NJT04pJyxcbiAgICAgICAgICAgIEV4cHJlc3Npb246ICdFeHByZXNzaW9uJyAvLycoRVhQUkVTU0lPTiknXG4gICAgICAgIH07XG5cbiAgICAgICAgaGFuZGxlcnMgPSB7XG4gICAgICAgICAgICAnVEtfU1RBUlRfRVhQUic6IGhhbmRsZV9zdGFydF9leHByLFxuICAgICAgICAgICAgJ1RLX0VORF9FWFBSJzogaGFuZGxlX2VuZF9leHByLFxuICAgICAgICAgICAgJ1RLX1NUQVJUX0JMT0NLJzogaGFuZGxlX3N0YXJ0X2Jsb2NrLFxuICAgICAgICAgICAgJ1RLX0VORF9CTE9DSyc6IGhhbmRsZV9lbmRfYmxvY2ssXG4gICAgICAgICAgICAnVEtfV09SRCc6IGhhbmRsZV93b3JkLFxuICAgICAgICAgICAgJ1RLX1JFU0VSVkVEJzogaGFuZGxlX3dvcmQsXG4gICAgICAgICAgICAnVEtfU0VNSUNPTE9OJzogaGFuZGxlX3NlbWljb2xvbixcbiAgICAgICAgICAgICdUS19TVFJJTkcnOiBoYW5kbGVfc3RyaW5nLFxuICAgICAgICAgICAgJ1RLX0VRVUFMUyc6IGhhbmRsZV9lcXVhbHMsXG4gICAgICAgICAgICAnVEtfT1BFUkFUT1InOiBoYW5kbGVfb3BlcmF0b3IsXG4gICAgICAgICAgICAnVEtfQ09NTUEnOiBoYW5kbGVfY29tbWEsXG4gICAgICAgICAgICAnVEtfQkxPQ0tfQ09NTUVOVCc6IGhhbmRsZV9ibG9ja19jb21tZW50LFxuICAgICAgICAgICAgJ1RLX0lOTElORV9DT01NRU5UJzogaGFuZGxlX2lubGluZV9jb21tZW50LFxuICAgICAgICAgICAgJ1RLX0NPTU1FTlQnOiBoYW5kbGVfY29tbWVudCxcbiAgICAgICAgICAgICdUS19ET1QnOiBoYW5kbGVfZG90LFxuICAgICAgICAgICAgJ1RLX1VOS05PV04nOiBoYW5kbGVfdW5rbm93blxuICAgICAgICB9O1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZV9mbGFncyhmbGFnc19iYXNlLCBtb2RlKSB7XG4gICAgICAgICAgICB2YXIgbmV4dF9pbmRlbnRfbGV2ZWwgPSAwO1xuICAgICAgICAgICAgaWYgKGZsYWdzX2Jhc2UpIHtcbiAgICAgICAgICAgICAgICBuZXh0X2luZGVudF9sZXZlbCA9IGZsYWdzX2Jhc2UuaW5kZW50YXRpb25fbGV2ZWw7XG4gICAgICAgICAgICAgICAgaWYgKCFqdXN0X2FkZGVkX25ld2xpbmUoKSAmJlxuICAgICAgICAgICAgICAgICAgICBmbGFnc19iYXNlLmxpbmVfaW5kZW50X2xldmVsID4gbmV4dF9pbmRlbnRfbGV2ZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dF9pbmRlbnRfbGV2ZWwgPSBmbGFnc19iYXNlLmxpbmVfaW5kZW50X2xldmVsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG5leHRfZmxhZ3MgPSB7XG4gICAgICAgICAgICAgICAgbW9kZTogbW9kZSxcbiAgICAgICAgICAgICAgICBwYXJlbnQ6IGZsYWdzX2Jhc2UsXG4gICAgICAgICAgICAgICAgbGFzdF90ZXh0OiBmbGFnc19iYXNlID8gZmxhZ3NfYmFzZS5sYXN0X3RleHQgOiAnJywgLy8gbGFzdCB0b2tlbiB0ZXh0XG4gICAgICAgICAgICAgICAgbGFzdF93b3JkOiBmbGFnc19iYXNlID8gZmxhZ3NfYmFzZS5sYXN0X3dvcmQgOiAnJywgLy8gbGFzdCAnVEtfV09SRCcgcGFzc2VkXG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb25fc3RhdGVtZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbl9hc3NpZ25tZW50OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBpbl9odG1sX2NvbW1lbnQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG11bHRpbGluZV9mcmFtZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgaWZfYmxvY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVsc2VfYmxvY2s6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGRvX2Jsb2NrOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkb193aGlsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgaW5fY2FzZV9zdGF0ZW1lbnQ6IGZhbHNlLCAvLyBzd2l0Y2goLi4peyBJTlNJREUgSEVSRSB9XG4gICAgICAgICAgICAgICAgaW5fY2FzZTogZmFsc2UsIC8vIHdlJ3JlIG9uIHRoZSBleGFjdCBsaW5lIHdpdGggXCJjYXNlIDA6XCJcbiAgICAgICAgICAgICAgICBjYXNlX2JvZHk6IGZhbHNlLCAvLyB0aGUgaW5kZW50ZWQgY2FzZS1hY3Rpb24gYmxvY2tcbiAgICAgICAgICAgICAgICBpbmRlbnRhdGlvbl9sZXZlbDogbmV4dF9pbmRlbnRfbGV2ZWwsXG4gICAgICAgICAgICAgICAgbGluZV9pbmRlbnRfbGV2ZWw6IGZsYWdzX2Jhc2UgPyBmbGFnc19iYXNlLmxpbmVfaW5kZW50X2xldmVsIDogbmV4dF9pbmRlbnRfbGV2ZWwsXG4gICAgICAgICAgICAgICAgc3RhcnRfbGluZV9pbmRleDogb3V0cHV0X2xpbmVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBoYWRfY29tbWVudDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdGVybmFyeV9kZXB0aDogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBuZXh0X2ZsYWdzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNpbmcgb2JqZWN0IGluc3RlYWQgb2Ygc3RyaW5nIHRvIGFsbG93IGZvciBsYXRlciBleHBhbnNpb24gb2YgaW5mbyBhYm91dCBlYWNoIGxpbmVcblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVfb3V0cHV0X2xpbmUoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHQ6IFtdXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU29tZSBpbnRlcnByZXRlcnMgaGF2ZSB1bmV4cGVjdGVkIHJlc3VsdHMgd2l0aCBmb28gPSBiYXogfHwgYmFyO1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgb3B0ID0ge307XG5cbiAgICAgICAgLy8gY29tcGF0aWJpbGl0eVxuICAgICAgICBpZiAob3B0aW9ucy5zcGFjZV9hZnRlcl9hbm9uX2Z1bmN0aW9uICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5qc2xpbnRfaGFwcHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3B0aW9ucy5qc2xpbnRfaGFwcHkgPSBvcHRpb25zLnNwYWNlX2FmdGVyX2Fub25fZnVuY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuYnJhY2VzX29uX293bl9saW5lICE9PSB1bmRlZmluZWQpIHsgLy9ncmFjZWZ1bCBoYW5kbGluZyBvZiBkZXByZWNhdGVkIG9wdGlvblxuICAgICAgICAgICAgb3B0LmJyYWNlX3N0eWxlID0gb3B0aW9ucy5icmFjZXNfb25fb3duX2xpbmUgPyBcImV4cGFuZFwiIDogXCJjb2xsYXBzZVwiO1xuICAgICAgICB9XG4gICAgICAgIG9wdC5icmFjZV9zdHlsZSA9IG9wdGlvbnMuYnJhY2Vfc3R5bGUgPyBvcHRpb25zLmJyYWNlX3N0eWxlIDogKG9wdC5icmFjZV9zdHlsZSA/IG9wdC5icmFjZV9zdHlsZSA6IFwiY29sbGFwc2VcIik7XG5cbiAgICAgICAgLy8gZ3JhY2VmdWwgaGFuZGxpbmcgb2YgZGVwcmVjYXRlZCBvcHRpb25cbiAgICAgICAgaWYgKG9wdC5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmQtc3RyaWN0XCIpIHtcbiAgICAgICAgICAgIG9wdC5icmFjZV9zdHlsZSA9IFwiZXhwYW5kXCI7XG4gICAgICAgIH1cblxuXG4gICAgICAgIG9wdC5pbmRlbnRfc2l6ZSA9IG9wdGlvbnMuaW5kZW50X3NpemUgPyBwYXJzZUludChvcHRpb25zLmluZGVudF9zaXplLCAxMCkgOiA0O1xuICAgICAgICBvcHQuaW5kZW50X2NoYXIgPSBvcHRpb25zLmluZGVudF9jaGFyID8gb3B0aW9ucy5pbmRlbnRfY2hhciA6ICcgJztcbiAgICAgICAgb3B0LnByZXNlcnZlX25ld2xpbmVzID0gKG9wdGlvbnMucHJlc2VydmVfbmV3bGluZXMgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5wcmVzZXJ2ZV9uZXdsaW5lcztcbiAgICAgICAgb3B0LmJyZWFrX2NoYWluZWRfbWV0aG9kcyA9IChvcHRpb25zLmJyZWFrX2NoYWluZWRfbWV0aG9kcyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy5icmVha19jaGFpbmVkX21ldGhvZHM7XG4gICAgICAgIG9wdC5tYXhfcHJlc2VydmVfbmV3bGluZXMgPSAob3B0aW9ucy5tYXhfcHJlc2VydmVfbmV3bGluZXMgPT09IHVuZGVmaW5lZCkgPyAwIDogcGFyc2VJbnQob3B0aW9ucy5tYXhfcHJlc2VydmVfbmV3bGluZXMsIDEwKTtcbiAgICAgICAgb3B0LnNwYWNlX2luX3BhcmVuID0gKG9wdGlvbnMuc3BhY2VfaW5fcGFyZW4gPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuc3BhY2VfaW5fcGFyZW47XG4gICAgICAgIG9wdC5zcGFjZV9pbl9lbXB0eV9wYXJlbiA9IChvcHRpb25zLnNwYWNlX2luX2VtcHR5X3BhcmVuID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLnNwYWNlX2luX2VtcHR5X3BhcmVuO1xuICAgICAgICBvcHQuanNsaW50X2hhcHB5ID0gKG9wdGlvbnMuanNsaW50X2hhcHB5ID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLmpzbGludF9oYXBweTtcbiAgICAgICAgb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24gPSAob3B0aW9ucy5rZWVwX2FycmF5X2luZGVudGF0aW9uID09PSB1bmRlZmluZWQpID8gZmFsc2UgOiBvcHRpb25zLmtlZXBfYXJyYXlfaW5kZW50YXRpb247XG4gICAgICAgIG9wdC5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWwgPSAob3B0aW9ucy5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWwgPT09IHVuZGVmaW5lZCkgPyB0cnVlIDogb3B0aW9ucy5zcGFjZV9iZWZvcmVfY29uZGl0aW9uYWw7XG4gICAgICAgIG9wdC51bmVzY2FwZV9zdHJpbmdzID0gKG9wdGlvbnMudW5lc2NhcGVfc3RyaW5ncyA9PT0gdW5kZWZpbmVkKSA/IGZhbHNlIDogb3B0aW9ucy51bmVzY2FwZV9zdHJpbmdzO1xuICAgICAgICBvcHQud3JhcF9saW5lX2xlbmd0aCA9IChvcHRpb25zLndyYXBfbGluZV9sZW5ndGggPT09IHVuZGVmaW5lZCkgPyAwIDogcGFyc2VJbnQob3B0aW9ucy53cmFwX2xpbmVfbGVuZ3RoLCAxMCk7XG4gICAgICAgIG9wdC5lNHggPSAob3B0aW9ucy5lNHggPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IG9wdGlvbnMuZTR4O1xuXG4gICAgICAgIGlmKG9wdGlvbnMuaW5kZW50X3dpdGhfdGFicyl7XG4gICAgICAgICAgICBvcHQuaW5kZW50X2NoYXIgPSAnXFx0JztcbiAgICAgICAgICAgIG9wdC5pbmRlbnRfc2l6ZSA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgaW5kZW50X3N0cmluZyA9ICcnO1xuICAgICAgICB3aGlsZSAob3B0LmluZGVudF9zaXplID4gMCkge1xuICAgICAgICAgICAgaW5kZW50X3N0cmluZyArPSBvcHQuaW5kZW50X2NoYXI7XG4gICAgICAgICAgICBvcHQuaW5kZW50X3NpemUgLT0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChqc19zb3VyY2VfdGV4dCAmJiAoanNfc291cmNlX3RleHQuY2hhckF0KDApID09PSAnICcgfHwganNfc291cmNlX3RleHQuY2hhckF0KDApID09PSAnXFx0JykpIHtcbiAgICAgICAgICAgIHByZWluZGVudF9zdHJpbmcgKz0ganNfc291cmNlX3RleHQuY2hhckF0KDApO1xuICAgICAgICAgICAganNfc291cmNlX3RleHQgPSBqc19zb3VyY2VfdGV4dC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5wdXQgPSBqc19zb3VyY2VfdGV4dDtcbiAgICAgICAgLy8gY2FjaGUgdGhlIHNvdXJjZSdzIGxlbmd0aC5cbiAgICAgICAgaW5wdXRfbGVuZ3RoID0ganNfc291cmNlX3RleHQubGVuZ3RoO1xuXG4gICAgICAgIGxhc3RfdHlwZSA9ICdUS19TVEFSVF9CTE9DSyc7IC8vIGxhc3QgdG9rZW4gdHlwZVxuICAgICAgICBsYXN0X2xhc3RfdGV4dCA9ICcnOyAvLyBwcmUtbGFzdCB0b2tlbiB0ZXh0XG4gICAgICAgIG91dHB1dF9saW5lcyA9IFtjcmVhdGVfb3V0cHV0X2xpbmUoKV07XG4gICAgICAgIG91dHB1dF93cmFwcGVkID0gZmFsc2U7XG4gICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSBmYWxzZTtcbiAgICAgICAgd2hpdGVzcGFjZV9iZWZvcmVfdG9rZW4gPSBbXTtcblxuICAgICAgICAvLyBTdGFjayBvZiBwYXJzaW5nL2Zvcm1hdHRpbmcgc3RhdGVzLCBpbmNsdWRpbmcgTU9ERS5cbiAgICAgICAgLy8gV2UgdG9rZW5pemUsIHBhcnNlLCBhbmQgb3V0cHV0IGluIGFuIGFsbW9zdCBwdXJlbHkgYSBmb3J3YXJkLW9ubHkgc3RyZWFtIG9mIHRva2VuIGlucHV0XG4gICAgICAgIC8vIGFuZCBmb3JtYXR0ZWQgb3V0cHV0LiAgVGhpcyBtYWtlcyB0aGUgYmVhdXRpZmllciBsZXNzIGFjY3VyYXRlIHRoYW4gZnVsbCBwYXJzZXJzXG4gICAgICAgIC8vIGJ1dCBhbHNvIGZhciBtb3JlIHRvbGVyYW50IG9mIHN5bnRheCBlcnJvcnMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEZvciBleGFtcGxlLCB0aGUgZGVmYXVsdCBtb2RlIGlzIE1PREUuQmxvY2tTdGF0ZW1lbnQuIElmIHdlIHNlZSBhICd7JyB3ZSBwdXNoIGEgbmV3IGZyYW1lIG9mIHR5cGVcbiAgICAgICAgLy8gTU9ERS5CbG9ja1N0YXRlbWVudCBvbiB0aGUgdGhlIHN0YWNrLCBldmVuIHRob3VnaCBpdCBjb3VsZCBiZSBvYmplY3QgbGl0ZXJhbC4gIElmIHdlIGxhdGVyXG4gICAgICAgIC8vIGVuY291bnRlciBhIFwiOlwiLCB3ZSdsbCBzd2l0Y2ggdG8gdG8gTU9ERS5PYmplY3RMaXRlcmFsLiAgSWYgd2UgdGhlbiBzZWUgYSBcIjtcIixcbiAgICAgICAgLy8gbW9zdCBmdWxsIHBhcnNlcnMgd291bGQgZGllLCBidXQgdGhlIGJlYXV0aWZpZXIgZ3JhY2VmdWxseSBmYWxscyBiYWNrIHRvXG4gICAgICAgIC8vIE1PREUuQmxvY2tTdGF0ZW1lbnQgYW5kIGNvbnRpbnVlcyBvbi5cbiAgICAgICAgZmxhZ19zdG9yZSA9IFtdO1xuICAgICAgICBzZXRfbW9kZShNT0RFLkJsb2NrU3RhdGVtZW50KTtcblxuICAgICAgICBwYXJzZXJfcG9zID0gMDtcblxuICAgICAgICB0aGlzLmJlYXV0aWZ5ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvKmpzaGludCBvbmV2YXI6dHJ1ZSAqL1xuICAgICAgICAgICAgdmFyIHQsIGksIGtlZXBfd2hpdGVzcGFjZSwgc3dlZXRfY29kZTtcblxuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICB0ID0gZ2V0X25leHRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICB0b2tlbl90ZXh0ID0gdFswXTtcbiAgICAgICAgICAgICAgICB0b2tlbl90eXBlID0gdFsxXTtcblxuICAgICAgICAgICAgICAgIGlmICh0b2tlbl90eXBlID09PSAnVEtfRU9GJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBVbndpbmQgYW55IG9wZW4gc3RhdGVtZW50c1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZmxhZ3MubW9kZSA9PT0gTU9ERS5TdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGtlZXBfd2hpdGVzcGFjZSA9IG9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uICYmIGlzX2FycmF5KGZsYWdzLm1vZGUpO1xuICAgICAgICAgICAgICAgIGlucHV0X3dhbnRlZF9uZXdsaW5lID0gbl9uZXdsaW5lcyA+IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAoa2VlcF93aGl0ZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuX25ld2xpbmVzOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoaSA+IDApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdC5tYXhfcHJlc2VydmVfbmV3bGluZXMgJiYgbl9uZXdsaW5lcyA+IG9wdC5tYXhfcHJlc2VydmVfbmV3bGluZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5fbmV3bGluZXMgPSBvcHQubWF4X3ByZXNlcnZlX25ld2xpbmVzO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdC5wcmVzZXJ2ZV9uZXdsaW5lcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5fbmV3bGluZXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDE7IGkgPCBuX25ld2xpbmVzOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBoYW5kbGVyc1t0b2tlbl90eXBlXSgpO1xuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGNsZWFuZXN0IGhhbmRsaW5nIG9mIGlubGluZSBjb21tZW50cyBpcyB0byB0cmVhdCB0aGVtIGFzIHRob3VnaCB0aGV5IGFyZW4ndCB0aGVyZS5cbiAgICAgICAgICAgICAgICAvLyBKdXN0IGNvbnRpbnVlIGZvcm1hdHRpbmcgYW5kIHRoZSBiZWhhdmlvciBzaG91bGQgYmUgbG9naWNhbC5cbiAgICAgICAgICAgICAgICAvLyBBbHNvIGlnbm9yZSB1bmtub3duIHRva2Vucy4gIEFnYWluLCB0aGlzIHNob3VsZCByZXN1bHQgaW4gYmV0dGVyIGJlaGF2aW9yLlxuICAgICAgICAgICAgICAgIGlmICh0b2tlbl90eXBlICE9PSAnVEtfSU5MSU5FX0NPTU1FTlQnICYmIHRva2VuX3R5cGUgIT09ICdUS19DT01NRU5UJyAmJlxuICAgICAgICAgICAgICAgICAgICB0b2tlbl90eXBlICE9PSAnVEtfQkxPQ0tfQ09NTUVOVCcgJiYgdG9rZW5fdHlwZSAhPT0gJ1RLX1VOS05PV04nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RfbGFzdF90ZXh0ID0gZmxhZ3MubGFzdF90ZXh0O1xuICAgICAgICAgICAgICAgICAgICBsYXN0X3R5cGUgPSB0b2tlbl90eXBlO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5sYXN0X3RleHQgPSB0b2tlbl90ZXh0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmbGFncy5oYWRfY29tbWVudCA9ICh0b2tlbl90eXBlID09PSAnVEtfSU5MSU5FX0NPTU1FTlQnIHx8IHRva2VuX3R5cGUgPT09ICdUS19DT01NRU5UJ1xuICAgICAgICAgICAgICAgICAgICB8fCB0b2tlbl90eXBlID09PSAnVEtfQkxPQ0tfQ09NTUVOVCcpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIHN3ZWV0X2NvZGUgPSBvdXRwdXRfbGluZXNbMF0udGV4dC5qb2luKCcnKTtcbiAgICAgICAgICAgIGZvciAodmFyIGxpbmVfaW5kZXggPSAxOyBsaW5lX2luZGV4IDwgb3V0cHV0X2xpbmVzLmxlbmd0aDsgbGluZV9pbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgc3dlZXRfY29kZSArPSAnXFxuJyArIG91dHB1dF9saW5lc1tsaW5lX2luZGV4XS50ZXh0LmpvaW4oJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dlZXRfY29kZSA9IHN3ZWV0X2NvZGUucmVwbGFjZSgvW1xcclxcbiBdKyQvLCAnJyk7XG4gICAgICAgICAgICByZXR1cm4gc3dlZXRfY29kZTtcbiAgICAgICAgfTtcblxuICAgICAgICBmdW5jdGlvbiB0cmltX291dHB1dChlYXRfbmV3bGluZXMpIHtcbiAgICAgICAgICAgIGVhdF9uZXdsaW5lcyA9IChlYXRfbmV3bGluZXMgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IGVhdF9uZXdsaW5lcztcblxuICAgICAgICAgICAgaWYgKG91dHB1dF9saW5lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0cmltX291dHB1dF9saW5lKG91dHB1dF9saW5lc1tvdXRwdXRfbGluZXMubGVuZ3RoIC0gMV0sIGVhdF9uZXdsaW5lcyk7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoZWF0X25ld2xpbmVzICYmIG91dHB1dF9saW5lcy5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dF9saW5lc1tvdXRwdXRfbGluZXMubGVuZ3RoIC0gMV0udGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X2xpbmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB0cmltX291dHB1dF9saW5lKG91dHB1dF9saW5lc1tvdXRwdXRfbGluZXMubGVuZ3RoIC0gMV0sIGVhdF9uZXdsaW5lcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdHJpbV9vdXRwdXRfbGluZShsaW5lKSB7XG4gICAgICAgICAgICB3aGlsZSAobGluZS50ZXh0Lmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIChsaW5lLnRleHRbbGluZS50ZXh0Lmxlbmd0aCAtIDFdID09PSAnICcgfHxcbiAgICAgICAgICAgICAgICAgICAgbGluZS50ZXh0W2xpbmUudGV4dC5sZW5ndGggLSAxXSA9PT0gaW5kZW50X3N0cmluZyB8fFxuICAgICAgICAgICAgICAgICAgICBsaW5lLnRleHRbbGluZS50ZXh0Lmxlbmd0aCAtIDFdID09PSBwcmVpbmRlbnRfc3RyaW5nKSkge1xuICAgICAgICAgICAgICAgIGxpbmUudGV4dC5wb3AoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHRyaW0ocykge1xuICAgICAgICAgICAgcmV0dXJuIHMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2UgY291bGQgdXNlIGp1c3Qgc3RyaW5nLnNwbGl0LCBidXRcbiAgICAgICAgLy8gSUUgZG9lc24ndCBsaWtlIHJldHVybmluZyBlbXB0eSBzdHJpbmdzXG5cbiAgICAgICAgZnVuY3Rpb24gc3BsaXRfbmV3bGluZXMocykge1xuICAgICAgICAgICAgLy9yZXR1cm4gcy5zcGxpdCgvXFx4MGRcXHgwYXxcXHgwYS8pO1xuXG4gICAgICAgICAgICBzID0gcy5yZXBsYWNlKC9cXHgwZC9nLCAnJyk7XG4gICAgICAgICAgICB2YXIgb3V0ID0gW10sXG4gICAgICAgICAgICAgICAgaWR4ID0gcy5pbmRleE9mKFwiXFxuXCIpO1xuICAgICAgICAgICAgd2hpbGUgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChzLnN1YnN0cmluZygwLCBpZHgpKTtcbiAgICAgICAgICAgICAgICBzID0gcy5zdWJzdHJpbmcoaWR4ICsgMSk7XG4gICAgICAgICAgICAgICAgaWR4ID0gcy5pbmRleE9mKFwiXFxuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2gocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24ganVzdF9hZGRlZF9uZXdsaW5lKCkge1xuICAgICAgICAgICAgdmFyIGxpbmUgPSBvdXRwdXRfbGluZXNbb3V0cHV0X2xpbmVzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgcmV0dXJuIGxpbmUudGV4dC5sZW5ndGggPT09IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBqdXN0X2FkZGVkX2JsYW5rbGluZSgpIHtcbiAgICAgICAgICAgIGlmIChqdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgIGlmIChvdXRwdXRfbGluZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBzdGFydCBvZiB0aGUgZmlsZSBhbmQgbmV3bGluZSA9IGJsYW5rXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBvdXRwdXRfbGluZXNbb3V0cHV0X2xpbmVzLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgIHJldHVybiBsaW5lLnRleHQubGVuZ3RoID09PSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZShmb3JjZV9saW5ld3JhcCkge1xuICAgICAgICAgICAgZm9yY2VfbGluZXdyYXAgPSAoZm9yY2VfbGluZXdyYXAgPT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IGZvcmNlX2xpbmV3cmFwO1xuICAgICAgICAgICAgaWYgKG9wdC53cmFwX2xpbmVfbGVuZ3RoICYmICFmb3JjZV9saW5ld3JhcCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gb3V0cHV0X2xpbmVzW291dHB1dF9saW5lcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcG9zZWRfbGluZV9sZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIC8vIG5ldmVyIHdyYXAgdGhlIGZpcnN0IHRva2VuIG9mIGEgbGluZS5cbiAgICAgICAgICAgICAgICBpZiAobGluZS50ZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcG9zZWRfbGluZV9sZW5ndGggPSBsaW5lLnRleHQuam9pbignJykubGVuZ3RoICsgdG9rZW5fdGV4dC5sZW5ndGggK1xuICAgICAgICAgICAgICAgICAgICAgICAgKG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPyAxIDogMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wb3NlZF9saW5lX2xlbmd0aCA+PSBvcHQud3JhcF9saW5lX2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VfbGluZXdyYXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCgob3B0LnByZXNlcnZlX25ld2xpbmVzICYmIGlucHV0X3dhbnRlZF9uZXdsaW5lKSB8fCBmb3JjZV9saW5ld3JhcCkgJiYgIWp1c3RfYWRkZWRfbmV3bGluZSgpKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBFeHByZXNzaW9ucyBhbmQgYXJyYXkgbGl0ZXJhbHMgYWxyZWFkeSBpbmRlbnQgdGhlaXIgY29udGVudHMuXG4gICAgICAgICAgICAgICAgaWYgKCEoaXNfYXJyYXkoZmxhZ3MubW9kZSkgfHwgaXNfZXhwcmVzc2lvbihmbGFncy5tb2RlKSB8fCBmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3dyYXBwZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByaW50X25ld2xpbmUoZm9yY2VfbmV3bGluZSwgcHJlc2VydmVfc3RhdGVtZW50X2ZsYWdzKSB7XG4gICAgICAgICAgICBvdXRwdXRfd3JhcHBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAoIXByZXNlcnZlX3N0YXRlbWVudF9mbGFncykge1xuICAgICAgICAgICAgICAgIGlmIChmbGFncy5sYXN0X3RleHQgIT09ICc7JyAmJiBmbGFncy5sYXN0X3RleHQgIT09ICcsJyAmJiBmbGFncy5sYXN0X3RleHQgIT09ICc9JyAmJiBsYXN0X3R5cGUgIT09ICdUS19PUEVSQVRPUicpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGZsYWdzLm1vZGUgPT09IE1PREUuU3RhdGVtZW50ICYmICFmbGFncy5pZl9ibG9jayAmJiAhZmxhZ3MuZG9fYmxvY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3V0cHV0X2xpbmVzLmxlbmd0aCA9PT0gMSAmJiBqdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjsgLy8gbm8gbmV3bGluZSBvbiBzdGFydCBvZiBmaWxlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb3JjZV9uZXdsaW5lIHx8ICFqdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgIGZsYWdzLm11bHRpbGluZV9mcmFtZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgb3V0cHV0X2xpbmVzLnB1c2goY3JlYXRlX291dHB1dF9saW5lKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHJpbnRfdG9rZW5fbGluZV9pbmRlbnRhdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChqdXN0X2FkZGVkX25ld2xpbmUoKSkge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gb3V0cHV0X2xpbmVzW291dHB1dF9saW5lcy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAob3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24gJiYgaXNfYXJyYXkoZmxhZ3MubW9kZSkgJiYgaW5wdXRfd2FudGVkX25ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcHJldmVudCByZW1vdmluZyBvZiB0aGlzIHdoaXRlc3BhY2UgYXMgcmVkdW5kYW50XG4gICAgICAgICAgICAgICAgICAgIGxpbmUudGV4dC5wdXNoKCcnKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aGl0ZXNwYWNlX2JlZm9yZV90b2tlbi5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZS50ZXh0LnB1c2god2hpdGVzcGFjZV9iZWZvcmVfdG9rZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZWluZGVudF9zdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmUudGV4dC5wdXNoKHByZWluZGVudF9zdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfaW5kZW50X3N0cmluZyhmbGFncy5pbmRlbnRhdGlvbl9sZXZlbCArXG4gICAgICAgICAgICAgICAgICAgICAgICAob3V0cHV0X3dyYXBwZWQgPyAxIDogMCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByaW50X2luZGVudF9zdHJpbmcobGV2ZWwpIHtcbiAgICAgICAgICAgIC8vIE5ldmVyIGluZGVudCB5b3VyIGZpcnN0IG91dHB1dCBpbmRlbnQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBmaWxlXG4gICAgICAgICAgICBpZiAob3V0cHV0X2xpbmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGluZSA9IG91dHB1dF9saW5lc1tvdXRwdXRfbGluZXMubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgICAgICAgICBmbGFncy5saW5lX2luZGVudF9sZXZlbCA9IGxldmVsO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGV2ZWw7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBsaW5lLnRleHQucHVzaChpbmRlbnRfc3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwcmludF90b2tlbl9zcGFjZV9iZWZvcmUoKSB7XG4gICAgICAgICAgICB2YXIgbGluZSA9IG91dHB1dF9saW5lc1tvdXRwdXRfbGluZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAob3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiAmJiBsaW5lLnRleHQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxhc3Rfb3V0cHV0ID0gbGluZS50ZXh0W2xpbmUudGV4dC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpZiAobGFzdF9vdXRwdXQgIT09ICcgJyAmJiBsYXN0X291dHB1dCAhPT0gaW5kZW50X3N0cmluZykgeyAvLyBwcmV2ZW50IG9jY2Fzc2lvbmFsIGR1cGxpY2F0ZSBzcGFjZVxuICAgICAgICAgICAgICAgICAgICBsaW5lLnRleHQucHVzaCgnICcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHByaW50X3Rva2VuKHByaW50YWJsZV90b2tlbikge1xuICAgICAgICAgICAgcHJpbnRhYmxlX3Rva2VuID0gcHJpbnRhYmxlX3Rva2VuIHx8IHRva2VuX3RleHQ7XG4gICAgICAgICAgICBwcmludF90b2tlbl9saW5lX2luZGVudGF0aW9uKCk7XG4gICAgICAgICAgICBvdXRwdXRfd3JhcHBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgcHJpbnRfdG9rZW5fc3BhY2VfYmVmb3JlKCk7XG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG4gICAgICAgICAgICBvdXRwdXRfbGluZXNbb3V0cHV0X2xpbmVzLmxlbmd0aCAtIDFdLnRleHQucHVzaChwcmludGFibGVfdG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW5kZW50KCkge1xuICAgICAgICAgICAgZmxhZ3MuaW5kZW50YXRpb25fbGV2ZWwgKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlaW5kZW50KCkge1xuICAgICAgICAgICAgaWYgKGZsYWdzLmluZGVudGF0aW9uX2xldmVsID4gMCAmJlxuICAgICAgICAgICAgICAgICgoIWZsYWdzLnBhcmVudCkgfHwgZmxhZ3MuaW5kZW50YXRpb25fbGV2ZWwgPiBmbGFncy5wYXJlbnQuaW5kZW50YXRpb25fbGV2ZWwpKVxuICAgICAgICAgICAgICAgIGZsYWdzLmluZGVudGF0aW9uX2xldmVsIC09IDE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZW1vdmVfcmVkdW5kYW50X2luZGVudGF0aW9uKGZyYW1lKSB7XG4gICAgICAgICAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGVmZmVjdGl2ZSBidXQgaGFzIHNvbWUgaXNzdWVzOlxuICAgICAgICAgICAgLy8gICAgIC0gbGVzcyB0aGFuIGdyZWF0IHBlcmZvcm1hbmNlIGR1ZSB0byBhcnJheSBzcGxpY2luZ1xuICAgICAgICAgICAgLy8gICAgIC0gY2FuIGNhdXNlIGxpbmUgd3JhcCB0byBoYXBwZW4gdG9vIHNvb24gZHVlIHRvIGluZGVudCByZW1vdmFsXG4gICAgICAgICAgICAvLyAgICAgICAgICAgYWZ0ZXIgd3JhcCBwb2ludHMgYXJlIGNhbGN1bGF0ZWRcbiAgICAgICAgICAgIC8vIFRoZXNlIGlzc3VlcyBhcmUgbWlub3IgY29tcGFyZWQgdG8gdWdseSBpbmRlbnRhdGlvbi5cblxuICAgICAgICAgICAgaWYgKGZyYW1lLm11bHRpbGluZV9mcmFtZSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgb25lIGluZGVudCBmcm9tIGVhY2ggbGluZSBpbnNpZGUgdGhpcyBzZWN0aW9uXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBmcmFtZS5zdGFydF9saW5lX2luZGV4O1xuICAgICAgICAgICAgdmFyIHNwbGljZV9pbmRleCA9IDA7XG4gICAgICAgICAgICB2YXIgbGluZTtcblxuICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgb3V0cHV0X2xpbmVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGxpbmUgPSBvdXRwdXRfbGluZXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgIGluZGV4Kys7XG5cbiAgICAgICAgICAgICAgICAvLyBza2lwIGVtcHR5IGxpbmVzXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUudGV4dC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gc2tpcCB0aGUgcHJlaW5kZW50IHN0cmluZyBpZiBwcmVzZW50XG4gICAgICAgICAgICAgICAgaWYgKHByZWluZGVudF9zdHJpbmcgJiYgbGluZS50ZXh0WzBdID09PSBwcmVpbmRlbnRfc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHNwbGljZV9pbmRleCA9IDE7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3BsaWNlX2luZGV4ID0gMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgb25lIGluZGVudCwgaWYgcHJlc2VudFxuICAgICAgICAgICAgICAgIGlmIChsaW5lLnRleHRbc3BsaWNlX2luZGV4XSA9PT0gaW5kZW50X3N0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBsaW5lLnRleHQuc3BsaWNlKHNwbGljZV9pbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gc2V0X21vZGUobW9kZSkge1xuICAgICAgICAgICAgaWYgKGZsYWdzKSB7XG4gICAgICAgICAgICAgICAgZmxhZ19zdG9yZS5wdXNoKGZsYWdzKTtcbiAgICAgICAgICAgICAgICBwcmV2aW91c19mbGFncyA9IGZsYWdzO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmV2aW91c19mbGFncyA9IGNyZWF0ZV9mbGFncyhudWxsLCBtb2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmxhZ3MgPSBjcmVhdGVfZmxhZ3MocHJldmlvdXNfZmxhZ3MsIG1vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNfYXJyYXkobW9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG1vZGUgPT09IE1PREUuQXJyYXlMaXRlcmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaXNfZXhwcmVzc2lvbihtb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5fYXJyYXkobW9kZSwgW01PREUuRXhwcmVzc2lvbiwgTU9ERS5Gb3JJbml0aWFsaXplciwgTU9ERS5Db25kaXRpb25hbF0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVzdG9yZV9tb2RlKCkge1xuICAgICAgICAgICAgaWYgKGZsYWdfc3RvcmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX2ZsYWdzID0gZmxhZ3M7XG4gICAgICAgICAgICAgICAgZmxhZ3MgPSBmbGFnX3N0b3JlLnBvcCgpO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c19mbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmVfcmVkdW5kYW50X2luZGVudGF0aW9uKHByZXZpb3VzX2ZsYWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzdGFydF9vZl9vYmplY3RfcHJvcGVydHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gZmxhZ3MubW9kZSA9PT0gTU9ERS5PYmplY3RMaXRlcmFsICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJzonICYmXG4gICAgICAgICAgICAgICAgZmxhZ3MudGVybmFyeV9kZXB0aCA9PT0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN0YXJ0X29mX3N0YXRlbWVudCgpIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsndmFyJywgJ2xldCcsICdjb25zdCddKSAmJiB0b2tlbl90eXBlID09PSAnVEtfV09SRCcpIHx8XG4gICAgICAgICAgICAgICAgICAgIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgZmxhZ3MubGFzdF90ZXh0ID09PSAnZG8nKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJ3JldHVybicgJiYgIWlucHV0X3dhbnRlZF9uZXdsaW5lKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2Vsc2UnICYmICEodG9rZW5fdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiB0b2tlbl90ZXh0ID09PSAnaWYnKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgKGxhc3RfdHlwZSA9PT0gJ1RLX0VORF9FWFBSJyAmJiAocHJldmlvdXNfZmxhZ3MubW9kZSA9PT0gTU9ERS5Gb3JJbml0aWFsaXplciB8fCBwcmV2aW91c19mbGFncy5tb2RlID09PSBNT0RFLkNvbmRpdGlvbmFsKSkpIHtcblxuICAgICAgICAgICAgICAgIHNldF9tb2RlKE1PREUuU3RhdGVtZW50KTtcbiAgICAgICAgICAgICAgICBpbmRlbnQoKTtcblxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ3ZhcicsICdsZXQnLCAnY29uc3QnXSkgJiYgdG9rZW5fdHlwZSA9PT0gJ1RLX1dPUkQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmRlY2xhcmF0aW9uX3N0YXRlbWVudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSXNzdWUgIzI3NjpcbiAgICAgICAgICAgICAgICAvLyBJZiBzdGFydGluZyBhIG5ldyBzdGF0ZW1lbnQgd2l0aCBbaWYsIGZvciwgd2hpbGUsIGRvXSwgcHVzaCB0byBhIG5ldyBsaW5lLlxuICAgICAgICAgICAgICAgIC8vIGlmIChhKSBpZiAoYikgaWYoYykgZCgpOyBlbHNlIGUoKTsgZWxzZSBmKCk7XG4gICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZShcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5fdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheSh0b2tlbl90ZXh0LCBbJ2RvJywgJ2ZvcicsICdpZicsICd3aGlsZSddKSk7XG5cbiAgICAgICAgICAgICAgICBvdXRwdXRfd3JhcHBlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhbGxfbGluZXNfc3RhcnRfd2l0aChsaW5lcywgYykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gdHJpbShsaW5lc1tpXSk7XG4gICAgICAgICAgICAgICAgaWYgKGxpbmUuY2hhckF0KDApICE9PSBjKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzX3NwZWNpYWxfd29yZCh3b3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5fYXJyYXkod29yZCwgWydjYXNlJywgJ3JldHVybicsICdkbycsICdpZicsICd0aHJvdycsICdlbHNlJ10pO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaW5fYXJyYXkod2hhdCwgYXJyKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmIChhcnJbaV0gPT09IHdoYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdW5lc2NhcGVfc3RyaW5nKHMpIHtcbiAgICAgICAgICAgIHZhciBlc2MgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICBvdXQgPSAnJyxcbiAgICAgICAgICAgICAgICBwb3MgPSAwLFxuICAgICAgICAgICAgICAgIHNfaGV4ID0gJycsXG4gICAgICAgICAgICAgICAgZXNjYXBlZCA9IDAsXG4gICAgICAgICAgICAgICAgYztcblxuICAgICAgICAgICAgd2hpbGUgKGVzYyB8fCBwb3MgPCBzLmxlbmd0aCkge1xuXG4gICAgICAgICAgICAgICAgYyA9IHMuY2hhckF0KHBvcyk7XG4gICAgICAgICAgICAgICAgcG9zKys7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXNjKSB7XG4gICAgICAgICAgICAgICAgICAgIGVzYyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYyA9PT0gJ3gnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW1wbGUgaGV4LWVzY2FwZSBcXHgyNFxuICAgICAgICAgICAgICAgICAgICAgICAgc19oZXggPSBzLnN1YnN0cihwb3MsIDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDI7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gJ3UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB1bmljb2RlLWVzY2FwZSwgXFx1MjEzNFxuICAgICAgICAgICAgICAgICAgICAgICAgc19oZXggPSBzLnN1YnN0cihwb3MsIDQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zICs9IDQ7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzb21lIGNvbW1vbiBlc2NhcGUsIGUuZyBcXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIG91dCArPSAnXFxcXCcgKyBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzX2hleC5tYXRjaCgvXlswMTIzNDU2Nzg5YWJjZGVmQUJDREVGXSskLykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNvbWUgd2VpcmQgZXNjYXBpbmcsIGJhaWwgb3V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gbGVhdmluZyB3aG9sZSBzdHJpbmcgaW50YWN0XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGVzY2FwZWQgPSBwYXJzZUludChzX2hleCwgMTYpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlc2NhcGVkID49IDB4MDAgJiYgZXNjYXBlZCA8IDB4MjApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxlYXZlIDB4MDAuLi4weDFmIGVzY2FwZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjID09PSAneCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gJ1xcXFx4JyArIHNfaGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gJ1xcXFx1JyArIHNfaGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZXNjYXBlZCA9PT0gMHgyMiB8fCBlc2NhcGVkID09PSAweDI3IHx8IGVzY2FwZWQgPT09IDB4NWMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZS1xdW90ZSwgYXBvc3Ryb3BoZSwgYmFja3NsYXNoIC0gZXNjYXBlIHRoZXNlXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gJ1xcXFwnICsgU3RyaW5nLmZyb21DaGFyQ29kZShlc2NhcGVkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjID09PSAneCcgJiYgZXNjYXBlZCA+IDB4N2UgJiYgZXNjYXBlZCA8PSAweGZmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3ZSBiYWlsIG91dCBvbiBcXHg3Zi4uXFx4ZmYsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsZWF2aW5nIHdob2xlIHN0cmluZyBlc2NhcGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXMgaXQncyBwcm9iYWJseSBjb21wbGV0ZWx5IGJpbmFyeVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShlc2NhcGVkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gJ1xcXFwnKSB7XG4gICAgICAgICAgICAgICAgICAgIGVzYyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0ICs9IGM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzX25leHQoZmluZCkge1xuICAgICAgICAgICAgdmFyIGxvY2FsX3BvcyA9IHBhcnNlcl9wb3M7XG4gICAgICAgICAgICB2YXIgYyA9IGlucHV0LmNoYXJBdChsb2NhbF9wb3MpO1xuICAgICAgICAgICAgd2hpbGUgKGluX2FycmF5KGMsIHdoaXRlc3BhY2UpICYmIGMgIT09IGZpbmQpIHtcbiAgICAgICAgICAgICAgICBsb2NhbF9wb3MrKztcbiAgICAgICAgICAgICAgICBpZiAobG9jYWxfcG9zID49IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5jaGFyQXQobG9jYWxfcG9zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjID09PSBmaW5kO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0X25leHRfdG9rZW4oKSB7XG4gICAgICAgICAgICB2YXIgaSwgcmVzdWx0aW5nX3N0cmluZztcblxuICAgICAgICAgICAgbl9uZXdsaW5lcyA9IDA7XG5cbiAgICAgICAgICAgIGlmIChwYXJzZXJfcG9zID49IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBbJycsICdUS19FT0YnXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXRfd2FudGVkX25ld2xpbmUgPSBmYWxzZTtcbiAgICAgICAgICAgIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuID0gW107XG5cbiAgICAgICAgICAgIHZhciBjID0gaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpO1xuICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuXG4gICAgICAgICAgICB3aGlsZSAoaW5fYXJyYXkoYywgd2hpdGVzcGFjZSkpIHtcblxuICAgICAgICAgICAgICAgIGlmIChjID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgICAgICBuX25ld2xpbmVzICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHdoaXRlc3BhY2VfYmVmb3JlX3Rva2VuID0gW107XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChuX25ld2xpbmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjID09PSBpbmRlbnRfc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlX2JlZm9yZV90b2tlbi5wdXNoKGluZGVudF9zdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGMgIT09ICdcXHInKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZXNwYWNlX2JlZm9yZV90b2tlbi5wdXNoKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyc2VyX3BvcyA+PSBpbnB1dF9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnJywgJ1RLX0VPRiddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5jaGFyQXQocGFyc2VyX3Bvcyk7XG4gICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBOT1RFOiBiZWNhdXNlIGJlYXV0aWZpZXIgZG9lc24ndCBmdWxseSBwYXJzZSwgaXQgZG9lc24ndCB1c2UgYWNvcm4uaXNJZGVudGlmaWVyU3RhcnQuXG4gICAgICAgICAgICAvLyBJdCBqdXN0IHRyZWF0cyBhbGwgaWRlbnRpZmllcnMgYW5kIG51bWJlcnMgYW5kIHN1Y2ggdGhlIHNhbWUuXG4gICAgICAgICAgICBpZiAoYWNvcm4uaXNJZGVudGlmaWVyQ2hhcihpbnB1dC5jaGFyQ29kZUF0KHBhcnNlcl9wb3MtMSkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlcl9wb3MgPCBpbnB1dF9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGFjb3JuLmlzSWRlbnRpZmllckNoYXIoaW5wdXQuY2hhckNvZGVBdChwYXJzZXJfcG9zKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGMgKz0gaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlcl9wb3MgPT09IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gc21hbGwgYW5kIHN1cnByaXNpbmdseSB1bnVnbHkgaGFjayBmb3IgMUUtMTAgcmVwcmVzZW50YXRpb25cbiAgICAgICAgICAgICAgICBpZiAocGFyc2VyX3BvcyAhPT0gaW5wdXRfbGVuZ3RoICYmIGMubWF0Y2goL15bMC05XStbRWVdJC8pICYmIChpbnB1dC5jaGFyQXQocGFyc2VyX3BvcykgPT09ICctJyB8fCBpbnB1dC5jaGFyQXQocGFyc2VyX3BvcykgPT09ICcrJykpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgc2lnbiA9IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ID0gZ2V0X25leHRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICAgICAgYyArPSBzaWduICsgdFswXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfV09SRCddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghKGxhc3RfdHlwZSA9PT0gJ1RLX0RPVCcgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ3NldCcsICdnZXQnXSkpKVxuICAgICAgICAgICAgICAgICAgICAmJiBpbl9hcnJheShjLCByZXNlcnZlZF93b3JkcykpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT09ICdpbicpIHsgLy8gaGFjayBmb3IgJ2luJyBvcGVyYXRvclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfT1BFUkFUT1InXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19SRVNFUlZFRCddO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19XT1JEJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjID09PSAnKCcgfHwgYyA9PT0gJ1snKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfU1RBUlRfRVhQUiddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYyA9PT0gJyknIHx8IGMgPT09ICddJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0VORF9FWFBSJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjID09PSAneycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19TVEFSVF9CTE9DSyddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYyA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtjLCAnVEtfRU5EX0JMT0NLJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjID09PSAnOycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19TRU1JQ09MT04nXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGMgPT09ICcvJykge1xuICAgICAgICAgICAgICAgIHZhciBjb21tZW50ID0gJyc7XG4gICAgICAgICAgICAgICAgLy8gcGVlayBmb3IgY29tbWVudCAvKiAuLi4gKi9cbiAgICAgICAgICAgICAgICB2YXIgaW5saW5lX2NvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5jaGFyQXQocGFyc2VyX3BvcykgPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZXJfcG9zICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZXJfcG9zIDwgaW5wdXRfbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAocGFyc2VyX3BvcyA8IGlucHV0X2xlbmd0aCAmJiAhKGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSA9PT0gJyonICYmIGlucHV0LmNoYXJBdChwYXJzZXJfcG9zICsgMSkgJiYgaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MgKyAxKSA9PT0gJy8nKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGMgPSBpbnB1dC5jaGFyQXQocGFyc2VyX3Bvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudCArPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjID09PSBcIlxcblwiIHx8IGMgPT09IFwiXFxyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5saW5lX2NvbW1lbnQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZXJfcG9zID49IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5saW5lX2NvbW1lbnQgJiYgbl9uZXdsaW5lcyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnLyonICsgY29tbWVudCArICcqLycsICdUS19JTkxJTkVfQ09NTUVOVCddO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsnLyonICsgY29tbWVudCArICcqLycsICdUS19CTE9DS19DT01NRU5UJ107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gcGVlayBmb3IgY29tbWVudCAvLyAuLi5cbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tbWVudCA9IGM7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChpbnB1dC5jaGFyQXQocGFyc2VyX3BvcykgIT09ICdcXHInICYmIGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSAhPT0gJ1xcbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQgKz0gaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlcl9wb3MgPj0gaW5wdXRfbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjb21tZW50LCAnVEtfQ09NTUVOVCddO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIGlmIChjID09PSAnYCcgfHwgYyA9PT0gXCInXCIgfHwgYyA9PT0gJ1wiJyB8fCAvLyBzdHJpbmdcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgIChjID09PSAnLycpIHx8IC8vIHJlZ2V4cFxuICAgICAgICAgICAgICAgICAgICAob3B0LmU0eCAmJiBjID09PSBcIjxcIiAmJiBpbnB1dC5zbGljZShwYXJzZXJfcG9zIC0gMSkubWF0Y2goL148KFstYS16QS1aOjAtOV8uXSt8e1tee31dKn18IVxcW0NEQVRBXFxbW1xcc1xcU10qP1xcXVxcXSlcXHMqKFstYS16QS1aOjAtOV8uXSs9KCdbXiddKid8XCJbXlwiXSpcInx7W157fV0qfSlcXHMqKSpcXC8/XFxzKj4vKSkgLy8geG1sXG4gICAgICAgICAgICAgICAgKSAmJiAoIC8vIHJlZ2V4IGFuZCB4bWwgY2FuIG9ubHkgYXBwZWFyIGluIHNwZWNpZmljIGxvY2F0aW9ucyBkdXJpbmcgcGFyc2luZ1xuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGlzX3NwZWNpYWxfd29yZChmbGFncy5sYXN0X3RleHQpKSB8fFxuICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInICYmIGluX2FycmF5KHByZXZpb3VzX2ZsYWdzLm1vZGUsIFtNT0RFLkNvbmRpdGlvbmFsLCBNT0RFLkZvckluaXRpYWxpemVyXSkpIHx8XG4gICAgICAgICAgICAgICAgICAgIChpbl9hcnJheShsYXN0X3R5cGUsIFsnVEtfQ09NTUVOVCcsICdUS19TVEFSVF9FWFBSJywgJ1RLX1NUQVJUX0JMT0NLJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdUS19FTkRfQkxPQ0snLCAnVEtfT1BFUkFUT1InLCAnVEtfRVFVQUxTJywgJ1RLX0VPRicsICdUS19TRU1JQ09MT04nLCAnVEtfQ09NTUEnXG4gICAgICAgICAgICAgICAgICAgIF0pKVxuICAgICAgICAgICAgICAgICkpIHtcblxuICAgICAgICAgICAgICAgIHZhciBzZXAgPSBjLFxuICAgICAgICAgICAgICAgICAgICBlc2MgPSBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgaGFzX2NoYXJfZXNjYXBlcyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyA9IGM7XG5cbiAgICAgICAgICAgICAgICBpZiAocGFyc2VyX3BvcyA8IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VwID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgcmVnZXhwXG4gICAgICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGluX2NoYXJfY2xhc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChlc2MgfHwgaW5fY2hhcl9jbGFzcyB8fCBpbnB1dC5jaGFyQXQocGFyc2VyX3BvcykgIT09IHNlcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgKz0gaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXNjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVzYyA9IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSA9PT0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpID09PSAnWycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluX2NoYXJfY2xhc3MgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbl9jaGFyX2NsYXNzID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc2MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZXJfcG9zID49IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmNvbXBsZXRlIHN0cmluZy9yZXhwIHdoZW4gZW5kLW9mLWZpbGUgcmVhY2hlZC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmFpbCBvdXQgd2l0aCB3aGF0IGhhZCBiZWVuIHJlY2VpdmVkIHNvIGZhci5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHRpbmdfc3RyaW5nLCAnVEtfU1RSSU5HJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdC5lNHggJiYgc2VwID09PSAnPCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgZTR4IHhtbCBsaXRlcmFsc1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4bWxSZWdFeHAgPSAvPChcXC8/KShbLWEtekEtWjowLTlfLl0rfHtbXnt9XSp9fCFcXFtDREFUQVxcW1tcXHNcXFNdKj9cXF1cXF0pXFxzKihbLWEtekEtWjowLTlfLl0rPSgnW14nXSonfFwiW15cIl0qXCJ8e1tee31dKn0pXFxzKikqKFxcLz8pXFxzKj4vZztcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB4bWxTdHIgPSBpbnB1dC5zbGljZShwYXJzZXJfcG9zIC0gMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSB4bWxSZWdFeHAuZXhlYyh4bWxTdHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvb3RUYWcgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVwdGggPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXNFbmRUYWcgPSAhISBtYXRjaFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBtYXRjaFsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzU2luZ2xldG9uVGFnID0gKCAhISBtYXRjaFttYXRjaC5sZW5ndGggLSAxXSkgfHwgKHRhZ05hbWUuc2xpY2UoMCwgOCkgPT09IFwiIVtDREFUQVtcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YWdOYW1lID09PSByb290VGFnICYmICFpc1NpbmdsZXRvblRhZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlzRW5kVGFnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS1kZXB0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKytkZXB0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVwdGggPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSB4bWxSZWdFeHAuZXhlYyh4bWxTdHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgeG1sTGVuZ3RoID0gbWF0Y2ggPyBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCA6IHhtbFN0ci5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSB4bWxMZW5ndGggLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbeG1sU3RyLnNsaWNlKDAsIHhtbExlbmd0aCksIFwiVEtfU1RSSU5HXCJdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoZXNjIHx8IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSAhPT0gc2VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBpbnB1dC5jaGFyQXQocGFyc2VyX3Bvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVzYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpID09PSAneCcgfHwgaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpID09PSAndScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc19jaGFyX2VzY2FwZXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVzYyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVzYyA9IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSA9PT0gJ1xcXFwnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZXJfcG9zICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlcl9wb3MgPj0gaW5wdXRfbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluY29tcGxldGUgc3RyaW5nL3JleHAgd2hlbiBlbmQtb2YtZmlsZSByZWFjaGVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBiYWlsIG91dCB3aXRoIHdoYXQgaGFkIGJlZW4gcmVjZWl2ZWQgc28gZmFyLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3Jlc3VsdGluZ19zdHJpbmcsICdUS19TVFJJTkcnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHBhcnNlcl9wb3MgKz0gMTtcbiAgICAgICAgICAgICAgICByZXN1bHRpbmdfc3RyaW5nICs9IHNlcDtcblxuICAgICAgICAgICAgICAgIGlmIChoYXNfY2hhcl9lc2NhcGVzICYmIG9wdC51bmVzY2FwZV9zdHJpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdGluZ19zdHJpbmcgPSB1bmVzY2FwZV9zdHJpbmcocmVzdWx0aW5nX3N0cmluZyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNlcCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZ2V4cHMgbWF5IGhhdmUgbW9kaWZpZXJzIC9yZWdleHAvTU9EICwgc28gZmV0Y2ggdGhvc2UsIHRvb1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAocGFyc2VyX3BvcyA8IGlucHV0X2xlbmd0aCAmJiBpbl9hcnJheShpbnB1dC5jaGFyQXQocGFyc2VyX3BvcyksIHdvcmRjaGFyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBpbnB1dC5jaGFyQXQocGFyc2VyX3Bvcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZXJfcG9zICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtyZXN1bHRpbmdfc3RyaW5nLCAnVEtfU1RSSU5HJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjID09PSAnIycpIHtcblxuXG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dF9saW5lcy5sZW5ndGggPT09IDEgJiYgb3V0cHV0X2xpbmVzWzBdLnRleHQubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSA9PT0gJyEnKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNoZWJhbmdcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyA9IGM7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChwYXJzZXJfcG9zIDwgaW5wdXRfbGVuZ3RoICYmIGMgIT09ICdcXG4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjID0gaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0aW5nX3N0cmluZyArPSBjO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbdHJpbShyZXN1bHRpbmdfc3RyaW5nKSArICdcXG4nLCAnVEtfVU5LTk9XTiddO1xuICAgICAgICAgICAgICAgIH1cblxuXG5cbiAgICAgICAgICAgICAgICAvLyBTcGlkZXJtb25rZXktc3BlY2lmaWMgc2hhcnAgdmFyaWFibGVzIGZvciBjaXJjdWxhciByZWZlcmVuY2VzXG4gICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvRW4vU2hhcnBfdmFyaWFibGVzX2luX0phdmFTY3JpcHRcbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vbXhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9zb3VyY2UvanMvc3JjL2pzc2Nhbi5jcHAgYXJvdW5kIGxpbmUgMTkzNVxuICAgICAgICAgICAgICAgIHZhciBzaGFycCA9ICcjJztcbiAgICAgICAgICAgICAgICBpZiAocGFyc2VyX3BvcyA8IGlucHV0X2xlbmd0aCAmJiBpbl9hcnJheShpbnB1dC5jaGFyQXQocGFyc2VyX3BvcyksIGRpZ2l0cykpIHtcbiAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYyA9IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoYXJwICs9IGM7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZXJfcG9zICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKHBhcnNlcl9wb3MgPCBpbnB1dF9sZW5ndGggJiYgYyAhPT0gJyMnICYmIGMgIT09ICc9Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjID09PSAnIycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MpID09PSAnWycgJiYgaW5wdXQuY2hhckF0KHBhcnNlcl9wb3MgKyAxKSA9PT0gJ10nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGFycCArPSAnW10nO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAyO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSA9PT0gJ3snICYmIGlucHV0LmNoYXJBdChwYXJzZXJfcG9zICsgMSkgPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2hhcnAgKz0gJ3t9JztcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlcl9wb3MgKz0gMjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW3NoYXJwLCAnVEtfV09SRCddO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGMgPT09ICc8JyAmJiBpbnB1dC5zdWJzdHJpbmcocGFyc2VyX3BvcyAtIDEsIHBhcnNlcl9wb3MgKyAzKSA9PT0gJzwhLS0nKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAzO1xuICAgICAgICAgICAgICAgIGMgPSAnPCEtLSc7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKSAhPT0gJ1xcbicgJiYgcGFyc2VyX3BvcyA8IGlucHV0X2xlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcysrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmbGFncy5pbl9odG1sX2NvbW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0NPTU1FTlQnXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGMgPT09ICctJyAmJiBmbGFncy5pbl9odG1sX2NvbW1lbnQgJiYgaW5wdXQuc3Vic3RyaW5nKHBhcnNlcl9wb3MgLSAxLCBwYXJzZXJfcG9zICsgMikgPT09ICctLT4nKSB7XG4gICAgICAgICAgICAgICAgZmxhZ3MuaW5faHRtbF9jb21tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAyO1xuICAgICAgICAgICAgICAgIHJldHVybiBbJy0tPicsICdUS19DT01NRU5UJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjID09PSAnLicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19ET1QnXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGluX2FycmF5KGMsIHB1bmN0KSkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChwYXJzZXJfcG9zIDwgaW5wdXRfbGVuZ3RoICYmIGluX2FycmF5KGMgKyBpbnB1dC5jaGFyQXQocGFyc2VyX3BvcyksIHB1bmN0KSkge1xuICAgICAgICAgICAgICAgICAgICBjICs9IGlucHV0LmNoYXJBdChwYXJzZXJfcG9zKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VyX3BvcyArPSAxO1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VyX3BvcyA+PSBpbnB1dF9sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGMgPT09ICcsJykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW2MsICdUS19DT01NQSddO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYyA9PT0gJz0nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX0VRVUFMUyddO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbYywgJ1RLX09QRVJBVE9SJ107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gW2MsICdUS19VTktOT1dOJ107XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc3RhcnRfZXhwcigpIHtcbiAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG5leHRfbW9kZSA9IE1PREUuRXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmICh0b2tlbl90ZXh0ID09PSAnWycpIHtcblxuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19XT1JEJyB8fCBmbGFncy5sYXN0X3RleHQgPT09ICcpJykge1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGFycmF5IGluZGV4IHNwZWNpZmllciwgYnJlYWsgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICAgICAgLy8gYVt4XSwgZm4oKVt4XVxuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgbGluZV9zdGFydGVycykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNldF9tb2RlKG5leHRfbW9kZSk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIGluZGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0LnNwYWNlX2luX3BhcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbmV4dF9tb2RlID0gTU9ERS5BcnJheUxpdGVyYWw7XG4gICAgICAgICAgICAgICAgaWYgKGlzX2FycmF5KGZsYWdzLm1vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbGFncy5sYXN0X3RleHQgPT09ICdbJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJywnICYmIChsYXN0X2xhc3RfdGV4dCA9PT0gJ10nIHx8IGxhc3RfbGFzdF90ZXh0ID09PSAnfScpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gXSwgWyBnb2VzIHRvIG5ldyBsaW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9LCBbIGdvZXMgdG8gbmV3IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBmbGFncy5sYXN0X3RleHQgPT09ICdmb3InKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRfbW9kZSA9IE1PREUuRm9ySW5pdGlhbGl6ZXI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkoZmxhZ3MubGFzdF90ZXh0LCBbJ2lmJywgJ3doaWxlJ10pKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRfbW9kZSA9IE1PREUuQ29uZGl0aW9uYWw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbmV4dF9tb2RlID0gTU9ERS5FeHByZXNzaW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJzsnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJykge1xuICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX0VORF9CTE9DSycgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnLicpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBDb25zaWRlciB3aGV0aGVyIGZvcmNpbmcgdGhpcyBpcyByZXF1aXJlZC4gIFJldmlldyBmYWlsaW5nIHRlc3RzIHdoZW4gcmVtb3ZlZC5cbiAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKGlucHV0X3dhbnRlZF9uZXdsaW5lKTtcbiAgICAgICAgICAgICAgICBvdXRwdXRfd3JhcHBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIGRvIG5vdGhpbmcgb24gKCggYW5kICkoIGFuZCBdWyBhbmQgXSggYW5kIC4oXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCEobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIHRva2VuX3RleHQgPT09ICcoJykgJiYgbGFzdF90eXBlICE9PSAnVEtfV09SRCcgJiYgbGFzdF90eXBlICE9PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiAoZmxhZ3MubGFzdF93b3JkID09PSAnZnVuY3Rpb24nIHx8IGZsYWdzLmxhc3Rfd29yZCA9PT0gJ3R5cGVvZicpKSB7XG4gICAgICAgICAgICAgICAgLy8gZnVuY3Rpb24oKSB2cyBmdW5jdGlvbiAoKVxuICAgICAgICAgICAgICAgIGlmIChvcHQuanNsaW50X2hhcHB5KSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIChpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIGxpbmVfc3RhcnRlcnMpIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJ2NhdGNoJykpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0LnNwYWNlX2JlZm9yZV9jb25kaXRpb25hbCkge1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFN1cHBvcnQgb2YgdGhpcyBraW5kIG9mIG5ld2xpbmUgcHJlc2VydmF0aW9uLlxuICAgICAgICAgICAgLy8gYSA9IChiICYmXG4gICAgICAgICAgICAvLyAgICAgKGMgfHwgZCkpO1xuICAgICAgICAgICAgaWYgKHRva2VuX3RleHQgPT09ICcoJykge1xuICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19FUVVBTFMnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0X29mX29iamVjdF9wcm9wZXJ0eSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldF9tb2RlKG5leHRfbW9kZSk7XG4gICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgaWYgKG9wdC5zcGFjZV9pbl9wYXJlbikge1xuICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJbiBhbGwgY2FzZXMsIGlmIHdlIG5ld2xpbmUgd2hpbGUgaW5zaWRlIGFuIGV4cHJlc3Npb24gaXQgc2hvdWxkIGJlIGluZGVudGVkLlxuICAgICAgICAgICAgaW5kZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVfZW5kX2V4cHIoKSB7XG4gICAgICAgICAgICAvLyBzdGF0ZW1lbnRzIGluc2lkZSBleHByZXNzaW9ucyBhcmUgbm90IHZhbGlkIHN5bnRheCwgYnV0Li4uXG4gICAgICAgICAgICAvLyBzdGF0ZW1lbnRzIG11c3QgYWxsIGJlIGNsb3NlZCB3aGVuIHRoZWlyIGNvbnRhaW5lciBjbG9zZXNcbiAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZmxhZ3MubXVsdGlsaW5lX2ZyYW1lKSB7XG4gICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSh0b2tlbl90ZXh0ID09PSAnXScgJiYgaXNfYXJyYXkoZmxhZ3MubW9kZSkgJiYgIW9wdC5rZWVwX2FycmF5X2luZGVudGF0aW9uKTtcbiAgICAgICAgICAgICAgICBvdXRwdXRfd3JhcHBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob3B0LnNwYWNlX2luX3BhcmVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0VYUFInICYmICEgb3B0LnNwYWNlX2luX2VtcHR5X3BhcmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICgpIFtdIG5vIGlubmVyIHNwYWNlIGluIGVtcHR5IHBhcmVucyBsaWtlIHRoZXNlLCBldmVyLCByZWYgIzMyMFxuICAgICAgICAgICAgICAgICAgICB0cmltX291dHB1dCgpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRva2VuX3RleHQgPT09ICddJyAmJiBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZW1vdmVfcmVkdW5kYW50X2luZGVudGF0aW9uKHByZXZpb3VzX2ZsYWdzKTtcblxuICAgICAgICAgICAgLy8gZG8ge30gd2hpbGUgKCkgLy8gbm8gc3RhdGVtZW50IHJlcXVpcmVkIGFmdGVyXG4gICAgICAgICAgICBpZiAoZmxhZ3MuZG9fd2hpbGUgJiYgcHJldmlvdXNfZmxhZ3MubW9kZSA9PT0gTU9ERS5Db25kaXRpb25hbCkge1xuICAgICAgICAgICAgICAgIHByZXZpb3VzX2ZsYWdzLm1vZGUgPSBNT0RFLkV4cHJlc3Npb247XG4gICAgICAgICAgICAgICAgZmxhZ3MuZG9fYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmbGFncy5kb193aGlsZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc3RhcnRfYmxvY2soKSB7XG4gICAgICAgICAgICBzZXRfbW9kZShNT0RFLkJsb2NrU3RhdGVtZW50KTtcblxuICAgICAgICAgICAgdmFyIGVtcHR5X2JyYWNlcyA9IGlzX25leHQoJ30nKTtcbiAgICAgICAgICAgIHZhciBlbXB0eV9hbm9ueW1vdXNfZnVuY3Rpb24gPSBlbXB0eV9icmFjZXMgJiYgZmxhZ3MubGFzdF93b3JkID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgICAgICAgbGFzdF90eXBlID09PSAnVEtfRU5EX0VYUFInO1xuXG4gICAgICAgICAgICBpZiAob3B0LmJyYWNlX3N0eWxlID09PSBcImV4cGFuZFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSAhPT0gJ1RLX09QRVJBVE9SJyAmJlxuICAgICAgICAgICAgICAgICAgICAoZW1wdHlfYW5vbnltb3VzX2Z1bmN0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0X3R5cGUgPT09ICdUS19FUVVBTFMnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGlzX3NwZWNpYWxfd29yZChmbGFncy5sYXN0X3RleHQpICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJ2Vsc2UnKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHsgLy8gY29sbGFwc2VcbiAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlICE9PSAnVEtfT1BFUkFUT1InICYmIGxhc3RfdHlwZSAhPT0gJ1RLX1NUQVJUX0VYUFInKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9CTE9DSycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgVEtfT1BFUkFUT1Igb3IgVEtfU1RBUlRfRVhQUlxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNfYXJyYXkocHJldmlvdXNfZmxhZ3MubW9kZSkgJiYgZmxhZ3MubGFzdF90ZXh0ID09PSAnLCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0X2xhc3RfdGV4dCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfSwgeyBpbiBhcnJheSBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTsgLy8gW2EsIGIsIGMsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICBpbmRlbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9lbmRfYmxvY2soKSB7XG4gICAgICAgICAgICAvLyBzdGF0ZW1lbnRzIG11c3QgYWxsIGJlIGNsb3NlZCB3aGVuIHRoZWlyIGNvbnRhaW5lciBjbG9zZXNcbiAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgIHJlc3RvcmVfbW9kZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGVtcHR5X2JyYWNlcyA9IGxhc3RfdHlwZSA9PT0gJ1RLX1NUQVJUX0JMT0NLJztcblxuICAgICAgICAgICAgaWYgKG9wdC5icmFjZV9zdHlsZSA9PT0gXCJleHBhbmRcIikge1xuICAgICAgICAgICAgICAgIGlmICghZW1wdHlfYnJhY2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHNraXAge31cbiAgICAgICAgICAgICAgICBpZiAoIWVtcHR5X2JyYWNlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNfYXJyYXkoZmxhZ3MubW9kZSkgJiYgb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIFJFQUxMWSBuZWVkIGEgbmV3bGluZSBoZXJlLCBidXQgbmV3bGluZXIgd291bGQgc2tpcCB0aGF0XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHQua2VlcF9hcnJheV9pbmRlbnRhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0LmtlZXBfYXJyYXlfaW5kZW50YXRpb24gPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN0b3JlX21vZGUoKTtcbiAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVfd29yZCgpIHtcbiAgICAgICAgICAgIGlmIChzdGFydF9vZl9zdGF0ZW1lbnQoKSkge1xuICAgICAgICAgICAgICAgIC8vIFRoZSBjb25kaXRpb25hbCBzdGFydHMgdGhlIHN0YXRlbWVudCBpZiBhcHByb3ByaWF0ZS5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5wdXRfd2FudGVkX25ld2xpbmUgJiYgIWlzX2V4cHJlc3Npb24oZmxhZ3MubW9kZSkgJiZcbiAgICAgICAgICAgICAgICAobGFzdF90eXBlICE9PSAnVEtfT1BFUkFUT1InIHx8IChmbGFncy5sYXN0X3RleHQgPT09ICctLScgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnKysnKSkgJiZcbiAgICAgICAgICAgICAgICBsYXN0X3R5cGUgIT09ICdUS19FUVVBTFMnICYmXG4gICAgICAgICAgICAgICAgKG9wdC5wcmVzZXJ2ZV9uZXdsaW5lcyB8fCAhKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsndmFyJywgJ2xldCcsICdjb25zdCcsICdzZXQnLCAnZ2V0J10pKSkpIHtcblxuICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZsYWdzLmRvX2Jsb2NrICYmICFmbGFncy5kb193aGlsZSkge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbl90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIHRva2VuX3RleHQgPT09ICd3aGlsZScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG8ge30gIyMgd2hpbGUgKClcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5kb193aGlsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBkbyB7fSBzaG91bGQgYWx3YXlzIGhhdmUgd2hpbGUgYXMgdGhlIG5leHQgd29yZC5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgd2UgZG9uJ3Qgc2VlIHRoZSBleHBlY3RlZCB3aGlsZSwgcmVjb3ZlclxuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmRvX2Jsb2NrID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiBtYXkgYmUgZm9sbG93ZWQgYnkgZWxzZSwgb3Igbm90XG4gICAgICAgICAgICAvLyBCYXJlL2lubGluZSBpZnMgYXJlIHRyaWNreVxuICAgICAgICAgICAgLy8gTmVlZCB0byB1bndpbmQgdGhlIG1vZGVzIGNvcnJlY3RseTogaWYgKGEpIGlmIChiKSBjKCk7IGVsc2UgZCgpOyBlbHNlIGUoKTtcbiAgICAgICAgICAgIGlmIChmbGFncy5pZl9ibG9jaykge1xuICAgICAgICAgICAgICAgIGlmICghZmxhZ3MuZWxzZV9ibG9jayAmJiAodG9rZW5fdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiB0b2tlbl90ZXh0ID09PSAnZWxzZScpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZsYWdzLmVsc2VfYmxvY2sgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuaWZfYmxvY2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZWxzZV9ibG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRva2VuX3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgKHRva2VuX3RleHQgPT09ICdjYXNlJyB8fCAodG9rZW5fdGV4dCA9PT0gJ2RlZmF1bHQnICYmIGZsYWdzLmluX2Nhc2Vfc3RhdGVtZW50KSkpIHtcbiAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLmNhc2VfYm9keSB8fCBvcHQuanNsaW50X2hhcHB5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHN3aXRjaCBjYXNlcyBmb2xsb3dpbmcgb25lIGFub3RoZXJcbiAgICAgICAgICAgICAgICAgICAgZGVpbmRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuY2FzZV9ib2R5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgZmxhZ3MuaW5fY2FzZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgZmxhZ3MuaW5fY2FzZV9zdGF0ZW1lbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRva2VuX3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgdG9rZW5fdGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGlmIChpbl9hcnJheShmbGFncy5sYXN0X3RleHQsIFsnfScsICc7J10pIHx8IChqdXN0X2FkZGVkX25ld2xpbmUoKSAmJiAhIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWyd7JywgJzonLCAnPScsICcsJ10pKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlcmUgaXMgYSBuaWNlIGNsZWFuIHNwYWNlIG9mIGF0IGxlYXN0IG9uZSBibGFuayBsaW5lXG4gICAgICAgICAgICAgICAgICAgIC8vIGJlZm9yZSBhIG5ldyBmdW5jdGlvbiBkZWZpbml0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmICggISBqdXN0X2FkZGVkX2JsYW5rbGluZSgpICYmICEgZmxhZ3MuaGFkX2NvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyB8fCBsYXN0X3R5cGUgPT09ICdUS19XT1JEJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgWydnZXQnLCAnc2V0JywgJ25ldycsICdyZXR1cm4nXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19PUEVSQVRPUicgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnPScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9vID0gZnVuY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpc19leHByZXNzaW9uKGZsYWdzLm1vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIChmdW5jdGlvblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19DT01NQScgfHwgbGFzdF90eXBlID09PSAnVEtfU1RBUlRfRVhQUicgfHwgbGFzdF90eXBlID09PSAnVEtfRVFVQUxTJyB8fCBsYXN0X3R5cGUgPT09ICdUS19PUEVSQVRPUicpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0X29mX29iamVjdF9wcm9wZXJ0eSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsbG93X3dyYXBfb3JfcHJlc2VydmVkX25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b2tlbl90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIHRva2VuX3RleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgICAgIGZsYWdzLmxhc3Rfd29yZCA9IHRva2VuX3RleHQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmVmaXggPSAnTk9ORSc7XG5cbiAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19FTkRfQkxPQ0snKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEodG9rZW5fdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiBpbl9hcnJheSh0b2tlbl90ZXh0LCBbJ2Vsc2UnLCAnY2F0Y2gnLCAnZmluYWxseSddKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHQuYnJhY2Vfc3R5bGUgPT09IFwiZXhwYW5kXCIgfHwgb3B0LmJyYWNlX3N0eWxlID09PSBcImVuZC1leHBhbmRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TRU1JQ09MT04nICYmIGZsYWdzLm1vZGUgPT09IE1PREUuQmxvY2tTdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTaG91bGQgdGhpcyBiZSBmb3IgU1RBVEVNRU5UIGFzIHdlbGw/XG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TRU1JQ09MT04nICYmIGlzX2V4cHJlc3Npb24oZmxhZ3MubW9kZSkpIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnU1BBQ0UnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TVFJJTkcnKSB7XG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ05FV0xJTkUnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgfHwgbGFzdF90eXBlID09PSAnVEtfV09SRCcpIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnU1BBQ0UnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9CTE9DSycpIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnTkVXTElORSc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX0VORF9FWFBSJykge1xuICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByZWZpeCA9ICdORVdMSU5FJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRva2VuX3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkodG9rZW5fdGV4dCwgbGluZV9zdGFydGVycykgJiYgZmxhZ3MubGFzdF90ZXh0ICE9PSAnKScpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubGFzdF90ZXh0ID09PSAnZWxzZScpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJlZml4ID0gJ1NQQUNFJztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnTkVXTElORSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b2tlbl90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KHRva2VuX3RleHQsIFsnZWxzZScsICdjYXRjaCcsICdmaW5hbGx5J10pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSAhPT0gJ1RLX0VORF9CTE9DSycgfHwgb3B0LmJyYWNlX3N0eWxlID09PSBcImV4cGFuZFwiIHx8IG9wdC5icmFjZV9zdHlsZSA9PT0gXCJlbmQtZXhwYW5kXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRyaW1fb3V0cHV0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbGluZSA9IG91dHB1dF9saW5lc1tvdXRwdXRfbGluZXMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHdlIHRyaW1tZWQgYW5kIHRoZXJlJ3Mgc29tZXRoaW5nIG90aGVyIHRoYW4gYSBjbG9zZSBibG9jayBiZWZvcmUgdXNcbiAgICAgICAgICAgICAgICAgICAgLy8gcHV0IGEgbmV3bGluZSBiYWNrIGluLiAgSGFuZGxlcyAnfSAvLyBjb21tZW50JyBzY2VuYXJpby5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmUudGV4dFtsaW5lLnRleHQubGVuZ3RoIC0gMV0gIT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAocHJlZml4ID09PSAnTkVXTElORScpIHtcbiAgICAgICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGlzX3NwZWNpYWxfd29yZChmbGFncy5sYXN0X3RleHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG5vIG5ld2xpbmUgYmV0d2VlbiAncmV0dXJuIG5ubidcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChsYXN0X3R5cGUgIT09ICdUS19FTkRfRVhQUicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChsYXN0X3R5cGUgIT09ICdUS19TVEFSVF9FWFBSJyB8fCAhKHRva2VuX3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaW5fYXJyYXkodG9rZW5fdGV4dCwgWyd2YXInLCAnbGV0JywgJ2NvbnN0J10pKSkgJiYgZmxhZ3MubGFzdF90ZXh0ICE9PSAnOicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vIG5lZWQgdG8gZm9yY2UgbmV3bGluZSBvbiAndmFyJzogZm9yICh2YXIgeCA9IDAuLi4pXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW5fdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJyAmJiB0b2tlbl90ZXh0ID09PSAnaWYnICYmIGZsYWdzLmxhc3Rfd29yZCA9PT0gJ2Vsc2UnICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJ3snKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbm8gbmV3bGluZSBmb3IgfSBlbHNlIGlmIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0b2tlbl90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGluX2FycmF5KHRva2VuX3RleHQsIGxpbmVfc3RhcnRlcnMpICYmIGZsYWdzLmxhc3RfdGV4dCAhPT0gJyknKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzX2FycmF5KGZsYWdzLm1vZGUpICYmIGZsYWdzLmxhc3RfdGV4dCA9PT0gJywnICYmIGxhc3RfbGFzdF90ZXh0ID09PSAnfScpIHtcbiAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7IC8vIH0sIGluIGxpc3RzIGdldCBhIG5ld2xpbmUgdHJlYXRtZW50XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHByZWZpeCA9PT0gJ1NQQUNFJykge1xuICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgIGZsYWdzLmxhc3Rfd29yZCA9IHRva2VuX3RleHQ7XG5cbiAgICAgICAgICAgIGlmICh0b2tlbl90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIHRva2VuX3RleHQgPT09ICdkbycpIHtcbiAgICAgICAgICAgICAgICBmbGFncy5kb19ibG9jayA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b2tlbl90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIHRva2VuX3RleHQgPT09ICdpZicpIHtcbiAgICAgICAgICAgICAgICBmbGFncy5pZl9ibG9jayA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVfc2VtaWNvbG9uKCkge1xuICAgICAgICAgICAgaWYgKHN0YXJ0X29mX3N0YXRlbWVudCgpKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGNvbmRpdGlvbmFsIHN0YXJ0cyB0aGUgc3RhdGVtZW50IGlmIGFwcHJvcHJpYXRlLlxuICAgICAgICAgICAgICAgIC8vIFNlbWljb2xvbiBjYW4gYmUgdGhlIHN0YXJ0IChhbmQgZW5kKSBvZiBhIHN0YXRlbWVudFxuICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCAmJiAhZmxhZ3MuaWZfYmxvY2sgJiYgIWZsYWdzLmRvX2Jsb2NrKSB7XG4gICAgICAgICAgICAgICAgcmVzdG9yZV9tb2RlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgaWYgKGZsYWdzLm1vZGUgPT09IE1PREUuT2JqZWN0TGl0ZXJhbCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHdlJ3JlIGluIE9CSkVDVCBtb2RlIGFuZCBzZWUgYSBzZW1pY29sb24sIGl0cyBpbnZhbGlkIHN5bnRheFxuICAgICAgICAgICAgICAgIC8vIHJlY292ZXIgYmFjayB0byB0cmVhdGluZyB0aGlzIGFzIGEgQkxPQ0tcbiAgICAgICAgICAgICAgICBmbGFncy5tb2RlID0gTU9ERS5CbG9ja1N0YXRlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9zdHJpbmcoKSB7XG4gICAgICAgICAgICBpZiAoc3RhcnRfb2Zfc3RhdGVtZW50KCkpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgY29uZGl0aW9uYWwgc3RhcnRzIHRoZSBzdGF0ZW1lbnQgaWYgYXBwcm9wcmlhdGUuXG4gICAgICAgICAgICAgICAgLy8gT25lIGRpZmZlcmVuY2UgLSBzdHJpbmdzIHdhbnQgYXQgbGVhc3QgYSBzcGFjZSBiZWZvcmVcbiAgICAgICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX1dPUkQnKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX0NPTU1BJyB8fCBsYXN0X3R5cGUgPT09ICdUS19TVEFSVF9FWFBSJyB8fCBsYXN0X3R5cGUgPT09ICdUS19FUVVBTFMnIHx8IGxhc3RfdHlwZSA9PT0gJ1RLX09QRVJBVE9SJykge1xuICAgICAgICAgICAgICAgIGlmICghc3RhcnRfb2Zfb2JqZWN0X3Byb3BlcnR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9lcXVhbHMoKSB7XG4gICAgICAgICAgICBpZiAoZmxhZ3MuZGVjbGFyYXRpb25fc3RhdGVtZW50KSB7XG4gICAgICAgICAgICAgICAgLy8ganVzdCBnb3QgYW4gJz0nIGluIGEgdmFyLWxpbmUsIGRpZmZlcmVudCBmb3JtYXR0aW5nL2xpbmUtYnJlYWtpbmcsIGV0YyB3aWxsIG5vdyBiZSBkb25lXG4gICAgICAgICAgICAgICAgZmxhZ3MuZGVjbGFyYXRpb25fYXNzaWdubWVudCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9jb21tYSgpIHtcbiAgICAgICAgICAgIGlmIChmbGFncy5kZWNsYXJhdGlvbl9zdGF0ZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNfZXhwcmVzc2lvbihmbGFncy5wYXJlbnQubW9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG8gbm90IGJyZWFrIG9uIGNvbW1hLCBmb3IodmFyIGEgPSAxLCBiID0gMilcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3MuZGVjbGFyYXRpb25fYXNzaWdubWVudCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MuZGVjbGFyYXRpb25fYXNzaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICBmbGFncy5kZWNsYXJhdGlvbl9hc3NpZ25tZW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19FTkRfQkxPQ0snICYmIGZsYWdzLm1vZGUgIT09IE1PREUuRXhwcmVzc2lvbikge1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgaWYgKGZsYWdzLm1vZGUgPT09IE1PREUuT2JqZWN0TGl0ZXJhbCAmJiBmbGFncy5sYXN0X3RleHQgPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubW9kZSA9PT0gTU9ERS5PYmplY3RMaXRlcmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBFWFBSIG9yIERPX0JMT0NLXG4gICAgICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9vcGVyYXRvcigpIHtcbiAgICAgICAgICAgIHZhciBzcGFjZV9iZWZvcmUgPSB0cnVlO1xuICAgICAgICAgICAgdmFyIHNwYWNlX2FmdGVyID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChsYXN0X3R5cGUgPT09ICdUS19SRVNFUlZFRCcgJiYgaXNfc3BlY2lhbF93b3JkKGZsYWdzLmxhc3RfdGV4dCkpIHtcbiAgICAgICAgICAgICAgICAvLyBcInJldHVyblwiIGhhZCBhIHNwZWNpYWwgaGFuZGxpbmcgaW4gVEtfV09SRC4gTm93IHdlIG5lZWQgdG8gcmV0dXJuIHRoZSBmYXZvclxuICAgICAgICAgICAgICAgIG91dHB1dF9zcGFjZV9iZWZvcmVfdG9rZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBoYWNrIGZvciBhY3Rpb25zY3JpcHQncyBpbXBvcnQgLio7XG4gICAgICAgICAgICBpZiAodG9rZW5fdGV4dCA9PT0gJyonICYmIGxhc3RfdHlwZSA9PT0gJ1RLX0RPVCcgJiYgIWxhc3RfbGFzdF90ZXh0Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodG9rZW5fdGV4dCA9PT0gJzonICYmIGZsYWdzLmluX2Nhc2UpIHtcbiAgICAgICAgICAgICAgICBmbGFncy5jYXNlX2JvZHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGluZGVudCgpO1xuICAgICAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgICAgIGZsYWdzLmluX2Nhc2UgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0b2tlbl90ZXh0ID09PSAnOjonKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gc3BhY2VzIGFyb3VuZCBleG90aWMgbmFtZXNwYWNpbmcgc3ludGF4IG9wZXJhdG9yXG4gICAgICAgICAgICAgICAgcHJpbnRfdG9rZW4oKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi81LjEvI3NlYy03LjkuMVxuICAgICAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBuZXdsaW5lIGJldHdlZW4gLS0gb3IgKysgYW5kIGFueXRoaW5nIGVsc2Ugd2Ugc2hvdWxkIHByZXNlcnZlIGl0LlxuICAgICAgICAgICAgaWYgKGlucHV0X3dhbnRlZF9uZXdsaW5lICYmICh0b2tlbl90ZXh0ID09PSAnLS0nIHx8IHRva2VuX3RleHQgPT09ICcrKycpKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbGxvdyBsaW5lIHdyYXBwaW5nIGJldHdlZW4gb3BlcmF0b3JzXG4gICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfT1BFUkFUT1InKSB7XG4gICAgICAgICAgICAgICAgYWxsb3dfd3JhcF9vcl9wcmVzZXJ2ZWRfbmV3bGluZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaW5fYXJyYXkodG9rZW5fdGV4dCwgWyctLScsICcrKycsICchJ10pIHx8IChpbl9hcnJheSh0b2tlbl90ZXh0LCBbJy0nLCAnKyddKSAmJiAoaW5fYXJyYXkobGFzdF90eXBlLCBbJ1RLX1NUQVJUX0JMT0NLJywgJ1RLX1NUQVJUX0VYUFInLCAnVEtfRVFVQUxTJywgJ1RLX09QRVJBVE9SJ10pIHx8IGluX2FycmF5KGZsYWdzLmxhc3RfdGV4dCwgbGluZV9zdGFydGVycykgfHwgZmxhZ3MubGFzdF90ZXh0ID09PSAnLCcpKSkge1xuICAgICAgICAgICAgICAgIC8vIHVuYXJ5IG9wZXJhdG9ycyAoYW5kIGJpbmFyeSArLy0gcHJldGVuZGluZyB0byBiZSB1bmFyeSkgc3BlY2lhbCBjYXNlc1xuXG4gICAgICAgICAgICAgICAgc3BhY2VfYmVmb3JlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc3BhY2VfYWZ0ZXIgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGlmIChmbGFncy5sYXN0X3RleHQgPT09ICc7JyAmJiBpc19leHByZXNzaW9uKGZsYWdzLm1vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZvciAoOzsgKytpKVxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgXl5eXG4gICAgICAgICAgICAgICAgICAgIHNwYWNlX2JlZm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxhc3RfdHlwZSA9PT0gJ1RLX1JFU0VSVkVEJykge1xuICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgoZmxhZ3MubW9kZSA9PT0gTU9ERS5CbG9ja1N0YXRlbWVudCB8fCBmbGFncy5tb2RlID09PSBNT0RFLlN0YXRlbWVudCkgJiYgKGZsYWdzLmxhc3RfdGV4dCA9PT0gJ3snIHx8IGZsYWdzLmxhc3RfdGV4dCA9PT0gJzsnKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyB7IGZvbzsgLS1pIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gZm9vKCk7IC0tYmFyO1xuICAgICAgICAgICAgICAgICAgICBwcmludF9uZXdsaW5lKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b2tlbl90ZXh0ID09PSAnOicpIHtcbiAgICAgICAgICAgICAgICBpZiAoZmxhZ3MudGVybmFyeV9kZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxhZ3MubW9kZSA9PT0gTU9ERS5CbG9ja1N0YXRlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MubW9kZSA9IE1PREUuT2JqZWN0TGl0ZXJhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzcGFjZV9iZWZvcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmbGFncy50ZXJuYXJ5X2RlcHRoIC09IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh0b2tlbl90ZXh0ID09PSAnPycpIHtcbiAgICAgICAgICAgICAgICBmbGFncy50ZXJuYXJ5X2RlcHRoICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiB8fCBzcGFjZV9iZWZvcmU7XG4gICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHNwYWNlX2FmdGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlX2Jsb2NrX2NvbW1lbnQoKSB7XG4gICAgICAgICAgICB2YXIgbGluZXMgPSBzcGxpdF9uZXdsaW5lcyh0b2tlbl90ZXh0KTtcbiAgICAgICAgICAgIHZhciBqOyAvLyBpdGVyYXRvciBmb3IgdGhpcyBjYXNlXG4gICAgICAgICAgICB2YXIgamF2YWRvYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBibG9jayBjb21tZW50IHN0YXJ0cyB3aXRoIGEgbmV3IGxpbmVcbiAgICAgICAgICAgIHByaW50X25ld2xpbmUoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgaWYgKGxpbmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWxsX2xpbmVzX3N0YXJ0X3dpdGgobGluZXMuc2xpY2UoMSksICcqJykpIHtcbiAgICAgICAgICAgICAgICAgICAgamF2YWRvYyA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBmaXJzdCBsaW5lIGFsd2F5cyBpbmRlbnRlZFxuICAgICAgICAgICAgcHJpbnRfdG9rZW4obGluZXNbMF0pO1xuICAgICAgICAgICAgZm9yIChqID0gMTsgaiA8IGxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgaWYgKGphdmFkb2MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gamF2YWRvYzogcmVmb3JtYXQgYW5kIHJlLWluZGVudFxuICAgICAgICAgICAgICAgICAgICBwcmludF90b2tlbignICcgKyB0cmltKGxpbmVzW2pdKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gbm9ybWFsIGNvbW1lbnRzIG91dHB1dCByYXdcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0X2xpbmVzW291dHB1dF9saW5lcy5sZW5ndGggLSAxXS50ZXh0LnB1c2gobGluZXNbal0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZm9yIGNvbW1lbnRzIG9mIG1vcmUgdGhhbiBvbmUgbGluZSwgbWFrZSBzdXJlIHRoZXJlJ3MgYSBuZXcgbGluZSBhZnRlclxuICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBoYW5kbGVfaW5saW5lX2NvbW1lbnQoKSB7XG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9jb21tZW50KCkge1xuICAgICAgICAgICAgaWYgKGlucHV0X3dhbnRlZF9uZXdsaW5lKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRfbmV3bGluZShmYWxzZSwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyaW1fb3V0cHV0KHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRwdXRfc3BhY2VfYmVmb3JlX3Rva2VuID0gdHJ1ZTtcbiAgICAgICAgICAgIHByaW50X3Rva2VuKCk7XG4gICAgICAgICAgICBwcmludF9uZXdsaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZV9kb3QoKSB7XG4gICAgICAgICAgICBpZiAobGFzdF90eXBlID09PSAnVEtfUkVTRVJWRUQnICYmIGlzX3NwZWNpYWxfd29yZChmbGFncy5sYXN0X3RleHQpKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0X3NwYWNlX2JlZm9yZV90b2tlbiA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFsbG93IHByZXNlcnZlZCBuZXdsaW5lcyBiZWZvcmUgZG90cyBpbiBnZW5lcmFsXG4gICAgICAgICAgICAgICAgLy8gZm9yY2UgbmV3bGluZXMgb24gZG90cyBhZnRlciBjbG9zZSBwYXJlbiB3aGVuIGJyZWFrX2NoYWluZWQgLSBmb3IgYmFyKCkuYmF6KClcbiAgICAgICAgICAgICAgICBhbGxvd193cmFwX29yX3ByZXNlcnZlZF9uZXdsaW5lKGZsYWdzLmxhc3RfdGV4dCA9PT0gJyknICYmIG9wdC5icmVha19jaGFpbmVkX21ldGhvZHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmludF90b2tlbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlX3Vua25vd24oKSB7XG4gICAgICAgICAgICBwcmludF90b2tlbigpO1xuXG4gICAgICAgICAgICBpZiAodG9rZW5fdGV4dFt0b2tlbl90ZXh0Lmxlbmd0aCAtIDFdID09PSAnXFxuJykge1xuICAgICAgICAgICAgICAgIHByaW50X25ld2xpbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIC8vIEFkZCBzdXBwb3J0IGZvciBBTUQgKCBodHRwczovL2dpdGh1Yi5jb20vYW1kanMvYW1kanMtYXBpL3dpa2kvQU1EI2RlZmluZWFtZC1wcm9wZXJ0eS0gKVxuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHsganNfYmVhdXRpZnk6IGpzX2JlYXV0aWZ5IH07XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gQWRkIHN1cHBvcnQgZm9yIENvbW1vbkpTLiBKdXN0IHB1dCB0aGlzIGZpbGUgc29tZXdoZXJlIG9uIHlvdXIgcmVxdWlyZS5wYXRoc1xuICAgICAgICAvLyBhbmQgeW91IHdpbGwgYmUgYWJsZSB0byBgdmFyIGpzX2JlYXV0aWZ5ID0gcmVxdWlyZShcImJlYXV0aWZ5XCIpLmpzX2JlYXV0aWZ5YC5cbiAgICAgICAgZXhwb3J0cy5qc19iZWF1dGlmeSA9IGpzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSdyZSBydW5uaW5nIGEgd2ViIHBhZ2UgYW5kIGRvbid0IGhhdmUgZWl0aGVyIG9mIHRoZSBhYm92ZSwgYWRkIG91ciBvbmUgZ2xvYmFsXG4gICAgICAgIHdpbmRvdy5qc19iZWF1dGlmeSA9IGpzX2JlYXV0aWZ5O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBJZiB3ZSBkb24ndCBldmVuIGhhdmUgd2luZG93LCB0cnkgZ2xvYmFsLlxuICAgICAgICBnbG9iYWwuanNfYmVhdXRpZnkgPSBqc19iZWF1dGlmeTtcbiAgICB9XG5cbn0oKSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyIGZpbGVzeXN0ZW0gPSByZXF1aXJlKCcuLi9maWxlLXN5c3RlbScpO1xudmFyIHdhdGNoZXIgPSByZXF1aXJlKCcuLi9maWxlLXN5c3RlbS13YXRjaGVyJyk7XG52YXIgc2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBFZGl0b3IgPSByZXF1aXJlKCcuLi9lZGl0b3InKTtcbnZhciBTZXNzaW9uID0gcmVxdWlyZSgnLi4vZWRpdG9yL3Nlc3Npb24nKTtcblxuXG4vLyB0b2RvOiBzb3J0IG91dCB0aGUgc2Vzc2lvbi9lZGl0b3IvbWFuYWdlciBiaW5kaW5ncy5cbi8vIE5vdCBzdXJlIGlmIHNlc3Npb25zIGFyZSBnZXR0aW5nIGRlc3Ryb3llZCBjb3JyZWN0bHkuXG5cblxuYXBwLmNvbnRyb2xsZXIoJ0FwcEN0cmwnLCBbJyRzY29wZScsICckbW9kYWwnLCAnZGlhbG9nJyxcbiAgZnVuY3Rpb24oJHNjb3BlLCAkbW9kYWwsICRkaWFsb2cpIHtcblxuICAgIHZhciBjb2RlRWRpdG9yO1xuXG4gICAgLypcbiAgICAgKiBTZXQgcm9vdCBzY29wZSBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgJHNjb3BlLmZzVHJlZSA9IHdhdGNoZXIudHJlZTtcbiAgICAkc2NvcGUuZnNMaXN0ID0gd2F0Y2hlci5saXN0O1xuICAgICRzY29wZS5zZXNzaW9ucyA9IHNlc3Npb25NYW5hZ2VyLnNlc3Npb25zO1xuICAgICRzY29wZS5hY3RpdmVTZXNzaW9uID0gbnVsbDtcblxuICAgIHdhdGNoZXIub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgJHNjb3BlLmZzVHJlZSA9IHdhdGNoZXIudHJlZTtcbiAgICAgICRzY29wZS5mc0xpc3QgPSB3YXRjaGVyLmxpc3Q7XG4gICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgfSk7XG5cbiAgICB3YXRjaGVyLm9uKCd1bmxpbmsnLCBmdW5jdGlvbihmc28pIHtcbiAgICAgIHZhciBzZXNzaW9uID0gc2Vzc2lvbk1hbmFnZXIuZ2V0U2Vzc2lvbihmc28ucGF0aCk7XG4gICAgICBpZiAoc2Vzc2lvbikge1xuICAgICAgICByZW1vdmVTZXNzaW9uKHNlc3Npb24pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2Vzc2lvbk1hbmFnZXIub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgICAgJHNjb3BlLiRhcHBseSgpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gcmVtb3ZlU2Vzc2lvbihzZXNzaW9uKSB7XG5cbiAgICAgIC8vIGNoZWNrIGlmIGl0J3MgdGhlIGFjdGl2ZSBzZXNzaW9uXG4gICAgICBpZiAoJHNjb3BlLmFjdGl2ZVNlc3Npb24gPT09IHNlc3Npb24pIHtcbiAgICAgICAgJHNjb3BlLmdldEVkaXRvcigpLmNsZWFyU2Vzc2lvbigpO1xuICAgICAgICAkc2NvcGUuYWN0aXZlU2Vzc2lvbiA9IG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vIHRvZG86IHNvcnQgdGhpcyBvdXQgLy9cbiAgICAgIC8vIHJlbW92ZSB0aGUgc2Vzc2lvblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gZG8gdGhpcyBhZnRlciBhIHNob3J0IGRlbGF5IHRvIGF2b2lkXG4gICAgICAgIC8vIEVycm9yOiAkcm9vdFNjb3BlOmlucHJvZy4gQWN0aW9uIEFscmVhZHkgSW4gUHJvZ3Jlc3NcbiAgICAgICAgc2Vzc2lvbk1hbmFnZXIucmVtb3ZlKHNlc3Npb24uZnNvLnBhdGgpO1xuICAgICAgfSwgMSk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzYXZlU2Vzc2lvbihzZXNzaW9uKSB7XG4gICAgICB2YXIgcGF0aCA9IHNlc3Npb24uZnNvLnBhdGg7XG4gICAgICB2YXIgY29udGVudHMgPSBzZXNzaW9uLmdldFZhbHVlKCk7XG4gICAgICBmaWxlc3lzdGVtLndyaXRlRmlsZShwYXRoLCBjb250ZW50cywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycikge1xuICAgICAgICAgICRkaWFsb2cuYWxlcnQoe1xuICAgICAgICAgICAgdGl0bGU6ICdGaWxlIFN5c3RlbSBXcml0ZSBFcnJvcicsXG4gICAgICAgICAgICBtZXNzYWdlOiBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5lcnIpXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2Vzc2lvbi5tYXJrQ2xlYW4oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5pdGlhbGl6ZUNvZGVFZGl0b3IoKSB7XG4gICAgICBjb2RlRWRpdG9yID0gbmV3IEVkaXRvcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29kZS1lZGl0b3InKSk7XG5cbiAgICAgIGNvZGVFZGl0b3Iub24oJ3NhdmUnLCBmdW5jdGlvbihzZXNzaW9uKSB7XG4gICAgICAgIHNhdmVTZXNzaW9uKHNlc3Npb24pO1xuICAgICAgfSk7XG5cbiAgICAgIGNvZGVFZGl0b3Iub24oJ3NhdmVhbGwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlc3Npb25zID0gc2Vzc2lvbk1hbmFnZXIuc2Vzc2lvbnM7XG4gICAgICAgIGZvciAodmFyIHBhdGggaW4gc2Vzc2lvbnMpIHtcbiAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHNlc3Npb25zW3BhdGhdO1xuICAgICAgICAgIGlmIChzZXNzaW9uLmlzRGlydHkoKSkge1xuICAgICAgICAgICAgc2F2ZVNlc3Npb24oc2Vzc2lvbik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgY29kZUVkaXRvci5vbignaGVscCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAkbW9kYWwub3Blbih7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdrZXlib2FyZC1zaG9ydGN1dHMuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gU2ltcGxlTW9kYWxDdHJsKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UpIHtcbiAgICAgICAgICAgICRzY29wZS5vayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgJG1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzaXplOiAnbGcnXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBjb2RlRWRpdG9yO1xuICAgIH1cblxuICAgICRzY29wZS5nZXRFZGl0b3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBjb2RlRWRpdG9yIHx8IGluaXRpYWxpemVDb2RlRWRpdG9yKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5vcGVuID0gZnVuY3Rpb24oZnNvKSB7XG4gICAgICB2YXIgZXhpc3RpbmcgPSBzZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGZzby5wYXRoKTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgZmlsZXN5c3RlbS5yZWFkRmlsZShmc28ucGF0aCwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cbiAgICAgICAgICB2YXIgc2Vzc2lvbiA9IG5ldyBTZXNzaW9uKGRhdGEpO1xuICAgICAgICAgIHNlc3Npb25NYW5hZ2VyLmFkZChkYXRhLnBhdGgsIHNlc3Npb24pO1xuICAgICAgICAgIG9wZW5TZXNzaW9uKHNlc3Npb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wZW5TZXNzaW9uKGV4aXN0aW5nKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgJHNjb3BlLmNsaWNrU2Vzc2lvbiA9IGZ1bmN0aW9uKGUsIHNlc3Npb24pIHtcbiAgICAgIC8vIGFjdGl2YXRlIG9yIGNsb3NlXG4gICAgICBpZiAoZS50YXJnZXQuY2xhc3NOYW1lID09PSAnY2xvc2UnKSB7XG4gICAgICAgIGNsb3NlU2Vzc2lvbihzZXNzaW9uKTtcbiAgICAgIH0gZWxzZSAge1xuICAgICAgICBvcGVuU2Vzc2lvbihzZXNzaW9uKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb3BlblNlc3Npb24oc2Vzc2lvbikge1xuICAgICAgJHNjb3BlLmFjdGl2ZVNlc3Npb24gPSBzZXNzaW9uO1xuICAgICAgJHNjb3BlLmdldEVkaXRvcigpLnNldFNlc3Npb24oc2Vzc2lvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VTZXNzaW9uKHNlc3Npb24pIHtcbiAgICAgIHJlbW92ZVNlc3Npb24oc2Vzc2lvbik7XG4gICAgfVxuICB9XG5dKTtcbiIsInZhciBwID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIGZpbGVzeXN0ZW0gPSByZXF1aXJlKCcuLi9maWxlLXN5c3RlbScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcbnZhciBoYW5kbGVyID0gdXRpbHMudWkucmVzcG9uc2VIYW5kbGVyO1xuXG5cbmFwcC5jb250cm9sbGVyKCdUcmVlQ3RybCcsIFsnJHNjb3BlJywgJyRtb2RhbCcsICckbG9nJywgJ2RpYWxvZycsXG4gIGZ1bmN0aW9uKCRzY29wZSwgJG1vZGFsLCAkbG9nLCAkZGlhbG9nKSB7XG5cbiAgICB2YXIgZXhwYW5kZWQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgJHNjb3BlLnNob3dNZW51ID0gZmFsc2U7XG4gICAgJHNjb3BlLmFjdGl2ZSA9IG51bGw7XG4gICAgJHNjb3BlLnBhc3RlQnVmZmVyID0gbnVsbDtcblxuICAgIGZ1bmN0aW9uIGdlbmVyaWNGaWxlU3lzdGVtQ2FsbGJhY2socmVzcG9uc2UpIHtcbiAgICAgIC8vIG5vdGlmeSBvZiBhbnkgZXJyb3JzLCBvdGhlcndpc2Ugc2lsZW50LlxuICAgICAgLy8gVGhlIEZpbGUgU3lzdGVtIFdhdGNoZXIgd2lsbCBoYW5kbGUgdGhlIHN0YXRlIGNoYW5nZXMgaW4gdGhlIGZpbGUgc3lzdGVtXG4gICAgICBpZiAocmVzcG9uc2UuZXJyKSB7XG4gICAgICAgICRkaWFsb2cuYWxlcnQoe1xuICAgICAgICAgIHRpdGxlOiAnRmlsZSBTeXN0ZW0gRXJyb3InLFxuICAgICAgICAgIG1lc3NhZ2U6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmVycilcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgJHNjb3BlLmdldENsYXNzTmFtZSA9IGZ1bmN0aW9uKGZzbykge1xuICAgICAgdmFyIGNsYXNzZXMgPSBbJ2ZzbyddO1xuICAgICAgY2xhc3Nlcy5wdXNoKGZzby5pc0RpcmVjdG9yeSA/ICdkaXInIDogJ2ZpbGUnKTtcblxuICAgICAgaWYgKGZzbyA9PT0gJHNjb3BlLmFjdGl2ZSkge1xuICAgICAgICBjbGFzc2VzLnB1c2goJ2FjdGl2ZScpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5nZXRJY29uQ2xhc3NOYW1lID0gZnVuY3Rpb24oZnNvKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IFsnZmEnXTtcblxuICAgICAgaWYgKGZzby5pc0RpcmVjdG9yeSkge1xuICAgICAgICBjbGFzc2VzLnB1c2goJHNjb3BlLmlzRXhwYW5kZWQoZnNvKSA/ICdmYS1mb2xkZXItb3BlbicgOiAnZmEtZm9sZGVyJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjbGFzc2VzLnB1c2goJ2ZhLWZpbGUtbycpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG4gICAgfTtcblxuICAgICRzY29wZS5pc0V4cGFuZGVkID0gZnVuY3Rpb24oZnNvKSB7XG4gICAgICByZXR1cm4gISFleHBhbmRlZFtmc28ucGF0aF07XG4gICAgfTtcblxuICAgICRzY29wZS5yaWdodENsaWNrTm9kZSA9IGZ1bmN0aW9uKGUsIGZzbykge1xuICAgICAgY29uc29sZS5sb2coJ1JDbGlja2VkICcgKyBmc28ubmFtZSk7XG4gICAgICAkc2NvcGUubWVudVggPSBlLnBhZ2VYO1xuICAgICAgJHNjb3BlLm1lbnVZID0gZS5wYWdlWTtcbiAgICAgICRzY29wZS5hY3RpdmUgPSBmc287XG4gICAgICAkc2NvcGUuc2hvd01lbnUgPSB0cnVlO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2xpY2tOb2RlID0gZnVuY3Rpb24oZSwgZnNvKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAkc2NvcGUuYWN0aXZlID0gZnNvO1xuXG4gICAgICBpZiAoZnNvLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgIHZhciBpc0V4cGFuZGVkID0gJHNjb3BlLmlzRXhwYW5kZWQoZnNvKTtcbiAgICAgICAgaWYgKGlzRXhwYW5kZWQpIHtcbiAgICAgICAgICBkZWxldGUgZXhwYW5kZWRbZnNvLnBhdGhdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cGFuZGVkW2Zzby5wYXRoXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICRzY29wZS5vcGVuKGZzbyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmRlbGV0ZSA9IGZ1bmN0aW9uKGUsIGZzbykge1xuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICRkaWFsb2cuY29uZmlybSh7XG4gICAgICAgIHRpdGxlOiAnRGVsZXRlICcgKyAoZnNvLmlzRGlyZWN0b3J5ID8gJ2ZvbGRlcicgOiAnZmlsZScpLFxuICAgICAgICBtZXNzYWdlOiAnRGVsZXRlIFsnICsgZnNvLm5hbWUgKyAnXS4gQXJlIHlvdSBzdXJlPydcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIGZpbGVzeXN0ZW0ucmVtb3ZlKGZzby5wYXRoLCBnZW5lcmljRmlsZVN5c3RlbUNhbGxiYWNrKTtcbiAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAkbG9nLmluZm8oJ0RlbGV0ZSBtb2RhbCBkaXNtaXNzZWQnKTtcbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5yZW5hbWUgPSBmdW5jdGlvbihlLCBmc28pIHtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAkZGlhbG9nLnByb21wdCh7XG4gICAgICAgIHRpdGxlOiAnUmVuYW1lICcgKyAoZnNvLmlzRGlyZWN0b3J5ID8gJ2ZvbGRlcicgOiAnZmlsZScpLFxuICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIGVudGVyIGEgbmV3IG5hbWUnLFxuICAgICAgICBkZWZhdWx0VmFsdWU6IGZzby5uYW1lLFxuICAgICAgICBwbGFjZWhvbGRlcjogZnNvLmlzRGlyZWN0b3J5ID8gJ0ZvbGRlciBuYW1lJyA6ICdGaWxlIG5hbWUnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHZhciBvbGRQYXRoID0gZnNvLnBhdGg7XG4gICAgICAgIHZhciBuZXdQYXRoID0gcC5yZXNvbHZlKGZzby5kaXIsIHZhbHVlKTtcbiAgICAgICAgZmlsZXN5c3RlbS5yZW5hbWUob2xkUGF0aCwgbmV3UGF0aCwgZ2VuZXJpY0ZpbGVTeXN0ZW1DYWxsYmFjayk7XG4gICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGxvZy5pbmZvKCdSZW5hbWUgbW9kYWwgZGlzbWlzc2VkJyk7XG4gICAgICB9KTtcblxuICAgIH07XG5cbiAgICAkc2NvcGUubWtmaWxlID0gZnVuY3Rpb24oZSwgZnNvKSB7XG5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgJGRpYWxvZy5wcm9tcHQoe1xuICAgICAgICB0aXRsZTogJ0FkZCBuZXcgZmlsZScsXG4gICAgICAgIHBsYWNlaG9sZGVyOiAnRmlsZSBuYW1lJyxcbiAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBlbnRlciB0aGUgbmV3IGZpbGUgbmFtZSdcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZmlsZXN5c3RlbS5ta2ZpbGUocC5yZXNvbHZlKGZzby5wYXRoLCB2YWx1ZSksIGdlbmVyaWNGaWxlU3lzdGVtQ2FsbGJhY2spO1xuICAgICAgfSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICRsb2cuaW5mbygnTWFrZSBmaWxlIG1vZGFsIGRpc21pc3NlZCcpO1xuICAgICAgfSk7XG5cbiAgICB9O1xuXG4gICAgJHNjb3BlLm1rZGlyID0gZnVuY3Rpb24oZSwgZnNvKSB7XG5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgJGRpYWxvZy5wcm9tcHQoe1xuICAgICAgICB0aXRsZTogJ0FkZCBuZXcgZm9sZGVyJyxcbiAgICAgICAgcGxhY2Vob2xkZXI6ICdGb2xkZXIgbmFtZScsXG4gICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgZW50ZXIgdGhlIG5ldyBmb2xkZXIgbmFtZSdcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZmlsZXN5c3RlbS5ta2RpcihwLnJlc29sdmUoZnNvLnBhdGgsIHZhbHVlKSwgZ2VuZXJpY0ZpbGVTeXN0ZW1DYWxsYmFjayk7XG4gICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgJGxvZy5pbmZvKCdNYWtlIGRpcmVjdG9yeSBtb2RhbCBkaXNtaXNzZWQnKTtcbiAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5wYXN0ZSA9IGZ1bmN0aW9uKGUsIGZzbykge1xuXG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIHZhciBwYXN0ZUJ1ZmZlciA9ICRzY29wZS5wYXN0ZUJ1ZmZlcjtcblxuICAgICAgaWYgKHBhc3RlQnVmZmVyLm9wID09PSAnY29weScpIHtcbiAgICAgICAgZmlsZXN5c3RlbS5jb3B5KHBhc3RlQnVmZmVyLmZzby5wYXRoLCBwLnJlc29sdmUoZnNvLnBhdGgsIHBhc3RlQnVmZmVyLmZzby5uYW1lKSwgZ2VuZXJpY0ZpbGVTeXN0ZW1DYWxsYmFjayk7XG4gICAgICB9IGVsc2UgaWYgKHBhc3RlQnVmZmVyLm9wID09PSAnY3V0Jykge1xuICAgICAgICBmaWxlc3lzdGVtLnJlbmFtZShwYXN0ZUJ1ZmZlci5mc28ucGF0aCwgcC5yZXNvbHZlKGZzby5wYXRoLCBwYXN0ZUJ1ZmZlci5mc28ubmFtZSksIGdlbmVyaWNGaWxlU3lzdGVtQ2FsbGJhY2spO1xuICAgICAgfVxuXG4gICAgICAkc2NvcGUucGFzdGVCdWZmZXIgPSBudWxsO1xuXG4gICAgfTtcblxuICAgICRzY29wZS5zaG93UGFzdGUgPSBmdW5jdGlvbihlLCBhY3RpdmUpIHtcbiAgICAgIHZhciBwYXN0ZUJ1ZmZlciA9ICRzY29wZS5wYXN0ZUJ1ZmZlcjtcblxuICAgICAgaWYgKHBhc3RlQnVmZmVyICYmIGFjdGl2ZS5pc0RpcmVjdG9yeSkge1xuICAgICAgICBpZiAoIXBhc3RlQnVmZmVyLmZzby5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKGFjdGl2ZS5wYXRoLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihwYXN0ZUJ1ZmZlci5mc28ucGF0aC50b0xvd2VyQ2FzZSgpKSAhPT0gMCkgeyAvLyBkaXNhbGxvdyBwYXN0aW5nIGludG8gc2VsZiBvciBhIGRlY2VuZGVudFxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgICRzY29wZS5zZXRQYXN0ZUJ1ZmZlciA9IGZ1bmN0aW9uKGUsIGZzbywgb3ApIHtcblxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAkc2NvcGUucGFzdGVCdWZmZXIgPSB7XG4gICAgICAgIGZzbzogZnNvLFxuICAgICAgICBvcDogb3BcbiAgICAgIH07XG5cbiAgICB9O1xuXG4gIH1cbl0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnbmdSaWdodENsaWNrJywgZnVuY3Rpb24oJHBhcnNlKSB7XG4gIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICB2YXIgZm4gPSAkcGFyc2UoYXR0cnMubmdSaWdodENsaWNrKTtcbiAgICBlbGVtZW50LmJpbmQoJ2NvbnRleHRtZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGZuKHNjb3BlLCB7XG4gICAgICAgICAgJGV2ZW50OiBlXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcbn0pO1xuIiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJykuZWRpdG9yO1xudmFyIGJlYXV0aWZ5Q29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKS5iZWF1dGlmeTtcbnZhciBiZWF1dGlmeV9qcyA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5Jyk7XG52YXIgYmVhdXRpZnlfY3NzID0gcmVxdWlyZSgnanMtYmVhdXRpZnknKS5jc3M7XG52YXIgYmVhdXRpZnlfaHRtbCA9IHJlcXVpcmUoJ2pzLWJlYXV0aWZ5JykuaHRtbDtcblxuYWNlLnJlcXVpcmUoXCJhY2UvZXh0L2VtbWV0XCIpO1xuYWNlLnJlcXVpcmUoXCJhY2UvZXh0L2xhbmd1YWdlX3Rvb2xzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsKSB7XG5cbiAgdmFyIGVkaXRvciA9IGFjZS5lZGl0KGVsKTtcblxuICBlZGl0b3Iuc2V0T3B0aW9ucyh7XG4gICAgZW5hYmxlRW1tZXQ6IHRydWUsXG4gICAgZW5hYmxlU25pcHBldHM6IHRydWUsXG4gICAgZW5hYmxlQmFzaWNBdXRvY29tcGxldGlvbjogdHJ1ZVxuICB9KTtcblxuICBpZiAodHlwZW9mIGNvbmZpZy50aGVtZSA9PT0gJ3N0cmluZycpIHtcbiAgICBlZGl0b3Iuc2V0VGhlbWUoJ2FjZS90aGVtZS8nICsgY29uZmlnLnRoZW1lKTtcbiAgfVxuICBpZiAodHlwZW9mIGNvbmZpZy5zaG93UHJpbnRNYXJnaW4gPT09ICdib29sZWFuJykge1xuICAgIGVkaXRvci5zZXRTaG93UHJpbnRNYXJnaW4oY29uZmlnLnNob3dQcmludE1hcmdpbik7XG4gIH1cbiAgaWYgKHR5cGVvZiBjb25maWcuc2hvd0ludmlzaWJsZXMgPT09ICdib29sZWFuJykge1xuICAgIGVkaXRvci5zZXRTaG93SW52aXNpYmxlcyhjb25maWcuc2hvd0ludmlzaWJsZXMpO1xuICB9XG4gIGlmICh0eXBlb2YgY29uZmlnLmhpZ2hsaWdodEFjdGl2ZUxpbmUgPT09ICdib29sZWFuJykge1xuICAgIGVkaXRvci5zZXRIaWdobGlnaHRBY3RpdmVMaW5lKGNvbmZpZy5oaWdobGlnaHRBY3RpdmVMaW5lKTtcbiAgfVxuICBpZiAodHlwZW9mIGNvbmZpZy5zaG93R3V0dGVyID09PSAnYm9vbGVhbicpIHtcbiAgICBlZGl0b3IucmVuZGVyZXIuc2V0U2hvd0d1dHRlcihjb25maWcuc2hvd0d1dHRlcik7XG4gIH1cbiAgaWYgKHR5cGVvZiBjb25maWcuZm9udFNpemUgPT09ICdudW1iZXInKSB7XG4gICAgZWRpdG9yLnNldEZvbnRTaXplKGNvbmZpZy5mb250U2l6ZSk7XG4gIH1cblxuICBlZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZHMoW3tcbiAgICBuYW1lOiAnYmVhdXRpZnknLFxuICAgIGJpbmRLZXk6IHtcbiAgICAgIHdpbjogJ0N0cmwtQicsXG4gICAgICBtYWM6ICdDb21tYW5kLUInXG4gICAgfSxcbiAgICBleGVjOiBmdW5jdGlvbihlZGl0b3IsIGxpbmUpIHtcbiAgICAgIHZhciBjZmcsIGZuO1xuICAgICAgdmFyIGZzbyA9IGVkaXRvci5nZXRTZXNzaW9uKCkuZnNvO1xuXG4gICAgICBzd2l0Y2ggKGZzby5leHQpIHtcbiAgICAgICAgY2FzZSAnLmNzcyc6XG4gICAgICAgICAge1xuICAgICAgICAgICAgZm4gPSBiZWF1dGlmeV9jc3M7XG4gICAgICAgICAgICBjZmcgPSBiZWF1dGlmeUNvbmZpZyA/IGJlYXV0aWZ5Q29uZmlnLmNzcyA6IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcuaHRtbCc6XG4gICAgICAgICAge1xuICAgICAgICAgICAgZm4gPSBiZWF1dGlmeV9odG1sO1xuICAgICAgICAgICAgY2ZnID0gYmVhdXRpZnlDb25maWcgPyBiZWF1dGlmeUNvbmZpZy5odG1sIDogbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJy5qcyc6XG4gICAgICAgIGNhc2UgJy5qc29uJzpcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmbiA9IGJlYXV0aWZ5X2pzO1xuICAgICAgICAgICAgY2ZnID0gYmVhdXRpZnlDb25maWcgPyBiZWF1dGlmeUNvbmZpZy5qcyA6IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoZm4pIHtcbiAgICAgICAgZWRpdG9yLnNldFZhbHVlKGZuKGVkaXRvci5nZXRWYWx1ZSgpLCBjZmcpKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIHJlYWRPbmx5OiBmYWxzZSAvLyB0aGlzIGNvbW1hbmQgc2hvdWxkIG5vdCBhcHBseSBpbiByZWFkT25seSBtb2RlXG4gIH1dKTtcblxuICByZXR1cm4gZWRpdG9yO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJlZGl0b3JcIjoge1xuICAgIFwidGhlbWVcIjogXCJtb25va2FpXCIsXG4gICAgXCJ0YWJTaXplXCI6IDIsXG4gICAgXCJ1c2VTb2Z0VGFic1wiOiB0cnVlLFxuICAgIFwiaGlnaGxpZ2h0QWN0aXZlTGluZVwiOiB0cnVlLFxuICAgIFwic2hvd1ByaW50TWFyZ2luXCI6IGZhbHNlLFxuICAgIFwic2hvd0d1dHRlclwiOiB0cnVlLFxuICAgIFwiZm9udFNpemVcIjogXCIxMnB4XCIsXG4gICAgXCJ1c2VXb3JrZXJcIjogdHJ1ZSxcbiAgICBcInNob3dJbnZpc2libGVzXCI6IHRydWUsXG4gICAgXCJtb2Rlc1wiOiB7XG4gICAgICBcIi5qc1wiOiBcImFjZS9tb2RlL2phdmFzY3JpcHRcIixcbiAgICAgIFwiLmNzc1wiOiBcImFjZS9tb2RlL2Nzc1wiLFxuICAgICAgXCIuaHRtbFwiOiBcImFjZS9tb2RlL2h0bWxcIixcbiAgICAgIFwiLmh0bVwiOiBcImFjZS9tb2RlL2h0bWxcIixcbiAgICAgIFwiLmVqc1wiOiBcImFjZS9tb2RlL2h0bWxcIixcbiAgICAgIFwiLmpzb25cIjogXCJhY2UvbW9kZS9qc29uXCIsXG4gICAgICBcIi5tZFwiOiBcImFjZS9tb2RlL21hcmtkb3duXCIsXG4gICAgICBcIi5jb2ZmZWVcIjogXCJhY2UvbW9kZS9jb2ZmZWVcIixcbiAgICAgIFwiLmphZGVcIjogXCJhY2UvbW9kZS9qYWRlXCIsXG4gICAgICBcIi5waHBcIjogXCJhY2UvbW9kZS9waHBcIixcbiAgICAgIFwiLnB5XCI6IFwiYWNlL21vZGUvcHl0aG9uXCIsXG4gICAgICBcIi5zY3NzXCI6IFwiYWNlL21vZGUvc2Fzc1wiLFxuICAgICAgXCIudHh0XCI6IFwiYWNlL21vZGUvdGV4dFwiLFxuICAgICAgXCIudHlwZXNjcmlwdFwiOiBcImFjZS9tb2RlL3R5cGVzY3JpcHRcIixcbiAgICAgIFwiLnhtbFwiOiBcImFjZS9tb2RlL3htbFwiXG4gICAgfVxuICB9LFxuICBcImJlYXV0aWZ5XCI6IHtcbiAgICBcImpzXCI6IHtcbiAgICAgIFwiaW5kZW50X3NpemVcIjogMixcbiAgICAgIFwiaW5kZW50X2NoYXJcIjogXCIgXCIsXG4gICAgICBcImluZGVudF9sZXZlbFwiOiAwLFxuICAgICAgXCJpbmRlbnRfd2l0aF90YWJzXCI6IGZhbHNlLFxuICAgICAgXCJwcmVzZXJ2ZV9uZXdsaW5lc1wiOiB0cnVlLFxuICAgICAgXCJtYXhfcHJlc2VydmVfbmV3bGluZXNcIjogMyxcbiAgICAgIFwianNsaW50X2hhcHB5XCI6IGZhbHNlLFxuICAgICAgXCJicmFjZV9zdHlsZVwiOiBcImNvbGxhcHNlXCIsXG4gICAgICBcImtlZXBfYXJyYXlfaW5kZW50YXRpb25cIjogZmFsc2UsXG4gICAgICBcImtlZXBfZnVuY3Rpb25faW5kZW50YXRpb25cIjogZmFsc2UsXG4gICAgICBcInNwYWNlX2JlZm9yZV9jb25kaXRpb25hbFwiOiB0cnVlLFxuICAgICAgXCJicmVha19jaGFpbmVkX21ldGhvZHNcIjogZmFsc2UsXG4gICAgICBcImV2YWxfY29kZVwiOiBmYWxzZSxcbiAgICAgIFwidW5lc2NhcGVfc3RyaW5nc1wiOiBmYWxzZSxcbiAgICAgIFwid3JhcF9saW5lX2xlbmd0aFwiOiAwXG4gICAgfSxcbiAgICBcImNzc1wiOiB7XG4gICAgICBcImluZGVudF9zaXplXCI6IDIsXG4gICAgICBcImluZGVudF9jaGFyXCI6IFwiIFwiXG4gICAgfSxcbiAgICBcImh0bWxcIjoge1xuICAgICAgXCJpbmRlbnRfc2l6ZVwiOiAyLFxuICAgICAgXCJpbmRlbnRfY2hhclwiOiBcIiBcIixcbiAgICAgIFwiYnJhY2Vfc3R5bGVcIjogXCJjb2xsYXBzZVwiLFxuICAgICAgXCJpbmRlbnRfc2NyaXB0cyBcIjogXCJub3JtYWxcIlxuICAgIH1cbiAgfVxufVxuIiwidmFyIGVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyLWNvbXBvbmVudCcpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJykuZWRpdG9yO1xuXG5mdW5jdGlvbiBFZGl0b3IoZWwpIHtcbiAgdGhpcy5fZWRpdG9yID0gcmVxdWlyZSgnLi9hY2UnKShlbCk7XG4gIHRoaXMuX2VkaXRvci5jb21tYW5kcy5hZGRDb21tYW5kcyhbe1xuICAgIG5hbWU6ICdzYXZlJyxcbiAgICBiaW5kS2V5OiB7XG4gICAgICB3aW46ICdDdHJsLVMnLFxuICAgICAgbWFjOiAnQ29tbWFuZC1TJ1xuICAgIH0sXG4gICAgZXhlYzogdGhpcy5fb25TYXZlLmJpbmQodGhpcyksXG4gICAgcmVhZE9ubHk6IGZhbHNlIC8vIHRoaXMgY29tbWFuZCBzaG91bGQgbm90IGFwcGx5IGluIHJlYWRPbmx5IG1vZGVcbiAgfSwge1xuICAgIG5hbWU6ICdzYXZlYWxsJyxcbiAgICBiaW5kS2V5OiB7XG4gICAgICB3aW46ICdDdHJsLVNoaWZ0LVMnLFxuICAgICAgbWFjOiAnQ29tbWFuZC1PcHRpb24tUydcbiAgICB9LFxuICAgIGV4ZWM6IHRoaXMuX29uU2F2ZUFsbC5iaW5kKHRoaXMpLFxuICAgIHJlYWRPbmx5OiBmYWxzZSAvLyB0aGlzIGNvbW1hbmQgc2hvdWxkIG5vdCBhcHBseSBpbiByZWFkT25seSBtb2RlXG4gIH0sIHtcbiAgICBuYW1lOiAnaGVscCcsXG4gICAgYmluZEtleToge1xuICAgICAgd2luOiAnQ3RybC1IJyxcbiAgICAgIG1hYzogJ0NvbW1hbmQtSCdcbiAgICB9LFxuICAgIGV4ZWM6IHRoaXMuX29uSGVscC5iaW5kKHRoaXMpLFxuICAgIHJlYWRPbmx5OiB0cnVlIC8vIHRoaXMgY29tbWFuZCBzaG91bGQgYXBwbHkgaW4gcmVhZE9ubHkgbW9kZVxuICB9XSk7XG4gIHRoaXMuX3Nlc3Npb24gPSBudWxsO1xufVxuRWRpdG9yLnByb3RvdHlwZSA9IHtcbiAgZ2V0U2Vzc2lvbjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Nlc3Npb247XG4gIH0sXG4gIHNldFNlc3Npb246IGZ1bmN0aW9uKHNlc3Npb24pIHtcbiAgICB0aGlzLl9zZXNzaW9uID0gc2Vzc2lvbjtcbiAgICB0aGlzLl9lZGl0b3Iuc2V0U2Vzc2lvbihzZXNzaW9uLl9zZXNzaW9uKTtcbiAgfSxcbiAgY2xlYXJTZXNzaW9uOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9zZXNzaW9uID0gbnVsbDtcbiAgfSxcbiAgZ2V0VmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0VmFsdWUoKTtcbiAgfSxcbiAgX29uU2F2ZTogZnVuY3Rpb24oZWRpdG9yLCBsaW5lKSB7XG4gICAgdGhpcy5lbWl0KCdzYXZlJywgdGhpcy5fc2Vzc2lvbik7XG4gIH0sXG4gIF9vblNhdmVBbGw6IGZ1bmN0aW9uKGVkaXRvciwgbGluZSkge1xuICAgIHRoaXMuZW1pdCgnc2F2ZWFsbCcpO1xuICB9LFxuICBfb25IZWxwOiBmdW5jdGlvbihlZGl0b3IsIGxpbmUpIHtcbiAgICB0aGlzLmVtaXQoJ2hlbHAnKTtcbiAgfVxufTtcblxuZW1pdHRlcihFZGl0b3IucHJvdG90eXBlKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3I7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xudmFyIGVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyLWNvbXBvbmVudCcpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJykuZWRpdG9yO1xudmFyIEVkaXRTZXNzaW9uID0gYWNlLnJlcXVpcmUoJ2FjZS9lZGl0X3Nlc3Npb24nKS5FZGl0U2Vzc2lvbjtcbnZhciBVbmRvTWFuYWdlciA9IGFjZS5yZXF1aXJlKCdhY2UvdW5kb21hbmFnZXInKS5VbmRvTWFuYWdlcjtcblxuLypcbiAqIFNlc3Npb24gY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU2Vzc2lvbihmc28pIHtcbiAgdGhpcy5mc28gPSBmc287XG5cbiAgdmFyIHBhdGggPSBmc28ucGF0aDtcbiAgdmFyIGNvbnRlbnRzID0gZnNvLmNvbnRlbnRzO1xuICB2YXIgc2Vzc2lvbiA9IG5ldyBFZGl0U2Vzc2lvbihjb250ZW50cyk7XG4gIHZhciBtb2RlID0gY29uZmlnLm1vZGVzW2Zzby5leHQudG9Mb3dlckNhc2UoKV0gfHwgJ2FjZS9tb2RlL2FzY2lpZG9jJztcblxuICBzZXNzaW9uLmZzbyA9IGZzbzsgLy8gdG8gZ2l2ZSBhY2UgZWRpdG9yIGFjY2VzcyB0byB0aGUgZnNvO1xuICBzZXNzaW9uLnNldE1vZGUobW9kZSk7XG4gIHNlc3Npb24uc2V0VW5kb01hbmFnZXIobmV3IFVuZG9NYW5hZ2VyKCkpO1xuXG4gIGlmICh0eXBlb2YgY29uZmlnLnRhYlNpemUgPT09ICdudW1iZXInKSB7XG4gICAgc2Vzc2lvbi5zZXRUYWJTaXplKGNvbmZpZy50YWJTaXplKTtcbiAgfVxuICBpZiAodHlwZW9mIGNvbmZpZy51c2VTb2Z0VGFicyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgc2Vzc2lvbi5zZXRVc2VTb2Z0VGFicyhjb25maWcudXNlU29mdFRhYnMpO1xuICB9XG5cbiAgdGhpcy5fc2Vzc2lvbiA9IHNlc3Npb247XG4gIHRoaXMuX3VuZG9NYW5hZ2VyID0gc2Vzc2lvbi5nZXRVbmRvTWFuYWdlcigpO1xufVxuU2Vzc2lvbi5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX3Nlc3Npb24uZ2V0VmFsdWUoKTtcbn07XG5TZXNzaW9uLnByb3RvdHlwZS5pc0RpcnR5ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5fdW5kb01hbmFnZXIuaXNDbGVhbigpO1xufTtcblNlc3Npb24ucHJvdG90eXBlLm1hcmtDbGVhbiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl91bmRvTWFuYWdlci5tYXJrQ2xlYW4oKTtcbn07XG5cbmVtaXR0ZXIoU2Vzc2lvbi5wcm90b3R5cGUpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlc3Npb247XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgZW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXItY29tcG9uZW50Jyk7XG5cbi8qXG4gKiBGaWxlU3lzdGVtV2F0Y2hlciBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBGaWxlU3lzdGVtV2F0Y2hlcigpIHtcblxuICB2YXIgc29ja2V0ID0gaW8uY29ubmVjdCh1dGlscy51cmxSb290KCkgKyAnL2Zzd2F0Y2gnKTtcblxuICB0aGlzLl93YXRjaGVkID0ge307XG5cbiAgc29ja2V0Lm9uKCdjb25uZWN0aW9uJywgZnVuY3Rpb24ocmVzKSB7XG5cbiAgICB2YXIgZGF0YSA9IHJlcy5kYXRhO1xuXG4gICAgdXRpbHMuZXh0ZW5kKHRoaXMuX3dhdGNoZWQsIGRhdGEpO1xuXG4gICAgdGhpcy5lbWl0KCdjb25uZWN0aW9uJywgdGhpcy5fd2F0Y2hlZCk7XG4gICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcblxuICB9LmJpbmQodGhpcykpO1xuXG4gIHNvY2tldC5vbignYWRkJywgZnVuY3Rpb24ocmVzKSB7XG5cbiAgICB2YXIgZGF0YSA9IHJlcy5kYXRhO1xuICAgIHRoaXMuX3dhdGNoZWRbZGF0YS5wYXRoXSA9IGRhdGE7XG5cbiAgICB0aGlzLmVtaXQoJ2FkZCcsIGRhdGEpO1xuICAgIHRoaXMuZW1pdCgnY2hhbmdlJyk7XG5cbiAgfS5iaW5kKHRoaXMpKTtcblxuICBzb2NrZXQub24oJ2FkZERpcicsIGZ1bmN0aW9uKHJlcykge1xuXG4gICAgdmFyIGRhdGEgPSByZXMuZGF0YTtcbiAgICB0aGlzLl93YXRjaGVkW2RhdGEucGF0aF0gPSBkYXRhO1xuXG4gICAgdGhpcy5lbWl0KCdhZGREaXInLCByZXMuZGF0YSk7XG4gICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcblxuICB9LmJpbmQodGhpcykpO1xuXG4gIHNvY2tldC5vbignY2hhbmdlJywgZnVuY3Rpb24ocmVzKSB7XG5cbiAgICB2YXIgZGF0YSA9IHJlcy5kYXRhO1xuXG4gICAgdGhpcy5lbWl0KCdtb2RpZmllZCcsIGRhdGEpO1xuXG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgc29ja2V0Lm9uKCd1bmxpbmsnLCBmdW5jdGlvbihyZXMpIHtcblxuICAgIHZhciBkYXRhID0gcmVzLmRhdGE7XG4gICAgdmFyIGZzbyA9IHRoaXMuX3dhdGNoZWRbZGF0YS5wYXRoXTtcblxuICAgIGlmIChmc28pIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl93YXRjaGVkW2RhdGEucGF0aF07XG4gICAgICB0aGlzLmVtaXQoJ3VubGluaycsIGZzbyk7XG4gICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgIH1cblxuICB9LmJpbmQodGhpcykpO1xuXG4gIHNvY2tldC5vbigndW5saW5rRGlyJywgZnVuY3Rpb24ocmVzKSB7XG5cbiAgICB2YXIgZGF0YSA9IHJlcy5kYXRhO1xuICAgIHZhciBmc28gPSB0aGlzLl93YXRjaGVkW2RhdGEucGF0aF07XG5cbiAgICBpZiAoZnNvKSB7XG4gICAgICBkZWxldGUgdGhpcy5fd2F0Y2hlZFtkYXRhLnBhdGhdO1xuICAgICAgdGhpcy5lbWl0KCd1bmxpbmtEaXInLCBmc28pO1xuICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcbiAgICB9XG5cbiAgfS5iaW5kKHRoaXMpKTtcblxuICBzb2NrZXQub24oJ2Vycm9yJywgZnVuY3Rpb24ocmVzKSB7XG5cbiAgICB0aGlzLmVtaXQoJ2Vycm9yJywgcmVzLmVycik7XG5cbiAgfS5iaW5kKHRoaXMpKTtcblxuICBmdW5jdGlvbiB0cmVlaWZ5KGxpc3QsIGlkQXR0ciwgcGFyZW50QXR0ciwgY2hpbGRyZW5BdHRyKSB7XG5cbiAgICB2YXIgdHJlZUxpc3QgPSBbXTtcbiAgICB2YXIgbG9va3VwID0ge307XG4gICAgdmFyIHBhdGgsIG9iajtcblxuICAgIGZvciAocGF0aCBpbiBsaXN0KSB7XG5cbiAgICAgIG9iaiA9IGxpc3RbcGF0aF07XG4gICAgICBvYmoubGFiZWwgPSBvYmoubmFtZTtcbiAgICAgIGxvb2t1cFtvYmpbaWRBdHRyXV0gPSBvYmo7XG4gICAgICBvYmpbY2hpbGRyZW5BdHRyXSA9IFtdO1xuICAgIH1cblxuICAgIGZvciAocGF0aCBpbiBsaXN0KSB7XG4gICAgICBvYmogPSBsaXN0W3BhdGhdO1xuICAgICAgaWYgKGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dKSB7XG4gICAgICAgIGxvb2t1cFtvYmpbcGFyZW50QXR0cl1dW2NoaWxkcmVuQXR0cl0ucHVzaChvYmopO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJlZUxpc3QucHVzaChvYmopO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cmVlTGlzdDtcblxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGhpcywge1xuICAgIGxpc3Q6IHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl93YXRjaGVkO1xuICAgICAgfVxuICAgIH0sXG4gICAgdHJlZToge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRyZWVpZnkodGhpcy5fd2F0Y2hlZCwgJ3BhdGgnLCAnZGlyJywgJ2NoaWxkcmVuJyk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICB0aGlzLl9zb2NrZXQgPSBzb2NrZXQ7XG59XG5lbWl0dGVyKEZpbGVTeXN0ZW1XYXRjaGVyLnByb3RvdHlwZSk7XG5cbnZhciBGaWxlU3lzdGVtV2F0Y2hlciA9IG5ldyBGaWxlU3lzdGVtV2F0Y2hlcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVTeXN0ZW1XYXRjaGVyO1xuIiwidmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGVtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyLWNvbXBvbmVudCcpOztcblxuLypcbiAqIEZpbGVTeXN0ZW0gY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRmlsZVN5c3RlbShzb2NrZXQpIHtcblxuICBzb2NrZXQub24oJ21rZGlyJywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICB0aGlzLmVtaXQoJ21rZGlyJywgcmVzcG9uc2UpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIHNvY2tldC5vbignbWtmaWxlJywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICB0aGlzLmVtaXQoJ21rZmlsZScsIHJlc3BvbnNlKTtcbiAgfS5iaW5kKHRoaXMpKTtcblxuICBzb2NrZXQub24oJ2NvcHknLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIHRoaXMuZW1pdCgnY29weScsIHJlc3BvbnNlKTtcbiAgfS5iaW5kKHRoaXMpKTtcblxuICBzb2NrZXQub24oJ3JlbmFtZScsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgdGhpcy5lbWl0KCdyZW5hbWUnLCByZXNwb25zZSk7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgc29ja2V0Lm9uKCdyZW1vdmUnLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIHRoaXMuZW1pdCgncmVtb3ZlJywgcmVzcG9uc2UpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIHNvY2tldC5vbigncmVhZGZpbGUnLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIHRoaXMuZW1pdCgncmVhZGZpbGUnLCByZXNwb25zZSk7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgc29ja2V0Lm9uKCd3cml0ZWZpbGUnLCBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgIHRoaXMuZW1pdCgnd3JpdGVmaWxlJywgcmVzcG9uc2UpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIHRoaXMuX3NvY2tldCA9IHNvY2tldDtcblxufVxuRmlsZVN5c3RlbS5wcm90b3R5cGUubWtkaXIgPSBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xuICB0aGlzLl9zb2NrZXQuZW1pdCgnbWtkaXInLCBwYXRoLCBjYWxsYmFjayk7XG59O1xuRmlsZVN5c3RlbS5wcm90b3R5cGUubWtmaWxlID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcbiAgdGhpcy5fc29ja2V0LmVtaXQoJ21rZmlsZScsIHBhdGgsIGNhbGxiYWNrKTtcbn07XG5GaWxlU3lzdGVtLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oc291cmNlLCBkZXN0aW5hdGlvbiwgY2FsbGJhY2spIHtcbiAgdGhpcy5fc29ja2V0LmVtaXQoJ2NvcHknLCBzb3VyY2UsIGRlc3RpbmF0aW9uLCBjYWxsYmFjayk7XG59O1xuRmlsZVN5c3RlbS5wcm90b3R5cGUucmVuYW1lID0gZnVuY3Rpb24ob2xkUGF0aCwgbmV3UGF0aCwgY2FsbGJhY2spIHtcbiAgdGhpcy5fc29ja2V0LmVtaXQoJ3JlbmFtZScsIG9sZFBhdGgsIG5ld1BhdGgsIGNhbGxiYWNrKTtcbn07XG5GaWxlU3lzdGVtLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xuICB0aGlzLl9zb2NrZXQuZW1pdCgncmVtb3ZlJywgcGF0aCwgY2FsbGJhY2spO1xufTtcbkZpbGVTeXN0ZW0ucHJvdG90eXBlLnJlYWRGaWxlID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcbiAgdGhpcy5fc29ja2V0LmVtaXQoJ3JlYWRmaWxlJywgcGF0aCwgY2FsbGJhY2spO1xufTtcbkZpbGVTeXN0ZW0ucHJvdG90eXBlLndyaXRlRmlsZSA9IGZ1bmN0aW9uKHBhdGgsIGNvbnRlbnRzLCBjYWxsYmFjaykge1xuICB0aGlzLl9zb2NrZXQuZW1pdCgnd3JpdGVmaWxlJywgcGF0aCwgY29udGVudHMsIGNhbGxiYWNrKTtcbn07XG5cbmVtaXR0ZXIoRmlsZVN5c3RlbS5wcm90b3R5cGUpO1xuXG5cbnZhciBzb2NrZXQgPSBpby5jb25uZWN0KHV0aWxzLnVybFJvb3QoKSArICcvZnMnKTtcblxuc29ja2V0Lm9uKCdjb25uZWN0aW9uJywgZnVuY3Rpb24oZGF0YSkge1xuICBjb25zb2xlLmxvZygnZnMgY29ubmVjdGVkJyArIGRhdGEpO1xufSk7XG5cbnZhciBmaWxlU3lzdGVtID0gbmV3IEZpbGVTeXN0ZW0oc29ja2V0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmaWxlU3lzdGVtO1xuIiwidmFyIHAgPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgZmlsZXN5c3RlbSA9IHJlcXVpcmUoJy4vZmlsZS1zeXN0ZW0nKTtcbnZhciB3YXRjaGVyID0gcmVxdWlyZSgnLi9maWxlLXN5c3RlbS13YXRjaGVyJyk7XG52YXIgc2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIEVkaXRvciA9IHJlcXVpcmUoJy4vZWRpdG9yJyk7XG52YXIgU2Vzc2lvbiA9IHJlcXVpcmUoJy4vZWRpdG9yL3Nlc3Npb24nKTtcblxud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLCBbJ3VpLmJvb3RzdHJhcCddKTtcblxuLypcbiAqIFJlZ2lzdGVyIENvbnRyb2xsZXJzXG4gKi9cbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvYXBwJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzL3RyZWUnKTtcblxuLypcbiAqIFJlZ2lzdGVyIERpcmVjdGl2ZXNcbiAqL1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzL3JpZ2h0LWNsaWNrJyk7XG5cbi8qXG4gKiBSZWdpc3RlciBDb21tb24gU2VydmljZXNcbiAqL1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9kaWFsb2cnKTtcblxuLypcbiAqIEluaXRpYWxpemUgU3BsaXR0ZXJcbiAqL1xucmVxdWlyZSgnLi9zcGxpdHRlcicpO1xuIiwiYXBwLnNlcnZpY2UoJ2RpYWxvZycsIFsnJG1vZGFsJywgZnVuY3Rpb24oJG1vZGFsKSB7XG5cbiAgdmFyIHNlcnZpY2UgPSB7fTtcblxuICBzZXJ2aWNlLmFsZXJ0ID0gZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgcmV0dXJuICRtb2RhbC5vcGVuKHtcbiAgICAgIHRlbXBsYXRlVXJsOiAnYWxlcnQuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnQWxlcnRDdHJsJyxcbiAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRpdGxlOiBkYXRhLnRpdGxlLFxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5tZXNzYWdlXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLnJlc3VsdDtcblxuICB9O1xuXG4gIHNlcnZpY2UuY29uZmlybSA9IGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgIHJldHVybiAkbW9kYWwub3Blbih7XG4gICAgICB0ZW1wbGF0ZVVybDogJ2NvbmZpcm0uaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnQ29uZmlybUN0cmwnLFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICBkYXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLm1lc3NhZ2VcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkucmVzdWx0O1xuXG4gIH07XG5cbiAgc2VydmljZS5wcm9tcHQgPSBmdW5jdGlvbihkYXRhKSB7XG5cbiAgICByZXR1cm4gJG1vZGFsLm9wZW4oe1xuICAgICAgdGVtcGxhdGVVcmw6ICdwcm9tcHQuaHRtbCcsXG4gICAgICBjb250cm9sbGVyOiAnUHJvbXB0Q3RybCcsXG4gICAgICByZXNvbHZlOiB7XG4gICAgICAgIGRhdGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0aXRsZTogZGF0YS50aXRsZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogZGF0YS5kZWZhdWx0VmFsdWUsXG4gICAgICAgICAgICBwbGFjZWhvbGRlcjogZGF0YS5wbGFjZWhvbGRlclxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KS5yZXN1bHQ7XG5cbiAgfTtcblxuICByZXR1cm4gc2VydmljZTtcblxufV0pO1xuXG5hcHAuY29udHJvbGxlcignQWxlcnRDdHJsJywgWyckc2NvcGUnLCAnJG1vZGFsSW5zdGFuY2UnLCAnZGF0YScsXG4gIGZ1bmN0aW9uKCRzY29wZSwgJG1vZGFsSW5zdGFuY2UsIGRhdGEpIHtcblxuICAgICRzY29wZS50aXRsZSA9IGRhdGEudGl0bGU7XG4gICAgJHNjb3BlLm1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2U7XG5cbiAgICAkc2NvcGUub2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgIH07XG4gIH1cbl0pO1xuXG5hcHAuY29udHJvbGxlcignQ29uZmlybUN0cmwnLCBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICdkYXRhJyxcbiAgZnVuY3Rpb24oJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSwgZGF0YSkge1xuXG4gICAgJHNjb3BlLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAkc2NvcGUubWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcblxuICAgICRzY29wZS5vayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICRtb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgfTtcblxuICAgICRzY29wZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICB9O1xuICB9XG5dKTtcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb21wdEN0cmwnLCBbJyRzY29wZScsICckbW9kYWxJbnN0YW5jZScsICdkYXRhJyxcbiAgZnVuY3Rpb24oJHNjb3BlLCAkbW9kYWxJbnN0YW5jZSwgZGF0YSkge1xuXG4gICAgJHNjb3BlLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAkc2NvcGUubWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcbiAgICAkc2NvcGUucGxhY2Vob2xkZXIgPSBkYXRhLnBsYWNlaG9sZGVyO1xuICAgICRzY29wZS5pbnB1dCA9IHsgdmFsdWU6IGRhdGEuZGVmYXVsdFZhbHVlIH07XG5cbiAgICAkc2NvcGUub2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkbW9kYWxJbnN0YW5jZS5jbG9zZSgkc2NvcGUuaW5wdXQudmFsdWUpO1xuICAgIH07XG5cbiAgICAkc2NvcGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgJG1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgfTtcbiAgfVxuXSk7XG4iLCJ2YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgZW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXItY29tcG9uZW50Jyk7XG52YXIgRWRpdFNlc3Npb24gPSBhY2UucmVxdWlyZSgnYWNlL2VkaXRfc2Vzc2lvbicpLkVkaXRTZXNzaW9uO1xudmFyIFVuZG9NYW5hZ2VyID0gYWNlLnJlcXVpcmUoJ2FjZS91bmRvbWFuYWdlcicpLlVuZG9NYW5hZ2VyO1xuXG4vKlxuICogU2Vzc2lvbk1hbmFnZXIgY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gU2Vzc2lvbk1hbmFnZXIoKSB7XG5cbiAgdGhpcy5pc0RpcnR5ID0gZmFsc2U7XG4gIHRoaXMuc2Vzc2lvbnMgPSB7fTtcblxuICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblxuICAgIHZhciBzZXNzaW9ucyA9IHRoaXMuc2Vzc2lvbnM7XG4gICAgZm9yICh2YXIgcGF0aCBpbiBzZXNzaW9ucykge1xuICAgICAgaWYgKHNlc3Npb25zW3BhdGhdLmlzRGlydHkoKSkge1xuICAgICAgICB0aGlzLl9zZXRJc0RpcnR5KHRydWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3NldElzRGlydHkoZmFsc2UpO1xuXG4gIH0uYmluZCh0aGlzKSwgMzAwKTtcblxufVxuU2Vzc2lvbk1hbmFnZXIucHJvdG90eXBlID0ge1xuICBhZGQ6IGZ1bmN0aW9uKHBhdGgsIHNlc3Npb24pIHtcbiAgICB0aGlzLnNlc3Npb25zW3BhdGhdID0gc2Vzc2lvbjtcbiAgICB0aGlzLmVtaXQoJ3Nlc3Npb25hZGQnLCBzZXNzaW9uKTtcbiAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICB2YXIgcmVtb3ZlZCA9IHRoaXMuc2Vzc2lvbnNbcGF0aF07XG4gICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLnNlc3Npb25zW3BhdGhdO1xuICAgICAgdGhpcy5lbWl0KCdzZXNzaW9ucmVtb3ZlJywgcmVtb3ZlZCk7XG4gICAgICB0aGlzLmVtaXQoJ2NoYW5nZScpO1xuICAgIH1cbiAgfSxcbiAgZ2V0U2Vzc2lvbjogZnVuY3Rpb24ocGF0aCkge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25zW3BhdGhdO1xuICB9LFxuICBfc2V0SXNEaXJ0eTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAvL2lmICh0aGlzLmlzRGlydHkgIT09IHZhbHVlKSB7XG4gICAgICB0aGlzLmlzRGlydHkgPSB2YWx1ZTtcbiAgICAgIHRoaXMuZW1pdCgnZGlydHljaGFuZ2VkJywgdmFsdWUpO1xuICAgICAgdGhpcy5lbWl0KCdjaGFuZ2UnKTtcbiAgICAvL31cbiAgfVxufTtcblxuZW1pdHRlcihTZXNzaW9uTWFuYWdlci5wcm90b3R5cGUpO1xuXG52YXIgc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzZXNzaW9uTWFuYWdlcjtcbiIsIi8vIHRvZG8gLSBmaW5kIGEgZGlyZWN0aXZlIHRvIGRvIHRoaXMgLyBjaGFuZ2UgdG8gZGlyZWN0aXZlXHJcbjsoZnVuY3Rpb24oKSB7XHJcblxyXG52YXIgdyA9IHdpbmRvdywgZCA9IGRvY3VtZW50O1xyXG5cclxuZnVuY3Rpb24gc3BsaXQoaGFuZGxlciwgbGVmdEVsLCByaWdodEVsKSB7XHJcblxyXG4gIHZhciBzcGxpdHRlcjtcclxuXHJcbiAgc3BsaXR0ZXIgPSB7XHJcbiAgICBsYXN0WDogMCxcclxuICAgIGxlZnRFbDogbnVsbCxcclxuICAgIHJpZ2h0RWw6IG51bGwsXHJcblxyXG4gICAgaW5pdDogZnVuY3Rpb24oaGFuZGxlciwgbGVmdEVsLCByaWdodEVsKSB7XHJcbiAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgIHRoaXMubGVmdEVsID0gbGVmdEVsO1xyXG4gICAgICB0aGlzLnJpZ2h0RWwgPSByaWdodEVsO1xyXG5cclxuICAgICAgaGFuZGxlci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldnQpIHtcclxuICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcdC8qIHByZXZlbnQgdGV4dCBzZWxlY3Rpb24gKi9cclxuXHJcbiAgICAgICAgc2VsZi5sYXN0WCA9IGV2dC5jbGllbnRYO1xyXG5cclxuICAgICAgICB3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHNlbGYuZHJhZyk7XHJcbiAgICAgICAgdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgc2VsZi5lbmREcmFnKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGRyYWc6IGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICB2YXIgd0wsIHdSLCB3RGlmZiA9IGV2dC5jbGllbnRYIC0gc3BsaXR0ZXIubGFzdFg7XHJcblxyXG4gICAgICB3TCA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShzcGxpdHRlci5sZWZ0RWwsICcnKS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpO1xyXG4gICAgICB3UiA9IGQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShzcGxpdHRlci5yaWdodEVsLCAnJykuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKTtcclxuICAgICAgd0wgPSBwYXJzZUludCh3TCwgMTApICsgd0RpZmY7XHJcbiAgICAgIHdSID0gcGFyc2VJbnQod1IsIDEwKSAtIHdEaWZmO1xyXG4gICAgICBzcGxpdHRlci5sZWZ0RWwuc3R5bGUud2lkdGggPSB3TCArICdweCc7XHJcbiAgICAgIHNwbGl0dGVyLnJpZ2h0RWwuc3R5bGUud2lkdGggPSB3UiArICdweCc7XHJcblxyXG4gICAgICBzcGxpdHRlci5sYXN0WCA9IGV2dC5jbGllbnRYO1xyXG4gICAgfSxcclxuXHJcbiAgICBlbmREcmFnOiBmdW5jdGlvbigpIHtcclxuICAgICAgdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBzcGxpdHRlci5kcmFnKTtcclxuICAgICAgdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgc3BsaXR0ZXIuZW5kRHJhZyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgc3BsaXR0ZXIuaW5pdChoYW5kbGVyLCBsZWZ0RWwsIHJpZ2h0RWwpO1xyXG59XHJcblxyXG5zcGxpdChkLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NwbGl0dGVyJylbMF0sIGQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ25hdicpWzBdLCBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdhcnRpY2xlJylbMF0pO1xyXG5zcGxpdChkLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NwbGl0dGVyJylbMV0sIGQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2FydGljbGUnKVswXSwgZC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYXNpZGUnKVswXSk7XHJcblxyXG59KSgpO1xyXG4iLCIvKiBnbG9iYWwgZGlhbG9nICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXR1aWQ6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoJycgKyBNYXRoLnJhbmRvbSgpKS5yZXBsYWNlKC9cXEQvZywgJycpO1xuICB9LFxuICBnZXR1aWRzdHI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoK25ldyBEYXRlKCkpLnRvU3RyaW5nKDM2KTtcbiAgfSxcbiAgdXJsUm9vdDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xuICAgIHJldHVybiBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0O1xuICB9LFxuICBlbmNvZGVTdHJpbmc6IGZ1bmN0aW9uKHN0cikge1xuICAgIHJldHVybiBidG9hKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKTtcbiAgfSxcbiAgZGVjb2RlU3RyaW5nOiBmdW5jdGlvbihzdHIpIHtcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGF0b2Ioc3RyKSk7XG4gIH0sXG4gIGV4dGVuZDogZnVuY3Rpb24gZXh0ZW5kKG9yaWdpbiwgYWRkKSB7XG4gICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICAgIGlmICghYWRkIHx8IHR5cGVvZiBhZGQgIT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gb3JpZ2luO1xuICAgIH1cblxuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICAgIHdoaWxlIChpLS0pIHtcbiAgICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgICB9XG4gICAgcmV0dXJuIG9yaWdpbjtcbiAgfSxcbiAgdWk6IHtcbiAgICByZXNwb25zZUhhbmRsZXI6IGZ1bmN0aW9uKGZuKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24ocnNwLCBzaG93RXJyb3IpIHtcbiAgICAgICAgc2hvd0Vycm9yID0gc2hvd0Vycm9yIHx8IHRydWU7XG4gICAgICAgIGlmIChyc3AuZXJyKSB7XG4gICAgICAgICAgaWYgKHNob3dFcnJvcikge1xuICAgICAgICAgICAgZGlhbG9nLmFsZXJ0KHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdFcnJvcicsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IEpTT04uc3RyaW5naWZ5KHJzcC5lcnIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZm4ocnNwLmRhdGEpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cbiAgfVxufTtcbiIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gcmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIGFycmF5IHdpdGggZGlyZWN0b3J5IG5hbWVzIHRoZXJlXG4vLyBtdXN0IGJlIG5vIHNsYXNoZXMsIGVtcHR5IGVsZW1lbnRzLCBvciBkZXZpY2UgbmFtZXMgKGM6XFwpIGluIHRoZSBhcnJheVxuLy8gKHNvIGFsc28gbm8gbGVhZGluZyBhbmQgdHJhaWxpbmcgc2xhc2hlcyAtIGl0IGRvZXMgbm90IGRpc3Rpbmd1aXNoXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXG5mdW5jdGlvbiBub3JtYWxpemVBcnJheShwYXJ0cywgYWxsb3dBYm92ZVJvb3QpIHtcbiAgLy8gaWYgdGhlIHBhdGggdHJpZXMgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIGB1cGAgZW5kcyB1cCA+IDBcbiAgdmFyIHVwID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhcnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGxhc3QgPSBwYXJ0c1tpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgfSBlbHNlIGlmIChsYXN0ID09PSAnLi4nKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cCsrO1xuICAgIH0gZWxzZSBpZiAodXApIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoYWxsb3dBYm92ZVJvb3QpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHBhcnRzLnVuc2hpZnQoJy4uJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzO1xufVxuXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxuLy8gJ3Jvb3QnIGlzIGp1c3QgYSBzbGFzaCwgb3Igbm90aGluZy5cbnZhciBzcGxpdFBhdGhSZSA9XG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XG52YXIgc3BsaXRQYXRoID0gZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xufTtcblxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXNvbHZlZFBhdGggPSAnJyxcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTEgJiYgIXJlc29sdmVkQWJzb2x1dGU7IGktLSkge1xuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xuXG4gICAgLy8gU2tpcCBlbXB0eSBhbmQgaW52YWxpZCBlbnRyaWVzXG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnRzIHRvIHBhdGgucmVzb2x2ZSBtdXN0IGJlIHN0cmluZ3MnKTtcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICByZXNvbHZlZFBhdGggPSBwYXRoICsgJy8nICsgcmVzb2x2ZWRQYXRoO1xuICAgIHJlc29sdmVkQWJzb2x1dGUgPSBwYXRoLmNoYXJBdCgwKSA9PT0gJy8nO1xuICB9XG5cbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxuICAvLyBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKSBmYWlscylcblxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgcmVzb2x2ZWRQYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHJlc29sdmVkUGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgcmV0dXJuICgocmVzb2x2ZWRBYnNvbHV0ZSA/ICcvJyA6ICcnKSArIHJlc29sdmVkUGF0aCkgfHwgJy4nO1xufTtcblxuLy8gcGF0aC5ub3JtYWxpemUocGF0aClcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMubm9ybWFsaXplID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgaXNBYnNvbHV0ZSA9IGV4cG9ydHMuaXNBYnNvbHV0ZShwYXRoKSxcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBzdWJzdHIocGF0aCwgLTEpID09PSAnLyc7XG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHBhdGggPSBub3JtYWxpemVBcnJheShmaWx0ZXIocGF0aC5zcGxpdCgnLycpLCBmdW5jdGlvbihwKSB7XG4gICAgcmV0dXJuICEhcDtcbiAgfSksICFpc0Fic29sdXRlKS5qb2luKCcvJyk7XG5cbiAgaWYgKCFwYXRoICYmICFpc0Fic29sdXRlKSB7XG4gICAgcGF0aCA9ICcuJztcbiAgfVxuICBpZiAocGF0aCAmJiB0cmFpbGluZ1NsYXNoKSB7XG4gICAgcGF0aCArPSAnLyc7XG4gIH1cblxuICByZXR1cm4gKGlzQWJzb2x1dGUgPyAnLycgOiAnJykgKyBwYXRoO1xufTtcblxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuam9pbiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGF0aHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICByZXR1cm4gZXhwb3J0cy5ub3JtYWxpemUoZmlsdGVyKHBhdGhzLCBmdW5jdGlvbihwLCBpbmRleCkge1xuICAgIGlmICh0eXBlb2YgcCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9KS5qb2luKCcvJykpO1xufTtcblxuXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxuLy8gcG9zaXggdmVyc2lvblxuZXhwb3J0cy5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gIGZyb20gPSBleHBvcnRzLnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xuICB0byA9IGV4cG9ydHMucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xuXG4gIGZ1bmN0aW9uIHRyaW0oYXJyKSB7XG4gICAgdmFyIHN0YXJ0ID0gMDtcbiAgICBmb3IgKDsgc3RhcnQgPCBhcnIubGVuZ3RoOyBzdGFydCsrKSB7XG4gICAgICBpZiAoYXJyW3N0YXJ0XSAhPT0gJycpIGJyZWFrO1xuICAgIH1cblxuICAgIHZhciBlbmQgPSBhcnIubGVuZ3RoIC0gMTtcbiAgICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XG4gICAgICBpZiAoYXJyW2VuZF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhcnQgPiBlbmQpIHJldHVybiBbXTtcbiAgICByZXR1cm4gYXJyLnNsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydCArIDEpO1xuICB9XG5cbiAgdmFyIGZyb21QYXJ0cyA9IHRyaW0oZnJvbS5zcGxpdCgnLycpKTtcbiAgdmFyIHRvUGFydHMgPSB0cmltKHRvLnNwbGl0KCcvJykpO1xuXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XG4gIHZhciBzYW1lUGFydHNMZW5ndGggPSBsZW5ndGg7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdmFyIG91dHB1dFBhcnRzID0gW107XG4gIGZvciAodmFyIGkgPSBzYW1lUGFydHNMZW5ndGg7IGkgPCBmcm9tUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG5cbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcblxuICByZXR1cm4gb3V0cHV0UGFydHMuam9pbignLycpO1xufTtcblxuZXhwb3J0cy5zZXAgPSAnLyc7XG5leHBvcnRzLmRlbGltaXRlciA9ICc6JztcblxuZXhwb3J0cy5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xuICB2YXIgcmVzdWx0ID0gc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcbiAgICAgIGRpciA9IHJlc3VsdFsxXTtcblxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xuICAgIC8vIE5vIGRpcm5hbWUgd2hhdHNvZXZlclxuICAgIHJldHVybiAnLic7XG4gIH1cblxuICBpZiAoZGlyKSB7XG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBkaXIgPSBkaXIuc3Vic3RyKDAsIGRpci5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIHJldHVybiByb290ICsgZGlyO1xufTtcblxuXG5leHBvcnRzLmJhc2VuYW1lID0gZnVuY3Rpb24ocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gc3BsaXRQYXRoKHBhdGgpWzJdO1xuICAvLyBUT0RPOiBtYWtlIHRoaXMgY29tcGFyaXNvbiBjYXNlLWluc2Vuc2l0aXZlIG9uIHdpbmRvd3M/XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5cbmV4cG9ydHMuZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHNwbGl0UGF0aChwYXRoKVszXTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlciAoeHMsIGYpIHtcbiAgICBpZiAoeHMuZmlsdGVyKSByZXR1cm4geHMuZmlsdGVyKGYpO1xuICAgIHZhciByZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChmKHhzW2ldLCBpLCB4cykpIHJlcy5wdXNoKHhzW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS5zdWJzdHIgLSBuZWdhdGl2ZSBpbmRleCBkb24ndCB3b3JrIGluIElFOFxudmFyIHN1YnN0ciA9ICdhYicuc3Vic3RyKC0xKSA9PT0gJ2InXG4gICAgPyBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7IHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pIH1cbiAgICA6IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHtcbiAgICAgICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSBzdHIubGVuZ3RoICsgc3RhcnQ7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKHN0YXJ0LCBsZW4pO1xuICAgIH1cbjtcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJscHBqd0hcIikpIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iXX0=
