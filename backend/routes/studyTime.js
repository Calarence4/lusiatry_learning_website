const express = require('express');
const router = express.Router();
const controller = require('../controllers/studyTimeController');

router.get('/', controller.getStudyTimeLogs);
router.get('/stats', controller.getStudyTimeStats);
router.get('/daily/:date', controller.getDailyTotal);
router.post('/', controller.createStudyTimeLog);
router.delete('/:id', controller.deleteStudyTimeLog);

module.exports = router;