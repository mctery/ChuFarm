const express = require('express');
const {
  getMenus,
  getMenu,
  createMenu,
  updateMenu,
  deleteMenu,
  getAccessibleMenus,
} = require('../controllers/menuController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  createMenuSchema,
  updateMenuSchema,
} = require('../validations/menuValidation');

const router = express.Router();

router.use(verifyToken);

// Any authenticated user can get their accessible menus
router.get('/accessible', getAccessibleMenus);

router
  .route('/')
  .get(checkPermission('menus:read'), getMenus)
  .post(checkPermission('menus:write'), validate(createMenuSchema), createMenu);

router
  .route('/:id')
  .get(checkPermission('menus:read'), getMenu)
  .put(checkPermission('menus:write'), validate(updateMenuSchema), updateMenu)
  .delete(checkPermission('menus:delete'), deleteMenu);

module.exports = router;
