/**
 * Created by Tobias Still on 30.10.2014.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter.table', ['layouter', 'jquery'], factory);
    } else if (typeof exports === 'object') {
// Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
        module.exports = factory(require('jquery'), require('../core/layouter.js'));
    } else {
// Browser globals (root is window)
        root.returnExports = factory(root.jQuery, root.layouter);
    }
}(this, function (jQuery, layouter) {
    var exports = layouter,
        Layouter = layouter.Layouter,
        Node = layouter.Node,
        filter;
    Node.prototype.getType = function () {
        if (this.type !== undefined)
            return this.type;
        if (this.$el.hasClass('layouter-table'))
            this.type = 'table';
        if (this.$el.hasClass('layouter-table-row'))
            this.type = 'row';
        if (this.$el.hasClass('layouter-table-col'))
            this.type = 'col';
        return this.type;
    };
    exports.filter = filter = function ($el) {
        var $c, $d = $el.find('.layouter-table-row, .layouter-table-col');
        $d.each(function (el) {
            if (jQuery(el).closest('.layouter-table, .layouter-table-row, .layouter-table-col') == $el)
                $c.add(el);
        });
        return $c;
    };
    var engine = function (node) {

    };
    return exports;
}));
