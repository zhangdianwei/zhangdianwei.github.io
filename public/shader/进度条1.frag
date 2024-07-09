precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

vec4 drawMyImg(vec2 st, float ratio)
{
    vec2 tex0st = u_tex0Resolution.xy/u_resolution.xy;
    vec2 texCoord = st/tex0st;

    vec4 color = texture2D(u_tex0, texCoord);
    if(texCoord.x<0.0 || texCoord.x>1.0 || texCoord.y<0.0 || texCoord.y>1.0){
        color = vec4(0.0);
    }
    else if (texCoord.y>ratio){
        color = vec4(0.0);
    }

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    float ratio = sin(u_time);
    ratio = abs(ratio);
    vec4 color = drawMyImg(st-vec2(0.25, 0.2), ratio);

    gl_FragColor = color;
}