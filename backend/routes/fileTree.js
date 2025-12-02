const express = require('express');
const router = express.Router();
const controller = require('../controllers/fileTreeController');

router.get('/', controller.getFileTree);
router.get('/draft-box', controller.ensureDraftBox);
router.get('/today-count', controller.getTodayCount);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;