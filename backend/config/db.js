const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost', 
  user: 'root', 
  password: '12345678', 
  database: 'tour_management',
});

connection.connect(err => {
  if (err) {
    console.error('Lỗi kết nối MySQL:', err);
    return;
  }
  console.log('Kết nối MySQL thành công!');

});

module.exports = connection;
