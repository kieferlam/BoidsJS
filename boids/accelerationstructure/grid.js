class Grid {
    constructor(cellWidth, cellHeight, rows = 40, columns = 23) {
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
        this.cells = new Array(rows);
        for(var i = 0; i < rows; ++i){
            this.cells[i] = new Array(columns);
            for(var j = 0; j < columns; ++j) this.cells[i][j] = [];
        }
        this.columns = columns;
    }

    put(obj){
        if(!this.indexFunc) return console.log("Invalid indexing function.");
        var [row, col] = this.getIndex(obj);
        this.cells[row][col].push(obj);
    }

    get(row, col){
        return this.cells[row][col];
    }
    
    setIndexFunc(func){
        this.indexFunc = func;
    }

    getIndex(obj){
        if(!this.indexFunc) return console.log("Invalid indexing function.");
        var [r, c] = this.indexFunc(obj, this.cellWidth, this.cellHeight);
        return [Math.trunc(r), Math.trunc(c)];
    }

    getQuadrantOffset(obj){
        if(!this.indexFunc) return [0, 0];
        // Get index from position but without truncation (so value is something like 1.453)
        var [r, c] = this.indexFunc(obj, this.cellWidth, this.cellHeight);
        // Decision maker function which will be applied to each dimension
        var predicate = num => num % 1 >= 0.5 ? 1 : -1;
        // If the index func decimal part is < 0.5, offset is -1 else 1
        return [predicate(r), predicate(c)];
    }

    iterate(row, col, func){
        if(row < 0 || col < 0) return;
        if(!this.cells[row]) console.log(row);
        if(!this.cells[row][col]) console.log(col);
        this.cells[row][col].forEach(obj => func(obj, row, col));
    }

    iterateNearby(obj, func){
        var centerIndex = this.getIndex(obj);

        // Find which quadrant of the main cell the object is in so we only check the near cells
        // Instead of every adjacent cell
        var quadrantOffsets = this.getQuadrantOffset(obj);

        var indices = [
            centerIndex,
            [centerIndex[0] + quadrantOffsets[0], centerIndex[1] + quadrantOffsets[1]],
            [centerIndex[0], centerIndex[1] + quadrantOffsets[1]],
            [centerIndex[0] + quadrantOffsets[0], centerIndex[1]],
        ]

        indices.forEach(i => this.iterate(i[0], i[1], func));
    }

    update(){
        // Iterate through every cell
        var moveCellTransactions = [];
        this.cells.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
            // Iterate through objects in cell
            cell.forEach(obj => {
                var [r, c] = this.getIndex(obj);
                if(r < 0 || r < 0) return;
                if(r !== rowIndex && c !== columnIndex){
                    moveCellTransactions.push({
                        obj: obj,
                        row: r,
                        col: c,
                        oldRow: rowIndex,
                        oldCol: columnIndex
                    })
                }
            });
        }));
        
        // Do move cell transaction
        moveCellTransactions.forEach(t => {
            var index = this.cells[t.oldRow][t.oldCol].findIndex(o => o.equals(t.obj));
            if(index >= 0){
                this.cells[t.oldRow][t.oldCol].splice(index, 1);
            }

            this.cells[t.row][t.col].push(t.obj);
        });
    }
}

export {Grid};