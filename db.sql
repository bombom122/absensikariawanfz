
CREATE DATABASE absensi_toko;
USE absensi_toko;

CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(255)
);

CREATE TABLE karyawan (
  id VARCHAR(20) PRIMARY KEY,
  nama VARCHAR(100)
);

CREATE TABLE absensi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_karyawan VARCHAR(20),
  tanggal DATE,
  jam TIME,
  shift ENUM('SHIFT 1','SHIFT 2'),
  status ENUM('TEPAT','TELAT'),
  UNIQUE (id_karyawan, tanggal)
);
