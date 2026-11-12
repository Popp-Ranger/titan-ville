/* Titan-Ville — interface : choix de l'œuf, tanière, ville. */
(function(){
const TV=window.TV,A=TV.art,C=TV.core,$=s=>document.querySelector(s),f=A.f,f2=A.f2;
const NS='http://www.w3.org/2000/svg';
const VW=300,GY=350;
const U=[14,14,7,3.2,1.6];        // pixels par mètre selon le stade : la caméra recule quand il grandit
const MH=[0,84,108,134,160];      // hauteur du monstre à l'écran, en ville
const DH=[0,74,98,124,150];       // dans la tanière
const WALK=85;                    // px/s
let ecran='',mode='taniere',shown=-1,ents=[],eid=0,spawnT=0,last=0,cam=0,sayT=0,choix=0,bph=[],barKey='',flashT=0;
const mon={x:14,tx:null,face:1,tgt:null,cool:0,walk:0,combo:0,comboT:0};
const den={x:150,tx:150,wait:2,face:1,game:null,wash:null,puffT:0};
const svg=$('#scene');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hhmm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const nb=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');

/* ---------- écrans ---------- */
function go(e){ecran=e;for(const s of document.querySelectorAll('.ecran'))s.classList.toggle('on',s.id===e);$('#voile').classList.remove('on')}
const carte=(sp,st)=>`<svg viewBox="0 0 320 230" role="img" aria-label="${sp.n}"><rect width="320" height="230" fill="#07080a"/><ellipse cx="160" cy="105" rx="200" ry="135" fill="url(#fog)"/>${A.sky(7,0,320,190,8,28,7,15,'#14181e',.1,.5)}<rect y="190" width="320" height="40" fill="#020304"/><rect y="190" width="320" height="1" fill="url(#gnd)"/>${sp.draw(st)}</svg>`;
function accueil(){
 $('#especes').innerHTML=A.SP.map((sp,i)=>`<button class="esp" data-sp="${i}">${carte(sp,4)}<b class="t">${sp.n}</b><i class="t" style="color:${sp.c}">${sp.k}</i></button>`).join('');
 go('accueil')}
function fiche(i){choix=i;const sp=A.SP[i];
 $('#fiche-dessin').innerHTML=carte(sp,4);$('#fiche-nom').textContent=sp.n;$('#fiche-type').textContent=sp.k;$('#fiche-type').style.color=sp.c;
 $('#fiche-d').textContent=sp.d;$('#fiche-s').textContent=sp.s;$('#nom').value=C.PRENOMS[Math.floor(Math.random()*C.PRENOMS.length)];
 go('fiche');$('#fiche').scrollTop=0}
function jouer(){mode='taniere';shown=-1;go('jeu');build();hud();bar()}

/* ---------- sons : les rugissements enregistrés, et trois bruits fabriqués ---------- */
let AC=null;
function son(k){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const t=AC.currentTime;
 const bruit=(d,fr,v)=>{const b=AC.createBuffer(1,Math.floor(AC.sampleRate*d),AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);
  const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type='lowpass';fl.frequency.value=fr;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(t)};
 if(k==='croc')bruit(.1,1500,.45);
 else if(k==='eau')bruit(.2,3400,.16);
 else if(k==='chute')bruit(1.2,170,1);
 else{bruit(.25,240,.8);const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(92,t);o.frequency.exponentialRampToValueAtTime(36,t+.22);g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.001,t+.26);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.27)}
 }catch(e){}}
function rugit(){try{const a=new Audio('sons/rugir-'+(1+Math.floor(Math.random()*4))+'.wav');a.playbackRate=.8;a.volume=.8;a.play().catch(()=>{})}catch(e){}}

/* ---------- affichage commun ---------- */
function say(t,ms=2600){if(!t)return;sayT=Date.now()+ms;const m=$('#msg');m.textContent=t;m.className='t hot'}
function anim(c,ms=500){const m=$('#mi');if(!m)return;m.classList.remove('bite','hit','hop','roar');void m.getBBox();m.classList.add(c);setTimeout(()=>m.classList.remove(c),ms)}
function shake(){svg.classList.remove('shake');void svg.getBBox();svg.classList.add('shake');setTimeout(()=>svg.classList.remove('shake'),340)}
function glow(){const S=C.S,m=$('#mi');if(m){m.style.setProperty('--gl',S.dead?.04:S.sleep?.18:C.frenzied(Date.now())?1.6:f2(.35+.65*S.faim/100));m.classList.toggle('dort',!!S.sleep)}}
function place(x,y,face,h){const g=$('#mg');if(g){const s=h/168;g.setAttribute('transform',`translate(${f(x)},${f(y)}) scale(${f2(face*s)},${f2(s)}) translate(-160,-190)`)}}
function drawMon(){const S=C.S,g=$('#mon'),sp=A.SP[S.sp];if(!g)return;
 if(S.stage===0){g.innerHTML=`<g transform="translate(150,338) scale(1.5)" data-oeuf="1">${A.egg(sp.c,S.taps/12)}<circle cy="-30" r="34" fill="#000" fill-opacity="0"/></g>`;return}
 g.innerHTML=`<g id="mg"><g id="mi">${sp.draw(S.stage)}</g></g>`;glow()}
/* ce que l'action a fait gagner, écrit au-dessus du monstre */
const gtxt=g=>!g?'':g.sec>0?'+'+(g.sec>=5400?(g.sec/3600).toFixed(1).replace('.',',')+' h':Math.max(1,Math.round(g.sec/60))+' min'):g.pts?'+'+g.pts:'';
function pop(txt,x,y,c){const fx=$('#fx');if(!fx||!txt)return;const t=document.createElementNS(NS,'text');t.setAttribute('x',f(x));t.setAttribute('y',f(y));t.setAttribute('class','pop t');t.setAttribute('fill',c||'#cfc8b8');t.textContent=txt;fx.appendChild(t);setTimeout(()=>t.remove(),1300)}
function gagne(g,serie){if(!g)return;flashT=Date.now()+900;const S=C.S,sp=A.SP[S.sp];
 if(mode==='ville')pop(gtxt(g)+(serie>1?' · série ×'+serie:''),mon.x*U[S.stage],GY-MH[S.stage]-8-Math.random()*8,sp.c);
 else pop(gtxt(g),den.x,338-DH[S.stage]-8,sp.c)}

const JG=[['faim','Faim',v=>v<=30,'#ffb03a'],['energie','Énergie',v=>v<=20,'#8fd16a'],['proprete','Propreté',v=>v<=25,'#6fc3ff'],['rage','Rage',v=>v>=70,'#ff3b4e']];
const dans=s=>s>=86400?Math.floor(s/86400)+' j '+Math.floor(s%86400/3600)+' h':s>=3600?Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min':s>=60?Math.ceil(s/60)+' min':'moins d\'une minute';
function hud(){const S=C.S;if(!S)return;const now=Date.now(),sp=A.SP[S.sp],st=C.stats(now),ev=C.evol(now);
 if(mode==='ville'){$('#nm').textContent=S.city.name;
  $('#sub').textContent=nb(st.pop)+' habitants · '+(st.wait>0?'rebâtie dans '+(st.wait>=1?Math.ceil(st.wait)+' h':'moins d\'une heure'):Math.round(st.debout*100)+' % debout')}
 else{$('#nm').textContent=S.name;$('#sub').textContent=S.stage===0?'Œuf · '+sp.n:C.STN[S.stage]+' · Jour '+C.jour(now)+' · '+sp.n}
 $('#jauges').innerHTML=(S.stage===0?'':JG.map(([k,l,hot,c])=>{const v=Math.round(S[k]);return `<div class="jg t${hot(v)?' hot':''}" style="--c:${c}"><div>${l}<span>${v}</span></div><u style="--v:${v}%"></u></div>`}).join(''))
  +`<div class="jg ev t${ev.gel?' hot':''}${now<flashT?' gain':''}" style="--c:${sp.c}"><div>${S.stage===0?'Éclosion':ev.next?'Évolution · '+ev.next:'Terreur · stade final'}<span>${S.stage===0?Math.round(ev.p*100)+' %':!ev.next?nb(S.score):ev.gel?'arrêtée : '+ev.gel:(ev.x2?'×2 · ':'')+'dans '+dans(ev.reste)}</span></div><u style="--v:${(ev.p*100).toFixed(1)}%"></u></div>`;
 $('#dep').textContent=S.log[0]?hhmm(S.log[0].t)+' · '+S.log[0].x:'';
 if(now>sayT&&!den.game&&!den.wash){const[t,hot]=C.humeur(now);const m=$('#msg');m.textContent=t;m.className='t'+(hot?' hot':'')}
 svg.classList.toggle('frz',mode==='ville'&&C.frenzied(now));svg.classList.toggle('dort',mode==='taniere'&&!!S.sleep);
 glow();bar()}
function bar(){const S=C.S,el=$('#bar');if(!S||S.stage===0||S.dead){if(barKey!=='-'){barKey='-';el.innerHTML=''}return}
 const pret=mode==='ville'&&S.rage>=80&&!S.sleep,key=[mode,S.sleep,S.stage,pret,!!den.wash].join();if(key===barKey)return;barKey=key;
 const b=(a,ic,l,c='')=>`<button data-a="${a}" class="t ${c}"><i>${A.icon(ic)}</i><span>${l}</span></button>`;
 el.innerHTML=den.wash?b('laver','laver','Terminer','hot'):mode==='ville'
  ?b('rentrer','rentrer','Rentrer')+(pret?b('rugir','rugir','Déchaîner','hot grand bat'):b('rugir','rugir','Rugir','grand'))+(S.stage>=C.MIN.bld?b('frapper','frapper','Frapper'):b('frapper','frapper','Écraser'))
  :(S.sleep?b('dormir','reveil','Réveiller'):b('dormir','dormir','Dormir'))+b('laver','laver','Laver')+b('jouer','jouer','Jouer')+b('rugir','rugir','Rugir')+b('sortir','sortir','Sortir','hot')}
function build(){const S=C.S;shown=S.stage;ents=[];mon.tgt=null;mon.tx=null;mon.combo=0;den.game=null;den.wash=null;svg.classList.remove('wash');if(mode==='ville')buildVille();else buildDen()}

/* ---------- la tanière ---------- */
function buildDen(){const S=C.S,now=Date.now(),st=C.stats(now),sp=A.SP[S.sp];
 svg.innerHTML=`<rect width="300" height="420" fill="#0a0d11"/><ellipse cx="150" cy="200" rx="175" ry="195" fill="url(#fog)"/>
 <circle cx="212" cy="120" r="22" fill="#b3261a" opacity=".3" filter="url(#b5)"/><circle cx="212" cy="120" r="12" fill="#c9765a" opacity=".5"/>
 ${st.feu?A.fire(96,262,.9,.5)+A.smoke(92,256,.9,.6):''}
 ${A.sky(S.city.seed%997+1,36,270,262,6,26,6,12,'#0c0f14',.28*st.lit,.45)}
 <rect y="262" width="300" height="100" fill="#050709"/>
 <g stroke="#55616f" stroke-width=".7" opacity=".4"><path d="M70,270h44M130,268h44M200,276h30M170,290h40M190,308h30M82,300h26"/></g>
 <ellipse cx="150" cy="340" rx="70" ry="9" fill="${sp.c}" opacity=".16" filter="url(#b5)"/>
 <rect id="nuit" width="300" height="420" fill="#020304" pointer-events="none"/>
 <g id="mon"></g><g id="pluie">${A.rain(4,300,420,170,.5)}</g>
 <path fill-rule="evenodd" fill="#020304" d="M0,0H300V420H0ZM32,338C8,210 50,44 150,34C250,44 292,210 268,338Z"/>
 <path fill="#020304" d="M92,56l6,42l7,-46ZM130,36l5,30l6,-31ZM186,40l6,48l8,-42ZM222,66l4,26l6,-18Z"/>
 <path d="M32,338C8,210 50,44 150,34" fill="none" stroke="#7f8fa3" stroke-width=".8" opacity=".3"/><g id="fx" pointer-events="none"></g>`;
 den.x=den.tx=150;drawMon();place(den.x,338,den.face,DH[S.stage])}
function upDen(dt,now){const S=C.S;if(S.stage===0||S.dead)return;
 if(S.sleep){   /* il dort : un souffle de buée monte de sa tête à chaque respiration */
  if(now>den.puffT){den.puffT=now+4200;const fx=$('#fx'),h=DH[S.stage];
   if(fx)for(let i=0;i<2;i++){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',f(den.x+den.face*h*.32+i*5));c.setAttribute('cy',f(338-h*.76-i*4));c.setAttribute('r',f(3+i*1.5));c.setAttribute('class','souffle');c.style.animationDelay=(i*.45)+'s';fx.appendChild(c);setTimeout(()=>c.remove(),4300)}}
  return}
 if(den.wash)return;
 if(den.game){const x=150+90*Math.sin((now-den.game.t0)/1000*3.4);den.game.x=x;const c=$('#curseur');if(c)c.setAttribute('x',f(x-1));if(now-den.game.t0>7000)jeuFin(now);return}
 if(Math.abs(den.tx-den.x)<1){den.wait-=dt;if(den.wait<=0){den.tx=105+Math.random()*90;den.wait=2+Math.random()*5}}
 else{const d=den.tx-den.x;den.face=d>0?1:-1;den.x+=Math.sign(d)*Math.min(Math.abs(d),14*dt)}
 place(den.x,338,den.face,DH[S.stage])}
/* le jeu d'adresse : un trait va et vient, il faut toucher quand il passe au centre */
function jeuDebut(now){const S=C.S,sp=A.SP[S.sp],h=DH[S.stage];den.game={t0:now,x:150};den.x=den.tx=clamp(den.x,112,148);den.face=1;place(den.x,338,1,h);
 $('#fx').innerHTML=`<g id="epave" transform="translate(${f(den.x+h*.62)},338)"><g><path d="M-15,0L-13,-10L-5,-16L7,-13L14,-7L15,0Z" fill="#1a2029"/><path d="M-13,-10L-5,-16L7,-13" fill="none" stroke="#8898ac" stroke-width="1"/></g></g>
 <g id="visee"><rect x="60" y="371" width="180" height="3" fill="#1f252d"/><rect x="116" y="370" width="68" height="5" fill="#55616f"/><rect x="138" y="369" width="24" height="7" fill="${sp.c}"/><rect id="curseur" x="149" y="363" width="2" height="19" fill="#fff"/></g>`;
 const m=$('#msg');m.textContent='Touche quand le trait passe au centre.';m.className='t hot';sayT=now+7000}
function jeuFin(now){const g=den.game;if(!g)return;den.game=null;const d=Math.abs(g.x-150),q=now-g.t0>7000?0:d<=12?2:d<=34?1:0,r=C.playEnd(q,now);
 anim('hit',420);son('coup');const e=$('#epave g'),v=$('#visee');if(e)e.setAttribute('class','vol'+q);if(v)v.remove();setTimeout(()=>{const x=$('#epave');if(x)x.remove()},850);
 say(['Raté. Il grogne.','Bien visé.','En plein dedans.'][q]);gagne(r.g,1);hud()}

/* le lavage, comme dans Mini-Titan : on frotte le monstre du doigt, la suie s'en va tache par tache */
function lavDebut(now){const S=C.S,h=DH[S.stage];den.x=den.tx=150;den.face=1;place(150,338,1,h);
 let s='';for(let i=0,n=Math.ceil((100-S.proprete)/8);i<n;i++)s+=`<circle class="suie" cx="${f(150+(Math.random()-.5)*h*.9)}" cy="${f(338-h*(.12+Math.random()*.72))}" r="${f(3.5+Math.random()*4.5)}"/>`;
 $('#fx').innerHTML=`<g id="suies">${s}</g><g id="outil" opacity="0"><circle r="12" fill="#6fc3ff" fill-opacity=".16" stroke="#6fc3ff" stroke-width="1.2"/><circle r="3" fill="#bfe6ff"/></g>`;
 den.wash={p0:S.proprete,acc:0,down:false,lx:0,ly:0,sonT:0,fin:false};svg.classList.add('wash');
 const m=$('#msg');m.textContent='Frotte-le pour le décrasser.';m.className='t hot';bar()}
function lavFrotte(p,now){const w=den.wash,S=C.S,h=DH[S.stage],o=$('#outil'),fx=$('#fx');if(!w||w.fin)return;
 if(o){o.setAttribute('transform',`translate(${f(p.x)},${f(p.y)})`);o.setAttribute('opacity',1)}
 if(Math.abs(p.x-150)<h*.62&&p.y>338-h-12&&p.y<346)w.acc+=Math.hypot(p.x-w.lx,p.y-w.ly);
 w.lx=p.x;w.ly=p.y;let pas=false;
 while(w.acc>=40&&!w.fin){w.acc-=40;pas=true;const plein=C.washStep(2);
  for(let i=0;i<2;i++){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',f(p.x+(Math.random()-.5)*26));c.setAttribute('cy',f(p.y+(Math.random()-.5)*16));c.setAttribute('r',f(1.2+Math.random()*1.6));c.setAttribute('class','goutte');fx.appendChild(c);setTimeout(()=>c.remove(),950)}
  const su=$('#suies'),reste=Math.ceil((100-S.proprete)/8);   /* la tache la plus proche du doigt part en premier */
  while(su&&su.children.length>reste){let best=null,bd=1e9;for(const c of su.children){const d=Math.hypot(+c.getAttribute('cx')-p.x,+c.getAttribute('cy')-p.y);if(d<bd){bd=d;best=c}}best.remove()}
  if(now-w.sonT>380){w.sonT=now;son('eau')}
  if(plein){w.fin=true;anim('hop');setTimeout(()=>lavFin(Date.now()),900)}}
 if(pas)hud()}
function lavFin(now){const w=den.wash;if(!w)return;den.wash=null;svg.classList.remove('wash');const fx=$('#fx');if(fx)fx.innerHTML='';
 const r=C.washEnd(C.S.proprete-w.p0,now);say(C.S.proprete>=100?'Il est propre.':'Ça ira pour cette fois.');gagne(r.g,1);hud()}

/* ---------- la ville ---------- */
function bldSVG(b,i,now){const u=U[C.S.stage],x=b.x*u,w=b.w*u,h=b.h*u,ph=C.phase(b,now),r=A.rng(b.seed),fill=i%2?'#151a21':'#10141a';
 const tower=(hh,lit)=>{const y0=GY-hh;let s=`<rect x="${f(x)}" y="${f(y0)}" width="${f(w)}" height="${f(hh)}" fill="${fill}"/><rect x="${f(x)}" y="${f(y0)}" width="1.3" height="${f(hh)}" fill="#7f8fa3" opacity=".6"/><rect x="${f(x)}" y="${f(y0)}" width="${f(w)}" height="1" fill="#7f8fa3" opacity=".3"/>`;
  const cw=2.8*u,rh=3.3*u,ww=1.2*u,wh=1.6*u;
  for(let k=0;(k+1)*rh<hh-rh*.2&&GY-(k+1)*rh>-60;k++)for(let xx=x+cw*.45;xx<x+w-ww-cw*.15;xx+=cw){const v=r(),o=r();if(v<lit)s+=`<rect x="${f(xx)}" y="${f(GY-(k+1)*rh+rh*.3)}" width="${f(ww)}" height="${f(wh)}" fill="#ffc76b" opacity="${(.3+o*.5).toFixed(2)}"/>`}
  if(u>=7)s+=`<rect x="${f(x+w/2-.8*u)}" y="${f(GY-2.3*u)}" width="${f(1.6*u)}" height="${f(2.3*u)}" fill="#05070a"/>`;
  return s};
 const crack=()=>{let d=`M${f(x+w*.62)},${f(GY-h*.92)}`,yy=.92;const sw=Math.max(1.6,.3*u);for(let k=0;k<6;k++){yy-=.12;d+=`L${f(x+w*(.45+.25*r()))},${f(GY-h*yy)}`}return `<path d="${d}" fill="none" stroke="#010101" stroke-width="${f(sw)}" stroke-linejoin="round"/>`};
 const tap=`<rect x="${f(x)}" y="${f(Math.max(-60,GY-h))}" width="${f(w)}" height="${f(Math.min(h,GY+60))}" fill="#000" fill-opacity="0"/>`;
 const rubH=Math.min(h*.2,7*u),k=w/70;
 if(ph===0)return tower(h,.42)+tap;
 if(ph===1)return tower(h,.18)+crack()+tap;
 if(ph===2)return `<g transform="rotate(7 ${f(x+w)} ${GY})">${tower(h,0)+crack()}</g><ellipse cx="${f(x+w/2)}" cy="${GY}" rx="${f(w*.7)}" ry="${f(Math.max(5,w*.12))}" fill="#4a525d" opacity=".5" filter="url(#b5)"/>`+tap;
 if(ph==='feu')return A.fire(x+w/2,GY-rubH*.3,k,.6)+A.smoke(x+w/2,GY-rubH,k,.7)+A.rub(b.seed,x-w*.08,x+w*1.08,GY,rubH)
  +`<g fill="#ff8a4a"><path class="flamme" d="M${f(x+w*.3)},${f(GY-rubH*.5)}l${f(w*.04)},${f(-rubH*.8)}l${f(w*.04)},${f(rubH*.8)}Z"/><path class="flamme" d="M${f(x+w*.55)},${f(GY-rubH*.6)}l${f(w*.05)},${f(-rubH)}l${f(w*.05)},${f(rubH)}Z" fill="#ffd9a8"/><path class="flamme" d="M${f(x+w*.78)},${f(GY-rubH*.4)}l${f(w*.035)},${f(-rubH*.7)}l${f(w*.035)},${f(rubH*.7)}Z"/></g>`;
 if(ph==='gravats')return A.smoke(x+w/2,GY-rubH,k*.7,.4)+A.rub(b.seed,x-w*.08,x+w*1.08,GY,rubH);
 const hh=h*.45,sc=Math.max(.6,.12*u);let lines='';for(let yy=GY-hh;yy<GY;yy+=3.3*u)lines+=`M${f(x-2)},${f(yy)}H${f(x+w+2)}`;
 return A.crane(x+w*1.05,GY,h*.95)+tower(hh,0)+`<path d="${lines}M${f(x-2)},${f(GY-hh)}V${GY}M${f(x+w+2)},${f(GY-hh)}V${GY}" fill="none" stroke="#55616f" stroke-width="${f(sc)}" opacity=".8"/><circle cx="${f(x+w/2)}" cy="${f(GY-hh-3)}" r="2" fill="#ffd9a8"/><circle cx="${f(x+w/2)}" cy="${f(GY-hh-3)}" r="9" fill="#ffc76b" opacity=".22" filter="url(#b2)"/>`+A.rub(b.seed,x-w*.05,x+w*1.05,GY,rubH*.35)}
function propSVG(p){const u=U[C.S.stage];if(u<5)return '';const x=p.x*u,hitc=r=>`<circle cx="${f(x)}" cy="${f(GY-r*.6)}" r="${f(Math.max(16,r))}" fill="#000" fill-opacity="0"/>`;
 if(p.k==='p'){const w=.8*u,h=1.1*u;return p.s?`<path d="M${f(x-w)},${GY}l${f(w*.5)},${f(-h*.3)}l${f(w*.9)},${f(h*.1)}l${f(w*.6)},${f(h*.2)}Z" fill="#1a2029"/>`
  :`<rect x="${f(x-w/2)}" y="${f(GY-h)}" width="${f(w)}" height="${f(h)}" rx="${f(w*.15)}" fill="#1a2029"/><rect x="${f(x-w*.6)}" y="${f(GY-h)}" width="${f(w*1.2)}" height="${f(h*.14)}" fill="#7f8fa3" opacity=".7"/>`+hitc(h)}
 const w=3*u,h=2.6*u;return p.s?`<path d="M${f(x-w*.7)},${GY}l${f(w*.3)},${f(-h*.25)}l${f(w*.4)},${f(h*.08)}l${f(w*.3)},${f(-h*.15)}l${f(w*.4)},${f(h*.32)}Z" fill="#1a2029"/>`
  :`<rect x="${f(x-w/2)}" y="${f(GY-h)}" width="${f(w)}" height="${f(h)}" fill="#1a2029"/><path d="M${f(x-w*.62)},${f(GY-h)}h${f(w*1.24)}l${f(-w*.1)},${f(-h*.18)}h${f(-w*1.04)}Z" fill="#232b36"/><rect x="${f(x-w*.36)}" y="${f(GY-h*.78)}" width="${f(w*.72)}" height="${f(h*.36)}" fill="#ffc76b" opacity=".7"/>`+hitc(h)}
function buildVille(){const S=C.S,u=U[S.stage],c=S.city,now=Date.now(),Wb=c.W*u,Wp=c.port*u,r=A.rng(5);
 let rip='';for(let i=0;i<Math.max(6,Wp/40);i++)rip+=`M${f(Wb+12+r()*(Wp-40))},${f(GY+10+r()*50)}h${f(14+r()*26)}`;
 bph=c.b.map(b=>C.phase(b,now));
 svg.innerHTML=`<rect width="300" height="420" fill="#080a0e"/>
 ${A.sky(3,0,300,GY,150,290,22,40,'#10141a',0)}<rect y="140" width="300" height="210" fill="url(#mist)" opacity=".85"/>
 <g id="world">
  <g id="blds">${c.b.map((b,i)=>`<g data-b="${i}">${bldSVG(b,i,now)}</g>`).join('')}</g>
  <rect x="-600" y="${GY}" width="${f(Wb+600)}" height="90" fill="#040506"/><rect x="-600" y="${GY}" width="${f(Wb+600)}" height="1" fill="#55616f" opacity=".5"/>
  <path d="M-600,${GY+30}H${f(Wb)}" stroke="#2a3038" stroke-width="1.2" stroke-dasharray="12 10"/>
  <rect x="${f(Wb)}" y="${GY+4}" width="${f(Wp+600)}" height="90" fill="#050709"/><rect x="${f(Wb)}" y="${GY+4}" width="${f(Wp+600)}" height="1" fill="#55616f" opacity=".4"/>
  <rect x="${f(Wb-2)}" y="${GY}" width="3" height="90" fill="#151a21"/><path d="${rip}" stroke="#55616f" stroke-width=".8" opacity=".45"/>
  <g id="props">${c.props.map((p,i)=>`<g data-p="${i}">${propSVG(p)}</g>`).join('')}</g>
  <g id="ents"></g><g id="mon"></g><g id="fx" pointer-events="none"></g>
 </g>${A.rain(9,300,420,70,.12)}<rect id="rouge" width="300" height="420" fill="#b3261a" pointer-events="none"/>`;
 mon.x=clamp(mon.x,2,c.W+c.port-3);cam=clamp(mon.x-150/u,-20/u,c.W+c.port-VW/u+20/u);
 drawMon();upVille(0,now)}
function redrawB(i,now){const g=svg.querySelector(`[data-b="${i}"]`),b=C.S.city.b[i];if(g){g.innerHTML=bldSVG(b,i,now);bph[i]=C.phase(b,now)}}

const groupe=()=>[1,1,1,3,7][C.S.stage];
function spawn(type,x,o){const u=U[C.S.stage],e=Object.assign({id:++eid,type,x,vx:0,n:1,flee:0,ph:Math.random()*6.28,lane:Math.random(),dir:0,born:Date.now()},o);
 const g=document.createElementNS(NS,'g');g.setAttribute('data-e',e.id);let art='',sc=1,hr=16,cy=-8;
 if(type==='hum'){sc=1.8*u/10;for(let i=0;i<e.n;i++)art+=`<g transform="translate(${f((i-(e.n-1)/2)*4.4)},${f((i%2)*1.6)})">${A.hum()}</g>`;hr=Math.max(16,sc*(5+e.n*2.2));cy=-sc*5}
 else if(type==='car'){sc=4.5*u/41;art=A.car();hr=Math.max(17,sc*22);cy=-sc*7}
 else if(type==='heli'){sc=12*u/34;art=`<path d="M0,4L-13,62H13Z" fill="url(#beamv)" opacity=".5"/>`+A.heli();hr=Math.max(20,sc*19);cy=0}
 else{sc=40*u/104;art=A.boat();hr=Math.max(22,sc*36);cy=-sc*12}
 e.sc=sc;g.innerHTML=`<g>${art}</g><circle cy="${f(cy)}" r="${f(hr)}" fill="#000" fill-opacity="0"/>`;
 e.el=g;$('#ents').appendChild(g);ents.push(e);return e}
function kill(e,fade){ents=ents.filter(x=>x!==e);if(fade){e.el.classList.add('fade');setTimeout(()=>e.el.remove(),360)}else e.el.remove()}
function spawner(now){const S=C.S,st=S.stage,u=U[st],c=S.city,vl=cam,vr=cam+VW/u,lit=C.stats(now).lit,cnt=t=>ents.filter(e=>e.type===t).length;
 if(cnt('hum')<5&&Math.random()<.15+.6*lit){const l=Math.random()<.5,x=clamp(l?vl-1.5:vr+1.5,.5,c.W-1);if(x<vr+3&&x>vl-3)spawn('hum',x,{vx:(l?1:-1)*(.8+Math.random()*.6),n:groupe()})}
 if(cnt('car')<(st<2?1:2)&&Math.random()<.22*(.3+lit)){const l=Math.random()<.5,x=clamp(l?vl-4:vr+4,-5,c.W-4);if(x<vr+6)spawn('car',x,{vx:(l?1:-1)*(3+Math.random()*2)})}
 if(st>=3&&cnt('heli')<1&&Math.random()<.1)spawn('heli',mon.x,{});
 if(st>=3&&cnt('boat')<2&&Math.random()<.2)spawn('boat',c.W+16+Math.random()*(c.port-32),{vx:(Math.random()<.5?1:-1)*(1+Math.random())})}
function upVille(dt,now){const S=C.S,st=S.stage,u=U[st],c=S.city,Wt=c.W+c.port,mh=MH[st],tg=mon.tgt,fz=C.frenzied(now);
 let goal=null,reach=1/u,act=null;
 if(tg){
  if(tg.k==='e'){const e=ents.find(x=>x.id===tg.id);if(!e)mon.tgt=null;else{goal=e.x;reach=(24+mh*.32)/u;act=()=>bite(e,now)}}
  else if(tg.k==='b'){const b=c.b[tg.id];goal=b.x+b.w/2;reach=b.w/2+mh*.3/u;act=()=>strike(tg.id,now)}
  else{goal=c.props[tg.id].x;reach=(16+mh*.25)/u;act=()=>smashP(tg.id,now)}}
 else if(mon.tx!=null)goal=mon.tx;
 let walking=false;
 if(goal!=null){const d=goal-mon.x,ad=Math.abs(d);
  if(ad>reach){mon.face=d>0?1:-1;mon.x+=Math.sign(d)*Math.min(ad-reach*.85,WALK*(fz?1.7:1)/u*dt);walking=true}
  else if(act){if(ad>.2/u)mon.face=d>0?1:-1;if(now>mon.cool)act()}
  else mon.tx=null}
 mon.x=clamp(mon.x,1,Wt-2);mon.walk=walking?mon.walk+dt:0;
 const des=clamp(mon.x-150/u,-20/u,Wt-VW/u+20/u);cam+=(des-cam)*(dt?Math.min(1,dt*4):1);
 $('#world').setAttribute('transform',`translate(${f(-cam*u)},0)`);
 place(mon.x*u,GY-(walking?Math.abs(Math.sin(mon.walk*9))*2.5:0),mon.face,mh);
 for(const e of ents.slice()){let y=GY;
  if(e.type==='hum'){if(now<e.flee)e.vx=(e.x>=mon.x?1:-1)*3.4;else if(Math.abs(e.vx)>1.6)e.vx=Math.sign(e.vx)*1.1;
   e.x+=e.vx*dt;y=GY+3+e.lane*6;if(e.x<0||e.x>c.W-.4||Math.abs(e.x-mon.x)*u>560){kill(e);continue}}
  else if(e.type==='car'){e.x+=e.vx*dt;if(e.x>c.W-3.5&&e.vx>0)e.vx=-e.vx;y=GY+14+e.lane*12;if(e.x<-8||Math.abs(e.x-mon.x)*u>640){kill(e);continue}}
  else if(e.type==='heli'){e.ph+=dt;e.x=mon.x+110/u*Math.sin(e.ph*.5);const alt=mh*1.02+50+56*Math.sin(e.ph*.9);e.low=alt<mh*1.02+32;e.vx=Math.cos(e.ph*.5);y=GY-alt;if(now-e.born>45000){kill(e,1);continue}}
  else{e.x+=e.vx*dt;if(e.x<c.W+14||e.x>Wt-14)e.vx=-e.vx;y=GY+12+Math.sin(now/900+e.ph)*1.2}
  const dir=e.vx<0?-1:1;if(dir!==e.dir){e.dir=dir;e.el.firstChild.setAttribute('transform',`scale(${f2(dir*e.sc)},${f2(e.sc)})`)}
  e.el.setAttribute('transform',`translate(${f(e.x*u)},${f(y)})`)}
 if(dt&&now>spawnT){spawnT=now+(fz?500:1200);spawner(now)}}
/* série : enchaîner les prises en moins de 4 secondes fait monter le bonus, jusqu'à ×2 */
const suite=now=>now<mon.comboT?mon.combo+1:1,bonus=n=>Math.min(2,1+.2*(n-1));
function reussi(n,now){mon.combo=n;mon.comboT=now+4000}
function bite(e,now){mon.tgt=null;
 if(e.type==='heli'&&!e.low){say('Trop haut. Attends qu\'il descende.');return}
 const n=suite(now),r=C.eat(e.type,e.n,now,bonus(n));if(!r.ok){say(r.why);return}
 reussi(n,now);kill(e,1);anim('bite',320);son('croc');mon.cool=now+(C.frenzied(now)?140:320);gagne(r.g,n);hud()}
function strike(i,now){mon.tgt=null;const n=suite(now),r=C.hit(i,now,bonus(n));if(!r.ok){say(r.why);return}
 mon.cool=now+(C.frenzied(now)?220:550);anim('hit',420);shake();redrawB(i,now);const b=C.S.city.b[i];
 if(r.was===0)for(let k=0;k<3;k++)spawn('hum',clamp(b.x+b.w*Math.random(),.5,C.S.city.W-1),{flee:now+6000,n:groupe()});
 if(r.s===3){reussi(n,now);son('chute');gagne(r.g,n);say(C.S.stage>=4?'Il fouille les décombres.':'Il s\'effondre.')}
 else{son('coup');if(r.pw>1)say('Coup de rage : il compte double.')}
 hud()}
function smashP(i,now){mon.tgt=null;const n=suite(now),r=C.smash(i,now,bonus(n));if(!r.ok){say(r.why);return}
 reussi(n,now);mon.cool=now+400;anim('hit',420);son('coup');const g=svg.querySelector(`[data-p="${i}"]`);if(g)g.innerHTML=propSVG(C.S.city.props[i]);gagne(r.g,n);hud()}
function ring(x,y){const fx=$('#fx');if(!fx)return;const c=document.createElementNS(NS,'circle');c.setAttribute('cx',f(x));c.setAttribute('cy',f(y));c.setAttribute('r',6);c.setAttribute('class','ring');fx.appendChild(c);setTimeout(()=>c.remove(),950)}

/* ---------- actions ---------- */
function action(a){const S=C.S,now=Date.now();
 if(a==='retour')return accueil();
 if(a==='couver'){C.start(choix,($('#nom').value||'').trim().slice(0,14)||C.PRENOMS[0]);return jouer()}
 if(a==='journal')return journal();
 if(a==='fermer')return $('#voile').classList.remove('on');
 if(a==='nouveau'){if(S&&!S.dead&&!confirm('Recommencer ? '+S.name+' sera perdu et tu choisiras un nouvel œuf.'))return;C.reset();return accueil()}
 if(!S||den.game)return;
 if(den.wash){lavFin(now);if(a==='laver')return}
 if(a==='dormir'){const r=C.sleep(!S.sleep);if(!r.ok)return say(r.why);den.puffT=0;return hud()}
 if(a==='laver'){const r=C.washCan();if(!r.ok)return say(r.why);return lavDebut(now)}
 if(a==='jouer'){const r=C.playCan(now);if(!r.ok)return say(r.why);return jeuDebut(now)}
 if(a==='rugir'){const ville=mode==='ville',r=C.roar(now,ville);if(!r.ok)return say(r.why);rugit();anim('roar',720);
  if(ville){const u=U[S.stage],c=S.city;ring(mon.x*u+mon.face*MH[S.stage]*.3,GY-MH[S.stage]*.8);shake();
   if(r.frz){son('chute');say('Déchaîné. Tout tombe, tout se mange.',12000)}
   for(const e of ents)if(e.type==='hum')e.flee=now+6000;
   let n=ents.filter(e=>e.type==='hum').length;
   for(const b of c.b){if(n>=11)break;const cx=b.x+b.w/2;if(b.s<=1&&cx>cam-2&&cx<cam+VW/u+2){spawn('hum',clamp(cx+(Math.random()-.5)*b.w*.6,.5,c.W-1),{flee:now+6000,n:groupe()});n++}}}
  else say('Il s\'échauffe.');
  return hud()}
 if(a==='sortir'){const w=C.busy();if(w)return say(w);mode='ville';mon.x=14;mon.face=1;build();hud();return}
 if(a==='rentrer'){mode='taniere';build();hud();return}
 if(a==='frapper'){const c=S.city;let best=null,bd=1e9;
  if(S.stage>=C.MIN.bld){c.b.forEach((b,i)=>{const d=Math.abs(b.x+b.w/2-mon.x);if(b.s<3&&d<bd){bd=d;best={k:'b',id:i}}})}
  else c.props.forEach((p,i)=>{const d=Math.abs(p.x-mon.x);if(!p.s&&S.stage>=C.MIN[p.k]&&d<bd){bd=d;best={k:'p',id:i}}});
  if(best)mon.tgt=best;else say('Rien à casser pour l\'instant.')}}
function journal(){const S=C.S;if(!S)return;const e=S.eaten,jr=t=>S.hatch?'Jour '+(Math.floor((t-S.hatch)/864e5)+1)+' · '+hhmm(t):hhmm(t);
 $('#panneau').innerHTML=`<h2 class="t">${S.name}</h2><div class="bilan t">Terreur ${nb(S.score)} · ${e.hum} passants · ${e.car} voitures · ${e.boat} bateaux · ${e.heli} hélicoptères · ${e.bld} immeubles</div>`
  +`<button class="gros sec t" data-a="nouveau">Recommencer son personnage</button><h3 class="t">Journal</h3>`
  +(S.log.length?S.log.map(l=>`<div class="ligne"><span class="t">${jr(l.t)}</span>${l.x}</div>`).join(''):'<div class="vide">Aucune dépêche pour l\'instant.</div>')
  +`<button class="gros t" data-a="fermer">Fermer</button>`;
 $('#voile').classList.add('on');$('#voile').scrollTop=0}
function mort(){const S=C.S;if($('#voile').classList.contains('on'))return;
 $('#panneau').innerHTML=`<h2 class="t">${S.name} s'est éteint</h2><p>Jour ${C.jour(S.last)}. Il a eu faim trop longtemps. Sa lueur est partie d'un coup, sans bruit.</p><p>${S.city.name} rallume ses fenêtres une à une.</p><button class="gros t" data-a="nouveau">Un nouvel œuf</button>`;
 $('#voile').classList.add('on')}

/* ---------- entrées ---------- */
document.addEventListener('click',e=>{const sp=e.target.closest('[data-sp]');if(sp)return fiche(+sp.dataset.sp);const b=e.target.closest('[data-a]');if(b)action(b.dataset.a)});
svg.addEventListener('pointerdown',e=>{const S=C.S;if(!S||ecran!=='jeu')return;const now=Date.now();
 if(mode==='taniere'){
  if(den.wash){const p=pt(e);den.wash.down=true;den.wash.lx=p.x;den.wash.ly=p.y;lavFrotte(p,now);try{svg.setPointerCapture(e.pointerId)}catch(x){}return}
  if(den.game)return jeuFin(now);
  if(S.stage===0&&e.target.closest('[data-oeuf]')){C.tapEgg(now);if(S.stage>0){build();say('Il est né.',3500);rugit()}else drawMon();hud()}
  else if(S.stage>0&&e.target.closest('#mg')&&!S.sleep&&!S.dead)anim('hop');
  return}
 const w=C.busy();if(w)return say(w);
 const t=e.target.closest('[data-e],[data-b],[data-p]'),u=U[S.stage];
 if(t&&t.dataset.e)mon.tgt={k:'e',id:+t.dataset.e};
 else if(t&&t.dataset.p&&!S.city.props[+t.dataset.p].s)mon.tgt={k:'p',id:+t.dataset.p};
 else if(t&&t.dataset.b&&S.city.b[+t.dataset.b].s<3&&(S.stage>=C.MIN.bld||pt(e).y<GY-8))mon.tgt={k:'b',id:+t.dataset.b};
 else{mon.tgt=null;mon.tx=pt(e).x/u+cam}});
svg.addEventListener('pointermove',e=>{if(den.wash&&den.wash.down)lavFrotte(pt(e),Date.now())});
const leve=()=>{if(den.wash){den.wash.down=false;const o=$('#outil');if(o)o.setAttribute('opacity',0)}};
svg.addEventListener('pointerup',leve);svg.addEventListener('pointercancel',leve);
function pt(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}

/* ---------- boucles ---------- */
function lent(){const S=C.S;if(!S||ecran!=='jeu')return;const now=Date.now();
 const ch=C.advance(now);
 if(ch||S.stage!==shown){build();if(S.stage>1)say('Il a grandi.',4000)}
 else if(mode==='ville'){S.city.b.forEach((b,i)=>{if(C.phase(b,now)!==bph[i])redrawB(i,now)})}
 hud();if(S.dead)mort()}
function step(dt){const S=C.S;if(!S||ecran!=='jeu')return;const now=Date.now();if(mode==='ville')upVille(dt,now);else upDen(dt,now)}
function frame(t){const dt=Math.min(.1,(t-last)/1000||0);last=t;step(dt);requestAnimationFrame(frame)}
setInterval(lent,1000);setInterval(()=>C.save(),5000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)C.save();else lent()});
window.addEventListener('pagehide',()=>C.save());

/* ---------- démarrage ---------- */
$('[data-a="journal"]').innerHTML=A.icon('journal');
const q=new URLSearchParams(location.search),dm=q.get('demo');
if(dm){const st={oeuf:0,bebe:1,enfant:2,ado:3,titan:4}[dm];
 C.demo({stage:st==null?3:st,sp:+(q.get('sp')||0),ruines:q.get('ruines')==='1',faim:q.get('faim')!=null?+q.get('faim'):null,rage:q.get('rage')!=null?+q.get('rage'):null});
 jouer();if(q.get('ecran')==='ville'&&C.S.stage>0){mode='ville';mon.x=+(q.get('x')||40);build();hud()}
 else if(q.get('etat')==='dort'&&C.S.stage>0){C.S.energie=40;C.S.sleep=true;hud()}
 else if(q.get('etat')==='lave'&&C.S.stage>0){C.S.proprete=35;lavDebut(Date.now())}}
else if(q.get('ecran')==='accueil'){C.nosave=true;accueil()}
else if(C.load()){C.advance(Date.now());jouer();if(C.S.dead)mort()}
else accueil();
requestAnimationFrame(frame);
TV.ui={step,lent,action,spawn,mon,den,jeuFin,lavFrotte,lavFin,get ents(){return ents},get mode(){return mode},get cam(){return cam}};
})();
