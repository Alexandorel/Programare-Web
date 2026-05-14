'use strict';
var mongoose = require('mongoose'),
    Task = mongoose.model('Tasks');



/*

MongooseError: Model.find() no longer accepts a callback

exports.list_all_tasks = function(req, res) {
  Task.find({}, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};

*/

exports.list_all_tasks = async function(req, res) {
    try {
        // Așteaptă până când toate task-urile sunt găsite
        const tasks = await Task.find({}); 
        
        // Trimite răspunsul JSON cu task-urile
        res.json(tasks); 
    } catch (err) {
        res.status(500).send(err); // Trimite eroarea ca răspuns HTTP, cu cod de stare 500
    }
};


exports.create_a_task = async function(req, res) {
    var new_task = new Task(req.body);
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
        const task = await Task.findOneAndUpdate({_id: req.params.taskId}, req.body, {new: true});
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
