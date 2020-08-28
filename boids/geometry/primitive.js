import { Matrix } from './matrix.js';

const sum = (accum, curr) => accum + curr;

class Vec extends Matrix {
    constructor(length) {
        super(length, 1);
    }

    get(i) {
        return this.data[i];
    }

    set(){
        var len = Math.min(this.data.length, arguments.length);
        for(var i = 0; i < len; ++i){
            if(isNaN(arguments[i])) throw new Error(`Cannot set vector to argument (${i}: ${arguments[i]}). Argument must be a number.`);
            this.data[i] = arguments[i];
        }
    }

    get lengthSq() {
        // length squared = a^2 + b^2 + c^2 + ...
        return this.data.map(v => v * v).reduce(sum);
    }

    get length() {
        return Math.sqrt(this.lengthSq);
    }

    normal() {
        var c = this.copy();
        c.normalize();
        return c;
    }

    add(v) {
        var c = this.copy();
        for (var i = 0; i < Math.min(this.data.length, v.data.length); ++i) {
            c.data[i] += v.get(i);
        }
        return c;
    }

    mul(f) {
        var c = this.copy();
        for (var i = 0; i < this.data.length; ++i) {
            c.data[i] *= f;
        }
        return c;
    }

    to(vec) {
        var c = this.copy();
        for (var i = 0; i < this.data.length; ++i) {
            c.data[i] = vec.data[i] - c.data[i];
        }
        return c;
    }

    dot(vec) {
        return this.data.map((val, i) => val * vec.get(i)).reduce(sum);
    }

    normalize() {
        const length = this.length; // Keep this line so the length variable is only calculated once
        this.data = this.data.map(v => v / length);
    }

    copy() {
        var copy = new Vec(0); // data length gets overriden by the next line
        copy.data = new Float32Array([...this.data]);
        return copy;
    }

    get componentSize() {
        return 1;
    }
}

class Vec2 extends Vec {
    constructor(x = 0, y = 0, numComponents = 2) {
        super(numComponents);
        this.data[0] = x;
        this.data[1] = y;
    }

    get x() {
        return this.get(0);
    }

    get y() {
        return this.get(1);
    }

    set x(val) {
        this.data[0] = val;
    }

    set y(val) {
        this.data[1] = val;
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    copy() {
        return new Vec2(this.x, this.y);
    }

    get componentSize() {
        return 2;
    }

}

class Vec3 extends Vec2 {
    constructor(x = 0, y = 0, z = 0, numComponents = 3) {
        super(x, y, numComponents);
        this.data[2] = z;
    }

    get z() {
        return this.data[2];
    }

    set z(val) {
        this.data[2] = val;
    }

    cross(v) {
        return new Vec3(
            (this.y * v.z) - (this.z - v.y),
            (this.z * v.x) - (this.x - v.z),
            (this.x * v.y) - (this.y - v.x),
        );
    }

    onLeft(point, vector) {
        var x = this.x;
        var y = this.y;
        var x1 = point.x;
        var y1 = point.y;
        var x2 = x1 + vector.x;
        var y2 = x2 + vector.y;

        var d = (x-x1)*(y2-y1)-(y-y1)*(x2-x1);
        return d < 0;
    }

    copy() {
        return new Vec3(this.x, this.y, this.z);
    }

    get componentSize() {
        return 3;
    }
}

class Vec4 extends Vec3 {
    constructor(x = 0, y = 0, z = 0, w = 0, numComponents = 4) {
        super(x, y, z, numComponents);
        this.data[3] = w;
    }

    get w() {
        return this.data[3];
    }

    set w(val) {
        this.data[3] = val;
    }

    get xyz() {
        return new Vec3(this.x, this.y, this.z);
    }

    static From(srcvec) {
        var vec = new Vec4();
        var len = Math.min(vec.data.length, srcvec.data.length);
        for (var i = 0; i < len; ++i) {
            vec.data[i] = srcvec.data[i];
        }
        return vec;
    }

    static FromMat(srcmat) {
        var vec = new Vec4();
        for (var i = 0; i < Math.min(vec.data.length, srcmat.rows); ++i) {
            vec.data[i] = srcmat.get(i, 0);
        }
        return vec;
    }

    copy() {
        return new Vec4(this.x, this.y, this.z, this.w);
    }

    get componentSize() {
        return 4;
    }
}

const VEC2_ZERO = new Vec2(0, 0);

export { Vec, Vec2, Vec3, Vec4, VEC2_ZERO };