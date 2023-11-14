create type "public"."user_role" as enum ('PARTICIPANT', 'VOLUNTEER', 'ADMIN');

create table "public"."events" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "registration_start" timestamp without time zone,
    "registration_end" timestamp without time zone,
    "event_start" timestamp without time zone,
    "event_end" timestamp without time zone,
    "venue" text,
    "desc" text not null,
    "cover_image_url" text,
    "published" boolean not null default false,
    "owner" uuid not null default auth.uid(),
    "tags" text[] not null default '{}'::text[]
);


alter table "public"."events" enable row level security;

create table "public"."registrations" (
    "id" bigint generated by default as identity not null,
    "registered_at" timestamp with time zone not null default now(),
    "user_id" uuid not null default auth.uid(),
    "event_id" bigint not null
);


alter table "public"."registrations" enable row level security;

create table "public"."users" (
    "created_at" timestamp with time zone not null default now(),
    "full_name" text,
    "role" user_role not null default 'PARTICIPANT'::user_role,
    "id" uuid not null
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE UNIQUE INDEX registrations_pkey ON public.registrations USING btree (id);

CREATE UNIQUE INDEX unique_registrations ON public.registrations USING btree (user_id, event_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."registrations" add constraint "registrations_pkey" PRIMARY KEY using index "registrations_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."events" add constraint "events_owner_fkey" FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."events" validate constraint "events_owner_fkey";

alter table "public"."registrations" add constraint "registrations_event_id_fkey" FOREIGN KEY (event_id) REFERENCES events(id) not valid;

alter table "public"."registrations" validate constraint "registrations_event_id_fkey";

alter table "public"."registrations" add constraint "registrations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."registrations" validate constraint "registrations_user_id_fkey";

alter table "public"."registrations" add constraint "unique_registrations" UNIQUE using index "unique_registrations";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS user_role
 LANGUAGE plpgsql
AS $function$
DECLARE
    user_role public.user_role;
BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = user_id;

    IF user_role IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    RETURN user_role;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$function$
;

create policy "CRUD for admin"
on "public"."events"
as permissive
for all
to authenticated
using ((get_user_role(auth.uid()) = 'ADMIN'::user_role));


create policy "Read for all for published events"
on "public"."events"
as permissive
for select
to public
using ((published = true));


create policy "CRUD for admin"
on "public"."registrations"
as permissive
for all
to authenticated
using ((get_user_role(auth.uid()) = 'ADMIN'::user_role));


create policy "CRUD for user's own registrations"
on "public"."registrations"
as permissive
for all
to authenticated
using ((user_id = auth.uid()));


create policy "CRUD their own details except role"
on "public"."users"
as permissive
for all
to public
using ((auth.uid() = id))
with check (true);