const express = require('express');
const router = express.Router();
const controller = require('../controllers/draftsController');

router.get('/', controller.getAllDrafts);
router.get('/archived', controller.getArchivedTitles);
router.get('/:id', controller.getDraftById);
router.post('/', controller.createDraft);
router.put('/:id', controller.updateDraft);
router.post('/:id/archive', controller.archiveDraft);
router.delete('/:id', controller.deleteDraft);

module.exports = router;