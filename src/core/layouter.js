/*
 Copyright (c) 2014, Tobias Still <ts@tobiasstill.info>
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 POSSIBILITY OF SUCH DAMAGE.
 */
/**
 * Created by Tobias Still on 29.10.2014.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter', ['jQuery'], factory);
    } else if (typeof exports === 'object') {
// Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
        module.exports = factory(require('jquery'));
    } else {
// Browser globals (root is window)
        root.layouter = factory(root.jQuery);
    }
}(this, function (jQuery) {
    /**
     * @module layouter
     * @type {{}}
     */
    var exports = {},
        Layouter,
        Node,
        helpers,
        defaults,
        $ = jQuery;

    exports.$ = $;
    exports.version = '0.0.0';
    /**
     * Default layouter settings
     * @type {layouterSettings}
     */
    exports.defaults = defaults = {};

    /**
     * Helper functions
     * @type {Object<Function>}
     */
    exports.helpers = helpers = {};

    /**
     *
     * @type {Function}
     */
    /*
     courtesy qiao:
     http://stackoverflow.com/questions/8817394/javascript-get-deep-value-from-object-by-passing-path-to-it-as-string
     */
    helpers.deepGet = function (obj, path) {
        var paths = path.split('.'), current = obj, i;

        for (i = 0; i < paths.length; ++i) {
            if (current[paths[i]] === undefined) {
                return undefined;
            } else {
                current = current[paths[i]];
            }
        }
        return current;
    };
    /**
     *
     * @type {Function}
     */
    helpers.deepSet = function (obj, path, value) {
        var paths = path.split('.'), current = obj, i;

        for (i = 0; i < paths.length; ++i) {
            //end of path?
            if (i + 1 == path.length)
                current[paths[i]] = value;
            //undefined?
            else if (current[paths[i]] === undefined) {
                current[paths[i]] = {};
            }
            current = current[paths[i]];
        }
        return obj;
    };
    /**
     * @class Node
     * @param {jQuery} $el
     */
    exports.Node = Node = function ($el, layouter) {
        /**
         * @member {jQuery} Node#$el
         */
        this.$el = $el;
        /**
         * @member {Layouter} Node#layouter
         */
        this.layouter = layouter;
        /**
         * @member {Array.<Node>} Node#childs
         */
        this.childs = [];
        /**
         * @member {Node|undefined} Node#parent
         */
        this.parent = undefined;
        /**
         * @member {Node|undefined} Node#layout Holds all the layout properties (height, width, etc.)
         *
         */
        this.layout = {};
    };
    /**
     * Get configuration values from html5 data attribute
     * @method Node#get
     * @param {String} path The configuration path (e.g.:'foo.bar.baz')
     * @returns {*}
     */
    Node.prototype.get = function (path) {
        var j = this.$el.data('layouter-config');
        return (j)? helpers.deepGet(j, path) : undefined;
    };
    /**
     * Attach child nodes
     * @method Node#attach
     * @param nodes {array.<Node>}
     */
    Node.prototype.attach = function (nodes) {
        var l = this.childs.length;
        for (var i = 0; i < nodes.length; i++)
            this.childs[i + l] = nodes[i];
    };
    /**
     * Get root-node
     * @method Node#getRoot
     * @returns {Node}
     */
    Node.prototype.getRoot = function () {
        var r = function (n) {
            if (n.parent === undefined)
                return n;
            return n.parent.getRoot();
        }(this);
        return r;
    };

    /**
     * Renders the node and its childs
     * @method Node#render
     * @param {renderingOptions} [options]
     */
    Node.prototype.render = function (options) {
        if (!options || !options.render)
        //get rendering options
            options = (options && options.rendering) ||
            this.layouter.get('rendering');
        //execute rendering callback
        options.render(this, options);
        //render childs
        for (var i = 0; i < this.childs.length; i++) {
            options.render(this.childs[i], options);
        }
    };
    /**
     * Reset all layout properties
     * @method Node#reset
     * @param {boolean} [up]
     * @param {boolean} [down]
     */
    Node.prototype.reset = function (up, down) {
        var i;
        this.layout = {};
        if (up && this.parent) {
            this.parent.reset(true);
        }
        if ((down || down === undefined) && this.childs)
            for (i = 0; i < this.childs.length; i++) {
                this.childs[i].reset(false, true);
            }
    };
    /**
     * Examine a node by whatever criteria and
     * return true if it's a match or false otherwise
     * @callback nodeMatcherCallback
     * @param {Node} node
     * @returns {boolean}
     */
    /**
     * Recursively find nodes
     * @method Node#find
     * @param {nodeMatcherCallback} match Match nodes
     * @param {boolean} [deep] If true, perform deep search all the way
     * up or down the hierarchy and return all matches.
     * If false the search will only return the closest matches in the
     * hierarchy (upwards or downwards or both).
     * @param {boolean} [up] If true, search upwards the hierarchy
     * @param {boolean} [down] If true OR undefined, search downwards the hierarchy
     * @return Array<Node>
     */
    Node.prototype.find = function (match, deep, up, down) {
        var i, j, r = [], rr = [], m = false;
        down = (down || down === undefined);
        this.layout = {};
        if (up && this.parent) {
            if (match(this.parent)) {
                r.push(this.parent);
                m = true;
            }
            if (deep || !m) {
                rr = this.parent.find(match, deep, up, down);
                for (j = 0; j < rr.length; j++) {
                    r.push(rr[j]);
                }
            }
        }
        m = false;
        rr = [];
        if (down && this.childs.length)
            for (i = 0; i < this.childs.length; i++) {
                if (match(this.childs[i])) {
                    r.push(this.childs[i]);
                    m = true;
                }
                if (deep || !m) {
                    rr = this.childs[i].find(match, deep, up, down);
                    for (j = 0; j < rr.length; j++) {
                        r.push(rr[j]);
                    }
                }
            }
        return r;
    };
    /**
     * The node parsers callback function returns a jQuery collection
     * from a jQuery element/collection.
     * The elements in the returned collection represent layouter nodes.
     * @callback nodeParserCallback
     * @param {jQuery} $$
     * @return {jQuery}
     */
    /**
     * Node parser
     * @typedef {object} nodeParser
     * @property {nodeParserCallback} parse
     */
    /**
     * Callback to be executed on a Node instance right after it was created
     * @typedef {Function} onCreateCallback
     * @param {Node} node
     */
    /**
     * The layout options
     * @typedef {Object} layoutOptions
     * @property {string} name
     * @property {number} height
     * @property {number} rowHeight
     * @property {Function} animate
     * @property {boolean} breakColumns
     */
    /**
     * The rendering options
     * @typedef {object} renderingOptions
     * @property {Function} render
     * @property {Function} before
     * @property {Function} after
     * @property {layoutOptions} layout - Layout options.
     */
    /**
     * Layouter settings
     * @typedef {object} layouterSettings
     * @property {nodeParser} parser The custom node parser
     * @property {String} selector jQuery selector expression instead of node parser
     * @property {renderingOptions} rendering
     * @property {onCreateCallback} onCreate
     */
    /**
     * The Layouter wraps the node tree,
     * manages global settings,
     * triggers rendering.
     * @class Layouter
     * @param {$ | HTMLElement | string} context The HTML context - jQuery, DOM element or string(HTML)
     * @param {layouterSettings} options
     *
     * */
    exports.Layouter = Layouter = function (context, options) {
        /**
         * @member Layouter#settings
         * @type layouterSettings
         */
        this.settings = $.extend(exports.defaults, options);
        /**
         * @member Layouter#node
         * @type {Node}
         */
        this.node = this.createNode($(context));
    };

    /**
     * Get layouter setting
     * @method Layouter#get
     * @param {string} path The setting's path (e.g.: 'foo.baz.bar')
     * @returns {*}
     * */
    Layouter.prototype.get = function (path) {
        return this.settings && helpers.deepGet(this.settings, path);
    };
    /**
     * Set layouter settings
     * @method Layouter#set
     * @param {string} path The setting's path (e.g.: 'foo.baz.bar')
     * @param {*} value The value to be set
     * */
    Layouter.prototype.set = function (path, value) {
        this.settings = helpers.deepSet(this.settings, path, value);
    };
    /**
     * Creates a node (and it's child nodes) from the provided jQuery element,
     * using the node parser or selector expression
     * stored in layouter settings
     * @method Layouter#createNode
     * @param $el
     * @returns {Node}
     */
    Layouter.prototype.createNode = function ($el) {
        var self = this, n = new Node($el, this), cs, $cs,
            p = this.get('parser'), s = this.get('selector');
        n.$el.data('layouter-node', n);
        //use provided parser to find child nodes
        if (p) {
            cs = p.parse(n.$el);
        }
        //use a jQuery selector expression to find child nodes
        else if (s) {
            cs = n.$el.childs(s);
        }
        //make childs jQuery
        $cs = (cs instanceof $) ? cs : $(cs);
        //for each child
        $cs.each(function (i, c) {
            //create child node
            var cn = self.createNode($(c));
            //set parent
            cn.parent = n;
            //attach
            n.childs[i] = cn;
        });
        //execute callback hooks
        if (this.get('onCreate')) this.get('onCreate')(n);
        return n;
    };

    /**
     * @method Layouter#render
     * @param {renderingOptions} [options]
     */
    Layouter.prototype.render = function (options) {
        var b = (this.get('rendering')) ?
                this.get('rendering') : exports.defaults.rendering,
            s = (options) ? $.extend(b, options) : b;
        if (s !== b) this.set('rendering', s);
        if (s && s.before) s.before();
        this.node.reset();
        this.node.render(s);
        if(s && s.after) s.after();
    };
    return exports;
}));