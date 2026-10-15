(function() {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = globalThis.NG_CATALOG;
  const fmt = n => Number(n).toLocaleString('vi-VN', {maximumFractionDigits:4});
  const money = n => fmt(n) + ' đ';
  let catalog, roles, lastResult = null, lastText = '';
  const statusNames = NG_ENGINE.config().statuses;
  for (const [value, label] of Object.entries(statusNames)) $('status').add(new Option(label, value));
  const getWard = id => catalog.wards.find(w => w.id === $(id).value);
  function notice(message) {
    $('catalogNotice').textContent = message;
    $('catalogNotice').hidden = !message;
  }
  function loadCatalog(preserve = false) {
    const old = preserve ? $('middleWard').value : '';
    catalog = C.load();
    function fixed(keys, id, name) {
      for (const key of keys) {
        const matches = catalog.wards.filter(w => C.nameKey(w.name) === key);
        if (matches.length === 1) return matches[0];
      }
      return {id, name, price:null, missing:true};
    }
    roles = {
      cc:fixed(['cap cuu','hoi suc cap cuu'], '__CAP_CUU_FIXED__', 'Cấp cứu'),
      tm:fixed(['noi tim mach','tim mach'], '__NOI_TIM_MACH_FIXED__', 'Nội Tim mạch')
    };
    $('middleWard').replaceChildren(new Option('Chọn khoa thứ 2…', ''));
    for (const w of catalog.wards) {
      if (C.isClinic(w.name) || w.id === roles.tm.id || ($('origin').value === 'CAP_CUU' && w.id === roles.cc.id)) continue;
      $('middleWard').add(new Option(w.name, w.id));
    }
    if ([...$('middleWard').options].some(o => o.value === old)) $('middleWard').value = old;
    NG.wards = catalog.wards.map(w => ({...w}));
    const missing = [roles.tm, ...($('origin').value === 'CAP_CUU' ? [roles.cc] : [])].filter(w => w.missing);
    notice([catalog.error, missing.length ? 'Danh mục chưa có ' + missing.map(w=>w.name).join(', ') + '. Vẫn tính ngày với khoa cố định; đơn giá để trống đến khi bạn cập nhật danh mục.' : ''].filter(Boolean).join('\n'));
  }
  function toggleMiddle() {
    const active = $('hasMiddle').checked;
    $('middleRow').hidden = !active;
    for (const id of ['middleWard','middleTime','middleDate']) { $(id).disabled = !active; $(id).required = active; }
  }
  function dirty() {
    lastResult = null; lastText = '';
    $('result').hidden = true; $('formError').hidden = true;
  }
  function time(prefix, label) {
    if (!$(prefix + 'Date').value || !$(prefix + 'Time').value) throw new Error('Nhập đủ ngày và giờ ' + label + '.');
    return $(prefix + 'Date').value + 'T' + NG_ENGINE.normalizeClock($(prefix + 'Time').value);
  }
  function requireWard(id, label) {
    const w = getWard(id);
    if (!w) throw new Error('Chọn ' + label + ' trong danh mục khoa.');
    return w;
  }
  function payload() {
    const final = roles.tm;
    const arrival = time('arrival', 'vào Cấp cứu / Phòng khám');
    const finalStart = time('final', 'vào khoa Nội Tim mạch');
    const end = time('exit', 'kết thúc đợt nội trú');
    const stays = [];
    const cc = $('origin').value === 'CAP_CUU' ? roles.cc : null;
    if ($('hasMiddle').checked) {
      const middle = requireWard('middleWard', 'khoa thứ 2');
      if (middle.id === final.id || (cc && middle.id === cc.id) || C.isClinic(middle.name)) throw new Error('Khoa thứ 2 phải là khoa có giường, khác Cấp cứu và Nội Tim mạch. Bỏ chọn nếu không có khoa này.');
      stays.push({wardId:middle.id, name:middle.name, price:middle.price, start:time('middle','vào khoa thứ 2'), end:finalStart});
    }
    stays.push({wardId:final.id, name:final.name, price:final.price, start:finalStart, end});
    return {origin:$('origin').value, arrival, originWardId:cc && cc.id, originName:cc && cc.name, originPrice:cc && cc.price, status:$('status').value, stays};
  }
  function td(row, text, cls) {
    const node = document.createElement('td'); node.textContent = text;
    if (cls) node.className = cls;
    row.append(node); return node;
  }
  function shortReason(rows, w, r) {
    const reasons = [];
    const full = rows.filter(d => d.days === 1).length;
    const half = rows.filter(d => d.days === 0.5).length;
    const three = rows.some(d => /cao nhất|thấp nhất/.test(d.explanation));
    if (r.totalDays === 0) return 'Cả đợt nội trú ≤4 giờ: không tính ngày giường.';
    if (full) reasons.push(full + ' ngày trọn');
    if (half) reasons.push(half + ' lần × 0,5 ngày chuyển khoa' + (three ? ' (xét giờ và giá)' : ''));
    if (!w.days && rows.some(d => d.emergency && d.excluded)) reasons.push('Cấp cứu ≤4 giờ: không tính giường hồi sức cấp cứu');
    if (!w.days && rows.some(d => /≤4 giờ, không thuộc/.test(d.explanation))) reasons.push('Chuyển ≥3 khoa: thời gian ≤4 giờ, không thuộc nhóm chọn giá');
    if (!w.days && rows.some(d => /giá không phải/.test(d.explanation))) reasons.push('Giá không phải cao nhất hoặc thấp nhất trong nhóm >4 giờ');
    if (!w.days && !w.hasPending && !reasons.length) reasons.push('Không có ngày được phân bổ theo quy ước bỏ ngày ra viện');
    if (w.hasPending) {
      const code = rows.find(d => d.days === null)?.pendingReason;
      const pendingText = {THREE_TOO_FEW:'Ngày chuyển ≥3 khoa chưa đủ 2 khoa nằm >4 giờ; cần đối chiếu',THREE_MISSING_PRICE:'Thiếu giá để chọn khoa cao nhất/thấp nhất trong ngày ≥3 khoa',THREE_PRICE_TIE:'Có khoa đồng giá cao nhất/thấp nhất; cần đối chiếu',CC_EXCLUSION_SPLIT:'Khoa thông thường không có ngưỡng 4 giờ riêng khi chuyển 2 khoa; cần đối chiếu phần chia ngày',SHORT_OVERNIGHT:'Đợt <24 giờ qua nửa đêm có chuyển khoa; cần đối chiếu',MISSING_WARD:'Ngày chưa xác định được khoa có giường thực tế'};
      reasons.push(pendingText[code] || 'Còn phần cần đối chiếu; mở chi tiết theo ngày');
    }
    return reasons.join('; ') + '.';
  }
  function render(r, p) {
    lastResult = r;
    $('result').hidden = false;
    $('totalDays').textContent = fmt(r.totalDays);
    $('duration').textContent = fmt_(r.normalized.admit) + ' → ' + fmt_(r.normalized.end) + ' · ' + fmt(r.hours) + ' giờ';
    $('totalReason').textContent = r.explanation.slice(r.explanation.indexOf('). ') + 3);
    $('pendingNotice').hidden = !r.pendingDays;
    $('pendingNotice').textContent = 'Tổng ' + fmt(r.totalDays) + ' ngày đã xác định; còn ' + fmt(r.pendingDays) + ' ngày cần đối chiếu cách chia cho các khoa. Số “?” chưa được cộng vào từng khoa.';
    $('summaryRows').replaceChildren();
    let completeMoney = !r.pendingDays, subtotal = 0;
    const textRows = [];
    for (const w of r.byWard) {
      const rows = r.details.filter(d => d.ward === w.ward), row = document.createElement('tr');
      td(row, w.ward);
      const count = w.hasPending ? (w.days ? fmt(w.days) + ' + ?' : 'Cần đối chiếu') : fmt(w.days);
      const cell = td(row, count, w.hasPending ? 'pending-number' : '');
      const billable = rows.filter(d => d.days !== null && d.days > 0);
      const knownPrice = billable.every(d => d.price !== null);
      const amount = billable.reduce((s,d) => s + d.days * (d.price || 0), 0);
      if (!knownPrice) completeMoney = false;
      subtotal += amount;
      if (knownPrice && w.days && !w.hasPending) { const small = document.createElement('small'); small.textContent = money(amount); cell.append(small); }
      const reason = shortReason(rows, w, r); td(row, reason);
      $('summaryRows').append(row); textRows.push(w.ward + ': ' + count + ' ngày. ' + reason);
    }
    $('moneySummary').textContent = completeMoney ? 'Tiền giường tạm tính: ' + money(subtotal) + ' (theo giá danh mục).' : r.pendingDays ? 'Chưa chốt tiền giường: còn phần phân bổ cần đối chiếu.' : 'Chưa đủ giá để tạm tính tiền. Cập nhật tại trang Danh mục khoa, giá.';
    $('detailRows').replaceChildren();
    for (const d of r.details) {
      const row = document.createElement('tr');
      [d.date, d.ward, fmt(d.hours), d.days === null ? 'Cần đối chiếu' : fmt(d.days), d.explanation].forEach(value => td(row, value));
      $('detailRows').append(row);
    }
    $('copyStatus').hidden = true;
    lastText = ['TÍNH NGÀY GIƯỜNG', $('duration').textContent, 'Tình trạng: ' + statusNames[p.status], 'Tổng: ' + fmt(r.totalDays) + ' ngày', ...textRows, $('moneySummary').textContent, 'Phân bổ dự kiến theo ngày lịch; phần chưa rõ để cần đối chiếu.'].join('\n');
    if (matchMedia('(max-width:720px)').matches) $('result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'});
  }
  $('calcForm').addEventListener('input', dirty);
  $('calcForm').addEventListener('change', dirty);
  $('origin').addEventListener('change', () => loadCatalog(true));
  $('hasMiddle').addEventListener('change', toggleMiddle);
  const clocks = ['arrival','middle','final','exit'].map(prefix => $(prefix + 'Time'));
  function normalizeClocks() {
    for (const input of clocks) {
      if (input.disabled || !input.value.trim()) continue;
      try { input.value = NG_ENGINE.normalizeClock(input.value); input.setCustomValidity(''); }
      catch (error) { input.setCustomValidity(error.message); throw error; }
    }
  }
  for (const input of clocks) {
    input.addEventListener('input', () => input.setCustomValidity(''));
    input.addEventListener('blur', () => {
      if (!input.value.trim()) return;
      try { input.value = NG_ENGINE.normalizeClock(input.value); input.setCustomValidity(''); }
      catch (error) { input.setCustomValidity(error.message); }
    });
  }
  for (const prefix of ['arrival','middle','final']) {
    $(prefix + 'Date').addEventListener('change', () => {
      const order = ['arrival','middle','final','exit'], index = order.indexOf(prefix);
      for (const next of order.slice(index + 1)) if (!$(next + 'Date').value) $(next + 'Date').value = $(prefix + 'Date').value;
    });
  }
  $('calcForm').addEventListener('submit', event => {
    event.preventDefault(); dirty();
    try {
      normalizeClocks();
      if (!$('calcForm').reportValidity()) return;
      const p = payload(); render(NG_ENGINE.calculate(p), p);
    } catch (error) { $('formError').textContent = error.message; $('formError').hidden = false; }
  });
  $('resetBtn').addEventListener('click', () => {
    $('calcForm').reset(); clocks.forEach(input=>input.setCustomValidity('')); dirty(); loadCatalog(); toggleMiddle(); $('arrivalTime').focus();
  });
  $('copyBtn').addEventListener('click', async () => {
    if (!lastResult) return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(lastText);
      else {
        const area = document.createElement('textarea'); area.value = lastText; area.style.position = 'fixed'; area.style.top = '-1000px';
        document.body.append(area); area.select();
        const ok = document.execCommand('copy'); area.remove(); if (!ok) throw new Error('copy');
      }
      $('copyStatus').textContent = 'Đã sao chép kết quả.';
    } catch (error) { $('copyStatus').textContent = 'Không sao chép được. Bạn có thể dùng “In kết quả” để lưu PDF.'; }
    $('copyStatus').hidden = false;
  });
  $('printBtn').addEventListener('click', () => { if (lastResult) window.print(); });
  window.addEventListener('storage', event => {
    if (event.key === C.KEY || event.key === null) { dirty(); loadCatalog(true); notice('Danh mục vừa được cập nhật. Bấm tính lại để dùng giá mới.'); }
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { dirty(); loadCatalog(true); } });
  loadCatalog(); toggleMiddle();
})();
