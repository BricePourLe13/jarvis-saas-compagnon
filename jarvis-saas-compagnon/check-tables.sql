-- Vérification rapide des tables OpenAI Realtime
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE 'openai_realtime%'
ORDER BY table_name;
