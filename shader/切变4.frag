precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = mod(st.x, 0.2);
    c = step(0.1, c);
    
    gl_FragColor = vec4(c, c, c, 1.0);
}

