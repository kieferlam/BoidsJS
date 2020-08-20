#version 300 es

precision mediump float;

out vec4 fragColor;

in vec3 vexcol;

void main(){
    fragColor = vec4(vexcol, 1.0);
}