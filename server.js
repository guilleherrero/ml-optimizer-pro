const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Extrae palabra clave de la URL
function extractKeywordFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    if (pathParts.length > 0) {
      // El primer segmento usualmente contiene la palabra clave
      return decodeURIComponent(pathParts[0]).replace(/-/g, ' ');
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Busca productos en Mercado Libre Argentina
async function searchMercadoLibre(keyword, limit = 20) {
  try {
    const encodedKeyword = encodeURIComponent(keyword);
    const searchUrl = `https://listado.mercadolibre.com.ar/${encodedKeyword}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const products = [];
    
    // Extrae productos del HTML
    $('div[data-item-id]').slice(0, limit).each((index, element) => {
      const $item = $(element);
      const title = $item.find('h2 span').text().trim();
      const priceText = $item.find('.price__fraction').first().text().trim();
      const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
      const soldText = $item.find('.reviews__rating-count').text().trim();
      const sold = parseInt(soldText.replace(/[^0-9]/g, '')) || 0;
      
      if (title) {
        products.push({
          title: title,
          price: price,
          soldQuantity: sold
        });
      }
    });
    
    return products;
  } catch (error) {
    console.error('Error searching Mercado Libre:', error.message);
    return [];
  }
}

function analyzeKeywords(text) {
  if (!text) return [];
  const words = text.toLowerCase()
    .replace(/[^\\w\\s]/g, '')
    .split(/\\s+/)
    .filter(w => w.length > 3);
  
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
  const base = title.substring(0, 60);
  return [
    {
      intent: 'Búsqueda Informativa',
      title: base + ' - Envío Gratis',
      coverage: 85,
      reasoning: 'Atrae usuarios buscando opciones de envío'
    },
    {
      intent: 'Intención de Compra',
      title: base + ' - Mejor Precio',
      coverage: 92,
      reasoning: 'Optimizado para conversión con énfasis en precio'
    },
    {
      intent: 'Específico de Producto',
      title: base + ' - Stock Disponible',
      coverage: 78,
      reasoning: 'Enfatiza disponibilidad inmediata'
    }
  ];
}

function generateOptimizedDescription(title, desc) {
  return `${title}\\n\\n${desc}\\n\\nEnvío disponible\\nProducto de calidad\\nGarantía incluida`;
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    
    // Extrae la palabra clave
    const keyword = extractKeywordFromUrl(url);
    if (!keyword) return res.status(400).json({ error: 'No se pudo extraer palabra clave' });
    
    // Busca competencia real
    console.log(`Buscando competencia para: ${keyword}`);
    const competitors = await searchMercadoLibre(keyword, 20);
    
    if (competitors.length === 0) {
      console.log('No se encontraron competidores, usando datos simulados');
    }
    
    const currentData = {
      title: keyword || 'Producto Mercado Libre',
      price: competitors.length > 0 ? Math.round(competitors[0].price * 0.95) : 2499,
      description: 'Producto de calidad con envío disponible'
    };
    
    // Analiza palabras clave
    const yourKeywords = analyzeKeywords(currentData.title + ' ' + currentData.description);
    const competitorKeywords = analyzeKeywords(
      competitors.map(c => c.title).join(' ')
    );
    
    const yourKeywordSet = new Set(yourKeywords.map(k => k.word));
    const missingKeywords = competitorKeywords
      .filter(k => !yourKeywordSet.has(k.word))
      .slice(0, 5);
    
    const suggestedTitles = generateOptimizedTitles(currentData.title);
    const optimizedDescription = generateOptimizedDescription(currentData.title, currentData.description);
    
    res.json({
      currentData: {
        title: currentData.title,
        price: currentData.price,
        description: currentData.description,
        competitorCount: competitors.length
      },
      suggestedTitles,
      optimizedDescription,
      yourKeywords: yourKeywords.slice(0, 5),
      competitorAnalysis: {
        topKeywords: competitorKeywords.slice(0, 5),
        missingKeywords
      },
      competitors: competitors.slice(0, 20).map(c => ({
        title: c.title,
        price: c.price,
        soldQuantity: c.soldQuantity
      })),
      keywordGap: missingKeywords.map(k => ({
        keyword: k.word,
        importance: k.count,
        priority: 'P1',
        suggestedPlacement: 'description'
      })),
      checklist: [
        { task: 'Actualizar titulo con palabras clave', priority: 'P0', impact: 'Visibilidad' },
        { task: 'Optimizar descripcion', priority: 'P0', impact: 'Conversion' },
        { task: 'Agregar fotos de calidad', priority: 'P1', impact: 'Confianza' },
        { task: 'Usar palabras clave competidor', priority: 'P1', impact: 'SEO' }
      ]
    });
  } catch (error) {
    console.error('Error:', error);
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
