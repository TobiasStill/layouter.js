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
 *
 * @module layouter/slideShowTable
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
// AMD. Register as an anonymous module.
        define('layouter/slideShowTable', ['layouter/compositeTable'], factory);
    } else if (typeof exports === 'object') {
// Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
        module.exports = factory(require('compositeTable.js'));
    } else {
// Browser globals (root is window)
        root.returnExports = factory(root.layouter);
    }
}(this, function (layouter) {
    var exports = layouter,
        $ = layouter.$,
        Layouter = layouter.Layouter,
        helpers = layouter.helpers,
        mixins = layouter.mixins,
        displayed = helpers.displayed,
        defaults = layouter.defaults,
        calculators = defaults.calculators,
        SlideShow,
        getSlideShow,
        getSlideShowStops,
        _types = {};


    /**
     *
     * @type {Function}
     */
    getSlideShow = helpers.getSlideShow = function (node) {
        var $r = node.find(function (n) {
            return n.getType() === 'slideShow';
        }, false, true, false);
        return $r && $r.length && $r[0];
    };

    /**
     *
     * @type {Function}
     */
    getSlideShowStops = helpers.getSlideShowStops = function (node) {
        var br = node.layouter.get('rendering.layout.breakColumns'),
            m = (br) ? function (n) {
                return (n.getType() === 'compoundSlideColumn' || n.getType() === 'simpleSlide');
            } : function (n) {
                return (n.getType() === 'compoundSlide' || n.getType() === 'simpleSlide');
            },
            $r = node.find(m);
        return $r;
    };
    /**
     * slide calculator template
     * @type {{position: {left: Function, left_percent: Function}, positioning: Function}}
     */
    mixins.slide = {width: {}, position: {}};
    mixins.slide.width.final = function (node) {
        var ss = getSlideShow(node);
        return ss.getWidth('final', 'inner');
    };
    /**
     *
     * @param node
     * @returns {number}
     */
    mixins.slide.position.left = function (node) {
        var ss = getSlideShow(node),
            s = ss.widget.getStops(),
            w = ss.getWidth('final', 'inner'),
            i, l = 0;
        for (i = 0; i < s.length; i++) {
            if (s[i] === node)
                break;
            l = l + w;
        }
        return l;
    };
    /**
     *
     * @returns {string}
     */
    mixins.slide.positioning = function (node) {
        return 'absolute';
    };
    /**
     * Calculator for slide shows in column-break mode
     */
    calculators.breakingCompound = $.extend(true, {}, calculators.compound, mixins.breaking);
    calculators.breakingSlideShow = $.extend(true, {}, calculators.breakingCompound);
    /**
     *
     * @param {Node} node
     * @returns {number}
     */
    calculators.breakingSlideShow.width.final = function (node) {
        return node.layouter.get('rendering.layout.width');
    };


    /**
     * Calculator for slides container
     */
    calculators.slidesWrapper = $.extend(true, {}, calculators.row);
    calculators.slidesWrapper.width.final = function (node) {
        var ss = getSlideShow(node),
            s = ss.widget.getStops();
        return ss.getWidth('final', 'inner') * s.length;
    };
    /**
     *
     * @param node
     * @returns {number}
     */
    calculators.slidesWrapper.position.left = function (node) {
        return 0;
    };
    /**
     *
     * @returns {string}
     */
    calculators.slidesWrapper.positioning = function (node) {
        return 'absolute';
    };
    /**
     * Calculator for slide
     */
    calculators.simpleSlide = $.extend(true, {}, calculators.col, mixins.slide);

    /**
     * Calculator for compoundSlide
     */
    calculators.compoundSlide = $.extend(true, {}, calculators.compound, mixins.slide);
    /**
     *
     * @param node
     * @returns {number}
     */
    calculators.compoundSlide.position.left = function (node) {
        var br = node.layouter.get('rendering.layout.breakColumns');
        return (br) ? 0 : mixins.slide.position.left(node);
    };
    /**
     *
     * @returns {string}
     */
    calculators.compoundSlide.positioning = function (node) {
        var br = node.layouter.get('rendering.layout.breakColumns');
        return (br) ? 'static' : 'absolute';
    };

    /**
     * Calculator for slideStop
     */
    calculators.slideStop = $.extend(true, {}, calculators.col, mixins.slide);

    //Types

    mixins.generic = {
        calculator: function (node) {
            var calculators = node.layouter.get('calculators'),
                t = node.getType();
            return calculators[t];
        }
    };

    _types.slideShow = $.extend(true, {}, mixins.generic);
    _types.slideShow.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-slideshow'));
    };
    _types.slideShow.calculator = function (node) {
        var calculators = node.layouter.get('calculators'),
            br = node.layouter.get('rendering.layout.breakColumns'),
            c = (br) ? 'breakingSlideShow' : 'compound';
        return calculators[c];
    };
    _types.slidesWrapper = $.extend(true, {}, mixins.generic);
    _types.slidesWrapper.map = function (node) {
        return (node.$el.hasClass('layouter-row') && node.$el.hasClass('layouter-slides'));
    };
    _types.compoundSlide = $.extend(true, {}, mixins.generic);
    _types.compoundSlide.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-slide') &&
        node.$el.find('.layouter-row').length);
    };
    _types.simpleSlide = $.extend(true, {}, mixins.generic);
    _types.simpleSlide.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-slide'));
    };
    _types.compoundSlideColumn = $.extend(true, {}, mixins.generic);
    _types.compoundSlideColumn.map = function (node) {
        return (node.$el.hasClass('layouter-col') && node.$el.hasClass('layouter-compoundSlideColumn') &&
        node.$el.closest('.layouter-slide').length && !node.$el.find('.layouter-row').length);
    };
    _types.compoundSlideColumn.calculator = function (node) {
        var calculators = node.layouter.get('calculators'),
            br = node.layouter.get('rendering.layout.breakColumns'),
            c = (br) ? 'slideStop' : 'col';
        return calculators[c];
    };
    //ordering matters, so we add the new types via $.extend
    defaults.types = $.extend(_types, defaults.types);

    /**
     * @class SlideShow Widget
     * @member {Node} SlideShow#node
     */
    exports.SlideShow = SlideShow = function (node) {
        var self = this,
            controls = function () {
                var c, i, $el = self.$el;
                c = (self.options && self.options.controls) || {$prev: $(".prev", $el), $next: $(".next", $el)};
                c.$$ = $();
                c.$links = $('a.slide-to');
                if (!c.$prev.length)
                    c.$prev = $('<a class="prev" href="#"><span>&lt;</span></a>').appendTo($el);
                if (!c.$next.length)
                    c.$next = $('<a class="next" href="#"><span>&gt;</span></a>').appendTo($el);
                for (i in c) {
                    c.$$ = c.$$.add(c[i]);
                }
                return c;
            };
        this.node = node;
        this.$el = node.$el;
        this.options = node.layouter.get('slideShowOptions') || {};
        this.wrapper = displayed(this.node.childs)[0];
        this.controls = controls();
        this.stop = 0;
        this.getStops = function () {
            if (!this.node.layout.stops) this.node.layout.stops = displayed(getSlideShowStops(this.wrapper));
            return this.node.layout.stops;
        };
        this.initControls();
    };
    /**
     * --
     */
    SlideShow.prototype.initControls = function () {
        var self = this;
        this.controls.$$.off("touchend, click");
        // prev click event
        this.controls.$prev.on("touchend, click", function () {
            self.prev();
            return false;
        });
        // next click event
        this.controls.$next.on("touchend, click", function () {
            self.next();
            return false;
        });
        // slide to event
        this.controls.$links.on("touchend, click",
            function () {
                var m = $(this).attr('href').match(/[0-9]+/), i = 0;
                if (m.length)
                    i = parseInt(m[0]);
                if (i !== false) {
                    self.slideTo(i);
                }
                return false;
            });
    };

    SlideShow.prototype.slide = function (l) {
        var $w = this.wrapper.$el;
        return $w.animate({'left': l}).promise();
    };
    SlideShow.prototype.slideTo = function (i) {
        var l = (i * this.node.getWidth('final', 'inner')) * -1;
        this.stop = i;
        this.slide(l);
    };

    SlideShow.prototype.prev = function () {
        var d,
            self = this,
            n = this.getStops().length,
            i = (this.stop > 0) ? this.stop - 1 : n - 1,
            stop = this.getStops()[i],
            a = this.wrapper.get('url') || stop.get('url'),
            done = function(){
                //have the stops increased?
                d = self.getStops().length - n;
                //set the current stop
                self.stop = self.stop + d;
                //and do it all again
                self.prev();
            };
        //load content via ajax?
        if (a) {
            //load html
            if(this.wrapper.get('url')) this.wrapper.load(done);
            if(stop.get('url')) stop.load(done);
            return;
        }
        this.slideTo(i);
    };
    SlideShow.prototype.next = function () {
        var self = this,
            i = (this.stop < this.getStops().length - 1) ? this.stop + 1 : 0,
            stop = this.getStops()[i],
            a = this.wrapper.get('url') || stop.get('url'),
            done = function(){
                self.slideTo(i);
            };
        //load content via ajax?
        if (a) {
            //load html
            if(this.wrapper.get('url')) this.wrapper.load(done);
            if(stop.get('url')) stop.load(done);
            return;
        }
        this.slideTo(i);
    };

    /**
     * Hook in Widget-Creation
     * @param node
     */
    defaults.onCreate = function (node) {
        if (node.getType() === 'slideShow')
            node.widget = new SlideShow(node);
    };
    return exports;
}));

