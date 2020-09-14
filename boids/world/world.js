import { LineBuffer } from "../geometry/databuffer.js";
import { Mat4 } from "../geometry/matrix.js";
import { Vec2, Vec3 } from "../geometry/primitive.js";
import { LineSegment } from "../geometry/ray.js";
import { VertexArrayObject } from "../globject/vao.js";
import * as Utils from '../util.js';

class WorldObject{
    rayHit(ray){
        throw new Error(`WorldObject rayHit abstract function is not implemented.`);
    }

    render(){
    }
}

class WorldBox extends WorldObject{
    constructor(pos, width, height){
        super();

        this.position = pos;

        var hw = width * 0.5;
        var hh = height * 0.5;

        this.lineSegments = [
            new LineSegment(pos.add(new Vec2(-hw, -hh)), pos.add(new Vec2(-hw, hh))), // left
            new LineSegment(pos.add(new Vec2(hw, -hh)), pos.add(new Vec2(hw, hh))), // right
            new LineSegment(pos.add(new Vec2(-hw, hh)), pos.add(new Vec2(hw, hh))), // top
            new LineSegment(pos.add(new Vec2(-hw, -hh)), pos.add(new Vec2(hw, -hh))), // bottom
        ];

        this.lineVAO = new VertexArrayObject();
        this.lineBuffer = new LineBuffer();
        
        this.lineSegments.forEach(line => this.lineBuffer.addVec(line.origin, line.endPoint));
        
        this.lineBuffer.bufferData();
        this.lineBuffer.vecAttributePointer(this.lineVAO);
    }

    rayHit(ray){
        for(var i = 0; i < this.lineSegments.length; ++i){
            if(Utils.LineSegmentIntersect(ray, this.lineSegments[i])) return true;
        }
        return false;
    }

    render(){
        if(!window.genericShaderProgram) return;

        genericShaderProgram.use();
        genericShaderProgram.uniformVec("position", Vec2.ZERO);
        genericShaderProgram.uniformMat4("transform", Mat4.IDENTITY);

        this.lineVAO.bind();
        this.lineBuffer.draw();
    }
}

class WorldWall extends WorldObject{
    constructor(p1, p2){
        super();

        this.p1 = p1;
        this.p2 = p2;

        this.lineSegment = new LineSegment(p1, p2);

        this.lineVAO = new VertexArrayObject();
        this.lineBuffer = new LineBuffer();
        this.lineBuffer.addVec(this.p1, this.p2);
        this.lineBuffer.bufferData();
        this.lineBuffer.vecAttributePointer(this.lineVAO);
    }

    rayHit(ray){
        return Utils.LineSegmentIntersect(ray, this.lineSegment);
    }

    render(){
        if(!window.genericShaderProgram) return;

        genericShaderProgram.use();
        genericShaderProgram.uniformVec("position", Vec2.ZERO);
        genericShaderProgram.uniformMat4("transform", Mat4.IDENTITY);

        this.lineVAO.bind();
        this.lineBuffer.draw();
    }
}

class World{
    constructor(negativeBoundary, positiveBoundary){
        this.objects = [];
        this.negativeBoundary = negativeBoundary;
        this.positiveBoundary = positiveBoundary;

        this.add(new WorldBox(new Vec2(0, 0), aspect * 2, 2.0));
    }

    add(obj){
        this.objects.push(obj);
    }

    hit(ray){
        for(var i = 0; i < this.objects.length; ++i){
            if(this.objects[i].rayHit(ray)) return true;
        }
        return false;
    }

    iterate(func){
        if(!(func instanceof Function)) throw new Error(`Invalid function.`);
        this.objects.forEach(func);
    }
}

export {World, WorldBox, WorldWall};