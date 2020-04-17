const BOARD_VIEW = CHECK_WHITE;

function rotateBoard(color) {
    let rotate = "";
    if (color == CHECK_BLACK) {
        rotate = "rotate(180deg)";
        
    } else if (color == CHECK_WHITE) {
        rotate = "none";
    }
    $("#board").css("transform", rotate);
    $("#checkers").css("transform", rotate);
    $(".shit").css("transform", rotate);

}

function drawBoard(g, turn) {
    //console.log(g.rows, g.cols);
    let board = $("<div/>").attr("id", "board");
    board.css("height", "calc(80vh / " + g.cols + " * " + g.rows);
    let checkers = $("<div/>").attr("id", "checkers").addClass("checkers").appendTo(board);
    let cellCounter = g.numCells;
    for (i = 0; i < g.rows; i++) {
        let firstLastRow = (i == 0 || i == g.rows - 1);
        let row = $("<div/>").addClass("row").css("height", "calc(100% / " + g.rows + ")");
        cellCounter -= (firstLastRow) ? g.cols - 2 : g.cols;
        for (j = 0; j < g.cols; j++) {
            let firstLastCol = (j == 0 || j == g.cols - 1);
            let cell = $("<div/>").addClass("cell").css("width", "calc(100% / " + g.cols + ")");
            let cellNumber = (firstLastRow) ? cellCounter + j : cellCounter + j + 1;
            let cellContent = (!(firstLastRow && firstLastCol)) ? $("<div/>")
                .addClass("shit")
                .appendTo(cell)
                .html(cellNumber)
                .attr("id", cellNumber)
                .droppable({
                    accept: ".check",
                    drop: function(e, ui) {
                        //console.log(ui.draggable);
                        let pos = $(this).attr("id");
                        let checkID = ui.draggable.attr("id");
                        let moveResult = g.move(checkID, pos);
                        //console.log(moveResult);
                        if (moveResult.move) {
                            if (moveResult.beat != NO_BEAT) {
                                //console.log(moveResult);
                                $("#" + moveResult.beat).remove();
                            }
                            setPosition(g, ui.draggable, $(this).attr("id"), true, BOARD_VIEW);
                        } else {
                            setPosition(g, ui.draggable, g.getCheckByID(checkID).position, true, BOARD_VIEW);
                        }
                        
                    }
                  })
               
            : null;
            cell.appendTo(row);
        }
        row.appendTo(board);
    }
    
    let checkCSS = {
        margin: "calc(100% / " + g.cols * 4 + ")",
        width: "calc(50% / " + g.cols + ")",
        height: "calc(50% / " + g.rows + ")"
    };

    for (let i = 0; i < g.checks.length; i++) {
        let c = g.checks[i];
        let check = $("<div/>")
            .addClass("check")
            .attr("id", c.id)
            //.addClass("check--white")
            .on("click", function(e) {
                let el = $(e.target)
                let id = el.attr("id");
                //console.log(id);
                let cellNumber = el.data("cell");
                let color = el.data("color");
                
            })
            .css(checkCSS)
            .draggable({
                revert: "invalid",
                revertDuration: 200,
                start: function() {
                    //console.log("startDrag");
                    let checkID = $(this).attr("id");
                    
                    /*
                    let turns = g.getTurnsForCheck(checkID);
                    let pos = g.getCheckByID(checkID).position;
                    */
                    
                    let allTurns = [];
                    for (let c in g.checks) {
                        allTurns.push({'id': g.checks[c].id, 'turns': g.getTurnsForCheck(g.checks[c].id)});
                    }
                    let haveToBeatTurns = allTurns.filter(it => it.turns[HAVE_TO_BEAT]);
                    if (haveToBeatTurns.length > 0) {
                        allTurns = haveToBeatTurns;
                    }
                    let turns = allTurns.filter(it => it.id == checkID);
                    if (turns.length > 0) {
                        turns = turns[0].turns;
                    }
                    //console.log(turns);
                    for (dir in turns) {
                        for (i in turns[dir]) {
                            $("#" + turns[dir][i].pos).css("background", "rgb(100,255,100)");
                        }
                    }
                },
                stop: function() {
                    
                    //console.log("stopDrag");
                    $(".shit").css("background", "");
                }
            });
        //console.log(g.checks);
        if (c.color == CHECK_WHITE) {
            check.addClass("check--white");
        } else if (c.color == CHECK_BLACK) {
            check.addClass("check--black");
        }
        
        //console.log(g.rows, g.cols);
        setPosition(g, check, c.position, false, BOARD_VIEW);
        check.appendTo(checkers);
    }

    return board;
}



function getCSSPosition(g, cellNumber, rotated = false) {
    let top = -1;
    let left = -1;
    let edges = g.getEdges(cellNumber);

    if (edges.firstRow) {
        left = cellNumber;
        top = g.rows - 1;
    } else if (edges.lastRow) {
        top = 0;
        left = cellNumber - (g.rows - 2) * g.cols - (g.cols - 2);
    } else if (edges.firstCol) {
        left = 0;
        top = g.rows - Math.floor(cellNumber / g.cols) - 2;
    } else if (edges.lastCol) {
        left = g.cols - 1;
        top = g.rows - Math.floor(cellNumber / g.cols) - 1;
    } else if (!(edges.firstRow || edges.lastRow || edges.firstCol || edges.lastCol)) {
        left = (cellNumber % g.cols) + 1;
        top = g.rows - Math.floor(cellNumber / g.cols) - 1;
    }
    if (rotated) {
        left = g.cols - left - 1;
        top = g.cols - top - 2;
    }
    return {top: 100 /g.rows * top + "%", left: 100 / g.cols * left + "%"};
}




function setPosition(g, elem, newPosition, animate=false, color=CHECK_WHITE) {
    let rotatedBoard;
    if (color == CHECK_BLACK) {
        rotatedBoard = true;
    } else if (color == CHECK_WHITE) {
        rotatedBoard = false;
    }

    if (newPosition > 0 && newPosition <= g.rows * g.cols - 4) {
        let pos = getCSSPosition(g, newPosition, rotatedBoard);
        if (!animate) {
            elem.css({top: pos.top, left: pos.left})
        } else {
            
            elem.animate({top: pos.top, left: pos.left}, 200, function(){});
                
        }
        
        elem.data("cell", newPosition * 1);
        let check = g.getCheckByID(elem.attr("id"));
        let color = check.color;
        let tobitClass = "";
        if (color == CHECK_BLACK) {
            tobitClass = "tobit-black";
        } else if (color == CHECK_WHITE) {
            tobitClass = "tobit-white";
        }

        if (check.isTobit) {
            elem.addClass(tobitClass);
        } else {
            elem.removeClass(tobitClass);
        }
    }
}

$(document).ready(function () {
    //let game = new Game(6, 7);
    
    let checks = [];
    [ 22, 24].forEach(function(v, i, a) {
        checks.push({
            id: randomStr(),
            position: v,
            color: CHECK_BLACK,
            isTobit: false
        });  
    });

    [9].forEach(function(v, i, a) {
        checks.push({
            id: randomStr(),
            position: v,
            color: CHECK_WHITE,
            isTobit: true
        });  
    });
    
    let g = new Game(6,7, checks);
    drawBoard(g).appendTo(document.body);
    rotateBoard(BOARD_VIEW);
});