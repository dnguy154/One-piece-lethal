import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export async function fetchTodayChallenge() {
  const res = await axios.get(`${API_BASE_URL}/challenge/today`);
  return res.data;
}

export async function fetchChallengeList() {
  const res = await axios.get(`${API_BASE_URL}/challenges`);
  return res.data || [];
}

export async function fetchArchiveChallenge(date) {
  const res = await axios.get(`${API_BASE_URL}/challenge/${date}`);
  return res.data;
}