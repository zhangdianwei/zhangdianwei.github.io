precision mediump float;

uniform vec2 u_resolution; //(400, 400)
uniform float u_time;
uniform sampler2D u_tex0; //myimg.png
uniform vec2 u_tex0Resolution; //(195, 270)

vec4 drawMyImg(vec2 st)
{
    vec2 tex0st = u_tex0Resolution.xy/u_resolution.xy;
    vec2 texCoord = st/tex0st;

    vec4 color = texture2D(u_tex0, texCoord);

    // 限制图像区域的第二种方式
    vec2 limit1 = 1.0-step(1.0, texCoord);
    vec2 limit2 = step(0.0, texCoord);
    vec2 limit = limit1*limit2;
    color = color*limit.x*limit.y;

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    vec4 color = drawMyImg(st-vec2(0.25, 0.2));

    float gray = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;

    gl_FragColor = vec4(gray, gray, gray, color.a);
}