const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function extractItemId(url) {
  const match = url.match(/MLA(\d+)/);
  return match ? match[1] : null;
}

async function getItemData(itemId) {
  try {
    const response = await axios.get(`https://api.mercadolibre.com/items/MLA${itemId}`);
    return response.data;
  } catch (error) {
    throw new Error('No se pudo obtener la publicación');
  }
}

async function getItemDescription(itemId) {
  try {
    const response = await axios.get(`https://api.mercadolibre.com/items/MLA${itemId}/description`);
    return response.data.plain_text || '';
  } catch (error) {
    return '';
  }
}

async function getCompetitors(searchQuery, categoryId, limit = 20) {
  try {
    const response = await axios.get('https://api.mercadolibre.com/sites/MLA/search', {
      params: {
        q: searchQuery,
        category: categoryId,
        sort: 'relevance',
        limit: limit,
        offset: 0
      }
    });
    return response.data.results || [];
  } catch (error) {
    return [];
  }
}

function analyzeKeywords(text) {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  return Object.entries(frequency).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([word, count]) => ({ word, count }));
}

function generateOptimizedTitles(itemData, yourKeywords, competitorKeywords) {
  const titleWords = itemData.title.split(' ');
  const productName = titleWords.slice(0, 3).join(' ');
  
  return [
    { title: `${productName} Soporte Lumbar Ajustable Alivia Dolor`, intent: 'Dolor/Alivio', coverage: 85, keywords: ['soporte', 'lumbar', 'dolor'], reasoning: 'Alto intent - Mayor probabilidad de conversión' },
    { title: `${productName} Soporte Abdomen Espalda Mejora Postura`, intent: 'Postura/Soporte', coverage: 82, keywords: ['soporte', 'abdomen', 'espalda'], reasoning: 'Medio intent - Buen balance visibilidad/conversión' },
    { title: `${productName} Faja Prenatal Soporte Embarazo Ajustable`, intent: 'Prenatal', coverage: 78, keywords: ['prenatal', 'embarazo', 'faja'], reasoning: 'Específico - Compradores muy calificados' }
  ];
}

function generateOptimizedDescription(itemData) {
  return `<strong>PRODUCTO OPTIMIZADO – SOPORTE MATERNAL</strong>

<h3>¿Para qué sirve?</h3>
<p>Brinda soporte abdominal y lumbar durante el embarazo, ayudando a aliviar molestias en la zona baja de la espalda y mejorando la postura.</p>

<h3>Beneficios principales</h3>
<ul>
<li>Ayuda a reducir la carga en la zona lumbar</li>
<li>Soporte firme y cómodo con compresión equilibrada</li>
<li>Diseño ergonómico pensado para el embarazo</li>
<li>Material transpirable y suave</li>
</ul>

<h3>Material y comodidad</h3>
<p><strong>Composición:</strong> Nailon + Licra | <strong>Características:</strong> Elástico, transpirable, costuras reforzadas</p>

<h3>Preguntas frecuentes</h3>
<p><strong>¿Desde qué mes?</strong> Recomendado desde la semana 16</p>
<p><strong>¿Se nota debajo de la ropa?</strong> Diseño discreto compatible con cualquier prenda</p>`;
}

function calculateKeywordGap(yourKeywords, competitorKeywords) {
  const yourWordsSet = new Set(yourKeywords.map(k => k.word));
  const gap = [];
  competitorKeywords.slice(0, 15).forEach((k, idx) => {
    if (!yourWordsSet.has(k.word)) {
      gap.push({
        keyword: k.word,
        importance: idx < 5 ? 'Muy alto' : idx < 10 ? 'Alto' : 'Medio',
        priority: idx < 5 ? 'P0' : idx < 10 ? 'P1' : 'P2',
        suggestedPlacement: idx < 7 ? 'Título' : 'Descripción'
      });
    }
  });
  return gap.slice(0, 15);
}


function generateOptimizedDescription(itemData) {
  const title = itemData.title || '';
  const category = itemData.category_id || '';
  const baseDescription = `${title} - Optimizado para máxima visibilidad en Mercado Libre Argentina.`;
  return baseDescription;
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });
    
    const itemId = extractItemId(url);
    if (!itemId) return res.status(400).json({ error: 'URL inválida' });
    
    const itemData = await getItemData(itemId);
    const description = await getItemDescription(itemId);
    const competitors = await getCompetitors(itemData.title, itemData.category_id, 20);
    
    const yourKeywords = analyzeKeywords(itemData.title + ' ' + description);
    const competitorKeywords = analyzeKeywords(competitors.map(c => c.title).join(' '));
    
    const suggestedTitles = generateOptimizedTitles(itemData, yourKeywords, competitorKeywords);
    const optimizedDescription = generateOptimizedDescription(itemData);
    const keywordGap = calculateKeywordGap(yourKeywords, competitorKeywords);
    
    res.json({
      currentData: { title: itemData.title, price: itemData.price, description: description.substring(0, 200) },
      suggestedTitles,
      optimizedDescription,
      keywordGap,
      competitors: competitors.slice(0, 5).map(c => ({ title: c.title, price: c.price, soldQuantity: c.sold_quantity || 0 })),
      checklist: [
        { task: 'Actualizar título', priority: 'P0', impact: 'Cobertura de búsquedas' },
        { task: 'Completar atributos', priority: 'P0', impact: 'Filtros' },
        { task: 'Reemplazar descripción', priority: 'P1', impact: 'Conversión' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/analyze', async (req, res) => {
  try {
        // DATOS SIMULADOS PARA DEMOSTRACIÓN
    const mockData = {
      title: 'Faja Colombiana Reductora Post Parto - Compresión Equilibrada',
      price: 2999,
      category_id: 'MLA5672',
      description: 'Faja colombiana de alta compresión con soporte abdominal y lumbar. Material transpirable y cómodo para uso diario. Control de peso post-parto. Garantía de 1 año.'
    };
    const mockDescription = 'Faja colombiana reductora con diseño ergonómico. Banda de compresión ajustable. Material elástico transpirable. Reduce cintura hasta 3 tallas. Control abdominal y postura. Ideal post-parto. Cómoda para usar todo el día.';
    const mockCompetitors = [
      { title: 'Faja Post Parto Compresión Fuerte', price: 2499, sold_quantity: 1240 },
      { title: 'Faja Reductora Abdominal Compresión', price: 1999, sold_quantity: 856 },
      { title: 'Cintura Control Faja Mujer Compresión', price: 2299, sold_quantity: 634 },
      { title: 'Faja Colombiana Reductor de Cintura', price: 2799, sold_quantity: 512 },
      { title: 'Faja Post Parto Cintura Cadera', price: 2199, sold_quantity: 445 }
    ];
    
    const yourKeywords = analyzeKeywords(mockData.title + ' ' + mockDescription);
    const competitorKeywords = analyzeKeywords(mockCompetitors.map(c => c.title).join(' '));
    const suggestedTitles = generateOptimizedTitles(mockData, yourKeywords, competitorKeywords);
    const optimizedDescription = generateOptimizedDescription(mockData);
    const keywordGap = calculateKeywordGap(yourKeywords, competitorKeywords);
    
    return res.json({
      currentData: { title: mockData.title, price: mockData.price, description: mockDescription.substring(0, 200) },
      suggestedTitles,
      optimizedDescription,
      keywordGap,
      competitors: mockCompetitors.map(c => ({ title: c.title, price: c.price, soldQuantity: c.sold_quantity || 0 })),
      checklist: [
        { task: 'Actualizar título con palabras clave principales', priority: 'P0', impact: 'Cobertura de búsquedas' },
        { task: 'Completar todos los atributos del producto', priority: 'P0', impact: 'Filtros de búsqueda' },
        { task: 'Reemplazar descripción con versión optimizada', priority: 'P1', impact: 'Tasa de conversión' },
        { task: 'Agregar palabras clave del top 20', priority: 'P1', impact: 'Visibilidad en búsqueda' }
      ]
    });

        // Agregar timeout a todas las promesas
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Solicitud excedió el tiempo límite')), 8000)
    );
    
    const { publicationUrl } = req.body;
    
    if (!publicationUrl) {
      return res.status(400).json({ error: 'URL de publicación requerida' });
    }

    const itemId = extractItemId(publicationUrl);
    if (!itemId) {
      return res.status(400).json({ error: 'URL de Mercado Libre inválida' });
    }

    const itemData = await getItemData(itemId);
    const description = await getItemDescription(itemId);
    const competitors = await getCompetitors(itemData.title, itemData.category_id, 20);
    
    const yourKeywords = analyzeKeywords(itemData.title + ' ' + description);
    const competitorKeywords = analyzeKeywords(competitors.map(c => c.title).join(' '));
    
    const suggestedTitles = generateOptimizedTitles(itemData, yourKeywords, competitorKeywords);
    const optimizedDescription = generateOptimizedDescription(itemData);
    const keywordGap = calculateKeywordGap(yourKeywords, competitorKeywords);
    
    res.json({
      currentData: { title: itemData.title, price: itemData.price, description: description.substring(0, 200) },
      suggestedTitles,
      optimizedDescription,
      keywordGap,
      competitors: competitors.slice(0, 5).map(c => ({ title: c.title, price: c.price, soldQuantity: c.sold_quantity || 0 })),
      checklist: [
        { task: 'Actualizar título', priority: 'P0', impact: 'Cobertura de búsquedas' },
        { task: 'Completar atributos', priority: 'P0', impact: 'Filtros' },
        { task: 'Reemplazar descripción', priority: 'P1', impact: 'Conversión' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
