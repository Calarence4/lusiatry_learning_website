const express = require('express');
const router = express.Router();
const controller = require('../controllers/subjectsController');

router.get('/', controller.getSelectableSubjects);

module.exports = router;