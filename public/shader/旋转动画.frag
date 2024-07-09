precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st -= 0.5;
    float theta = mod(u_time, 6.28);
    st = mat2(cos(theta), sin(theta), -sin(theta), cos(theta)) * st; //构造了一个绕Z轴的旋转矩阵

    float c = st.x;
    c = abs(c);
    c = step(0.05, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}