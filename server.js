const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function extractProductId(url) {
  try {
    // Intenta extraer el ID en formato item_id:MLA...
    let m = url.match(/item_id:MLA(\d+)/);
    if (m) return 'MLA' + m[1];
    // Intenta extraer del formato MLA-...-...
    m = url.match(/MLA(\d+)/);
    if (m) return 'MLA' + m[1];
    return null;
  } catch (e) {
    return null;
  }
}

async function getProductData(itemId) {
  try {
    const res = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, { timeout: 8000 });
    return res.data;
  } catch (e) {
    console.error('Product fetch error:', e.message);
    return null;
  }
}

async function searchCompetitors(keywords) {
  try {
    const q = keywords.split(' ').slice(0, 2).join(' ');
    const res = await axios.get(`https://api.mercadolibre.com.ar/sites/MLA/search?q=${encodeURIComponent(q)}&limit=20`, { timeout: 8000 });
    return res.data.results || [];
  } catch (e) {
    console.error('Competitor search error:', e.message);
    return [];
  }
}

function getKeywords(text) {
  if (!text) return [];
  const stop = ['de', 'el', 'la', 'y', 'en', 'a', 'con', 'para', 'por', 'o', 'los', 'las', 'las', 'le', 'es', 'al'];
  const words = text.toLowerCase().split(/[^a-z0-9]/g).filter(w => w.length > 2 && !stop.includes(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, c]) => ({ word: w, count: c }));
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    
    const itemId = extractProductId(url);
    if (!itemId) return res.status(400).json({ error: 'Invalid Mercado Libre URL' });
    
    let product = await getProductData(itemId);
    if (!product) return res.status(400).json({ error: 'Product not found' });
    
    const title = product.title || 'Producto';
    const competitors = await searchCompetitors(title);
    
    const yourKeywords = getKeywords(title);
    const competitorKeywords = getKeywords(competitors.map(c => c.title).join(' '));
    
    const yourSet = new Set(yourKeywords.map(k => k.word));
    const missing = competitorKeywords.filter(k => !yourSet.has(k.word)).slice(0, 5);
    
    res.json({
      currentData: {
        title: title,
        price: product.price || 0,
        description: product.description || 'Sin descripcion',
        competitorCount: competitors.length
      },
      suggestedTitles: [
        { intent: 'Busqueda Informativa', title: title.substring(0, 60) + ' | Envio Gratis', coverage: 85, reasoning: 'Buscan envio gratis' },
        { intent: 'Intencion de Compra', title: title.substring(0, 60) + ' | Mejor Precio', coverage: 92, reasoning: 'Enfoque en precio' },
        { intent: 'Especifico', title: title.substring(0, 60) + ' | Stock Disponible', coverage: 88, reasoning: 'Disponibilidad' }
      ],
      optimizedDescription: title + '\\nProducto de calidad\\nEnvio rapido\\nGarantia\\nCompra segura',
      yourKeywords: yourKeywords.slice(0, 5),
      competitorAnalysis: { topKeywords: competitorKeywords.slice(0, 5), missingKeywords: missing },
      competitors: competitors.slice(0, 20),
      keywordGap: missing.map(k => ({ keyword: k.word, importance: k.count, priority: k.count > 2 ? 'P0' : 'P1', suggestedPlacement: 'titulo' })),
      checklist: [
        { task: 'Actualizar titulo con palabras clave', priority: 'P0', impact: 'Visibilidad' },
        { task: 'Optimizar descripcion', priority: 'P0', impact: 'Conversion' },
        { task: 'Ajustar precio', priority: 'P1', impact: 'Ventas' },
        { task: 'Fotos de calidad', priority: 'P1', impact: 'Confianza' }
      ]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
