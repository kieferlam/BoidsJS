import './primitive.js';
import { Vec2 } from './primitive.js';

const BYTES_IN_FLOAT = Float32Array.BYTES_PER_ELEMENT;

class VertexBuffer {
    constructor(data = [], componentSize = 1, usage = gl.STATIC_DRAW, drawingMode = gl.TRIANGLES) {

        this.handle = gl.createBuffer();
        this.data = data;
        this.componentSize = componentSize;
        this.usage = usage;
        this.drawingMode = drawingMode;

        if (data.length > 0) {
            this.bufferData();
        }
    }

    get numIndices() {
        return this.data.length / this.componentSize;
    }

    get length() {
        return this.data.length;
    }

    asFloat32Array() {
        return Float32Array.from(this.data);
    }

    add(v) {
        this.data.push(v);
    }

    concat(v) {
        if (v.constructor.name === Float32Array.name) {
            this.data = this.data.concat(Array.prototype.slice.call(v));
        } else {
            this.data = this.data.concat(v);
        }
    }

    addVec(...vecs) {
        vecs.forEach(v => v.data.forEach((val) => this.add(val)));
    }

    remove(i, count = 1) {
        this.data = this.data.splice(i, count);
    }

    clear() {
        this.data = [];
    }

    bufferData() {
        this.bind();
        gl.bufferData(gl.ARRAY_BUFFER, this.asFloat32Array(), this.usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    bufferSubData(length = this.data.length, offset = 0) {
        this.bind();
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, this.asFloat32Array(), offset, length);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    subData(data, index) {
        var startIndex = index * this.componentSize;
        for (var absi = startIndex, i = 0; absi < startIndex + data.length; ++i, ++absi) {
            this.data[absi] = data[i];
        }
    }

    draw(first = 0, count = this.numIndices) {
        gl.drawArrays(this.drawingMode, first, count);
    }

    bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.handle);
    }

    delete() {
        gl.deleteBuffer(this.handle);
    }
}

class TriangleBuffer extends VertexBuffer {
    constructor(v1, v2, v3, usage = gl.STATIC_DRAW) {
        super([], 2, usage);

        this.bind();

        this.addVec(v1);
        this.addVec(v2);
        this.addVec(v3);

        this.bufferData();
    }

    vecAttributePointer(vao) {
        vao.vecAttribPointer(this, 2, 0, 0, 0);
    }
}

class QuadBuffer extends VertexBuffer {
    constructor(v1, v2, v3, v4) {
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

    vecAttributePointer(vao) {
        vao.vecAttribPointer(this, 2, 0, this.componentSize * BYTES_IN_FLOAT, 0);
        vao.vecAttribPointer(this, 2, 1, this.componentSize * BYTES_IN_FLOAT, 2 * BYTES_IN_FLOAT);
    }
}

class LineBuffer extends VertexBuffer {
    constructor(data = [], usage = window.gl.STATIC_DRAW) {
        super(data, 2, usage, gl.LINES)
    }

    vecAttributePointer(vao) {
        vao.vecAttribPointer(this, 2, 0, 0, 0);
    }
}

class LineStripBuffer extends VertexBuffer {
    constructor(data = [], usage = gl.STATIC_DRAW) {
        super(data, 1, usage, gl.LINE_STRIP);
    }
}

class TriangleFanBuffer extends VertexBuffer {
    constructor(data = [], usage = gl.STATIC_DRAW) {
        super(data, 2, usage, gl.TRIANGLE_FAN);
    }
}

class CircleBuffer extends TriangleFanBuffer {
    constructor(radius, edges, usage = gl.STATIC_DRAW) {
        super([], usage);

        var center = new Vec2();

        var numVertices = Math.max(4, edges);
        var angleStep = (Math.PI * 2) / numVertices;

        this.addVec(center);
        for (var i = 0, angle = 0; i < numVertices; ++i, angle += angleStep) {
            this.addVec(new Vec2(Math.cos(angle) * radius, Math.sin(angle) * radius));
        }
        // Add the first vertex again to complete the circle
        this.addVec(new Vec2(Math.cos(0) * radius, Math.sin(0) * radius));

        this.bufferData();
    }

    vecAttributePointer(vao) {
        vao.vecAttribPointer(this, 2, 0, 0, 0);
    }
}

export { VertexBuffer, QuadBuffer, TriangleBuffer, LineBuffer, LineStripBuffer, TriangleFanBuffer, CircleBuffer };