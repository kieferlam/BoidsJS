import * as Boids from './boids/boid_canvas.js';

var canvas = document.getElementById('render-canvas');

Boids.setupBoidCanvas(canvas);

Boids.boid_main();