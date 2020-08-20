#version 300 es

layout (location=0) in vec4 position;

out vec3 vexcol;

uniform mat4 mvp;

void main(){

    vexcol = vec3(0.5);
    if(gl_VertexID == 0){
        vexcol = vec3(1.0, 0.8, 0.0);
    }else if(gl_VertexID == 1){
        vexcol = vec3(0.5, 0.2, 0.2);
    }else if(gl_VertexID == 2){
        vexcol = vec3(0.1, 0.7, 0.6);
    }else if(gl_VertexID == 3){
        vexcol = vec3(0.1, 0.2, 0.6);
    }

    gl_Position = mvp * vec4(position.xy, 0.0, 1.0);
}