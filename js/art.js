/* Titan-Ville — dessins. Tout est du SVG produit en chaînes, sans DOM.
   Chaque espèce se dessine dans une boîte 320 x 230, pieds sur y = 190, centrée sur x = 160, tournée vers la droite.
   draw(st) : st = 1 bébé, 2 enfant, 3 ado, 4 titan. Les jeunes ont la tête plus grosse, le corps tassé,
   moins de piquants et des membres plus courts ; chaque partie est mise à l'échelle autour de son attache.
   Les parties mobiles portent une classe que app.css anime :
   pa/pb pattes qui alternent, pc/pd pattes qui se lèvent, qu queue, te tête, br/bs bras ou arme, ai/aj ailes,
   co cou, oa/ob anneaux, ta/tb tentacules, fl flottement, fa fanal, oe œil qui cligne. */
(function(){
const TV=window.TV=window.TV||{};
const f=n=>(+n).toFixed(1),f2=n=>(+n).toFixed(2);
const BODY='#020304',RIM='#8898ac',OS='#cfc8b8',FAR='#1a2029';
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const grp=(c,el,x='')=>`<g fill="${c}" stroke="${c}" stroke-width="0" stroke-linecap="round" stroke-linejoin="round" ${x}>${el}</g>`;
const sil=(el,r=1.6,c=BODY)=>grp(RIM,el,`transform="translate(${-r},${-r*.7})"`)+grp(c,el);
/* .lm = ce qui luit : son opacité suit la variable --gl (la lueur sert de jauge de vie) */
const lum=(el,c,o=.8)=>grp(c,el,`class="lm" opacity="${o}" filter="url(#b5)"`)+grp(c,el,'class="lm"');
const halo=(el,c,o=.5)=>grp(c,el,`class="lm" opacity="${o}" filter="url(#b12)"`);
/* P : met une partie à l'échelle autour du point (px,py) ; W : tasse toute la bête autour de ses pieds ;
   K : partie mobile, avec son point d'attache (ox,oy) dans le repère du dessin */
const P=(el,s,px,py,dx=0,dy=0,sy)=>`<g transform="translate(${f(px+dx)},${f(py+dy)}) scale(${f2(s)},${f2(sy==null?s:sy)}) translate(${-px},${-py})">${el}</g>`;
const W=(i,sx,sy,dx,el)=>P(el,sx[i],160,190,dx?dx[i]:0,0,sy[i]);
const K=(c,el,ox,oy)=>`<g class="${c}"${ox==null?'':` style="transform-origin:${f(ox)}px ${f(oy)}px"`}>${el}</g>`;

/* ---------- le saurien, paramétré par stade ---------- */
const ST=[null,
 {bw:30,bh:36,lh:13,lw:11,hr:14,sn:.6,tl:46,lean:10,np:4,ps:7,eye:.15,teeth:2,k:2.05,x:176},
 {bw:36,bh:52,lh:22,lw:13,hr:14.5,sn:.85,tl:78,lean:16,np:6,ps:11,eye:.13,teeth:3,k:1.6,x:186},
 {bw:42,bh:68,lh:32,lw:15,hr:14.5,sn:1.05,tl:112,lean:22,np:8,ps:16,eye:.11,teeth:4,k:1.3,x:196},
 {bw:56,bh:88,lh:40,lw:20,hr:15.5,sn:1.2,tl:150,lean:27,np:10,ps:23,eye:.1,teeth:5,k:1.06,x:200}];
function saurien(st){
 const p=ST[st],c='#ff6a2a',rim=1.5/p.k;
 const rx=p.bw/2,ry=p.bh/2,a=p.lean*Math.PI/180,cy=-(p.lh*.8+ry);
 const rot=(x,y)=>[x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)];
 const T0=rot(0,-ry),hc=[T0[0]+p.hr*.55,T0[1]-p.hr*.3];
 const X=.6+p.sn*1.2,U=[X-.05,-.02],L=[X-.25,.5];
 const htr=`translate(${f(hc[0])},${f(hc[1])}) rotate(14) scale(${p.hr})`;
 const TE=el=>K('te',el,hc[0]-p.hr*.7,hc[1]+p.hr*.6);
 const head=`<path transform="${htr}" d="M-1,0C-1,-.9 -.1,-1.1 .5,-.85L${f2(X-.2)},-.5C${f2(X+.1)},-.42 ${f2(X+.15)},-.12 ${f2(U[0])},${f2(U[1])}L.7,.14L${f2(L[0])},${f2(L[1])}C${f2(X-.2)},.68 ${f2(X-.5)},.78 ${f2(X-.7)},.74L0,.9C-.7,.92 -1,.5 -1,0ZM-.1,-1L-1.05,-1.5L-.7,-.6ZM-.6,-.75L-1.5,-1L-1,-.3Z"/>`;
 const neck=`<ellipse transform="translate(${f((T0[0]+hc[0])/2-p.hr*.2)},${f((T0[1]+hc[1])/2+p.hr*.35)}) rotate(${p.lean})" rx="${f(p.hr*.9)}" ry="${f(p.hr*1.15)}"/>`;
 const S=rot(-rx*.8,ry*.3),bx=-rx*.45,tip=[bx-p.tl,-p.tl*.06];
 const QU=el=>K('qu',el,S[0]+rx*.3,S[1]+ry*.2);
 const c1=[S[0]-p.tl*.3,S[1]*.45],c2=[tip[0]+p.tl*.35,tip[1]-p.tl*.1-3];
 const tail=`<path d="M${f(S[0])},${f(S[1])}C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(tip[0])},${f(tip[1])}C${f(tip[0]+p.tl*.3)},1 ${f(bx-p.tl*.25)},0 ${f(rx*.2)},${f(-p.lh*.3)}Z"/>`;
 const leg=lx=>`<ellipse cx="${f(lx)}" cy="${f(-p.lh*.78)}" rx="${f(p.lw*.8)}" ry="${f(p.lh*.55)}"/><path d="M${f(lx-p.lw*.5)},${f(-p.lh*.5)}H${f(lx+p.lw*.42)}L${f(lx+p.lw*.5)},${f(-p.lh*.22)}L${f(lx+p.lw*1.2)},${f(-p.lh*.17)}L${f(lx+p.lw*1.8)},0H${f(lx-p.lw*.55)}Z"/>`;
 const A=rot(rx*.8,-ry*.4);
 const arm=`<path transform="translate(${f(A[0])},${f(A[1])}) rotate(${f(p.lean*.4)}) scale(${p.bw})" d="M-.14,-.1L.3,.16L.55,.02L.74,0L.62,.08L.8,.12L.63,.16L.74,.26L.52,.2L.32,.36L-.16,.14Z"/>`;
 const torso=`<ellipse transform="translate(0,${f(cy)}) rotate(${p.lean})" rx="${f(rx)}" ry="${f(ry)}"/>`;
 const pls=[],n1=p.np,n2=Math.max(2,Math.round(p.np*.6));
 for(let i=0;i<n1;i++){const th=(-.6-.62*i/(n1-1))*Math.PI,q=rot(rx*Math.cos(th),ry*Math.sin(th));
  pls.push([q[0],q[1],Math.atan2(q[1]-cy,q[0])*180/Math.PI+90+(i%3-1)*7,p.ps*(.5+.5*Math.sin(Math.PI*(i+.6)/n1))*(i%2?1.18:.84)]);}
 const bz=t=>{const u=1-t;return[u*u*u*S[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*tip[0],u*u*u*S[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*tip[1]]};
 for(let i=0;i<n2;i++){const t=.16+.5*i/(n2-1),q=bz(t);pls.push([q[0],q[1],-14+(i%2?6:-5),p.ps*(.62-.38*i/(n2-1))]);}
 const pl=q=>{const s=q[3];return `<path transform="translate(${f(q[0])},${f(q[1])}) rotate(${f(q[2])}) translate(0,${f(s*.3)})" d="M${f(-s*.6)},0L${f(-s*.3)},${f(-s*.8)}L${f(-s*.05)},${f(-s*1.6)}L${f(s*.3)},${f(-s*.75)}L${f(s*.6)},0Z"/>`};
 const plate=pls.slice(0,n1).map(pl).join('')+QU(pls.slice(n1).map(pl).join(''));   // les plaques de la queue suivent la queue
 let teeth='';
 for(let i=1;i<=p.teeth;i++){const t=.3+.65*i/p.teeth,v=t-.06;
  const ux=.7+(U[0]-.7)*t,uy=.14+(U[1]-.14)*t,lx=.7+(L[0]-.7)*v,ly=.14+(L[1]-.14)*v;
  teeth+=`M${f2(ux-.06)},${f2(uy)}L${f2(ux-.01)},${f2(uy+.17)}L${f2(ux+.05)},${f2(uy)}ZM${f2(lx-.06)},${f2(ly)}L${f2(lx)},${f2(ly-.15)}L${f2(lx+.05)},${f2(ly)}Z`;}
 const ex=hc[0]+p.hr*.42,ey=hc[1]-p.hr*.3,er=p.hr*p.eye,C=rot(rx*.35,-ry*.05);
 return `<g transform="translate(${p.x},190) scale(${p.k})"><g class="lm"><g fill="${c}" opacity=".75" filter="url(#b2)">${plate}</g><g fill="url(#pl-braise)">${plate}</g></g>`
  +sil(QU(tail)+K('pa',leg(-rx*.55),-rx*.55,-p.lh)+torso+neck+TE(head)+K('pb',leg(rx*.05),rx*.05,-p.lh)+K('br',arm,A[0],A[1]),rim)
  +`<g class="lm"><ellipse cx="${f(C[0])}" cy="${f(C[1])}" rx="${f(rx*.4)}" ry="${f(ry*.5)}" fill="${c}" opacity=".17" filter="url(#b2)"/>`
  +TE(`<g transform="${htr}"><path d="M.7,.14L${f2(U[0])},${f2(U[1])}L${f2(L[0])},${f2(L[1])}Z" fill="${c}" opacity=".85"/></g>`
   +K('oe',`<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(er*1.5)}" fill="${c}" opacity=".4"/><ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(er*1.25)}" ry="${f(er*.45)}" fill="#ffd9a8" transform="rotate(24 ${f(ex)} ${f(ey)})"/>`,ex,ey))+`</g>`
  +TE(`<g transform="${htr}"><path d="${teeth}" fill="${OS}"/></g>`)+`</g>`;
}

/* ---------- les douze espèces ---------- */
/* m : multiplicateurs d'usure des jauges (f faim, e énergie, p propreté, r rage) */
const SP=[
{id:'saurien',n:"Le Saurien",k:"Bipède à plaques",c:"#ff6a2a",m:{f:1,e:1,p:1,r:1},
 d:"Dos voûté, crête, griffes, une rangée de plaques qui rougeoie.",
 s:"L'espèce de référence, sans exigence particulière.",
 draw:st=>saurien(st)},

{id:'colosse',n:"Le Colosse",k:"Bipède voûté",c:"#f2d03b",m:{f:1.1,e:1,p:1,r:1.7},
 d:"Une brute qui marche sur les poings. Petite tête, épaules énormes, le dos fendu de lumière.",
 s:"Colérique. Sa rage monte vite : il faut le laisser frapper souvent.",
 draw:st=>{const i=st-1,c="#f2d03b",H=el=>P(K('te',el,192,100),[1.5,1.3,1.12,1][i],190,98),
  cr=['M116,72l14,12l-4,14l16,8','M196,128l10,14l-4,16','M160,60l6,16l14,4','M132,112l10,10'];
  return W(i,[.86,.91,.96,1],[.8,.87,.94,1],null,
   sil(P(`<path d="M118,62L110,36L132,54ZM140,50L146,22L160,48ZM166,50L182,30L184,58Z"/>`,[.3,.55,.8,1][i],150,86)
    +`<ellipse cx="118" cy="142" rx="36" ry="34"/><ellipse transform="rotate(-15 150 98)" cx="150" cy="98" rx="64" ry="50"/>`
    +K('pa',`<path d="M98,140L92,190H134L138,152Z"/>`,116,144)+K('pb',`<path d="M128,150L130,190H156L150,150Z"/>`,140,150)
    +K('pa',`<path d="M150,95C176,118 180,150 178,168L186,190H150V166C146,140 136,126 130,116Z"/>`,148,104)
    +H(`<ellipse cx="206" cy="90" rx="21" ry="18"/><path d="M196,96L234,98L229,115L200,112Z"/>`)
    +K('pb br',`<path d="M168,82C216,82 234,128 230,164L240,190H196V166C196,140 180,126 160,120Z"/>`,176,94))
   +lum(`<path d="${cr.slice(0,st).join('')}" fill="none" stroke-width="2"/>`+H(K('oe',`<ellipse cx="214" cy="87" rx="4.5" ry="1.8"/>`,214,87)),c)
   +H(`<path d="M206,98l3,-6l3,6ZM215,98l3,-7l3,7ZM224,99l2,-6l3,6Z" fill="${OS}"/>`))}},

{id:'leviathan',n:"Le Léviathan",k:"Serpent de mer",c:"#35e0c2",m:{f:1,e:1,p:.3,r:1},
 d:"On n'en voit jamais plus que trois anneaux et une tête. Le reste est sous la surface.",
 s:"Ne se salit presque jamais. Les bateaux sont son plat préféré.",
 draw:st=>{const i=st-1,c="#35e0c2",fs=[.45,.62,.82,1][i],H=el=>P(K('te',el,248,72),[1.45,1.28,1.12,1][i],252,66),CO=el=>K('co',el,224,188);
  const fa=P(`<path d="M58,136L66,114L74,132ZM76,134L86,118L88,140Z"/>`,fs,72,142),fb=P(`<path d="M138,114L146,82L156,106ZM158,104L168,76L176,106ZM176,110L190,90L190,120Z"/>`,fs,164,122),fc=P(`<path d="M224,124L202,108L226,138ZM232,98L212,80L238,110Z"/>`,fs,232,116);
  return W(i,[.9,.94,.97,1],[.7,.8,.92,1],[-48,-22,0,0],
   lum((st>=2?K('oa',fa):'')+K('ob',fb)+CO(fc),c,.7)
   +sil((st>=3?K('qu',`<path d="M6,186C8,150 22,142 32,156" fill="none" stroke-width="6"/>`,32,160):'')+(st>=2?K('oa',`<path d="M40,190C46,118 92,118 100,190" fill="none" stroke-width="15"/>`):'')
    +K('ob',`<path d="M118,190C128,96 186,96 196,190" fill="none" stroke-width="21"/>`)
    +CO(`<path d="M222,190C212,130 226,84 258,60" fill="none" stroke-width="23"/>`+H(`<path d="M244,66L258,30L304,42L298,54L272,58L296,68L272,80L250,78Z"/>`+P(`<path d="M252,40L236,16L264,34Z"/>`,[.4,.6,.85,1][i],254,38))))
   +lum(CO(H(`<path d="M272,58L298,54L296,68Z"/>`+K('oe',`<ellipse cx="270" cy="45" rx="4" ry="1.8"/>`,270,45))),c)
   +CO(H(`<path d="M280,57l2,5l2,-5ZM287,56l2,5l2,-5Z" fill="${OS}"/>`)))}},

{id:'aile',n:"L'Ailé",k:"Volant",c:"#a78bff",m:{f:1,e:1.3,p:.8,r:1},
 d:"Il ne touche presque jamais le sol. On voit d'abord son ombre passer sur les toits.",
 s:"Se fatigue vite : voler coûte cher. Jeune, il ne quitte pas encore le sol.",
 draw:st=>{const i=st-1,c="#a78bff",ws=[.42,.62,.84,1][i],H=el=>P(K('te',el,160,88),[1.55,1.33,1.14,1][i],160,86),WL=el=>K('ai',P(el,ws,150,100),150,100),WR=el=>K('aj',P(el,ws,170,100),170,100),T=el=>K('qu',P(el,[.55,.72,.9,1][i],160,134),160,134);
  return `<g transform="translate(0,${[22,10,-10,-22][i]})">`
   +sil(WL(`<path d="M150,96L62,38L18,62L48,72L28,98L64,96L54,124L92,112L96,136L142,114Z"/>`)+WR(`<path d="M170,96L258,38L302,62L272,72L292,98L256,96L266,124L228,112L224,136L178,114Z"/>`)
    +`<ellipse cx="160" cy="108" rx="17" ry="32"/>`+T(`<path d="M160,134C166,158 150,170 166,188" fill="none" stroke-width="6"/><path d="M166,186l12,10l-16,2Z"/>`)
    +`<path d="M150,132L140,156L146,158L144,168L152,160L156,138ZM170,132L180,156L174,158L176,168L168,160L164,138Z"/>`
    +H(`<path d="M148,84L152,58L160,50L168,58L172,84Z"/>`+P(`<path d="M152,60L140,34L157,54Z"/>`,[.45,.65,.88,1][i],154,58)+P(`<path d="M168,60L180,34L163,54Z"/>`,[.45,.65,.88,1][i],166,58)))
   +lum(WL(`<path d="M150,97L62,39M150,98L28,98M148,101L54,124M148,105L96,136" fill="none" stroke-width="1.2"/>`)+WR(`<path d="M170,97L258,39M170,98L292,98M172,101L266,124M172,105L224,136" fill="none" stroke-width="1.2"/>`)
    +H(K('oe',`<circle cx="155.5" cy="70" r="2"/><circle cx="164.5" cy="70" r="2"/>`,160,70)),c,.9)+`</g>`}},

{id:'carapace',n:"La Carapace",k:"Crustacé",c:"#ff3b4e",m:{f:.9,e:.8,p:1,r:.8},
 d:"Une forteresse sur six pattes. Elle avance de côté et rien ne l'arrête.",
 s:"Lente et solide. Se fatigue peu, s'énerve peu.",
 draw:st=>{const i=st-1,c="#ff3b4e",cs=[.5,.7,.88,1][i],es=[1.5,1.3,1.12,1][i],
  pr=['M106,162L78,144L66,190M214,162L242,144L254,190','M122,165L102,154L94,190M198,165L218,154L226,190','M92,156L58,132L40,190M228,156L262,132L280,190'];
  return W(i,[.8,.87,.94,1],[.8,.87,.94,1],null,
   sil(P(`<path d="M96,118L88,90L108,110ZM128,106L126,76L142,102ZM160,102L160,70L172,102ZM192,104L198,76L204,108ZM220,114L236,90L230,120Z"/>`,[.3,.55,.8,1][i],160,126)
    +pr.slice(0,st<2?2:3).map((d,j)=>K(j%2?'pd':'pc',`<path d="${d}" fill="none" stroke-width="6"/>`)).join('')
    +`<path d="M70,150C70,96 250,96 250,150C250,172 70,172 70,150Z"/>`
    +K('br',P(`<path d="M238,138L272,112L282,84" fill="none" stroke-width="10"/><path d="M268,90L278,38L302,58L290,68L306,76L290,94Z"/>`,cs,238,142),238,142)
    +K('bs',P(`<path d="M82,138L50,122L38,100" fill="none" stroke-width="9"/><path d="M24,106L28,60L46,76L38,86L54,92L42,110Z"/>`,cs,82,142),82,142)
    +P(`<path d="M146,112L142,90" fill="none" stroke-width="3.5"/>`,es,146,114)+P(`<path d="M174,112L178,90" fill="none" stroke-width="3.5"/>`,es,174,114))
   +lum(P(K('oe',`<circle cx="142" cy="88" r="3.4"/>`,142,88),es,146,114)+P(K('oe',`<circle cx="178" cy="88" r="3.4"/>`,178,88),es,174,114)+`<path d="M142,146v9M151,146v9M160,146v9M169,146v9M178,146v9" fill="none" stroke-width="2.2"/>`,c)
   +grp(c,`<path d="M84,140C120,124 200,124 236,140" fill="none" stroke-width="1.1"/>`,'class="lm" opacity=".6"'))}},

{id:'faucheux',n:"Le Faucheux",k:"Échassier",c:"#fff0c0",m:{f:.8,e:1.5,p:1,r:.7},
 d:"Un corps minuscule perché sur six pattes démesurées, un fanal qui pend sous lui.",
 s:"Fragile et silencieux. Dort beaucoup, mange peu.",
 draw:st=>{const i=st-1,c="#fff0c0",B=el=>P(el,[1.7,1.4,1.15,1][i],160,56),FA=el=>K('fa',el,160,88),
  lg=['M146,58L96,16L66,190M174,58L224,16L254,190','M150,62L122,30L110,190M170,62L198,30L212,190','M142,62L74,40L28,190M178,62L246,40L292,190'];
  return W(i,[.72,.82,.92,1],[.5,.68,.86,1],null,
   (st>=3?B(FA(`<path d="M164,126L132,190H198Z" fill="url(#beamf)" class="lm"/>`)):'')
   +sil(lg.slice(0,st<2?2:3).map((d,j)=>K(j%2?'pd':'pc',`<path d="${d}" fill="none" stroke-width="${[5.6,4.6,4,3.6][i]}"/>`)).join('')
    +B(`<ellipse cx="160" cy="58" rx="27" ry="15"/>`+P(`<path d="M146,46L150,28L156,44ZM164,44L171,26L174,46Z"/>`,[.4,.6,.85,1][i],160,48)+`<path d="M150,68L160,92L170,68Z"/>`+FA(`<path d="M160,88C160,102 167,108 164,121" fill="none" stroke-width="1.6"/>`)),1.3)
   +B(FA(halo(`<circle cx="164" cy="125" r="${[7,10,13,14][i]}"/>`,c,.6)+lum(`<circle cx="164" cy="125" r="3.6"/>`,c))
    +grp(OS,K('oe',`<circle cx="148" cy="60" r="1.3"/><circle cx="154" cy="62" r="1.3"/><circle cx="166" cy="62" r="1.3"/><circle cx="172" cy="60" r="1.3"/>`,160,61))))}},

{id:'abyssal',n:"L'Abyssal",k:"Céphalopode",c:"#ff5ab4",m:{f:1,e:1,p:1.7,r:1},
 d:"Remonté de très profond. Un seul œil, des bras partout dans les rues.",
 s:"Doit rester humide : sa propreté baisse vite, il faut le laver souvent.",
 draw:st=>{const i=st-1,c="#ff5ab4",M=el=>K('fl',P(el,[1.32,1.2,1.1,1][i],170,124)),E=el=>M(P(el,[1.35,1.22,1.1,1][i],192,86)),
  t=[['M150,122C140,158 120,170 118,190',10,150,122],['M168,124C172,160 160,176 172,190',10,168,124],['M134,118C108,150 80,152 58,190',11,134,118],['M186,122C200,150 206,172 224,190',10,186,122],['M202,116C236,128 250,158 280,148C296,142 296,124 284,124',8,202,116],['M126,110C92,110 72,88 50,98C36,106 40,122 52,120',7,126,110]],
  sp=['<circle cx="150" cy="50" r="2.4"/>','<circle cx="206" cy="54" r="2"/>','<circle cx="163" cy="37" r="2"/>','<circle cx="140" cy="72" r="2"/>','<circle cx="178" cy="33" r="1.7"/>','<circle cx="132" cy="96" r="1.6"/>'];
  return W(i,[.82,.88,.94,1],[.72,.8,.9,1],null,
   sil(`<g fill="none">${t.slice(0,[4,5,6,6][i]).map((q,j)=>K(j%2?'tb':'ta',`<path d="${q[0]}" stroke-width="${q[1]}"/>`,q[2],q[3])).join('')}</g>`+M(`<path d="M122,124C104,56 140,18 176,18C218,18 240,70 216,124Z"/>`))
   +lum(E(K('oe',`<circle cx="192" cy="86" r="8"/>`,192,86)),c)+E(`<ellipse cx="192" cy="86" rx="1.9" ry="6.6" fill="${BODY}"/>`)
   +lum(M(sp.slice(0,[2,3,4,6][i]).join('')),c,.7))}},

{id:'belier',n:"Le Bélier",k:"Quadrupède cuirassé",c:"#ffb03a",m:{f:1.5,e:.9,p:1,r:1},
 d:"Bas, large, blindé. Une corne à l'avant, une masse au bout de la queue.",
 s:"Gros appétit, sommeil de plomb. Simple à élever, long à rassasier.",
 draw:st=>{const i=st-1,c="#ffb03a",H=el=>P(K('te',el,240,138),[1.4,1.25,1.1,1][i],240,138),hs=[.35,.6,.85,1][i];
  return W(i,[.8,.87,.94,1],[.86,.9,.95,1],[8,5,2,0],
   sil(P(`<path d="M92,104L98,78L110,100ZM116,96L126,68L136,94ZM144,92L156,64L164,92ZM174,94L188,70L192,98ZM202,100L218,82L216,106Z"/>`,[.3,.55,.8,1][i],156,114)
    +K('qu',`<path d="M74,134C50,128 40,140 28,126" fill="none" stroke-width="9"/>`+P(`<circle cx="24" cy="124" r="10"/><path d="M14,118L2,106L20,114ZM18,134L4,144L24,134ZM28,114L30,98L35,116Z"/>`,[.45,.65,.85,1][i],28,126),76,134)
    +K('pa',`<path d="M84,146L80,190H112L114,150Z"/>`,98,148)+K('pb',`<path d="M118,150V190H142L144,150Z"/>`,130,150)
    +`<path d="M66,152C64,106 118,90 170,92C216,94 244,110 248,142L248,152Z"/>`
    +K('pb',`<path d="M186,150V190H212L214,150Z"/>`,200,150)+K('pa',`<path d="M216,148L222,190H248L244,144Z"/>`,230,148)
    +H(`<path d="M236,116L276,124L296,138L290,152L262,158L238,152Z"/>`+P(`<path d="M270,126L300,96L286,134Z"/>`,hs,276,128)+P(`<path d="M252,120L268,96L264,124Z"/>`,hs,258,121)))
   +lum((st>=2?`<path d="M98,114C130,102 190,102 228,116" fill="none" stroke-width="1.5"/>`:'')+(st>=3?`<path d="M108,130C140,121 190,121 224,132" fill="none" stroke-width="1.5"/>`:'')+H(K('oe',`<ellipse cx="270" cy="137" rx="3.6" ry="1.6"/>`,270,137)),c,.75))}},

{id:'fourneau',n:"Le Fourneau",k:"Colosse minéral",c:"#ff6a2a",m:{f:1.35,e:.9,p:.7,r:1},
 d:"Des blocs de pierre qui tiennent ensemble par la chaleur. On voit le feu entre les joints.",
 s:"S'il a faim, il refroidit. Le nourrir, c'est entretenir un feu.",
 draw:st=>{const i=st-1,c="#ff6a2a",H=el=>P(K('te',el,161,56),[1.5,1.3,1.12,1][i],161,56),ch=[0,.55,.8,1][i],
  bars=[[156,168],[150,162,174],[144,156,168,180],[138,150,162,174,186]][i];
  return W(i,[.86,.91,.96,1],[.74,.83,.92,1],null,
   halo(`<path d="M70,50H252L262,180L200,190H122L60,180Z"/>`,c,.55)+grp('#b3261a',`<path d="M72,52H250L258,178L198,188H124L62,178Z"/>`,'class="lm" opacity=".55"')+halo(`<ellipse cx="161" cy="120" rx="46" ry="60"/>`,c,.7)
   +sil(K('pa',`<path d="M110,190L118,142H155L157,190Z"/>`,136,144)+K('pb',`<path d="M165,190L167,142H204L212,190Z"/>`,186,144)
    +`<path d="M108,138H214L204,118H118Z"/><path d="M108,114H214L226,58H96Z"/><path d="M68,52L102,46L98,86L70,82Z"/><path d="M220,46L254,52L252,82L224,86Z"/>`
    +K('pb',`<path d="M68,86L94,90L90,150L64,146Z"/><path d="M56,152L94,156L92,184L54,180Z"/>`,82,88)
    +K('pa br',`<path d="M228,90L254,86L258,146L232,150Z"/><path d="M228,156L266,152L268,180L230,184Z"/>`,240,88)
    +H(`<path d="M144,54H178L174,26H148Z"/>`)+(ch?P(`<path d="M76,48L79,22H91L93,46Z"/>`,ch,85,48)+P(`<path d="M229,46L231,22H243L246,48Z"/>`,ch,237,48):''),1.2)
   +lum(H(K('oe',`<rect x="152" y="37" width="18" height="3"/>`,161,38.5))+`<path d="${bars.map(x=>`M${x},74v26`).join('')}" fill="none" stroke-width="3"/>`,c))}},

{id:'mante',n:"La Mante",k:"Insecte",c:"#c9f03a",m:{f:.6,e:1,p:1,r:1.1},
 d:"Deux faux à la place des bras. Elle reste immobile des heures, puis frappe une seule fois.",
 s:"Patiente. Sa faim baisse lentement.",
 draw:st=>{const i=st-1,c="#c9f03a",H=el=>P(K('te',el,198,66),[1.5,1.3,1.12,1][i],198,64),bs=[.5,.7,.88,1][i],Ab=el=>P(el,[.62,.76,.9,1][i],150,130),
  lg=[['M156,126L176,158L172,190',156,126],['M146,130L124,160L132,190',146,130],['M132,134L98,162L90,190',132,134],['M166,122L200,150L206,190',166,122]];
  return W(i,[.92,.95,.98,1],[.82,.88,.95,1],[-18,-11,-4,0],
   sil(lg.map((q,j)=>K(j%2?'pb':'pa',`<path d="${q[0]}" fill="none" stroke-width="4"/>`,q[1],q[2])).join('')
    +Ab(`<ellipse transform="rotate(-16 104 138)" cx="104" cy="138" rx="58" ry="15"/>`)+`<path d="M148,128L188,58L204,64L172,134Z"/>`
    +H(`<path d="M186,62L218,36L214,68Z"/>`+P(`<path d="M206,44C214,20 234,12 252,20M204,46C206,22 220,8 240,6" fill="none" stroke-width="1.5"/>`,[.6,.75,.9,1][i],205,45))
    +K('bs',`<path d="M186,84L222,108" fill="none" stroke-width="6"/>`+P(`<path d="M218,110L246,78L252,82L230,116Z"/><path d="M246,78C270,86 278,108 272,134C266,112 258,100 242,94Z"/>`,bs,224,112),186,84)
    +K('br',`<path d="M194,74L232,96" fill="none" stroke-width="7"/>`+P(`<path d="M228,98L262,58L270,62L242,106Z"/><path d="M262,58C292,66 304,98 294,136C288,104 276,86 256,76Z"/>`,bs,234,100),194,74),1.4)
   +lum(H(K('oe',`<ellipse cx="206" cy="52" rx="4.6" ry="6" transform="rotate(-30 206 52)"/>`,206,52))+K('br',P(`<path d="M263,59C292,67 303,98 294,134" fill="none" stroke-width="1.1"/>`,bs,234,100),194,74),c)
   +(st>=3?Ab(grp(c,`<path d="M150,124C120,128 80,142 52,154M146,131C120,137 90,149 64,159" fill="none" stroke-width="1.1"/>`,'class="lm" opacity=".65"')):''))}},

{id:'voile',n:"Le Voile",k:"Flottant",c:"#bfe6ff",m:{f:.9,e:.9,p:.6,r:.2},
 d:"Il dérive au-dessus des toits sans un bruit. Ni gueule, ni yeux, seulement des filaments.",
 s:"Presque pas de rage. Le plus paisible, le plus étrange.",
 draw:st=>{const i=st-1,c="#bfe6ff",Tn=el=>P(el,1,160,94,0,0,[.45,.65,.85,1][i]),
  th=[['M110,94C98,130 122,150 108,184',3,108,184,110],['M126,96C134,130 116,156 130,188',2.5,130,188,126],['M144,98C136,138 156,160 146,186',3,146,186,144],['M160,100C166,140 150,166 162,188',2.5,162,188,160],['M176,98C186,134 166,158 178,186',3,178,186,176],['M194,96C188,130 208,152 196,188',2.5,196,188,194],['M210,94C222,126 202,150 214,182',3,214,182,210]],
  sel=[[1,3,5],[0,2,3,4,6],[0,1,2,3,4,5,6],[0,1,2,3,4,5,6]][i],
  rg=[[[160,58]],[[148,60],[172,60]],[[142,62],[160,56],[178,62]],[[142,62],[160,56],[178,62]]][i];
  return `<g transform="translate(0,${[54,34,12,0][i]})">`+K('fl',P(
   sil(Tn(`<g fill="none">${sel.map(k=>K(k%2?'tb':'ta',`<path d="${th[k][0]}" stroke-width="${th[k][1]}"/>`,th[k][4],96)).join('')}<path d="M150,98C140,120 160,134 152,158" stroke-width="7"/><path d="M170,98C180,120 162,136 170,160" stroke-width="7"/></g>`)
    +`<path d="M96,92C96,22 224,22 224,92C206,102 188,86 160,98C132,86 114,102 96,92Z"/>`,1.4)
   +halo(`<ellipse cx="160" cy="64" rx="44" ry="22"/>`,c,.45)
   +grp(c,`<g fill="none" stroke-width="1.4">${rg.map(q=>`<circle cx="${q[0]}" cy="${q[1]}" r="8"/>`).join('')}<path d="M104,86C120,60 200,60 216,86"/></g>`,'class="lm" opacity=".8"')
   +lum(Tn(sel.map(k=>K(k%2?'tb':'ta',`<circle cx="${th[k][2]}" cy="${th[k][3]}" r="1.6"/>`,th[k][4],96)).join('')),c,.9),[.7,.8,.92,1][i],160,92))+`</g>`}},

{id:'ombre',n:"L'Ombre-Braise",k:"Démon de feu et d'ombre",c:"#ff4a1a",m:{f:1.1,e:1,p:1.3,r:1.3},
 d:"Un seigneur cornu drapé de fumée, des ailes en lambeaux, un fouet de flammes.",
 s:"Brûle tout ce qu'il touche : il se salit vite et s'emporte vite.",
 draw:st=>{const i=st-1,c="#ff4a1a",ws=[.35,.6,.85,1][i],fs=[.5,.7,.88,1][i],hs=[.4,.62,.85,1][i],H=el=>P(K('te',el,160,84),[1.4,1.25,1.1,1][i],160,82),FL=el=>`<g class="flamme">${el}</g>`,
  cr=['M160,88V134','M160,98L141,106M160,98L179,106','M160,114L145,124M160,114L175,124'];
  return W(i,[.86,.91,.96,1],[.78,.86,.93,1],null,
   sil(K('ai',P(`<path d="M140,80L60,24L20,50L44,62L16,88L46,92L28,122L64,116L70,140L130,118Z"/>`,ws,136,98),136,98)+K('aj',P(`<path d="M180,80L260,24L300,50L276,62L304,88L274,92L292,122L256,116L250,140L190,118Z"/>`,ws,184,98),184,98),1.4,FAR)
   +lum(FL(P(`<path d="M110,74L104,42L120,60L124,34L138,68Z"/>`,fs,124,74))+FL(P(`<path d="M210,74L216,42L200,60L196,34L182,68Z"/>`,fs,196,74))+H(FL(P(`<path d="M149,46L153,18L160,36L167,16L171,46Z"/>`,fs,160,48))),c,.85)
   +sil(K('pa',`<path d="M134,134H159L155,190H126Z"/>`,146,136)+K('pb',`<path d="M161,134H186L194,190H165Z"/>`,174,136)+`<path d="M122,78H198L188,140H132Z"/><ellipse cx="119" cy="84" rx="20" ry="15"/><ellipse cx="201" cy="84" rx="20" ry="15"/>`
    +H(`<path d="M146,72L150,46L160,40L170,46L174,72L160,82Z"/>`+P(`<path d="M149,52C127,50 114,30 123,8C128,26 138,36 153,41Z"/>`,hs,150,48)+P(`<path d="M171,52C193,50 206,30 197,8C192,26 182,36 167,41Z"/>`,hs,170,48)))
   +sil(K('pb',`<path d="M102,86L120,92L113,140L119,170L99,172L91,138Z"/>`,110,90)+K('pa br',`<path d="M200,92L218,86L236,128L226,160L208,160L214,132Z"/>`,208,90))
   +lum(`<path d="${cr.slice(0,Math.min(3,st)).join('')}" fill="none" stroke-width="2"/>`+H(K('oe',`<path d="M151,58l7,3M169,58l-7,3" fill="none" stroke-width="2.2"/>`,160,60)+`<path d="M154,69h12" fill="none" stroke-width="2.2"/>`),c)
   +(st>=3?lum(K('pb',P(`<path d="M106,170C72,180 38,152 50,128C60,108 86,122 74,140" fill="none" stroke-width="2.6"/>`,[0,0,.75,1][i],106,170),110,90),'#ffb03a',.9):''))}}
];

/* ---------- œuf, proies, décor ---------- */
const egg=(c,k)=>{const cr='M-9,-52l5,9l-6,7l8,8l-3,9M4,-36l7,5l-2,8l6,6M-4,-28l8,-8',o=f2(.15+.85*k);
 return `<ellipse cx="-1.5" cy="-31" rx="22" ry="29" fill="${RIM}"/><ellipse cx="0" cy="-30" rx="22" ry="29" fill="${BODY}"/>
 <g fill="none" stroke="${c}" stroke-linejoin="round" opacity="${o}"><path d="${cr}" stroke-width="3" opacity=".7" filter="url(#b2)"/><path d="${cr}" stroke="#fff" stroke-opacity=".75" stroke-width="1"/></g>`};
/* proies : dessinées autour de (0,0), posées sur y = 0, tournées vers la droite.
   hum : v = 0 passant, 1 en manteau, 2 enfant ; fuit = bras en l'air */
const hum=(v=0,fuit=false,c)=>{c=c||['#b4bcc6','#9aa4b0','#c9cfd6'][v%3];const s=v===2?.72:1;
 return `<g fill="${c}" stroke="${c}" stroke-width="0" transform="scale(${s})"><circle cx="0" cy="-8.6" r="1.4"/>`
  +(v===1?`<path d="M-1.5,-7H1.5L2.4,-2.6H1.3L1.6,0H.5L0,-2.4L-.5,0H-1.6L-1.3,-2.6H-2.4Z"/>`:`<path d="M-1.3,-7H1.3L1.6,-3.5L2.6,0H1.2L0,-3L-1.4,0H-2.8L-1.5,-3.6Z"/>`)
  +(fuit?`<path d="M-1.2,-6.6L-3,-10M1.2,-6.6L3,-10" fill="none" stroke-width=".9" stroke-linecap="round"/>`:'')+`</g>`};
const roue=x=>`<circle cx="${x}" cy="0" r="4" fill="#010101"/>`;
/* car : v = 0 berline, 1 bus, 2 camion, 3 police */
const car=(v=0)=>{const feux=(x,y)=>`<path d="M${x},${y-1}L${x+41},${y-5}V${y+9}L${x},${y+2}Z" fill="url(#beam)"/>`;
 if(v===1)return feux(34,-5)+`<path d="M-34,0V-16Q-34,-19 -30,-19H30Q34,-19 34,-15V0Z" fill="#151a21"/><rect x="-34" y="-19" width="68" height="1" fill="${RIM}" opacity=".5"/><g fill="#ffc76b" opacity=".75"><rect x="-29" y="-15" width="7" height="6"/><rect x="-19" y="-15" width="7" height="6"/><rect x="-9" y="-15" width="7" height="6" opacity=".5"/><rect x="1" y="-15" width="7" height="6"/><rect x="11" y="-15" width="7" height="6"/><rect x="22" y="-15" width="8" height="7" opacity=".6"/></g>${roue(-22)}${roue(22)}<rect x="32" y="-7" width="2" height="2.4" fill="#ffd9a8"/><rect x="-34" y="-7" width="1.5" height="2" fill="#ff3b30"/>`;
 if(v===2)return feux(31,-4)+`<path d="M-31,0V-20H10V0Z" fill="#12161c"/><rect x="-31" y="-20" width="41" height="1" fill="${RIM}" opacity=".5"/><path d="M12,0V-15H22L30,-8Q31,-7 31,-4V0Z" fill="#151a21"/><path d="M14,-13H21L27,-8H14Z" fill="#55616f" opacity=".5"/>${roue(-20)}${roue(-8)}${roue(22)}<rect x="29" y="-6" width="2" height="2.4" fill="#ffd9a8"/><rect x="-31" y="-6" width="1.5" height="2" fill="#ff3b30"/>`;
 return feux(21,-4)+`<path d="M-20,0V-6Q-19,-8 -15,-8L-10,-14H6L12,-8H18Q21,-8 21,-4V0Z" fill="#151a21"/><path d="M-9,-13H5L10,-8H-13Z" fill="#55616f" opacity=".5"/>${roue(-11)}${roue(12)}<rect x="19" y="-6" width="2" height="2.4" fill="#ffd9a8"/><rect x="-20" y="-6" width="1.5" height="2" fill="#ff3b30"/>`
  +(v===3?`<rect class="gyro" x="-5" y="-17" width="4" height="3" fill="#ff3b4e"/><rect class="gyro g2" x="-1" y="-17" width="4" height="3" fill="#6fc3ff"/>`:'')};
const heli=(c='#0b0e13')=>`<g fill="${c}"><ellipse rx="9" ry="4.6"/><rect x="-23" y="-1.4" width="17" height="2.2"/><rect x="-25" y="-5.5" width="2.6" height="7"/><rect class="rotor" x="-15" y="-8" width="30" height="1"/><rect x="-.8" y="-7.5" width="1.6" height="4"/><rect x="-6" y="6" width="13" height="1"/><rect x="-3" y="4" width="1" height="2.5"/><rect x="3" y="4" width="1" height="2.5"/></g><circle class="feu-r" cx="-24" cy="-5" r="1.4" fill="#ff3b30"/><ellipse cx="4" cy="-.5" rx="3.4" ry="2.4" fill="#55616f" opacity=".8"/>`;
/* boat : v = 0 cargo, 1 chalutier */
const boat=(v=0)=>v===1
 ?`<path d="M-30,-8H30L24,5H-24Z" fill="#151a21"/><rect x="-30" y="-8" width="60" height="1" fill="${RIM}" opacity=".6"/><rect x="-8" y="-20" width="18" height="12" fill="#1c222b"/><rect x="-5" y="-17" width="4" height="4" fill="#ffc76b"/><rect x="3" y="-17" width="4" height="4" fill="#ffc76b" opacity=".5"/><path d="M-20,-8V-30M-20,-30L-2,-20" fill="none" stroke="#151a21" stroke-width="1.4"/><circle class="feu-r" cx="-20" cy="-31" r="1.5" fill="#ff3b30"/>`
 :`<path d="M-52,-8H52L42,6H-42Z" fill="#151a21"/><rect x="-52" y="-8" width="104" height="1" fill="${RIM}" opacity=".6"/><g fill="#1c222b"><rect x="-36" y="-18" width="16" height="10"/><rect x="-18" y="-18" width="16" height="10"/><rect x="-27" y="-28" width="16" height="10"/><rect x="0" y="-16" width="14" height="8"/></g><rect x="22" y="-30" width="18" height="22" fill="#151a21"/><g fill="#ffc76b"><rect x="25" y="-26" width="3" height="3"/><rect x="35" y="-26" width="3" height="3" opacity=".5"/></g><rect x="30" y="-40" width="1.2" height="10" fill="#151a21"/><circle class="feu-r" cx="30.6" cy="-41" r="1.5" fill="#ff3b30"/>`;
const crane=(x,y,h)=>`<g fill="#1a2029"><rect x="${f(x)}" y="${f(y-h)}" width="${f(Math.max(1.2,h*.02))}" height="${f(h)}"/><rect x="${f(x-h*.18)}" y="${f(y-h)}" width="${f(h*.75)}" height="${f(Math.max(1,h*.016))}"/><rect x="${f(x-h*.18)}" y="${f(y-h)}" width="${f(h*.1)}" height="${f(h*.05)}"/><rect x="${f(x+h*.42)}" y="${f(y-h)}" width="${f(Math.max(.5,h*.008))}" height="${f(h*.3)}"/></g><circle class="feu-r" cx="${f(x)}" cy="${f(y-h-2)}" r="1.4" fill="#ff3b30"/>`;
function sky(seed,x0,x1,base,hmin,hmax,wmin,wmax,fill,win,ws=1){
 const r=rng(seed);let x=x0,s='';
 while(x<x1){const w=wmin+r()*(wmax-wmin),h=hmin+r()*(hmax-hmin),y=base-h;
  s+=`<rect x="${f(x)}" y="${f(y)}" width="${f(w+1)}" height="${f(h)}" fill="${fill}"/>`;
  if(r()<.25)s+=`<rect x="${f(x+w*.5)}" y="${f(y-h*.12)}" width="${f(1.2*ws)}" height="${f(h*.12)}" fill="${fill}"/>`;
  if(win)for(let yy=y+5*ws;yy<base-6*ws;yy+=9*ws)for(let xx=x+4*ws;xx<x+w-5*ws;xx+=7*ws)if(r()<win)s+=`<rect x="${f(xx)}" y="${f(yy)}" width="${f(3*ws)}" height="${f(4*ws)}" fill="#ffc76b" opacity="${(.25+r()*.5).toFixed(2)}"/>`;
  x+=w+(r()<.2?r()*10:0);}
 return s;}
function rub(seed,x0,x1,base,h,fill='#0a0c10'){const r=rng(seed);let d=`M${f(x0)},${f(base)}`;const st=Math.max(3,(x1-x0)/14);for(let x=x0;x<=x1;x+=st*(.5+r()))d+=`L${f(x)},${f(base-r()*h)}`;return `<path d="${d}L${f(x1)},${f(base)}Z" fill="${fill}"/>`}
const fire=(x,y,k=1,op=.55)=>`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(50*k)}" ry="${f(18*k)}" fill="#b3261a" opacity="${f2(op*.7)}" filter="url(#b12)"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(30*k)}" ry="${f(10*k)}" fill="#ff6a2a" opacity="${op}" filter="url(#b5)"/>`;
const smoke=(x,y,k=1,op=.6)=>`<g fill="#3d434c" opacity="${op}" filter="url(#b5)"><ellipse cx="${f(x)}" cy="${f(y-28*k)}" rx="${f(10*k)}" ry="${f(22*k)}"/><ellipse cx="${f(x+8*k)}" cy="${f(y-64*k)}" rx="${f(14*k)}" ry="${f(22*k)}"/><ellipse cx="${f(x+22*k)}" cy="${f(y-98*k)}" rx="${f(22*k)}" ry="${f(18*k)}"/></g>`;
const rain=(seed,w,h,n,op)=>{const r=rng(seed);let s='';for(let i=0;i<n;i++){const x=r()*w*1.1,y=r()*h,l=10+r()*22;s+=`<path d="M${f(x)},${f(y)}l${f(-l*.28)},${f(l)}"/>`}return `<g stroke="#8d9aaa" stroke-width=".7" opacity="${op}" pointer-events="none">${s}</g>`};
const IC={dormir:'M3,-8A8.5,8.5 0 1 0 8,4A6.5,6.5 0 1 1 3,-8Z',reveil:'M0,-9V-6M0,6V9M-9,0H-6M6,0H9M-6.4,-6.4L-4.3,-4.3M4.3,4.3L6.4,6.4M-6.4,6.4L-4.3,4.3M4.3,-4.3L6.4,-6.4M3.6,0A3.6,3.6 0 1 1 -3.6,0A3.6,3.6 0 1 1 3.6,0Z',
 laver:'M0,-9C5,-3 6.5,0 6.5,2.5A6.5,6.5 0 0 1 -6.5,2.5C-6.5,0 -5,-3 0,-9Z',jouer:'M0,-8L8,0L0,8L-8,0Z',rugir:'M-8,-3H-4L2,-8V8L-4,3H-8ZM5,-4Q8,0 5,4',
 sortir:'M-9,8V-1h4v-6h5v9h3v-5h5V8Z',rentrer:'M-9,8C-9,-10 9,-10 9,8ZM-3,8C-3,0 3,0 3,8',frapper:'M-6,-2h3v-4h3v4h2v-3h3v3h2v6l-3,5h-7l-3,-5Z',journal:'M-7,-7H7M-7,-2H7M-7,3H7M-7,8H2'};
const icon=(k,c='currentColor')=>`<svg viewBox="-12 -12 24 24" width="22" height="22" aria-hidden="true"><path d="${IC[k]}" fill="none" stroke="${c}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

TV.art={SP,rng,f,f2,BODY,RIM,OS,egg,hum,car,heli,boat,crane,sky,rub,fire,smoke,rain,icon};
})();
