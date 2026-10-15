'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = __dirname;
const ctx = {console, Date, Map, Set, Number, JSON};
ctx.localStorage = {data:new Map(), getItem(k){return this.data.get(k) ?? null;},setItem(k,v){this.data.set(k,v);}};
vm.createContext(ctx);
for (const name of ['danh-muc.js','catalog.js','engine.js']) vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const E = ctx.NG_ENGINE, C = ctx.NG_CATALOG;
const X = require('./xlsx.full.min.js');
let count = 0;
function test(name, fn) { try { fn(); count++; } catch(e) { console.error('FAIL:',name); throw e; } }
const js = value => JSON.parse(JSON.stringify(value));
const dt = t => new Date(t).toISOString().slice(0,16);
const t0 = Date.UTC(2026,9,1,8);
const hour = 3600000, day = 24 * hour;
function one(start,end,status='RA_VIEN') {return {origin:'PHONG_KHAM',arrival:start,status,stays:[{wardId:'TM',name:'Nội Tim mạch',start,end,price:300000}]};}
function cc(start,transfer,end,status='RA_VIEN') {return {origin:'CAP_CUU',arrival:start,status,originWardId:'CC',originName:'Cấp cứu',originPrice:500000,stays:[{wardId:'TM',name:'Nội Tim mạch',start:transfer,end,price:300000}]};}
function three(prices=[500000,800000,300000], middle='2026-10-01T08:00', final='2026-10-01T14:00') {
 const p=cc('2026-10-01T00:00',final,'2026-10-02T08:00');p.originPrice=prices[0];p.stays[0].price=prices[2];
 p.stays.unshift({wardId:'NOI',name:'Nội tổng hợp',price:prices[1],start:middle,end:final});return p;
}
function ward(result,name){return result.byWard.find(w=>w.ward===name);}
function invariant(r) {assert.equal(r.allocatedDays+r.pendingDays,r.totalDays);for(const d of r.details) assert.ok(d.days === null || [0,0.5,1].includes(d.days));}
for(const status of Object.keys(ctx.NG.statuses)) for(const [minutes,days] of [[1,0],[239,0],[240,0],[241,1],[1439,1],[1440,ctx.NG.special.includes(status)?2:1]]) {
 test('Ngưỡng '+minutes+' phút, '+status,()=>{const r=E.calculateRaw(one(dt(t0),dt(t0+minutes*60000),status));assert.equal(r.totalDays,days);invariant(r);});
}
test('Cấp cứu luôn là mốc nội trú, kể cả payload cũ chọn KHOA',()=>{const p=cc('2026-10-01T22:00','2026-10-02T04:00','2026-10-03T06:00');p.admitMode='KHOA';const r=E.calculateRaw(p);assert.equal(r.totalDays,2);assert.equal(r.hours,32);assert.equal(r.normalized.admit,Date.UTC(2026,9,1,22));invariant(r);});
test('Mốc CUSTOM cũ không đổi được ngày bắt đầu Cấp cứu',()=>{const p=cc('2026-10-01T22:00','2026-10-02T04:00','2026-10-03T06:00');p.admitMode='CUSTOM';p.admission='2026-10-02T04:00';assert.equal(E.calculateRaw(p).totalDays,2);});
test('Phòng khám cũng là mốc bắt đầu nội trú theo yêu cầu',()=>{const p=one('2026-10-02T08:00','2026-10-03T08:00');p.arrival='2026-10-01T08:00';const r=E.calculateRaw(p);assert.equal(r.totalDays,2);assert.equal(r.hours,48);assert.equal(r.normalized.admit,Date.UTC(2026,9,1,8));invariant(r);});
test('Mốc Phòng khám không bị đổi bởi lựa chọn KHOA cũ',()=>{const p=one('2026-10-02T08:00','2026-10-03T08:00');p.arrival='2026-10-01T22:00';p.admitMode='KHOA';const r=E.calculateRaw(p);assert.equal(r.totalDays,2);assert.equal(r.hours,34);invariant(r);});
test('Vào từ Phòng khám: không tạo giường, giá hoặc phần nửa ngày Phòng khám',()=>{const p=one('2026-10-01T10:00','2026-10-02T12:00');p.arrival='2026-10-01T08:00';p.originPrice=999999999;const r=E.calculateRaw(p);assert.equal(r.pendingDays,0);assert.equal(ward(r,'Phòng khám'),undefined);assert.equal(ward(r,'Nội Tim mạch').days,1);assert.equal(r.normalized.originPrice,null);invariant(r);});
test('Phòng khám không đếm thành khoa thứ ba, khoa thường ≤4h vẫn 0,5 trong ngày 2 khoa',()=>{const p=one('2026-10-01T12:00','2026-10-03T12:00');p.arrival='2026-10-01T08:00';p.stays.unshift({wardId:'NOI',name:'Nội tổng hợp',price:800000,start:'2026-10-01T09:00',end:'2026-10-01T12:00'});const r=E.calculateRaw(p);assert.equal(r.pendingDays,0);assert.equal(ward(r,'Nội tổng hợp').days,.5);assert.equal(ward(r,'Nội Tim mạch').days,1.5);assert.ok(!r.byWard.some(w=>ctx.clinic_(w.ward)));invariant(r);});
test('Không gán giường PK khi mốc nội trú trước ngày có khoa giường thực tế',()=>{const p=one('2026-10-02T08:00','2026-10-03T08:00');p.arrival='2026-10-01T08:00';const r=E.calculateRaw(p);assert.equal(r.totalDays,2);assert.equal(r.pendingDays,1);assert.equal(ward(r,'Nội Tim mạch').days,1);assert.equal(ward(r,'Phòng khám'),undefined);invariant(r);});
test('Chặn Phòng khám giả thành khoa giường trong payload',()=>{const p=one('2026-10-01T08:00','2026-10-02T08:00');p.stays[0].name='Khoa Khám bệnh';assert.throws(()=>E.calculateRaw(p),/không phải khoa có giường/);});
test('Hai khoa cùng ngày, không áp ngưỡng 4 giờ cho khoa thường',()=>{const p=one('2026-10-01T08:00','2026-10-03T10:00');p.stays=[{wardId:'A',name:'A',price:400000,start:'2026-10-01T08:00',end:'2026-10-01T09:00'},{wardId:'B',name:'B',price:300000,start:'2026-10-01T09:00',end:'2026-10-03T10:00'}];const r=E.calculateRaw(p);assert.equal(ward(r,'A').days,.5);assert.equal(ward(r,'B').days,1.5);invariant(r);});
test('Hai khoa CC và Tim mạch, CC trên 4 giờ',()=>{const r=E.calculateRaw(cc('2026-10-01T06:00','2026-10-01T12:00','2026-10-03T12:00'));assert.equal(ward(r,'Cấp cứu').days,.5);assert.equal(ward(r,'Nội Tim mạch').days,1.5);invariant(r);});
test('CC đúng 4 giờ: không gán 0,5 ngày CC, còn phần đối chiếu',()=>{const r=E.calculateRaw(cc('2026-10-01T06:00','2026-10-01T10:00','2026-10-03T12:00'));assert.equal(ward(r,'Cấp cứu').days,0);assert.equal(r.pendingDays,1);assert.equal(r.totalDays,2);invariant(r);});
test('Ba khoa: chọn giá cao nhất và thấp nhất, bỏ giá giữa',()=>{const r=E.calculateRaw(three());assert.equal(ward(r,'Cấp cứu').days,0);assert.equal(ward(r,'Nội tổng hợp').days,.5);assert.equal(ward(r,'Nội Tim mạch').days,.5);assert.equal(r.pendingDays,0);invariant(r);});
test('Ba khoa: CC ≤4h không chặn phân bổ hai khoa còn lại đều >4h',()=>{const r=E.calculateRaw(three([500000,800000,300000],'2026-10-01T02:00','2026-10-01T08:00'));assert.equal(ward(r,'Cấp cứu').days,0);assert.equal(ward(r,'Nội tổng hợp').days,.5);assert.equal(ward(r,'Nội Tim mạch').days,.5);assert.equal(r.pendingDays,0);assert.ok(r.details.filter(d=>d.ward==='Nội tổng hợp').every(d=>!d.explanation.includes('Cấp cứu ≤4')));invariant(r);});
test('Ca trong ảnh: CC 1h31, Nội 3h01, Tim mạch 29 phút trong ngày đầu',()=>{const p=cc('2026-10-01T18:59','2026-10-01T23:31','2026-10-06T16:00');p.stays.unshift({wardId:'NOI',name:'Nội tổng hợp',price:800000,start:'2026-10-01T20:30',end:'2026-10-01T23:31'});const r=E.calculateRaw(p);assert.equal(r.totalDays,5);assert.equal(r.pendingDays,1);assert.equal(ward(r,'Nội Tim mạch').days,4);const ordinary=r.details.filter(d=>d.days===null&&d.ward!=='Cấp cứu');assert.equal(ordinary.length,2);assert.ok(ordinary.every(d=>d.pendingReason==='THREE_TOO_FEW'));assert.ok(ordinary.every(d=>!d.explanation.includes('Cấp cứu ≤4')));invariant(r);});
test('Ba khoa: khoa thường đúng 4 giờ bị loại khỏi nhóm giá',()=>{const r=E.calculateRaw(three([500000,900000,300000],'2026-10-01T08:00','2026-10-01T12:00'));assert.equal(ward(r,'Nội tổng hợp').days,0);assert.equal(ward(r,'Cấp cứu').days,.5);assert.equal(ward(r,'Nội Tim mạch').days,.5);invariant(r);});
test('Ba khoa thiếu giá không tự chọn khoa',()=>{const r=E.calculateRaw(three([null,800000,300000]));assert.equal(r.totalDays,1);assert.equal(r.pendingDays,1);invariant(r);});
test('Ba khoa đồng giá không tự chọn khoa',()=>{const r=E.calculateRaw(three([500000,500000,500000]));assert.equal(r.pendingDays,1);invariant(r);});
test('Ba khoa chỉ một khoa >4 giờ: không bịa phân bổ',()=>{const r=E.calculateRaw(three([500000,800000,300000],'2026-10-01T03:00','2026-10-01T06:00'));assert.equal(r.pendingDays,1);invariant(r);});
test('Đợt <24h qua nửa đêm có chuyển khoa: giữ tổng, chờ phân bổ',()=>{const r=E.calculateRaw(cc('2026-10-01T18:00','2026-10-02T01:00','2026-10-02T10:00'));assert.equal(r.totalDays,1);assert.equal(r.pendingDays,1);invariant(r);});
test('Chuyển khoa đúng 00:00 không ghi 2 khoa ở ngày trước',()=>{const r=E.calculateRaw(cc('2026-10-01T08:00','2026-10-02T00:00','2026-10-03T10:00'));assert.equal(ward(r,'Cấp cứu').days,1);assert.equal(ward(r,'Nội Tim mạch').days,1);invariant(r);});
test('Tử vong đúng 00:00 giữ tổng +1 và đối chiếu ngày không có giờ nằm',()=>{const r=E.calculateRaw(one('2026-10-01T08:00','2026-10-03T00:00','TU_VONG'));assert.equal(r.totalDays,3);assert.equal(r.pendingDays,1);invariant(r);});
test('Qua năm nhuận',()=>{const r=E.calculateRaw(one('2024-02-28T08:00','2024-03-01T08:00'));assert.equal(r.totalDays,2);invariant(r);});
test('Qua năm',()=>assert.equal(E.calculateRaw(one('2026-12-31T23:00','2027-01-02T01:00')).totalDays,2));
for(const invalid of ['2026-02-29T08:00','2026-04-31T08:00','2026-01-01T24:00','2026-01-01T08:60','1899-01-01T08:00','2201-01-01T08:00','15/10/2026 08:00','']) test('Chặn ngày sai '+invalid,()=>assert.throws(()=>E.calculateRaw(one(invalid,'2026-10-01T12:00'))));
test('Chặn giờ ra trước giờ vào',()=>assert.throws(()=>E.calculateRaw(one('2026-10-01T12:00','2026-10-01T08:00'))));
test('Chặn lượt 0 phút',()=>assert.throws(()=>E.calculateRaw(one('2026-10-01T08:00','2026-10-01T08:00'))));
test('Chặn CC sau khoa cuối',()=>assert.throws(()=>E.calculateRaw(cc('2026-10-01T14:00','2026-10-01T12:00','2026-10-02T12:00'))));
for(const change of [-60000,60000]) test('Chặn khoảng trống hoặc chồng lấn '+change,()=>{const p=three();p.stays[1].start=dt(Date.UTC(2026,9,1,14)+change);assert.throws(()=>E.calculateRaw(p));});
for(const bad of [0,-1,1.5,'abc',1000000001,true,[],{},'0x10']) test('Chặn giá engine sai '+bad,()=>{const p=one('2026-10-01T08:00','2026-10-02T08:00');p.stays[0].price=bad;assert.throws(()=>E.calculateRaw(p));});
test('Chặn khóa trạng thái kế thừa prototype',()=>{const p=one('2026-10-01T08:00','2026-10-02T08:00');p.status='toString';assert.throws(()=>E.calculateRaw(p));});
test('Tên khoa có ký tự đặc biệt không phá tổng',()=>{const p=one('2026-10-01T08:00','2026-10-02T08:00');p.stays[0].name='__proto__';assert.equal(E.calculateRaw(p).totalDays,1);});
test('Đối chiếu độc lập 600 đợt điều trị',()=>{
 let seed=7142;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let i=0;i<600;i++){
  const start=Date.UTC(2024+rand()%4,rand()%12,1+rand()%27,rand()%24,rand()%60), ms=(1+rand()%20000)*60000;
  const status=i%2?'RA_VIEN':'TU_VONG';const delta=Math.floor((start+ms)/day)-Math.floor(start/day);
  const expected=ms<=4*hour?0:ms<24*hour?1:delta+(status==='TU_VONG'?1:0);
  const r=E.calculateRaw(one(dt(start),dt(start+ms),status));assert.equal(r.totalDays,expected);invariant(r);
 }
});
for(const s of [500000,'500000','500.000','500,000','500 000','500\u00a0000','500.000 đ','500000 VND']) test('Đọc giá hợp lệ '+s,()=>assert.equal(C.price(s),500000));
for(const s of ['500,5','500.5','12 34','1.2.3',0,-1,true,{},'1e6','-500000','500000abc',Infinity]) test('Chặn giá danh mục sai '+s,()=>assert.throws(()=>C.price(s)));
test('Giá trống tùy chọn khác 0',()=>{assert.equal(C.price('',false),null);assert.throws(()=>C.price(''));assert.throws(()=>C.price(0,false));});
test('Không trùng khoa khi khác hoa thường/dấu/prefix Khoa',()=>assert.throws(()=>C.validate([{name:'Khoa Nội Tim mạch',price:300000},{name:'noi tim MACH',price:500000}]),/trùng/));
test('Danh mục rỗng không xóa bản cũ',()=>assert.throws(()=>C.validate([])));
test('Không nhập Phòng khám vào giá giường',()=>assert.throws(()=>C.validate([{name:'Phòng khám',price:450000}]),/không có giường/));
function workbook(rows,bookType){const w=X.utils.book_new();X.utils.book_append_sheet(w,X.utils.aoa_to_sheet(rows),'Danh muc');if(bookType)return X.read(X.write(w,{bookType,type:'buffer'}),{type:'buffer'});return w;}
const validRows=[['tên khoa','giá tiền'],['Cấp cứu',500000],['Nội Tim mạch','300.000']];
test('Excel đúng 1 sheet, hai cột',()=>{const rows=C.fromWorkbook(workbook(validRows),ctx.NG_DEFAULT_CATALOG.wards);assert.equal(rows.length,2);assert.equal(rows[0].id,'CC');assert.equal(rows[1].id,'TM');assert.equal(rows[1].price,300000);});
for(const format of ['xlsx','biff8']) test('Đọc tệp '+format+' thực qua ghi/đọc nhị phân',()=>{const w=workbook(validRows,format);const rows=C.fromWorkbook(w,ctx.NG_DEFAULT_CATALOG.wards);assert.equal(rows[0].name,'Cấp cứu');assert.equal(rows[1].price,300000);});
test('Bỏ hàng trống, giữ số dòng lỗi gốc',()=>{const w=workbook([validRows[0],[],validRows[1],['Nội Tim mạch','']]);assert.throws(()=>C.fromWorkbook(w,[]),/Dòng 4/);});
test('Chặn nhiều sheet',()=>{const w=workbook(validRows);X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([]),'Sheet2');assert.throws(()=>C.fromWorkbook(w,[]),/đúng 1 sheet/);});
test('Chặn sai tiêu đề',()=>assert.throws(()=>C.fromWorkbook(workbook([['Tên bệnh nhân','Giá tiền'],['A',5]]),[]),/Hàng 1/));
test('Chặn cột phụ có dữ liệu',()=>assert.throws(()=>C.fromWorkbook(workbook([['tên khoa','giá tiền','phụ'],['A',5]]),[]),/2 cột/));
test('Không vướng cột/hàng chỉ định dạng nhưng không có dữ liệu',()=>{const w=workbook(validRows);w.Sheets['Danh muc']['!ref']='A1:XFD1048576';w.Sheets['Danh muc'].ZZ10000={t:'z'};assert.equal(C.fromWorkbook(w,[]).length,2);});
test('Chặn công thức kể cả có cache số cũ',()=>{const w=workbook(validRows);w.Sheets['Danh muc'].B2={t:'n',v:500000,f:'1+1'};assert.throws(()=>C.fromWorkbook(w,[]),/công thức/);});
test('Chặn ô lỗi Excel',()=>{const w=workbook(validRows);w.Sheets['Danh muc'].B2={t:'e',v:7};assert.throws(()=>C.fromWorkbook(w,[]),/kiểu dữ liệu/);});
test('Lưu và tải lại giữ đúng giá, ID khoa',()=>{const wards=C.fromWorkbook(workbook(validRows),ctx.NG_DEFAULT_CATALOG.wards);C.save(wards);const loaded=C.load();assert.equal(loaded.source,'local');assert.deepEqual(js(loaded.wards),js(wards));});
test('Nâng bản cũ: bỏ PK nhưng giữ nguyên khoa, giá, mã và dữ liệu gốc',()=>{const before=ctx.localStorage.getItem(C.KEY),data=JSON.parse(before);data.wards.push({id:'PK',name:'Phòng khám',price:450000});const raw=JSON.stringify(data);ctx.localStorage.setItem(C.KEY,raw);const loaded=C.load();assert.equal(loaded.wards.length,2);assert.equal(loaded.wards[0].price,500000);assert.equal(loaded.wards[1].id,'TM');assert.ok(loaded.error.includes('Phòng khám'));assert.equal(ctx.localStorage.getItem(C.KEY),raw);ctx.localStorage.setItem(C.KEY,before);});
test('Excel sai hoặc lưu lỗi không làm mất bản đã lưu',()=>{const before=ctx.localStorage.getItem(C.KEY);assert.throws(()=>C.save([{name:'A',price:'abc'}]));assert.equal(ctx.localStorage.getItem(C.KEY),before);});
test('Chặn lưu không được phép, không báo thành công giả',()=>{const old=ctx.localStorage.setItem;ctx.localStorage.setItem=()=>{throw new Error('blocked');};assert.throws(()=>C.save([{name:'A',price:5}]),/không cho lưu/);ctx.localStorage.setItem=old;});
test('Dữ liệu lưu hỏng có thông báo và fallback',()=>{const before=ctx.localStorage.getItem(C.KEY);ctx.localStorage.setItem(C.KEY,'{bad');const data=C.load();assert.ok(data.error);assert.equal(data.source,'shared');ctx.localStorage.setItem(C.KEY,before);});
test('Danh mục dùng chung mới hơn thay bản lưu cũ',()=>{const before=ctx.NG_DEFAULT_CATALOG.updatedAt;ctx.NG_DEFAULT_CATALOG.updatedAt=Date.now()+10000;assert.equal(C.load().source,'shared');ctx.NG_DEFAULT_CATALOG.updatedAt=before;});
test('Đồng hồ máy sai không làm mất danh mục vừa lưu',()=>{const raw=ctx.localStorage.getItem(C.KEY),data=JSON.parse(raw);data.savedAt=1;ctx.localStorage.setItem(C.KEY,JSON.stringify(data));assert.equal(C.load().source,'local');ctx.localStorage.setItem(C.KEY,raw);});
test('Tên khoa dạng số bị chặn',()=>assert.throws(()=>C.validate([{name:1234,price:500000}]),/văn bản/));
test('Danh mục .js xuất ra giữ tên tiếng Việt và không chạy nội dung khoa',()=>{const text=C.sharedFile([{name:'Khoa <script> & "đặc biệt"',price:500000}]);const target={};vm.createContext(target);vm.runInContext(text,target);assert.equal(target.NG_DEFAULT_CATALOG.wards[0].name,'Khoa <script> & "đặc biệt"');assert.equal(target.NG_DEFAULT_CATALOG.wards[0].price,500000);});
test('Mọi script, css, liên kết nội bộ đều nằm trong gói',()=>{
 for(const file of ['index.html','danhmuc.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const ref=match[1];if(!/^https?:/.test(ref))assert.ok(fs.existsSync(path.join(root,ref.split('?')[0])),ref);}
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  const app=fs.readFileSync(path.join(root,file==='index.html'?'app.js':'catalog-page.js'),'utf8');
  for(const match of app.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),'Thiếu phần tử '+match[1]);
 }
});
for(const [value,expected] of [['07:30','07:30'],['7:30','07:30'],['0730','07:30'],['730','07:30'],['1845','18:45'],['2359','23:59'],['0000','00:00'],['0:00','00:00']])test('Giờ 24h '+value,()=>assert.equal(E.normalizeClock(value),expected));
for(const value of ['24:00','23:60','2400','1260','7:3','7','07','7:30 PM','12:00 AM','-730','00000',''])test('Chặn giờ nhập sai '+value,()=>assert.throws(()=>E.normalizeClock(value)));
test('Chỉ còn chọn nguồn và khoa trung gian; Tim mạch cố định và 4 ô giờ 24h',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(!/id="(?:ccWard|finalWard)"/.test(html));assert.equal([...html.matchAll(/<select\b/g)].length,3);assert.equal([...html.matchAll(/class="clock-input"/g)].length,4);assert.ok(!html.includes('type="time"'));assert.ok(html.includes('Vào khoa Nội Tim mạch'));});
console.log(JSON.stringify({passed:count,failed:0,randomEpisodes:600,timezone:process.env.TZ||Intl.DateTimeFormat().resolvedOptions().timeZone,engine:E.version,excel:X.version}));
