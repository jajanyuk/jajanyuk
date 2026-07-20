import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyBKKsFvBJluM1PJfYCFsgR3ZfxF-JOKPKE",
  authDomain: "jajanyuk-2c7d8.firebaseapp.com",
  projectId: "jajanyuk-2c7d8",
  storageBucket: "jajanyuk-2c7d8.firebasestorage.app",
  messagingSenderId: "1085631977756",
  appId: "1:1085631977756:web:fe71dd21ce51fb3f7502d9",
  measurementId: "G-NQGH73XS1L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// COLLECTIONS
// ============================================================
const ordersCol   = collection(db, 'orders');
const depositsCol = collection(db, 'deposits');
const settingsCol = collection(db, 'settings');
const antrianCol  = collection(db, 'antrian');

// ============================================================
// STATE
// ============================================================
let orders         = [];
let deposits       = [];
let antrian        = [];
let currentPeriod  = 'daily';
let selectedBuyer  = null;
let qrisOverlayNominal = '';

// Date filter state
let antrianDateMode  = 'today';
let pesananDateMode  = 'today';
let tagihanDateMode  = 'today';

// Sort state
let pesananSortMode  = 'asc';
let pesananSortField = 'buyer';
let tagihanSortMode  = 'asc';
let tagihanSortField = 'name';
let ringSortMode     = 'asc';

// UTB state
let utbUserName = null;
let utbUserLokasi = null;

// ============================================================
// ADMIN STATE
// ============================================================
let isAdmin = false;
let pinBuffer = '';
const ADMIN_PIN = '3557';

window.openAdminModal = function() {
  pinBuffer = '';
  updatePinDots();
  document.getElementById('pinErrorMsg').textContent = '';
  document.getElementById('adminModalIcon').textContent = isAdmin ? '🔓' : '🔐';
  document.getElementById('adminModalTitle').textContent = isAdmin ? 'Keluar dari Admin' : 'Masuk sebagai Admin';
  document.getElementById('adminModalSub').textContent = isAdmin ? 'Masukkan PIN untuk konfirmasi keluar' : 'Masukkan PIN untuk mengakses semua fitur';
  document.getElementById('adminModal').classList.add('show');
};

window.pinPress = function(digit) {
  if (pinBuffer.length >= 4) return;
  pinBuffer += digit;
  updatePinDots();
  if (pinBuffer.length === 4) {
    setTimeout(checkPin, 120);
  }
};

window.pinDelete = function() {
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots();
  document.getElementById('pinErrorMsg').textContent = '';
};

window.pinClear = function() {
  pinBuffer = '';
  updatePinDots();
  document.getElementById('adminModal').classList.remove('show');
};

function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('dot' + i);
    dot.classList.toggle('filled', i < pinBuffer.length);
    dot.classList.remove('error');
  }
}

function checkPin() {
  if (pinBuffer === ADMIN_PIN) {
    isAdmin = !isAdmin;
    document.getElementById('adminModal').classList.remove('show');
    applyAdminAccess();
    showToast(isAdmin ? '🔓 Mode Admin aktif!' : '🔒 Keluar dari Admin', isAdmin ? '🛡️' : '👤');
  } else {
    for (let i = 0; i < 4; i++) document.getElementById('dot' + i).classList.add('error');
    document.getElementById('pinErrorMsg').textContent = 'PIN salah, coba lagi';
    setTimeout(() => {
      pinBuffer = '';
      updatePinDots();
      document.getElementById('pinErrorMsg').textContent = '';
    }, 900);
  }
}

function applyAdminAccess() {
  const adminTabs = ['navAntrian', 'navPesanan', 'navDeposit', 'navRingkasan', 'navTagihan'];
  const badge = document.getElementById('adminBadge');
  if (isAdmin) {
    adminTabs.forEach(id => document.getElementById(id).classList.remove('locked'));
    badge.textContent = '🛡️ Admin';
    badge.className = 'admin-badge is-admin';
    switchTab('antrian');
  } else {
    adminTabs.forEach(id => document.getElementById(id).classList.add('locked'));
    badge.textContent = '👤 User';
    badge.className = 'admin-badge is-user';
    switchTab('qris');
  }
}

// ============================================================
// HELPERS
// ============================================================
function rupiah(n) { return 'Rp ' + Math.round(n).toLocaleString('id-ID'); }
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
function initials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().substr(0, 2); }

// ============================================================
// DATE FILTER HELPERS
// ============================================================
function getDateOffset(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getFilterDates(mode, fromId, toId) {
  const t = today();
  if (mode === 'today')     return { from: t, to: t };
  if (mode === 'yesterday') { const y = getDateOffset(1); return { from: y, to: y }; }
  if (mode === 'week')      return { from: getDateOffset(6), to: t };
  if (mode === 'all')       return null;
  if (mode === 'custom') {
    const from = document.getElementById(fromId)?.value;
    const to   = document.getElementById(toId)?.value;
    if (from && to) return { from, to };
    if (from)       return { from, to: t };
    return null;
  }
  return { from: t, to: t };
}

function filterByDateRange(items, range) {
  if (!range) return items;
  return items.filter(o => o.date >= range.from && o.date <= range.to);
}

function setDateFilterShortcuts(mode, prefix) {
  ['Today','Yesterday','Week','All','Custom'].forEach(s => {
    const el = document.getElementById(prefix + 'Shortcut' + s);
    if (el) el.classList.toggle('active', mode === s.toLowerCase());
  });
  const customWrap = document.getElementById(prefix + 'CustomDateWrap');
  if (customWrap) customWrap.style.display = mode === 'custom' ? 'block' : 'none';
  const badge = document.getElementById(prefix + 'FilterBadge');
  if (badge) badge.style.display = mode !== 'today' ? 'inline-flex' : 'none';
}

window.setAntrianDateFilter = function(mode, btn) {
  antrianDateMode = mode;
  setDateFilterShortcuts(mode, 'antrian');
  renderAntrian();
};

window.setPesananDateFilter = function(mode, btn) {
  pesananDateMode = mode;
  setDateFilterShortcuts(mode, 'pesanan');
  window.renderOrders();
};

window.setTagihanDateFilter = function(mode, btn) {
  tagihanDateMode = mode;
  setDateFilterShortcuts(mode, 'tagihan');
  window.renderBuyerList();
};

function showToast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  t.textContent = icon + ' ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function setSyncBadge(status) {
  const b = document.getElementById('syncBadge');
  b.className = 'sync-badge';
  if (status === 'ok')      { b.classList.add('sync-ok');      b.textContent = '☁️ Tersinkron'; }
  else if (status === 'loading') { b.classList.add('sync-loading'); b.innerHTML = '<span class="spin">⏳</span> Menyimpan'; }
  else                      { b.classList.add('sync-err');     b.textContent = '❌ Gagal Sync'; }
}

function updateHeaderDate() {
  const d = new Date();
  document.getElementById('headerDate').textContent =
    d.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  const dbgEl = document.getElementById('todayDebug');
  if (dbgEl) dbgEl.textContent = '(' + today() + ')';
}
updateHeaderDate();

// ============================================================
// REALTIME LISTENERS (lazy: hanya start saat tab terkait dibuka)
// ============================================================
let ordersListenerStarted = false;
let depositsListenerStarted = false;
let antrianListenerStarted = false;

function startOrdersListener() {
  if (ordersListenerStarted) return;
  ordersListenerStarted = true;
  onSnapshot(query(ordersCol, orderBy('createdAt', 'asc')), snap => {
    orders = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    renderOrders();
    renderDeposits();
    setSyncBadge('ok');
    updateDeleteDateInfo();
  }, err => {
    console.error('Orders listener error:', err);
    setSyncBadge('err');
  });
}

function startDepositsListener() {
  if (depositsListenerStarted) return;
  depositsListenerStarted = true;
  onSnapshot(query(depositsCol, orderBy('createdAt', 'asc')), snap => {
    deposits = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    renderDeposits();
  }, err => console.error('Deposits listener error:', err));
}

function startAntrianListener() {
  if (antrianListenerStarted) return;
  antrianListenerStarted = true;
  onSnapshot(query(antrianCol, orderBy('createdAt', 'asc')), snap => {
    antrian = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    renderAntrian();
    if (document.getElementById('tab-utb').classList.contains('active')) renderUtb();
  }, err => console.error('Antrian listener error:', err));
}

// ============================================================
// TAB SWITCHING
// ============================================================
window.switchTab = function(name) {
  const adminOnlyTabs = ['antrian', 'pesanan', 'deposit', 'ringkasan', 'tagihan'];
  if (!isAdmin && adminOnlyTabs.includes(name)) {
    showToast('Login sebagai Admin untuk akses tab ini', '🔒');
    return;
  }

  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');

  const navMap = { antrian: 'navAntrian', pesanan: 'navPesanan', deposit: 'navDeposit', ringkasan: 'navRingkasan', tagihan: 'navTagihan', utb: 'navUtb', qris: 'navQris' };
  const navEl = document.getElementById(navMap[name]);
  if (navEl) {
    navEl.classList.add('active');
    navEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Load data on-demand: hanya start listener Firestore untuk tab yang baru dibuka
  if (name === 'antrian')   { startAntrianListener(); renderAntrian(); }
  if (name === 'pesanan')   { startOrdersListener(); startDepositsListener(); window.renderOrders(); }
  if (name === 'ringkasan') { startOrdersListener(); renderSummary(); }
  if (name === 'tagihan')   { startOrdersListener(); renderBuyerList(); }
  if (name === 'deposit')   { startDepositsListener(); startOrdersListener(); renderDeposits(); }
  if (name === 'utb')       { startAntrianListener(); renderUtb(); }
  if (name === 'qris')      renderQris();
};

// ============================================================
// DELETE ORDERS BY DATE
// ============================================================
window.deleteOrdersByDate = async function() {
  const from = document.getElementById('deleteDateFrom').value;
  const to = document.getElementById('deleteDateTo').value;

  if (!from || !to) {
    showToast('Pilih rentang tanggal terlebih dahulu!', '⚠️');
    return;
  }

  if (from > to) {
    showToast('Tanggal "Dari" harus lebih awal dari "Sampai"', '⚠️');
    return;
  }

  // Count orders in range
  const toDelete = orders.filter(o => o.date >= from && o.date <= to);
  if (!toDelete.length) {
    showToast(`Tidak ada pesanan dari ${from} sampai ${to}`, 'ℹ️');
    return;
  }

  const totalAmount = toDelete.reduce((s, o) => s + (o.price || 0) * (o.qty || 1), 0);
  const confirmMsg =
    `⚠️ PERINGATAN!\n\n` +
    `Anda akan menghapus ${toDelete.length} pesanan\n` +
    `dari ${from} sampai ${to}\n` +
    `Total nominal: ${rupiah(totalAmount)}\n\n` +
    `Aksi ini TIDAK BISA DIBATALKAN!\n\n` +
    `Ketik "HAPUS" untuk konfirmasi.`;

  const userInput = prompt(confirmMsg);
  if (userInput !== 'HAPUS') {
    showToast('Penghapusan dibatalkan', 'ℹ️');
    return;
  }

  const btn = document.getElementById('btnDeleteByDate');
  btn.disabled = true;
  btn.textContent = '⏳ Menghapus...';
  setSyncBadge('loading');

  try {
    // Hitung ulang dari cache TERBARU (bisa saja ada order baru masuk
    // selama prompt konfirmasi tampil), supaya tidak menghapus data usang
    // atau melewatkan order baru yang masuk ke rentang tanggal yang sama.
    const freshToDelete = orders.filter(o => o.date >= from && o.date <= to);
    await Promise.all(freshToDelete.map(o => deleteDoc(doc(db, 'orders', o.firestoreId))));
    showToast(`✅ ${freshToDelete.length} pesanan berhasil dihapus!`, '🗑️');
    setSyncBadge('ok');
    updateDeleteDateInfo();
  } catch(e) {
    console.error('Delete error:', e);
    showToast('Gagal menghapus pesanan!', '❌');
    setSyncBadge('err');
  } finally {
    btn.disabled = false;
    btn.textContent = '🗑️ Hapus';
  }
};

function updateDeleteDateInfo() {
  const from = document.getElementById('deleteDateFrom')?.value;
  const to = document.getElementById('deleteDateTo')?.value;
  const info = document.getElementById('deleteDateInfo');
  if (!info) return;

  if (!from || !to) {
    info.textContent = 'Masukkan rentang tanggal untuk menghapus pesanan';
    info.style.color = 'var(--text3)';
    return;
  }

  const count = orders.filter(o => o.date >= from && o.date <= to).length;
  const total = orders.filter(o => o.date >= from && o.date <= to)
    .reduce((s, o) => s + (o.price || 0) * (o.qty || 1), 0);

  if (count === 0) {
    info.textContent = `📭 Tidak ada pesanan dari ${from} sampai ${to}`;
    info.style.color = 'var(--text3)';
  } else {
    info.innerHTML = `📋 <strong>${count}</strong> pesanan ditemukan · Total <strong>${rupiah(total)}</strong> · ${count > 0 ? '⚠️ Siap dihapus?' : ''}`;
    info.style.color = count > 0 ? 'var(--red)' : 'var(--text3)';
  }
}

// ============================================================
// PESANAN — CRUD
// ============================================================
window.addOrder = async function() {
  const buyer = document.getElementById('inBuyer').value.trim();
  const item  = document.getElementById('inItem').value.trim();
  const price = parseFloat(document.getElementById('inPrice').value);
  const qty   = parseInt(document.getElementById('inQty').value) || 1;
  const note  = document.getElementById('inNote').value.trim();

  if (!buyer || !item || !price) {
    showToast('Lengkapi nama pembeli, item, dan harga!', '⚠️'); return;
  }

  const btn = document.getElementById('btnAddOrder');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';
  setSyncBadge('loading');

  try {
    await addDoc(ordersCol, {
      buyer, item, price, qty, note,
      paid: false,
      date: today(),
      createdAt: Date.now()
    });

    document.getElementById('inItem').value  = '';
    document.getElementById('inPrice').value = '';
    document.getElementById('inQty').value   = '1';
    document.getElementById('inNote').value  = '';
    showToast(item + ' ditambahkan!');
  } catch(e) {
    console.error(e);
    showToast('Gagal menyimpan. Cek koneksi!', '❌');
    setSyncBadge('err');
  } finally {
    btn.disabled = false;
    btn.textContent = '➕ Tambah Pesanan';
  }
};

window.deleteOrder = async function(firestoreId) {
  if (!confirm('Hapus pesanan ini?')) return;
  setSyncBadge('loading');
  try {
    await deleteDoc(doc(db, 'orders', firestoreId));
    showToast('Pesanan dihapus', '🗑️');
  } catch(e) {
    showToast('Gagal hapus!', '❌'); setSyncBadge('err');
  }
};

// ------------------------------------------------------------
// togglePaid — DIPERBAIKI: seluruh baca+tulis status lunas & saldo
// deposit sekarang berjalan di dalam runTransaction() sehingga
// selalu membaca nilai TERBARU dari server (bukan cache lokal) saat
// commit. Ini mencegah "lost update" jika dua admin menandai lunas
// pesanan berbeda dari pembeli yang sama secara bersamaan, atau jika
// tombol tidak sengaja terpicu dua kali sebelum listener sempat
// menyegarkan cache.
// ------------------------------------------------------------
window.togglePaid = async function(firestoreId) {
  const o = orders.find(o => o.firestoreId === firestoreId);
  if (!o) return;

  // -------- BATALKAN STATUS LUNAS --------
  if (o.paid) {
    setSyncBadge('loading');
    try {
      const itemTotal = (o.price || 0) * (o.qty || 1);
      await runTransaction(db, async (tx) => {
        const orderRef = doc(db, 'orders', firestoreId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) throw new Error('not-found');
        const orderData = orderSnap.data();
        if (!orderData.paid) return; // sudah dibatalkan oleh proses lain, tidak perlu apa-apa

        let depRef = null;
        let depSnap = null;
        if (orderData.paidViaDeposit) {
          const bName = (orderData.buyer || '').toLowerCase();
          const relDepCache = deposits
            .filter(d => d.name && d.name.toLowerCase() === bName && (d.usedAmount || 0) > 0)
            .sort((a, b) => b.createdAt - a.createdAt)[0];
          if (relDepCache) {
            depRef = doc(db, 'deposits', relDepCache.firestoreId);
            depSnap = await tx.get(depRef); // baca fresh dari server (WAJIB sebelum tx.update)
          }
        }

        if (depRef && depSnap && depSnap.exists()) {
          const currentUsed = depSnap.data().usedAmount || 0;
          const newUsed = Math.max(0, currentUsed - itemTotal);
          tx.update(depRef, { usedAmount: newUsed });
        }
        tx.update(orderRef, { paid: false, paidViaDeposit: false });
      });
      showToast('Ditandai belum bayar');
      setSyncBadge('ok');
    } catch(e) {
      console.error('togglePaid (batal lunas) error:', e);
      showToast('Gagal update!', '❌'); setSyncBadge('err');
    }
    return;
  }

  // -------- TANDAI LUNAS --------
  const buyerName     = (o.buyer || '').toLowerCase();
  const buyerDeposits = deposits.filter(d => d.name && d.name.toLowerCase() === buyerName);
  const itemTotal     = (o.price || 0) * (o.qty || 1);
  const sisaDep       = buyerDeposits.reduce((s, d) => s + getDepositSisaById(d), 0);

  // Dialog konfirmasi tetap pakai data cache untuk UX cepat.
  // Nilai FINAL yang benar-benar dipotong tetap dihitung ulang dari
  // data server di dalam transaksi di bawah.
  let useDeposit = false;
  if (buyerDeposits.length > 0 && sisaDep > 0) {
    const konfirmasi = confirm(
      `💰 ${o.buyer} punya deposit!\n` +
      `Sisa deposit: ${rupiah(sisaDep)}\n` +
      `Harga item: ${rupiah(itemTotal)}\n\n` +
      `Potong deposit secara otomatis?\n` +
      `(Tekan OK = pakai deposit, Batal = bayar manual)`
    );
    if (konfirmasi) {
      useDeposit = true;
      if (sisaDep < itemTotal) {
        const kurang = itemTotal - sisaDep;
        const lanjut = confirm(
          `⚠️ Deposit tidak cukup!\n` +
          `Sisa deposit: ${rupiah(sisaDep)}\n` +
          `Kurang: ${rupiah(kurang)}\n\n` +
          `Tetap tandai lunas (pakai deposit + bayar sisanya)?`
        );
        if (!lanjut) return;
      }
    }
  }

  setSyncBadge('loading');
  try {
    let sisaSetelahFresh = null;
    let alreadyPaid = false;

    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', firestoreId);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw new Error('not-found');
      const orderData = orderSnap.data();
      if (orderData.paid) { alreadyPaid = true; return; } // sudah dilunasi proses lain

      const freshItemTotal = (orderData.price || 0) * (orderData.qty || 1);

      if (useDeposit) {
        // Baca ULANG semua deposit pembeli ini langsung dari server
        // (bukan dari array `deposits` cache) sebelum memutuskan potongan.
        const depRefs = buyerDeposits.map(d => doc(db, 'deposits', d.firestoreId));
        const depSnaps = await Promise.all(depRefs.map(r => tx.get(r)));

        const depFresh = depSnaps
          .map((snap, i) => snap.exists() ? { ref: depRefs[i], ...snap.data() } : null)
          .filter(Boolean)
          .sort((a, b) => a.createdAt - b.createdAt);

        const totalSisaFresh = depFresh.reduce(
          (s, d) => s + Math.max(0, (d.amount || 0) - (d.usedAmount || 0)), 0
        );

        let sisa = freshItemTotal;
        for (const dep of depFresh) {
          if (sisa <= 0) break;
          const depSisa = Math.max(0, (dep.amount || 0) - (dep.usedAmount || 0));
          if (depSisa <= 0) continue;
          const dipotong = Math.min(depSisa, sisa);
          tx.update(dep.ref, { usedAmount: (dep.usedAmount || 0) + dipotong });
          sisa -= dipotong;
        }
        tx.update(orderRef, { paid: true, paidViaDeposit: true });
        sisaSetelahFresh = Math.max(0, totalSisaFresh - freshItemTotal);
      } else {
        tx.update(orderRef, { paid: true, paidViaDeposit: false });
      }
    });

    if (alreadyPaid) {
      showToast('Pesanan ini sudah ditandai lunas', 'ℹ️');
    } else if (useDeposit) {
      showToast(`✓ Lunas pakai deposit! Sisa: ${rupiah(sisaSetelahFresh ?? 0)}`);
    } else {
      showToast('Ditandai sudah bayar ✓');
    }
    setSyncBadge('ok');
  } catch(e) {
    console.error('togglePaid (tandai lunas) error:', e);
    showToast('Gagal update!', '❌'); setSyncBadge('err');
  }
};

window.setPesananSortField = function(field) {
  if (pesananSortField === field) {
    pesananSortMode = pesananSortMode === 'asc' ? 'desc' : 'asc';
  } else {
    pesananSortField = field;
    pesananSortMode = 'asc';
  }
  updatePesananSortBtn();
  window.renderOrders();
};

function updatePesananSortBtn() {
  const buyerBtn = document.getElementById('pesananSortBuyerBtn');
  const itemBtn  = document.getElementById('pesananSortItemBtn');
  if (!buyerBtn || !itemBtn) return;

  const dirIcon = pesananSortMode === 'asc' ? '↑Z' : '↓A';
  const dirLabel = pesananSortMode === 'asc' ? 'A' : 'Z';

  buyerBtn.classList.toggle('active', pesananSortField === 'buyer');
  itemBtn.classList.toggle('active', pesananSortField === 'item');

  buyerBtn.textContent = pesananSortField === 'buyer'
    ? `👤 Pembeli ${pesananSortMode === 'asc' ? 'A↑Z' : 'Z↓A'}`
    : '👤 Pembeli';
  itemBtn.textContent = pesananSortField === 'item'
    ? `🍱 Item ${pesananSortMode === 'asc' ? 'A↑Z' : 'Z↓A'}`
    : '🍱 Item';
}

window.toggleTagihanSort = function() {
  tagihanSortMode = tagihanSortMode === 'asc' ? 'desc' : 'asc';
  updateTagihanSortBtn();
  window.renderBuyerList();
};

window.onTagihanSortChange = function() {
  const sel = document.getElementById('tagihanSortField');
  if (sel) { tagihanSortField = sel.value; tagihanSortMode = 'asc'; }
  updateTagihanSortBtn();
  window.renderBuyerList();
};

function updateTagihanSortBtn() {
  const btn = document.getElementById('tagihanSortBtn');
  if (!btn) return;
  const labels = {
    name:   tagihanSortMode === 'asc' ? 'A↑Z' : 'Z↓A',
    total:  tagihanSortMode === 'asc' ? '💰↑' : '💰↓',
    unpaid: tagihanSortMode === 'asc' ? '⏳↑' : '⏳↓',
    count:  tagihanSortMode === 'asc' ? '#↑'  : '#↓'
  };
  btn.textContent = labels[tagihanSortField] || (tagihanSortMode === 'asc' ? 'A↑Z' : 'Z↓A');
}

window.toggleRingSummarySort = function() {
  ringSortMode = ringSortMode === 'asc' ? 'desc' : 'asc';
  const btn = document.getElementById('ringSortBtn');
  if (btn) {
    btn.textContent = ringSortMode === 'asc' ? 'A↑Z' : 'Z↓A';
  }
  renderSummary();
};

window.renderOrders = function renderOrders() {
  const filterBuyerEl  = document.getElementById('filterBuyer');
  const filterStatusEl = document.getElementById('filterStatus');
  const filterBuyer    = filterBuyerEl  ? filterBuyerEl.value.toLowerCase().trim() : '';
  const filterStatus   = filterStatusEl ? filterStatusEl.value : '';

  const dateRange = getFilterDates(pesananDateMode, 'pesananDateFrom', 'pesananDateTo');
  let filtered = filterByDateRange(orders, dateRange);

  if (filterBuyer) {
    filtered = filtered.filter(o =>
      (o.buyer || '').toLowerCase().includes(filterBuyer)
    );
  }

  if (filterStatus === 'paid')   filtered = filtered.filter(o => o.paid);
  if (filterStatus === 'unpaid') filtered = filtered.filter(o => !o.paid);

  filtered = filtered.slice().sort((a, b) => {
    const fieldA = pesananSortField === 'item' ? (a.item || '') : (a.buyer || '');
    const fieldB = pesananSortField === 'item' ? (b.item || '') : (b.buyer || '');
    const na = fieldA.toLowerCase();
    const nb = fieldB.toLowerCase();
    if (na !== nb) return pesananSortMode === 'asc' ? na.localeCompare(nb, 'id') : nb.localeCompare(na, 'id');
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  document.getElementById('orderCount').textContent = filtered.length + ' item';

  const badge = document.getElementById('pesananFilterBadge');
  if (badge) badge.style.display = (pesananDateMode !== 'today' || filterBuyer || filterStatus) ? 'inline-flex' : 'none';

  const list = document.getElementById('orderList');
  if (!list) return;

  if (filtered.length === 0) {
    const msg = (filterBuyer || filterStatus || pesananDateMode !== 'today')
      ? 'Tidak ada pesanan yang cocok dengan filter'
      : 'Belum ada pesanan hari ini';
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🍱</div><div class="empty-text">${msg}</div></div>`;
    return;
  }

  list.innerHTML = filtered.map(o => {
    const hasDep = deposits.some(d => d.name && d.name.toLowerCase() === (o.buyer || '').toLowerCase());
    const depBadge = o.paidViaDeposit
      ? `<span class="badge badge-deposit">💰 Deposit</span>`
      : (hasDep && !o.paid ? `<span class="badge badge-deposit-used" title="Punya deposit">💳</span>` : '');

    // Check if this order is in the current delete range
    const deleteFrom = document.getElementById('deleteDateFrom')?.value;
    const deleteTo = document.getElementById('deleteDateTo')?.value;
    const inDeleteRange = deleteFrom && deleteTo && o.date >= deleteFrom && o.date <= deleteTo;

    return `
    <div class="order-item ${o.paid ? 'paid' : ''} ${inDeleteRange ? 'pending-delete' : ''}">
      <div class="order-item-info">
        <div class="order-item-name">
          ${o.item || '-'}
          <span class="badge ${o.paid ? 'badge-paid' : 'badge-unpaid'}">${o.paid ? '✓ Lunas' : '⏳ Belum'}</span>
          ${depBadge}
          ${inDeleteRange ? '<span class="badge" style="background:var(--red-light);color:var(--red);border:1px solid #FCA5A5">🗑️ Akan Dihapus</span>' : ''}
        </div>
        <div class="order-item-buyer">👤 ${o.buyer || '-'}${o.qty > 1 ? ' · x' + o.qty : ''}</div>
        ${o.note ? '<div class="order-item-details">📝 ' + o.note + '</div>' : ''}
        ${pesananDateMode !== 'today' ? '<div class="order-item-date">📅 ' + (o.date || '-') + '</div>' : ''}
        <div class="order-item-actions">
          <button class="btn btn-sm ${o.paid ? 'btn-warning' : 'btn-success'}" onclick="togglePaid('${o.firestoreId}')">
            ${o.paid ? '↩ Batal Lunas' : (deposits.some(d => d.name && d.name.toLowerCase() === (o.buyer||'').toLowerCase()) ? '💰 Tandai Lunas' : '✓ Tandai Lunas')}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteOrder('${o.firestoreId}')">🗑 Hapus</button>
        </div>
      </div>
      <div class="order-item-price">${rupiah((o.price || 0) * (o.qty || 1))}</div>
    </div>`;
  }).join('');

  updateDeleteDateInfo();
}

// ============================================================
// INPUT MODE
// ============================================================
window.setInputMode = function(mode) {
  const isManual = mode === 'manual';
  document.getElementById('formManual').style.display = isManual ? 'block' : 'none';
  document.getElementById('formBulk').style.display   = isManual ? 'none'  : 'block';
  document.getElementById('btnModeManual').style.cssText = isManual
    ? 'font-size:12px;padding:6px 10px;background:var(--brand);color:white;border-color:var(--brand)'
    : 'font-size:12px;padding:6px 10px';
  document.getElementById('btnModeBulk').style.cssText = !isManual
    ? 'font-size:12px;padding:6px 10px;background:var(--brand);color:white;border-color:var(--brand)'
    : 'font-size:12px;padding:6px 10px';
  if (!isManual) document.getElementById('bulkPreview').style.display = 'none';
};

function parseBulkLine(line) {
  const raw   = line.trim();
  if (!raw) return null;
  const parts = raw.split(/\s*-\s*/);
  if (parts.length < 3) return { error: `Format salah: "${raw}"` };
  const buyer    = parts[parts.length - 1].trim();
  const priceRaw = parts[parts.length - 2].trim();
  const itemName = parts.slice(0, parts.length - 2).join(' - ').trim();
  if (!itemName) return { error: `Nama item kosong: "${raw}"` };
  if (!buyer)    return { error: `Nama pembeli kosong: "${raw}"` };
  const priceClean = priceRaw.replace(/[Rp\s\.]/g, '').replace(',', '.');
  const price      = parseFloat(priceClean);
  if (isNaN(price) || price <= 0) return { error: `Harga tidak valid "${priceRaw}"` };
  return { item: itemName, price, buyer, raw };
}

window.previewBulk = function() {
  const lines   = document.getElementById('bulkInput').value.split('\n').filter(l => l.trim());
  if (!lines.length) { showToast('Input masih kosong!', '⚠️'); return; }
  const results = lines.map(parseBulkLine).filter(Boolean);
  const valid   = results.filter(r => !r.error);
  const invalid = results.filter(r => r.error);

  let html = `<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">
    Preview: <span style="color:var(--green-dark)">${valid.length} valid</span>${invalid.length > 0 ? ` · <span style="color:var(--red)">${invalid.length} error</span>` : ''}
  </div>`;
  results.forEach(r => {
    if (r.error) {
      html += `<div class="bulk-row invalid"><div class="bulk-row-info"><div class="bulk-row-name">⚠️ Error</div><div class="bulk-row-buyer">${r.error}</div></div></div>`;
    } else {
      html += `<div class="bulk-row valid"><div class="bulk-row-info"><div class="bulk-row-name">${r.item}</div><div class="bulk-row-buyer">👤 ${r.buyer}</div></div><div class="bulk-row-price">${rupiah(r.price)}</div></div>`;
    }
  });

  const preview = document.getElementById('bulkPreview');
  preview.innerHTML = html;
  preview.style.display = 'block';
};

window.submitBulk = async function() {
  const lines   = document.getElementById('bulkInput').value.split('\n').filter(l => l.trim());
  if (!lines.length) { showToast('Input masih kosong!', '⚠️'); return; }
  const results = lines.map(parseBulkLine).filter(Boolean);
  const valid   = results.filter(r => !r.error);
  const invalid = results.filter(r => r.error);
  if (!valid.length) { showToast('Tidak ada data valid!', '⚠️'); return; }
  if (invalid.length > 0) {
    if (!confirm(`${invalid.length} baris punya format salah dan akan dilewati. Lanjut masukkan ${valid.length} pesanan yang valid?`)) return;
  }

  const btn = document.getElementById('btnSubmitBulk');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';
  setSyncBadge('loading');

  try {
    const now = Date.now();
    await Promise.all(valid.map((r, i) =>
      addDoc(ordersCol, {
        buyer: r.buyer, item: r.item, price: r.price, qty: 1, note: '',
        paid: false, date: today(), createdAt: now + i
      })
    ));
    document.getElementById('bulkInput').value = '';
    document.getElementById('bulkPreview').style.display = 'none';
    showToast(`${valid.length} pesanan berhasil ditambahkan! 🎉`);
  } catch(e) {
    showToast('Gagal menyimpan bulk!', '❌'); setSyncBadge('err');
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Masukkan Semua';
  }
};

// ============================================================
// ANTRIAN — CRUD + SYNC KE PESANAN
// ============================================================

window.setAntrianMode = function(mode) {
  const isManual = mode === 'manual';
  document.getElementById('antrianFormManual').style.display = isManual ? 'block' : 'none';
  document.getElementById('antrianFormBulk').style.display   = isManual ? 'none'  : 'block';
  document.getElementById('btnAntrianManual').style.cssText  = isManual
    ? 'font-size:12px;padding:6px 10px;background:var(--brand);color:white;border-color:var(--brand)'
    : 'font-size:12px;padding:6px 10px';
  document.getElementById('btnAntrianBulk').style.cssText = !isManual
    ? 'font-size:12px;padding:6px 10px;background:var(--brand);color:white;border-color:var(--brand)'
    : 'font-size:12px;padding:6px 10px';
  if (!isManual) document.getElementById('antrianBulkPreview').style.display = 'none';
};

window.addAntrian = async function() {
  const item  = document.getElementById('antrianItem').value.trim();
  const price = parseFloat(document.getElementById('antrianPrice').value);
  const qty   = parseInt(document.getElementById('antrianQty').value) || 1;
  const note  = document.getElementById('antrianNote').value.trim();
  if (!item || !price) { showToast('Lengkapi nama item dan harga!', '⚠️'); return; }

  const btn = document.getElementById('btnAddAntrian');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';
  setSyncBadge('loading');
  try {
    await addDoc(antrianCol, { item, price, qty, note, buyer: '', date: today(), sent: false, claimedBy: null, createdAt: Date.now() });
    document.getElementById('antrianItem').value  = '';
    document.getElementById('antrianPrice').value = '';
    document.getElementById('antrianQty').value   = '1';
    document.getElementById('antrianNote').value  = '';
    showToast(item + ' ditambahkan ke antrian!');
    setSyncBadge('ok');
  } catch(e) {
    showToast('Gagal menyimpan!', '❌'); setSyncBadge('err');
  } finally {
    btn.disabled = false;
    btn.textContent = '➕ Tambah ke Antrian';
  }
};

function parseAntrianBulkLine(line) {
  const raw = line.trim();
  if (!raw) return null;
  const parts = raw.split(/\s*-\s*/);
  if (parts.length < 2) return { error: 'Format salah: "' + raw + '"' };

  let item, priceRaw, buyer = '';
  if (parts.length === 2) {
    item     = parts[0].trim();
    priceRaw = parts[1].trim();
  } else {
    const lastPart       = parts[parts.length - 1].trim();
    const secondLastPart = parts[parts.length - 2].trim();
    const secondLastNum  = parseFloat(secondLastPart.replace(/[Rp\s\.]/g, '').replace(',', '.'));
    if (!isNaN(secondLastNum) && secondLastNum > 0) {
      buyer    = lastPart;
      priceRaw = secondLastPart;
      item     = parts.slice(0, parts.length - 2).join(' - ').trim();
    } else {
      priceRaw = lastPart;
      item     = parts.slice(0, parts.length - 1).join(' - ').trim();
    }
  }

  if (!item) return { error: 'Nama item kosong: "' + raw + '"' };
  const priceClean = priceRaw.replace(/[Rp\s\.]/g, '').replace(',', '.');
  const price      = parseFloat(priceClean);
  if (isNaN(price) || price <= 0) return { error: 'Harga tidak valid "' + priceRaw + '"' };
  return { item, price, buyer, raw };
}

window.previewAntrianBulk = function() {
  const lines   = document.getElementById('antrianBulkInput').value.split('\n').filter(l => l.trim());
  if (!lines.length) { showToast('Input masih kosong!', '⚠️'); return; }
  const results = lines.map(parseAntrianBulkLine).filter(Boolean);
  const valid   = results.filter(r => !r.error);
  const invalid = results.filter(r => r.error);

  let html = '<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:8px">Preview: <span style="color:var(--green-dark)">' + valid.length + ' valid</span>'
    + (invalid.length > 0 ? ' · <span style="color:var(--red)">' + invalid.length + ' error</span>' : '') + '</div>';
  results.forEach(r => {
    if (r.error) {
      html += '<div class="bulk-row invalid"><div class="bulk-row-info"><div class="bulk-row-name">⚠️ Error</div><div class="bulk-row-buyer">' + r.error + '</div></div></div>';
    } else {
      html += '<div class="bulk-row valid"><div class="bulk-row-info"><div class="bulk-row-name">' + r.item + '</div><div class="bulk-row-buyer">' + (r.buyer ? '👤 ' + r.buyer : '— belum ada nama') + '</div></div><div class="bulk-row-price">' + rupiah(r.price) + '</div></div>';
    }
  });

  const preview = document.getElementById('antrianBulkPreview');
  preview.innerHTML = html;
  preview.style.display = 'block';
};

window.submitAntrianBulk = async function() {
  const lines   = document.getElementById('antrianBulkInput').value.split('\n').filter(l => l.trim());
  if (!lines.length) { showToast('Input masih kosong!', '⚠️'); return; }
  const results = lines.map(parseAntrianBulkLine).filter(Boolean);
  const valid   = results.filter(r => !r.error);
  const invalid = results.filter(r => r.error);
  if (!valid.length) { showToast('Tidak ada data valid!', '⚠️'); return; }
  if (invalid.length > 0 && !confirm(invalid.length + ' baris error akan dilewati. Lanjut masukkan ' + valid.length + ' item?')) return;

  const btn = document.getElementById('btnSubmitAntrianBulk');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';
  setSyncBadge('loading');
  try {
    const now = Date.now();
    await Promise.all(valid.map((r, i) =>
      addDoc(antrianCol, { item: r.item, price: r.price, qty: 1, note: '', buyer: r.buyer || '', date: today(), sent: !!r.buyer, claimedBy: r.buyer || null, createdAt: now + i })
    ));
    const withBuyer = valid.filter(r => r.buyer);
    if (withBuyer.length) {
      await Promise.all(withBuyer.map((r, i) =>
        addDoc(ordersCol, { buyer: r.buyer, item: r.item, price: r.price, qty: 1, note: '', paid: false, date: today(), createdAt: now + i })
      ));
    }
    document.getElementById('antrianBulkInput').value = '';
    document.getElementById('antrianBulkPreview').style.display = 'none';
    showToast(valid.length + ' item ditambahkan ke antrian! 🎉');
    setSyncBadge('ok');
  } catch(e) {
    showToast('Gagal menyimpan bulk!', '❌'); setSyncBadge('err');
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Masukkan Semua';
  }
};

// ------------------------------------------------------------
// sendAntrianToOrder — DIPERBAIKI: dibungkus runTransaction agar
// pembuatan order + penandaan `sent:true` pada item antrian terjadi
// atomik, dan tidak bisa dikirim dua kali (misal admin klik dua kali,
// atau item yang sama sudah dikirim admin lain / diklaim di UTB).
// ------------------------------------------------------------
window.sendAntrianToOrder = async function(firestoreId) {
  const inputEl = document.getElementById('antrianBuyerInput-' + firestoreId);
  const buyer   = inputEl ? inputEl.value.trim() : '';
  if (!buyer) { showToast('Isi nama pembeli dulu!', '⚠️'); inputEl && inputEl.focus(); return; }

  setSyncBadge('loading');
  try {
    let itemName = '';
    await runTransaction(db, async (tx) => {
      const antrianRef = doc(db, 'antrian', firestoreId);
      const snap = await tx.get(antrianRef);
      if (!snap.exists()) throw new Error('not-found');
      const data = snap.data();
      if (data.sent) throw new Error('already-sent');
      itemName = data.item;

      const newOrderRef = doc(ordersCol);
      tx.set(newOrderRef, {
        buyer,
        item: data.item,
        price: data.price,
        qty: data.qty || 1,
        note: data.note || '',
        paid: false,
        date: today(),
        createdAt: Date.now()
      });
      tx.update(antrianRef, { sent: true, buyer });
    });
    showToast(itemName + ' -> ' + buyer + ' dikirim ke Pesanan! ✓');
    setSyncBadge('ok');
  } catch(e) {
    if (e.message === 'already-sent') {
      showToast('Item ini sudah terkirim sebelumnya!', 'ℹ️');
    } else if (e.message === 'not-found') {
      showToast('Item antrian tidak ditemukan!', '❌');
    } else {
      console.error('sendAntrianToOrder error:', e);
      showToast('Gagal kirim!', '❌');
    }
    setSyncBadge('err');
  }
};

window.deleteAntrian = async function(firestoreId) {
  if (!confirm('Hapus item antrian ini?')) return;
  setSyncBadge('loading');
  try {
    await deleteDoc(doc(db, 'antrian', firestoreId));
    showToast('Item antrian dihapus', '🗑️');
    setSyncBadge('ok');
  } catch(e) {
    showToast('Gagal hapus!', '❌'); setSyncBadge('err');
  }
};

window.clearSentAntrian = async function() {
  const sent = antrian.filter(a => a.sent);
  if (!sent.length) { showToast('Tidak ada item terkirim', 'ℹ️'); return; }
  if (!confirm('Hapus ' + sent.length + ' item yang sudah terkirim ke Pesanan?')) return;
  setSyncBadge('loading');
  try {
    await Promise.all(sent.map(a => deleteDoc(doc(db, 'antrian', a.firestoreId))));
    showToast(sent.length + ' item antrian dibersihkan!');
    setSyncBadge('ok');
  } catch(e) {
    showToast('Gagal bersihkan!', '❌'); setSyncBadge('err');
  }
};

function renderAntrian() {
  const list      = document.getElementById('antrianList');
  const countEl   = document.getElementById('antrianCount');
  const clearBtn  = document.getElementById('btnClearAntrian');
  if (!list) return;

  const dateRange = getFilterDates(antrianDateMode, 'antrianDateFrom', 'antrianDateTo');
  const filtered  = filterByDateRange(antrian, dateRange);

  const pending = filtered.filter(a => !a.sent);
  const sent    = filtered.filter(a => a.sent);

  if (countEl) countEl.textContent = pending.length + ' item';
  if (clearBtn) clearBtn.style.display = sent.length ? 'inline-flex' : 'none';

  if (!filtered.length) {
    const msg = antrianDateMode !== 'today' ? 'Tidak ada item antrian pada tanggal ini' : 'Belum ada item di antrian';
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🗒️</div><div class="empty-text">' + msg + '</div></div>';
    return;
  }

  const renderItem = (a) => {
    const sentClass = a.sent ? ' antrian-sent' : '';
    const buyerVal  = a.buyer ? a.buyer : '';
    return `
      <div class="antrian-item${sentClass}" id="antrianItem-${a.firestoreId}">
        <div class="antrian-item-top">
          <div>
            <div class="antrian-item-name">${a.item || '-'}${a.qty > 1 ? ' <span style="font-size:12px;color:var(--text3)">x' + a.qty + '</span>' : ''}</div>
            ${a.note ? '<div style="font-size:11px;color:var(--text3);margin-top:2px">📝 ' + a.note + '</div>' : ''}
            ${antrianDateMode !== 'today' ? '<div style="font-size:11px;color:var(--text3);margin-top:2px">📅 ' + (a.date || '-') + '</div>' : ''}
            ${a.sent ? '<div style="font-size:11px;font-weight:700;color:var(--green-dark);margin-top:4px">✓ Terkirim ke: ' + a.buyer + '</div>' : (a.claimedBy ? '<div style="font-size:11px;font-weight:700;color:var(--amber);margin-top:4px">🧃 Dipilih di UTB oleh: ' + a.claimedBy + '</div>' : '')}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="antrian-item-price">${rupiah((a.price || 0) * (a.qty || 1))}</div>
            ${!a.sent ? '<button class="antrian-del-btn" onclick="deleteAntrian(\'' + a.firestoreId + '\')">✕</button>' : ''}
          </div>
        </div>
        ${!a.sent ? `
        <div class="antrian-buyer-row">
          <input type="text" class="antrian-buyer-input" id="antrianBuyerInput-${a.firestoreId}"
            placeholder="Ketik nama pembeli..." value="${buyerVal}" autocomplete="off"
            onkeydown="if(event.key==='Enter') sendAntrianToOrder('${a.firestoreId}')">
          <button class="antrian-send-btn" onclick="sendAntrianToOrder('${a.firestoreId}')">✓ Kirim</button>
        </div>` : ''}
      </div>`;
  };

  list.innerHTML = pending.map(renderItem).join('') +
    (sent.length ? '<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 8px">Sudah Terkirim</div>' + sent.map(renderItem).join('') : '');
}

// ============================================================
// UTB
// ============================================================
window.utbSetName = function() {
  const val = document.getElementById('utbNameInput').value.trim();
  if (!val) { showToast('Isi nama dulu!', '⚠️'); return; }

  let lokasi = '';
  while (!lokasi) {
    lokasi = prompt('📍 Masukkan lokasi / lantai kamu:');
    if (lokasi === null) {
      showToast('Lokasi/lantai wajib diisi untuk lanjut!', '⚠️');
      return; // batal, user harus klik tombol lagi
    }
    lokasi = lokasi.trim();
    if (!lokasi) showToast('Lokasi/lantai tidak boleh kosong!', '⚠️');
  }

  utbUserName  = val;
  utbUserLokasi = lokasi;
  document.getElementById('utbNameInput').value = '';
  renderUtb();
};

window.utbChangeName = async function() {
  const mine = antrian.filter(a => !a.sent && a.claimedBy === utbUserName);
  if (mine.length) {
    try { await Promise.all(mine.map(a => updateDoc(doc(db, 'antrian', a.firestoreId), { claimedBy: null }))); } catch(e) {}
  }
  utbUserName  = null;
  utbUserLokasi = null;
  renderUtb();
};

// ------------------------------------------------------------
// toggleUtbItem — DIPERBAIKI: klaim item sekarang atomik lewat
// runTransaction(). Sebelumnya pengecekan `a.claimedBy` memakai cache
// lokal, sehingga dua orang yang mencentang item yang sama dalam
// waktu berdekatan (sebelum listener sempat sinkron) bisa
// sama-sama lolos dan menimpa klaim satu sama lain. Sekarang
// klaim dibaca ulang dari server tepat sebelum ditulis.
// ------------------------------------------------------------
window.toggleUtbItem = async function(firestoreId, isChecked) {
  if (!utbUserName) return;

  if (isChecked) {
    let claimFailed = false;
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'antrian', firestoreId);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error('not-found');
        const data = snap.data();
        if (data.sent) { claimFailed = true; return; }
        if (data.claimedBy && data.claimedBy !== utbUserName) {
          claimFailed = true;
          return;
        }
        tx.update(ref, { claimedBy: utbUserName });
      });
      if (claimFailed) {
        showToast('Item ini baru saja diambil orang lain!', '⚠️');
      }
    } catch(e) {
      console.error('toggleUtbItem (claim) error:', e);
      showToast('Gagal pilih item, coba lagi!', '❌');
    } finally {
      renderUtb();
    }
  } else {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'antrian', firestoreId);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data();
        // Hanya batalkan klaim milik sendiri
        if (data.claimedBy === utbUserName) {
          tx.update(ref, { claimedBy: null });
        }
      });
    } catch(e) {
      console.error('toggleUtbItem (unclaim) error:', e);
    } finally {
      renderUtb();
    }
  }
};

window.openUtbConfirm = function() {
  if (!utbUserName) return;
  const mySelected = antrian.filter(a => !a.sent && a.claimedBy === utbUserName);
  if (!mySelected.length) { showToast('Belum ada item dipilih!', '⚠️'); return; }

document.getElementById('utbConfirmBuyerName').textContent = utbUserName + ' · 📍 ' + utbUserLokasi;
  const total = mySelected.reduce((s, a) => s + (a.price || 0) * (a.qty || 1), 0);
  document.getElementById('utbConfirmTotal').textContent = rupiah(total);
  document.getElementById('utbConfirmList').innerHTML = mySelected.map(a => `
    <div class="utb-confirm-item">
      <div>
        <div class="utb-confirm-item-name">${a.item || '-'}${a.qty > 1 ? ' x' + a.qty : ''}</div>
        ${a.note ? '<div class="utb-confirm-item-note">📝 ' + a.note + '</div>' : ''}
      </div>
      <div class="utb-confirm-item-price">${rupiah((a.price || 0) * (a.qty || 1))}</div>
    </div>`).join('');

  document.getElementById('utbConfirmModal').classList.add('show');
};

window.closeUtbConfirm = function() {
  document.getElementById('utbConfirmModal').classList.remove('show');
};

// ------------------------------------------------------------
// submitUtbOrder — DIPERBAIKI: setiap item diproses lewat
// runTransaction() tersendiri yang memvalidasi ULANG dari server
// bahwa item belum `sent` dan `claimedBy` masih milik user ini,
// sebelum membuat order + menandai `sent:true` secara atomik.
// Ini mencegah order dobel untuk 1 item antrian jika terjadi race
// (misal double-click, dua tab, atau item sempat direbut orang lain).
// ------------------------------------------------------------
window.submitUtbOrder = async function() {
  if (!utbUserName) return;
  const mySelected = antrian.filter(a => !a.sent && a.claimedBy === utbUserName);
  if (!mySelected.length) { showToast('Belum ada item dipilih!', '⚠️'); return; }

  const confirmBtn = document.getElementById('utbConfirmBtn');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '⏳ Mengirim...'; }
  setSyncBadge('loading');

  const successItems = [];
  const skippedItems = [];

  try {
    for (const a of mySelected) {
      try {
        await runTransaction(db, async (tx) => {
          const antrianRef = doc(db, 'antrian', a.firestoreId);
          const snap = await tx.get(antrianRef);
          if (!snap.exists()) throw new Error('skip');
          const data = snap.data();
          if (data.sent || data.claimedBy !== utbUserName) throw new Error('skip');

          const newOrderRef = doc(ordersCol);
          tx.set(newOrderRef, {
            buyer: utbUserName,
            item: data.item,
            price: data.price,
            qty: data.qty || 1,
            note: (data.note ? data.note + ' · ' : '') + '📍 ' + utbUserLokasi,
            paid: false,
            date: today(),
            createdAt: Date.now()
          });
          tx.update(antrianRef, { sent: true, buyer: utbUserName, claimedBy: utbUserName });
        });
        successItems.push(a.item);
      } catch(innerErr) {
        skippedItems.push(a.item);
      }
    }

    closeUtbConfirm();
    if (successItems.length && !skippedItems.length) {
      showToast('Pesanan kamu berhasil dikirim! 🎉');
    } else if (successItems.length && skippedItems.length) {
      showToast(`${successItems.length} item terkirim, ${skippedItems.length} dilewati (sudah tidak tersedia)`, '⚠️');
    } else {
      showToast('Semua item sudah tidak tersedia, coba pilih ulang', '❌');
    }
    setSyncBadge('ok');
  } catch(e) {
    console.error('submitUtbOrder error:', e);
    showToast('Gagal order, coba lagi!', '❌'); setSyncBadge('err');
  } finally {
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '✅ Kirim Pesanan'; }
  }
};

function updateUtbOrderBar() {
  const bar = document.getElementById('utbOrderBar');
  if (!bar) return;
  if (!utbUserName) { bar.style.display = 'none'; return; }
  const mySelected = antrian.filter(a => !a.sent && a.claimedBy === utbUserName);
  if (mySelected.length > 0) {
    bar.style.display = 'block';
    document.getElementById('utbSelectedCount').textContent = mySelected.length;
    document.getElementById('utbSelectedTotal').textContent = rupiah(mySelected.reduce((s, a) => s + (a.price || 0) * (a.qty || 1), 0));
  } else {
    bar.style.display = 'none';
  }
}

function renderUtb() {
  const namePrompt = document.getElementById('utbNamePrompt');
  const main       = document.getElementById('utbMain');
  if (!namePrompt || !main) return;

  if (!utbUserName) {
    namePrompt.style.display = 'block';
    main.style.display = 'none';
    document.getElementById('utbOrderBar').style.display = 'none';
    return;
  }

  namePrompt.style.display = 'none';
  main.style.display = 'block';
  document.getElementById('utbCurrentName').textContent = utbUserName;

  const items = antrian.filter(a => !a.sent).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  document.getElementById('utbCount').textContent = items.length + ' item';

  const list = document.getElementById('utbList');
  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">🧃</div><div class="empty-text">Belum ada item tersedia untuk dipesan</div></div>';
    updateUtbOrderBar();
    return;
  }

  list.innerHTML = items.map(a => {
    const lockedByOther = a.claimedBy && a.claimedBy !== utbUserName;
    const checked       = a.claimedBy === utbUserName;
    return `
    <div class="utb-item ${checked ? 'checked' : ''} ${lockedByOther ? 'locked' : ''}">
      <div class="utb-checkbox-wrap">
        <input type="checkbox" ${checked ? 'checked' : ''} ${lockedByOther ? 'disabled' : ''}
          onchange="toggleUtbItem('${a.firestoreId}', this.checked)">
      </div>
      <div class="utb-item-info">
        <div class="utb-item-name">${a.item || '-'}${a.qty > 1 ? ' x' + a.qty : ''}</div>
        ${a.note ? '<div class="utb-item-note">📝 ' + a.note + '</div>' : ''}
        ${lockedByOther ? '<div class="utb-item-locked-by">🔒 Dipilih oleh ' + a.claimedBy + '</div>' : ''}
      </div>
      <div class="utb-item-price">${rupiah((a.price || 0) * (a.qty || 1))}</div>
    </div>`;
  }).join('');

  updateUtbOrderBar();
}

// ============================================================
// DEPOSIT
// ============================================================
window.addDeposit = async function() {
  const name   = document.getElementById('depName').value.trim();
  const amount = parseFloat(document.getElementById('depAmount').value);
  const note   = document.getElementById('depNote').value.trim();

  if (!name || !amount || amount <= 0) { showToast('Lengkapi nama dan jumlah deposit!', '⚠️'); return; }

  const btn = document.getElementById('btnAddDeposit');
  btn.disabled = true;
  btn.textContent = '⏳ Menyimpan...';
  setSyncBadge('loading');

  try {
    await addDoc(depositsCol, {
      name,
      amount,
      usedAmount: 0,
      note,
      date: today(),
      createdAt: Date.now()
    });
    document.getElementById('depName').value   = '';
    document.getElementById('depAmount').value = '';
    document.getElementById('depNote').value   = '';
    showToast('Deposit ' + name + ' disimpan! 💰');
    setSyncBadge('ok');
  } catch(e) {
    showToast('Gagal menyimpan deposit!', '❌'); setSyncBadge('err');
  } finally {
    btn.disabled = false;
    btn.textContent = '💰 Simpan Deposit';
  }
};

window.deleteDeposit = async function(firestoreId) {
  if (!confirm('Hapus deposit ini?')) return;
  setSyncBadge('loading');
  try {
    await deleteDoc(doc(db, 'deposits', firestoreId));
    showToast('Deposit dihapus', '🗑️');
    setSyncBadge('ok');
  } catch(e) {
    showToast('Gagal hapus!', '❌'); setSyncBadge('err');
  }
};

function getDepositSisaById(d) {
  const used = (typeof d.usedAmount === 'number') ? d.usedAmount : getDepositUsedByName(d.name);
  return Math.max(0, (d.amount || 0) - used);
}

function getDepositUsedByName(name) {
  return orders
    .filter(o => o.buyer && o.buyer.toLowerCase() === name.toLowerCase() && o.paid && o.paidViaDeposit)
    .reduce((s, o) => s + (o.price || 0) * (o.qty || 1), 0);
}

function getDepositTotalByName(name) {
  return deposits
    .filter(d => d.name && d.name.toLowerCase() === name.toLowerCase())
    .reduce((s, d) => s + (d.amount || 0), 0);
}

// ------------------------------------------------------------
// autoCleanDepletedDeposits — DIPERBAIKI: menambah guard
// `depositsBeingCleaned` supaya deposit yang sama tidak dihapus /
// ditoast dua kali ketika renderDeposits() terpicu berulang kali
// dalam waktu berdekatan (misal dari listener orders & deposits
// yang menembak hampir bersamaan).
// ------------------------------------------------------------
const depositsBeingCleaned = new Set();
async function autoCleanDepletedDeposits() {
  const depleted = deposits.filter(d => getDepositSisaById(d) <= 0 && !depositsBeingCleaned.has(d.firestoreId));
  if (!depleted.length) return;

  depleted.forEach(d => depositsBeingCleaned.add(d.firestoreId));
  try {
    await Promise.all(depleted.map(d => deleteDoc(doc(db, 'deposits', d.firestoreId))));
    if (depleted.length === 1) {
      showToast(`Deposit ${depleted[0].name} habis & otomatis dihapus 🗑️`);
    } else {
      showToast(`${depleted.length} deposit habis & otomatis dihapus 🗑️`);
    }
  } catch(e) {
    // silent
  } finally {
    depleted.forEach(d => depositsBeingCleaned.delete(d.firestoreId));
  }
}

function renderDeposits() {
  const list = document.getElementById('depositList');

  const activeDeposits = deposits.filter(d => getDepositSisaById(d) > 0);
  const allDeposits    = deposits.slice().sort((a, b) => b.createdAt - a.createdAt);

  const total     = activeDeposits.reduce((s, d) => s + (d.amount || 0), 0);
  const totalSisa = activeDeposits.reduce((s, d) => s + getDepositSisaById(d), 0);
  const totalUsed = total - totalSisa;

  document.getElementById('depCount').textContent = activeDeposits.length + ' aktif';

  const totalDepEl  = document.getElementById('totalDeposit');
  const totalUsedEl = document.getElementById('totalDepositUsed');
  const totalSisaEl = document.getElementById('totalDepositSisa');
  if (totalDepEl)  totalDepEl.textContent  = rupiah(total);
  if (totalUsedEl) totalUsedEl.textContent = rupiah(Math.max(0, totalUsed));
  if (totalSisaEl) totalSisaEl.textContent = rupiah(totalSisa);

  if (!allDeposits.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">💼</div><div class="empty-text">Belum ada deposit tersimpan</div></div>`;
    return;
  }

  const activeList   = allDeposits.filter(d => getDepositSisaById(d) > 0);
  const depletedList = allDeposits.filter(d => getDepositSisaById(d) <= 0);

  const renderItem = (d) => {
    const sisa       = getDepositSisaById(d);
    const used       = (d.amount || 0) - sisa;
    const pct        = d.amount > 0 ? Math.max(0, Math.min(100, Math.round((sisa / d.amount) * 100))) : 0;
    const isDepleted = sisa <= 0;
    const isPartial  = sisa > 0 && sisa < d.amount;
    const cls        = isDepleted ? 'depleted' : isPartial ? 'partial' : 'full';
    const amtColor   = isDepleted ? 'red' : isPartial ? 'orange' : '';
    const fillColor  = isDepleted ? 'red' : isPartial ? 'orange' : '';
    const sisaLabel  = isDepleted
      ? '🔴 Habis — akan otomatis dihapus'
      : isPartial
        ? `🟡 Sisa ${rupiah(sisa)}`
        : `🟢 Sisa ${rupiah(sisa)}`;
    const usedNote = used > 0 ? ` · Terpakai ${rupiah(used)}` : '';

    return `
    <div class="deposit-item ${cls}" id="dep-${d.firestoreId}">
      <div style="flex:1;min-width:0">
        <div class="deposit-name">👤 ${d.name}</div>
        <div class="deposit-date">📅 ${d.date}${d.note ? ' · 📝 ' + d.note : ''}${usedNote}</div>
        <div style="font-size:11px;font-weight:700;margin-top:4px;color:${isDepleted ? 'var(--red)' : isPartial ? '#92400E' : '#1D4ED8'}">${sisaLabel}</div>
        <div class="deposit-balance-bar"><div class="deposit-balance-fill ${fillColor}" style="width:${pct}%"></div></div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-left:10px">
        <div class="deposit-amount ${amtColor}">${rupiah(d.amount)}</div>
        ${isDepleted
          ? `<button class="btn btn-sm btn-danger" onclick="deleteDeposit('${d.firestoreId}')">🗑️ Hapus</button>`
          : `<button class="btn btn-sm btn-danger" onclick="deleteDeposit('${d.firestoreId}')">✕</button>`}
      </div>
    </div>`;
  };

  let html = '';

  if (activeList.length) {
    html += activeList.map(renderItem).join('');
  }

  if (depletedList.length) {
    html += `<div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 8px">🔴 Habis (${depletedList.length}) — segera dihapus</div>`;
    html += depletedList.map(renderItem).join('');
    autoCleanDepletedDeposits();
  }

  if (!activeList.length && !depletedList.length) {
    html = `<div class="empty-state"><div class="empty-icon">💼</div><div class="empty-text">Belum ada deposit tersimpan</div></div>`;
  }

  list.innerHTML = html;
}

// ============================================================
// RINGKASAN
// ============================================================
window.setPeriod = function(period, btn) {
  currentPeriod = period;
  document.querySelectorAll('.period-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const customWrap = document.getElementById('summaryCustomDateWrap');
  if (customWrap) customWrap.style.display = period === 'custom' ? 'block' : 'none';
  renderSummary();
};

function getDateRange(period) {
  const now = new Date(); const dates = [];
  if (period === 'daily') return [today()];
  if (period === 'custom') {
    const from = document.getElementById('summaryDateFrom')?.value;
    const to   = document.getElementById('summaryDateTo')?.value;
    if (!from || !to) return [today()];
    const start = new Date(from + 'T00:00:00');
    const end   = new Date(to   + 'T00:00:00');
    const d = new Date(start);
    while (d <= end) {
      dates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
    return dates.length ? dates : [today()];
  }
  const days = period === 'weekly' ? 6 : 29;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function renderSummary() {
  const dates       = getDateRange(currentPeriod);
  const rangeOrders = orders.filter(o => dates.includes(o.date));
  const totalOmzet  = rangeOrders.reduce((s, o) => s + o.price * o.qty, 0);
  const totalPaid   = rangeOrders.filter(o => o.paid).reduce((s, o) => s + o.price * o.qty, 0);
  const totalUnpaid = totalOmzet - totalPaid;
  const totalTx     = rangeOrders.length;
  const uniqueBuyers = new Set(rangeOrders.map(o => o.buyer)).size;

  const itemCount = {};
  rangeOrders.forEach(o => {
    if (!itemCount[o.item]) itemCount[o.item] = { count: 0, total: 0 };
    itemCount[o.item].count += o.qty;
    itemCount[o.item].total += o.price * o.qty;
  });
  const topItems = Object.entries(itemCount).sort((a,b) => b[1].count - a[1].count).slice(0, 5);

  let chartHTML = '';
  if (currentPeriod !== 'daily') {
    const barData   = dates.map(d => ({ date: d, total: orders.filter(o => o.date === d).reduce((s, o) => s + o.price * o.qty, 0) }));
    const maxVal    = Math.max(...barData.map(b => b.total), 1);
    const barsToShow = currentPeriod === 'weekly' ? barData : barData.filter((_, i) => i % 3 === 0 || i === barData.length - 1);
    chartHTML = `<div class="card" style="margin-bottom:12px">
      <div class="section-title" style="font-size:13px">📈 Grafik Omzet</div>
      <div class="chart-bars">
        ${barsToShow.map(b => {
          const h     = Math.max(Math.round((b.total / maxVal) * 72), 3);
          const isT   = b.date === today();
          const label = currentPeriod === 'weekly'
            ? new Date(b.date + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'short'})
            : b.date.split('-')[2];
          return `<div class="bar-wrap"><div class="bar ${isT ? 'current' : ''}" style="height:${h}px" title="${rupiah(b.total)}"></div><div class="bar-label">${label}</div></div>`;
        }).join('')}
      </div>
    </div>`;
  }

  const buyerBreakdown = {};
  rangeOrders.forEach(o => {
    if (!buyerBreakdown[o.buyer]) buyerBreakdown[o.buyer] = { total: 0, paid: 0, count: 0 };
    buyerBreakdown[o.buyer].total += o.price * o.qty;
    buyerBreakdown[o.buyer].count += 1;
    if (o.paid) buyerBreakdown[o.buyer].paid += o.price * o.qty;
  });

  const periodLabel = currentPeriod === 'daily' ? 'Hari Ini'
    : currentPeriod === 'weekly'  ? '7 Hari Terakhir'
    : currentPeriod === 'monthly' ? '30 Hari Terakhir'
    : (() => {
        const from = document.getElementById('summaryDateFrom')?.value;
        const to   = document.getElementById('summaryDateTo')?.value;
        return from && to ? from + ' s/d ' + to : 'Periode Kustom';
      })();

  document.getElementById('summaryContent').innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--text3);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px">${periodLabel}</div>
    <div class="summary-grid">
      <div class="stat-card"><div class="stat-label">Total Omzet</div><div class="stat-value orange">${rupiah(totalOmzet)}</div><div class="stat-sub">${totalTx} transaksi</div></div>
      <div class="stat-card"><div class="stat-label">Sudah Bayar</div><div class="stat-value green">${rupiah(totalPaid)}</div><div class="stat-sub">${totalPaid > 0 ? Math.round(totalPaid / totalOmzet * 100) : 0}% lunas</div></div>
      <div class="stat-card"><div class="stat-label">Belum Bayar</div><div class="stat-value" style="color:var(--red)">${rupiah(totalUnpaid)}</div><div class="stat-sub">piutang</div></div>
      <div class="stat-card"><div class="stat-label">Jumlah Pembeli</div><div class="stat-value blue">${uniqueBuyers}</div><div class="stat-sub">orang unik</div></div>
    </div>
    ${chartHTML}
    ${topItems.length > 0 ? `<div class="card" style="margin-bottom:12px">
      <div class="section-title" style="font-size:13px;margin-bottom:10px">🏆 Item Terlaris</div>
      ${topItems.map(([name, d], i) => `
        <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:${i < topItems.length-1 ? '1px solid var(--border)' : 'none'}">
          <div><span style="font-size:13px;font-weight:600">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${name}</span><div style="font-size:11px;color:var(--text3)">Terjual ${d.count}x</div></div>
          <div style="font-size:13px;font-weight:700;font-family:'DM Mono',monospace;color:var(--brand)">${rupiah(d.total)}</div>
        </div>`).join('')}
    </div>` : ''}
    ${Object.keys(buyerBreakdown).length > 0 ? `<div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="section-title" style="font-size:13px;margin-bottom:0">👥 Per Pembeli</div>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="text" class="filter-input" id="filterRingBuyer" placeholder="🔍 Nama..." style="width:110px;font-size:12px;padding:6px 10px" oninput="renderSummary()">
          <button class="sort-btn active" id="ringSortBtn" onclick="toggleRingSummarySort()" title="Urutkan nama">A↑Z</button>
        </div>
      </div>
      <div id="ringBuyerRows">
      ${(() => {
        const search = document.getElementById('filterRingBuyer') ? document.getElementById('filterRingBuyer').value.toLowerCase().trim() : '';
        let entries = Object.entries(buyerBreakdown);
        if (search) entries = entries.filter(([n]) => n.toLowerCase().includes(search));
        entries = entries.sort((a, b) => {
          const na = a[0].toLowerCase(); const nb = b[0].toLowerCase();
          return ringSortMode === 'asc' ? na.localeCompare(nb, 'id') : nb.localeCompare(na, 'id');
        });
        if (!entries.length) return '<div style="text-align:center;color:var(--text3);font-size:13px;padding:12px 0">Tidak ada data</div>';
        return entries.map(([name, d], i) => {
          const isAllPaid = d.paid >= d.total;
          return `<div class="flex justify-between items-center summary-buyer-row ${isAllPaid ? 'all-paid' : ''}" style="padding:8px ${isAllPaid ? '6px' : '0'};border-bottom:${i < entries.length-1 ? '1px solid var(--border)' : 'none'}">
            <div>
              <div style="font-size:13px;font-weight:600">${name}${isAllPaid ? ' <span style="font-size:11px;background:#BBF7D0;color:#15803D;padding:1px 7px;border-radius:10px;font-weight:700;margin-left:4px">✓ Lunas</span>' : ''}</div>
              <div style="font-size:11px;color:${isAllPaid ? '#16A34A' : 'var(--text3)'};">${d.count} pesanan · Lunas ${rupiah(d.paid)}</div>
            </div>
            <div style="font-size:13px;font-weight:700;font-family:'DM Mono',monospace;color:${isAllPaid ? 'var(--green-dark)' : 'var(--text)'}">${rupiah(d.total)}</div>
          </div>`;
        }).join('');
      })()}
      </div>
    </div>` : `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">Belum ada data penjualan</div></div>`}
  `;
}

// ============================================================
// TAGIHAN
// ============================================================
window.renderBuyerList = function() {
  const dateRange    = getFilterDates(tagihanDateMode, 'tagihanDateFrom', 'tagihanDateTo');
  const todayOrders  = filterByDateRange(orders, dateRange);
  const buyers       = {};
  todayOrders.forEach(o => {
    if (!buyers[o.buyer]) buyers[o.buyer] = { total: 0, count: 0, unpaid: 0 };
    buyers[o.buyer].total  += o.price * o.qty;
    buyers[o.buyer].count  += 1;
    if (!o.paid) buyers[o.buyer].unpaid += o.price * o.qty;
  });

  const badge = document.getElementById('tagihanFilterBadge');
  if (badge) badge.style.display = tagihanDateMode !== 'today' ? 'inline-flex' : 'none';

  const totalUnpaid      = Object.values(buyers).reduce((s, d) => s + d.unpaid, 0);
  const unpaidBuyerCount = Object.values(buyers).filter(d => d.unpaid > 0).length;

  const banner = document.getElementById('unpaidBanner');
  if (unpaidBuyerCount > 0) {
    banner.innerHTML = `
      <div style="background:linear-gradient(135deg,#FFF0EB,#FFE4D9);border:1.5px solid #FFB899;border-radius:var(--radius);padding:14px 16px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div>
            <div style="font-size:13px;font-weight:800;color:var(--brand)">⏳ ${unpaidBuyerCount} pembeli belum lunas</div>
            <div style="font-size:20px;font-weight:800;color:var(--brand-dark);font-family:'DM Mono',monospace;margin-top:2px">${rupiah(totalUnpaid)}</div>
          </div>
          <div style="font-size:28px">🧾</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" style="flex:1;justify-content:center;background:var(--brand)" onclick="showAllUnpaidBill()">📋 Rekap Semua Tagihan</button>
          <button class="btn btn-sm" style="flex:1;justify-content:center;background:white;border:1.5px solid var(--brand);color:var(--brand);font-weight:700" onclick="shareAllUnpaidBill()">📤 Share Rekap</button>
        </div>
      </div>`;
  } else { banner.innerHTML = ''; }

  const buyerDiv = document.getElementById('buyerList');
  if (!Object.keys(buyers).length) {
    const emptyMsg = tagihanDateMode !== 'today' ? 'Tidak ada pesanan pada tanggal ini' : 'Belum ada pesanan hari ini';
    buyerDiv.innerHTML = `<div class="empty-state"><div class="empty-icon">🧾</div><div class="empty-text">${emptyMsg}</div></div>`;
    document.getElementById('billPreview').innerHTML = '';
    return;
  }

  const tagihanSearchEl = document.getElementById('filterTagihanBuyer');
  const tagihanSearch = tagihanSearchEl ? tagihanSearchEl.value.toLowerCase().trim() : '';

  let buyerEntries = Object.entries(buyers);
  if (tagihanSearch) {
    buyerEntries = buyerEntries.filter(([name]) => name.toLowerCase().includes(tagihanSearch));
  }

  buyerEntries = buyerEntries.sort((a, b) => {
    let valA, valB;
    if (tagihanSortField === 'total') {
      valA = a[1].total; valB = b[1].total;
      return tagihanSortMode === 'asc' ? valA - valB : valB - valA;
    } else if (tagihanSortField === 'unpaid') {
      valA = a[1].unpaid; valB = b[1].unpaid;
      return tagihanSortMode === 'asc' ? valA - valB : valB - valA;
    } else if (tagihanSortField === 'count') {
      valA = a[1].count; valB = b[1].count;
      return tagihanSortMode === 'asc' ? valA - valB : valB - valA;
    } else {
      const na = a[0].toLowerCase();
      const nb = b[0].toLowerCase();
      return tagihanSortMode === 'asc' ? na.localeCompare(nb, 'id') : nb.localeCompare(na, 'id');
    }
  });

  if (!buyerEntries.length) {
    buyerDiv.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">Tidak ada pembeli yang cocok</div></div>`;
    return;
  }

  buyerDiv.innerHTML = `<div class="buyer-select">` +
    buyerEntries.map(([name, d]) => {
      const isAllPaid = d.unpaid === 0;
      const depTotal = getDepositTotalByName(name);
      const depUsed  = getDepositUsedByName(name);
      const depSisa  = depTotal - depUsed;
      const depBadge = depTotal > 0
        ? `<span style="font-size:10px;background:#EFF6FF;color:#1D4ED8;padding:2px 6px;border-radius:10px;font-weight:700;border:1px solid #BFDBFE;margin-left:4px">💰 Dep ${rupiah(depSisa)}</span>`
        : '';
      return `
      <div class="buyer-option ${selectedBuyer === name ? 'selected' : ''} ${isAllPaid ? 'all-paid' : ''}" onclick="selectBuyer('${name}')">
        <div class="buyer-avatar" style="background:${d.unpaid > 0 ? 'var(--brand)' : 'var(--green-dark)'}">${initials(name)}</div>
        <div class="buyer-info">
          <div class="buyer-name">${name}${isAllPaid ? ' <span style="font-size:12px;background:#BBF7D0;color:#15803D;padding:1px 7px;border-radius:10px;font-weight:700">✓ LUNAS</span>' : ''}${depBadge}</div>
          <div class="buyer-total">${d.count} item · ${rupiah(d.total)} · ${d.unpaid > 0 ? '<span style="color:var(--brand);font-weight:700">⏳ Belum ' + rupiah(d.unpaid) + '</span>' : '<span style="color:#15803D;font-weight:700">✅ Lunas semua</span>'}</div>
        </div>
        <span style="font-size:18px">-></span>
      </div>`;
    }).join('') + `</div>`;

  if (selectedBuyer) renderBill(selectedBuyer);
};

window.selectBuyer = function(name) {
  selectedBuyer = name;
  window.renderBuyerList();
  renderBill(name);
};

function buildBillText(buyerName, onlyUnpaid) {
  const dateRange   = getFilterDates(tagihanDateMode, 'tagihanDateFrom', 'tagihanDateTo');
  const rangeOrders = filterByDateRange(orders, dateRange);
  const buyerOrders = rangeOrders.filter(o => o.buyer === buyerName && (onlyUnpaid ? !o.paid : true));
  if (!buyerOrders.length) return null;
  const total   = buyerOrders.reduce((s, o) => s + o.price * o.qty, 0);
  const d       = new Date();
  const dateStr = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  const timeStr = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  let t = `🍜 *JAJANYUK*\n━━━━━━━━━━━━━━━━━━━\n📅 ${dateStr}, ${timeStr}\n👤 Pembeli: *${buyerName}*\n━━━━━━━━━━━━━━━━━━━\n*DETAIL PESANAN:*\n`;
  buyerOrders.forEach(o => {
    const sub = o.price * o.qty;
    t += `• ${o.item}`;
    if (o.qty > 1) t += ` (x${o.qty})`;
    if (o.note)    t += ` [${o.note}]`;
    t += `\n  ${rupiah(o.price)}${o.qty > 1 ? ' × ' + o.qty + ' = ' + rupiah(sub) : ''}`;
    t += o.paid ? ' ✅' : ' ⏳';
    t += '\n';
  });
  t += `━━━━━━━━━━━━━━━━━━━\n💰 TOTAL: *${rupiah(total)}*\n`;
  t += onlyUnpaid ? `⏳ Status: *BELUM LUNAS*\n` : (buyerOrders.every(o => o.paid) ? `✅ Status: *LUNAS*\n` : `⏳ Ada yang belum lunas\n`);
  t += `━━━━━━━━━━━━━━━━━━━\nTerima kasih telah berbelanja! 🙏`;
  return t;
}

function renderBill(buyerName) {
  const billText = buildBillText(buyerName, false);
  if (!billText) return;
  const escaped = billText.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  document.getElementById('billPreview').innerHTML = `
    <div style="margin-top:16px">
      <div class="section-title">🧾 Preview Tagihan — ${buyerName}</div>
      <div class="bill-preview"><pre>${billText}</pre></div>
      <div class="bill-actions">
        <button class="btn btn-ghost btn-sm" onclick="copyBill(\`${escaped}\`)">📋 Copy</button>
        <button class="btn btn-primary btn-sm" onclick="shareBill(\`${escaped}\`)">📤 Share / WA</button>
      </div>
    </div>`;
}

function buildAllUnpaidText() {
  const dateRange   = getFilterDates(tagihanDateMode, 'tagihanDateFrom', 'tagihanDateTo');
  const todayUnpaid = filterByDateRange(orders, dateRange).filter(o => !o.paid);
  const buyers      = [...new Set(todayUnpaid.map(o => o.buyer))];
  if (!buyers.length) return null;

  const d       = new Date();
  const dateStr = d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  const timeStr = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  let text = `🍉 *JAJANYUK — REKAP PESANAN*\n📅 ${dateStr}, ${timeStr}\n━━━━━━━━━━━━━━━━━━━\n`;

  const sortLabels = { name: 'Nama (A-Z)', total: 'Total Tagihan', unpaid: 'Belum Bayar', count: 'Jml Item' };
  const sortDir    = tagihanSortMode === 'asc' ? '↑ Terkecil->Terbesar' : '↓ Terbesar->Terkecil';
  const sortLabel  = tagihanSortField === 'name'
    ? (tagihanSortMode === 'asc' ? 'Nama A->Z' : 'Nama Z->A')
    : `${sortLabels[tagihanSortField] || ''} ${sortDir}`;
  text += `📊 Urutan: ${sortLabel}\n━━━━━━━━━━━━━━━━━━━\n`;

  const buyerMap = {};
  buyers.forEach(name => {
    const bOrders = todayUnpaid.filter(o => o.buyer === name);
    buyerMap[name] = {
      orders: bOrders,
      total:  bOrders.reduce((s, o) => s + o.price * o.qty, 0),
      count:  bOrders.length,
      unpaid: bOrders.reduce((s, o) => s + o.price * o.qty, 0)
    };
  });

  const sortedBuyers = Object.keys(buyerMap).sort((a, b) => {
    if (tagihanSortField === 'total' || tagihanSortField === 'unpaid') {
      return tagihanSortMode === 'asc'
        ? buyerMap[a].total - buyerMap[b].total
        : buyerMap[b].total - buyerMap[a].total;
    } else if (tagihanSortField === 'count') {
      return tagihanSortMode === 'asc'
        ? buyerMap[a].count - buyerMap[b].count
        : buyerMap[b].count - buyerMap[a].count;
    } else {
      return tagihanSortMode === 'asc'
        ? a.toLowerCase().localeCompare(b.toLowerCase(), 'id')
        : b.toLowerCase().localeCompare(a.toLowerCase(), 'id');
    }
  });

  let grandTotal = 0;
  sortedBuyers.forEach((name, idx) => {
    const { orders: bOrders, total: bTotal } = buyerMap[name];
    grandTotal += bTotal;
    text += `\n👤 *${name}*\n`;
    bOrders.forEach(o => {
      text += `  • ${o.item}`;
      if (o.qty > 1) text += ` (x${o.qty})`;
      if (o.note)    text += ` [${o.note}]`;
      text += ` -> ${rupiah(o.price * o.qty)}\n`;
    });
    text += `  💰 Subtotal: *${rupiah(bTotal)}*\n`;
    if (idx < sortedBuyers.length - 1) text += `  ─────────────────\n`;
  });
 text +=`\n*Terima Kasih*`;
  return text;
}

window.showAllUnpaidBill = function() {
  const text = buildAllUnpaidText();
  if (!text) { showToast('Tidak ada tagihan belum bayar', '✅'); return; }
  const escaped = text.replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  const sortFieldLabels = { name: 'Nama', total: 'Total', unpaid: 'Belum Bayar', count: 'Jml Item' };
  const sortDirIcon = tagihanSortMode === 'asc' ? '↑' : '↓';
  const sortInfo = `${sortFieldLabels[tagihanSortField] || 'Nama'} ${sortDirIcon}`;
  selectedBuyer = null;
  document.getElementById('buyerList').querySelectorAll('.buyer-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('billPreview').innerHTML = `
    <div style="margin-top:16px">
      <div class="section-title" style="color:var(--brand)">⏳ Rekap Semua Tagihan Belum Bayar <span style="font-size:11px;background:var(--brand-light);color:var(--brand);border:1px solid #FFB899;padding:2px 8px;border-radius:20px;font-weight:700;margin-left:4px">📊 ${sortInfo}</span></div>
      <div class="bill-preview" style="background:var(--brand-light);border:1px solid #FFB899"><pre>${text}</pre></div>
      <div class="bill-actions">
        <button class="btn btn-ghost btn-sm" onclick="copyBill(\`${escaped}\`)">📋 Copy</button>
        <button class="btn btn-primary btn-sm" onclick="shareBill(\`${escaped}\`)">📤 Share / WA</button>
      </div>
    </div>`;
  document.getElementById('billPreview').scrollIntoView({ behavior:'smooth', block:'start' });
};

window.shareAllUnpaidBill = function() {
  const text = buildAllUnpaidText();
  if (!text) { showToast('Tidak ada tagihan belum bayar', '✅'); return; }
  shareBill(text);
};

window.copyBill = function(text) {
  navigator.clipboard.writeText(text).then(() => showToast('Tagihan disalin!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      showToast('Tagihan disalin!');
    });
};

window.shareBill = function(text) {
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
  }
};

// ============================================================
// QRIS
// ============================================================
function renderQris() {
  getDoc(doc(db, 'settings', 'qris')).then(snap => {
    if (snap.exists() && snap.data().imageBase64) {
      const imgData = snap.data().imageBase64;
      document.getElementById('qrisImg').src     = imgData;
      document.getElementById('qrisImgFull').src = imgData;
    }
  }).catch(() => {});
}

window.handleQrisUpload = async function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      setSyncBadge('loading');
      await setDoc(doc(db, 'settings', 'qris'), { imageBase64: e.target.result });
      renderQris();
      showToast('QRIS berhasil disimpan! 🎉');
      setSyncBadge('ok');
    } catch(err) {
      showToast('Gagal upload QRIS!', '❌'); setSyncBadge('err');
    }
  };
  reader.readAsDataURL(file);
};

window.changeQris = async function() {
  if (!confirm('Ganti gambar QRIS?')) return;
  try {
    await deleteDoc(doc(db, 'settings', 'qris'));
    renderQris();
  } catch(e) {
    showToast('Gagal hapus QRIS!', '❌');
  }
};

function renderQrisNominals() {
  const todayOrders = orders.filter(o => o.date === today());
  const buyers      = {};
  todayOrders.forEach(o => {
    if (!buyers[o.buyer]) buyers[o.buyer] = { total: 0, unpaid: 0 };
    buyers[o.buyer].total  += o.price * o.qty;
    if (!o.paid) buyers[o.buyer].unpaid += o.price * o.qty;
  });

  const totalAll    = todayOrders.reduce((s, o) => s + o.price * o.qty, 0);
  const totalUnpaid = todayOrders.filter(o => !o.paid).reduce((s, o) => s + o.price * o.qty, 0);
  const container   = document.getElementById('qrisNominalList');

  if (!Object.keys(buyers).length) {
    container.innerHTML = `<span style="font-size:13px;color:var(--text2)">Belum ada pesanan hari ini</span>`;
    return;
  }

  let chips = '';
  Object.entries(buyers).forEach(([name, d]) => {
    if (d.unpaid > 0)
      chips += `<span class="nominal-chip" onclick="copyNominal(${d.unpaid}, '${name}')" title="Tagihan ${name}">${initials(name)} ${rupiah(d.unpaid)}</span>`;
  });
  if (totalUnpaid > 0)
    chips += `<span class="nominal-chip" style="border-color:var(--red);color:var(--red)" onclick="copyNominal(${totalUnpaid}, 'semua belum bayar')" title="Total belum bayar">⏳ ${rupiah(totalUnpaid)}</span>`;
  chips += `<span class="nominal-chip" style="border-color:var(--green-dark);color:var(--green-dark)" onclick="copyNominal(${totalAll}, 'total hari ini')" title="Total hari ini">✓ ${rupiah(totalAll)}</span>`;
  container.innerHTML = chips;
}

window.copyNominal = function(amount, label) {
  const num = Math.round(amount).toString();
  navigator.clipboard.writeText(num).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = num; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
  qrisOverlayNominal = rupiah(amount);
  showToast('Nominal ' + rupiah(amount) + ' disalin!', '💰');
};

window.openQrisFullscreen = function() {
  document.getElementById('qrisOverlay').style.display = 'flex';
  document.getElementById('qrisOverlayNominal').textContent = qrisOverlayNominal || '';
  document.body.style.overflow = 'hidden';
};

window.closeQrisFullscreen = function() {
  document.getElementById('qrisOverlay').style.display = 'none';
  document.body.style.overflow = '';
};

document.getElementById('qrisOverlay').addEventListener('click', function(e) {
  if (e.target === this) window.closeQrisFullscreen();
});

document.getElementById('utbConfirmModal').addEventListener('click', function(e) {
  if (e.target === this) window.closeUtbConfirm();
});

// ============================================================
// INIT
// ============================================================
applyAdminAccess();
renderQris();

// Kolom tanggal hapus dikosongkan secara default - user harus pilih tanggal dulu
updateDeleteDateInfo();

// Filter listeners
document.getElementById('filterBuyer').addEventListener('input', () => window.renderOrders());
document.getElementById('filterStatus').addEventListener('change', () => window.renderOrders());

const filterTagihanBuyerEl = document.getElementById('filterTagihanBuyer');
if (filterTagihanBuyerEl) filterTagihanBuyerEl.addEventListener('input', () => window.renderBuyerList());

// Delete date listeners untuk update info
document.getElementById('deleteDateFrom').addEventListener('change', updateDeleteDateInfo);
document.getElementById('deleteDateTo').addEventListener('change', updateDeleteDateInfo);

setTimeout(() => {
  document.getElementById('loadingOverlay').style.display = 'none';
}, 1500);
