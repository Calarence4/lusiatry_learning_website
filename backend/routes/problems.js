const express = require('express');
const router = express.Router();
const controller = require('../controllers/problemsController');

router.get('/', controller.getAllProblems);
router.get('/:id', controller.getProblemById);
router.post('/', controller.createProblem);
router.put('/:id', controller.updateProblem);
router.patch('/:id/solve', controller.solveProblem);
router.patch('/:id/unsolve', controller.unsolveProblem);
router.post('/:id/draft', controller.addDraftToProblem);
router.post('/:id/note', controller.addNoteToProblem);
router.delete('/:id', controller.deleteProblem);

module.exports = router;