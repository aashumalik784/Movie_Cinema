import { OMSSServer } from '@omss/framework';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { knownThirdPartyProxies } from './thirdPartyProxies.js';
import { streamPatterns } from './streamPatterns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const server = new OMSSServer({
        name: 'CinePro',
        version: '1.0.0',

        // Network
        host: process.env.HOST?? '0.0.0.0',
        port: Number(process.env.PORT?? 10000),
        publicUrl: process.env.PUBLIC_URL?? `http://localhost:${process.env.PORT?? 10000}`,

        // Cache (memory for dev, Redis for prod)
        cache: {
            type: (process.env.CACHE_TYPE as 'memory' | 'redis')?? 'memory',
            ttl: {
                sources: 60 * 60,
                subtitles: 60 * 60 * 24
            },
            redis: {
                host: process.env.REDIS_HOST?? 'localhost',
                port: Number(process.env.REDIS_PORT?? 6379),
                password: process.env.REDIS_PASSWORD
            }
        },

        // TMDB
        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
            cacheTTL: 24 * 60 * 60 // 24h
        },

        // Third Party Proxy removal
        proxyConfig: {
            knownThirdPartyProxies: knownThirdPartyProxies,
            streamPatterns
        },

        cors: {
            origin: process.env.CORS_ORIGIN?? '*',
            methods: ['GET', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Content-Range', 'Accept-Ranges', 'ETag'],
            preflightContinue: false,
            optionsSuccessStatus: 204
        },

        stremio: {
            enableNativeAddon: process.env.STREMIO_ADDON === 'true',
            stremioAddons: []
        },

        mcp: {
            enabled: process.env.MCP_ENABLED === 'true'
        },

        // 👇 YE ADD KAR - OMSS KA OFFICIAL CUSTOM ROUTE SYSTEM
        plugins: [
            {
                name: 'custom-info-route',
                register: async (omss) => {
                    omss.route({
                        method: 'GET',
                        url: '/v1/info/:tmdbId',
                        handler: async (request, reply) => {
                            try {
                                const { tmdbId } = request.params as { tmdbId: string };
                                if (!process.env.TMDB_API_KEY) {
                                    return reply.status(500).send({ error: 'TMDB_API_KEY missing' });
                                }
                                const tmdbRes = await fetch(
                                    `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`
                                );
                                const data: any = await tmdbRes.json();
                                if (data.success === false ||!data.id) {
                                    return reply.status(404).send({ error: 'Movie not found' });
                                }
                                return reply.send({
                                    title: data.title,
                                    poster: data.poster_path? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                                    overview: data.overview,
                                    year: data.release_date?.split('-')[0] || 'N/A'
                                });
                            } catch (e) {
                                return reply.status(500).send({ error: 'TMDB fetch failed' });
                            }
                        }
                    });
                }
            }
        ]
    });

    // Register providers
    const registry = server.getRegistry();
    await registry.discoverProviders(path.join(__dirname, './providers/'));

    await server.start();

    const publicUrl =
        process.env.PUBLIC_URL??
        `http://${process.env.HOST?? 'localhost'}:${process.env.PORT?? 3000}`;

    const uiUrl = `https://ui.cinepro.cc/?omssurl=${encodeURIComponent(publicUrl)}`;

    const title = '🚀 CinePro/ui is in public testing';
    const contrib =
        '🤝 We are looking for contributors to improve and develop!';
    const repo = 'Contribute: https://github.com/cinepro-org/ui';
    const tryIt = `🌐 Try it out: ${uiUrl}!`;
    const note =
        'You will need to give the website "access to local applications" that it works.';

    const lines = [title, '', repo, '', contrib, '', tryIt, '', note];
    const width = Math.max(...lines.map((l) => l.length)) + 2;
    const borderTop = '╭' + '─'.repeat(width) + '╮';
    const borderBottom = '╰' + '─'.repeat(width) + '╯';
    const pad = (line: string) => '│ ' + line.padEnd(width - 2, ' ') + ' │';

    console.log(`
================== CINEPRO BETA ANNOUNCEMENT ==================

${borderTop}
${lines.map(pad).join('\n')}
${borderBottom}
`);
}

main().catch(() => {
    process.exit(1);
});
