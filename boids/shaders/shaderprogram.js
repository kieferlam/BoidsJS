
class Shader{
    constructor(shaderType){

        this.handle = gl.createShader(shaderType);
    }

    setSource(source){
        gl.shaderSource(this.handle, source);
    }

    compile(){
        gl.compileShader(this.handle);
    }

    successful(){
        return gl.getShaderParameter(this.handle, gl.COMPILE_STATUS);
    }

    log(){
        return gl.getShaderInfoLog(this.handle);
    }

    delete(){
        gl.deleteShader(this.handle);
    }
}

let AllShaderPrograms = [];
let SharedUBO = null;
class ShaderProgram{
    constructor(){
        AllShaderPrograms.push(this);

        this.handle = gl.createProgram();

        this.shaders = [];

        this.uniforms = {};
    }

    static SetSharedUniformBufferObject(ubo){
        this.SharedUBO = ubo;
        AllShaderPrograms.forEach(program => program.uniformBlockBinding("GlobalShared", ubo.index));
    }

    attachShader(shader){
        gl.attachShader(this.handle, shader.handle);
        this.shaders.push(shader);
    }

    link(){
        gl.linkProgram(this.handle);
        this.loadUniforms();

        if(SharedUBO){
            this.uniformBlockBinding("GlobalShared", SharedUBO.index);
        }
    }

    cleanup(){
        this.shaders.forEach(shader => shader.delete());
    }

    successful(){
        return gl.getProgramParameter(this.handle, gl.LINK_STATUS);
    }

    loadUniforms(){
        const numUniforms = gl.getProgramParameter(this.handle, gl.ACTIVE_UNIFORMS);

        for(var i = 0; i < numUniforms; ++i){
            var uniform = gl.getActiveUniform(this.handle, i);
            if(!uniform) continue;
            var name = uniform.name;
            if(!name) continue;
            this.uniforms[name] = gl.getUniformLocation(this.handle, name);
        }
    }

    use(){
        gl.useProgram(this.handle);
    }

    log(){
        return gl.getProgramInfoLog(this.handle);
    }

    delete(){
        return gl.deleteProgram(this.handle);
    }

    // Uniforms
    uniformLocation(name){
        return this.uniforms[name];
    }

    uniformBlockIndex(name){
        return gl.GetUniformBlockIndex(this.handle, name);
    }

    uniform1i(name, value){
        this.use();
        gl.uniform1i(this.uniformLocation(name), value);
    }

    uniformMat4(name, mat){
        this.use();
        gl.uniformMatrix4fv(this.uniformLocation(name), false, mat.data, 0, 0);
    }

    uniformVec(name, vec){
        var loc = this.uniformLocation(name);
        const funcs = [()=>console.error("Vector data length is 0"), ()=>gl.uniform1fv(loc, vec.data), ()=>gl.uniform2fv(loc, vec.data), ()=>gl.uniform3fv(loc, vec.data), ()=>gl.uniform4fv(loc, vec.data)];

        this.use();
        if(vec.data.length > funcs.length) return console.error("Cannot specify uniform values for vectors with more than 4 components.");
        funcs[vec.data.length]();
    }

    uniformBlockBinding(name, index){
        gl.uniformBlockBinding(this.handle, this.uniformBlockIndex(name), index);
    }
}

class VertexShader extends Shader{
    constructor(){
        super(gl.VERTEX_SHADER);
    }
}

class FragmentShader extends Shader{
    constructor(){
        super(gl.FRAGMENT_SHADER);
    }
}

/**
 * Constructs a ShaderProgram with VertexShader and FragmentShader.
 */
class SimpleShaderProgram extends ShaderProgram{
    constructor(vertexSrc, fragmentSrc){
        super();
        this.vertexSource = vertexSrc;
        this.fragmentSource = fragmentSrc;
        this.shaderLog = "";
    }

    link(){
        const vertexShader = new VertexShader();
        const fragmentShader = new FragmentShader();

        vertexShader.setSource(this.vertexSource);
        fragmentShader.setSource(this.fragmentSource);

        vertexShader.compile();
        fragmentShader.compile();

        if(!vertexShader.successful()) this.shaderLog += `Vertex shader failed to compile: ${vertexShader.log()}`;
        if(!fragmentShader.successful()) this.shaderLog += `Fragment shader failed to compile: ${fragmentShader.log()}`;

        if(this.shaderLog.length > 0) console.error(this.shaderLog);

        this.attachShader(vertexShader);
        this.attachShader(fragmentShader);

        super.link();
    }
}

export {SimpleShaderProgram, ShaderProgram, VertexShader, FragmentShader, Shader}