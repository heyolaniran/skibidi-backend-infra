const express = require('express');
const router = express.Router();
const { getPackages, getWifiStatus, createWifiInvoice } = require('../controllers/wifi.controller');

/**
 * @swagger
 * /wifi/packages:
 *   get:
 *     summary: List available WiFi access packages
 *     tags: [WiFi]
 *     responses:
 *       200:
 *         description: Array of packages with id, label, minutes, priceSats
 */
router.get('/wifi/packages', getPackages);

/**
 * @swagger
 * /wifi/status:
 *   get:
 *     summary: Check if the requesting IP has active WiFi access
 *     tags: [WiFi]
 *     responses:
 *       200:
 *         description: Session status for the calling IP
 */
router.get('/wifi/status', getWifiStatus);

/**
 * @swagger
 * /wifi/create-invoice:
 *   post:
 *     summary: Create a Lightning invoice to purchase WiFi access
 *     tags: [WiFi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [packageId]
 *             properties:
 *               packageId:
 *                 type: string
 *                 enum: [15min, 1hour, 3hours, 24hours]
 *     responses:
 *       201:
 *         description: Lightning invoice + paymentToken for polling
 */
router.post('/wifi/create-invoice', createWifiInvoice);

module.exports = router;
