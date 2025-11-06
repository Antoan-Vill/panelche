node -e "const fs=require('fs');const p='data/modeli-ceni/SS2025.csv';const t=fs.readFileSync(p,'utf8').trim().split(/\r?\n/);const h=t.shift().split(',');const d=t.filter(Boolean).map(l=>{const v=l.split(',');return Object.fromEntries(h.map((k,i)=>{const raw=(v[i]||'').trim();const n=Number(raw);return [k,Number.isFinite(n)&&raw!==''?n:raw]}))});console.log(JSON.stringify(d,null,2));" > data/modeli-ceni/SS2025.json


