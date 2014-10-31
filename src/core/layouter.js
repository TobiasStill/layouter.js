/**
 * Created by Tobias Still on 29.10.2014.
 * @module layouter
 */
var layouter;
layouter = (function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter', ['jquery'], factory);
    } else if (typeof exports === 'object') {
// Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
        module.exports = factory(require('jquery'));
    } else {
// Browser globals (root is window)
        root.returnExports = factory(root.jQuery);
    }
}(this, function (jQuery) {
    var exports = {};
    var Layouter, Node;
    /**
     * @class Node
     * @param {jQuery} $el
     */
    exports.Node = Node = function ($el, layouter) {
        this.$el = $el;
        this.layouter = layouter;
        this.childs = [];
        this.parent = undefined;
    };
    /**
     * @method Node#getConfig
     * @returns {object}
     */
    Node.prototype.getConfig = function () {
        return this.$el.data('layouter-config');
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
            return this.call(n.parent);
        }(this);
        return r;
    };
    /**
     * Renders the node and its childs
     * @method Node#render
     * @param {object} options Must have property 'renderer' with method 'render'
     */
    Node.prototype.render = function (options) {
        var cb = options.renderer.render;
        cb(this);
        for (var i = 0; i < this.childs.length; i++) {
            cb(this.childs[i]);
        }
    };
    /**
     * @class Layouter
     * @param {jQuery} context The container, DOM element or HTML
     * @param {object} options
     * */
    exports.Layouter = Layouter = function (context, options) {
        this.options = options;
        if (options.parser || options.selector)
            this.node = this.createNode(jQuery(context), options);
    };
    /**
     * Parses a jQuery-element by the provided parser callback function
     * and recursively creates a node its child nodes
     * @method Layouter#createNode
     * @param $el
     * @param options
     * @returns {Node}
     */
    Layouter.prototype.createNode = function ($el, options) {
        var self = this, n = new Node($el, this), cs, $cs, i;
        n.$el.data('layouter-node', n);
        //use provided parser
        if (options && options.parser) {
            cs = options.parser.parse(n.$el);
        }
        //use a jQuery selector expression
        else if (options.selector) {
            cs = n.$el.childs(options.selector);
        }
        $cs = (typeof cs == jQuery) ? cs : jQuery(cs);
        i = -1;
        $cs.each(function (c) {
            var cn = self.createNode(jQuery(c));
            cn.parent = n;
            n.childs[i++] = cn;
        });
        return n;
    };
    /**
     * @method Layouter#render
     * @param {object} options Must have property 'renderer' with method 'render'
     */
    Layouter.prototype.render = function (options) {
        this.node.render(options);
    };
    return exports;
}));