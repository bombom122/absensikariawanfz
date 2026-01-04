
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const ExcelJS = require('exceljs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'absensi_secret_produksi',
  resave: false,
  saveUninitialized: false
}));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'absensi_toko'
});

function getShiftDanStatus(jam) {
  if (jam >= "05:00:00" && jam <= "10:59:59") {
    return { shift: "SHIFT 1", status: jam > "07:00:00" ? "TELAT" : "TEPAT" };
  }
  if (jam >= "12:00:00" && jam <= "17:59:59") {
    return { shift: "SHIFT 2", status: jam > "14:00:00" ? "TELAT" : "TEPAT" };
  }
  return null;
}

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM admin WHERE username=? AND password=SHA2(?,256)",
    [username, password],
    (err, r) => {
      if (r && r.length) {
        req.session.admin = true;
        res.redirect('/admin.html');
      } else {
        res.send('Login gagal');
      }
    }
  );
});

app.post('/absen', (req, res) => {
  const { id } = req.body;
  const now = new Date();
  const tanggal = now.toISOString().split('T')[0];
  const jam = now.toTimeString().slice(0,8);
  const info = getShiftDanStatus(jam);
  if (!info) return res.send("Diluar jam kerja");

  db.query(
    "INSERT INTO absensi (id_karyawan, tanggal, jam, shift, status) VALUES (?,?,?,?,?)",
    [id, tanggal, jam, info.shift, info.status],
    err => {
      if (err) return res.send("Sudah absen hari ini");
      res.send(`Absensi berhasil (${info.shift} - ${info.status})`);
    }
  );
});

app.get('/export', (req, res) => {
  if (!req.session.admin) return res.sendStatus(403);
  db.query("SELECT * FROM absensi", async (err, rows) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Absensi');
    ws.columns = [
      { header: 'ID', key: 'id_karyawan' },
      { header: 'Tanggal', key: 'tanggal' },
      { header: 'Jam', key: 'jam' },
      { header: 'Shift', key: 'shift' },
      { header: 'Status', key: 'status' }
    ];
    rows.forEach(r => ws.addRow(r));
    res.setHeader('Content-Disposition','attachment; filename=absensi.xlsx');
    await wb.xlsx.write(res);
    res.end();
  });
});

app.listen(3000, () => console.log("Server running"));

app.get('/data-absensi', (req, res) => {
  if (!req.session.admin) return res.sendStatus(403);

  db.query("SELECT * FROM absensi ORDER BY tanggal DESC, jam DESC", (err, rows) => {
    res.json(rows);
  });
});