/**
 * Created by Tobias Still on 30.10.2014.
 * @module layouter/compositeTable
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter/compositeTable', ['layouter', 'jquery'], factory);
    } else if (typeof exports === 'object') {
// Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
        module.exports = factory(require('jquery'), require('../core/layouter.js'));
    } else {
// Browser globals (root is window)
        root.layouter = factory(root.jQuery, root.layouter);
    }
}(this, function (jQuery, layouter) {
    var exports = layouter,
        Layouter = layouter.Layouter,
        Node = layouter.Node;

    /**
     * @typedef {Function} mapping
     * @param {jQuery} $el
     * @return {boolean}
     * /
     /**
     * The types map maps jQuery Elements to node types
     * @var {Object.<string, mapping>} types
     */
    var types = exports.types = {};
    types.table = function (node) {
        return (node.$el.hasClass('layouter-table'));
    };
    types.row = function (node) {
        return (node.$el.hasClass('layouter-row'));
    };
    types.compound = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.find('.layouter-row').length);
    };
    types.breaking = function (node) {
        var l = node.layouter && node.layouter.layout;
        return (node.$el.hasClass('layouter-col') && l && l.breakColumns);
    };
    types.flexible = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-flexible'));
    };
    types.col = function (node) {
        return (node.$el.hasClass('layouter-col'));
    };

    /**
     * Here we define all the calculators
     * for calculating the dimensions of a node in our layout
     */
    /**
     * @typedef {Function} calculation
     * @param {jQuery} $el
     * @return {number}
     * /
     /**
     * The calculators map maps node types
     * to collections of calculations
     * @var {Object.<string, Object.<string, calculation>>} calculators
     */
    var calculators = exports.calculators = {};
    var calculatorTemplate = {
        width: {
            final: undefined,
            percent: undefined,
            factor: undefined,
            inner: function (w, node) {
                var d = node.$el.outerWidth(true) - node.$el.innerWidth();
                return w - d;
            },
            outer: function (w, node) {
                var d = node.$el.outerWidth(true) - node.$el.innerWidth();
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
                var d = node.$el.outerHeight(true) - node.$el.innerHeight();
                return h - d;
            },
            outer: function (h, node) {
                var d = node.$el.outerHeight(true) - node.$el.innerHeight();
                return h + d;
            }
        },
        position: {
            left: undefined,
            left_percent: undefined
        }
    };

    /**
     * Return all nodes that have display
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
     * Get the nodes type
     * @method Node#getType
     * @returns {string}
     */
    Node.prototype.getType = function () {
        var type;
        if (this.type !== undefined)
            return this.type;
        for (type in types) {
            if (types.hasOwnProperty(type) && types[type](this)) {
                this.type = type;
                return this.type;
            }
        }
    };
    /**
     * Get the nodes type corresponding calculator map
     * @method Node#getCalculator
     * @returns {object}
     */
    Node.prototype.getCalculator = function () {
        return calculators[this.getType()];
    };
    /**
     * Get or calculate the width of a node
     * using various qualifiers
     * @method Node#getWidth
     * @param {string | number} q1 Qualifier (final|percent) or number
     * @param {string} q2 Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getWidth = function (q1, q2) {
        if (this.width === undefined)
            this.width = {};
        if (q2 === undefined && this.width[q1])
            return this.width[q1];
        var calc = this.getCalculator(), n;
        if (typeof q1 === 'string' && this.width[q1] === undefined) {
            this.width[q1] = calc.width[q1](this);
        }
        n = (typeof q1 !== 'string') ? q1 : this.width[q1];
        return (q2 && calc.width[q2](n, this)) || n;
    };
    /**
     * Get or calculate the height of a node
     * using various qualifiers
     * @method Node#getHeight
     * @param {string | number} q1 Qualifier (desired|required|final|balanced) or number
     * @param {string} q2 Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getHeight = function (q1, q2) {
        if (this.height === undefined)
            this.height = {};
        if (q2 === undefined && this.height[q1])
            return this.height[q1];
        var calc = this.getCalculator(), n;
        if (typeof q1 === 'string' && this.height[q1] === undefined) {
            this.height[q1] = calc.height[q1](this);
        }
        n = (typeof q1 !== 'string') ? q1 : this.height[q1];
        return (q2 && calc.height[q2](n, this)) || n;
    };
    /**
     * Get or calculate the width of a node
     * using various qualifiers
     * @method Node#getWidth
     * @param {string | number} q1 Qualifier (final|percent) or number
     * @param {string} q2 Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getPosition = function (q1) {
        if (this.position === undefined)
            this.position = {};
        if (this.position[q1])
            return this.position[q1];
        var calc = this.getCalculator(), n;
        this.position[q1] = calc.position[q1](this);
        return this.position[q1];
    };
    /**
     * Checks if the nodes element has display
     * @method Node#hasDisplay
     * @returns {bool}
     */
    Node.prototype.hasDisplay = function () {
        //get the jQuery DOM-elements of all the nodes ascendants
        // via anonymous function
        var ascendants = function (n, $a) {
                if (n.parent === undefined)
                    return $a;
                $a.add(n.parent.$el);
                return ascendants(n.parent, $a);
            },
            $a = ascendants(this, jQuery());
        //check if neither the node nor any of it's ascendants has display:none
        return this.$el.css('display') !== 'none' && $a.css('display') !== 'none';
    };
    /**
     * Reset all layout properties
     * @method Node#reset
     * @param {boolean} up
     * @param {boolean} down
     */
    Node.prototype.reset = function(up, down){
        var i;
        this.height = this.width = this.position = undefined;
        if(up && this.parent){
            this.parent.reset(true);
        }
        if(down && this.childs)
            for (i = 0; i < this.childs.length; i++) {
            this.childs[i].reset(false,true);
        }
    };

    Layouter.prototype.before = function(){
        this.node.reset(false, true);
    };

    /**
     * the calculators
     */
    var row = calculators.row = jQuery.extend(true, {}, calculatorTemplate);
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
                r = cr;
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
        var conf = node.getConfig(), l = node.layouter && node.layouter.layout;
        return (conf && conf.layouts && l.name && conf.layouts.hasOwnProperty(l.name) &&
            conf.layouts[l.name].height) ||
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
            f = node.getHeight('factor'),
        //get the balanced inner height of the nodes parent col/table
        //multiplied by factor
            b = p.getHeight('balanced', 'inner') * f,
        //get the required height
            r = node.getHeight('required');
        //return the balanced height or the required height if larger
        return (r > b) ? r : b;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.position.left = function (node) {
        return 0;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    row.position.left_percent = function (node) {
        return 0;
    };

    /**
     * Leaf column
     */
    var col = calculators.col = jQuery.extend(true, {}, calculatorTemplate);
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
        var conf, f, l = node.layouter && node.layouter.layout;
        //get factor from element configuration
        conf = node.getConfig();
        f = (conf && conf.layouts && l.name && conf.layouts.hasOwnProperty(l.name) &&
        conf.layouts[l.name].width) ||
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
    var breaking = calculators.breaking = jQuery.extend(true, {}, col);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.width.final = function (node) {
        var r = node.getRoot();
        return r.getWidth('final');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.width.percent = function (node) {
        return 100;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.position.left_percent = function (node) {
        return 0;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.height.desired = function (node) {
        var r = node.getRoot(), conf = r.getConfig(),
            l = node.layouter && node.layouter.layout,
            c = conf.layouts && l.name && conf.layouts.hasOwnProperty(l.name);
        if (!c) c = layout;
        if (c.rowHeight)
            return c.rowHeight;
        if (c.height)
            return conf.height;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.height.factor = function (node) {
        var conf, f,  l = node.layouter && node.layouter.layout;
        //get factor from element configuration
        conf = node.getConfig();
        f = (conf.layouts && l.name && conf.layouts.hasOwnProperty(l.name) && conf.layouts[l.name].height) ||
            //OR 1
        1;
        return f;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.position.left = function (node) {
        return 0;
    };

    /**
     * Calculator for flexible columns.
     * A flexible column is one which's height is not affected by
     * it's content.
     * Accordingly the required height always equals the desired height
     */
    var flexible = calculators.flexible = jQuery.extend(true, {}, col);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    flexible.height.required = function (node) {
        return node.getHeight('desired');
    };
    /**
     * Calculator for compound cells, a rather complicated thing
     */
    var compound = calculators.compound = jQuery.extend(true, {}, col);

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
            r = (cr > cd) ? r - cd + cr : r;
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
            xs = r.getHeight('required') - r.getHeight('desired');
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
                 * @todo But this is not really sorting, i mean...
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
    var table = calculators.table = jQuery.extend(true, {}, compound);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    table.width.final = function (node) {
        var l = node.layouter && node.layouter.layout,
        w = l && l.width || node.$el.width();
        return node.getWidth(w, 'outer');
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    table.height.desired = function (node) {
        //get dimensions of parent node
        var conf = node.getConfig(),
            r, s,  l = node.layouter && node.layouter.layout;
        if (conf && conf.height) return node.getHeight(conf.height, 'outer');
        if (l && l.height) return node.getHeight(l.height, 'outer');
        r = (conf && conf.rowHeight) || (l && l.rowHeight);
        s = displayed(node.childs).length;
        return node.getHeight(r * s, 'outer');
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    table.height.final = function (node) {
        var r, d;
        d = node.getHeight('desired');
        r = node.getHeight('required');
        return (r > d) ? r : d;
    };
    /**
     * The table derives it's dimensions from configuration or from the
     * actual with of it's element.
     * @param {Node} node
     * @returns {number}
     */
    table.height.inner = function (h, node) {
        return h;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    table.position.left = function (node) {
        return 0;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    table.position.left_percent = function (node) {
        return 0;
    };
    /**
     * @var {parser} parser
     */
    var parser = exports.parser = {};
    /**
     * @param {jQuery} $el
     * @returns {jQuery|null}
     */
    parser.parse = function ($el) {
        var $c = jQuery(), $d = $el.find('.layouter-row, .layouter-col'), p;
        $d.each(function (i, el) {
            p = jQuery(el).parent().closest('.layouter-table, .layouter-row, .layouter-col');
            if (p.get(0) === $el.get(0))
                $c = $c.add(el);
        });
        return $c || null;
    };

    /**
     * @var {renderer} renderer
     */
    var renderer = exports.renderer = {};
    renderer.align = function(h, r, $el, a) {
        var s, t, an;
        $el.css('position', 'relative').css('top', '');
        s = h - r;
        if (s < 1)
            return (a)? new $.Deferred().resolve(): null;
        t = (s) / 2;
        an = function($el, t){
            return $el.animate({'position':'relative', 'top':t}).promise();
        };
        if (an){
            return an($el, t);
        }
        $el.css('position', 'relative').css('top', t);
    };
    renderer.before = function(){};
    renderer.after = function(){};

    /**
     *
     * @param node
     * @param h
     * @param a
     * @returns {*}
     */

    var align = function(node, h, a) {
        var r, $el, s, t, an;
        if(node.getType() !=='col' || !($el = node.$el.find('.align')) || !$el.length){
            return null;
        }
        r = node.getHeight('required', 'inner');
        s = h - r;
        if (s < 1)
            return (a)? {resolved: true}: null;
        t = (s) / 2;
        if (a){
            an = function($el, t){
                return $el.animate({'position':'relative', 'top':t}).promise();
            };
            return an($el, t);
        }
        $el.css('position', 'relative').css('top', t);
        return {resolved: true};
    };

    /**
     *
     * @param $el
     * @param w
     * @param h
     * @param l
     * @returns {{resolved: boolean}}
     */
    var apply = function($el, w, h, l){
        $el.width(w);
        $el.height(h);
        $el.css('left', l);
        return {resolved: true};
    };

    /**
     * Here i override the rendering function
     * to add vertical alignment
     * @param {Node} node
     * @param {renderingOptions} options
     */
    exports.renderer.render = function (node, options) {
        var $el = node.$el, a = options.layout.animate, p, w, h, l, i, c, r;
        w = node.getWidth('final', 'inner');
        h = node.getHeight('final', 'inner');
        l = node.getPosition('left');
        if (a) {
            a($el, w, h, l);
        }
        else {
            apply($el, w, h, l);
        }
        align(node, h, a);
        for (i = 0; i < node.childs.length; i++) {
            c = node.childs[i];
            options.renderer.render(c, options);
        }
    };
    return exports;
}));
