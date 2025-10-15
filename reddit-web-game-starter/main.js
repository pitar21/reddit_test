const $ = (id)=>document.getElementById(id);

const RULES = [
  { key: /\bPICK\b/i, score: 3 },
  { key: /\bDROP\b/i, score: 2 },
  { key: /\bSCAN\b/i, score: 1 },
];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("load").onclick = () => {
    const u = document.getElementById("url").value.trim();
    if (!u) { document.getElementById("meta").textContent = "URLを入れて。"; return; }
    run(u).catch(e => { document.getElementById("meta").textContent = "エラー: " + e.message; console.error(e); });
  };

  // 自動セット（?permalink=...）
  try{
    const u = new URL(window.location.href);
    const p = u.searchParams.get("permalink");
    if(p){ document.getElementById("url").value = p; }
  }catch{}
});

async function run(permalinkURL) {
  const meta = document.getElementById("meta");
  const board = document.getElementById("board");
  meta.textContent = "読込中…";
  board.innerHTML = "";

  const normalized = permalinkURL.replace(/\?.*$/, "").replace(/#.*/, "");
  const api = normalized.endsWith("/") ? normalized + ".json" : normalized + "/.json";

  const res = await fetch(api, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();

  const post = data[0]?.data?.children?.[0]?.data;
  const comments = data[1]?.data?.children ?? [];

  const flat = [];
  function walk(list){
    for(const c of list){
      if(c.kind !== "t1") continue;
      const d = c.data;
      flat.push({
        author: d.author,
        body: d.body || "",
        created_utc: d.created_utc || 0,
        permalink: d.permalink
      });
      const replies = d.replies?.data?.children;
      if (Array.isArray(replies)) walk(replies);
    }
  }
  walk(comments);

  flat.sort((a,b)=>a.created_utc-b.created_utc);
  const lastByUser = new Map();
  const valid = flat.filter(c=>{
    const last = lastByUser.get(c.author) || 0;
    if (c.created_utc - last < 30) return false;
    lastByUser.set(c.author, c.created_utc);
    return true;
  });

  const map = new Map();
  for(const c of valid){
    let add = 0;
    for(const r of RULES){
      if(r.key.test(c.body)) add += r.score;
    }
    if(add<=0) continue;
    const cur = map.get(c.author) || { author: c.author, score:0, plays:0 };
    cur.score += add;
    cur.plays += 1;
    map.set(c.author, cur);
  }

  const ranking = Array.from(map.values()).sort((a,b)=>b.score-a.score).slice(0,20);

  meta.textContent = `タイトル: ${post?.title ?? "(unknown)"} | コメント解析数 ${flat.length} | 有効 ${valid.length}`;
  for(const r of ranking){
    const li = document.createElement("li");
    li.innerHTML = `<strong>u/${escapeHtml(r.author)}</strong> — ${r.score} pts (${r.plays} plays)`;
    board.appendChild(li);
  }
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
}
