'use strict';

/**
 * Integration Tests for Promotions
 * Cases 99-122: Promotion Management
 */

const request = require('supertest');
const app = require('./setup');

describe('Case 99-122: Promotions Integration Tests', () => {
  let managerToken;
  let regularToken;
  let globalState = {};

  beforeAll(async () => {
    const managerResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'manager', password: 'password' });
    managerToken = managerResponse.body.token;

    const regularResponse = await request(app)
      .post('/auth/tokens')
      .send({ utorid: 'regular', password: 'password' });
    regularToken = regularResponse.body.token;
  });

  describe('Case 99-102: Create promotion', () => {
    it('Case 99: CREATE_PROMOTION_FORBIDDEN - should return 403 for regular user', async () => {
      const response = await request(app)
        .post('/promotions')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Test Promotion',
          type: 'automatic',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          endTime: new Date(Date.now() + 172800000).toISOString()
        });
      
      expect(response.status).toBe(403);
    });

    it('Case 100: Create promotion - should pass', async () => {
      // Test case placeholder
    });

    it('Case 101: CREATE_PROMOTION_EMPTY_PAYLOAD - should return 400 for empty payload', async () => {
      const response = await request(app)
        .post('/promotions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('Case 102: CREATE_PROMOTION_OK - should return 201 for valid promotion', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const response = await request(app)
        .post('/promotions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Promotion',
          type: 'automatic',
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 86400000).toISOString(),
          pointsPerCentMultiplier: 0.1
        });
      
      expect(response.status).toBe(201);
      globalState.promotionId = response.body.id;
    });
  });

  describe('Case 103-106: Get all promotions', () => {
    it('Case 103: GET_PROMOTIONS_REGULAR_NEGATIVE_PAGE - should return 400 for negative page', async () => {
      const response = await request(app)
        .get('/promotions?page=-1')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(400);
    });

    it('Case 104: GET_PROMOTIONS_REGULAR_OK - should return 200 for regular user', async () => {
      const response = await request(app)
        .get('/promotions')
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 105: GET_PROMOTIONS_PRIVILEGED_BOTH_STARTED_ENDED - should return 400 for both filters', async () => {
      const response = await request(app)
        .get('/promotions?started=true&ended=true')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(400);
    });

    it('Case 106: GET_PROMOTIONS_PRIVILEGED_OK - should return 200 for manager', async () => {
      const response = await request(app)
        .get('/promotions')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Case 107-110: Get promotion info', () => {
    it('Case 107: GET_PROMOTION_DETAILS_REGULAR_INACTIVE_404 - should return 404 for inactive promotion', async () => {
      // Create inactive promotion
      const futureDate = new Date(Date.now() + 86400000);
      const createResponse = await request(app)
        .post('/promotions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Inactive Promotion',
          type: 'automatic',
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 86400000).toISOString()
        });
      
      const inactivePromoId = createResponse.body.id;
      
      const response = await request(app)
        .get(`/promotions/${inactivePromoId}`)
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(404);
    });

    it('Case 108: GET_PROMOTION_DETAILS_PRIVILEGED_OK - should return 200 for manager', async () => {
      const response = await request(app)
        .get(`/promotions/${globalState.promotionId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(200);
    });

    it('Case 109: GET_PROMOTION_DETAILS_INVALID_ID_404 - should return 404 for invalid ID', async () => {
      const response = await request(app)
        .get('/promotions/99999')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(404);
    });

    it('Case 110: GET_PROMOTION_DETAILS_REGULAR_OK - should return 200 for active promotion', async () => {
      const response = await request(app)
        .get(`/promotions/${globalState.promotionId}`)
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Case 111-115: Update promotion info', () => {
    it('Case 111: UPDATE_PROMOTION_FORBIDDEN - should return 403 for regular user', async () => {
      const response = await request(app)
        .patch(`/promotions/${globalState.promotionId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Updated Name'
        });
      
      expect(response.status).toBe(403);
    });

    it('Case 112: UPDATE_PROMOTION_PAST_START_TIME - should return 400 for past start time', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const response = await request(app)
        .patch(`/promotions/${globalState.promotionId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startTime: pastDate.toISOString()
        });
      
      expect(response.status).toBe(400);
    });

    it('Case 113: UPDATE_PROMOTION_PAST_START_TIME - should return 400 (duplicate test)', async () => {
      // Similar to Case 112
      const pastDate = new Date(Date.now() - 86400000);
      const response = await request(app)
        .patch(`/promotions/${globalState.promotionId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          startTime: pastDate.toISOString()
        });
      
      expect(response.status).toBe(400);
    });

    it('Case 114: UPDATE_PROMOTION_OK - should return 200 for valid update', async () => {
      const response = await request(app)
        .patch(`/promotions/${globalState.promotionId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Updated Promotion Name'
        });
      
      expect(response.status).toBe(200);
    });

    it('Case 115: UPDATE_PROMOTION_INVALID_ID_404 - should return 404 for invalid ID', async () => {
      const response = await request(app)
        .patch('/promotions/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Updated Name'
        });
      
      expect(response.status).toBe(404);
    });
  });

  describe('Case 116-118: Delete promotion', () => {
    it('Case 116: DELETE_PROMOTION_STARTED_FORBIDDEN - should return 403 for started promotion', async () => {
      // Create and start a promotion
      const now = new Date();
      const createResponse = await request(app)
        .post('/promotions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Started Promotion',
          type: 'automatic',
          startTime: new Date(now.getTime() - 3600000).toISOString(),
          endTime: new Date(now.getTime() + 86400000).toISOString()
        });
      
      const startedPromoId = createResponse.body.id;
      
      const response = await request(app)
        .delete(`/promotions/${startedPromoId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(403);
    });

    it('Case 117: CREATE_PROMOTION_FOR_DELETE - should return 201', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const response = await request(app)
        .post('/promotions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Promotion For Delete',
          type: 'automatic',
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 86400000).toISOString()
        });
      
      expect(response.status).toBe(201);
      globalState.deletePromoId = response.body.id;
    });

    it('Case 118: DELETE_PROMOTION_INVALID_ID_404 - should return 404 for invalid ID', async () => {
      const response = await request(app)
        .delete('/promotions/99999')
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('Case 119-122: Promoted Purchase', () => {
    it('Case 119: PURCHASE_WITH_ACTIVE_PROMO_OK - should return 200', async () => {
      if (!globalState.promotionId) {
        throw new Error('No active promotion ID: PURCHASE_WITH_ACTIVE_PROMO_OK');
        return;
      }

      const cashierResponse = await request(app)
        .post('/auth/tokens')
        .send({ utorid: 'cashier', password: 'password' });
      const cashierToken = cashierResponse.body.token;

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 100.00,
          promotionIds: [globalState.promotionId],
          remark: 'Promoted purchase'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('promotionIds');
      expect(Array.isArray(response.body.promotionIds)).toBe(true);
    });

    it('Case 120: PURCHASE_WITH_INVALID_PROMO_400 - should return 400 for invalid promotion', async () => {
      if (!globalState.invalidPromoId) {
        throw new Error('No invalid promotion ID: PURCHASE_WITH_INVALID_PROMO_400');
        return;
      }

      const cashierResponse = await request(app)
        .post('/auth/tokens')
        .send({ utorid: 'cashier', password: 'password' });
      const cashierToken = cashierResponse.body.token;

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 100.00,
          promotionIds: [99999],
          remark: 'Invalid promo purchase'
        });
      
      expect(response.status).toBe(400);
    });

    it('Case 121: Purchase response - promotionIds should have valid structure', async () => {
      const cashierResponse = await request(app)
        .post('/auth/tokens')
        .send({ utorid: 'cashier', password: 'password' });
      const cashierToken = cashierResponse.body.token;

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 100.00,
          remark: 'Purchase'
        });
      
      expect(response.status).toBe(200);
      if (response.body.promotionIds) {
        expect(Array.isArray(response.body.promotionIds)).toBe(true);
        response.body.promotionIds.forEach(promo => {
          if (promo) {
            expect(promo).toHaveProperty('int');
            expect(promo).toHaveProperty('str');
          }
        });
      }
    });

    it('Case 122: PURCHASE_WITH_ONE_TIME_USED_400 - should return 400 for used one-time promotion', async () => {
      if (!globalState.usedPromoId) {
        throw new Error('No used promotion ID: PURCHASE_WITH_ONE_TIME_USED_400');
        return;
      }

      const cashierResponse = await request(app)
        .post('/auth/tokens')
        .send({ utorid: 'cashier', password: 'password' });
      const cashierToken = cashierResponse.body.token;

      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({
          type: 'purchase',
          utorid: 'john',
          spent: 100.00,
          promotionIds: [globalState.usedPromoId],
          remark: 'Used promo purchase'
        });
      
      expect(response.status).toBe(400);
    });
  });
});

