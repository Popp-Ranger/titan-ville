/* Titan-Ville — règles du jeu, sans DOM. État dans TV.core.S, sauvegardé dans localStorage.
   Principe : la croissance avance toute seule, mais chaque action l'accélère ; la rage est à la fois
   un danger (il devient ingérable) et une réserve de puissance (coups doubles, déchaînement). */
(function(){
const TV=window.TV=window.TV||{};
const H=3600,DAY=86400,KEY='titan-ville-v1';
const STN=['Œuf','Bébé','Enfant','Ado','Titan'];
const AGE=[0,0,2*DAY,5*DAY,8*DAY];          // croissance (s) à laquelle commence chaque stade
const FOOD={hum:[0,9,4,3,2],car:[0,0,11,6,3],heli:[0,0,0,14,8],boat:[0,0,0,22,12]};
const MIN={hum:1,car:2,heli:3,boat:3,bld:3,p:1,k:2};
/* part du stade en cours gagnée par action */
const GAIN={hum:.003,car:.006,heli:.012,boat:.015,bld:.012,p:.002,k:.004,play:[.0005,.003,.006],wash:.003};
const NOMS={hum:'passants',car:'voitures',heli:'hélicoptères',boat:'bateaux'};
const VILLES=['Saint-Orme','Port-Halvern','Grisemont','Val-Noir','Brume-sur-Mer','Les Sablons'];
const PRENOMS=['Orag','Kaïr','Mogh','Vesk','Thurn','Azel','Brann','Ygg'];
const DEP={
 eclos:"Des pêcheurs signalent une forme sous la jetée.",
 hum1:"Un promeneur n'est pas rentré. On cherche le long des quais.",
 car1:"Une voiture retrouvée ouverte comme une boîte. Pas de conducteur.",
 heli1:"L'hélicoptère de la télévision ne répond plus.",
 boat1:"Le port ne répond plus.",
 p1:"Des poubelles éventrées sur trois rues. On accuse les chiens.",
 k1:"Un kiosque écrasé pendant la nuit. Aucun témoin.",
 bld1:"Un immeuble est tombé. Les grues seront là demain.",
 frz1:"Des témoins parlent d'une fureur de quelques secondes. Puis plus rien.",
 stade2:"Les empreintes font la taille d'une porte. On commence à en parler.",
 stade3:"Il dépasse les toits. Le couvre-feu est décrété.",
 stade4:"Il n'y a plus de mot pour sa taille.",
 moitie:"La moitié de la ville est dans le noir.",
 noir:"Plus une fenêtre allumée. La ville retient son souffle.",
 rebati:"Les grues ont travaillé toute la nuit. On rallume.",
 faim:"On l'entend gronder depuis la côte.",
 mort:"La forme ne bouge plus. Personne n'ose approcher."
};
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cl=v=>Math.max(0,Math.min(100,v));
const core={S:null,nosave:false,STN,AGE,MIN,NOMS,PRENOMS,DEP};

function newCity(seed){
 const r=rng(seed),b=[],props=[];let x=8;
 for(let i=0;i<14;i++){const w=14+r()*9,h=24+r()*58;b.push({x:+x.toFixed(1),w:+w.toFixed(1),h:+h.toFixed(1),s:0,t:0,seed:(r()*1e9)|0});
  props.push({x:+(x+w*(.25+r()*.5)).toFixed(1),k:r()<.6?'p':'k',s:0,t:0});
  x+=w+(r()<.3?4+r()*8:1.5);}
 return {seed,name:VILLES[Math.floor(r()*VILLES.length)],b,props,W:+(x+6).toFixed(1),port:110};
}
function fresh(sp,name){const now=Date.now();
 return {v:1,sp,name:name||PRENOMS[0],born:now,hatch:0,last:now,stage:0,taps:0,grow:0,score:0,frz:0,faim:55,energie:85,proprete:90,rage:15,
  sleep:false,starve:0,dead:false,city:newCity(now%2147483647),log:[],seen:{},eaten:{hum:0,car:0,boat:0,heli:0,bld:0},roarT:0,washT:0,playT:0};}

core.load=function(){try{const t=localStorage.getItem(KEY);if(t){const o=JSON.parse(t);if(o&&o.v===1){
  if(o.grow==null)o.grow=o.stage>0?Math.max(0,(o.last-o.hatch)/1000):0;       // parties d'avant la croissance par actions
  if(o.score==null)o.score=0;if(o.frz==null)o.frz=0;core.S=o}}}catch(e){}return core.S};
core.save=function(){if(core.nosave||!core.S)return;try{localStorage.setItem(KEY,JSON.stringify(core.S))}catch(e){}};
core.reset=function(){core.S=null;if(core.nosave)return;try{localStorage.removeItem(KEY)}catch(e){}};
core.start=function(sp,name){core.S=fresh(sp,name);core.save();return core.S};

function log(key,every){const S=core.S,now=S.last||Date.now();
 if(S.seen[key]&&(!every||now-S.seen[key]<every*H*1000))return false;
 S.seen[key]=now;S.log.unshift({t:now,x:DEP[key]});if(S.log.length>40)S.log.length=40;return true}
core.log=log;
/* fait grandir d'une part du stade en cours ; au Titan, seul le score de terreur monte */
function gain(frac,mult){const S=core.S,m=mult||1;let sec=0;
 if(S.stage>=1&&S.stage<4){sec=frac*m*(AGE[S.stage+1]-AGE[S.stage]);S.grow+=sec}
 const pts=Math.round(frac*m*10000);S.score+=pts;return{sec,pts}}

core.phase=function(b,now){if(b.s<3)return b.s;const h=(now-b.t)/36e5;return h<1.5?'feu':h<4?'gravats':'chantier'};
core.stats=function(now){const c=core.S.city;let lit=0,deb=0,pop=0,feu=0,wait=0;
 for(const b of c.b){const p=Math.floor(b.w*b.h*.9);
  if(b.s===0){lit+=1;pop+=p}else if(b.s===1){lit+=.5;pop+=Math.floor(p/2)}
  if(b.s<3)deb++;else{const h=(now-b.t)/36e5;if(h<1.5)feu++;wait=Math.max(wait,8-h)}}
 return {lit:lit/c.b.length,debout:deb/c.b.length,pop,feu,wait};};
function cityTick(now){const c=core.S.city;let re=false;
 for(const b of c.b){if(b.s===3&&now-b.t>=8*36e5){b.s=0;b.t=0;re=true}else if((b.s===1||b.s===2)&&now-b.t>=3*36e5){b.s=0;b.t=0}}
 for(const p of c.props)if(p.s&&now-p.t>=36e5){p.s=0;p.t=0}
 if(re)log('rebati',4);}
function checkCity(now){const st=core.stats(now);if(st.lit<=0)log('noir',6);else if(st.lit<.5)log('moitie',6)}

core.hatch=function(now){const S=core.S;if(S.stage!==0)return;S.stage=1;S.hatch=now;S.last=now;S.grow=0;log('eclos');core.save()};
core.tapEgg=function(now){const S=core.S;if(S.stage!==0)return 0;S.taps++;if(S.taps>=12)core.hatch(now);return S.taps/12};
core.frenzied=function(now){return !!core.S&&core.S.frz>now};

/* fait avancer le temps jusqu'à now ; renvoie true si le stade a changé */
core.advance=function(now){const S=core.S;if(!S)return false;
 let dt=(now-S.last)/1000;if(dt<=0)return false;S.last=now;
 if(S.dead)return false;
 if(S.stage===0){if(now-S.born>90000){core.hatch(now);return true}return false}
 const m=TV.art.SP[S.sp].m,off=dt>120,k=off?.35:1,h=dt/H,sl=S.sleep,fou=!sl&&!off&&S.rage>=100;
 const rf=12*m.f*(sl?.5:1)*k,rp=5*m.p*k*(fou?3:1);
 /* croissance : seulement tant qu'il n'a ni faim ni crasse ; elle double pendant le sommeil */
 if(S.stage<4&&S.faim>=20&&S.proprete>=20){const ok=Math.min(dt,(S.faim-20)/rf*H,(S.proprete-20)/rp*H),dodo=sl?Math.min(ok,(100-S.energie)/25*H):0;S.grow+=ok+dodo}
 let nf=S.faim-rf*h;
 if(nf<0){S.starve+=-nf/rf;nf=0}else S.starve=Math.max(0,S.starve-h*2);
 S.faim=nf;
 S.energie=cl(S.energie+(sl?25*h:-7*m.e*k*h*(fou?4:1)));
 S.proprete=cl(S.proprete-rp*h);
 if(!sl)S.rage=cl(S.rage+600*m.r*k*h);      // de 0 à 100 en 10 minutes, éveillé, page ouverte
 if(sl&&S.energie>=100)S.sleep=false;
 if(S.faim<12)log('faim',8);
 if(S.starve>=36){S.dead=true;S.sleep=false;log('mort');return false}
 cityTick(now);
 let st=1;for(let i=2;i<=4;i++)if(S.grow>=AGE[i])st=i;
 if(st>S.stage){S.stage=st;log('stade'+st);return true}
 return false};

core.jour=function(now){const S=core.S;return S.stage===0?0:Math.floor((now-S.hatch)/1000/DAY)+1};
/* progression vers le stade suivant : p de 0 à 1, next = stade à venir (null au Titan), reste en secondes,
   gel = raison pour laquelle il ne grandit plus, x2 = il dort et grandit deux fois plus vite */
core.evol=function(now){const S=core.S;
 if(S.stage===0)return{p:Math.min(1,Math.max(S.taps/12,(now-S.born)/90000)),next:STN[1],reste:null};
 if(S.stage>=4)return{p:1,next:null,reste:0};
 const a=AGE[S.stage],b=AGE[S.stage+1],gel=S.faim<20?'il a faim':S.proprete<20?'il est trop sale':'';
 return{p:Math.max(0,Math.min(1,(S.grow-a)/(b-a))),next:STN[S.stage+1],reste:Math.max(0,b-S.grow),gel,x2:S.sleep&&!gel}};
core.busy=function(){const S=core.S;return S.dead?'Il ne bouge plus.':S.sleep?'Il dort.':S.energie<5?'Il est épuisé. Il doit dormir.':''};

/* mult : bonus de série (1 à 2). Pendant un déchaînement tout rapporte davantage et ne coûte rien. */
core.eat=function(type,n,now,mult){const S=core.S,w=core.busy(),fz=S.frz>now;if(w)return{ok:0,why:w};
 if(S.stage<MIN[type])return{ok:0,why:'Trop gros pour lui.'};
 if(S.faim>=99.5&&!fz)return{ok:0,why:"Il n'a plus faim."};
 S.faim=cl(S.faim+FOOD[type][S.stage]*(fz?2:1));S.proprete=cl(S.proprete-1);if(!fz)S.energie=cl(S.energie-.4);S.eaten[type]+=n||1;
 log(type+'1');return{ok:1,g:gain(GAIN[type],(mult||1)*(fz?1.5:1))}};
core.hit=function(i,now,mult){const S=core.S,b=S.city.b[i],w=core.busy(),fz=S.frz>now;if(w)return{ok:0,why:w};
 if(S.stage<MIN.bld)return{ok:0,why:'Trop petit pour ça.'};
 if(b.s>=3)return{ok:0,why:''};
 const was=b.s,pw=fz?3:S.rage>=50?2:1;                      // la rage double la force du coup
 b.s=Math.min(3,b.s+pw);b.t=now;S.proprete=cl(S.proprete-3);if(!fz){S.energie=cl(S.energie-2);S.rage=cl(S.rage-8)}
 let g=null;
 if(b.s===3){S.eaten.bld++;if(!fz)S.rage=cl(S.rage-14);S.proprete=cl(S.proprete-6);if(S.stage>=4)S.faim=cl(S.faim+22);log('bld1');g=gain(GAIN.bld,(mult||1)*(fz?1.5:1))}
 checkCity(now);return{ok:1,s:b.s,was,pw,g}};
core.smash=function(i,now,mult){const S=core.S,p=S.city.props[i],w=core.busy(),fz=S.frz>now;if(w)return{ok:0,why:w};
 if(p.s)return{ok:0,why:''};
 if(S.stage<MIN[p.k])return{ok:0,why:'Trop solide pour lui.'};
 p.s=1;p.t=now;S.proprete=cl(S.proprete-1.5);if(!fz){S.rage=cl(S.rage-(p.k==='k'?9:6));S.energie=cl(S.energie-1)}
 log(p.k+'1');return{ok:1,g:gain(GAIN[p.k],(mult||1)*(fz?1.5:1))}};
/* rugir : dans la tanière il s'échauffe (+10 de rage) ; en ville, à 80 de rage ou plus, il se déchaîne 12 secondes */
core.roar=function(now,ville){const S=core.S;if(S.dead||S.sleep)return{ok:0,why:core.busy()};
 if(now-S.roarT<8000&&!(ville&&S.rage>=80))return{ok:0,why:'Il reprend son souffle.'};
 S.roarT=now;S.energie=cl(S.energie-1.5);
 if(!ville){S.rage=cl(S.rage+10);return{ok:1}}
 if(S.rage>=80){S.frz=now+12000;S.rage=0;log('frz1');return{ok:1,frz:1}}
 return{ok:1}};
core.sleep=function(on){const S=core.S;if(S.dead)return{ok:0,why:'Il ne bouge plus.'};
 if(on){if(S.rage>=70)return{ok:0,why:'Il est trop énervé pour dormir.'};if(S.energie>=90)return{ok:0,why:"Il n'a pas sommeil."}}
 S.sleep=on;return{ok:1}};
/* laver : on le frotte soi-même. washStep ajoute de la propreté à chaque frottement, washEnd paie la croissance */
core.washCan=function(){const S=core.S,w=S.dead?'Il ne bouge plus.':S.sleep?'Il dort.':'';if(w)return{ok:0,why:w};
 if(S.rage>=70)return{ok:0,why:'Trop énervé : il ne se laisse pas approcher.'};
 if(S.proprete>=99.5)return{ok:0,why:'Il est déjà propre.'};return{ok:1}};
core.washStep=function(n){const S=core.S;S.proprete=cl(S.proprete+n);return S.proprete>=100};
core.washEnd=function(gagne,now){const S=core.S;S.washT=now;return{g:gagne>=4?gain(GAIN.wash*Math.min(1,gagne/45)):null}};
/* jouer : un jeu d'adresse dans la tanière. q = 0 raté, 1 bien, 2 en plein dedans */
core.playCan=function(now){const S=core.S,w=core.busy();if(w)return{ok:0,why:w};
 if(now-S.playT<20000)return{ok:0,why:"Il n'en a plus envie pour l'instant."};
 if(S.energie<12)return{ok:0,why:'Il est trop fatigué pour jouer.'};return{ok:1}};
core.playEnd=function(q,now){const S=core.S;S.playT=now;S.rage=cl(S.rage-[5,15,25][q]);S.energie=cl(S.energie-8);return{ok:1,g:gain(GAIN.play[q])}};

/* message d'état affiché sous la scène */
core.humeur=function(now){const S=core.S;if(S.dead)return["Il s'est éteint.",1];if(S.stage===0)return["Touche l'œuf pour l'aider à sortir.",0];
 if(S.sleep)return['Il dort. Il grandit deux fois plus vite.',0];const st=core.stats(now);
 if(S.frz>now)return['Déchaîné.',1];
 if(S.faim<25)return[st.lit>0?'Il a faim. Il reste des lumières en ville.':'Il a faim, et la ville est éteinte.',1];
 if(S.rage>=100)return['Fou de rage : il saccage tout et s\'épuise.',1];
 if(S.energie<20)return['Il tombe de fatigue.',1];
 if(S.rage>=80)return['Il bout. En ville, rugir le déchaînera.',1];
 if(S.proprete<25)return['Il est couvert de suie.',1];
 if(S.rage>=50)return['Il s\'échauffe. Ses coups comptent double.',0];return['Il est calme.',0]};

/* partie de démonstration, jamais sauvegardée : stade 0 à 4, espèce, quelques ruines */
core.demo=function(o){core.nosave=true;const now=Date.now(),S=fresh(o.sp||0,o.name||PRENOMS[(o.sp||0)%PRENOMS.length]);
 S.stage=o.stage;if(o.stage>0){S.hatch=now-(AGE[o.stage]*1000+2*36e5);S.grow=AGE[o.stage]+7200}
 if(o.faim!=null)S.faim=o.faim;if(o.rage!=null)S.rage=o.rage;
 if(o.ruines){const b=S.city.b;b[1].s=1;b[1].t=now;b[2].s=2;b[2].t=now;b[3].s=3;b[3].t=now-.5*36e5;b[5].s=3;b[5].t=now-3*36e5;b[6].s=3;b[6].t=now-6*36e5}
 core.S=S;return S};
TV.core=core;
})();
