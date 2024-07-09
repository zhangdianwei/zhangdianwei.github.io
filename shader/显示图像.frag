precision mediump float;

uniform vec2 u_resolution; //(400, 400)
uniform sampler2D u_tex0; //myimg.png
uniform vec2 u_tex0Resolution; //(195, 270)

// 这个程序中没有使用顶点着色器，所以纹理坐标texCoord需要计算出来
// 实际项目中，纹理坐标都是在光栅化时由gpu插值得到的
vec4 drawMyImg(vec2 st)
{
    vec2 tex0st = u_tex0Resolution.xy/u_resolution.xy;
    vec2 texCoord = st/tex0st;

    vec4 color = texture2D(u_tex0, texCoord);

    if(texCoord.x<0.0 || texCoord.x>1.0 || texCoord.y<0.0 || texCoord.y>1.0){
        color = vec4(0.0);
    }

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    vec4 color = drawMyImg(st-vec2(0.25, 0.2));

    gl_FragColor = color;
}