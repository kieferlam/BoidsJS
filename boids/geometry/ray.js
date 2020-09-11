
class Ray{
    constructor(origin, direction, maxT = -1){
        this.origin = origin.copy();
        this.direction = direction.copy();
        this.maxT = maxT;
    }

    get endPoint(){
        return this.origin.add(this.direction.mul(this.maxT));
    }
}

class LineSegment extends Ray{
    constructor(p1, p2){
        let vector = p1.to(p2);
        super(p1, vector.normal(), vector.length);
    }
}

export {Ray, LineSegment};