-- ==========================================
-- INITIALISATION DE LA BASE DE DONNEES QSE STUDIO
-- ==========================================

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

-- 1. CREATION DES ENUMS SI NON EXISTANTS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'qse', 'collaborateur');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nc_status') THEN
        CREATE TYPE public.nc_status AS ENUM (
            'draft', 
            'declared', 
            'analyzing', 
            'actions_open', 
            'verifying', 
            'closed'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_status') THEN
        CREATE TYPE public.action_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
        CREATE TYPE public.severity_level AS ENUM ('minor', 'major', 'critical');
    END IF;
END $$;

-- 2. CREATION DES TABLES

-- Table : Utilisateurs (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'collaborateur',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table : Fiches de Non-Conformité (non_conformities)
CREATE TABLE IF NOT EXISTS public.non_conformities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status public.nc_status NOT NULL DEFAULT 'draft',
    severity public.severity_level NOT NULL DEFAULT 'minor',
    reporter_id UUID NOT NULL REFERENCES public.users(id),
    qse_manager_id UUID REFERENCES public.users(id),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Analyse des causes (5 Pourquoi & Ishikawa)
    why_1 VARCHAR(255),
    why_2 VARCHAR(255),
    why_3 VARCHAR(255),
    why_4 VARCHAR(255),
    why_5 VARCHAR(255),
    root_cause TEXT,
    ishikawa_category VARCHAR(50), -- 'Matière', 'Matériel', 'Méthode', 'Main d''oeuvre', 'Milieu'
    effectiveness_proof TEXT      -- Preuve d'efficacité pour la clôture
);

-- Table : Actions Correctives et Préventives (capa_actions)
CREATE TABLE IF NOT EXISTS public.capa_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nc_id UUID NOT NULL REFERENCES public.non_conformities(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status public.action_status NOT NULL DEFAULT 'todo',
    assignee_id UUID NOT NULL REFERENCES public.users(id),
    due_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table : Journal d'Audit inaltérable (audit_log - Inspiré de SessionMetrics agentic-builder)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,    -- 'non_conformity', 'capa_action'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,         -- 'created', 'status_changed', 'assigned', 'field_updated'
    actor_id UUID NOT NULL REFERENCES public.users(id),
    previous_value JSONB,                -- snapshot avant modification
    new_value JSONB,                     -- snapshot après modification
    metadata JSONB,                      -- contexte (ex: guardrails appliqués, IP)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- PAS de updated_at : ce journal est IMMUTABLE
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_log(actor_id);

-- 3. SEED INITIAL DE DEMONSTRATION
INSERT INTO public.users (id, email, password_hash, first_name, last_name, role)
VALUES 
('d1a3b110-3882-411a-85d0-79883bfd12f1', 'admin@qse-studio.local', '$2b$10$wO/LzI8aL.qP97g1f3m9u.9pNuLhNf614v3x5kK.v52d3bfd12f1', 'Marc', 'QSE', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, email, password_hash, first_name, last_name, role)
VALUES 
('d1a3b110-3882-411a-85d0-79883bfd12f2', 'jean.dupond@qse-studio.local', '$2b$10$wO/LzI8aL.qP97g1f3m9u.9pNuLhNf614v3x5kK.v52d3bfd12f1', 'Jean', 'Dupond', 'collaborateur')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.users (id, email, password_hash, first_name, last_name, role)
VALUES 
('d1a3b110-3882-411a-85d0-79883bfd12f3', 'sophie.martin@qse-studio.local', '$2b$10$wO/LzI8aL.qP97g1f3m9u.9pNuLhNf614v3x5kK.v52d3bfd12f1', 'Sophie', 'Martin', 'collaborateur')
ON CONFLICT (email) DO NOTHING;

-- Non-Conformité 1 : Industrie (Presse plieuse) -> Statut ANALYZING
INSERT INTO public.non_conformities (id, title, description, status, severity, reporter_id, qse_manager_id, detected_at, why_1, why_2, why_3, why_4, why_5, root_cause, ishikawa_category)
VALUES
('a2c3b110-3882-411a-85d0-79883bfd22f1', 
 'Fuite d''huile hydraulique sur Presse Plieuse #4', 
 'Une fuite importante d''huile hydraulique a été détectée sous la presse plieuse n°4 lors de la prise de poste. Risque de glissade immédiat et baisse de pression sur la machine.', 
 'analyzing', 
 'major', 
 'd1a3b110-3882-411a-85d0-79883bfd12f2', -- Jean Dupond
 'd1a3b110-3882-411a-85d0-79883bfd12f1', -- Marc (Admin QSE)
 NOW() - INTERVAL '2 days',
 'Pourquoi l''huile est au sol ? Car le réservoir fuit.',
 'Pourquoi le réservoir fuit ? Car le joint du raccord est usé.',
 'Pourquoi le joint est usé ? Car il n''a pas été remplacé lors de la dernière maintenance.',
 'Pourquoi il n''a pas été remplacé ? Car la pièce n''était pas en stock.',
 'Pourquoi elle n''était pas en stock ? Car le processus de commande automatique des pièces critiques n''a pas fonctionné.',
 'Dysfonctionnement de l''alerte de réapprovisionnement des pièces de rechange critiques.',
 'Matériel')
ON CONFLICT (id) DO NOTHING;

-- Action liée à la NC 1
INSERT INTO public.capa_actions (id, nc_id, title, description, status, assignee_id, due_date)
VALUES
('b3d3b110-3882-411a-85d0-79883bfd33f1',
 'a2c3b110-3882-411a-85d0-79883bfd22f1',
 'Remplacement du joint et nettoyage de la zone',
 'Changer le joint du raccord hydraulique de la Presse Plieuse #4 et nettoyer minutieusement la flaque d''huile au sol avec de l''absorbant.',
 'todo',
 'd1a3b110-3882-411a-85d0-79883bfd12f2', -- Jean Dupond
 CURRENT_DATE + INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Non-Conformité 2 : BTP (Garde-corps) -> Statut DECLARED
INSERT INTO public.non_conformities (id, title, description, status, severity, reporter_id, qse_manager_id, detected_at)
VALUES
('a2c3b110-3882-411a-85d0-79883bfd22f2', 
 'Absence de garde-corps sur trémie au 2ème étage', 
 'Lors de l''inspection sécurité hebdomadaire du chantier Résidence Les Pins, il a été constaté qu''une trémie de passage de gaine technique au 2ème étage n''était pas protégée par un garde-corps.', 
 'declared', 
 'critical', 
 'd1a3b110-3882-411a-85d0-79883bfd12f3', -- Sophie Martin
 'd1a3b110-3882-411a-85d0-79883bfd12f1', -- Marc (Admin QSE)
 NOW() - INTERVAL '1 days')
ON CONFLICT (id) DO NOTHING;

-- Action liée à la NC 2
INSERT INTO public.capa_actions (id, nc_id, title, description, status, assignee_id, due_date)
VALUES
('b3d3b110-3882-411a-85d0-79883bfd33f2',
 'a2c3b110-3882-411a-85d0-79883bfd22f2',
 'Installation immédiate de protection collective',
 'Mettre en place un garde-corps temporaire réglementaire (lisse, sous-lisse, plinthe) ou obturer la trémie par un panneau fixé et balisé au sol.',
 'in_progress',
 'd1a3b110-3882-411a-85d0-79883bfd12f3', -- Sophie Martin
 CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;
