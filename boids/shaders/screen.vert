#version 300 es

layout (location=0) in vec4 position;
layout (location=1) in vec2 tex_coord;

out vec2 tex;

void main(){
    const float r = 1.0;
    const float l = 0.0;
    const float t = 1.0;
    const float b = 0.0;
    const float n = 0.0;
    const float f = 1.0;

    const float rml = r-l;
    const float rpl = -(r+l)/rml;
    const float tmb = t-b;
    const float tpb = -(t+b)/tmb;
    const float fmn = f-n;
    const float fpn = -(f+n)/fmn;

    const mat4 ortho = transpose(mat4(
        vec4(2.0/rml, 0, 0, rpl),
        vec4(0, 2.0/tmb, 0, tpb),
        vec4(0, 0, -2.0/fmn, fpn),
        vec4(0, 0, 0, 1)
    ));

    tex = tex_coord;

    gl_Position = ortho * vec4(position.xyz, 1.0);
}