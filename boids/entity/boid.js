import {Vec2, Vec3, Vec4} from '../geometry/primitive.js';
import {Mat4, Mat2, Matrix} from '../geometry/matrix.js';
import {TriangleBuffer, LineBuffer, VertexBuffer} from '../geometry/databuffer.js';
import {VertexArrayObject} from '../globject/vao.js';
import * as Util from '../util.js';
import {SimpleShaderProgram} from '../shaders/shaderprogram.js';
import { Ray } from '../geometry/ray.js';

function _make_triangle(){
    const baseWidth = 0.3;
    const height = 0.45;
    const v1 = new Vec2(-baseWidth * 0.5, -height * 0.5);
    const v2 = new Vec2(baseWidth * 0.5, -height * 0.5);
    const v3 = new Vec2(0, height * 0.5);
    return new TriangleBuffer(v1, v2, v3);
}

var created = false;

var vao = null;
var triangle = null;

var headingVao = null;
var headingLine = null;

const RotateSpeed = 0.01;
var RotateAntiClockwise = (strength) => new Mat4(Matrix.MatInit(Mat2.Rotate(-RotateSpeed * strength)));
var RotateClockwise = (strength) => new Mat4(Matrix.MatInit(Mat2.Rotate(RotateSpeed * strength)));

const loadBoidShaders = [
    fetch('/boids/shaders/boid.vert').then(res => res.text()),
    fetch('/boids/shaders/boid.frag').then(res => res.text())
];

var shaderProgram;
var shadersLoaded = false;

// Load shaders
const asyncCheckGL = () => !window.gl ? Util.ASYNC_CHECK_RETRY : Util.ASYNC_CHECK_RESOLVE;
const asyncCheckShaders = () => !shaderProgram ? Util.ASYNC_CHECK_RETRY : Util.ASYNC_CHECK_RESOLVE;
Util.asyncCheck(asyncCheckGL, -1, 1).then(() => Promise.all(loadBoidShaders).then(src => {
    shaderProgram = new SimpleShaderProgram(src[0], src[1]);
    shaderProgram.link();
    if (!shaderProgram.successful()) {
        window.error(shaderProgram.log());
    }
    shadersLoaded = true;
}));

var ortho;

class Boid{
    constructor(x = 0, y = 0, heading = new Vec2(Math.random() - 0.5, Math.random() - 0.5).normal()){
        this._uid = Util.genID();
        this.frontRay = new Ray(new Vec2(x, y), heading, 1.0);

        this.transform = new Mat4();
        this.transform.init(Matrix.MatInit(Mat2.Scale(0.1)));
        this.transform = new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))).mul(this.transform);
        
        if(gl){
            if(!created){
                vao = new VertexArrayObject();
                triangle = _make_triangle();

                triangle.vecAttributePointer(vao);

                // Heading line
                headingVao = new VertexArrayObject();
                headingLine = new LineBuffer([0, 0, 0, 1]);
                headingLine.vecAttributePointer(headingVao);

                created = true;
            }
        }
    }

    static SetOrtho(o){
        ortho = o;
        if(shadersLoaded) shaderProgram.uniformMat4("projection", ortho);
        else Util.asyncCheck(asyncCheckShaders, -1).then(()=>shaderProgram.uniformMat4("projection", ortho));
    }

    static get SPEED(){
        return 0.0005;
    }

    static get VISION_RADIUS(){
        return 0.4 * 0.4;
    }

    static get VISION_ANGLE(){
        return 1.75;
    }

    get position(){
        return this.frontRay.origin;
    }
    set position(v){
        this.frontRay.origin = v;
    }

    get heading(){
        return this.frontRay.direction;
    }
    set heading(v){
        this.frontRay.direction = v;
    }

    steerClockwise(strength){
        this.heading = Vec4.FromMat(RotateClockwise(strength).mul(Vec4.From(this.heading))).xy;
    }

    steerAntiClockwise(strength){
        this.heading = Vec4.FromMat(RotateAntiClockwise(strength).mul(Vec4.From(this.heading))).xy;
    }

    avoid(point, elapsed_time, delta_time){
        var onLeft = point.onLeft(this.position, this.heading);
        var adjustStrength = 1 - (point.to(this.position).lengthSq / Boid.VISION_RADIUS);
        adjustStrength = Math.max(0, adjustStrength) * 2;
        if(onLeft) this.steerClockwise(adjustStrength);
        else this.steerAntiClockwise(adjustStrength);
    }

    steerTowardsFlock(flockVector){
        if(this.heading.dot(flockVector) > 0.99) return;
        var onLeft = flockVector.onLeft(Vec2.ZERO, this.heading);
        var steerStrength = 1.0;
        if(onLeft) this.steerAntiClockwise(steerStrength);
        else this.steerClockwise(steerStrength);
    }

    steerTowardsPoint(point){
        var pointVec = this.position.to(point);
        if(pointVec.lengthSq < (0.00001)) return;
        var onLeft = pointVec.onLeft(Vec2.ZERO, this.heading);
        var steerStrength = 1.0;
        if(onLeft) this.steerAntiClockwise(steerStrength);
        else this.steerClockwise(steerStrength);
    }

    update(elapsed_time, delta_time){
        this.position = this.position.add(this.heading.mul(delta_time * Boid.SPEED));
        this.transform.init(Matrix.MatInit(Mat2.Scale(0.1)));
        this.transform = new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))).mul(this.transform);
    }

    interact(world, elapsed_time, delta_time){
        // Loop around screen
        var p = this.position;
        if (p.y > world.positiveBoundary.y + EPSILON) this.position.y = world.negativeBoundary.y;
        if (p.y < world.negativeBoundary.y - EPSILON) this.position.y = world.positiveBoundary.y;
        if (p.x > world.positiveBoundary.x + EPSILON) this.position.x = world.negativeBoundary.x;
        if (p.x < world.negativeBoundary.x - EPSILON) this.position.x = world.positiveBoundary.x;

        world.iterate((obj)=>{
            if(obj.rayHit(this.frontRay)){
                console.log("test");
                this.steerClockwise(1.0);
            }
        });
    }

    render(){
        if(!shadersLoaded) return;

        shaderProgram.use();
        shaderProgram.uniformVec("position", this.position);
        shaderProgram.uniformMat4("transform", this.transform);

        vao.bind();
        triangle.draw();
    }

    renderHeadingLine(){
        if(!shadersLoaded) return;

        shaderProgram.use();
        shaderProgram.uniformVec("position", this.position);
        shaderProgram.uniformMat4("transform", new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))));

        headingVao.bind();
        headingLine.draw();
    }

    equals(other){
        return this._uid === other._uid;
    }
}

export {Boid, _make_triangle};