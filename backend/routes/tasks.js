const express = require('express');
const router = express.Router();
const controller = require('../controllers/tasksController');

router.get('/', controller.getAllTasks);
router.get('/date/:date', controller.getTasksByDate);
router.get('/month/:year/:month', controller.getMonthLogs);
router.get('/:id', controller.getTaskById);
router.get('/:id/progress', controller.getTaskProgress);
router.post('/', controller.createTask);
router.put('/:id', controller.updateTask);
router.delete('/:id', controller.deleteTask);
router.post('/:id/toggle', controller.toggleTask);
router.post('/:id/exclude', controller.excludeTask);

module.exports = router;