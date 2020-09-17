import {Framebuffer} from './framebuffer/framebuffer.js';
import {SimpleShaderProgram} from './shaders/shaderprogram.js';
import {VertexBuffer, QuadBuffer} from './geometry/databuffer.js';
import {Vec2} from './geometry/primitive.js';
import {VertexArrayObject} from './globject/vao.js';
import * as Boids from './boids.js';

let canvas;

const pError = document.getElementById("error");

var running = false;

var mainFramebuffer;

var screenRenderProgram;
var screenRenderQuad;
var screenRenderVAO;

// Error
window.error = function(errorMsg){
    pError.innerText = `Error: ${errorMsg}`;
    console.error(`Error: ${errorMsg}`);
}

const fetchScreenRenderShaders = [
    fetch('/boids/shaders/screen.vert').then(res => res.text()),
    fetch('/boids/shaders/screen.frag').then(res => res.text())
];
const createScreenRenderProgram = new Promise((resolve, reject) => Promise.all(fetchScreenRenderShaders).then(src => {
    screenRenderProgram = new SimpleShaderProgram(src[0], src[1]);
    screenRenderProgram.link();
    if(!screenRenderProgram.successful()){
        window.error(`Error linking shader program: ${screenRenderProgram.log()} - ${screenRenderProgram.shaderLog}`);
    }
    screenRenderProgram.uniform1i("framebuffer_tex", 0);
    resolve();
}).catch(err => reject(err)));

function setupBoidCanvas(c){
    canvas = c;
    window.gl = canvas.getContext("webgl2");
}

function resize_canvas(){
    var bounds = canvas.getBoundingClientRect();
    canvas.width = bounds.width;
    canvas.height = bounds.height;
}

function calcViewport(){
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function createMainFramebuffer(){
    const canvas_size = canvas.getBoundingClientRect();
    mainFramebuffer = new Framebuffer(canvas_size.width, canvas_size.height);
    screenRenderVAO.bindTexture(mainFramebuffer.texture, 0);
}

function initGL() {
    if (gl === null) {
        window.error("Unable to initialize WebGL. Your browser or machine may not support it.");
    }

    // Viewport
    calcViewport();

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Create quad buffer for the screen framebuffer texture
    screenRenderQuad = new QuadBuffer(new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1));

    // Create vertex array for the screen framebuffer rexture render
    screenRenderVAO = new VertexArrayObject();
    screenRenderQuad.vecAttributePointer(screenRenderVAO);
    
    // Create main framebuffer
    createMainFramebuffer();

    // Init boids
    Boids.resize(canvas.width, canvas.height);
    Boids.init();

    // Start
    Promise.all([
        createScreenRenderProgram
    ]).then(() => {
        running = true;
        window.requestAnimationFrame(main_loop);
    });
}

function handleError(errorCode){
    const errors = {
        [gl.NO_ERROR]: "NO_ERROR",
        [gl.INVALID_ENUM]: "INVALID_ENUM",
        [gl.INVALID_VALUE]: "INVALID_VALUE",
        [gl.INVALID_OPERATION]: "INVALID_OPERATION",
        [gl.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION",
        [gl.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
        [gl.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
    }
    var errorName = errors[errorCode];
    var errorMsg = `Error code: ${errorCode} - ${errorName}`;
    window.error(errorMsg);
}

window.update = function(elapsed_time, delta_time){
    Boids.update(elapsed_time, delta_time);
}

function renderContent(){
    mainFramebuffer.bind();
    gl.clearColor(0.1, 0.1, 0.12, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    Boids.render();

}

function renderToScreen(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    calcViewport();
    gl.clearColor(0, 0, 0.4, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    screenRenderProgram.use();

    screenRenderVAO.bind();
    screenRenderQuad.draw();

    gl.useProgram(null);
}

window.render = function(){
    renderContent();
    renderToScreen();
}

let main_loop_start_time;
let main_loop_prevous_time;
function main_loop(time){
    // Timing
    if(main_loop_start_time === undefined) main_loop_start_time = time;
    const elapsed_time = time - main_loop_start_time;
    if(main_loop_prevous_time === undefined) main_loop_prevous_time = elapsed_time;
    const delta_time = elapsed_time - main_loop_prevous_time;
    main_loop_prevous_time = elapsed_time;

    update(elapsed_time, delta_time);

    render();

    const errorCode = gl.getError();
    if(errorCode !== gl.NO_ERROR) return handleError(errorCode);
    window.requestAnimationFrame(main_loop);
}

function registerInputHandler(){
    canvas.addEventListener('mousemove', e => {
        // Normalize mouse coordinates
        var mousePos = new Vec2((e.offsetX / canvas.width) - 0.5, 1.0 - (e.offsetY / canvas.height) - 0.5).mul(2);
        Boids.mousemove(mousePos);
    });
}

function boid_main(){
    // Main
    resize_canvas();
    initGL();
    registerInputHandler();
}

export {setupBoidCanvas, boid_main}