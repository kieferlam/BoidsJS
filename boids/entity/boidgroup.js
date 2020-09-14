import { Boid, _make_triangle } from './boid.js';
import {Grid} from '../accelerationstructure/grid.js';
import * as Util from '../util.js';
import { Vec2, Vec3 } from '../geometry/primitive.js';
import { SimpleShaderProgram } from '../shaders/shaderprogram.js';
import { VertexArrayObject } from '../globject/vao.js';
import { VertexBuffer } from '../geometry/databuffer.js';

let vao = null;
let triangle = null;

Util.onceGL(() => {
    vao = new VertexArrayObject();
    triangle = _make_triangle();
    triangle.vecAttributePointer(vao);
});

const loadBoidShaders = [
    fetch('/boids/shaders/boid_instanced.vert').then(res => res.text()),
    fetch('/boids/shaders/boid.frag').then(res => res.text())
];

let shaderProgram;
let shadersLoaded = false;

// Load shaders
const asyncCheckGL = () => !window.gl ? Util.ASYNC_CHECK_RETRY : Util.ASYNC_CHECK_RESOLVE;
const asyncCheckShaders = () => !shaderProgram ? Util.ASYNC_CHECK_RETRY : Util.ASYNC_CHECK_RESOLVE;
Util.onceGL(() => Promise.all(loadBoidShaders).then(src => {
    shaderProgram = new SimpleShaderProgram(src[0], src[1]);
    shaderProgram.link();
    if (!shaderProgram.successful()) {
        window.error(shaderProgram.log());
    }
    shadersLoaded = true;
}));

const boidIndexPredicate = function(boid, cellwidth, cellheight){
    return [
        (boid.position.y / cellheight) + 10,
        (boid.position.x / cellwidth) + 10,
    ];
}

class BoidGroup {
    constructor() {
        this.boids = [];
        this.transforms = [];
        this.positions = [];

        this.transformBuffer = null;
        this.positionBuffer = null;

        this.grid = new Grid(0.5, 0.5);
        this.grid.setIndexFunc(boidIndexPredicate);

        Util.onceGL(() => {

            vao.bind();

            this.transformBuffer = new VertexBuffer([], 16, gl.DYNAMIC_DRAW);
            this.transformBuffer.bind();
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16 * Util.FLOAT_BYTES, 0);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 16 * Util.FLOAT_BYTES, 4 * Util.FLOAT_BYTES);
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16 * Util.FLOAT_BYTES, 8 * Util.FLOAT_BYTES);
            gl.enableVertexAttribArray(4);
            gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16 * Util.FLOAT_BYTES, 12 * Util.FLOAT_BYTES);

            gl.vertexAttribDivisor(1, 1);
            gl.vertexAttribDivisor(2, 1);
            gl.vertexAttribDivisor(3, 1);
            gl.vertexAttribDivisor(4, 1);

            this.positionBuffer = new VertexBuffer([], Vec2.componentSize, gl.DYNAMIC_DRAW);
            this.positionBuffer.bind();
            gl.enableVertexAttribArray(5);
            gl.vertexAttribPointer(5, Vec2.componentSize, gl.FLOAT, false, Vec2.componentSize * Util.FLOAT_BYTES, 0);

            gl.vertexAttribDivisor(5, 1);
        });
    }

    get count() {
        return this.boids.length;
    }

    spawn(position = new Vec2((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1)) {
        Util.asyncCheck(Util.asyncNotNull(this.transformBuffer, this.positionBuffer)).then(() => {
            var b = new Boid(position.x, position.y);
            this.transformBuffer.addVec(b.transform);
            this.positionBuffer.addVec(b.position);
            this.boids.push(b);

            this.grid.put(b);
        });
    }

    _interactBoids(boid, other, elapsed_time, delta_time){
        var vec = boid.position.to(other.position);
        var distSq = vec.lengthSq;
        var dot = vec.normal().dot(boid.heading);

        // Check if other boid is within radius and vision
        if (distSq < Boid.VISION_RADIUS_SQ && dot > 1 - Boid.VISION_ANGLE) {
            // Rule 1: avoid other boids in the flock
            boid.avoid(other.position, elapsed_time, delta_time);

            // Add to flock direction vector
            this.flockDirection = this.flockDirection.add(other.heading);

            // Add to flock center average
            this.flockCenter = this.flockCenter.add(other.position);

            this.numBoidsInFlock++;
        }
    }

    _updateBoid(boid, i, elapsed_time, delta_time){
        boid.update(elapsed_time, delta_time);

        // Flock
        this.flockDirection = boid.heading;
        this.flockCenter = boid.position;
        this.numBoidsInFlock = 1;

        // Check surrounding boids
        this.grid.iterateNearby(boid, (other, row, col) => {
            this._interactBoids(boid, other, elapsed_time, delta_time);
        });

        this.flockDirection.normalize();

        // Rule 2: Steer in the same direction as the rest of the flock
        boid.steerTowardsFlock(this.flockDirection);

        // Rule 3: Steer towards the center of the flock
        boid.steerTowardsPoint(this.flockCenter.mul(1 / this.numBoidsInFlock));

        // Steer towards cursor
        // boid.steerTowardsPoint(mouseWorld);

        if (this.transformBuffer && this.positionBuffer) {
            this.transformBuffer.subData(boid.transform.data, i);
            this.positionBuffer.subData(boid.position.data, i);
        }
    }

    update(elapsed_time, delta_time) {
        for (var i = 0; i < this.count; ++i) {
            this._updateBoid(this.boids[i], i, elapsed_time, delta_time);
        }

        this.grid.update();

        if (this.transformBuffer && this.positionBuffer) {
            this.transformBuffer.bufferData();
            this.positionBuffer.bufferData();
        }
    }

    interact(world, elapsed_time, delta_time){
        for(var i = 0; i < this.count; ++i){
            this.boids[i].interact(world, elapsed_time, delta_time);
        }
    }

    render() {
        if (!shadersLoaded) return;

        shaderProgram.use();

        vao.bind();
        gl.drawArraysInstanced(gl.TRIANGLES, 0, triangle.numIndices, this.count);

        // this.boids.forEach(b => b.renderHeadingLine());
    }
}

export { BoidGroup };