const sum = (accum, curr) => accum + curr;

class Vec{
    constructor(length){
        this.data = new Float32Array(length);
    }

    get(i){
        return this.data[i];
    }

    get lengthSq(){
        // length squared = a^2 + b^2 + c^2 + ...
        return this.data.map(v => v*v).reduce(sum);
    }

    get length(){
        return Math.sqrt(this.lengthSq);
    }

    normal(){
        var n = this.copy;
        n.normalize();
        return n;
    }

    dot(vec){
        return this.data.map((val, i) => val*vec.get(i)).reduce(sum);
    }

    normalize(){
        const length = this.length; // Keep this line so the length variable is only calculated once
        this.data = this.data.map(v => v / length);
    }

    copy(){
        var copy = new Vec(0); // data length gets overriden by the next line
        copy.data = new Float32Array([...this.data]);
        return copy;
    }

    componentSize(){
        return 1;
    }
}

class Vec2 extends Vec{
    constructor(x = 0, y = 0){
        super(2);
        this.data[0] = x;
        this.data[1] = y;
    }

    get x(){
        return this.get(0);
    }

    get y(){
        return this.get(1);
    }

    set x(val){
        this.data[0] = val;
    }

    set y(val){
        this.data[1] = val;
    }

    add(v){
        return new Vec2(this.x + v.x, this.y + v.y);
    }

    componentSize(){
        return 2;
    }

}

class Vec3 extends Vec2{
    constructor(x = 0, y = 0, z = 0){
        super(x, y);
        this.data[2] = z;
    }

    get z(){
        return this.data[2];
    }

    set z(val){
        this.data[2] = val;
    }

    add(v){
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    componentSize(){
        return 3;
    }
}

export {Vec, Vec2, Vec3};