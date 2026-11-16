-- Login próprio (Better Auth) no schema app_auth: substitui o Neon Auth (schema neon_auth) na ida para o Supabase.
-- Mesmas colunas do Neon Auth, para copiar usuários, senhas (scrypt) e sessões sem conversão.
-- O schema "auth" do Supabase é dele (Supabase Auth); por isso o nome app_auth.
CREATE SCHEMA IF NOT EXISTS "app_auth";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_auth"."user" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "emailVerified" boolean DEFAULT false NOT NULL,
  "image" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "role" text,
  "banned" boolean DEFAULT false,
  "banReason" text,
  "banExpires" timestamp with time zone,
  CONSTRAINT "app_auth_user_email_unique" UNIQUE ("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_auth"."session" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "token" text NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid NOT NULL REFERENCES "app_auth"."user"("id") ON DELETE CASCADE,
  "impersonatedBy" text,
  CONSTRAINT "app_auth_session_token_unique" UNIQUE ("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_auth"."account" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" uuid NOT NULL REFERENCES "app_auth"."user"("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp with time zone,
  "refreshTokenExpiresAt" timestamp with time zone,
  "scope" text,
  "password" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_auth"."verification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_auth_session_user_idx" ON "app_auth"."session" ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_auth_account_user_idx" ON "app_auth"."account" ("userId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "app_auth_verification_identifier_idx" ON "app_auth"."verification" ("identifier");
--> statement-breakpoint
-- Segurança no Supabase: a API pública (PostgREST, chave publicável) não enxerga nenhuma tabela.
-- O app conecta como "postgres" (ignora RLS); anon/authenticated ficam sem permissão e com RLS ligado em tudo.
-- Os blocos só agem onde esses papéis existem (no Neon não existem e nada muda).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename FROM pg_tables WHERE schemaname IN ('public', 'app_auth') LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON SCHEMA app_auth FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
  END IF;
END $$;
