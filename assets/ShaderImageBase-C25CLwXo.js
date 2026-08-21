import{N as H,k as q,x as z,G as $}from"./trescientos-CV9u1Bmp.js";import{E as g,b,c as B}from"./index-CPSTaPT5.js";import{_ as J,r as x,A as I,b as K,w as O,z as d,o as v,k as R,g as o,e as l,a as W,F as M,q as T,f as r,t as N,h,u as E,p as Q,j as X}from"./index-Bmwy271O.js";const C=f=>(Q("data-v-550b1763"),f=f(),X(),f),Y=C(()=>r("TresPerspectiveCamera",{position:[0,0,5]},null,-1)),Z=C(()=>r("TresAxesHelper",{args:[2]},null,-1)),ee=C(()=>r("TresBoxGeometry",{args:[2,3.6,2]},null,-1)),L=`
varying vec2 UV;
void main() {
    UV = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
}
`,P=`
void main() {
  gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
}
`,te={__name:"ShaderImageBase",setup(f){const{onLoop:j}=$(),V=[{name:"显示图像",children:[{name:"显示图像",frag:`
varying vec2 UV;
uniform sampler2D u_tex0;
void main() {
    vec4 color = texture2D(u_tex0, UV);
    gl_FragColor = color;
}
`},{name:"图像变色",frag:`
varying vec2 UV;
uniform sampler2D u_tex0;
uniform float u_time;
void main() {
    vec4 color = texture2D(u_tex0, UV);
    float scale = abs(sin(u_time));
    scale *= 1.5;
    color.rgb *= scale;
    gl_FragColor = color;
}
`},{name:"图像置灰",frag:`
varying vec2 UV;
uniform sampler2D u_tex0;
uniform float u_time;
void main() {
    vec4 color = texture2D(u_tex0, UV);
    float gray = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    gl_FragColor = vec4(gray, gray, gray, color.a);
}
`},{name:"图像描边",frag:`
varying vec2 UV;
uniform sampler2D u_tex0;
uniform float u_time;

void main() {
    vec4 self = texture2D(u_tex0, UV);

    if(self.a>0.5){
        gl_FragColor = self;
        return;
    }

    float outlineW = abs(sin(u_time))*0.01;
    // outlineW = 0.01;

    int strokeCount = 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x-outlineW, UV.y)).a>0.0 ? 1 : 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x+outlineW, UV.y)).a>0.0 ? 1 : 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x, UV.y-outlineW)).a>0.0 ? 1 : 0;
    strokeCount += texture2D(u_tex0, vec2(UV.x, UV.y+outlineW)).a>0.0 ? 1 : 0;

    if (strokeCount>0){
        self.rgb = vec3(1.0, 0.0, 1.0);
        self.a = 1.0;
    }

    gl_FragColor = self;
}
`}]}],c={u_time:{value:0},u_resolution:{value:{x:800,y:600}},u_tex0:{value:null}};j(({elapsed:n})=>{c.u_time.value=n}),x(!0);const m=I(null),p=I(null),y=x(null);let k=null;const U=x(null);let D=null;K(()=>{const n=g.updateListener.of(t=>{if(t.docChanged){let e=m.value;if(!e)return;e.vertexShader=t.state.doc.toString(),e.needsUpdate=!0}});k=new g({doc:"",extensions:[b,B(),n],parent:y.value});const _=g.updateListener.of(t=>{if(t.docChanged){let e=m.value;if(!e)return;e.fragmentShader=t.state.doc.toString(),e.needsUpdate=!0}});D=new g({doc:"",extensions:[b,B(),_],parent:U.value}),c.u_resolution.value.x=p.value.clientWidth,c.u_resolution.value.y=p.value.clientHeight,H({map:"img/img1.png"}).then(t=>{c.u_tex0.value=t.map})}),O(m,()=>{S(0,0)});function F(n){return n.trim()}function S(n,_){let e=V[n].children[_],s=e.vert?e.vert:L,u=e.frag?e.frag:P;s=F(s),u=F(u);let a=k,i=a.state.update({changes:{from:0,to:a.state.doc.length,insert:s}});a.dispatch(i),a=D,i=a.state.update({changes:{from:0,to:a.state.doc.length,insert:u}}),a.dispatch(i)}return(n,_)=>{const t=d("Button"),e=d("Card"),s=d("Col"),u=d("Divider"),a=d("Row");return v(),R(a,{gutter:16,class:"shader-layout"},{default:o(()=>[l(s,{xs:24,lg:5},{default:o(()=>[(v(),W(M,null,T(V,(i,A)=>l(e,{key:i.name,"dis-hover":"",class:"shader-menu"},{title:o(()=>[r("h3",null,N(i.name),1)]),default:o(()=>[(v(!0),W(M,null,T(i.children,(w,G)=>(v(),R(t,{key:w.name,long:"",onClick:oe=>S(A,G)},{default:o(()=>[h(N(w.name),1)]),_:2},1032,["onClick"]))),128))]),_:2},1024)),64))]),_:1}),l(s,{xs:24,lg:9},{default:o(()=>[r("div",{ref_key:"tresCanvasParentRef",ref:p,class:"tresCanvasBorder"},[l(E(q),{"clear-color":"#FDF5E6"},{default:o(()=>[Y,Z,r("TresMesh",null,[ee,r("TresShaderMaterial",{ref_key:"materialRef",ref:m,uniforms:c,vertexShader:L,fragmentShader:P},null,512)]),l(E(z))]),_:1})],512)]),_:1}),l(s,{xs:24,lg:10},{default:o(()=>[l(u,{orientation:"left"},{default:o(()=>[h("顶点着色器")]),_:1}),r("div",{ref_key:"codeContainerV",ref:y},null,512),l(u,{orientation:"left"},{default:o(()=>[h("片段着色器")]),_:1}),r("div",{ref_key:"codeContainerF",ref:U},null,512)]),_:1})]),_:1})}}},le=J(te,[["__scopeId","data-v-550b1763"]]);export{le as default};
