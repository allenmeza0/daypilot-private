/* DayPilot Markets — manual watchlist and transaction journal. No brokerage connection or live quotes. */
let marketFilter='all';
const validSymbol=s=>/^[A-Z][A-Z0-9.\-]{0,10}$/.test(String(s||'').trim().toUpperCase());
const marketAmount=n=>Number.isFinite(Number(n))?money(Number(n)): '—';
const cleanAmount=n=>{const v=Number(n);return Number.isFinite(v)&&v>=0?v:0};
const marketNum=n=>Number(n||0).toLocaleString('en-US',{maximumFractionDigits:6});
const marketDate=d=>d?fmtDate(d):'Not set';
function marketWatch(symbol){return (data.watchlist||[]).find(x=>x.symbol===symbol)}
function positionSnapshot(trades=data.trades||[]){
 const positions=new Map(), issues=[];
 const entries=[...trades].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.created||'').localeCompare(b.created||'')||String(a.id).localeCompare(String(b.id)));
 for(const t of entries){
   const sym=String(t.symbol||'').toUpperCase();if(!validSymbol(sym))continue;
   const p=positions.get(sym)||{symbol:sym,shares:0,basis:0,realized:0,dividends:0,buyGross:0,sellGross:0};
   const qty=Number(t.shares),price=Number(t.price),fee=cleanAmount(t.fee);
   if(t.type==='buy'&&qty>0&&price>=0){p.shares+=qty;p.basis+=qty*price+fee;p.buyGross+=qty*price+fee;}
   else if(t.type==='sell'&&qty>0&&price>=0){
     if(qty>p.shares+1e-8){issues.push(`A sale of ${marketNum(qty)} ${sym} shares is larger than the shares previously recorded.`);continue;}
     const avg=p.shares>0?p.basis/p.shares:0;
     const removed=avg*qty;
     p.realized+=qty*price-fee-removed;
     p.shares-=qty;p.basis-=removed;p.sellGross+=qty*price-fee;
     if(p.shares<1e-8){p.shares=0;p.basis=0;}
   }else if(t.type==='dividend'&&Number(t.amount)>=0){p.dividends+=Number(t.amount)||0;}
   positions.set(sym,p);
 }
 return {positions,issues};
}
function marketOverview(){
 const snap=positionSnapshot();let basis=0,valued=0,pricedBasis=0,unknown=0,totalRealized=0,totalDividends=0,holdingCount=0;
 const rows=[...snap.positions.values()].filter(p=>p.shares>0.00000001).sort((a,b)=>a.symbol.localeCompare(b.symbol));
 for(const p of snap.positions.values()){totalRealized+=p.realized;totalDividends+=p.dividends;}
 for(const p of rows){holdingCount++;basis+=p.basis;let quote=Number(marketWatch(p.symbol)?.manualPrice);if(marketWatch(p.symbol)?.manualPrice!==''&&marketWatch(p.symbol)?.manualPrice!=null&&Number.isFinite(quote)&&quote>=0){valued+=p.shares*quote;pricedBasis+=p.basis;}else unknown++;}
 return {rows,basis,valued,pricedBasis,unknown,totalRealized,totalDividends,holdingCount,snap};
}
function marketAlert(x){const price=x.manualPrice!==''&&x.manualPrice!=null?Number(x.manualPrice):NaN,low=Number(x.alertBelow),high=Number(x.alertAbove);
 if(!Number.isFinite(price)||price<0)return '';
 const alerts=[];
 if(x.alertBelow!==''&&x.alertBelow!=null&&Number.isFinite(low)&&price<=low)alerts.push('At/below your lower watch level');
 if(x.alertAbove!==''&&x.alertAbove!=null&&Number.isFinite(high)&&price>=high)alerts.push('At/above your upper watch level');
 return alerts.join(' · ');
}
function markets(){
 const m=marketOverview(),ws=[...(data.watchlist||[])].sort((a,b)=>a.symbol.localeCompare(b.symbol));
 const alerts=ws.filter(x=>marketAlert(x));
 const records=[...(data.trades||[])].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.created||'').localeCompare(a.created||''));
 const valuation=m.unknown?`${marketAmount(m.valued)}*`:marketAmount(m.valued);
 return `<div class="pagehead"><div><div class="eyebrow">OBSIDIAN / MARKETS</div><h1>Market journal <span class="market-glyph">↗</span></h1><p>Your watchlist, purchases, sales, dividends and performance — in one place.</p></div><div class="flex"><button class="btn ghost" onclick="downloadMarketCSV()">↓ Export CSV</button><button class="btn primary" onclick="openMarketModal('trade')">＋ Log transaction</button></div></div>
 <div class="market-banner"><div class="market-banner-copy"><span class="market-kicker">YOUR INVESTING DASHBOARD</span><h2>Know what you own.<br><span>Understand why.</span></h2><p>Track real transactions and build research habits. Prices are entered by you; this app doesn't fetch live market quotes or trade for you.</p><div class="flex"><button class="btn primary small" onclick="openMarketModal('watch')">＋ Add to watchlist</button><button class="btn small" onclick="navigate('assistant');document.getElementById('assistantInput').value='Help me understand the risks, diversification, and basic concepts behind the investments on my DayPilot watchlist.'">✧ Ask AI about investing</button></div></div><div class="market-orbit" aria-hidden="true">⌁</div></div>
 <div class="market-stats">
 <div class="stat"><div class="k">CURRENT COST BASIS</div><div class="v">${marketAmount(m.basis)}</div><div class="hint">For ${m.holdingCount} held symbol${m.holdingCount!==1?'s':''}</div></div>
 <div class="stat"><div class="k">MANUAL-PRICE VALUE</div><div class="v">${valuation}</div><div class="hint">${m.unknown?`${m.unknown} holding${m.unknown===1?' needs':'s need'} a price`:'Not a live market valuation'}</div></div>
 <div class="stat"><div class="k">RECORDED REALIZED P/L</div><div class="v ${m.totalRealized<0?'market-loss':'market-gain'}">${marketAmount(m.totalRealized)}</div><div class="hint">Sales minus estimated cost basis & fees</div></div>
 <div class="stat"><div class="k">DIVIDENDS LOGGED</div><div class="v">${marketAmount(m.totalDividends)}</div><div class="hint">Cash dividends entered manually</div></div>
 </div>
 ${m.snap.issues.length?`<div class="notice warn">Your transaction journal has entries to review: ${esc(m.snap.issues.join(' '))}</div>`:''}
 <div class="market-layout"><div>
 <div class="panel"><div class="panelh"><h2>✦ Holdings</h2><button class="btn small ghost" onclick="openMarketModal('trade')">＋ Transaction</button></div>
 <p class="caption">Calculated from your buys and sells using average cost. Values use your manually entered reference prices, not live quotes.</p>
 <div class="market-scroll"><table class="market-table"><thead><tr><th>Symbol</th><th>Shares</th><th>Cost / share</th><th>Cost basis</th><th>Reference value</th></tr></thead><tbody>${m.rows.length?m.rows.map(p=>{let w=marketWatch(p.symbol),ref=w?.manualPrice!==''&&w?.manualPrice!=null&&Number.isFinite(Number(w.manualPrice))?Number(w.manualPrice):null;return `<tr><td><b>${esc(p.symbol)}</b><small>${esc(w?.name||'')}</small></td><td>${marketNum(p.shares)}</td><td>${marketAmount(p.basis/p.shares)}</td><td>${marketAmount(p.basis)}</td><td>${ref===null?'Not priced':marketAmount(p.shares*ref)}${ref===null?'':`<small>${marketAmount(p.shares*ref-p.basis)} est. difference</small>`}</td></tr>`}).join(''):`<tr><td colspan="5" class="market-empty">No holdings yet. Log a purchase when you actually make one.</td></tr>`}</tbody></table></div>
 </div>
 <div class="panel sectiongap"><div class="panelh"><h2>◇ Watchlist</h2><button class="btn small ghost" onclick="openMarketModal('watch')">＋ Watch symbol</button></div>
 ${ws.length?`<div class="market-watch-grid">${ws.map(w=>`<div class="market-watch"><div class="market-watch-top"><div><div class="market-ticker">${esc(w.symbol)}</div><div class="caption">${esc(w.name||'Company or fund')}</div></div><button class="tiny" aria-label="Edit watchlist entry for ${esc(w.symbol)}" onclick="openMarketModal('watch','${w.id}')">⋯</button></div><div class="market-price">${w.manualPrice!==''&&w.manualPrice!=null?marketAmount(w.manualPrice):'No price yet'}</div><div class="caption">${w.priceAsOf?'Entered '+esc(marketDate(w.priceAsOf)):'Price entered manually'}</div>${marketAlert(w)?`<div class="market-alert">◉ ${esc(marketAlert(w))}</div>`:''}<p class="market-note">${esc(w.notes||'Add your research notes, risks, or questions.')}</p></div>`).join('')}</div>`:empty('Start a watchlist','Track companies or funds you want to learn about. No purchase is required.','⌁')}
 </div>
 <div class="panel sectiongap"><div class="panelh"><h2>▤ Activity journal</h2><button class="btn small ghost" onclick="openMarketModal('trade')">＋ Log entry</button></div>
 ${records.length?`<div class="market-activity">${records.map(t=>`<div class="market-activity-row"><div class="market-chip ${t.type==='sell'?'sell':t.type==='dividend'?'dividend':'buy'}">${t.type==='buy'?'↗':t.type==='sell'?'↙':'◇'}</div><div class="content"><b>${esc(t.symbol)} · ${esc(t.type==='buy'?'Purchase':t.type==='sell'?'Sale':'Dividend')}</b><div class="meta">${esc(marketDate(t.date))} · ${t.type==='dividend'?marketAmount(t.amount)+' received':marketNum(t.shares)+' shares @ '+marketAmount(t.price)+' / share'}${cleanAmount(t.fee)?' · '+marketAmount(t.fee)+' fees':''}</div></div><button class="tiny" aria-label="Edit transaction" onclick="openMarketModal('trade','${t.id}')">⋯</button></div>`).join('')}</div>`:empty('No transactions recorded','When you start investing, log your buys, sells, and dividends here.','▤')}
 </div>
 </div><aside><div class="panel"><div class="panelh"><h2>◉ Price checkpoints</h2></div><p class="caption">For your research only. You set the thresholds and manually enter a price to compare. These are not real-time alerts or buy/sell recommendations.</p>${alerts.length?alerts.map(w=>`<div class="market-alert sectiongap"><b>${esc(w.symbol)}</b> · ${esc(marketAlert(w))}</div>`).join(''):`<div class="notice">No levels reached based on your manually entered prices.</div>`}</div>
 <div class="panel sectiongap"><div class="panelh"><h2>✧ Build good habits</h2></div><div class="market-learn"><div><b>Understand the basics</b><span>Learn about diversification, index funds, fees, and long-term risk.</span></div><div><b>Write your reasoning</b><span>Record why an investment interests you and what could go wrong.</span></div><div><b>Separate facts from forecasts</b><span>No indicator or AI can guarantee future returns.</span></div></div><div class="notice">DayPilot doesn't connect to a brokerage, execute trades, or recommend that you buy or sell any specific security. Review all figures against your brokerage statements.</div></div>
 <div class="panel sectiongap"><div class="panelh"><h2>◇ Notes on your numbers</h2></div><p class="caption">Realized gains use a simplified average-cost method; this may differ from your brokerage's tax-lot accounting. These estimates omit taxes, splits, transfers and corporate actions. For reliable records, use your official statements.</p></div>
 </aside></div>`;
}
function openMarketModal(kind,itemId){
 let arr=kind==='watch'?data.watchlist:data.trades;
 let old=arr.find(x=>x.id===itemId)||{};modalEdit={kind:'market-'+kind,itemId:itemId||null};
 document.getElementById('modalTitle').textContent=kind==='watch'?(itemId?'Edit watched symbol':'Add to watchlist'):(itemId?'Edit journal entry':'Log investment activity');
 const text=(k,fallback='')=>esc(old[k]??fallback);
 let html='';
 if(kind==='watch') html=`<form onsubmit="saveMarketModal(event)"><div class="formgrid"><label>Symbol / ticker<input class="field" name="symbol" maxlength="11" required pattern="[A-Za-z][A-Za-z0-9.\\-]*" value="${text('symbol')}" placeholder="e.g. AAPL"></label><label>Company / fund (optional)<input class="field" name="name" maxlength="100" value="${text('name')}" placeholder="Optional label"></label><label>Reference price ($)<input class="field" type="number" name="manualPrice" min="0" step="any" value="${text('manualPrice')}" placeholder="Manual, not live"></label><label>Price entry date<input class="field" type="date" name="priceAsOf" value="${text('priceAsOf',today())}"></label><label>Watch level: at/below ($)<input class="field" type="number" name="alertBelow" min="0" step="any" value="${text('alertBelow')}" placeholder="Optional"></label><label>Watch level: at/above ($)<input class="field" type="number" name="alertAbove" min="0" step="any" value="${text('alertAbove')}" placeholder="Optional"></label><label class="span2">Research notes and risks<textarea class="field" name="notes" rows="3" maxlength="800" placeholder="Why am I researching this? What risks should I investigate?">${text('notes')}</textarea></label></div><p class="caption">No live quote service is connected. Price checkpoints update only when you change the reference price.</p><div class="formactions">${itemId?`<button class="btn danger" type="button" onclick="deleteMarketEntry('watch','${itemId}')">Delete</button>`:''}<button class="btn ghost" type="button" onclick="closeModal()">Cancel</button><button class="btn primary" type="submit">Save watchlist</button></div></form>`;
 else html=`<form onsubmit="saveMarketModal(event)"><div class="formgrid"><label>Activity<select class="field" name="type" onchange="marketTradeFields(this.value)"><option value="buy" ${old.type==='buy'?'selected':''}>Purchase</option><option value="sell" ${old.type==='sell'?'selected':''}>Sale</option><option value="dividend" ${old.type==='dividend'?'selected':''}>Cash dividend</option></select></label><label>Symbol / ticker<input class="field" name="symbol" maxlength="11" required value="${text('symbol')}" placeholder="e.g. AAPL"></label><label>Date<input class="field" type="date" name="date" value="${text('date',today())}" required></label><label id="marketShares">Shares<input class="field" type="number" name="shares" min="0.000001" step="any" value="${text('shares')}" placeholder="Fractional shares supported"></label><label id="marketPrice">Price per share ($)<input class="field" type="number" name="price" min="0" step="any" value="${text('price')}"></label><label id="marketFee">Transaction fees ($)<input class="field" type="number" name="fee" min="0" step="any" value="${text('fee',0)}"></label><label id="marketDividend" class="span2" style="display:none">Cash dividend received ($)<input class="field" type="number" name="amount" min="0" step="any" value="${text('amount')}"></label><label class="span2">Personal notes<textarea class="field" name="notes" rows="2" maxlength="800" placeholder="Record your reasoning, fees, or statement reference">${text('notes')}</textarea></label></div><p class="caption">Only record transactions that actually occurred. DayPilot doesn't place orders or connect to your brokerage.</p><div class="formactions">${itemId?`<button class="btn danger" type="button" onclick="deleteMarketEntry('trade','${itemId}')">Delete</button>`:''}<button class="btn ghost" type="button" onclick="closeModal()">Cancel</button><button class="btn primary" type="submit">Save entry</button></div></form>`;
 document.getElementById('modalBody').innerHTML=html;
 document.getElementById('modalWrap').classList.add('open');
 if(kind==='trade')marketTradeFields(old.type||'buy');
}
function marketTradeFields(type){const dividend=type==='dividend';for(const id of ['marketShares','marketPrice','marketFee']){const el=document.getElementById(id);if(el){el.style.display=dividend?'none':'';const input=el.querySelector('input');if(input)input.required=!dividend;}}const dv=document.getElementById('marketDividend');if(dv){dv.style.display=dividend?'block':'none';dv.querySelector('input').required=dividend;}}
function saveMarketModal(e){e.preventDefault();const f=new FormData(e.target),obj=Object.fromEntries(f.entries());for(let k in obj)if(typeof obj[k]==='string')obj[k]=obj[k].trim();obj.symbol=String(obj.symbol||'').toUpperCase();if(!validSymbol(obj.symbol)){notice('Enter a valid stock or fund symbol (e.g. AAPL).');return;}
 const {kind,itemId}=modalEdit;
 if(kind==='market-watch'){
  if((data.watchlist||[]).some(x=>x.symbol===obj.symbol&&x.id!==itemId)){notice('That symbol is already on your watchlist.');return;}
  for(const k of ['manualPrice','alertBelow','alertAbove'])if(obj[k]!==''&&(!Number.isFinite(Number(obj[k]))||Number(obj[k])<0)){notice('Price and watch levels must be zero or greater.');return;}
  const old=itemId?data.watchlist.find(x=>x.id===itemId):null;
  const record={...old,...obj,id:old?.id||id(),created:old?.created||new Date().toISOString(),changedAt:new Date().toISOString()};
  if(old)Object.assign(old,record);else data.watchlist.push(record);
 } else {
  if(!['buy','sell','dividend'].includes(obj.type)||!/^\d{4}-\d{2}-\d{2}$/.test(obj.date)){notice('Select a valid activity and date.');return;}
  if(obj.type==='dividend'){
    if(obj.amount===''||!Number.isFinite(Number(obj.amount))||Number(obj.amount)<0){notice('Enter the dividend amount.');return;}
    obj.amount=Number(obj.amount);obj.shares='';obj.price='';obj.fee=0;
  }else{
    if(obj.shares===''||obj.price===''||!Number.isFinite(Number(obj.shares))||Number(obj.shares)<=0||!Number.isFinite(Number(obj.price))||Number(obj.price)<0||!Number.isFinite(Number(obj.fee))||Number(obj.fee)<0){notice('Enter shares, price per share and a nonnegative fee.');return;}
    obj.shares=Number(obj.shares);obj.price=Number(obj.price);obj.fee=Number(obj.fee);
  }
  const old=itemId?data.trades.find(x=>x.id===itemId):null;
  const record={...old,...obj,id:old?.id||id(),created:old?.created||new Date().toISOString(),changedAt:new Date().toISOString()};
  const candidate=[...data.trades.filter(x=>x.id!==itemId),record];const calc=positionSnapshot(candidate);
  if(calc.issues.length){notice(calc.issues[0]);return;}
  if(old)Object.assign(old,record);else data.trades.push(record);
  if(!marketWatch(obj.symbol))data.watchlist.push({id:id(),symbol:obj.symbol,name:'',manualPrice:'',alertBelow:'',alertAbove:'',notes:'',created:new Date().toISOString(),changedAt:new Date().toISOString()});
 }
 save();closeModal();render();notice('Investment journal updated.');
}
function deleteMarketEntry(kind,itemId){if(!confirm('Delete this record?'))return;const key=kind==='watch'?'watchlist':'trades';data[key]=data[key].filter(x=>x.id!==itemId);data.deleted.push({id:itemId,at:new Date().toISOString()});save();closeModal();render();notice('Record removed.');}
function downloadMarketCSV(){const header=['date','activity','ticker','shares','price_per_share','fees','dividend','notes'];const rows=[header,...data.trades.map(t=>[t.date,t.type,t.symbol,t.shares||'',t.price===''?'':t.price,t.fee??'',t.amount??'',t.notes||''])];download('daypilot-investing-journal-'+today()+'.csv',rows.map(r=>r.map(csvField).join(',')).join('\r\n'),'text/csv');notice('Journal exported.');}
