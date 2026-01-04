const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Extrae palabra clave y ID de producto de la URL
function extractKeywordAndIdFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Formato: /item/MLAXXX-producto-name
    const parts = pathname.split('/');
    const itemPart = parts.find(p => p.startsWith('MLA'));
    if (itemPart) {
      const id = itemPart.split('-')[0];
      return { id, url };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Obtiene informacion del producto desde ML API
async function fetchProductInfo(itemId) {
  try {
    const response = await axios.get(`https://api.mercadolibre.com/items/${itemId}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }
}

// Busca productos competidores en ML Argentina
async function searchCompetitors(title, limit = 20) {
  try {
    // Extrae palabras clave principales del titulo
    const keywords = title.split(' ').filter(w => w.length > 3).slice(0, 3).join(' ');
    if (!keywords) return [];
    
    const response = await axios.get('https://api.mercadolibre.com/sites/MLA/search', {
      params: {
        q: keywords,
        limit: limit,
        sort: 'relevance'
      },
      timeout: 10000
    });
    
    return response.data.results.map(item => ({
      title: item.title,
      price: item.price,
      soldQuantity: item.sold_quantity,
      seller: item.seller.nickname
    }));
  } catch (error) {
    console.error('Error searching competitors:', error.message);
    return [];
  }
}

function analyzeKeywords(text) {
  if (!text) return [];
  const stopwords = ['de', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'con', 'sin', 'para', 'por', 'en', 'a', 'al'];
  const words = text.toLowerCase()
    .replace(/[^\\w\\s]/g, '')
    .split(/\\s+/)
    .filter(w => w.length > 3 && !stopwords.includes(w));
  
  const frequency = {};
  words.forEach(w => {
    frequency[w] = (frequency[w] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

function generateOptimizedTitles(title) {
  const base = title.substring(0, 60).trim();
  return [
    {
      intent: 'Búsqueda Informativa',
      title: base + ' | Envío Gratis',
      coverage: 85,
      reasoning: 'Atrae usuarios buscando opciones de envío gratuito'
    },
    {
      intent: 'Intención de Compra',
      title: base + ' | Mejor Precio',
      coverage: 92,
      reasoning: 'Optimizado para conversión con énfasis en precio competitivo'
    },
    {
      intent: 'Específico de Producto',
      title: base + ' | Stock Disponible',
      coverage: 88,
      reasoning: 'Enfatiza disponibilidad inmediata y confianza'
    }
  ];
}

function generateOptimizedDescription(title, currentDesc) {
  return `${title}\\n\\n${currentDesc}\\n\\n✓ Envío rápido\n✓ Producto original\n✓ Garantía incluida\n✓ Compra segura`;
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    
    // Extrae ID del producto
    const extracted = extractKeywordAndIdFromUrl(url);
    if (!extracted) return res.status(400).json({ error: 'URL inválida de Mercado Libre' });
    
    console.log(`Analizando producto: ${extracted.id}`);
    
    // Obtiene info del producto actual
    const productInfo = await fetchProductInfo(extracted.id);
    if (!productInfo) {
      return res.status(400).json({ error: 'No se pudo obtener el producto. Verifica la URL.' });
    }
    
    const currentTitle = productInfo.title || 'Producto';
    const currentPrice = productInfo.price || 0;
    
    // Busca competencia real
    console.log(`Buscando competencia para: ${currentTitle}`);
    const competitors = await searchCompetitors(currentTitle, 20);
    console.log(`Competidores encontrados: ${competitors.length}`);
    
    // Analiza palabras clave
    const yourKeywords = analyzeKeywords(currentTitle);
    const competitorKeywords = analyzeKeywords(competitors.map(c => c.title).join(' '));
    
    const yourKeywordSet = new Set(yourKeywords.map(k => k.word));
    const missingKeywords = competitorKeywords
      .filter(k => !yourKeywordSet.has(k.word))
      .slice(0, 5);
    
    const suggestedTitles = generateOptimizedTitles(currentTitle);
    const optimizedDescription = generateOptimizedDescription(currentTitle, 'Producto de alta calidad');
    
    res.json({
      currentData: {
        title: currentTitle,
        price: currentPrice,
        description: productInfo.description || 'Sin descripción',
        competitorCount: competitors.length
      },
      suggestedTitles,
      optimizedDescription,
      yourKeywords: yourKeywords.slice(0, 5),
      competitorAnalysis: {
        topKeywords: competitorKeywords.slice(0, 5),
        missingKeywords
      },
      competitors: competitors.slice(0, 20),
      keywordGap: missingKeywords.map(k => ({
        keyword: k.word,
        importance: k.count,
        priority: k.count > 2 ? 'P0' : 'P1',
        suggestedPlacement: 'titulo y descripcion'
      })),
      checklist: [
        { task: 'Actualizar titulo con palabras clave encontradas', priority: 'P0', impact: 'Visibilidad en búsqueda' },
        { task: 'Optimizar descripcion con palabras de competencia', priority: 'P0', impact: 'Conversión' },
        { task: 'Ajustar precio competitivamente', priority: 'P1', impact: 'Competitividad' },
        { task: 'Agregar fotos de calidad profesional', priority: 'P1', impact: 'Confianza' }
      ]
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Error en el servidor' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
