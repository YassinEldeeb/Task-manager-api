const express = require("express")
const multer = require("multer")
const sharp = require("sharp")
const User = require("../models/users")
const auth = require("../middleware/auth")
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account")
const router = new express.Router()

//Signing up for a user
router.post("/users", async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (err) {
    res.status(400).send(err)
  }
})

//Logging in user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (err) {
    res.status(400).send()
  }
})
//Logging out user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})
//Logging out all users
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

//Read Profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user)
})

//Update a single user
router.patch("/users/me", auth, async (req, res) => {
  //Allowed Updates
  const updates = Object.keys(req.body)
  const allowedUpdated = ["name", "email", "age", "password"]
  let invalidUpdates = []
  //Invalid Updates array
  updates.forEach((update) => {
    if (!allowedUpdated.includes(update)) {
      invalidUpdates.push(update)
    }
  })

  //Invalid updates
  const validUpdates = updates.every((update) =>
    allowedUpdated.includes(update)
  )

  if (!validUpdates) {
    return res
      .status(400)
      .send(`error:unable to update ${invalidUpdates.join(" ,")}`)
  }
  //Valid updates
  try {
    updates.forEach((update) => (req.user[update] = req.body[update]))
    await req.user.save()
    res.send(req.user)
  } catch (err) {
    res.status(400).send()
  }
})

//Delete user
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove()
    sendCancelationEmail(req.user.email, req.user.name)
    res.send(req.user)
  } catch (err) {
    res.send(500).send()
  }
})

//Upload avatar
const avatar = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please provide an image"))
    }
    cb(undefined, true)
  },
})

router.post(
  "/users/me/avatar",
  auth,
  avatar.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send()
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message })
  }
)

//Deleting avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

//Serving up profile picture
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }
    res.set("Content-Type", "image/png")
    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
})

module.exports = router
