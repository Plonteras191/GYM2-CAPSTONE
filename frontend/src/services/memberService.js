import api from '../api';

export const memberService = {
  async getAll() {
    const response = await api.get('/members');
    const dataArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return dataArray.map(dbMember => ({
      id: dbMember.id,
      firstName: dbMember.first_name,
      lastName: dbMember.last_name,
      email: dbMember.email,
      phone: dbMember.phone,
      address: dbMember.address || '',
      plan: dbMember.plan,
      status: dbMember.status,
      enrolledFaceId: dbMember.enrolled_face_id,
      profilePicUrl: dbMember.profile_pic ? `http://127.0.0.1:8000${dbMember.profile_pic}` : null,
      dob: dbMember.dob || '',
      height: dbMember.height || '',
      weight: dbMember.weight || '',
      customerSince: new Date(dbMember.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }));
  },

  async create(formData) {
    const data = new FormData();
    data.append('first_name', formData.firstName);
    data.append('last_name', formData.lastName);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('address', formData.address || '');
    data.append('plan', formData.plan);
    data.append('status', formData.status);
    if (formData.dob) data.append('dob', formData.dob);
    if (formData.height) data.append('height', formData.height);
    if (formData.weight) data.append('weight', formData.weight);
    if (formData.profilePicFile) data.append('profile_pic', formData.profilePicFile);

    return await api.post('/members', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async update(id, formData) {
    const data = new FormData();
    data.append('_method', 'PUT');
    data.append('first_name', formData.firstName);
    data.append('last_name', formData.lastName);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('address', formData.address || '');
    data.append('plan', formData.plan);
    data.append('status', formData.status);
    if (formData.dob) data.append('dob', formData.dob);
    if (formData.height) data.append('height', formData.height);
    if (formData.weight) data.append('weight', formData.weight);
    if (formData.profilePicFile) data.append('profile_pic', formData.profilePicFile);

    return await api.post(`/members/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  async delete(id) {
    return await api.delete(`/members/${id}`);
  },

  async getWorkouts(memberId) {
    const response = await api.get(`/members/${memberId}/workouts`);
    return response.data;
  },

  async assignTask(memberId, exerciseName) {
    return await api.post(`/members/${memberId}/assign-task`, { exercise: exerciseName.toUpperCase() });
  },

  async manualVerifyWorkout(logId) {
    return await api.put(`/workouts/${logId}/manual-verify`);
  }
};

export default memberService;
