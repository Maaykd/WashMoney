import { http } from "./http";

function buildListQuery(sort) {
  // base44: list('-date') => ordenar desc por date
  if (!sort) return "";
  const dir = sort.startsWith("-") ? "desc" : "asc";
  const field = sort.replace(/^-/, "");
  return `?sort=${encodeURIComponent(field)}&dir=${dir}`;
}

export const base44 = {
  entities: {
    Appointment: {
      list: async (sort) => {
        const { data } = await http.get(`/appointments${buildListQuery(sort)}`);
        return data;
      },
      create: async (payload) => (await http.post(`/appointments`, payload)).data,
      update: async (id, payload) => (await http.put(`/appointments/${id}`, payload)).data,
      delete: async (id) => (await http.delete(`/appointments/${id}`)).data,
    },

    Client: {
      list: async () => (await http.get(`/clients`)).data,
      create: async (payload) => (await http.post(`/clients`, payload)).data,
      update: async (id, payload) => (await http.put(`/clients/${id}`, payload)).data,
      delete: async (id) => (await http.delete(`/clients/${id}`)).data,
    },
  },
};
