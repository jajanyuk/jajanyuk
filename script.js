:root {
  --brand: #D4900A;
  --brand-light: #FEF3C7;
  --brand-dark: #B47800;
  --green: #22C55E;
  --green-light: #DCFCE7;
  --green-dark: #15803D;
  --amber: #F59E0B;
  --amber-light: #FEF3C7;
  --blue: #3B82F6;
  --blue-light: #EFF6FF;
  --red: #EF4444;
  --red-light: #FEF2F2;
  --purple: #8B5CF6;
  --purple-light: #F5F3FF;
  --bg: #FAF8F5;
  --surface: #FFFFFF;
  --surface2: #F5F2EE;
  --border: #E8E2DA;
  --text: #1A1510;
  --text2: #7A6E63;
  --text3: #B0A89E;
  --radius: 14px;
  --radius-sm: 8px;
  --shadow: 0 2px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.10);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
.app { display: flex; flex-direction: column; min-height: 100vh; max-width: 480px; margin: 0 auto; background: var(--surface); box-shadow: 0 0 40px rgba(0,0,0,0.08); }
.header { background: var(--brand); padding: 20px 20px 16px; position: sticky; top: 0; z-index: 100; }
.header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.logo { display: flex; align-items: center; gap: 10px; }
.logo-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.25); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.logo-text { font-size: 20px; font-weight: 800; color: white; letter-spacing: -0.5px; }
.logo-sub { font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 500; }
.header-date { font-size: 12px; color: rgba(255,255,255,0.75); font-weight: 500; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 20px; }
.sync-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.sync-ok { background: rgba(34,197,94,0.25); color: #86EFAC; }
.sync-loading { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
.sync-err { background: rgba(239,68,68,0.25); color: #FCA5A5; }
.nav { display: flex; gap: 4px; background: rgba(255,255,255,0.15); border-radius: 10px; padding: 4px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; scroll-snap-type: x proximity; }
.nav::-webkit-scrollbar { display: none; }
.nav-btn { flex: 1 1 0; min-width: 54px; padding: 8px 3px; border: none; background: none; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 600; cursor: pointer; border-radius: 7px; transition: all 0.2s; font-family: inherit; display: flex; flex-direction: column; align-items: center; gap: 2px; white-space: nowrap; scroll-snap-align: start; }
.nav-btn.active { background: white; color: var(--brand); }
.nav-btn .nav-icon { font-size: 16px; }
@media (max-width: 400px) {
  .nav-btn { font-size: 10.5px; min-width: 48px; padding: 8px 2px; }
  .nav-btn .nav-icon { font-size: 15px; }
}
@media (max-width: 340px) {
  .nav-btn { font-size: 9.5px; min-width: 44px; }
}
.content { flex: 1; padding: 16px; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
.section-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
.section-title span { font-size: 13px; font-weight: 500; color: var(--text2); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.form-group { margin-bottom: 12px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text2); margin-bottom: 6px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }
.form-input, .form-select { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; color: var(--text); background: var(--surface); transition: border 0.2s; outline: none; }
.form-input:focus, .form-select:focus { border-color: var(--brand); }
.form-row { display: flex; gap: 8px; }
.form-row .form-group { flex: 1; }
.btn { padding: 11px 18px; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--brand); color: white; width: 100%; justify-content: center; }
.btn-primary:hover:not(:disabled) { background: var(--brand-dark); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 6px; }
.btn-ghost { background: none; border: 1.5px solid var(--border); color: var(--text2); }
.btn-ghost:hover { border-color: var(--text2); }
.btn-danger { background: var(--red-light); color: var(--red); }
.btn-success { background: var(--green-light); color: var(--green-dark); }
.btn-warning { background: var(--amber-light); color: #92400E; }
.order-item { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 8px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; transition: background 0.2s; }
.order-item.paid { background: var(--green-light); border-color: #86EFAC; }
.order-item-info { flex: 1; min-width: 0; }
.order-item-name { font-size: 14px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.order-item-buyer { font-size: 12px; color: var(--text2); margin-top: 2px; }
.order-item-details { font-size: 12px; color: var(--text3); margin-top: 2px; }
.order-item-price { font-size: 15px; font-weight: 700; color: var(--brand); white-space: nowrap; font-family: 'DM Mono', monospace; }
.order-item-actions { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
.badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; gap: 3px; }
.badge-paid { background: var(--green-light); color: var(--green-dark); }
.badge-unpaid { background: var(--amber-light); color: #92400E; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.stat-label { font-size: 11px; font-weight: 600; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
.stat-value { font-size: 18px; font-weight: 800; color: var(--text); font-family: 'DM Mono', monospace; line-height: 1.2; }
.stat-value.green { color: var(--green-dark); }
.stat-value.orange { color: var(--brand); }
.stat-value.blue { color: var(--blue); }
.stat-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }
.period-tabs { display: flex; gap: 4px; background: var(--surface2); border-radius: var(--radius-sm); padding: 4px; margin-bottom: 16px; }
.period-tab { flex: 1; padding: 8px 4px; border: none; background: none; font-size: 13px; font-weight: 600; color: var(--text2); cursor: pointer; border-radius: 6px; font-family: inherit; transition: all 0.2s; }
.period-tab.active { background: white; color: var(--brand); box-shadow: var(--shadow); }
.deposit-item { background: var(--blue-light); border: 1px solid #BFDBFE; border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 8px; display: flex; align-items: flex-start; justify-content: space-between; }
.deposit-item.depleted { background: var(--red-light); border-color: #FCA5A5; }
.deposit-item.partial { background: var(--amber-light); border-color: #FDE68A; }
.deposit-item.full { background: var(--blue-light); border-color: #BFDBFE; }
.deposit-name { font-size: 14px; font-weight: 600; color: var(--text); }
.deposit-amount { font-size: 15px; font-weight: 700; color: var(--blue); font-family: 'DM Mono', monospace; }
.deposit-amount.red { color: var(--red); }
.deposit-amount.orange { color: #B45309; }
.deposit-date { font-size: 11px; color: var(--text3); margin-top: 2px; }
.deposit-balance-bar { height: 4px; border-radius: 2px; background: #BFDBFE; margin-top: 6px; overflow: hidden; }
.deposit-balance-fill { height: 100%; border-radius: 2px; background: var(--blue); transition: width 0.4s; }
.deposit-balance-fill.orange { background: var(--amber); }
.deposit-balance-fill.red { background: var(--red); }
.badge-deposit { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
.badge-deposit-used { background: var(--amber-light); color: #92400E; border: 1px solid #FDE68A; }
.buyer-select { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.buyer-option { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s; }
.buyer-option:hover { border-color: var(--brand); background: var(--brand-light); }
.buyer-option.selected { border-color: var(--brand); background: var(--brand-light); }
.buyer-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.buyer-info { flex: 1; }
.buyer-name { font-size: 14px; font-weight: 600; }
.buyer-total { font-size: 12px; color: var(--text2); font-family: 'DM Mono', monospace; }
.bill-preview { background: var(--surface2); border-radius: var(--radius); padding: 16px; margin-top: 12px; font-family: 'DM Mono', monospace; font-size: 13px; }
.bill-preview pre { white-space: pre-wrap; word-break: break-word; color: var(--text); line-height: 1.7; }
.bill-actions { display: flex; gap: 8px; margin-top: 12px; }
.bill-actions .btn { flex: 1; justify-content: center; }
.empty-state { text-align: center; padding: 40px 20px; color: var(--text3); }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-text { font-size: 14px; }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); background: var(--text); color: white; padding: 12px 20px; border-radius: 30px; font-size: 13px; font-weight: 600; z-index: 999; opacity: 0; transition: all 0.3s; pointer-events: none; max-width: 320px; text-align: center; }
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
.divider { height: 1px; background: var(--border); margin: 16px 0; }
.chart-bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; margin-bottom: 4px; }
.bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar { width: 100%; background: var(--brand-light); border-radius: 4px 4px 0 0; transition: height 0.5s; min-height: 3px; }
.bar.current { background: var(--brand); }
.bar-label { font-size: 10px; color: var(--text3); font-weight: 600; }
.orders-list { max-height: 55vh; overflow-y: auto; padding-right: 2px; }
.orders-list::-webkit-scrollbar { width: 4px; }
.orders-list::-webkit-scrollbar-track { background: transparent; }
.orders-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.note-input { font-size: 12px; padding: 7px 10px; }
.bulk-row { display:flex; align-items:center; justify-content:space-between; padding:7px 10px; border-radius:var(--radius-sm); font-size:13px; margin-bottom:4px; gap:8px; }
.bulk-row.valid { background:var(--green-light); border:1px solid #86EFAC; }
.bulk-row.invalid { background:var(--red-light); border:1px solid #FCA5A5; }
.bulk-row-info { flex:1; min-width:0; }
.bulk-row-name { font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bulk-row-buyer { font-size:11px; color:var(--text2); }
.bulk-row-price { font-family:'DM Mono',monospace; font-weight:700; font-size:13px; white-space:nowrap; }
.bulk-row.valid .bulk-row-price { color:var(--green-dark); }
.bulk-row.invalid .bulk-row-price { color:var(--red); }
.qris-upload-zone { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px dashed var(--border); border-radius: var(--radius); padding: 32px 20px; cursor: pointer; transition: all 0.2s; text-align: center; background: var(--surface2); }
.qris-upload-zone:hover { border-color: var(--brand); background: var(--brand-light); }
.qris-upload-icon { font-size: 36px; margin-bottom: 10px; }
.qris-upload-text { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.qris-upload-sub { font-size: 12px; color: var(--text3); }
.qris-frame { position: relative; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border); }
.qris-tap-hint { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.6)); color: white; font-size: 12px; font-weight: 600; text-align: center; padding: 20px 8px 8px; }
.nominal-chip { display: inline-flex; align-items: center; padding: 6px 12px; background: white; border: 1.5px solid var(--brand); border-radius: 20px; font-size: 13px; font-weight: 700; color: var(--brand); cursor: pointer; font-family: 'DM Mono', monospace; transition: all 0.15s; }
.nominal-chip:hover { background: var(--brand); color: white; }
.nominal-chip:active { transform: scale(0.96); }
.w-full { width: 100%; }
.text-right { text-align: right; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-8 { gap: 8px; }
.text-sm { font-size: 12px; }
.text-muted { color: var(--text2); }
.font-bold { font-weight: 700; }
.filter-row { display: flex; gap: 6px; margin-bottom: 12px; align-items: center; flex-wrap: wrap; }
.filter-input { flex: 1; min-width: 120px; padding: 8px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; font-family: inherit; outline: none; color: var(--text); background: var(--surface); }
.filter-input:focus { border-color: var(--brand); }
.date-filter-bar { display: flex; gap: 6px; margin-bottom: 14px; align-items: center; flex-wrap: wrap; }
.date-filter-bar .date-label { font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
.date-filter-input { padding: 7px 10px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; font-family: inherit; outline: none; color: var(--text); background: var(--surface); transition: border 0.2s; cursor: pointer; }
.date-filter-input:focus { border-color: var(--brand); }
.date-shortcut-row { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 12px; }
.date-shortcut { padding: 5px 10px; border: 1.5px solid var(--border); border-radius: 20px; font-size: 11px; font-weight: 600; color: var(--text2); background: var(--surface); cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
.date-shortcut:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }
.date-shortcut.active { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }
.filter-section { background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px; border: 1px solid var(--border); }
.filter-section-title { font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
.active-filter-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; background: var(--brand-light); border: 1px solid #FFB899; border-radius: 20px; font-size: 11px; font-weight: 700; color: var(--brand); margin-left: auto; }
.order-item-date { font-size: 11px; color: var(--text3); margin-top: 2px; }
.period-tabs-wrap { position: relative; margin-bottom: 14px; }
.summary-date-range { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.summary-date-range .date-filter-input { flex: 1; font-size: 12px; padding: 6px 10px; }
.summary-date-range-label { font-size: 11px; color: var(--text3); font-weight: 600; }
.tagihan-filter { background: var(--surface2); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px; border: 1px solid var(--border); }
.tagihan-filter-row { display: flex; gap: 8px; align-items: center; }
.tagihan-filter-row .date-filter-input { flex: 1; font-size: 12px; padding: 6px 10px; }
.antrian-item { background: var(--surface); border: 1.5px solid var(--amber-light); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 8px; }
.antrian-item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
.antrian-item-name { font-size: 14px; font-weight: 700; color: var(--text); }
.antrian-item-price { font-size: 14px; font-weight: 700; color: var(--brand); font-family: 'DM Mono', monospace; white-space: nowrap; }
.antrian-buyer-row { display: flex; gap: 6px; align-items: center; }
.antrian-buyer-input { flex: 1; padding: 7px 10px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; font-family: inherit; outline: none; color: var(--text); background: var(--surface2); }
.antrian-buyer-input:focus { border-color: var(--brand); background: white; }
.antrian-send-btn { padding: 7px 12px; background: var(--green-light); color: var(--green-dark); border: none; border-radius: var(--radius-sm); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap; transition: all 0.15s; }
.antrian-send-btn:hover { background: var(--green); color: white; }
.antrian-del-btn { padding: 7px 10px; background: var(--red-light); color: var(--red); border: none; border-radius: var(--radius-sm); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; }
.antrian-del-btn:hover { background: var(--red); color: white; }
.antrian-sent { opacity: 0.45; pointer-events: none; }
#adminModal { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9990;display:none;align-items:center;justify-content:center; }
#adminModal.show { display:flex; }
.admin-modal-box { background:var(--surface);border-radius:20px;padding:28px 24px;width:90%;max-width:340px;text-align:center;box-shadow:var(--shadow-lg); }
.admin-modal-icon { font-size:42px;margin-bottom:8px; }
.admin-modal-title { font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px; }
.admin-modal-sub { font-size:13px;color:var(--text2);margin-bottom:20px; }
.pin-dots { display:flex;gap:10px;justify-content:center;margin-bottom:18px; }
.pin-dot { width:14px;height:14px;border-radius:50%;border:2px solid var(--border);background:var(--surface2);transition:all 0.2s; }
.pin-dot.filled { background:var(--brand);border-color:var(--brand); }
.pin-dot.error { background:var(--red);border-color:var(--red); }
.pin-numpad { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px; }
.pin-key { padding:14px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:18px;font-weight:700;background:var(--surface);color:var(--text);cursor:pointer;transition:all 0.15s;font-family:inherit; }
.pin-key:hover { background:var(--brand-light);border-color:var(--brand); }
.pin-key:active { transform:scale(0.94); }
.pin-key.del { font-size:16px;color:var(--red); }
.pin-error-msg { font-size:12px;color:var(--red);font-weight:600;min-height:18px;margin-bottom:6px; }
.admin-badge { display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;cursor:pointer;transition:all 0.2s; }
.admin-badge.is-admin { background:rgba(255,255,255,0.25);color:white; }
.admin-badge.is-user { background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.8); }
.nav-btn.locked { opacity:0.35;cursor:not-allowed;pointer-events:none; }
.nav-btn.locked::after { content:'🔒';font-size:10px;display:block; }
#loadingOverlay { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(250,248,245,0.95);z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px; }
#loadingOverlay .load-icon { font-size:48px;animation:pulse 1.2s infinite; }
#loadingOverlay .load-text { font-size:15px;font-weight:700;color:var(--text2); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.spin { display:inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.sort-btn { display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:12px;font-weight:700;background:var(--surface);color:var(--text2);cursor:pointer;font-family:inherit;transition:all 0.15s;white-space:nowrap; }
.sort-btn:hover { border-color:var(--brand);color:var(--brand);background:var(--brand-light); }
.sort-btn.active { border-color:var(--brand);color:var(--brand);background:var(--brand-light); }
.order-item.paid {
  background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%) !important;
  border-color: #4ADE80 !important;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.25), 0 2px 8px rgba(34,197,94,0.15);
  position: relative;
}
.order-item.paid::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(74,222,128,0.12) 0%, transparent 60%);
  pointer-events: none;
}
.order-item.paid .order-item-name { color: #15803D; }
.order-item.paid .order-item-price { color: #15803D; }
.buyer-option.all-paid {
  background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
  border-color: #4ADE80;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
}
.buyer-option.all-paid .buyer-avatar { background: var(--green-dark) !important; }
.summary-buyer-row.all-paid {
  background: linear-gradient(135deg, #DCFCE7, #BBF7D0);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  margin: -4px -6px;
  box-shadow: 0 0 0 1.5px rgba(34,197,94,0.35);
}
.utb-name-card { text-align: center; padding: 28px 20px; }
.utb-name-icon { font-size: 40px; margin-bottom: 10px; }
.utb-name-title { font-size: 17px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.utb-name-sub { font-size: 13px; color: var(--text2); margin-bottom: 18px; }
.utb-user-bar { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; }
.utb-user-bar-name { font-size: 14px; font-weight: 700; color: var(--text); }
.utb-user-bar-name span { font-size: 11px; font-weight: 600; color: var(--text2); display:block; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
.utb-list { padding-bottom: 90px; }
.utb-item { display:flex; align-items:center; gap:12px; background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 8px; transition: all 0.2s; }
.utb-item.checked { background: var(--green-light); border-color: #86EFAC; }
.utb-item.locked { background: var(--surface2); border-color: var(--border); opacity: 0.65; }
.utb-checkbox-wrap { flex-shrink: 0; display:flex; align-items:center; }
.utb-checkbox-wrap input[type=checkbox] { width: 24px; height: 24px; accent-color: var(--green-dark); cursor: pointer; }
.utb-checkbox-wrap input[type=checkbox]:disabled { cursor: not-allowed; }
.utb-item-info { flex: 1; min-width: 0; }
.utb-item-name { font-size: 14px; font-weight: 700; color: var(--text); }
.utb-item-note { font-size: 11px; color: var(--text3); margin-top: 2px; }
.utb-item-locked-by { font-size: 11px; font-weight: 700; color: var(--amber); margin-top: 3px; display:flex; align-items:center; gap:4px; }
.utb-item-price { font-size: 14px; font-weight: 800; color: var(--brand); font-family: 'DM Mono', monospace; white-space: nowrap; }
.utb-order-bar { position: sticky; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1.5px solid var(--border); padding: 12px 16px; margin: 12px -16px -16px; box-shadow: 0 -4px 16px rgba(0,0,0,0.08); }

/* Delete by date card */
.delete-date-card { background: var(--red-light); border: 1.5px solid #FCA5A5; border-radius: var(--radius); padding: 16px; margin-bottom: 12px; }
.delete-date-card .section-title { color: var(--red); }
.delete-date-card .form-row { align-items: flex-end; }
.delete-date-card .btn-danger { background: var(--red); color: white; border: none; }
.delete-date-card .btn-danger:hover { background: #DC2626; }
.delete-date-card .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Order item highlight for delete mode */
.order-item.pending-delete { background: var(--red-light) !important; border-color: #FCA5A5 !important; opacity: 0.6; }

/* UTB Order Confirm Modal */
#utbConfirmModal { position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9991;display:none;align-items:center;justify-content:center;padding:20px; }
#utbConfirmModal.show { display:flex; }
.utb-confirm-box { background:var(--surface);border-radius:20px;padding:24px 20px;width:100%;max-width:360px;box-shadow:var(--shadow-lg);max-height:85vh;overflow-y:auto; }
.utb-confirm-icon { font-size:36px;text-align:center;margin-bottom:6px; }
.utb-confirm-title { font-size:17px;font-weight:800;color:var(--text);text-align:center;margin-bottom:12px; }
.utb-confirm-buyer { font-size:14px;font-weight:700;color:var(--brand);text-align:center;background:var(--brand-light);padding:8px 12px;border-radius:var(--radius-sm);margin-bottom:14px; }
.utb-confirm-list { display:flex;flex-direction:column;gap:8px;margin-bottom:14px; }
.utb-confirm-item { display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:10px 12px;background:var(--surface2);border-radius:var(--radius-sm); }
.utb-confirm-item-name { font-size:13px;font-weight:700;color:var(--text); }
.utb-confirm-item-note { font-size:11px;color:var(--text3);margin-top:2px; }
.utb-confirm-item-price { font-size:13px;font-weight:700;color:var(--brand);font-family:'DM Mono',monospace;white-space:nowrap; }
.utb-confirm-total-row { display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:800;color:var(--text);padding-top:12px;border-top:1.5px solid var(--border);margin-bottom:16px; }
.utb-confirm-total-row span:last-child { color:var(--brand);font-family:'DM Mono',monospace; }
.utb-confirm-actions { display:flex;gap:8px; }
