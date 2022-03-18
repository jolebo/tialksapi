var express = require('express');
const bodyParser = require('body-parser')
var app = express();
const db = require('./config');
const port = 3000;

app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin', '*');
  next()
})

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.get('/', (request, response) => {
  response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/users', db.getUsers)
app.get('/users/:id', db.getByUsersId)
app.post('/insertUsers', db.insertUser)
app.post('/updateUsers/:id', db.updateUser)
app.post('/deleteUsers/:id', db.deleteUser)

app.listen(port, ()=>{
	console.log(`Server running on port ${port}`)
})
