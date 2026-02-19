import { LibsqlDatabase } from '../infrastructure/database/LibsqlDatabase';
import { SqliteDatabase } from '../infrastructure/database/SqliteDatabase';
import { InMemoryCache } from '../infrastructure/cache/InMemoryCache';
import { CoinRepository } from '../core/repositories/CoinRepository';
import { CoinService } from '../core/services/CoinService';
import { ImageService } from '../core/services/ImageService';
import { AnalysisService } from '../core/services/AnalysisService';
import { ComparisonService } from '../core/services/ComparisonService';
import { CACHE_CONFIG } from '../config/constants';
import type { Coin } from '../core/domain/models/Coin';

/**
 * Contenedor de inyección de dependencias
 * Gestiona instancias singleton de servicios y repositorios
 */
class Container {
    private static instance: Container;
    private _database?: any;
    private _cache?: InMemoryCache<Coin[]>;
    private _coinRepository?: CoinRepository;
    private _coinService?: CoinService;
    private _imageService?: ImageService;
    private _analysisService?: AnalysisService;
    private _comparisonService?: ComparisonService;

    private constructor() { }

    static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }

    get database(): any {
        if (!this._database) {
            const tursoUrl = process.env.TURSO_DATABASE_URL || undefined;
            const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

            if (isServerless) {
                if (!tursoUrl || tursoUrl.startsWith('file:')) {
                    const msg = 'En entornos serverless (Vercel) se requiere configurar TURSO_DATABASE_URL a una instancia Turso remota. No se puede usar SQLite local (file:) en funciones serverless.';
                    // Registrar para facilitar debugging
                    // eslint-disable-next-line no-console
                    console.error(msg, { tursoUrl, isServerless });
                    throw new Error(msg);
                }

                this._database = new LibsqlDatabase();
            } else {
                // Local development or explicit file URL: use SqliteDatabase
                this._database = new SqliteDatabase();
            }
        }
        return this._database;
    }

    get cache(): InMemoryCache<Coin[]> {
        if (!this._cache) {
            this._cache = new InMemoryCache<Coin[]>(CACHE_CONFIG.TTL_MS);
        }
        return this._cache;
    }

    get coinRepository(): CoinRepository {
        if (!this._coinRepository) {
            this._coinRepository = new CoinRepository(this.database, this.cache);
        }
        return this._coinRepository;
    }

    get coinService(): CoinService {
        if (!this._coinService) {
            this._coinService = new CoinService(this.coinRepository);
        }
        return this._coinService;
    }

    get imageService(): ImageService {
        if (!this._imageService) {
            this._imageService = new ImageService();
        }
        return this._imageService;
    }

    get analysisService(): AnalysisService {
        if (!this._analysisService) {
            this._analysisService = new AnalysisService();
        }
        return this._analysisService;
    }

    get comparisonService(): ComparisonService {
        if (!this._comparisonService) {
            this._comparisonService = new ComparisonService();
        }
        return this._comparisonService;
    }

    /**
     * Restablecer todos los servicios (útil para testing)
     */
    reset(): void {
        this._database?.close();
        this._database = undefined;
        this._cache = undefined;
        this._coinRepository = undefined;
        this._coinService = undefined;
        this._imageService = undefined;
        this._analysisService = undefined;
        this._comparisonService = undefined;
    }
}

// Exportar instancia singleton
export const container = Container.getInstance();
