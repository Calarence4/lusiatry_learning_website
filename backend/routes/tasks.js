const express = require('express');
const router = express.Router();
const controller = require('../controllers/tasksController');

router.get('/', controller.getAllTasks);
router.get('/:id', controller.getTaskById);
router.get('/date/:date', controller.getTasksByDate);
router.post('/', controller.createTask);
router.put('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);
router.post('/:id/toggle', controller.toggleTask);
router.post('/:id/exclude', controller.excludeTask);
router.get('/:id/progress', controller.getTaskProgress);

module.exports = router;