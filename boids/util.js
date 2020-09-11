import { Mat4 } from "./geometry/matrix.js";
import { Vec2 } from "./geometry/primitive.js";

window.EPSILON = 0.0001;

const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;

const ASYNC_CHECK_REJECT = 0;
const ASYNC_CHECK_RESOLVE = 1;
const ASYNC_CHECK_RETRY = 2;
const asyncNotNull = function (...args) {
    return function () {
        args.forEach(arg => { if (!arg) return ASYNC_CHECK_RETRY; });
        return ASYNC_CHECK_RESOLVE;
    }
}
function asyncCheck(func, tries = 5, timeout = 1) {
    var check = function (resolve, reject, func, numTries = tries) {
        const returnval = func();
        switch (returnval) {
            case ASYNC_CHECK_RESOLVE:
                return resolve();
            case ASYNC_CHECK_REJECT:
                return reject(new Error("Function returned reject"));
            default:
            case ASYNC_CHECK_RETRY:
                if (numTries === 0) return reject(new Error(`Promise rejected: retry limit reached (${tries})`));
                setTimeout(check, timeout, resolve, reject, func, numTries - 1);
                break;
        }
    }
    return new Promise((resolve, reject) => setTimeout(check, timeout, resolve, reject, func, tries));
}

function onceGL(func) {
    asyncCheck(() => window.gl ? ASYNC_CHECK_RESOLVE : ASYNC_CHECK_RETRY, -1, 1).then(() => func());
}

let uidCount = 0;
function genID(){
    return 1000 + uidCount++;
}

function LineSegmentIntersect(ray, line){
    var p = ray.origin;
    var r = ray.direction.mul(ray.maxT);
    var q = line.origin;
    var s = line.direction.mul(line.maxT);

    var pq = p.to(q);
    // Collinear checks
    var rxs = r.cross(s);
    var q_p_xr = pq.cross(r);

    // Find intersect t and u
    var t = pq.cross(s) / rxs;
    var u = (q.to(p).cross(r)) / (s.cross(r));

    var rxs0 = Math.abs(rxs) < 0.0001;
    var q_p_xr0 = Math.abs(q_p_xr) < 0.0001;

    // Collinear
    if(rxs0 && q_p_xr0){
        var rr = r.dot(r);
        var t0 = pq.dot(r) / rr;
        var t1 = t0 + s.dot(r) / rr;

        // If interval t0,t1 overlaps [0,1] then line segments overlap and are collinear otherwise they are collinear but disjoint
        var min = Math.min(t0, t1);
        var max = Math.max(t0, t1);

        if(min > 1 || max < 0) return false;
        return true;
    }

    // Line segments are parallel and non-intersecting
    if(rxs0 && !q_p_xr0) return false;

    if(!rxs0 && t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;

    return false;
}

export { ASYNC_CHECK_REJECT, ASYNC_CHECK_RETRY, ASYNC_CHECK_RESOLVE, asyncCheck, onceGL, FLOAT_BYTES, asyncNotNull, genID, LineSegmentIntersect};