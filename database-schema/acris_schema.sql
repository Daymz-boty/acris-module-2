--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_raster; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_raster WITH SCHEMA public;


--
-- Name: EXTENSION postgis_raster; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_raster IS 'PostGIS raster types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    gid integer NOT NULL,
    featurecla character varying(15),
    scalerank smallint,
    labelrank smallint,
    sovereignt character varying(32),
    sov_a3 character varying(3),
    adm0_dif smallint,
    level smallint,
    type character varying(17),
    tlc character varying(1),
    admin character varying(35),
    adm0_a3 character varying(3),
    geou_dif smallint,
    geounit character varying(35),
    gu_a3 character varying(3),
    su_dif smallint,
    subunit character varying(35),
    su_a3 character varying(3),
    brk_diff smallint,
    name character varying(24),
    name_long character varying(35),
    brk_a3 character varying(3),
    brk_name character varying(32),
    brk_group character varying(1),
    abbrev character varying(10),
    postal character varying(4),
    formal_en character varying(52),
    formal_fr character varying(35),
    name_ciawf character varying(33),
    note_adm0 character varying(11),
    note_brk character varying(42),
    name_sort character varying(35),
    name_alt character varying(14),
    mapcolor7 smallint,
    mapcolor8 smallint,
    mapcolor9 smallint,
    mapcolor13 smallint,
    pop_est double precision,
    pop_rank smallint,
    pop_year smallint,
    gdp_md integer,
    gdp_year smallint,
    economy character varying(26),
    income_grp character varying(23),
    fips_10 character varying(3),
    iso_a2 character varying(5),
    iso_a2_eh character varying(3),
    iso_a3 character varying(3),
    iso_a3_eh character varying(3),
    iso_n3 character varying(3),
    iso_n3_eh character varying(3),
    un_a3 character varying(4),
    wb_a2 character varying(3),
    wb_a3 character varying(3),
    woe_id integer,
    woe_id_eh integer,
    woe_note character varying(167),
    adm0_iso character varying(3),
    adm0_diff character varying(1),
    adm0_tlc character varying(3),
    adm0_a3_us character varying(3),
    adm0_a3_fr character varying(3),
    adm0_a3_ru character varying(3),
    adm0_a3_es character varying(3),
    adm0_a3_cn character varying(3),
    adm0_a3_tw character varying(3),
    adm0_a3_in character varying(3),
    adm0_a3_np character varying(3),
    adm0_a3_pk character varying(3),
    adm0_a3_de character varying(3),
    adm0_a3_gb character varying(3),
    adm0_a3_br character varying(3),
    adm0_a3_il character varying(3),
    adm0_a3_ps character varying(3),
    adm0_a3_sa character varying(3),
    adm0_a3_eg character varying(3),
    adm0_a3_ma character varying(3),
    adm0_a3_pt character varying(3),
    adm0_a3_ar character varying(3),
    adm0_a3_jp character varying(3),
    adm0_a3_ko character varying(3),
    adm0_a3_vn character varying(3),
    adm0_a3_tr character varying(3),
    adm0_a3_id character varying(3),
    adm0_a3_pl character varying(3),
    adm0_a3_gr character varying(3),
    adm0_a3_it character varying(3),
    adm0_a3_nl character varying(3),
    adm0_a3_se character varying(3),
    adm0_a3_bd character varying(3),
    adm0_a3_ua character varying(3),
    adm0_a3_un smallint,
    adm0_a3_wb smallint,
    continent character varying(23),
    region_un character varying(10),
    subregion character varying(25),
    region_wb character varying(26),
    name_len smallint,
    long_len smallint,
    abbrev_len smallint,
    tiny smallint,
    homepart smallint,
    min_zoom double precision,
    min_label double precision,
    max_label double precision,
    label_x double precision,
    label_y double precision,
    ne_id double precision,
    wikidataid character varying(7),
    name_ar character varying(57),
    name_bn character varying(105),
    name_de character varying(40),
    name_en character varying(35),
    name_es character varying(41),
    name_fa character varying(62),
    name_fr character varying(44),
    name_el character varying(72),
    name_he character varying(68),
    name_hi character varying(97),
    name_hu character varying(40),
    name_id character varying(39),
    name_it character varying(36),
    name_ja character varying(36),
    name_ko character varying(33),
    name_nl character varying(29),
    name_pl character varying(47),
    name_pt character varying(39),
    name_ru character varying(86),
    name_sv character varying(28),
    name_tr character varying(41),
    name_uk character varying(82),
    name_ur character varying(66),
    name_vi character varying(56),
    name_zh character varying(33),
    name_zht character varying(33),
    fclass_iso character varying(24),
    tlc_diff character varying(1),
    fclass_tlc character varying(18),
    fclass_us character varying(30),
    fclass_fr character varying(15),
    fclass_ru character varying(14),
    fclass_es character varying(12),
    fclass_cn character varying(24),
    fclass_tw character varying(15),
    fclass_in character varying(14),
    fclass_np character varying(24),
    fclass_pk character varying(15),
    fclass_de character varying(15),
    fclass_gb character varying(15),
    fclass_br character varying(12),
    fclass_il character varying(15),
    fclass_ps character varying(15),
    fclass_sa character varying(15),
    fclass_eg character varying(24),
    fclass_ma character varying(24),
    fclass_pt character varying(15),
    fclass_ar character varying(12),
    fclass_jp character varying(15),
    fclass_ko character varying(15),
    fclass_vn character varying(12),
    fclass_tr character varying(15),
    fclass_id character varying(24),
    fclass_pl character varying(15),
    fclass_gr character varying(12),
    fclass_it character varying(15),
    fclass_nl character varying(15),
    fclass_se character varying(15),
    fclass_bd character varying(24),
    fclass_ua character varying(12),
    geom public.geometry(MultiPolygon,4326)
);


--
-- Name: countries_gid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_gid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_gid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_gid_seq OWNED BY public.countries.gid;


--
-- Name: desertification_country_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desertification_country_stats (
    id integer NOT NULL,
    country character varying(100) NOT NULL,
    avg_risk_score numeric(4,2),
    max_risk_score numeric(4,2),
    pct_high_risk numeric(6,2),
    pct_critical_risk numeric(6,2),
    dominant_risk_label character varying(20),
    avg_ndvi_anomaly numeric(8,4),
    min_ndvi_anomaly numeric(8,4),
    ndvi_trend character varying(20),
    pct_below_normal numeric(6,2),
    forest_loss_km2 numeric(12,2),
    forest_loss_pct_baseline numeric(6,2),
    latest_loss_year integer,
    avg_rainfall_anomaly_pct numeric(8,2),
    fire_feedback_ratio numeric(8,4),
    fire_count_pre integer,
    fire_count_post integer,
    dominant_land_cover character varying(60),
    sample_months integer DEFAULT 0,
    grid_cell_count integer,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE desertification_country_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.desertification_country_stats IS 'Country-level aggregation of all desertification metrics. API reads this table for leaderboard, Intel tab, and report_data mode. Refreshed monthly by ndvi_ingestion.py.';


--
-- Name: desertification_country_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.desertification_country_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: desertification_country_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.desertification_country_stats_id_seq OWNED BY public.desertification_country_stats.id;


--
-- Name: desertification_grid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desertification_grid (
    id integer NOT NULL,
    lon_bin numeric(6,1) NOT NULL,
    lat_bin numeric(6,1) NOT NULL,
    geom public.geometry(Point,4326),
    country character varying(100),
    current_ndvi numeric(8,4),
    current_ndvi_raw integer,
    ndvi_date date,
    baseline_ndvi numeric(8,4),
    baseline_stddev numeric(8,4),
    ndvi_anomaly numeric(8,4),
    anomaly_label character varying(30),
    ndvi_trend_3m numeric(8,4),
    ndvi_trend_12m numeric(8,4),
    trend_direction character varying(20),
    land_cover character varying(60),
    land_cover_code integer,
    lc_vulnerability numeric(4,2),
    current_rainfall_mm numeric(8,2),
    baseline_rainfall_mm numeric(8,2),
    rainfall_anomaly_pct numeric(8,2),
    latest_loss_pct numeric(6,4),
    loss_year integer,
    cumulative_loss_pct numeric(6,4),
    risk_score numeric(4,2),
    risk_label character varying(20),
    sample_months integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT desertification_grid_risk_score_check CHECK (((risk_score IS NULL) OR ((risk_score >= (1)::numeric) AND (risk_score <= (5)::numeric))))
);


--
-- Name: TABLE desertification_grid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.desertification_grid IS 'Precomputed desertification intelligence at 0.1° grid resolution. This is the primary table the API reads — no live raster computation. Refreshed monthly by ndvi_ingestion.py after each new NDVI composite is loaded. risk_score is a composite: NDVI anomaly (50%) + trend (30%) + land cover (20%).';


--
-- Name: desertification_grid_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.desertification_grid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: desertification_grid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.desertification_grid_id_seq OWNED BY public.desertification_grid.id;


--
-- Name: fire_baselines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fire_baselines (
    id integer NOT NULL,
    country character varying(100),
    week_of_year integer,
    year integer,
    daily_avg numeric,
    weekly_avg numeric,
    stddev numeric,
    sample_days integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: wildfire_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wildfire_events (
    id integer NOT NULL,
    brightness double precision NOT NULL,
    acq_time timestamp without time zone NOT NULL,
    satellite character varying(10) NOT NULL,
    geom public.geometry(Point,4326) NOT NULL,
    country text,
    iso_a3 text,
    frp double precision,
    confidence integer,
    event_time timestamp without time zone,
    latitude double precision,
    longitude double precision,
    land_cover character varying(40),
    land_cover_code integer
);


--
-- Name: fire_anomalies; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.fire_anomalies AS
 SELECT w.country,
    date(w.acq_time) AS fire_date,
    count(*) AS fire_count,
    b.daily_avg,
    b.stddev,
    b.sample_days,
        CASE
            WHEN ((b.sample_days < 30) OR (b.stddev = (0)::numeric)) THEN NULL::numeric
            ELSE (((count(*))::numeric - b.daily_avg) / b.stddev)
        END AS z_score
   FROM (public.wildfire_events w
     LEFT JOIN public.fire_baselines b ON (((w.country = (b.country)::text) AND (EXTRACT(week FROM w.acq_time) = (b.week_of_year)::numeric))))
  GROUP BY w.country, (date(w.acq_time)), b.daily_avg, b.stddev, b.sample_days;


--
-- Name: fire_baselines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fire_baselines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fire_baselines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fire_baselines_id_seq OWNED BY public.fire_baselines.id;


--
-- Name: fire_feedback_by_country; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fire_feedback_by_country (
    country character varying(100) NOT NULL,
    cells_analysed integer,
    cells_with_ratio integer,
    avg_fire_feedback_ratio numeric(10,4),
    max_fire_feedback_ratio numeric(10,4),
    avg_fire_rate_before numeric(10,4),
    avg_fire_rate_after numeric(10,4),
    confidence_flag character varying(20),
    computed_at timestamp without time zone DEFAULT now()
);


--
-- Name: fire_ndvi_causality; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fire_ndvi_causality (
    lon_bin numeric(6,1) NOT NULL,
    lat_bin numeric(6,1) NOT NULL,
    country character varying(100),
    ndvi_threshold_date date,
    ndvi_at_crossing numeric(8,4),
    baseline_ndvi numeric(8,4),
    baseline_stddev numeric(8,4),
    fire_count_before integer DEFAULT 0,
    fire_count_after integer DEFAULT 0,
    days_before integer,
    days_after integer,
    fire_rate_before numeric(10,4),
    fire_rate_after numeric(10,4),
    fire_feedback_ratio numeric(10,4),
    data_days_available integer,
    confidence_flag character varying(20)
);


--
-- Name: forest_cover_change; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forest_cover_change (
    id integer NOT NULL,
    lon_bin numeric(7,2) NOT NULL,
    lat_bin numeric(7,2) NOT NULL,
    geom public.geometry(Point,4326),
    loss_year integer NOT NULL,
    loss_pct numeric(6,4) NOT NULL,
    treecover_2000 numeric(5,2),
    country character varying(100),
    loaded_at timestamp without time zone DEFAULT now(),
    CONSTRAINT forest_cover_change_loss_pct_check CHECK (((loss_pct >= (0)::numeric) AND (loss_pct <= (1)::numeric)))
);


--
-- Name: TABLE forest_cover_change; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.forest_cover_change IS 'Annual Hansen GFC forest loss at ~1km resolution. loss_pct is the fraction of 30m pixels within each 1km cell that experienced loss — preserves intensity information. Source: UMD/hansen/global_forest_change_2024_v1_12.';


--
-- Name: forest_cover_change_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forest_cover_change_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forest_cover_change_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forest_cover_change_id_seq OWNED BY public.forest_cover_change.id;


--
-- Name: forest_loss_clusters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forest_loss_clusters (
    cluster_id integer NOT NULL,
    cluster_geom public.geometry(Geometry,4326),
    centroid public.geometry(Point,4326),
    cell_count integer,
    total_loss_area_km2 numeric(12,4),
    avg_loss_pct numeric(6,4),
    max_loss_pct numeric(6,4),
    dominant_year integer,
    country character varying(100),
    hotspot_rank integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: forest_loss_clusters_cluster_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forest_loss_clusters_cluster_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forest_loss_clusters_cluster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forest_loss_clusters_cluster_id_seq OWNED BY public.forest_loss_clusters.cluster_id;


--
-- Name: forest_rast_staging; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forest_rast_staging (
    rid integer NOT NULL,
    rast public.raster,
    layer_name character varying(60),
    loss_year integer,
    loaded_at timestamp without time zone DEFAULT now()
);


--
-- Name: forest_rast_staging_rid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forest_rast_staging_rid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forest_rast_staging_rid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forest_rast_staging_rid_seq OWNED BY public.forest_rast_staging.rid;


--
-- Name: land_cover_raster_tiled; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.land_cover_raster_tiled (
    rast public.raster
);


--
-- Name: land_cover_reference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.land_cover_reference (
    code integer NOT NULL,
    label character varying(50),
    category character varying(50),
    concern_level character varying(20)
);


--
-- Name: ndvi_baselines_grid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ndvi_baselines_grid (
    id integer NOT NULL,
    lon_bin numeric(6,1) NOT NULL,
    lat_bin numeric(6,1) NOT NULL,
    calendar_month integer NOT NULL,
    mean_ndvi numeric(8,4),
    stddev_ndvi numeric(8,4),
    min_ndvi numeric(8,4),
    max_ndvi numeric(8,4),
    sample_months integer DEFAULT 0,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE ndvi_baselines_grid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ndvi_baselines_grid IS 'Pre-computed NDVI baseline statistics at 0.1° grid resolution per calendar month. mean_ndvi and stddev_ndvi drive z-score anomaly detection. sample_months tracks statistical confidence — scores suppress below 7, show as indicative at 7–29, reliable at 30–89, high confidence at 90+.';


--
-- Name: ndvi_baselines_grid_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ndvi_baselines_grid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ndvi_baselines_grid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ndvi_baselines_grid_id_seq OWNED BY public.ndvi_baselines_grid.id;


--
-- Name: ndvi_grid_samples; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ndvi_grid_samples (
    lon_bin numeric(6,1) NOT NULL,
    lat_bin numeric(6,1) NOT NULL,
    acquisition_date date NOT NULL,
    calendar_month integer NOT NULL,
    year integer NOT NULL,
    raw_value integer,
    true_ndvi numeric(8,4)
);


--
-- Name: ndvi_monthly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ndvi_monthly (
    id integer,
    acquisition_date date,
    calendar_month integer,
    year integer,
    source character varying(40),
    loaded_at timestamp without time zone,
    rast public.raster
);


--
-- Name: ndvi_rast_temp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ndvi_rast_temp (
    rid integer NOT NULL,
    rast public.raster
);


--
-- Name: ndvi_rast_temp_rid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ndvi_rast_temp_rid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ndvi_rast_temp_rid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ndvi_rast_temp_rid_seq OWNED BY public.ndvi_rast_temp.rid;


--
-- Name: rainfall_monthly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rainfall_monthly (
    id integer NOT NULL,
    acquisition_date date NOT NULL,
    calendar_month integer NOT NULL,
    year integer NOT NULL,
    source character varying(40) DEFAULT 'GPM_IMERG_MONTHLY_V07'::character varying,
    rast public.raster,
    loaded_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE rainfall_monthly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rainfall_monthly IS 'Monthly GPM IMERG precipitation rasters for Africa. Values stored as Int16 × 10. Divide by 10 for mm. Used to explain NDVI anomalies — low rainfall correlates with vegetation decline.';


--
-- Name: rainfall_monthly_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rainfall_monthly_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rainfall_monthly_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rainfall_monthly_id_seq OWNED BY public.rainfall_monthly.id;


--
-- Name: rainfall_rast_temp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rainfall_rast_temp (
    rid integer NOT NULL,
    rast public.raster
);


--
-- Name: rainfall_rast_temp_rid_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rainfall_rast_temp_rid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rainfall_rast_temp_rid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rainfall_rast_temp_rid_seq OWNED BY public.rainfall_rast_temp.rid;


--
-- Name: risk_weights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.risk_weights (
    id integer DEFAULT 1 NOT NULL,
    ndvi_anomaly_weight numeric(4,2) DEFAULT 0.50,
    ndvi_trend_weight numeric(4,2) DEFAULT 0.30,
    land_cover_weight numeric(4,2) DEFAULT 0.20,
    updated_at timestamp without time zone DEFAULT now(),
    notes text DEFAULT 'Weights must sum to 1.0. Update db_config.php constants to match.'::text,
    CONSTRAINT single_row CHECK ((id = 1)),
    CONSTRAINT weights_sum_to_one CHECK ((abs((((ndvi_anomaly_weight + ndvi_trend_weight) + land_cover_weight) - 1.0)) < 0.001))
);


--
-- Name: TABLE risk_weights; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.risk_weights IS 'Single-row config table for desertification risk composite weights. Keep in sync with RISK_WEIGHT_* constants in db_config.php.';


--
-- Name: vegetation_anomaly; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.vegetation_anomaly AS
 SELECT lon_bin,
    lat_bin,
    geom,
    country,
    current_ndvi,
    ndvi_date,
    baseline_ndvi,
    baseline_stddev,
    ndvi_anomaly,
    anomaly_label,
    ndvi_trend_3m,
    trend_direction,
    land_cover,
    risk_score,
    risk_label,
    sample_months,
        CASE
            WHEN (sample_months < 7) THEN 'insufficient'::text
            WHEN (sample_months < 30) THEN 'low'::text
            WHEN (sample_months < 90) THEN 'moderate'::text
            ELSE 'high'::text
        END AS data_confidence,
        CASE
            WHEN (sample_months < 7) THEN NULL::numeric
            ELSE ndvi_anomaly
        END AS display_anomaly,
    updated_at
   FROM public.desertification_grid g
  WHERE (current_ndvi IS NOT NULL)
  WITH NO DATA;


--
-- Name: MATERIALIZED VIEW vegetation_anomaly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON MATERIALIZED VIEW public.vegetation_anomaly IS 'Current NDVI anomaly z-scores with confidence labels. Refreshed monthly via: REFRESH MATERIALIZED VIEW CONCURRENTLY vegetation_anomaly. display_anomaly is NULL when sample_months < 7 to prevent misleading scores.';


--
-- Name: wildfire_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wildfire_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wildfire_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wildfire_events_id_seq OWNED BY public.wildfire_events.id;


--
-- Name: worldcover_africa_1km; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worldcover_africa_1km (
    rast public.raster
);


--
-- Name: countries gid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN gid SET DEFAULT nextval('public.countries_gid_seq'::regclass);


--
-- Name: desertification_country_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desertification_country_stats ALTER COLUMN id SET DEFAULT nextval('public.desertification_country_stats_id_seq'::regclass);


--
-- Name: desertification_grid id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desertification_grid ALTER COLUMN id SET DEFAULT nextval('public.desertification_grid_id_seq'::regclass);


--
-- Name: fire_baselines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_baselines ALTER COLUMN id SET DEFAULT nextval('public.fire_baselines_id_seq'::regclass);


--
-- Name: forest_cover_change id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_cover_change ALTER COLUMN id SET DEFAULT nextval('public.forest_cover_change_id_seq'::regclass);


--
-- Name: forest_loss_clusters cluster_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_loss_clusters ALTER COLUMN cluster_id SET DEFAULT nextval('public.forest_loss_clusters_cluster_id_seq'::regclass);


--
-- Name: forest_rast_staging rid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_rast_staging ALTER COLUMN rid SET DEFAULT nextval('public.forest_rast_staging_rid_seq'::regclass);


--
-- Name: ndvi_baselines_grid id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ndvi_baselines_grid ALTER COLUMN id SET DEFAULT nextval('public.ndvi_baselines_grid_id_seq'::regclass);


--
-- Name: ndvi_rast_temp rid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ndvi_rast_temp ALTER COLUMN rid SET DEFAULT nextval('public.ndvi_rast_temp_rid_seq'::regclass);


--
-- Name: rainfall_monthly id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rainfall_monthly ALTER COLUMN id SET DEFAULT nextval('public.rainfall_monthly_id_seq'::regclass);


--
-- Name: rainfall_rast_temp rid; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rainfall_rast_temp ALTER COLUMN rid SET DEFAULT nextval('public.rainfall_rast_temp_rid_seq'::regclass);


--
-- Name: wildfire_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wildfire_events ALTER COLUMN id SET DEFAULT nextval('public.wildfire_events_id_seq'::regclass);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (gid);


--
-- Name: desertification_country_stats desertification_country_stats_country_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desertification_country_stats
    ADD CONSTRAINT desertification_country_stats_country_key UNIQUE (country);


--
-- Name: desertification_country_stats desertification_country_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desertification_country_stats
    ADD CONSTRAINT desertification_country_stats_pkey PRIMARY KEY (id);


--
-- Name: desertification_grid desertification_grid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desertification_grid
    ADD CONSTRAINT desertification_grid_pkey PRIMARY KEY (id);


--
-- Name: fire_baselines fire_baselines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_baselines
    ADD CONSTRAINT fire_baselines_pkey PRIMARY KEY (id);


--
-- Name: fire_feedback_by_country fire_feedback_by_country_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_feedback_by_country
    ADD CONSTRAINT fire_feedback_by_country_pkey PRIMARY KEY (country);


--
-- Name: fire_ndvi_causality fire_ndvi_causality_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_ndvi_causality
    ADD CONSTRAINT fire_ndvi_causality_pkey PRIMARY KEY (lon_bin, lat_bin);


--
-- Name: forest_cover_change forest_cover_change_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_cover_change
    ADD CONSTRAINT forest_cover_change_pkey PRIMARY KEY (id);


--
-- Name: forest_loss_clusters forest_loss_clusters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_loss_clusters
    ADD CONSTRAINT forest_loss_clusters_pkey PRIMARY KEY (cluster_id);


--
-- Name: forest_rast_staging forest_rast_staging_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_rast_staging
    ADD CONSTRAINT forest_rast_staging_pkey PRIMARY KEY (rid);


--
-- Name: land_cover_reference land_cover_reference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.land_cover_reference
    ADD CONSTRAINT land_cover_reference_pkey PRIMARY KEY (code);


--
-- Name: ndvi_baselines_grid ndvi_baselines_grid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ndvi_baselines_grid
    ADD CONSTRAINT ndvi_baselines_grid_pkey PRIMARY KEY (id);


--
-- Name: ndvi_grid_samples ndvi_grid_samples_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ndvi_grid_samples
    ADD CONSTRAINT ndvi_grid_samples_pkey PRIMARY KEY (lon_bin, lat_bin, acquisition_date);


--
-- Name: ndvi_rast_temp ndvi_rast_temp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ndvi_rast_temp
    ADD CONSTRAINT ndvi_rast_temp_pkey PRIMARY KEY (rid);


--
-- Name: rainfall_monthly rainfall_monthly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rainfall_monthly
    ADD CONSTRAINT rainfall_monthly_pkey PRIMARY KEY (id);


--
-- Name: rainfall_rast_temp rainfall_rast_temp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rainfall_rast_temp
    ADD CONSTRAINT rainfall_rast_temp_pkey PRIMARY KEY (rid);


--
-- Name: risk_weights risk_weights_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.risk_weights
    ADD CONSTRAINT risk_weights_pkey PRIMARY KEY (id);


--
-- Name: desertification_grid uq_desgrid_cell; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desertification_grid
    ADD CONSTRAINT uq_desgrid_cell UNIQUE (lon_bin, lat_bin);


--
-- Name: forest_cover_change uq_forest_cell_year; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forest_cover_change
    ADD CONSTRAINT uq_forest_cell_year UNIQUE (lon_bin, lat_bin, loss_year);


--
-- Name: ndvi_baselines_grid uq_ndvi_baseline; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ndvi_baselines_grid
    ADD CONSTRAINT uq_ndvi_baseline UNIQUE (lon_bin, lat_bin, calendar_month);


--
-- Name: rainfall_monthly uq_rainfall_month; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rainfall_monthly
    ADD CONSTRAINT uq_rainfall_month UNIQUE (acquisition_date);


--
-- Name: wildfire_events wildfire_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wildfire_events
    ADD CONSTRAINT wildfire_events_pkey PRIMARY KEY (id);


--
-- Name: wildfire_events wildfire_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wildfire_events
    ADD CONSTRAINT wildfire_unique UNIQUE (latitude, longitude, acq_time, satellite);


--
-- Name: countries_geom_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX countries_geom_idx ON public.countries USING gist (geom);


--
-- Name: idx_desc_anomaly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desc_anomaly ON public.desertification_country_stats USING btree (avg_ndvi_anomaly);


--
-- Name: idx_desc_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desc_country ON public.desertification_country_stats USING btree (country);


--
-- Name: idx_desc_forest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desc_forest ON public.desertification_country_stats USING btree (forest_loss_km2 DESC NULLS LAST);


--
-- Name: idx_desc_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desc_risk ON public.desertification_country_stats USING btree (avg_risk_score DESC NULLS LAST);


--
-- Name: idx_desgrid_anomaly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desgrid_anomaly ON public.desertification_grid USING btree (ndvi_anomaly);


--
-- Name: idx_desgrid_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desgrid_country ON public.desertification_grid USING btree (country);


--
-- Name: idx_desgrid_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desgrid_geom ON public.desertification_grid USING gist (geom);


--
-- Name: idx_desgrid_high_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desgrid_high_risk ON public.desertification_grid USING btree (country, risk_score) WHERE (risk_score >= 3.4);


--
-- Name: idx_desgrid_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desgrid_risk ON public.desertification_grid USING btree (risk_score DESC NULLS LAST);


--
-- Name: idx_desgrid_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desgrid_updated ON public.desertification_grid USING btree (updated_at DESC);


--
-- Name: idx_fb_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_country ON public.fire_baselines USING btree (country);


--
-- Name: idx_fb_country_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fb_country_week ON public.fire_baselines USING btree (country, week_of_year);


--
-- Name: idx_fire_ndvi_causality_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fire_ndvi_causality_country ON public.fire_ndvi_causality USING btree (country);


--
-- Name: idx_fire_ndvi_causality_flag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fire_ndvi_causality_flag ON public.fire_ndvi_causality USING btree (confidence_flag);


--
-- Name: idx_fire_ndvi_causality_ratio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fire_ndvi_causality_ratio ON public.fire_ndvi_causality USING btree (fire_feedback_ratio) WHERE (fire_feedback_ratio IS NOT NULL);


--
-- Name: idx_forest_change_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_change_country ON public.forest_cover_change USING btree (country);


--
-- Name: idx_forest_change_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_change_geom ON public.forest_cover_change USING gist (geom);


--
-- Name: idx_forest_change_significant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_change_significant ON public.forest_cover_change USING btree (loss_year, country, loss_pct) WHERE (loss_pct > 0.05);


--
-- Name: idx_forest_change_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_change_year ON public.forest_cover_change USING btree (loss_year);


--
-- Name: idx_forest_loss_clusters_centroid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_loss_clusters_centroid ON public.forest_loss_clusters USING gist (centroid);


--
-- Name: idx_forest_loss_clusters_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_loss_clusters_country ON public.forest_loss_clusters USING btree (country);


--
-- Name: idx_forest_loss_clusters_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forest_loss_clusters_geom ON public.forest_loss_clusters USING gist (cluster_geom);


--
-- Name: idx_lcr_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lcr_code ON public.land_cover_reference USING btree (code);


--
-- Name: idx_ndvi_baseline_grid_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ndvi_baseline_grid_month ON public.ndvi_baselines_grid USING btree (lon_bin, lat_bin, calendar_month);


--
-- Name: idx_ndvi_baseline_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ndvi_baseline_month ON public.ndvi_baselines_grid USING btree (calendar_month);


--
-- Name: idx_ndvi_baseline_samples; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ndvi_baseline_samples ON public.ndvi_baselines_grid USING btree (sample_months);


--
-- Name: idx_rainfall_monthly_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rainfall_monthly_date ON public.rainfall_monthly USING btree (acquisition_date);


--
-- Name: idx_rainfall_monthly_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rainfall_monthly_month ON public.rainfall_monthly USING btree (calendar_month);


--
-- Name: idx_rainfall_monthly_rast; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rainfall_monthly_rast ON public.rainfall_monthly USING gist (public.st_convexhull(rast));


--
-- Name: idx_veg_anomaly_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_veg_anomaly_country ON public.vegetation_anomaly USING btree (country);


--
-- Name: idx_veg_anomaly_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_veg_anomaly_geom ON public.vegetation_anomaly USING gist (geom);


--
-- Name: idx_veg_anomaly_risk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_veg_anomaly_risk ON public.vegetation_anomaly USING btree (risk_score DESC NULLS LAST);


--
-- Name: idx_we_acq_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_acq_time ON public.wildfire_events USING btree (acq_time);


--
-- Name: idx_we_brightness; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_brightness ON public.wildfire_events USING btree (brightness DESC);


--
-- Name: idx_we_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_country ON public.wildfire_events USING btree (country);


--
-- Name: idx_we_country_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_country_time ON public.wildfire_events USING btree (country, acq_time);


--
-- Name: idx_we_geom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_geom ON public.wildfire_events USING gist (geom);


--
-- Name: idx_we_high_concern; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_high_concern ON public.wildfire_events USING btree (acq_time, country, brightness) WHERE ((land_cover)::text = ANY ((ARRAY['Tree Cover'::character varying, 'Built-up'::character varying])::text[]));


--
-- Name: idx_we_land_cover; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_land_cover ON public.wildfire_events USING btree (land_cover);


--
-- Name: idx_we_land_cover_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_land_cover_code ON public.wildfire_events USING btree (land_cover_code);


--
-- Name: idx_we_lc_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_lc_time ON public.wildfire_events USING btree (land_cover, acq_time);


--
-- Name: idx_we_time_brightness; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_we_time_brightness ON public.wildfire_events USING btree (acq_time, brightness DESC);


--
-- Name: idx_worldcover_rast; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_worldcover_rast ON public.worldcover_africa_1km USING gist (public.st_convexhull(rast));


--
-- Name: land_cover_raster_tiled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX land_cover_raster_tiled_idx ON public.land_cover_raster_tiled USING gist (public.st_convexhull(rast));


--
-- Name: uq_fire_baselines_country_week_year; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fire_baselines_country_week_year ON public.fire_baselines USING btree (country, week_of_year, year);


--
-- Name: wildfire_geom_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wildfire_geom_idx ON public.wildfire_events USING gist (geom);


--
-- PostgreSQL database dump complete
--

