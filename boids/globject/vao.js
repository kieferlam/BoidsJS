class VertexArrayObject{
    constructor(){
        const gl = window.gl;

        this.handle = gl.createVertexArray();
    }

    bind(){
        window.gl.bindVertexArray(this.handle);
    }

    vecAttribPointer(databuffer, size, index, stride, offset){
        const gl = window.gl;

        this.bind();
        databuffer.bind();
        gl.vertexAttribPointer(index, size, gl.FLOAT, false, stride, offset);
        gl.enableVertexAttribArray(index);

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    bindTexture(tex, index = 0){
        const gl = window.gl

        this.bind();
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, tex);
    }

    delete(){
        window.gl.deleteVertexArray(this.handle);
    }
}

export {VertexArrayObject};