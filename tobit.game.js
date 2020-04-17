'use strict';

class Game {
    constructor(rows = 6, cols = 7, checks = null, drawBoard = false, turn = CHECK_WHITE) {
        this.rows = rows;
        this.cols = cols;
        this.checks = [];
        this.numCells = rows * cols - 4;
        this.turn = turn;
        this.locked = null;
        this.turnLog = [];

        //сделать чтобы можно было рубить несколько штук, 
        //и в это время заблокировать ходы другими шашками

        if (checks == null) {
            for (let i = 0; i < cols * 2 - 2; i++) {
                this.checks.push({
                    id: randomStr(),
                    position: i + 1,
                    color: CHECK_WHITE,
                    isTobit: false
                });
                   
                this.checks.push({
                    id: randomStr(),
                    position: this.numCells - i,
                    color: CHECK_BLACK,
                    isTobit: false
                });       
            }
        } else {
            this.checks = checks;
        }

        this.log();

    }

    log(beat = NO_BEAT) {
        if (this.turnLog.length > 0) {
            //logging
            //console.log(this.turnLog);
            //turns "from" are numbers, turns "to" are strings;
            //we get the first turn "from" and all turns "to"
            let fromTurns = this.turnLog.filter(it => typeof it == "number");
            let toTurns = this.turnLog.filter(it => typeof it == "string");
            //...and convert all to numbers
            let allTurns = [fromTurns[0]].concat(toTurns).map(it => it * 1);
            //building the log string
            let sep = "-";
            if (beat != NO_BEAT) {
                sep = ":";
            }
            let turnString = allTurns.join(sep);
            console.log(turnString);
            this.turnLog = [];
        }

        if (this.turn == CHECK_BLACK) {
            console.log("ходят черные");
        } else {
            console.log("ходят белые");
        }
        
    }

    getCheckByID(checkID) {
        return this.checks.find(it => it.id == checkID);
    }

    checkCell(pos) {
        return this.checks.find(it => it.position == pos) || CELL_FREE;
    }
    
    getTurnsForLine(pos, color, dir, isTobit = false, _turns = [], beat = NO_BEAT) {
        let turns = _turns;

        if (pos < 1 || pos > this.rows * this.cols - 4) {
            return turns;
        }

        //получаем соседей
        let neighbors = this.getNeighbors(pos).filter(it => it.dir == dir);
        if (neighbors.length == 0) {
            //тупик
            return turns;
        }

        //следующая клето4ка
        let newPos = neighbors[0].pos;
        
        //если пусто, можно ходить; если тобит, можно ходить и проверяем следующую 
        let newColor = this.checkCell(newPos);
        if (newColor) {
            newColor = newColor.color;
        }
        if (newColor == CELL_FREE) {
            turns.push({pos: newPos, beat: beat});

            if (isTobit && SUPER_TOBIT) {
                return this.getTurnsForLine(newPos, color, dir, isTobit, turns, beat);
            } else {
                return turns;
            }
        //если своя шашка, тупик как для хула, так и для тобита
        } else if (newColor == color) {
            return turns;
        //если чужая, проверяем след.клетку, и если она пустая, заносим в beat эту
        } else if (newColor != color) {
            if (beat == NO_BEAT) {
                
                return  this.getTurnsForLine(newPos, color, dir, isTobit, turns, newPos);
            } else { //если уже рубили, то тупик
                return turns;
            }
        }
    }

    getTurnsForCheck(checkID) {
        let check = this.getCheckByID(checkID);
        let turns = {};
        let beatOnlyTurns = {};
        let beatCount = 0;
        for (let d in DIRECTIONS) {
            let dir = DIRECTIONS[d];
            turns[dir] = this.getTurnsForLine(check.position, check.color, dir, check.isTobit);
            
            //ход не наш или заблокирован другой шашкой
            if (check.color != this.turn || (checkID != this.locked && this.locked != null) ) {
                turns[dir] = [];
            }

            //обязалово рубить
            beatOnlyTurns[dir] = turns[dir].filter(it => it.beat != NO_BEAT);
            let beatByDirection = beatOnlyTurns[dir].length;

            if (beatByDirection == 0) {
                if (!check.isTobit && check.color == CHECK_WHITE && dir == DIRECTION_DOWN) {
                    turns[dir] = [];
                }
                if (!check.isTobit && check.color == CHECK_BLACK && dir == DIRECTION_UP) {
                    turns[dir] = [];
                }
            }
            beatCount += beatByDirection;
            
        }
        if (beatCount == 0) {
            turns[HAVE_TO_BEAT] = false;
            return turns;
        } else {
            beatOnlyTurns[HAVE_TO_BEAT] = true;
            return beatOnlyTurns;
        }
        
    }

    getNeighbors(pos) {
        let dirs = this.checkDirections(pos);
        let neighbors = [];
        let edges = this.getEdges(pos);
        if (dirs.left) {
            neighbors.push({pos: pos - 1, dir: DIRECTION_LEFT});
        }
        if (dirs.right) {
                neighbors.push({'pos': pos * 1 + 1, 'dir': DIRECTION_RIGHT});
        }
        if (dirs.up) {
            let upCount = (edges.penultimateRow || edges.firstRow) ? this.cols - 1 : this.cols;
                neighbors.push({'pos': pos * 1 + upCount, 'dir': DIRECTION_UP});
        }
        if (dirs.down) {
            let downCount = (edges.secondRow || edges.lastRow) ? this.cols - 1 : this.cols;
                neighbors.push({'pos': pos - downCount, 'dir': DIRECTION_DOWN});
        }
        //console.log(neighbors);
        return neighbors;
    }
    
    checkDirections(pos) {
        let edges = this.getEdges(pos);
        let dirs = {left: false, right: false, up: false, down: false};
        
        if (edges.firstRow) {
            dirs.up = true;
        } else if (edges.lastRow) {
            dirs.down = true;
        } else if (edges.firstCol) {
            dirs.right = true;
        } else if (edges.lastCol) {
            dirs.left = true;
        } else if (!(edges.firstRow || edges.lastRow || edges.firstCol || edges.lastCol)) {
            dirs = {left: true, right: true, up: true, down: true};
        }
    
        return dirs;
    }
    
    getEdges(pos) {
        let r = this.rows;
        let c = this.cols;
        let fr = pos > 0 && pos <= c - 2;
        let lr = pos <= r * c - 4 && pos > r * c - 4 - c + 2;
        let fc = Math.floor(pos % c) == c - 1 && !fr && !lr;
        let lc = Math.floor(pos % c) == c - 2 && !fr && !lr;
        let sr = pos >= c - 1 && pos <= c * 2 - 2;
        let pr = pos <= r * c - 4 - (c - 2) && pos > r * c - 4 - (c - 2 + c)  && !fr && !lr;
        let res = {firstRow: fr, lastRow: lr, firstCol: fc, lastCol: lc, secondRow: sr, penultimateRow: pr};
        //console.log(res);
        return res;
    }

    getTurnsForAll(onlyBeat = false) {
        let allTurns = [];
        for (let c in this.checks) {
            allTurns.push({'id': this.checks[c].id, 'turns': this.getTurnsForCheck(this.checks[c].id)});
        }

        let haveToBeatTurns = allTurns.filter(it => it.turns[HAVE_TO_BEAT]);
        if (haveToBeatTurns.length > 0) {
            allTurns = haveToBeatTurns;
        }


        if (onlyBeat) {
            return haveToBeatTurns;
        } else {
            return allTurns;
        }
        
    }

    changeTurn(beat) {
        //меняем ход
        this.locked = null;
        if (this.turn == CHECK_BLACK) {
            this.turn = CHECK_WHITE;
        } else {
            this.turn = CHECK_BLACK;
        }

        this.log(beat);
    }

    move(checkID, to) {
        //console.log(this.locked);
        if (checkID != this.locked && this.locked != null) {
            return false;
        }
        let from = this.getCheckByID(checkID).position;
        let index = this.checks.findIndex(it => it.id == checkID);

        
        
        let turns = this.getTurnsForAll().filter(it => it.id == checkID);
        if (turns.length == 0) {
            //console.log("unlock");
            this.locked = null;
            return false;
        }
        turns = turns[0].turns;
        let beat = NO_BEAT;
        //let turns = this.getTurnsForCheck(checkID);
        for (let d in DIRECTIONS) {
            let dir = DIRECTIONS[d];
            let doMove = turns[dir].find(it => it.pos == to);
            if (doMove) {
                this.turnLog.push(from);
                this.turnLog.push(to);
                
                this.locked = checkID;
                //console.log("lock to " + checkID);

                this.checks[index].position = to * 1;
                beat = doMove.beat;
                //console.log("beat: " + beat);
                if (beat != NO_BEAT) {
                    let checkID = this.checks[index].id;

                    
                    
                    //рубим
                    let beatID = this.checkCell(beat).id;
                    this.checks = this.checks.filter(it => it.id != beatID);
                    beat = beatID; 
                    
                    if (this.getTurnsForAll(true).filter(it => it.id == checkID).length == 0) {
                        //console.log("меняем ход т.к. уже рубили, и для этой шашки не осталось ходов");
                        this.changeTurn(beat);
                    }

                    
                } else {
                    //console.log("меняем ход т.к. не срубили");
                    this.changeTurn(beat);
                }           

                //посвящаем в тобiты
                index = this.checks.findIndex(it => it.id == checkID); //обновим iндекс после возможного срубания
                let edges = this.getEdges(to);
                if (
                    (!this.checks[index].isTobit) && (
                        (this.checks[index].color == CHECK_WHITE && edges.lastRow) ||
                        (this.checks[index].color == CHECK_BLACK && edges.firstRow)
                    )
                ) {
                    this.checks[index].isTobit = true;
                    console.log('тобiт ебать');
                }
                
                

                return {move: true, turn: this.turn, beat: beat};

            } else {
                this.locked = null;
                //console.log("unlock " + checkID);
            }
        }
        //console.log("bbbbbbbbeeeeeeeeaaaaaattttttt: " + beat);
        return {move: false, turn: this.turn};
    }


}

function randomStr() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

