const SIZE = 9;
const ZONE_ROWS = 3;

const boardEl = document.getElementById('board');
const turnEl = document.getElementById('turn');
const logEl = document.getElementById('log');
const slotsS = document.getElementById('slotsS');
const slotsG = document.getElementById('slotsG');
document.getElementById('reset').onclick = () => init();

let state;

function init(){
  state = {
    turn: 'S',
    sel: null,
    selDrop: null,
    board: initialBoard(),
    hands: { S: emptyHand(), G: emptyHand() },
    log: []
  };
  render();
  log('初期化');
}

function emptyHand(){ return { K:0,R:0,B:0,Gd:0,Sv:0,N:0,L:0,P:0 }; }

function initialBoard(){
  const B = Array.from({length:SIZE}, ()=>Array(SIZE).fill(null));
  const e = (t,o,p=false)=>({type:t, owner:o, promoted:p});
  B[0] = ['L','N','Sv','Gd','K','Gd','Sv','N','L'].map(t=>e(t,'G'));
  B[1][1] = e('B','G'); B[1][7] = e('R','G');
  for(let c=0;c<SIZE;c++) B[2][c] = e('P','G');
  for(let c=0;c<SIZE;c++) B[SIZE-3][c] = e('P','S');
  B[SIZE-2][1] = e('R','S'); B[SIZE-2][7] = e('B','S');
  B[SIZE-1] = ['L','N','Sv','Gd','K','Gd','Sv','N','L'].map(t=>e(t,'S'));
  return B;
}

function render(){
  renderHands();
  boardEl.innerHTML='';
  boardEl.classList.toggle('sente', state.turn==='S');

  const moves = state.sel ? legalMoves(state.sel.r, state.sel.c) : [];
  const drops = state.selDrop ? legalDrops(state.selDrop.owner, state.selDrop.type) : [];

  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      const cell = document.createElement('div');
      cell.className='cell';
      const p = state.board[r][c];
      if(p){
        const el = document.createElement('div');
        el.className='piece'; el.textContent=label(p);
        cell.appendChild(el);
      }
      if(state.sel && state.sel.r===r && state.sel.c===c) cell.classList.add('sel');
      if(moves.some(m=>m.r===r && m.c===c)){
        cell.classList.add('move'); if(state.board[r][c]) cell.classList.add('cap');
      }
      if(drops.some(d=>d.r===r && d.c===c)) cell.classList.add('dropHint');
      cell.onclick=()=>onCell(r,c);
      boardEl.appendChild(cell);
    }
  }
  turnEl.textContent = `手番: ${state.turn==='S'?'先手':'後手'}`;
  logEl.textContent = state.log.join('\\n');
}

function renderHands(){
  const render = (owner, el) => {
    el.innerHTML='';
    const h = state.hands[owner];
    for(const t of ['R','B','Gd','Sv','N','L','P']){
      const n = h[t]||0;
      if(n>0){
        const slot = document.createElement('div');
        slot.className='slot';
        slot.textContent=(owner==='S'?'▲':'△') + name({type:t, owner, promoted:false}) + ` x${n}`;
        if(state.selDrop && state.selDrop.owner===owner && state.selDrop.type===t) slot.classList.add('sel');
        slot.onclick=()=>{ if(state.turn!==owner) return; state.sel=null; state.selDrop={owner,type:t}; render(); };
        el.appendChild(slot);
      }
    }
  };
  render('G', slotsG); render('S', slotsS);
}

function onCell(r,c){
  if(state.selDrop){
    const targets = legalDrops(state.selDrop.owner, state.selDrop.type);
    if(targets.some(t=>t.r===r && t.c===c)){
      dropAt(r,c,state.selDrop.owner, state.selDrop.type);
      state.selDrop=null; render(); return;
    } else { state.selDrop=null; render(); return; }
  }

  const p = state.board[r][c];
  if(state.sel){
    const L = legalMoves(state.sel.r,state.sel.c);
    const ok = L.find(m=>m.r===r && m.c===c);
    if(ok){ moveTo(state.sel.r,state.sel.c,r,c, ok.mayPromote, ok.mustPromote); state.sel=null; render(); return; }
    if(p && p.owner===state.turn){ state.sel={r,c}; render(); return; }
    state.sel=null; render(); return;
  }else{
    if(p && p.owner===state.turn){ state.sel={r,c}; render(); }
  }
}

function dropAt(r,c,owner,type){
  if(state.board[r][c]) return;
  if(state.hands[owner][type]<=0) return;
  state.hands[owner][type]--;
  state.board[r][c] = {type, owner, promoted:false};
  log(`${side(owner)} 打: ${name({type, owner, promoted:false})}`);
  state.turn = other(owner);
}

function moveTo(sr,sc,tr,tc, mayPromote, mustPromote){
  const p = state.board[sr][sc];
  const dst = state.board[tr][tc];
  if(dst){
    const base = dst.type;
    state.hands[p.owner][base] = (state.hands[p.owner][base]||0)+1;
  }
  let promoted = p.promoted;
  if(canPromote(p) && (mustPromote || (mayPromote && confirm('成りますか？')))) promoted = true;
  state.board[tr][tc] = {type:p.type, owner:p.owner, promoted};
  state.board[sr][sc] = null;
  state.turn = other(p.owner);
  log(dst ? `${side(p.owner)} 取: ${name(p)} → ${name(dst)}` : `${side(p.owner)} 指: ${name(p)}`);
}

function other(o){ return o==='S'?'G':'S'; }
function side(o){ return o==='S'?'先手':'後手'; }

function label(p){ return (p.owner==='S'?'▲':'△') + name(p); }
function name(p){
  if(p.promoted){
    if(p.type==='R') return '竜';
    if(p.type==='B') return '馬';
    if(['Sv','N','L','P'].includes(p.type)) return '金';
  }
  return {K:'王',R:'飛',B:'角',Gd:'金',Sv:'銀',N:'桂',L:'香',P:'歩'}[p.type] || '?';
}

function inBoard(r,c){ return r>=0 && r<SIZE && c>=0 && c<SIZE; }
function d(owner){ return owner==='S'?-1:1; }

function legalMoves(r,c){
  const p = state.board[r][c]; if(!p) return [];
  const dir = d(p.owner);
  const res = [];
  const add=(nr,nc, mp=false, must=false)=>{
    if(!inBoard(nr,nc)) return;
    const t = state.board[nr][nc];
    if(!t || t.owner!==p.owner) res.push({r:nr,c:nc, mayPromote:mp, mustPromote:must});
  };
  const slide=(dr,dc)=>{
    let nr=r+dr, nc=c+dc;
    while(inBoard(nr,nc)){
      const t = state.board[nr][nc];
      const info = promoInfo(p, r, nr);
      add(nr,nc, info.mayPromote, info.mustPromote);
      if(t) break;
      nr+=dr; nc+=dc;
    }
  };
  const gold=()=>{
    const v=[[dir,0],[dir,-1],[dir,1],[0,-1],[0,1],[-dir,0]];
    for(const [dr,dc] of v){ const nr=r+dr,nc=c+dc; const info=promoInfo(p,r,nr); add(nr,nc,info.mayPromote,info.mustPromote); }
  };
  const king=()=>{ for(const dr of [-1,0,1]) for(const dc of [-1,0,1]) if(dr||dc) add(r+dr,c+dc,false,false); };
  const silver=()=>{
    const v=[[dir,0],[dir,-1],[dir,1],[-dir,-1],[-dir,1]];
    for(const [dr,dc] of v){ const nr=r+dr,nc=c+dc; const info=promoInfo(p,r,nr); add(nr,nc,info.mayPromote,info.mustPromote); }
  };
  const knight=()=>{
    const v=[[2*dir,-1],[2*dir,1]];
    for(const [dr,dc] of v){ const nr=r+dr,nc=c+dc; const info=promoInfo(p,r,nr,true); add(nr,nc,info.mayPromote,info.mustPromote); }
  };
  const lance=()=>{ slide(dir,0); };
  const rook =()=>{ slide(1,0); slide(-1,0); slide(0,1); slide(0,-1); };
  const bishop=()=>{ slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1); };
  const pawn =()=>{ const nr=r+dir,nc=c; const info=promoInfo(p,r,nr); add(nr,nc,info.mayPromote,info.mustPromote); };

  if(p.type==='K') king();
  else if(p.type==='Gd' || (p.promoted && ['Sv','N','L','P'].includes(p.type))) gold();
  else if(p.type==='Sv') silver();
  else if(p.type==='N') knight();
  else if(p.type==='L') lance();
  else if(p.type==='R' && !p.promoted) rook();
  else if(p.type==='B' && !p.promoted) bishop();
  else if(p.type==='R' && p.promoted){ rook(); for(const dr of [-1,0,1]) for(const dc of [-1,0,1]) if(dr||dc) add(r+dr,c+dc); }
  else if(p.type==='B' && p.promoted){ bishop(); for(const dr of [-1,0,1]) for(const dc of [-1,0,1]) if(dr||dc) if(dr===0||dc===0) add(r+dr,c+dc); }
  else if(p.type==='P') pawn();

  return res;
}

function promoInfo(p, sr, nr){
  const inZone = (row)=> p.owner==='S' ? (row<=ZONE_ROWS-1) : (row>=SIZE-ZONE_ROWS);
  const movingInto = !inZone(sr) && inZone(nr);
  const movingWithin = inZone(sr) && inZone(nr);
  const movingOut = inZone(sr) && !inZone(nr);
  let mayPromote = canPromote(p) && (movingInto || movingWithin || movingOut);
  let mustPromote = false;
  if(p.type==='P' || p.type==='L'){
    const last = p.owner==='S' ? 0 : SIZE-1;
    if(nr===last) mustPromote = true;
  }else if(p.type==='N'){
    const last2 = p.owner==='S' ? 1 : SIZE-2;
    if(nr===last2 || nr===(p.owner==='S'?0:SIZE-1)) mustPromote = true;
  }
  return { mayPromote, mustPromote };
}

function canPromote(p){ return ['R','B','Sv','N','L','P'].includes(p.type); }

function legalDrops(owner, type){
  const res=[];
  for(let r=0;r<SIZE;r++){
    for(let c=0;c<SIZE;c++){
      if(state.board[r][c]) continue;
      if(!canDropAt(owner,type,r,c)) continue;
      res.push({r,c});
    }
  }
  return res;
}
function canDropAt(owner,type,r,c){
  if(type==='P' || type==='L'){
    const last = owner==='S'?0:SIZE-1; if(r===last) return false;
  }
  if(type==='N'){
    const last2 = owner==='S'?1:SIZE-2; if(r===last2 || r===(owner==='S'?0:SIZE-1)) return false;
  }
  if(type==='P'){
    for(let rr=0; rr<SIZE; rr++){
      const q = state.board[rr][c];
      if(q && q.owner===owner && q.type==='P' && !q.promoted) return false;
    }
  }
  return true;
}

init();
