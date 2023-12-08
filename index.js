fetch('https://ultimate-implicitly-hound.ngrok-free.app/auth/me', {
  headers: {Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NTUyZTg0NDI3YWVkZWJhYzVlZWY4N2EiLCJlbWFpbCI6InR1dHJhbmFuaC4yNjZAZ21haWwuY29tIiwiaWF0IjoxNzAyMDU0NTAwLCJleHAiOjE3MDIwOTExMDB9.xizJ4_oaljegB6-MDDKzCPVfiNrHWYRVXgzr4cTjVPI'}
})
   .then(resp => resp.json())
   .then(json => console.log(json))