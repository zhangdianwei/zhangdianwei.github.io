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

float drawCircle(vec2 st, float radius)
{
    float stRadius = distance(st, vec2(0.0))*2.0;
    return 1.0-smoothstep(radius-0.1, radius, stRadius);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st -= vec2(0.5, 0.5);

    float radius = abs(sin(u_time*0.5)); //[0, 0.8]
    float circle = drawCircle(st, radius);

    vec4 color = drawMyImg(st)*radius;
    color *= circle;

    vec4 front = vec4(0.7, 0.2, 0.2, 1.0);
    front *= 1.0-circle;
    front.a = 1.0;

    color += front;

    gl_FragColor = color;
}