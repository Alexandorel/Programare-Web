'use strict';

const mongoose = require('mongoose');
const Task = mongoose.model('Tasks');

exports.list_all_tasks = async function(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user) filter.user = req.query.user;

    const tasks = await Task.find(filter);
    res.json(tasks);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.create_a_task = async function(req, res) {
  const new_task = new Task(req.body);
  try {
    const task = await new_task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.read_a_task = async function(req, res) {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.update_a_task = async function(req, res) {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId },
      req.body,
      { new: true }
    );
    if (!task) {
      return res.status(404).send({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.delete_a_task = async function(req, res) {
  try {
    const result = await Task.deleteOne({ _id: req.params.taskId });
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Task not found' });
    }
    res.json({ message: 'Task successfully deleted' });
  } catch (err) {
    res.status(500).send(err);
  }
};
