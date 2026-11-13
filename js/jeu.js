/* Titan-Ville — interface : choix de l'œuf, tanière, ville. */
(function(){
const TV=window.TV,A=TV.art,C=TV.core,$=s=>document.querySelector(s),f=A.f,f2=A.f2;
const NS='http://www.w3.org/2000/svg';
const VW=300,GY=350,DY=356;       // largeur de vue, sol de la ville, sol de la tanière
const U=[14,14,7,3.2,1.6];        // pixels par mètre selon le stade : la caméra recule quand il grandit
const MH=[0,84,108,134,160];      // hauteur du monstre à l'écran, en ville
const DH=[0,86,112,140,168];      // dans la tanière
const WALK=85;                    // px/s
let ecran='',mode='taniere',shown=-1,ents=[],eid=0,spawnT=0,last=0,cam=0,sayT=0,choix=0,bph=[],barKey='',flashT=0,orageT=0,L={},tirs=[],armLvl=0,armT=0,jetT=0;
const mon={x:14,tx:null,face:1,tgt:null,cool:0,walk:0,combo:0,comboT:0,wk:false,ko:false};
const den={x:150,tx:150,wait:2,face:1,game:null,wash:null,puffT:0,wk:false};
const svg=$('#scene'),main=$('#main');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hhmm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const nb=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
const el=(tag,at,cls)=>{const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);if(cls)e.setAttribute('class',cls);return e};

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
function jouer(){mode='taniere';shown=-1;go('jeu');build();hud()}

/* ---------- sons : les rugissements enregistrés, et quelques bruits fabriqués ---------- */
let AC=null;
function son(k){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();const t=AC.currentTime;
 const bruit=(d,fr,v)=>{const b=AC.createBuffer(1,Math.floor(AC.sampleRate*d),AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);
  const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=b;fl.type='lowpass';fl.frequency.value=fr;g.gain.value=v;s.connect(fl);fl.connect(g);g.connect(AC.destination);s.start(t)};
 if(k==='croc')bruit(.1,1500,.45);
 else if(k==='eau')bruit(.2,3400,.16);
 else if(k==='chute')bruit(1.2,170,1);
 else if(k==='tonnerre')bruit(2.2,110,.6);
 else if(k==='tir')bruit(.06,2600,.22);
 else if(k==='canon')bruit(.35,320,.7);
 else if(k==='jet')bruit(1.3,900,.3);
 else if(k==='sirene'){const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';for(let i=0;i<3;i++){o.frequency.setValueAtTime(430,t+i*.5);o.frequency.linearRampToValueAtTime(690,t+i*.5+.25);o.frequency.linearRampToValueAtTime(430,t+i*.5+.5)}g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(.001,t+1.5);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+1.5)}
 else{bruit(.25,240,.8);const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(92,t);o.frequency.exponentialRampToValueAtTime(36,t+.22);g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.001,t+.26);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.27)}
 }catch(e){}}
function rugit(){try{const a=new Audio('sons/rugir-'+(1+Math.floor(Math.random()*4))+'.wav');a.playbackRate=.8;a.volume=.8;a.play().catch(()=>{})}catch(e){}}

/* ---------- effets ---------- */
function say(t,ms=2600){if(!t)return;sayT=Date.now()+ms;const m=$('#msg');m.textContent=t;m.className='t hot'}
function anim(c,ms=500){const m=$('#mi');if(!m)return;m.classList.remove('bite','hit','hop','roar','nait','touche');void m.getBBox();m.classList.add(c);setTimeout(()=>m.classList.remove(c),ms)}
function shake(){svg.classList.remove('shake');void svg.getBBox();svg.classList.add('shake');setTimeout(()=>svg.classList.remove('shake'),340)}
function eclairEcran(c,orage){const e=$('#eclair');e.style.background=c||'#dfe9f5';e.classList.remove('coup','orage');void e.offsetWidth;e.classList.add(orage?'orage':'coup')}
/* éclats qui volent : n petits morceaux partant de (x,y) vers le haut */
function eclats(x,y,n,c,force=1){const fx=$('#fx');if(!fx)return;for(let i=0;i<n;i++){const s=1.4+Math.random()*3*force,a=-Math.PI*(.08+.84*Math.random()),d=(16+Math.random()*34)*force;
 const e=el('rect',{x:f(x-s/2),y:f(y-s/2),width:f(s),height:f(s*(.5+Math.random())),fill:c},'eclat');e.style.setProperty('--dx',f(Math.cos(a)*d)+'px');e.style.setProperty('--dy',f(Math.sin(a)*d)+'px');e.style.setProperty('--r',Math.round((Math.random()-.5)*640)+'deg');fx.appendChild(e);setTimeout(()=>e.remove(),800)}}
function poussiere(x,y,w,n=4){const fx=$('#fx');if(!fx)return;for(let i=0;i<n;i++){const e=el('ellipse',{cx:f(x+(Math.random()-.5)*w),cy:f(y-Math.random()*w*.12),rx:f(w*(.18+Math.random()*.2)),ry:f(w*(.08+Math.random()*.08)),fill:'#5a6370',filter:'url(#b5)'},'pous');e.style.animationDelay=(i*.08)+'s';fx.appendChild(e);setTimeout(()=>e.remove(),1600)}}
function ring(x,y){const fx=$('#fx');if(!fx)return;const c=el('circle',{cx:f(x),cy:f(y),r:6},'ring');fx.appendChild(c);setTimeout(()=>c.remove(),950)}
/* grand titre au milieu de l'écran, pour les moments qui comptent */
function titre(p,g,t,ms=3400){const e=$('#titre');e.children[0].textContent=p;e.children[1].textContent=g;e.children[2].textContent=t||'';e.classList.remove('on');void e.offsetWidth;e.classList.add('on');clearTimeout(titre.t);titre.t=setTimeout(()=>e.classList.remove('on'),ms)}
function fondu(cb){const e=$('#fondu');e.classList.add('on');setTimeout(()=>{cb();setTimeout(()=>e.classList.remove('on'),70)},180)}
function glow(){const S=C.S,m=$('#mi');if(!m)return;const g=S.dead?.04:S.sleep?.18:C.frenzied(Date.now())?1.6:(.2+.8*S.vie/100)*(S.faim<20?.7:1);   /* la lueur est sa vie */
 m.style.setProperty('--gl',f2(g));m.classList.toggle('dort',!!S.sleep);m.classList.toggle('blesse',!S.sleep&&!S.dead&&S.vie<40);
 if(L.aura)L.aura.setAttribute('opacity',f2(Math.min(1,g)));if(L.reflet)L.reflet.setAttribute('opacity',f2(.34*Math.min(1,g)))}
function place(x,y,face,h){const g=$('#mg');if(g){const s=h/168;g.setAttribute('transform',`translate(${f(x)},${f(y)}) scale(${f2(face*s)},${f2(s)}) translate(-160,-190)`)}}
function pas(m,walking){if(m.wk!==walking){m.wk=walking;const mi=$('#mi');if(mi)mi.classList.toggle('marche',walking)}}
function drawMon(){const S=C.S,g=$('#mon'),sp=A.SP[S.sp];if(!g)return;mon.wk=den.wk=false;
 if(S.stage===0){g.innerHTML=`<g transform="translate(150,${DY}) scale(1.6)" data-oeuf="1"><g id="oeuf">${A.egg(sp.c,S.taps/12)}</g><circle cy="-30" r="34" fill="#000" fill-opacity="0"/></g>`;return}
 g.innerHTML=`<g id="mg"><g id="mi">${sp.draw(S.stage)}</g></g>`;glow()}
/* ce que l'action a fait gagner, écrit au-dessus du monstre */
const gtxt=g=>!g?'':g.sec>0?'+'+(g.sec>=5400?(g.sec/3600).toFixed(1).replace('.',',')+' h':Math.max(1,Math.round(g.sec/60))+' min'):g.pts?'+'+g.pts:'';
function pop(txt,x,y,c){const fx=$('#fx');if(!fx||!txt)return;const t=el('text',{x:f(x),y:f(y),fill:c||'#cfc8b8'},'pop t');t.textContent=txt;fx.appendChild(t);setTimeout(()=>t.remove(),1300)}
function gagne(g,serie){if(!g)return;flashT=Date.now()+900;const S=C.S,sp=A.SP[S.sp];
 if(mode==='ville')pop(gtxt(g)+(serie>1?' · série ×'+serie:''),mon.x*U[S.stage],GY-MH[S.stage]-8-Math.random()*8,sp.c);
 else pop(gtxt(g),den.x,DY-DH[S.stage]-8,sp.c)}

/* ---------- bandeau du haut et boutons ---------- */
const JG=[['faim','Faim',v=>v<=30,'#ffb03a'],['energie','Énergie',v=>v<=20,'#8fd16a'],['proprete','Propreté',v=>v<=25,'#6fc3ff'],['rage','Rage',v=>v>=70,'#ff3b4e'],['vie','Vie',v=>v<=30,'#e9e4d8'],['alerte','Alerte',()=>C.armee()>0,'#b48cff']];
const dans=s=>s>=86400?Math.floor(s/86400)+' j '+Math.floor(s%86400/3600)+' h':s>=3600?Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min':s>=60?Math.ceil(s/60)+' min':'moins d\'une minute';
function hud(){const S=C.S;if(!S)return;const now=Date.now(),sp=A.SP[S.sp],st=C.stats(now),ev=C.evol(now);
 if(mode==='ville'){$('#nm').textContent=S.city.name;
  $('#sub').textContent=(C.armee()?C.ARMEE[C.armee()]+' · ':'')+nb(st.pop)+' habitants · '+(st.wait>0?'rebâtie dans '+(st.wait>=1?Math.ceil(st.wait)+' h':'moins d\'une heure'):Math.round(st.debout*100)+' % debout')}
 else{$('#nm').textContent=S.name;$('#sub').textContent=S.stage===0?'Œuf · '+sp.n:C.STN[S.stage]+' · Jour '+C.jour(now)+' · '+sp.n}
 $('#jauges').innerHTML=(S.stage===0?'':JG.map(([k,l,hot,c])=>{const v=Math.round(S[k]);return `<div class="jg t${hot(v)?' hot':''}" style="--c:${c}"><div>${l}<span>${v}</span></div><u style="--v:${v}%"></u></div>`}).join(''))
  +`<div class="jg ev t${ev.gel?' hot':''}${now<flashT?' gain':''}" style="--c:${sp.c}"><div>${S.stage===0?'Éclosion':ev.next?'Évolution · '+ev.next:'Terreur · stade final'}<span>${S.stage===0?Math.round(ev.p*100)+' %':!ev.next?nb(S.score):ev.gel?'arrêtée : '+ev.gel:(ev.x2?'×2 · ':'')+'dans '+dans(ev.reste)}</span></div><u style="--v:${(ev.p*100).toFixed(1)}%"></u></div>`;
 $('#dep').textContent=S.log[0]?hhmm(S.log[0].t)+' · '+S.log[0].x:'';
 if(now>sayT&&!den.game&&!den.wash){const[t,hot]=C.humeur(now);const m=$('#msg');m.textContent=t;m.className='t'+(hot?' hot':'')}
 svg.classList.toggle('frz',mode==='ville'&&C.frenzied(now));svg.classList.toggle('dort',mode==='taniere'&&!!S.sleep);
 main.classList.toggle('ville',mode==='ville');main.classList.toggle('lave',!!den.wash);
 glow();bar()}
function bar(){const S=C.S,e=$('#bar');if(!S||S.stage===0||S.dead){if(barKey!=='-'){barKey='-';e.innerHTML=''}return}
 const pret=mode==='ville'&&S.rage>=80&&!S.sleep,key=[mode,S.sleep,S.stage,pret,!!den.wash].join();if(key===barKey)return;barKey=key;
 const b=(a,ic,l,c='')=>`<button data-a="${a}" class="t ${c}"><i>${A.icon(ic)}</i><span>${l}</span></button>`;
 e.innerHTML=den.wash?b('laver','laver','Terminer','hot'):mode==='ville'
  ?b('rentrer','rentrer','Rentrer')+(pret?b('rugir','rugir','Déchaîner','hot grand bat'):b('rugir','rugir','Rugir','grand'))+(S.stage>=C.MIN.bld?b('frapper','frapper','Frapper'):b('frapper','frapper','Écraser'))
  :(S.sleep?b('dormir','reveil','Réveiller'):b('dormir','dormir','Dormir'))+b('laver','laver','Laver')+b('jouer','jouer','Jouer')+b('rugir','rugir','Rugir')+b('sortir','sortir','Sortir','hot')}
function build(){const S=C.S;shown=S.stage;ents=[];tirs=[];mon.ko=false;mon.tgt=null;mon.tx=null;mon.combo=0;den.game=null;den.wash=null;L={};if(mode==='ville')buildVille();else buildDen()}

/* ---------- la tanière ---------- */
function buildDen(){const S=C.S,now=Date.now(),st=C.stats(now),sp=A.SP[S.sp];
 svg.innerHTML=`<rect width="300" height="420" fill="#0a0d11"/><ellipse cx="150" cy="205" rx="178" ry="205" fill="url(#fog)"/>
 <circle cx="212" cy="120" r="24" fill="#b3261a" opacity=".3" filter="url(#b5)"/><circle cx="212" cy="120" r="12" fill="#c9765a" opacity=".5"/>
 ${st.feu?A.fire(96,270,.9,.5)+A.smoke(92,264,.9,.6):''}
 ${A.sky(S.city.seed%997+1,34,272,270,6,28,6,12,'#0c0f14',.28*st.lit,.45)}
 <circle class="feu-r" cx="188" cy="240" r="1.1" fill="#ff3b30"/><circle class="feu-r" cx="96" cy="246" r="1" fill="#ff3b30" style="animation-delay:.7s"/>
 <rect y="270" width="300" height="100" fill="#050709"/>
 <ellipse cx="212" cy="302" rx="5" ry="28" fill="#c9765a" opacity=".18" filter="url(#b2)"/>
 <g stroke="#55616f" stroke-width=".7" opacity=".4"><path d="M70,278h44M130,276h44M200,284h30M170,298h40M190,316h30M82,308h26M60,330h50M150,338h44M214,344h30"/></g>
 <ellipse cx="150" cy="${DY-3}" rx="82" ry="12" fill="${sp.c}" opacity=".2" filter="url(#b5)"/>
 <rect id="nuit" width="300" height="420" fill="#020304" pointer-events="none"/>
 <g id="mon"></g>
 <path fill-rule="evenodd" fill="#020304" d="M0,0H300V420H0ZM30,${DY}C6,220 48,44 150,34C252,44 294,220 270,${DY}Z"/>
 <path fill="#020304" d="M88,58l6,46l7,-50ZM128,36l5,32l6,-33ZM186,40l6,52l8,-46ZM224,68l4,28l6,-20ZM62,98l4,26l5,-24ZM250,112l3,20l5,-18Z"/>
 <path d="M30,${DY}C6,220 48,44 150,34" fill="none" stroke="#7f8fa3" stroke-width=".9" opacity=".34"/><path d="M270,${DY}C294,220 252,44 150,34" fill="none" stroke="#7f8fa3" stroke-width=".6" opacity=".12"/>
 <path d="M30,${DY}H270" stroke="#55616f" stroke-width=".8" opacity=".4"/>
 <g><circle class="drip" cx="94" cy="104" r="1.2" style="--d:${DY-106}px"/><circle class="drip" cx="192" cy="92" r="1.2" style="--d:${DY-94}px;animation-delay:1.3s"/><circle class="drip" cx="133" cy="68" r="1.1" style="--d:${DY-70}px;animation-delay:2.4s"/></g>
 <g fill="#0b0e13" stroke="#55616f" stroke-width=".7" stroke-opacity=".55">
  <path transform="translate(52,${DY+34}) rotate(-9)" d="M-30,0V-9Q-28,-12 -22,-12L-15,-21H9L18,-12H27Q31,-12 31,-6V0Z"/>
  ${A.rub(21,96,214,DY+46,12,'#0b0e13')}
 </g>
 <g fill="none" stroke="#4a5462" stroke-width="2.2" stroke-linecap="round"><path d="M232,${DY+46}q-6,-30 12,-36M242,${DY+48}q-4,-28 12,-32M252,${DY+48}q-2,-24 12,-26M262,${DY+46}q0,-18 10,-20"/><path d="M226,${DY+48}h50" stroke-width="1.6"/></g>
 <g id="fx" pointer-events="none"></g>`;
 den.x=den.tx=150;drawMon();place(den.x,DY,den.face,DH[S.stage])}
function upDen(dt,now){const S=C.S;if(S.stage===0||S.dead)return;
 if(S.sleep){pas(den,false);   /* il dort : un souffle de buée monte de sa tête à chaque respiration */
  if(now>den.puffT){den.puffT=now+4200;const fx=$('#fx'),h=DH[S.stage];
   if(fx)for(let i=0;i<2;i++){const c=el('circle',{cx:f(den.x+den.face*h*.32+i*5),cy:f(DY-h*.76-i*4),r:f(3+i*1.5)},'souffle');c.style.animationDelay=(i*.45)+'s';fx.appendChild(c);setTimeout(()=>c.remove(),4300)}}
  return}
 if(den.wash)return pas(den,false);
 if(den.game){pas(den,false);const x=150+90*Math.sin((now-den.game.t0)/1000*3.4);den.game.x=x;const c=$('#curseur');if(c)c.setAttribute('x',f(x-1));if(now-den.game.t0>7000)jeuFin(now);return}
 let w=false;
 if(Math.abs(den.tx-den.x)<1){den.wait-=dt;if(den.wait<=0){den.tx=105+Math.random()*90;den.wait=2+Math.random()*5}}
 else{const d=den.tx-den.x;den.face=d>0?1:-1;den.x+=Math.sign(d)*Math.min(Math.abs(d),14*dt);w=true}
 pas(den,w);place(den.x,DY-(w?Math.abs(Math.sin(now/170))*1.6:0),den.face,DH[S.stage])}
/* le jeu d'adresse : un trait va et vient, il faut toucher quand il passe au centre */
function jeuDebut(now){const S=C.S,sp=A.SP[S.sp],h=DH[S.stage];den.game={t0:now,x:150};den.x=den.tx=clamp(den.x,112,148);den.face=1;place(den.x,DY,1,h);
 $('#fx').innerHTML=`<g id="epave" transform="translate(${f(den.x+h*.62)},${DY})"><g><path d="M-15,0L-13,-10L-5,-16L7,-13L14,-7L15,0Z" fill="#1a2029"/><path d="M-13,-10L-5,-16L7,-13" fill="none" stroke="#8898ac" stroke-width="1"/></g></g>
 <g id="visee"><rect x="56" y="366" width="188" height="20" rx="3" fill="#020304" fill-opacity=".8"/><rect x="60" y="375" width="180" height="3" fill="#1f252d"/><rect x="116" y="374" width="68" height="5" fill="#55616f"/><rect x="138" y="373" width="24" height="7" fill="${sp.c}"/><rect id="curseur" x="149" y="367" width="2" height="19" fill="#fff"/></g>`;
 const m=$('#msg');m.textContent='Touche quand le trait passe au centre.';m.className='t hot';sayT=now+7000}
function jeuFin(now){const g=den.game;if(!g)return;den.game=null;const d=Math.abs(g.x-150),q=now-g.t0>7000?0:d<=12?2:d<=34?1:0,r=C.playEnd(q,now);
 anim('hit',420);son('coup');const e=$('#epave g'),v=$('#visee'),ex=den.x+DH[C.S.stage]*.62;if(e)e.setAttribute('class','vol'+q);if(v)v.remove();setTimeout(()=>{const x=$('#epave');if(x)x.remove()},850);
 if(q)eclats(ex,DY-8,q*5,'#8898ac');
 say(['Raté. Il grogne.','Bien visé.','En plein dedans.'][q]);gagne(r.g,1);hud()}
/* le lavage, comme dans Mini-Titan : on frotte le monstre du doigt, la suie s'en va tache par tache */
function lavDebut(now){const S=C.S,h=DH[S.stage];den.x=den.tx=150;den.face=1;place(150,DY,1,h);
 let s='';for(let i=0,n=Math.ceil((100-S.proprete)/8);i<n;i++)s+=`<circle class="suie" cx="${f(150+(Math.random()-.5)*h*.9)}" cy="${f(DY-h*(.12+Math.random()*.72))}" r="${f(3.5+Math.random()*4.5)}"/>`;
 $('#fx').innerHTML=`<g id="suies">${s}</g><g id="outil" opacity="0"><circle r="12" fill="#6fc3ff" fill-opacity=".16" stroke="#6fc3ff" stroke-width="1.2"/><circle r="3" fill="#bfe6ff"/></g>`;
 den.wash={p0:S.proprete,acc:0,down:false,lx:0,ly:0,sonT:0,fin:false};
 const m=$('#msg');m.textContent='Frotte-le pour le décrasser.';m.className='t hot';hud()}
function lavFrotte(p,now){const w=den.wash,S=C.S,h=DH[S.stage],o=$('#outil'),fx=$('#fx');if(!w||w.fin)return;
 if(o){o.setAttribute('transform',`translate(${f(p.x)},${f(p.y)})`);o.setAttribute('opacity',1)}
 if(Math.abs(p.x-150)<h*.62&&p.y>DY-h-12&&p.y<DY+8)w.acc+=Math.hypot(p.x-w.lx,p.y-w.ly);
 w.lx=p.x;w.ly=p.y;let pasFait=false;
 while(w.acc>=40&&!w.fin){w.acc-=40;pasFait=true;const plein=C.washStep(2);
  for(let i=0;i<2;i++){const c=el('circle',{cx:f(p.x+(Math.random()-.5)*26),cy:f(p.y+(Math.random()-.5)*16),r:f(1.2+Math.random()*1.6)},'goutte');fx.appendChild(c);setTimeout(()=>c.remove(),950)}
  const su=$('#suies'),reste=Math.ceil((100-S.proprete)/8);   /* la tache la plus proche du doigt part en premier */
  while(su&&su.children.length>reste){let best=null,bd=1e9;for(const c of su.children){const d=Math.hypot(+c.getAttribute('cx')-p.x,+c.getAttribute('cy')-p.y);if(d<bd){bd=d;best=c}}best.remove()}
  if(now-w.sonT>380){w.sonT=now;son('eau')}
  if(plein){w.fin=true;anim('hop');setTimeout(()=>lavFin(Date.now()),900)}}
 if(pasFait)hud()}
function lavFin(now){const w=den.wash;if(!w)return;den.wash=null;const fx=$('#fx');if(fx)fx.innerHTML='';
 const r=C.washEnd(C.S.proprete-w.p0,now);say(C.S.proprete>=100?'Il est propre.':'Ça ira pour cette fois.');gagne(r.g,1);hud()}
/* naissance et évolution : éclair, éclats, le monstre surgit, un grand titre */
function naissance(){const S=C.S,sp=A.SP[S.sp];build();eclairEcran('#fff');eclats(150,DY-46,22,A.OS,1.5);eclats(150,DY-46,12,sp.c,1.3);anim('nait',900);rugit();son('chute');shake();
 titre('Éclosion',S.name,sp.n+'. '+C.DEP.eclos);hud()}
function evolution(){const S=C.S,sp=A.SP[S.sp];build();eclairEcran(sp.c);anim('nait',900);rugit();son('chute');shake();
 const x=mode==='ville'?mon.x*U[S.stage]:den.x,y=mode==='ville'?GY:DY;eclats(x,y-40,20,sp.c,1.6);poussiere(x,y,120,5);
 titre('Évolution',C.STN[S.stage],C.DEP['stade'+S.stage]||'');hud()}

/* ---------- la ville ---------- */
function bldSVG(b,i,now){const u=U[C.S.stage],x=b.x*u,w=b.w*u,h=b.h*u,ph=C.phase(b,now),r=A.rng(b.seed),rs=A.rng(b.seed+7);
 const fill=['#151a21','#10141a','#181d25'][Math.floor(rs()*3)],sty=Math.floor(rs()*3),topo=rs(),ant=rs()<.45,sign=rs()<.25,sc=['#ff3b4e','#35e0c2','#ffb03a'][Math.floor(rs()*3)],ah=(4+rs()*6)*u;
 const tower=(hh,lit,toit)=>{const y0=GY-hh;let s=`<rect x="${f(x)}" y="${f(y0)}" width="${f(w)}" height="${f(hh)}" fill="${fill}"/><rect x="${f(x)}" y="${f(y0)}" width="1.3" height="${f(hh)}" fill="#7f8fa3" opacity=".6"/><rect x="${f(x)}" y="${f(y0)}" width="${f(w)}" height="1" fill="#7f8fa3" opacity=".3"/>`;
  /* trois façons de percer la façade : grille, bandeaux, fenêtres étroites */
  const cw=[2.8,3.8,2][sty]*u,rh=[3.3,3.3,3.7][sty]*u,ww=[1.2,3.1,.75][sty]*u,wh=[1.6,1,2.1][sty]*u;
  for(let k=0;(k+1)*rh<hh-rh*.2&&GY-(k+1)*rh>-60;k++)for(let xx=x+cw*.45;xx<x+w-ww-cw*.15;xx+=cw){const v=r(),o=r();if(v<lit)s+=`<rect x="${f(xx)}" y="${f(GY-(k+1)*rh+rh*.3)}" width="${f(ww)}" height="${f(wh)}" fill="#ffc76b" opacity="${(.3+o*.5).toFixed(2)}"/>`}
  if(u>=7)s+=`<rect x="${f(x+w/2-.8*u)}" y="${f(GY-2.3*u)}" width="${f(1.6*u)}" height="${f(2.3*u)}" fill="#05070a"/>`;
  if(toit&&y0>-80){let top=y0;
   if(topo<.3){const th=Math.min(hh*.1,5*u);top=y0-th;s+=`<rect x="${f(x+w*.18)}" y="${f(top)}" width="${f(w*.64)}" height="${f(th)}" fill="${fill}"/><rect x="${f(x+w*.18)}" y="${f(top)}" width="1.2" height="${f(th)}" fill="#7f8fa3" opacity=".55"/><rect x="${f(x+w*.18)}" y="${f(top)}" width="${f(w*.64)}" height="1" fill="#7f8fa3" opacity=".3"/>`}
   else if(topo>.72){s+=`<rect x="${f(x+w*.6)}" y="${f(y0-2.6*u)}" width="${f(2.4*u)}" height="${f(1.7*u)}" fill="${fill}"/><rect x="${f(x+w*.6)}" y="${f(y0-2.6*u)}" width="${f(2.4*u)}" height=".9" fill="#7f8fa3" opacity=".4"/><path d="M${f(x+w*.6+.3*u)},${f(y0-.9*u)}V${f(y0)}M${f(x+w*.6+2.1*u)},${f(y0-.9*u)}V${f(y0)}" stroke="${fill}" stroke-width="${f(Math.max(.8,.25*u))}"/>`}
   else if(topo>.5)s+=`<rect x="${f(x+w*.15)}" y="${f(y0-.9*u)}" width="${f(1.6*u)}" height="${f(.9*u)}" fill="${fill}"/><rect x="${f(x+w*.42)}" y="${f(y0-.7*u)}" width="${f(1.2*u)}" height="${f(.7*u)}" fill="${fill}"/>`;
   if(ant)s+=`<rect x="${f(x+w*.5)}" y="${f(top-ah)}" width="${f(Math.max(.9,.22*u))}" height="${f(ah)}" fill="${fill}"/><circle class="feu-r" cx="${f(x+w*.5+.3)}" cy="${f(top-ah-1)}" r="${f(Math.max(1,.3*u))}" fill="#ff3b30" style="animation-delay:${(rs()*1.6).toFixed(2)}s"/>`;
   if(sign&&lit>0){const sh=Math.min(hh*.3,9*u),sw=Math.max(1.2,.8*u);s+=`<rect x="${f(x+w-sw*2.4)}" y="${f(y0+2*u)}" width="${f(sw*3)}" height="${f(sh)}" fill="${sc}" opacity=".14"/><rect x="${f(x+w-sw*1.7)}" y="${f(y0+2*u+sw*.4)}" width="${f(sw)}" height="${f(sh-sw*.8)}" fill="${sc}" opacity=".85"/>`}}
  return s};
 const crack=()=>{let d=`M${f(x+w*.62)},${f(GY-h*.92)}`,yy=.92;const sw=Math.max(1.6,.3*u);for(let k=0;k<6;k++){yy-=.12;d+=`L${f(x+w*(.45+.25*r()))},${f(GY-h*yy)}`}return `<path d="${d}" fill="none" stroke="#010101" stroke-width="${f(sw)}" stroke-linejoin="round"/>`};
 const tap=`<rect x="${f(x)}" y="${f(Math.max(-60,GY-h))}" width="${f(w)}" height="${f(Math.min(h,GY+60))}" fill="#000" fill-opacity="0"/>`;
 const rubH=Math.min(h*.2,7*u),k=w/70;
 if(ph===0)return tower(h,.42,1)+tap;
 if(ph===1)return tower(h,.18,1)+crack()+tap;
 if(ph===2)return `<g transform="rotate(7 ${f(x+w)} ${GY})">${tower(h,0,1)+crack()}</g><ellipse cx="${f(x+w/2)}" cy="${GY}" rx="${f(w*.7)}" ry="${f(Math.max(5,w*.12))}" fill="#4a525d" opacity=".5" filter="url(#b5)"/>`+tap;
 if(ph==='feu')return A.fire(x+w/2,GY-rubH*.3,k,.6)+A.smoke(x+w/2,GY-rubH,k,.7)+A.rub(b.seed,x-w*.08,x+w*1.08,GY,rubH)
  +`<g fill="#ff8a4a"><path class="flamme" d="M${f(x+w*.3)},${f(GY-rubH*.5)}l${f(w*.04)},${f(-rubH*.8)}l${f(w*.04)},${f(rubH*.8)}Z"/><path class="flamme" d="M${f(x+w*.55)},${f(GY-rubH*.6)}l${f(w*.05)},${f(-rubH)}l${f(w*.05)},${f(rubH)}Z" fill="#ffd9a8"/><path class="flamme" d="M${f(x+w*.78)},${f(GY-rubH*.4)}l${f(w*.035)},${f(-rubH*.7)}l${f(w*.035)},${f(rubH*.7)}Z"/></g>`;
 if(ph==='gravats')return A.smoke(x+w/2,GY-rubH,k*.7,.4)+A.rub(b.seed,x-w*.08,x+w*1.08,GY,rubH);
 const hh=h*.45,sw=Math.max(.6,.12*u);let lines='';for(let yy=GY-hh;yy<GY;yy+=3.3*u)lines+=`M${f(x-2)},${f(yy)}H${f(x+w+2)}`;
 return A.crane(x+w*1.05,GY,h*.95)+tower(hh,0,0)+`<path d="${lines}M${f(x-2)},${f(GY-hh)}V${GY}M${f(x+w+2)},${f(GY-hh)}V${GY}" fill="none" stroke="#55616f" stroke-width="${f(sw)}" opacity=".8"/><circle cx="${f(x+w/2)}" cy="${f(GY-hh-3)}" r="2" fill="#ffd9a8"/><circle cx="${f(x+w/2)}" cy="${f(GY-hh-3)}" r="9" fill="#ffc76b" opacity=".22" filter="url(#b2)"/>`+A.rub(b.seed,x-w*.05,x+w*1.05,GY,rubH*.35)}
/* ce que l'immeuble laisse sur la chaussée mouillée : le reflet de ses fenêtres, ou celui de son incendie */
function reflSVG(b,now){const u=U[C.S.stage],x=b.x*u,w=b.w*u,ph=C.phase(b,now);
 if(ph===0||ph===1)return `<rect x="${f(x)}" y="${GY+1}" width="${f(w)}" height="${f(Math.min(38,b.h*u*.4))}" fill="url(#refl)" opacity="${ph?'.2':'.45'}"/>`;
 if(ph==='feu')return `<ellipse cx="${f(x+w/2)}" cy="${GY+14}" rx="${f(w*.8)}" ry="12" fill="#ff6a2a" opacity=".3" filter="url(#b5)"/>`;return ''}
function propSVG(p){const u=U[C.S.stage];if(u<5)return '';const x=p.x*u,hitc=r=>`<circle cx="${f(x)}" cy="${f(GY-r*.6)}" r="${f(Math.max(16,r))}" fill="#000" fill-opacity="0"/>`;
 if(p.k==='p'){const w=.8*u,h=1.1*u;return p.s?`<path d="M${f(x-w)},${GY}l${f(w*.5)},${f(-h*.3)}l${f(w*.9)},${f(h*.1)}l${f(w*.6)},${f(h*.2)}Z" fill="#1a2029"/>`
  :`<rect x="${f(x-w/2)}" y="${f(GY-h)}" width="${f(w)}" height="${f(h)}" rx="${f(w*.15)}" fill="#1a2029"/><rect x="${f(x-w*.6)}" y="${f(GY-h)}" width="${f(w*1.2)}" height="${f(h*.14)}" fill="#7f8fa3" opacity=".7"/>`+hitc(h)}
 const w=3*u,h=2.6*u;return p.s?`<path d="M${f(x-w*.7)},${GY}l${f(w*.3)},${f(-h*.25)}l${f(w*.4)},${f(h*.08)}l${f(w*.3)},${f(-h*.15)}l${f(w*.4)},${f(h*.32)}Z" fill="#1a2029"/>`
  :`<rect x="${f(x-w/2)}" y="${f(GY-h)}" width="${f(w)}" height="${f(h)}" fill="#1a2029"/><path d="M${f(x-w*.62)},${f(GY-h)}h${f(w*1.24)}l${f(-w*.1)},${f(-h*.18)}h${f(-w*1.04)}Z" fill="#232b36"/><rect x="${f(x-w*.36)}" y="${f(GY-h*.78)}" width="${f(w*.72)}" height="${f(h*.36)}" fill="#ffc76b" opacity=".7"/>`+hitc(h)}
/* réverbères : un tous les 18 m, avec son cône de lumière et sa flaque sur le trottoir */
function lampes(c,u){let s='';const hh=Math.max(6,5.5*u),a=Math.max(2,1.4*u);
 for(let x=10;x<c.W-4;x+=18){const px=x*u;s+=`<path d="M${f(px)},${GY}V${f(GY-hh)}h${f(a)}" fill="none" stroke="#1a2029" stroke-width="${f(Math.max(.8,.18*u))}"/>`
  +(u>=3?`<path d="M${f(px+a)},${f(GY-hh)}L${f(px+a-hh*.5)},${GY}H${f(px+a+hh*.5)}Z" fill="url(#beamf)" opacity=".3"/><ellipse cx="${f(px+a)}" cy="${GY+2}" rx="${f(hh*.5)}" ry="2.4" fill="#fff0c0" opacity=".12"/>`:'')
  +`<circle cx="${f(px+a)}" cy="${f(GY-hh)}" r="${f(Math.max(.9,.22*u))}" fill="#fff0c0"/>`}
 return s}
function buildVille(){const S=C.S,u=U[S.stage],c=S.city,now=Date.now(),Wb=c.W*u,Wp=c.port*u,r=A.rng(5),sp=A.SP[S.sp],mh=MH[S.stage];
 let rip='';for(let i=0;i<Math.max(6,Wp/40);i++)rip+=`M${f(Wb+12+r()*(Wp-40))},${f(GY+10+r()*50)}h${f(14+r()*26)}`;
 bph=c.b.map(b=>C.phase(b,now));
 svg.innerHTML=`<defs><radialGradient id="aur"><stop offset="0" stop-color="${sp.c}" stop-opacity=".34"/><stop offset=".55" stop-color="${sp.c}" stop-opacity=".1"/><stop offset="1" stop-color="${sp.c}" stop-opacity="0"/></radialGradient>
 <clipPath id="sol"><rect x="-99999" y="-5000" width="199998" height="${5000+GY}"/></clipPath></defs>
 <rect width="300" height="420" fill="url(#cielv)"/>
 <circle cx="236" cy="78" r="26" fill="#b3261a" opacity=".28" filter="url(#b5)"/><circle cx="236" cy="78" r="13" fill="#c9765a" opacity=".5"/>
 <g fill="#020304" opacity=".8" filter="url(#b12)"><ellipse cx="226" cy="92" rx="70" ry="9"/><ellipse cx="70" cy="60" rx="110" ry="16"/><ellipse cx="170" cy="24" rx="100" ry="12"/></g>
 <path class="phare" style="transform-origin:64px 330px" d="M64,330L34,-20H94Z" fill="url(#beamu)"/><path class="phare p2" style="transform-origin:214px 330px" d="M214,330L190,-20H238Z" fill="url(#beamu)"/>
 <g id="loin">${A.sky(3,-60,900,GY,150,290,22,40,'#0e1218',0)}</g>
 <rect y="130" width="300" height="220" fill="url(#mist)" opacity=".8"/>
 <g id="moyen">${A.sky(8,-80,1600,GY,70,170,18,34,'#0b0e13',.07)}</g>
 <rect y="200" width="300" height="150" fill="url(#mist)" opacity=".7"/>
 <g id="world">
  <g id="blds">${c.b.map((b,i)=>`<g data-b="${i}">${bldSVG(b,i,now)}</g>`).join('')}</g>
  <rect x="-600" y="${GY}" width="${f(Wb+600)}" height="90" fill="#040506"/><rect x="-600" y="${GY}" width="${f(Wb+600)}" height="1" fill="#55616f" opacity=".5"/>
  <path d="M-600,${GY+30}H${f(Wb)}" stroke="#2a3038" stroke-width="1.2" stroke-dasharray="12 10"/>
  <rect x="${f(Wb)}" y="${GY+4}" width="${f(Wp+600)}" height="90" fill="#050709"/><rect x="${f(Wb)}" y="${GY+4}" width="${f(Wp+600)}" height="1" fill="#55616f" opacity=".4"/>
  <rect x="${f(Wb-2)}" y="${GY}" width="3" height="90" fill="#151a21"/><path d="${rip}" stroke="#55616f" stroke-width=".8" opacity=".45"/>
  <g id="reflets">${c.b.map((b,i)=>`<g data-r="${i}">${reflSVG(b,now)}</g>`).join('')}</g>
  <g id="lampes">${lampes(c,u)}</g>
  <g id="props">${c.props.map((p,i)=>`<g data-p="${i}">${propSVG(p)}</g>`).join('')}</g>
  <circle id="aura" cy="${f(GY-mh*.5)}" r="${f(mh*1.35)}" fill="url(#aur)" pointer-events="none"/>
  <ellipse id="reflet" cy="${GY+11}" rx="${f(mh*.6)}" ry="9" fill="${sp.c}" filter="url(#b5)" pointer-events="none"/>
  <g id="ents"></g><g id="mon"></g><g id="fx" pointer-events="none"></g>
 </g><rect id="rouge" width="300" height="420" fill="#b3261a" pointer-events="none"/>`;
 L={world:$('#world'),loin:$('#loin'),moyen:$('#moyen'),aura:$('#aura'),reflet:$('#reflet')};
 mon.x=clamp(mon.x,2,c.W+c.port-3);cam=clamp(mon.x-150/u,-20/u,c.W+c.port-VW/u+20/u);
 drawMon();upVille(0,now)}
function redrawB(i,now){const g=svg.querySelector(`[data-b="${i}"]`),rr=svg.querySelector(`[data-r="${i}"]`),b=C.S.city.b[i];if(g){g.innerHTML=bldSVG(b,i,now);bph[i]=C.phase(b,now)}if(rr)rr.innerHTML=reflSVG(b,now)}

const groupe=()=>[1,1,1,3,7][C.S.stage];
const humArt=e=>{let s='';for(let i=0;i<e.n;i++)s+=`<g transform="translate(${f((i-(e.n-1)/2)*4.4)},${f((i%2)*1.6)})">${A.hum((e.v+i)%3,e.fl)}</g>`;return s};
function spawn(type,x,o){const u=U[C.S.stage],e=Object.assign({id:++eid,type,x,vx:0,n:1,v:0,fl:false,flee:0,ph:Math.random()*6.28,lane:Math.random(),dir:0,born:Date.now()},o);
 const g=el('g',{'data-e':e.id}),q=Math.random();let art='',sc=1,hr=16,cy=-8,cl='';
 if(type==='hum'){e.v=Math.floor(q*3);e.fl=Date.now()<e.flee;sc=1.8*u/10;art=humArt(e);hr=Math.max(16,sc*(5+e.n*2.2));cy=-sc*5;cl=e.fl?'court':'trotte'}
 else if(type==='car'){e.v=q<.55?0:q<.75?1:q<.9?2:3;sc=4.5*u/41;art=A.car(e.v);hr=Math.max(17,sc*(e.v===1||e.v===2?34:22));cy=-sc*8}
 else if(type==='heli'){sc=12*u/34;art=`<path d="M0,4L-13,62H13Z" fill="url(#beamv)" opacity=".5"/>`+A.heli();hr=Math.max(20,sc*19);cy=0}
 else if(type==='flic'){e.v=3;sc=4.5*u/41;art=A.car(3);hr=Math.max(17,sc*22);cy=-sc*8;e.cad=1600;e.tir=Date.now()+900}
 else if(type==='tank'){sc=Math.max(8*u,22)/46;    /* au stade Titan, on grossit un peu l'armée pour qu'elle reste lisible */art=A.tank();hr=Math.max(19,sc*26);cy=-sc*8;e.cad=4500;e.tir=Date.now()+1800}
 else if(type==='gun'){sc=Math.max(13*u,26)/34;art=`<path d="M0,4L-10,62H10Z" fill="url(#beamr)" opacity=".5"/>`+A.gunship();hr=Math.max(20,sc*19);cy=0;e.cad=1300;e.tir=Date.now()+1500}
 else if(type==='jet'){sc=15*u/38;art=A.jet();hr=0;g.setAttribute('pointer-events','none')}
 else{e.v=q<.6?0:1;sc=e.v?22*u/60:40*u/104;art=A.boat(e.v);hr=Math.max(22,sc*(e.v?24:36));cy=-sc*12;cl='tangue'}
 e.sc=sc;g.innerHTML=`<g><g class="eb ${cl}">${art}</g></g><circle cy="${f(cy)}" r="${f(hr)}" fill="#000" fill-opacity="0"/>`;
 e.el=g;$('#ents').appendChild(g);ents.push(e);return e}
function kill(e,fade){ents=ents.filter(x=>x!==e);if(fade){e.el.classList.add('fade');setTimeout(()=>e.el.remove(),360)}else e.el.remove()}
/* la proie est happée : elle file vers la gueule en rapetissant */
function happe(e){ents=ents.filter(x=>x!==e);const S=C.S,u=U[S.stage],mh=MH[S.stage],g=e.el,m=/translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform')||'');
 if(!m)return g.remove();g.style.transform=`translate(${m[1]}px,${m[2]}px)`;void g.getBBox();
 g.style.transition='transform .19s ease-in,opacity .19s ease-in';g.style.transform=`translate(${f(mon.x*u+mon.face*mh*.22)}px,${f(GY-mh*.72)}px) scale(.25)`;g.style.opacity='.15';setTimeout(()=>g.remove(),210)}
function spawner(now){const S=C.S,st=S.stage,u=U[st],c=S.city,vl=cam,vr=cam+VW/u,lit=C.stats(now).lit,cnt=t=>ents.filter(e=>e.type===t).length;
 if(cnt('hum')<5&&Math.random()<.15+.6*lit){const l=Math.random()<.5,x=clamp(l?vl-1.5:vr+1.5,.5,c.W-1);if(x<vr+3&&x>vl-3)spawn('hum',x,{vx:(l?1:-1)*(.8+Math.random()*.6),n:groupe()})}
 if(cnt('car')<(st<2?1:2)&&Math.random()<.22*(.3+lit)){const l=Math.random()<.5,x=clamp(l?vl-5:vr+5,-6,c.W-5);if(x<vr+7)spawn('car',x,{vx:(l?1:-1)*(3+Math.random()*2)})}
 if(st>=3&&cnt('heli')<1&&Math.random()<.1)spawn('heli',mon.x,{});
 if(st>=3&&cnt('boat')<2&&Math.random()<.2)spawn('boat',c.W+16+Math.random()*(c.port-32),{vx:(Math.random()<.5?1:-1)*(1+Math.random())});
 /* la riposte : plus l'alerte monte, plus ce qui arrive est lourd */
 const lv=C.armee();
 if(lv>armLvl){C.log('arm'+lv,2);son('sirene');titre('Alerte',C.ARMEE[lv],['','Elle tire à vue.','Chars et hélicoptères entrent en ville.','Les avions arrivent. Reste en mouvement.'][lv],3000);hud()}
 armLvl=lv;
 if(lv&&now>armT){const bord=()=>clamp(Math.random()<.5?vl-6:vr+6,-6,c.W-5);
  if(cnt('flic')<(lv>=2?1:2)&&Math.random()<.5)spawn('flic',bord(),{});
  if(lv>=2&&cnt('tank')<(st>=4?2:1)&&Math.random()<.4)spawn('tank',bord(),{});
  if(lv>=2&&cnt('gun')<(lv>=3?2:1)&&Math.random()<.35)spawn('gun',mon.x,{off:Math.random()*6.28});
  if(lv>=3&&now>jetT){jetT=now+9000+Math.random()*6000;const l=Math.random()<.5;spawn('jet',mon.x+(l?-1:1)*480/u,{vx:(l?1:-1)*420/u});son('jet')}}}
/* ---------- l'armée : tirs et blessures ---------- */
function touche(d,x,y,now){if(mode!=='ville'||mon.ko)return;const S=C.S,r=C.wound(d,now),sp=A.SP[S.sp],gros=d>1;
 if(!r.d){eclats(x,y,gros?5:1,'#8898ac',.6);return}                 /* déchaîné : ça ricoche */
 eclats(x,y,gros?8:2,sp.c,gros?1.1:.5);                              /* sa lueur gicle : c'est sa blessure */
 if(gros){pop('−'+Math.max(1,Math.round(r.d)),mon.x*U[S.stage],GY-MH[S.stage]-6,'#ff3b4e');shake();const m=$('#mi');if(m&&!/bite|hit|roar|nait/.test(m.getAttribute('class')||''))anim('touche',240);hud()}
 if(r.ko)terrasse()}
function terrasse(){const S=C.S;mon.ko=true;mon.tgt=null;mon.tx=null;armLvl=0;son('chute');eclairEcran('#ff3b4e');shake();hud();
 titre('Terrassé',S.name,'Il se traîne jusqu\'à sa tanière. Le sommeil le soignera.',4200);
 setTimeout(()=>fondu(()=>{mode='taniere';build();hud()}),1100)}
/* balles : elles touchent toujours, mais ne font presque rien */
function rafale(e,now){const S=C.S,u=U[S.stage],mh=MH[S.stage],fx=$('#fx'),air=e.type==='gun',dir=e.vx<0?-1:1;if(!fx)return;
 const x0=e.x*u+dir*e.sc*(air?10:6),y0=e.y+(air?e.sc*4:-e.sc*13),x1=mon.x*u+(Math.random()-.5)*mh*.3,y1=GY-mh*(.3+Math.random()*.4);
 for(let i=0;i<3;i++){const l=el('path',{d:`M${f(x0)},${f(y0)}L${f(x1+(i-1)*3)},${f(y1+(i-1)*4)}`},'trace');l.style.animationDelay=(i*.07)+'s';fx.appendChild(l);setTimeout(()=>l.remove(),420)}
 son('tir');touche(air?.15:.06,x1,y1,now)}
/* obus et missiles : ils visent l'endroit où il se trouve au départ du coup, donc bouger les fait manquer */
function obus(e,now){const S=C.S,u=U[S.stage],mh=MH[S.stage],fx=$('#fx'),dir=e.vx<0?-1:1;if(!fx)return;
 const x0=e.x*u+dir*e.sc*31,y0=e.y-e.sc*12.3,x1=mon.x*u,y1=GY-mh*.42,g=el('g',{});
 g.innerHTML='<circle r="5" fill="#ff8a4a" opacity=".4" filter="url(#b2)"/><circle r="1.7" fill="#fff0c0"/>';fx.appendChild(g);
 tirs.push({el:g,x0,y0,x1,y1,t0:now,T:clamp(Math.hypot(x1-x0,y1-y0)/200,.5,1.1)*1000,d:1.5,r:mh*.28,arc:14});
 eclats(x0,y0,3,'#ffd9a8',.5);son('canon')}
function missile(e,now){const S=C.S,u=U[S.stage],mh=MH[S.stage],fx=$('#fx');if(!fx)return;
 const x0=e.x*u,y0=e.y,x1=mon.x*u,y1=GY-mh*.3,g=el('g',{}),c=el('ellipse',{cx:f(x1),cy:GY+2,rx:f(mh*.3),ry:5},'cible');
 g.innerHTML=`<g transform="rotate(${f(Math.atan2(y1-y0,x1-x0)*180/Math.PI)})"><path d="M-16,0H0" stroke="#ff8a4a" stroke-width="2" opacity=".6" filter="url(#b2)"/><path d="M-5,0H1" stroke="#fff0c0" stroke-width="1.6" stroke-linecap="round"/></g>`;
 fx.appendChild(c);fx.appendChild(g);tirs.push({el:g,cible:c,x0,y0,x1,y1,t0:now,T:1100,d:4,r:mh*.36,arc:0,gros:1})}
function upTirs(now){const S=C.S,u=U[S.stage],fx=$('#fx');
 for(const t of tirs.slice()){const p=(now-t.t0)/t.T;
  if(p<1){t.el.setAttribute('transform',`translate(${f(t.x0+(t.x1-t.x0)*p)},${f(t.y0+(t.y1-t.y0)*p-Math.sin(p*Math.PI)*t.arc)})`);continue}
  tirs=tirs.filter(x=>x!==t);t.el.remove();if(t.cible)t.cible.remove();
  const hit=Math.abs(mon.x*u-t.x1)<t.r,y=hit?t.y1:GY-4,c=el('circle',{cx:f(t.x1),cy:f(y),r:t.gros?26:14},'boum');
  if(fx){fx.appendChild(c);setTimeout(()=>c.remove(),440)}
  eclats(t.x1,y,t.gros?12:6,'#ff8a4a',t.gros?1.5:1);son(t.gros?'chute':'coup');if(t.gros)eclairEcran('#ffd9a8');
  if(hit)touche(t.d,t.x1,y,now);else poussiere(t.x1,GY,t.gros?60:34,2)}}
function upVille(dt,now){const S=C.S,st=S.stage,u=U[st],c=S.city,Wt=c.W+c.port,mh=MH[st],tg=mon.tgt,fz=C.frenzied(now);
 let goal=null,reach=1/u,act=null;
 if(tg){
  if(tg.k==='e'){const e=ents.find(x=>x.id===tg.id);if(!e)mon.tgt=null;else{goal=e.x;reach=(24+mh*.32)/u;act=()=>bite(e,now)}}
  else if(tg.k==='b'){const b=c.b[tg.id];goal=b.x+b.w/2;reach=b.w/2+mh*.3/u;act=()=>strike(tg.id,now)}
  else{goal=c.props[tg.id].x;reach=(16+mh*.25)/u;act=()=>smashP(tg.id,now)}}
 else if(mon.tx!=null)goal=mon.tx;
 let walking=false;
 if(goal!=null){const d=goal-mon.x,ad=Math.abs(d);
  if(ad>reach){mon.face=d>0?1:-1;mon.x+=Math.sign(d)*Math.min(ad-reach*.85,WALK*(fz?1.7:S.vie<25?.7:1)/u*dt);walking=true}   /* grièvement blessé, il traîne la patte */
  else if(act){if(ad>.2/u)mon.face=d>0?1:-1;if(now>mon.cool)act()}
  else mon.tx=null}
 mon.x=clamp(mon.x,1,Wt-2);mon.walk=walking?mon.walk+dt:0;pas(mon,walking);
 const des=clamp(mon.x-150/u,-20/u,Wt-VW/u+20/u);cam+=(des-cam)*(dt?Math.min(1,dt*4):1);
 const mx=mon.x*u;
 if(L.world){L.world.setAttribute('transform',`translate(${f(-cam*u)},0)`);   /* les plans lointains défilent moins vite que la rue */
  L.loin.setAttribute('transform',`translate(${f(-cam*1.2-30)},0)`);L.moyen.setAttribute('transform',`translate(${f(-cam*3-50)},0)`);
  L.aura.setAttribute('cx',f(mx));L.reflet.setAttribute('cx',f(mx))}
 place(mx,GY-(walking?Math.abs(Math.sin(mon.walk*9))*2.5:0),mon.face,mh);
 for(const e of ents.slice()){let y=GY;
  if(e.type==='hum'){const fl=now<e.flee;if(fl)e.vx=(e.x>=mon.x?1:-1)*3.4;else if(Math.abs(e.vx)>1.6)e.vx=Math.sign(e.vx)*1.1;
   if(fl!==e.fl){e.fl=fl;const a=e.el.firstChild.firstChild;a.innerHTML=humArt(e);a.setAttribute('class','eb '+(fl?'court':'trotte'))}
   e.x+=e.vx*dt;y=GY+3+e.lane*6;if(e.x<0||e.x>c.W-.4||Math.abs(e.x-mon.x)*u>560){kill(e);continue}}
  else if(e.type==='car'){e.x+=e.vx*dt;if(e.x>c.W-4.5&&e.vx>0)e.vx=-e.vx;y=GY+14+e.lane*12;if(e.x<-9||Math.abs(e.x-mon.x)*u>660){kill(e);continue}}
  else if(e.type==='heli'){e.ph+=dt;e.x=mon.x+110/u*Math.sin(e.ph*.5);const alt=mh*1.02+50+56*Math.sin(e.ph*.9);e.low=alt<mh*1.02+32;e.vx=Math.cos(e.ph*.5);y=GY-alt;if(now-e.born>45000){kill(e,1);continue}}
  else if(e.type==='flic'||e.type==='tank'){   /* ils roulent jusqu'à portée, s'arrêtent et tirent ; l'alerte retombée, ils repartent */
   const tk=e.type==='tank',d=mon.x-e.x,ad=Math.abs(d),D=((tk?70:50)+mh*.2)/u,v=(tk?26:48)/u;y=e.y=GY+14+e.lane*12;
   if(C.armee()<(tk?2:1)){if(!e.part)e.part=now+1600;e.vx=(d>0?-1:1)*v;e.x+=e.vx*dt;if(now>e.part){kill(e,1);continue}}
   else{if(ad>D*1.15||(e.roule&&ad>D)){e.roule=true;e.vx=Math.sign(d)*v;e.x=clamp(e.x+e.vx*dt,-6,c.W-4)}else{e.roule=false;e.vx=(d<0?-1:1)*.001}
    if(now>e.tir&&ad*u<330&&!mon.ko){e.tir=now+e.cad*(.8+Math.random()*.4);if(tk)obus(e,now);else rafale(e,now)}}}
  else if(e.type==='gun'){e.ph+=dt;if(C.armee()<2){kill(e,1);continue}
   e.x=mon.x+130/u*Math.sin(e.ph*.4+e.off);const alt=mh*1.02+44+40*Math.sin(e.ph*.7);e.low=alt<mh*1.02+30;e.vx=mon.x>=e.x?1:-1;y=e.y=GY-alt;
   if(now>e.tir&&!mon.ko){e.tir=now+e.cad*(.8+Math.random()*.4);rafale(e,now)}}
  else if(e.type==='jet'){e.x+=e.vx*dt;y=e.y=GY-mh-70-e.lane*30;const dx=Math.abs(e.x-mon.x)*u;
   if(!e.tire&&dx<170&&!mon.ko){e.tire=1;missile(e,now)}
   if(dx>560){kill(e);continue}}
  else{e.x+=e.vx*dt;if(e.x<c.W+14||e.x>Wt-14)e.vx=-e.vx;y=GY+12+Math.sin(now/900+e.ph)*1.2}
  const dir=e.vx<0?-1:1;if(dir!==e.dir){e.dir=dir;e.el.firstChild.setAttribute('transform',`scale(${f2(dir*e.sc)},${f2(e.sc)})`)}
  e.el.setAttribute('transform',`translate(${f(e.x*u)},${f(y)})`)}
 if(tirs.length)upTirs(now);
 if(dt&&now>spawnT){spawnT=now+(fz?500:1200);spawner(now)}}
/* série : enchaîner les prises en moins de 4 secondes fait monter le bonus, jusqu'à ×2 */
const suite=now=>now<mon.comboT?mon.combo+1:1,bonus=n=>Math.min(2,1+.2*(n-1));
function reussi(n,now){mon.combo=n;mon.comboT=now+4000}
function bite(e,now){mon.tgt=null;
 if((e.type==='heli'||e.type==='gun')&&!e.low){say('Trop haut. Attends qu\'il descende.');return}
 const arme={flic:'car',tank:'tank',gun:'heli'}[e.type],n=suite(now),r=arme?C.crush(arme,now,bonus(n)):C.eat(e.type,e.n,now,bonus(n));if(!r.ok){say(r.why);return}
 if(arme)armT=now+5000;        /* les renforts mettent un moment à venir */
 const S=C.S,u=U[S.stage],mh=MH[S.stage];
 reussi(n,now);happe(e);anim('bite',320);son('croc');mon.cool=now+(C.frenzied(now)?140:320);
 setTimeout(()=>eclats(mon.x*u+mon.face*mh*.24,GY-mh*.7,e.type==='hum'?3:7,e.type==='hum'?'#b4bcc6':'#55616f',e.type==='hum'?.5:1),190);
 if(e.type!=='hum')shake();gagne(r.g,n);hud()}
function strike(i,now){mon.tgt=null;const g=svg.querySelector(`[data-b="${i}"]`),avant=g?g.innerHTML:'',n=suite(now),r=C.hit(i,now,bonus(n));if(!r.ok){say(r.why);return}
 const S=C.S,u=U[S.stage],b=S.city.b[i],bx=(b.x+b.w/2)*u,bw=b.w*u,bh=b.h*u,ix=bx+(mon.x*u<bx?-bw*.42:bw*.42),iy=GY-Math.min(bh,MH[S.stage])*.72;
 mon.cool=now+(C.frenzied(now)?220:550);anim('hit',420);shake();eclats(ix,iy,9,'#8898ac',1.1);eclats(ix,iy,4,'#ffc76b',.8);
 if(r.was===0)for(let k=0;k<3;k++)spawn('hum',clamp(b.x+b.w*Math.random(),.5,S.city.W-1),{flee:now+6000,n:groupe()});
 if(r.s===3){   /* il s'effondre : la tour s'enfonce dans sa poussière, puis laisse des décombres en feu */
  reussi(n,now);son('chute');bph[i]=C.phase(b,now);eclairEcran('#ffd9a8');
  if(g)g.innerHTML=`<g clip-path="url(#sol)"><g class="tombe" style="--h:${f(bh+12)}px">${avant}</g></g>`;
  const rr=svg.querySelector(`[data-r="${i}"]`);if(rr)rr.innerHTML='';
  poussiere(bx,GY,bw*1.7,6);eclats(bx,GY-12,16,'#3a4350',1.7);
  setTimeout(()=>{shake();redrawB(i,Date.now());poussiere(bx,GY,bw*1.3,4);eclats(bx,GY-6,10,'#ff8a4a',1.2)},1080);
  gagne(r.g,n);say(S.stage>=4?'Il fouille les décombres.':'Il s\'effondre.')}
 else{son('coup');redrawB(i,now);poussiere(ix,iy+8,bw*.5,2);if(g){g.classList.add('secoue');setTimeout(()=>g.classList.remove('secoue'),320)}if(r.pw>1)say('Coup de rage : il compte double.')}
 hud()}
function smashP(i,now){mon.tgt=null;const n=suite(now),r=C.smash(i,now,bonus(n));if(!r.ok){say(r.why);return}
 const S=C.S,u=U[S.stage],p=S.city.props[i];
 reussi(n,now);mon.cool=now+400;anim('hit',420);son('coup');const g=svg.querySelector(`[data-p="${i}"]`);if(g)g.innerHTML=propSVG(p);
 eclats(p.x*u,GY-u,p.k==='k'?12:7,'#4a5462',p.k==='k'?1.3:.8);if(p.k==='k')eclats(p.x*u,GY-u*1.5,4,'#ffc76b',.9);poussiere(p.x*u,GY,u*3,2);gagne(r.g,n);hud()}

/* ---------- actions ---------- */
function action(a){const S=C.S,now=Date.now();
 if(a==='retour')return accueil();
 if(a==='couver'){C.start(choix,($('#nom').value||'').trim().slice(0,14)||C.PRENOMS[0]);return jouer()}
 if(a==='journal')return journal();
 if(a==='fermer')return $('#voile').classList.remove('on');
 if(a==='nouveau'){if(S&&!S.dead&&!confirm('Recommencer ? '+S.name+' sera perdu et tu choisiras un nouvel œuf.'))return;C.reset();return accueil()}
 if(!S||den.game||mon.ko)return;
 if(den.wash){lavFin(now);if(a==='laver')return}
 if(a==='dormir'){const r=C.sleep(!S.sleep);if(!r.ok)return say(r.why);den.puffT=0;return hud()}
 if(a==='laver'){const r=C.washCan();if(!r.ok)return say(r.why);return lavDebut(now)}
 if(a==='jouer'){const r=C.playCan(now);if(!r.ok)return say(r.why);return jeuDebut(now)}
 if(a==='rugir'){const ville=mode==='ville',r=C.roar(now,ville);if(!r.ok)return say(r.why);rugit();anim('roar',720);
  if(ville){const u=U[S.stage],c=S.city;ring(mon.x*u+mon.face*MH[S.stage]*.3,GY-MH[S.stage]*.8);shake();
   if(r.frz){son('chute');eclairEcran('#ff6a2a');say('Déchaîné. Tout tombe, tout se mange.',12000)}
   for(const e of ents)if(e.type==='hum')e.flee=now+6000;
   let n=ents.filter(e=>e.type==='hum').length;
   for(const b of c.b){if(n>=11)break;const cx=b.x+b.w/2;if(b.s<=1&&cx>cam-2&&cx<cam+VW/u+2){spawn('hum',clamp(cx+(Math.random()-.5)*b.w*.6,.5,c.W-1),{flee:now+6000,n:groupe()});n++}}}
  else{ring(den.x+den.face*DH[S.stage]*.3,DY-DH[S.stage]*.8);say('Il s\'échauffe.')}
  return hud()}
 if(a==='sortir'){const w=C.busy();if(w)return say(w);if(S.vie<25)return say('Trop blessé pour sortir. Le sommeil le soigne.');
  return fondu(()=>{mode='ville';mon.x=14;mon.face=1;armLvl=0;armT=Date.now()+4000;build();hud()})}
 if(a==='rentrer')return fondu(()=>{mode='taniere';armLvl=0;build();hud()});
 if(a==='frapper'){const c=S.city;let best=null,bd=1e9;
  if(S.stage>=C.MIN.bld){c.b.forEach((b,i)=>{const d=Math.abs(b.x+b.w/2-mon.x);if(b.s<3&&d<bd){bd=d;best={k:'b',id:i}}})}
  else c.props.forEach((p,i)=>{const d=Math.abs(p.x-mon.x);if(!p.s&&S.stage>=C.MIN[p.k]&&d<bd){bd=d;best={k:'p',id:i}}});
  if(best)mon.tgt=best;else say('Rien à casser pour l\'instant.')}}
function journal(){const S=C.S;if(!S)return;const e=S.eaten,jr=t=>S.hatch?'Jour '+(Math.floor((t-S.hatch)/864e5)+1)+' · '+hhmm(t):hhmm(t);
 $('#panneau').innerHTML=`<h2 class="t">${S.name}</h2><div class="bilan t">Terreur ${nb(S.score)} · ${e.hum} passants · ${e.car} voitures · ${e.boat} bateaux · ${e.heli} hélicoptères · ${e.tank} chars · ${e.bld} immeubles${S.ko?' · terrassé '+S.ko+' fois':''}</div>`
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
  if(S.stage===0&&e.target.closest('[data-oeuf]')){C.tapEgg(now);
   if(S.stage>0)naissance();
   else{drawMon();const o=$('#oeuf');if(o)o.setAttribute('class','tape');eclats(150,DY-50,3,A.SP[S.sp].c,.7);son('croc');hud()}}
  else if(S.stage>0&&e.target.closest('#mg')&&!S.sleep&&!S.dead)anim('hop');
  return}
 if(mon.ko)return;
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
function lent(){const S=C.S;if(!S||ecran!=='jeu')return;const now=Date.now(),avant=shown;
 const ch=C.advance(now);
 if(ch||S.stage!==shown){if(avant===0&&S.stage===1)naissance();else if(S.stage>avant&&avant>0)evolution();else build()}
 else if(mode==='ville'){S.city.b.forEach((b,i)=>{if(C.phase(b,now)!==bph[i])redrawB(i,now)})}
 /* un éclair de temps en temps, et le tonnerre un peu après */
 if(!orageT)orageT=now+15000+Math.random()*30000;
 else if(now>orageT){orageT=now+25000+Math.random()*45000;if(!document.hidden&&!S.sleep){eclairEcran('#cfe0ff',1);setTimeout(()=>son('tonnerre'),600)}}
 hud();if(S.dead)mort()}
function step(dt){const S=C.S;if(!S||ecran!=='jeu')return;const now=Date.now();if(mode==='ville')upVille(dt,now);else upDen(dt,now)}
function frame(t){const dt=Math.min(.1,(t-last)/1000||0);last=t;step(dt);requestAnimationFrame(frame)}
setInterval(lent,1000);setInterval(()=>C.save(),5000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)C.save();else lent()});
window.addEventListener('pagehide',()=>C.save());

/* ---------- démarrage ---------- */
$('[data-a="journal"]').innerHTML=A.icon('journal');
/* la pluie : un petit motif répété sur un calque plus grand que l'écran, qui glisse en diagonale */
$('#pluie2').style.backgroundImage=`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="240"><g stroke="#9aa8b8" stroke-width=".9" stroke-linecap="round" opacity=".55"><path d="M70,8l-7,21M30,52l-9,27M56,104l-6,18M22,150l-8,24M74,186l-6,18M44,26l-4,12M12,92l-5,15M40,206l-7,21"/></g></svg>`)}")`;
const q=new URLSearchParams(location.search),dm=q.get('demo');
if(dm){const st={oeuf:0,bebe:1,enfant:2,ado:3,titan:4}[dm];
 C.demo({stage:st==null?3:st,sp:+(q.get('sp')||0),ruines:q.get('ruines')==='1',faim:q.get('faim')!=null?+q.get('faim'):null,rage:q.get('rage')!=null?+q.get('rage'):null,vie:q.get('vie')!=null?+q.get('vie'):null,alerte:q.get('alerte')!=null?+q.get('alerte'):null});
 jouer();if(q.get('ecran')==='ville'&&C.S.stage>0){mode='ville';mon.x=+(q.get('x')||40);build();hud()}
 else if(q.get('etat')==='dort'&&C.S.stage>0){C.S.energie=40;C.S.sleep=true;hud()}
 else if(q.get('etat')==='lave'&&C.S.stage>0){C.S.proprete=35;lavDebut(Date.now())}}
else if(q.get('ecran')==='accueil'){C.nosave=true;accueil()}
else if(C.load()){C.advance(Date.now());jouer();if(C.S.dead)mort()}
else accueil();
requestAnimationFrame(frame);
TV.ui={step,lent,action,spawn,spawner,touche,mon,den,get tirs(){return tirs},jeuFin,lavFrotte,lavFin,naissance,evolution,get ents(){return ents},get mode(){return mode},get cam(){return cam}};
})();
