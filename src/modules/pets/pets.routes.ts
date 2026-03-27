import { Router } from 'express';
import { authenticate, validate } from '../../shared/middleware';
import { asyncHandler } from '../../shared/utils';
import { petsController } from './pets.controller';
import { createPetSchema, updatePetSchema } from './pets.schema';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(petsController.list.bind(petsController)));
router.get('/:id', asyncHandler(petsController.getById.bind(petsController)));
router.post('/', validate(createPetSchema), asyncHandler(petsController.create.bind(petsController)));
router.patch('/:id', validate(updatePetSchema), asyncHandler(petsController.update.bind(petsController)));
router.delete('/:id', asyncHandler(petsController.delete.bind(petsController)));

export { router as petsRouter };
