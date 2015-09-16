'use strict';

var svg_util = window.nSatohOthello.svgUtil;

var half_size = 4;
var size = half_size * 2;

var cell_width  = 80;
var cell_height = 80;


//-- 各セルの現在の状態記録用 -------------------
var BLACK = 0;
var WHITE = 1;
var EMPTY = -1;

/** @type {number} BLACK or WHITE or EMPTY */
var cell_conditions = [];
for (var i = 0; i < size + 2; i++) {
  cell_conditions[i] = [];
  for (var j = 0; j < size + 2; j++) {
    cell_conditions[i][j] = EMPTY;
  }
}

cell_conditions[half_size][half_size] = BLACK;
cell_conditions[half_size][half_size + 1] = WHITE;
cell_conditions[half_size + 1][half_size] = WHITE;
cell_conditions[half_size + 1][half_size + 1] = BLACK;

//-- AI実装のための準備 --
var players = [];

var HUMAN = 0;
var CPU = 1;
players[WHITE] = HUMAN;
players[BLACK] = HUMAN;

var pass_flag = [0, 0];


//-- セルに配置された石：回転アニメーションのために3パーツに分割 -------------------
var stones = [];
var stone_radius = 30;  // 石の半径
var stone_thickness = 10;  // 石の厚み半分

var BLACK_TURN = BLACK;
var WHITE_TURN = WHITE;

var turn = BLACK_TURN;

var dt = 0.1; // 石の回転アニメーションの間隔ミリ秒
var d_ang = 6; // 石の回転アニメーションの角度ステップ


function set_board(evt) {
  var svgsvg = evt.target;
  draw_board(svgsvg);
  draw_stones(svgsvg);
}


function draw_board(board_svg) {
  var i, j;

  var board_width  = cell_width  * size;
  var board_height = cell_height * size;

  //-- 下地 --------------------------------------------
  board_svg.appendChild(svg_util.createRect({
    'class': 'ground',
    x: 0,
    y: 0,
    width : board_width,
    height: board_height
  }));

  //--- 罫線 -------------------------------------------
  for (i = 1; i <= size - 1; i++) {
    board_svg.appendChild(svg_util.createLine({
      'class': 'rule',
      x1: cell_width * i,
      y1: 0,
      x2: cell_width * i,
      y2: board_height
    }));
  }
  for (i = 1; i <= size - 1; i++) {
    board_svg.appendChild(svg_util.createLine({
      'class': 'rule',
      x1: 0,
      y1: cell_height * i,
      x2: board_width,
      y2: cell_height * i
    }));
  }

  //--- 4箇所のドット ----------------------------------
  for (i = 0; i < 2; i++) {
    for (j = 0; j < 2; j++) {
      board_svg.appendChild(svg_util.createCircle({
        'class': 'dot',
        cx: cell_width  * 2 + cell_width  * half_size * i,
        cy: cell_height * 2 + cell_height * half_size * j,
        r: 5
      }));
    }
  }
}


function draw_stones(board_svg) {
  var i, j;

  //--- 各セルの石：回転アニメーションのために3パーツに分割 ----------------------------------
  var st_l, st_c, st_r, dr, dh, d_left, d_center, d_right;

  for (i = 1; i < size + 1; i++) {
    stones[i] = [];

    for (j = 1; j < size + 1; j++) {
      var cell = svg_util.createSVG({
        'class': 'cell',
        id: to_id(i, j),
        x: cell_width  * (i - 1),
        y: cell_height * (j - 1),
        width : cell_width,
        height: cell_height,
        viewBox: [0, 0, cell_width, cell_height].join(' ')
      });
      cell.onmouseover = on_mouse_over_cell;
      cell.onmouseout  = on_mouse_out_cell;
      cell.onclick = on_click_cell;

      var stone_center_x = cell_width  / 2;
      var stone_center_y = cell_height / 2;

      dr = stone_radius * Math.cos(0);
      dh = stone_thickness * Math.sin(0);

      d_left = [
        svg_util.absM(stone_center_x - dh, stone_center_y - stone_radius),
        svg_util.relH(dh),
        svg_util.relA(dr, stone_radius, 0, 2 * stone_radius),
        svg_util.relH(-dh),
        svg_util.relA(dr, stone_radius, 0, -2 * stone_radius, { clockwise: true })
      ].join(' ');

      d_center = [
        svg_util.absM(stone_center_x, stone_center_y - stone_radius),
        svg_util.relH(dh),
        svg_util.relA(dr, stone_radius, 0, 2 * stone_radius),
        svg_util.relH(-dh),
        svg_util.relA(dr, stone_radius, 0, -2 * stone_radius, { clockwise: true })
      ].join(' ');

      d_right = [
        svg_util.absM(stone_center_x + dh, stone_center_y - stone_radius),
        svg_util.relA(dr, stone_radius, 0,  2 * stone_radius),
        svg_util.relA(dr, stone_radius, 0, -2 * stone_radius)
      ].join(' ');

      st_l = svg_util.createPath({d: d_left,   fill: 'black', 'fill-opacity': 0});
      st_c = svg_util.createPath({d: d_center, fill: 'white', 'fill-opacity': 0});
      st_r = svg_util.createPath({d: d_right,  fill: 'white', 'fill-opacity': 0});

      // mouse反応領域用
      var cell_ground = svg_util.createRect({
        width : cell_width,
        height: cell_height
      });

      cell.appendChild(cell_ground);
      cell.appendChild(st_l);
      cell.appendChild(st_c);
      cell.appendChild(st_r);
      board_svg.appendChild(cell);

      stones[i][j] = {
        left  : st_l,
        center: st_c,
        right : st_r
      };
    }
  }

  for (i = 0; i < cell_conditions.length; i++) {
    for (j = 0; j < cell_conditions[i].length; j++) {
      if (cell_conditions[i][j] === EMPTY) {
        continue;
      }
      var stone = stones[i][j];
      var stone_color = (cell_conditions[i][j] === BLACK) ? 'black' : 'white';

      stone.left.setAttribute('fill-opacity', 1);
      stone.center.setAttribute('fill-opacity', 1);
      stone.right.setAttribute('fill-opacity', 1);
      stone.right.setAttribute('fill', stone_color);
    }
  }
}


function to_id(i, j) {
  return (size + 2) * i + j;
}

function to_pos(id) {
  var j = id % (size + 2);
  var i = (id - j) / (size + 2);
  return { i: i, j: j };
}

function on_mouse_over_cell(evt) {
  var pos = to_pos(evt.currentTarget.id);
  var i = pos.i;
  var j = pos.j;

  if (cell_conditions[i][j] === EMPTY) {
    var stone = stones[i][j];
    var stone_color = (turn === BLACK_TURN) ? 'black' : 'white';
    stone.right.setAttribute('fill', stone_color);
    stone.right.setAttribute('fill-opacity', 0.5);
  }
}

function on_mouse_out_cell(evt) {
  var pos = to_pos(evt.currentTarget.id);
  var i = pos.i;
  var j = pos.j;

  if (cell_conditions[i][j] === EMPTY) {
    var stone = stones[i][j];
    stone.right.setAttribute('fill-opacity', 0);
  }
}

function on_click_cell(evt) {
  var pos = to_pos(evt.currentTarget.id);
  put_stone(pos.i, pos.j);
}

function put_stone(i, j) {
  if (players[turn] !== HUMAN) {
    return;
  }

  if (cell_conditions[i][j] !== EMPTY) {
    return;
  }

  var color1 = (turn === BLACK_TURN) ? 'black' : 'white';
  var color2 = (turn === BLACK_TURN) ? 'white' : 'black';
  var flip_coords = check_stone(i, j, turn);

  if (flip_coords.length > 0) {
    coloring_stone(stones[i][j], color1);

    cell_conditions[i][j] = turn;
    flip_coords.forEach(function(coord) {
      cell_conditions[ coord[0] ][ coord[1] ] = turn;
    });

    flip_stones(flip_coords.map(function(coord) {
      return stones[ coord[0] ][ coord[1] ];
    }), color1, color2);

    turn++;
    turn %= 2;
    set_turn_stone_color(turn);
  }
}


/**
 * @param {number} i
 * @param {number} j
 * @param {number} turn BLACK_TURN or WHITE_TURN
 * @returns {Array.<Array.<number>>} 座標の配列
 */
function check_stone(i, j, turn) {
  var flip_que = [];
  var itself = turn;
  var another = (turn + 1) % 2;
  var cnt, ci, cj, next, ti, tj;
  for (var di = -1; di < 2; di++) {
    for (var dj = -1; dj < 2; dj++) {
      ci = i + di;
      cj = j + dj;
      next = cell_conditions[ci][cj];
      if (next === another) { // di=dj=0 はここで除外される
        cnt = 0;
        while (next === another) {
          ci += di;
          cj += dj;
          next = cell_conditions[ci][cj];
          cnt++;
        }
        if (next === itself) {
          ti = i;
          tj = j;
          for (var k = 0; k < cnt; k++) {
            ti += di;
            tj += dj;
            flip_que.push([ti, tj]);
          }
        }
      }
    }
  }

  return flip_que;
}

function coloring_stone(stone, color) {
  var color1 = color;
  var color2 = (color === 'black') ? 'white' : 'black';

  stone.left.setAttribute('fill', color2);
  stone.center.setAttribute('fill', color1);
  stone.right.setAttribute('fill', color1);
  stone.left.setAttribute('fill-opacity', '1');
  stone.center.setAttribute('fill-opacity', '1');
  stone.right.setAttribute('fill-opacity', '1');
}

function flip_stones(stones, color1, color2) {
  var ang = 0;
  flip_stones1(stones, ang, color1, color2);
}

function flip_stones1(stones, ang, color1, color2) {
  var dr = stone_radius * Math.cos(ang * Math.PI / 180);
  var dh = stone_thickness * Math.sin(ang * Math.PI / 180);

  stones.forEach(function(stone) {
    rotate1(stone, dr, dh, color1, color2);
  });

  ang += d_ang;

  var flip = (ang === 90) ? flip_stones2 : flip_stones1;
  setTimeout(function() {
    flip(stones, ang, color1, color2);
  }, dt); //タイマーセット．dtミリ秒ごとに1ステップ実行
}

function flip_stones2(stones, ang, color1, color2) {
  if (ang > 180) {
    return;
  }

  var dr = stone_radius * Math.cos(ang * Math.PI / 180);
  var dh = stone_thickness * Math.sin(ang * Math.PI / 180);

  stones.forEach(function(stone) {
    rotate2(stone, dr, dh, color1, color2);
  });

  ang += d_ang;

  setTimeout(function() {
    flip_stones2(stones, ang, color1, color2);
  }, dt); //タイマーセット．dtミリ秒ごとに1ステップ実行
}


function rotate1(stone, dr, dh, color1, color2) {
  var stone_center_x = cell_width  / 2;
  var stone_center_y = cell_height / 2;

  var d_left = [
    svg_util.absM(stone_center_x - dh, stone_center_y - stone_radius),
    svg_util.relH(dh),
    svg_util.relA(dr, stone_radius, 0,  2 * stone_radius),
    svg_util.relH(-dh),
    svg_util.relA(dr, stone_radius, 0, -2 * stone_radius, { clockwise: true })
  ].join(' ');

  var d_center = [
    svg_util.absM(stone_center_x, stone_center_y - stone_radius),
    svg_util.relH(dh),
    svg_util.relA(dr, stone_radius, 0,  2 * stone_radius),
    svg_util.relH(-dh),
    svg_util.relA(dr, stone_radius, 0, -2 * stone_radius, { clockwise: true })
  ].join(' ');

  var d_right = [
    svg_util.absM(stone_center_x + dh, stone_center_y - stone_radius),
    svg_util.relA(dr, stone_radius, 0,  2 * stone_radius),
    svg_util.relA(dr, stone_radius, 0, -2 * stone_radius)
  ].join(' ');

  stone.left.setAttribute('d', d_left);
  stone.center.setAttribute('d', d_center);
  stone.right.setAttribute('d', d_right);

  stone.left.setAttribute('fill', color1);
  stone.center.setAttribute('fill', color2);
  stone.right.setAttribute('fill', color2);
}

function rotate2(stone, dr, dh, color1, color2) {
  var stone_center_x = cell_width  / 2;
  var stone_center_y = cell_height / 2;

  var d_left = [
    svg_util.absM(stone_center_x - dh, stone_center_y - stone_radius),
    svg_util.relA(dr, stone_radius, 0,  2 * stone_radius),
    svg_util.relA(dr, stone_radius, 0, -2 * stone_radius)
  ].join(' ');

  var d_center = [
    svg_util.absM(stone_center_x, stone_center_y - stone_radius),
    svg_util.relH(-dh),
    svg_util.relA(dr, stone_radius, 0, 2 * stone_radius, { clockwise: true }),
    svg_util.relH(dh),
    svg_util.relA(dr, stone_radius, 0, -2 * stone_radius)
  ].join(' ');

  var d_right = [
    svg_util.absM(stone_center_x + dh, stone_center_y - stone_radius),
    svg_util.relH(-dh),
    svg_util.relA(dr, stone_radius, 0, 2 * stone_radius, { clockwise: true }),
    svg_util.relH(dh),
    svg_util.relA(dr, stone_radius, 0, -2 * stone_radius)
  ].join(' ');

  stone.left.setAttribute('d', d_left);
  stone.center.setAttribute('d', d_center);
  stone.right.setAttribute('d', d_right);

  stone.left.setAttribute('fill', color1);
  stone.center.setAttribute('fill', color1);
  stone.right.setAttribute('fill', color2);
}


function pass() {
  if (players[turn] === HUMAN) {
    turn++;
    turn %= 2;
    set_turn_stone_color(turn);
    pass_flag[turn] = 1;
  }
}

function set_turn_stone_color(turn) {
  var turn_stone = document.getElementById('turn-stone-holder');
  turn_stone.innerHTML = (turn === BLACK_TURN) ? '●' : '○';
}

function switch_player(color, value) {
  players[color] = value;
}
