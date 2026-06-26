--
-- PostgreSQL database dump
--

\restrict q64QxEcDx4O5E2DwfSrtVrKAh7C3Yg0umwDYrbegdcIylJfqeCOBvex8TbEP1ei

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

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
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.device_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    platform character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_seen timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    CONSTRAINT device_tokens_platform_check CHECK (((platform)::text = ANY ((ARRAY['web'::character varying, 'ios'::character varying, 'android'::character varying])::text[])))
);


ALTER TABLE public.device_tokens OWNER TO postgres;

--
-- Name: device_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.device_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_tokens_id_seq OWNER TO postgres;

--
-- Name: device_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.device_tokens_id_seq OWNED BY public.device_tokens.id;


--
-- Name: emoji_packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emoji_packs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    emojis text[] NOT NULL,
    is_default boolean DEFAULT false NOT NULL
);


ALTER TABLE public.emoji_packs OWNER TO postgres;

--
-- Name: emoji_packs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emoji_packs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emoji_packs_id_seq OWNER TO postgres;

--
-- Name: emoji_packs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emoji_packs_id_seq OWNED BY public.emoji_packs.id;


--
-- Name: goal_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goal_milestones (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    label character varying(250) NOT NULL,
    is_done boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.goal_milestones OWNER TO postgres;

--
-- Name: goal_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goal_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goal_milestones_id_seq OWNER TO postgres;

--
-- Name: goal_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goal_milestones_id_seq OWNED BY public.goal_milestones.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(250) NOT NULL,
    category character varying(100) NOT NULL,
    color character varying(20) DEFAULT '#534AB7'::character varying NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    due_date character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT goals_progress_check CHECK (((progress >= 0) AND (progress <= 100)))
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals_id_seq OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: habit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habit_logs (
    id integer NOT NULL,
    habit_id integer NOT NULL,
    completed_at date DEFAULT CURRENT_DATE NOT NULL
);


ALTER TABLE public.habit_logs OWNER TO postgres;

--
-- Name: habit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.habit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habit_logs_id_seq OWNER TO postgres;

--
-- Name: habit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.habit_logs_id_seq OWNED BY public.habit_logs.id;


--
-- Name: habits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habits (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(150) NOT NULL,
    icon character varying(10) DEFAULT '🏃'::character varying NOT NULL,
    color character varying(20) DEFAULT '#1D9E75'::character varying NOT NULL,
    streak integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    total_days integer DEFAULT 0,
    category character varying(50)
);


ALTER TABLE public.habits OWNER TO postgres;

--
-- Name: habits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.habits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habits_id_seq OWNER TO postgres;

--
-- Name: habits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.habits_id_seq OWNED BY public.habits.id;


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journal_entries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    mood_log_id integer,
    content text DEFAULT ''::text NOT NULL,
    prompt_used text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title character varying(250)
);


ALTER TABLE public.journal_entries OWNER TO postgres;

--
-- Name: journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.journal_entries_id_seq OWNER TO postgres;

--
-- Name: journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.journal_entries_id_seq OWNED BY public.journal_entries.id;


--
-- Name: meal_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meal_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    meal_name character varying(255) NOT NULL,
    meal_type character varying(50) NOT NULL,
    calories integer DEFAULT 0 NOT NULL,
    protein integer DEFAULT 0 NOT NULL,
    carbs integer DEFAULT 0 NOT NULL,
    fats integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meal_logs OWNER TO postgres;

--
-- Name: meal_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meal_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meal_logs_id_seq OWNER TO postgres;

--
-- Name: meal_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meal_logs_id_seq OWNED BY public.meal_logs.id;


--
-- Name: mood_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mood_levels (
    id integer NOT NULL,
    user_id integer NOT NULL,
    level integer NOT NULL,
    label character varying(50) DEFAULT ''::character varying NOT NULL,
    emoji text DEFAULT ''::text NOT NULL,
    color character varying(20) DEFAULT '#94a3b8'::character varying NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT mood_levels_level_check CHECK (((level >= 1) AND (level <= 5)))
);


ALTER TABLE public.mood_levels OWNER TO postgres;

--
-- Name: mood_levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mood_levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mood_levels_id_seq OWNER TO postgres;

--
-- Name: mood_levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mood_levels_id_seq OWNED BY public.mood_levels.id;


--
-- Name: mood_log_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mood_log_tags (
    id integer NOT NULL,
    mood_log_id integer NOT NULL,
    tag_id integer,
    user_tag_id integer,
    CONSTRAINT mood_log_tags_check CHECK ((((tag_id IS NOT NULL) AND (user_tag_id IS NULL)) OR ((tag_id IS NULL) AND (user_tag_id IS NOT NULL))))
);


ALTER TABLE public.mood_log_tags OWNER TO postgres;

--
-- Name: mood_log_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mood_log_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mood_log_tags_id_seq OWNER TO postgres;

--
-- Name: mood_log_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mood_log_tags_id_seq OWNED BY public.mood_log_tags.id;


--
-- Name: mood_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mood_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    mood_level integer NOT NULL,
    stress_level integer NOT NULL,
    logged_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    note character varying(500),
    CONSTRAINT mood_logs_mood_level_check CHECK (((mood_level >= 1) AND (mood_level <= 5))),
    CONSTRAINT mood_logs_stress_level_check CHECK (((stress_level >= 1) AND (stress_level <= 10)))
);


ALTER TABLE public.mood_logs OWNER TO postgres;

--
-- Name: mood_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mood_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mood_logs_id_seq OWNER TO postgres;

--
-- Name: mood_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mood_logs_id_seq OWNED BY public.mood_logs.id;


--
-- Name: notification_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_log (
    id integer NOT NULL,
    user_id integer,
    token_id integer,
    type character varying(50),
    title text,
    body text,
    sent_at timestamp with time zone DEFAULT now(),
    status character varying(20),
    read_at timestamp with time zone,
    ref_id text,
    ref_date date
);


ALTER TABLE public.notification_log OWNER TO postgres;

--
-- Name: notification_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_log_id_seq OWNER TO postgres;

--
-- Name: notification_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_log_id_seq OWNED BY public.notification_log.id;


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_preferences (
    user_id integer NOT NULL,
    task_reminders boolean DEFAULT true,
    habit_checkins boolean DEFAULT true,
    lead_time_mins integer DEFAULT 15,
    quiet_start time without time zone DEFAULT '22:00:00'::time without time zone,
    quiet_end time without time zone DEFAULT '08:00:00'::time without time zone,
    overdue_tasks boolean DEFAULT true,
    goal_deadlines boolean DEFAULT true,
    streak_risk boolean DEFAULT true,
    streak_milestone boolean DEFAULT true,
    journal_nudge boolean DEFAULT true
);


ALTER TABLE public.notification_preferences OWNER TO postgres;

--
-- Name: saved_meals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_meals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    meal_name character varying(255) NOT NULL,
    meal_type character varying(50) NOT NULL,
    calories integer DEFAULT 0 NOT NULL,
    protein integer DEFAULT 0 NOT NULL,
    carbs integer DEFAULT 0 NOT NULL,
    fats integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.saved_meals OWNER TO postgres;

--
-- Name: saved_meals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_meals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_meals_id_seq OWNER TO postgres;

--
-- Name: saved_meals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_meals_id_seq OWNED BY public.saved_meals.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: supplements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplements (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    dose text,
    timing text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT supplements_timing_check CHECK ((timing = ANY (ARRAY['AM'::text, 'PM'::text, 'Both'::text])))
);


ALTER TABLE public.supplements OWNER TO postgres;

--
-- Name: supplements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplements_id_seq OWNER TO postgres;

--
-- Name: supplements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplements_id_seq OWNED BY public.supplements.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    is_completed boolean DEFAULT false,
    due_date timestamp with time zone,
    priority text DEFAULT 'none'::text NOT NULL,
    user_id integer NOT NULL,
    reminded boolean DEFAULT false,
    reminder_sent boolean DEFAULT false NOT NULL,
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['critical'::text, 'high'::text, 'low'::text, 'none'::text])))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_prompt_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_prompt_config (
    id integer NOT NULL,
    user_id integer NOT NULL,
    active_pack character varying(100) DEFAULT 'general'::character varying NOT NULL,
    pack_progress_index integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_prompt_config OWNER TO postgres;

--
-- Name: user_prompt_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_prompt_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_prompt_config_id_seq OWNER TO postgres;

--
-- Name: user_prompt_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_prompt_config_id_seq OWNED BY public.user_prompt_config.id;


--
-- Name: user_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_tags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.user_tags OWNER TO postgres;

--
-- Name: user_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_tags_id_seq OWNER TO postgres;

--
-- Name: user_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_tags_id_seq OWNED BY public.user_tags.id;


--
-- Name: user_xp; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_xp (
    user_id integer NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    awarded_quest_ids text[] DEFAULT '{}'::text[] NOT NULL
);


ALTER TABLE public.user_xp OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    weight_kg numeric,
    height_cm numeric,
    fitness_goals character varying(50) DEFAULT 'maintain'::character varying,
    fitness_goal character varying(50) DEFAULT 'maintain'::character varying,
    reminder_hours integer DEFAULT 1 NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: device_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens ALTER COLUMN id SET DEFAULT nextval('public.device_tokens_id_seq'::regclass);


--
-- Name: emoji_packs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emoji_packs ALTER COLUMN id SET DEFAULT nextval('public.emoji_packs_id_seq'::regclass);


--
-- Name: goal_milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_milestones ALTER COLUMN id SET DEFAULT nextval('public.goal_milestones_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: habit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habit_logs ALTER COLUMN id SET DEFAULT nextval('public.habit_logs_id_seq'::regclass);


--
-- Name: habits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits ALTER COLUMN id SET DEFAULT nextval('public.habits_id_seq'::regclass);


--
-- Name: journal_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries ALTER COLUMN id SET DEFAULT nextval('public.journal_entries_id_seq'::regclass);


--
-- Name: meal_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_logs ALTER COLUMN id SET DEFAULT nextval('public.meal_logs_id_seq'::regclass);


--
-- Name: mood_levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_levels ALTER COLUMN id SET DEFAULT nextval('public.mood_levels_id_seq'::regclass);


--
-- Name: mood_log_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_log_tags ALTER COLUMN id SET DEFAULT nextval('public.mood_log_tags_id_seq'::regclass);


--
-- Name: mood_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_logs ALTER COLUMN id SET DEFAULT nextval('public.mood_logs_id_seq'::regclass);


--
-- Name: notification_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log ALTER COLUMN id SET DEFAULT nextval('public.notification_log_id_seq'::regclass);


--
-- Name: saved_meals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_meals ALTER COLUMN id SET DEFAULT nextval('public.saved_meals_id_seq'::regclass);


--
-- Name: supplements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplements ALTER COLUMN id SET DEFAULT nextval('public.supplements_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: user_prompt_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_prompt_config ALTER COLUMN id SET DEFAULT nextval('public.user_prompt_config_id_seq'::regclass);


--
-- Name: user_tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tags ALTER COLUMN id SET DEFAULT nextval('public.user_tags_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (id);


--
-- Name: device_tokens device_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_token_key UNIQUE (token);


--
-- Name: emoji_packs emoji_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emoji_packs
    ADD CONSTRAINT emoji_packs_pkey PRIMARY KEY (id);


--
-- Name: goal_milestones goal_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_milestones
    ADD CONSTRAINT goal_milestones_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: habit_logs habit_logs_habit_id_completed_at_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habit_logs
    ADD CONSTRAINT habit_logs_habit_id_completed_at_key UNIQUE (habit_id, completed_at);


--
-- Name: habit_logs habit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habit_logs
    ADD CONSTRAINT habit_logs_pkey PRIMARY KEY (id);


--
-- Name: habits habits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: meal_logs meal_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_logs
    ADD CONSTRAINT meal_logs_pkey PRIMARY KEY (id);


--
-- Name: mood_levels mood_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_levels
    ADD CONSTRAINT mood_levels_pkey PRIMARY KEY (id);


--
-- Name: mood_levels mood_levels_user_id_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_levels
    ADD CONSTRAINT mood_levels_user_id_level_key UNIQUE (user_id, level);


--
-- Name: mood_levels mood_levels_user_level_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_levels
    ADD CONSTRAINT mood_levels_user_level_unique UNIQUE (user_id, level);


--
-- Name: mood_log_tags mood_log_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_log_tags
    ADD CONSTRAINT mood_log_tags_pkey PRIMARY KEY (id);


--
-- Name: mood_logs mood_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_logs
    ADD CONSTRAINT mood_logs_pkey PRIMARY KEY (id);


--
-- Name: notification_log notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (user_id);


--
-- Name: saved_meals saved_meals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_meals
    ADD CONSTRAINT saved_meals_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: supplements supplements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplements
    ADD CONSTRAINT supplements_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_prompt_config user_prompt_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_prompt_config
    ADD CONSTRAINT user_prompt_config_pkey PRIMARY KEY (id);


--
-- Name: user_prompt_config user_prompt_config_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_prompt_config
    ADD CONSTRAINT user_prompt_config_user_id_key UNIQUE (user_id);


--
-- Name: user_tags user_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tags
    ADD CONSTRAINT user_tags_pkey PRIMARY KEY (id);


--
-- Name: user_tags user_tags_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tags
    ADD CONSTRAINT user_tags_user_id_name_key UNIQUE (user_id, name);


--
-- Name: user_xp user_xp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_xp
    ADD CONSTRAINT user_xp_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_goals_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_user_id ON public.goals USING btree (user_id);


--
-- Name: idx_habit_logs_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_habit_logs_date ON public.habit_logs USING btree (completed_at);


--
-- Name: idx_habits_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_habits_user_id ON public.habits USING btree (user_id);


--
-- Name: idx_journal_entries_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_journal_entries_user ON public.journal_entries USING btree (user_id);


--
-- Name: idx_journal_mood_link; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_journal_mood_link ON public.journal_entries USING btree (mood_log_id);


--
-- Name: idx_meal_logs_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_meal_logs_user_date ON public.meal_logs USING btree (user_id, created_at);


--
-- Name: idx_milestones_goal_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_milestones_goal_id ON public.goal_milestones USING btree (goal_id);


--
-- Name: idx_mood_log_tags_log; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mood_log_tags_log ON public.mood_log_tags USING btree (mood_log_id);


--
-- Name: idx_mood_logs_logged_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mood_logs_logged_at ON public.mood_logs USING btree (logged_at);


--
-- Name: idx_mood_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mood_logs_user_id ON public.mood_logs USING btree (user_id);


--
-- Name: idx_tasks_due_reminder; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_due_reminder ON public.tasks USING btree (due_date, reminder_sent, is_completed) WHERE ((reminder_sent = false) AND (is_completed = false));


--
-- Name: notification_log_dedup_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX notification_log_dedup_idx ON public.notification_log USING btree (user_id, type, ref_id, ref_date);


--
-- Name: goals goals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: journal_entries journal_entries_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: device_tokens device_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: goal_milestones goal_milestones_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_milestones
    ADD CONSTRAINT goal_milestones_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: habit_logs habit_logs_habit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habit_logs
    ADD CONSTRAINT habit_logs_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;


--
-- Name: habits habits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habits
    ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: journal_entries journal_entries_mood_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_mood_log_id_fkey FOREIGN KEY (mood_log_id) REFERENCES public.mood_logs(id) ON DELETE SET NULL;


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: meal_logs meal_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_logs
    ADD CONSTRAINT meal_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mood_levels mood_levels_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_levels
    ADD CONSTRAINT mood_levels_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mood_log_tags mood_log_tags_mood_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_log_tags
    ADD CONSTRAINT mood_log_tags_mood_log_id_fkey FOREIGN KEY (mood_log_id) REFERENCES public.mood_logs(id) ON DELETE CASCADE;


--
-- Name: mood_log_tags mood_log_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_log_tags
    ADD CONSTRAINT mood_log_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: mood_log_tags mood_log_tags_user_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_log_tags
    ADD CONSTRAINT mood_log_tags_user_tag_id_fkey FOREIGN KEY (user_tag_id) REFERENCES public.user_tags(id) ON DELETE CASCADE;


--
-- Name: mood_logs mood_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mood_logs
    ADD CONSTRAINT mood_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_log notification_log_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_token_id_fkey FOREIGN KEY (token_id) REFERENCES public.device_tokens(id);


--
-- Name: notification_log notification_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_log
    ADD CONSTRAINT notification_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: saved_meals saved_meals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_meals
    ADD CONSTRAINT saved_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: supplements supplements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplements
    ADD CONSTRAINT supplements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_prompt_config user_prompt_config_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_prompt_config
    ADD CONSTRAINT user_prompt_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_tags user_tags_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tags
    ADD CONSTRAINT user_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_xp user_xp_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_xp
    ADD CONSTRAINT user_xp_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO marco;


--
-- Name: FUNCTION update_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at() TO marco;


--
-- Name: TABLE device_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.device_tokens TO marco;


--
-- Name: SEQUENCE device_tokens_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.device_tokens_id_seq TO marco;


--
-- Name: TABLE emoji_packs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.emoji_packs TO marco;


--
-- Name: SEQUENCE emoji_packs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.emoji_packs_id_seq TO marco;


--
-- Name: TABLE goal_milestones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.goal_milestones TO marco;


--
-- Name: SEQUENCE goal_milestones_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.goal_milestones_id_seq TO marco;


--
-- Name: TABLE goals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.goals TO marco;


--
-- Name: SEQUENCE goals_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.goals_id_seq TO marco;


--
-- Name: TABLE habit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.habit_logs TO marco;


--
-- Name: SEQUENCE habit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.habit_logs_id_seq TO marco;


--
-- Name: TABLE habits; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.habits TO marco;


--
-- Name: SEQUENCE habits_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.habits_id_seq TO marco;


--
-- Name: TABLE journal_entries; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.journal_entries TO marco;


--
-- Name: SEQUENCE journal_entries_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.journal_entries_id_seq TO marco;


--
-- Name: TABLE meal_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.meal_logs TO marco;


--
-- Name: SEQUENCE meal_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.meal_logs_id_seq TO marco;


--
-- Name: TABLE mood_levels; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mood_levels TO marco;


--
-- Name: SEQUENCE mood_levels_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.mood_levels_id_seq TO marco;


--
-- Name: TABLE mood_log_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mood_log_tags TO marco;


--
-- Name: SEQUENCE mood_log_tags_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.mood_log_tags_id_seq TO marco;


--
-- Name: TABLE mood_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.mood_logs TO marco;


--
-- Name: SEQUENCE mood_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.mood_logs_id_seq TO marco;


--
-- Name: TABLE notification_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_log TO marco;


--
-- Name: SEQUENCE notification_log_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.notification_log_id_seq TO marco;


--
-- Name: TABLE notification_preferences; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.notification_preferences TO marco;


--
-- Name: TABLE saved_meals; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.saved_meals TO marco;


--
-- Name: SEQUENCE saved_meals_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.saved_meals_id_seq TO marco;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sessions TO marco;


--
-- Name: TABLE supplements; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplements TO marco;


--
-- Name: SEQUENCE supplements_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.supplements_id_seq TO marco;


--
-- Name: TABLE tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tags TO marco;


--
-- Name: SEQUENCE tags_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tags_id_seq TO marco;


--
-- Name: TABLE tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tasks TO marco;


--
-- Name: SEQUENCE tasks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tasks_id_seq TO marco;


--
-- Name: TABLE user_prompt_config; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_prompt_config TO marco;


--
-- Name: SEQUENCE user_prompt_config_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_prompt_config_id_seq TO marco;


--
-- Name: TABLE user_tags; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_tags TO marco;


--
-- Name: SEQUENCE user_tags_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.user_tags_id_seq TO marco;


--
-- Name: TABLE user_xp; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_xp TO marco;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO marco;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO marco;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO marco;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO marco;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: marco
--

ALTER DEFAULT PRIVILEGES FOR ROLE marco IN SCHEMA public GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO marco;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO marco;


--
-- PostgreSQL database dump complete
--

\unrestrict q64QxEcDx4O5E2DwfSrtVrKAh7C3Yg0umwDYrbegdcIylJfqeCOBvex8TbEP1ei

