import{k as z,x as W,G as Z}from"./trescientos-C4XzamHU.js";import{E as g,b,c as R}from"./index-CPSTaPT5.js";import{_ as $,r as p,A as M,f as q,w as J,z as v,o as _,h as T,j as t,e as n,a as D,F as I,x as E,d as a,t as L,k as C,u as P,p as K,l as O}from"./index-BvxA47Bm.js";const V=u=>(K("data-v-dc28537f"),u=u(),O(),u),Q=V(()=>a("TresPerspectiveCamera",{position:[0,0,5]},null,-1)),X=V(()=>a("TresAxesHelper",{args:[2]},null,-1)),Y=V(()=>a("TresBoxGeometry",{args:[2,2,2]},null,-1)),N=`
varying vec2 UV;
void main() {
    UV = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
}
`,j=`
void main() {
  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`,ee={__name:"ShaderFragBase",setup(u){const{onLoop:A}=Z(),x=[{name:"普通渐变",children:[{name:"普通渐变1",frag:`
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = st.x;
    gl_FragColor = vec4(c, c, c, 1.0);
}
`},{name:"普通渐变2",frag:`
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = 1.0-st.x-st.y; //写出渐变方程
    c = abs(c);
    gl_FragColor = vec4(c, c, c, 1.0);
}

                `},{name:"普通渐变3",frag:`
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = st.x*st.x*st.x-st.y; //写出渐变方程
    c = abs(c);
    gl_FragColor = vec4(c, c, c, 1.0);
}

                `},{name:"普通渐变4",frag:`
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = (st.x-0.5)*2.0;
    c = abs(c);
    gl_FragColor = vec4(0.0, c, 0.0, 1.0);
}
`},{name:"普通渐变5",frag:`
uniform vec2 u_resolution;
varying vec2 UV;
void main() {
    vec2 st = UV;
    float c = 1.0-distance(st, vec2(0.5))*1.0;
    gl_FragColor = vec4(0.0, c, c, 1.0);
}
`}]},{name:"渐变和切变，可以用于边缘平滑",children:[{name:"渐变和切变1",frag:`
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    
    float c = distance(st, vec2(0.5))*2.0;
    c = smoothstep(0.8, 0.9, c);
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
`},{name:"渐变和切变2",frag:`

uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    
    float c = st.x*st.x*st.x-st.y;
    c = abs(c);
    c = smoothstep(0.005, 0.015, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}

`},{name:"颜色混合(颜色渐变)",frag:`
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    
    float c = st.x*st.y;
    vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), c);
    
    gl_FragColor = vec4(color, 1.0);
}
`}]},{name:"重复图形",children:[{name:"重复图形1",frag:`
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st *= 3.0;

    vec2 c = floor(st)*0.5;
    
    gl_FragColor = vec4(c, 0.0, 1.0);
}

`},{name:"重复图形2",frag:`
uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st *= 3.0;

    vec2 c = fract(st);
    
    gl_FragColor = vec4(c, 0.0, 1.0);
}

`},{name:"重复图形3",frag:`

uniform vec2 u_resolution;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st *= 3.0;

    vec2 center = 0.5+floor(st);
    float c = distance(st, center)*2.0;
    
    gl_FragColor = vec4(c, c, c, 1.0);
}
`}]},{name:"简单动画",children:[{name:"平移动画",frag:`
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st.x -= fract(u_time*0.2)*2.0-1.0;

    float c = distance(st, vec2(0.5))*2.0;
    c = step(0.5, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
`},{name:"缩放动画",frag:`
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st -= 0.5;
    st /= sin(u_time);

    float c = distance(st, vec2(0.0))*2.0;
    c = step(1.0, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
`},{name:"旋转动画",frag:`
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 UV;
void main() {
    vec2 st = UV;
    st -= 0.5;
    float theta = mod(u_time, 6.28);
    st = mat2(cos(theta), sin(theta), -sin(theta), cos(theta)) * st; //构造了一个绕Z轴的旋转矩阵

    float c = st.x;
    c = abs(c);
    c = step(0.05, c);

    gl_FragColor = vec4(c, c, c, 1.0);
}
`}]}],d={u_time:{value:0},u_resolution:{value:{x:800,y:600}}};A(({elapsed:r})=>{d.u_time.value=r}),p(!0);const m=M(null),h=M(null),U=p(null);let y=null;const F=p(null);let k=null;q(()=>{const r=g.updateListener.of(c=>{if(c.docChanged){let e=m.value;if(!e)return;e.vertexShader=c.state.doc.toString(),e.needsUpdate=!0}});y=new g({doc:"",extensions:[b,R(),r],parent:U.value});const f=g.updateListener.of(c=>{if(c.docChanged){let e=m.value;if(!e)return;e.fragmentShader=c.state.doc.toString(),e.needsUpdate=!0}});k=new g({doc:"",extensions:[b,R(),f],parent:F.value}),d.u_resolution.value.x=h.value.clientWidth,d.u_resolution.value.y=h.value.clientHeight}),J(m,()=>{w(0,0)});function S(r){return r.trim()}function w(r,f){let e=x[r].children[f],s=e.vert?e.vert:N,l=e.frag?e.frag:j;s=S(s),l=S(l);let o=y,i=o.state.update({changes:{from:0,to:o.state.doc.length,insert:s}});o.dispatch(i),o=k,i=o.state.update({changes:{from:0,to:o.state.doc.length,insert:l}}),o.dispatch(i)}return(r,f)=>{const c=v("Button"),e=v("Card"),s=v("Col"),l=v("Divider"),o=v("Row");return _(),T(o,{gutter:16,class:"shader-layout"},{default:t(()=>[n(s,{xs:24,lg:5},{default:t(()=>[(_(),D(I,null,E(x,(i,G)=>n(e,{key:i.name,"dis-hover":"",class:"shader-menu"},{title:t(()=>[a("h3",null,L(i.name),1)]),default:t(()=>[(_(!0),D(I,null,E(i.children,(B,H)=>(_(),T(c,{key:B.name,long:"",onClick:te=>w(G,H)},{default:t(()=>[C(L(B.name),1)]),_:2},1032,["onClick"]))),128))]),_:2},1024)),64))]),_:1}),n(s,{xs:24,lg:9},{default:t(()=>[a("div",{ref_key:"tresCanvasParentRef",ref:h,class:"tresCanvasBorder"},[n(P(z),{"clear-color":"#FDF5E6"},{default:t(()=>[Q,X,a("TresMesh",null,[Y,a("TresShaderMaterial",{ref_key:"materialRef",ref:m,uniforms:d,vertexShader:N,fragmentShader:j},null,512)]),n(P(W))]),_:1})],512)]),_:1}),n(s,{xs:24,lg:10},{default:t(()=>[n(l,{orientation:"left"},{default:t(()=>[C("顶点着色器")]),_:1}),a("div",{ref_key:"codeContainerV",ref:U},null,512),n(l,{orientation:"left"},{default:t(()=>[C("片段着色器")]),_:1}),a("div",{ref_key:"codeContainerF",ref:F},null,512)]),_:1})]),_:1})}}},ce=$(ee,[["__scopeId","data-v-dc28537f"]]);export{ce as default};
