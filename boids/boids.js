import { TriangleBuffer, QuadBuffer, CircleBuffer} from './geometry/databuffer.js';
import { Vec2, Vec3, Vec4} from './geometry/primitive.js';
import { ShaderProgram, SimpleShaderProgram } from './shaders/shaderprogram.js';
import { VertexArrayObject } from './globject/vao.js';
import { Mat2, Mat4, Matrix, Mat3 } from './geometry/matrix.js';
import * as Utils from './util.js';
import {Boid} from './entity/boid.js';

const NUM_BOIDS = 100;

let shaderProgram;

let ortho;
let orthoInverse;

var initComplete = false;

const loadBoidShaders = [
    fetch('/boids/shaders/boid.vert').then(res => res.text()),
    fetch('/boids/shaders/boid.frag').then(res => res.text())
];

var mouse = new Vec2();
var mouseWorld = new Vec3();

var boidCluster = {
    boids: [],
    get count(){return this.boids.length;},

    spawn(position = new Vec2(Math.random() * 1, Math.random() * 1)){
        var b = new Boid(position.x, position.y);
        this.boids.push(b);
    },

    update(elapsed_time, delta_time){
        for(var i = 0; i < this.count; ++i){
            this.boids[i].update(elapsed_time, delta_time);

            // Loop around screen
            var p = this.boids[i].position;
            if(p.y > 1.1) this.boids[i].position.y = -1.0;
            if(p.y < -1.1) this.boids[i].position.y = 1.0;
            if(p.x > 2.1) this.boids[i].position.x = -2.0;
            if(p.x < -2.1) this.boids[i].position.x = 2.0;

            // Flock
            var flockDirection = new Vec3();
            var flockCenter = new Vec3();
            var numBoidsInFlock = 0;

            // Check surrounding boids
            for(var j = 0; j < this.count; ++j){
                if(i == j) continue;
                var vec = this.boids[i].position.to(this.boids[j].position);
                var distSq = vec.lengthSq;
                var dot = vec.normal().dot(this.boids[i].heading);

                // Check if other boid is within radius and vision
                if(distSq < Boid.VISION_RADIUS && dot > 1 - Boid.VISION_ANGLE){
                    // Rule 1: avoid other boids in the flock
                    this.boids[i].avoid(this.boids[j].position, elapsed_time, delta_time);

                    // Add to flock direction vector
                    flockDirection = flockDirection.add(this.boids[j].heading);

                    // Add to flock center average
                    flockCenter = flockCenter.add(this.boids[j].position);

                    numBoidsInFlock++;
                }
            }

            flockDirection.normalize();

            // Rule 2: Steer in the same direction as the rest of the flock
            this.boids[i].steerTowardsFlock(flockDirection);

            // Rule 3: Steer towards the center of the flock
            this.boids[i].steerTowardsPoint(flockDirection.mul(1 / numBoidsInFlock));

            // Steer towards cursor
            // this.boids[i].steerTowardsPoint(mouseWorld);


        }
    },

    render(shaderProgram){
        for(var i = 0; i < this.count; ++i){
            this.boids[i].render(shaderProgram);
        }
    }
};

function init() {
    
    // Create boids
    for(var i = 0; i < NUM_BOIDS; ++i){
        boidCluster.spawn();
    }

    ortho = new Mat4();
    orthoInverse = new Mat4();

    // Load shaders
    Promise.all(loadBoidShaders).then(src => {
        shaderProgram = new SimpleShaderProgram(src[0], src[1]);
        shaderProgram.link();
        if (!shaderProgram.successful()) {
            window.error(shaderProgram.log());
        }
        initComplete = true;
    });
}

function resize(width, height) {
    const aspect = width / height;

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

    const sendMat = () => shaderProgram.uniformMat4("projection", ortho);

    if (!shaderProgram) {
        Utils.asyncCheck(() => {
            if (shaderProgram !== undefined && shaderProgram !== null) return Utils.ASYNC_CHECK_RESOLVE;
            return Utils.ASYNC_CHECK_RETRY;
        }, 100, 10).then(() => sendMat());
    } else {
        sendMat();
    }
}

function update(elapsed_time, delta_time) {
    if(!initComplete) return;

    boidCluster.update(elapsed_time, delta_time);
}

function mousemove(mpos){
    mouse.set(mpos.x, mpos.y);
    mouseWorld = Vec4.FromMat(orthoInverse.mul(Vec4.From(mouse))).xyz;
}

function render() {
    if(!initComplete) return;
    
    shaderProgram.use();

    boidCluster.render(shaderProgram);
}

export { init, update, render, resize, mousemove };