
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

export { ASYNC_CHECK_REJECT, ASYNC_CHECK_RETRY, ASYNC_CHECK_RESOLVE, asyncCheck, onceGL, FLOAT_BYTES, asyncNotNull, genID };