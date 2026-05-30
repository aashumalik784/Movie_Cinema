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

        host: process.env.HOST ?? '0.0.0.0',
        port: Number(process.env.PORT ?? 10000),
        publicUrl: process.env.PUBLIC_URL,

        cache: {
            type: (process.env.CACHE_TYPE as 'memory' | 'redis') ?? 'memory',
            ttl: {
                sources: 60 * 60,
                subtitles: 60 * 60 * 24
            },
            redis: {
                host: process.env.REDIS_HOST ?? 'localhost',
                port: Number(process.env.REDIS_PORT ?? 6379),
                password: process.env.REDIS_PASSWORD
            }
        },

        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
            cacheTTL: 24 * 60 * 60
        },

        proxyConfig: {
            knownThirdPartyProxies: knownThirdPartyProxies,
            streamPatterns
        },

        cors: {
            origin: process.env.CORS_ORIGIN ?? '*',
            methods: ['GET', 'OPTIONS', 'POST'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
            exposedHeaders: ['Content-Range', 'Accept-Ranges', 'ETag', 'Content-Length'],
            preflightContinue: false,
            optionsSuccessStatus: 204
        },

        stremio: {
            enableNativeAddon: process.env.STREMIO_ADDON === 'true',
            stremioAddons: []
        },

        mcp: {
            enabled: process.env.MCP_ENABLED === 'true'
        }
    });

    const app = server.getApp();
    
    app.get('/', (_req: any, res: any) => {
        res.status(200).json({
            status: 'ok',
            message: 'CinePro API is running',
            endpoints: {
                manifest: '/manifest.json',
                stream: '/stream/:type/:id',
                catalog: '/catalog/:type/:id.json'
            },
            publicUrl: process.env.PUBLIC_URL || `http://localhost:${process.env.PORT ?? 10000}`
        });
    });

    const registry = server.getRegistry();
    await registry.discoverProviders(path.join(__dirname, './providers/'));

    await server.start();

    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT ?? 10000}`;
    const uiUrl = `https://ui.cinepro.cc/?omssurl=${encodeURIComponent(publicUrl)}`;

    const title = '🚀 CinePro Backend Started';
    const contrib = '🤝 We are looking for contributors to improve and develop!';
    const repo = 'Contribute: https://github.com/cinepro-org/ui';
    const tryIt = `🌐 Public URL: ${publicUrl}`;
    const note = 'Backend is ready to serve requests.';

    const lines = [title, '', repo, '', contrib, '', tryIt, '', note];
    const width = Math.max(...lines.map((l) => l.length)) + 2;
    const borderTop = '╭' + '─'.repeat(width) + '╮';
    const borderBottom = '╰' + '─'.repeat(width) + '╯';
    const pad = (line: string) => '│ ' + line.padEnd(width - 2, ' ') + ' │';

    console.log(`
================== CINEPRO BACKEND ==================

${borderTop}
${lines.map(pad).join('\n')}
${borderBottom}
`);
}

main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
