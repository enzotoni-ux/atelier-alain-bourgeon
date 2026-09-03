(function(){
  var canvas = document.getElementById('sketchCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');

  function mulberry32(a){
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20260710);
  function rr(min, max){ return min + rand() * (max - min); }

  function sketchLine(x1,y1,x2,y2,opts){
    opts = opts || {};
    var passes = opts.passes || 2;
    var jitter = opts.jitter || 1.6;
    var width = opts.width || 1.4;
    var alpha = opts.alpha || 0.55;
    var segs = opts.segs || Math.max(6, Math.floor(Math.hypot(x2-x1,y2-y1)/14));
    var dx = x2-x1, dy = y2-y1;
    var nx = -dy/Math.hypot(dx,dy), ny = dx/Math.hypot(dx,dy);

    for(var p=0;p<passes;p++){
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(30,28,24,'+alpha+')';
      ctx.lineWidth = width * rr(0.8,1.2);
      ctx.lineCap = 'round';
      var bow = rr(-jitter,jitter);
      for(var i=0;i<=segs;i++){
        var t = i/segs;
        var wob = Math.sin(t*Math.PI)*bow + rr(-jitter,jitter)*0.5;
        var px = x1 + dx*t + nx*wob;
        var py = y1 + dy*t + ny*wob;
        if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
  }

  function sketchPolyline(pts,opts){
    for(var i=0;i<pts.length-1;i++){
      sketchLine(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],opts);
    }
  }
  function sketchPolygon(pts,opts){
    sketchPolyline(pts.concat([pts[0]]),opts);
  }

  function hatch(pts, opts){
    opts = opts || {};
    var spacing = opts.spacing || 9;
    var angle = (opts.angle || 45) * Math.PI/180;
    var alpha = opts.alpha || 0.28;
    var width = opts.width || 1;
    var jitter = opts.jitter || 1.2;

    var xs = pts.map(function(p){return p[0];});
    var ys = pts.map(function(p){return p[1];});
    var minX=Math.min.apply(null,xs), maxX=Math.max.apply(null,xs);
    var minY=Math.min.apply(null,ys), maxY=Math.max.apply(null,ys);

    ctx.save();
    ctx.beginPath();
    pts.forEach(function(p,i){ i===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1]); });
    ctx.closePath();
    ctx.clip();

    var diag = Math.hypot(maxX-minX, maxY-minY) + spacing*2;
    var cx = (minX+maxX)/2, cy=(minY+maxY)/2;
    var dirx = Math.cos(angle), diry = Math.sin(angle);
    var perpx = -diry, perpy = dirx;

    for(var d=-diag/2; d<diag/2; d+=spacing){
      var ox = cx + perpx*d, oy = cy + perpy*d;
      var x1 = ox - dirx*diag/2, y1 = oy - diry*diag/2;
      var x2 = ox + dirx*diag/2, y2 = oy + diry*diag/2;
      sketchLine(x1,y1,x2,y2,{passes:1, jitter:jitter, width:width, alpha:alpha*rr(0.7,1.15), segs:14});
    }
    ctx.restore();
  }

  function scribbleBlob(cx,cy,r,density,alpha){
    for(var i=0;i<density;i++){
      var a0 = rr(0,Math.PI*2);
      var rad = r*rr(0.35,1);
      var x = cx + Math.cos(a0)*rad*rr(0.6,1);
      var y = cy + Math.sin(a0)*rad*rr(0.5,0.9);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(30,28,24,'+(alpha*rr(0.6,1))+')';
      ctx.lineWidth = rr(1,1.8);
      var loops = rr(1,2);
      var steps=10;
      var rr2 = rr(6,16);
      ctx.moveTo(x,y);
      for(var s=1;s<=steps;s++){
        var t = s/steps*Math.PI*2*loops;
        ctx.lineTo(x + Math.cos(t)*rr2*(s/steps), y - s*1.4 + Math.sin(t)*rr2*0.6*(s/steps));
      }
      ctx.stroke();
    }
  }

  var groundY = 900;
  var wallL = 430, wallR = 980, wallTop = 470, wallBot = groundY;
  var eaveL = 380, eaveR = 1030, eaveY = 470;
  var ridgeX = 705, ridgeY = 190;
  var chimX1 = 520, chimX2 = 600, chimTop = 120, chimBase = 300;

  ctx.save();
  sketchLine(120, groundY, 1300, groundY, {passes:1, jitter:2, width:1, alpha:0.18, segs:20});
  sketchLine(ridgeX, 60, ridgeX, groundY, {passes:1, jitter:1, width:0.8, alpha:0.14, segs:20});
  sketchLine(wallL, 60, wallL, groundY, {passes:1, jitter:1, width:0.8, alpha:0.1, segs:20});
  sketchLine(wallR, 60, wallR, groundY, {passes:1, jitter:1, width:0.8, alpha:0.1, segs:20});
  ctx.restore();

  var roofPolyL = [[eaveL,eaveY],[ridgeX,ridgeY],[705,wallTop-2],[wallL-4,wallTop+6]];
  var roofPolyR = [[ridgeX,ridgeY],[eaveR,eaveY],[wallR+4,wallTop+6],[705,wallTop-2]];

  hatch(roofPolyL, {angle:24, spacing:7, alpha:0.30, width:1.1, jitter:1.4});
  hatch(roofPolyL, {angle:70, spacing:16, alpha:0.14, width:0.9, jitter:1.2});
  hatch(roofPolyR, {angle:-24, spacing:7, alpha:0.34, width:1.1, jitter:1.4});
  hatch(roofPolyR, {angle:-70, spacing:16, alpha:0.16, width:0.9, jitter:1.2});

  for(var i=1;i<12;i++){
    var t = i/12;
    var yA = eaveY + (ridgeY-eaveY)*t;
    var xL = eaveL + (ridgeX-eaveL)*t;
    var xR2 = eaveR + (ridgeX-eaveR)*t;
    sketchLine(xL, yA, ridgeX, yA - (yA-ridgeY)*0.02, {passes:1, jitter:2.4, width:1.1, alpha:0.42, segs:22});
    sketchLine(ridgeX, yA - (yA-ridgeY)*0.02, xR2, yA, {passes:1, jitter:2.4, width:1.1, alpha:0.42, segs:22});
  }

  sketchPolygon(roofPolyL, {passes:2, jitter:2, width:2.2, alpha:0.75});
  sketchPolygon(roofPolyR, {passes:2, jitter:2, width:2.2, alpha:0.75});
  sketchLine(eaveL-14, eaveY+4, ridgeX, ridgeY-4, {passes:2, jitter:1.6, width:2.6, alpha:0.85});
  sketchLine(ridgeX, ridgeY-4, eaveR+14, eaveY+4, {passes:2, jitter:1.6, width:2.6, alpha:0.85});

  var chim = [[chimX1,chimBase],[chimX1,chimTop],[chimX2,chimTop],[chimX2,chimBase]];
  hatch(chim, {angle:35, spacing:6, alpha:0.3, width:1});
  sketchPolyline([[chimX1,chimBase],[chimX1,chimTop],[chimX2-6,chimTop-6],[chimX2+6,chimTop-2],[chimX2,chimBase]], {passes:2, jitter:1.6, width:2, alpha:0.8});
  sketchLine(chimX1-4, chimTop+18, chimX2+4, chimTop+16, {passes:1, jitter:1.5, width:1.4, alpha:0.55});

  var wallPts = [[wallL,wallTop],[wallR,wallTop],[wallR,wallBot],[wallL,wallBot]];
  hatch(wallPts, {angle:60, spacing:8, alpha:0.16, width:1});

  var rows = 9;
  for(var row=0; row<rows; row++){
    var y0 = wallTop + (wallBot-wallTop)*row/rows;
    var y1r = wallTop + (wallBot-wallTop)*(row+1)/rows;
    var x = wallL + rr(-4,4);
    var offset = (row % 2 === 0) ? 0 : 26;
    x += offset;
    while(x < wallR-6){
      var bw = rr(30,58);
      var bx2 = Math.min(x+bw, wallR);
      sketchPolygon([[x+2,y0+2],[bx2-2,y0+rr(-2,2)],[bx2-2,y1r-2],[x+2,y1r+rr(-2,2)]], {passes:1, jitter:1.6, width:1.2, alpha:0.55, segs:6});
      x = bx2 + rr(2,5);
    }
  }

  var doorX1=630, doorX2=760, doorTop=650, doorBot=wallBot;
  sketchPolyline([[doorX1,doorBot],[doorX1,doorTop+20],[(doorX1+doorX2)/2,doorTop],[doorX2,doorTop+20],[doorX2,doorBot]], {passes:2, jitter:1.4, width:2, alpha:0.8});
  hatch([[doorX1,doorTop+20],[doorX2,doorTop+20],[doorX2,doorBot],[doorX1,doorBot]], {angle:80, spacing:7, alpha:0.32});
  sketchLine(doorX1+8, doorBot-40, doorX2-8, doorTop+40, {passes:1, jitter:2, width:1.2, alpha:0.3, segs:12});

  function window_(x1,y1,x2,y2){
    sketchPolygon([[x1,y1],[x2,y1],[x2,y2],[x1,y2]], {passes:2, jitter:1.3, width:1.8, alpha:0.7});
    sketchLine((x1+x2)/2, y1, (x1+x2)/2, y2, {passes:1, jitter:1, width:1.2, alpha:0.55, segs:8});
    sketchLine(x1, (y1+y2)/2, x2, (y1+y2)/2, {passes:1, jitter:1, width:1.2, alpha:0.55, segs:8});
    hatch([[x1,y1],[x2,y1],[x2,y2],[x1,y2]], {angle:45, spacing:6, alpha:0.22});
  }
  window_(478, 560, 580, 690);
  window_(820, 560, 922, 690);

  var ivyPts = [[880,900],[900,800],[860,700],[905,610],[870,520]];
  sketchPolyline(ivyPts, {passes:1, jitter:5, width:1.6, alpha:0.5, segs:26});
  [ [900,860,26], [860,760,22], [905,660,24], [865,560,20], [930,720,18], [800,880,16] ].forEach(function(b){
    scribbleBlob(b[0],b[1],b[2],10,0.4);
  });
  scribbleBlob(660, 890, 30, 14, 0.42);
  scribbleBlob(700, 895, 22, 10, 0.35);

  sketchLine(wallL-40, groundY+6, wallR+120, groundY+6, {passes:2, jitter:2.5, width:2, alpha:0.5, segs:30});
  hatch([[wallR-40,groundY+6],[wallR+140,groundY+10],[wallR+140,groundY+42],[wallR-40,groundY+42]], {angle:100, spacing:6, alpha:0.24});
  for(var g=0; g<70; g++){
    var gx = rr(160,1260);
    var gy = groundY + rr(10,46);
    sketchLine(gx,gy,gx+rr(-6,6),gy-rr(10,20),{passes:1,jitter:1,width:1,alpha:0.22,segs:4});
  }

  hatch([[705,wallTop],[wallR,wallTop],[wallR,wallBot],[705,wallBot]], {angle:60, spacing:5, alpha:0.14, width:1});
})();
