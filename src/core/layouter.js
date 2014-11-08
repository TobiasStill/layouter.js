/**
 * Created by Tobias Still on 29.10.2014.
 * @module layouter
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
    var exports = {}, Layouter, Node, $ = jQuery;
    exports.$ = $;
    exports.version = '0.0.0';

    /**
     * The parser
     * @typedef {object} Layouter~parser
     * @property {Function} parse
     */
    /**
     * The layouter options.
     * @typedef {Object} Layouter~layouterOptions
     * @property {Layouter~parser} parser
     */
    /**
     * @typedef {Object} Layouter~layoutConfiguration
     * @property {string} name
     * @property {number} height
     * @property {number} rowHeight
     * @property {Function} animate
     * @property {boolean} breakColumns
     */
    /**
     * The renderer
     * @typedef {object} renderer
     * @property {Function} render
     * @property {Function} before
     * @property {Function} after
     */
    /**
     * The rendering options.
     * @typedef {Object} Layouter~renderingOptions
     * @property {Layouter~layoutConfiguration} layout - Layout options.
     * @property {renderer} renderer - The renderer.
     */
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
     * @method Node#getConfig
     * @returns {object}
     */
    Node.prototype.getConfig = function () {
        var j = this.$el.data('layouter-config');
        //if (j) j = jQuery.parseJSON(j);
        return j;
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
     * @param {renderingOptions} options Must have property 'renderer' with method 'render'
     */
    Node.prototype.render = function (options) {
        var cb = options.renderer.render;
        cb(this, options);
        for (var i = 0; i < this.childs.length; i++) {
            cb(this.childs[i], options);
        }
    };
    /**
     * Gets layouter option
     * @method Node#get
     * @param {string} option The name of the layouter option to return
     * @returns {*}
     * */
    Node.prototype.get = function (option) {
        return this.layouter.get(option);
    };

    /**
     * Reset all layout properties
     * @method Node#reset
     * @param {boolean} up
     * @param {boolean} down
     */
    Node.prototype.reset = function (up, down) {
        var i;
        this.layout = {};
        if (up && this.parent) {
            this.parent.reset(true);
        }
        if (down && this.childs)
            for (i = 0; i < this.childs.length; i++) {
                this.childs[i].reset(false, true);
            }
    };
    /**
     * @method Node#find
     * Recursively find nodes matching criteria evaluated by a callback function
     * @param {Function} cb Callback to match nodes
     * @param {boolean} [deep] If true, perform deep search all the way
     * down or up the hierarchy and return all matches,
     * if false the search will only return the closest matches in the
     * hierarchy upwards or downwards or both
     * @param {boolean} [up] If true, search upwards the hierarchy
     * @param {boolean} [down] If true OR undefined, search downwards the hierarchy
     */
    Node.prototype.find = function (cb, deep, up, down) {
        var i, j, r = [], rr = [], m = false;
        down = (down || down === undefined);
        this.layout = {};
        if (up && this.parent) {
            if(cb(this.parent)){
                r.push(this.parent);
                m = true;
            }
            if(deep || !m){
                rr = this.parent.find(cb, deep, up, down);
                for(j = 0; j < rr.length; j++){
                    r.push.(rr[j]);
                }
            }
        }
        m = false;
        rr = [];
        if (down && this.childs.length)
            for (i = 0; i < this.childs.length; i++) {
                if(cb(this.childs[i])){
                    r.push(this.childs[i]);
                    m = true
                }
                if(deep || !m){
                    rr = this.childs[i].find(cb, deep, up, down);
                    for(j = 0; j < rr.length; j++){
                        r.push.(rr[j]);
                    }
                }
            }
        return r;
    };

    /**
     * @class Layouter
     * @param {$ | HTMLElement | string} context The container, DOM element or HTML
     * @param {object} options
     * */
    exports.Layouter = Layouter = function (context, options) {
        this.options = $.extend(options, this.getDefaults('layouter'));
        this.node = this.createNode($(context));
    };
    /**
     * Gets default layouter options.
     * To be overridden by modules
     * @method Layouter#getDefaults
     * @param {string} q ('layouter'|'rendering')
     * @returns {*}
     * */
    Layouter.prototype.getDefaults = function (q) {
        return {};
    };
    /**
     * Gets layouter option
     * @method Layouter#get
     * @param {string} option The name of the layouter option to return
     * @returns {*}
     * */
    Layouter.prototype.get = function (option) {
        return this.options && this.options[option];
    };
    /**
     * Parses a jQuery-element by the provided parser callback function
     * and recursively creates a node its child nodes
     * @method Layouter#createNode
     * @param $el
     * @returns {Node}
     */
    Layouter.prototype.createNode = function ($el) {
        var self = this, n = new Node($el, this), cs, $cs,
            p = this.get('parser'), s = this.get('selector');
        n.$el.data('layouter-node', n);
        //use provided parser
        if (p) {
            cs = p.parse(n.$el);
        }
        //use a jQuery selector expression
        else if (s) {
            cs = n.$el.childs(s);
        }
        $cs = (typeof cs == 'jQuery') ? cs : $(cs);
        $cs.each(function (i, c) {
            var cn = self.createNode($(c));
            cn.parent = n;
            n.childs[i] = cn;
        });
        return n;
    };

    Layouter.prototype.before = function () {
    };
    Layouter.prototype.after = function () {
    };
    /**
     * @method Layouter#render
     * @param {Layouter~renderingOptions} options
     */
    Layouter.prototype.render = function (options) {
        options = $.extend(options, this.getDefaults('rendering'));
        this.layout = options && options.layout;
        this.before();
        this.node.render(options);
        this.after();
    };
    return exports;
}));