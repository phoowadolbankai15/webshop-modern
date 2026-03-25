const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('<h1>BR SHOP Server is Online!</h1><p>แก้ปัญหาเรียบร้อยแล้ว!</p>');
});

app.listen(port, () => {
  console.log('Server running on port ' + port);
});
