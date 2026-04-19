<?php
// ============================================================================
// auth_login.php — ACRIS · Login Endpoint
// POST { "email": "...", "password": "..." }
// Returns { success, token, user: { id, name, email, role } }
// ============================================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { http_response_code(405); echo json_encode(['success'=>false,'error'=>'Method not allowed']); exit; }

error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/db_config.php';

function auth_fail(string $msg, int $code = 401): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

function jwt_base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwt_create(array $payload): string {
    $header  = jwt_base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body    = jwt_base64url_encode(json_encode($payload));
    $sig     = jwt_base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

// ── Parse body ────────────────────────────────────────────────────────────────
$raw   = file_get_contents('php://input');
$body  = json_decode($raw, true);
$email = trim($body['email']    ?? '');
$pass  = trim($body['password'] ?? '');

if (!$email || !$pass) auth_fail('Email and password are required', 400);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) auth_fail('Invalid email format', 400);

// ── DB lookup ─────────────────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    auth_fail('Database unavailable. Please try again shortly.', 503);
}

$stmt = $pdo->prepare("SELECT id, email, password_hash, full_name, role, is_active FROM public.users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

// Use constant-time comparison to prevent timing attacks
if (!$user || !password_verify($pass, $user['password_hash'])) {
    // Deliberate 300ms delay to slow brute-force attempts
    usleep(300000);
    auth_fail('Invalid email or password');
}

if (!$user['is_active']) {
    auth_fail('Your account has been deactivated. Contact your administrator.');
}

// ── Issue JWT ─────────────────────────────────────────────────────────────────
$now   = time();
$token = jwt_create([
    'iss'   => JWT_ISSUER,
    'sub'   => $user['id'],
    'email' => $user['email'],
    'role'  => $user['role'],
    'name'  => $user['full_name'] ?? '',
    'iat'   => $now,
    'exp'   => $now + JWT_EXPIRY,
]);

// ── Update last_login ─────────────────────────────────────────────────────────
$pdo->prepare("UPDATE public.users SET last_login = now() WHERE id = :id")
    ->execute([':id' => $user['id']]);

// ── Respond ───────────────────────────────────────────────────────────────────
echo json_encode([
    'success' => true,
    'token'   => $token,
    'user'    => [
        'id'    => $user['id'],
        'name'  => $user['full_name'] ?? '',
        'email' => $user['email'],
        'role'  => $user['role'],
    ],
    'expires_in' => JWT_EXPIRY,
]);
