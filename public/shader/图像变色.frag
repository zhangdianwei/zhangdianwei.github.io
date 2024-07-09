precision mediump float;

uniform vec2 u_resolution; //(400, 400)
uniform float u_time;
uniform sampler2D u_tex0; //myimg.png
uniform vec2 u_tex0Resolution; //(195, 270)

vec4 drawMyImg(vec2 st)
{
    vec2 tex0st = u_tex0Resolution.xy/u_resolution.xy;
    vec2 texCoord = st/tex0st;
    texCoord += 0.5;

    vec4 color = texture2D(u_tex0, texCoord);

    vec2 bound = step(0.0, texCoord);
    bound *= 1.0-step(1.0, texCoord);
    color *= bound.x*bound.y;

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st *= 2.0;

    vec4 color  = drawMyImg(st-vec2(0.5, 0.5));
    vec4 colorR = drawMyImg(st-vec2(1.5, 0.5))*vec4(1.0, 0.0, 0.0, 1.0);
    vec4 colorG = drawMyImg(st-vec2(1.5, 1.5))*vec4(0.0, 1.0, 0.0, 1.0);
    vec4 colorB = drawMyImg(st-vec2(0.5, 1.5))*vec4(0.0, 0.0, 1.0, 1.0);
    color += colorR+colorG+colorB;

    gl_FragColor = color;
}