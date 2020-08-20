const identity = (row, col) => (row == col) ? 1 : 0;

class Matrix{
    constructor(rows, columns, initializer = identity){
        this.rows = rows;
        this.columns = columns;
        this.data = new Float32Array(rows * columns);
        this.init(initializer);
    }

    init(initializer = identity){
        for(var i = 0; i < this.data.length; ++i){
            this.data[i] = initializer(this.i_getRow(i), this.i_getCol(i));
        }
    }

    identity(){
        this.init(identity);
    }

    i_getRow(i){
        return Math.floor(i / this.columns);
    }
    i_getCol(i){
        return i % this.columns;
    }

    get(row, col){
        return this.data[row * this.columns + col];
    }

    set(row, col, val){
        this.data[row * this.columns + col] = val;
    }

    transpose(){
        for(var row = 0; row < this.rows; ++row){
            for(var col = 0; col < row; ++col){
                // Swap on the diagonal
                var temp = this.get(col, row);
                this.set(col, row, this.get(row, col));
                this.set(row, col, temp);
            }
        }
    }
}

class Mat2 extends Matrix{
    constructor(initializer = identity){
        super(2, 2, initializer);
    }
}

class Mat3 extends Matrix{
    constructor(initializer = identity){
        super(3, 3, initializer);
    }
}

class Mat4 extends Matrix{
    constructor(initializer = identity){
        super(4, 4, initializer);
    }
}

export {Matrix, Mat2, Mat3, Mat4};