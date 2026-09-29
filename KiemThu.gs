/** Tùy chọn: thêm tệp KiemThu.gs rồi chạy chayKiemThu. Không đọc/ghi dữ liệu người bệnh. */
function chayKiemThu() {
  var count = 0, messages = [];
  function equal(a,b,name) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(name + ': nhận ' + JSON.stringify(a) + ', cần ' + JSON.stringify(b)); }
  function ward(id,a,b,price) { return {wardId:id,name:id,start:a,end:b,price:price === undefined ? '' : price}; }
  function one(a,b,status) { return {origin:'PHONG_KHAM',arrival:a,admitMode:'KHOA',status:status || 'RA_VIEN',stays:[ward('A',a,b)]}; }
  function run(name,p,days,pending,shares) {
    var r=tinhCotLoi_(p); equal(r.totalDays,days,name); equal(r.pendingDays,pending || 0,name+' / chờ');
    equal(r.allocatedDays+r.pendingDays,r.totalDays,name+' / bảo toàn tổng');
    if(shares) Object.keys(shares).forEach(function(k){var w=r.byWard.filter(function(x){return x.ward===k;})[0];equal(w ? w.days : 0,shares[k],name+' / '+k);});
    count++;messages.push('ĐẠT: '+name);
  }
  function invalid(name,p) { var failed=false;try {tinhCotLoi_(p);}catch(e){failed=true;}if(!failed)throw new Error(name+': chưa chặn dữ liệu sai');count++;messages.push('ĐẠT: '+name); }
  run('3 giờ 59 phút',one('2026-09-01T08:00','2026-09-01T11:59'),0);
  run('Đúng 4 giờ',one('2026-09-01T08:00','2026-09-01T12:00'),0);
  run('4 giờ 1 phút',one('2026-09-01T08:00','2026-09-01T12:01'),1);
  run('23 giờ 59 phút',one('2026-09-01T08:00','2026-09-02T07:59'),1);
  run('Đúng 24 giờ thông thường',one('2026-09-01T08:00','2026-09-02T08:00'),1);
  run('Đúng 24 giờ tử vong',one('2026-09-01T08:00','2026-09-02T08:00','TU_VONG'),2);
  run('3,5 giờ tử vong vẫn không tính',one('2026-09-01T08:00','2026-09-01T11:30','TU_VONG'),0);
  run('20 giờ tử vong qua ngày vẫn 1',one('2026-09-01T08:00','2026-09-02T04:00','TU_VONG'),1);
  run('Ví dụ PDF 01/6 ra 05/6',one('2026-06-01T08:00','2026-06-05T10:00'),4);
  run('Ví dụ PDF 01/6 tử vong 05/6',one('2026-06-01T08:00','2026-06-05T10:00','TU_VONG'),5);
  run('Nặng xin về',one('2026-09-01T08:00','2026-09-03T10:00','NANG_XIN_VE'),3);
  run('Nặng chuyển viện',one('2026-09-01T08:00','2026-09-03T10:00','NANG_CHUYEN_VIEN'),3);
  run('Qua cấp cứu còn cần nội trú chuyển viện',one('2026-09-01T08:00','2026-09-03T10:00','QUA_CAP_CUU_CHUYEN'),3);
  run('Nhẹ xin về không cộng 1',one('2026-09-01T08:00','2026-09-03T10:00','XIN_VE'),2);
  run('Chuyển viện khác không cộng 1',one('2026-09-01T08:00','2026-09-03T10:00','CHUYEN_VIEN_KHAC'),2);
  run('Năm nhuận',one('2024-02-28T08:00','2024-03-01T08:00'),2);
  run('Qua năm',one('2025-12-31T08:00','2026-01-02T08:00'),2);
  run('Không làm tròn giờ/24',one('2026-09-01T23:00','2026-09-03T01:00'),2);
  var p=one('2026-09-01T08:00','2026-09-03T08:00');p.arrival='2026-08-31T20:00';
  run('Không cộng thời gian phòng khám',p,2);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays=[ward('A','2026-09-01T08:00','2026-09-01T10:00'),ward('B','2026-09-01T10:00','2026-09-03T08:00')];
  run('2 khoa không áp >4 giờ riêng từng khoa',p,2,0,{A:0.5,B:1.5});
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays=[ward('A','2026-09-01T08:00','2026-09-02T00:00'),ward('B','2026-09-02T00:00','2026-09-03T08:00')];
  run('Chuyển đúng 00:00 không đếm hai khoa ngày trước',p,2,0,{A:1,B:1});
  p=one('2026-09-01T00:00','2026-09-02T00:00');p.stays=[ward('A','2026-09-01T00:00','2026-09-01T06:00',400000),ward('B','2026-09-01T06:00','2026-09-01T12:00',800000),ward('C','2026-09-01T12:00','2026-09-02T00:00',600000)];
  run('3 khoa lấy giá cao nhất và thấp nhất',p,1,0,{A:0.5,B:0.5,C:0});
  p.stays[0].end='2026-09-01T04:00';p.stays[1].start='2026-09-01T04:00';
  run('3 khoa, đúng 4 giờ bị loại khỏi nhóm giá',p,1,0,{A:0,B:0.5,C:0.5});
  p.stays[1].price='';run('3 khoa thiếu giá: tổng vẫn có, phân bổ chờ',p,1,1);
  p.stays[0].end='2026-09-01T06:00';p.stays[1].start='2026-09-01T06:00';p.stays.forEach(function(s){s.price=500000;});
  run('3 khoa đồng giá cần xác nhận khoa',p,1,1);
  p=one('2026-09-01T00:00','2026-09-01T12:00');p.stays=[ward('A','2026-09-01T00:00','2026-09-01T04:00',1),ward('B','2026-09-01T04:00','2026-09-01T08:00',2),ward('C','2026-09-01T08:00','2026-09-01T12:00',3)];
  run('3 khoa đều đúng 4 giờ',p,1,1);
  p=one('2026-09-01T22:00','2026-09-02T06:00');p.stays=[ward('A','2026-09-01T22:00','2026-09-02T00:00'),ward('B','2026-09-02T00:00','2026-09-02T06:00')];
  run('Đợt ngắn qua nửa đêm chuyển khoa',p,1,1);
  p=one('2026-09-01T06:00','2026-09-02T12:00');p.origin='CAP_CUU';p.arrival='2026-09-01T00:00';p.admitMode='CAP_CUU';
  run('Cấp cứu >4 giờ thuộc nội trú + 1 khoa',p,1,0,{'Cấp cứu':0.5,A:0.5});
  p.stays[0].start='2026-09-01T04:00';
  run('Cấp cứu đúng 4 giờ không tự suy diễn phần còn lại',p,1,1,{'Cấp cứu':0});
  p.admitMode='KHOA';run('Mốc nội trú từ khoa: CC trước mốc không cộng',p,1,0,{A:1});
  p=one('2026-09-01T08:00','2026-09-03T00:00','TU_VONG');run('Tử vong đúng 00:00 vẫn giữ tổng, chờ phân bổ ngày cuối',p,3,1);
  p=one('2026-09-01T00:00','2026-09-02T00:00');p.stays=[ward('A','2026-09-01T00:00','2026-09-01T03:00'),ward('B','2026-09-01T03:00','2026-09-01T07:00'),ward('A','2026-09-01T07:00','2026-09-02T00:00')];
  run('Quay lại cùng khoa trong ngày: 2 khoa duy nhất',p,1,0,{A:0.5,B:0.5});
  invalid('Ngày 31/2',one('2026-02-31T08:00','2026-03-04T08:00'));
  invalid('Ra trước vào',one('2026-09-03T08:00','2026-09-01T08:00'));
  invalid('Lượt 0 phút',one('2026-09-01T08:00','2026-09-01T08:00'));
  p=one('2026-09-01T08:00','2026-09-02T08:00');p.arrival='2026-09-01T09:00';invalid('Tiếp nhận sau vào khoa',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays.push(ward('B','2026-09-03T07:00','2026-09-04T08:00'));invalid('Chồng lấn giờ chuyển',p);
  p.stays[1].start='2026-09-03T09:00';invalid('Khoảng trống giờ chuyển',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00','CHUYEN_KHOA');invalid('Không dùng chuyển khoa thay ra viện',p);
  p.status='__proto__';invalid('Chặn khóa tình trạng không hợp lệ',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays[0].price=-1;invalid('Giá âm',p);
  p.stays[0].price='500.000đ';invalid('Giá dạng chữ',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.admitMode='CAP_CUU';invalid('Phòng khám không chọn mốc CC',p);
  p=one('2026-09-01T08:00','2026-09-03T08:00');p.stays[0].wardId='__proto__';p.stays[0].name='constructor';run('Tên/mã khoa đặc biệt không phá bảng tổng',p,2);
  equal(safeCell_('=HYPERLINK("bad")').charAt(0),"'",'Chặn công thức trong mã hồ sơ');count++;messages.push('ĐẠT: Chặn công thức trong dữ liệu văn bản');
  var report={passed:count,failed:0,cases:messages};
  if(typeof Logger !== 'undefined') Logger.log(JSON.stringify(report,null,2));
  return report;
}
