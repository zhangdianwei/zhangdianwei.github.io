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

float drawFan(vec2 st, float radian)
{
    float stRadian = atan(st.y, st.x);
    if(stRadian>radian){
        return 1.0;
    }
    else{
        return 0.0;
    }
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st -= vec2(0.5, 0.5);

    vec4 color = drawMyImg(st);

    float ratio = abs(sin(u_time)); //[0, 1]

    float radian = ratio*2.0*3.14-3.14; //[-3.14, 3.14]
    float circle = drawFan(st, radian);

    color *= circle;
    gl_FragColor = color;
}