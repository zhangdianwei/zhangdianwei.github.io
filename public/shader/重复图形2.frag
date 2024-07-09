precision mediump float;

uniform vec2 u_resolution;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;
    st *= 3.0;

    vec2 c = fract(st);
    
    gl_FragColor = vec4(c, 0.0, 1.0);
}
