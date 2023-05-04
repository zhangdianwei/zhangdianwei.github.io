precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

vec4 drawMyImg(vec2 st)
{
    vec2 tex0st = u_tex0Resolution.xy/u_resolution.xy;
    vec2 texCoord = st/tex0st;
    texCoord += 0.5;

    vec4 color = texture2D(u_tex0, texCoord);
    if(texCoord.x<0.0 || texCoord.x>1.0 || texCoord.y<0.0 || texCoord.y>1.0){
        color = vec4(0.0);
    }

    return color;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st -= vec2(0.5, 0.5);

    float scale = abs(sin(u_time))*0.2+0.8;

    vec4 light = drawMyImg(st*scale);
    light.rgb = vec3(light.a);
    light.rgb = vec3(1.0, 0.0, 0.0)*light.a;

    vec4 img = drawMyImg(st);

    vec4 color = vec4(img.rgb*img.a+light.rgb*(1.0-img.a), light.a);

    gl_FragColor = color;
}