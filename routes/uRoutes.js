const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/utils')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const fs = require('fs')

const encryptPassword = require('../middleware/encrypt')
const mysql = require('mysql')

let con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'userdb',
})

con.connect((err) => {
  if (err) {
    console.log(err)
  } else {
    console.log('connected')
  }
})

// Function to execute MySQL queries
function dbQuery(sql, values) {
  return new Promise((resolve, reject) => {
    con.query(sql, values, (err, results) => {
      if (err) {
        console.error(err) // Log the error for debugging purposes
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: storage })
// ...

// Define the file upload route
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log(req.file)
  try {
    const file = req.file
    console.log(file)
    if (!file) {
      return res.status(400).send('No file uploaded')
    }
    const fileContent = fs.readFileSync(file.path)
    const [result] = await dbQuery('UPDATE user SET image = ? WHERE id = ?', [
      fileContent,
      3,
    ])

    fs.unlinkSync(file.path)

    res.send('File uploaded and saved to database')
  } catch (error) {
    console.error(error)
    res.status(500).send('Internal Server Error')
  }
})

// ...

// ...

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  //   console.log(email, password)
  try {
    const user = await dbQuery(
      'SELECT * FROM user WHERE email= ? AND password= ?',
      [email, password]
    )
    // console.log(user)
    if (user.length === 1) {
      const token = jwt.sign({ user }, 'JWT-SECRET', { expiresIn: '1h' })
      res.json({ token })
    } else {
      res.status(401).json({ error: 'invalid credentials' })
    }
  } catch (error) {
    res.status(500).json({ error: 'internal server error' })
  }
})

router.post('/request-otp', async (req, res) => {
  const { phone, otp } = req.body
  try {
    const result = await dbQuery('SELECT * FROM user WHERE phone= ?', [phone])
    if (result.length === 0) {
      res.status(404).json({ error: 'user not found' })
      return
    }
    const currentTime = new Date()
    // expiration time for 5 minutes
    const otpExpiration = new Date(currentTime.getTime() + 5 * 60000)
    await dbQuery('UPDATE user SET otp= ?, otp_expiration= ? WHERE phone= ?', [
      otp,
      otpExpiration,
      phone,
    ])
    res.status(200).json({ message: 'successfully' })
  } catch (error) {
    console.error('Error occurred: ', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/reset-password', async (req, res) => {
  const { phone, newPassword } = req.body

  try {
    const result = await dbQuery('SELECT * FROM user WHERE phone= ?', [phone])
    const user = result[0]
    const hashedPassword = encryptPassword(newPassword)
    await dbQuery('UPDATE user SET password= ? WHERE phone= ?', [
      hashedPassword,
      phone,
    ])
    res.status(200).json({ message: 'password reset successsfully' })
  } catch (error) {
    console.error('Error occurred: ', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
router.post('/varify-otp', async (req, res) => {
  const { phone, otp } = req.body

  try {
    const result = await dbQuery('SELECT * FROM user WHERE phone= ?', [phone])

    const user = result[0]
    const currentTime = new Date()
    if (user.otp == otp && currentTime < user.otp_expiration) {
      res.status(200).json({ message: 'otp varify successsfully' })
    } else {
      res.status(400).json({ error: 'invalid otp or otp expired' })
    }
  } catch (error) {
    console.error('Error occurred: ', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// change password after login
router.post('/change-password', authenticateToken, async (req, res) => {
  const { id } = req.user
  const { currentPassword, newPassword } = req.body
  try {
    const user = await dbQuery('SELECT password FROM user WHERE id= ?', [id])
    const isPasswordMatch = await comparePasswords(
      currentPassword,
      user[0].password
    )
    if (!isPasswordMatch) {
      res.status(401).json({ msg: 'invalid current password' })
      return
    }
    const hashedPassword = encryptPassword(newPassword)
    await dbQuery('UPDATE user SET password= ? WHERE id= ?', [
      hashedPassword,
      id,
    ])
    res.status(200).json({ msg: 'password changed successfully' })
  } catch (error) {
    console.error('Error changing password: ', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})
// profile update

router.put('/user/profile', authenticateToken, async (req, res) => {
  const { id } = req.user
  const { name, email } = req.body

  try {
    await dbQuery('UPDATE user SET name = ?, email = ? WHERE id = ?', [
      name,
      email,
      id,
    ])

    res.status(200).json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error updating user profile: ', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

// get profile
router.get('/get-profile', authenticateToken, (req, res) => {
  //   console.log(req.headers)
  const user = req.user
  console.log(user)
  res.json({ user })
})

module.exports = router
