const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTdkM2YyNmUzYWJiYTkzNTIxYTcxZjciLCJlbWFpbCI6InRuaGFuMDUtdjFAZ21haWwuY29tIiwiaWF0IjoxNzAyODc4ODkxLCJleHAiOjE3MDI5MTU0OTF9.gAFSUwZ31T72A6zgx4PgrMLTI2tsA2NJi4M0BFy5vA4';

const body = {
  productID: '654b750853e01dd4f8586ab1',
  quantity: 4,
  orderPrice: 20000,
};

fetch('https://ultimate-implicitly-hound.ngrok-free.app/order', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})
  .then((res) => res.json())
  .then((res) => console.log(res));
