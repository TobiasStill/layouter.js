/**
 * Created by Tobias Still on 30.10.2014.
 * @module layouter/polymorphicCompositeTable
 */
var layouter = layouter || {};
layouter.polymorphicCompositeTable = function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter/polymorphicCompositeTable', ['layouter', 'jquery'], factory);
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
        Node = layouter.Node;
    /**
     * Since this is 'polymorphic table composite', this variable
     * holds the current variant if there is any
     * @private
     */
    var variant;
    var types = exports.types = {};
    types.table = function ($el) {
        return ($el.hasClass('layouter-table'));
    };
    types.row = function ($el) {
        return ($el.hasClass('layouter-table-row'));
    };
    types.col = function ($el) {
        return ($el.hasClass('layouter-table-col'));
    };
    /**
     * @method Node#getType
     * @returns {string}
     */
    Node.prototype.getType = function () {
        var type;
        if (this.type !== undefined)
            return this.type;
        for (type in types) {
            if (types.hasOwnProperty(type) && types[type](this.$el))
                this.type = type;
        }
        return this.type;
    };
    /**
     * @method Node#getCalculator
     * @returns {object}
     */
    Node.prototype.getCalculator = function () {
        var calc = calculators[this.getType()];
        return calc;
    };
    /**
     * @method Node#getHeight
     * @param {string | number} q1 Qualifyer (desired|required|final|balanced) or number
     * @param {string} q2 Optional qualifyer (outer|inner)
     * @returns {*}
     */
    Node.prototype.getHeight = function (q1, q2) {
        var calc = this.getCalculator(), n;
        if (typeof q1 === 'string' && this.height[q1] === undefined) {
            this.height[q1] = calc.height[q](this);
        }
        n = (typeof q1 !== 'string') ? q1 : this.height[q1];
        return (q2 && calc.height[q2](n, this)) || n;
    };
    /**
     * @method Node#getWidth
     * @param {string | number} q1 Qualifyer (final|percent) or number
     * @param {string} q2 Optional qualifyer (outer|inner)
     * @returns {*}
     */
    Node.prototype.getWidth = function (q1, q2) {
        var calc = this.getCalculator(), n;
        if (typeof q1 === 'string' && this.width[q1] === undefined) {
            this.width[q1] = calc.width[q1](this);
        }
        n = (typeof q1 !== 'string') ? q1 : this.width[q1];
        return (q2 && calc.width[q2](n, this)) || n;
    };
    /**
     * Checks if the nodes element has display
     * @method Node#hasDisplay
     * @returns {bool}
     */
    Node.prototype.hasDisplay = function () {
        //get the jQuery DOM-elements of all the nodes ascendants
        // via anonymous function
        var $a = function (n, $a) {
            if (n.parent === undefined)
                return $a;
            $a.add(n.parent.$el);
            return this.call([n.parent, $a]);
        }(this, jQuery());
        //check if neither the node nor any of it's ascendants has display:none
        return this.$el.css('display') !== 'none' && $a.css('display') !== 'none';
    };
    /**
     *
     * @param {Array.<Node>} nodes
     * @returns {Array}
     */
    var displayed = function (nodes) {
        var d = [], i;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].hasDisplay())
                d.push(nodes[i]);
        }
        return d;
    };
    /**
     * Measure height of a node by content
     * @param {Node} nodes
     * @returns {number}
     */
    var measure = function (node) {
        var $clone = node.$el.clone(), r, p;
        $clone.css({
            visibility: 'hidden',
            position: 'absolute'
        });
        p = node.parent ? node.parent.$el : document.body;
        $clone.appendTo(p);
        $clone.height('auto');
        $clone.width(node.getWidth('final'));
        r = $clone.height();
        $clone.remove();
        return r;
    };

    /**
     * Here we define all the calculators
     * for calculating the dimensions of a node in our layout
     * @type {Array}
     */
    var calculators = exports.calculators = [];
    var calculatorTemplate = {
        width: {
            final: undefined,
            percent: undefined,
            factor: undefined,
            inner: function (w, node) {
                var d = node.$el.outerWidth(true) - $el.innerWidth();
                return w - d;
            },
            outer: function (w, node) {
                var d = node.$el.outerWidth(true) - $el.innerWidth();
                return w + d;
            }
        },
        height: {
            desired: undefined,
            required: undefined,
            balanced: undefined,
            final: undefined,
            factor: undefined,
            inner: function (h, node) {
                var d = node.$el.outerHeight(true) - $el.innerHeight();
                return h - d;
            },
            outer: function (h, node) {
                var d = node.$el.outerHeight(true) - $el.innerHeight();
                return h + d;
            }
        },
        position: {
            left: undefined,
            left_percent: undefined
        }
    };
    /**
     * the calculators
     */
    var row = calculators.row = jQuery.clone(calculatorTemplate);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.width.final = function (node) {
        var p = node.parent;
        return p.getWidth('final', 'inner');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.width.percent = function (node) {
        return 100;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.height.desired = function (node) {
        //get dimensions of parent node
        var p = node.parent,
        //get factor
            f = node.getHeight('factor');
        //the desired height of the row is the desired height of the parent col/table
        //multiplied by the derived/configured factor
        return p.getHeight('desired', 'inner') * f;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.height.required = function (node) {
        var c = node.childs,
        //to begin with, get the nodes desired height
            d = node.getHeight('desired'),
        //and assume optimistically that the node
        // will not require more height than desired
            r = d,
            i,
            cr;
        //now we loop thru all childs
        for (i = 0; i < c.length; i++) {
            //get the child's required height
            cr = c[i].getHeight('required');
            //if the child's required height exceeds
            // the inner height of the node based on our
            // expectations so far, increase it accordingly
            if (cr > node.getHeight(r, 'inner'))
                r = node.getHeight(r, 'inner');
        }
        //return the result
        return r;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.height.factor = function (node) {
        //get factor from element configuration
        var conf = node.getConfig();
        return (conf.variants && conf.variants[variant] && conf.variants[variant].height) ||
                // OR derived from the number sibling rows
            1 / displayed(node.parent.childs).length ||
                //OR 1
            1;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.height.final = function (node) {
        var p = node.parent,
        //get factor from element configuration
            conf = node.getConfig(),
            f = (conf.variants && conf.variants[variant] && conf.variants[variant].height) ||
                    // OR derived from the number sibling rows
                1 / displayed(node.parent.childs).length ||
                    //OR 1
                1,
        //get the balanced height of the node parent col/table
            b = p.getHeight('balanced'),
        //assume final height as parents balanced height multiplied by factor
            fh = p.getHeight(b, 'inner') * f,
        //get the required height
            r = node.getHeight('required');
        //if the required height exceeds the final height derived so far,
        // increase it accordingly
        if (r > fh) {
            fh = r;
        }
        //return the result
        return fh;
    };
    /**
     * Leaf column
     */
    var col = calculators.col = jQuery.clone(calculatorTemplate);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.width.final = function (node) {
        var p = node.parent,
        //get parent rows inner width
            w = p.getWidth('final', 'inner'),
        //get factor
            f = node.getWidth('factor');
        //the columns final width is the rows inner width multiplied by factor
        return w * f;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.width.percent = function (node) {
        var p = 100,
        //get factor
            f = node.getWidth('factor');
        //the columns width in percent equals 100 * factor
        return p * f;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.width.factor = function (node) {
        var conf, f;
        //get factor from element configuration
        conf = node.getConfig();
        f = (conf.variants && conf.variants[variant] && conf.variants[variant].width) ||
            // OR derived from the number sibling rows
        1 / displayed(node.parent.childs).length ||
            //OR 1
        1;
        return f;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.height.desired = function (node) {
        var p = node.parent;
        //the columns desired height equals the
        // desired inner height of the parent row
        return p.getHeight('desired', 'inner');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.height.required = function (node) {
        //the columns required height equals
        // it's content's height
        return measure(node);
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.height.final = function (node) {
        var p = node.parent;
        //the columns final height equals the
        // final inner height of the parent row
        return p.getHeight('final', 'inner');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.position.left = function (node) {
        var s, l, i;
        //get the columns displayed siblings
        s = displayed(node.parent.childs);
        l = 0;
        //loop thru all sibling columns
        for (i = 0; i < s.length; i++) {
            //until we arrive at this column itself
            if (s[i] === node)
                break;
            //and sum up the widths of the preceding siblings to
            // derive the left position
            l += s[i].getWidth('final');
        }
        return l;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    col.position.left_percent = function (node) {
        var s, l, i;
        //get the columns displayed siblings
        s = displayed(node.parent.childs);
        l = 0;
        //loop thru all sibling columns
        for (i = 0; i < s.length; i++) {
            //until we arrive at this column itself
            if (s[i] === node)
                break;
            //and sum up the widths of the preceding siblings to
            // derive the left position
            l += s[i].getWidth('percent');
        }
        return l;
    };
    /**
     * Calculator for breaking columns
     */
    var breaking = calculators.breaking = jQuery.clone(col);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.height.factor = function (node) {
        var conf, f;
        //get factor from element configuration
        conf = node.getConfig();
        f = (conf.variants && conf.variants[variant] && conf.variants[variant].height) ||
            //OR 1
        1;
        return f;
    };
    /**
     * Calculator for compound cells, a complicated thing
     */
    var compound = calculators.compound = jQuery.clone(col);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    compound.height.required = function (node) {
        var c, r, i, cr, cd;
        //get the columns displayed siblings
        c = displayed(node.childs);
        r = node.getHeight('desired');
        //loop thru all sibling rows
        for (i = 0; i < c.length; i++) {
            cr = c[i].getHeight('required');
            cd = c[i].getHeight('desired');
            //if the row's required height exceeds it's desired height
            //increase the required height of the compound column accordingly
            r = (cr > cd) ? r - cd + rh : r;
        }
        return r;
    };

    compound.height.balanced = function (node) {
        var c, h, rxs, lxs, i, xs, r, rm, b, rf, f, xsr, n;
        //get the compound columns children rows
        c = displayed(node.childs);
        //get the columns final height
        h = node.getHeight('final');
        // if there's only a single child row, that's really it
        if (c.length === 1)
            return h;
        //if any of the children row's required height exceeds it's desired height,
        //we call it 'excessive'.
        //'rxs' will collect the excessive rows
        //sorted in descending order by the amount of the excess
        rxs = [];
        //'lxs' will track the largest excess for sorting
        lxs = 0;
        //now loop thru the children rows
        for (i = 0; i < c.length; i++) {
            r = c[i];
            // store the amount of the current row's excess in the variable 'xs'
            xs = r.getHeight('required') - row.getHeight('desired');
            //if the current row's excess exceeds all previous excesses
            if (xs > lxs) {
                //track it as largest
                lxs = xs;
                //and put it on top of the collection
                rxs.unshift(r);
            }
            //if it is just a mediocre excess
            else if (xs) {
                //store it at the end of the collection
                /**
                 * @todo But this is not really sorting, dumbass
                 */
                rxs.push(r);
            }
        }
        //initialize some variables
        //'r' for remainder
        rm = h;
        //'b' as the resulting balanced height
        b = rm;
        //'rf' as the remaining factor
        rf = 1;
        //now loop thru the ordered excessive rows collected above
        for (i = 0; i < rxs.length; i++) {
            xsr = rxs[i];
            //substract the current excessive row's required height from the remainder
            rm = rm - xsr.getHeight('required');
            //get factor
            f = xsr.getHeight('factor');
            //substract the current excessive row's height factor from the remaining factor
            rf = rf - f;
            //now we 'normalize' the remainder by multiplying it with the remaining factor
            n = rm * (1 / rf);
            if (xsr.getHeight('required') <= n * f) {
                return b;
            }
            b = n;
        }
        return b;
    };

    /**
     * Calculator for the toplevel container
     */
    var table = calculators.table = jQuery.clone(compound);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    table.height.desired = function (node) {
        //get dimensions of parent node
        var conf = node.getConfig(),
            d;
        if (conf.height) d = conf.height;
        if (conf.rowHeight) {
            var s = displayed(node.childs).length;
            d = node.getHeight(conf.rowHeight * s, 'outer');
        }
        return d;
    };

    /**
     * A parser
     * @type {object}
     */
    var parser = exports.parser = {};
    /**
     *
     * @param {jQuery} $el
     * @returns {jQuery|null}
     */
    parser.parse = function ($el) {
        var $c, $d = $el.find('.layouter-table-row, .layouter-table-col');
        $d.each(function (el) {
            if (jQuery(el).closest('.layouter-table, .layouter-table-row, .layouter-table-col') == $el)
                $c.add(el);
        });
        return $c || null;
    };
    /**
     * A renderer
     * @type {object}
     */
    var renderer = exports.renderer = {};
    /**
     *
     * @param {Node} node
     * @param {object} options
     */
    renderer.render = function (node, options) {
        variant = options && options.variant;

    };
    return exports;
});
