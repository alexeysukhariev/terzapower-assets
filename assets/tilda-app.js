
(function(){
  var hdr=document.getElementById('hdr');
  addEventListener('scroll',function(){hdr.classList.toggle('scr',scrollY>10)},{passive:true});

  // modal
  var modal=document.getElementById('modal'),form=document.getElementById('leadForm'),success=document.getElementById('success');
  // ---- 3D product box in the modal header (lazy Three.js) ----
  var box3d=null, box3dLoading=false;
  function ensureBox3d(){
    if(box3d||box3dLoading)return;
    box3dLoading=true;
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/vendor/three.min.js';
    s.onload=function(){ try{ box3d=buildBox3d(document.getElementById('box3d')); if(modal.classList.contains('show'))box3d.play();
      // pre-build the delivery scene now (off the transition) so submit doesn't freeze
      if(!deliv)deliv=buildDelivery3d(document.getElementById('deliv3d')); }catch(e){} };
    s.onerror=function(){box3dLoading=false;};
    document.head.appendChild(s);
  }
  function buildBox3d(el){
    var W=el.clientWidth||120, H=el.clientHeight||132;
    var renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.setSize(W,H); renderer.outputEncoding=THREE.sRGBEncoding;
    renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.98;
    el.appendChild(renderer.domElement);
    var scene=new THREE.Scene();
    var cam=new THREE.PerspectiveCamera(28,W/H,0.1,100); cam.position.set(0,0.25,6.5);
    scene.add(new THREE.AmbientLight(0xffffff,0.5));
    var key=new THREE.DirectionalLight(0xffffff,0.8); key.position.set(3,4,5); scene.add(key);
    var rim=new THREE.DirectionalLight(0xbdeee4,0.28); rim.position.set(-4,1.5,-3); scene.add(rim);
    var tl=new THREE.TextureLoader();
    function tex(src){var t=tl.load(src); t.encoding=THREE.sRGBEncoding; t.anisotropy=8; return t;}
    function mapMat(src){return new THREE.MeshStandardMaterial({map:tex(src),roughness:0.75,metalness:0.02});}
    var teal=new THREE.MeshStandardMaterial({color:0x0e8f80,roughness:0.5,metalness:0.05});
    var white=new THREE.MeshStandardMaterial({color:0xeef4f2,roughness:0.7});
    var L=2.9,Hh=0.98,D=0.82;
    var geo=new THREE.BoxGeometry(L,Hh,D,1,1,1);
    // BoxGeometry face order: +x,-x,+y,-y,+z,-z
    var box=new THREE.Mesh(geo,[teal,teal,mapMat('https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/box-top.jpg'),white,mapMat('https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/box-front.jpg'),mapMat('https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/box-back.jpg')]);
    box.rotation.set(-0.3,-0.6,0.05);
    scene.add(box);
    var raf=null,last=0;
    function frame(t){raf=requestAnimationFrame(frame);var dt=last?Math.min(0.05,(t-last)/1000):0;last=t;box.rotation.y+=dt*0.45;renderer.render(scene,cam);}
    function play(){if(!raf){last=0;raf=requestAnimationFrame(frame);}}
    function pause(){if(raf){cancelAnimationFrame(raf);raf=null;}}
    function resize(){var w=el.clientWidth,h=el.clientHeight;if(w&&h){renderer.setSize(w,h);cam.aspect=w/h;
      cam.position.z=Math.max(6.5,1.62/(Math.tan(cam.fov*Math.PI/360)*cam.aspect)); // pull back on narrow (mobile) so the box never clips
      cam.updateProjectionMatrix();}}
    window.addEventListener('resize',resize,{passive:true});
    resize();
    return {play:play,pause:pause,box:box,scene:scene,renderer:renderer,cam:cam};
  }

  // ---- delivery animation: product box falls into a Nova Poshta box that closes ----
  var deliv=null;
  function npTexture(){
    var c=document.createElement('canvas');c.width=896;c.height=384;var x=c.getContext('2d');
    var t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;
    function draw(logo){
      x.fillStyle='#c99a63';x.fillRect(0,0,896,384);               // kraft
      x.strokeStyle='rgba(120,84,42,.10)';x.lineWidth=2;
      for(var i=-10;i<384;i+=14){x.beginPath();x.moveTo(0,i);x.lineTo(896,i+8);x.stroke();}
      var by=132,bh=156;                                           // red branded band ("tape")
      x.fillStyle='#DA291C';x.fillRect(0,by,896,bh);
      x.fillStyle='rgba(0,0,0,.06)';x.fillRect(0,by,896,4);x.fillRect(0,by+bh-4,896,4);
      if(logo){                                                    // official white Nova Poshta logo on the band
        var availH=bh-40,availW=896-120,s=Math.min(availH/logo.height,availW/logo.width);
        var w=logo.width*s,h=logo.height*s;x.drawImage(logo,(896-w)/2,by+(bh-h)/2,w,h);
      }else{
        x.fillStyle='#fff';x.textBaseline='middle';x.textAlign='center';x.font='800 66px Manrope, Arial, sans-serif';
        x.fillText('НОВА ПОШТА',448,by+bh/2);x.textAlign='left';
      }
      t.needsUpdate=true;
    }
    draw(null);
    var img=new Image();img.crossOrigin='anonymous';img.onload=function(){draw(img);};img.onerror=function(){};img.src='https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/np-logo-white.png';
    return t;
  }
  function buildDelivery3d(el){
    var W=el.clientWidth||430,H=el.clientHeight||240;
    var renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setSize(W,H);
    renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.98;
    el.appendChild(renderer.domElement);
    var scene=new THREE.Scene();
    var cam=new THREE.PerspectiveCamera(40,W/H,0.1,100);cam.position.set(0,2.6,5.6);cam.lookAt(0,0,0); // see the product hover/spin above, then drop into the box
    scene.add(new THREE.AmbientLight(0xffffff,0.55));
    var key=new THREE.DirectionalLight(0xffffff,0.85);key.position.set(2.5,5,3.5);scene.add(key);
    var rim=new THREE.DirectionalLight(0xbdeee4,0.3);rim.position.set(-3,2,-2);scene.add(rim);
    var tl=new THREE.TextureLoader();
    function tex(s){var t=tl.load(s);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;return t;}
    function mm(s){return new THREE.MeshStandardMaterial({map:tex(s),roughness:0.75});}
    var pteal=new THREE.MeshStandardMaterial({color:0x0e8f80,roughness:0.5});
    var pwhite=new THREE.MeshStandardMaterial({color:0xeef4f2,roughness:0.7});
    var stage=new THREE.Group();scene.add(stage);   // parent for the "shipped away" drive-off
    var prod=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,0.44),[pteal,pteal,mm('https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/box-top.jpg'),pwhite,mm('https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/box-front.jpg'),mm('https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/tex/box-back.jpg')]);
    prod.position.set(0,2.4,0);stage.add(prod);
    var kraft=new THREE.MeshStandardMaterial({color:0xc99a63,roughness:0.95});   // kraft cardboard
    var kraftIn=new THREE.MeshStandardMaterial({color:0x9c7443,roughness:1.0});
    var Wb=2.3,Db=1.6,Hb=1.12,tk=0.07,topY=Hb/2;
    var boxG=new THREE.Group();stage.add(boxG);
    var bottom=new THREE.Mesh(new THREE.BoxGeometry(Wb,tk,Db),kraft);bottom.position.y=-topY;boxG.add(bottom);
    function wall(w,h,d,px,py,pz,mat){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(px,py,pz);boxG.add(m);}
    wall(Wb,Hb,tk,0,0,Db/2,new THREE.MeshStandardMaterial({map:npTexture(),roughness:0.9})); // front (NP)
    wall(Wb,Hb,tk,0,0,-Db/2,kraft);
    wall(tk,Hb,Db,-Wb/2,0,0,kraft);
    wall(tk,Hb,Db,Wb/2,0,0,kraft);
    // TWO flaps: left + right, hinged on the side top edges, meet in the middle
    var flapMat=[kraft,kraft,kraft,kraftIn,kraft,kraft];
    var fLeft=new THREE.Group();fLeft.position.set(-Wb/2,topY,0);boxG.add(fLeft);
    (function(){var m=new THREE.Mesh(new THREE.BoxGeometry(Wb/2,tk,Db),flapMat);m.position.x=Wb/4;fLeft.add(m);})();
    var fRight=new THREE.Group();fRight.position.set(Wb/2,topY+tk*0.7,0);boxG.add(fRight); // sits slightly over left when closed
    (function(){var m=new THREE.Mesh(new THREE.BoxGeometry(Wb/2,tk,Db),flapMat);m.position.x=-Wb/4;fRight.add(m);})();
    var OP=1.7; // open angle (flaps splayed out)
    fLeft.rotation.z=OP; fRight.rotation.z=-OP;
    function cl(v){return v<0?0:v>1?1:v;}
    function eOut(t){return 1-Math.pow(1-t,3);}
    function eIn(t){return t*t*t;}
    function eInOut(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
    function eBack(t){var c1=1.25,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);}
    var burstCb=null,burstFired=false;
    function apply(e){
      var a=cl(e/0.68);                 // A: anticipation (grow + a full spin)
      var b=cl((e-0.68)/0.32);          // B: drop
      // scale: clearly bigger during anticipation, shrinks to fit as it drops in
      var sc=1+0.4*eOut(a); if(b>0)sc=1.4+(0.92-1.4)*eIn(b);
      prod.scale.setScalar(sc);
      // spin: ~1.3 full turns during anticipation, a touch more on the way down, then holds
      prod.rotation.y=0.4+8.2*eInOut(a)+2.0*eOut(cl((e-0.68)/0.5));
      prod.rotation.x=0.12*(1-cl(e/0.9));
      var py=(b<=0)?(1.2+0.28*eOut(a)):(1.48+(-0.28-1.48)*eIn(b));
      // C: soft impact — gentle, quick-decaying settle (not a harsh slam)
      var sh=(e>0.99&&e<1.28)?Math.sin((e-0.99)*34)*0.028*Math.max(0,1-(e-0.99)/0.29):0;
      boxG.position.y=sh; boxG.rotation.z=sh*0.07;
      prod.position.y=py+(e>0.99?Math.sin((e-0.99)*30)*0.022*Math.max(0,1-(e-0.99)/0.26):0);
      // D: flaps close left+right with a soft overshoot
      var cP=eBack(cl((e-1.04)/0.46));
      fLeft.rotation.z=OP*(1-cP); fRight.rotation.z=-OP*(1-cP);
      if(!burstFired&&e>1.22){burstFired=true;if(burstCb)burstCb();}
      // E: shipped — the whole box drives off to the right and away (accelerating)
      var dd=cl((e-1.6)/0.55);
      stage.position.x=10.5*eIn(dd);
      stage.position.y=-0.7*eIn(dd);
      stage.rotation.z=-0.16*dd;
    }
    var raf=null,t0=null,done=false,cb=null;
    function frame(t){raf=requestAnimationFrame(frame);if(t0==null)t0=t;var e=(t-t0)/1000;apply(e);renderer.render(scene,cam);if(e>2.25&&!done){done=true;if(cb)cb();}}
    function play(o){resize();t0=null;done=false;burstFired=false;cb=o&&o.onDone;burstCb=o&&o.onBurst;stage.position.set(0,0,0);stage.rotation.set(0,0,0);apply(0);if(!raf)raf=requestAnimationFrame(frame);}
    function stop(){if(raf){cancelAnimationFrame(raf);raf=null;}}
    function resize(){var w=el.clientWidth,h=el.clientHeight;if(w&&h){renderer.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();}}
    window.addEventListener('resize',resize,{passive:true});
    function renderAt(sec){apply(sec);renderer.render(scene,cam);}
    return {play:play,stop:stop,renderAt:renderAt};
  }
  function burstConfetti(host,originEl){
    var cv=document.createElement('canvas');
    var hr=host.getBoundingClientRect();
    var dpr=Math.min(2,window.devicePixelRatio||1);
    cv.width=hr.width*dpr;cv.height=hr.height*dpr;
    cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6';
    host.appendChild(cv);
    var g=cv.getContext('2d');g.scale(dpr,dpr);
    var or=originEl.getBoundingClientRect();
    var cx=(or.left+or.width/2)-hr.left, cy=(or.top+or.height*0.45)-hr.top;
    var cols=['#0e8f80','#15AC9A','#8DC63F','#DA291C','#ffffff','#f4c542'];
    var P=[];for(var i=0;i<150;i++){var an=Math.random()*Math.PI*2,sp=3+Math.random()*8;P.push({x:cx,y:cy,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-5,g:0.22+Math.random()*0.12,rot:Math.random()*6,vr:-0.35+Math.random()*0.7,s:5+Math.random()*6,c:cols[i%cols.length],a:1});}
    var t0=null;
    function fr(t){if(t0==null)t0=t;var e=(t-t0)/1000;g.clearRect(0,0,hr.width,hr.height);var live=false;
      for(var i=0;i < P.length;i++){var p=P[i];p.vy+=p.g;p.vx*=0.99;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.a-=0.011;
        if(p.a>0&&p.y < hr.height+30){live=true;g.save();g.globalAlpha=Math.max(0,p.a);g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.62);g.restore();}}
      if(live&&e<2.4)requestAnimationFrame(fr);else if(cv.parentNode)cv.parentNode.removeChild(cv);
    }
    requestAnimationFrame(fr);
  }
  function runDelivery(){
    if(box3d)box3d.pause();
    var txt=document.querySelector('.success-txt');
    var suc=document.getElementById('success');
    if(txt)setTimeout(function(){txt.classList.add('in');},260);   // text appears early (under the box) so the card isn't empty
    var fired=false; function fire(){ if(fired)return; fired=true; try{burstConfetti(modal,document.getElementById('deliv3d'));}catch(e){} }
    var ended=false; function ended_(){ if(ended)return; ended=true; suc.classList.add('packed'); if(txt)txt.classList.add('in'); }
    if(typeof THREE!=='undefined'){
      if(!deliv)deliv=buildDelivery3d(document.getElementById('deliv3d'));
      deliv.play({onBurst:fire,onDone:ended_});
      setTimeout(fire,1250);    // confetti fallback (RAF may be throttled)
      setTimeout(ended_,2650);  // center-text fallback
    }else{ ended_(); }
  }

  function open(){modal.classList.add('show');document.body.style.overflow='hidden';ensureBox3d();if(box3d)box3d.play();}
  function close(){modal.classList.remove('show');document.body.style.overflow='';if(box3d)box3d.pause();if(deliv)deliv.stop();
    setTimeout(function(){ if(!modal.classList.contains('show')){
      modal.classList.remove('sent');
      form.style.display=''; form.classList.remove('leaving');
      var mt=document.querySelector('.mtop'); if(mt)mt.style.opacity='';
      success.style.display='none'; success.classList.remove('show','packed');
      var tx=document.querySelector('.success-txt'); if(tx)tx.classList.remove('in');
      var hb=document.getElementById('box3d'); if(hb)hb.style.display='';
    } },360);
  }
  document.querySelectorAll('[data-open]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();open();})});
  modal.querySelector('.mclose').addEventListener('click',close);
  modal.addEventListener('click',function(e){if(e.target===modal)close()});
  addEventListener('keydown',function(e){if(e.key==='Escape')close()});

  // FAQ
  document.querySelectorAll('.faq-q').forEach(function(q){
    q.addEventListener('click',function(){
      var it=q.parentElement,a=it.querySelector('.faq-a'),op=it.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(o){o.classList.remove('open');o.querySelector('.faq-a').style.maxHeight=null;});
      if(!op){it.classList.add('open');a.style.maxHeight=a.scrollHeight+'px';}
    });
  });

  // YouTube facade
  document.querySelectorAll('.vid[data-yt]').forEach(function(f){
    function load(){var id=f.getAttribute('data-yt');f.innerHTML='\x3ciframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="TerzaPower" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen>\x3c/iframe>';}
    f.addEventListener('click',load);
    f.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();load();}});
  });

  // lightbox (certificate zoom)
  var lb=document.getElementById('lightbox'),lbimg=document.getElementById('lbimg');
  function lbOpen(src){lbimg.src=src;lb.classList.add('show');document.body.style.overflow='hidden';}
  function lbClose(){lb.classList.remove('show');document.body.style.overflow='';}
  document.querySelectorAll('[data-lightbox]').forEach(function(el){el.addEventListener('click',function(){lbOpen(el.getAttribute('data-lightbox'));});});
  lb.querySelector('.lb-close').addEventListener('click',lbClose);
  lb.addEventListener('click',function(e){if(e.target===lb)lbClose();});
  addEventListener('keydown',function(e){if(e.key==='Escape')lbClose();});

  // before/after slider
  var ba=document.getElementById('ba');
  if(ba){
    var drag=false;
    function set(x){
      var r=ba.getBoundingClientRect();
      var p=Math.max(2,Math.min(98,(x-r.left)/r.width*100));
      ba.style.setProperty('--pos',p+'%');
    }
    ba.addEventListener('pointerdown',function(e){if(ba.classList.contains('photo'))return;drag=true;ba.setPointerCapture(e.pointerId);set(e.clientX);});
    ba.addEventListener('pointermove',function(e){if(drag&&!ba.classList.contains('photo'))set(e.clientX);});
    ba.addEventListener('pointerup',function(){drag=false;});
    ba.addEventListener('pointercancel',function(){drag=false;});
  }

  // before/after case switcher (slider cases + plain photo cases)
  var CASES=[
    {type:'slider',before:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/ba-w-before.jpg',after:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/ba-w-after.jpg',name:'Ірина, 52 роки',ini:'І',quote:'«Пішли набряки та важкість. Вперше за довгий час почуваюся легкою та впевненою в собі.»',result:'−24 кг',weeks:'16 тижнів'},
    {type:'slider',before:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/ba-m-before.jpg',after:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/ba-m-after.jpg',name:'Олександр, 34 роки',ini:'О',quote:'«Пішов живіт, повернувся рельєф. Без виснажливих дієт — лише схема та супровід лікаря.»',result:'−18 кг',weeks:'12 тижнів'},
    {type:'photo',img:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/res-1.jpg'},
    {type:'photo',img:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/res-2.jpg'},
    {type:'photo',img:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/res-3.jpg'},
    {type:'photo',img:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/res-4.jpg'},
    {type:'photo',img:'https://cdn.jsdelivr.net/gh/alexeysukhariev/terzapower-assets@v3/assets/img/res-5.jpg'}
  ];
  var baBefore=document.getElementById('baBefore'),baAfter=document.getElementById('baAfter'),
      effDetail=document.getElementById('effDetail'),effGeneric=document.getElementById('effGeneric');
  function setCase(i){
    var c=CASES[i];if(!c||!ba)return;
    if(c.type==='slider'){
      ba.classList.remove('photo');
      baBefore.style.display='';
      baBefore.src=c.before;baAfter.src=c.after;
      ba.style.setProperty('--pos','50%');
      effDetail.style.display='';effGeneric.style.display='none';
      document.getElementById('effName').textContent=c.name;
      document.getElementById('effInitial').textContent=c.ini;
      document.getElementById('effQuote').textContent=c.quote;
      document.getElementById('effResult').textContent=c.result;
      document.getElementById('effWeeks').textContent=c.weeks;
    }else{
      ba.classList.add('photo');
      baBefore.style.display='none';
      baAfter.src=c.img;
      effDetail.style.display='none';effGeneric.style.display='';
    }
    document.querySelectorAll('.eff-thumb').forEach(function(t,ti){t.classList.toggle('active',ti===i);});
  }
  document.querySelectorAll('.eff-thumb').forEach(function(t){t.addEventListener('click',function(){setCase(+t.getAttribute('data-case'));});});
  setCase(0);   // show the first case (Ірина) on load, in sync with the active thumb

  // phone mask
  var phone=form.elements.phone;
  phone.addEventListener('input',function(){
    var d=phone.value.replace(/\D/g,'');
    if(d.startsWith('380'))d=d.slice(0,12);else if(d.startsWith('0'))d='38'+d.slice(0,10);else d=d.slice(0,12);
    var o='+'+d;
    if(d.length>2)o='+'+d.slice(0,3)+' '+d.slice(3,5)+' '+d.slice(5,8)+' '+d.slice(8,10)+' '+d.slice(10,12);
    phone.value=o.trim();
  });

  // submit
  form.addEventListener('submit',function(e){
    e.preventDefault();var ok=true;
    ['first','last','phone','city','branch'].forEach(function(n){
      var f=form.elements[n],v=f.value.trim(),bad=!v||(n==='phone'&&v.replace(/\D/g,'').length<9);
      f.classList.toggle('err',bad);if(bad)ok=false;
    });
    if(!ok){var fe=form.querySelector('.err');if(fe)fe.focus();return;}
    var data={first:form.elements.first.value.trim(),last:form.elements.last.value.trim(),phone:form.elements.phone.value.trim(),city:form.elements.city.value.trim(),branch:form.elements.branch.value.trim(),website:(form.elements.website&&form.elements.website.value)||'',source:(form.elements.source&&form.elements.source.value)||'',product:'TerzaPower 20mg',ts:new Date().toISOString()};
    // send the lead to the Telegram group via the Vercel proxy (token stays server-side)
    try{fetch('https://terzapower-landing.vercel.app/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),keepalive:true}).catch(function(){});}catch(e){}
    // conversion event -> attributes to whichever Meta Pixel is on THIS page (Lidgen/Arsen)
    try{if(window.fbq)fbq('track','Lead');}catch(e){}
    console.log('LEAD',data);
    // smooth transition: collapse header + fade form out together, then fade success in
    modal.classList.add('sent');
    form.classList.add('leaving');
    setTimeout(function(){
      form.style.display='none';
      success.style.display='block';
      requestAnimationFrame(function(){requestAnimationFrame(function(){success.classList.add('show');});});
      runDelivery();
    },300);
  });

  // burger -> open modal (simple mobile action)
  var b=document.querySelector('.burger');if(b)b.addEventListener('click',open);

  // fit the decorative wordmarks to the container width (font-agnostic:
  // "TerzaPower" has a different advance width in every face)
  function fitWordmarks(){
    document.querySelectorAll('.watermark,.final .wm').forEach(function(el){
      if(getComputedStyle(el).display==='none')return;
      var wrap=el.parentElement,cs=getComputedStyle(wrap);
      var cw=wrap.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
      if(cw<=0)return;
      el.style.fontSize='100px';
      var r=document.createRange();r.selectNodeContents(el);
      var w=r.getBoundingClientRect().width;
      if(!w)return;
      el.style.fontSize=(100*cw/w).toFixed(2)+'px';
    });
  }
  fitWordmarks();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitWordmarks);
  addEventListener('resize',fitWordmarks,{passive:true});

  // ---- reveal (appears & disappears) + auto-stagger of grid/list items ----
  (function(){
    var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
    // move reveal from group wrappers onto their children so items cascade in
    ['.tiles','.rstats','.reel-list','.proto','.foot-top','.price-list','.doc-list'].forEach(function(s){
      document.querySelectorAll(s).forEach(function(el){el.classList.remove('rv');});
    });
    [['.tiles>.tile',80],['.rstats>.rstat',70],['.reel-list>li',55],['.proto>.pstep',70],
     ['.foot-top>*',70],['.price-list>li',45],['.doc-list>li',55]].forEach(function(g){
      document.querySelectorAll(g[0]).forEach(function(el,i){
        el.classList.add('rv');
        el.style.setProperty('--d',(Math.min(i*g[1],440)/1000)+'s');
      });
    });
    var items=document.querySelectorAll('.rv');
    if(reduce){items.forEach(function(el){el.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){en.target.classList.toggle('in',en.isIntersecting);});
    },{threshold:.1,rootMargin:'0px 0px -7% 0px'});
    items.forEach(function(el){io.observe(el);});
  })();

  // ---- subtle 3D tilt on photos (safe for faces; depth-warp removed) ----
  (function(){
    if(matchMedia('(prefers-reduced-motion:reduce)').matches||matchMedia('(hover:none)').matches)return;
    [].slice.call(document.querySelectorAll('[data-parallax]')).forEach(function(n){
      var img=n.querySelector('img');if(!img)return;
      n.style.transition='transform .5s var(--ease)';
      img.style.transform='scale(1.06)';img.style.transition='transform .5s var(--ease)';img.style.willChange='transform';
      var raf=null,tx=0,ty=0,cx=0,cy=0;
      function step(){cx+=(tx-cx)*0.12;cy+=(ty-cy)*0.12;
        n.style.transform='perspective(1000px) rotateX('+cx.toFixed(2)+'deg) rotateY('+cy.toFixed(2)+'deg)';
        if(Math.abs(tx-cx)>0.04||Math.abs(ty-cy)>0.04){raf=requestAnimationFrame(step);}else{raf=null;}}
      function kick(){if(!raf)raf=requestAnimationFrame(step);}
      n.addEventListener('pointermove',function(e){var r=n.getBoundingClientRect();tx=((e.clientY-r.top)/r.height-0.5)*-5;ty=((e.clientX-r.left)/r.width-0.5)*5;kick();},{passive:true});
      n.addEventListener('pointerleave',function(){tx=0;ty=0;kick();},{passive:true});
    });
  })();
  // ---- legacy depth-map parallax (disabled: warped faces) ----
  (function(){
    if(true)return;
    if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    var nodes=[].slice.call(document.querySelectorAll('[data-parallax]'));
    if(!nodes.length)return;
    var test=document.createElement('canvas');
    var glok=false;try{glok=!!(window.WebGLRenderingContext&&(test.getContext('webgl')||test.getContext('experimental-webgl')));}catch(e){}
    if(!glok)return;

    var VS='attribute vec2 p;varying vec2 vUv;void main(){vUv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}';
    var FS='precision highp float;varying vec2 vUv;uniform sampler2D uImg,uDepth;uniform vec2 uCover,uShift;uniform float uInvert,uFocus,uOver,uBiasY;'
      +'void main(){vec2 uv=(vUv-0.5)*(uCover/uOver)+vec2(0.5,0.5+uBiasY);'
      +'float d=texture2D(uDepth,uv).r;d=mix(d,1.0-d,uInvert);float rel=d-uFocus;'
      +'vec2 suv=uv+uShift*rel;gl_FragColor=texture2D(uImg,suv);}';

    function tex(gl,src){var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;}

    var mx=0,my=0;
    addEventListener('pointermove',function(e){mx=(e.clientX/innerWidth)*2-1;my=(e.clientY/innerHeight)*2-1;},{passive:true});

    var insts=[];
    var io=new IntersectionObserver(function(es){es.forEach(function(en){
      for(var k=0;k < insts.length;k++)if(insts[k].node===en.target)insts[k].active=en.isIntersecting;});},{rootMargin:'12% 0px 12% 0px'});

    nodes.forEach(function(node){
      var img=node.querySelector('img');if(!img)return;
      var dsrc=node.getAttribute('data-depth')||(img.getAttribute('src')||'').replace(/\.(jpe?g|png|webp)$/i,'-depth.png');
      var amount=parseFloat(node.getAttribute('data-px-amount'))||0.02;
      var biasY=parseFloat(node.getAttribute('data-px-biasy'))||0;
      var invert=node.getAttribute('data-px-invert')==='1'?1:0;
      var depth=new Image();depth.decoding='async';
      var got=0;
      function build(){
        try{
          var cv=document.createElement('canvas');cv.className='px';node.appendChild(cv);
          var gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false});if(!gl){cv.remove();return;}
          function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
          var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
          gl.linkProgram(pr);gl.useProgram(pr);
          var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
          gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
          var lp=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
          gl.activeTexture(gl.TEXTURE0);tex(gl,img);gl.uniform1i(gl.getUniformLocation(pr,'uImg'),0);
          gl.activeTexture(gl.TEXTURE1);tex(gl,depth);gl.uniform1i(gl.getUniformLocation(pr,'uDepth'),1);
          var uCover=gl.getUniformLocation(pr,'uCover'),uShift=gl.getUniformLocation(pr,'uShift');
          gl.uniform1f(gl.getUniformLocation(pr,'uInvert'),invert);
          gl.uniform1f(gl.getUniformLocation(pr,'uFocus'),0.2);
          gl.uniform1f(gl.getUniformLocation(pr,'uOver'),1.14);
          gl.uniform1f(gl.getUniformLocation(pr,'uBiasY'),biasY);
          var inst={node:node,gl:gl,cv:cv,uCover:uCover,uShift:uShift,iw:img.naturalWidth,ih:img.naturalHeight,
            amount:amount,cx:0,cy:0,w:0,h:0,active:true};
          inst.resize=function(){
            var r=node.getBoundingClientRect();if(!r.width)return;
            var dpr=Math.min(2,window.devicePixelRatio||1);
            var w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
            if(w===inst.w&&h===inst.h)return;
            inst.w=w;inst.h=h;cv.width=w;cv.height=h;gl.viewport(0,0,w,h);
            var Ca=r.width/r.height,Ia=inst.iw/inst.ih;
            var cx=(Ca>Ia)?1:Ca/Ia, cy=(Ca>Ia)?Ia/Ca:1;
            gl.useProgram(pr);gl.uniform2f(uCover,cx,cy);
          };
          inst.resize();
          insts.push(inst);io.observe(node);node.classList.add('px-on');
        }catch(e){}
      }
      function chk(){if(++got>=2)build();}
      if(img.complete&&img.naturalWidth)chk();else{img.addEventListener('load',chk);img.addEventListener('error',function(){});}
      depth.addEventListener('load',chk);
      depth.addEventListener('error',function(){});
      depth.src=dsrc;
    });

    addEventListener('resize',function(){for(var k=0;k < insts.length;k++)insts[k].resize();},{passive:true});

    var touch=matchMedia('(hover:none)').matches;
    function loop(){
      var vh=innerHeight;
      for(var k=0;k < insts.length;k++){var i=insts[k];if(!i.active)continue;
        var r=i.node.getBoundingClientRect();
        var sy=((r.top+r.height/2)-vh/2)/vh;                 // -~0.5..0.5 across viewport
        var tx=touch?0:(-mx*i.amount);
        var ty=(touch?0:(-my*i.amount*0.7)) + sy*i.amount*0.6;
        i.cx+=(tx-i.cx)*0.07;i.cy+=(ty-i.cy)*0.07;
        i.gl.useProgram(i.gl.getParameter(i.gl.CURRENT_PROGRAM));
        i.gl.uniform2f(i.uShift,i.cx,i.cy);
        i.gl.drawArrays(i.gl.TRIANGLE_STRIP,0,4);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
})();
