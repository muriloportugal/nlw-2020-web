import axios from 'axios';

// const api_url = process.env.REACT_APP_API_URL || 'https://nwl-2020-server.herokuapp.com';
const api_url = 'https://nwl-2020-server.herokuapp.com';

const api = axios.create({
  baseURL: api_url,
});

export default api;