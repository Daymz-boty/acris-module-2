<?php
// ============================================================================
// get_desertification.php — ACRIS Module 2 · Analytics API v3
// ============================================================================
// Modes:
//   desertification_grid   — grid cells for map rendering
//   country_stats          — country-level summary for dashboard panels
//   forest_loss_clusters   — hotspot overlay (legacy)
//   forest_clusters        — NEW: cluster polygons with health status + fire linkage
//   area_analysis          — bounding box / polygon / shapefile intelligence
//   rainfall_context       — rainfall anomaly for a polygon
// ============================================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// At the very top of get_desertification.php, after <?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log all errors to a file
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// ── Credentials ───────────────────────────────────────────────────────────────
require_once __DIR__ . '/db_config.php';

// ── Auth guard ────────────────────────────────────────────────────────────────
require_once __DIR__ . '/auth_verify.php';

// ── DB connection ─────────────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
    );
} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

$pdo->exec("SET statement_timeout = '60000'"); // 60 seconds

// ── Helpers ───────────────────────────────────────────────────────────────────
function respond(string $mode, array $data, array $meta = []): void {
    echo json_encode(array_merge(['success' => true, 'mode' => $mode, 'count' => count($data)], $meta, ['data' => $data]), JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    exit;
}
function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}
function tableExists(PDO $pdo, string $table): bool {
    return (bool) $pdo->query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='{$table}')")->fetchColumn();
}

// ── Health classification helper ──────────────────────────────────────────────
function classifyForestHealth(?float $anomaly, ?string $trend): string {
    if ($anomaly === null) return 'Unknown';
    if ($anomaly > 0.05 && $trend !== 'Declining')  return 'Regenerating';
    if ($anomaly < -0.10 || $trend === 'Declining')  return 'Declining';
    return 'Stable';
}

// ── Request parsing ───────────────────────────────────────────────────────────
$mode      = trim($_GET['mode']       ?? 'country_stats');
$country   = trim($_GET['country']    ?? '');
$startDate = trim($_GET['start_date'] ?? '');
$endDate   = trim($_GET['end_date']   ?? '');
$minRisk   = trim($_GET['min_risk']   ?? '');
$bbox      = trim($_GET['bbox']       ?? '');
$format    = trim($_GET['format']     ?? 'properties');
$top       = min((int)($_GET['top']   ?? 100), 566);
$minLoss   = trim($_GET['min_loss']   ?? '');


// ════════════════════════════════════════════════════════════════════════════
// DESERTIFICATION GRID
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'desertification_grid') {
    if (!tableExists($pdo, 'desertification_grid')) respond('desertification_grid', [], ['note' => 'table not yet available']);
    $where = ['risk_score IS NOT NULL']; $params = [];
    if ($bbox !== '') {
        $parts = explode(',', $bbox);
        if (count($parts) !== 4) fail('bbox must be: min_lon,min_lat,max_lon,max_lat');
        [$minLon,$minLat,$maxLon,$maxLat] = array_map('floatval', $parts);
        $where[] = 'lon_bin BETWEEN :min_lon AND :max_lon'; $where[] = 'lat_bin BETWEEN :min_lat AND :max_lat';
        $params[':min_lon']=$minLon; $params[':max_lon']=$maxLon; $params[':min_lat']=$minLat; $params[':max_lat']=$maxLat;
    }
    if ($country !== '') { $where[] = 'country ILIKE :country'; $params[':country'] = '%'.$country.'%'; }
    if ($minRisk !== '') { $where[] = 'risk_score >= :min_risk'; $params[':min_risk'] = (float)$minRisk; }
    $whereSql = 'WHERE ' . implode(' AND ', $where);
    if ($format === 'geojson') {
        $sql = "SELECT json_build_object('type','FeatureCollection','features',COALESCE(json_agg(json_build_object('type','Feature','geometry',ST_AsGeoJSON(geom)::json,'properties',json_build_object('lon_bin',lon_bin,'lat_bin',lat_bin,'current_ndvi',current_ndvi,'ndvi_anomaly',ndvi_anomaly,'trend_direction',trend_direction,'anomaly_label',anomaly_label,'risk_score',risk_score,'risk_label',risk_label,'land_cover',land_cover,'country',country))),'[]'::json)) AS geojson FROM desertification_grid $whereSql LIMIT 50000";
        try { $stmt=$pdo->prepare($sql); $stmt->execute($params); $row=$stmt->fetch(); $fc=$row?json_decode($row['geojson'],true):['type'=>'FeatureCollection','features'=>[]]; echo json_encode(array_merge(['success'=>true,'mode'=>$mode],$fc),JSON_UNESCAPED_UNICODE|JSON_NUMERIC_CHECK); exit; }
        catch (PDOException $e) { fail('desertification_grid query failed: '.$e->getMessage(),500); }
    } else {
        $sql = "SELECT lon_bin,lat_bin,current_ndvi,ndvi_anomaly,ndvi_trend_3m,trend_direction,anomaly_label,risk_score,risk_label,land_cover,country FROM desertification_grid $whereSql ORDER BY risk_score DESC LIMIT 50000";
        try { $stmt=$pdo->prepare($sql); $stmt->execute($params); respond('desertification_grid',$stmt->fetchAll()); }
        catch (PDOException $e) { fail('desertification_grid query failed: '.$e->getMessage(),500); }
    }
}

// ════════════════════════════════════════════════════════════════════════════
// COUNTRY STATS
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'country_stats') {
    if (!tableExists($pdo, 'desertification_country_stats')) respond('country_stats', [], ['note' => 'table not yet available']);
    $where = []; $params = [];
    if ($country !== '') { $where[] = 'country ILIKE :country'; $params[':country'] = '%'.$country.'%'; }
    $whereSql = $where ? 'WHERE '.implode(' AND ',$where) : '';
    try {
        $stmt = $pdo->prepare("SELECT country,avg_risk_score,max_risk_score,pct_high_risk,pct_critical_risk,dominant_risk_label,avg_ndvi_anomaly,min_ndvi_anomaly,ndvi_trend,pct_below_normal,forest_loss_km2,forest_loss_pct_baseline,latest_loss_year,avg_rainfall_anomaly_pct,fire_feedback_ratio,fire_count_pre,fire_count_post,dominant_land_cover,sample_months,grid_cell_count,updated_at FROM desertification_country_stats $whereSql ORDER BY avg_risk_score DESC NULLS LAST LIMIT :top");
        $stmt->bindValue(':top', $top, PDO::PARAM_INT);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        respond('country_stats', $stmt->fetchAll());
    } catch (PDOException $e) { fail('country_stats query failed: '.$e->getMessage(),500); }
}

// ════════════════════════════════════════════════════════════════════════════
// FOREST LOSS CLUSTERS (legacy hotspot overlay)
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'forest_loss_clusters') {
    if (!tableExists($pdo, 'forest_loss_clusters')) respond('forest_loss_clusters', [], ['note' => 'table not yet available']);
    $where = []; $params = [];
    if ($country !== '') { $where[] = "country ILIKE :country"; $params[':country'] = '%'.$country.'%'; }
    if ($minLoss !== '') { $where[] = "total_loss_area_km2 >= :min_loss"; $params[':min_loss'] = (float)$minLoss; }
    $whereSql = $where ? 'WHERE '.implode(' AND ',$where) : '';
    if ($bbox !== '') {
        $parts = explode(',', $bbox);
        if (count($parts) !== 4) fail('bbox must be: min_lon,min_lat,max_lon,max_lat');
        [$minLon,$minLat,$maxLon,$maxLat] = array_map('floatval', $parts);
        $bboxWhere = "ST_Intersects(cluster_geom, ST_MakeEnvelope(:bl,$minLat,:br,$maxLat,4326))";
        $where[] = $bboxWhere; $params[':bl'] = $minLon; $params[':br'] = $maxLon;
        $whereSql = 'WHERE '.implode(' AND ',$where);
    }
    $sql = "SELECT cluster_id,country,cell_count,ROUND(total_loss_area_km2::numeric,2) AS total_loss_area_km2,ROUND(avg_loss_pct::numeric,4) AS avg_loss_pct,ROUND(max_loss_pct::numeric,4) AS max_loss_pct,dominant_year,hotspot_rank,ST_AsGeoJSON(cluster_geom)::json AS geometry,ST_AsGeoJSON(centroid)::json AS centroid_geojson FROM forest_loss_clusters $whereSql ORDER BY hotspot_rank ASC LIMIT :lim";
    try {
        $stmt = $pdo->prepare($sql); $stmt->bindValue(':lim', CLUSTER_LIMIT, PDO::PARAM_INT);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        $rows = $stmt->fetchAll();
        $features = array_map(fn($r) => ['type'=>'Feature','geometry'=>json_decode($r['geometry'],true),'properties'=>['cluster_id'=>$r['cluster_id'],'country'=>$r['country'],'cell_count'=>$r['cell_count'],'total_loss_area_km2'=>$r['total_loss_area_km2'],'avg_loss_pct'=>$r['avg_loss_pct'],'max_loss_pct'=>$r['max_loss_pct'],'dominant_year'=>$r['dominant_year'],'hotspot_rank'=>$r['hotspot_rank'],'centroid'=>json_decode($r['centroid_geojson'],true)]], $rows);
        echo json_encode(['success'=>true,'mode'=>'forest_loss_clusters','count'=>count($features),'type'=>'FeatureCollection','features'=>$features], JSON_UNESCAPED_UNICODE|JSON_NUMERIC_CHECK);
        exit;
    } catch (PDOException $e) { fail('forest_loss_clusters query failed: '.$e->getMessage(),500); }
}

// ════════════════════════════════════════════════════════════════════════════
// FOREST CLUSTERS — Health status + fire linkage (NEW in v3)
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'forest_clusters') {
    if (!tableExists($pdo, 'forest_loss_clusters')) {
        respond('forest_clusters', [], ['note' => 'forest_loss_clusters table not available']);
    }

    // Give this heavy endpoint more headroom than the global 60 s default.
    $pdo->exec("SET statement_timeout = '30000'"); // 30 s — plenty with indexes in place

    // Without a filter the three-way spatial join is too expensive.
    // Return base cluster fields only (no NDVI/fire enrichment) for the overview.
    if ($country === '' && $bbox === '') {
        $stmtBase = $pdo->prepare("
            SELECT cluster_id, country, cell_count,
                   ROUND(total_loss_area_km2::numeric,2) AS total_loss_area_km2,
                   ROUND(avg_loss_pct::numeric,4)        AS avg_loss_pct,
                   ROUND(max_loss_pct::numeric,4)        AS max_loss_pct,
                   dominant_year, hotspot_rank,
                   ST_AsGeoJSON(cluster_geom)::json      AS geometry,
                   ST_AsGeoJSON(centroid)::json          AS centroid_geojson
            FROM forest_loss_clusters
            WHERE cluster_geom IS NOT NULL
            ORDER BY hotspot_rank ASC
            LIMIT 50
        ");
        $stmtBase->execute();
        $baseRows = $stmtBase->fetchAll();
        $features = array_map(function($r) {
            return [
                'type'     => 'Feature',
                'geometry' => json_decode($r['geometry'], true),
                'properties' => [
                    'cluster_id'          => (int)$r['cluster_id'],
                    'country'             => $r['country'],
                    'hotspot_rank'        => (int)$r['hotspot_rank'],
                    'health_status'       => 'Unknown',
                    'avg_ndvi_anomaly'    => null,
                    'avg_risk_score'      => null,
                    'avg_ndvi'            => null,
                    'avg_ndvi_trend_3m'   => null,
                    'dominant_trend'      => null,
                    'dominant_risk_label' => null,
                    'grid_cell_count'     => 0,
                    'total_loss_area_km2' => (float)$r['total_loss_area_km2'],
                    'avg_loss_pct'        => (float)$r['avg_loss_pct'],
                    'dominant_year'       => $r['dominant_year'],
                    'fire_30d' => 0, 'fire_90d' => 0, 'fire_12m' => 0,
                    'avg_fire_brightness' => null, 'avg_fire_frp' => null,
                    'last_fire_detected'  => null,
                    'avg_fire_feedback_ratio' => null,
                    'causality_label'     => 'Unknown',
                    'causality_confidence'=> null,
                    'centroid'            => json_decode($r['centroid_geojson'], true),
                ],
            ];
        }, $baseRows);
        echo json_encode([
            'success'        => true,
            'mode'           => 'forest_clusters',
            'count'          => count($features),
            'health_summary' => ['Unknown' => count($features)],
            'note'           => 'Overview mode — select a country for enriched NDVI/fire data',
            'type'           => 'FeatureCollection',
            'features'       => $features,
        ], JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
        exit;
    }

    $clusterWhere  = ['cluster_geom IS NOT NULL'];
    $clusterParams = [];

    if ($country !== '') {
        $clusterWhere[]              = 'country ILIKE :country';
        $clusterParams[':country']   = '%' . $country . '%';
    }

    if ($bbox !== '') {
        $parts = explode(',', $bbox);
        if (count($parts) !== 4) fail('bbox must be: min_lon,min_lat,max_lon,max_lat');
        [$minLon,$minLat,$maxLon,$maxLat] = array_map('floatval', $parts);
        $clusterWhere[]      = 'ST_Intersects(cluster_geom, ST_MakeEnvelope(:bl,:bb,:br,:bt,4326))';
        $clusterParams[':bl'] = $minLon; $clusterParams[':bb'] = $minLat;
        $clusterParams[':br'] = $maxLon; $clusterParams[':bt'] = $maxLat;
    }

    $clusterWhereSql = 'WHERE ' . implode(' AND ', $clusterWhere);

    try {
        // ── Step 1: fetch matching cluster IDs + base columns only ──────────
        // Small, cheap query — no spatial joins yet.
        $stmtC = $pdo->prepare("
            SELECT cluster_id, country, cell_count,
                   ROUND(total_loss_area_km2::numeric, 2) AS total_loss_area_km2,
                   ROUND(avg_loss_pct::numeric, 4)        AS avg_loss_pct,
                   ROUND(max_loss_pct::numeric, 4)        AS max_loss_pct,
                   dominant_year, hotspot_rank,
                   ST_AsGeoJSON(cluster_geom)::json       AS geometry,
                   ST_AsGeoJSON(centroid)::json           AS centroid_geojson,
                   cluster_geom                           AS _geom   -- kept for sub-queries
            FROM forest_loss_clusters
            $clusterWhereSql
            ORDER BY hotspot_rank ASC
            LIMIT :lim
        ");
        $stmtC->bindValue(':lim', CLUSTER_LIMIT, PDO::PARAM_INT);
        foreach ($clusterParams as $k => $v) $stmtC->bindValue($k, $v);
        $stmtC->execute();
        $clusters = $stmtC->fetchAll();

        if (empty($clusters)) {
            respond('forest_clusters', [], ['health_summary' => [], 'type' => 'FeatureCollection', 'features' => []]);
        }

        $clusterIds = array_column($clusters, 'cluster_id');
        $idList     = implode(',', array_map('intval', $clusterIds));

        // ── Step 2: NDVI aggregates per cluster (index-assisted ST_Within) ──
        $ndviRows = $pdo->query("
            SELECT flc.cluster_id,
                   ROUND(AVG(dg.ndvi_anomaly)::numeric, 4)  AS avg_ndvi_anomaly,
                   ROUND(AVG(dg.risk_score)::numeric, 2)    AS avg_risk_score,
                   ROUND(AVG(dg.current_ndvi)::numeric, 4)  AS avg_ndvi,
                   ROUND(AVG(dg.ndvi_trend_3m)::numeric, 4) AS avg_ndvi_trend_3m,
                   COUNT(dg.id)                             AS grid_cell_count,
                   MODE() WITHIN GROUP (ORDER BY dg.trend_direction) AS dominant_trend,
                   MODE() WITHIN GROUP (ORDER BY dg.risk_label)      AS dominant_risk_label
            FROM forest_loss_clusters flc
            JOIN desertification_grid dg ON ST_Within(dg.geom, flc.cluster_geom)
            WHERE flc.cluster_id IN ($idList)
            GROUP BY flc.cluster_id
        ")->fetchAll(PDO::FETCH_UNIQUE);   // keyed by cluster_id

        // ── Step 3: Fire aggregates per cluster ──────────────────────────────
        $fireRows = $pdo->query("
            SELECT flc.cluster_id,
                   COUNT(CASE WHEN we.acq_time >= NOW() - INTERVAL '30 days'  THEN 1 END) AS fire_30d,
                   COUNT(CASE WHEN we.acq_time >= NOW() - INTERVAL '90 days'  THEN 1 END) AS fire_90d,
                   COUNT(CASE WHEN we.acq_time >= NOW() - INTERVAL '365 days' THEN 1 END) AS fire_12m,
                   ROUND(AVG(we.brightness)::numeric, 1) AS avg_fire_brightness,
                   ROUND(AVG(we.frp)::numeric, 2)        AS avg_fire_frp,
                   MAX(we.acq_time)                      AS last_fire_detected
            FROM forest_loss_clusters flc
            LEFT JOIN wildfire_events we ON ST_Within(we.geom, flc.cluster_geom)
            WHERE flc.cluster_id IN ($idList)
            GROUP BY flc.cluster_id
        ")->fetchAll(PDO::FETCH_UNIQUE);

        // ── Step 4: Causality aggregates per cluster ─────────────────────────
        // Uses fnc.geom (stored generated column + GiST index).
        // Falls back gracefully if the column hasn't been added yet.
        $causalityRows = [];
        try {
            $causalityRows = $pdo->query("
                SELECT flc.cluster_id,
                       ROUND(AVG(fnc.fire_feedback_ratio)::numeric, 4) AS avg_fire_feedback_ratio,
                       MODE() WITHIN GROUP (ORDER BY fnc.confidence_flag) AS causality_confidence
                FROM forest_loss_clusters flc
                LEFT JOIN fire_ndvi_causality fnc ON ST_Within(fnc.geom, flc.cluster_geom)
                WHERE flc.cluster_id IN ($idList)
                GROUP BY flc.cluster_id
            ")->fetchAll(PDO::FETCH_UNIQUE);
        } catch (PDOException $e) {
            // fnc.geom not yet created — causality fields will be null.
            // Run the migration SQL in fix_forest_clusters.sql to resolve.
        }

        // ── Step 5: Assemble GeoJSON features ────────────────────────────────
        $features = [];
        foreach ($clusters as $r) {
            $cid     = (int)$r['cluster_id'];
            $ndvi    = $ndviRows[$cid]    ?? [];
            $fire    = $fireRows[$cid]    ?? [];
            $causal  = $causalityRows[$cid] ?? [];

            $anomaly = isset($ndvi['avg_ndvi_anomaly']) ? (float)$ndvi['avg_ndvi_anomaly'] : null;
            $trend   = $ndvi['dominant_trend'] ?? null;
            $health  = classifyForestHealth($anomaly, $trend);

            $ratio          = isset($causal['avg_fire_feedback_ratio']) ? (float)$causal['avg_fire_feedback_ratio'] : null;
            $causalityLabel = 'Unknown';
            if ($ratio !== null) {
                if ($ratio > 1.5)     $causalityLabel = 'Fire as Symptom';
                elseif ($ratio > 0.8) $causalityLabel = 'Bidirectional';
                elseif ($ratio >= 0)  $causalityLabel = 'Fire as Driver';
            }

            $features[] = [
                'type'     => 'Feature',
                'geometry' => json_decode($r['geometry'], true),
                'properties' => [
                    'cluster_id'              => $cid,
                    'country'                 => $r['country'],
                    'hotspot_rank'            => (int)$r['hotspot_rank'],
                    'health_status'           => $health,
                    'avg_ndvi_anomaly'        => $anomaly,
                    'avg_risk_score'          => isset($ndvi['avg_risk_score'])    ? (float)$ndvi['avg_risk_score']    : null,
                    'avg_ndvi'                => isset($ndvi['avg_ndvi'])           ? (float)$ndvi['avg_ndvi']           : null,
                    'avg_ndvi_trend_3m'       => isset($ndvi['avg_ndvi_trend_3m']) ? (float)$ndvi['avg_ndvi_trend_3m'] : null,
                    'dominant_trend'          => $trend,
                    'dominant_risk_label'     => $ndvi['dominant_risk_label'] ?? null,
                    'grid_cell_count'         => (int)($ndvi['grid_cell_count'] ?? 0),
                    'total_loss_area_km2'     => (float)$r['total_loss_area_km2'],
                    'avg_loss_pct'            => (float)$r['avg_loss_pct'],
                    'dominant_year'           => $r['dominant_year'],
                    'fire_30d'                => (int)($fire['fire_30d'] ?? 0),
                    'fire_90d'                => (int)($fire['fire_90d'] ?? 0),
                    'fire_12m'                => (int)($fire['fire_12m'] ?? 0),
                    'avg_fire_brightness'     => isset($fire['avg_fire_brightness']) ? (float)$fire['avg_fire_brightness'] : null,
                    'avg_fire_frp'            => isset($fire['avg_fire_frp'])        ? (float)$fire['avg_fire_frp']        : null,
                    'last_fire_detected'      => $fire['last_fire_detected'] ?? null,
                    'avg_fire_feedback_ratio' => $ratio,
                    'causality_label'         => $causalityLabel,
                    'causality_confidence'    => $causal['causality_confidence'] ?? null,
                    'centroid'                => json_decode($r['centroid_geojson'], true),
                ],
            ];
        }

        $healthSummary = array_count_values(
            array_column(array_column($features, 'properties'), 'health_status')
        );

        echo json_encode([
            'success'        => true,
            'mode'           => 'forest_clusters',
            'count'          => count($features),
            'health_summary' => $healthSummary,
            'type'           => 'FeatureCollection',
            'features'       => $features,
        ], JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
        exit;

    } catch (PDOException $e) {
        fail('forest_clusters query failed: ' . $e->getMessage(), 500);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// AREA ANALYSIS
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'area_analysis') {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $polygon = $body['polygon'] ?? null;
    if (!$polygon) fail('polygon is required in POST body');

    // ── Normalise the incoming geometry ──────────────────────────────────────
    // Accept three shapes the client may send:
    //   1. A plain geometry object  { "type":"Polygon", "coordinates":[...] }
    //   2. A GeoJSON Feature        { "type":"Feature", "geometry":{...} }
    //   3. A FeatureCollection      { "type":"FeatureCollection", "features":[...] }
    // Also handle the legacy double-encode bug where polygon arrives as a JSON string.

    // If still a string after json_decode (double-encoded), decode once more.
    if (is_string($polygon)) {
        $decoded = json_decode($polygon, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $polygon = $decoded;
        }
        // else: leave as-is and let PostGIS report the error clearly
    }

    // Unwrap Feature / FeatureCollection → bare geometry
    if (is_array($polygon)) {
        $type = $polygon['type'] ?? '';
        if ($type === 'Feature') {
            $polygon = $polygon['geometry'] ?? null;
            if (!$polygon) fail('Feature has no geometry');
        } elseif ($type === 'FeatureCollection') {
            $first = $polygon['features'][0] ?? null;
            if (!$first) fail('FeatureCollection has no features');
            $polygon = $first['geometry'] ?? null;
            if (!$polygon) fail('First feature has no geometry');
        }
        // Now must be a geometry object
        $polygon = json_encode($polygon);
    }

    if (!$polygon || $polygon === 'null') fail('polygon is required in POST body');

    // Validate the geometry string is parseable and valid
    $geomTest = $pdo->prepare("SELECT ST_IsValid(ST_SetSRID(ST_GeomFromGeoJSON(:p),4326)) AS valid");
    try { $geomTest->execute([':p' => $polygon]); $v = $geomTest->fetchColumn(); if (!$v) fail('Polygon geometry is self-intersecting or otherwise invalid'); }
    catch (PDOException $e) { fail('Polygon parse error: ' . $e->getMessage()); }

    // ── Create temp geometry once — all queries below reuse it, zero re-parsing ──
    // NOTE: Do NOT use ON COMMIT DROP — PDO runs outside an explicit transaction,
    // so Postgres auto-commits the CREATE immediately and drops the table before
    // any subsequent query can reference it.
    // Also drop first in case a previous broken request left it behind in this
    // persistent connection-pool session.
    try {
        $pdo->exec("DROP TABLE IF EXISTS _area_poly");
        $pdo->prepare("
            CREATE TEMP TABLE _area_poly AS
            SELECT ST_SetSRID(ST_GeomFromGeoJSON(:p), 4326) AS geom
        ")->execute([':p' => $polygon]);
    } catch (PDOException $e) {
        fail('Failed to prepare analysis geometry: ' . $e->getMessage(), 500);
    }

    try {
        // Query 1: Grid stats
        $stmtGrid = $pdo->prepare("
            SELECT COUNT(*) AS cell_count,
                   MAX(country) FILTER (WHERE country IS NOT NULL) AS dominant_country,
                   ROUND(AVG(current_ndvi)::numeric, 4)    AS mean_ndvi,
                   ROUND(AVG(ndvi_anomaly)::numeric, 4)    AS ndvi_anomaly,
                   ROUND(AVG(ndvi_trend_3m)::numeric, 4)   AS ndvi_trend,
                   MODE() WITHIN GROUP (ORDER BY trend_direction) AS trend_direction,
                   ROUND(AVG(risk_score)::numeric, 2)      AS risk_score,
                   MODE() WITHIN GROUP (ORDER BY risk_label) AS risk_label,
                   ROUND(AVG(sample_months)::numeric, 0)   AS avg_sample_months
            FROM desertification_grid
            WHERE ST_Within(geom, (SELECT geom FROM _area_poly))
        ");
        $stmtGrid->execute();
        $grid = $stmtGrid->fetch() ?: [];

        // Query 2: Risk distribution
        $stmtRisk = $pdo->prepare("
            WITH total AS (
                SELECT COUNT(*) AS total_cells
                FROM desertification_grid
                WHERE ST_Within(geom, (SELECT geom FROM _area_poly))
            )
            SELECT risk_label,
                   COUNT(*) AS cell_count,
                   ROUND((COUNT(*)::float * 100 / NULLIF(total.total_cells, 0))::numeric, 1) AS pct
            FROM desertification_grid, total
            WHERE ST_Within(geom, (SELECT geom FROM _area_poly))
              AND risk_label IS NOT NULL
            GROUP BY risk_label, total.total_cells
            ORDER BY cell_count DESC
        ");
        $stmtRisk->execute();
        $riskDistribution = $stmtRisk->fetchAll();

        // Query 3: Land cover breakdown
        $stmtLc = $pdo->prepare("
            WITH total AS (
                SELECT COUNT(*) AS total_cells
                FROM desertification_grid
                WHERE ST_Within(geom, (SELECT geom FROM _area_poly))
            )
            SELECT land_cover AS type,
                   COUNT(*) AS count,
                   ROUND((COUNT(*)::float * 100 / NULLIF(total.total_cells, 0))::numeric, 1) AS percentage
            FROM desertification_grid, total
            WHERE ST_Within(geom, (SELECT geom FROM _area_poly))
              AND land_cover IS NOT NULL
            GROUP BY land_cover, total.total_cells
            ORDER BY count DESC
            LIMIT 10
        ");
        $stmtLc->execute();
        $landCoverBreakdown = $stmtLc->fetchAll();

        // Query 4: Fire activity
        $fire = ['fire_count_30d' => 0, 'fire_count_90d' => 0, 'fire_count_total' => 0, 'fire_count_period' => 0];
        if (tableExists($pdo, 'wildfire_events')) {
            $stmtFire = $pdo->prepare("
                SELECT
                    COUNT(*) FILTER (WHERE acq_time >= NOW() - INTERVAL '30 days')  AS fire_count_30d,
                    COUNT(*) FILTER (WHERE acq_time >= NOW() - INTERVAL '90 days')  AS fire_count_90d,
                    COUNT(*) FILTER (WHERE acq_time >= NOW() - INTERVAL '365 days') AS fire_count_total,
                    COUNT(*) FILTER (WHERE (:sd = '' OR acq_time >= :sd::date) AND (:ed = '' OR acq_time <= :ed::date)) AS fire_count_period
                FROM wildfire_events
                WHERE ST_Within(geom, (SELECT geom FROM _area_poly))
            ");
            $stmtFire->execute([':sd' => $startDate, ':ed' => $endDate]);
            $fire = $stmtFire->fetch() ?: $fire;
        }

        // Query 5: Forest loss
        $forestLoss = [];
        if (tableExists($pdo, 'forest_loss_clusters')) {
            $stmtForest = $pdo->prepare("
                SELECT COUNT(*) AS cluster_count,
                       SUM(total_loss_area_km2) AS total_loss_km2,
                       AVG(avg_loss_pct) AS avg_loss_pct,
                       MAX(dominant_year) AS latest_loss_year
                FROM forest_loss_clusters
                WHERE ST_Intersects(cluster_geom, (SELECT geom FROM _area_poly))
            ");
            $stmtForest->execute();
            $forestLoss = $stmtForest->fetch() ?: [];
        }

        // Query 6: Rainfall context
        $rainfallContext = null;
        if (tableExists($pdo, 'rainfall_monthly')) {
            try {
                $stmtCentroid = $pdo->prepare("
                    SELECT ST_X(ST_Centroid(geom)) AS lon,
                           ST_Y(ST_Centroid(geom)) AS lat
                    FROM _area_poly
                ");
                $stmtCentroid->execute();
                $centroid = $stmtCentroid->fetch();
                $cLon = (float)$centroid['lon']; $cLat = (float)$centroid['lat'];
                $stmtRain = $pdo->prepare("
                    SELECT r.acquisition_date, r.calendar_month,
                           ROUND((ST_Value(r.rast, ST_SetSRID(ST_Point(:lon, :lat), 4326)) / 10.0)::NUMERIC, 1) AS current_rainfall_mm
                    FROM rainfall_monthly r
                    WHERE ST_Intersects(r.rast, ST_SetSRID(ST_Point(:lon2, :lat2), 4326))
                    ORDER BY r.acquisition_date DESC LIMIT 1
                ");
                $stmtRain->execute([':lon' => $cLon, ':lat' => $cLat, ':lon2' => $cLon, ':lat2' => $cLat]);
                $currentRain = $stmtRain->fetch();
                if ($currentRain && $currentRain['current_rainfall_mm'] !== null) {
                    $calMonth = (int)$currentRain['calendar_month']; $currentMm = (float)$currentRain['current_rainfall_mm'];
                    $stmtBaseline = $pdo->prepare("
                        SELECT AVG(ST_Value(r.rast, ST_SetSRID(ST_Point(:lon, :lat), 4326)) / 10.0) AS baseline_rainfall_mm,
                               COUNT(*) AS sample_months
                        FROM rainfall_monthly r
                        WHERE r.calendar_month = :cal_month
                          AND ST_Intersects(r.rast, ST_SetSRID(ST_Point(:lon2, :lat2), 4326))
                    ");
                    $stmtBaseline->execute([':lon' => $cLon, ':lat' => $cLat, ':lon2' => $cLon, ':lat2' => $cLat, ':cal_month' => $calMonth]);
                    $baseline = $stmtBaseline->fetch(); $baselineMm = $baseline ? (float)$baseline['baseline_rainfall_mm'] : null;
                    $anomalyPct = ($baselineMm && $baselineMm > 0) ? round((($currentMm - $baselineMm) / $baselineMm) * 100, 1) : null;
                    $rainfallSignal = 'unknown';
                    if ($anomalyPct !== null) { if ($anomalyPct <= -30) $rainfallSignal = 'severe_drought'; elseif ($anomalyPct <= -15) $rainfallSignal = 'below_normal'; elseif ($anomalyPct >= 15) $rainfallSignal = 'above_normal'; else $rainfallSignal = 'normal'; }
                    $ndviAnomaly = (float)($grid['ndvi_anomaly'] ?? 0); $cause = 'unknown';
                    if ($anomalyPct !== null) { if ($anomalyPct <= -15 && $ndviAnomaly < -0.2) $cause = 'drought_driven'; elseif ($anomalyPct >= -5 && $ndviAnomaly < -0.3) $cause = 'structural_degradation'; elseif ($anomalyPct <= -15 && $ndviAnomaly >= -0.1) $cause = 'drought_resilient'; else $cause = 'within_normal_range'; }
                    $rainfallContext = ['current_rainfall_mm' => $currentMm, 'baseline_rainfall_mm' => $baselineMm ? round($baselineMm, 1) : null, 'anomaly_pct' => $anomalyPct, 'rainfall_signal' => $rainfallSignal, 'sample_months' => (int)($baseline['sample_months'] ?? 0), 'reference_date' => $currentRain['acquisition_date'], 'cause_interpretation' => $cause, 'centroid_lon' => round($cLon, 3), 'centroid_lat' => round($cLat, 3)];
                }
            } catch (PDOException $e) { $rainfallContext = ['error' => 'Rainfall data temporarily unavailable']; }
        }

        // Forest classification
        $meanNdvi = (float)($grid['mean_ndvi'] ?? 0); $trendDir = $grid['trend_direction'] ?? 'Unknown'; $forestPct = 0.0;
        foreach ($landCoverBreakdown as $lc) { if (stripos($lc['type'] ?? '', 'tree') !== false || stripos($lc['type'] ?? '', 'forest') !== false) $forestPct += (float)$lc['percentage']; }
        if ($meanNdvi > 0.65 && $forestPct > 50 && $trendDir !== 'Declining') $forestClassification = 'Stable Forest';
        elseif ($meanNdvi >= 0.40 && $meanNdvi <= 0.65 && $trendDir === 'Declining') $forestClassification = 'At Risk';
        elseif ($meanNdvi > 0.40 && $forestPct > 20) $forestClassification = 'Degraded Forest';
        else $forestClassification = 'Non-Forest';

        echo json_encode(['success' => true, 'mode' => 'area_analysis', 'generated_at' => gmdate("Y-m-d\TH:i:s\Z"), 'summary' => ['cell_count' => (int)$grid['cell_count'], 'dominant_country' => $grid['dominant_country'], 'mean_ndvi' => (float)$grid['mean_ndvi'], 'ndvi_anomaly' => (float)$grid['ndvi_anomaly'], 'ndvi_trend' => (float)$grid['ndvi_trend'], 'trend_direction' => $grid['trend_direction'], 'risk_score' => (float)$grid['risk_score'], 'risk_label' => $grid['risk_label'], 'forest_classification' => $forestClassification, 'forest_pct' => round($forestPct, 1), 'avg_sample_months' => (int)$grid['avg_sample_months']], 'risk_distribution' => $riskDistribution, 'land_cover_breakdown' => $landCoverBreakdown, 'fire_activity' => ['fire_count_last_30d' => (int)($fire['fire_count_30d'] ?? 0), 'fire_count_last_90d' => (int)($fire['fire_count_90d'] ?? 0), 'fire_count_last_12m' => (int)($fire['fire_count_total'] ?? 0), 'fire_count_period' => (int)($fire['fire_count_period'] ?? 0), 'period_start' => $startDate, 'period_end' => $endDate], 'forest_loss' => ['cluster_count' => (int)($forestLoss['cluster_count'] ?? 0), 'total_loss_km2' => (float)($forestLoss['total_loss_km2'] ?? 0), 'avg_loss_pct' => (float)($forestLoss['avg_loss_pct'] ?? 0), 'latest_loss_year' => $forestLoss['latest_loss_year'] ?? null], 'rainfall_context' => $rainfallContext], JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
        exit;
    } catch (PDOException $e) { fail('area_analysis failed: ' . $e->getMessage(), 500); }
}

// ════════════════════════════════════════════════════════════════════════════
// UNKNOWN MODE
// ════════════════════════════════════════════════════════════════════════════
fail("Unknown mode '{$mode}'. Valid: desertification_grid, country_stats, forest_loss_clusters, forest_clusters, area_analysis.");
