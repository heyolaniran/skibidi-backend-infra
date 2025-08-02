const express = require('express');
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *         message:
 *           type: string
 *           example: Breez SDK is connected
 *         wallet:
 *           type: string
 *           example: 03d30aa80b49318014ef9d9eee744ed20cb82df8681083e355bc8386901af70f45
 *         balance:
 *           type: integer
 *           example: 100000
 *         pendingSendSats:
 *           type: integer
 *           example: 0
 *         pendingReceiveSats:
 *           type: integer
 *           example: 0
 *     InvoiceResponse:
 *       type: object
 *       properties:
 *         invoice:
 *           type: string
 *           description: The BOLT11 or BOLT12 invoice string.
 *         fee:
 *           type: number
 *           description: The estimated fee in satoshis.
 *         qr:
 *           type: string
 *           description: A data URL for a QR code of the invoice.
 *           format: uri
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         payment:
 *           type: object
 *           description: The details of the completed payment.
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: A description of the error.
 */
const {

  getHealth,
  createInvoice,
  createBolt12Invoice,
  receiveOnChain,
  payInvoice,
  signMessage,
  verifyMessage,
  handleBitpassa,
} = require('../controllers/invoice.controller');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check the health of the service
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Service is healthy and connected to the Breez SDK.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       500:
 *         description: Service is not connected or an error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/health', getHealth);
/**
 * @swagger
 * /create-invoice:
 *   post:
 *     summary: Create a BOLT 11 Lightning invoice
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountMsat
 *             properties:
 *               amountMsat:
 *                 type: integer
 *                 description: The amount for the invoice in millisatoshis.
 *               description:
 *                 type: string
 *                 description: A description for the invoice.
 *     responses:
 *       201:
 *         description: The created invoice.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponse'
 *       400:
 *         description: Bad request, missing parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-invoice', createInvoice);
/**
 * @swagger
 * /bolt12/create-invoice:
 *   post:
 *     summary: Create a BOLT 12 Lightning invoice offer
 *     tags: [Invoices]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: An optional description for the invoice.
 *     responses:
 *       201:
 *         description: The created BOLT 12 offer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/bolt12/create-invoice', createBolt12Invoice);
/**
 * @swagger
 * /receive-onchain:
 *   post:
 *     summary: Generate an on-chain Bitcoin address
 *     tags: [Invoices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountMsat
 *             properties:
 *               amountMsat:
 *                 type: integer
 *                 description: The amount to receive in millisatoshis.
 *               description:
 *                 type: string
 *                 description: A description for the transaction.
 *     responses:
 *       201:
 *         description: The generated Bitcoin address.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvoiceResponse'
 *       400:
 *         description: Bad request, missing parameters.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/receive-onchain', receiveOnChain);
/**
 * @swagger
 * /pay-invoice:
 *   post:
 *     summary: Pay a BOLT 11, BOLT 12, or Bitcoin address invoice
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - destination
 *             properties:
 *               destination:
 *                 type: string
 *                 description: The invoice or address to pay.
 *               amountMsat:
 *                 type: integer
 *                 description: The amount to pay in millisatoshis (required for BOLT 12 and on-chain).
 *     responses:
 *       200:
 *         description: The payment details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Bad request, missing parameters or invalid invoice type.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/pay-invoice', payInvoice);

/**
 * @swagger
 * /handle-bitpassa :
 *  post: 
 *    summary: Handle a BitPassa invoice
 *    tags: [Payments]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - address
 *              - amountMsat
 *            properties:
 *              address:
 *                type: string
 *                description: The Bitcoin address to receive the payment.
 *              amountMsat:
 *                type: integer
 *                description: The amount to receive in millisatoshis.
 *    responses:
 *      200:
 *        description: The payment details.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/PaymentResponse'
 *      400:
 *        description: Bad request, missing parameters or invalid invoice type.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 *      500:
 *        description: Internal server error.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 */

router.post('/handle-bitpassa', handleBitpassa);

/**
 * @swagger
 * /sign-message:
 *   post:
 *     summary: Sign a message
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message to sign.
 *     responses:
 *       200:
 *         description: The payment details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Bad request, missing parameters or invalid invoice type.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/sign-message', signMessage);

/**
 * @swagger
 * /verify-message:
 *   post:
 *     summary: Verify a message
 *     tags: [Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signature
 *               - pubkey
 *               - message
 *             properties:
 *               signature:
 *                 type: string
 *                 description: The signature to verify.
 *               pubkey:
 *                 type: string
 *                 description: The public key to verify the signature.
 *               message:
 *                 type: string
 *                 description: The message to verify.
 *     responses:
 *       200:
 *         description: The payment details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       400:
 *         description: Bad request, missing parameters or invalid invoice type.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-message', verifyMessage);


module.exports = router;