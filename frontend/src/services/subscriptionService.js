import api from '../api';

export const subscriptionService = {
  async getAll() {
    const res = await api.get('/memberships');
    return Array.isArray(res.data) ? res.data : [];
  },

  async create(payload) {
    return await api.post('/memberships', payload);
  },

  async update(id, payload) {
    return await api.put(`/memberships/${id}`, payload);
  },

  async delete(id) {
    return await api.delete(`/memberships/${id}`);
  },

  async getPlans() {
    const res = await api.get('/plans');
    return Array.isArray(res.data) ? res.data : [];
  },

  async createPlan(plan) {
    return await api.post('/plans', plan);
  },

  async bulkUpdatePlans(plans) {
    return await api.post('/plans/bulk-update', { plans });
  },

  async deletePlan(id) {
    return await api.delete(`/plans/${id}`);
  },

  async updateMemberPlan(memberId, planType) {
    const fd = new FormData();
    fd.append('plan', planType);
    fd.append('status', 'Active');
    fd.append('_method', 'PUT');
    return await api.post(`/members/${memberId}`, fd);
  }
};

export default subscriptionService;
