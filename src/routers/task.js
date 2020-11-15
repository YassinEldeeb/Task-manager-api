const express = require("express")
const Task = require("../models/tasks")
const router = new express.Router()
const auth = require("../middleware/auth")

//Task POST end-point ~ Create-operation
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (err) {
    res.status(400).send(err)
  }
})

//Task POST end-point ~ Read-operation
router.get("/tasks", auth, async (req, res) => {
  try {
    const match = {}
    const sort = {}

    if (req.query.sortBy) {
      const condition = req.query.sortBy.split(":").length < 2
      const parts = condition
        ? req.query.sortBy.split("_")
        : req.query.sortBy.split(":")
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1
    }

    if (req.query.completed) {
      match.completed = req.query.completed === "true"
    }
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate()
    res.send(req.user.tasks || tasks)
  } catch (err) {
    res.status(500).send()
  }
})

//Task POST end-point ~ Read-operation Individual
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id

  try {
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.send(404).send()
    }
    res.send(task)
  } catch (err) {
    res.status(500).send()
  }
})

//Task PATCH end-point ~ Update-operation Individual
router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id
  //valid updates
  const allowedUpdates = ["completed", "description"]
  const updates = Object.keys(req.body)
  const validUpdates = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!validUpdates) {
    return res.status(400).send()
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    updates.forEach((update) => (task[update] = req.body[update]))
    await task.save()

    res.send(task)
  } catch (err) {
    res.status(400).send()
  }
})

//User DELETE end-point ~ Delete-operation Individual
router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id
  try {
    const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
    if (!task) {
      return res.status(404).send()
    }
    res.send(task)
  } catch (err) {
    res.status(500).send()
  }
})

module.exports = router
