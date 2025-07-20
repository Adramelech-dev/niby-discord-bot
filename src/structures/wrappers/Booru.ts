
import fetch from 'node-fetch';
import { Cache, RedisCache } from '@/structures/Cache';

export type BooruTypes = "rule34" | "realbooru" | "konachan"
interface SearchOptions {
   limit: string;
   random: string;
   showUnavailable: string;
   cacheId: string;
   minScore: string;
   type: BooruTypes;
}

const DefaultSearchOptions: SearchOptions = {
   limit: "100",
   random: "true",
   showUnavailable: "true",
   cacheId: "",
   minScore: "5",
   type: "rule34",
};


const apiUrls = {
   "rule34": "https://rule34.xxx/index.php",
   "realbooru": "https://realbooru.com/index.php"
}

const cacheDuration = 2 * 60 * 60 * 1000; // 2 horas de duracion cache

const DefaultBooruSearchOptions = {
   page: "dapi",
   pid: "1",
   s: "post",
   q: "index",
   tags: [],
   json: '1',
   limit: "100",
   deleted: "true",
}


interface WrapperOptions {
   cache: RedisCache | Cache,
   token?: string,
}

interface CacheData {
   index: number;
   watched: string[];
   to_watch: string[];
}

export default class Booru {
   cache: RedisCache | Cache;
   constructor(options: WrapperOptions) {
      this.cache = options.cache; // En el mismo cache, añadir links.[tag] y requests-id.tag
   }

   async getCacheData(cacheId): Promise<CacheData> {
      return (
         await this.cache.get(cacheId) || {
            index: DefaultBooruSearchOptions.pid,
            watched: [],
            to_watch: [],
         }
      );
   }

   async getCachedResults(cached: CacheData, tags: string[], limit: string, cacheId: string, type: BooruTypes) {
      const cacheKey = `${cacheId}-${type}-[${tags}]`;

      // SI EL USUARIO YA HA VISTO ALGO, SACAMOS LOS VISTOS DE LA CACHÉ Y EMPUJAMOS LOS NUEVOS DE POR VER DE LOS SACADOS + RESULTS
      const resulted: string[] = [];
      const watched = cached.to_watch.splice(0, parseInt(limit));
      const newToWatch = [...new Set([...cached.to_watch])];

      cached.to_watch = newToWatch;
      cached.watched.push(...watched);
      resulted.push(...watched);

      cached.index += 1;
      await this.cache.set(cacheKey, cached, cacheDuration);

      return resulted;
   }

   async getResultsAndCache(results, cached, tags, limit, cacheId, type) {
      const cacheKey = `${cacheId}-${type}-[${tags}]`;
      const requesterCacheData = cached;
      const resulted: string[] = [];

      // / SI EL USUARIO NO HA BUSCAOD NADA DE ESO, DE LOS RESULTADOS, EXTRAEMOS LIMITE CANTIDAD, EL RESTO SON POR VER, LOS EMPUJAMOS
      if (requesterCacheData.index === 0) {
         const watched = results.splice(0, limit);
         const toWatch = results;
         requesterCacheData.to_watch.push(...toWatch);
         requesterCacheData.watched.push(...watched);
         resulted.push(...watched);
      } else {
         // SI EL USUARIO YA HA VISTO ALGO, SACAMOS LOS VISTOS DE LA CACHÉ Y EMPUJAMOS LOS NUEVOS DE POR VER DE LOS SACADOS + RESULTS
         const watched = requesterCacheData.to_watch.splice(0, limit);
         const toWatch = [...new Set([...requesterCacheData.to_watch, ...results])];

         requesterCacheData.to_watch = toWatch;
         requesterCacheData.watched.push(...watched);
         resulted.push(...watched);
      }

      // AUMENTAMOS +1 LA PAGINA (O COLUMNA)
      if (resulted.length === 0) {
         requesterCacheData.index = 0;
         resulted.push(requesterCacheData?.watched?.random());
      }
      requesterCacheData.index++;

      await this.cache.set(cacheKey, requesterCacheData, cacheDuration);
      return resulted;
   }


   async search(
      tags: string | string[] = [],
      options: SearchOptions = DefaultSearchOptions,
   ) {

      // eslint-disable-next-line prefer-const
      let { limit, showUnavailable, cacheId, minScore, type } = options;
      if(!limit || isNaN(parseInt(limit))) limit = DefaultBooruSearchOptions.limit;

      if (limit > DefaultBooruSearchOptions.limit) limit = DefaultBooruSearchOptions.limit;

      if (typeof tags === 'string') tags = tags.split(' ').filter((t) => t !== '');
      if (minScore && parseInt(minScore)) tags.push(`score:>=${minScore}`);

      const foundApiUrl = type ? apiUrls[type] : undefined;
      if (!foundApiUrl) throw new Error(`[BOORU WRAPPER] NO API URL FOUND FOR ${type}`);


      // Obtener la caché de páginas del usuario
      const requesterCacheData = await this.getCacheData(`${cacheId}-${type}-[${tags}]`);
      const { to_watch, index } = requesterCacheData;

      if (to_watch.length > 10 && index > 0) return this.getCachedResults(requesterCacheData, tags, limit, cacheId, type);
      const params = new URLSearchParams({
         page: DefaultBooruSearchOptions.page,
         pid: String(index),
         s: DefaultBooruSearchOptions.s,
         q: DefaultBooruSearchOptions.q,
         tags: tags.join(' '),
         json: '1',
         limit: DefaultBooruSearchOptions.limit,
         deleted: showUnavailable || DefaultBooruSearchOptions.deleted,
      });

      const apiUrl = `${foundApiUrl}?${params}`;

      try {
         const response = await fetch(apiUrl);
         const data = await response.json();
         const results = data.shuffle();
         if (cacheId) return this.getResultsAndCache(results, requesterCacheData, tags, limit, cacheId, type);
         return results;
      } catch (e) {
         console.log('Error 404 - Not Found');
         return null
      }
   }
}
