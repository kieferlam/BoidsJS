#version 300 es

layout (location=0) in vec4 vertex;

layout(std140) uniform GlobalShared{
    mat4 projection;
};

uniform vec2 position;

uniform mat4 transform;

void main(){

    vec4 translate = vec4(position, 0.0, 0.0);

    gl_Position = projection * (translate + (transform * vec4(vertex.xy, 0.0, 1.0)));
}