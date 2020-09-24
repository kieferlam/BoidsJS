import { Vec2 } from '../geometry/primitive.js';

class GridQuadrant {
    constructor(rows = 50, columns = 50) {
        this.rows = rows;
        this.columns = columns;
        this.cells = new Array(rows);
        for (var row = 0; row < rows; ++row) {
            this.cells[row] = new Array(columns);
            for (var col = 0; col < columns; ++col) {
                this.cells[row][col] = [];
            }
        }
    }

    _ensureColumnSize() {
        for (var i = 0; i < this.rows.length; ++i) {
            if (!this.cells[i]) this.cells[i] = new Array(this.columns);
            if (this.cells[i].length < this.columns) {
                this.cells[i].push(new Array(this.columns));
                for (var col = 0; col < this.columns; ++col) {
                    this.cells[i][col] = [];
                }
            }
        }
    }

    _ensureSquare() {
        this._ensureColumnSize();
        if (this.cells.length < this.rows) {
            for (var i = 0; i < this.rows - this.cells.length; ++i) {
                this.cells.push(new Array(this.columns));
            }
        }
    }

    get(row, col) {
        if (col >= this.columns) {
            this.columns = col + 1;
            this._ensureColumnSize();
        }
        if (row >= this.rows) {
            this.rows = row + 1;
            this._ensureSquare();
        }
        return this.cells[row][col];
    }

    iterate(func) {
        this.cells.forEach(func);
    }
}

class Grid {
    constructor(cellWidth, cellHeight, rows = 20, columns = 20) {
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;

        this.pp = new GridQuadrant(rows, columns);
        this.pn = new GridQuadrant(rows, columns);
        this.np = new GridQuadrant(rows, columns);
        this.nn = new GridQuadrant(rows, columns);

        this.objects = [];

        // Debug render
        this.lineVertices = [];
        // Add vertical lines
        for (var i = -cellWidth * columns; i < cellWidth * columns; i += cellWidth) {
            this.lineVertices.push(new Vec2(i, -1), new Vec2(i, 1));
        }
        // Add horizontal lines
        for (var i = -cellHeight * columns; i < cellHeight * columns; i += cellHeight) {
            this.lineVertices.push(new Vec2(-4, i), new Vec2(4, i));
        }
    }

    put(obj) {
        if (!this.posGetter) throw new Error("Invalid position getter.");
        var [x, y] = this.getIndex(obj);
        this._getCellFromIndex(x, y).push(obj);
        this.objects.push({
            obj: obj,
            r: y,
            c: x
        });
    }

    get(row, col) {
        return this._getCellFromIndex(col, row)[row][col];
    }

    setPositionGetter(func) {
        this.posGetter = func;
    }

    _getPosition(obj) {
        if (!this.posGetter) throw new Error("Invalid position getter.");
        return this.posGetter(obj);
    }

    _getQuadrantFromIndex(x, y) {
        if (x < 0 && y < 0) return this.nn;
        if (x < 0 && y >= 0) return this.np;
        if (x >= 0 && y < 0) return this.pn;
        return this.pp;
    }

    _getCellFromIndex(x, y) {
        return this._getQuadrantFromIndex(x, y).get(Math.abs(y), Math.abs(x));
    }

    getIndex(obj, floor = true) {
        var [x, y] = this._getPosition(obj);
        if (floor) return [Math.floor(x / this.cellWidth), Math.floor(y / this.cellHeight)];
        else return [x / this.cellWidth, y / this.cellHeight];
    }

    getNeighbourOffsets(obj) {
        if (!this.posGetter) return [0, 0];
        // Get index from position but without truncation (so value is something like 1.453)
        var [x, y] = this.getIndex(obj, false);
        // Decision maker function which will be applied to each dimension
        var predicate = num => Math.abs(num % 1) >= 0.5 ? 1 : -1;
        var isNegativePred = num => num < 0 ? -predicate(num) : predicate(num);
        // If the index func decimal part is < 0.5, offset is -1 else 1
        return [isNegativePred(x), isNegativePred(y)];
    }

    iterate(col, row, func) {
        this._getCellFromIndex(col, row).forEach(obj => func(obj, row, col));
    }

    iterateNearby(obj, func) {
        var centerIndex = this.getIndex(obj);

        // Find which quadrant of the main cell the object is in so we only check the near cells
        // Instead of every adjacent cell
        var quadrantOffsets = this.getNeighbourOffsets(obj);

        var indices = [
            centerIndex,
            [centerIndex[0] + quadrantOffsets[0], centerIndex[1] + quadrantOffsets[1]],
            [centerIndex[0], centerIndex[1] + quadrantOffsets[1]],
            [centerIndex[0] + quadrantOffsets[0], centerIndex[1]],
        ]
        indices.forEach(i => this.iterate(i[0], i[1], func));
    }

    update() {
        // Iterate through every cell
        var moveCellTransactions = [];
        this.objects.forEach((obj, i) => {
            var [c, r] = this.getIndex(obj.obj);
            if (r !== obj.r || c !== obj.c) {
                moveCellTransactions.push({
                    obj: obj.obj,
                    row: r,
                    col: c,
                    oldRow: obj.r,
                    oldCol: obj.c,
                    i: i
                })
            }
        })

        // Do move cell transaction
        moveCellTransactions.forEach(t => {
            var index = this._getCellFromIndex(t.oldCol, t.oldRow).findIndex(o => o.equals(t.obj));
            if (index >= 0) {
                this._getCellFromIndex(t.oldCol, t.oldRow).splice(index, 1);
            }

            this._getCellFromIndex(t.col, t.row).push(t.obj);

            this.objects[t.i].r = t.row;
            this.objects[t.i].c = t.col;
        });
    }

    renderGrid() {
        // Use for debug only

        genericShaderProgram.use();
        genericLineVAO.bind();
        genericLineBuffer.clear();
        this.lineVertices.forEach(l => genericLineBuffer.addVec(l));
        genericLineBuffer.bufferData();
        genericLineBuffer.draw();
    }
}

export { Grid };