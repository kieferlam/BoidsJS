import {Vec2, Vec3, Vec4, VEC2_ZERO} from '../geometry/primitive.js';
import {Mat4, Mat2, Matrix} from '../geometry/matrix.js';
import {TriangleBuffer, LineBuffer, VertexBuffer} from '../geometry/databuffer.js';
import {VertexArrayObject} from '../globject/vao.js';

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
// Instancing
var matrices = null;
var positions = null;

var headingVao = null;
var headingLine = null;

const RotateSpeed = 0.01;
var RotateAntiClockwise = (strength) => new Mat4(Matrix.MatInit(Mat2.Rotate(-RotateSpeed * strength)));
var RotateClockwise = (strength) => new Mat4(Matrix.MatInit(Mat2.Rotate(RotateSpeed * strength)));

class Boid{
    constructor(x = 0, y = 0){
        this.position = new Vec3(x, y);
        this.heading = new Vec3(Math.random() - 0.5, Math.random() - 0.5).normal();

        this.transform = new Mat4();
        this.transform.init(Matrix.MatInit(Mat2.Scale(0.1)));
        this.transform = new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))).mul(this.transform);
        
        const gl = window.gl;
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

    static get SPEED(){
        return 0.0005;
    }

    static get VISION_RADIUS(){
        return 0.3 * 0.3;
    }

    static get VISION_ANGLE(){
        return 1.75;
    }

    avoid(point, elapsed_time, delta_time){
        var onLeft = point.onLeft(this.position, this.heading);
        var adjustStrength = 1 - (point.to(this.position).lengthSq / Boid.VISION_RADIUS);
        adjustStrength = Math.max(0, adjustStrength) * 3;
        this.heading = Vec4.FromMat(onLeft ? RotateClockwise(adjustStrength).mul(Vec4.From(this.heading)) : RotateAntiClockwise(adjustStrength).mul(Vec4.From(this.heading))).xyz;
    }

    steerTowardsFlock(flockVector){
        var onLeft = flockVector.onLeft(VEC2_ZERO, this.heading);
        var steerStrength = 2.0;
        this.heading = Vec4.FromMat(onLeft ? RotateAntiClockwise(steerStrength).mul(Vec4.From(this.heading)) : RotateClockwise(steerStrength).mul(Vec4.From(this.heading))).xyz;
    }

    steerTowardsPoint(point){
        var pointVec = this.position.to(point);
        var onLeft = pointVec.onLeft(VEC2_ZERO, this.heading);
        var steerStrength = 3.0;
        this.heading = Vec4.FromMat(onLeft ? RotateAntiClockwise(steerStrength).mul(Vec4.From(this.heading)) : RotateClockwise(steerStrength).mul(Vec4.From(this.heading))).xyz;
    }

    update(elapsed_time, delta_time){
        this.position = this.position.add(this.heading.mul(delta_time * Boid.SPEED));
        this.transform.init(Matrix.MatInit(Mat2.Scale(0.1)));
        this.transform = new Mat4(Matrix.MatInit(Mat2.Rotate(this.heading.angle() - Math.PI * 0.5))).mul(this.transform);
    }

    render(shaderProgram){
        shaderProgram.uniformVec("position", this.position);
        shaderProgram.uniformMat4("transform", this.transform);

        vao.bind();
        triangle.draw();

        headingVao.bind();
        // headingLine.draw();
    }
}

export {Boid};