#version 300 es

precision mediump float;

out vec4 fragColor;

in vec2 tex;

uniform sampler2D framebuffer_texture;

void main(){
    fragColor = texture(framebuffer_texture, tex);
    // fragColor = vec4(tex, 0.0, 1.0);
}