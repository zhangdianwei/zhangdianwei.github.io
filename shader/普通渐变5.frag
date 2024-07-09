precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    
    float c = 1.0-distance(st, vec2(0.5))*2.0;
    
    gl_FragColor = vec4(0.0, c, c, 1.0);
}

