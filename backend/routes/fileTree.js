const express = require('express');
const router = express.Router();
const controller = require('../controllers/fileTreeController');

router.get('/', controller.getFileTree);
router.get('/:id', controller.getNodeById);
router.post('/', controller.createNode);
router.put('/:id', controller.updateNode);
router.patch('/:id/move', controller.moveNode);
router.delete('/:id', controller.deleteNode);

module.exports = router;