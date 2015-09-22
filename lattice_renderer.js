(function(nSatohOthello) {
  'use strict';

  var svg_util = nSatohOthello.svgUtil;

  // 中間生成オブジェクト？（生き残らせた方が良いかもしれない）
  function Cell(vertex) {
    /** @type {number} */
    this.x = undefined;
    /** @type {number} */
    this.y = undefined;
    /** @type {Vertex} */
    this.vertex = vertex;
  }


  /**
   * @param {Cell} cell
   * @param {number} width
   * @param {number} height
   * @returns {SVGRectElement}
   * @private
   */
  function _cell_to_svg(cell, width, height) {
    return svg_util.createRect({
      'class': 'ground',
      x      : cell.x,
      y      : cell.y,
      width  : width,
      height : height
    });
  }


  /**
   * @param {Graph} graph
   * @param {number} cell_width
   * @param {number} cell_height
   * @param {Array.<Array.<number>>} cell_directions
   * @returns {Array.<Cell>}
   * @private
   */
  function _graph_to_cells(graph, cell_width, cell_height, cell_directions) {
    // セル用意
    var cells = {};
    graph.getVertices().forEach(function(v) {
      cells[v.getId()] = new Cell(v);
    });

    // 座標計算
    var visited = {};

    function calculate_coord_of_cells_around(v) {
      if (visited[v.getId()]) {
        return;
      }
      visited[v.getId()] = true;

      var cell = cells[v.getId()];
      cell.x = cell.x || 0;
      cell.y = cell.y || 0;

      v.getEdges().forEach(function(e) {
        var neighbor_v = e.getTerminal();
        var neighbor_cell = cells[neighbor_v.getId()];
        var unit_vec_to_neighbor = cell_directions[e.getDirection()];
        neighbor_cell.x = cell.x + unit_vec_to_neighbor[0] * cell_width;
        neighbor_cell.y = cell.y + unit_vec_to_neighbor[1] * cell_height;

        calculate_coord_of_cells_around(neighbor_v);
      });
    }

    graph.getVertices().forEach(calculate_coord_of_cells_around);

    // 配列に変換
    return Object.keys(cells).map(function(key) {
      return cells[key];
    });
  }


  function draw_board(board_svg, cell_width, cell_height, graph, cell_directions) {
    /*-- sample --
     <g transform="translate(100,100)">
       <rect x="0" y="0" width="100" height="100" fill="lightgreen" stroke="black" stroke-width="5" />
       <rect x="100" y="50" width="100" height="100" fill="lightgreen" stroke="black" stroke-width="5" />
     </g>
    --*/

    var cells = _graph_to_cells(graph, cell_width, cell_height, cell_directions);

    // board 全体を平行移動するためにグループ要素
    var group_of_cells = svg_util.createG({
      id: 'cells'
    });

    //-- 下地 --------------------------------------------
    cells.forEach(function(cell) {
      group_of_cells.appendChild( _cell_to_svg(cell, cell_width, cell_height) );
    });

    board_svg.appendChild(group_of_cells);


    //--- 4箇所のドット ----------------------------------
    /* 石の初期配置とともに，init_dataみたいなものを作って，それをうけ取って描画させよう．
      一旦切る
      for (i = 0; i < 2; i++) {
        for (j = 0; j < 2; j++) {
          group_of_cells.appendChild(svg_util.createCircle({
            'class': 'dot',
            cx: cell_width  * 2 + cell_width  * half_size * i,
            cy: cell_height * 2 + cell_height * half_size * j,
            r: 5
          }));
        }
      }
    */
  }

  nSatohOthello.draw_board = draw_board;

})(window.nSatohOthello);
