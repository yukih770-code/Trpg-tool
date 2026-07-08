/**
 * Dev-only read-only User routes (P5.10G).
 *
 * Mounts ONLY three GET read routes behind an explicit server env gate
 * (`POSTGRES_USER_DEV_API_ENABLED=true`, never in production). It translates the
 * safe `ServerApiResponse` envelope to HTTP and NEVER exposes a write/save route.
 *
 * Boundary rules (enforced here):
 * - No POST / PUT / PATCH / DELETE.
 * - `saveUserProfileHandler` is intentionally NOT wired to any route.
 * - Responses are the safe envelope only (no raw DB error, no DATABASE_URL).
 * - No auth / session / cookie / JWT — which is exactly why this is dev-only.
 *
 * The caller (room-server) decides whether to register these routes; this module
 * does not read env itself, keeping the gate in one place.
 */
const DEV_USER_ROUTE_PREFIX = '/api/dev/users';
function requestId(req) {
    const header = req.header('x-request-id');
    return typeof header === 'string' && header.trim() !== '' ? header.trim() : undefined;
}
/** Send the safe envelope as-is; statusCode drives the HTTP status. */
function sendApiResponse(res, response) {
    res.status(response.statusCode).json(response);
}
/**
 * Register the dev-only read routes on an Express app. READ-ONLY: three GET
 * endpoints, no write route. Register order matters — the static `/by-identity`
 * path is registered before the `/:userId` param route so it is not captured.
 */
export function registerUserDevRoutes(app, handlers) {
    // GET /api/dev/users/by-identity?providerKind=...&providerSubject=...
    app.get(`${DEV_USER_ROUTE_PREFIX}/by-identity`, async (req, res) => {
        const response = await handlers.getUserByIdentityHandler({
            providerKind: req.query.providerKind,
            providerSubject: req.query.providerSubject,
            requestId: requestId(req),
        });
        sendApiResponse(res, response);
    });
    // GET /api/dev/users/:userId/profile
    app.get(`${DEV_USER_ROUTE_PREFIX}/:userId/profile`, async (req, res) => {
        const response = await handlers.getUserProfileHandler({
            userId: req.params.userId,
            requestId: requestId(req),
        });
        sendApiResponse(res, response);
    });
    // GET /api/dev/users/:userId
    app.get(`${DEV_USER_ROUTE_PREFIX}/:userId`, async (req, res) => {
        const response = await handlers.getUserByIdHandler({
            userId: req.params.userId,
            requestId: requestId(req),
        });
        sendApiResponse(res, response);
    });
}
