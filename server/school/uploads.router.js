const express = require('express');
const db = require('../api');
const { uploadImage, deleteHostedFile } = require('./hostinger-storage');

const router = express.Router();

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function requestClientId(req) {
  return normalizePositiveInteger(
    req.body?.clientId ||
    req.body?.client_id ||
    req.query?.client_id ||
    req.decoded?.client_id ||
    req.decoded?.clientid
  );
}

function uploadFolder(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['logo', 'logos', 'branding'].includes(normalized)) {
    return 'logos';
  }

  if (['student', 'students', 'profile', 'photos'].includes(normalized)) {
    return 'students';
  }

  return 'general';
}

router.post('/image', db.checkToken, async (req, res) => {
  try {
    const image = req.files?.image || req.files?.file;
    const uploaded = await uploadImage(image, {
      clientId: requestClientId(req),
      folder: uploadFolder(req.body?.folder || req.body?.type || req.query?.folder)
    });

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: uploaded
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to upload image'
    });
  }
});

router.delete('/image', db.checkToken, async (req, res) => {
  try {
    const url = req.body?.url || req.query?.url;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const deleted = await deleteHostedFile(url);
    return res.status(200).json({
      success: true,
      deleted,
      message: deleted ? 'Image deleted successfully' : 'Image was not stored in Hostinger or was already removed'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to delete image'
    });
  }
});

module.exports = router;
