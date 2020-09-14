import { TriangleBuffer, QuadBuffer, CircleBuffer, VertexBuffer, LineBuffer } from './geometry/databuffer.js';
import { Vec2, Vec3, Vec4 } from './geometry/primitive.js';
import { ShaderProgram, SimpleShaderProgram } from './shaders/shaderprogram.js';
import { VertexArrayObject } from './globject/vao.js';
import { Mat2, Mat4, Matrix, Mat3 } from './geometry/matrix.js';
import * as Utils from './util.js';
import { Boid } from './entity/boid.js';
import { BoidGroup } from './entity/boidgroup.js';
import { UniformBufferObject } from './shaders/shaderbuffers.js';
import { World, WorldBox, WorldWall } from './world/world.js';

const NUM_BOIDS = 100;

let ortho = new Mat4();
let orthoInverse = new Mat4();
let sharedUniforms = null;

window.mouse = new Vec2();
window.mouseWorld = new Vec2();

var boidGroup;

const genericShaderSrc = [
    fetch('./boids/shaders/generic.vert').then(r => r.text()),
    fetch('./boids/shaders/generic.frag').then(r => r.text()),
]

let world;

function init() {

    Promise.all(genericShaderSrc).then(srcs => {
        window.genericShaderProgram = new SimpleShaderProgram(srcs[0], srcs[1]);
        genericShaderProgram.link();
        if (!genericShaderProgram.successful()) {
            window.error(genericShaderProgram.log());
        }
    });

    window.genericLineVAO = new VertexArrayObject();
    window.genericLineBuffer = new LineBuffer([], gl.DYNAMIC_DRAW);
    genericLineBuffer.vecAttributePointer(genericLineVAO);

    world = new World(new Vec2(-aspect, -1.0), new Vec2(aspect, 1.0));
    world.add(new WorldBox(new Vec2(0, 0), 0.5, 0.5));
    // world.add(new WorldWall(new Vec2(-0.5, 0.3), new Vec2(0.8, 0.3)))

    boidGroup = new BoidGroup();
    window.boids = boidGroup;

    // Create boids
    for (var i = 0; i < NUM_BOIDS; ++i) {
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

    if (!sharedUniforms) sharedUniforms = new UniformBufferObject(0);
    sharedUniforms.clear();
    sharedUniforms.put(ortho.data, ortho.data.length);
    sharedUniforms.bufferData();

    ShaderProgram.SetSharedUniformBufferObject(sharedUniforms);
}

function update(elapsed_time, delta_time) {
    boidGroup.update(elapsed_time, delta_time);
    boidGroup.interact(world, elapsed_time, delta_time);
}

function mousemove(mpos) {
    mouse.set(mpos.x, mpos.y);
    mouseWorld = Vec4.FromMat(orthoInverse.mul(Vec4.From(mouse))).xy;
    // boidGroup.boids[0].heading = boidGroup.boids[0].position.to(mouseWorld).normal();
}

function render() {
    boidGroup.render();
    world.iterate((obj) => obj.render());
}

export { init, update, render, resize, mousemove };