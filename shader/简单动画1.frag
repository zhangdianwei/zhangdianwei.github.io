#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;

float size = 0.4;

float hline(vec2 st){
    float c = smoothstep(size, size+0.01, st.y);
    c -= smoothstep(size+0.01, size+0.02, st.y);
    c += smoothstep(1.0-size-0.01, 1.0-size, st.y);
    c -= smoothstep(1.0-size, 1.0-size+0.01, st.y);
    return c;
}
float vline(vec2 st){
    float c = smoothstep(size, size+0.01, st.x);
    c -= smoothstep(size+0.01, size+0.02, st.x);
    c += smoothstep(1.0-size-0.01, 1.0-size, st.x);
    c -= smoothstep(1.0-size, 1.0-size+0.01, st.x);
    return c;
}
void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st -= vec2(0.5);
    float radian = mod(u_time, 3.14*2.0);
    st = mat2(cos(radian),-sin(radian),sin(radian),cos(radian))*st;
    st += vec2(0.5);
    vec3 color = vec3(hline(st)+vline(st));
    gl_FragColor = vec4(color,1.0);
}