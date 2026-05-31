const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

app.get('/v1/trending', async (req, res) => {
  const { type = 'movie', page = 1 } = req.query;
  try {
    const { data } = await axios.get(`${TMDB_BASE}/trending/${type}/day`, {
      params: { api_key: TMDB_API_KEY, page }
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/v1/search', async (req, res) => {
  const { query, type = 'movie', page = 1 } = req.query;
  try {
    const { data } = await axios.get(`${TMDB_BASE}/search/${type}`, {
      params: { api_key: TMDB_API_KEY, query, page }
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/v1/details/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  try {
    const { data } = await axios.get(`${TMDB_BASE}/${type}/${id}`, {
      params: { api_key: TMDB_API_KEY, append_to_response: 'videos,credits' }
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/v1/movies', async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const { data } = await axios.get(`${TMDB_BASE}/movie/popular`, {
      params: { api_key: TMDB_API_KEY, page }
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`OMSS running on ${PORT}`));
