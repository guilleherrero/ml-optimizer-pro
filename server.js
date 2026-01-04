const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Extrae ID de producto
function extractProductId(url) {
  try {
    // Busca MLA seguido de numeros
    const match = url.match(/MLA(\d+)/);
    if (match) return 'MLA' + match[1];
    return null;
  } catch (e) {
    return null;
  }
}

// Obtiene datos del producto
async function getProductData(itemId) {
  try {
    const res = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, { timeout: 8000 });
    return res.data;
  } catch (e) {
    console.error('Product fetch error:', e.message);
    return null;
  }
}

// Busca competidores
async function searchCompetitors(keywords) {
  try {
    const q = keywords.split(' ').slice(0, 2).join(' ');
    const res = await axios.get('https://api.mercadolibre.com/sites/MLA/search', {
      params: { q, limit: 20 },
      timeout: 8000
    });
    return (res.data.results || []).map(item => ({
      title: item.title,
      price: item.price,
      sold: item.sold_quantity
    }));
  } catch (e) {
    console.error('Search error:', e.message);
    return [];
  }
}

function getKeywords(text) {
  if (!text) return [];
  const stop = ['de', 'el', 'la', 'y', 'en', 'a', 'con', 'para', 'por', 'o'];
  const words = text.toLowerCase().replace(/[^a-z0-9\\s]/g, '').split(/\\s+/).filter(w => w.length > 3 && !stop.includes(w));
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
    
    const product = await getProductData(itemId);
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
        description: product.description || 'Sin descripción',
        competitorCount: competitors.length
      },
      suggestedTitles: [
        { intent: 'Búsqueda Informativa', title: title.substring(0, 60) + ' | Envío Gratis', coverage: 85, reasoning: 'Buscan envío gratis' },
        { intent: 'Intención de Compra', title: title.substring(0, 60) + ' | Mejor Precio', coverage: 92, reasoning: 'Enfoque en precio' },
        { intent: 'Específico', title: title.substring(0, 60) + ' | Stock Disponible', coverage: 88, reasoning: 'Disponibilidad' }
      ],
      optimizedDescription: title + '\\n\\nProducto de calidad\\n✓ Envío rápido\n✓ Garantía\n✓ Compra segura',
      yourKeywords: yourKeywords.slice(0, 5),
      competitorAnalysis: { topKeywords: competitorKeywords.slice(0, 5), missingKeywords: missing },
      competitors: competitors.slice(0, 20),
      keywordGap: missing.map(k => ({ keyword: k.word, importance: k.count, priority: k.count > 2 ? 'P0' : 'P1', suggestedPlacement: 'titulo' })),
      checklist: [
        { task: 'Actualizar título con palabras clave', priority: 'P0', impact: 'Visibilidad' },
        { task: 'Optimizar descripción', priority: 'P0', impact: 'Conversión' },
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
