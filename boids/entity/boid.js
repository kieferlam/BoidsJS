import { Vec2, Vec3, Vec4 } from '../geometry/primitive.js';
import { Mat4, Mat2, Matrix } from '../geometry/matrix.js';
import { TriangleBuffer, LineBuffer, VertexBuffer } from '../geometry/databuffer.js';
import { VertexArrayObject } from '../globject/vao.js';
import * as Util from '../util.js';
import { SimpleShaderProgram } from '../shaders/shaderprogram.js';
import { LineSegment, Ray } from '../geometry/ray.js';
import { WorldBox } from '../world/world.js';

function _make_triangle() {
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

const RotateSpeed = 0.02;
var RotateAntiClockwise = (strength) => Mat2.Rotate(-RotateSpeed * strength);
var RotateClockwise = (strength) => Mat2.Rotate(RotateSpeed * strength);

const loadBoidShaders = [
    Util.waitForGlobals().then(() => Util.read(`${BOIDS_PATH}/boids/shaders/boid.vert`)).then(res => res.text()),
    Util.waitForGlobals().then(() => Util.read(`${BOIDS_PATH}/boids/shaders/boid.frag`)).then(res => res.text())
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

window.renderScanLines = [];

var avoidPoints = [];

class Boid {
    constructor(x = 0, y = 0, heading = new Vec2(Math.random() - 0.5, Math.random() - 0.5).normal()) {
        this._uid = Util.genID();
        this.frontRay = new Ray(new Vec2(x, y), heading, Boid.VISION_RADIUS);
        this.feelerAngle = (Math.PI / 180) * 3; // 5 degrees
        // Feeler rays are extra rays offset from front ray to proximity check with objects
        this._setFeelerRays();

        this.transform = new Mat4();
        this.transform.init(Matrix.MatInit(Mat2.Scale(0.1)));
        this.transform = new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))).mul(this.transform);

        this.rotateLock = 0;

        if (gl) {
            if (!created) {
                vao = new VertexArrayObject();
                triangle = _make_triangle();

                triangle.vecAttributePointer(vao);

                // Heading line
                headingVao = new VertexArrayObject();
                headingLine = new LineBuffer([0, 0, 0, Boid.VISION_RADIUS]);
                headingLine.vecAttributePointer(headingVao);

                created = true;
            }
        }
    }

    static SetOrtho(o) {
        ortho = o;
        if (shadersLoaded) shaderProgram.uniformMat4("projection", ortho);
        else Util.asyncCheck(asyncCheckShaders, -1).then(() => shaderProgram.uniformMat4("projection", ortho));
    }

    static get SPEED() {
        if (window.PAUSE) return 0;
        return 0.0005;
    }

    static get VISION_RADIUS_SQ() {
        return Boid.VISION_RADIUS * Boid.VISION_RADIUS;
    }

    static get VISION_RADIUS() {
        return 0.4;
    }

    static get VISION_ANGLE() {
        return 1.6;
    }

    get position() {
        return this.frontRay.origin;
    }
    set position(v) {
        this.frontRay.origin = v;
        for (let i = 0; i < this.feelerRays.length; i++) {
            this.feelerRays[i].origin = this.position;
        }
    }

    get heading() {
        return this.frontRay.direction;
    }
    set heading(v) {
        this.frontRay.direction = v;
        this._setFeelerRays();
    }

    _setFeelerRays() {
        this.feelerRays = [
            new Ray(this.position, Vec2.FromMat(Mat2.Rotate(this.feelerAngle).mul(this.heading)), this.frontRay.maxT),
            new Ray(this.position, Vec2.FromMat(Mat2.Rotate(-this.feelerAngle).mul(this.heading)), this.frontRay.maxT),
        ];
    }

    steerClockwise(strength) {
        this.heading = Vec2.FromMat(RotateClockwise(strength).mul(this.heading));
    }

    steerAntiClockwise(strength) {
        this.heading = Vec2.FromMat(RotateAntiClockwise(strength).mul(this.heading));
    }

    avoid(point, elapsed_time, delta_time) {
        // if(this.rotateLock !== 0) return;
        var onLeft = point.onLeft(this.position, this.heading);
        var falloff = point.to(this.position).length / Boid.VISION_RADIUS;
        var adjustStrength = 1 - falloff * falloff;
        adjustStrength = Math.max(0, adjustStrength) * 1;
        if (onLeft) this.steerClockwise(adjustStrength);
        else this.steerAntiClockwise(adjustStrength);

        // if (this._uid === 1000) avoidPoints.push(point);
    }

    steerTowardsFlock(flockVector) {
        // if(this.rotateLock !== 0) return;
        if (this.heading.dot(flockVector) > 0.99) return;
        var onLeft = flockVector.onLeft(Vec2.ZERO, this.heading);
        var steerStrength = 1.5;
        if (onLeft) this.steerAntiClockwise(steerStrength);
        else this.steerClockwise(steerStrength);
    }

    steerTowardsPoint(point) {
        // if(this.rotateLock !== 0) return;
        var pointVec = this.position.to(point);
        if (pointVec.lengthSq < (0.00001)) return;
        var onLeft = pointVec.onLeft(Vec2.ZERO, this.heading);
        var steerStrength = 1.75;
        if (onLeft) this.steerAntiClockwise(steerStrength);
        else this.steerClockwise(steerStrength);
    }

    update(elapsed_time, delta_time) {
        this.position = this.position.add(this.heading.mul(delta_time * Boid.SPEED));
        this.transform.init(Matrix.MatInit(Mat2.Scale(0.1)));
        this.transform = new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))).mul(this.transform);

        // if (this._uid === 1000) this.position = mouseWorld;
    }

    scanEmptySpace(world) {
        const angleStep = (Math.PI / 180.0) * 5; // 5 degrees step
        const maxAngle = Math.PI; // Max angle to scan
        // Increment i per step and flip sign each iteration so the scanline increases in angle in opposite directions each time
        // i starts at 1 and angle at the step (1 * step) because there is no point in checking the front facing ray again since that is the ray that caused this scan in the first place
        for (var angleChange = angleStep, i = 1, sign = 1; Math.abs(angleChange) < maxAngle; angleChange = i * angleStep * sign, ++i) {
            // Calculate scanline
            var scanDirection = Vec2.FromMat(Mat2.Rotate(angleChange).mul(this.heading));
            var scanLine = new LineSegment(this.position, this.position.add(scanDirection.mul(this.frontRay.maxT)));

            // Find hit with world, if there is no hit with any obj then scanline is clear
            var hit = world.hit(scanLine);

            renderScanLines.push(scanLine);

            if (!hit) {
                return sign;
            }

            sign = -sign;
        }
        return 0; // Default direction to turn (0 is no turn)
    }

    interact(world, elapsed_time, delta_time) {
        // Loop around screen
        var p = this.position;
        if (p.y > world.positiveBoundary.y + EPSILON) this.position.y = world.negativeBoundary.y;
        if (p.y < world.negativeBoundary.y - EPSILON) this.position.y = world.positiveBoundary.y;
        if (p.x > world.positiveBoundary.x + EPSILON) this.position.x = world.negativeBoundary.x;
        if (p.x < world.negativeBoundary.x - EPSILON) this.position.x = world.positiveBoundary.x;

        var rayHit = world.hit(this.frontRay);
        if (!rayHit) {
            for (var i = 0; i < this.feelerRays.length; ++i) {
                if (world.hit(this.feelerRays[i])) {
                    rayHit = true;
                    break;
                }
            }
        }

        if (rayHit) {
            if (this.rotateLock === 0) {
                // Scan to find empty space
                var direction = this.scanEmptySpace(world);
                this.rotateLock = direction;
            }
        } else {
            this.rotateLock = 0;
            renderScanLines = [];
        }

        if (this.rotateLock != 0) {
            this.steerClockwise(this.rotateLock * 7);
        }
    }

    render() {
        if (!shadersLoaded) return;

        shaderProgram.use();
        shaderProgram.uniformVec("position", this.position);
        shaderProgram.uniformMat4("transform", this.transform);

        vao.bind();
        triangle.draw();
    }

    renderHeadingLine() {
        if (!shadersLoaded) return;

        shaderProgram.use();
        shaderProgram.uniformVec("position", this.position);
        shaderProgram.uniformMat4("transform", new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))));

        headingVao.bind();
        headingLine.draw();

        // genericShaderProgram.use();
        // genericLineVAO.bind();
        // genericLineBuffer.data = [];
        // // renderScanLines.forEach(l => {
        // //     genericLineBuffer.addVec(l.origin, l.endPoint);
        // // });
        // this.feelerRays.forEach(l => genericLineBuffer.addVec(l.origin, l.endPoint));
        // genericLineBuffer.bufferData();
        // genericLineBuffer.draw();

        // if (this._uid === 1000) {
        //     // Draw lines to avoid points
        //     genericShaderProgram.use();
        //     genericLineVAO.bind();
        //     genericLineBuffer.clear();
        //     avoidPoints.forEach(p => genericLineBuffer.addVec(this.position, p));
        //     genericLineBuffer.bufferData();
        //     genericLineBuffer.draw();

        //     avoidPoints = [];
        // }
    }

    equals(other) {
        return this._uid === other._uid;
    }
}

export { Boid, _make_triangle };