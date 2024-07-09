precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    st *= 3.0;

    vec2 center = 0.5+floor(st);
    float c = distance(st, center)*2.0;
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
