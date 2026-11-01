/** A self-contained, original Canvas 2D street illustration. No external assets. */
export class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 900;
    this.height = 560;
    this.phase = 'ready';
    this.phaseAt = 0;
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.scale = Math.min(w / 900, h / 560);
    this.offsetX = (w - 900 * this.scale) / 2;
    this.offsetY = (h - 560 * this.scale) / 2;
  }

  p(x, depth, height = 0) {
    return [40 + x + depth * .48, 500 - x * .16 - depth * .48 - height];
  }

  poly(points, fill, stroke, width = 1) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p));
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }

  ground(x1, d1, x2, d2, fill) {
    this.poly([this.p(x1,d1), this.p(x2,d1), this.p(x2,d2), this.p(x1,d2)], fill);
  }

  side(x1, x2, d, h1, h2, fill, stroke) {
    this.poly([this.p(x1,d,h1), this.p(x2,d,h1), this.p(x2,d,h2), this.p(x1,d,h2)], fill, stroke);
  }

  line(points, color, width = 2) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p));
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  }

  circle(x, y, radius, color) {
    const c = this.ctx;
    c.beginPath(); c.arc(x,y,radius,0,Math.PI*2); c.fillStyle = color; c.fill();
  }

  ellipse(x, y, rx, ry, color, rotation = 0) {
    const c = this.ctx;
    c.beginPath(); c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2); c.fillStyle = color; c.fill();
  }

  box(x, d, w, depth, h, front, right, top) {
    this.side(x,x+w,d,0,h,front);
    this.poly([this.p(x+w,d),this.p(x+w,d+depth),this.p(x+w,d+depth,h),this.p(x+w,d,h)],right);
    this.poly([this.p(x,d,h),this.p(x+w,d,h),this.p(x+w,d+depth,h),this.p(x,d+depth,h)],top);
  }

  sideText(text, x, d, h, color, size, weight = 700) {
    const c = this.ctx, p = this.p(x,d,h);
    c.save(); c.translate(...p); c.transform(1,-.16,0,1,0,0);
    c.font = `${weight} ${size}px "Microsoft YaHei", system-ui, sans-serif`;
    c.fillStyle=color; c.fillText(text,0,0); c.restore();
  }

  building(x, w, h, color, roof, variant) {
    const d = 365;
    this.box(x,d,w,90,h,color,'#b5ad92',roof);
    this.side(x-3,x+w+3,d-2,h-8,h,'#e6dfc7');
    this.side(x,x+w,d-1,0,19,'#97a18c');
    const columns=Math.max(2,Math.round(w/54));
    const gap=w/columns;
    for(let row=0;row<3;row++) {
      for(let col=0;col<columns;col++) {
        const xx=x+gap*col+13, hh=45+row*53;
        if(hh+36>h-16) continue;
        this.side(xx,xx+27,d-1,hh,hh+36,'#f5eed8');
        this.side(xx+3,xx+24,d-2,hh+3,hh+33,variant===1&&row===1?'#8dada4':'#648c87');
        this.side(xx+5,xx+11,d-3,hh+4,hh+32,'#8bb2a5');
        this.line([this.p(xx+14,d-4,hh+3),this.p(xx+14,d-4,hh+33)],'#dedec6',1.5);
        this.line([this.p(xx+3,d-4,hh+18),this.p(xx+24,d-4,hh+18)],'#dedec6',1.5);
        this.side(xx-2,xx+29,d-4,hh-2,hh+1,'#fff8de');
      }
    }
    if(variant===1) {
      this.side(x+w*.48,x+w*.76,d-3,1,48,'#446c62');
      this.side(x+w*.51,x+w*.73,d-4,6,43,'#63897c');
      this.side(x+w*.4,x+w*.84,d-8,48,62,'#e8b75d');
      this.sideText('早 安 商 店',x+w*.43,d-9,52,'#31564a',7);
      this.line([this.p(x+w*.43,d-10,48),this.p(x+w*.43,d-20,39),this.p(x+w*.81,d-20,39),this.p(x+w*.81,d-10,48)],'#f5d38c',7);
    } else {
      this.side(x+w*.43,x+w*.64,d-3,0,43,'#506d61');
      this.side(x+w*.48,x+w*.6,d-4,7,36,'#6b8c7b');
    }
  }

  tree(x, d, scale=1) {
    const c=this.ctx, [px,py]=this.p(x,d);
    this.ellipse(px+17*scale,py+4*scale,35*scale,10*scale,'#4a675225',-.16);
    c.save(); c.translate(px,py); c.scale(scale,scale);
    this.poly([[-5,0],[4,-1],[6,-76],[-1,-76]],'#9a8661');
    this.line([[1,-45],[-16,-66]],'#9a8661',4);
    this.circle(-4,-86,31,'#6e9b7b'); this.circle(13,-91,25,'#82aa86');
    this.circle(-15,-100,23,'#87af8b'); this.circle(4,-112,21,'#98bb93');
    this.circle(-15,-111,10,'#a5c49b');
    this.poly([[-30,-78],[-10,-62],[17,-69],[29,-87],[6,-79]],'#638b7030');
    c.restore();
  }

  lamp(x,d) {
    const [px,py]=this.p(x,d);
    this.poly([[px-8,py+4],[px+13,py],[px+68,py+25],[px+41,py+31]],'#31594e22');
    this.ellipse(px,py,7,3,'#496259');
    this.line([[px,py],[px,py-125],[px+4,py-132],[px+28,py-136]],'#4e655b',4);
    this.ellipse(px+27,py-135,13,5,'#4c6359',-.2);
    this.ellipse(px+27,py-133,10,2,'#ede9cb',-.2);
  }

  background(now, phase) {
    const c=this.ctx;
    const gradient=c.createLinearGradient(0,0,0,560);
    gradient.addColorStop(0,'#dbe4ce'); gradient.addColorStop(1,'#e9e0c7');
    c.fillStyle=gradient; c.fillRect(-500,-500,1900,1560);
    this.ground(-400,280,1200,650,'#c3ceb3');
    this.ground(-400,290,1200,340,'#d8d3ba');
    this.ground(-400,270,1200,287,'#f1e7cc');
    this.ground(-400,-30,1200,270,'#8f9d92');
    this.ground(-400,-24,1200,-12,'#e7c76b');
    this.ground(-400,-12,1200,-4,'#f7eed0');
    this.ground(-400,251,1200,258,'#e9ead8');
    this.ground(-400,-160,1200,-30,'#e1d6ba');
    this.ground(-400,-46,1200,-30,'#c0bda6');
    this.ground(-400,-50,1200,-46,'#f5e9ca');
    const shift=phase==='playing'?Math.sin(now/2200)*2:0;
    for(let x=-350;x<1100;x+=155) this.ground(x+shift,31,x+68+shift,35,'#e5e6d2');
    for(let x=-300;x<1100;x+=114) this.line([this.p(x,-50),this.p(x,-170)],'#c5baa01f',1.5);
    this.building(-180,180,180,'#d8cbb0','#e9e0c9',0);
    this.building(10,185,208,'#c7bca3','#f0e8d2',1);
    this.building(205,172,188,'#d9cfb6','#eee6d0',0);
    this.building(387,170,225,'#ccbea2','#e8dec6',0);
    this.building(567,184,194,'#d8ccb2','#ece3ca',1);
    this.building(761,175,220,'#c1baa2','#e8e0c8',0);
    this.tree(-65,320,.9); this.tree(202,320,.8); this.tree(590,320,.87); this.tree(827,320,1);
    this.lamp(330,292); this.lamp(820,292);
    // A small planter beside the stop.
    this.box(103,290,53,20,13,'#afa78d','#8f947c','#c3bda2');
    for(let i=0;i<6;i++) { const p=this.p(108+i*8,300,22); this.circle(...p,10,i%2?'#789f78':'#92ad83'); }
    // Warm sunlight, kept subtle enough for the action to read clearly.
    const sun=c.createRadialGradient(50,0,5,50,0,550);
    sun.addColorStop(0,'#ffefbd32'); sun.addColorStop(1,'#fff3c500');
    c.fillStyle=sun; c.fillRect(0,0,900,560);
  }

  passenger(x,d,h,shirt,skin='#d9af83',hair='#45483c') {
    const c=this.ctx, [px,py]=this.p(x,d,h);
    c.save(); c.translate(px,py); c.transform(1,-.16,0,1,0,0);
    c.fillStyle=shirt; c.beginPath(); c.roundRect(-12,-4,24,27,7); c.fill();
    this.line([[-6,7],[-8,19]],'#ffffff30',3);
    this.circle(0,-11,10,skin); this.ellipse(-1,-17,11,6,hair,-.12);
    this.circle(7,-10,2,skin); this.circle(4,-11,1,'#35413a');
    c.restore();
  }

  wheel(x,d,h=15,spin=0) {
    const c=this.ctx,[px,py]=this.p(x,d,h);
    c.save(); c.translate(px,py); c.transform(1,-.16,0,1,0,0);
    this.ellipse(0,0,25,27,'#344840'); this.ellipse(1,-1,18,20,'#43584e');
    this.ellipse(1,-1,12,14,'#8b9a87'); this.ellipse(1,-1,7,9,'#5c7566');
    for(let i=0;i<6;i++) { const a=i*Math.PI/3+spin; this.circle(1+Math.cos(a)*9,-1+Math.sin(a)*10,1.9,'#c3c9af'); }
    c.restore();
  }

  bus(state, now) {
    const c=this.ctx;
    const lostAge=state.phase==='lost'?Math.max(0,(now-this.phaseAt)/1000):0;
    const departure=state.phase==='lost'?Math.min(760,Math.max(0,lostAge-.65)**2*75):0;
    const idle=state.phase==='playing'?Math.sin(now/100)*.45:Math.sin(now/600)*.2;
    c.save(); c.translate(departure,-departure*.16+idle);
    const x1=220,x2=650,d1=128,d2=228;
    this.poly([this.p(x1-5,d1-16),this.p(x2+25,d1-16),this.p(x2+45,d2+8),this.p(x1+5,d2+8)],'#34524824');
    this.side(x1+5,x2-3,d1,16,41,'#485e4e');
    // Front face and broad sunny side.
    this.poly([this.p(x2,d1,24),this.p(x2,d2,24),this.p(x2,d2,139),this.p(x2,d1,139)],'#d1ab43');
    this.side(x1,x2,d1,25,137,'#e7bd50');
    this.side(x1,x2,d1-1,32,52,'#edc964');
    this.side(x1+1,x2-1,d1-2,125,137,'#f3d883');
    this.side(x1+4,x2-5,d1-3,56,119,'#42685e');
    // Pale front windshield.
    this.poly([this.p(x2+1,d1+9,72),this.p(x2+1,d2-9,72),this.p(x2+1,d2-9,123),this.p(x2+1,d1+9,123)],'#5a8076');
    this.poly([this.p(x2+2,d1+15,78),this.p(x2+2,d1+42,78),this.p(x2+2,d1+42,119),this.p(x2+2,d1+15,119)],'#8dafa1');
    this.line([this.p(x2+3,181,75),this.p(x2+3,181,120)],'#e7d38b',3);
    this.line([this.p(x2+3,141,75),this.p(x2+3,165,92)],'#325249',2);
    // Rear panel detail.
    this.side(x1+4,x1+12,d1-3,31,50,'#e78550');
    this.side(x1+6,x1+11,d1-4,35,44,'#f3ac69');
    this.side(x1+15,x1+34,d1-4,37,47,'#f4e6ad');
    // Windows are clipped so passengers stay inside the cabin.
    c.save();
    this.poly([this.p(x1+12,d1-4,61),this.p(565,d1-4,61),this.p(565,d1-4,115),this.p(x1+12,d1-4,115)]);
    c.clip();
    this.side(x1+8,565,d1-4,61,115,'#84a89a');
    this.side(x1+8,565,d1-5,62,79,'#466b5d');
    const passengers=[
      [256,'#738d7b','#dbb992','#494e40'],[319,'#d38b66','#e0b98f','#474b3f'],
      [383,'#d5c48c','#cfa17b','#565244'],[444,'#71938d','#e2bb92','#3c4940'],
      [519,'#e5ddba','#d8ad82','#3d4b40']
    ];
    for(const [x,shirt,skin,hair] of passengers) this.passenger(x,d1-5,82,shirt,skin,hair);
    for(let x=230;x<560;x+=67) {
      this.line([this.p(x,d1-6,62),this.p(x,d1-6,116)],'#e9ddb2',5);
      this.poly([this.p(x+8,d1-7,110),this.p(x+25,d1-7,110),this.p(x+43,d1-7,64),this.p(x+26,d1-7,64)],'#e7f2d61a');
    }
    c.restore();
    this.line([this.p(x1+5,d1-7,60),this.p(565,d1-7,60)],'#f5d98c',4);
    // Dark destination board above the windows.
    this.side(368,508,d1-6,119,133,'#345a4b');
    this.sideText('21  ·  幸 福 里',378,d1-8,122,'#f6e8b8',8.5);
    this.sideText('CITY BUS',253,d1-5,40,'#6d754b',9,700);
    this.sideText('慢 慢 来',390,d1-5,40,'#747b4d',10,700);
    // Open folding door and stairs.
    const doorClosed=state.phase==='lost'||(state.phase==='won'&&now-this.phaseAt>1300);
    this.side(573,638,d1-8,24,119,'#3d6252');
    if(doorClosed) {
      this.side(577,633,d1-9,29,116,'#d5b252');
      this.side(581,600,d1-10,54,110,'#7c9e8d');
      this.side(608,628,d1-10,54,110,'#729586');
      this.line([this.p(604,d1-12,29),this.p(604,d1-12,115)],'#596b4b',2);
    } else {
      this.side(586,628,d1-9,26,113,'#b0af89');
      this.side(586,628,d1-10,25,37,'#f3e4b3');
      this.side(588,628,d1-10,40,47,'#d8cfa4');
      this.line([this.p(623,d1-13,45),this.p(623,d1-13,107)],'#e9d683',3);
      this.side(574,582,d1-13,29,115,'#e9c160');
      this.side(632,638,d1-13,29,115,'#f2d078');
    }
    this.wheel(286,d1-8,17,departure/20); this.wheel(536,d1-8,17,departure/20);
    // Roof catches the soft afternoon light.
    this.poly([this.p(x1-5,d1-5,138),this.p(x2+7,d1-5,138),this.p(x2+7,d2+5,145),this.p(x1-5,d2+5,145)],'#f8efd1');
    this.side(x1-5,x2+7,d1-5,133,139,'#e6dcb9');
    this.line([this.p(x1-3,d1-5,139),this.p(x2+5,d1-5,139)],'#fff9df',3);
    this.poly([this.p(332,164,145),this.p(414,164,145),this.p(414,204,149),this.p(332,204,149)],'#d8d5b9');
    this.poly([this.p(332,164,149),this.p(414,164,149),this.p(414,204,153),this.p(332,204,153)],'#fff6d8');
    for(const x of [351,393]) {
      const [px,py]=this.p(x,183,153);
      this.ellipse(px,py,11,5,'#5d7161',-.16);
      this.ellipse(px,py,7,3,'#364d43',-.16);
      this.line([[px-7,py],[px+7,py]],'#a4ae91',1);
    }
    // Front bumper, headlamps and mirror.
    this.poly([this.p(x2+3,d1+6,27),this.p(x2+3,d2-6,27),this.p(x2+3,d2-6,34),this.p(x2+3,d1+6,34)],'#e9dfbc');
    for(const d of [d1+15,d2-21]) {
      const [px,py]=this.p(x2+5,d,46); this.ellipse(px,py,4,6,'#fff0b3',.25);
    }
    this.line([this.p(x2,d1+2,115),this.p(x2+17,d1+2,112),this.p(x2+18,d1+2,96)],'#496457',3);
    const mirror=this.p(x2+18,d1+2,99); this.ellipse(...mirror,4,9,'#38564a');
    c.restore();
  }

  stopSign() {
    const [px,py]=this.p(685,-60), c=this.ctx;
    this.poly([[px-7,py],[px+8,py],[px+44,py+18],[px+23,py+24]],'#58715b20');
    this.line([[px,py],[px,py-129]],'#416455',5);
    this.ellipse(px,py,9,3,'#7d8b72');
    c.save(); c.translate(px,py-137); c.rotate(-.08);
    c.fillStyle='#365f4d'; c.beginPath(); c.roundRect(-24,-24,48,61,8); c.fill();
    c.strokeStyle='#e6d8a7'; c.lineWidth=2; c.stroke();
    c.fillStyle='#f2e5b9'; c.font='bold 23px system-ui'; c.textAlign='center'; c.fillText('21',0,3);
    c.fillStyle='#aec4a7'; c.font='7px "Microsoft YaHei", sans-serif'; c.fillText('幸福里',0,22);
    c.restore();
  }

  runner(state, now) {
    const c=this.ctx;
    const progress=Math.min(1,Math.max(0,Number.isFinite(state.progress)?state.progress:1-state.distance/8));
    const wonAge=state.phase==='won'?Math.max(0,(now-this.phaseAt)/1000):0;
    const boarding=Math.min(1,wonAge*1.6);
    if(boarding>=1) return;
    const x=106+progress*491;
    const stepAge=Math.max(0,now-(state.stepAt||0));
    const running=state.phase==='playing';
    const stumble=running&&state.stumbleUntil>now;
    const bounce=running&&!stumble?Math.max(0,Math.sin(Math.min(stepAge/230,1)*Math.PI))*6:0;
    const stride=running?Math.sin(now/95)*(stumble?.13:1):Math.sin(now/800)*.06;
    const [px,py]=this.p(x,66+boarding*58);
    this.ellipse(px+4,py+1,26*(1-boarding*.5),8,'#3f5a4030',-.16);
    if(running&&!stumble) {
      for(let i=0;i<3;i++) {
        const age=(now/470+i*.31)%1;
        this.ellipse(px-20-age*29,py+3+Math.sin(i)*4,2+age*3,1.4+age,'#ebe1ba'+Math.round((1-age)*100).toString(16).padStart(2,'0'));
      }
    }
    c.save(); c.translate(px,py-bounce-boarding*20); c.scale(1-boarding*.25,1-boarding*.25);
    c.globalAlpha=1-boarding;
    if(stumble) c.rotate(.32);
    else if(running) c.rotate(.08);
    // The legs visibly alternate with each step.
    const front=state.lastFoot==='right'?-1:1;
    const reach=stride*14*front;
    this.line([[-3,-33],[-9-reach*.6,-18],[-9-reach, -5]],'#2f5148',12);
    this.line([[8,-32],[7+reach*.65,-19],[10+reach, -4]],'#42675c',12);
    this.line([[-11-reach,-3],[-2-reach,-3]],'#f4ecd1',7);
    this.line([[8+reach,-2],[20+reach,-2]],'#f7f0d7',8);
    this.line([[7+reach,1],[22+reach,1]],'#789486',2);
    // Far arm, torso and chunky backpack.
    this.line([[7,-60],[22+reach*.4,-48],[26+reach*.5,-38]],'#b5603d',10);
    this.circle(26+reach*.5,-37,5,'#d9a97b');
    c.fillStyle='#db784a'; c.beginPath(); c.roundRect(-10,-64,31,36,10); c.fill();
    this.poly([[4,-63],[19,-59],[19,-34],[7,-31]],'#ed8c55');
    this.line([[6,-60],[9,-34]],'#f5b078',2);
    c.fillStyle='#335c4b'; c.beginPath(); c.roundRect(-25,-65,21,31,8); c.fill();
    c.fillStyle='#527b62'; c.beginPath(); c.roundRect(-24,-61,15,22,5); c.fill();
    this.line([[-11,-63],[-4,-58],[-3,-35]],'#acc094',3);
    this.line([[-22,-44],[-11,-44]],'#244e40',2);
    this.circle(-19,-56,2,'#e9c765');
    this.line([[-2,-57],[-9-reach*.4,-45],[-3-reach*.55,-36]],'#ef8d56',11);
    this.circle(-3-reach*.55,-34,5,'#e1b386');
    this.circle(6,-72,7,'#c4936d');
    this.ellipse(6,-85,18,20,'#e1b78a');
    this.ellipse(3,-95,20,12,'#4e493a',-.1);
    this.poly([[-16,-94],[-14,-81],[-7,-82],[-7,-92],[17,-94],[22,-88],[23,-98],[9,-107],[-8,-105]],'#4e493a');
    this.circle(-9,-84,5,'#dbac80');
    this.circle(19,-86,1.7,'#3b4436');
    this.ellipse(20,-78,3,1.6,'#c57e5d',-.2);
    this.line([[17,-73],[21,-74]],'#9c6b4e',1.5);
    c.restore();
    if(stumble) {
      for(let i=0;i<3;i++) {
        const angle=now/250+i*Math.PI*2/3;
        this.star(px+Math.cos(angle)*25,py-108+Math.sin(angle)*7,5,'#f8d773');
      }
    }
  }

  star(x,y,r,color) {
    const points=[];
    for(let i=0;i<10;i++) { const a=i*Math.PI/5-Math.PI/2, rr=i%2?r*.45:r; points.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]); }
    this.poly(points,color);
  }

  bubble(text,x,y,accent=false) {
    const c=this.ctx;
    c.save(); c.font='700 16px "Microsoft YaHei", system-ui, sans-serif';
    const width=Math.max(108,c.measureText(text).width+32);
    c.shadowColor='#425a4220'; c.shadowBlur=16; c.shadowOffsetY=5;
    c.fillStyle=accent?'#345d4a':'#fff8de';
    c.beginPath(); c.roundRect(x-width/2,y-37,width,42,12); c.fill(); c.shadowColor='transparent';
    this.poly([[x-8,y+2],[x+3,y+14],[x+13,y+2]],accent?'#345d4a':'#fff8de');
    c.fillStyle=accent?'#fff1bc':'#41604d'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(text,x,y-16);
    c.restore();
  }

  render(state, now=performance.now()) {
    // Use the engine's frozen clock so scenery, runner and effects pause together.
    if (state.paused && Number.isFinite(state.pausedAt)) now = state.pausedAt;
    this.resize();
    if(this.phase!==state.phase) { this.phase=state.phase; this.phaseAt=now; }
    const c=this.ctx;
    c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,this.canvas.width,this.canvas.height);
    c.fillStyle='#e2ddc6'; c.fillRect(0,0,this.canvas.width,this.canvas.height);
    c.setTransform(this.scale,0,0,this.scale,this.offsetX,this.offsetY);
    this.background(now,state.phase);
    this.bus(state,now);
    this.runner(state,now);
    this.stopSign();
    const progress=Math.min(1,Math.max(0,Number.isFinite(state.progress)?state.progress:1-state.distance/8));
    if(state.phase==='ready') this.bubble('师傅，等等我！',217,308);
    else if(state.phase==='won') {
      this.bubble('上车啦，下一站见！',665,202,true);
      for(let i=0;i<15;i++) {
        const age=(now-this.phaseAt)/1000;
        if(age>3) break;
        const x=445+Math.sin(i*2.4)*175*age, y=215-110*age+80*age*age+i*5;
        c.save(); c.globalAlpha=Math.max(0,1-age/3); this.star(x,y,3+i%3,['#e4b550','#eb8d5b','#719b7c'][i%3]); c.restore();
      }
    } else if(state.phase==='lost') this.bubble('下一班，一定赶上。',350,265);
    else if(state.stumbleUntil>now) this.bubble('哎呀！要左右交替',245+progress*360,245);
    else if(progress>.72) this.bubble('这边还有位！',650,191);
    else if(now-this.phaseAt<2100) this.bubble('还有人——',240+progress*360,270);
    // Small road-edge flowers ground the scene without competing with controls.
    for(let i=0;i<6;i++) {
      const p=this.p(33+i*13,-112,0);
      this.line([p,[p[0]-2,p[1]-8-i%2*4]],'#81986b',2);
      this.circle(p[0]-2,p[1]-8-i%2*4,2.6,i%2?'#e9b866':'#faf1ce');
    }
  }
}
