precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = step(0.5, st.x);
    
    gl_FragColor = vec4(c, c, c, 1.0);
}

