const express = require('express');
const router = express.Router();
const controller = require('../controllers/coursesController');

router.get('/stats', controller.getCourseStats);
router.get('/activity', controller.getRecentActivity);  // 学习动态
router.get('/', controller.getAllCourses);
router.get('/:id', controller.getCourseById);
router.get('/:id/logs', controller.getCourseLogs);
router.post('/', controller.createCourse);
router.put('/:id', controller.updateCourse);
router.patch('/:id/increment', controller.incrementProgress);
router.patch('/:id/progress', controller.setProgress);
router.patch('/:id/logs/:logId', controller.addLogNote);
router.delete('/:id', controller.deleteCourse);

module.exports = router;