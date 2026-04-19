<?php
// ============================================================================
// db_config.php — ACRIS · Database + Auth Configuration
// ============================================================================
// SECURITY: Move this file ABOVE the web root in production.
//   require_once '/var/www/config/db_config.php';
// Or add to .htaccess:
//   <Files "db_config.php">
//       Require all denied
//   </Files>
// ============================================================================

// ── Database ──────────────────────────────────────────────────────────────────
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 5432);
define('DB_NAME', 'climate_system');
define('DB_USER', 'postgres');
define('DB_PASS', 'adebabalola');

// ── JWT Auth ──────────────────────────────────────────────────────────────────
// Generate a strong secret: php -r "echo bin2hex(random_bytes(32));"
// Replace this value before going to production.
define('JWT_SECRET',  'acris_jwt_secret_change_in_production_32bytes_minimum');
define('JWT_EXPIRY',  8 * 3600);   // 8 hours in seconds
define('JWT_ISSUER',  'acris.africa');

// ── Baseline confidence thresholds ───────────────────────────────────────────
define('BASELINE_INSUFFICIENT', 7);
define('BASELINE_LOW',          30);
define('BASELINE_MODERATE',     90);

// ── Query row limits ──────────────────────────────────────────────────────────
define('POINTS_LIMIT',  5000);
define('CLUSTER_LIMIT', 5000);
