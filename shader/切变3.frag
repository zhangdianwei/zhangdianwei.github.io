#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = st.x*st.x*st.x-st.y;
    c = abs(c);
    c = step(0.01, c);
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
