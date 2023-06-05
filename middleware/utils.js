const jwt = require('jsonwebtoken')

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split('Bearer ')[1]
  console.log('token', token)
  if (token == null) {
    return res.sendStatus(401)
  }

  jwt.verify(token, 'JWT-SECRET', (err, user) => {
    if (err) {
      console.log('Error:', err.message) // Log the error message for troubleshooting
      return res.sendStatus(403)
      return res.sendStatus(403)
    }
    console.log(user)
    req.user = user
    next()
  })
}
// function generateToken(user) {
//   const payload = { user }
//   return jwt.sign(payload, 'JWT-SECRET-KEY', { expiresIn: '1h' })
// }

module.exports = authenticateToken
