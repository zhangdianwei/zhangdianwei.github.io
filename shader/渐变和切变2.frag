precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = st.x*st.x*st.x-st.y;
    c = abs(c);
    c = smoothstep(0.005, 0.015, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
