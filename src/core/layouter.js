/**
 * Created by Tobias Still on 29.10.2014.
 */
(function (root, factory) {
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
     *
     * @constructs Node
     * @param {jQuery} $el
     */
    exports.Node = Node = function ($el) {
        this.$el = $el;
        this.childs = [];
        this.parent = undefined;
    };
    /**
     * Attach child nodes
     * @param nodes {array.<Node>}
     */
    Node.prototype.attach = function (nodes) {
        var l = this.childs.length;
        for (var i = 0; i < nodes.length; i++)
            this.childs[i + l] = nodes[i];
    };
    Node.prototype.render = function (cb) {
        cb(this);
        for (var i = 0; i < this.childs.length; i++) {
            cb(this.childs[i]);
        }
    };
    /**
     *
     * @param {jQuery} context The container, DOM element or HTML
     * @param {string|function} filter jQuery-selector expression or
     * a filter function that returns either a jQuery collection or an array of matched DOM elements
     * @param options
     * */
    exports.Layouter = Layouter = function (context, filter, options) {
        this.options = options;
        this.node = this.createNode(jQuery(context), filter);
    };
    Layouter.prototype.createNode = function ($el, filter) {
        var self = this, n = new Node($el), cs;
        n.$el.data('layouter-node', n);
        //if filter is a function
        if (typeof filter === "function") {
            cs = filter(n.$el);
        }
        //if filter is a jQuery selector expression
        if (typeof filter === "string") {
            cs = n.$el.childs(filter);
        }
        var $cs = (typeof cs == jQuery) ? cs : jQuery(cs);
        var i = -1;
        $cs.each(function (c) {
            var cn = self.createNode(jQuery(c));
            cn.parent = n;
            n.childs[i++] = cn;
        });
        return n;
    };
    /**
     *
     * @param cb The callback that does the rendering
     */
    Layouter.prototype.render = function (cb) {
        this.node.render(cb);
    };
    return exports;
}))
;