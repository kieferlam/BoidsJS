const identity = (row, col) => (row == col) ? 1 : 0;

class Matrix {
    constructor(rows, columns, initializer = identity) {
        this.rows = rows;
        this.columns = columns;
        this.data = new Float32Array(rows * columns);
        this.init(initializer);
    }

    init(initializer = identity) {
        for (var i = 0; i < this.data.length; ++i) {
            this.data[i] = initializer(this.i_getRow(i), this.i_getCol(i), this);
        }
    }

    transform(func){
        for(var row = 0; row < this.rows; ++row){
            for(var col = 0; col < this.columns; ++col){
                this.set(row, col, func(row, col, this.get(row, col)));
            }
        }
    }

    static Construct(rows, cols, initializer) {
        if (rows !== cols) return new Matrix(rows, cols, initializer);

        var size = rows;

        switch (size) {
            case 2:
                return new Mat2(initializer);
            case 3:
                return new Mat3(initializer);
            case 4:
                return new Mat4(initializer);
            default:
                return new Matrix(rows, cols, initializer);
        }
    }

    static MatInit(mat) {
        return (row, col) => {
            if (row < mat.rows && col < mat.columns) return mat.get(row, col);
            return identity(row, col);
        }
    }

    static MatCopy(mat) {
        return (row, col) => mat.get(row, col);
    }

    static MatFromArray(arr) {
        return (row, col, mat) => arr[mat.index(row, col)];
    }

    identity() {
        this.init(identity);
    }

    i_getRow(i) {
        return Math.floor(i / this.columns);
    }
    i_getCol(i) {
        return i % this.columns;
    }

    index(row, col) {
        return row * this.columns + col;
    }

    get(row, col) {
        return this.data[row * this.columns + col];
    }

    set(row, col, val) {
        this.data[row * this.columns + col] = val;
    }

    get isSquare(){
        return this.rows === this.columns;
    }

    mul(mat) {
        if (this.columns != mat.rows) throw new Error(`Matrices inner size must match for matrix multiplication (left: ${this.columns}, right: ${mat.rows})`);
        var result = new Matrix(this.rows, mat.columns);
        for (var r = 0; r < result.rows; ++r) {
            for (var c = 0; c < result.columns; ++c) {
                // Dot the matrices and put in result
                var dot = 0;
                for (var i = 0; i < this.columns; ++i) {
                    dot += this.get(r, i) * mat.get(i, c);
                }
                result.set(r, c, dot);
            }
        }
        return result;
    }

    /**
     * Multiplies each element in the matrix by the factor f.
     * Returns a copy with the new values.
     * @param {Number} f 
     */
    factor(f){
        var copy = this.copy();
        for(var i = 0; i < copy.data.length; ++i){
            copy.data[i] *= f;
        }
        return copy;
    }

    transpose() {
        for (var row = 0; row < this.rows; ++row) {
            for (var col = 0; col < row; ++col) {
                // Swap on the diagonal
                var temp = this.get(col, row);
                this.set(col, row, this.get(row, col));
                this.set(row, col, temp);
            }
        }
    }

    determinant() {
        if (!this.isSquare) throw new Error(`Determinant of a matrix can only be calculated from square matrices. Current matrix is ${this.row}x${this.columns}.`);
        if(this.rows === 1) return this.get(0, 0);

        var GetMatExcludingColumn = (excludeCol) => {
            var vals = [];
            for (var row = 1; row < this.rows; ++row) {
                for (var col = 0; col < this.columns; ++col) {
                    if (col === excludeCol) continue;
                    vals.push(this.get(row, col));
                }
            }
            return Matrix.Construct(this.rows - 1, this.columns - 1, Matrix.MatFromArray(vals));
        };

        var dets = [];
        for(var col = 0; col < this.columns; ++col){
            dets.push(this.get(0, col) * GetMatExcludingColumn(col).determinant());
        }

        var det = 0;
        dets.forEach((d, i) => det += i % 2 == 0 ? d : -d);

        return det;
    }

    inverse(){
        if(!this.isSquare) throw new Error("Matrix does not have an inverse. Only square matrices have inverses.");
        
        var det = this.determinant();
        if(det === 0) throw new Error("Matrix does not have an inverse (determinant is 0).");

        var GetMatExcludeRowCol = (row, col) => {
            var vals = [];
            for(var r = 0; r < this.rows; ++r){
                for(var c = 0; c < this.columns; ++c){
                    if(r !== row && c !== col) vals.push(this.get(r, c));
                }
            }
            return Matrix.Construct(this.rows - 1, this.columns - 1, Matrix.MatFromArray(vals));
        };

        // Matrix of minors
        var workingMatrix = Matrix.Construct(this.rows, this.columns, (row, col) => GetMatExcludeRowCol(row, col).determinant());

        // Get matrix of cofactors
        workingMatrix.transform((row, col, val) => ((row + col) % 2 == 0) ? val : -val);

        // Make adjugate
        workingMatrix.transpose();

        return workingMatrix.factor(1/det);
    }

    copy() {
        return new Matrix(this.rows, this.columns, Matrix.MatCopy(this));
    }

    assign(mat){
        if(this.rows !== mat.rows || this.columns !== mat.columns) throw new Error(`Assigning matrices must match in size.`);

        this.transform((row, col) => mat.get(row, col));
    }
}

class Mat2 extends Matrix {
    constructor(initializer = identity) {
        super(Mat2.Rows, Mat2.Columns, initializer);
    }

    static get Rows() { return 2; }
    static get Columns() { return 2; }

    static Scale(x, y = x) {
        var mat = new Mat2();
        mat.set(0, 0, x);
        mat.set(1, 1, y);
        return mat;
    }

    static Rotate(angle) {
        var mat = new Mat2();
        mat.set(0, 0, Math.cos(angle));
        mat.set(0, 1, Math.sin(angle));
        mat.set(1, 0, -Math.sin(angle));
        mat.set(1, 1, Math.cos(angle));
        return mat;
    }

    determinant() {
        return this.get(0, 0) * this.get(1, 1) - this.get(1, 0) * this.get(0, 1);
    }

    inverse(){
        var det = this.determinant();
        if(det == 0) throw new Error(`Matrix does not have an inverse (determinant is 0).`);

        var c = this.copy();
        var temp = this.get(0, 0);
        this.set(0, 0, this.get(1, 1));
        this.set(1, 1, temp);
        this.set(0, 1, -this.get(0, 1));
        this.set(1, 0, -this.get(1, 0));

        return c.factor(1/det);
    }

    copy() {
        return new Mat2(Matrix.MatCopy(this));
    }
}

class Mat3 extends Matrix {
    constructor(initializer = identity) {
        super(Mat3.Rows, Mat3.Columns, initializer);
    }

    static get IDENTITY(){
        return IDENTITYm3;
    }

    static get Rows() { return 3; }
    static get Columns() { return 3; }

    determinant() {
        var deta = this.get(0, 0) * (this.get(1, 1) * this.get(2, 2) - this.get(2, 1) * this.get(1, 2));
        var detb = this.get(0, 1) * (this.get(1, 0) * this.get(2, 2) - this.get(2, 0) * this.get(1, 2));
        var detc = this.get(0, 2) * (this.get(1, 0) * this.get(2, 1) - this.get(1, 1) * this.get(2, 0));
        return deta - detb + detc;
    }

    copy() {
        return new Mat3(Matrix.MatCopy(this));
    }
}
const IDENTITYm3 = Object.freeze(new Mat3());

class Mat4 extends Matrix {
    constructor(initializer = identity) {
        super(Mat4.Rows, Mat4.Columns, initializer);
    }

    static get IDENTITY(){
        return IDENTITYm4;
    }

    static get Rows() { return 4; }
    static get Columns() { return 4; }

    copy() {
        return new Mat4(Matrix.MatCopy(this));
    }
}
const IDENTITYm4 = Object.freeze(new Mat4());

export { Matrix, Mat2, Mat3, Mat4 };