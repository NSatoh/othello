(function(nSatohOthello) {
  'use strict';

  var svg_util = nSatohOthello.svgUtil;

  // 中間生成オブジェクト？（生き残らせた方が良いかもしれない）
  function Cell(vertex) {
    this.x = undefined;
    this.y = undefined;
    this.vertex = vertex;
    this.group = undefined;
    this.id = vertex.getId();
  }


  function draw_board(board_svg, cell_width, cell_height, graph_data, cell_directions) {
    var k;

    /*-- sample --
     <g transform="translate(100,100)">
       <rect x="0" y="0" width="100" height="100" fill="lightgreen" stroke="black" stroke-width="5" />
       <rect x="100" y="50" width="100" height="100" fill="lightgreen" stroke="black" stroke-width="5" />
     </g>
    --*/

    // id: CellObject の形で格納する．現状では配列と大差ない．
    var cells = {};

    // グループに属しているcellを，id: [cell, ...]の形で格納する
    var groups = {};

    // 各頂点に対応するセルの座標を決定
    var vertices = graph_data.getVertices();
    var group_id = 0;
    for (var v_num = 0; v_num < vertices.length; v_num++) {
      var v = vertices[v_num];
      var v_id = v.getId();
      var cell = new Cell(v);
      cells[v_id] = cell;

      var edges = v.getEdges();
      var adjoint_groups = [];
      var found_groups = {};
      for (var e_num = 0; e_num < edges.length; e_num++) {
        var terminal_v = edges[e_num].getTerminal();
        var terminal_v_id = terminal_v.getId();
        if (terminal_v_id < v_id) {
          var terminal_v_group = cells[terminal_v_id].group;
          // ここで重複は排除しておきたい．
          if (found_groups[terminal_v_group] === undefined) {
            found_groups[terminal_v_group] = true;
            adjoint_groups.push({
              group     : terminal_v_group,
              terminalId: terminal_v_id,
              direction : edges[e_num].getDirection()
            });
          }
        }
      }

      // グループ番号の若い順にソート
      adjoint_groups.sort(function(x, y) {
        if (x.group < y.group) return -1;
        if (x.group > y.group) return 1;
        return 0;
      });

      if (adjoint_groups.length > 0) {
        // 既存のセルグループに追加
        var parent_group = adjoint_groups[0].group;
        var parent_v_id = adjoint_groups[0].terminalId;
        var to_parent = cell_directions[adjoint_groups[0].direction];

        cell.group = parent_group;
        cell.x = cells[parent_v_id].x - to_parent[0] * cell_width;
        cell.y = cells[parent_v_id].y - to_parent[1] * cell_height;
        groups[cell.group].push(cell);

        // 残りのグループたちをこのセルに結合
        for (k = 1; k < adjoint_groups.length; k++) {
          var child_group = groups[adjoint_groups[k].group];
          var direction_to_bond = cell_directions[adjoint_groups[k].direction];
          var linked_cell_id = [adjoint_groups[k].terminalId];
          var vector_to_linked_cell = [cells[linked_cell_id].x, cells[linked_cell_id].y];
          for (var cell_k = 0; cell_k < child_group.length; cell_k++) {
            var child_cell = child_group[cell_k];
            child_cell.x += cell.x - vector_to_linked_cell[0] + direction_to_bond[0] * cell_width;
            child_cell.y += cell.y - vector_to_linked_cell[1] + direction_to_bond[1] * cell_height;
            child_cell.group = parent_group;
          }

          // 子グループを親グループに統合
          Array.prototype.push.apply(groups[parent_group], groups[child_group]);
          groups[child_group] = null;
        }

      }
      else {
        // 新規セルグループ
        cell.group = group_id;
        group_id++;
        cell.x = 0;
        cell.y = 0;
        groups[cell.group] = [cell];
      }


    }



    // board 全体を平行移動するためにグループ要素
    var group_of_cells = svg_util.createG({
      id: "cells"
    });

    board_svg.appendChild(group_of_cells);

    //-- 下地 --------------------------------------------   
    for (k in cells) {
      group_of_cells.appendChild(svg_util.createRect({
        'class': 'ground',
        x      : cells[k].x,
        y      : cells[k].y,
        width  : cell_width,
        height : cell_height
      }));
    }


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
