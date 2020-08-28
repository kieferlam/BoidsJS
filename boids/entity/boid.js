import {Vec2, Vec3, Vec4, VEC2_ZERO} from '../geometry/primitive.js';
import {Mat4, Mat2, Matrix} from '../geometry/matrix.js';
import {TriangleBuffer} from '../geometry/databuffer.js';
import {VertexArrayObject} from '../globject/vao.js';

function _make_triangle(){
    const baseWidth = 0.5;
    const height = 0.75;
    const v1 = new Vec2(-baseWidth * 0.5, -height * 0.5);
    const v2 = new Vec2(baseWidth * 0.5, -height * 0.5);
    const v3 = new Vec2(0, height * 0.5);
    return new TriangleBuffer(v1, v2, v3);
}

var vao = null;
var triangle = null;

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
            if(!vao || !triangle){
                vao = new VertexArrayObject();
                triangle = _make_triangle();

                triangle.vecAttributePointer(vao);
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
        return 1.5;
    }

    avoid(boid, elapsed_time, delta_time){
        var onLeft = boid.position.onLeft(this.position, this.heading);
        var adjustStrength = 1 - boid.position.to(this.position).length;
        adjustStrength = Math.max(0, adjustStrength);
        this.heading = Vec4.FromMat(onLeft ? RotateClockwise(adjustStrength).mul(Vec4.From(this.heading)) : RotateAntiClockwise(adjustStrength).mul(Vec4.From(this.heading))).xyz;
    }

    steerTowardsFlock(flockVector){
        var onLeft = flockVector.onLeft(VEC2_ZERO, this.heading);
        this.heading = Vec4.FromMat(onLeft ? RotateAntiClockwise(1.0).mul(Vec4.From(this.heading)) : RotateClockwise(1.0).mul(Vec4.From(this.heading))).xyz;
    }

    steerTowardsPoint(point){
        var onLeft = point.onLeft(VEC2_ZERO, this.heading);
        this.heading = Vec4.FromMat(onLeft ? RotateAntiClockwise(1.0).mul(Vec4.From(this.heading)) : RotateClockwise(1.0).mul(Vec4.From(this.heading))).xyz;
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
    }
}

export {Boid};