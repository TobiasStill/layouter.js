/**
 * Created by Tobias Still on 30.10.2014.
 * @module layouter/compositeTable
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter/compositeTable', ['layouter'], factory);
    } else if (typeof exports === 'object') {
// Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
        module.exports = factory(require('../core/layouter.js'));
    } else {
// Browser globals (root is window)
        root.layouter = factory(root.layouter);
    }
}(this, function (layouter) {
    var exports = layouter,
        $ = layouter.$,
        Layouter = layouter.Layouter,
        Node = layouter.Node;
    
    var templates = exports.templates = {};
    var helpers = exports.helpers = {};
    var defaults = exports.defaults = {};
    defaults.layouter = {};
    var calculators = defaults.layouter.calculators = {};
    var types = defaults.layouter.types = {};


    /**
     * The layouter options.
     * @typedef {Object} Layouter~layouterOptions
     * @property {Layouter~parser} parser
     * @property {Object.<string, Function>} types
     * Maps jQuery Elements to node types
     * @property {Object.<string, Object.<string, Function>>} calculators
     * Contains all the calculator-functions for any node type and layout-property
     */


    /**
     * define the calculators
     * for calculating the dimensions of a node in our layout
     */
     templates.calculator = {
        width: {
            final: function () {
                return undefined;
            },
            percent: function () {
                return undefined;
            },
            factor: function () {
                return undefined;
            },
            delta: function (node) {
                return node.$el.outerWidth(true) - node.$el.width();
            },
            inner: function (w, node) {
                return w - node.getWidth('delta');
            },
            outer: function (w, node) {
                return w + node.getWidth('delta');
            }
        },
        height: {
            desired: function () {
                return undefined;
            },
            required: function () {
                return undefined;
            },
            balanced: function () {
                return undefined;
            },
            final: function () {
                return undefined;
            },
            factor: function () {
                return undefined;
            },
            delta: function (node) {
                return node.$el.outerHeight(true) - node.$el.height();
            },
            inner: function (h, node) {
                return h - node.getHeight('delta');
            },
            outer: function (h, node) {
                return h + node.getHeight('delta');
            }
        },
        position: {
            left: function () {
                return undefined;
            },
            left_percent: function () {
                return undefined;
            }
        },
        positioning: function () {
            return undefined;
        }
    };

    
    /**
     * the calculators
     */
    var row = calculators.row = $.extend(true, {}, templates.calculator);
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
            f = node.getHeight('factor'),
        //the desired height of the row is the desired height of the parent col/table
        //multiplied by the derived/configured factor
            h = p.getHeight('desired', 'inner') * f;
        return node.getHeight(h, 'inner');
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
    row.height.final = function (node) {
        var p = node.parent,
        //get factor from element configuration
            conf = node.getConfig(),
            f = node.getHeight('factor'),
        //get the balanced inner height of the nodes parent col/table
        //multiplied by factor
            b = p.getHeight('balanced', 'inner') * f,
        //get the required height
            r = node.getHeight('required', 'outer');
        //return the balanced height or the required height if larger
        return (r > b) ? r : b;
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
     *
     * @param {Node} node
     * @returns {string}
     */
    row.positioning = function (node) {
        return 'relative';
    };
    /**
     * Leaf column
     */
    var col = calculators.col = $.extend(true, {}, templates.calculator);
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
        var r = (node.$el.is(':empty')) ? 0 : measure(node);
        return node.getHeight(r, 'outer');
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
     *
     * @param {Node} node
     * @returns {number}
     */
    col.positioning = function (node) {
        return 'absolute';
    };


    /**
     * Calculator for cropped columns.
     * A cropped column is one which's height is not affected by
     * it's content.
     * Accordingly the required height always equals the desired height
     */
    var cropped = calculators.cropped = $.extend(true, {}, col);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    cropped.height.required = function (node) {
        return node.getHeight('desired');
    };


    /**
     * Calculator for compound cells, a rather complicated thing
     */
    var compound = calculators.compound = $.extend(true, {}, col);

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
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    compound.height.balanced = function (node) {
        var c, h, rxs, lxs, i, xs, r, rm, b, rf, f, n;
        //get the compound columns children rows
        c = displayed(node.childs);
        // if there's only a single child row, that's really it
        if (c.length === 1)
            return node.getHeight('final');
        //if any of the children row's required height exceeds it's desired height,
        //we call it 'excessive'.
        //'rxs' will collect the excessive rows
        //sorted in descending order by the amount of the excess
        rxs = [];
        //'lxs' will track the largest excess for sorting
        lxs = 0;
        // loop thru the children rows
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
        //'rm' for remainder
        rm = node.getHeight('final');
        //'b' as the resulting balanced height
        b = rm;
        //'rf' as the remaining factor
        rf = 1;
        //now loop thru the ordered excessive rows collected above
        for (i = 0; i < rxs.length; i++) {
            r = rxs[i];
            //substract the current excessive row's required height from the remainder
            rm = rm - r.getHeight('required');
            //get factor
            f = r.getHeight('factor');
            //substract the current excessive row's height factor from the remaining factor
            rf = rf - f;
            //now we 'normalize' the remainder by multiplying it with the remaining factor
            n = rm * (1 / rf);
            if (r.getHeight('required') <= n * f) {
                return b;
            }
            b = n;
        }
        return b;
    };

    /**
     *
     * @param {Node} node
     * @returns {string}
     */
    compound.positioning = function (node) {
        return 'absolute';
    };

    /**
     * Calculator for the toplevel container
     */
    var table = calculators.table = $.extend(true, {}, compound);

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
            r, s, l = node.layouter && node.layouter.layout;
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
     *
     * @param {Node} node
     * @returns {string}
     */
    table.positioning = function (node) {
        return 'static';
    };

    /**
     * Calculator for breaking columns
     */
    var breaking = calculators.breaking = $.extend(true, {}, templates.calculator);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.height.required = function (node) {
        //the columns required height equals
        // it's content's height
        var r = (node.$el.is(':empty')) ? 0 : measure(node);
        return node.getHeight(r, 'outer');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.height.desired = function (node) {
        var r = node.getRoot(), conf = r.getConfig(),
            l = node.layouter && node.layouter.layout,
            c = (l && conf && conf.layouts && conf.layouts.hasOwnProperty(l.name)) ||
                l;
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
    breaking.height.final = function (node) {
        var r = node.getHeight('required'),
            d = node.getHeight('desired');
        //the columns final height should be at most
        //it's required height and at least
        //it's desired height
        return (r > d) ? r : d;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breaking.height.factor = function (node) {
        var conf, f, l = node.layouter && node.layouter.layout;
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
     * @returns {string}
     */
    breaking.positioning = function (node) {
        return 'static';
    };

    /**
     * Calculator for breaking columns
     */
    var breakingCropped = calculators.breakingCropped = $.extend(true, {}, breaking);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    breakingCropped.height.final = function (node) {
        return node.getHeight('desired');
    };

    /**
     * Calculator for breaking columns
     */
    var auto = calculators.auto = $.extend(true, {}, templates.calculator);

    templates.type = {
        map: function (node) {
            return false
        },
        calculator: function (node) {
            var calculators = node.get('calculators'),
                br = node.layouter.layout && node.layouter.layout.breakColumns,
                t = node.getType();
            if (br) t = 'auto';
            return calculators[t];
        }
    };

    types.table = $.extend(true, {}, templates.type);
    types.table.map = function (node) {
        return (node.$el.hasClass('layouter-table'));
    };
    types.row = $.extend(true, {}, templates.type);
    ;
    types.row.map = function (node) {
        return (node.$el.hasClass('layouter-row'));
    };
    types.compound = $.extend(true, {}, templates.type);
    ;
    types.compound.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.find('.layouter-row').length);
    };
    types.cropped = {};
    types.cropped.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-cropped'));
    };
    types.cropped.calculator = function (node) {
        var calculators = node.get('calculators'),
            br = node.layouter.layout && node.layouter.layout.breakColumns,
            t = node.getType();
        if (br) t = 'breakingCropped';
        return calculators[t];
    };
    types.col = {};
    types.col.map = function (node) {
        return (node.$el.hasClass('layouter-col'));
    };
    types.col.calculator = function (node) {
        var calculators = node.get('calculators'),
            br = node.layouter.layout && node.layouter.layout.breakColumns,
            t = node.getType();
        if (br) t = 'breaking';
        return calculators[t];
    };
    

    /**
     * Return all nodes that have display
     * @param {Array.<Node>} nodes
     * @returns {Array}
     */
    var displayed = helpers.displayed = function (nodes) {
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
    var measure = helpers.measure = function (node) {
        var $clone = node.$el.clone(), r, p, w;
        $clone.css({
            visibility: 'hidden',
            position: node.getPositioning() || 'static',
            width: node.getWidth('final', 'inner') || 'auto',
            height: 'auto'
        });
        p = node.parent ? node.parent.$el : document.body;
        $clone.appendTo(p);
        r = $clone.height();
        $clone.remove();
        return r;
    };


    /**
     * Gets default layouter options.
     * @returns {Layouter~layouterOptions}
     */
    Layouter.prototype.getDefaults = function (q) {
        return (q === 'layouter' && defaults.layouter) ||
            (q === 'rendering' && {renderer: defaults.renderer});
    };
    /**
     * Override this function to reset nodes
     * before rendering
     * @todo: do we need this here?
     */
    Layouter.prototype.before = function () {
        this.node.reset(false, true);
    };

    /**
     * Get the nodes type
     * @method Node#getType
     * @returns {string}
     */
    Node.prototype.getType = function () {
        var type, types = this.get('types');
        if (this.type !== undefined)
            return this.type;
        for (type in types) {
            if (types.hasOwnProperty(type) && types[type].map(this)) {
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
        var types = this.get('types');
        return types[this.getType()].calculator(this);
    };
    /**
     * Get or calculate the width of a node
     * using various qualifiers
     * @method Node#getWidth
     * @param {string | number} q1 Qualifier (final|percent) or number
     * @param {string} [q2] Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getWidth = function (q1, q2) {
        var l = this.layout;
        if (l.width === undefined)
            l.width = {};
        if (q2 === undefined && l.width[q1])
            return l.width[q1];
        var calc = this.getCalculator(), n;
        if (typeof q1 === 'string' && l.width[q1] === undefined) {
            l.width[q1] = calc.width[q1](this);
        }
        n = (typeof q1 !== 'string') ? q1 : l.width[q1];
        return (q2 && calc.width[q2](n, this)) || n;
    };
    /**
     * Get or calculate the height of a node
     * using various qualifiers
     * @method Node#getHeight
     * @param {string | number} q1 Qualifier (desired|required|final|balanced) or number
     * @param {string} [q2] Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getHeight = function (q1, q2) {
        var l = this.layout;
        if (l.height === undefined)
            l.height = {};
        if (q2 === undefined && l.height[q1])
            return l.height[q1];
        var calc = this.getCalculator(), n;
        if (typeof q1 === 'string' && l.height[q1] === undefined) {
            l.height[q1] = calc.height[q1](this);
        }
        n = (typeof q1 !== 'string') ? q1 : l.height[q1];
        return (q2 && calc.height[q2](n, this)) || n;
    };
    /**
     * Get or calculate the width of a node
     * using various qualifiers
     * @method Node#getWidth
     * @param {string | number} q1 Qualifier (final|percent) or number
     * @param {string} [q2] Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getPosition = function (q1) {
        var l = this.layout;
        if (l.position === undefined)
            l.position = {};
        if (l.position[q1])
            return l.position[q1];
        var calc = this.getCalculator();
        l.position[q1] = calc.position[q1](this);
        return l.position[q1];
    };
    /**
     * Get or calculate the width of a node
     * using various qualifiers
     * @method Node#getWidth
     * @param {string | number} q1 Qualifier (final|percent) or number
     * @param {string} [q2] Optional qualifier (outer|inner)
     * @returns {*}
     */
    Node.prototype.getPositioning = function () {
        var l = this.layout;
        if (l.positioning)
            return l.positioning;
        var calc = this.getCalculator();
        l.positioning = calc.positioning(this);
        return l.positioning;
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
            $a = ascendants(this, $());
        //check if neither the node nor any of it's ascendants has display:none
        return this.$el.css('display') !== 'none' && $a.css('display') !== 'none';
    };

    /**
     * @var {parser} parser
     */
    var parser = defaults.layouter.parser = {};
    /**
     * @param {jQuery} $el
     * @returns {jQuery|null}
     */
    parser.parse = function ($el) {
        var $c = $(), $d = $el.find('.layouter-row, .layouter-col'), p;
        $d.each(function (i, el) {
            p = $(el).parent().closest('.layouter-table, .layouter-row, .layouter-col');
            if (p.get(0) === $el.get(0))
                $c = $c.add(el);
        });
        return $c || null;
    };

    /**
     *
     * @param node
     * @param h
     * @param a
     * @returns {*}
     */

    var align = function (node, h, a) {
        var r, $el, $ct, s, t, an;
        $ct = (node.$el.contents());
        $el = ($ct.is('div')) ? $ct : $('div').append($ct).appendTo(node.$el);
        r = node.getHeight('required', 'inner');
        s = h - r;
        t = (s > 0) ? s / 2 : 0;
        if (a) {
            an = function ($el, t) {
                return $el.css('position', 'relative').animate({'top': t}).promise();
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
     * @param p
     * @returns {{resolved: boolean}}
     */
    var apply = function ($el, w, h, l, p) {
        $el.width(w);
        $el.height(h);
        $el.css('position', p);
        $el.css('left', l);
        return {resolved: true};
    };

    /**
     * @var {renderer} renderer
     */
    var renderer = defaults.renderer = {};

    /**
     * Rendering
     * @param {Node} node
     * @param {renderingOptions} options
     */
    renderer.render = function (node, options) {
        var $el = node.$el, a, w, h, l, i, c, p;
        w = node.getWidth('final', 'inner') || 'auto';
        h = node.getHeight('final', 'inner') || 'auto';
        l = node.getPosition('left') || 'auto';
        p = node.getPositioning() || 'static';
        a = typeof w === 'number' && typeof h === 'number' &&
        typeof l === 'number' &&
        options.layout.animate;
        if (a) {
            a($el, w, h, l, p);
        }
        else {
            apply($el, w, h, l, p);
        }
        if (node.$el.hasClass('layouter-align')) {
            align(node, h, a);
        }
        for (i = 0; i < node.childs.length; i++) {
            c = node.childs[i];
            renderer.render(c, options);
        }
    };

    return exports;
}));
