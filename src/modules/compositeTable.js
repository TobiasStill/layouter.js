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
 * Created by Tobias Still on 30.10.2014.
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
    /**
     * @module layouter/compositeTable
     * @version 0.0.0
     */
    var exports = layouter,
        $ = layouter.$,
        Layouter = layouter.Layouter,
        Node = layouter.Node,
        helpers = layouter.helpers,
        defaults = layouter.defaults,
        mixins,
        rendering,
        calculators,
        types,
        parser;
    /**
     * Calculator callbacks take Nodes as arguments
     * and return numerical layout properties
     * @callback calculatorCallback
     * @param {Node}
     * @return {number}
     */
    /**
     * Two-place calculater callbacks take Nodes and
     * numerical properties as arguments
     * @callback twoPlaceCalculatorCallback
     * @param {number} x
     * @param {Node} node
     * @return {number}
     */
    /**
     * @typedef {Object} lcWidth
     * @property {calculatorCallback} final Calculates the final width of the node.
     * The final width represents the outer width that the nodes element will assume
     * when rendering the layout.
     * @property {calculatorCallback} percent Calculates the final width of the node
     * in percent.
     * @property {calculatorCallback} factor Returns the proportional width factor
     * of the nodes element, relative to the inner width of the parent nodes element
     * (e.g.: 'half the width of the parent element' => factor = 0.5).
     * @property {calculatorCallback} delta Returns the difference of the outer and inner
     * widths of the nodes element.
     * @property {twoPlaceCalculatorCallback} inner Substracts the outer margins and paddings
     * of the nodes element from a given numerical value
     * @property {twoPlaceCalculatorCallback} outer Increases a given numerical value by the
     * the outer margins and paddings
     * of the nodes element.
     *
     */
    /**
     * @typedef {Object} lcHeight
     * @property {calculatorCallback} desired
     * @property {calculatorCallback} required
     * @property {calculatorCallback} balanced
     * @property {calculatorCallback} final
     * @property {calculatorCallback} factor
     * @property {calculatorCallback} delta
     * @property {calculatorCallback} inner
     * @property {calculatorCallback} outer
     */

    /**
     * @typedef {Object} lcPosition
     * @property {calculatorCallback} left
     * @property {calculatorCallback} left_percent
     * */

    /**
     * @typedef {Object} layoutCalculator
     * @property {lcWidth} width
     * @property {lcHeight} height
     * @property {lcPosition} position
     * @property {Function} positioning
     */

    /**
     * @typedef {Object} nodeType
     * @property {Function} map
     * @property {Function} calculator
     */

    /**
     * Enhanced Layouter settings
     * @typedef {object} compositeTableLayouterSettings
     * @property {parser} parser
     * @property {String} selector
     * @property {renderingOptions} rendering
     * @property {Function} onCreate
     * @property {Object<nodeType>} types
     * @property {Object<layoutCalculator>} calculators
     */

    /**
     * Mixins and skeletons
     * @type {{}}
     */
    exports.mixins = mixins = {};
    /**
     * Default rendering options
     * @type {renderingOptions}
     */
    defaults.rendering = rendering = {};
    /**
     * Default layout calculators
     * @type {Object<layoutCalculator>}
     */
    defaults.calculators = calculators = {};
    /**
     * Default node types
     * @type {Object<nodeType>}
     */
    defaults.types = types = {};
    /**
     * Default node parser
     * @type {nodeParser}
     */
    defaults.parser = parser = {};


    /**
     * define the calculators
     * for calculating the dimensions of a node in our layout
     */

    /**
     * Calculator skeleton object. More a skeleton than a mixin
     * @type {layoutCalculator}
     * */
    mixins.calculator = {
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
    calculators.row = $.extend(true, {}, mixins.calculator);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.width.final = function (node) {
        var p = node.parent;
        return p.getWidth('final', 'inner');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.width.percent = function (node) {
        return 100;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.height.desired = function (node) {
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
    calculators.row.height.required = function (node) {
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
    calculators.row.height.final = function (node) {
        var p = node.parent,
        //get factor from element configuration
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
    calculators.row.height.factor = function (node) {
        //get factor from element configuration
        var l = node.layouter.get('rendering.layout.name');
        return (l && node.get('layouts.' + l + '.height')) ||
                // OR derived from the number sibling rows
            1 / helpers.displayed(node.parent.childs).length ||
                //OR 1
            1;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.position.left = function (node) {
        return 0;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.position.left_percent = function (node) {
        return 0;
    };

    /**
     *
     * @param {Node} node
     * @returns {string}
     */
    calculators.row.positioning = function (node) {
        return 'relative';
    };
    /**
     * Leaf column
     */
    calculators.col = $.extend(true, {}, mixins.calculator);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.col.width.final = function (node) {
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
    calculators.col.width.percent = function (node) {
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
    calculators.col.width.factor = function (node) {
        var conf, f, l = node.layouter.get('rendering.layout.name');
        //get factor from element configuration
        f = (l && node.get('layouts.' + l + '.width')) ||
            // OR derived from the number sibling rows
        1 / helpers.displayed(node.parent.childs).length ||
            //OR 1
        1;
        return f;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.col.height.desired = function (node) {
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
    calculators.col.height.required = function (node) {
        //the columns required height equals
        // it's content's height
        var r = (node.$el.is(':empty')) ? 0 : helpers.measure(node);
        return node.getHeight(r, 'outer');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.col.height.final = function (node) {
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
    calculators.col.position.left = function (node) {
        var s, l, i;
        //get the columns displayed siblings
        s = helpers.displayed(node.parent.childs);
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
    calculators.col.position.left_percent = function (node) {
        var s, l, i;
        //get the columns displayed siblings
        s = helpers.displayed(node.parent.childs);
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
    calculators.col.positioning = function (node) {
        return 'absolute';
    };


    /**
     * Calculator for cropped columns.
     * A cropped column is one which's height is not affected by
     * it's content.
     * Accordingly the required height always equals the desired height
     */
    calculators.cropped = $.extend(true, {}, calculators.col);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.cropped.height.required = function (node) {
        return node.getHeight('desired');
    };


    /**
     * Calculator for compound cells, a rather complicated thing
     */
    calculators.compound = $.extend(true, {}, calculators.col);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.compound.height.required = function (node) {
        var c, r, i, cr, cd;
        //get the columns displayed siblings
        c = helpers.displayed(node.childs);
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
    calculators.compound.height.balanced = function (node) {
        var c, h, rxs, lxs, i, xs, r, rm, b, rf, f, n;
        //get the compound columns children rows
        c = helpers.displayed(node.childs);
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
    calculators.compound.positioning = function (node) {
        return 'absolute';
    };

    /**
     * Calculator for the toplevel container
     */
    calculators.table = $.extend(true, {}, calculators.compound);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.table.width.final = function (node) {
        var l = node.layouter.get('rendering.layout'),
            w = l && l.width || node.$el.width();
        return node.getWidth(w, 'outer');
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.table.height.desired = function (node) {
        //get dimensions of parent node
        var r, s, l = node.layouter.get('rendering.layout'),
            c = (l) ? node.get('layouts.' + l.name) : false;
        if (c && c.height) return node.getHeight(c.height, 'outer');
        if (l && l.height) return node.getHeight(l.height, 'outer');
        r = (c && c.rowHeight) || (l && l.rowHeight);
        s = helpers.displayed(node.childs).length;
        return node.getHeight(r * s, 'outer');
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.table.height.final = function (node) {
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
    calculators.table.height.inner = function (h, node) {
        return h;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.table.position.left = function (node) {
        return 0;
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.table.position.left_percent = function (node) {
        return 0;
    };

    /**
     *
     * @param {Node} node
     * @returns {string}
     */
    calculators.table.positioning = function (node) {
        return 'static';
    };

    /**
     * Calculator for breaking columns
     */
    calculators.breaking = $.extend(true, {}, mixins.calculator);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.breaking.height.required = function (node) {
        //the columns required height equals
        // it's content's height
        var r = (node.$el.is(':empty')) ? 0 : helpers.measure(node);
        return node.getHeight(r, 'outer');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.breaking.height.desired = function (node) {
        var r = node.getRoot(),
            l = node.layouter.get('rendering.layout'),
            c = (l && node.get('layouts.' + l.name)) || l;
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
    calculators.breaking.height.final = function (node) {
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
    calculators.breaking.height.factor = function (node) {
        var conf, f, l = node.layouter.get('rendering.layout.name');
        //get factor from element configuration
        f = (l && node.get('layouts.' + l + '.height')) ||
            //OR 1
        1;
        return f;
    };
    /**
     *
     * @param {Node} node
     * @returns {string}
     */
    calculators.breaking.positioning = function (node) {
        return 'static';
    };

    /**
     * Calculator for breaking columns
     */
    calculators.breakingCropped = $.extend(true, {}, calculators.breaking);

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.breakingCropped.height.final = function (node) {
        return node.getHeight('desired');
    };

    /**
     * Calculator for breaking columns
     */
    calculators.auto = $.extend(true, {}, mixins.calculator);


    /**
     *
     * @type {nodeType}
     */
    mixins.type = {
        map: function (node) {
            return false;
        },
        calculator: function (node) {
            var calculators = node.layouter.get('calculators'),
                br = node.layouter.get('rendering.layout.breakColumns'),
                t = node.getType();
            if (br) t = 'auto';
            return calculators[t];
        }
    };

    types.table = $.extend(true, {}, mixins.type);
    types.table.map = function (node) {
        return (node.$el.hasClass('layouter-table'));
    };
    types.row = $.extend(true, {}, mixins.type);
    types.row.map = function (node) {
        return (node.$el.hasClass('layouter-row'));
    };
    types.compound = $.extend(true, {}, mixins.type);
    types.compound.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.find('.layouter-row').length);
    };
    types.cropped = {};
    types.cropped.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-cropped'));
    };
    types.cropped.calculator = function (node) {
        var calculators = node.layouter.get('calculators'),
            br = node.layouter.get('rendering.layout.breakColumns'),
            t = node.getType();
        if (br) t = 'breakingCropped';
        return calculators[t];
    };
    types.col = {};
    types.col.map = function (node) {
        return (node.$el.hasClass('layouter-col'));
    };
    types.col.calculator = function (node) {
        var calculators = node.layouter.get('calculators'),
            br = node.layouter.get('rendering.layout.breakColumns'),
            t = node.getType();
        if (br) t = 'breaking';
        return calculators[t];
    };


    /**
     * Return all nodes that have display
     * @param {Array.<Node>} nodes
     * @returns {Array}
     */
    helpers.displayed = function (nodes) {
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
    helpers.measure = function (node) {
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
        var type, types = this.layouter.get('types');
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
     * Get the nodes layout calculator
     * @method Node#getCalculator
     * @returns {layoutCalculator}
     */
    Node.prototype.getCalculator = function () {
        var types = this.layouter.get('types');
        return types[this.getType()].calculator(this);
    };
    /**
     * Get the nodes width in various qualities.
     * @method Node#getWidth
     * @param {string| number} q1 Possible values: "final", "percent".
     * @param {string} [q2] Possible values: "outer", "inner".
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
     * Get the nodes height in various qualities.
     * @method Node#getHeight
     * @param {string | number} q1 Possible values: "desired", "required", "final", "balanced" OR number.
     * @param {string} [q2] Possible values: "outer", "inner".
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
     * Get the nodes position
     * @method Node#getPosition
     * @param {string} q Possible values: "left", "left_percent".
     * @returns {*}
     */
    Node.prototype.getPosition = function (q) {
        var l = this.layout;
        if (l.position === undefined)
            l.position = {};
        if (l.position[q])
            return l.position[q];
        var calc = this.getCalculator();
        l.position[q] = calc.position[q](this);
        return l.position[q];
    };
    /**
     * Get the nodes CSS positioning method
     * @method Node#getPositioning
     * @returns {string} Possible values: "absolute", "relative", "static".
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
     * @returns {boolean}
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
     *
     * @param {jQuery} $el
     * @returns {jQuery|null}
     */
    parser.parse = function ($el) {
        var $c = $(),
        //match cols and rows dom elements
            $d = $el.find('.layouter-row, .layouter-col'), p;
        //for each matched col or row
        $d.each(function (i, el) {
            //find parent
            p = $(el).parent().closest('.layouter-table, .layouter-row, .layouter-col');
            //if current element is direct descendant (not in DOM terms but in Layouter/Node terms)
            //add it to the collection
            if (p.get(0) === $el.get(0))
                $c = $c.add(el);
        });
        //return collection if not empty
        return ($c.length && $c) || null;
    };

    /**
     *
     * @param node
     * @param h
     * @param a
     * @returns {*}
     */

    rendering.align = function (node, h, a) {
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
    rendering.apply = function ($el, w, h, l, p) {
        $el.width(w);
        $el.height(h);
        $el.css('position', p);
        $el.css('left', l);
        return {resolved: true};
    };


    /**
     * Rendering
     * @param {Node} node
     * @param {renderingOptions} options
     */
    rendering.render = function (node, options) {
        var $el = node.$el, an, a, w, h, l, i, c, p;
        //get layout properties
        w = node.getWidth('final', 'inner') || 'auto';
        h = node.getHeight('final', 'inner') || 'auto';
        l = node.getPosition('left') || 0;
        p = node.getPositioning() || 'static';
        //animate layout? (only possible with numeric values for width and height)
        an = typeof w === 'number' && typeof h ===  'number' &&
        helpers.deepGet(options, 'layout.animate');
        a = (an)? an : rendering.apply;
        //apply layout
        a($el, w, h, l, p);
        //vertical alignment
        if (node.$el.hasClass('layouter-align')) {
            rendering.align(node, h, an);
        }
        //render childs
        for (i = 0; i < node.childs.length; i++) {
            c = node.childs[i];
            rendering.render(c, options);
        }
    };


    return exports;
}));
