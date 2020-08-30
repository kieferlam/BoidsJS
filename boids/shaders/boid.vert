#version 300 es

layout (location=0) in vec4 vertex;

out vec3 vexcol;

uniform mat4 projection;

uniform vec3 position;

uniform mat4 transform;

void main(){

    vexcol = vec3(0.5);
    if(gl_VertexID == 0){
        vexcol = vec3(0.12, 0.3, 0.9);
    }else if(gl_VertexID == 1){
        vexcol = vec3(0.12, 0.4, 0.4);
    }else if(gl_VertexID == 2){
        vexcol = vec3(0.23, 0.8, 0.7);
    }

    vec4 translate = vec4(position, 0.0);

    gl_Position = projection * (translate + (transform * vec4(vertex.xy, 0.0, 1.0)));
}