(function(nSatohOthello, doc) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';


  /**
   * @param {string} elementName
   * @param {Object} attributes
   * @returns {SVGElement}
   * @private
   */
  function _createSVGElement(elementName, attributes) {
    var element = doc.createElementNS(NS, elementName);
    Object.keys(attributes).forEach(function(name) {
      element.setAttribute(name, attributes[name]);
    });
    return element;
  }


  /**
   * @param {Object} attributes
   * @returns {SVGSVGElement}
   */
  function createSVG(attributes) {
    return _createSVGElement('svg', attributes);
  }


  /**
   * @param {Object} attributes
   * @returns {SVGRectElement}
   */
  function createRect(attributes) {
    return _createSVGElement('rect', attributes);
  }


  /**
   * @param {Object} attributes
   * @returns {SVGLineElement}
   */
  function createLine(attributes) {
    return _createSVGElement('line', attributes);
  }


  /**
   * @param {Object} attributes
   * @returns {SVGCircleElement}
   */
  function createCircle(attributes) {
    return _createSVGElement('circle', attributes);
  }


  /**
   * @param {Object} attributes
   * @returns {SVGPathElement}
   */
  function createPath(attributes) {
    return _createSVGElement('path', attributes);
  }


  /**
   * @param {Object} attributes
   * @returns {SVGTextElement}
   */
  function createText(attributes) {
    return _createSVGElement('text', attributes);
  }


  /**
   * @param {Object} attributes
   * @returns {SVGGElement}
   */
  function createG(attributes) {
    return _createSVGElement('g', attributes);
  }


  /**
   * @param {number} x
   * @param {number} y
   * @returns {string}
   */
  function absM(x, y) {
    return 'M' + [x, y].join(',');
  }


  /**
   * @param {number} dx
   * @returns {string}
   */
  function relH(dx) {
    return 'h' + dx;
  }


  /**
   * @param {number} rx
   * @param {number} ry
   * @param {number} ex
   * @param {number} ey
   * @param {Object} [options]
   * @param {number} [options.rotate]
   * @param {boolean} [options.large_arc]
   * @param {boolean} [options.clockwise]
   * @returns {string}
   */
  function relA(rx, ry, ex, ey, options) {
    options = options || {};
    var x_axis_rotation = options.rotate || 0;
    var large_arc_flag  = (options.large_arc) ? 1 : 0;
    var sweep_flag      = (options.clockwise) ? 1 : 0;

    var rs = [rx, ry].join(',');
    var flags = [large_arc_flag, sweep_flag].join(',');
    var end_point = [ex, ey].join(',');
    return 'a' + [rs, x_axis_rotation, flags, end_point].join(' ');
  }


  nSatohOthello.svgUtil = {
    createSVG: createSVG,
    createRect: createRect,
    createLine: createLine,
    createCircle: createCircle,
    createPath: createPath,
    createText: createText,
    createG: createG,

    absM: absM,
    relH: relH,
    relA: relA
  };

})(window.nSatohOthello, document);
