#version 300 es

precision mediump float;

out vec4 fragColor;

uniform vec4 colour;

void main(){
    fragColor = colour;
}