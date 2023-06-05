const express = require('express')
const app = express()

// const mysql = require('mysql')

// let con = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'userdb',
// })

// con.connect((err) => {
//   if (err) {
//     console.log(err)
//   } else {
//     console.log('connected')
//   }
// })

// con.query('select * from user', (err, result) => {
//   console.log('result', result)
// })
const port = process.env.PORT || 5000

// middleware
app.use(express.json())

// router
const uRouter = require('./routes/uRoutes')
app.use('/', uRouter)
app.get('/', async (req, res) => {
  res.send({ msg: 'home page' })
})
const start = () => {
  app.listen(port, console.log(`server is running on port ${port}`))
}

start()
