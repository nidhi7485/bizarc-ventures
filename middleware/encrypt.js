const bcrypt = require('bcryptjs')

async function encryptPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10)

    const hashedPassword = await bcrypt.hash(password, salt)

    return hashedPassword
  } catch (error) {
    throw new Error('Password encryption failed')
  }
}
async function passwordIsMatch(password) {
  try {
    const isPasswordMatch = await comparePasswords(
      password,
      storedHashedPassword
    )

    if (isPasswordMatch) {
      console.log('Password match')
    } else {
      console.log('Password does not match')
    }
  } catch (error) {
    console.error(error)
  }
}
module.exports = encryptPassword
