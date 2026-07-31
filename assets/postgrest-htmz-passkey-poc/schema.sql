-- One-time domain creation for HTML responses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'text/html') THEN
        CREATE DOMAIN "text/html" AS text;
    END IF;
END$$;

-- Items Table
CREATE TABLE IF NOT EXISTS public.items (
    id SERIAL PRIMARY KEY,
    name text
);
GRANT SELECT ON TABLE public.items TO htmz;

-- List Items Fragment RPC
CREATE OR REPLACE FUNCTION public.list_items() RETURNS public."text/html"
    LANGUAGE sql AS $$
  SELECT string_agg('<li>' || name || '</li>', '') FROM items;
$$;
GRANT EXECUTE ON FUNCTION public.list_items() TO htmz;

-- Main Page Server RPC
CREATE OR REPLACE FUNCTION public.page() RETURNS public."text/html"
    LANGUAGE sql AS $$
  SELECT $html$<!doctype html>
<html>
<head><title>htmz POC</title></head>
<body style="font-family:sans-serif;padding:2rem">
  <h2>htmz + PostgREST POC</h2>
  <p>Click to load rows from Postgres:</p>
  <a href="/rpc/list_items#box" target="h" style="font-size:1.2rem">Load items</a>
  <ul id="box" style="margin-top:1rem"><li style="color:#999">(empty)</li></ul>
  <iframe name=h onload="setTimeout(function(){var h=contentWindow.location.hash;var t=h&&document.querySelector(h);if(t)t.innerHTML=contentDocument.body.innerHTML;},0)" style="display:none"></iframe>
</body>
</html>$html$;
$$;
GRANT EXECUTE ON FUNCTION public.page() TO htmz;
