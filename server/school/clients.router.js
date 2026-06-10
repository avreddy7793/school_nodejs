const express = require('express');
const db = require('../api');
const clients = require('./clients');

const router = express.Router();
const presidentAccess = [db.checkToken, clients.requirePresident];

router.get('/summary', presidentAccess, clients.getSummary);
router.get('/categories', presidentAccess, clients.listCategories);
router.post('/categories', presidentAccess, clients.createCategory);
router.get('/:clientId/logins', presidentAccess, clients.listClientLogins);
router.post('/:clientId/logins/:loginId/reset-password', presidentAccess, clients.resetClientLoginPassword);
router.get('/', presidentAccess, clients.listClients);
router.post('/', presidentAccess, clients.createClient);

module.exports = router;
