precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x -= fract(u_time*0.2)*2.0-1.0;

    float c = distance(st, vec2(0.5))*2.0;
    c = step(0.5, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}