(function() {
  'use strict';
  const $ = id => document.getElementById(id), C = NG_CATALOG;
  let changed = false, importRevision = 0, editingRevision = 0;
  function message(text, type = '') {
    $('catalogMessage').textContent = text; $('catalogMessage').className = 'notice' + (type ? ' ' + type : '');
    $('catalogMessage').hidden = !text;
  }
  function updateCount() { $('catalogCount').textContent = $('catalogRows').children.length + ' khoa · Đơn vị: đồng/ngày'; }
  function markChanged() { editingRevision++; changed = true; $('unsaved').hidden = false; updateCount(); message(''); }
  function addRow(ward = {}) {
    const row = document.createElement('tr'); row.dataset.id = ward.id || '';
    const nameCell = document.createElement('td'), priceCell = document.createElement('td'), removeCell = document.createElement('td');
    const name = document.createElement('input'), price = document.createElement('input'), remove = document.createElement('button');
    name.className = 'ward-name'; name.value = ward.name || ''; name.maxLength = 100; name.placeholder = 'Tên khoa'; name.setAttribute('aria-label', 'Tên khoa'); name.autocomplete = 'off';
    price.className = 'ward-price'; price.value = ward.price == null ? '' : String(ward.price); price.inputMode = 'numeric'; price.placeholder = 'Nhập giá'; price.setAttribute('aria-label', 'Giá tiền khoa ' + (ward.name || 'mới') + ', đồng mỗi ngày'); price.autocomplete = 'off';
    remove.type = 'button'; remove.className = 'delete-btn'; remove.textContent = '×'; remove.title = 'Xóa khoa'; remove.setAttribute('aria-label', 'Xóa khoa ' + (ward.name || 'mới'));
    remove.addEventListener('click', () => { row.remove(); markChanged(); });
    nameCell.append(name); priceCell.append(price); removeCell.append(remove); row.append(nameCell, priceCell, removeCell); $('catalogRows').append(row);
  }
  function showRows(wards) { $('catalogRows').replaceChildren(); wards.forEach(addRow); updateCount(); }
  function rows() { return [...$('catalogRows').children].map((row,i) => ({id:row.dataset.id, name:row.querySelector('.ward-name').value, price:row.querySelector('.ward-price').value, row:i + 2})); }
  function load() {
    const data = C.load(); showRows(data.wards); changed = false; $('unsaved').hidden = true;
    message(data.error, data.error ? 'warning' : '');
  }
  function needXlsx() { if (!globalThis.XLSX) throw new Error('Thiếu thư viện đọc Excel. Hãy tải đủ tệp xlsx.full.min.js cùng cấp với index.html lên GitHub.'); }
  function download(blob, filename) {
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  function exportExcel(data, filename) {
    needXlsx();
    const ws = XLSX.utils.aoa_to_sheet([['tên khoa','giá tiền'], ...data.map(w => [w.name, w.price == null ? null : w.price])]);
    ws['!cols'] = [{wch:38},{wch:22}];
    for (let i = 2; i <= data.length + 1; i++) if (ws['B' + i]) ws['B' + i].z = '#,##0';
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Danh muc khoa');
    download(new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), filename);
  }
  $('catalogRows').addEventListener('input', markChanged);
  $('addWardBtn').addEventListener('click', () => {
    if ($('catalogRows').children.length >= 1000) return message('Tối đa 1.000 khoa.', 'error');
    addRow(); markChanged(); $('catalogRows').lastElementChild.querySelector('input').focus();
  });
  $('revertBtn').addEventListener('click', () => { importRevision++; load(); $('excelFile').value = ''; });
  $('excelFile').addEventListener('change', async event => {
    const input = event.target;
    const file = input.files[0], revision = ++importRevision, beforeEdit = editingRevision;
    if (!file) return;
    try {
      needXlsx();
      if (!/\.(xlsx|xls)$/i.test(file.name)) throw new Error('Chọn tệp Excel .xlsx hoặc .xls.');
      if (file.size > 10 * 1024 * 1024) throw new Error('Tệp tối đa 10 MB. Chỉ giữ sheet danh mục khoa.');
      message('Đang đọc tệp Excel…');
      const buffer = await file.arrayBuffer();
      if (revision !== importRevision) return;
      if (beforeEdit !== editingRevision) return message('Bảng vừa được sửa trong lúc đọc tệp. Đã giữ phần bạn sửa; hãy chọn lại Excel nếu muốn thay bảng.', 'warning');
      const wb = XLSX.read(buffer, {type:'array', cellFormula:true, cellDates:false});
      const wards = C.fromWorkbook(wb, C.load().wards);
      showRows(wards); markChanged();
      message('Đã đọc ' + wards.length + ' khoa từ “' + file.name + '”. Kiểm tra bảng và bấm Lưu danh mục.');
    } catch (error) { if (revision === importRevision) message(error.message + '\nDanh mục đã lưu chưa bị thay đổi.', 'error'); }
    finally { if (revision === importRevision) input.value = ''; }
  });
  $('catalogForm').addEventListener('submit', event => {
    event.preventDefault();
    importRevision++;
    $('excelFile').value = '';
    try {
      const data = C.save(rows()); showRows(data.wards); changed = false; $('unsaved').hidden = true;
      message('Đã lưu ' + data.wards.length + ' khoa. Trang tính sẽ dùng ngay danh mục và giá mới.');
    } catch (error) { message(error.message, 'error'); }
  });
  $('templateBtn').addEventListener('click', () => {
    try { exportExcel((NG_DEFAULT_CATALOG.wards || []).map(w => ({name:w.name,price:null})), 'Mau-danh-muc-khoa.xlsx'); }
    catch (error) { message(error.message, 'error'); }
  });
  $('exportBtn').addEventListener('click', () => {
    try { exportExcel(C.validate(rows()), 'Danh-muc-khoa.xlsx'); }
    catch (error) { message(error.message, 'error'); }
  });
  $('sharedBtn').addEventListener('click', () => {
    try { download(new Blob([C.sharedFile(rows())], {type:'text/javascript;charset=utf-8'}), 'danh-muc.js'); }
    catch (error) { message(error.message, 'error'); }
  });
  window.addEventListener('beforeunload', event => { if (changed) { event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('storage', event => {
    if (event.key !== C.KEY && event.key !== null) return;
    if (!changed) load();
    else message('Danh mục đã được đổi ở tab khác. “Bỏ thay đổi” để lấy bản mới, hoặc “Lưu danh mục” để thay bằng bảng đang mở.', 'warning');
  });
  load();
})();
