'use strict';

/**
 * Integration Tests for Transactions
 * Cases 77-98: Transactions Management
 */

const request = require('supertest');
const app = require('./setup');

describe('Case 77-98: Transactions Integration Tests', () => {
  let cashierToken;
  let managerToken;
  let regularToken;
  let globalState = {};

  beforeAll(async () => {
    const cashierResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'cashier', password: 'password' });
    cashierToken = cashierResponse.body.token;

    const managerResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'manager', password: 'password' });
    managerToken = managerResponse.body.token;

    const regularResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'regular', password: 'password' });
    regularToken = regularResponse.body.token;
  });

  describe('Case 77-80: Purchase', () => {
    it('Case 77: PURCHASE_CASHIER_OK - should return 200 for cashier purchase', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 10.50,
          remark: 'Test purchase'
        });
      
      expect(response.status).toBe(200);
      globalState.purchase_0_id = response.body.id;
    });

    it('Case 78: PURCHASE_SUSPICIOUS_OK - should return 201 for suspicious purchase', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 1000.00,
          remark: 'Suspicious purchase'
        });
      
      expect(response.status).toBe(201);
      globalState.purchase_1_id = response.body.id;
    });

    it('Case 79: PURCHASE_INVALID_SPENT - should return 400 for invalid spent amount', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: -10,
          remark: 'Invalid'
        });
      
      expect(response.status).toBe(400);
    });

    it('Case 80: PURCHASE_BY_REGULAR_403 - should return 403 for regular user', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 10.50,
          remark: 'Test'
        });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Case 81-83: Adjustment', () => {
    it('Case 81: ADJUSTMENT_OK - should return 200 for valid adjustment', async () => {
      if (!globalState.purchase_0_id) {
        throw new Error('No purchase_0_id in GLOBAL_STATE');
        return;
      }

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          type: 'adjustment',
          utorid: 'john',
          points: 100,
          relatedId: globalState.purchase_0_id,
          remark: 'Adjustment'
        });
      
      expect(response.status).toBe(200);
    });

    it('Case 82: ADJUSTMENT_NOT_FOUND - should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          type: 'adjustment',
          utorid: 'john',
          points: 100,
          relatedId: 99999,
          remark: 'Adjustment'
        });
      
      expect(response.status).toBe(404);
    });

    it('Case 83: ADJUSTMENT_REGULAR_403 - should return 403 for regular user', async () => {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          type: 'adjustment',
          utorid: 'john',
          points: 100,
          remark: 'Adjustment'
        });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Case 84-86: Suspicious', () => {
    it('Case 84: FLAG_SUSPICIOUS_OK - should return 200 for flagging suspicious', async () => {
      if (!globalState.purchase_0_id) {
        throw new Error('No purchase_0_id in GLOBAL_STATE');
        return;
      }

      const response = await request(app)
        .patch(`/transactions/${globalState.purchase_0_id}/suspicious`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 85: UNFLAG_SUSPICIOUS_OK - should return 200 for unflagging suspicious', async () => {
      if (!globalState.purchase_1_id) {
        throw new Error('No purchase_1_id in GLOBAL_STATE');
        return;
      }

      const response = await request(app)
        .patch(`/transactions/${globalState.purchase_1_id}/suspicious`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 86: FLAG_SUSPICIOUS_403 - should return 403 for regular user', async () => {
      const response = await request(app)
        .patch(`/transactions/${globalState.purchase_0_id}/suspicious`)
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('Case 87-90: Transfer and Redemption', () => {
    it('Case 87: Transfer - password field should be string in response', async () => {
      const response = await request(app)
        .post('/users/1/transactions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          points: 50,
          remark: 'Transfer'
        });
      
      expect(response.status).toBe(200);
      if (response.body.user) {
        expect(response.body.user).toHaveProperty('password');
        expect(typeof response.body.user.password).toBe('string');
      }
    });

    it('Case 88: TRANSFER_INSUFFICIENT - should return 400 for insufficient points', async () => {
      const response = await request(app)
        .post('/users/1/transactions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          points: 999999,
          remark: 'Transfer'
        });
      
      expect(response.status).toBe(400);
    });

    it('Case 89: REDEMPTION_OK - should return 201 for valid redemption', async () => {
      const response = await request(app)
        .post('/users/me/transactions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          amount: 100,
          remark: 'Redemption request'
        });
      
      expect(response.status).toBe(201);
      globalState.redemption_0_id = response.body.id;
    });

    it('Case 90: REDEMPTION_EXCEED_BALANCE - should return 400 for exceeding balance', async () => {
      const response = await request(app)
        .post('/users/me/transactions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          amount: 999999,
          remark: 'Redemption request'
        });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Case 91-93: Process Redemption', () => {
    it('Case 91: PROCESS_REDEMPTION_OK - should return 200 for processing', async () => {
      if (!globalState.redemption_0_id) {
        throw new Error('No redemption_0_id in GLOBAL_STATE');
        return;
      }

      const response = await request(app)
        .patch(`/transactions/${globalState.redemption_0_id}/processed`)
        .set('Authorization', `Bearer ${cashierToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 92: PROCESS_REDEMPTION_ALREADY - should return 400 for already processed', async () => {
      if (!globalState.redemption_0_id) {
        throw new Error('No redemption_0_id in GLOBAL_STATE');
        return;
      }

      const response = await request(app)
        .patch(`/transactions/${globalState.redemption_0_id}/processed`)
        .set('Authorization', `Bearer ${cashierToken}`);
      
      expect(response.status).toBe(400);
    });

    it('Case 93: PROCESS_REDEMPTION_403 - should return 403 for regular user', async () => {
      const response = await request(app)
        .patch(`/transactions/${globalState.redemption_0_id}/processed`)
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('Case 94-98: Get Transactions', () => {
    it('Case 94: GET_TX_REGULAR_403 - should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(403);
    });

    it('Case 95: GET_TX_MANAGER_OK - should return 200 for manager', async () => {
      const response = await request(app)
        .get('/transactions')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 96: GET_TX_DETAILS_403 - should return 403 for regular user', async () => {
      const response = await request(app)
        .get(`/transactions/${globalState.purchase_0_id}`)
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(403);
    });

    it('Case 97: GET_TX_DETAILS_OK - should return 200 for manager', async () => {
      const response = await request(app)
        .get(`/transactions/${globalState.purchase_0_id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 98: GET_MY_TX_OK - should return 200 for own transactions', async () => {
      const response = await request(app)
        .get('/users/me/transactions')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(200);
    });
  });
});

