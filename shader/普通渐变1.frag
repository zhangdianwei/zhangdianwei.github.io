#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution; //接收外部传来的屏幕分辨率(500,500)

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution; //把像素坐标映射到[0,1]的范围内
    
    float c = st.x;
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
