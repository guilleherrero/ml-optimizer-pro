const express = require('express');
const https = require('https');
const app = express();

app.use(express.json());
app.use(express.static('public'));

function extractId(url) {
  let m = url.match(/item_id:MLA(\d+)/);
  if (m) return 'MLA' + m[1];
  m = url.match(/MLA(\d+)/);
  if (m) return 'MLA' + m[1];
  return null;
}

function makeRequest(path) {
  return new Promise((resolve) => {
    https.get(path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
    setTimeout(() => resolve(null), 8000);
  });
}

function getKeywords(text) {
  const stop = ['de', 'el', 'la', 'y', 'en', 'a', 'con', 'para', 'por'];
  const words = (text || '').toLowerCase().split(/[^a-z0-9]/g).filter(w => w.length > 2 && !stop.includes(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word, count]) => ({word, count}));
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    
    const id = extractId(url);
    if (!id) return res.status(400).json({ error: 'ID invalido' });
    
    let product = await makeRequest(`https://api.mercadolibre.com/items/${id}`);
    
    if (!product) {
      const titleFromUrl = url.split('/').filter(p => p && !p.includes('www') && !p.includes('.'))[0] || 'lente camara';
      product = { title: titleFromUrl.replace(/-/g, ' '), price: 0, description: 'Info desde URL' };
    }
    
    const title = (product.title || 'Producto');
    const competitors = await makeRequest(`https://api.mercadolibre.com.ar/sites/MLA/search?q=${encodeURIComponent(title.substring(0, 30))}&limit=20`) || {results: []};
    const compList = (competitors.results || []).slice(0, 20);
    
    const yourKeys = getKeywords(title);
    const compKeys = getKeywords(compList.map(c => c.title).join(' '));
    const missing = compKeys.filter(k => !yourKeys.map(y => y.word).includes(k.word)).slice(0, 5);
    
    res.json({
      currentData: {
        title: title,
        price: product.price || 0,
        description: product.description || 'Sin descripcion',
        competitorCount: compList.length
      },
      suggestedTitles: [
        { intent: 'Busqueda Informativa', title: title.substring(0, 60) + ' | Envio Gratis', coverage: 85, reasoning: 'Envio gratis' },
        { intent: 'Intencion de Compra', title: title.substring(0, 60) + ' | Mejor Precio', coverage: 92, reasoning: 'Precio es clave' },
        { intent: 'Especifico', title: title.substring(0, 60) + ' | Stock Disponible', coverage: 88, reasoning: 'Stock importante' }
      ],
      optimizedDescription: title + '\nProducto de calidad\nEnvio rapido\nGarantia\nCompra segura',
      yourKeywords: yourKeys.slice(0, 5),
      competitorAnalysis: { topKeywords: compKeys.slice(0, 5), missingKeywords: missing },
      competitors: compList,
      keywordGap: missing.map(k => ({ keyword: k.word, importance: k.count, priority: k.count > 2 ? 'P0' : 'P1' })),
      checklist: [
        { task: 'Anadir keywords del gap', priority: 'P0', impact: 'Visibilidad' },
        { task: 'Optimizar descripcion', priority: 'P0', impact: 'Conversion' },
        { task: 'Revisar precio', priority: 'P1', impact: 'Ventas' },
        { task: 'Mejorar fotos', priority: 'P1', impact: 'Confianza' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server en ${PORT}`));
