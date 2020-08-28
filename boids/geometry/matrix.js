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

    static MatInit(mat){
        return (row, col) => {
            if(row < mat.rows && col < mat.columns) return mat.get(row, col);
            return identity(row, col);
        }
    }

    static MatCopy(mat){
        return (row, col) => mat.get(row, col);
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

    mul(mat){
        if(this.columns != mat.rows) return console.error(`Matrices inner size must match for matrix multiplication (left: ${this.columns}, right: ${mat.rows})`);
        var result = new Matrix(this.rows, mat.columns);
        for(var r = 0; r < result.rows; ++r){
            for(var c = 0; c < result.columns; ++c){
                // Dot the matrices and put in result
                var dot = 0;
                for(var i = 0; i < this.columns; ++i){
                    dot += this.get(r, i) * mat.get(i, c);
                }
                result.set(r, c, dot);
            }
        }
        return result;
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

    copy(){
        return new Matrix(this.rows, this.columns, Matrix.MatCopy(this));
    }
}

class Mat2 extends Matrix{
    constructor(initializer = identity){
        super(Mat2.Rows, Mat2.Columns, initializer);
    }

    static get Rows(){ return 2;}
    static get Columns(){ return 2;}

    static Scale(x, y = x){
        var mat = new Mat2();
        mat.set(0, 0, x);
        mat.set(1, 1, y);
        return mat;
    }

    static Rotate(angle){
        var mat = new Mat2();
        mat.set(0, 0, Math.cos(angle));
        mat.set(0, 1, Math.sin(angle));
        mat.set(1, 0, -Math.sin(angle));
        mat.set(1, 1, Math.cos(angle));
        return mat;
    }

    copy(){
        return new Mat2(Matrix.MatCopy(this));
    }
}

class Mat3 extends Matrix{
    constructor(initializer = identity){
        super(Mat3.Rows, Mat3.Columns, initializer);
    }

    static get Rows(){ return 3;}
    static get Columns(){ return 3;}

    copy(){
        return new Mat3(Matrix.MatCopy(this));
    }
}

class Mat4 extends Matrix{
    constructor(initializer = identity){
        super(Mat4.Rows, Mat4.Columns, initializer);
    }

    static get Rows(){ return 4;}
    static get Columns(){ return 4;}

    copy(){
        return new Mat4(Matrix.MatCopy(this));
    }
}

export {Matrix, Mat2, Mat3, Mat4};