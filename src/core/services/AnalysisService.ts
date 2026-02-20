import type { AnalysisResult } from "../domain/models/Analysis";
import { IMAGE_CONFIG } from "../../config/constants";
import { logger } from "../../utils/logger/Logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_API_URL =
  process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

export class AnalysisService {
  /**
   * Analiza una imagen de moneda. Prioridad: Gemini si hay clave, si no OpenAI.
   */
  async analyzeCoinImage(imageBuffer: Buffer): Promise<AnalysisResult> {
    if (imageBuffer.length < IMAGE_CONFIG.MIN_FILE_SIZE) {
      logger.warn("Imagen demasiado pequeña para análisis", {
        size: imageBuffer.length,
      });
      return this.getTooSmallAnalysis();
    }

    try {
      if (GEMINI_API_KEY) {
        return await this.analyzeWithGemini(imageBuffer);
      }

      if (OPENAI_API_KEY) {
        return await this.analyzeWithOpenAI(imageBuffer);
      }

      throw new Error(
        "No hay GEMINI_API_KEY ni OPENAI_API_KEY configuradas para análisis de imágenes",
      );
    } catch (error) {
      logger.error("Error en análisis de moneda", { error });
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Integración con OpenAI Vision (gpt-4o).
   */
  private async analyzeWithOpenAI(
    imageBuffer: Buffer,
  ): Promise<AnalysisResult> {
    const base64 = imageBuffer.toString("base64");

    const body = {
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un experto numismático. Analiza la imagen de una moneda y responde SOLO con un JSON con campos: coinType, year, country, denomination, mint, value, rarity (0-5 entero), confidence (0-100 número), text (resumen breve), suggestions (array de strings). Si no estás seguro, usa null y baja la confidence. Mantén la respuesta en español.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analiza esta moneda y devuelve el JSON." },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
    };

    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      logger.error("OpenAI devolvió error", { status: res.status, body: txt });
      return this.getDefaultAnalysis();
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      logger.error("OpenAI sin contenido de respuesta");
      return this.getDefaultAnalysis();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      logger.error("No se pudo parsear JSON de OpenAI", { err, content });
      return this.getDefaultAnalysis();
    }

    const rarity =
      typeof parsed.rarity === "number"
        ? Math.min(Math.max(parsed.rarity, 0), 5)
        : 2;
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.min(Math.max(parsed.confidence, 0), 100)
        : undefined;

    return {
      description: parsed.coinType || "Moneda",
      text:
        parsed.text ||
        `Predicción: ${parsed.coinType || "desconocida"} (confianza ${
          confidence ?? "n/a"
        })`,
      year: parsed.year ? String(parsed.year) : undefined,
      coinType: parsed.coinType,
      mint: parsed.mint,
      value: parsed.value,
      country: parsed.country,
      denomination: parsed.denomination,
      rarity,
      confidence,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map((s: any) => String(s))
        : [],
    };
  }

  /**
   * Integración con Google Gemini Vision.
   */
  private async analyzeWithGemini(
    imageBuffer: Buffer,
  ): Promise<AnalysisResult> {
    const base64 = imageBuffer.toString("base64");

    const body = {
      contents: [
        {
          parts: [
            {
              text:
                "Eres un experto numismático. Analiza la imagen de una moneda y responde SOLO con un JSON con campos: coinType, year, country, denomination, mint, value, rarity (0-5 entero), confidence (0-100 número), text (resumen breve), suggestions (array de strings). Si no estás seguro, usa null y baja la confidence. Mantén la respuesta en español.",
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    };

    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      logger.error("Gemini devolvió error", { status: res.status, body: txt });
      return this.getDefaultAnalysis();
    }

    const json = await res.json();
    const content = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      logger.error("Gemini sin contenido de respuesta");
      return this.getDefaultAnalysis();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      logger.error("No se pudo parsear JSON de Gemini", { err, content });
      return this.getDefaultAnalysis();
    }

    const rarity =
      typeof parsed.rarity === "number"
        ? Math.min(Math.max(parsed.rarity, 0), 5)
        : 2;
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.min(Math.max(parsed.confidence, 0), 100)
        : undefined;

    return {
      description: parsed.coinType || "Moneda",
      text:
        parsed.text ||
        `Predicción: ${parsed.coinType || "desconocida"} (confianza ${
          confidence ?? "n/a"
        })`,
      year: parsed.year ? String(parsed.year) : undefined,
      coinType: parsed.coinType,
      mint: parsed.mint,
      value: parsed.value,
      country: parsed.country,
      denomination: parsed.denomination,
      rarity,
      confidence,
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map((s: any) => String(s))
        : [],
    };
  }

  private getTooSmallAnalysis(): AnalysisResult {
    return {
      description: "Imagen demasiado pequeña",
      text: "Intenta capturar la moneda con mejor calidad",
      coinType: "No detectada",
      rarity: 0,
      confidence: 10,
      suggestions: [
        "Acércate más a la moneda (más detalle)",
        "Asegúrate de buena iluminación",
        "Enfoca la moneda y evita reflejos",
      ],
    };
  }

  private getDefaultAnalysis(): AnalysisResult {
    return {
      description: "Moneda",
      text: "Moneda no identificada",
      year: undefined,
      coinType: "Moneda",
      mint: undefined,
      value: "Desconocido",
      country: undefined,
      denomination: undefined,
      rarity: 2,
      confidence: undefined,
      suggestions: [],
    };
  }
}
