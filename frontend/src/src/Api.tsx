import axios from "axios";

const API_ROOT =
  process.env.NODE_ENV === "production" ? "https://stock-crawling-server.vercel.app/api" : "http://localhost:3001/api";

const instance = axios.create({
  baseURL: API_ROOT,
});

export default instance;