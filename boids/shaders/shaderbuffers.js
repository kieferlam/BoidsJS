
function concatF32A(a, b){
    var firstLen = a.length;
    var newf32a = new Float32Array(firstLen + b.length);
    newf32a.set(a);
    newf32a.set(b, firstLen);
    return newf32a;
}

class UniformBufferObject{
    constructor(index){
        this.handle = gl.createBuffer();
        this.bind();
        this.data = [];
        this._index = index;
    }

    get index(){
        return this._index;
    }

    clear(){
        this.data = [];
    }

    bind(){
        gl.bindBuffer(gl.UNIFORM_BUFFER, this.handle);
    }

    put(data, length){
        this.data.push({data: data, length: length});
    }

    bufferData(){
        this.bind();
        let inlineData = new Float32Array();
        this.data.forEach(d => inlineData = concatF32A(inlineData, d.data));

        gl.bufferData(gl.UNIFORM_BUFFER, inlineData, gl.STATIC_DRAW);

        gl.bindBuffer(gl.UNIFORM_BUFFER, null);

        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.handle);
    }
}

export {UniformBufferObject};