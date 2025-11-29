const express = require('express');
const router = express.Router();
const controller = require('../controllers/coursesController');

router.get('/', controller.getAllCourses);
router.get('/:id', controller.getCourseById);
router.post('/', controller.createCourse);
router.put('/:id', controller.updateCourse);
router.patch('/:id/increment', controller.incrementProgress);
router.patch('/:id/progress', controller.setProgress);
router.delete('/:id', controller.deleteCourse);

module.exports = router;