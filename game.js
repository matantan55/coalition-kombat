"use strict";
/* COALITION KOMBAT — political parody fighter. Single canvas game, no assets. */
const cvs=document.getElementById('game'),ctx=cvs.getContext('2d');
const W=960,H=540,GROUND=468,GRAV=2300,MAXHP=100;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[(Math.random()*a.length)|0];
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function rrect(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
function txt(t,x,y,size,col,align,weight,font){ctx.font=(weight||'900')+' '+size+'px '+(font||'Arial');ctx.textAlign=align||'center';ctx.fillStyle=col;ctx.fillText(t,x,y);}

const CHARS=[
{id:'bibi',name:'BIBI',epithet:'THE MAGICIAN',skin:'#e6b58c',hair:'#d8d8dc',hairStyle:'swoosh',beard:null,kippah:null,glasses:false,suit:'#16244a',pants:'#0e1830',tie:'#c0392b',
 sp:{name:'CHAMPAGNE STRIKE',kind:'cork',dmg:13,speed:540,quip:'לחיים! 🍾'},
 mega:{name:'COALITION WHIP',dmg:26,heal:12,quip:'הקואליציה שלי! 💪',flash:'#ffd75e'}},
{id:'gvir',name:'BEN GVIR',epithet:'THE ENFORCER',skin:'#e2b08a',hair:'#2b2118',hairStyle:'short',beard:'#33261b',kippah:'#141414',glasses:false,suit:'#232830',pants:'#16181d',tie:null,
 sp:{name:'SIREN DASH',kind:'dash',dmg:12,quip:'משטרה!! 🚨'},
 mega:{name:'NATIONAL GUARD',dmg:20,stun:1.3,quip:'המשמר הלאומי! 🚨',flash:'#39c0ff'}},
{id:'smotrich',name:'SMOTRICH',epithet:'THE TREASURER',skin:'#e8bd97',hair:'#4a3625',hairStyle:'short',beard:'#4a3625',kippah:'#f1ead9',glasses:false,suit:'#31404a',pants:'#222c33',tie:'#2e8b57',
 sp:{name:'COIN TOSS',kind:'coins',dmg:5,speed:560,quip:'תקציב! ₪'},
 mega:{name:'BUDGET CUT',dmg:22,drain:true,heal:8,quip:'חיתוך תקציב!! 💸',flash:'#7dffb0'}},
{id:'miri',name:'MIRI REGEV',epithet:'THE MEGAPHONE',skin:'#eab892',hair:'#e9c34f',hairStyle:'big',beard:null,kippah:null,glasses:false,suit:'#8e2f4f',pants:'#5c1e33',tie:null,
 sp:{name:'MEGAPHONE WAVE',kind:'wave',dmg:12,speed:300,quip:'תעצרו את המוזיקה! 🔊'},
 mega:{name:'CULTURE SHOCK',dmg:24,screenwide:true,quip:'מלחמת תרבות!!! 🎭',flash:'#ff59c7'}},
{id:'lapid',name:'LAPID',epithet:'THE ALTERNATIVE',skin:'#e9bf96',hair:'#c3c8cf',hairStyle:'swoosh2',beard:null,kippah:null,glasses:true,suit:'#e3e7ec',pants:'#b9bfc9',tie:'#3b6fd4',
 sp:{name:'TWEET STORM',kind:'bird',dmg:8,speed:430,quip:'נשנה את זה! 🐦'},
 mega:{name:'SNAP ELECTIONS',dmg:18,birds:3,quip:'לקלפיות!!! 🗳️',flash:'#7ec8ff'}},
{id:'deri',name:'DERI',epithet:'THE SHUFFLER',skin:'#dfa87e',hair:'#332f2a',hairStyle:'short',beard:'#332f2a',kippah:'#0d0d0d',glasses:false,suit:'#33261e',pants:'#241a14',tie:'#c9a227',
 sp:{name:'ARAMAIC SCROLL',kind:'scroll',dmg:11,speed:420,quip:'זה למען הציבור! 📜'},
 mega:{name:'MINISTRY GRAB',dmg:28,steal:30,quip:'המשרד שלי! 🤝',flash:'#ffd27e'}}];

const KO_QUIPS=['הקואליציה התפרקה! 😵','אני אערער על זה! ⚖️','נפגש בבחירות הבאות 🗳️','עוד נדבר בוועדה 📋'];

const P1K={left:'a',right:'d',up:'w',down:'s',punch:'f',kick:'g',special:'h',mega:'e'};
const P2K={left:'arrowleft',right:'arrowright',up:'arrowup',down:'arrowdown',punch:'k',kick:'l',special:'o',mega:'p'};
const keys={},just={};
const NEUTRAL={move:0,jump:false,block:false,punch:false,kick:false,special:false,mega:false};
addEventListener('keydown',e=>{const k=(e.key||'').toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(!keys[k])just[k]=true;keys[k]=true;Snd.unlock();if(k==='m')Snd.on=!Snd.on;});
addEventListener('keyup',e=>{keys[(e.key||'').toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function humanInp(p){const K=p===1?P1K:P2K;
 return{move:(keys[K.right]?1:0)-(keys[K.left]?1:0),jump:!!just[K.up],block:!!keys[K.down],punch:!!just[K.punch],kick:!!just[K.kick],special:!!just[K.special],mega:!!just[K.mega]};}

const Snd={ctx:null,on:true,
 unlock(){try{if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume();}catch(e){}},
 tone(f,d,type,vol,slide){if(!this.on||!this.ctx)return;try{const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t+d);g.gain.setValueAtTime(vol||.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+d+.02);}catch(e){}},
 noise(d,vol){if(!this.on||!this.ctx)return;try{const t=this.ctx.currentTime,n=(this.ctx.sampleRate*d)|0,b=this.ctx.createBuffer(1,n,this.ctx.sampleRate),c=b.getChannelData(0);for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*(1-i/n);const s=this.ctx.createBufferSource();s.buffer=b;const g=this.ctx.createGain();g.gain.value=vol||.1;s.connect(g);g.connect(this.ctx.destination);s.start(t);}catch(e){}},
 punch(){this.tone(150,.12,'square',.18,60);this.noise(.08,.12);},
 kick(){this.tone(100,.16,'square',.2,45);this.noise(.1,.14);},
 block(){this.tone(700,.06,'triangle',.09,500);},
 throwS(){this.tone(500,.12,'sine',.1,900);},
 pop(){this.tone(900,.09,'sine',.16,1500);},
 boop(){this.tone(600,.05,'square',.06);},
 boom(){this.tone(70,.5,'sawtooth',.26,30);this.noise(.35,.22);},
 say(t){if(!this.on||!window.speechSynthesis)return;try{const u=new SpeechSynthesisUtterance(t);u.rate=1;u.pitch=.4;u.volume=.9;speechSynthesis.cancel();speechSynthesis.speak(u);}catch(e){}}};

function burst(arr,x,y,col,n){for(let i=0;i<n;i++)arr.push({x,y,vx:rnd(-170,170),vy:rnd(-280,-30),g:750,life:rnd(.3,.7),col,size:rnd(3,7)});
 if(Math.random()<0.5)arr.push({text:pick(['POW!','BAM!','WHAM!']),x:x+rnd(-20,20),y:y-20,vx:rnd(-40,40),vy:-140,g:300,life:.55,col:'#fff'});}

class Fighter{
 constructor(ci,x,face,human){this.ci=ci;this.ch=CHARS[ci];this.x=x;this.y=GROUND;this.vx=0;this.vy=0;this.facing=face;this.hp=MAXHP;this.hpGhost=MAXHP;this.meter=30;this.wins=0;this.state='idle';this.st=0;this.stun=0;this.cool=0;this.hasHit=false;this.flash=0;this.combo=0;this.comboT=0;this.bubble=null;this.animT=rnd(0,6);this.human=human;this.aiT=0;this.trail=[];this.dashT=0;this.megaDone=false;}
 rect(){return{x:this.x-30,y:this.y-152,w:60,h:152};}
 canAct(){return(this.state==='idle'||this.state==='walk'||this.state==='block')&&this.stun<=0;}
 say(t){this.bubble={text:t,t:1.3};}
 resetRound(x,face){this.x=x;this.facing=face;this.hp=MAXHP;this.hpGhost=MAXHP;this.vx=0;this.vy=0;this.state='idle';this.st=0;this.stun=0;this.hasHit=false;this.flash=0;this.combo=0;this.trail=[];this.meter=clamp(this.meter*0.6,25,100);}
 takeHit(dmg,kb,dir,attacker,unblock){
  if(this.state==='ko')return false;
  const isFront=(attacker.x>this.x?1:-1)===this.facing;
  const blocked=!unblock&&this.state==='block'&&isFront;
  if(blocked){this.hp-=dmg*0.25;this.vx=dir*kb*0.35;this.flash=0.06;Snd.block();burst(F.parts,this.x+this.facing*20,this.y-110,'#59d7ff',4);return false;}
  this.hp-=dmg;this.vx=dir*kb;this.state='hurt';this.stun=Math.max(this.stun,0.34);this.flash=0.14;Snd.punch();burst(F.parts,this.x,this.y-105,'#ffd75e',8);
  if(this.hp<=0){this.hp=0;this.state='ko';this.vy=-420;this.vx=dir*260;F.onKO(this,attacker);}
  return true;
 }
 startAttack(kind){this.state=kind;this.st=0;this.hasHit=false;}
 doSpecial(fight){const s=this.ch.sp;this.cool=1.4;this.bubble={text:s.quip,t:1.2};
  if(s.kind==='dash'){this.state='dash';this.st=0;this.dashT=0.34;this.hasHit=false;this.vx=this.facing*740;Snd.tone(300,.3,'sawtooth',.13,900);return;}
  this.state='special';this.st=0;Snd.throwS();
  const dir=this.facing,sx=this.x+dir*44,sy=this.y-98;
  const push=(x,y,vx,vy,dmg,kind)=>fight.proj.push({x,y,vx,vy,dmg,kind,owner:this,life:2.6});
  if(s.kind==='cork')push(sx,sy,dir*s.speed,0,s.dmg,'cork');
  else if(s.kind==='coins')for(let i=0;i<3;i++)push(sx,sy-8,dir*(s.speed*0.85+i*70),-140-i*80,5,'coin');
  else if(s.kind==='wave')push(sx,sy+34,dir*s.speed,0,s.dmg,'wave');
  else if(s.kind==='bird')push(sx,sy-26,dir*s.speed,-240,s.dmg,'bird');
  else if(s.kind==='scroll')push(sx,sy,dir*s.speed,0,s.dmg,'scroll');
 }
 doMega(fight,foe){const m=this.ch.mega;this.meter=0;this.state='mega';this.st=0;this.megaDone=false;this.bubble={text:m.quip,t:1.6};Snd.boom();fight.flashCol=m.flash;fight.flashT=0.35;fight.shake=16;Snd.say(m.name);}
 applyMega(fight,foe){const m=this.ch.mega;
  if(m.screenwide){if(foe.state!=='ko')foe.takeHit(m.dmg,300,foe.x>this.x?1:-1,this,true);}
  else if(m.birds){for(let i=0;i<m.birds;i++)fight.proj.push({x:this.x+this.facing*40,y:this.y-120-i*10,vx:this.facing*(380+i*90),vy:-160-i*90,dmg:6,kind:'bird',owner:this,life:2.6});}
  else if(Math.abs(foe.x-this.x)<185&&foe.state!=='ko'){foe.takeHit(m.dmg,420,this.facing,this,true);
   if(m.heal)this.hp=clamp(this.hp+m.heal,0,MAXHP);
   if(m.drain)foe.meter=0;
   if(m.steal){const s=Math.min(foe.meter,m.steal);foe.meter-=s;this.meter=clamp(this.meter+s,0,100);}
   if(m.stun&&foe.state!=='ko')foe.stun=Math.max(foe.stun,m.stun);
  }else this.bubble={text:'WHIFF! 😅',t:0.9};
  burst(fight.parts,this.x+this.facing*60,this.y-110,m.flash,16);
 }
 update(dt,inp,foe,fight){
  this.animT+=dt;this.cool=Math.max(0,this.cool-dt);this.flash=Math.max(0,this.flash-dt);
  this.hpGhost+=(this.hp-this.hpGhost)*Math.min(1,dt*4);
  if(this.comboT>0){this.comboT-=dt;if(this.comboT<=0)this.combo=0;}
  if(this.bubble){this.bubble.t-=dt;if(this.bubble.t<=0)this.bubble=null;}
  if(this.state==='ko'){this.vy+=GRAV*dt;this.y=Math.min(GROUND,this.y+this.vy*dt);this.x+=this.vx*dt;this.vx*=0.92;this.x=clamp(this.x,40,W-40);return;}
  if(this.stun>0){this.stun-=dt;this.state='hurt';this.vy+=GRAV*dt;this.y=Math.min(GROUND,this.y+this.vy*dt);this.x+=this.vx*dt;if(this.y>=GROUND)this.vx*=0.86;this.x=clamp(this.x,40,W-40);return;}
  if(this.state==='hurt')this.state='idle';
  this.vy+=GRAV*dt;this.y+=this.vy*dt;if(this.y>=GROUND){this.y=GROUND;this.vy=0;}
  const grounded=this.y>=GROUND;
  if(this.state==='jump'||this.state==='jumpkick'){
   this.x+=this.vx*dt;this.vx*=0.995;
   if(this.state==='jump'&&inp.kick){this.state='jumpkick';this.hasHit=false;}
   if(this.state==='jumpkick'&&!this.hasHit){const hb={x:this.x+(this.facing>0?14:-14-86),y:this.y-110,w:86,h:56};
    if(foe.state!=='ko'&&overlap(hb,foe.rect())){this.hasHit=true;const c=foe.takeHit(10,240,this.facing,this);fight.onHit(this,foe,10,c);}}
   if(this.y>=GROUND&&this.vy===0)this.state='idle';
   this.x=clamp(this.x,40,W-40);return;
  }
  if(this.state==='dash'){
   this.dashT-=dt;this.x+=this.vx*dt;this.trail.push({x:this.x,y:this.y,t:0.22});
   if(!this.hasHit){const hb={x:this.x+(this.facing>0?10:-10-90),y:this.y-130,w:90,h:100};
    if(foe.state!=='ko'&&overlap(hb,foe.rect())){this.hasHit=true;const c=foe.takeHit(12,320,this.facing,this);fight.onHit(this,foe,12,c);}}
   for(const tr of this.trail)tr.t-=dt;this.trail=this.trail.filter(tr=>tr.t>0);
   if(this.dashT<=0){this.state='idle';this.vx=0;}
   this.x=clamp(this.x,40,W-40);return;
  }
  if(this.state==='punch'||this.state==='kick'){this.st+=dt;
   const A=this.state==='punch'?{s:0.06,a:0.11,r:0.1,rng:80,d:5,k:180,yy:-128,hh:44}:{s:0.13,a:0.11,r:0.2,rng:96,d:9,k:300,yy:-92,hh:60};
   if(this.st>=A.s&&this.st<=A.s+A.a&&!this.hasHit){const hb={x:this.x+(this.facing>0?18:-18-A.rng),y:this.y+A.yy,w:A.rng,h:A.hh};
    if(foe.state!=='ko'&&overlap(hb,foe.rect())){this.hasHit=true;const clean=foe.takeHit(A.d,A.k,this.facing,this);fight.onHit(this,foe,A.d,clean);
     if(this.state==='punch')Snd.punch();else Snd.kick();}}
   if(this.st>A.s+A.a+A.r)this.state='idle';
   this.x=clamp(this.x,40,W-40);return;
  }
  if(this.state==='special'){this.st+=dt;if(this.st>0.3)this.state='idle';return;}
  if(this.state==='mega'){this.st+=dt;if(!this.megaDone&&this.st>=0.38){this.megaDone=true;this.applyMega(fight,foe);}if(this.st>0.85)this.state='idle';return;}
  if(grounded){
   if(inp.block){this.state='block';this.vx=0;}
   else{
    if(this.state==='block')this.state='idle';
    if(inp.mega&&this.meter>=100){this.doMega(fight,foe);return;}
    if(inp.special&&this.cool<=0){this.doSpecial(fight);return;}
    if(inp.punch){this.startAttack('punch');return;}
    if(inp.kick){this.startAttack('kick');return;}
    if(inp.jump){this.vy=-900;this.state='jump';this.vx=inp.move*300;}
    else{this.vx=inp.move*265;this.state=inp.move?'walk':'idle';}
   }
  }else this.x+=this.vx*dt;
  if(this.state==='idle'||this.state==='walk'||this.state==='block')this.facing=foe.x>=this.x?1:-1;
  this.x+=this.vx*dt;this.x=clamp(this.x,40,W-40);
 }
}

function aiUpdate(f,foe,dt,fight){
 const inp={move:0,jump:false,block:false,punch:false,kick:false,special:false,mega:false};
 f.aiT-=dt;
 const d=foe.x-f.x,ad=Math.abs(d);
 const danger=fight.proj.find(p=>p.owner!==f&&Math.abs(p.x-f.x)<180&&Math.sign(p.vx)===(f.x>p.x?1:-1));
 if(danger&&Math.random()<0.06)inp.jump=true;
 if(f.aiT>0)return inp;
 f.aiT=0.15+Math.random()*0.22;
 if(f.meter>=100&&ad<180)inp.mega=true;
 else if(ad>300){if(f.cool<=0&&Math.random()<0.5)inp.special=true;else inp.move=d>0?1:-1;}
 else if(ad>115){inp.move=d>0?1:-1;if(Math.random()<0.07)inp.jump=true;if(f.cool<=0&&Math.random()<0.22)inp.special=true;}
 else{const r=Math.random();if(r<0.36)inp.punch=true;else if(r<0.62)inp.kick=true;else if(r<0.76)inp.block=true;else inp.move=d>0?-1:1;}
 return inp;
}

/* ============ PART 2 — game shell, rendering, flow ============ */

const F={parts:[],fight:null,
 onKO(loser,attacker){
  const f=this.fight;if(!f||f.state!=='fight')return;
  f.state='ko';f.koT=0;loser.say(pick(KO_QUIPS));Snd.say(pick(KO_QUIPS));Snd.boom();
  const winner=attacker&&attacker!==loser?attacker:(loser===f.p1?f.p2:f.p1);
  f.koWinner=winner;winner.wins++;
  f.shake=Math.max(f.shake,14);burst(this.parts,loser.x,loser.y-110,'#ff59c7',18);
 }};

function newFight(c1,c2,human2){
 const fight={p1:new Fighter(c1,320,1,true),p2:new Fighter(c2,640,-1,human2),
  proj:[],parts:F.parts,round:1,timer:60,state:'intro',introT:0,koT:0,koWinner:null,
  shake:0,flashT:0,flashCol:'#fff',hitstop:0,ann:'',annT:0,human2:!!human2,comboMsg:null,comboT:0};
 fight.onHit=(a,b,dmg,clean)=>{
  if(fight.state!=='fight')return;
  a.meter=clamp(a.meter+(clean?9:4),0,100);b.meter=clamp(b.meter+(clean?3:5),0,100);
  if(clean){a.combo++;a.comboT=1.6;fight.comboMsg=a.combo>1?{n:a.combo,p:a}:null;fight.comboT=1.4;}
  fight.hitstop=clean?0.05:0.03;
 };
 F.fight=fight;F.parts.length=0;fight.proj.length=0;
 return fight;
}

/* ---------- drawing helpers ---------- */
function drawBG(t,shake){
 ctx.save();
 const sx=rnd(-shake,shake),sy=rnd(-shake,shake);ctx.translate(sx,sy);
 // wall
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1a2242');g.addColorStop(.62,'#232c52');g.addColorStop(1,'#141a30');
 ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // chandelier glow
 for(let i=0;i<3;i++){const cx=170+i*310;const rg=ctx.createRadialGradient(cx,70,4,cx,70,120);rg.addColorStop(0,'#fff3c433');rg.addColorStop(1,'#fff3c400');ctx.fillStyle=rg;ctx.fillRect(cx-120,-50,240,220);
  ctx.fillStyle='#f7e6a3';ctx.beginPath();ctx.arc(cx,58,9,0,7);ctx.fill();ctx.strokeStyle='#c9b46a';ctx.beginPath();ctx.arc(cx,58,26,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,32);ctx.stroke();}
 // big star medallion
 ctx.save();ctx.translate(W/2,150);ctx.rotate(Math.sin(t*.4)*.05);
 ctx.fillStyle='#2c3763';ctx.beginPath();ctx.arc(0,0,58,0,7);ctx.fill();
 ctx.strokeStyle='#4a5a94';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,58,0,7);ctx.stroke();
 ctx.strokeStyle='#7d8fc9';ctx.lineWidth=4;ctx.beginPath();
 for(let i=0;i<2;i++){const a=i*Math.PI;for(let k=0;k<3;k++){const a1=k*2*Math.PI/3+a-Math.PI/2,a2=a1+2*Math.PI/3;ctx.moveTo(Math.cos(a1)*34,Math.sin(a1)*34);ctx.lineTo(Math.cos(a2)*34,Math.sin(a2)*34);}}
 ctx.stroke();ctx.restore();
 // plenum arc seats
 ctx.fillStyle='#1d2547';ctx.beginPath();ctx.ellipse(W/2,GROUND+40,430,90,0,Math.PI,0);ctx.fill();
 ctx.fillStyle='#273056';ctx.beginPath();ctx.ellipse(W/2,GROUND+18,430,80,0,Math.PI,0);ctx.fill();
 for(let r=0;r<3;r++){for(let i=0;i<10;i++){const a=Math.PI+(i+.5)*Math.PI/10,rr=340-r*46;const x=W/2+Math.cos(a)*rr,y=GROUND+30+Math.sin(a)*38;
  ctx.fillStyle=['#39456b','#414e78','#4a5a94'][r];rrect(x-14,y-10,28,12,4,ctx.fillStyle);}}
 // desk
 ctx.fillStyle='#3a2e20';ctx.fillRect(60,GROUND+8,W-120,26);ctx.fillStyle='#4c3c2a';ctx.fillRect(60,GROUND+8,W-120,8);
 // floor
 ctx.fillStyle='#2a2140';ctx.fillRect(0,GROUND+34,W,H-GROUND-34);
 ctx.fillStyle='#1b1530';for(let i=0;i<8;i++)ctx.fillRect(0,GROUND+46+i*14,W,4);
 // "THE KNESSET" sign
 rrect(W/2-150,10,300,44,8,'#0e1330','#39456b');txt('THE KNESSET 🥊',W/2,40,24,'#ffd75e','center','900','Arial');
 txt('PL ENUM CAM 1 — LIVE',W/2,70,11,'#66708a','center','700','monospace');
 ctx.restore();
}

function drawHead(ch,x,y,s){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 ctx.fillStyle=ch.skin;ctx.strokeStyle='#00000055';ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(0,0,17,20,0,0,7);ctx.fill();ctx.stroke();
 // ears
 ctx.beginPath();ctx.ellipse(-17,2,4,6,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(17,2,4,6,0,0,7);ctx.fill();
 // hair
 ctx.fillStyle=ch.hair;
 if(ch.hairStyle==='swoosh'){ctx.beginPath();ctx.ellipse(0,-14,18,11,0,Math.PI,0);ctx.fill();ctx.beginPath();ctx.ellipse(-8,-16,14,8,-.4,0,7);ctx.fill();}
 else if(ch.hairStyle==='swoosh2'){ctx.beginPath();ctx.ellipse(0,-13,17,9,0,Math.PI,0);ctx.fill();ctx.beginPath();ctx.ellipse(6,-17,12,7,.35,0,7);ctx.fill();}
 else if(ch.hairStyle==='big'){ctx.beginPath();ctx.ellipse(0,-13,22,13,0,Math.PI,0);ctx.fill();ctx.beginPath();ctx.ellipse(-16,-6,8,12,0.3,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(16,-6,8,12,-0.3,0,7);ctx.fill();}
 else{ctx.beginPath();ctx.ellipse(0,-14,17,9,0,Math.PI,0);ctx.fill();}
 // beard
 if(ch.beard){ctx.fillStyle=ch.beard;ctx.beginPath();ctx.ellipse(0,9,13,10,0,0,Math.PI);ctx.fill();}
 // kippah
 if(ch.kippah){ctx.fillStyle=ch.kippah;ctx.beginPath();ctx.ellipse(0,-18,10,5,0,Math.PI,0);ctx.fill();}
 // eyes + brows
 ctx.fillStyle='#1b1b1b';
 if(ch.glasses){ctx.strokeStyle='#20242c';ctx.lineWidth=2.4;ctx.strokeRect(-11,-7,9,8);ctx.strokeRect(2,-7,9,8);ctx.beginPath();ctx.moveTo(-2,-3);ctx.lineTo(2,-3);ctx.stroke();}
 ctx.beginPath();ctx.arc(-6,-3,2.1,0,7);ctx.arc(6,-3,2.1,0,7);ctx.fill();
 ctx.strokeStyle='#00000088';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,-9);ctx.lineTo(-3,-8);ctx.moveTo(3,-8);ctx.lineTo(9,-9);ctx.stroke();
 // mouth
 ctx.strokeStyle='#7a3b3b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,8,4,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
 ctx.restore();
}

function drawFighter(f,t){
 const ch=f.ch,x=f.x,y=f.y,fc=f.facing;
 // shadow
 ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(x,GROUND+40,34,8,0,0,7);ctx.fill();
 // dash trail
 for(const tr of f.trail){ctx.globalAlpha=tr.t*2.2;drawSilhouette(ch,tr.x,tr.y);ctx.globalAlpha=1;}
 ctx.save();ctx.translate(x,y);ctx.scale(fc,1);
 if(f.flash>0){ctx.filter='brightness(2.2)';}
 const s=f.state,bo=Math.sin(f.animT*4)*2;
 let bob=0,l1=0,l2=0,armF=0,armB=0,crouch=0,legF=0,armUp=false,bothUp=false,lean=0;
 if(s==='idle')bob=bo;
 else if(s==='walk'){bob=Math.abs(bo)*1.4;l1=Math.sin(f.animT*10)*10;l2=-l1;armF=-bo;armB=bo;}
 else if(s==='block'){crouch=8;armF=-14;armB=-14;lean=-2;}
 else if(s==='punch'){armF=f.st<0.12?-6:52;lean=4;}
 else if(s==='kick'){legF=f.st<0.2?10:58;lean=-6;armB=-16;}
 else if(s==='jump'||s==='jumpkick'){l1=-12;l2=8;if(s==='jumpkick'){legF=44;lean=8;}}
 else if(s==='hurt'){lean=-10;armF=-20;armB=22;}
 else if(s==='special'){armUp=true;lean=3;}
 else if(s==='mega'){bothUp=true;lean=-3;}
 else if(s==='dash'){lean=14;armF=40;armB=-24;l1=-8;l2=10;}
 else if(s==='ko'){ctx.rotate(-Math.PI/2);ctx.translate(-24,-30);}
 const hipY=-62+bob*.3,shY=-104+bob+crouch;
 // legs
 ctx.strokeStyle=ch.pants;ctx.lineWidth=13;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-6,hipY);ctx.lineTo(l1*.6-4+legF*.3,-6+legF*.55);ctx.stroke();
 ctx.beginPath();ctx.moveTo(8,hipY);ctx.lineTo(6+l2*.6+legF,-4+legF*.62);ctx.stroke();
 ctx.fillStyle='#14141c';
 ctx.beginPath();ctx.ellipse(l1*.6-4+legF*.3+3*fc,-2+legF*.55,9,5,0,0,7);ctx.fill();
 ctx.beginPath();ctx.ellipse(6+l2*.6+legF+3*fc,0+legF*.62,9,5,0,0,7);ctx.fill();
 // torso
 rrect(-16,shY,32,hipY-shY+6,9,ch.suit,'#00000044');
 // shirt + tie
 ctx.fillStyle='#e8ecf5';ctx.beginPath();ctx.moveTo(-5,shY+2);ctx.lineTo(5,shY+2);ctx.lineTo(3,shY+20);ctx.lineTo(-3,shY+20);ctx.closePath();ctx.fill();
 if(ch.tie){ctx.fillStyle=ch.tie;ctx.beginPath();ctx.moveTo(0,shY+4);ctx.lineTo(4,shY+12);ctx.lineTo(0,shY+34);ctx.lineTo(-4,shY+12);ctx.closePath();ctx.fill();}
 // back arm
 ctx.strokeStyle=ch.suit;ctx.lineWidth=10;
 ctx.beginPath();ctx.moveTo(-8,shY+8);ctx.lineTo(armB>0?armB*fc*0: -10,-4+armB*.4+shY+30);ctx.lineTo(armB*0.8-14,shY+34);ctx.stroke();
 // front arm
 if(bothUp){ctx.strokeStyle=ch.skin;ctx.lineWidth=9;
  ctx.beginPath();ctx.moveTo(-10,shY+6);ctx.lineTo(-22,shY-26);ctx.stroke();
  ctx.beginPath();ctx.moveTo(10,shY+6);ctx.lineTo(24,shY-28);ctx.stroke();
  ctx.fillStyle=ch.skin;ctx.beginPath();ctx.arc(-22,shY-28,5.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(24,shY-28,5.5,0,7);ctx.fill();}
 else if(armUp){ctx.strokeStyle=ch.suit;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(6,shY+6);ctx.lineTo(26,shY-24);ctx.stroke();ctx.fillStyle=ch.skin;ctx.beginPath();ctx.arc(27,shY-26,5.5,0,7);ctx.fill();}
 else{ctx.strokeStyle=ch.suit;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(8,shY+8);ctx.lineTo(10+armF,shY+18+(armF>30?-6:4));ctx.stroke();
  ctx.fillStyle=ch.skin;ctx.beginPath();ctx.arc(12+armF,shY+18+(armF>30?-6:4),5.5,0,7);ctx.fill();}
 // back arm second stroke (behind torso look)
 // head
 drawHead(ch,lean*.4,shY-24,1);
 ctx.filter='none';
 // held special item
 if(s==='special'&&f.st<0.25){const k=f.ch.sp.kind;ctx.save();ctx.translate(27,shY-26);
  if(k==='cork'){rrect(-4,-14,9,20,4,'#2e7d46','#1b4d2a');ctx.fillStyle='#ffd75e';ctx.fillRect(-4,-14,9,4);}
  else if(k==='coins'){ctx.fillStyle='#e9c34f';ctx.beginPath();ctx.arc(0,-8,7,0,7);ctx.fill();txt('₪',0,-4,10,'#7a5c14','center','900');}
  else if(k==='wave'){ctx.fillStyle='#ff59c7';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(8,-8);ctx.lineTo(8,-22);ctx.lineTo(-4,-14);ctx.closePath();ctx.fill();}
  else if(k==='bird'){ctx.fillStyle='#59a7ff';ctx.beginPath();ctx.ellipse(0,-8,9,6,0,0,7);ctx.fill();ctx.fillStyle='#ff8c42';ctx.beginPath();ctx.moveTo(6,-8);ctx.lineTo(12,-6);ctx.lineTo(6,-4);ctx.fill();}
  else if(k==='scroll'){ctx.fillStyle='#efe3c0';rrect(-3,-18,8,26,3,'#efe3c0','#8a7a4a');}
  ctx.restore();}
 // mega aura
 if(s==='mega'){ctx.globalAlpha=.35+Math.sin(t*30)*.15;const rg=ctx.createRadialGradient(0,-90,10,0,-90,110);rg.addColorStop(0,f.ch.mega.flash);rg.addColorStop(1,'#ffffff00');ctx.fillStyle=rg;ctx.fillRect(-70,-200,140,210);ctx.globalAlpha=1;}
 // block shield
 if(s==='block'){ctx.globalAlpha=.5;ctx.strokeStyle='#59d7ff';ctx.lineWidth=3;rrect(-6,shY-14,16,96,8,null,'#59d7ff');ctx.globalAlpha=1;}
 ctx.restore();
 // stun stars
 if(f.stun>0){for(let i=0;i<3;i++){const a=t*6+i*2.1;txt('✦',x+Math.cos(a)*20,y-170+Math.sin(a)*6,14,'#ffd75e');}}
 // speech bubble
 if(f.bubble){const b=f.bubble;ctx.globalAlpha=Math.min(1,b.t*3);
  ctx.font='700 15px Arial';const w=ctx.measureText(b.text).width+22;
  const bx=clamp(x-w/2,8,W-8-w),by=y-218;
  rrect(bx,by,w,30,8,'#ffffffee',null);
  ctx.fillStyle='#101528';ctx.font='700 15px Arial';ctx.textAlign='center';ctx.fillText(b.text,bx+w/2,by+21);
  ctx.fillStyle='#ffffffee';ctx.beginPath();ctx.moveTo(x-6,by+30);ctx.lineTo(x+6,by+30);ctx.lineTo(x,by+40);ctx.fill();
  ctx.globalAlpha=1;}
}

function drawSilhouette(ch,x,y){ctx.save();ctx.translate(x,y);ctx.globalAlpha*= .5;
 ctx.fillStyle=ch.suit;rrect(-16,-104,32,48,9,ch.suit,null);drawHead(ch,0,-128,1);ctx.restore();}

function drawProj(p,t){
 ctx.save();ctx.translate(p.x,p.y);
 if(p.kind==='cork'){ctx.rotate(p.x*.03*Math.sign(p.vx));rrect(-6,-10,12,24,4,'#2e7d46','#1b4d2a');ctx.fillStyle='#ffd75e';ctx.fillRect(-6,-10,12,4);txt('💥',0,22,14,'#fff');}
 else if(p.kind==='coin'){ctx.rotate(t*9);ctx.fillStyle='#e9c34f';ctx.beginPath();ctx.ellipse(0,0,8,8,0,0,7);ctx.fill();ctx.strokeStyle='#a5801f';ctx.stroke();txt('₪',0,4,10,'#7a5c14','center','900');}
 else if(p.kind==='wave'){ctx.globalAlpha=.85;ctx.fillStyle='#ff59c7';ctx.beginPath();ctx.moveTo(-26,10);ctx.quadraticCurveTo(-8,-26,4,-6);ctx.quadraticCurveTo(14,-30,26,2);ctx.quadraticCurveTo(0,16,-26,10);ctx.fill();ctx.globalAlpha=1;txt('🔊',-18,-16,13,'#fff');}
 else if(p.kind==='bird'){const fl=Math.sin(t*18)*6;ctx.fillStyle='#59a7ff';ctx.beginPath();ctx.ellipse(0,0,11,7,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-4,-2);ctx.lineTo(-14,-8+fl);ctx.lineTo(-2,4);ctx.fill();ctx.fillStyle='#ff8c42';ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(16,2);ctx.lineTo(9,4);ctx.fill();ctx.fillStyle='#101528';ctx.beginPath();ctx.arc(6,-2,1.6,0,7);ctx.fill();}
 else if(p.kind==='scroll'){ctx.rotate(p.x*.05*Math.sign(p.vx));rrect(-5,-14,10,28,3,'#efe3c0','#8a7a4a');txt('📜',0,-22,12,'#fff');}
 ctx.restore();
}

/* ---------- HUD ---------- */
function bar(x,y,w,h,frac,ghost,col,bgc){
 rrect(x-2,y-2,w+4,h+4,6,'#0a0e20','#39456b');
 rrect(x,y,w,h,4,bgc||'#3a1030',null);
 const gw=Math.round(w*clamp(ghost,0,1));rrect(x,y,gw,h,4,'#ffffff55',null);
 const fw=Math.round(w*clamp(frac,0,1));rrect(x,y,fw,h,4,col,null);
}
function drawHUD(f,t){
 const p1=f.p1,p2=f.p2;
 bar(30,26,360,22,p1.hp/MAXHP,p1.hpGhost/MAXHP,'#3ddc7a','#2a4d38');
 bar(W-30-360,26,360,22,p2.hp/MAXHP,p2.hpGhost/MAXHP,'#3ddc7a','#2a4d38');
 txt(p1.ch.name,40,64,17,'#e8ecf5','left');txt(p2.ch.name,W-40,64,17,'#e8ecf5','right');
 // meter
 bar(30,72,240,10,p1.meter/100,0,p1.meter>=100?'#ffd75e':'#4aa3ff','#12203a');
 bar(W-30-240,72,240,10,p2.meter/100,0,p2.meter>=100?'#ffd75e':'#4aa3ff','#12203a');
 if(p1.meter>=100&&Math.sin(t*8)>0)txt('MEGA READY! [E]',30,94,12,'#ffd75e','left');
 if(p2.meter>=100&&Math.sin(t*8)>0)txt(p2.human?'MEGA READY! [P]':'MEGA READY!',W-270,94,12,'#ffd75e','left');
 // round pips
 for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(430+i*22,38,8,0,7);ctx.fillStyle=i<p1.wins?'#ffd75e':'#232c52';ctx.fill();ctx.strokeStyle='#39456b';ctx.stroke();
  ctx.beginPath();ctx.arc(W-430-i*22,38,8,0,7);ctx.fillStyle=i<p2.wins?'#ffd75e':'#232c52';ctx.fill();ctx.stroke();}
 // timer
 txt(Math.ceil(Math.max(0,f.timer)),W/2,52,34,'#fff','center','900','Arial');
 // combo
 if(f.comboMsg&&f.comboT>0){ctx.save();ctx.globalAlpha=Math.min(1,f.comboT*2);
  txt(f.comboMsg.n+' HIT COMBO!',f.comboMsg.p===p1?150:W-150,140,26,'#ffd75e');ctx.restore();}
}
function announce(f,dt){
 if(f.annT>0){f.annT-=dt;ctx.save();ctx.globalAlpha=clamp(f.annT*2,0,1);
  const sc=1+Math.max(0,(f.annT-.8))*.6;ctx.translate(W/2,250);ctx.scale(sc,sc);
  txt(f.ann,0,0,64,'#ffd75e','center','900','Impact, Arial');ctx.strokeStyle='#101528';ctx.lineWidth=2;ctx.strokeText(f.ann,0,0);
  ctx.restore();}
}

/* ---------- scenes ---------- */
let scene='title',mode=1,sel={i1:0,i2:1,l1:false,l2:false},fight=null,t=0,menuT=0;
const confetti=[];
function startMatch(){fight=newFight(sel.i1,sel.i2,mode===2);scene='fight';fight.ann='ROUND 1';fight.annT=1.1;Snd.boop();}

function drawTitle(){
 drawBG(t,0);
 ctx.save();ctx.translate(W/2,190);ctx.rotate(Math.sin(t*1.2)*.03);
 txt('COALITION',0,0,84,'#ffd75e','center','900','Impact, Arial');
 txt('KOMBAT',0,72,84,'#ff2d55','center','900','Impact, Arial');
 ctx.strokeStyle='#101528';ctx.lineWidth=4;ctx.strokeText('COALITION',0,0);ctx.strokeText('KOMBAT',0,72);
 ctx.restore();
 txt('Political parody fighter — best of 3 rounds',W/2,300,18,'#aeb8d0');
 const opts=['1 PLAYER  (vs CPU)','2 PLAYERS  (versus)'];
 for(let i=0;i<2;i++){const active=(mode-1)===i;
  rrect(W/2-190,330+i*54,380,44,10,active?'#243064':'#141a30',active?'#ffd75e':'#39456b');
  txt((active?'▶ ':'')+opts[i],W/2,358+i*54,20,active?'#ffd75e':'#8a93a8');}
 txt('A / D or ←/→ : choose    ENTER or F : start    M : sound',W/2,470,15,'#66708a');
 txt('Satire. Cartoon only. Not affiliated with anyone. 🍾',W/2,500,12,'#4a5470');
}
function drawSelect(){
 drawBG(t,0);
 txt('CHOOSE YOUR COALITION CRASHER',W/2,60,32,'#ffd75e','center','900','Impact, Arial');
 txt(mode===2?'P1: A/D move · F lock      P2: ←/→ move · K lock':'P1: A/D move · F lock in      (CPU picks random)',W/2,92,14,'#8a93a8');
 const cw=150,gap=14,totw=6*cw+5*gap,x0=(W-totw)/2;
 for(let i=0;i<6;i++){const ch=CHARS[i],x=x0+i*(cw+gap),y=130;
  const hl=(i===sel.i1&&sel.l1)||(i===sel.i2&&sel.l2);
  rrect(x,y,cw,250,12,hl?'#2a386e':'#141a30',hl?'#ffd75e':(i===sel.i1||i===sel.i2)?'#4a5a94':'#232c52');
  ctx.save();ctx.translate(x+cw/2,y+108);ctx.scale(2.6,2.6);drawHead(ch,0,0,1);ctx.restore();
  txt(ch.name,x+cw/2,y+170,19,'#e8ecf5');
  txt(ch.epithet,x+cw/2,y+192,11,'#8a93a8');
  txt(ch.sp.name,x+cw/2,y+216,10,'#4aa3ff');
  txt('MEGA: '+ch.mega.name,x+cw/2,y+234,10,'#ffd75e');
  // markers
  if(i===sel.i1)txt('P1'+(sel.l1?' 🔒':''),x+cw/2-34,y+24,15,'#3ddc7a','center');
  if(i===sel.i2)txt(mode===2?'P2'+(sel.l2?' 🔒':''):'CPU',x+cw/2+34,y+24,15,mode===2?'#ff59c7':'#ff8c42','center');
 }
 const ready=sel.l1&&(mode===2?sel.l2:true);
 if(ready){if(Math.sin(t*6)>-.5)txt('PRESS ENTER TO RUMBLE!',W/2,430,26,'#3ddc7a');}
 txt('ESC : back',W/2,480,13,'#66708a');
}
function drawVictory(){
 drawBG(t,0);
 const win=fight.koWinner||fight.p1;
 // confetti
 for(const c of confetti){ctx.globalAlpha=.9;ctx.fillStyle=c.col;ctx.fillRect(c.x,c.y,c.s,c.s*1.6);ctx.globalAlpha=1;}
 ctx.save();ctx.translate(W/2,300);const sc=1.8+Math.sin(t*3)*.08;ctx.scale(sc,sc);
 const sx=win.x,sy=win.y;win.x=0;win.y=-10;drawFighter(win,t);win.x=sx;win.y=sy;ctx.restore();
 txt(win.ch.name+' WINS THE COALITION!',W/2,70,44,'#ffd75e','center','900','Impact, Arial');
 txt('“'+pick(KO_QUIPS)+'”',W/2,110,18,'#aeb8d0');
 txt('FINAL: '+fight.p1.ch.name+' '+fight.p1.wins+' — '+fight.p2.wins+' '+fight.p2.ch.name,W/2,470,20,'#e8ecf5');
 txt('ENTER : rematch    ESC : main menu',W/2,500,14,'#8a93a8');
}

/* ---------- fight update ---------- */
function updFight(dt){
 const f=fight;if(!f)return;
 f.shake=Math.max(0,f.shake-dt*40);f.flashT=Math.max(0,f.flashT-dt);
 if(f.comboT>0){f.comboT-=dt;if(f.comboT<=0)f.comboMsg=null;}
 if(f.hitstop>0){f.hitstop-=dt;return;}
 if(f.state==='intro'){f.introT+=dt;if(f.introT>1.15){f.state='fight';f.ann='FIGHT!';f.annT=.8;Snd.boom();}return;}
 if(f.state==='fight'){
  f.timer-=dt;f.p1.meter=clamp(f.p1.meter+dt*2.5,0,100);f.p2.meter=clamp(f.p2.meter+dt*2.5,0,100);
  const i1=humanInp(1),i2=f.p2.human?humanInp(2):aiUpdate(f.p2,f.p1,dt,f);
  f.p1.update(dt,i1,f.p2,f);f.p2.update(dt,i2,f.p1,f);
  // body pushout
  if(f.p1.state!=='ko'&&f.p2.state!=='ko'){const a=f.p1.rect(),b=f.p2.rect();
   if(overlap(a,b)){const mid=(f.p1.x+f.p2.x)/2,push=2.2;f.p1.x+=(f.p1.x<mid?-push:push);f.p2.x+=(f.p2.x<mid?-push:push);
    f.p1.x=clamp(f.p1.x,40,W-40);f.p2.x=clamp(f.p2.x,40,W-40);}}
  // projectiles
  for(const p of f.proj){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.kind==='coin'||p.kind==='bird')p.vy+=700*dt;
   const foe=p.owner===f.p1?f.p2:f.p1;
   if(foe.state!=='ko'&&overlap({x:p.x-12,y:p.y-12,w:24,h:24},foe.rect())){
    const clean=foe.takeHit(p.dmg,220,Math.sign(p.vx)||p.owner.facing,p.owner);
    f.onHit(p.owner,foe,p.dmg,clean);Snd.pop();burst(F.parts,p.x,p.y,'#ffd75e',6);p.life=0;}}
  f.proj=f.proj.filter(p=>p.life>0&&p.x>-60&&p.x<W+60&&p.y<GROUND+40);
  // time out
  if(f.state==='fight'&&f.timer<=0){f.timer=0;
   const loser=f.p1.hp===f.p2.hp?(Math.random()<.5?f.p1:f.p2):(f.p1.hp<f.p2.hp?f.p1:f.p2);
   loser.state='ko';loser.vy=-380;F.onKO(loser,loser===f.p1?f.p2:f.p1);}
  return;
 }
 if(f.state==='ko'){f.koT+=dt;
  const i1=humanInp(1);f.p1.update(dt,f.p1.state==='ko'?NEUTRAL:i1,f.p2,f);
  f.p2.update(dt,f.p2.state==='ko'?NEUTRAL:(f.p2.human?humanInp(2):NEUTRAL),f.p1,f);
  for(const p of f.proj){p.x+=p.vx*dt;p.life-=dt;}f.proj=f.proj.filter(p=>p.life>0);
  if(f.koT>2.4){
   const win=f.koWinner;
   if(win.wins>=2){scene='victory';confetti.length=0;
    for(let i=0;i<140;i++)confetti.push({x:rnd(0,W),y:rnd(-H,0),vx:rnd(-30,30),vy:rnd(60,160),s:rnd(3,7),col:pick(['#ffd75e','#ff59c7','#59d7ff','#3ddc7a','#ff8c42'])});
    Snd.say(win.ch.name+' WINS!');}
   else{f.round++;f.p1.resetRound(320,1);f.p2.resetRound(640,-1);f.state='intro';f.introT=0;f.timer=60;f.ann='ROUND '+f.round;f.annT=1.1;f.proj.length=0;}
  }}
}

/* ---------- main loop ---------- */
let last=0;
function frame(ts){
 requestAnimationFrame(frame);
 const now=ts/1000;let dt=Math.min(0.033,now-last||0.016);last=now;t+=dt;
 ctx.clearRect(0,0,W,H);
 // particles always
 for(const p of F.parts){p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.vy!==undefined&&!p.text)p.vy+=(p.g||0)*dt;}
 for(let i=F.parts.length-1;i>=0;i--){if(F.parts[i].life<=0)F.parts.splice(i,1);}
 if(scene==='title'){
  if(just['a']||just['arrowleft']||just['d']||just['arrowright']){mode=mode===1?2:1;Snd.boop();}
  if(just['enter']||just['f']){Snd.unlock();scene='select';sel={i1:0,i2:mode===2?1:0,l1:false,l2:false};Snd.pop();}
  drawTitle();
 }else if(scene==='select'){
  if(just['escape']){scene='title';Snd.boop();}
  if(!sel.l1){if(just['a']){sel.i1=(sel.i1+5)%6;Snd.boop();}if(just['d']){sel.i1=(sel.i1+1)%6;Snd.boop();}
   if(just['f']||just['w']){sel.l1=true;Snd.pop();if(mode===1)sel.i2=(Math.random()*6)|0;}}
  if(mode===2&&!sel.l2){if(just['arrowleft']){sel.i2=(sel.i2+5)%6;Snd.boop();}if(just['arrowright']){sel.i2=(sel.i2+1)%6;Snd.boop();}
   if(just['k']||just['arrowup']){sel.l2=true;Snd.pop();}}
  const ready=sel.l1&&(mode===2?sel.l2:true);
  if(ready&&(just['enter']))startMatch();
  drawSelect();
 }else if(scene==='fight'){
  if(just['escape']){scene='title';fight=null;Snd.boop();}
  else{updFight(dt);drawBG(t,fight.shake);drawFighter(fight.p1,t);drawFighter(fight.p2,t);
   for(const p of fight.proj)drawProj(p,t);
   for(const p of F.parts){if(p.text){ctx.globalAlpha=clamp(p.life*2,0,1);txt(p.text,p.x,p.y,22,p.col,'center','900','Impact, Arial');ctx.globalAlpha=1;}
    else{ctx.globalAlpha=clamp(p.life*2.2,0,1);ctx.fillStyle=p.col;ctx.fillRect(p.x,p.y,p.size,p.size);ctx.globalAlpha=1;}}
   drawHUD(fight,t);announce(fight,dt);
   if(fight.flashT>0){ctx.globalAlpha=fight.flashT*2.4;ctx.fillStyle=fight.flashCol;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}}
 }else if(scene==='victory'){
  if(just['escape']){scene='title';fight=null;Snd.boop();}
  else if(just['enter']){scene='select';sel={i1:sel.i1,i2:sel.i2,l1:false,l2:false};Snd.pop();}
  else{for(const c of confetti){c.x+=c.vx*dt;c.y+=c.vy*dt;if(c.y>H){c.y=-10;c.x=rnd(0,W);}}}
  if(scene==='victory')drawVictory();
 }
 for(const k in just)just[k]=false;
}
requestAnimationFrame(frame);
