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
     * @property {calculatorCallback} proportional Returns the proportional width factor
     * of the nodes element, relative to the inner width of the parent nodes element
     * (e.g.: 'half the width of the parent element' => proportional factor = 0.5).
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
     * @property {calculatorCallback} normalized
     * @property {calculatorCallback} final
     * @property {calculatorCallback} proportional
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
            proportional: function () {
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
            normalized: function () {
                return undefined;
            },
            final: function () {
                return undefined;
            },
            proportional: function () {
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
        //get proportional factor
            f = node.getHeight('proportional'),
        //the desired height of the row is the desired height of the parent col/table
        //multiplied by the derived/configured proportional factor
            h = p.getHeight('desired', 'inner') * f;
        return node.getHeight(h, 'inner');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.height.required = function (node) {
        var c = helpers.displayed(node.childs),
        //to begin with, get the nodes desired height
            d = node.getHeight('desired', 'inner'),
        //and assume optimistically that the node
        // will not require more height than desired
            r = d, i, cr;
        //now we loop thru all childs
        for (i = 0; i < c.length; i++) {
            //get the child columns required height
            cr = c[i].getHeight('required');
            //if the columns required height exceeds
            // the desired inner height of the row based on our
            // expectations so far, increase the required height accordingly
            if (cr > r)
                r = cr;
        }
        //return the result
        return node.getHeight(r, 'outer');
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.height.final = function (node) {
        var p = node.parent,
        //get proportional factor from element configuration
            f = node.getHeight('proportional'),
        //get the normalized inner height of the nodes parent col/table
        //multiplied by proportional factor
            b = p.getHeight('normalized', 'inner') * f,
        //get the required height
            r = node.getHeight('required');
        //return the normalized height or the required height if larger
        return (r > b) ? r : b;
    };
    /**
     * Get the proportional factor (coefficient) of the rows height
     * @param {Node} node
     * @returns {number}
     */
    calculators.row.height.proportional = function (node) {
        var l = node.layouter.get('rendering.layout.name'), p, s, i, j, n, sp,
            getFromConfig = function (nd) {
                var h, p;
                h = l && nd.get('layouts.' + l + '.height');
                if (h > 1) p = nd.parent.getHeight('desired', 'inner') / h;
                if (h && h < 1) p = h;
                return p;
            };
        //get proportional factor from element configuration
        p = getFromConfig(node);
        //if successful, return
        if (p) return p;
        //else get sibling rows
        s = helpers.displayed(node.parent.childs);
        //count siblings
        n = s.length;
        //if tne node represents a singleton row, return 1
        if (n === 1) return 1;
        //if no layout settings are present, determine the proportional factor
        //from the number of siblings
        if (!l) return 1 / n;
        //else, loop through all siblings
        //and calculate the proportional factor with regard to the other siblings
        //configuration
        sp = j = 0;
        for (i = 0; i < s.length; i++) {
            p = getFromConfig(s[i]);
            if (!p) continue;
            sp = sp + p;
            j++;
        }
        return (1 - sp) / (n - j);
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
        //get proportional factor
            f = node.getWidth('proportional');
        //the columns final width is the rows inner width multiplied by proportional factor
        return w * f;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.col.width.percent = function (node) {
        var p = 100,
        //get proportional factor
            f = node.getWidth('proportional');
        //the columns width in percent equals 100 * proportional factor
        return p * f;
    };
    /**
     * Get the proportional factor (coefficient) of the columns width
     * @param {Node} node
     * @returns {number}
     */
    calculators.col.width.proportional = function (node) {
        var l = node.layouter.get('rendering.layout.name'), p, s, i, j, n, sp,
            getFromConfig = function (nd) {
                var w, p;
                w = l && nd.get('layouts.' + l + '.width');
                if (w > 1) p = nd.parent.getWidth('final', 'inner') / w;
                if (w && w < 1) p = w;
                return p;
            };
        //get proportional factor from element configuration
        p = getFromConfig(node);
        //if successful, return
        if (p) return p;
        //else get sibling cols
        s = helpers.displayed(node.parent.childs);
        //count siblings
        n = s.length;
        //if tne node represents a singleton col, return 1
        if (n === 1) return 1;
        //if no layout settings are present, determine the proportional factor
        //from the number of siblings
        if (!l) return 1 / n;
        //else, loop through all siblings
        //and calculate the proportional factor with regard to the other siblings
        //configuration
        sp = j = 0;
        for (i = 0; i < s.length; i++) {
            p = getFromConfig(s[i]);
            if (!p) continue;
            sp = sp + p;
            j++;
        }
        return (1 - sp) / (n - j);
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
        var c, r, i, x;
        //get all displayed child rows
        c = helpers.displayed(node.childs);
        //get the compounds desired inner height
        r = node.getHeight('desired', 'inner');
        //loop through child rows
        for (i = 0; i < c.length; i++) {
            x = c[i].getHeight('required') - c[i].getHeight('desired');
            //if the row's required height exceeds it's desired height
            //increase the required height of the compound accordingly
            r = (x) ? r + x : r;
        }
        //return the outer required height
        return node.getHeight(r, 'outer');
    };
    /**
     * Calculate the compounds 'normalized' height.
     * The normalized height represents the would-be height of the compound
     * without any rows requiring more height than calculated based on proportionality.
     * Since the compounds final height can be larger than it's required height (based on the height
     * of it's siblings) we cannot calculate
     * the normalized height simply by subtracting it's extra requirements from the desired height nor the final height
     * (since we cannot know what these extras will finally be without knowing the normalized height first).
     *
     * @param {Node} node
     * @returns {number}
     */

    calculators.compound.height.normalized = function (node) {
        var c, i, rq, rm, n, rf, f, cmp;
        //get all child rows
        c = helpers.displayed(node.childs);
        // if there's only one, simply return it's height
        if (c.length === 1)
            return node.getHeight('final');
        //sort childs by the difference of their required and desired heights
        //in descending order
        cmp = function (c1, c2) {
            var x1, x2;
            x1 = c1.getHeight('required') - c1.getHeight('desired');
            x2 = c2.getHeight('required') - c2.getHeight('desired');
            return x2 - x1;
        };
        c.sort(cmp);
        //initialize some variables
        //rm = node.getHeight('final', 'inner');
        rm = node.getHeight('final');
        n = rm;
        rf = 1;
        //now loop through the ordered child rows
        for (i = 0; i < c.length; i++) {
            //get the current rows height proportional factor
            f = c[i].getHeight('proportional');
            //get the current rows required outer height
            rq = c[i].getHeight('required');
            //if the current row's required height does not exceed
            //it's normalized height (based on the calculations so far), we're done.
            if (rq <= n * f) {
                break;
            }
            //calculate the remaining height of the compound
            //after subtracting the rows required height
            rm = rm - rq;
            //calculate the remaining height proportional factor
            rf = rf - f;
            //the normalized height is the result of multiplying the
            //remaining height by the inverse of the remaining proportional factor.
            n = rm * (1 / rf);
        }
        //return the normalized  height
        return n;
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
        var r, h,
            l = node.layouter.get('rendering.layout.name');
        //if the desired height of the table is specified
        //in the layout settings or the nodes configuration
        h = node.get('layouts.' + l + 'height') ||
        node.layouter.get('rendering.layout.height');
        //return the corresponding outer height
        if (h) return node.getHeight(h, 'outer');
        //if not, get the default row height,
        h = node.get('layouts.' + l + 'rowHeight') ||
        node.layouter.get('rendering.layout.rowHeight');
        //multiply it by the number of rows
        r = helpers.displayed(node.childs);
        h = h * r.length;
        //and return it's 'outer height' value
        return node.getHeight(h, 'outer');
    };

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.table.height.final = function (node) {
        var r, d;
        //get the desired and required heights
        d = node.getHeight('desired');
        r = node.getHeight('required');
        //return the larger one
        return (r > d) ? r : d;


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

    mixins.breaking = {height: {}, width: {}}

    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    mixins.breaking.width.percent = function (node) {
        return 100;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    mixins.breaking.height.desired = function (node) {
        var f = node.getHeight('proportional'),
            h = node.layouter.get('rowHeight');
        if (h)
            return h * f;
    };

    /**
     * Get the proportional factor (coefficient) of the columns height
     * @param {Node} node
     * @returns {number}
     */
    mixins.breaking.height.proportional = function (node) {
        var f, l = node.layouter.get('rendering.layout.name');
        //get proportional factor from element configuration
        f = (l && node.get('layouts.' + l + '.height')) ||
            //OR 1
        1;
        return f;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    mixins.breaking.height.final = function (node) {
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
     * @returns {string}
     */
    mixins.breaking.positioning = function (node) {
        return 'relative';
    };
    /**
     * Calculator for breaking columns
     */
    calculators.breakingCol = $.extend(true, {}, mixins.calculator, mixins.breaking);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.breakingCol.width.final = function (node) {
        //return null;
    };
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.breakingCol.height.required = function (node) {
        //the columns required height equals
        // it's content's height
        var r = (node.$el.is(':empty')) ? 0 : helpers.measure(node);
        return node.getHeight(r, 'outer');
    };


    /**
     * Calculator for breaking columns
     */
    calculators.breakingCropped = $.extend(true, {}, calculators.breakingCol);

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
        if (br) t = 'breakingCol';
        return calculators[t];
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
     * @param {string | number} q1 Possible values: "desired", "required", "final", "normalized" OR number.
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
        var $el = node.$el, an, a, w, h, l, i, c, p, d = [];
        //get layout properties
        w = node.getWidth('final', 'inner') || 'auto';
        h = node.getHeight('final', 'inner') || 'auto';
        l = node.getPosition('left') || 0;
        p = node.getPositioning() || 'static';
        //if the node is a table, we don't need a fixed height
        //so it is possible to hide and show rows
        if (node.getType() === 'table')
            h = 'auto';
        //animate layout? (only possible with numeric values for width and height)
        an = typeof w === 'number' && typeof h === 'number' &&
        helpers.deepGet(options, 'layout.animate');
        a = (an) ? an : rendering.apply;
        //apply layout and store the returned promise
        //for returning it later
        d.push(a($el, w, h, l, p));
        //do vertical alignment and store the returned promise
        //for returning it later
        if (node.$el.hasClass('layouter-align')) {
            d.push(rendering.align(node, h, an));
        }
        //render childs and store the returned promises
        //for returning them later
        for (i = 0; i < node.childs.length; i++) {
            c = node.childs[i];
            d = d.concat(d, rendering.render(c, options));
        }
        return d;
    };
    return exports;
}));
