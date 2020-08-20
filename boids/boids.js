import {TriangleBuffer, QuadBuffer} from './geometry/databuffer.js';
import {Vec2} from './geometry/primitive.js';
import {ShaderProgram, SimpleShaderProgram} from './shaders/shaderprogram.js';
import {VertexArrayObject} from './globject/vao.js';
import {Mat4} from './geometry/matrix.js';

let shaderProgram;
let vao;
let tribuffer;

let ortho;

const loadBoidShaders = [
    fetch('/boids/shaders/boid.vert').then(res => res.text()),
    fetch('/boids/shaders/boid.frag').then(res => res.text())
];

function init(){

    // Load shaders
    Promise.all(loadBoidShaders).then(src => {
        shaderProgram = new SimpleShaderProgram(src[0], src[1]);
        shaderProgram.link();
        if(!shaderProgram.successful()){
            window.error(shaderProgram.log());
        }
    });

    tribuffer = new TriangleBuffer(new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1));

    vao = new VertexArrayObject();
    tribuffer.vecAttributePointer(vao);
    
    ortho = new Mat4();
}

function resize(width, height){
    const aspect = width / height;

    const r = aspect;
    const l = -aspect;
    const t = 1.0;
    const b = -1.0;
    const n = 0.0;
    const f = 1.0;

    const rml = r-l;
    const rpl = -(r+l)/rml;
    const tmb = t-b;
    const tpb = -(t+b)/tmb;
    const fmn = f-n;
    const fpn = -(f+n)/fmn;

    ortho.identity();
    ortho.set(0, 0, 2 / rml);
    ortho.set(0, 3, rpl);
    ortho.set(1, 1, 2 / tmb);
    ortho.set(1, 3, tpb);
    ortho.set(2, 2, -2 / fmn);
    ortho.set(2, 3, fpn);

    shaderProgram.uniformMat4("mvp", ortho);
}

function update(elapsed_time, delta_time){
    
}

function render(){
    shaderProgram.use();

    vao.bind();
    tribuffer.draw();
}

export {init, update, render, resize};