# ML Optimizer Pro

Optimizador profesional de publicaciones en Mercado Libre Argentina. Analiza competencia real, genera títulos por intención de búsqueda y optimiza tus publicaciones para mejorar visibilidad y conversión.

## ✨ Características

- 🎯 **Análisis de Competencia Real**: Consulta la API de Mercado Libre para obtener datos reales de competidores
- 📝 **3 Títulos Sugeridos**: Genera títulos por intención de búsqueda (Dolor/Alivio, Postura/Soporte, Prenatal)
- 📋 **Descripción Optimizada**: Crea descripciones con estructura pro pensada para conversión
- 🔑 **Keyword Gap Analysis**: Identifica palabras clave que usan competidores y que te faltan
- ✅ **Checklist de Mejoras**: Recomendaciones priorizadas (P0, P1, P2) para optimizar
- 📊 **Benchmark vs Competencia**: Visualiza cómo se comparan 10 competidores top
- 📱 **Interfaz Responsive**: Diseñada con TailwindCSS para usar en cualquier dispositivo

## 🚀 Instalación Rápida (Local)

### Requisitos
- Node.js 18+
- npm

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/guilleherrero/ml-optimizer-pro.git
cd ml-optimizer-pro

# Instalar dependencias
npm install

# Iniciar el servidor
npm start

# Abrir en navegador
http://localhost:3000
```

## 🌐 Deploy en Render (Recomendado)

### Opción más rápida (5 minutos)

1. **Ir a https://render.com** y crear cuenta con GitHub
2. **Conectar este repositorio**
3. **Crear Web Service:**
   - Name: `ml-optimizer-pro`
   - Region: São Paulo (bajo latnecia)
   - Build command: `npm install`
   - Start command: `node server.js`
4. **Deploy**

¡Listo! Tu app estará en línea en 2-3 minutos.

## 📖 Cómo Usar

1. **Pega tu URL de publicación de Mercado Libre Argentina**
   ```
   https://www.mercadolibre.com.ar/item/MLA1234567890
   ```

2. **Haz click en "Analizar"**

3. **Recibe:
   - Títulos sugeridos por intención
   - Descripción optimizada
   - Palabras clave que te faltan
   - Atributos a completar
   - Checklist de mejoras
   - Benchmark vs competidores

4. **Copia y pega los textos** en tu publicación de ML

## 🛠️ Stack Técnico

### Backend
- **Express.js**: Framework web minimal y rápido
- **Axios**: Para consultar API de Mercado Libre
- **CORS**: Gestión de solicitudes cross-origin
- **Node.js 18**: Runtime de JavaScript

### Frontend
- **HTML5** con semántica moderna
- **TailwindCSS**: Estilos responsivos
- **JavaScript vanilla**: Sin dependencias pesadas

### Integración
- **API de Mercado Libre**: Datos públicos de items, búsquedas, competencia

## 📊 Estructura del Proyecto

```
ml-optimizer-pro/
├── server.js                    # Backend (Express)
├── package.json                 # Dependencias
├── public/
│   └── index.html              # Frontend (HTML + CSS + JS)
└── README.md                    # Este archivo
```

## 🔍 Funcionalidades Técnicas Detalladas

### Análisis de Keywords
- Extrae palabras clave del título y descripción
- Calcula frecuencia de aparición
- Compara contra competencia top
- Genera keyword gap (gap analysis)

### Generación de Títulos
Crea 3 variantes según intención:
- **P1: Dolor/Alivio** (Alto intent, mayor conversión)
- **P2: Postura/Soporte** (Intención general, balance)
- **P3: Prenatal/Específico** (Intención específica, compradores calificados)

### Descripción Optimizada
Sigue estructura probada:
- ¿Para qué sirve?
- Beneficios principales
- Material y comodidad
- Talles y especificaciones
- Preguntas frecuentes
- Disclaimers (cuando aplica)

## 💡 Tips para Mejores Resultados

1. **Usa el título con mejor coverage** (P1 suele ser más efectivo)
2. **Completa todos los atributos** que sugiere la app
3. **Reemplaza la descripción completa** con la optimizada
4. **Revisa el keyword gap** y agrega términos clave faltantes
5. **Aplica cambios semanalmente** para mantenerte actualizado

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz un fork del proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - Libre para uso comercial y personal

## 📞 Soporte

Este proyecto fue diseñado para optimizar publicaciones de Mercado Libre Argentina de forma rápida y eficiente usando análisis real de competencia.

---

**Creado con ❤️ para vendedores de Mercado Libre Argentina**
