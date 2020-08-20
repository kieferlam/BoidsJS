import './primitive.js';
import { Vec2 } from './primitive.js';

const BYTES_IN_FLOAT = Float32Array.BYTES_PER_ELEMENT;

class VertexBuffer{
    constructor(data = [], componentSize = 1, usage = window.gl.STATIC_DRAW){
        const gl = window.gl;

        this.handle = gl.createBuffer();
        this.data = data;
        this.componentSize = componentSize;

        if(data.length > 0){
            this.bufferData();
        }

        this.usage = usage;
    }

    numIndices(){
        return this.data.length / this.componentSize;
    }

    asFloat32Array(){
        return new Float32Array(this.data);
    }

    add(v){
        this.data.push(v);
    }

    addVec(vec){
        vec.data.forEach((val) => this.add(val));
    }

    remove(i, count = 1){
        this.data = this.data.splice(i, count);
    }

    bufferData(){
        this.bind();
        window.gl.bufferData(window.gl.ARRAY_BUFFER, this.asFloat32Array(), this.usage);
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, null);
    }
    
    bufferSubData(length = this.data.length, offset = 0){
        this.bind();
        window.gl.bufferSubData(window.gl.ARRAY_BUFFER, offset, this.asFloat32Array(), offset, length);
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, null);
    }

    draw(first = 0, count = this.numIndices()){
        window.gl.drawArrays(window.gl.TRIANGLES, first, count);
    }

    bind(){
        window.gl.bindBuffer(window.gl.ARRAY_BUFFER, this.handle);
    }

    delete(){
        window.gl.deleteBuffer(this.handle);
    }
}

class TriangleBuffer extends VertexBuffer{
    constructor(v1, v2, v3){
        super([], 2);

        this.bind();

        this.addVec(v1);
        this.addVec(v2);
        this.addVec(v3);

        this.bufferData();
    }

    vecAttributePointer(vao){
        vao.vecAttribPointer(this, 2, 0, 0, 0);
    }
}

class QuadBuffer extends VertexBuffer{
    constructor(v1, v2, v3, v4){
        super([], 4);

        this.bind();

        // Texture coordinates
        const bl = new Vec2(0, 0);
        const br = new Vec2(1, 0);
        const tr = new Vec2(1, 1);
        const tl = new Vec2(0, 1);

        // Triangle 1
        this.addVec(v1);
        this.addVec(bl);
        this.addVec(v2);
        this.addVec(br);
        this.addVec(v3);
        this.addVec(tr);

        // Triangle 2
        this.addVec(v1);
        this.addVec(bl);
        this.addVec(v3);
        this.addVec(tr);
        this.addVec(v4);
        this.addVec(tl);

        this.bufferData();
    }

    vecAttributePointer(vao){
        vao.vecAttribPointer(this, 2, 0, this.componentSize * BYTES_IN_FLOAT, 0);
        vao.vecAttribPointer(this, 2, 1, this.componentSize * BYTES_IN_FLOAT, 2 * BYTES_IN_FLOAT);
    }
}

export {VertexBuffer, QuadBuffer, TriangleBuffer};