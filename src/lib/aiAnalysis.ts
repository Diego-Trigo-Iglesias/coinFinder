import vision from '@google-cloud/vision';

// Crea un cliente
const client = new vision.ImageAnnotatorClient();

export async function analyzeCoinImage(imageBuffer: Buffer): Promise<{
  description: string;
  text: string;
  year?: string;
  coinType?: string;
  mint?: string;
  value?: string;
  country?: string;
  denomination?: string;
  rarity: number;
}> {
  try {
    const request = {
      image: { content: imageBuffer.toString('base64') },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' },
        { type: 'OBJECT_LOCALIZATION' },
      ],
    };

    const [result] = await client.annotateImage(request);
    const labels = result.labelAnnotations || [];
    const texts = result.textAnnotations || [];
    const objects = result.localizedObjectAnnotations || [];

    // Extraer texto (para año, acuñación, etc.)
    const fullText = texts.length > 0 ? texts[0].description || '' : '';

    // Extracción avanzada usando expresiones regulares y heurísticas
    const yearMatch = fullText.match(/\b(18|19|20)\d{2}\b/);
    const year = yearMatch ? yearMatch[0] : undefined;

    // Marcas de acuñación (abreviaturas comunes)
    const mintMatch = fullText.match(/\b(D|CC|S|P|W|O)\b/);
    const mint = mintMatch ? mintMatch[0] : undefined;

    // Detección de país desde texto o etiquetas
    const countryKeywords = ['USA', 'UNITED STATES', 'MEXICO', 'SPAIN', 'FRANCE', 'GERMANY', 'CANADA', 'UK', 'BRITAIN', 'ITALY', 'JAPAN', 'CHINA', 'RUSSIA', 'AUSTRALIA'];
    const country = countryKeywords.find(c => fullText.toUpperCase().includes(c)) || labels.find(l => countryKeywords.some(c => l.description?.toUpperCase().includes(c)))?.description || undefined;

    // Denominación (ej. 1 CENT, 5 PESOS, etc.)
    const denomMatch = fullText.match(/\b(\d+)\s*(CENT|CENTAVO|EURO|PESETA|FRANC|MARK|POUND|YEN|YUAN|RUBEL|DOLLAR|PESO)\b/i);
    const denomination = denomMatch ? denomMatch[0] : undefined;

    // Tipo de moneda desde etiquetas
    const coinLabels = labels.filter(label => label.description?.toLowerCase().includes('coin') || label.description?.toLowerCase().includes('currency') || label.description?.toLowerCase().includes('medal'));
    const coinType = coinLabels.length > 0 ? coinLabels[0].description ?? 'Desconocido' : 'Desconocido';

    // Valor aproximado (podría integrar con API)
    const value = denomination ? `Valor facial: ${denomination}` : 'Desconocido';

    // Rareza basada en etiquetas y texto
    let rarity = 1;
    if (fullText.includes('rare') || fullText.includes('rara') || labels.some(l => l.description?.includes('rare'))) rarity = 4;
    if (fullText.includes('unique') || fullText.includes('única') || labels.some(l => l.description?.includes('unique'))) rarity = 5;
    if (year && parseInt(year) < 1900) rarity += 1; // Monedas más antiguas podrían ser más raras

    const description = labels.map(l => l.description).join(', ');

    return {
      description,
      text: fullText,
      year,
      coinType,
      mint,
      value,
      country,
      denomination,
      rarity,
    };
  } catch (error) {
    console.error('Error analizando imagen con IA:', error);
    // Retroceder a información básica
    return {
      description: 'Análisis no disponible (configura Google Cloud Vision)',
      text: '',
      year: undefined,
      coinType: 'Desconocido',
      mint: undefined,
      value: 'Desconocido',
      country: undefined,
      denomination: undefined,
      rarity: 1,
    };
  }
}