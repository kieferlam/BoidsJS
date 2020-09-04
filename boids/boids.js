import { TriangleBuffer, QuadBuffer, CircleBuffer, VertexBuffer} from './geometry/databuffer.js';
import { Vec2, Vec3, Vec4} from './geometry/primitive.js';
import { ShaderProgram, SimpleShaderProgram } from './shaders/shaderprogram.js';
import { VertexArrayObject } from './globject/vao.js';
import { Mat2, Mat4, Matrix, Mat3 } from './geometry/matrix.js';
import * as Utils from './util.js';
import {Boid} from './entity/boid.js';
import {BoidGroup} from './entity/boidgroup.js';

const NUM_BOIDS = 200;

let ortho = new Mat4();
let orthoInverse = new Mat4();

window.mouse = new Vec2();
window.mouseWorld = new Vec3();

var boidGroup;

function init() {

    boidGroup = new BoidGroup();
    
    // Create boids
    for(var i = 0; i < NUM_BOIDS; ++i){
        boidGroup.spawn();
    }
}

function resize(width, height) {
    const aspect = width / height;
    window.aspect = aspect;

    const r = aspect;
    const l = -aspect;
    const t = 1.0;
    const b = -1.0;
    const n = 0.0;
    const f = 1.0;

    const rml = r - l;
    const rpl = -(r + l) / rml;
    const tmb = t - b;
    const tpb = -(t + b) / tmb;
    const fmn = f - n;
    const fpn = -(f + n) / fmn;

    ortho.identity();
    ortho.set(0, 0, 2 / rml);
    ortho.set(0, 3, rpl);
    ortho.set(1, 1, 2 / tmb);
    ortho.set(1, 3, tpb);
    ortho.set(2, 2, -2 / fmn);
    ortho.set(2, 3, fpn);
    orthoInverse = ortho.inverse();

    Boid.SetOrtho(ortho);
    BoidGroup.SetOrtho(ortho);
}

function update(elapsed_time, delta_time) {
    boidGroup.update(elapsed_time, delta_time);
}

function mousemove(mpos){
    mouse.set(mpos.x, mpos.y);
    mouseWorld = Vec4.FromMat(orthoInverse.mul(Vec4.From(mouse))).xyz;
}

function render() {
    boidGroup.render();
}

export { init, update, render, resize, mousemove };