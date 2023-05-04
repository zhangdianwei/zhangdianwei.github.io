precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = (st.x-0.5)*2.0;
    c = abs(c);
    
    gl_FragColor = vec4(0.0, c, 0.0, 1.0);
}

