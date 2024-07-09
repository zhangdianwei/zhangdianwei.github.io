precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = distance(st, vec2(0.5))*2.0;
    c = step(0.8, c);
    
    gl_FragColor = vec4(c, c, c, 1.0);
}

