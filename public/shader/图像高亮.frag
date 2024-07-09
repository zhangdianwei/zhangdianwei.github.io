precision mediump float;

uniform vec2 u_resolution; //(400, 400)
uniform float u_time;
uniform sampler2D u_tex0; //myimg.png
uniform vec2 u_tex0Resolution; //(195, 270)

vec4 drawMyImg(vec2 st)
{
    vec2 tex0st = u_tex0Resolution.xy/u_resolution.xy;
    vec2 texCoord = st/tex0st;
    texCoord += vec2(0.5);

    vec4 color = texture2D(u_tex0, texCoord);

    // 限制图像区域的第三种方式
    vec2 bound = step(0.0, texCoord);
    bound *= 1.0-step(1.0, texCoord);

    color *= bound.x*bound.y;

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st -= 0.5;

    vec4 color = drawMyImg(st);

    float scale = abs(sin(u_time)); //[0,1]
    scale *= 2.0; //[0,2]
    scale += 1.0; //[1,3]
    color.rgb *= scale;

    gl_FragColor = color;
}