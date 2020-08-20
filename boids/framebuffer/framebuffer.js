/**
 * Encapsulates the framebuffer and texture handle.
 * The WebGL handles are created in the constructor.
 */
class Framebuffer{
    constructor(width, height, config = {
        level: 0,
        internalFormat: window.gl.RGBA,
        border: 0,
        format: window.gl.RGBA,
        type: window.gl.UNSIGNED_BYTE,
        data: null
    }){
        const gl = window.gl;

        this.width = width;
        this.height = height;

        // Create texture
        this.texture = gl.createTexture(width, height);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Config
        gl.texImage2D(gl.TEXTURE_2D, config.level, config.internalFormat, width, height, config.border, config.format, config.type, config.data);
        // Filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        // Create framebuffer
        this.handle = gl.createFramebuffer();
        this.bind();

        // Attach colour
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, config.level);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    bind(){
        window.gl.viewport(0, 0, this.width, this.height);
        window.gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
    }

    delete(){
        const gl = window.gl;
        gl.deleteFramebuffer(this.handle);
        gl.deleteTexture(this.texture);
    }
}

export {
    Framebuffer
}