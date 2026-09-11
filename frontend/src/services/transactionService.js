import api from '../api';

export const transactionService = {
  async getAll() {
    const res = await api.get('/transactions');
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  }
};

export default transactionService;
