import api from './api';

export const serviceJobService = {
  createServiceJob: async (category, jobData) => (await api.post('/service-jobs', { category, ...jobData })).data,
};
