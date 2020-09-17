import * as Boids from './boids/boid_canvas.js';

var canvas = document.getElementById('render-canvas');

window.BOIDS_PATH = '.';

Boids.setupBoidCanvas(canvas);

Boids.boid_main();