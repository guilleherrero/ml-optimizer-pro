const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function extractItemId(url) {
  const queryMatch = url.match(/(item_id)[=:]([A-Z]+\d+)/);
  if (queryMatch && queryMatch[2]) return queryMatch[2];
  const urlMatch = url.match(/MLA(\d+)/);
  return urlMatch ? 'MLA' + urlMatch[1] : null;
}

function analyzeKeywords(text) {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const frequency = {};
  words.forEach(w => { frequency[w] = (frequency[w] || 0) + 1; });
  return Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([word, count]) => ({ word, count }));
}

function generateOptimizedTitles(title) {
  const base = title.substring(0, 60);
  return [
    base + ' - Envio Gratis',
    base + ' - Mejor Precio',
    base + ' - Stock Disponible'
  ];
}

function generateOptimizedDescription(title, desc) {
  return `${title}\n\n${desc}\n\nEnvio disponible\nProducto de calidad\nGarantia incluida`;
}

function generateMockCompetitors(title, limit = 10) {
  const keywords = title.toLowerCase().split(' ').filter(w => w.length > 3);
  const products = [
    { name: 'Premium ' + keywords[0], price: 2999, sold: 450 },
    { name: 'Oferta ' + (keywords[0] || 'Producto'), price: 2499, sold: 320 },
    { name: keywords.join(' ') + ' Calidad', price: 3299, sold: 210 },
    { name: 'Mejor ' + (keywords[0] || 'Producto'), price: 1999, sold: 380 },
    { name: keywords.slice(0, 2).join(' ') + ' Original', price: 2799, sold: 165 },
    { name: 'Top ' + (keywords[0] || 'Producto'), price: 3499, sold: 560 },
    { name: keywords.join(' ') + ' Certificado', price: 2199, sold: 195 },
    { name: 'Importado ' + (keywords[0] || 'Producto'), price: 3099, sold: 140 },
    { name: (keywords[0] || 'Producto') + ' Calidad', price: 2649, sold: 175 },
    { name: 'Exclusivo ' + (keywords[0] || 'Producto'), price: 3899, sold: 110 }
  ];
  return products.slice(0, limit);
}

app.post('/api/analyze', async (req, res) => {
  try {
 const { publicationUrl, url } = req.body;
     const finalUrl = publicationUrl || url;
     if (!finalUrl) return res.status(400).json({ error: 'URL requerida' });

    const itemId = extractItemId(finalUrl);
    if (!itemId) return res.status(400).json({ error: 'URL invalida' });

    const urlParts = finalUrl.split('/').filter(p => p);
    const titleFromUrl = urlParts[urlParts.length - 2] || 'Producto';
    const cleanTitle = titleFromUrl.replace(/-/g, ' ').replace(/mlau|up|mla|\d+/gi, '').trim();

    const currentData = {
      title: cleanTitle || 'Producto Mercado Libre',
      price: 2499,
      description: 'Producto de calidad con envio disponible'
    };

    const yourKeywords = analyzeKeywords(currentData.title + ' ' + currentData.description);
    const competitors = generateMockCompetitors(currentData.title);
    const competitorKeywords = analyzeKeywords(competitors.map(c => c.name).join(' '));

    const suggestedTitles = generateOptimizedTitles(currentData.title);
    const optimizedDescription = generateOptimizedDescription(currentData.title, currentData.description);

    const yourKeywordSet = new Set(yourKeywords.map(k => k.word));
    const missingKeywords = competitorKeywords.filter(k => !yourKeywordSet.has(k.word)).slice(0, 5);

    res.json({
      currentData: {
        title: currentData.title,
        price: currentData.price,
        description: currentData.description
      },
      suggestedTitles,
      optimizedDescription,
      yourKeywords: yourKeywords.slice(0, 5),
      competitorAnalysis: {
        topKeywords: competitorKeywords.slice(0, 5),
        missingKeywords
      },
      competitors: competitors.map(c => ({
        title: c.name,
        price: c.price,
        soldQuantity: c.sold
      })),
      checklist: [
        { task: 'Actualizar titulo con palabras clave', priority: 'P0', impact: 'Visibilidad' },
        { task: 'Optimizar descripcion', priority: 'P0', impact: 'Conversion' },
        { task: 'Agregar fotos de calidad', priority: 'P1', impact: 'Confianza' },
        { task: 'Usar palabras clave competidor', priority: 'P1', impact: 'SEO' }
      ]
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
