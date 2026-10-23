import {terrain} from './engine.js';
const TAU=Math.PI*2;
const poly=(g,pts,color)=>{g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fillStyle=color;g.fill();};
const oval=(g,x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();};
const round=(g,x,y,w,h,r,color)=>{g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
const line=(g,x,y,x2,y2,color,width=2)=>{g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export function drawCar(g,x,y,angle,vehicle,scale=1,spin=0){
 g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);const truck=vehicle.id==='truck',buggy=vehicle.id==='buggy',radius=truck?23:18;
 line(g,-36,8,34,8,'#4d5349',7);line(g,-35,14,-24,-2,'#bcc7a7',4);line(g,35,14,25,-2,'#bcc7a7',4);
 if(buggy){poly(g,[[-45,0],[-37,-18],[-10,-17],[8,-10],[42,-10],[52,4],[38,15],[-38,15]],vehicle.color);line(g,-19,-17,-12,-41,'#465847',4);line(g,-12,-41,16,-41,'#465847',4);line(g,16,-41,34,-11,'#465847',4);poly(g,[[-10,-37],[13,-37],[24,-17],[-13,-17]],'#aac9bd');round(g,-13,-18,19,16,3,'#446354');}
 else{round(g,-47,-12,97,31,6,vehicle.color);poly(g,[[-38,-12],[-31,-46],[10,-46],[32,-12]],vehicle.color);round(g,-34,-49,48,5,3,vehicle.roof);poly(g,[[-28,-40],[-9,-40],[-9,-18],[-32,-18]],'#a9c6bc');poly(g,[[-4,-40],[8,-40],[23,-18],[-4,-18]],'#c4dbcd');line(g,-8,-10,-8,12,'#ffffff22',1);round(g,-4,-9,9,3,1,'#785e3f');if(truck){round(g,-50,-16,19,31,3,'#5b816b');round(g,-30,-58,32,8,2,'#ba9e6c');line(g,-21,-58,-21,-50,'#e6d6a9',2);}else{round(g,-28,-60,31,10,3,'#ad986b');line(g,-22,-59,-22,-51,'#e8d8a6',2);line(g,-5,-59,-5,-51,'#e8d8a6',2);}}
 round(g,27,-13,25,9,3,vehicle.color);round(g,45,-8,8,7,2,'#fff1b9');round(g,-51,-4,5,7,1,'#b4533e');round(g,42,11,14,5,2,'#d8d5b8');round(g,-50,12,10,5,2,'#475345');line(g,-30,4,27,4,'#fff2c440',2);
 oval(g,12,-25,7,8,'#e1b187');round(g,4,-34,14,5,2,'#74895e');line(g,14,-20,22,-16,'#42584d',4);
 for(const wx of [-35,35]){oval(g,wx,16,radius+3,radius+3,'#43594a');oval(g,wx,16,radius,radius,'#303d36');g.save();g.translate(wx,16);g.rotate(spin);for(let i=0;i<10;i++){const a=i*TAU/10;line(g,Math.cos(a)*(radius-3),Math.sin(a)*(radius-3),Math.cos(a)*radius,Math.sin(a)*radius,'#526253',2);}oval(g,0,0,radius*.55,radius*.55,'#c4c8b5');oval(g,0,0,radius*.32,radius*.32,'#8c9c89');for(let i=0;i<4;i++){const a=i*TAU/4;oval(g,Math.cos(a)*6,Math.sin(a)*6,1.4,1.4,'#e5e2ce');}oval(g,0,0,2.2,2.2,'#5b705d');g.restore();}
 g.restore();
}
function pine(g,x,y,size,color){g.save();g.translate(x,y);g.scale(size,size);line(g,0,0,0,-70,'#6e7e57',5);poly(g,[[-24,-25],[0,-76],[24,-25]],color);poly(g,[[-21,-45],[0,-91],[21,-45]],color);poly(g,[[-15,-65],[0,-105],[15,-65]],color);poly(g,[[0,-105],[0,-25],[24,-25],[11,-47],[21,-45],[8,-68],[15,-65]],'#203e2c0c');g.restore();}
function cloud(g,x,y,s){g.save();g.translate(x,y);g.scale(s,s);oval(g,0,0,45,11,'#f7f9ec80');oval(g,-16,-9,20,13,'#f7f9ec80');oval(g,10,-16,24,20,'#f7f9ec80');oval(g,34,-5,21,12,'#f7f9ec80');g.restore();}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d');this.w=1200;this.h=540;this.camera=0;this.offsetY=0;this.dust=[];this.time=0;this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);}
 resize(){const r=this.canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.w=r.width/r.height*540;this.h=540;this.ratio=this.canvas.height/540;}
 render(race,home,dt){const g=this.g,w=this.w,h=540;this.time+=dt;g.setTransform(this.ratio,0,0,this.ratio,0,0);g.clearRect(0,0,w,h);
 const targetCam=home?420:race.x-w*.29;this.camera+= (targetCam-this.camera)*Math.min(1,dt*5);if(home)this.camera=420;const ground=home?terrain(420+w*.69):terrain(race.x);const targetY=home?h*.79-ground:h*.76-ground;this.offsetY+=(targetY-this.offsetY)*Math.min(1,dt*4);if(home)this.offsetY=targetY;
 const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#d4e6da');sky.addColorStop(.7,'#e8edcc');sky.addColorStop(1,'#e5e8c2');g.fillStyle=sky;g.fillRect(0,0,w,h);
 oval(g,w*.79,119,42,42,'#f7efd080');oval(g,w*.79,119,30,30,'#fbf0bf');
 for(let i=-1;i<5;i++){const x=i*420-(this.camera*.04%420);cloud(g,x+130,90+(i%2)*64,.75+(i%3)*.2);}
 for(let layer=0;layer<3;layer++){const colors=['#b3cec0','#9dbda4','#89ac88'],base=255+layer*48,amp=95-layer*16,par=.08+layer*.08;g.beginPath();g.moveTo(0,h);for(let x=0;x<=w+12;x+=12){const u=x+this.camera*par;let y=base+Math.sin(u/190+layer*2)*amp+Math.sin(u/91+layer)*amp*.3;g.lineTo(x,y);}g.lineTo(w,h);g.closePath();g.fillStyle=colors[layer];g.fill();}
 // A distant lookout, tiny birds, and a ribbon of river give the valley depth.
 const hutX=w*.72-(this.camera*.12%170);g.save();g.globalAlpha=.55;round(g,hutX,231,29,22,1,'#d7dbc0');poly(g,[[hutX-4,233],[hutX+14,216],[hutX+34,233]],'#6d927b');round(g,hutX+11,241,7,12,1,'#648970');g.restore();
 for(let i=0;i<3;i++){const x=w*.47+i*19,y=132+Math.sin(i)*10;g.beginPath();g.moveTo(x-5,y);g.quadraticCurveTo(x-2,y-4,x,y);g.quadraticCurveTo(x+3,y-4,x+6,y);g.strokeStyle='#648b7960';g.lineWidth=1.5;g.stroke();}
 for(let i=-1;i<Math.ceil(w/70)+2;i++){const worldI=Math.floor(this.camera*.38/70)+i,x=worldI*70-this.camera*.38;pine(g,x,353+Math.sin(worldI*1.7)*24,.4+hash(worldI)*.3,'#719976');}
 // Foreground terrain is the same function used by the physics engine.
 g.save();g.translate(-this.camera,this.offsetY);const left=Math.floor(this.camera/8)*8,right=this.camera+w+16;
 for(let i=Math.floor(left/190)-1;i<right/190+1;i++){const x=i*190+hash(i)*80;if(x<240)continue;pine(g,x,terrain(x)+7,.65+hash(i+4)*.65,hash(i+5)>.5?'#507e56':'#628954');}
 g.beginPath();g.moveTo(left,h-this.offsetY+50);for(let x=left;x<=right;x+=8)g.lineTo(x,terrain(x));g.lineTo(right,h-this.offsetY+50);g.closePath();g.fillStyle='#a9ae73';g.fill();
 g.beginPath();for(let x=left;x<=right;x+=8){const y=terrain(x);x===left?g.moveTo(x,y):g.lineTo(x,y);}g.strokeStyle='#607f42';g.lineWidth=14;g.lineJoin='round';g.stroke();g.strokeStyle='#b1c270';g.lineWidth=6;g.stroke();
 g.beginPath();for(let x=left;x<=right;x+=8){const y=terrain(x)+22+Math.sin(x*.018)*3;x===left?g.moveTo(x,y):g.lineTo(x,y);}g.strokeStyle='#cec08b';g.lineWidth=3;g.stroke();
 for(let i=Math.floor(left/33);i<right/33;i++){const x=i*33+hash(i+7)*20,y=terrain(x)+40+hash(i+19)*120;oval(g,x,y,2+hash(i)*4,1.5,'#7c8e5830');if(i%4===0){line(g,x,terrain(x)-6,x-3,terrain(x)-12,'#718b46',1.7);line(g,x,terrain(x)-6,x+3,terrain(x)-11,'#718b46',1.7);}}
 // Trail signs and little flowers are anchored to the hills.
 for(let i=Math.floor(left/2200);i<right/2200+1;i++){const x=i*2200+1700,y=terrain(x);line(g,x,y,x,y-59,'#7e8559',5);round(g,x-28,y-68,59,24,3,'#d8c694');g.fillStyle='#687a4c';g.font='bold 9px sans-serif';g.textAlign='center';g.fillText((i+1)*220+' m →',x,y-52);}
 if(!home)for(const item of race.items){if(item.collected||item.x<left-30||item.x>right+30)continue;const y=item.y+Math.sin(this.time*3+item.x)*3;if(item.type==='coin'){oval(g,item.x,y,11,12,'#bd933e');oval(g,item.x,y-1,10,11,'#f1ce70');oval(g,item.x,y-1,7,8,'#e7b84f');g.fillStyle='#fff0ba';g.font='bold 14px serif';g.textAlign='center';g.fillText('✦',item.x,y+4);}else{round(g,item.x-13,y-16,26,32,4,'#ba5b40');round(g,item.x-11,y-16,20,29,3,'#dc7955');line(g,item.x-5,y-18,item.x+5,y-18,'#944d35',4);line(g,item.x-8,y-21,item.x-12,y-25,'#d8c6a0',5);line(g,item.x-6,y-7,item.x+6,y+6,'#f5ba86',2);line(g,item.x+6,y-7,item.x-6,y+6,'#f5ba86',2);}}
 const carX=home?this.camera+w*.70:race.x,carScale=home?(w<700?1.15:1.48):1,carA=home?Math.atan((terrain(carX+30)-terrain(carX-30))/60):race.angle,carY=home?terrain(carX)-(race.radius+16)*carScale:race.y;
 oval(g,carX,terrain(carX)-3,53*carScale,7,'#3b59382b');
 if(!home&&race.grounded&&Math.abs(race.vx)>50&&Math.random()<.5)this.dust.push({x:race.x-40,y:terrain(race.x)-8,life:1,size:3+Math.random()*5});
 for(const p of this.dust){p.life-=dt*1.6;p.x-=dt*25;p.y-=dt*10;g.globalAlpha=Math.max(0,p.life)*.35;oval(g,p.x,p.y,p.size*(2-p.life),p.size,'#e2dab1');}g.globalAlpha=1;this.dust=this.dust.filter(p=>p.life>0);
 drawCar(g,carX,carY,carA,race.vehicle,carScale,home?.2:race.x/race.radius);g.restore(); if(home){const wash=g.createLinearGradient(0,0,w*.55,0);wash.addColorStop(0,"#e3ebd19c");wash.addColorStop(1,"#e3ebd100");g.fillStyle=wash;g.fillRect(0,145,w*.55,395);}
 }
}


